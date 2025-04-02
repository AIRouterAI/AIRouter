/**
 * Marketplace Validators
 * Input validation for marketplace operations
 */

const Joi = require('joi');

/**
 * Validate a marketplace listing
 * @param {Object} data - Listing data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} Validation result
 */
const validateListing = (data, isUpdate = false) => {
  // Create base schema
  const baseSchema = {
    agentId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    price: Joi.number().min(0),
    description: Joi.string().max(2000),
    shortDescription: Joi.string().max(150),
    tags: Joi.array().items(Joi.string().trim().max(30)),
    category: Joi.string().valid(
      'financial', 
      'social', 
      'productivity', 
      'entertainment', 
      'utility', 
      'other'
    ),
    isFeatured: Joi.boolean(),
    isPublished: Joi.boolean(),
    mediaUrls: Joi.array().items(
      Joi.string().uri()
    ),
    capabilities: Joi.array().items(Joi.string()),
    usageLimits: Joi.object({
      requestsPerDay: Joi.number().integer().min(1),
      actionsPerDay: Joi.number().integer().min(1)
    })
  };
  
  // For update operations, all fields are optional
  if (isUpdate) {
    return Joi.object(baseSchema).min(1).validate(data);
  }
  
  // For new listings, some fields are required
  return Joi.object({
    ...baseSchema,
    agentId: baseSchema.agentId.required(),
    price: baseSchema.price.required(),
    description: baseSchema.description.required()
  }).validate(data);
};

/**
 * Validate a review submission
 * @param {Object} data - Review data to validate
 * @returns {Object} Validation result
 */
const validateReview = (data) => {
  const schema = Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(500)
  });
  
  return schema.validate(data);
};

/**
 * Validate subscription creation
 * @param {Object} data - Subscription data to validate
 * @returns {Object} Validation result
 */
const validateSubscription = (data) => {
  const schema = Joi.object({
    agentId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
  });
  
  return schema.validate(data);
};

/**
 * Validate search parameters
 * @param {Object} params - Search parameters to validate
 * @returns {Object} Validation result
 */
const validateSearchParams = (params) => {
  const schema = Joi.object({
    text: Joi.string().max(100),
    category: Joi.string().valid(
      'financial', 
      'social', 
      'productivity', 
      'entertainment', 
      'utility', 
      'other'
    ),
    tags: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string()
    ),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    minRating: Joi.number().min(0).max(5),
    sortBy: Joi.string().valid(
      'price', 
      'subscriptions', 
      'averageRating', 
      'listedAt'
    ),
    sortOrder: Joi.string().valid('asc', 'desc'),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100)
  });
  
  return schema.validate(params);
};

module.exports = {
  validateListing,
  validateReview,
  validateSubscription,
  validateSearchParams
}; 