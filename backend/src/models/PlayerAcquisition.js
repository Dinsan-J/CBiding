const mongoose = require('mongoose');

const playerAcquisitionSchema = new mongoose.Schema(
  {
    tenantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Tenant', 
      required: true 
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
      unique: true 
    },
    teamId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Team', 
      required: true, 
      index: true 
    },
    finalBidAmount: { 
      type: Number, 
      required: true 
    },
    totalBidsOnLot: { 
      type: Number, 
      default: 1 
    },
    acquisitionType: {
      type: String,
      enum: ['AUCTION_HAMMER', 'RETENTION_PRE_AUCTION', 'DIRECT_DRAFT'],
      default: 'AUCTION_HAMMER'
    },
    acquiredAt: { 
      type: Date, 
      default: Date.now 
    },
    whatsAppNotificationStatus: { 
      type: String, 
      enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'NOT_APPLICABLE'], 
      default: 'PENDING' 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlayerAcquisition', playerAcquisitionSchema);
