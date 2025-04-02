/**
 * Agent Model
 * Database schema for AI agents
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AgentSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  owner: {
    type: String, // Solana wallet address
    required: true,
    index: true
  },
  telegramId: {
    type: String,
    sparse: true
  },
  type: {
    type: String,
    enum: ['trading', 'nft', 'social', 'dao', 'ecommerce', 'custom'],
    default: 'custom'
  },
  permissions: [{
    type: String,
    enum: ['trade', 'mint', 'social', 'monitor', 'schedule']
  }],
  parameters: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  energyUsed: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  marketplace: {
    isPublished: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for agent efficiency (ratio of successful actions to total energy used)
AgentSchema.virtual('efficiency').get(function() {
  if (!this.energyUsed || this.energyUsed === 0) return 0;
  const successRatio = this.stats?.successfulActions / this.stats?.totalActions || 0;
  return (successRatio * 100 / this.energyUsed).toFixed(2);
});

// Define indexes
AgentSchema.index({ owner: 1, type: 1 });
AgentSchema.index({ 'marketplace.isPublished': 1 });

// Pre-save hook to set default permissions based on type
AgentSchema.pre('save', function(next) {
  if (this.isNew && (!this.permissions || this.permissions.length === 0)) {
    switch (this.type) {
      case 'trading':
        this.permissions = ['trade', 'monitor'];
        break;
      case 'nft':
        this.permissions = ['mint'];
        break;
      case 'social':
        this.permissions = ['social'];
        break;
      case 'dao':
        this.permissions = ['monitor', 'schedule'];
        break;
      case 'ecommerce':
        this.permissions = ['trade', 'social'];
        break;
      default:
        this.permissions = [];
    }
  }
  next();
});

module.exports = mongoose.model('Agent', AgentSchema); 