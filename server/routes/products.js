const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { auth, adminAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get products with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'rating_desc', 'newest', 'popular']).withMessage('Invalid sort option'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('category').optional().isMongoId().withMessage('Invalid category ID'),
  query('brand').optional().trim(),
  query('search').optional().trim(),
  query('useCase').optional().isIn(['diagnostics', 'treatment', 'surgical', 'monitoring', 'rehabilitation', 'preventive']),
  query('targetFacilities').optional().isIn(['hospitals', 'clinics', 'dental_clinics', 'laboratories', 'home_care', 'emergency']),
  query('inStock').optional().isBoolean(),
  query('featured').optional().isBoolean()
], optionalAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      page = 1,
      limit = 20,
      sort = 'newest',
      minPrice,
      maxPrice,
      category,
      brand,
      search,
      useCase,
      targetFacilities,
      inStock,
      featured
    } = req.query;

    // Build query
    const query = { 
      isActive: true,
      status: 'active'
    };

    // Category filter
    if (category) {
      query.category = category;
    }

    // Brand filter
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query['pricing.basePrice'] = {};
      if (minPrice) query['pricing.basePrice'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.basePrice'].$lte = parseFloat(maxPrice);
    }

    // Use case filter
    if (useCase) {
      query['medicalInfo.useCase'] = useCase;
    }

    // Target facilities filter
    if (targetFacilities) {
      query['medicalInfo.targetFacilities'] = targetFacilities;
    }

    // Stock filter
    if (inStock === 'true') {
      query['inventory.quantity'] = { $gt: 0 };
    }

    // Featured filter
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'price_asc':
        sortOption = { 'pricing.basePrice': 1 };
        break;
      case 'price_desc':
        sortOption = { 'pricing.basePrice': -1 };
        break;
      case 'name_asc':
        sortOption = { name: 1 };
        break;
      case 'name_desc':
        sortOption = { name: -1 };
        break;
      case 'rating_desc':
        sortOption = { 'reviews.averageRating': -1 };
        break;
      case 'popular':
        sortOption = { 'analytics.viewCount': -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [products, totalProducts] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    // Calculate additional product info
    const productsWithInfo = products.map(product => ({
      ...product,
      currentPrice: product.pricing.salePrice && product.pricing.salePrice < product.pricing.basePrice 
        ? product.pricing.salePrice 
        : product.pricing.basePrice,
      discountPercentage: product.pricing.salePrice && product.pricing.salePrice < product.pricing.basePrice
        ? Math.round(((product.pricing.basePrice - product.pricing.salePrice) / product.pricing.basePrice) * 100)
        : 0,
      stockStatus: !product.inventory.trackInventory ? 'in_stock' :
                  product.inventory.quantity === 0 ? 'out_of_stock' :
                  product.inventory.quantity <= product.inventory.lowStockThreshold ? 'low_stock' : 'in_stock',
      primaryImage: product.images.find(img => img.isPrimary) || (product.images.length > 0 ? product.images[0] : null)
    }));

    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      products: productsWithInfo,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        applied: {
          category,
          brand,
          minPrice,
          maxPrice,
          useCase,
          targetFacilities,
          inStock,
          featured,
          search
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching products' 
    });
  }
});

