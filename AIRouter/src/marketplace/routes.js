/**
 * Marketplace API Routes
 * Endpoints for listing, searching, and subscribing to agents
 */

const express = require('express');
const router = express.Router();
const marketplaceService = require('./index');
const { ListingModel } = require('./models/listing');
const { authenticate } = require('../identity/middleware');
const { validateListing, validateReview } = require('./validators');
const logger = require('../utils/logger');

/**
 * @route   GET /api/marketplace/listings
 * @desc    Search for agent listings with filters
 * @access  Public
 */
router.get('/listings', async (req, res) => {
  try {
    const { 
      text, 
      category, 
      tags, 
      minPrice, 
      maxPrice,
      minRating,
      sortBy,
      sortOrder,
      page = 1,
      limit = 20
    } = req.query;
    
    // Convert array params from query string
    const parsedTags = tags ? (Array.isArray(tags) ? tags : [tags]) : undefined;
    
    // Convert numeric params
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const parsedMinPrice = minPrice ? parseFloat(minPrice) : undefined;
    const parsedMaxPrice = maxPrice ? parseFloat(maxPrice) : undefined;
    const parsedMinRating = minRating ? parseFloat(minRating) : undefined;
    
    const searchParams = {
      text,
      category,
      tags: parsedTags,
      minPrice: parsedMinPrice,
      maxPrice: parsedMaxPrice,
      minRating: parsedMinRating,
      sortBy,
      sortOrder,
      page: parsedPage,
      limit: parsedLimit
    };
    
    const results = await ListingModel.search(searchParams);
    const total = await ListingModel.countDocuments({ isPublished: true });
    
    return res.json({
      listings: results,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    logger.error(`Failed to search listings: ${error.message}`);
    return res.status(500).json({ error: 'Failed to search for listings' });
  }
});

/**
 * @route   GET /api/marketplace/listings/featured
 * @desc    Get featured agent listings
 * @access  Public
 */
router.get('/listings/featured', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;
    const featuredAgents = await ListingModel.findFeatured(limit);
    return res.json(featuredAgents);
  } catch (error) {
    logger.error(`Failed to get featured listings: ${error.message}`);
    return res.status(500).json({ error: 'Failed to get featured listings' });
  }
});

/**
 * @route   GET /api/marketplace/listings/:id
 * @desc    Get a specific agent listing
 * @access  Public
 */
router.get('/listings/:id', async (req, res) => {
  try {
    const listing = await ListingModel.findById(req.params.id)
      .populate('agentId', 'name description capabilities')
      .populate('creatorId', 'username displayName');
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    return res.json(listing);
  } catch (error) {
    logger.error(`Failed to get listing ${req.params.id}: ${error.message}`);
    return res.status(500).json({ error: 'Failed to get listing details' });
  }
});

/**
 * @route   POST /api/marketplace/listings
 * @desc    Create a new agent listing
 * @access  Private
 */
router.post('/listings', authenticate, async (req, res) => {
  try {
    // Validate listing data
    const { error, value } = validateListing(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // Check if agent is already listed
    const existingListing = await ListingModel.findOne({ agentId: value.agentId });
    if (existingListing) {
      return res.status(400).json({ error: 'This agent is already listed on the marketplace' });
    }
    
    // Create new listing
    const listing = new ListingModel({
      ...value,
      creatorId: req.user.id
    });
    
    await listing.save();
    
    logger.info(`New marketplace listing created for agent ${value.agentId} by user ${req.user.id}`);
    return res.status(201).json(listing);
  } catch (error) {
    logger.error(`Failed to create listing: ${error.message}`);
    return res.status(500).json({ error: 'Failed to create listing' });
  }
});

/**
 * @route   PUT /api/marketplace/listings/:id
 * @desc    Update an existing agent listing
 * @access  Private
 */
router.put('/listings/:id', authenticate, async (req, res) => {
  try {
    // Validate listing data
    const { error, value } = validateListing(req.body, true);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // Find listing
    const listing = await ListingModel.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    // Check ownership
    if (listing.creatorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }
    
    // Update listing
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        listing[key] = value[key];
      }
    });
    
    await listing.save();
    
    logger.info(`Marketplace listing ${req.params.id} updated by user ${req.user.id}`);
    return res.json(listing);
  } catch (error) {
    logger.error(`Failed to update listing ${req.params.id}: ${error.message}`);
    return res.status(500).json({ error: 'Failed to update listing' });
  }
});

