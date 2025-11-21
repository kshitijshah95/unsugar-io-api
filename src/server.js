const app = require('./app');
const config = require('./config/config');
const connectDB = require('./config/database');

// Start server with database connection
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Then start Express server
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
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().then((server) => {
  // Graceful shutdown handlers
  const shutdown = () => {
    console.log('Shutdown signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
