const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

/**
 * GET /api/v1/blogs
 * Get all blogs with optional filtering, pagination, and sorting
 */
router.get('/', async (req, res) => {
  try {
    const { tag, author, search, page = 1, limit = 10, sort = 'publishedDate', order = 'desc' } = req.query;
    
    // Build query
    const query = { status: 'published' };

    // Filter by tag
    if (tag) {
      query.tags = { $in: [new RegExp(tag, 'i')] };
    }

    // Filter by author
    if (author) {
      query.author = { $regex: author, $options: 'i' };
    }

    // Search in title and excerpt
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50); // Max 50 items per page
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = sort === 'title' ? 'title' : 'publishedDate';

    // Execute query
    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .select('-content') // Exclude content for list view
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(), // Convert to plain JavaScript objects
      Blog.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: blogs.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: blogs
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blogs'
    });
  }
});

/**
 * GET /api/v1/blogs/:id
 * Get a single blog by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findOne({ id: req.params.id, status: 'published' }).lean();

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog'
    });
  }
});

/**
 * GET /api/v1/blogs/slug/:slug
 * Get a single blog by slug
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' }).lean();

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog'
    });
  }
});

/**
 * GET /api/v1/blogs/tags/all
 * Get all unique tags
 */
router.get('/tags/all', async (req, res) => {
  try {
    // Use MongoDB aggregation to get unique tags
    const allTags = await Blog.distinct('tags', { status: 'published' });

    res.json({
      success: true,
      data: allTags.sort()
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags'
    });
  }
});

module.exports = router;
