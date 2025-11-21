const mongoose = require('mongoose');

/**
 * BlogRead Model
 * Tracks blog reading analytics per user
 */
const blogReadSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Track reading progress
  readCount: {
    type: Number,
    default: 1
  },
  // Track if user finished reading
  completed: {
    type: Boolean,
    default: false
  },
  // Last read timestamp
  lastReadAt: {
    type: Date,
    default: Date.now
  },
  // First read timestamp
  firstReadAt: {
    type: Date,
    default: Date.now
  },
  // Reading time in seconds
  totalReadingTime: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound unique index: one record per user per blog
blogReadSchema.index({ blogId: 1, userId: 1 }, { unique: true });

// Index for querying user's read blogs
blogReadSchema.index({ userId: 1, lastReadAt: -1 });

// Index for blog analytics
blogReadSchema.index({ blogId: 1, completed: 1 });

/**
 * Update or create reading record
 */
blogReadSchema.statics.trackRead = async function(blogId, userId, readingTime = 0, completed = false) {
  const existingRead = await this.findOne({ blogId, userId });
  
  if (existingRead) {
    // Update existing record
    existingRead.readCount += 1;
    existingRead.lastReadAt = new Date();
    existingRead.totalReadingTime += readingTime;
    if (completed) {
      existingRead.completed = true;
    }
    return await existingRead.save();
  } else {
    // Create new record
    return await this.create({
      blogId,
      userId,
      readCount: 1,
      completed,
      totalReadingTime: readingTime
    });
  }
};

/**
 * Get user's reading stats
 */
blogReadSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalReads: { $sum: '$readCount' },
        uniqueBlogs: { $sum: 1 },
        completedBlogs: {
          $sum: { $cond: ['$completed', 1, 0] }
        },
        totalReadingTime: { $sum: '$totalReadingTime' }
      }
    }
  ]);
  
  return stats[0] || {
    totalReads: 0,
    uniqueBlogs: 0,
    completedBlogs: 0,
    totalReadingTime: 0
  };
};

/**
 * Get blog analytics
 */
blogReadSchema.statics.getBlogStats = async function(blogId) {
  const stats = await this.aggregate([
    { $match: { blogId: mongoose.Types.ObjectId(blogId) } },
    {
      $group: {
        _id: null,
        totalReads: { $sum: '$readCount' },
        uniqueReaders: { $sum: 1 },
        completedReads: {
          $sum: { $cond: ['$completed', 1, 0] }
        },
        avgReadingTime: { $avg: '$totalReadingTime' }
      }
    }
  ]);
  
  return stats[0] || {
    totalReads: 0,
    uniqueReaders: 0,
    completedReads: 0,
    avgReadingTime: 0
  };
};

const BlogRead = mongoose.model('BlogRead', blogReadSchema);

module.exports = BlogRead;
