# Utilities

This directory contains shared utility functions and helper modules used across the AIRouter platform.

## Components

- `logger.js` - Centralized logging utility
- `validators.js` - Common validation functions
- `errorHandlers.js` - Error handling utilities
- `formatters.js` - Data formatting helpers
- `security.js` - Security-related utilities
- `async.js` - Async operation helpers

## Logging

The logging system supports:

- Multiple log levels (debug, info, warn, error)
- Structured logging output
- Log file rotation
- Environment-specific configuration
- Request ID tracking across services

## Validation

Common validation utilities include:

- Input sanitization
- Type checking
- Schema validation
- Common format validators (email, URLs, etc.)
- Blockchain address validation

## Error Handling

Error handling utilities provide:

- Standardized error classes
- Error codes and messages
- Error response formatting
- API error middleware
- Error tracking and monitoring integration

## Best Practices

When using or extending utilities:

1. Keep utility functions pure when possible
2. Document all parameters and return values
3. Write tests for utility functions
4. Avoid utility functions with side effects
5. Follow naming conventions consistently

## Development

When adding new utilities:

1. Place them in the appropriate module or create a new one
2. Export them through the relevant index.js file
3. Add unit tests for all utility functions
4. Document the utility in this README 