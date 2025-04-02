/**
 * Logger Utility
 * Centralized logging configuration using Winston
 */

const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Determine log level based on environment
const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Create the logger instance
const logger = winston.createLogger({
  level,
  levels: logLevels,
  format: logFormat,
  transports: [
    // Console transport for all logs
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    }),
    // File transport for error logs
    new winston.transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error'
    }),
    // File transport for all logs
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log')
    })
  ]
});

// Create log directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Add stream for Morgan HTTP request logging
logger.stream = {
  write: (message) => logger.http(message.trim())
};

module.exports = logger; 