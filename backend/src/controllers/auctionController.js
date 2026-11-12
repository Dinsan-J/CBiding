const Auction = require('../models/Auction');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Bid = require('../models/Bid');

// @desc    Get all auctions for tenant
// @route   GET /api/auctions
// @access  Private (Organiser)
exports.getAuctions = async (req, res, next) => {
  try {
    const auctions = await Auction.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: auctions.length,
      data: auctions
    });
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

    const auction = await Auction.findOne({
      $or: [{ slug: slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null }]
    }).populate('currentLot.playerId').populate('currentLot.highestBidderTeamId');

    if (!auction) {
      return res.status(404).json({
        success: false,
        error: `Auction '${slug}' not found.`
      });
    }

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

    const generatedSlug = (slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    const auction = await Auction.create({
      tenantId: req.tenantId,
      title,
      slug: generatedSlug,
      type: type || 'MONEY',
      currency: currency || 'LKR',
      startingPurse: startingPurse || 50000000,
      minSquadSize: minSquadSize || 15,
      maxSquadSize: maxSquadSize || 20,
      minBasePrice: minBasePrice || 50000,
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
    let auction = await Auction.findOne({ _id: req.params.id, tenantId: req.tenantId });

    if (!auction) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found or unauthorized.'
      });
    }

    auction = await Auction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: auction
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

    const auction = await Auction.findOne({ _id: req.params.id, tenantId: req.tenantId });
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

    const auction = await Auction.findOne({ slug })
      .populate({
        path: 'currentLot.playerId',
        select: '-contactNumber -email'
      })
      .populate('currentLot.highestBidderTeamId');

    if (!auction) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found.'
      });
    }

    const teams = await Team.find({ auctionId: auction._id }).sort({ totalSpent: -1 });
    const players = await Player.find({ auctionId: auction._id })
      .select('-contactNumber -email')
      .sort({ lotNumber: 1 });

    const recentBids = await Bid.find({ auctionId: auction._id })
      .sort({ timestamp: -1 })
      .limit(10)
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
