/**
 * Energy Model
 * Database schema for user energy balances and staking
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EnergySchema = new Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  staked: {
    type: Number,
    default: 0,
    min: 0
  },
  lifetimeEarned: {
    type: Number,
    default: 0
  },
  lifetimeSpent: {
    type: Number,
    default: 0
  },
  lastStakingReward: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual for weekly reward rate
EnergySchema.virtual('weeklyRewardRate').get(function() {
  return this.staked * 0.07; // 7% of staked tokens per week
});

// Method to check if user has sufficient energy
EnergySchema.methods.hasSufficientEnergy = function(amount) {
  return this.balance >= amount;
};

// Method to get energy stats
EnergySchema.methods.getStats = function() {
  return {
    balance: this.balance,
    staked: this.staked,
    lifetimeEarned: this.lifetimeEarned,
    lifetimeSpent: this.lifetimeSpent,
    weeklyRewardRate: this.weeklyRewardRate,
    lastStakingReward: this.lastStakingReward,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('Energy', EnergySchema); 