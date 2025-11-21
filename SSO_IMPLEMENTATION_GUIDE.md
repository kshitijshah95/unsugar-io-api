# 🔐 SSO Authentication Implementation Guide

## Overview

Complete guide to implement Single Sign-On with Google, Apple, and GitHub for the Unsugar.io blog platform.

---

## ✅ What's Been Implemented

### 1. Dependencies Installed
```bash
✅ passport - Authentication middleware
✅ passport-google-oauth20 - Google OAuth strategy
✅ passport-github2 - GitHub OAuth strategy
✅ passport-apple - Apple Sign In strategy
✅ jsonwebtoken - JWT token generation
✅ bcryptjs - Password hashing
✅ express-validator - Input validation
✅ cookie-parser - Cookie handling
```

### 2. User Model Created
**File:** `src/models/User.js`

**Features:**
- ✅ Email/password authentication
- ✅ Multiple OAuth provider support (Google, GitHub, Apple)
- ✅ Link/unlink providers to existing accounts
- ✅ Refresh token management
- ✅ Role-based access control (user, admin, moderator)
- ✅ Password change tracking
- ✅ Account verification status
- ✅ Last login tracking

---

## 🚀 Implementation Steps

### Step 3: Create JWT Utilities

**File:** `src/utils/jwt.js`

```javascript
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

/**
 * Generate access token
 */
const generateAccessToken = (userId, role = 'user') => {
  return jwt.sign(
    { userId, role, type: 'access' },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
};
```

---

### Step 4: Create Passport OAuth Strategies

**File:** `src/config/passport.js`

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const AppleStrategy = require('passport-apple');
const User = require('../models/User');

/**
 * Google OAuth Strategy
 */
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_BASE_URL}/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      
      // Check if user exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        // Check if user exists with this email
        user = await User.findOne({ email });
        
        if (user) {
          // Link Google account to existing user
          user.linkOAuthProvider('google', {
            id: profile.id,
            email,
            displayName: profile.displayName,
            avatar: profile.photos[0]?.value,
            emailVerified: profile.emails[0].verified
          });
          await user.save();
        } else {
          // Create new user
          user = await User.create({
            email,
            name: profile.displayName,
            googleId: profile.id,
            avatar: profile.photos[0]?.value,
            isVerified: profile.emails[0].verified,
            oauthProviders: [{
              provider: 'google',
              providerId: profile.id,
              email,
              displayName: profile.displayName,
              avatar: profile.photos[0]?.value
            }]
          });
        }
      }
      
      user.lastLogin = new Date();
      await user.save();
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

/**
 * GitHub OAuth Strategy
 */
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.API_BASE_URL}/auth/github/callback`,
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      
      // Check if user exists with this GitHub ID
      let user = await User.findOne({ githubId: profile.id });
      
      if (!user) {
        // Check if user exists with this email
        user = await User.findOne({ email });
        
        if (user) {
          // Link GitHub account to existing user
          user.linkOAuthProvider('github', {
            id: profile.id,
            email,
            displayName: profile.displayName,
            avatar: profile.photos[0]?.value,
            emailVerified: true
          });
          await user.save();
        } else {
          // Create new user
          user = await User.create({
            email,
            name: profile.displayName || profile.username,
            githubId: profile.id,
            avatar: profile.photos[0]?.value,
            isVerified: true,
            oauthProviders: [{
              provider: 'github',
              providerId: profile.id,
              email,
              displayName: profile.displayName || profile.username,
              avatar: profile.photos[0]?.value
            }]
          });
        }
      }
      
      user.lastLogin = new Date();
      await user.save();
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

/**
 * Apple Sign In Strategy
 */
passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    callbackURL: `${process.env.API_BASE_URL}/auth/apple/callback`,
    keyID: process.env.APPLE_KEY_ID,
    privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH
  },
  async (accessToken, refreshToken, idToken, profile, done) => {
    try {
      const email = profile.email;
      const appleId = profile.id;
      
      // Check if user exists with this Apple ID
      let user = await User.findOne({ appleId });
      
      if (!user) {
        // Check if user exists with this email
        user = await User.findOne({ email });
        
        if (user) {
          // Link Apple account to existing user
          user.linkOAuthProvider('apple', {
            id: appleId,
            email,
            displayName: profile.name ? `${profile.name.firstName} ${profile.name.lastName}` : email.split('@')[0],
            emailVerified: true
          });
          await user.save();
        } else {
          // Create new user
          const displayName = profile.name 
            ? `${profile.name.firstName} ${profile.name.lastName}`
            : email.split('@')[0];
          
          user = await User.create({
            email,
            name: displayName,
            appleId,
            isVerified: true,
            oauthProviders: [{
              provider: 'apple',
              providerId: appleId,
              email,
              displayName
            }]
          });
        }
      }
      
      user.lastLogin = new Date();
      await user.save();
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
```

