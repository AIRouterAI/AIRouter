# Action Modules

This directory contains the action modules for the AIRouter system. Action modules are responsible for executing specific tasks requested by users through AI agents.

## Structure

- `index.js` - Main entry point for action modules
- `models/` - Data models for actions
- `services/` - Business logic for executing different types of actions
- `validators/` - Input validation for action requests

## Available Actions

The AIRouter platform supports various action types:

- Financial actions (trading, transfers)
- Social media interactions
- Content creation
- Notification systems
- Data retrieval operations
- Blockchain operations

Each action module follows a consistent interface for registration, validation, execution, and result handling.

## Development

When creating new action modules, follow these guidelines:

1. Each module should have clear input validation
2. Implement proper error handling and reporting
3. Follow the action lifecycle hooks (pre-execution, execution, post-execution)
4. Include comprehensive logging
5. Add appropriate tests

Please refer to the project documentation for more details on implementing custom action modules. 