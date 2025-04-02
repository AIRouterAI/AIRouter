/**
 * Main API router
 * Configures and registers all application routes
 */

const express = require('express');
const router = express.Router();

// Import route modules
const agentEngineRoutes = require('./agent-engine/routes');
const energyRoutes = require('./energy/routes');
const blockchainRoutes = require('./blockchain/routes');
const identityRoutes = require('./identity/routes');
const schedulerRoutes = require('./scheduler/routes');
const actionModulesRoutes = require('./action-modules/routes');
const marketplaceRoutes = require('./marketplace/routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API version endpoint
router.get('/version', (req, res) => {
  res.status(200).json({ 
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Register all route modules
router.use('/agent-engine', agentEngineRoutes);
router.use('/energy', energyRoutes);
router.use('/blockchain', blockchainRoutes);
router.use('/identity', identityRoutes);
router.use('/scheduler', schedulerRoutes);
router.use('/actions', actionModulesRoutes);
router.use('/marketplace', marketplaceRoutes);

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found', message: 'The requested endpoint does not exist' });
});

module.exports = router; 