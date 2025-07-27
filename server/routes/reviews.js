const express = require('express');
const Review = require('../models/Review');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reviews/product/:productId
// @desc    Get reviews for a product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.getProductReviews(req.params.productId, req.query);
    res.json({ reviews });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({ message: 'Server error while fetching reviews' });
  }
});

// @route   POST /api/reviews/:reviewId/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:reviewId/helpful', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const { voteType } = req.body; // 'helpful' or 'not_helpful'
    await review.addHelpfulVote(req.user._id, voteType);

    res.json({ message: 'Vote recorded' });
  } catch (error) {
    console.error('Add helpful vote error:', error);
    res.status(500).json({ message: 'Server error while recording vote' });
  }
});

module.exports = router;