/**
 * Agent Engine Validators
 * Input validation middleware for agent-related operations
 */

const Joi = require('joi');

// Schema for agent creation
const createAgentSchema = Joi.object({
  name: Joi.string().min(2).max(50).required()
    .messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
  
  description: Joi.string().min(10).max(500).required()
    .messages({
      'string.base': 'Description must be a string',
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 500 characters',
      'any.required': 'Description is required'
    }),
  
  type: Joi.string().valid('trading', 'nft', 'social', 'dao', 'ecommerce', 'custom').required()
    .messages({
      'string.base': 'Type must be a string',
      'string.empty': 'Type is required',
      'any.only': 'Type must be one of trading, nft, social, dao, ecommerce, or custom',
      'any.required': 'Type is required'
    }),
  
  permissions: Joi.array().items(
    Joi.string().valid('trade', 'mint', 'social', 'monitor', 'schedule')
  ).unique(),
  
  parameters: Joi.object().unknown(true)
});

// Schema for agent updates
const updateAgentSchema = Joi.object({
  name: Joi.string().min(2).max(50)
    .messages({
      'string.base': 'Name must be a string',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  
  description: Joi.string().min(10).max(500)
    .messages({
      'string.base': 'Description must be a string',
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  status: Joi.string().valid('active', 'inactive')
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be either active or inactive'
    }),
  
  permissions: Joi.array().items(
    Joi.string().valid('trade', 'mint', 'social', 'monitor', 'schedule')
  ).unique(),
  
  parameters: Joi.object().unknown(true)
}).min(1); // At least one field must be provided

// Middleware to validate agent creation
function validateAgentCreate(req, res, next) {
  const { error, value } = createAgentSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      error: {
        message: 'Validation error',
        details: errorMessages
      }
    });
  }
  
  // Validation passed, update req.body with validated data
  req.body = value;
  next();
}

// Middleware to validate agent updates
function validateAgentUpdate(req, res, next) {
  const { error, value } = updateAgentSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      error: {
        message: 'Validation error',
        details: errorMessages
      }
    });
  }
  
  // Validation passed, update req.body with validated data
  req.body = value;
  next();
}

module.exports = {
  validateAgentCreate,
  validateAgentUpdate
}; 