/**
 * @route   DELETE /api/marketplace/listings/:id
 * @desc    Remove a listing from the marketplace
 * @access  Private
 */
router.delete('/listings/:id', authenticate, async (req, res) => {
  try {
    // Find listing
    const listing = await ListingModel.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    // Check ownership
    if (listing.creatorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }
    
    // Remove listing
    await listing.remove();
    
    logger.info(`Marketplace listing ${req.params.id} deleted by user ${req.user.id}`);
    return res.json({ message: 'Listing removed successfully' });
  } catch (error) {
    logger.error(`Failed to delete listing ${req.params.id}: ${error.message}`);
    return res.status(500).json({ error: 'Failed to delete listing' });
  }
});

/**
 * @route   POST /api/marketplace/subscribe/:agentId
 * @desc    Subscribe to an agent
 * @access  Private
 */
router.post('/subscribe/:agentId', authenticate, async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const userId = req.user.id;
    
    const subscription = await marketplaceService.subscribeToAgent(userId, agentId);
    
    return res.status(201).json(subscription);
  } catch (error) {
    logger.error(`Failed to subscribe to agent ${req.params.agentId}: ${error.message}`);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/marketplace/subscribe/:agentId
 * @desc    Cancel a subscription to an agent
 * @access  Private
 */
router.delete('/subscribe/:agentId', authenticate, async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const userId = req.user.id;
    
    const result = await marketplaceService.cancelSubscription(userId, agentId);
    
    return res.json(result);
  } catch (error) {
    logger.error(`Failed to cancel subscription to agent ${req.params.agentId}: ${error.message}`);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * @route   POST /api/marketplace/listings/:id/reviews
 * @desc    Add a review to an agent listing
 * @access  Private
 */
router.post('/listings/:id/reviews', authenticate, async (req, res) => {
  try {
    // Validate review
    const { error, value } = validateReview(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // Find listing
    const listing = await ListingModel.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    // Check if user has subscribed to the agent
    const user = await req.user.populate('subscriptions');
    const hasSubscribed = user.subscriptions.some(
      sub => sub.agentId.toString() === listing.agentId.toString()
    );
    
    if (!hasSubscribed) {
      return res.status(403).json({ 
        error: 'You must subscribe to this agent before leaving a review' 
      });
    }
    
    // Add review
    await listing.addReview(req.user.id, value.rating, value.comment);
    
    logger.info(`User ${req.user.id} added review to listing ${req.params.id}`);
    return res.status(201).json(listing);
  } catch (error) {
    logger.error(`Failed to add review to listing ${req.params.id}: ${error.message}`);
    return res.status(500).json({ error: 'Failed to add review' });
  }
});

/**
 * @route   GET /api/marketplace/categories
 * @desc    Get all available agent categories
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      'financial', 
      'social', 
      'productivity', 
      'entertainment', 
      'utility', 
      'other'
    ];
    
    return res.json(categories);
  } catch (error) {
    logger.error(`Failed to get categories: ${error.message}`);
    return res.status(500).json({ error: 'Failed to get categories' });
  }
});

/**
 * @route   GET /api/marketplace/popular-tags
 * @desc    Get most popular tags used in listings
 * @access  Public
 */
router.get('/popular-tags', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    
    // Aggregate popular tags
    const popularTags = await ListingModel.aggregate([
      { $match: { isPublished: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);
    
    return res.json(popularTags.map(tag => ({ 
      name: tag._id, 
      count: tag.count 
    })));
  } catch (error) {
    logger.error(`Failed to get popular tags: ${error.message}`);
    return res.status(500).json({ error: 'Failed to get popular tags' });
  }
});

module.exports = router; 