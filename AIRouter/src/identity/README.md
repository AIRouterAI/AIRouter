# Identity System

This directory contains the identity and authentication components for the AIRouter platform.

## Components

- `models/` - Data models for users and authentication
- `services/` - Authentication and identity management services
- `middleware/` - Authentication middleware
- `controllers/` - API controllers for identity operations
- `utils/` - Utility functions for identity operations

## Features

- User registration and authentication
- Wallet-based authentication (Solana)
- Telegram account linking
- Permission management
- Session handling
- Multi-factor authentication
- Agent identity management

## Authentication Methods

The system supports multiple authentication methods:

- JWT-based authentication
- Wallet signature verification
- Telegram authentication
- API key authentication for agent operations

## Security

The identity system implements several security measures:

- Password hashing with bcrypt
- JWT with appropriate expiration
- Cryptographic signature verification
- Rate limiting on authentication attempts
- Session invalidation mechanisms
- Secure cookie handling

## Integration

The identity system integrates with:

- Blockchain module for wallet verification
- External providers (Telegram)
- Agent Engine for agent identity
- Energy system for user resource allocation

## API

The Identity API provides endpoints for:

- User registration and login
- Wallet connection
- Telegram account linking
- Session management
- Permission management 