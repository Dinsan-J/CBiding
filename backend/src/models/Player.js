const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
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
    registrationId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'PlayerRegistration', 
      default: null 
    },
    lotNumber: { type: Number, index: true },
    fullName: { 
      type: String, 
      required: [true, 'Player full name is required'], 
      trim: true 
    },
    photoUrl: { type: String, default: '' },

    // Cricket Attributes
    role: { 
      type: String, 
      enum: [
        'TOP_ORDER_BATTER', 
        'MIDDLE_ORDER_BATTER', 
        'WICKETKEEPER_BATTER', 
        'PACE_ALL_ROUNDER', 
        'SPIN_ALL_ROUNDER', 
        'FAST_BOWLER', 
        'SPIN_BOWLER'
      ],
      required: true 
    },
    battingStyle: { 
      type: String, 
      enum: ['RIGHT_HAND', 'LEFT_HAND'], 
      default: 'RIGHT_HAND' 
    },
    bowlingStyle: { type: String, default: 'None' },
    isOverseas: { type: Boolean, default: false },
    country: { type: String, default: 'Sri Lanka' },
    age: { type: Number, default: 25 },

    // Player Statistics
    stats: {
      matches: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      battingAverage: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      economy: { type: Number, default: 0 },
      highestScore: { type: String, default: '0' },
      bestBowling: { type: String, default: '-' }
    },

    // Auction Tier
    category: { 
      type: String, 
      enum: ['MARQUEE', 'CATEGORY_A', 'CATEGORY_B', 'CATEGORY_C', 'EMERGING'], 
      default: 'CATEGORY_A' 
    },
    basePrice: { type: Number, required: true },

    // Lifecycle Status
    status: { 
      type: String, 
      enum: ['REGISTERED', 'APPROVED', 'QUEUED', 'LIVE', 'SOLD', 'UNSOLD', 'RETAINED'], 
      default: 'APPROVED',
      index: true 
    },
    isFixedPlayer: { type: Boolean, default: false },
    retentionType: { 
      type: String, 
      enum: ['AUCTION', 'FIXED_RETENTION', 'DIRECT_DRAFT'], 
      default: 'AUCTION' 
    },

    // Final Outcome
    winningTeamId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Team', 
      default: null 
    },
    finalPrice: { type: Number, default: 0 },
    soldAt: { type: Date, default: null },
    reAuctionEligible: { type: Boolean, default: true },

    contactNumber: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Player', playerSchema);
