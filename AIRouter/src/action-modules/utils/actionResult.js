/**
 * Action Result Utility
 * Standardizes results format for all action modules
 */

/**
 * Action Result Factory
 */
const ActionResult = {
  /**
   * Create a success result
   * @param {String} type - Action type
   * @param {Object} data - Result data
   * @returns {Object} Formatted success result
   */
  success: (type, data) => {
    return {
      success: true,
      type,
      data,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Create a failure result
   * @param {String} type - Action type
   * @param {String} message - Error message
   * @param {Object} details - Additional error details
   * @returns {Object} Formatted failure result
   */
  failure: (type, message, details = {}) => {
    return {
      success: false,
      type,
      error: {
        message,
        details
      },
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Create a pending result
   * @param {String} type - Action type
   * @param {String} message - Status message
   * @param {Object} data - Additional data
   * @returns {Object} Formatted pending result
   */
  pending: (type, message, data = {}) => {
    return {
      success: null,
      type,
      status: 'pending',
      message,
      data,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Format a result for human-readable output
   * @param {Object} result - Action result
   * @returns {String} Human-readable result
   */
  formatForHuman: (result) => {
    if (!result) {
      return 'No result available';
    }
    
    if (result.success === true) {
      return `Successfully executed ${result.type} action. ${formatDataSummary(result.data)}`;
    } else if (result.success === false) {
      return `Failed to execute ${result.type} action: ${result.error.message}`;
    } else {
      return `${result.type} action is ${result.status}: ${result.message}`;
    }
  }
};

/**
 * Generate a summary of action data
 * @param {Object} data - Result data
 * @returns {String} Summary
 */
function formatDataSummary(data) {
  if (!data) return '';
  
  switch (data.type) {
    case 'swap':
      return `Swapped ${data.inputAmount} ${data.inputToken} for ${data.outputAmount} ${data.outputToken}.`;
    
    case 'limit':
      return `Created limit order to exchange ${data.inputAmount} ${data.inputToken} for ${data.expectedOutput} ${data.outputToken} at price ${data.price}.`;
    
    case 'dca':
      return `Set up DCA strategy to buy ${data.outputToken} with ${data.amount} ${data.inputToken} ${data.frequency}.`;
    
    case 'mint':
      return `Minted NFT "${data.name}" with mint address ${data.mint}.`;
    
    case 'social':
      return `Posted to ${data.platform}: "${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}"`;
    
    case 'monitor':
      return `Set up monitoring for ${data.target} with alert threshold ${data.threshold}.`;
    
    default:
      // For unknown types, create a generic summary
      const keys = Object.keys(data).filter(k => k !== 'type' && k !== 'timestamp');
      if (keys.length === 0) return '';
      
      const summary = keys.map(k => `${k}: ${typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k]}`).join(', ');
      return summary;
  }
}

module.exports = ActionResult; 