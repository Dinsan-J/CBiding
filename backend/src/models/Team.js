const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
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
    name: { 
      type: String, 
      required: [true, 'Team name is required'],
      trim: true 
    },
    shortName: { 
      type: String, 
      required: [true, 'Team short code is required'], 
      uppercase: true,
      trim: true 
    },
    logoUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '#06B6D4' },
    secondaryColor: { type: String, default: '#10B981' },
    ownerName: { type: String, default: '' },
    ownerContact: { type: String, default: '' },

    // Financial Ledger
    startingPurse: { type: Number, required: true },
    totalSpent: { type: Number, default: 0 },
    remainingPurse: { type: Number, required: true },
    reservedPurse: { type: Number, default: 0 },

    // Squad Composition
    squadCount: { type: Number, default: 0 },
    overseasCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
