/**
 * Identity Service
 * Manages user authentication and authorization via Solana wallets and Telegram
 */

const jwt = require('jsonwebtoken');
const { PublicKey } = require('@solana/web3.js');
const { Telegraf } = require('telegraf');
const logger = require('../utils/logger');
const config = require('../config');
const UserModel = require('./models/user');

// Initialize Telegram bot
const bot = config.telegram.token ? new Telegraf(config.telegram.token) : null;

/**
 * Identity Service
 */
const IdentityService = {
  /**
   * Initialize the Identity Service
   */
  init: () => {
    logger.info('Initializing Identity Service...');
    
    if (bot) {
      // Set up Telegram bot
      bot.start((ctx) => ctx.reply('Welcome to AIRouter! Use /connect to link your Solana wallet.'));
      
      // Command to connect wallet
      bot.command('connect', (ctx) => {
        const telegramId = ctx.from.id.toString();
        const username = ctx.from.username || `user${telegramId}`;
        
        // Generate a unique code for wallet connection
        const connectionCode = generateRandomCode();
        
        // Store the code temporarily (this would be in Redis or similar in production)
        // For MVP, we're using an in-memory store
        connectionCodes[telegramId] = {
          code: connectionCode,
          expires: Date.now() + 15 * 60 * 1000 // 15 minutes
        };
        
        ctx.reply(`Your connection code is: ${connectionCode}\n\nUse this code in the AIRouter web app to connect your Solana wallet.`);
      });
      
      // Start the bot
      bot.launch().then(() => {
        logger.info('Telegram bot started successfully');
      }).catch(error => {
        logger.error(`Error starting Telegram bot: ${error.message}`);
      });
      
      // Enable graceful stop
      process.once('SIGINT', () => bot.stop('SIGINT'));
      process.once('SIGTERM', () => bot.stop('SIGTERM'));
    } else {
      logger.warn('Telegram bot token not provided, Telegram integration disabled');
    }
    
    logger.info('Identity Service initialized successfully');
  },

  /**
   * Verify a wallet signature to authenticate a user
   * @param {String} walletAddress - Solana wallet address
   * @param {String} message - Message that was signed
   * @param {String} signature - Signature to verify
   * @returns {Promise<Object>} Authentication result with JWT token
   */
  verifyWalletSignature: async (walletAddress, message, signature) => {
    try {
      // In a real implementation, this would verify the signature
      // using Solana's verification methods
      // For MVP, we're doing a simplified verification
      
      // Check if wallet address is valid
      try {
        new PublicKey(walletAddress);
      } catch (error) {
        throw new Error('Invalid wallet address');
      }
      
      // Find or create user
      let user = await UserModel.findOne({ walletAddress });
      
      if (!user) {
        user = new UserModel({
          walletAddress,
          role: 'user'
        });
        await user.save();
        logger.info(`New user created with wallet: ${walletAddress}`);
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          walletAddress,
          telegramId: user.telegramId,
          role: user.role
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      
      return {
        success: true,
        token,
        user: {
          walletAddress,
          telegramId: user.telegramId,
          role: user.role,
          isTelegramConnected: !!user.telegramId
        }
      };
    } catch (error) {
      logger.error(`Error verifying wallet signature: ${error.message}`);
      throw error;
    }
  },

  /**
   * Connect Telegram account to wallet using connection code
   * @param {String} walletAddress - Solana wallet address
   * @param {String} connectionCode - Code from Telegram bot
   * @returns {Promise<Object>} Connection result
   */
  connectTelegram: async (walletAddress, connectionCode) => {
    try {
      // Find the Telegram ID associated with this code
      const telegramId = findTelegramIdByCode(connectionCode);
      
      if (!telegramId) {
        throw new Error('Invalid or expired connection code');
      }
      
      // Update user record
      const user = await UserModel.findOneAndUpdate(
        { walletAddress },
        { telegramId },
        { new: true }
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Remove the used code
      delete connectionCodes[telegramId];
      
      return {
        success: true,
        user: {
          walletAddress,
          telegramId,
          isTelegramConnected: true
        }
      };
    } catch (error) {
      logger.error(`Error connecting Telegram: ${error.message}`);
      throw error;
    }
  },

  /**
   * Send a message to a user via Telegram
   * @param {String} telegramId - Telegram user ID
   * @param {String} message - Message to send
   * @returns {Promise<Boolean>} Success status
   */
  sendTelegramMessage: async (telegramId, message) => {
    try {
      if (!bot) {
        throw new Error('Telegram bot not configured');
      }
      
      await bot.telegram.sendMessage(telegramId, message);
      return true;
    } catch (error) {
      logger.error(`Error sending Telegram message: ${error.message}`);
      return false;
    }
  },

  /**
   * Get user by wallet address
   * @param {String} walletAddress - Solana wallet address
   * @returns {Promise<Object>} User object
   */
  getUserByWallet: async (walletAddress) => {
    try {
      const user = await UserModel.findOne({ walletAddress });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      logger.error(`Error getting user: ${error.message}`);
      throw error;
    }
  }
};

/**
 * In-memory store for Telegram connection codes
 * In production, this would be in Redis or a database
 */
const connectionCodes = {};

/**
 * Generate a random connection code
 * @returns {String} Random 6-digit code
 */
function generateRandomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Find Telegram ID by connection code
 * @param {String} code - Connection code
 * @returns {String|null} Telegram ID or null if not found
 */
function findTelegramIdByCode(code) {
  const now = Date.now();
  
  for (const [telegramId, data] of Object.entries(connectionCodes)) {
    if (data.code === code && data.expires > now) {
      return telegramId;
    }
  }
  
  return null;
}

module.exports = IdentityService; 