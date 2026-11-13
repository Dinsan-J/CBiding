const XLSX = require('xlsx');
const Auction = require('../models/Auction');
const Player = require('../models/Player');

const normalize = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const get = (row, ...names) => {
  for (const name of names) {
    const key = Object.keys(row).find(candidate => normalize(candidate) === normalize(name));
    if (key && row[key] !== '') return row[key];
  }
  return undefined;
};
const truthy = value => ['true', 'yes', '1', 'overseas'].includes(String(value || '').trim().toLowerCase());

exports.importPlayers = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Choose a CSV or Excel file.' });
    const auction = await Auction.findOne({
      _id: req.body.auctionId,
      ...(req.user.role === 'SUPER_ADMIN' ? {} : { tenantId: req.tenantId })
    });
    if (!auction) return res.status(404).json({ success: false, error: 'Auction not found.' });

    let workbook;
    try {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false });
    } catch {
      return res.status(400).json({ success: false, error: 'The file could not be read. Upload a valid CSV or Excel workbook.' });
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows.length) return res.status(400).json({ success: false, error: 'The first sheet has no player rows.' });
    if (rows.length > 500) return res.status(413).json({ success: false, error: 'Import up to 500 players per file.' });

    const roleAliases = {
      'TOP ORDER BATTER': 'TOP_ORDER_BATTER', 'MIDDLE ORDER BATTER': 'MIDDLE_ORDER_BATTER',
      'WICKETKEEPER BATTER': 'WICKETKEEPER_BATTER', 'PACE ALL ROUNDER': 'PACE_ALL_ROUNDER',
      'SPIN ALL ROUNDER': 'SPIN_ALL_ROUNDER', 'FAST BOWLER': 'FAST_BOWLER', 'SPIN BOWLER': 'SPIN_BOWLER'
    };
    const validRoles = new Set(Object.values(roleAliases));
    const validCategories = new Set(['MARQUEE', 'CATEGORY_A', 'CATEGORY_B', 'CATEGORY_C', 'EMERGING']);
    const errors = [];
    const docs = [];
    const lotStart = await Player.countDocuments({ auctionId: auction._id });

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const fullName = String(get(row, 'fullName', 'playerName', 'name') || '').trim();
      const rawRole = String(get(row, 'role', 'playingRole') || 'TOP_ORDER_BATTER').trim().toUpperCase().replace(/[_-]+/g, ' ');
      const role = roleAliases[rawRole] || rawRole.replace(/\s+/g, '_');
      const rawCategory = String(get(row, 'category', 'tier') || 'CATEGORY_A').trim().toUpperCase().replace(/\s+/g, '_');
      const category = validCategories.has(rawCategory) ? rawCategory : 'CATEGORY_A';
      const age = Number(get(row, 'age')) || 25;
      const priceValue = get(row, 'basePrice', 'basePriceLkr', 'basePricePoints');
      const basePrice = priceValue === undefined ? auction.minBasePrice : Number(priceValue);
      if (!fullName) errors.push({ row: rowNumber, error: 'Full Name is required.' });
      else if (!validRoles.has(role)) errors.push({ row: rowNumber, error: `Unknown role "${role}".` });
      else if (!Number.isFinite(basePrice) || basePrice < 0) errors.push({ row: rowNumber, error: 'Base Price must be a non-negative number.' });
      else docs.push({
        tenantId: auction.tenantId,
        auctionId: auction._id,
        lotNumber: lotStart + docs.length + 1,
        fullName,
        role,
        battingStyle: String(get(row, 'battingStyle') || 'RIGHT_HAND').toUpperCase().replace(/\s+/g, '_'),
        bowlingStyle: String(get(row, 'bowlingStyle') || 'None'),
        age,
        category,
        basePrice,
        isOverseas: truthy(get(row, 'isOverseas', 'overseas')),
        country: String(get(row, 'country') || 'Sri Lanka'),
        photoUrl: String(get(row, 'photoUrl', 'photo', 'imageUrl') || ''),
        stats: {
          matches: Number(get(row, 'matches')) || 0,
          runs: Number(get(row, 'runs')) || 0,
          wickets: Number(get(row, 'wickets')) || 0
        },
        status: 'QUEUED'
      });
    });

    if (!docs.length) return res.status(400).json({ success: false, error: 'No valid player rows found.', data: { errors } });
    const players = await Player.insertMany(docs, { ordered: false });
    res.status(errors.length ? 207 : 201).json({
      success: true,
      message: `Imported ${players.length} players${errors.length ? `; skipped ${errors.length} invalid rows` : ''}.`,
      data: { players, imported: players.length, errors }
    });
  } catch (error) {
    next(error);
  }
};
