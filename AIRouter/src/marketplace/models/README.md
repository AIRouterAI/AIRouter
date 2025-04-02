# Marketplace Data Models

This directory contains the database models for the AIRouter marketplace.

## Models

- `listing.js` - The primary model for agent marketplace listings

## Listing Model

The Listing model represents an agent available on the marketplace and includes:

- Basic listing information (title, description, price)
- Creator details
- Subscription metrics
- Ratings and reviews
- Tags and categorization
- Feature flags
- Media assets
- Usage limits and capabilities

## Schema Design

The models use Mongoose schemas with:

- Field validation
- Indexes for query optimization
- Virtual properties
- Middleware hooks for automated operations
- Instance methods for common operations
- Static methods for queries

## Usage

```javascript
const { ListingModel } = require('./models/listing');

// Create a new listing
const listing = new ListingModel({
  agentId: agentId,
  creatorId: userId,
  price: 10,
  description: 'A helpful agent for productivity tasks',
  tags: ['productivity', 'task-management']
});

await listing.save();

// Find featured listings
const featuredListings = await ListingModel.findFeatured(5);
```

## Development

When extending these models:

1. Maintain backward compatibility
2. Add appropriate validation
3. Document new fields and their purpose
4. Add indexes for fields used in frequent queries
5. Include proper error handling in methods 