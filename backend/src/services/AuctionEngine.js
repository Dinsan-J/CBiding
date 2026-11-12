const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Bid = require('../models/Bid');
const PlayerAcquisition = require('../models/PlayerAcquisition');
const AuditLog = require('../models/AuditLog');
const WhatsAppNotificationService = require('./WhatsAppNotificationService');

class AuctionEngine {
  /**
   * Calculate minimum bid increment based on tournament dynamic ladders
   */
  static calculateNextBid(currentBid, basePrice, bidIncrements) {
    if (!currentBid || currentBid === 0) {
      return basePrice;
    }

    if (!bidIncrements || bidIncrements.length === 0) {
      // Standard default ladder
      if (currentBid < 1000000) return currentBid + 100000;
      if (currentBid < 5000000) return currentBid + 250000;
      if (currentBid < 10000000) return currentBid + 500000;
      return currentBid + 1000000;
    }

    // Match configured bracket
    const bracket = bidIncrements.find(b => currentBid >= b.from && currentBid < b.to);
    const increment = bracket ? bracket.increment : (bidIncrements[bidIncrements.length - 1]?.increment || 100000);
    return currentBid + increment;
  }

  /**
   * Validate franchise budget and reserve fund protection
   * Formula: Remaining Purse - Bid >= (Min Squad Size - Current Squad Size - 1) * Min Base Price
   */
  static validateBiddingEligibility(team, auction, proposedBid) {
    // 1. Check max squad size
    if (team.squadCount >= auction.maxSquadSize) {
      return {
        eligible: false,
        reason: `Franchise squad limit reached (${team.squadCount}/${auction.maxSquadSize}).`
      };
    }

    // 2. Check remaining purse vs proposed bid
    if (proposedBid > team.remainingPurse) {
      return {
        eligible: false,
        reason: `Bid (${proposedBid.toLocaleString()}) exceeds remaining purse (${team.remainingPurse.toLocaleString()}).`
      };
    }

    // 3. Squad completion reserve protection
    const slotsRemaining = Math.max(0, auction.minSquadSize - team.squadCount - 1);
    const requiredReserve = slotsRemaining * auction.minBasePrice;
    const maxPermittedBid = team.remainingPurse - requiredReserve;

    if (proposedBid > maxPermittedBid) {
      return {
        eligible: false,
        reason: `Bid violates reserve fund protection. Must reserve at least ${requiredReserve.toLocaleString()} for remaining ${slotsRemaining} minimum squad slots.`
      };
    }

    return { eligible: true };
  }

  /**
   * Place an atomic bid with concurrency protection
   */
  static async placeBid({ auctionId, playerId, teamId, userId, amount }) {
    // Parallelize core queries for minimal network latency
    const [auction, team, player] = await Promise.all([
      Auction.findById(auctionId),
      Team.findById(teamId),
      Player.findById(playerId)
    ]);

    if (!auction || auction.status !== 'LIVE') {
      throw new Error('Auction is not live for bidding.');
    }

    if (!auction.currentLot?.playerId || auction.currentLot.playerId.toString() !== playerId.toString()) {
      throw new Error('This player is not the active lot on the auction floor.');
    }

    if (!team) {
      throw new Error('Bidding franchise not found.');
    }

    if (!player || player.status !== 'LIVE') {
      throw new Error('Player is not active on floor.');
    }

    // Check overseas limits
    if (player.isOverseas && team.overseasCount >= auction.maxOverseasPlayers) {
      throw new Error(`Franchise overseas player limit reached (${team.overseasCount}/${auction.maxOverseasPlayers}).`);
    }

    // Determine bid amount if not specified
    const currentBid = auction.currentLot.currentBid || 0;
    const proposedBid = amount || this.calculateNextBid(currentBid, player.basePrice, auction.bidIncrements);

    if (proposedBid <= currentBid) {
      throw new Error(`Bid amount must be greater than current bid (${currentBid.toLocaleString()}).`);
    }

    // Verify Reserve Fund Protection
    const eligibility = this.validateBiddingEligibility(team, auction, proposedBid);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    // Atomic update to prevent race conditions
    const updatedAuction = await Auction.findOneAndUpdate(
      {
        _id: auctionId,
        status: 'LIVE',
        'currentLot.playerId': playerId,
        'currentLot.currentBid': currentBid
      },
      {
        $set: {
          'currentLot.currentBid': proposedBid,
          'currentLot.highestBidderTeamId': teamId,
          'currentLot.timerExpiresAt': new Date(Date.now() + auction.timerSeconds * 1000),
          'currentLot.isTimerRunning': true
        },
        $inc: { 'currentLot.bidCount': 1 }
      },
      { new: true }
    ).populate('currentLot.highestBidderTeamId');

    if (!updatedAuction) {
      throw new Error('CONCURRENT_BID_CONFLICT: Another bid was placed at the same moment. Please retry.');
    }

    // Parallelize persistent logging
    const [bidRecord] = await Promise.all([
      Bid.create({
        tenantId: auction.tenantId,
        auctionId: auction._id,
        playerId: player._id,
        teamId: team._id,
        amount: proposedBid,
        bidSequence: updatedAuction.currentLot.bidCount,
        placedByUserId: userId
      }),
      AuditLog.create({
        tenantId: auction.tenantId,
        actorUserId: userId,
        action: 'BID_PLACED',
        entityType: 'Bid',
        entityId: new mongoose.Types.ObjectId(),
        snapshotAfter: { amount: proposedBid, teamId: team._id, playerId: player._id }
      })
    ]);

    return {
      auction: updatedAuction,
      bid: bidRecord,
      team,
      player
    };
  }

