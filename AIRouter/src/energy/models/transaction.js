/**
 * Energy Transaction Model
 * Database schema for tracking energy transactions
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  walletAddress: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  source: {
    type: String,
    required: true,
    enum: [
      'staking_reward',   // Earned from staking
      'stake_bonus',      // Initial bonus for staking
      'purchase',         // Purchased with tokens
      'trade',            // Used for trading
      'mint',             // Used for NFT minting
      'social',           // Used for social media actions
      'monitor',          // Used for monitoring
      'schedule',         // Used for scheduling tasks
      'airdrop',          // Free energy from airdrops
      'referral',         // Earned from referrals
      'task_reward',      // Reward for completing tasks
      'marketplace'       // Used for marketplace actions
    ]
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  details: {
    type: Map,
    of: Schema.Types.Mixed
  },
  blockchainTxId: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true
});

// Define indexes
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ walletAddress: 1, createdAt: -1 });
TransactionSchema.index({ walletAddress: 1, type: 1 });
TransactionSchema.index({ source: 1 });

// Static method to get transaction statistics
TransactionSchema.statics.getStats = async function(walletAddress) {
  return this.aggregate([
    { $match: { walletAddress } },
    { $group: {
      _id: '$source',
      totalAmount: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', { $multiply: ['$amount', -1] }] } },
      count: { $sum: 1 }
    }}
  ]);
};

// Method to get formatted transaction data
TransactionSchema.methods.getFormattedData = function() {
  return {
    id: this._id,
    type: this.type,
    amount: this.amount,
    source: this.source,
    balanceAfter: this.balanceAfter,
    timestamp: this.createdAt,
    details: this.details || {},
    blockchainTxId: this.blockchainTxId
  };
};

module.exports = mongoose.model('EnergyTransaction', TransactionSchema); 