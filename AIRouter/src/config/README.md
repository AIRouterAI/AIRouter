# Configuration

This directory contains configuration files and utilities for the AIRouter platform.

## Files

- `index.js` - Main configuration loader
- `default.js` - Default configuration values
- `environment.js` - Environment-specific configuration
- `validation.js` - Configuration validation schemas

## Usage

The configuration system is designed to be flexible and support multiple environments:

```javascript
const config = require('./config');

// Access configuration values
const apiPort = config.get('server.port');
const dbConnection = config.get('database.uri');
```

## Structure

Configuration is organized hierarchically by module:

- `server` - Web server configuration
- `database` - Database connection settings
- `auth` - Authentication and authorization
- `blockchain` - Blockchain connection settings
- `ai` - AI service configuration
- `agents` - Agent default configuration
- `energy` - Energy system parameters
- `logging` - Logging levels and targets

## Environment Variables

The following environment variables can be used to override configuration:

- `NODE_ENV` - Environment (development, test, production)
- `PORT` - Server port
- `DATABASE_URI` - Database connection string
- `JWT_SECRET` - Secret for JWT tokens
- `BLOCKCHAIN_RPC` - Blockchain RPC endpoint
- `AI_API_KEY` - API key for AI service
- `LOG_LEVEL` - Logging level

## Development

When extending the configuration:

1. Add new values to `default.js`
2. Add validation schemas in `validation.js`
3. Document environment variables that can override settings
4. Consider configuration needs across different environments 