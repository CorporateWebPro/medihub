const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'superAdmin'],
    default: 'customer'
  },
  customerType: {
    type: String,
    enum: ['individual', 'hospital', 'clinic', 'dental_clinic', 'laboratory', 'ngo', 'government'],
    default: 'individual'
  },
  organizationName: {
    type: String,
    trim: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    county: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Kenya'
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  customPricing: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 50
    }
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  recentlyViewed: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ customerType: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Add to recently viewed (limit to 10 items)
userSchema.methods.addToRecentlyViewed = function(productId) {
  this.recentlyViewed = this.recentlyViewed.filter(
    item => !item.product.equals(productId)
  );
  
  this.recentlyViewed.unshift({
    product: productId,
    viewedAt: new Date()
  });
  
  if (this.recentlyViewed.length > 10) {
    this.recentlyViewed = this.recentlyViewed.slice(0, 10);
  }
  
  return this.save();
};

// Toggle wishlist item
userSchema.methods.toggleWishlistItem = function(productId) {
  const index = this.wishlist.indexOf(productId);
  
  if (index > -1) {
    this.wishlist.splice(index, 1);
  } else {
    this.wishlist.push(productId);
  }
  
  return this.save();
};

// Transform output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

module.exports = mongoose.model('User', userSchema);