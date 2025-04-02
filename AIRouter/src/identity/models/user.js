/**
 * User Model
 * Database schema for user accounts
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  telegramId: {
    type: String,
    sparse: true,
    index: true
  },
  telegramUsername: {
    type: String,
    sparse: true
  },
  email: {
    type: String,
    sparse: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      telegram: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  stats: {
    agentsCreated: {
      type: Number,
      default: 0
    },
    actionsPerformed: {
      type: Number,
      default: 0
    },
    totalEnergyUsed: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Method to update user stats
UserSchema.methods.updateStats = function(stats) {
  if (stats.agentsCreated) {
    this.stats.agentsCreated += stats.agentsCreated;
  }
  
  if (stats.actionsPerformed) {
    this.stats.actionsPerformed += stats.actionsPerformed;
  }
  
  if (stats.energyUsed) {
    this.stats.totalEnergyUsed += stats.energyUsed;
  }
  
  this.stats.lastActive = new Date();
  
  return this.save();
};

// Static method to find users by activity status
UserSchema.statics.findActiveUsers = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.find({
    'stats.lastActive': { $gte: thirtyDaysAgo },
    isActive: true
  });
};

module.exports = mongoose.model('User', UserSchema); 