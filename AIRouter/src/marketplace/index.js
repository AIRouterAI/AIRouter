/**
 * Marketplace Service
 * Handles agent listings, discovery, and subscriptions
 */

const logger = require('../utils/logger');
const { AgentModel } = require('../agent-engine/models/agent');
const { UserModel } = require('../identity/models/user');

/**
 * Marketplace service for managing agent listings and subscriptions
 */
class MarketplaceService {
  /**
   * List an agent on the marketplace
   * @param {string} agentId - ID of the agent to list
   * @param {Object} listingInfo - Information about the listing
   * @param {string} listingInfo.price - Price in AIROUTER tokens
   * @param {string} listingInfo.description - Marketplace description
   * @param {Array<string>} listingInfo.tags - Tags for categorization
   * @param {boolean} listingInfo.isFeatured - Whether this is a featured listing
   * @returns {Promise<Object>} The created listing
   */
  async listAgent(agentId, listingInfo) {
    try {
      const agent = await AgentModel.findById(agentId);
      
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      if (agent.isListed) {
        throw new Error('Agent is already listed on the marketplace');
      }
      
      // Update agent with listing info
      agent.isListed = true;
      agent.listingInfo = {
        price: listingInfo.price,
        description: listingInfo.description || agent.description,
        tags: listingInfo.tags || [],
        isFeatured: listingInfo.isFeatured || false,
        listedAt: new Date(),
        subscriptions: 0
      };
      
      await agent.save();
      
      logger.info(`Agent ${agentId} listed on marketplace`);
      return agent;
    } catch (error) {
      logger.error(`Failed to list agent: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Remove an agent from the marketplace
   * @param {string} agentId - ID of the agent to unlist
   * @returns {Promise<Object>} The updated agent
   */
  async unlistAgent(agentId) {
    try {
      const agent = await AgentModel.findById(agentId);
      
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      if (!agent.isListed) {
        throw new Error('Agent is not listed on the marketplace');
      }
      
      agent.isListed = false;
      agent.listingInfo = undefined;
      
      await agent.save();
      
      logger.info(`Agent ${agentId} unlisted from marketplace`);
      return agent;
    } catch (error) {
      logger.error(`Failed to unlist agent: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Search for agents on the marketplace
   * @param {Object} filters - Search filters
   * @param {string} filters.query - Text search query
   * @param {Array<string>} filters.tags - Filter by tags
   * @param {number} filters.minPrice - Minimum price
   * @param {number} filters.maxPrice - Maximum price
   * @param {number} filters.page - Page number for pagination
   * @param {number} filters.limit - Results per page
   * @returns {Promise<Object>} Paginated search results
   */
  async searchAgents(filters = {}) {
    try {
      const { 
        query = '',
        tags = [],
        minPrice,
        maxPrice,
        page = 1,
        limit = 20
      } = filters;
      
      const searchQuery = { isListed: true };
      
      // Text search
      if (query) {
        searchQuery.$or = [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { 'listingInfo.description': { $regex: query, $options: 'i' } }
        ];
      }
      
      // Tags filter
      if (tags.length > 0) {
        searchQuery['listingInfo.tags'] = { $in: tags };
      }
      
      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        searchQuery['listingInfo.price'] = {};
        
        if (minPrice !== undefined) {
          searchQuery['listingInfo.price'].$gte = minPrice;
        }
        
        if (maxPrice !== undefined) {
          searchQuery['listingInfo.price'].$lte = maxPrice;
        }
      }
      
      // Execute query with pagination
      const total = await AgentModel.countDocuments(searchQuery);
      const agents = await AgentModel.find(searchQuery)
        .sort({ 'listingInfo.isFeatured': -1, 'listingInfo.subscriptions': -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      
      return {
        agents,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Failed to search agents: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Subscribe a user to an agent
   * @param {string} userId - ID of the user subscribing
   * @param {string} agentId - ID of the agent to subscribe to
   * @returns {Promise<Object>} Subscription details
   */
  async subscribeToAgent(userId, agentId) {
    try {
      const [user, agent] = await Promise.all([
        UserModel.findById(userId),
        AgentModel.findById(agentId)
      ]);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      if (!agent.isListed) {
        throw new Error('This agent is not available for subscription');
      }
      
      // Check if already subscribed
      const isSubscribed = user.subscriptions && 
        user.subscriptions.some(sub => sub.agentId.toString() === agentId);
      
      if (isSubscribed) {
        throw new Error('User is already subscribed to this agent');
      }
      
      // Add subscription to user
      if (!user.subscriptions) {
        user.subscriptions = [];
      }
      
      const subscription = {
        agentId,
        subscribedAt: new Date(),
        status: 'active'
      };
      
      user.subscriptions.push(subscription);
      await user.save();
      
      // Increment subscription count on agent
      agent.listingInfo.subscriptions += 1;
      await agent.save();
      
      logger.info(`User ${userId} subscribed to agent ${agentId}`);
      
      return subscription;
    } catch (error) {
      logger.error(`Failed to subscribe to agent: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Cancel a user's subscription to an agent
   * @param {string} userId - ID of the user
   * @param {string} agentId - ID of the agent
   * @returns {Promise<Object>} Result of the operation
   */
  async cancelSubscription(userId, agentId) {
    try {
      const [user, agent] = await Promise.all([
        UserModel.findById(userId),
        AgentModel.findById(agentId)
      ]);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      // Find subscription
      if (!user.subscriptions || !user.subscriptions.length) {
        throw new Error('User has no subscriptions');
      }
      
      const subIndex = user.subscriptions.findIndex(
        sub => sub.agentId.toString() === agentId
      );
      
      if (subIndex === -1) {
        throw new Error('Subscription not found');
      }
      
      // Remove subscription
      user.subscriptions.splice(subIndex, 1);
      await user.save();
      
      // Decrement subscription count
      if (agent.listingInfo && agent.listingInfo.subscriptions > 0) {
        agent.listingInfo.subscriptions -= 1;
        await agent.save();
      }
      
      logger.info(`User ${userId} cancelled subscription to agent ${agentId}`);
      
      return { success: true, message: 'Subscription cancelled successfully' };
    } catch (error) {
      logger.error(`Failed to cancel subscription: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get featured agents on the marketplace
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array<Object>>} Featured agents
   */
  async getFeaturedAgents(limit = 5) {
    try {
      const agents = await AgentModel.find({
        isListed: true,
        'listingInfo.isFeatured': true
      })
        .sort({ 'listingInfo.subscriptions': -1 })
        .limit(limit);
      
      return agents;
    } catch (error) {
      logger.error(`Failed to get featured agents: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new MarketplaceService(); 