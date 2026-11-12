const express = require('express');
const router = express.Router();
const {
  getAuctions,
  getAuctionBySlug,
  createAuction,
  updateAuction,
  updateAuctionStatus,
  deleteAuction,
  getPublicAuctionBroadcast
} = require('../controllers/auctionController');
const { protect } = require('../middlewares/auth');
const { enforceTenant } = require('../middlewares/tenantMiddleware');

// Public spectator endpoints
router.get('/public/:slug', getPublicAuctionBroadcast);
router.get('/:slug', getAuctionBySlug);

// Protected organiser endpoints
router.use(protect);
router.use(enforceTenant);

router.route('/')
  .get(getAuctions)
  .post(createAuction);

router.route('/:id')
  .put(updateAuction)
  .delete(deleteAuction);

router.route('/:id/status')
  .put(updateAuctionStatus);

module.exports = router;
