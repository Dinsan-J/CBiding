const Auction = require('../models/Auction');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Bid = require('../models/Bid');
const PlayerAcquisition = require('../models/PlayerAcquisition');
const AuditLog = require('../models/AuditLog');

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
    const auction = await Auction.findById(auctionId);
    if (!auction || auction.status !== 'LIVE') {
      throw new Error('Auction is not live for bidding.');
    }

    if (!auction.currentLot?.playerId || auction.currentLot.playerId.toString() !== playerId.toString()) {
      throw new Error('This player is not the active lot on the auction floor.');
    }

    const team = await Team.findById(teamId);
    if (!team) {
      throw new Error('Bidding franchise not found.');
    }

    const player = await Player.findById(playerId);
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

    // Log Bid
    const bidRecord = await Bid.create({
      tenantId: auction.tenantId,
      auctionId: auction._id,
      playerId: player._id,
      teamId: team._id,
      amount: proposedBid,
      bidSequence: updatedAuction.currentLot.bidCount,
      placedByUserId: userId
    });

    return {
      auction: updatedAuction,
      bid: bidRecord,
      team,
      player
    };
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
    if (!playerId || !highestBidderTeamId || currentBid <= 0) {
      throw new Error('No winning bid present to hammer SOLD.');
    }

    const player = await Player.findById(playerId);
    const team = await Team.findById(highestBidderTeamId);

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

    // 4. Reset Auction Current Lot
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

    return {
      auction,
      player,
      team,
      acquisition
    };
  }

  /**
   * Finalize Lot: Hammer UNSOLD
   */
  static async hammerUnsold({ auctionId, userId }) {
    const auction = await Auction.findById(auctionId);
    if (!auction) throw new Error('Auction not found.');

    const { playerId } = auction.currentLot;
    if (!playerId) throw new Error('No active lot to mark unsold.');

    const player = await Player.findById(playerId);
    player.status = 'UNSOLD';
    player.reAuctionEligible = true;
    await player.save();

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

    await AuditLog.create({
      tenantId: auction.tenantId,
      actorUserId: userId,
      action: 'LOT_HAMMER_UNSOLD',
      entityType: 'Player',
      entityId: player._id,
      snapshotAfter: { status: 'UNSOLD' }
    });

    return { auction, player };
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

    auction.currentLot = {
      playerId: player._id,
      lotNumber: player.lotNumber || 1,
      currentBid: 0,
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
