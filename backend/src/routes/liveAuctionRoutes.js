const express = require('express');
const router = express.Router();
const {
  selectLot,
  placeBid,
  hammerSold,
  hammerUnsold,
  undoBid,
  getLiveAuctionState
} = require('../controllers/liveAuctionController');
const { protect } = require('../middlewares/auth');

// Public read of live authoritative state
router.get('/:auctionId/state', getLiveAuctionState);

// Protected operator actions
router.post('/:auctionId/select-lot', protect, selectLot);
router.post('/:auctionId/bid', protect, placeBid);
router.post('/:auctionId/sold', protect, hammerSold);
router.post('/:auctionId/unsold', protect, hammerUnsold);
router.post('/:auctionId/undo-bid', protect, undoBid);

module.exports = router;
