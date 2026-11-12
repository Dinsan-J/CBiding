import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://bidx-backend-gepi.onrender.com';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log(`[BidX Socket] Connected to live engine: ${socket.id}`);
    });

    socket.on('connect_error', (err) => {
      console.warn('[BidX Socket] Connection error:', err.message);
    });
  }

  return socket;
};

export const joinAuctionRoom = (auctionId) => {
  const s = getSocket();
  if (s && auctionId) {
    s.emit('join_auction', { auctionId });
  }
};

export const leaveAuctionRoom = (auctionId) => {
  const s = getSocket();
  if (s && auctionId) {
    s.emit('leave_auction', { auctionId });
  }
};
