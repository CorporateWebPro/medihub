const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  // Detailed ratings for medical equipment
  detailedRatings: {
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    easeOfUse: {
      type: Number,
      min: 1,
      max: 5
    },
    durability: {
      type: Number,
      min: 1,
      max: 5
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5
    },
    customerService: {
      type: Number,
      min: 1,
      max: 5
    },
    documentation: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  // Usage context for medical equipment
  usageContext: {
    facilityType: {
      type: String,
      enum: ['hospital', 'clinic', 'dental_clinic', 'laboratory', 'home_care'],
      required: true
    },
    userType: {
      type: String,
      enum: ['doctor', 'nurse', 'technician', 'administrator', 'patient'],
      required: true
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true
    },
    usageDuration: {
      type: String,
      enum: ['less_than_1_month', '1_3_months', '3_6_months', '6_12_months', 'over_1_year'],
      required: true
    }
  },
  // Pros and Cons
  pros: [{
    type: String,
    trim: true
  }],
  cons: [{
    type: String,
    trim: true
  }],
  // Review verification
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'unverified'],
    default: 'pending'
  },
  // Moderation
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  moderationNote: String,
  rejectionReason: {
    type: String,
    enum: [
      'inappropriate_content',
      'spam',
      'fake_review',
      'off_topic',
      'personal_information',
      'duplicate',
      'other'
    ]
  },
  // Helpfulness voting
  helpfulVotes: {
    helpful: {
      type: Number,
      default: 0
    },
    notHelpful: {
      type: Number,
      default: 0
    },
    voters: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      vote: {
        type: String,
        enum: ['helpful', 'not_helpful']
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  // Images/attachments
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    caption: String,
    isApproved: {
      type: Boolean,
      default: false
    }
  }],
  // Response from seller/admin
  adminResponse: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  // Flags and reports
  flags: [{
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: [
        'inappropriate_content',
        'spam',
        'fake_review',
        'harassment',
        'copyright_violation',
        'other'
      ]
    },
    description: String,
    flaggedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending'
    }
  }],
  // Analytics
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    }
  },
  // Additional metadata
  reviewSource: {
    type: String,
    enum: ['website', 'mobile_app', 'email_invitation', 'admin'],
    default: 'website'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    editedAt: {
      type: Date,
      default: Date.now
    },
    changes: String
  }],
  // Featured review
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
reviewSchema.index({ product: 1, isApproved: 1 });
reviewSchema.index({ customer: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ moderationStatus: 1 });
reviewSchema.index({ isVerifiedPurchase: 1 });
reviewSchema.index({ isFeatured: -1, createdAt: -1 });
reviewSchema.index({ 'helpfulVotes.helpful': -1 });

// Compound index for efficient queries
reviewSchema.index({ product: 1, isApproved: 1, rating: -1 });

// Virtual for overall helpfulness score
reviewSchema.virtual('helpfulnessScore').get(function() {
  const total = this.helpfulVotes.helpful + this.helpfulVotes.notHelpful;
  if (total === 0) return 0;
  return (this.helpfulVotes.helpful / total) * 100;
});

// Virtual for average detailed rating
reviewSchema.virtual('averageDetailedRating').get(function() {
  if (!this.detailedRatings) return this.rating;
  
  const ratings = Object.values(this.detailedRatings).filter(rating => rating > 0);
  if (ratings.length === 0) return this.rating;
  
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Number((sum / ratings.length).toFixed(1));
});

// Pre-save middleware to verify purchase
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Check if the user actually purchased this product
    const Order = mongoose.model('Order');
    const order = await Order.findOne({
      _id: this.order,
      customer: this.customer,
      'items.product': this.product,
      'payment.status': 'completed'
    });
    
    if (order) {
      this.isVerifiedPurchase = true;
      this.verificationStatus = 'verified';
    } else {
      this.verificationStatus = 'unverified';
    }
  }
  next();
});

// Post-save middleware to update product review stats
reviewSchema.post('save', async function() {
  if (this.isApproved) {
    const Product = mongoose.model('Product');
    const product = await Product.findById(this.product);
    if (product) {
      await product.updateReviewStats();
    }
  }
});

// Post-remove middleware to update product review stats
reviewSchema.post('remove', async function() {
  const Product = mongoose.model('Product');
  const product = await Product.findById(this.product);
  if (product) {
    await product.updateReviewStats();
  }
});

// Method to approve review
reviewSchema.methods.approve = function(moderatorId, note) {
  this.moderationStatus = 'approved';
  this.isApproved = true;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationNote = note;
  return this.save();
};

// Method to reject review
reviewSchema.methods.reject = function(moderatorId, reason, note) {
  this.moderationStatus = 'rejected';
  this.isApproved = false;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.rejectionReason = reason;
  this.moderationNote = note;
  return this.save();
};

// Method to add helpful vote
reviewSchema.methods.addHelpfulVote = function(userId, voteType) {
  // Remove existing vote from this user
  this.helpfulVotes.voters = this.helpfulVotes.voters.filter(
    voter => !voter.user.equals(userId)
  );
  
  // Add new vote
  this.helpfulVotes.voters.push({
    user: userId,
    vote: voteType,
    votedAt: new Date()
  });
  
  // Update counts
  const helpfulCount = this.helpfulVotes.voters.filter(v => v.vote === 'helpful').length;
  const notHelpfulCount = this.helpfulVotes.voters.filter(v => v.vote === 'not_helpful').length;
  
  this.helpfulVotes.helpful = helpfulCount;
  this.helpfulVotes.notHelpful = notHelpfulCount;
  
  return this.save();
};

// Method to add admin response
reviewSchema.methods.addAdminResponse = function(responderId, message) {
  this.adminResponse = {
    message,
    respondedBy: responderId,
    respondedAt: new Date()
  };
  return this.save();
};

// Method to flag review
reviewSchema.methods.flagReview = function(flaggedBy, reason, description) {
  this.flags.push({
    flaggedBy,
    reason,
    description,
    flaggedAt: new Date()
  });
  
  if (this.flags.length >= 3) {
    this.moderationStatus = 'flagged';
  }
  
  return this.save();
};

// Static method to get reviews for product
reviewSchema.statics.getProductReviews = function(productId, options = {}) {
  const query = { product: productId, isApproved: true };
  
  return this.find(query)
    .populate('customer', 'firstName lastName customerType organizationName')
    .sort(options.sort || { 'helpfulVotes.helpful': -1, createdAt: -1 })
    .limit(options.limit || 10)
    .skip(options.skip || 0);
};

// Static method to get pending reviews for moderation
reviewSchema.statics.getPendingReviews = function(options = {}) {
  return this.find({ moderationStatus: 'pending' })
    .populate('customer', 'firstName lastName email')
    .populate('product', 'name images')
    .sort({ createdAt: -1 })
    .limit(options.limit || 20);
};

// Static method to get review statistics
reviewSchema.statics.getReviewStats = async function(productId) {
  const stats = await this.aggregate([
    { $match: { product: mongoose.Types.ObjectId(productId), isApproved: true } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingBreakdown: {
          $push: '$rating'
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }
  
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  stats[0].ratingBreakdown.forEach(rating => {
    breakdown[rating]++;
  });
  
  return {
    totalReviews: stats[0].totalReviews,
    averageRating: Number(stats[0].averageRating.toFixed(1)),
    ratingBreakdown: breakdown
  };
};

module.exports = mongoose.model('Review', reviewSchema);