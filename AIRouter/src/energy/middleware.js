/**
 * Energy Middleware
 * Middleware for checking and managing energy in API requests
 */

const logger = require('../utils/logger');
const config = require('../config');
const EnergySystem = require('./index');

/**
 * Energy Middleware Functions
 */
const energyMiddleware = {
  /**
   * Check if user has sufficient energy for the requested action
   * Determines energy cost based on action type and adds it to the request
   */
  checkEnergy: async (req, res, next) => {
    try {
      const walletAddress = req.user.walletAddress;
      
      // Determine the action type from the request
      const path = req.path;
      const actionType = determineActionType(path);
      
      // Get energy cost for this action type
      const energyCost = getEnergyCost(actionType);
      
      // Check if user has sufficient energy
      const energyBalance = await EnergySystem.getBalance(walletAddress);
      
      if (energyBalance < energyCost) {
        return res.status(402).json({
          error: {
            message: 'Insufficient energy',
            required: energyCost,
            current: energyBalance
          }
        });
      }
      
      // Store energy cost in request for later use
      req.energyCost = energyCost;
      req.actionType = actionType;
      
      next();
    } catch (error) {
      logger.error(`Energy check error: ${error.message}`);
      next(error);
    }
  },

  /**
   * Deduct energy from user's account
   * @param {String} walletAddress - User's wallet address
   * @param {Number} amount - Amount to deduct
   * @param {String} reason - Reason for deduction (defaults to action type from request)
   */
  deductEnergy: async (walletAddress, amount, reason) => {
    try {
      return await EnergySystem.deductEnergy(walletAddress, amount, reason);
    } catch (error) {
      logger.error(`Energy deduction error: ${error.message}`);
      throw error;
    }
  },

  /**
   * Add energy as a reward for completing tasks or other activities
   */
  rewardEnergy: async (req, res, next) => {
    try {
      const walletAddress = req.user.walletAddress;
      const rewardAmount = determineRewardAmount(req);
      
      if (rewardAmount > 0) {
        await EnergySystem.addEnergy(walletAddress, rewardAmount, 'task_reward');
        req.energyReward = rewardAmount;
      }
      
      next();
    } catch (error) {
      logger.error(`Energy reward error: ${error.message}`);
      next(error);
    }
  }
};

/**
 * Helper function to determine action type from request path
 * @param {String} path - API request path
 * @returns {String} Action type
 */
function determineActionType(path) {
  if (path.includes('/trade') || path.includes('/market')) {
    return 'trade';
  } else if (path.includes('/mint') || path.includes('/nft')) {
    return 'mint';
  } else if (path.includes('/social') || path.includes('/tweet')) {
    return 'social';
  } else if (path.includes('/monitor')) {
    return 'monitor';
  } else if (path.includes('/schedule')) {
    return 'schedule';
  } else {
    return 'default';
  }
}

/**
 * Helper function to get energy cost for an action type
 * @param {String} actionType - Type of action
 * @returns {Number} Energy cost
 */
function getEnergyCost(actionType) {
  const costs = config.energy.actionCosts;
  
  switch (actionType) {
    case 'trade':
      return costs.trade || 20;
    case 'mint':
      return costs.mint || 50;
    case 'social':
      return costs.social || 5;
    case 'monitor':
      return costs.monitor || 10;
    case 'schedule':
      return costs.schedule || 15;
    default:
      return config.energy.baseCost || 10;
  }
}

/**
 * Helper function to determine reward amount based on action
 * @param {Object} req - Express request object
 * @returns {Number} Reward amount
 */
function determineRewardAmount(req) {
  // This could be expanded with more complex logic based on
  // task difficulty, user level, etc.
  const baseReward = 5;
  
  if (req.actionCompleted && req.actionDifficulty) {
    return baseReward * req.actionDifficulty;
  }
  
  return baseReward;
}

module.exports = energyMiddleware; 