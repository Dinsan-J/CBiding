const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    tenantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Tenant', 
      required: true, 
      index: true 
    },
    auctionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Auction', 
      required: true, 
      index: true 
    },
    playerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Player', 
      required: true, 
      index: true 
    },
    teamId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Team', 
      required: true,
      index: true 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    bidSequence: { 
      type: Number, 
      required: true 
    },
    placedByUserId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    timestamp: { 
      type: Date, 
      default: Date.now, 
      index: true 
    }
  },
  { timestamps: false }
);

module.exports = mongoose.model('Bid', bidSchema);
