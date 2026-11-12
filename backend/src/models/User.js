const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    tenantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Tenant', 
      index: true, 
      default: null 
    },
    fullName: { 
      type: String, 
      required: [true, 'Full name is required'], 
      trim: true 
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      unique: true, 
      lowercase: true, 
      trim: true,
      index: true 
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },
    passwordHash: { 
      type: String, 
      required: [true, 'Password is required'] 
    },
    role: { 
      type: String, 
      enum: ['SUPER_ADMIN', 'ORGANISER', 'AUCTIONEER', 'TEAM_REP', 'SPECTATOR'], 
      default: 'ORGANISER' 
    },
    assignedAuctionIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Auction' }
    ],
    status: { 
      type: String, 
      enum: ['ACTIVE', 'INACTIVE'], 
      default: 'ACTIVE' 
    },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Generate JWT Token
userSchema.methods.getSignedJwtToken = function () {
  let expiresIn = process.env.JWT_EXPIRES_IN;
  if (!expiresIn || expiresIn === '0' || expiresIn === 0 || expiresIn === '0s') {
    expiresIn = '7d';
  }
  const tenantIdStr = this.tenantId?._id ? this.tenantId._id.toString() : (this.tenantId ? this.tenantId.toString() : null);
  return jwt.sign(
    { 
      id: this._id.toString(), 
      tenantId: tenantIdStr, 
      role: this.role, 
      email: this.email 
    },
    process.env.JWT_SECRET || 'bidx_cricket_auction_ultra_secret_key_2026',
    { expiresIn }
  );
};

module.exports = mongoose.model('User', userSchema);
