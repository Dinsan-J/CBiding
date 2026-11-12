const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Tenant name is required'], 
      trim: true 
    },
    slug: { 
      type: String, 
      required: [true, 'Tenant slug is required'], 
      unique: true, 
      lowercase: true, 
      trim: true,
      index: true 
    },
    contactEmail: { 
      type: String, 
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true 
    },
    contactPhone: { type: String, trim: true },
    subscriptionPlan: { 
      type: String, 
      enum: ['FREE_TRIAL', 'PRO_TOURNAMENT', 'ENTERPRISE'], 
      default: 'PRO_TOURNAMENT' 
    },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'SUSPENDED'], 
      default: 'ACTIVE' 
    },
    branding: {
      logoUrl: { type: String, default: '' },
      primaryColor: { type: String, default: '#06B6D4' },
      accentColor: { type: String, default: '#10B981' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tenant', tenantSchema);
