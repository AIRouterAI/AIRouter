/**
 * Intent Model
 * Database schema for tracking user intents processed by agents
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const IntentSchema = new Schema({
  agent: {
    type: Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
    index: true
  },
  input: {
    type: String,
    required: true
  },
  intentType: {
    type: String,
    required: true,
    index: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  parameters: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  actionTaken: {
    type: Boolean,
    default: false
  },
  actionSuccess: {
    type: Boolean,
    default: false
  },
  actionResult: Schema.Types.Mixed,
  errorMessage: String,
  energyCost: {
    type: Number,
    default: 0
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  }
}, { 
  timestamps: true 
});

// Define indexes
IntentSchema.index({ createdAt: -1 });
IntentSchema.index({ agent: 1, intentType: 1 });
IntentSchema.index({ agent: 1, createdAt: -1 });

// Static method to get intent statistics for an agent
IntentSchema.statics.getAgentStats = async function(agentId) {
  return this.aggregate([
    { $match: { agent: mongoose.Types.ObjectId(agentId) } },
    { $group: {
      _id: '$intentType',
      count: { $sum: 1 },
      successCount: { $sum: { $cond: ['$actionSuccess', 1, 0] } },
      averageConfidence: { $avg: '$confidence' },
      totalEnergy: { $sum: '$energyCost' },
      averageProcessingTime: { $avg: '$processingTime' }
    }}
  ]);
};

// Method to record action result
IntentSchema.methods.recordActionResult = async function(success, result, energyCost, error) {
  this.actionTaken = true;
  this.actionSuccess = success;
  this.actionResult = result;
  this.energyCost = energyCost;
  this.errorMessage = error ? error.message : null;
  this.processingTime = new Date() - this.createdAt;
  
  return this.save();
};

module.exports = mongoose.model('Intent', IntentSchema); 