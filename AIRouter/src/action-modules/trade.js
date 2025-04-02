/**
 * Trade Action Module
 * Handles trading operations like swap, limit orders, and DCA
 */

const logger = require('../utils/logger');
const BlockchainService = require('../blockchain');
const ActionResult = require('./utils/actionResult');

/**
 * Trade Action Module
 */
const TradeModule = {
  /**
   * Execute a trading action
   * @param {Object} parameters - Action parameters
   * @param {Object} agent - Agent executing the action
   * @returns {Promise<Object>} Action result
   */
  execute: async (parameters, agent) => {
    logger.info(`Executing trade action with parameters: ${JSON.stringify(parameters)}`);
    
    try {
      // Determine the specific trading action
      const action = parameters.action?.toLowerCase() || 'swap';
      
      switch (action) {
        case 'swap':
          return await TradeModule.executeSwap(parameters, agent);
        
        case 'limit':
          return await TradeModule.executeLimitOrder(parameters, agent);
        
        case 'dca':
          return await TradeModule.executeDCA(parameters, agent);
        
        case 'buy':
          return await TradeModule.executeBuy(parameters, agent);
        
        case 'sell':
          return await TradeModule.executeSell(parameters, agent);
        
        default:
          throw new Error(`Unsupported trading action: ${action}`);
      }
    } catch (error) {
      logger.error(`Trade action error: ${error.message}`);
      return ActionResult.failure('trade', error.message);
    }
  },

  /**
   * Execute a token swap
   * @param {Object} parameters - Swap parameters
   * @param {Object} agent - Agent executing the action
   * @returns {Promise<Object>} Swap result
   */
  executeSwap: async (parameters, agent) => {
    // Validate required parameters
    if (!parameters.inputToken || !parameters.outputToken || !parameters.amount) {
      throw new Error('Missing required parameters for swap: inputToken, outputToken, amount');
    }
    
    // Get quote first to check expected output
    const quote = await BlockchainService.getSwapQuote(
      parameters.inputToken,
      parameters.outputToken,
      parameters.amount
    );
    
    // Check if the quote meets minimum requirements
    if (parameters.minOutput && quote.outputAmount < parameters.minOutput) {
      return ActionResult.failure('trade', 'Swap quote below minimum output requirement');
    }
    
    // Execute the swap
    logger.info(`Executing swap: ${parameters.amount} ${parameters.inputToken} -> ${parameters.outputToken}`);
    
    // In a real implementation, this would perform the swap
    // For MVP, we're returning a simulated result
    return ActionResult.success('trade', {
      type: 'swap',
      inputToken: parameters.inputToken,
      outputToken: parameters.outputToken,
      inputAmount: parameters.amount,
      outputAmount: quote.outputAmount,
      fee: quote.fee,
      priceImpact: quote.priceImpact,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Execute a limit order
   * @param {Object} parameters - Limit order parameters
   * @param {Object} agent - Agent executing the action
   * @returns {Promise<Object>} Limit order result
   */
  executeLimitOrder: async (parameters, agent) => {
    // Validate required parameters
    if (!parameters.inputToken || !parameters.outputToken || !parameters.amount || !parameters.price) {
      throw new Error('Missing required parameters for limit order: inputToken, outputToken, amount, price');
    }
    
    // Create limit order
    logger.info(`Creating limit order: ${parameters.amount} ${parameters.inputToken} -> ${parameters.outputToken} at price ${parameters.price}`);
    
    const orderData = {
      inputToken: parameters.inputToken,
      outputToken: parameters.outputToken,
      inputAmount: parameters.amount,
      price: parameters.price,
      slippage: parameters.slippage || 1
    };
    
    // Create the limit order
    const result = await BlockchainService.createLimitOrder(agent.owner, orderData);
    
    return ActionResult.success('trade', {
      type: 'limit',
      orderId: result.orderId,
      inputToken: parameters.inputToken,
      outputToken: parameters.outputToken,
      inputAmount: parameters.amount,
      price: parameters.price,
      expectedOutput: parameters.amount * parameters.price,
      status: 'open',
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Execute a Dollar-Cost Averaging (DCA) strategy
   * @param {Object} parameters - DCA parameters
   * @param {Object} agent - Agent executing the action
   * @returns {Promise<Object>} DCA setup result
   */
  executeDCA: async (parameters, agent) => {
    // Validate required parameters
    if (!parameters.inputToken || !parameters.outputToken || !parameters.amount || !parameters.frequency) {
      throw new Error('Missing required parameters for DCA: inputToken, outputToken, amount, frequency');
    }
    
    // In a real implementation, this would create a scheduled task
    // For MVP, we're simulating the result
    logger.info(`Setting up DCA strategy: ${parameters.amount} ${parameters.inputToken} -> ${parameters.outputToken} ${parameters.frequency}`);
    
    return ActionResult.success('trade', {
      type: 'dca',
      strategy: 'dollar_cost_averaging',
      inputToken: parameters.inputToken,
      outputToken: parameters.outputToken,
      amount: parameters.amount,
      frequency: parameters.frequency,
      status: 'scheduled',
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Execute a buy order
   * @param {Object} parameters - Buy parameters
   * @param {Object} agent - Agent executing the action
   * @returns {Promise<Object>} Buy result
   */
  executeBuy: async (parameters, agent) => {
    // Buy is essentially a swap with USDC/USDT/SOL as input
    return await TradeModule.executeSwap({
      ...parameters,
      inputToken: parameters.payWith || 'USDC',
      outputToken: parameters.token,
      amount: parameters.amount,
      action: 'swap'
    }, agent);
  },

  /**
   * Execute a sell order
   * @param {Object} parameters - Sell parameters
   * @param {Object} agent - Agent executing the action
   * @returns {Promise<Object>} Sell result
   */
  executeSell: async (parameters, agent) => {
    // Sell is essentially a swap with the token as input
    return await TradeModule.executeSwap({
      ...parameters,
      inputToken: parameters.token,
      outputToken: parameters.receiveIn || 'USDC',
      amount: parameters.amount,
      action: 'swap'
    }, agent);
  }
};

module.exports = TradeModule; 