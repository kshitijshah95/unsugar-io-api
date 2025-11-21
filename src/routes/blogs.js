const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { sanitizeRegexInput, sanitizePagination, sanitizeSort } = require('../utils/sanitize');
const config = require('../config/config');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');

/**
 * GET /api/v1/blogs/tags/all
 * Get all unique tags
 * IMPORTANT: This must be BEFORE /:id route to avoid matching 'tags' as an ID
 */
router.get('/tags/all', asyncHandler(async (req, res) => {
  // Use MongoDB aggregation to get unique tags
  const allTags = await Blog.distinct('tags', { status: 'published' });

  res.json({
    success: true,
    data: allTags.sort()
  });
}));

/**
 * GET /api/v1/blogs/slug/:slug
 * Get a single blog by slug
 * IMPORTANT: This must be BEFORE /:id route to avoid slug matching as ID
 */
router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' })
    .select('-__v')
    .lean();

  if (!blog) {
    throw new NotFoundError('Blog not found');
  }

  res.json({
    success: true,
    data: blog
  });
}));

/**
 * GET /api/v1/blogs
 * Get all blogs with optional filtering, pagination, and sorting
 */
router.get('/', asyncHandler(async (req, res) => {
  const { tag, author, search, page = 1, limit = 10, sort = 'publishedDate', order = 'desc' } = req.query;
  
  // Build query
  const query = { status: 'published' };

  // Filter by tag (with input sanitization)
  if (tag) {
    const sanitizedTag = sanitizeRegexInput(tag);
    query.tags = { $in: [new RegExp(sanitizedTag, 'i')] };
  }

  // Filter by author (with input sanitization)
  if (author) {
    const sanitizedAuthor = sanitizeRegexInput(author);
    query.author = { $regex: sanitizedAuthor, $options: 'i' };
  }

  // Search in title and excerpt (with input sanitization)
  if (search) {
    const sanitizedSearch = sanitizeRegexInput(search);
    query.$or = [
      { title: { $regex: sanitizedSearch, $options: 'i' } },
      { excerpt: { $regex: sanitizedSearch, $options: 'i' } }
    ];
  }

  // Sanitize pagination
  const { pageNum, limitNum } = sanitizePagination(page, limit);
  const skip = (pageNum - 1) * limitNum;

  // Sanitize sorting
  const { sortField, sortOrder: validatedOrder } = sanitizeSort(sort, order);
  const sortOrder = validatedOrder === 'asc' ? 1 : -1;

  // Execute query
  const [blogs, total] = await Promise.all([
    Blog.find(query)
      .select('-content -__v') // Exclude content and version key for list view
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limitNum)
      .lean(), // Convert to plain JavaScript objects for performance
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
}));

/**
 * GET /api/v1/blogs/:id
 * Get a single blog by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ id: req.params.id, status: 'published' })
    .select('-__v')
    .lean();

  if (!blog) {
    throw new NotFoundError('Blog not found');
  }

  res.json({
    success: true,
    data: blog
  });
}));


module.exports = router;
