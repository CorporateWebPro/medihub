const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: 'text'
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    index: 'text'
  },
  shortDescription: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  model: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  videos: [{
    url: String,
    title: String,
    duration: Number
  }],
  // Pricing
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    salePrice: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'KES'
    },
    bulkPricing: [{
      minQuantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }],
    vatIncluded: {
      type: Boolean,
      default: true
    },
    vatRate: {
      type: Number,
      default: 16 // 16% VAT in Kenya
    }
  },
  // Inventory
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    trackInventory: {
      type: Boolean,
      default: true
    },
    allowBackorder: {
      type: Boolean,
      default: false
    },
    estimatedRestockDate: Date
  },
  // Technical Specifications
  specifications: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    unit: String,
    category: {
      type: String,
      enum: ['technical', 'physical', 'electrical', 'performance', 'safety', 'regulatory'],
      default: 'technical'
    }
  }],
  // Medical Equipment Specific Fields
  medicalInfo: {
    useCase: [{
      type: String,
      enum: ['diagnostics', 'treatment', 'surgical', 'monitoring', 'rehabilitation', 'preventive']
    }],
    targetFacilities: [{
      type: String,
      enum: ['hospitals', 'clinics', 'dental_clinics', 'laboratories', 'home_care', 'emergency']
    }],
    regulatoryApprovals: [{
      authority: String, // e.g., "FDA", "CE", "KEBS"
      certificationNumber: String,
      expiryDate: Date
    }],
    warranty: {
      duration: Number, // in months
      type: {
        type: String,
        enum: ['manufacturer', 'distributor', 'extended'],
        default: 'manufacturer'
      },
      coverage: String
    },
    maintenance: {
      isRequired: {
        type: Boolean,
        default: false
      },
      frequency: String, // e.g., "monthly", "quarterly", "annually"
      provider: String
    }
  },
  // Documents and Downloads
  documents: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['manual', 'brochure', 'specification', 'certificate', 'warranty'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: Number, // in bytes
    downloadCount: {
      type: Number,
      default: 0
    }
  }],
  // Shipping Information
  shipping: {
    weight: {
      value: Number,
      unit: {
        type: String,
        default: 'kg'
      }
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        default: 'cm'
      }
    },
    shippingClass: {
      type: String,
      enum: ['standard', 'fragile', 'hazardous', 'oversized'],
      default: 'standard'
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: Number
  },
  // SEO
  seo: {
    title: String,
    description: String,
    keywords: [String],
    schema: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  // Product Status
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'discontinued'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  // RFQ (Request for Quote) Settings
  rfqEnabled: {
    type: Boolean,
    default: false
  },
  minimumOrderQuantity: {
    type: Number,
    default: 1
  },
  // Reviews and Ratings
  reviews: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    ratingBreakdown: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 }
    }
  },
  // Analytics
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    salesCount: {
      type: Number,
      default: 0
    },
    wishlistCount: {
      type: Number,
      default: 0
    },
    lastViewed: Date
  },
  // Related Products
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // Tags for better searchability
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Indexes for better search and filter performance
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ 'pricing.basePrice': 1 });
productSchema.index({ 'reviews.averageRating': -1 });
productSchema.index({ isFeatured: -1, createdAt: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ status: 1 });

// Virtual for current price (considers sale price)
productSchema.virtual('currentPrice').get(function() {
  return this.pricing.salePrice && this.pricing.salePrice < this.pricing.basePrice 
    ? this.pricing.salePrice 
    : this.pricing.basePrice;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.pricing.salePrice && this.pricing.salePrice < this.pricing.basePrice) {
    return Math.round(((this.pricing.basePrice - this.pricing.salePrice) / this.pricing.basePrice) * 100);
  }
  return 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (!this.inventory.trackInventory) return 'in_stock';
  if (this.inventory.quantity === 0) return 'out_of_stock';
  if (this.inventory.quantity <= this.inventory.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || (this.images.length > 0 ? this.images[0] : null);
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Method to update analytics
productSchema.methods.incrementViewCount = function() {
  this.analytics.viewCount += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

productSchema.methods.incrementSalesCount = function(quantity = 1) {
  this.analytics.salesCount += quantity;
  return this.save();
};

// Method to update review statistics
productSchema.methods.updateReviewStats = async function() {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({ product: this._id, isApproved: true });
  
  this.reviews.totalReviews = reviews.length;
  
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.reviews.averageRating = Number((totalRating / reviews.length).toFixed(1));
    
    // Reset breakdown
    this.reviews.ratingBreakdown = { five: 0, four: 0, three: 0, two: 0, one: 0 };
    
    // Calculate breakdown
    reviews.forEach(review => {
      switch(review.rating) {
        case 5: this.reviews.ratingBreakdown.five++; break;
        case 4: this.reviews.ratingBreakdown.four++; break;
        case 3: this.reviews.ratingBreakdown.three++; break;
        case 2: this.reviews.ratingBreakdown.two++; break;
        case 1: this.reviews.ratingBreakdown.one++; break;
      }
    });
  } else {
    this.reviews.averageRating = 0;
  }
  
  return this.save();
};

// Method to get bulk price for quantity
productSchema.methods.getBulkPrice = function(quantity) {
  if (!this.pricing.bulkPricing || this.pricing.bulkPricing.length === 0) {
    return this.currentPrice;
  }
  
  const applicablePricing = this.pricing.bulkPricing
    .filter(bp => quantity >= bp.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity);
  
  return applicablePricing.length > 0 ? applicablePricing[0].price : this.currentPrice;
};

// Static methods for product queries
productSchema.statics.findByCategory = function(categoryId, options = {}) {
  const query = { category: categoryId, isActive: true };
  return this.find(query)
    .populate('category')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20);
};

productSchema.statics.search = function(searchTerm, options = {}) {
  const query = {
    $and: [
      { isActive: true },
      {
        $or: [
          { $text: { $search: searchTerm } },
          { name: { $regex: searchTerm, $options: 'i' } },
          { brand: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      }
    ]
  };
  
  return this.find(query)
    .populate('category')
    .sort(options.sort || { score: { $meta: 'textScore' } })
    .limit(options.limit || 20);
};

module.exports = mongoose.model('Product', productSchema);