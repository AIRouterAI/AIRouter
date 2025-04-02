/**
 * Blockchain Service
 * Core service for interacting with Solana blockchain
 */

const logger = require('../utils/logger');
const config = require('../config');
const tokenService = require('./tokenService');
const nftService = require('./nftService');

/**
 * Blockchain Service
 */
const BlockchainService = {
  /**
   * Initialize the Blockchain Service
   */
  init: () => {
    logger.info('Initializing Blockchain Service...');
    
    // Initialize connection to Solana
    const connectionInfo = {
      network: config.blockchain.network,
      rpcUrl: config.blockchain.rpcUrl
    };
    
    tokenService.init(connectionInfo);
    nftService.init(connectionInfo);
    
    logger.info(`Blockchain Service connected to ${connectionInfo.network}`);
  },

  /**
   * Get token balance for a wallet
   * @param {String} walletAddress - Solana wallet address
   * @returns {Promise<Number>} Token balance
   */
  getTokenBalance: async (walletAddress) => {
    try {
      return await tokenService.getTokenBalance(walletAddress);
    } catch (error) {
      logger.error(`Error getting token balance: ${error.message}`);
      throw error;
    }
  },

  /**
   * Transfer tokens from one wallet to another
   * @param {String} fromWallet - Sender wallet address
   * @param {String} toWallet - Recipient wallet address
   * @param {Number} amount - Amount to transfer
   * @returns {Promise<Object>} Transaction result
   */
  transferTokens: async (fromWallet, toWallet, amount) => {
    try {
      return await tokenService.transferTokens(fromWallet, toWallet, amount);
    } catch (error) {
      logger.error(`Error transferring tokens: ${error.message}`);
      throw error;
    }
  },

  /**
   * Mint an NFT
   * @param {String} walletAddress - Creator wallet address
   * @param {Object} nftData - NFT metadata
   * @returns {Promise<Object>} Minted NFT data
   */
  mintNFT: async (walletAddress, nftData) => {
    try {
      return await nftService.mintNFT(walletAddress, nftData);
    } catch (error) {
      logger.error(`Error minting NFT: ${error.message}`);
      throw error;
    }
  },

  /**
   * List an NFT for sale
   * @param {String} walletAddress - Owner wallet address
   * @param {String} nftMint - NFT mint address
   * @param {Number} price - Sale price in AIROUTER tokens
   * @returns {Promise<Object>} Listing result
   */
  listNFT: async (walletAddress, nftMint, price) => {
    try {
      return await nftService.listNFT(walletAddress, nftMint, price);
    } catch (error) {
      logger.error(`Error listing NFT: ${error.message}`);
      throw error;
    }
  },

  /**
   * Buy an NFT
   * @param {String} buyerWallet - Buyer wallet address
   * @param {String} nftMint - NFT mint address
   * @returns {Promise<Object>} Purchase result
   */
  buyNFT: async (buyerWallet, nftMint) => {
    try {
      return await nftService.buyNFT(buyerWallet, nftMint);
    } catch (error) {
      logger.error(`Error buying NFT: ${error.message}`);
      throw error;
    }
  },

  /**
   * Create a limit order for token swap
   * @param {String} walletAddress - User wallet address
   * @param {Object} orderData - Order details
   * @returns {Promise<Object>} Order result
   */
  createLimitOrder: async (walletAddress, orderData) => {
    try {
      return await tokenService.createLimitOrder(walletAddress, orderData);
    } catch (error) {
      logger.error(`Error creating limit order: ${error.message}`);
      throw error;
    }
  },

  /**
   * Get transaction status
   * @param {String} txId - Transaction ID
   * @returns {Promise<Object>} Transaction status
   */
  getTransactionStatus: async (txId) => {
    try {
      const connection = tokenService.getConnection();
      const status = await connection.getSignatureStatus(txId, {
        searchTransactionHistory: true
      });
      
      return status;
    } catch (error) {
      logger.error(`Error getting transaction status: ${error.message}`);
      throw error;
    }
  }
};

module.exports = BlockchainService; 