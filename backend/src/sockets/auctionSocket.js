const Auction = require('../models/Auction');
const AuctionEngine = require('../services/AuctionEngine');

module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log(`[BidX Socket] Client connected: ${socket.id}`);

    // Join isolated auction room
    socket.on('join_auction', ({ auctionId }) => {
      if (!auctionId) return;
      const room = `auction_${auctionId}`;
      socket.join(room);
      console.log(`[BidX Socket] Client ${socket.id} joined ${room}`);
      socket.emit('joined_room', { room, timestamp: Date.now() });
    });

    // Leave room
    socket.on('leave_auction', ({ auctionId }) => {
      if (!auctionId) return;
      const room = `auction_${auctionId}`;
      socket.leave(room);
      console.log(`[BidX Socket] Client ${socket.id} left ${room}`);
    });

    // Real-time authoritative timer tick sync
    socket.on('request_timer_sync', async ({ auctionId }) => {
      try {
        const auction = await Auction.findById(auctionId).select('currentLot status timerSeconds');
        if (auction && auction.currentLot?.timerExpiresAt) {
          const remainingSeconds = Math.max(
            0,
            Math.floor((new Date(auction.currentLot.timerExpiresAt).getTime() - Date.now()) / 1000)
          );
          socket.emit('timer_sync', {
            remainingSeconds,
            isTimerRunning: auction.currentLot.isTimerRunning,
            serverTimestamp: Date.now()
          });
        }
      } catch (err) {
        console.error('[BidX Socket] Timer sync error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[BidX Socket] Client disconnected: ${socket.id}`);
    });
  });
};
