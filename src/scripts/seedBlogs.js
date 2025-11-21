require('dotenv').config();
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const blogsData = require('../data/blogs');

const seedBlogs = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unsugar-blog';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing blogs
    const deleteResult = await Blog.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing blogs`);

    // Insert blogs from static data
    const result = await Blog.insertMany(blogsData);
    console.log(`✅ Seeded ${result.length} blogs successfully`);

    // List seeded blogs
    console.log('\n📚 Seeded blogs:');
    result.forEach(blog => {
      console.log(`  - ${blog.title} (${blog.id})`);
    });

    console.log('\n🎉 Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedBlogs();
