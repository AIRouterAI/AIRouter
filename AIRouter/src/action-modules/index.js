/**
 * Action Modules
 * Registry of available action modules for agent execution
 */

const tradeModule = require('./trade');
const mintModule = require('./mint');
const socialModule = require('./social');
const monitorModule = require('./monitor');
const logger = require('../utils/logger');

/**
 * Action Modules Registry
 * Maps intent types to their respective action modules
 */
const actionModules = {
  // Trading actions
  trade: tradeModule,
  buy: tradeModule,
  sell: tradeModule,
  swap: tradeModule,
  limit: tradeModule,
  dca: tradeModule,
  
  // NFT actions
  mint: mintModule,
  nft: mintModule,
  collection: mintModule,
  
  // Social media actions
  social: socialModule,
  tweet: socialModule,
  post: socialModule,
  
  // Monitoring actions
  monitor: monitorModule,
  track: monitorModule,
  alert: monitorModule,
  
  /**
   * Get module by intent type
   * @param {String} intentType - Intent type
   * @returns {Object|null} Action module or null if not found
   */
  getModuleByType: (intentType) => {
    const module = actionModules[intentType.toLowerCase()];
    
    if (!module) {
      logger.warn(`No action module found for intent type: ${intentType}`);
      return null;
    }
    
    return module;
  },
  
  /**
   * Execute an action based on intent
   * @param {String} intentType - Intent type
   * @param {Object} parameters - Action parameters
   * @param {Object} agent - Agent executing the action
   * @returns {Promise<Object>} Action result
   */
  executeAction: async (intentType, parameters, agent) => {
    const module = actionModules.getModuleByType(intentType);
    
    if (!module) {
      throw new Error(`Unsupported action type: ${intentType}`);
    }
    
    try {
      return await module.execute(parameters, agent);
    } catch (error) {
      logger.error(`Error executing ${intentType} action: ${error.message}`);
      throw error;
    }
  }
};

module.exports = actionModules; 