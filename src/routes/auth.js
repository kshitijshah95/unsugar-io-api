const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');
const { isFeatureEnabled } = require('../config/features');
const {
  asyncHandler,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
} = require('../middleware/errorHandler');
const { validate, schemas } = require('../middleware/validation');

// Constants
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many failed attempts, please try again later',
  skipSuccessfulRequests: true,
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register with email/password
 * @access  Public
 */
router.post('/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty().withMessage('Name is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { email, password, name } = req.body;
      
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }
      
      // Create user
      const user = await User.create({
        email,
        password,
        name
      });
      
      // Generate tokens
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);
      
      // Save refresh token
      user.addRefreshToken(refreshToken, 7 * 24 * 60 * 60, req.headers['user-agent'], req.ip);
      await user.save();
      
      res.status(201).json({
        success: true,
        user,
        accessToken,
        refreshToken,
        expiresIn: 900 // 15 minutes in seconds
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? error.message : 'Registration failed'
      });
    }
  }
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email/password
 * @access  Public
 */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { email, password } = req.body;
      
      // Get user with password
      const user = await User.findOne({ email }).select('+password');
      
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive. Please contact support.'
        });
      }
      
      // Generate tokens
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);
      
      // Save refresh token
      user.addRefreshToken(refreshToken, 7 * 24 * 60 * 60, req.headers['user-agent'], req.ip);
      user.lastLogin = new Date();
      user.cleanupExpiredTokens();
      await user.save();
      
      // Remove password from response
      user.password = undefined;
      
      res.json({
        success: true,
        user,
        accessToken,
        refreshToken,
        expiresIn: 900
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? error.message : 'Login failed'
      });
    }
  }
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Get user and check if refresh token exists
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    // Clean up expired tokens
    user.cleanupExpiredTokens();
    await user.save();
    
    // Generate new access token
    const accessToken = generateAccessToken(user._id, user.role);
    
    res.json({
      success: true,
      accessToken,
      expiresIn: 900
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // If refreshToken provided, invalidate it
    if (refreshToken && req.user) {
      try {
        req.user.removeRefreshToken(refreshToken);
        await req.user.save();
      } catch (removeError) {
        // Log error but don't fail logout
        console.error('Error removing refresh token:', removeError);
      }
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    // Even if there's an error, return success for logout
    // Client-side token clearing is what matters
    console.error('Logout error:', error);
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * @route   PATCH /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/profile', authenticate,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { name } = req.body;
      
      if (name) req.user.name = name;
      
      await req.user.save();
      
      res.json({
        success: true,
        user: req.user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Profile update failed'
      });
    }
  }
);

// ========== Google OAuth Routes ==========

/**
 * @route   GET /api/v1/auth/google
 * @desc    Start Google OAuth flow
 * @access  Public
 */
router.get('/google',
  (req, res, next) => {
    if (!isFeatureEnabled('enableGoogleSSO')) {
      return res.status(403).json({
        success: false,
        message: 'Google SSO is currently disabled'
      });
    }
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

/**
 * @route   GET /api/v1/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback',
  (req, res, next) => {
    if (!isFeatureEnabled('enableGoogleSSO')) {
      return res.status(403).json({
        success: false,
        message: 'Google SSO is currently disabled'
      });
    }
    next();
  },
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    try {
      // Generate tokens
      const accessToken = generateAccessToken(req.user._id, req.user.role);
      const refreshToken = generateRefreshToken(req.user._id);
      
      // Save refresh token
      req.user.addRefreshToken(refreshToken, 7 * 24 * 60 * 60, req.headers['user-agent'], req.ip);
      await req.user.save();
      
      // Redirect to frontend with tokens
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    } catch (error) {
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/login?error=${encodeURIComponent(error.message)}`);
    }
  }
);

// ========== GitHub OAuth Routes ==========

/**
 * @route   GET /api/v1/auth/github
 * @desc    Start GitHub OAuth flow
 * @access  Public
 */
router.get('/github',
  (req, res, next) => {
    if (!isFeatureEnabled('enableGitHubSSO')) {
      return res.status(403).json({
        success: false,
        message: 'GitHub SSO is currently disabled'
      });
    }
    next();
  },
  passport.authenticate('github', {
    scope: ['user:email'],
    session: false
  })
);

/**
 * @route   GET /api/v1/auth/github/callback
 * @desc    GitHub OAuth callback
 * @access  Public
 */
router.get('/github/callback',
  (req, res, next) => {
    if (!isFeatureEnabled('enableGitHubSSO')) {
      return res.status(403).json({
        success: false,
        message: 'GitHub SSO is currently disabled'
      });
    }
    next();
  },
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const accessToken = generateAccessToken(req.user._id, req.user.role);
      const refreshToken = generateRefreshToken(req.user._id);
      
      req.user.addRefreshToken(refreshToken, 7 * 24 * 60 * 60, req.headers['user-agent'], req.ip);
      await req.user.save();
      
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    } catch (error) {
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/login?error=${encodeURIComponent(error.message)}`);
    }
  }
);

// ========== Apple OAuth Routes ==========
// Uncomment when Apple credentials are configured

/*
router.get('/apple',
  passport.authenticate('apple', {
    scope: ['name', 'email'],
    session: false
  })
);

router.post('/apple/callback',
  passport.authenticate('apple', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const accessToken = generateAccessToken(req.user._id, req.user.role);
      const refreshToken = generateRefreshToken(req.user._id);
      
      req.user.addRefreshToken(refreshToken, 7 * 24 * 60 * 60, req.headers['user-agent'], req.ip);
      await req.user.save();
      
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    } catch (error) {
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/login?error=${encodeURIComponent(error.message)}`);
    }
  }
);
*/

module.exports = router;
