/**
 * Energy API Routes
 * Endpoints for managing user energy
 */

const express = require('express');
const router = express.Router();
const EnergySystem = require('./index');
const authMiddleware = require('../identity/middleware');
const logger = require('../utils/logger');
const Joi = require('joi');

/**
 * Validate the request body for staking and unstaking
 */
const validateAmount = (req, res, next) => {
  const schema = Joi.object({
    amount: Joi.number().positive().required()
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: {
        message: 'Invalid amount',
        details: error.details[0].message
      }
    });
  }
  
  next();
};

/**
 * Get user's energy balance
 */
router.get('/balance', authMiddleware.authenticate, async (req, res, next) => {
  try {
    const balance = await EnergySystem.getBalance(req.user.walletAddress);
    res.status(200).json({ balance });
  } catch (error) {
    next(error);
  }
});

/**
 * Stake tokens to earn energy
 */
router.post('/stake', 
  authMiddleware.authenticate,
  validateAmount,
  async (req, res, next) => {
    try {
      const { amount } = req.body;
      const result = await EnergySystem.stakeTokens(req.user.walletAddress, amount);
      
      res.status(200).json({
        message: `Successfully staked ${amount} tokens`,
        energyBalance: result.balance,
        stakedAmount: result.staked
      });
    } catch (error) {
      logger.error(`Staking error: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Unstake tokens
 */
router.post('/unstake', 
  authMiddleware.authenticate,
  validateAmount,
  async (req, res, next) => {
    try {
      const { amount } = req.body;
      const result = await EnergySystem.unstakeTokens(req.user.walletAddress, amount);
      
      res.status(200).json({
        message: `Successfully unstaked ${amount} tokens`,
        stakedAmount: result.staked
      });
    } catch (error) {
      logger.error(`Unstaking error: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Purchase energy with tokens
 */
router.post('/purchase', 
  authMiddleware.authenticate,
  validateAmount,
  async (req, res, next) => {
    try {
      const { amount } = req.body;
      const result = await EnergySystem.purchaseEnergy(req.user.walletAddress, amount);
      
      res.status(200).json({
        message: `Successfully purchased energy with ${amount} tokens`,
        energyBalance: result.balance
      });
    } catch (error) {
      logger.error(`Energy purchase error: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Get transaction history
 */
router.get('/transactions', 
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const skip = parseInt(req.query.skip) || 0;
      
      const transactions = await EnergySystem.getTransactionHistory(
        req.user.walletAddress,
        limit,
        skip
      );
      
      res.status(200).json(transactions);
    } catch (error) {
      logger.error(`Error fetching transactions: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Get energy stats
 */
router.get('/stats', 
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const energyRecord = await EnergySystem.getEnergyRecord(req.user.walletAddress);
      
      if (!energyRecord) {
        return res.status(200).json({
          balance: 0,
          staked: 0,
          weeklyRewardRate: 0
        });
      }
      
      res.status(200).json(energyRecord.getStats());
    } catch (error) {
      logger.error(`Error fetching energy stats: ${error.message}`);
      next(error);
    }
  }
);

module.exports = router; 