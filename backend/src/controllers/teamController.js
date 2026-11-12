const mongoose = require('mongoose');
const Team = require('../models/Team');
const Auction = require('../models/Auction');
const Player = require('../models/Player');
const { resolveAuction } = require('../utils/resolveAuction');

// @desc    Get all teams for an auction
// @route   GET /api/teams/auction/:auctionId
// @access  Public
exports.getTeamsByAuction = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const auction = await resolveAuction(auctionId);
    const targetId = auction ? auction._id : auctionId;

    const teams = await Team.find({ auctionId: targetId });
    const players = await Player.find({ auctionId: targetId, status: 'SOLD' })
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
