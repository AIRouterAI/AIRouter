# Agent Marketplace

This directory contains the Marketplace components for the AIRouter platform, enabling users to discover, share, and subscribe to AI agents.

## Components

- `index.js` - Main marketplace service
- `routes.js` - API routes for marketplace functions
- `validators.js` - Input validation for marketplace operations
- `models/` - Data models for marketplace entities

## Features

- Agent listings with detailed metadata
- Search and discovery with filters
- Reviews and ratings
- Agent subscriptions and usage tracking
- Featured agent promotion
- Creator analytics and dashboards

## Marketplace Concepts

The marketplace operates on the following concepts:

- **Listings**: Detailed agent descriptions, capabilities, and metadata
- **Subscriptions**: User access to agents created by others
- **Categories**: Organization of agents by function type
- **Tags**: Flexible categorization for better discovery
- **Reviews**: User feedback and quality indicators

## Integration

The marketplace integrates with:

- Agent Engine for agent capabilities
- Identity system for creator verification
- Energy system for subscription allocation
- Blockchain for payment processing

## API

The Marketplace API provides endpoints for:

- Listing agents
- Searching the marketplace
- Managing subscriptions
- Submitting reviews
- Discovering popular agents
- Filtering by capabilities and tags

## Development

When extending the marketplace:

1. Follow the established data models for consistency
2. Implement proper validation for all inputs
3. Consider the user experience for both creators and subscribers
4. Ensure proper access control for sensitive operations 