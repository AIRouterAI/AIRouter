/**
 * Task Model
 * Database schema for scheduled tasks
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    type: String, // Wallet address
    required: true,
    index: true
  },
  agent: {
    type: Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
    index: true
  },
  input: {
    type: String,
    required: true
  },
  schedule: {
    type: String, // Cron expression
    index: true
  },
  nextExecutionTime: {
    type: Date,
    required: true,
    index: true
  },
  lastExecutionTime: {
    type: Date
  },
  lastExecutionStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  lastExecutionResult: {
    type: String
  },
  executionCount: {
    type: Number,
    default: 0
  },
  energyCost: {
    type: Number,
    default: 15,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  tags: [{
    type: String
  }],
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  }
}, { 
  timestamps: true 
});

// Define indexes
TaskSchema.index({ owner: 1, isActive: 1 });
TaskSchema.index({ owner: 1, agent: 1 });
TaskSchema.index({ nextExecutionTime: 1, isActive: 1 });

// Method to format task data for API response
TaskSchema.methods.formatForAPI = function() {
  const task = this.toObject();
  
  // Add human-readable schedule description
  if (task.schedule) {
    task.scheduleDescription = describeSchedule(task.schedule);
  }
  
  // Add relative time descriptions
  task.nextExecutionRelative = formatRelativeTime(task.nextExecutionTime);
  
  if (task.lastExecutionTime) {
    task.lastExecutionRelative = formatRelativeTime(task.lastExecutionTime);
  }
  
  return task;
};

// Virtual for checking if the task is recurring
TaskSchema.virtual('isRecurring').get(function() {
  return !!this.schedule;
});

/**
 * Generate a human-readable description of a cron schedule
 * @param {String} cronExpression - Cron expression
 * @returns {String} Human-readable description
 */
function describeSchedule(cronExpression) {
  try {
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) return 'Custom schedule';
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    // Some common patterns
    if (minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return 'Daily at midnight';
    }
    
    if (minute === '0' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return 'Hourly';
    }
    
    if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return 'Every minute';
    }
    
    if (minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '0') {
      return 'Weekly on Sunday';
    }
    
    if (minute === '0' && hour === '0' && dayOfMonth === '1' && month === '*' && dayOfWeek === '*') {
      return 'Monthly on the 1st';
    }
    
    return 'Custom schedule';
  } catch (error) {
    return 'Invalid schedule';
  }
}

/**
 * Format a date as a relative time description
 * @param {Date} date - Date to format
 * @returns {String} Relative time description
 */
function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = date - now;
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);
  
  if (diffSeconds < 0) {
    // In the past
    if (diffSeconds > -60) return 'Just now';
    if (diffMinutes > -60) return `${Math.abs(diffMinutes)} minutes ago`;
    if (diffHours > -24) return `${Math.abs(diffHours)} hours ago`;
    if (diffDays > -30) return `${Math.abs(diffDays)} days ago`;
    return date.toLocaleDateString();
  } else {
    // In the future
    if (diffSeconds < 60) return 'In less than a minute';
    if (diffMinutes < 60) return `In ${diffMinutes} minutes`;
    if (diffHours < 24) return `In ${diffHours} hours`;
    if (diffDays < 30) return `In ${diffDays} days`;
    return date.toLocaleDateString();
  }
}

module.exports = mongoose.model('Task', TaskSchema); 