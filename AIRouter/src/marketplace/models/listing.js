/**
 * Listing Model
 * Represents detailed metadata for marketplace agent listings
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ListingSchema = new Schema({
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
    unique: true
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    maxlength: 150
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  category: {
    type: String,
    enum: ['financial', 'social', 'productivity', 'entertainment', 'utility', 'other'],
    default: 'other'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  subscriptions: {
    type: Number,
    default: 0
  },
  reviews: [ReviewSchema],
  averageRating: {
    type: Number,
    default: 0
  },
  listedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  mediaUrls: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  }],
  capabilities: [{
    type: String
  }],
  usageLimits: {
    requestsPerDay: {
      type: Number,
      default: 100
    },
    actionsPerDay: {
      type: Number,
      default: 20
    }
  }
});

// Pre-save middleware to update the average rating
ListingSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
  } else {
    this.averageRating = 0;
  }
  
  this.updatedAt = new Date();
  next();
});

// Instance method to add a review
ListingSchema.methods.addReview = async function(userId, rating, comment) {
  // Check if user has already left a review
  const existingReviewIndex = this.reviews.findIndex(
    review => review.userId.toString() === userId.toString()
  );
  
  if (existingReviewIndex >= 0) {
    // Update existing review
    this.reviews[existingReviewIndex].rating = rating;
    this.reviews[existingReviewIndex].comment = comment;
    this.reviews[existingReviewIndex].createdAt = new Date();
  } else {
    // Add new review
    this.reviews.push({
      userId,
      rating,
      comment,
      createdAt: new Date()
    });
  }
  
  await this.save();
  return this;
};

// Static method to find featured listings
ListingSchema.statics.findFeatured = function(limit = 5) {
  return this.find({
    isFeatured: true,
    isPublished: true
  })
    .sort({ averageRating: -1, subscriptions: -1 })
    .limit(limit)
    .populate('agentId', 'name description');
};

// Static method to search for listings
ListingSchema.statics.search = function(query = {}, options = {}) {
  const { 
    text, 
    category, 
    tags, 
    minPrice, 
    maxPrice,
    minRating,
    sortBy = 'subscriptions',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = query;
  
  const searchQuery = { isPublished: true };
  
  // Text search
  if (text) {
    searchQuery.$or = [
      { description: { $regex: text, $options: 'i' } },
      { shortDescription: { $regex: text, $options: 'i' } },
      { tags: { $regex: text, $options: 'i' } }
    ];
  }
  
  // Category filter
  if (category) {
    searchQuery.category = category;
  }
  
  // Tags filter
  if (tags && tags.length) {
    searchQuery.tags = { $in: Array.isArray(tags) ? tags : [tags] };
  }
  
  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    searchQuery.price = {};
    
    if (minPrice !== undefined) {
      searchQuery.price.$gte = minPrice;
    }
    
    if (maxPrice !== undefined) {
      searchQuery.price.$lte = maxPrice;
    }
  }
  
  // Rating filter
  if (minRating) {
    searchQuery.averageRating = { $gte: minRating };
  }
  
  // Determine sort options
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  
  // Add secondary sort by date
  sort.listedAt = -1;
  
  return this.find(searchQuery)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('agentId', 'name description');
};

const ListingModel = mongoose.model('Listing', ListingSchema);

module.exports = { ListingModel, ListingSchema }; 