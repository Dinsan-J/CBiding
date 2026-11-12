const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    tenantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Tenant', 
      index: true 
    },
    actorUserId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    action: { 
      type: String, 
      enum: [
        'LOT_HAMMER_SOLD', 
        'LOT_HAMMER_UNSOLD', 
        'BID_PLACED',
        'BID_REVERSED', 
        'PURSE_ADJUSTED', 
        'AUCTION_STARTED', 
        'AUCTION_PAUSED',
        'AUCTION_RESUMED',
        'LOT_SELECTED',
        'PLAYER_APPROVED',
        'FIXED_PLAYER_ASSIGNED',
        'FIXED_PLAYER_REMOVED'
      ], 
      required: true 
    },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    snapshotBefore: { type: mongoose.Schema.Types.Mixed },
    snapshotAfter: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    createdAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
