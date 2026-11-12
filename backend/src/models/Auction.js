const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema(
  {
    tenantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Tenant', 
      required: true, 
      index: true 
    },
    title: { 
      type: String, 
      required: [true, 'Auction title is required'],
      trim: true 
    },
    slug: { 
      type: String, 
      required: [true, 'Auction slug is required'], 
      unique: true,
      lowercase: true,
      trim: true,
      index: true 
    },
    description: { type: String, default: '' },
    type: { 
      type: String, 
      enum: ['MONEY', 'POINTS'], 
      default: 'MONEY' 
    },
    currency: { 
      type: String, 
      default: 'LKR' 
    },
    currencyNotation: { 
      type: String, 
      enum: ['STANDARD', 'SOUTH_ASIAN'], 
      default: 'SOUTH_ASIAN' 
    },

    // Budget & Squad Configuration
    startingPurse: { 
      type: Number, 
      required: [true, 'Starting purse is required'],
      default: 50000000 
    },
    minSquadSize: { type: Number, required: true, default: 15 },
    maxSquadSize: { type: Number, required: true, default: 20 },
    maxOverseasPlayers: { type: Number, default: 6 },
    minBasePrice: { type: Number, required: true, default: 50000 },

    // Dynamic Bidding Ladders
    bidIncrements: [
      {
        from: { type: Number, required: true },
        to: { type: Number, required: true },
        increment: { type: Number, required: true }
      }
    ],

    // Real-time Timer Settings
    timerSeconds: { type: Number, default: 30 },
    resetTimerOnBid: { type: Boolean, default: true },

    // State Machine
    status: { 
      type: String, 
      enum: ['DRAFT', 'SCHEDULED', 'LIVE', 'PAUSED', 'COMPLETED'], 
      default: 'DRAFT',
      index: true 
    },

    // Authoritative Active Lot Cache
    currentLot: {
      playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
      lotNumber: { type: Number, default: 0 },
      currentBid: { type: Number, default: 0 },
      highestBidderTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
      bidCount: { type: Number, default: 0 },
      timerExpiresAt: { type: Date, default: null },
      isTimerRunning: { type: Boolean, default: false }
    },

    scheduledStartTime: { type: Date },
    actualStartTime: { type: Date },
    completedAt: { type: Date },
    bannerUrl: { type: String, default: '' },
    logoUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Auction', auctionSchema);
