/**
 * Scheduler API Routes
 * Endpoints for creating and managing scheduled tasks
 */

const express = require('express');
const router = express.Router();
const TaskScheduler = require('./index');
const authMiddleware = require('../identity/middleware');
const energyMiddleware = require('../energy/middleware');
const logger = require('../utils/logger');
const Joi = require('joi');

/**
 * Validate task creation request
 */
const validateTaskCreate = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500),
    agent: Joi.string().required(),
    input: Joi.string().required(),
    schedule: Joi.string().pattern(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/),
    executionTime: Joi.date().min('now'),
    energyCost: Joi.number().integer().min(1).max(100),
    tags: Joi.array().items(Joi.string()),
    metadata: Joi.object()
  }).xor('schedule', 'executionTime');
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: {
        message: 'Invalid task data',
        details: error.details[0].message
      }
    });
  }
  
  next();
};

/**
 * Validate task update request
 */
const validateTaskUpdate = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().max(500),
    input: Joi.string(),
    schedule: Joi.string().pattern(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/),
    executionTime: Joi.date().min('now'),
    isActive: Joi.boolean(),
    energyCost: Joi.number().integer().min(1).max(100),
    tags: Joi.array().items(Joi.string()),
    metadata: Joi.object()
  }).min(1);
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: {
        message: 'Invalid update data',
        details: error.details[0].message
      }
    });
  }
  
  next();
};

/**
 * Get all tasks for the authenticated user
 */
router.get('/', authMiddleware.authenticate, async (req, res, next) => {
  try {
    const tasks = await TaskScheduler.getUserTasks(req.user.walletAddress);
    
    // Format tasks for API response
    const formattedTasks = tasks.map(task => task.formatForAPI());
    
    res.status(200).json(formattedTasks);
  } catch (error) {
    logger.error(`Error getting tasks: ${error.message}`);
    next(error);
  }
});

/**
 * Create a new task
 */
router.post('/', 
  authMiddleware.authenticate,
  validateTaskCreate,
  energyMiddleware.checkEnergy,
  async (req, res, next) => {
    try {
      const taskData = {
        ...req.body,
        owner: req.user.walletAddress
      };
      
      const task = await TaskScheduler.createTask(taskData);
      
      // Deduct energy for task creation
      await energyMiddleware.deductEnergy(req.user.walletAddress, req.energyCost, 'schedule');
      
      res.status(201).json(task.formatForAPI());
    } catch (error) {
      logger.error(`Error creating task: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Get task by ID
 */
router.get('/:taskId', 
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const task = await TaskScheduler.getTaskById(req.params.taskId);
      
      if (!task) {
        return res.status(404).json({
          error: {
            message: 'Task not found'
          }
        });
      }
      
      // Check ownership
      if (task.owner !== req.user.walletAddress) {
        return res.status(403).json({
          error: {
            message: 'You do not have permission to access this task'
          }
        });
      }
      
      res.status(200).json(task.formatForAPI());
    } catch (error) {
      logger.error(`Error getting task: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Update a task
 */
router.put('/:taskId', 
  authMiddleware.authenticate,
  validateTaskUpdate,
  async (req, res, next) => {
    try {
      // Verify ownership first
      const task = await TaskScheduler.getTaskById(req.params.taskId);
      
      if (!task) {
        return res.status(404).json({
          error: {
            message: 'Task not found'
          }
        });
      }
      
      if (task.owner !== req.user.walletAddress) {
        return res.status(403).json({
          error: {
            message: 'You do not have permission to update this task'
          }
        });
      }
      
      // Update the task
      const updatedTask = await TaskScheduler.updateTask(req.params.taskId, req.body);
      
      res.status(200).json(updatedTask.formatForAPI());
    } catch (error) {
      logger.error(`Error updating task: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Delete a task
 */
router.delete('/:taskId', 
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      // Verify ownership first
      const task = await TaskScheduler.getTaskById(req.params.taskId);
      
      if (!task) {
        return res.status(404).json({
          error: {
            message: 'Task not found'
          }
        });
      }
      
      if (task.owner !== req.user.walletAddress) {
        return res.status(403).json({
          error: {
            message: 'You do not have permission to delete this task'
          }
        });
      }
      
      // Delete the task
      await TaskScheduler.deleteTask(req.params.taskId);
      
      res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting task: ${error.message}`);
      next(error);
    }
  }
);

/**
 * Run a task immediately
 */
router.post('/:taskId/run', 
  authMiddleware.authenticate,
  energyMiddleware.checkEnergy,
  async (req, res, next) => {
    try {
      // Verify ownership first
      const task = await TaskScheduler.getTaskById(req.params.taskId);
      
      if (!task) {
        return res.status(404).json({
          error: {
            message: 'Task not found'
          }
        });
      }
      
      if (task.owner !== req.user.walletAddress) {
        return res.status(403).json({
          error: {
            message: 'You do not have permission to run this task'
          }
        });
      }
      
      // Run the task immediately
      const result = await TaskScheduler.runTaskImmediately(req.params.taskId);
      
      // Deduct energy
      await energyMiddleware.deductEnergy(req.user.walletAddress, req.energyCost, 'schedule');
      
      res.status(200).json(result);
    } catch (error) {
      logger.error(`Error running task: ${error.message}`);
      next(error);
    }
  }
);

module.exports = router; 