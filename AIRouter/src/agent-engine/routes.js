/**
 * Agent Engine API Routes
 * Handles agent creation, management, and input processing
 */

const express = require('express');
const router = express.Router();
const AgentEngine = require('./index');
const authMiddleware = require('../identity/middleware');
const energyMiddleware = require('../energy/middleware');
const logger = require('../utils/logger');
const { validateAgentCreate, validateAgentUpdate } = require('./validators');

// Get all agents for the authenticated user
router.get('/', authMiddleware.authenticate, async (req, res, next) => {
  try {
    const agents = await AgentEngine.getUserAgents(req.user.walletAddress);
    res.status(200).json(agents);
  } catch (error) {
    next(error);
  }
});

// Get agent by ID
router.get('/:agentId', authMiddleware.authenticate, async (req, res, next) => {
  try {
    const agent = await AgentEngine.getAgentById(req.params.agentId);
    
    // Ensure the user owns the agent
    if (agent.owner !== req.user.walletAddress) {
      return res.status(403).json({
        error: { message: 'You do not have permission to access this agent' }
      });
    }
    
    res.status(200).json(agent);
  } catch (error) {
    next(error);
  }
});

// Create a new agent
router.post('/', 
  authMiddleware.authenticate, 
  validateAgentCreate,
  async (req, res, next) => {
    try {
      const userData = {
        walletAddress: req.user.walletAddress,
        telegramId: req.user.telegramId
      };
      
      const agent = await AgentEngine.createAgent(userData, req.body);
      res.status(201).json(agent);
    } catch (error) {
      next(error);
    }
  }
);

// Update an agent
router.put('/:agentId', 
  authMiddleware.authenticate, 
  validateAgentUpdate,
  async (req, res, next) => {
    try {
      // Get agent and verify ownership
      const agent = await AgentEngine.getAgentById(req.params.agentId);
      
      if (agent.owner !== req.user.walletAddress) {
        return res.status(403).json({
          error: { message: 'You do not have permission to update this agent' }
        });
      }
      
      const updatedAgent = await AgentEngine.updateAgent(req.params.agentId, req.body);
      res.status(200).json(updatedAgent);
    } catch (error) {
      next(error);
    }
  }
);

// Delete an agent
router.delete('/:agentId', 
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      // Get agent and verify ownership
      const agent = await AgentEngine.getAgentById(req.params.agentId);
      
      if (agent.owner !== req.user.walletAddress) {
        return res.status(403).json({
          error: { message: 'You do not have permission to delete this agent' }
        });
      }
      
      await AgentEngine.deleteAgent(req.params.agentId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
);

// Process input for an agent
router.post('/:agentId/process', 
  authMiddleware.authenticate,
  energyMiddleware.checkEnergy,
  async (req, res, next) => {
    try {
      // Get agent and verify ownership
      const agent = await AgentEngine.getAgentById(req.params.agentId);
      
      if (agent.owner !== req.user.walletAddress) {
        return res.status(403).json({
          error: { message: 'You do not have permission to use this agent' }
        });
      }
      
      // Check agent status
      if (agent.status !== 'active') {
        return res.status(400).json({
          error: { message: `Agent is ${agent.status}` }
        });
      }
      
      // Process the input
      const input = req.body.input;
      if (!input) {
        return res.status(400).json({
          error: { message: 'Input is required' }
        });
      }
      
      const result = await AgentEngine.processInput(req.params.agentId, input);
      
      // Deduct energy cost based on action type
      const energyCost = req.energyCost || 10; // Default cost if not determined by middleware
      await energyMiddleware.deductEnergy(req.user.walletAddress, energyCost);
      
      res.status(200).json(result);
    } catch (error) {
      logger.error(`Error processing agent input: ${error.message}`);
      next(error);
    }
  }
);

// Get agent statistics
router.get('/:agentId/stats', 
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      // Get agent and verify ownership
      const agent = await AgentEngine.getAgentById(req.params.agentId);
      
      if (agent.owner !== req.user.walletAddress) {
        return res.status(403).json({
          error: { message: 'You do not have permission to access this agent' }
        });
      }
      
      const stats = await AgentEngine.getAgentStats(req.params.agentId);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router; 