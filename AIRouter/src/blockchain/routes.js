/**
 * Blockchain API Routes
 * Endpoints for blockchain operations
 */

const express = require('express');
const router = express.Router();
const BlockchainService = require('./index');
const authMiddleware = require('../identity/middleware');
const energyMiddleware = require('../energy/middleware');
const logger = require('../utils/logger');
const Joi = require('joi');

/**
 * Validate token transfer request
 */
const validateTransfer = (req, res, next) => {
  const schema = Joi.object({
    recipient: Joi.string().required(),
    amount: Joi.number().positive().required()
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: {
        message: 'Invalid transfer parameters',
        details: error.details[0].message
      }
    });
  }
  
  next();
};

/**
 * Validate limit order request
 */
const validateLimitOrder = (req, res, next) => {
  const schema = Joi.object({
    inputToken: Joi.string().required(),
    outputToken: Joi.string().required(),
    inputAmount: Joi.number().positive().required(),
    price: Joi.number().positive().required(),
    slippage: Joi.number().min(0).max(100).default(1)
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: {
        message: 'Invalid limit order parameters',
        details: error.details[0].message
      }
    });
  }
  
  next();
};

/**
 * Get token balance
 */
router.get('/balance', authMiddleware.authenticate, async (req, res, next) => {
  try {
    const balance = await BlockchainService.getTokenBalance(req.user.walletAddress);
    res.status(200).json({ balance });
  } catch (error) {
    logger.error(`Error getting token balance: ${error.message}`);
    next(error);
  }
});

/**
 * Transfer tokens
 */
router.post('/transfer', 
  authMiddleware.authenticate,
  validateTransfer,
  energyMiddleware.checkEnergy,
  async (req, res, next) => {
    try {
      const { recipient, amount } = req.body;
      
      // Check if user has sufficient token balance
      const balance = await BlockchainService.getTokenBalance(req.user.walletAddress);
      if (balance < amount) {
        return res.status(400).json({
          error: {
            message: 'Insufficient token balance',
            required: amount,
            current: balance
          }
        });
      }
      
      // Execute transfer
      const result = await BlockchainService.transferTokens(
        req.user.walletAddress,
        recipient,
        amount
      );
      
      // Deduct energy
      await energyMiddleware.deductEnergy(req.user.walletAddress, req.energyCost, 'trade');
      
      res.status(200).json(result);
    } catch (error) {
      logger.error(`Error transferring tokens: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Create limit order
 */
router.post('/limit-order', 
  authMiddleware.authenticate,
  validateLimitOrder,
  energyMiddleware.checkEnergy,
  async (req, res, next) => {
    try {
      // Check if user has sufficient token balance
      const balance = await BlockchainService.getTokenBalance(req.user.walletAddress);
      if (balance < req.body.inputAmount) {
        return res.status(400).json({
          error: {
            message: 'Insufficient token balance',
            required: req.body.inputAmount,
            current: balance
          }
        });
      }
      
      // Create limit order
      const result = await BlockchainService.createLimitOrder(
        req.user.walletAddress,
        req.body
      );
      
      // Deduct energy
      await energyMiddleware.deductEnergy(req.user.walletAddress, req.energyCost, 'trade');
      
      res.status(200).json(result);
    } catch (error) {
      logger.error(`Error creating limit order: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Get swap quote
 */
router.get('/swap-quote', 
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const { inputToken, outputToken, amount } = req.query;
      
      // Validate required parameters
      if (!inputToken || !outputToken || !amount) {
        return res.status(400).json({
          error: {
            message: 'Missing required parameters: inputToken, outputToken, amount'
          }
        });
      }
      
      // Get swap quote
      const quote = await BlockchainService.getSwapQuote(
        inputToken,
        outputToken,
        parseFloat(amount)
      );
      
      res.status(200).json(quote);
    } catch (error) {
      logger.error(`Error getting swap quote: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Get NFTs owned by the user
 */
router.get('/nfts', 
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const nfts = await BlockchainService.getNFTs(req.user.walletAddress);
      res.status(200).json(nfts);
    } catch (error) {
      logger.error(`Error getting NFTs: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Get transaction status
 */
router.get('/transaction/:txId', async (req, res, next) => {
  try {
    const status = await BlockchainService.getTransactionStatus(req.params.txId);
    res.status(200).json(status);
  } catch (error) {
    logger.error(`Error getting transaction status: ${error.message}`);
    next(error);
  }
});

module.exports = router; 