  /**
   * Helper: Automatically find and set the next random available player onto the live lot
   */
  static async advanceToNextRandomLot(auctionId, excludePlayerId = null) {
    const auction = await Auction.findById(auctionId);
    if (!auction) return null;

    // Find all un-auctioned/available players for this auction
    const query = {
      auctionId: auction._id,
      status: { $in: ['QUEUED', 'APPROVED', 'LIVE'] },
      isFixedPlayer: { $ne: true },
      winningTeamId: null
    };

    if (excludePlayerId) {
      query._id = { $ne: excludePlayerId };
    }

    let availablePlayers = await Player.find(query);
    if (availablePlayers.length === 0 && excludePlayerId) {
      delete query._id;
      availablePlayers = await Player.find(query);
    }

    if (availablePlayers.length > 0) {
      // Pick randomly as requested by user
      const randomIndex = Math.floor(Math.random() * availablePlayers.length);
      const nextPlayer = availablePlayers[randomIndex];

      // Mark next player as LIVE
      nextPlayer.status = 'LIVE';
      await nextPlayer.save();

      // Reset any other players that were accidentally left in LIVE status back to QUEUED
      await Player.updateMany(
        { auctionId: auction._id, _id: { $ne: nextPlayer._id }, status: 'LIVE', winningTeamId: null },
        { $set: { status: 'QUEUED' } }
      );

      auction.currentLot = {
        playerId: nextPlayer._id,
        lotNumber: nextPlayer.lotNumber || 1,
        currentBid: nextPlayer.basePrice || 0,
        highestBidderTeamId: null,
        bidCount: 0,
        timerExpiresAt: null,
        isTimerRunning: false
      };
      await auction.save();

      return nextPlayer;
    } else {
      // No remaining available players in the queue
      auction.currentLot = {
        playerId: null,
        lotNumber: 0,
        currentBid: 0,
        highestBidderTeamId: null,
        bidCount: 0,
        timerExpiresAt: null,
        isTimerRunning: false
      };
      await auction.save();

      return null;
    }
  }

  /**
   * Finalize Lot: Hammer SOLD
   */
  static async hammerSold({ auctionId, userId }) {
    const auction = await Auction.findById(auctionId);
    if (!auction || auction.status !== 'LIVE') {
      throw new Error('Auction is not live.');
    }

    const { playerId, currentBid, highestBidderTeamId } = auction.currentLot;
    if (!playerId) {
      throw new Error('No active player on stage to hammer SOLD.');
    }

    const player = await Player.findById(playerId);
    if (!player) {
      throw new Error('Player not found.');
    }

    let team = null;
    if (highestBidderTeamId) {
      team = await Team.findById(highestBidderTeamId);
    }

    // If no team placed a bid or current bid is 0, hammer as UNSOLD instead of getting stuck
    if (!team || !highestBidderTeamId || currentBid <= 0) {
      return await this.hammerUnsold({ auctionId, userId });
    }

    // 1. Update Player
    player.status = 'SOLD';
    player.winningTeamId = team._id;
    player.finalPrice = currentBid;
    player.soldAt = new Date();
    await player.save();

    // 2. Update Team Ledger
    team.totalSpent += currentBid;
    team.remainingPurse -= currentBid;
    team.squadCount += 1;
    if (player.isOverseas) {
      team.overseasCount += 1;
    }
    // Recompute reserved purse
    const slotsRemaining = Math.max(0, auction.minSquadSize - team.squadCount);
    team.reservedPurse = slotsRemaining * auction.minBasePrice;
    await team.save();

    // 3. Create Acquisition Record
    const acquisition = await PlayerAcquisition.create({
      tenantId: auction.tenantId,
      auctionId: auction._id,
      playerId: player._id,
      teamId: team._id,
      finalBidAmount: currentBid,
      totalBidsOnLot: auction.currentLot.bidCount
    });

    // 4. Trigger Transactional WhatsApp Alert (non-blocking)
    WhatsAppNotificationService.sendAcquisitionAlert({
      player,
      team,
      acquisition,
      auction
    }).catch(err => console.error('[AuctionEngine] WhatsApp notification non-blocking error:', err.message));

    // 5. Immutably record in AuditLog
    await AuditLog.create({
      tenantId: auction.tenantId,
      actorUserId: userId,
      action: 'LOT_HAMMER_SOLD',
      entityType: 'Player',
      entityId: player._id,
      snapshotAfter: {
        playerId: player._id,
        teamId: team._id,
        amount: currentBid,
        totalSpent: team.totalSpent,
        remainingPurse: team.remainingPurse
      }
    });

    // 6. IMMEDIATELY ADVANCE TO NEXT RANDOM AVAILABLE LOT
    const nextPlayer = await this.advanceToNextRandomLot(auction._id, player._id);
    const updatedAuction = await Auction.findById(auction._id);

    return {
      auction: updatedAuction,
      player,
      team,
      acquisition,
      nextPlayer
    };
  }

