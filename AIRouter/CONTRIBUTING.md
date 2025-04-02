# Contributing to AIRouter

Thank you for your interest in contributing to AIRouter! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

## How to Contribute

### Reporting Bugs

- Check if the bug has already been reported in the Issues section.
- Use the Bug Report template when creating a new issue.
- Include detailed steps to reproduce the bug.
- Include screenshots if applicable.
- Include information about your environment (OS, browser, etc.).

### Suggesting Features

- Check if the feature has already been suggested in the Issues section.
- Use the Feature Request template when creating a new issue.
- Clearly describe the feature and its potential benefits.
- Consider how the feature aligns with the project's goals.

### Pull Requests

1. Fork the repository.
2. Create a new branch from the `main` branch.
3. Make your changes.
4. Run tests to ensure your changes don't break existing functionality.
5. Submit a pull request to the `main` branch.

#### Pull Request Guidelines

- Follow the coding style and conventions used in the project.
- Write clear, descriptive commit messages.
- Include tests for new features or bug fixes.
- Update documentation if necessary.
- Link related issues in the pull request description.

## Development Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Solana CLI tools
- MongoDB

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/airouter.git
cd airouter

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys and configuration

# Start the development server
npm run dev
```

## Project Structure

- `/src/agent-engine` - Core AI processing and intent recognition
- `/src/action-modules` - Task execution modules for different domains
- `/src/scheduler` - Task scheduling and automation system
- `/src/energy` - Energy token system and management
- `/src/identity` - Authentication and permission management
- `/src/marketplace` - Agent marketplace functionality
- `/src/blockchain` - Solana blockchain integration

## Coding Standards

- Use ESLint and Prettier for code formatting.
- Write clear, descriptive variable and function names.
- Add comments for complex logic.
- Follow the existing project structure and patterns.

## Testing

- Write unit tests for new functionality.
- Run existing tests before submitting a pull request.
- Document test cases for complex features.

## Documentation

- Update README.md if your changes affect the setup or usage instructions.
- Document new features in the appropriate documentation files.
- Include JSDoc comments for functions and methods.

## License

By contributing to AIRouter, you agree that your contributions will be licensed under the project's MIT License. 