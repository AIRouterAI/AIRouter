# Task Scheduler

This directory contains the task scheduling system for the AIRouter platform, enabling automated and recurring agent actions.

## Components

- `models/` - Data models for scheduled tasks
- `services/` - Task scheduling and execution services
- `controllers/` - API controllers for scheduling operations
- `utils/` - Utility functions for scheduling

## Features

- Recurring task scheduling
- One-time delayed tasks
- Cron-style scheduling syntax
- Task history and logs
- Failure handling and retries
- Priority-based queue management
- Task dependencies

## Task Types

The scheduler supports various task types:

- Agent actions
- System maintenance
- Energy regeneration
- Data sync operations
- Analytics and reporting
- Notification deliveries

## Technical Implementation

The scheduler is built on:

- Node.js scheduling libraries
- Distributed task queue
- Persistent job storage
- Worker processes for execution
- Health monitoring and recovery

## Integration

The scheduler integrates with:

- Agent Engine for executing agent actions
- Energy system for checking resource availability
- Action Modules for task execution
- Notification system for task status updates

## API

The Scheduler API provides endpoints for:

- Creating scheduled tasks
- Modifying schedule parameters
- Pausing and resuming tasks
- Viewing task history and status
- Manual triggering of scheduled tasks 