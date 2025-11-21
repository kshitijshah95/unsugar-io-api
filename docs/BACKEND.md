# 🔧 Backend Documentation

> Express.js API implementation for Unsugar.io

---

## Table of Contents
- [Overview](#overview)
- [Project Structure](#project-structure)
- [Authentication System](#authentication-system)
- [API Endpoints](#api-endpoints)
- [Middleware](#middleware)
- [Database Integration](#database-integration)
- [Security](#security)

---

## Overview

### Technology Stack
- **Node.js** 20.x - Runtime
- **Express.js** 4.19.x - Web framework
- **MongoDB** 7.x + Mongoose 8.x - Database
- **Passport.js** 0.7.x - Authentication
- **JWT** 9.0.x - Token management
- **bcryptjs** 2.4.x - Password hashing

### Key Features
✅ Complete auth system (email/password + OAuth)  
✅ JWT access & refresh tokens  
✅ Multi-provider SSO (Google, GitHub, Apple)  
✅ Role-based access control  
✅ Rate limiting  
✅ Input validation  
✅ Error handling middleware  

---

## Project Structure

```
unsugar-api/
├── src/
│   ├── models/              # Mongoose models
│   │   ├── User.js         # User schema (with OAuth)
│   │   └── Blog.js         # Blog schema
│   ├── routes/             # API routes
│   │   ├── auth.js         # Authentication endpoints
│   │   └── blogs.js        # Blog endpoints
│   ├── middleware/         # Custom middleware
│   │   ├── auth.js         # JWT verification
│   │   ├── rateLimiter.js  # Rate limiting
│   │   ├── errorHandler.js # Global error handler
│   │   └── notFound.js     # 404 handler
│   ├── config/             # Configuration
│   │   ├── passport.js     # OAuth strategies
│   │   ├── database.js     # MongoDB connection
│   │   └── config.js       # Environment config
│   ├── utils/              # Utilities
│   │   ├── jwt.js          # JWT utilities
│   │   └── sanitize.js     # Input sanitization
│   ├── app.js              # Express app setup
│   └── server.js           # Server entry point
├── .env                    # Environment variables (git ignored)
├── .env.example            # Env template
└── package.json            # Dependencies
```

---

## Authentication System

### Architecture

```
┌────────────────────────────────────────────────────────┐
│           Authentication Layer                         │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Passport.js Strategies                          │ │
│  │  - GoogleStrategy                                │ │
│  │  - GitHubStrategy                                │ │
│  │  - AppleStrategy                                 │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  JWT Token System                                │ │
│  │  - Access Token (15 min)                         │ │
│  │  - Refresh Token (7 days)                        │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Password Security                               │ │
│  │  - bcrypt hashing (12 rounds)                    │ │
│  │  - Password change tracking                      │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### JWT Implementation

**File:** `src/utils/jwt.js`

```javascript
const jwt = require('jsonwebtoken');

// Secrets from environment
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

// Expiry times
const ACCESS_TOKEN_EXPIRY = '15m';   // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';   // 7 days

// Generate access token
const generateAccessToken = (userId, role = 'user') => {
  return jwt.sign(
    { userId, role, type: 'access' },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

// Verify tokens
const verifyAccessToken = (token) => {
  const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return decoded;
};
```

**Why two tokens?**
- **Access token:** Short-lived (15min), stateless, can't be revoked
- **Refresh token:** Long-lived (7d), stored in DB, can be revoked

**Benefits:**
- Security: Short access token limits exposure
- UX: Refresh token prevents frequent re-login
- Control: Can revoke refresh tokens

### SSO Authentication

**File:** `src/config/passport.js`

#### Google OAuth Strategy

```javascript
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_BASE_URL}/api/v1/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    
    // Find or create user
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ email });
      
      if (user) {
        // Link Google to existing account
        user.linkOAuthProvider('google', {
          id: profile.id,
          email,
          displayName: profile.displayName,
          avatar: profile.photos[0]?.value
        });
      } else {
        // Create new user
        user = await User.create({
          email,
          name: profile.displayName,
          googleId: profile.id,
          avatar: profile.photos[0]?.value,
          isVerified: true
        });
      }
    }
    
    return done(null, user);
  }
));
```

**Flow:**
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth
3. User authorizes
4. Google redirects to callback with auth code
5. Exchange code for profile data
6. Find or create user in database
7. Generate JWT tokens
8. Redirect to frontend with tokens

### Auth Middleware

**File:** `src/middleware/auth.js`

```javascript
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

// Authenticate middleware
const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
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
    
    // Check if password changed after token issued
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
      message: 'Invalid token'
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
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

**Usage:**

```javascript
// Protected route (any authenticated user)
router.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Admin-only route
router.delete('/users/:id', authenticate, authorize('admin'), (req, res) => {
  // Delete user
});
```

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register with email/password | No |
| POST | `/api/v1/auth/login` | Login with email/password | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |
| POST | `/api/v1/auth/logout` | Logout & invalidate token | Yes |
| GET | `/api/v1/auth/me` | Get current user | Yes |
| PATCH | `/api/v1/auth/profile` | Update profile | Yes |

### OAuth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/google` | Start Google OAuth |
| GET | `/api/v1/auth/google/callback` | Google callback |
| GET | `/api/v1/auth/github` | Start GitHub OAuth |
| GET | `/api/v1/auth/github/callback` | GitHub callback |
| GET | `/api/v1/auth/apple` | Start Apple Sign In |
| POST | `/api/v1/auth/apple/callback` | Apple callback |

### Blog Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/blogs` | Get all blogs (with filters) | No |
| GET | `/api/v1/blogs/:id` | Get blog by ID | No |
| GET | `/api/v1/blogs/slug/:slug` | Get blog by slug | No |
| GET | `/api/v1/blogs/tags/all` | Get all tags | No |

**Query Parameters for GET `/api/v1/blogs`:**
- `tag` - Filter by tag
- `author` - Filter by author
- `search` - Full-text search
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sort` - Sort field (default: publishedDate)
- `order` - Sort order: asc/desc (default: desc)

---

## Middleware

### 1. Rate Limiter

**File:** `src/middleware/rateLimiter.js`

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = apiLimiter;
```

**Applied to:** All `/api/*` routes

**Why?** Prevents abuse, DDoS attacks, and ensures fair usage.

### 2. Error Handler

**File:** `src/middleware/errorHandler.js`

```javascript
const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('[Error]', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};
```

**Why?** Centralized error handling with consistent responses.

### 3. Input Validation

**Using:** `express-validator`

```javascript
const { body, validationResult } = require('express-validator');

router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty()
  ],
  async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Process request
  }
);
```

**Why?** Prevents invalid data from reaching business logic.

---

## Database Integration

### Connection

**File:** `src/config/database.js`

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Options handled by driver
    });
    
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

