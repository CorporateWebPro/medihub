const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
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
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  image: {
    url: String,
    publicId: String
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  level: {
    type: Number,
    default: 0 // 0 for main categories, 1 for subcategories, etc.
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  featuredProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // Category-specific attributes for filtering
  attributes: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'select', 'multiselect'],
      default: 'text'
    },
    options: [String], // For select/multiselect types
    isRequired: {
      type: Boolean,
      default: false
    },
    isFilterable: {
      type: Boolean,
      default: true
    }
  }],
  // Statistics
  productCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ level: 1, sortOrder: 1 });

// Virtual for full path (breadcrumb)
categorySchema.virtual('fullPath').get(function() {
  // This would be populated in a pre-hook or method
  return this._fullPath || [];
});

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Update product count
categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  this.productCount = await Product.countDocuments({ 
    category: this._id, 
    isActive: true 
  });
  return this.save();
};

// Get category hierarchy
categorySchema.methods.getHierarchy = async function() {
  const Category = this.constructor;
  const hierarchy = [];
  let current = this;
  
  while (current) {
    hierarchy.unshift({
      _id: current._id,
      name: current.name,
      slug: current.slug
    });
    
    if (current.parentCategory) {
      current = await Category.findById(current.parentCategory);
    } else {
      current = null;
    }
  }
  
  return hierarchy;
};

// Get all descendants (subcategories at all levels)
categorySchema.methods.getAllDescendants = async function() {
  const Category = this.constructor;
  const descendants = [];
  
  const getChildren = async (categoryId) => {
    const children = await Category.find({ parentCategory: categoryId });
    for (const child of children) {
      descendants.push(child);
      await getChildren(child._id);
    }
  };
  
  await getChildren(this._id);
  return descendants;
};

// Static method to get main categories
categorySchema.statics.getMainCategories = function() {
  return this.find({ level: 0, isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .populate('subcategories');
};

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function() {
  const mainCategories = await this.find({ level: 0, isActive: true })
    .sort({ sortOrder: 1, name: 1 });
  
  const buildTree = async (categories) => {
    const tree = [];
    for (const category of categories) {
      const subcategories = await this.find({ 
        parentCategory: category._id, 
        isActive: true 
      }).sort({ sortOrder: 1, name: 1 });
      
      const categoryNode = {
        ...category.toObject(),
        children: subcategories.length > 0 ? await buildTree(subcategories) : []
      };
      
      tree.push(categoryNode);
    }
    return tree;
  };
  
  return buildTree(mainCategories);
};

module.exports = mongoose.model('Category', categorySchema);