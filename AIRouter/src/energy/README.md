# Energy System

This directory contains the Energy system components for the AIRouter platform. The Energy system manages the resource allocation for AI agents.

## Components

- `models/` - Data models for energy accounting
- `services/` - Services for energy allocation and management
- `controllers/` - API controllers for energy operations
- `utils/` - Utility functions for energy calculations

## Concept

Energy is the resource that powers agent actions in the AIRouter ecosystem:

- Users earn energy by holding AIROUTER tokens
- Energy regenerates over time based on token holdings
- Actions performed by agents consume energy
- Different actions have different energy costs
- Energy balance acts as a rate-limiting mechanism

## Features

- Energy balance calculation and tracking
- Energy allocation to agents
- Consumption tracking per action
- Energy regeneration scheduling
- Token-to-energy conversion
- Energy analytics and reporting

## Integration

The Energy system integrates with:

- Blockchain module for token-related operations
- Agent Engine for action energy requirements
- Scheduler for energy regeneration
- Identity system for user energy allocation

## API

The Energy API provides endpoints for:

- Checking energy balance
- Allocating energy to agents
- Viewing energy consumption history
- Managing energy regeneration settings
- Energy boosting through token staking 