**Called in:** `src/server.js` before starting server

**Why async?** Wait for DB connection before accepting requests.

---

## Security

### Implemented Measures

```
┌─────────────────────────────────────────────────────┐
│  1. Helmet.js - Security Headers                   │
│     - X-Content-Type-Options: nosniff              │
│     - X-Frame-Options: DENY                        │
│     - X-XSS-Protection: 1; mode=block              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  2. CORS - Cross-Origin Resource Sharing           │
│     - Whitelist specific origins                   │
│     - Credentials: true                            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  3. Rate Limiting                                   │
│     - 100 requests per 15 minutes                  │
│     - Per IP address                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  4. Input Validation                                │
│     - express-validator                            │
│     - Sanitization                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  5. Password Security                               │
│     - bcrypt (12 rounds)                           │
│     - No plain text storage                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  6. JWT Security                                    │
│     - Short access token (15min)                   │
│     - Long refresh token (7d, revocable)           │
│     - Type validation                              │
└─────────────────────────────────────────────────────┘
```

### Environment Variables

**Critical secrets (never commit):**
```env
JWT_ACCESS_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
MONGODB_URI=mongodb+srv://...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_SECRET=...
```

**Generate secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Development Workflow

### 1. Start Dev Server

```bash
cd unsugar-api
npm run dev  # Uses nodemon for auto-restart
```

### 2. Environment Setup

```bash
node setup-env.js  # Generates .env with JWT secrets
```

### 3. Seed Database

```bash
npm run seed  # Seed blog data to MongoDB
```

### 4. Test API

```bash
# Register user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get blogs
curl http://localhost:3001/api/v1/blogs
```

---

## Deployment (Render)

### Build Command
```bash
npm install
```

### Start Command
```bash
npm start
```

### Environment Variables

Set in Render dashboard:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
FRONTEND_URL=https://unsugar.io
API_BASE_URL=https://unsugar-io-api.onrender.com
CORS_ORIGIN=https://unsugar.io,https://unsugar-io.netlify.app
```

### Health Check

Render pings `/health` endpoint:

```javascript
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});
```

---

## Next: [Database Documentation →](./04-DATABASE_DOCUMENTATION.md)
