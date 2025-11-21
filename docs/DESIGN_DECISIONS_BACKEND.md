# 🎯 Design Decisions - Backend

> Technology choices and rationale for the backend layer

---

## Technology Stack Decisions

### 1. Express.js vs Fastify vs Koa

**Chose:** Express 4.19

**Comparison:**

| Factor | Express | Fastify | Koa |
|--------|---------|---------|-----|
| Ecosystem | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Maturity | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Performance | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Learning curve | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Middleware | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

**Why Express?**
- ✅ Largest middleware ecosystem (helmet, morgan, etc.)
- ✅ Battle-tested for 10+ years
- ✅ Extensive documentation and tutorials
- ✅ Team familiarity
- ✅ Industry standard (easier hiring)

**Fastify advantages we're missing:**
- 2x faster performance
- Better TypeScript support
- Built-in schema validation
- Faster JSON serialization

**When we'd switch to Fastify:**
- Performance becomes critical bottleneck
- Need for built-in schema validation
- Team becomes comfortable with Fastify

**Trade-offs:**
- ✅ Stability, ecosystem, familiarity
- ❌ Slower performance than Fastify
- ✅ Worth it for: developer productivity, hiring

---

### 2. Passport.js vs Custom OAuth

**Chose:** Passport.js 0.7

**Why Passport?**
- ✅ **De-facto standard:** Most widely used auth library
- ✅ **Strategies:** 500+ pre-built strategies (Google, GitHub, Apple, etc.)
- ✅ **Maintained:** Active community, regular updates
- ✅ **Documentation:** Extensive guides and examples
- ✅ **Flexibility:** Works with any database

**Custom OAuth advantages we're missing:**
- Smaller bundle size
- Full control over auth flow
- No abstraction layer
- Potentially simpler for single provider

**Implementation:**

```javascript
// With Passport (declarative)
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    // Find or create user
    const user = await User.findOrCreate({google Id: profile.id });
    done(null, user);
  }
));

// Custom OAuth (imperative - more code)
app.get('/auth/google', (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?...`;
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  // Exchange code for token
  const token = await exchangeCodeForToken(code);
  // Get user profile
  const profile = await getUserProfile(token);
  // Find or create user
  // ...much more code
});
```

**Trade-offs:**
- ✅ Much faster development, proven reliability
- ❌ +50kb bundle size
- ✅ Worth it for: multi-provider support, reliability

---

### 3. JWT vs Session Cookies

**Chose:** JWT (with refresh tokens)

**Comparison:**

| Factor | JWT | Session Cookies |
|--------|-----|-----------------|
| Scalability | ✅ Stateless | ❌ Needs session store |
| Mobile apps | ✅ Easy | ⚠️ CORS issues |
| Microservices | ✅ Self-contained | ❌ Shared session store |
| Revocation | ⚠️ Complex | ✅ Easy (delete session) |
| Size | ⚠️ Larger (stored client-side) | ✅ Small (session ID only) |

**Our implementation:**
- **Access token:** 15 minutes, stateless, JWT
- **Refresh token:** 7 days, stored in DB, revocable

**Why this hybrid approach?**

```javascript
// Access token (stateless, fast verification)
{
  userId: "123",
  role: "user",
  type: "access",
  exp: 1640000000
}

// Refresh token (stored in DB, revocable)
{
  userId: "123",
  type: "refresh",
  exp: 1641000000
}
```

**Benefits:**
- ✅ **Scalability:** No session store needed
- ✅ **Security:** Short access token limits exposure
- ✅ **UX:** Refresh token prevents frequent re-login
- ✅ **Control:** Can revoke refresh tokens

**Trade-offs:**
- ✅ Best of both worlds
- ❌ More complex than pure sessions
- ❌ Can't instantly revoke access tokens (15min max exposure)
- ✅ Worth it for: scalability, mobile support

---

### 4. bcrypt vs argon2

**Chose:** bcryptjs (12 rounds)

**Why bcrypt?**
- ✅ **Industry standard:** Proven for 20+ years
- ✅ **Pure JavaScript:** No native dependencies
- ✅ **Tunable:** Adjust cost factor as CPUs improve
- ✅ **Familiar:** Team knows bcrypt
- ✅ **Compatible:** Works everywhere (Docker, serverless, etc.)

**argon2 advantages we're missing:**
- More resistant to GPU attacks
- Modern algorithm (2015 vs 1999)
- Better memory-hardness
- Slightly faster verification

**When we'd switch to argon2:**
- Security requirements significantly increase
- GPU attack becomes credible threat
- Node.js argon2 native bindings mature

**Trade-offs:**
- ✅ Proven, compatible, familiar
- ❌ Slightly less secure than argon2
- ✅ Worth it for: compatibility, stability

---

## Architecture Decisions

### 1. Layered Architecture

**Decision:** Separate routes, middleware, models, utils

**Structure:**

```
routes/     → Handle HTTP requests/responses
  ↓
middleware/ → Validate, authenticate, authorize
  ↓
models/     → Database operations
  ↓