---

### Step 5: Create Auth Middleware

**File:** `src/middleware/auth.js`

```javascript
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password recently changed. Please login again.'
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid token'
    });
  }
};

/**
 * Check if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

module.exports = { authenticate, authorize };
```

---

### Step 6: Create Auth Routes

**File:** `src/routes/auth.js`

```javascript
const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

/**
 * Register with email/password
 */
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty()
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
          message: 'User already exists'
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
        message: error.message
      });
    }
  }
);

/**
 * Login with email/password
 */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
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
          message: 'Invalid credentials'
        });
      }
      
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive'
        });
      }
      
      // Generate tokens
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);
      
      // Save refresh token
      user.addRefreshToken(refreshToken, 7 * 24 * 60 * 60, req.headers['user-agent'], req.ip);
      user.lastLogin = new Date();
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
        message: error.message
      });
    }
  }
);

/**
 * Refresh access token
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
      message: error.message
    });
  }
});

/**
 * Logout
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      req.user.removeRefreshToken(refreshToken);
      await req.user.save();
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get current user
 */
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * Update profile
 */
router.patch('/profile', authenticate,
  [
    body('name').optional().trim().notEmpty()
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
        message: error.message
      });
    }
  }
);

// ========== SSO Routes ==========

/**
 * Google OAuth - Start
 */
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

/**
 * Google OAuth - Callback
 */
router.get('/google/callback',
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
      res.redirect(`${frontendURL}/login?error=${encodeURIComponent(error.message)}`);
    }
  }
);

/**
 * GitHub OAuth - Start
 */
router.get('/github',
  passport.authenticate('github', {
    scope: ['user:email']
  })
);

/**
 * GitHub OAuth - Callback
 */
router.get('/github/callback',
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
      res.redirect(`${frontendURL}/login?error=${encodeURIComponent(error.message)}`);
    }
  }
);

/**
 * Apple Sign In - Start
 */
router.get('/apple',
  passport.authenticate('apple', {
    scope: ['name', 'email']
  })
);

/**
 * Apple Sign In - Callback
 */
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
      res.redirect(`${frontendURL}/login?error=${encodeURIComponent(error.message)}`);
    }
  }
);

module.exports = router;
```

---

## 📝 Environment Variables

Add to `.env`:

```env
# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Apple Sign In
APPLE_CLIENT_ID=your_apple_service_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY_PATH=path/to/AuthKey_XXX.p8

# Frontend URL
FRONTEND_URL=https://unsugar.io

# API Base URL
API_BASE_URL=https://unsugar-io-api.onrender.com
```

---

## 🎯 OAuth Provider Setup

### Google Cloud Console
1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://unsugar-io-api.onrender.com/auth/google/callback`

### GitHub Developer Settings
1. Go to https://github.com/settings/developers
2. Create new OAuth App
3. Add callback URL: `https://unsugar-io-api.onrender.com/auth/github/callback`

### Apple Developer Program
1. Go to https://developer.apple.com/account
2. Create Service ID
3. Configure Sign In with Apple
4. Download private key (.p8 file)
5. Add return URL: `https://unsugar-io-api.onrender.com/auth/apple/callback`

---

## 💬 Next: Frontend Implementation

Check `FRONTEND_SSO_GUIDE.md` for complete frontend integration!
