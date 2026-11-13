const mongoose = require('mongoose');

const playerRegistrationSchema = new mongoose.Schema(
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
    fullName: { 
      type: String, 
      required: [true, 'Full name is required'],
      trim: true 
    },
    contactNumber: { 
      type: String, 
      required: [true, 'Contact number is required'],
      trim: true 
    },
    email: { type: String, trim: true, default: '' },
    age: { type: Number, default: 22 },
    city: { type: String, default: 'Colombo' },
    photoUrl: { type: String, default: '' },

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
      default: 'TOP_ORDER_BATTER' 
    },
    battingStyle: { 
      type: String, 
      enum: ['RIGHT_HAND', 'LEFT_HAND'], 
      default: 'RIGHT_HAND' 
    },
    bowlingStyle: { type: String, default: 'Right-arm medium' },
    experienceLevel: { type: String, default: 'Domestic Club' },

    stats: {
      matches: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      highestScore: { type: String, default: '0' },
      bestBowling: { type: String, default: '-' }
    },

    status: { 
      type: String, 
      enum: ['PENDING', 'APPROVED', 'REJECTED'], 
      default: 'PENDING',
      index: true 
    },
    assignedBasePrice: { type: Number, default: 100000 },
    rejectionReason: { type: String, default: '' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlayerRegistration', playerRegistrationSchema);
