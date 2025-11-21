const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true,
    default: 'Unsugar Team'
  },
  publishedDate: {
    type: String,
    required: true
  },
  readTime: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  thumbnail: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for better query performance
blogSchema.index({ tags: 1 });
blogSchema.index({ author: 1 });
blogSchema.index({ publishedDate: -1 });

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
