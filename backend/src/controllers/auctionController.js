const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Tenant = require('../models/Tenant');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Bid = require('../models/Bid');
const { resolveAuction } = require('../utils/resolveAuction');

const resolvePublicTenant = async (tenantSlug) => {
  const configuredSlug = tenantSlug || process.env.PUBLIC_TENANT_SLUG;
  if (configuredSlug) return Tenant.findOne({ slug: configuredSlug, status: 'ACTIVE' });

  const selectedTenants = await Tenant.find({
    status: 'ACTIVE',
    activeAuctionId: { $exists: true, $ne: null }
  }).limit(2);
  if (selectedTenants.length === 1) return selectedTenants[0];
  if (selectedTenants.length > 1) return null;

  const activeTenants = await Tenant.find({ status: 'ACTIVE' }).limit(2);
  return activeTenants.length === 1 ? activeTenants[0] : null;
};

// @desc    Get all auctions for tenant
// @route   GET /api/auctions
// @access  Private (Organiser)
exports.getAuctions = async (req, res, next) => {
  try {
    let query = {};
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      if (req.headers['x-tenant-id']) {
        query.tenantId = req.headers['x-tenant-id'];
      }
    } else if (req.tenantId) {
      query.tenantId = req.tenantId;
    }

    const auctions = await Auction.find(query)
      .sort({ createdAt: -1 });
    const tenant = req.tenantId ? await Tenant.findById(req.tenantId).select('activeAuctionId') : null;

    res.status(200).json({
      success: true,
      count: auctions.length,
      activeAuctionId: tenant?.activeAuctionId || null,
      data: auctions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set the tenant-wide tournament used by the workspace and public home page
// @route   PUT /api/auctions/active
// @access  Private (Organiser)
exports.setActiveAuction = async (req, res, next) => {
  try {
    const { auctionId } = req.body;
    if (!auctionId || !mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ success: false, error: 'A valid tournament ID is required.' });
    }

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Tournament not found.' });
    }

    const tenantId = req.tenantId || (req.user?.role === 'SUPER_ADMIN' ? auction.tenantId : null);
    if (!tenantId || String(auction.tenantId) !== String(tenantId)) {
      return res.status(404).json({ success: false, error: 'Tournament not found for this workspace.' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Workspace not found.' });
    }

    tenant.activeAuctionId = auction._id;
    await tenant.save();

    res.status(200).json({
      success: true,
      data: { activeAuctionId: auction._id }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the selected public tournament for a tenant
// @route   GET /api/auctions/public/active
// @access  Public
exports.getPublicActiveAuction = async (req, res, next) => {
  try {
    const tenant = await resolvePublicTenant(req.query.tenant);

    if (!tenant?.activeAuctionId) {
      return res.status(404).json({ success: false, error: 'No public tournament has been selected.' });
    }

    const auction = await Auction.findOne({
      _id: tenant.activeAuctionId,
      tenantId: tenant._id
    }).select('_id slug title status type currency currencyNotation startingPurse minSquadSize maxSquadSize maxOverseasPlayers minBasePrice timerSeconds currentLot');

    if (!auction) {
      return res.status(404).json({ success: false, error: 'The selected tournament could not be found.' });
    }

    res.status(200).json({ success: true, data: auction });
  } catch (error) {
    next(error);
  }
};

// @desc    List public tournaments available for live viewing and history
// @route   GET /api/auctions/public/list
// @access  Public
exports.getPublicAuctions = async (req, res, next) => {
  try {
    const tenant = await resolvePublicTenant(req.query.tenant);
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Public tournament history is not configured for this workspace.' });
    }

    const auctions = await Auction.find({
      tenantId: tenant._id,
      status: { $ne: 'DRAFT' }
    })
      .select('_id slug title status type currency currencyNotation createdAt completedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: auctions.length, data: auctions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get auction by slug or id (Public or Private)
// @route   GET /api/auctions/:slug
// @access  Public
exports.getAuctionBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const auction = await resolveAuction(slug);

    if (!auction) {
      return res.status(404).json({
        success: false,
        error: `Auction '${slug}' not found.`
      });
    }

    await auction.populate({ path: 'currentLot.playerId', select: '-contactNumber -email' });
    await auction.populate({ path: 'currentLot.highestBidderTeamId', select: '-ownerContact' });

    res.status(200).json({
      success: true,
      data: auction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new auction
// @route   POST /api/auctions
// @access  Private (Organiser)
exports.createAuction = async (req, res, next) => {
  try {
    const { title, slug, type, currency, startingPurse, minSquadSize, maxSquadSize, minBasePrice, timerSeconds, bidIncrements } = req.body;

    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context is required to create an auction.' });
    }

    const generatedSlug = (slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    const isPoints = type === 'POINTS';
    const auction = await Auction.create({
      tenantId,
      title,
      slug: `${generatedSlug}-${Date.now().toString().slice(-4)}`,
      type: type || 'MONEY',
      currency: isPoints ? 'POINTS' : (currency || 'LKR'),
      currencyNotation: isPoints ? 'STANDARD' : undefined,
      startingPurse: startingPurse || (isPoints ? 100000 : 50000000),
      minSquadSize: minSquadSize || 15,
      maxSquadSize: maxSquadSize || 20,
      minBasePrice: minBasePrice || (isPoints ? 100 : 50000),
      timerSeconds: timerSeconds || 30,
      bidIncrements: bidIncrements || [
        { from: 0, to: 1000000, increment: 100000 },
        { from: 1000000, to: 5000000, increment: 250000 },
        { from: 5000000, to: 20000000, increment: 500000 },
        { from: 20000000, to: 100000000, increment: 1000000 }
      ],
      status: 'DRAFT'
    });

    res.status(201).json({
      success: true,
      data: auction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update auction details/rules
// @route   PUT /api/auctions/:id
// @access  Private (Organiser)
exports.updateAuction = async (req, res, next) => {
  try {
    const auction = await resolveAuction(req.params.id);

    if (!auction) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found or unauthorized.'
      });
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.tenantId;
    if (updates.type === 'POINTS') {
      updates.currency = 'POINTS';
      updates.currencyNotation = 'STANDARD';
    } else if (updates.type === 'MONEY' && updates.currency === 'POINTS') {
      updates.currency = 'LKR';
    }
    const updated = await Auction.findByIdAndUpdate(auction._id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change Auction Status (State Machine transition)
// @route   PUT /api/auctions/:id/status
// @access  Private (Organiser / Auctioneer)
exports.updateAuctionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['DRAFT', 'SCHEDULED', 'LIVE', 'PAUSED', 'COMPLETED'];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed values: ${allowed.join(', ')}`
      });
    }

    const auction = await resolveAuction(req.params.id);
    if (!auction) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found.'
      });
    }

    auction.status = status;
    if (status === 'LIVE' && !auction.actualStartTime) {
      auction.actualStartTime = new Date();
    }
    if (status === 'COMPLETED') {
      auction.completedAt = new Date();
    }

    await auction.save();

    res.status(200).json({
      success: true,
      data: auction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Public Broadcast Data (Masked)
// @route   GET /api/auctions/:slug/public
// @access  Public
exports.getPublicAuctionBroadcast = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const auction = await resolveAuction(slug);

    if (!auction) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found.'
      });
    }

    await auction.populate({
      path: 'currentLot.playerId',
      select: '-contactNumber -email'
    });
    await auction.populate('currentLot.highestBidderTeamId');

    const teams = await Team.find({ auctionId: auction._id }).sort({ totalSpent: -1 });
    const players = await Player.find({ auctionId: auction._id })
      .select('-contactNumber -email')
      .sort({ lotNumber: 1 });

    const recentBids = await Bid.find({ auctionId: auction._id })
      .sort({ timestamp: -1 })
      .limit(15)
      .populate('teamId', 'name shortName primaryColor logoUrl')
      .populate('playerId', 'fullName photoUrl role');

    res.status(200).json({
      success: true,
      data: {
        auction,
        teams,
        players,
        recentBids
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Auction
// @route   DELETE /api/auctions/:id
// @access  Private (Organiser / Super Admin)
exports.deleteAuction = async (req, res, next) => {
  try {
    const auction = await resolveAuction(req.params.id);
    if (!auction) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found.'
      });
    }

    if (auction.status === 'LIVE') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete a LIVE tournament auction. Complete or draft it first.'
      });
    }

    await Tenant.updateMany({ activeAuctionId: auction._id }, { $set: { activeAuctionId: null } });
    await Team.deleteMany({ auctionId: auction._id });
    await Player.deleteMany({ auctionId: auction._id });
    await auction.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

