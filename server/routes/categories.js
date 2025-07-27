const express = require('express');
const { query, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { optionalAuth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories with optional tree structure
// @access  Public
router.get('/', [
  query('tree').optional().isBoolean().withMessage('Tree must be a boolean'),
  query('level').optional().isInt({ min: 0 }).withMessage('Level must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { tree, level } = req.query;

    if (tree === 'true') {
      // Return hierarchical tree structure
      const categoryTree = await Category.getCategoryTree();
      return res.json({
        categoryTree,
        total: categoryTree.length
      });
    }

    // Build query
    const query = { isActive: true };
    if (level !== undefined) {
      query.level = parseInt(level);
    }

    const categories = await Category.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .populate('subcategories', 'name slug')
      .lean();

    // Update product counts
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        await category.updateProductCount();
        return category;
      })
    );

    res.json({
      categories: categoriesWithCounts,
      total: categoriesWithCounts.length
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching categories' 
    });
  }
});

// @route   GET /api/categories/main
// @desc    Get main categories (level 0)
// @access  Public
router.get('/main', async (req, res) => {
  try {
    const mainCategories = await Category.getMainCategories();
    
    res.json({
      categories: mainCategories,
      total: mainCategories.length
    });

  } catch (error) {
    console.error('Get main categories error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching main categories' 
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('subcategories', 'name slug description')
      .populate('featuredProducts', 'name images pricing reviews')
      .lean();

    if (!category || !category.isActive) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get category hierarchy for breadcrumbs
    const categoryInstance = await Category.findById(req.params.id);
    const hierarchy = await categoryInstance.getHierarchy();

    res.json({
      category: {
        ...category,
        hierarchy
      }
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching category' 
    });
  }
});

// @route   GET /api/categories/slug/:slug
// @desc    Get category by slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug, 
      isActive: true 
    })
    .populate('subcategories', 'name slug description')
    .populate('featuredProducts', 'name images pricing reviews')
    .lean();

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get category hierarchy for breadcrumbs
    const categoryInstance = await Category.findOne({ slug: req.params.slug });
    const hierarchy = await categoryInstance.getHierarchy();

    res.json({
      category: {
        ...category,
        hierarchy
      }
    });

  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching category' 
    });
  }
});

// @route   GET /api/categories/:id/subcategories
// @desc    Get subcategories of a category
// @access  Public
router.get('/:id/subcategories', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const subcategories = await Category.find({
      parentCategory: req.params.id,
      isActive: true
    })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

    res.json({
      subcategories,
      total: subcategories.length,
      parentCategory: {
        id: category._id,
        name: category.name,
        slug: category.slug
      }
    });

  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching subcategories' 
    });
  }
});

module.exports = router;