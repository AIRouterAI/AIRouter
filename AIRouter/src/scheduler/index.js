/**
 * Task Scheduler
 * Manages scheduled tasks and recurring agent actions
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const TaskModel = require('./models/task');
const AgentEngine = require('../agent-engine');
const EnergySystem = require('../energy');

/**
 * Task Scheduler
 */
const TaskScheduler = {
  /**
   * Initialize the Task Scheduler
   */
  init: () => {
    logger.info('Initializing Task Scheduler...');
    
    // Start the scheduler
    TaskScheduler.startScheduler();
    
    logger.info('Task Scheduler initialized successfully');
  },

  /**
   * Start the task scheduler
   */
  startScheduler: async () => {
    try {
      // Schedule task processor to run every minute
      cron.schedule('* * * * *', async () => {
        await TaskScheduler.processScheduledTasks();
      });
      
      // Schedule daily task to clean up completed tasks
      cron.schedule('0 0 * * *', async () => {
        await TaskScheduler.cleanupCompletedTasks();
      });
      
      logger.info('Task scheduler started');
    } catch (error) {
      logger.error(`Error starting task scheduler: ${error.message}`);
    }
  },

  /**
   * Process scheduled tasks
   */
  processScheduledTasks: async () => {
    try {
      const now = new Date();
      
      // Find tasks that need to be executed
      const tasks = await TaskModel.find({
        nextExecutionTime: { $lte: now },
        isActive: true
      });
      
      logger.info(`Processing ${tasks.length} scheduled tasks`);
      
      // Process each task
      for (const task of tasks) {
        try {
          // Check if we have enough energy to execute the task
          const userEnergy = await EnergySystem.getBalance(task.owner);
          if (userEnergy < task.energyCost) {
            logger.warn(`Insufficient energy for task ${task._id}, owner: ${task.owner}`);
            
            // Update task status
            task.lastExecutionTime = now;
            task.lastExecutionStatus = 'failed';
            task.lastExecutionResult = 'Insufficient energy';
            
            // Update next execution time based on schedule
            if (task.schedule) {
              task.nextExecutionTime = calculateNextExecutionTime(task.schedule, now);
            } else {
              // If it's a one-time task, deactivate it
              task.isActive = false;
            }
            
            await task.save();
            continue;
          }
          
          // Execute the task
          const result = await AgentEngine.processInput(
            task.agent,
            task.input
          );
          
          // Deduct energy
          await EnergySystem.deductEnergy(task.owner, task.energyCost, 'schedule');
          
          // Update task status
          task.lastExecutionTime = now;
          task.lastExecutionStatus = 'success';
          task.lastExecutionResult = JSON.stringify(result);
          task.executionCount += 1;
          
          // Update next execution time based on schedule
          if (task.schedule) {
            task.nextExecutionTime = calculateNextExecutionTime(task.schedule, now);
          } else {
            // If it's a one-time task, deactivate it
            task.isActive = false;
          }
          
          await task.save();
          logger.info(`Successfully executed task ${task._id}`);
        } catch (error) {
          logger.error(`Error executing task ${task._id}: ${error.message}`);
          
          // Update task with error
          task.lastExecutionTime = now;
          task.lastExecutionStatus = 'failed';
          task.lastExecutionResult = error.message;
          
          // Update next execution time based on schedule
          if (task.schedule) {
            task.nextExecutionTime = calculateNextExecutionTime(task.schedule, now);
          } else {
            // If it's a one-time task, deactivate it
            task.isActive = false;
          }
          
          await task.save();
        }
      }
    } catch (error) {
      logger.error(`Error processing scheduled tasks: ${error.message}`);
    }
  },

  /**
   * Create a new task
   * @param {Object} taskData - Task configuration
   * @returns {Promise<Object>} Created task
   */
  createTask: async (taskData) => {
    try {
      // Calculate next execution time
      let nextExecutionTime;
      
      if (taskData.schedule) {
        // If it's a recurring task
        nextExecutionTime = calculateNextExecutionTime(taskData.schedule);
      } else if (taskData.executionTime) {
        // If it's a one-time task
        nextExecutionTime = new Date(taskData.executionTime);
      } else {
        // Default to immediate execution
        nextExecutionTime = new Date();
      }
      
      // Create task
      const task = new TaskModel({
        name: taskData.name,
        description: taskData.description,
        owner: taskData.owner,
        agent: taskData.agent,
        input: taskData.input,
        schedule: taskData.schedule,
        nextExecutionTime,
        energyCost: taskData.energyCost || 15,
        isActive: true
      });
      
      await task.save();
      logger.info(`Task created: ${task._id}`);
      
      return task;
    } catch (error) {
      logger.error(`Error creating task: ${error.message}`);
      throw error;
    }
  },

  /**
   * Update an existing task
   * @param {String} taskId - Task ID
   * @param {Object} updateData - Updated task data
   * @returns {Promise<Object>} Updated task
   */
  updateTask: async (taskId, updateData) => {
    try {
      // Find task
      const task = await TaskModel.findById(taskId);
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Update fields
      if (updateData.name) task.name = updateData.name;
      if (updateData.description) task.description = updateData.description;
      if (updateData.input) task.input = updateData.input;
      
      // If schedule is updated, recalculate next execution time
      if (updateData.schedule) {
        task.schedule = updateData.schedule;
        task.nextExecutionTime = calculateNextExecutionTime(updateData.schedule);
      }
      
      if (updateData.isActive !== undefined) task.isActive = updateData.isActive;
      if (updateData.energyCost) task.energyCost = updateData.energyCost;
      
      await task.save();
      logger.info(`Task updated: ${taskId}`);
      
      return task;
    } catch (error) {
      logger.error(`Error updating task: ${error.message}`);
      throw error;
    }
  },

  /**
   * Delete a task
   * @param {String} taskId - Task ID
   * @returns {Promise<Boolean>} Success status
   */
  deleteTask: async (taskId) => {
    try {
      // Delete task
      await TaskModel.findByIdAndDelete(taskId);
      logger.info(`Task deleted: ${taskId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting task: ${error.message}`);
      throw error;
    }
  },

  /**
   * Get all tasks for a user
   * @param {String} walletAddress - User's wallet address
   * @returns {Promise<Array>} List of tasks
   */
  getUserTasks: async (walletAddress) => {
    try {
      const tasks = await TaskModel.find({ owner: walletAddress })
        .sort({ nextExecutionTime: 1 });
      
      return tasks;
    } catch (error) {
      logger.error(`Error getting user tasks: ${error.message}`);
      throw error;
    }
  },

  /**
   * Clean up completed one-time tasks
   * @returns {Promise<Number>} Number of tasks cleaned up
   */
  cleanupCompletedTasks: async () => {
    try {
      // Find inactive one-time tasks older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await TaskModel.deleteMany({
        isActive: false,
        schedule: null,
        lastExecutionTime: { $lt: thirtyDaysAgo }
      });
      
      logger.info(`Cleaned up ${result.deletedCount} completed tasks`);
      return result.deletedCount;
    } catch (error) {
      logger.error(`Error cleaning up tasks: ${error.message}`);
      throw error;
    }
  }
};

/**
 * Calculate the next execution time based on schedule
 * @param {String} schedule - Cron schedule expression
 * @param {Date} from - Starting date (defaults to now)
 * @returns {Date} Next execution time
 */
function calculateNextExecutionTime(schedule, from = new Date()) {
  try {
    // Parse the cron schedule to get the next execution time
    const interval = cron.schedule(schedule, () => {});
    const nextDate = interval.nextDate().toDate();
    interval.stop();
    
    return nextDate;
  } catch (error) {
    logger.error(`Error calculating next execution time: ${error.message}`);
    // Default to one day from now if there's an error
    const tomorrow = new Date(from);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
}

module.exports = TaskScheduler; 