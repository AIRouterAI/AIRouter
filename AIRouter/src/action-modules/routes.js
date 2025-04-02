/**
 * Action Modules API Routes
 * Endpoints for directly executing actions without agent processing
 */

const express = require('express');
const router = express.Router();
const actionModules = require('./index');
const authMiddleware = require('../identity/middleware');
const energyMiddleware = require('../energy/middleware');
const AgentModel = require('../agent-engine/models/agent');
const logger = require('../utils/logger');
const Joi = require('joi');

/**
 * Validate action execution request
 */
const validateAction = (req, res, next) => {
  const schema = Joi.object({
    actionType: Joi.string().required(),
    parameters: Joi.object().required(),
    agentId: Joi.string().required()
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: {
        message: 'Invalid action request',
        details: error.details[0].message
      }
    });
  }
  
  next();
};

/**
 * Execute an action directly
 */
router.post('/execute', 
  authMiddleware.authenticate,
  validateAction,
  energyMiddleware.checkEnergy,
  async (req, res, next) => {
    try {
      const { actionType, parameters, agentId } = req.body;
      
      // Get the agent
      const agent = await AgentModel.findById(agentId);
      
      if (!agent) {
        return res.status(404).json({
          error: {
            message: 'Agent not found'
          }
        });
      }
      
      // Check ownership
      if (agent.owner !== req.user.walletAddress) {
        return res.status(403).json({
          error: {
            message: 'You do not have permission to use this agent'
          }
        });
      }
      
      // Check if agent has permission for this action
      if (agent.permissions.length > 0 && !agent.permissions.includes(actionType)) {
        return res.status(403).json({
          error: {
            message: `Agent does not have permission for ${actionType} actions`
          }
        });
      }
      
      // Execute the action
      const result = await actionModules.executeAction(actionType, parameters, agent);
      
      // Deduct energy
      await energyMiddleware.deductEnergy(req.user.walletAddress, req.energyCost, actionType);
      
      // Update agent stats
      agent.lastActivity = new Date();
      agent.energyUsed += req.energyCost;
      await agent.save();
      
      res.status(200).json(result);
    } catch (error) {
      logger.error(`Error executing action: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Get available action types
 */
router.get('/types', (req, res) => {
  // Get all action types supported by the system
  const actionTypes = Object.keys(actionModules)
    .filter(key => typeof actionModules[key] !== 'function');
  
  res.status(200).json({
    actionTypes
  });
});

/**
 * Get parameters schema for an action type
 */
router.get('/schema/:actionType', (req, res) => {
  const { actionType } = req.params;
  
  // Get the module for this action type
  const module = actionModules.getModuleByType(actionType);
  
  if (!module) {
    return res.status(404).json({
      error: {
        message: `Action type ${actionType} not found`
      }
    });
  }
  
  // Get the parameters schema for this action type
  const schema = module.getParametersSchema ? module.getParametersSchema() : {
    type: 'object',
    properties: {},
    required: []
  };
  
  res.status(200).json(schema);
});

module.exports = router; 