// @route   GET /api/products/search
// @desc    Advanced product search with autocomplete
// @access  Public
router.get('/search', [
  query('q').trim().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { q, limit = 10 } = req.query;

    // Search products
    const products = await Product.find({
      $and: [
        { isActive: true, status: 'active' },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { brand: { $regex: q, $options: 'i' } },
            { tags: { $in: [new RegExp(q, 'i')] } },
            { description: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name brand images pricing category')
    .populate('category', 'name')
    .limit(parseInt(limit))
    .lean();

    // Get suggestions for autocomplete
    const suggestions = await Product.aggregate([
      {
        $match: {
          isActive: true,
          status: 'active',
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { brand: { $regex: q, $options: 'i' } },
            { tags: { $in: [new RegExp(q, 'i')] } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          names: { $addToSet: '$name' },
          brands: { $addToSet: '$brand' }
        }
      }
    ]);

    const autocompleteSuggestions = [];
    if (suggestions.length > 0) {
      suggestions[0].names.forEach(name => {
        if (name.toLowerCase().includes(q.toLowerCase())) {
          autocompleteSuggestions.push({ type: 'product', value: name });
        }
      });
      
      suggestions[0].brands.forEach(brand => {
        if (brand.toLowerCase().includes(q.toLowerCase())) {
          autocompleteSuggestions.push({ type: 'brand', value: brand });
        }
      });
    }

    res.json({
      products,
      suggestions: autocompleteSuggestions.slice(0, 5),
      query: q,
      totalResults: products.length
    });

  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({ 
      message: 'Server error during product search' 
    });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const featuredProducts = await Product.find({
      isActive: true,
      status: 'active',
      isFeatured: true
    })
    .populate('category', 'name slug')
    .sort({ 'analytics.viewCount': -1, createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

    const productsWithInfo = featuredProducts.map(product => ({
      ...product,
      currentPrice: product.pricing.salePrice && product.pricing.salePrice < product.pricing.basePrice 
        ? product.pricing.salePrice 
        : product.pricing.basePrice,
      discountPercentage: product.pricing.salePrice && product.pricing.salePrice < product.pricing.basePrice
        ? Math.round(((product.pricing.basePrice - product.pricing.salePrice) / product.pricing.basePrice) * 100)
        : 0,
      primaryImage: product.images.find(img => img.isPrimary) || (product.images.length > 0 ? product.images[0] : null)
    }));

    res.json({
      products: productsWithInfo
    });

  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching featured products' 
    });
  }
});

// @route   GET /api/products/categories/:categoryId
// @desc    Get products by category
// @access  Public
router.get('/categories/:categoryId', optionalAuth, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;

    // Get category and its subcategories
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const subcategories = await category.getAllDescendants();
    const categoryIds = [categoryId, ...subcategories.map(sub => sub._id)];

    // Build query
    const query = {
      category: { $in: categoryIds },
      isActive: true,
      status: 'active'
    };

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'price_asc':
        sortOption = { 'pricing.basePrice': 1 };
        break;
      case 'price_desc':
        sortOption = { 'pricing.basePrice': -1 };
        break;
      case 'rating_desc':
        sortOption = { 'reviews.averageRating': -1 };
        break;
      case 'popular':
        sortOption = { 'analytics.viewCount': -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const skip = (page - 1) * limit;

    const [products, totalProducts] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
        description: category.description
      },
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching products by category' 
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug description')
      .populate('relatedProducts', 'name images pricing reviews')
      .lean();

    if (!product || !product.isActive || product.status !== 'active') {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment view count
    await Product.findByIdAndUpdate(req.params.id, {
      $inc: { 'analytics.viewCount': 1 },
      'analytics.lastViewed': new Date()
    });

    // Add to user's recently viewed if authenticated
    if (req.user) {
      await req.user.addToRecentlyViewed(product._id);
    }

    // Calculate product info
    const productWithInfo = {
      ...product,
      currentPrice: product.pricing.salePrice && product.pricing.salePrice < product.pricing.basePrice 
        ? product.pricing.salePrice 
        : product.pricing.basePrice,
      discountPercentage: product.pricing.salePrice && product.pricing.salePrice < product.pricing.basePrice
        ? Math.round(((product.pricing.basePrice - product.pricing.salePrice) / product.pricing.basePrice) * 100)
        : 0,
      stockStatus: !product.inventory.trackInventory ? 'in_stock' :
                  product.inventory.quantity === 0 ? 'out_of_stock' :
                  product.inventory.quantity <= product.inventory.lowStockThreshold ? 'low_stock' : 'in_stock',
      primaryImage: product.images.find(img => img.isPrimary) || (product.images.length > 0 ? product.images[0] : null),
      isInWishlist: req.user ? req.user.wishlist.includes(product._id) : false
    };

    // Get related products if not already populated
    if (!product.relatedProducts || product.relatedProducts.length === 0) {
      const relatedProducts = await Product.find({
        category: product.category._id,
        _id: { $ne: product._id },
        isActive: true,
        status: 'active'
      })
      .select('name images pricing reviews')
      .limit(4)
      .lean();

      productWithInfo.relatedProducts = relatedProducts;
    }

    res.json({
      product: productWithInfo
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching product' 
    });
  }
});

// @route   GET /api/products/:id/reviews
// @desc    Get product reviews
// @access  Public
router.get('/:id/reviews', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sort').optional().isIn(['newest', 'oldest', 'rating_high', 'rating_low', 'helpful'])
], async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, sort = 'helpful' } = req.query;

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const Review = require('../models/Review');

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'rating_high':
        sortOption = { rating: -1 };
        break;
      case 'rating_low':
        sortOption = { rating: 1 };
        break;
      case 'helpful':
      default:
        sortOption = { 'helpfulVotes.helpful': -1, createdAt: -1 };
        break;
    }

    const skip = (page - 1) * limit;

    const [reviews, totalReviews] = await Promise.all([
      Review.find({ product: id, isApproved: true })
        .populate('customer', 'firstName lastName customerType organizationName')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments({ product: id, isApproved: true })
    ]);

    const totalPages = Math.ceil(totalReviews / limit);

    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReviews,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching product reviews' 
    });
  }
});

// @route   GET /api/products/brands
// @desc    Get all product brands
// @access  Public
router.get('/meta/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand', { 
      isActive: true, 
      status: 'active' 
    });

    res.json({
      brands: brands.sort()
    });

  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching brands' 
    });
  }
});

// @route   GET /api/products/filters
// @desc    Get available filter options
// @access  Public
router.get('/meta/filters', async (req, res) => {
  try {
    const { category } = req.query;

    let matchQuery = { isActive: true, status: 'active' };
    if (category) {
      matchQuery.category = category;
    }

    const filterData = await Product.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          brands: { $addToSet: '$brand' },
          useCases: { $addToSet: '$medicalInfo.useCase' },
          targetFacilities: { $addToSet: '$medicalInfo.targetFacilities' },
          minPrice: { $min: '$pricing.basePrice' },
          maxPrice: { $max: '$pricing.basePrice' }
        }
      }
    ]);

    const filters = filterData.length > 0 ? {
      brands: filterData[0].brands.sort(),
      useCases: filterData[0].useCases.flat().filter(Boolean),
      targetFacilities: filterData[0].targetFacilities.flat().filter(Boolean),
      priceRange: {
        min: filterData[0].minPrice,
        max: filterData[0].maxPrice
      }
    } : {
      brands: [],
      useCases: [],
      targetFacilities: [],
      priceRange: { min: 0, max: 0 }
    };

    res.json({ filters });

  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching filters' 
    });
  }
});

module.exports = router;