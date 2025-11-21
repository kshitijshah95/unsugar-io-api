const app = require('./app');
const config = require('./config/config');
const connectDB = require('./config/database');

// Connect to MongoDB
connectDB();

const server = app.listen(config.port, () => {
  console.log(`
🚀 Server is running!
📡 Environment: ${config.nodeEnv}
🌐 Port: ${config.port}
🔗 URL: http://localhost:${config.port}
🏥 Health: http://localhost:${config.port}/health
📝 API: http://localhost:${config.port}/api/v1/blogs
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
