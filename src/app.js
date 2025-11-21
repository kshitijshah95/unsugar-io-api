const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const config = require('./config/config');
const blogRoutes = require('./routes/blogs');
const authRoutes = require('./routes/auth');
const blogTrackingRoutes = require('./routes/blogTracking');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const apiLimiter = require('./middleware/rateLimiter');

const app = express();

// Trust proxy - needed for Render, Heroku, and other proxies
// This enables rate limiting to work correctly behind proxies
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration - handle multiple origins
const allowedOrigins = config.corsOrigin.split(',').map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Passport middleware
app.use(passport.initialize());

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// API routes with versioning
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1', blogTrackingRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
