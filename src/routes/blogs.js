const express = require('express');
const router = express.Router();
const blogs = require('../data/blogs');

/**
 * GET /api/blogs
 * Get all blogs with optional filtering
 */
router.get('/', (req, res) => {
  try {
    const { tag, author, search, page = 1, limit = 10, sort = 'publishedDate', order = 'desc' } = req.query;
    let filteredBlogs = [...blogs];

    // Filter by tag
    if (tag) {
      filteredBlogs = filteredBlogs.filter(blog =>
        blog.tags.some(t => t.toLowerCase() === tag.toLowerCase())
      );
    }

    // Filter by author
    if (author) {
      filteredBlogs = filteredBlogs.filter(blog =>
        blog.author.toLowerCase().includes(author.toLowerCase())
      );
    }

    // Search in title and excerpt
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBlogs = filteredBlogs.filter(blog =>
        blog.title.toLowerCase().includes(searchLower) ||
        blog.excerpt.toLowerCase().includes(searchLower)
      );
    }

    // Sorting
    filteredBlogs.sort((a, b) => {
      if (sort === 'publishedDate') {
        const dateA = new Date(a.publishedDate);
        const dateB = new Date(b.publishedDate);
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sort === 'title') {
        return order === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      return 0;
    });

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50); // Max 50 items per page
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);

    // Return only preview data (without full content)
    const blogsPreview = paginatedBlogs.map(blog => ({
      id: blog.id,
      slug: blog.slug,
      title: blog.title,
      excerpt: blog.excerpt,
      author: blog.author,
      publishedDate: blog.publishedDate,
      readTime: blog.readTime,
      tags: blog.tags,
      thumbnail: blog.thumbnail
    }));

    res.json({
      success: true,
      count: blogsPreview.length,
      total: filteredBlogs.length,
      page: pageNum,
      totalPages: Math.ceil(filteredBlogs.length / limitNum),
      data: blogsPreview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blogs'
    });
  }
});

/**
 * GET /api/blogs/:id
 * Get a single blog by ID
 */
router.get('/:id', (req, res) => {
  try {
    const blog = blogs.find(b => b.id === req.params.id);

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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog'
    });
  }
});

/**
 * GET /api/blogs/slug/:slug
 * Get a single blog by slug
 */
router.get('/slug/:slug', (req, res) => {
  try {
    const blog = blogs.find(b => b.slug === req.params.slug);

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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog'
    });
  }
});

/**
 * GET /api/blogs/tags/all
 * Get all unique tags
 */
router.get('/tags/all', (req, res) => {
  try {
    const allTags = blogs.reduce((tags, blog) => {
      blog.tags.forEach(tag => {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      });
      return tags;
    }, []);

    res.json({
      success: true,
      data: allTags.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags'
    });
  }
});

module.exports = router;