  /**
   * Undo Last Bid on active lot
   */
  static async undoLastBid({ auctionId, userId }) {
    const auction = await Auction.findById(auctionId);
    if (!auction || auction.status !== 'LIVE') throw new Error('Auction is not live.');

    const { playerId } = auction.currentLot;
    if (!playerId) throw new Error('No active lot on floor.');

    const latestBid = await Bid.findOne({ auctionId, playerId }).sort({ timestamp: -1 });
    if (!latestBid) throw new Error('No bids placed on this lot to undo.');

    // Remove latest bid
    await Bid.findByIdAndDelete(latestBid._id);

    // Find previous bid
    const previousBid = await Bid.findOne({ auctionId, playerId }).sort({ timestamp: -1 });

    const player = await Player.findById(playerId);

    if (previousBid) {
      auction.currentLot.currentBid = previousBid.amount;
      auction.currentLot.highestBidderTeamId = previousBid.teamId;
      auction.currentLot.bidCount = Math.max(0, auction.currentLot.bidCount - 1);
    } else {
      auction.currentLot.currentBid = 0;
      auction.currentLot.highestBidderTeamId = null;
      auction.currentLot.bidCount = 0;
    }

    await auction.save();
    await auction.populate('currentLot.highestBidderTeamId');

    await AuditLog.create({
      tenantId: auction.tenantId,
      actorUserId: userId,
      action: 'BID_REVERSED',
      entityType: 'Bid',
      entityId: latestBid._id,
      snapshotBefore: { amount: latestBid.amount, teamId: latestBid.teamId },
      snapshotAfter: { currentBid: auction.currentLot.currentBid }
    });

    return { auction, player, undoneBid: latestBid };
  }

  /**
   * Finalize Lot: Hammer UNSOLD
   */
  static async hammerUnsold({ auctionId, userId }) {
    const auction = await Auction.findById(auctionId);
    if (!auction) throw new Error('Auction not found.');

    const { playerId } = auction.currentLot;
    let player = null;

    if (playerId) {
      player = await Player.findById(playerId);
      if (player) {
        player.status = 'UNSOLD';
        player.reAuctionEligible = true;
        await player.save();

        await AuditLog.create({
          tenantId: auction.tenantId,
          actorUserId: userId,
          action: 'LOT_HAMMER_UNSOLD',
          entityType: 'Player',
          entityId: player._id,
          snapshotAfter: { status: 'UNSOLD' }
        });
      }
    }

    // IMMEDIATELY ADVANCE TO NEXT RANDOM AVAILABLE LOT
    const nextPlayer = await this.advanceToNextRandomLot(auction._id, player ? player._id : null);
    const updatedAuction = await Auction.findById(auction._id);

    return {
      auction: updatedAuction,
      player,
      nextPlayer
    };
  }

  /**
   * Select and Present Next Lot on Stage
   */
  static async selectLot({ auctionId, playerId, userId }) {
    const auction = await Auction.findById(auctionId);
    if (!auction) throw new Error('Auction not found.');

    const player = await Player.findById(playerId);
    if (!player) throw new Error('Player not found.');

    player.status = 'LIVE';
    await player.save();

    // Reset any other players that were accidentally left in LIVE status back to QUEUED
    await Player.updateMany(
      { auctionId: auction._id, _id: { $ne: player._id }, status: 'LIVE', winningTeamId: null },
      { $set: { status: 'QUEUED' } }
    );

    auction.currentLot = {
      playerId: player._id,
      lotNumber: player.lotNumber || 1,
      currentBid: player.basePrice || 0,
      highestBidderTeamId: null,
      bidCount: 0,
      timerExpiresAt: null,
      isTimerRunning: false
    };
    await auction.save();

    await AuditLog.create({
      tenantId: auction.tenantId,
      actorUserId: userId,
      action: 'LOT_SELECTED',
      entityType: 'Player',
      entityId: player._id,
      snapshotAfter: { lotNumber: player.lotNumber }
    });

    return { auction, player };
  }
}

module.exports = AuctionEngine;
