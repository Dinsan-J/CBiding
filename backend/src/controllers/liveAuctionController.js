const AuctionEngine = require('../services/AuctionEngine');
const Auction = require('../models/Auction');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Bid = require('../models/Bid');

// @desc    Select and bring player lot onto the auction floor
// @route   POST /api/live/:auctionId/select-lot
// @access  Private (Auctioneer / Organiser)
exports.selectLot = async (req, res, next) => {
  try {
    const { playerId } = req.body;
    const { auctionId } = req.params;

    const result = await AuctionEngine.selectLot({
      auctionId,
      playerId,
      userId: req.user._id
    });

    // Notify connected Socket.IO room if socket dispatcher exists
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`auction_${auctionId}`).emit('lot_selected', {
        auction: result.auction,
        player: result.player
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Place a bid on the live floor
// @route   POST /api/live/:auctionId/bid
// @access  Private (Auctioneer / Organiser)
exports.placeBid = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const { playerId, teamId, amount } = req.body;

    const result = await AuctionEngine.placeBid({
      auctionId,
      playerId,
      teamId,
      userId: req.user._id,
      amount
    });

    // Broadcast Real-time Event
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`auction_${auctionId}`).emit('bid_placed', {
        auction: result.auction,
        bid: result.bid,
        team: result.team,
        player: result.player
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Hammer lot as SOLD
// @route   POST /api/live/:auctionId/sold
// @access  Private (Auctioneer / Organiser)
exports.hammerSold = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    const result = await AuctionEngine.hammerSold({
      auctionId,
      userId: req.user._id
    });

    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`auction_${auctionId}`).emit('lot_sold', {
        player: result.player,
        team: result.team,
        acquisition: result.acquisition,
        auction: result.auction
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Hammer lot as UNSOLD
// @route   POST /api/live/:auctionId/unsold
// @access  Private (Auctioneer / Organiser)
exports.hammerUnsold = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    const result = await AuctionEngine.hammerUnsold({
      auctionId,
      userId: req.user._id
    });

    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`auction_${auctionId}`).emit('lot_unsold', {
        player: result.player,
        auction: result.auction
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current Authoritative State for an Auction
// @route   GET /api/live/:auctionId/state
// @access  Public
exports.getLiveAuctionState = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    const auction = await Auction.findById(auctionId)
      .populate('currentLot.playerId')
      .populate('currentLot.highestBidderTeamId');

    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    const teams = await Team.find({ auctionId });
    const queuedPlayers = await Player.find({ auctionId, status: { $in: ['QUEUED', 'LIVE'] } }).sort({ lotNumber: 1 });
    const unsoldPlayers = await Player.find({ auctionId, status: 'UNSOLD' }).sort({ lotNumber: 1 });
    const soldPlayers = await Player.find({ auctionId, status: 'SOLD' })
      .populate('winningTeamId', 'name shortName logoUrl primaryColor')
      .sort({ soldAt: -1 });

    const recentBids = await Bid.find({ auctionId })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('teamId', 'name shortName logoUrl primaryColor')
      .populate('playerId', 'fullName photoUrl');

    res.status(200).json({
      success: true,
      data: {
        auction,
        teams,
        queuedPlayers,
        unsoldPlayers,
        soldPlayers,
        recentBids
      }
    });
  } catch (error) {
    next(error);
  }
};
