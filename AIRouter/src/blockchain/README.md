# Blockchain Integration

This directory contains the blockchain integration components for the AIRouter platform, primarily focused on Solana blockchain interaction.

## Components

- `adapters/` - Blockchain connection adapters
- `services/` - Services for blockchain operations
- `models/` - Data models for blockchain entities
- `utils/` - Utilities for blockchain operations

## Features

- Wallet connection and management
- Token transfers and management
- Smart contract interaction
- NFT minting and management
- Transaction signing and verification
- Transaction history and state management

## Supported Operations

- Connection to Solana wallets
- AIRouter token (AIROUTER) operations
- Energy token management
- NFT creation and management for agent identities
- Cross-chain operations (via bridges)

## Security

The blockchain module implements several security measures:

- Transaction simulation before submission
- Rate limiting for blockchain operations
- User approval for sensitive operations
- Key management best practices
- Secure RPC connections

## Development

When extending blockchain functionality:

1. Always test on devnet/testnet before mainnet
2. Follow secure coding practices for blockchain operations
3. Implement proper error handling and transaction confirmation
4. Document new blockchain functions and their parameters
5. Consider gas optimization for all operations 