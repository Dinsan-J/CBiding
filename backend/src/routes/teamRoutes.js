const express = require('express');
const router = express.Router();
const { getTeamsByAuction, createTeam, updateTeam, deleteTeam } = require('../controllers/teamController');
const { protect } = require('../middlewares/auth');
const { enforceTenant } = require('../middlewares/tenantMiddleware');

// Public route to view team rosters
router.get('/auction/:auctionId', getTeamsByAuction);

// Protected organiser management
router.post('/', protect, enforceTenant, createTeam);
router.put('/:id', protect, enforceTenant, updateTeam);
router.delete('/:id', protect, enforceTenant, deleteTeam);

module.exports = router;
