const express = require('express');
const router = express.Router();
const { getTeamsByAuction, createTeam, updateTeam } = require('../controllers/teamController');
const { protect } = require('../middlewares/auth');
const { enforceTenant } = require('../middlewares/tenantMiddleware');

// Public route to view team rosters
router.get('/auction/:auctionId', getTeamsByAuction);

// Protected organiser management
router.post('/', protect, enforceTenant, createTeam);
router.put('/:id', protect, enforceTenant, updateTeam);

module.exports = router;
