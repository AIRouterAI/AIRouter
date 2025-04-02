/**
 * Identity API Routes
 * Endpoints for user authentication and account management
 */

const express = require('express');
const router = express.Router();
const IdentityService = require('./index');
const authMiddleware = require('./middleware');
const logger = require('../utils/logger');
const Joi = require('joi');

/**
 * Validate authentication request
 */
const validateAuth = (req, res, next) => {
  const schema = Joi.object({
    walletAddress: Joi.string().required(),
    message: Joi.string().required(),
    signature: Joi.string().required()
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: {
        message: 'Invalid authentication parameters',
        details: error.details[0].message
      }
    });
  }
  
  next();
};

/**
 * Validate Telegram connection request
 */
const validateTelegramConnect = (req, res, next) => {
  const schema = Joi.object({
    connectionCode: Joi.string().length(6).required()
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: {
        message: 'Invalid connection code format',
        details: error.details[0].message
      }
    });
  }
  
  next();
};

/**
 * Authenticate with wallet signature
 */
router.post('/auth', validateAuth, async (req, res, next) => {
  try {
    const { walletAddress, message, signature } = req.body;
    
    const result = await IdentityService.verifyWalletSignature(
      walletAddress,
      message,
      signature
    );
    
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    next(error);
  }
});

/**
 * Connect Telegram account
 */
router.post('/connect-telegram', 
  authMiddleware.authenticate,
  validateTelegramConnect,
  async (req, res, next) => {
    try {
      const { connectionCode } = req.body;
      
      const result = await IdentityService.connectTelegram(
        req.user.walletAddress,
        connectionCode
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error(`Telegram connection error: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Get user profile
 */
router.get('/profile', 
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const user = await IdentityService.getUserByWallet(req.user.walletAddress);
      
      // Sanitize user data for frontend
      const profile = {
        walletAddress: user.walletAddress,
        telegramId: user.telegramId,
        isTelegramConnected: !!user.telegramId,
        role: user.role,
        preferences: user.preferences,
        stats: user.stats,
        subscription: user.subscription,
        createdAt: user.createdAt
      };
      
      res.status(200).json(profile);
    } catch (error) {
      logger.error(`Profile fetch error: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Update user preferences
 */
router.put('/preferences', 
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      // Validate preferences
      const schema = Joi.object({
        notifications: Joi.object({
          email: Joi.boolean(),
          telegram: Joi.boolean()
        }),
        theme: Joi.string().valid('light', 'dark', 'system'),
        language: Joi.string().min(2).max(5)
      });
      
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: {
            message: 'Invalid preferences format',
            details: error.details[0].message
          }
        });
      }
      
      // Update user preferences
      const user = await IdentityService.updatePreferences(
        req.user.walletAddress,
        req.body
      );
      
      res.status(200).json({
        success: true,
        preferences: user.preferences
      });
    } catch (error) {
      logger.error(`Preferences update error: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Webhook for Telegram bot
 */
router.post('/telegram/webhook', (req, res) => {
  // The Telegram bot library handles the webhook internally
  // We just need to return a success response
  res.status(200).end();
});

module.exports = router; 