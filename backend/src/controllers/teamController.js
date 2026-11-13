const mongoose = require('mongoose');
const Team = require('../models/Team');
const Auction = require('../models/Auction');
const Player = require('../models/Player');
const PlayerAcquisition = require('../models/PlayerAcquisition');
const AuditLog = require('../models/AuditLog');
const { resolveAuction } = require('../utils/resolveAuction');

// @desc    Get all teams for an auction
// @route   GET /api/teams/auction/:auctionId
// @access  Public
exports.getTeamsByAuction = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const auction = await resolveAuction(auctionId);
    const targetId = auction ? auction._id : auctionId;

    const teams = await Team.find({ auctionId: targetId }).select('-ownerContact');
    const players = await Player.find({ auctionId: targetId, status: { $in: ['SOLD', 'RETAINED'] } })
      .select('-contactNumber -email');

    // Attach squad roster to each team
    const teamsWithSquad = teams.map(team => {
      const squad = players.filter(p => p.winningTeamId && p.winningTeamId.toString() === team._id.toString());
      return {
        ...team.toObject(),
        squad
      };
    });

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teamsWithSquad
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private (Organiser)
exports.createTeam = async (req, res, next) => {
  try {
    const { auctionId, name, shortName, startingPurse, logoUrl, primaryColor, secondaryColor, ownerName } = req.body;

    const auction = await resolveAuction(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    const purse = Number(startingPurse) || auction.startingPurse || 50000000;

    const team = await Team.create({
      tenantId: auction.tenantId,
      auctionId: auction._id,
      name,
      shortName: (shortName || name.slice(0, 3)).toUpperCase(),
      logoUrl: logoUrl || '',
      primaryColor: primaryColor || '#06B6D4',
      secondaryColor: secondaryColor || '#10B981',
      ownerName: ownerName || '',
      startingPurse: purse,
      totalSpent: 0,
      remainingPurse: purse,
      reservedPurse: (auction.minSquadSize || 15) * (auction.minBasePrice || 50000),
      squadCount: 0,
      overseasCount: 0
    });

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Organiser)
exports.updateTeam = async (req, res, next) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Organiser)
exports.deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    // Check if team has already acquired players
    const acquiredCount = await Player.countDocuments({ winningTeamId: team._id });
    if (acquiredCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete franchise that has already acquired ${acquiredCount} players.`
      });
    }

    await Team.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Team removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or assign a fixed/retained player to a team
// @route   POST /api/teams/:id/fixed-player
// @access  Private (Organiser)
exports.addFixedPlayer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      playerId, 
      retentionPrice = 0,
      fullName, 
      role, 
      battingStyle = 'RIGHT_HAND', 
      bowlingStyle = 'None',
      country = 'Sri Lanka', 
      isOverseas = false, 
      basePrice,
      photoUrl,
      stats
    } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team franchise not found' });
    }

    const auction = await Auction.findById(team.auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Associated auction not found' });
    }

    // 1. Check maximum squad capacity
    if (team.squadCount >= auction.maxSquadSize) {
      return res.status(400).json({
        success: false,
        error: `Franchise has reached maximum squad capacity of ${auction.maxSquadSize} players.`
      });
    }

    // Base/Fixed players can have 0 base price and 0 retention cost (Free squad allocation)
    const price = (retentionPrice !== undefined && retentionPrice !== null && retentionPrice !== '') 
      ? Math.max(0, Number(retentionPrice)) 
      : 0;

    // 2. Check remaining purse affordability (if price > 0)
    if (price > 0 && price > team.remainingPurse) {
      return res.status(400).json({
        success: false,
        error: `Retention cost (${price.toLocaleString()}) exceeds team remaining purse (${team.remainingPurse.toLocaleString()}).`
      });
    }

    // 3. Squad completion reserve protection (if price > 0)
    if (price > 0) {
      const slotsRemainingAfter = Math.max(0, auction.minSquadSize - (team.squadCount + 1));
      const requiredReserve = slotsRemainingAfter * (auction.minBasePrice || 50000);
      if (team.remainingPurse - price < requiredReserve) {
        return res.status(400).json({
          success: false,
          error: `Retention fee violates squad reserve protection. Must preserve at least ${requiredReserve.toLocaleString()} for remaining ${slotsRemainingAfter} squad spots.`
        });
      }
    }

    let targetPlayer;

    if (playerId) {
      // Assigning an existing player
      targetPlayer = await Player.findById(playerId);
      if (!targetPlayer) {
        return res.status(404).json({ success: false, error: 'Selected player not found' });
      }
      if (['SOLD', 'RETAINED'].includes(targetPlayer.status) && targetPlayer.winningTeamId) {
        return res.status(400).json({ success: false, error: 'Player is already acquired by another franchise.' });
      }
      if (targetPlayer.isOverseas && team.overseasCount >= auction.maxOverseas) {
        return res.status(400).json({
          success: false,
          error: `Overseas quota exceeded. Team already has ${team.overseasCount}/${auction.maxOverseas} overseas players.`
        });
      }

      targetPlayer.status = 'SOLD';
      targetPlayer.winningTeamId = team._id;
      targetPlayer.finalPrice = price;
      targetPlayer.isFixedPlayer = true;
      targetPlayer.retentionType = 'FIXED_RETENTION';
      targetPlayer.soldAt = new Date();
      await targetPlayer.save();
    } else {
      // Creating a new fixed player directly
      if (!fullName || !role) {
        return res.status(400).json({ success: false, error: 'Player full name and playing role are required.' });
      }
      if (isOverseas && team.overseasCount >= auction.maxOverseas) {
        return res.status(400).json({
          success: false,
          error: `Overseas quota exceeded. Team already has ${team.overseasCount}/${auction.maxOverseas} overseas players.`
        });
      }

      const count = await Player.countDocuments({ auctionId: team.auctionId });
      const playerBase = (basePrice !== undefined && basePrice !== null && basePrice !== '') 
        ? Math.max(0, Number(basePrice)) 
        : 0;

      targetPlayer = await Player.create({
        tenantId: team.tenantId,
        auctionId: team.auctionId,
        lotNumber: count + 1,
        fullName,
        photoUrl: photoUrl || '',
        role,
        battingStyle,
        bowlingStyle,
        isOverseas: Boolean(isOverseas),
        country: isOverseas ? (country || 'Overseas') : (country || 'Sri Lanka'),
        basePrice: playerBase,
        status: 'SOLD',
        isFixedPlayer: true,
        retentionType: 'FIXED_RETENTION',
        winningTeamId: team._id,
        finalPrice: price,
        soldAt: new Date(),
        stats: stats || {}
      });
    }

    // Update Team Ledger
    if (price > 0) {
      team.totalSpent = (team.totalSpent || 0) + price;
      team.remainingPurse = Math.max(0, team.remainingPurse - price);
    }
    team.squadCount = (team.squadCount || 0) + 1;
    if (targetPlayer.isOverseas) {
      team.overseasCount = (team.overseasCount || 0) + 1;
    }
    await team.save();

    // Create or update PlayerAcquisition
    await PlayerAcquisition.findOneAndUpdate(
      { playerId: targetPlayer._id },
      {
        tenantId: team.tenantId,
        auctionId: team.auctionId,
        playerId: targetPlayer._id,
        teamId: team._id,
        finalBidAmount: price,
        totalBidsOnLot: 1,
        acquisitionType: 'RETENTION_PRE_AUCTION',
        acquiredAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Audit Log
    await AuditLog.create({
      tenantId: team.tenantId,
      actorUserId: req.user?._id,
      action: 'FIXED_PLAYER_ASSIGNED',
      entityType: 'Player',
      entityId: targetPlayer._id,
      snapshotAfter: {
        playerId: targetPlayer._id,
        playerName: targetPlayer.fullName,
        teamId: team._id,
        teamName: team.name,
        retentionFee: price
      }
    });

    // Real-time broadcast
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`auction_${team.auctionId}`).emit('fixed_player_assigned', {
        player: targetPlayer,
        team
      });
      io.to(`auction_${team.auctionId}`).emit('lot_sold', {
        player: targetPlayer,
        team,
        acquisition: { finalBidAmount: price, acquisitionType: 'RETENTION_PRE_AUCTION' }
      });
    }

    res.status(200).json({
      success: true,
      message: `${targetPlayer.fullName} successfully assigned to ${team.name} as a fixed/retained player.`,
      data: {
        team,
        player: targetPlayer
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a fixed/retained player from a team
// @route   DELETE /api/teams/:id/fixed-player/:playerId
// @access  Private (Organiser)
exports.removeFixedPlayer = async (req, res, next) => {
  try {
    const { id, playerId } = req.params;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    if (String(player.winningTeamId) !== String(team._id)) {
      return res.status(400).json({ success: false, error: 'This player does not belong to this franchise.' });
    }

    const refundAmount = player.finalPrice || 0;

    // Revert team ledger
    team.remainingPurse += refundAmount;
    team.totalSpent = Math.max(0, team.totalSpent - refundAmount);
    team.squadCount = Math.max(0, team.squadCount - 1);
    if (player.isOverseas) {
      team.overseasCount = Math.max(0, team.overseasCount - 1);
    }
    await team.save();

    // Revert player status
    player.status = 'QUEUED';
    player.winningTeamId = null;
    player.finalPrice = 0;
    player.isFixedPlayer = false;
    player.retentionType = 'AUCTION';
    player.soldAt = null;
    await player.save();

    // Remove acquisition record
    await PlayerAcquisition.deleteOne({ playerId: player._id });

    // Audit Log
    await AuditLog.create({
      tenantId: team.tenantId,
      actorUserId: req.user?._id,
      action: 'FIXED_PLAYER_REMOVED',
      entityType: 'Player',
      entityId: player._id,
      snapshotAfter: {
        playerId: player._id,
        playerName: player.fullName,
        teamId: team._id,
        refundedPurse: refundAmount
      }
    });

    // Real-time broadcast
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`auction_${team.auctionId}`).emit('fixed_player_removed', {
        player,
        team
      });
    }

    res.status(200).json({
      success: true,
      message: `${player.fullName} removed from ${team.name} roster and returned to auction queue.`,
      data: {
        team,
        player
      }
    });
  } catch (error) {
    next(error);
  }
};
