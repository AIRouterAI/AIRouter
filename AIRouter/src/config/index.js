/**
 * Configuration Module
 * Centralized configuration management for the AIRouter system
 */

require('dotenv').config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  },
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/airouter',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // Redis configuration for caching and pub/sub
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || ''
  },
  
  // Solana blockchain configuration
  blockchain: {
    network: process.env.SOLANA_NETWORK || 'devnet',
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    tokenAddress: process.env.AIROUTER_TOKEN_ADDRESS
  },
  
  // OpenAI API configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2048')
  },
  
  // Telegram bot configuration
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL
  },
  
  // JWT authentication configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'airouter-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  },
  
  // Energy system configuration
  energy: {
    baseCost: parseInt(process.env.ENERGY_BASE_COST || '10'),
    stakingReward: parseFloat(process.env.ENERGY_STAKING_REWARD || '0.01'),
    actionCosts: {
      trade: parseInt(process.env.ENERGY_COST_TRADE || '20'),
      mint: parseInt(process.env.ENERGY_COST_MINT || '50'),
      social: parseInt(process.env.ENERGY_COST_SOCIAL || '5')
    }
  },
  
  // Agent configuration
  agent: {
    maxAgentsPerUser: parseInt(process.env.MAX_AGENTS_PER_USER || '10'),
    defaultResponseTimeout: parseInt(process.env.AGENT_RESPONSE_TIMEOUT || '30000')
  }
};

// Validate required configuration
function validateConfig() {
  const requiredKeys = [
    'blockchain.tokenAddress',
    'openai.apiKey'
  ];
  
  const missingKeys = requiredKeys.filter(key => {
    const keys = key.split('.');
    let current = config;
    for (const k of keys) {
      if (current[k] === undefined || current[k] === null || current[k] === '') {
        return true;
      }
      current = current[k];
    }
    return false;
  });
  
  if (missingKeys.length > 0) {
    console.warn(`Warning: Missing required configuration: ${missingKeys.join(', ')}`);
  }
}

validateConfig();

module.exports = config; 