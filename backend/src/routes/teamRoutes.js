const express = require('express');
const router = express.Router();
const { 
  getTeamsByAuction, 
  createTeam, 
  updateTeam, 
  deleteTeam,
  addFixedPlayer,
  removeFixedPlayer
} = require('../controllers/teamController');
const { protect } = require('../middlewares/auth');
const { enforceTenant } = require('../middlewares/tenantMiddleware');

// Public route to view team rosters
router.get('/auction/:auctionId', getTeamsByAuction);

// Protected organiser management
router.post('/', protect, enforceTenant, createTeam);
router.put('/:id', protect, enforceTenant, updateTeam);
router.delete('/:id', protect, enforceTenant, deleteTeam);

// Fixed / Retained player assignments
router.post('/:id/fixed-player', protect, enforceTenant, addFixedPlayer);
router.delete('/:id/fixed-player/:playerId', protect, enforceTenant, removeFixedPlayer);

module.exports = router;