database    → MongoDB
```

**Benefits:**
- ✅ **Separation of concerns:** Each layer has single responsibility
- ✅ **Testability:** Can test each layer independently
- ✅ **Maintainability:** Changes isolated to specific layers
- ✅ **Scalability:** Easy to add new routes/models

**Trade-offs:**
- ✅ Better organization, easier to maintain
- ❌ More files to manage
- ✅ Worth it for: long-term maintainability

---

### 2. Middleware Chain Pattern

**Decision:** Composable middleware for request processing

**Example:**

```javascript
router.post('/register',
  [
    body('email').isEmail(),           // Validation
    body('password').isLength({min:8})  // Validation
  ],
  async (req, res) => {                 // Handler
    // Business logic
  }
);

router.get('/profile',
  authenticate,                         // Auth check
  authorize('user', 'admin'),          // Role check
  async (req, res) => {                 // Handler
    res.json({ user: req.user });
  }
);
```

**Benefits:**
- ✅ Reusable middleware
- ✅ Clear, declarative
- ✅ Easy to compose

---

### 3. Input Validation Strategy

**Decision:** express-validator for all inputs

**Why express-validator?**
- ✅ Integrates with Express
- ✅ Comprehensive validation rules
- ✅ Auto-sanitization
- ✅ Clear error messages

**Example:**

```javascript
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Proceed with validated data
  }
);
```

**Alternative considered:**
- Joi (separate validation library)
- Manual validation
- TypeScript decorators (class-validator)

**Trade-offs:**
- ✅ Express-native, simple
- ❌ Tied to Express
- ✅ Worth it for: integration, simplicity

---

## Security Decisions

### 1. Rate Limiting Strategy

**Decision:** 100 requests per 15 minutes per IP

**Why?**
- ✅ Prevents brute force attacks
- ✅ Prevents DDoS
- ✅ Ensures fair usage
- ✅ Protects database

**Implementation:**

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests
  message: 'Too many requests'
});

app.use('/api/', apiLimiter);
```

**When we'd adjust:**
- Increase for paid users
- Decrease for auth endpoints
- Add per-user limits

**Trade-offs:**
- ✅ Security, fair usage
- ❌ May frustrate power users
- ✅ Worth it for: API stability

---

### 2. CORS Strategy

**Decision:** Whitelist specific origins

**Implementation:**

```javascript
const allowedOrigins = [
  'https://unsugar.io',
  'https://unsugar-io.netlify.app',
  'http://localhost:5173'  // Dev only
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

**Why whitelist?**
- ✅ **Security:** Only known origins can make requests
- ✅ **Flexibility:** Easy to add new domains
- ✅ **Credentials:** Supports cookies/auth headers

**Trade-offs:**
- ✅ More secure
- ❌ Must update for new domains
- ✅ Worth it for: security

---

### 3. Password Change Tracking

**Decision:** Track when password changes, invalidate old tokens

**Implementation:**

```javascript
// User model
passwordChangedAt: Date

// Middleware check
if (user.changedPasswordAfter(decoded.iat)) {
  return res.status(401).json({
    message: 'Password recently changed. Please login again.'
  });
}
```

**Why?**
- ✅ Invalidates tokens if password compromised
- ✅ Forces re-login on password change
- ✅ Better security

---

## Performance Decisions

### 1. Connection Pooling

**Decision:** Use Mongoose default connection pool

**Why?**
- ✅ Reuses database connections
- ✅ Faster queries
- ✅ Handles connection failures
- ✅ Works out of box

**Configuration:**

```javascript
mongoose.connect(MONGODB_URI, {
  // Mongoose handles pooling automatically
});
```

**Trade-offs:**
- ✅ Better performance
- ❌ None (default setting)

---

### 2. Pagination Always

**Decision:** Force pagination on all list endpoints

**Implementation:**

```javascript
const page = Math.max(1, parseInt(req.query.page) || 1);
const limit = Math.min(100, parseInt(req.query.limit) || 10);

const blogs = await Blog.find()
  .skip((page - 1) * limit)
  .limit(limit);
```

**Why?**
- ✅ Prevents memory issues
- ✅ Faster response times
- ✅ Better UX (progressive loading)
- ✅ Protects database

**Trade-offs:**
- ✅ Much better performance
- ❌ Requires client pagination logic
- ✅ Worth it for: scalability

---

## Monitoring & Logging

### 1. Structured Logging

**Decision:** Morgan for HTTP logs

**Development:**
```
GET /api/v1/blogs 200 123ms
```

**Production:**
```
::1 - - [21/Nov/2025:14:22:33 +0000] "GET /api/v1/blogs HTTP/1.1" 200 1234
```

**Why?**
- ✅ Standard format
- ✅ Useful for debugging
- ✅ Can pipe to log aggregation

---

## Future Improvements

### Planned

1. **Add TypeScript** (Q1 2026)
   - Better type safety
   - Easier refactoring
   - Better IDE support

2. **Add Redis Caching** (when traffic >10K/day)
   - Cache frequent queries
   - Session storage
   - Rate limit store

3. **Add Message Queue** (when async jobs needed)
   - Email sending
   - Image processing
   - Scheduled tasks

4. **Microservices** (if team grows)
   - Separate auth service
   - Separate blog service
   - Better scalability

---

## Summary

### Key Principles

1. **Industry standards** over cutting edge
2. **Security** over convenience
3. **Simplicity** over premature optimization
4. **Proven libraries** over custom code

### Technology Choices

- **Express:** Industry standard, huge ecosystem
- **Passport:** 500+ OAuth strategies
- **JWT:** Scalable, stateless auth
- **bcrypt:** Proven password hashing

All choices prioritize security, scalability, and developer productivity.
