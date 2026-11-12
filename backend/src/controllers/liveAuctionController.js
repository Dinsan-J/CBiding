const AuctionEngine = require('../services/AuctionEngine');
const Auction = require('../models/Auction');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Bid = require('../models/Bid');
const { resolveAuction } = require('../utils/resolveAuction');

// @desc    Select and bring player lot onto the auction floor
// @route   POST /api/live/:auctionId/select-lot
// @access  Private (Auctioneer / Organiser)
exports.selectLot = async (req, res, next) => {
  try {
    const { playerId } = req.body;
    const { auctionId } = req.params;

    const auction = await resolveAuction(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    const result = await AuctionEngine.selectLot({
      auctionId: auction._id,
      playerId,
      userId: req.user._id
    });

    // Notify connected Socket.IO room if socket dispatcher exists
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`auction_${auction._id}`).emit('lot_selected', {
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

    const auction = await resolveAuction(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    const result = await AuctionEngine.placeBid({
      auctionId: auction._id,
      playerId,
      teamId,
      userId: req.user._id,
      amount
    });

    // Broadcast Real-time Event
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`auction_${auction._id}`).emit('bid_placed', {
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

    const auction = await resolveAuction(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    const result = await AuctionEngine.hammerSold({
      auctionId: auction._id,
      userId: req.user._id
    });

    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`auction_${auction._id}`).emit('lot_sold', {
        player: result.player,
        team: result.team,
        acquisition: result.acquisition,
        auction: result.auction,
        nextPlayer: result.nextPlayer
      });

      if (result.nextPlayer) {
        io.to(`auction_${auction._id}`).emit('lot_selected', {
          player: result.nextPlayer,
          auction: result.auction
        });
      }
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

    const auction = await resolveAuction(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    const result = await AuctionEngine.hammerUnsold({
      auctionId: auction._id,
      userId: req.user._id
    });

    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`auction_${auction._id}`).emit('lot_unsold', {
        player: result.player,
        auction: result.auction,
        nextPlayer: result.nextPlayer
      });

      if (result.nextPlayer) {
        io.to(`auction_${auction._id}`).emit('lot_selected', {
          player: result.nextPlayer,
          auction: result.auction
        });
      }
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Undo last bid
// @route   POST /api/live/:auctionId/undo-bid
// @access  Private (Auctioneer / Organiser)
exports.undoBid = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    const auction = await resolveAuction(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    const result = await AuctionEngine.undoLastBid({
      auctionId: auction._id,
      userId: req.user._id
    });

    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`auction_${auction._id}`).emit('bid_undone', {
        auction: result.auction,
        undoneBid: result.undoneBid
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

    let auction = await resolveAuction(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    // Auto-advance if currently on stage player is already SOLD or empty
    if (auction.status === 'LIVE') {
      const currentLotPlayerId = auction.currentLot?.playerId;
      let needsAdvance = !currentLotPlayerId;
      if (currentLotPlayerId) {
        const checkPlayer = await Player.findById(currentLotPlayerId);
        if (!checkPlayer || checkPlayer.status === 'SOLD' || checkPlayer.status === 'RETAINED') {
          needsAdvance = true;
        }
      }
      if (needsAdvance) {
        await AuctionEngine.advanceToNextRandomLot(auction._id);
        auction = await resolveAuction(auctionId);
      }
    }

    await auction.populate('currentLot.playerId');
    await auction.populate('currentLot.highestBidderTeamId');

    const teams = await Team.find({ auctionId: auction._id });
    const queuedPlayers = await Player.find({ 
      auctionId: auction._id, 
      status: { $in: ['QUEUED', 'APPROVED', 'LIVE'] },
      isFixedPlayer: { $ne: true },
      winningTeamId: null
    }).sort({ lotNumber: 1 });
    const unsoldPlayers = await Player.find({ auctionId: auction._id, status: 'UNSOLD' }).sort({ lotNumber: 1 });
    const soldPlayers = await Player.find({ auctionId: auction._id, status: 'SOLD' })
      .populate('winningTeamId', 'name shortName logoUrl primaryColor')
      .sort({ soldAt: -1 });

    const recentBids = await Bid.find({ auctionId: auction._id })
      .sort({ timestamp: -1 })
      .limit(15)
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

// @desc    Select a random available player onto the live lot
// @route   POST /api/live/:auctionId/random-lot
// @access  Private (Auctioneer / Organiser)
exports.selectRandomLot = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const auction = await resolveAuction(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    const nextPlayer = await AuctionEngine.advanceToNextRandomLot(auction._id, auction.currentLot?.playerId);
    const updatedAuction = await Auction.findById(auction._id);

    if (req.app.get('io') && nextPlayer) {
      const io = req.app.get('io');
      io.to(`auction_${auction._id}`).emit('lot_selected', {
        auction: updatedAuction,
        player: nextPlayer
      });
    }

    res.status(200).json({
      success: true,
      data: {
        auction: updatedAuction,
        player: nextPlayer
      }
    });
  } catch (error) {
    next(error);
  }
};
