const mongoose = require('mongoose');
const Player = require('../models/Player');
const PlayerRegistration = require('../models/PlayerRegistration');
const Auction = require('../models/Auction');
const AuditLog = require('../models/AuditLog');

// @desc    Get all players for an auction with filters
// @route   GET /api/players/auction/:auctionId
// @access  Public
exports.getPlayersByAuction = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const { status, role, category, search } = req.query;

    let targetAuctionId = auctionId;
    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      const foundAuction = await Auction.findOne({ slug: auctionId });
      if (foundAuction) {
        targetAuctionId = foundAuction._id;
      }
    }

    let query = { auctionId: targetAuctionId };

    if (status && status !== 'ALL') {
      if (status === 'QUEUED') {
        query.status = { $in: ['QUEUED', 'LIVE'] };
      } else {
        query.status = status;
      }
    }

    if (role && role !== 'ALL') {
      query.role = role;
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (search) {
      query.fullName = { $regex: search, $options: 'i' };
    }

    const players = await Player.find(query)
      .select('-contactNumber -email')
      .populate('winningTeamId', 'name shortName logoUrl primaryColor')
      .sort({ lotNumber: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a player directly to auction roster
// @route   POST /api/players
// @access  Private (Organiser)
exports.createPlayer = async (req, res, next) => {
  try {
    const { auctionId, fullName, role, battingStyle, bowlingStyle, basePrice, category, lotNumber, stats, photoUrl, isOverseas, country, age } = req.body;

    let auction = null;
    if (auctionId && mongoose.Types.ObjectId.isValid(auctionId)) {
      auction = await Auction.findById(auctionId);
    }
    if (!auction && auctionId) {
      auction = await Auction.findOne({ slug: auctionId });
    }
    if (!auction) {
      auction = await Auction.findOne();
    }

    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    const count = await Player.countDocuments({ auctionId: auction._id });

    const player = await Player.create({
      tenantId: auction.tenantId,
      auctionId: auction._id,
      lotNumber: lotNumber || count + 1,
      fullName,
      photoUrl: photoUrl || '',
      role: role || 'TOP_ORDER_BATTER',
      battingStyle: battingStyle || 'RIGHT_HAND',
      bowlingStyle: bowlingStyle || 'None',
      isOverseas: Boolean(isOverseas),
      country: country || 'Sri Lanka',
      age: age || 25,
      category: category || 'CATEGORY_A',
      basePrice: basePrice || auction.minBasePrice || 1000000,
      stats: stats || {},
      status: 'QUEUED'
    });

    res.status(201).json({
      success: true,
      data: player
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Public player self-registration
// @route   POST /api/players/register/:slug
// @access  Public
exports.publicSelfRegister = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let auction = null;
    if (mongoose.Types.ObjectId.isValid(slug)) {
      auction = await Auction.findById(slug);
    }
    if (!auction) {
      auction = await Auction.findOne({ slug });
    }
    if (!auction) {
      auction = await Auction.findOne(); // default fallback
    }

    if (!auction) {
      return res.status(404).json({ success: false, error: 'Tournament registration link invalid or expired.' });
    }

    const { fullName, contactNumber, email, age, city, role, battingStyle, bowlingStyle, experienceLevel, stats, photoUrl } = req.body;

    // Check duplicate
    const existing = await PlayerRegistration.findOne({
      auctionId: auction._id,
      contactNumber
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'A registration has already been submitted with this contact number.'
      });
    }

    const registration = await PlayerRegistration.create({
      tenantId: auction.tenantId,
      auctionId: auction._id,
      fullName,
      contactNumber,
      email: email || '',
      age: age || 22,
      city: city || 'Colombo',
      photoUrl: photoUrl || '',
      role: role || 'TOP_ORDER_BATTER',
      battingStyle: battingStyle || 'RIGHT_HAND',
      bowlingStyle: bowlingStyle || 'Right-arm medium',
      experienceLevel: experienceLevel || 'Domestic Club',
      stats: stats || {},
      status: 'PENDING'
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. The tournament committee will review your application.',
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending registrations for organiser review
// @route   GET /api/players/registrations/:auctionId
// @access  Private (Organiser)
exports.getRegistrations = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    let query = {};

    if (auctionId && auctionId !== 'all') {
      if (mongoose.Types.ObjectId.isValid(auctionId)) {
        query.auctionId = auctionId;
      } else {
        const auction = await Auction.findOne({ slug: auctionId });
        if (auction) {
          query.auctionId = auction._id;
        }
      }
    }

    const registrations = await PlayerRegistration.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject registration
// @route   PUT /api/players/registrations/:id/review
// @access  Private (Organiser)
exports.reviewRegistration = async (req, res, next) => {
  try {
    const { status, assignedCategory, assignedBasePrice, rejectionReason } = req.body;

    const registration = await PlayerRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ success: false, error: 'Registration not found' });
    }

    registration.status = status;
    registration.reviewedAt = new Date();

    if (status === 'APPROVED') {
      registration.assignedCategory = assignedCategory || 'CATEGORY_A';
      registration.assignedBasePrice = assignedBasePrice || 100000;
      await registration.save();

      // Automatically promote to auction Player lot
      const count = await Player.countDocuments({ auctionId: registration.auctionId });

      const newPlayer = await Player.create({
        tenantId: registration.tenantId,
        auctionId: registration.auctionId,
        registrationId: registration._id,
        lotNumber: count + 1,
        fullName: registration.fullName,
        photoUrl: registration.photoUrl,
        role: registration.role,
        battingStyle: registration.battingStyle,
        bowlingStyle: registration.bowlingStyle,
        category: registration.assignedCategory,
        basePrice: registration.assignedBasePrice,
        stats: registration.stats,
        contactNumber: registration.contactNumber,
        email: registration.email,
        status: 'QUEUED'
      });

      return res.status(200).json({
        success: true,
        data: {
          registration,
          player: newPlayer
        }
      });
    } else {
      registration.rejectionReason = rejectionReason || 'Application rejected by committee.';
      await registration.save();

      return res.status(200).json({
        success: true,
        data: registration
      });
    }
  } catch (error) {
    next(error);
  }
};
