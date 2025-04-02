/**
 * Energy System
 * Manages the energy economy that powers agent actions
 */

const logger = require('../utils/logger');
const config = require('../config');
const EnergyModel = require('./models/energy');
const TransactionModel = require('./models/transaction');
const BlockchainService = require('../blockchain/tokenService');

/**
 * Energy System Module
 */
const EnergySystem = {
  /**
   * Initialize the Energy System
   */
  init: () => {
    logger.info('Initializing Energy System...');
    // Scheduled task to reward staking
    setInterval(async () => {
      try {
        await EnergySystem.processStakingRewards();
        logger.info('Staking rewards processed successfully');
      } catch (error) {
        logger.error(`Error processing staking rewards: ${error.message}`);
      }
    }, 24 * 60 * 60 * 1000); // Once per day
    
    logger.info('Energy System initialized successfully');
  },

  /**
   * Get energy balance for a user
   * @param {String} walletAddress - User's wallet address
   * @returns {Promise<Number>} Energy balance
   */
  getBalance: async (walletAddress) => {
    try {
      const energyRecord = await EnergyModel.findOne({ walletAddress });
      return energyRecord ? energyRecord.balance : 0;
    } catch (error) {
      logger.error(`Error getting energy balance: ${error.message}`);
      throw error;
    }
  },

  /**
   * Add energy to a user's account
   * @param {String} walletAddress - User's wallet address
   * @param {Number} amount - Amount of energy to add
   * @param {String} source - Source of energy (staking, purchase, reward)
   * @returns {Promise<Object>} Updated energy record
   */
  addEnergy: async (walletAddress, amount, source) => {
    logger.info(`Adding ${amount} energy to ${walletAddress} from ${source}`);
    
    try {
      // Find or create energy record
      let energyRecord = await EnergyModel.findOne({ walletAddress });
      
      if (!energyRecord) {
        energyRecord = new EnergyModel({
          walletAddress,
          balance: 0,
          staked: 0
        });
      }
      
      // Update balance
      energyRecord.balance += amount;
      await energyRecord.save();
      
      // Record transaction
      await new TransactionModel({
        walletAddress,
        type: 'credit',
        amount,
        source,
        balanceAfter: energyRecord.balance
      }).save();
      
      return energyRecord;
    } catch (error) {
      logger.error(`Error adding energy: ${error.message}`);
      throw error;
    }
  },

  /**
   * Deduct energy from a user's account
   * @param {String} walletAddress - User's wallet address
   * @param {Number} amount - Amount of energy to deduct
   * @param {String} reason - Reason for deduction (action type)
   * @returns {Promise<Object>} Updated energy record
   */
  deductEnergy: async (walletAddress, amount, reason) => {
    logger.info(`Deducting ${amount} energy from ${walletAddress} for ${reason}`);
    
    try {
      // Find energy record
      const energyRecord = await EnergyModel.findOne({ walletAddress });
      
      if (!energyRecord || energyRecord.balance < amount) {
        throw new Error('Insufficient energy balance');
      }
      
      // Update balance
      energyRecord.balance -= amount;
      await energyRecord.save();
      
      // Record transaction
      await new TransactionModel({
        walletAddress,
        type: 'debit',
        amount,
        source: reason,
        balanceAfter: energyRecord.balance
      }).save();
      
      return energyRecord;
    } catch (error) {
      logger.error(`Error deducting energy: ${error.message}`);
      throw error;
    }
  },

  /**
   * Stake AIROUTER tokens to earn energy
   * @param {String} walletAddress - User's wallet address
   * @param {Number} amount - Amount of tokens to stake
   * @returns {Promise<Object>} Updated energy record
   */
  stakeTokens: async (walletAddress, amount) => {
    logger.info(`Staking ${amount} tokens for ${walletAddress}`);
    
    try {
      // Verify token ownership through blockchain service
      const balance = await BlockchainService.getTokenBalance(walletAddress);
      
      if (balance < amount) {
        throw new Error('Insufficient token balance');
      }
      
      // Lock tokens in staking contract
      await BlockchainService.stakeTokens(walletAddress, amount);
      
      // Update energy record with staked amount
      let energyRecord = await EnergyModel.findOne({ walletAddress });
      
      if (!energyRecord) {
        energyRecord = new EnergyModel({
          walletAddress,
          balance: 0,
          staked: 0
        });
      }
      
      energyRecord.staked += amount;
      
      // Add initial energy bonus for staking
      const initialBonus = amount * 10; // 10 energy per token staked
      energyRecord.balance += initialBonus;
      
      await energyRecord.save();
      
      // Record transaction
      await new TransactionModel({
        walletAddress,
        type: 'credit',
        amount: initialBonus,
        source: 'stake_bonus',
        balanceAfter: energyRecord.balance
      }).save();
      
      return energyRecord;
    } catch (error) {
      logger.error(`Error staking tokens: ${error.message}`);
      throw error;
    }
  },

  /**
   * Unstake AIROUTER tokens
   * @param {String} walletAddress - User's wallet address
   * @param {Number} amount - Amount of tokens to unstake
   * @returns {Promise<Object>} Updated energy record
   */
  unstakeTokens: async (walletAddress, amount) => {
    logger.info(`Unstaking ${amount} tokens for ${walletAddress}`);
    
    try {
      // Get energy record
      const energyRecord = await EnergyModel.findOne({ walletAddress });
      
      if (!energyRecord || energyRecord.staked < amount) {
        throw new Error('Insufficient staked tokens');
      }
      
      // Release tokens from staking contract
      await BlockchainService.unstakeTokens(walletAddress, amount);
      
      // Update energy record
      energyRecord.staked -= amount;
      await energyRecord.save();
      
      return energyRecord;
    } catch (error) {
      logger.error(`Error unstaking tokens: ${error.message}`);
      throw error;
    }
  },

  /**
   * Purchase energy with AIROUTER tokens
   * @param {String} walletAddress - User's wallet address
   * @param {Number} tokenAmount - Amount of tokens to spend
   * @returns {Promise<Object>} Updated energy record
   */
  purchaseEnergy: async (walletAddress, tokenAmount) => {
    logger.info(`Purchasing energy with ${tokenAmount} tokens for ${walletAddress}`);
    
    try {
      // Verify token ownership through blockchain service
      const balance = await BlockchainService.getTokenBalance(walletAddress);
      
      if (balance < tokenAmount) {
        throw new Error('Insufficient token balance');
      }
      
      // Calculate energy amount based on current rates
      const energyAmount = tokenAmount * 100; // 100 energy per token
      
      // Transfer tokens
      await BlockchainService.burnTokens(walletAddress, tokenAmount);
      
      // Add energy
      return await EnergySystem.addEnergy(walletAddress, energyAmount, 'purchase');
    } catch (error) {
      logger.error(`Error purchasing energy: ${error.message}`);
      throw error;
    }
  },

  /**
   * Process staking rewards for all users
   * @returns {Promise<void>}
   */
  processStakingRewards: async () => {
    logger.info('Processing staking rewards');
    
    try {
      // Get all users with staked tokens
      const stakingRecords = await EnergyModel.find({ staked: { $gt: 0 } });
      
      for (const record of stakingRecords) {
        // Calculate reward based on staking amount
        const rewardRate = config.energy.stakingReward; // Daily reward rate
        const rewardAmount = Math.floor(record.staked * rewardRate);
        
        if (rewardAmount > 0) {
          // Add energy reward
          await EnergySystem.addEnergy(record.walletAddress, rewardAmount, 'staking_reward');
          logger.info(`Added ${rewardAmount} energy to ${record.walletAddress} as staking reward`);
        }
      }
    } catch (error) {
      logger.error(`Error processing staking rewards: ${error.message}`);
      throw error;
    }
  },

  /**
   * Get transaction history for a user
   * @param {String} walletAddress - User's wallet address
   * @param {Number} limit - Maximum number of transactions to return
   * @param {Number} skip - Number of transactions to skip (for pagination)
   * @returns {Promise<Array>} Transaction history
   */
  getTransactionHistory: async (walletAddress, limit = 20, skip = 0) => {
    try {
      const transactions = await TransactionModel.find({ walletAddress })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      return transactions;
    } catch (error) {
      logger.error(`Error getting transaction history: ${error.message}`);
      throw error;
    }
  }
};

module.exports = EnergySystem; 