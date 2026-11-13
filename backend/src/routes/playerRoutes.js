const express = require('express');
const router = express.Router();
const {
  getPlayersByAuction,
  createPlayer,
  updatePlayer,
  deletePlayer,
  publicSelfRegister,
  getRegistrations,
  reviewRegistration
} = require('../controllers/playerController');
const { protect } = require('../middlewares/auth');
const { enforceTenant } = require('../middlewares/tenantMiddleware');
const multer = require('multer');
const { importPlayers } = require('../controllers/playerImportController');
const importUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });

// Public endpoints
router.get('/auction/:auctionId', getPlayersByAuction);
router.post('/register/:slug', publicSelfRegister);

// Protected organiser endpoints
router.post('/', protect, enforceTenant, createPlayer);
router.post('/import', protect, enforceTenant, importUpload.single('file'), importPlayers);
router.put('/:id', protect, enforceTenant, updatePlayer);
router.delete('/:id', protect, enforceTenant, deletePlayer);
router.get('/registrations/:auctionId', protect, enforceTenant, getRegistrations);
router.put('/registrations/:id/review', protect, enforceTenant, reviewRegistration);

module.exports = router;
