/**
 * Agent Engine
 * Core system for managing AI agents and interpreting user intent
 */

const { Configuration, OpenAIApi } = require('openai');
const config = require('../config');
const logger = require('../utils/logger');
const AgentModel = require('./models/agent');
const IntentModel = require('./models/intent');
const actionModules = require('../action-modules');

// Initialize OpenAI client
const openaiConfig = new Configuration({
  apiKey: config.openai.apiKey,
});
const openai = new OpenAIApi(openaiConfig);

/**
 * Agent Engine Module
 */
const AgentEngine = {
  /**
   * Initialize the Agent Engine
   */
  init: () => {
    logger.info('Initializing Agent Engine...');
    // Perform any startup initialization
    logger.info('Agent Engine initialized successfully');
  },

  /**
   * Create a new agent for a user
   * @param {Object} userData - User data including wallet and telegram
   * @param {Object} agentData - Agent configuration data
   * @returns {Promise<Object>} Created agent object
   */
  createAgent: async (userData, agentData) => {
    logger.info(`Creating new agent for user: ${userData.walletAddress}`);
    
    try {
      // Validate user has not exceeded max agent limit
      const existingAgents = await AgentModel.countDocuments({ owner: userData.walletAddress });
      if (existingAgents >= config.agent.maxAgentsPerUser) {
        throw new Error(`Maximum number of agents (${config.agent.maxAgentsPerUser}) reached`);
      }
      
      // Create new agent
      const agent = new AgentModel({
        name: agentData.name,
        description: agentData.description,
        owner: userData.walletAddress,
        telegramId: userData.telegramId,
        type: agentData.type,
        permissions: agentData.permissions || [],
        parameters: agentData.parameters || {},
        status: 'active'
      });
      
      await agent.save();
      logger.info(`Agent created: ${agent._id}`);
      return agent;
    } catch (error) {
      logger.error(`Error creating agent: ${error.message}`);
      throw error;
    }
  },

  /**
   * Process user input to determine intent and execute actions
   * @param {String} agentId - ID of the agent to process input
   * @param {String} userInput - Natural language input from user
   * @returns {Promise<Object>} Action results
   */
  processInput: async (agentId, userInput) => {
    logger.info(`Processing input for agent: ${agentId}`);
    
    try {
      // Get agent details
      const agent = await AgentModel.findById(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      // Determine user intent
      const intent = await AgentEngine.determineIntent(userInput, agent);
      
      // Save intent for analysis
      await new IntentModel({
        agent: agentId,
        input: userInput,
        intentType: intent.type,
        confidence: intent.confidence,
        parameters: intent.parameters
      }).save();
      
      // Execute action based on intent
      const result = await AgentEngine.executeAction(intent, agent);
      
      return {
        intent,
        result
      };
    } catch (error) {
      logger.error(`Error processing input: ${error.message}`);
      throw error;
    }
  },

  /**
   * Determine user intent from natural language input
   * @param {String} input - User input
   * @param {Object} agent - Agent context
   * @returns {Promise<Object>} Intent details
   */
  determineIntent: async (input, agent) => {
    try {
      // Use OpenAI to analyze intent
      const prompt = `
        Based on the following input from a user to an AI agent, determine the intent and extract parameters.
        The agent's purpose is: ${agent.description}
        The agent's type is: ${agent.type}
        
        User input: "${input}"
        
        Provide a JSON response with:
        - type: The type of intent (trade, mint, social, monitor, schedule, etc.)
        - confidence: A value from 0 to 1 indicating confidence in the intent
        - parameters: Extracted parameters related to this intent
      `;
      
      const response = await openai.createCompletion({
        model: config.openai.model,
        prompt,
        max_tokens: config.openai.maxTokens,
        temperature: 0.3,
      });
      
      const content = response.data.choices[0].text.trim();
      let intentData;
      
      try {
        intentData = JSON.parse(content);
      } catch (e) {
        // If OpenAI doesn't return valid JSON, use a simple fallback
        intentData = {
          type: 'unknown',
          confidence: 0.3,
          parameters: {}
        };
      }
      
      logger.info(`Intent determined: ${intentData.type} (${intentData.confidence})`);
      return intentData;
    } catch (error) {
      logger.error(`Error determining intent: ${error.message}`);
      // Fallback to a basic intent analysis
      return {
        type: 'unknown',
        confidence: 0.1,
        parameters: {}
      };
    }
  },

  /**
   * Execute an action based on the determined intent
   * @param {Object} intent - The determined intent
   * @param {Object} agent - The agent executing the action
   * @returns {Promise<Object>} Action result
   */
  executeAction: async (intent, agent) => {
    logger.info(`Executing action for intent: ${intent.type}`);
    
    try {
      // Check if agent has permission for this intent
      if (agent.permissions.length > 0 && !agent.permissions.includes(intent.type)) {
        throw new Error(`Agent does not have permission for ${intent.type} actions`);
      }
      
      // Get the appropriate action module
      const actionModule = actionModules[intent.type];
      if (!actionModule) {
        throw new Error(`No action module available for intent: ${intent.type}`);
      }
      
      // Execute the action
      const result = await actionModule.execute(intent.parameters, agent);
      
      logger.info(`Action executed successfully for intent: ${intent.type}`);
      return result;
    } catch (error) {
      logger.error(`Error executing action: ${error.message}`);
      throw error;
    }
  },

  /**
   * Get all agents for a user
   * @param {String} walletAddress - User's wallet address
   * @returns {Promise<Array>} List of user's agents
   */
  getUserAgents: async (walletAddress) => {
    logger.info(`Getting agents for user: ${walletAddress}`);
    
    try {
      const agents = await AgentModel.find({ owner: walletAddress });
      return agents;
    } catch (error) {
      logger.error(`Error getting user agents: ${error.message}`);
      throw error;
    }
  },

  /**
   * Update an existing agent
   * @param {String} agentId - ID of the agent to update
   * @param {Object} updateData - New agent data
   * @returns {Promise<Object>} Updated agent
   */
  updateAgent: async (agentId, updateData) => {
    logger.info(`Updating agent: ${agentId}`);
    
    try {
      const agent = await AgentModel.findByIdAndUpdate(
        agentId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      logger.info(`Agent updated: ${agentId}`);
      return agent;
    } catch (error) {
      logger.error(`Error updating agent: ${error.message}`);
      throw error;
    }
  }
};

module.exports = AgentEngine; 