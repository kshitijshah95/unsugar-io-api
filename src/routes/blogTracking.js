const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const BlogRead = require('../models/BlogRead');
const Blog = require('../models/Blog');

/**
 * @route   POST /api/v1/blogs/:id/track
 * @desc    Track blog read
 * @access  Private
 */
router.post('/blogs/:id/track', authenticate, async (req, res) => {
  try {
    const { readingTime, completed } = req.body;
    const blogId = req.params.id;
    const userId = req.user._id;

    // Verify blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Track read
    const blogRead = await BlogRead.trackRead(
      blogId,
      userId,
      readingTime || 0,
      completed || false
    );

    res.json({
      success: true,
      data: blogRead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to track read'
    });
  }
});

/**
 * @route   GET /api/v1/blogs/:id/stats
 * @desc    Get blog analytics
 * @access  Public
 */
router.get('/blogs/:id/stats', async (req, res) => {
  try {
    const blogId = req.params.id;
    const stats = await BlogRead.getBlogStats(blogId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get blog stats'
    });
  }
});

/**
 * @route   GET /api/v1/users/me/reading-stats
 * @desc    Get user reading statistics
 * @access  Private
 */
router.get('/users/me/reading-stats', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await BlogRead.getUserStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get reading stats'
    });
  }
});

/**
 * @route   GET /api/v1/users/me/reading-history
 * @desc    Get user's reading history
 * @access  Private
 */
router.get('/users/me/reading-history', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const history = await BlogRead.find({ userId })
      .populate('blogId', 'title slug excerpt thumbnail')
      .sort({ lastReadAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await BlogRead.countDocuments({ userId });

    res.json({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get reading history'
    });
  }
});

module.exports = router;
