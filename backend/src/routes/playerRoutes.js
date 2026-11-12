const express = require('express');
const router = express.Router();
const {
  getPlayersByAuction,
  createPlayer,
  publicSelfRegister,
  getRegistrations,
  reviewRegistration
} = require('../controllers/playerController');
const { protect } = require('../middlewares/auth');
const { enforceTenant } = require('../middlewares/tenantMiddleware');

// Public endpoints
router.get('/auction/:auctionId', getPlayersByAuction);
router.post('/register/:slug', publicSelfRegister);

// Protected organiser endpoints
router.post('/', protect, enforceTenant, createPlayer);
router.get('/registrations/:auctionId', protect, enforceTenant, getRegistrations);
router.put('/registrations/:id/review', protect, enforceTenant, reviewRegistration);

module.exports = router;
