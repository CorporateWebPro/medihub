const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/users/wishlist/:productId
// @desc    Toggle product in wishlist
// @access  Private
router.post('/wishlist/:productId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    await user.toggleWishlistItem(req.params.productId);
    
    const updatedUser = await User.findById(req.user._id)
      .populate('wishlist', 'name images pricing');
    
    res.json({ 
      message: 'Wishlist updated',
      wishlist: updatedUser.wishlist 
    });
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({ message: 'Server error while updating wishlist' });
  }
});

// @route   POST /api/users/recently-viewed/:productId
// @desc    Add product to recently viewed
// @access  Private
router.post('/recently-viewed/:productId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    await user.addToRecentlyViewed(req.params.productId);
    
    res.json({ message: 'Added to recently viewed' });
  } catch (error) {
    console.error('Add to recently viewed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;