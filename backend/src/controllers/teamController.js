const Team = require('../models/Team');
const Auction = require('../models/Auction');
const Player = require('../models/Player');

// @desc    Get all teams for an auction
// @route   GET /api/teams/auction/:auctionId
// @access  Public
exports.getTeamsByAuction = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    const teams = await Team.find({ auctionId });
    const players = await Player.find({ auctionId, status: 'SOLD' })
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

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    const purse = startingPurse || auction.startingPurse;

    const team = await Team.create({
      tenantId: auction.tenantId,
      auctionId,
      name,
      shortName: shortName.toUpperCase(),
      logoUrl: logoUrl || '',
      primaryColor: primaryColor || '#06B6D4',
      secondaryColor: secondaryColor || '#10B981',
      ownerName: ownerName || '',
      startingPurse: purse,
      totalSpent: 0,
      remainingPurse: purse,
      reservedPurse: auction.minSquadSize * auction.minBasePrice,
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
