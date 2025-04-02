/**
 * Identity Middleware
 * Middleware for user authentication and authorization
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const UserModel = require('./models/user');

/**
 * Identity Middleware Functions
 */
const authMiddleware = {
  /**
   * Authenticate user using JWT token
   */
  authenticate: async (req, res, next) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: {
            message: 'Authentication required'
          }
        });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Check if user exists
      const user = await UserModel.findOne({ walletAddress: decoded.walletAddress });
      if (!user) {
        return res.status(401).json({
          error: {
            message: 'User not found'
          }
        });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          error: {
            message: 'User account is inactive'
          }
        });
      }
      
      // Add user to request
      req.user = {
        walletAddress: decoded.walletAddress,
        telegramId: decoded.telegramId,
        role: decoded.role
      };
      
      // Update last active timestamp
      user.stats.lastActive = new Date();
      await user.save();
      
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: {
            message: 'Invalid or expired token'
          }
        });
      }
      
      logger.error(`Authentication error: ${error.message}`);
      next(error);
    }
  },

  /**
   * Check if user has required role
   * @param {String|Array} roles - Role or array of roles that have access
   */
  checkRole: (roles) => {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: {
              message: 'Authentication required'
            }
          });
        }
        
        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({
            error: {
              message: 'Insufficient permissions'
            }
          });
        }
        
        next();
      } catch (error) {
        logger.error(`Role check error: ${error.message}`);
        next(error);
      }
    };
  },

  /**
   * Check if user has Telegram connected
   */
  requireTelegram: (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            message: 'Authentication required'
          }
        });
      }
      
      if (!req.user.telegramId) {
        return res.status(403).json({
          error: {
            message: 'Telegram connection required'
          }
        });
      }
      
      next();
    } catch (error) {
      logger.error(`Telegram check error: ${error.message}`);
      next(error);
    }
  },

  /**
   * Check if user is the owner of the resource
   * @param {Function} getOwnerId - Function to extract owner wallet from request
   */
  checkOwnership: (getOwnerId) => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: {
              message: 'Authentication required'
            }
          });
        }
        
        // Get owner wallet address from the request
        const ownerId = await getOwnerId(req);
        
        // Compare with authenticated user
        if (ownerId !== req.user.walletAddress) {
          return res.status(403).json({
            error: {
              message: 'You do not have permission to access this resource'
            }
          });
        }
        
        next();
      } catch (error) {
        logger.error(`Ownership check error: ${error.message}`);
        next(error);
      }
    };
  }
};

module.exports = authMiddleware; 