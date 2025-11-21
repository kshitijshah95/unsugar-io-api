# 💾 Database Documentation

> MongoDB implementation for Unsugar.io

---

## Table of Contents
- [Overview](#overview)
- [Schema Design](#schema-design)
- [Indexing Strategy](#indexing-strategy)
- [Data Models](#data-models)
- [Queries & Performance](#queries--performance)
- [Migrations](#migrations)

---

## Overview

### Database Choice: MongoDB

**Why MongoDB?**
- **Schema flexibility:** Blog content varies (text, code, images)
- **Horizontal scaling:** Easy to scale as traffic grows
- **JSON-native:** Works well with Node.js/JavaScript
- **Rich queries:** Supports complex filtering and full-text search
- **Cloud-ready:** MongoDB Atlas provides managed hosting

### MongoDB Atlas Setup

- **Provider:** MongoDB Atlas (cloud)
- **Tier:** M0 (free tier, 512MB storage)
- **Region:** Auto-selected (closest to backend)
- **Features:**
  - Replica sets (automatic failover)
  - Automated backups
  - Performance monitoring
  - IP whitelist security

### Connection

```javascript
mongodb+srv://unsugar_admin:<password>@unsugar-blog.dkigttd.mongodb.net/unsugar-blog
```

**Driver:** Mongoose 8.x (ODM - Object Document Mapper)

---

## Schema Design

### Collections

```
unsugar-blog/
├── users           # User accounts & OAuth data
└── blogs           # Blog posts & metadata
```

---

## Data Models

### 1. User Model

**File:** `src/models/User.js`

**Purpose:** Store user accounts with multi-provider OAuth support

```javascript
{
  // Basic Info
  email: String (unique, required, indexed),
  name: String (required),
  avatar: String (URL),
  password: String (hashed, optional if OAuth),
  
  // OAuth Provider IDs
  googleId: String (unique, sparse index),
  githubId: String (unique, sparse index),
  appleId: String (unique, sparse index),
  
  // OAuth Provider Data
  oauthProviders: [{
    provider: String (enum: ['google', 'github', 'apple']),
    providerId: String,
    email: String,
    displayName: String,
    avatar: String,
    connectedAt: Date
  }],
  
  // Account Status
  role: String (enum: ['user', 'admin', 'moderator'], default: 'user'),
  isVerified: Boolean (default: false),
  isActive: Boolean (default: true),
  
  // Security
  refreshTokens: [{
    token: String,
    createdAt: Date,
    expiresAt: Date,
    device: String,
    ipAddress: String
  }],
  
  // Timestamps
  lastLogin: Date,
  passwordChangedAt: Date,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Key Design Decisions:**

1. **Multiple OAuth Providers**
   - User can link Google, GitHub, AND Apple to one account
   - Flexible: start with email/password, add OAuth later
   
2. **Sparse Indexes on Provider IDs**
   - Unique constraint only if value exists
   - Allows users without that provider
   
3. **Refresh Token Storage**
   - Store in DB (not just JWT)
   - Enables revocation (logout, security breach)
   - Track device/IP for security
   
4. **Password Field**
   - `select: false` by default (never in queries)
   - Optional (OAuth users don't need password)
   - bcrypt hashed (12 rounds)

**Indexes:**

```javascript
{ email: 1 }                    // Primary lookup
{ googleId: 1 }                 // OAuth lookup (sparse)
{ githubId: 1 }                 // OAuth lookup (sparse)
{ appleId: 1 }                  // OAuth lookup (sparse)
{ createdAt: -1 }               // Recent users
```

**Methods:**

```javascript
// Password comparison
user.comparePassword(candidatePassword)

// Password change tracking
user.changedPasswordAfter(JWTTimestamp)

// OAuth linking
user.linkOAuthProvider(provider, profile)
user.unlinkOAuthProvider(provider)

// Token management
user.addRefreshToken(token, expiresIn, device, ip)
user.removeRefreshToken(token)
user.cleanupExpiredTokens()
```

### 2. Blog Model

**File:** `src/models/Blog.js`

**Purpose:** Store blog posts with metadata

```javascript
{
  // Content
  title: String (required, indexed),
  slug: String (unique, required, indexed),
  excerpt: String (required),
  content: String (required),
  thumbnail: String (URL),
  
  // Metadata
  author: String (required, indexed),
  publishedDate: Date (required, indexed),
  readTime: String,
  
  // Categorization
  tags: [String] (indexed),
  category: String,
  
  // SEO
  metaDescription: String,
  metaKeywords: [String],
  
  // Engagement
  views: Number (default: 0),
  likes: Number (default: 0),
  
  // Status
  status: String (enum: ['draft', 'published', 'archived']),
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Key Design Decisions:**

1. **Slug for URLs**
   - Human-readable URLs: `/blog/arrow-functions-explained`
   - SEO-friendly
   - Unique constraint
   
2. **Tags Array**
   - Multiple tags per blog
   - Indexed for filtering
   - Full-text search ready
   
3. **Denormalized Author**
   - Store author name directly (not ID)
   - Faster queries (no JOIN)
   - Trade-off: update if author changes name

**Indexes:**

```javascript
{ slug: 1 }                               // URL lookup (unique)
{ tags: 1, publishedDate: -1 }            // Filter by tag + sort by date
{ author: 1, createdAt: -1 }              // Author's blogs
{ publishedDate: -1 }                     // Recent blogs
{ title: 'text', excerpt: 'text' }        // Full-text search
```

**Compound Index Rationale:**

`{ tags: 1, publishedDate: -1 }`
- **Use case:** "Get blogs tagged 'JavaScript', newest first"
- **Query:** `Blog.find({ tags: 'JavaScript' }).sort({ publishedDate: -1 })`
- **Performance:** O(log n) lookup + O(1) sort (index already sorted)
- **Without index:** O(n) full scan + O(n log n) sort

---

## Indexing Strategy

### Why Indexes Matter

**Without Index:**
```javascript
// Full collection scan: O(n)
db.blogs.find({ tags: 'React' })
// If 1000 blogs → checks 1000 documents
```

**With Index:**
```javascript
// Index lookup: O(log n)
db.blogs.find({ tags: 'React' })
// If 1000 blogs → checks ~10 documents
```

### Index Types Used

1. **Single Field Index**
   ```javascript
   { email: 1 }  // 1 = ascending order
   ```
   - Fast lookup by single field
   - Used for primary keys, unique constraints

2. **Compound Index**
   ```javascript
   { tags: 1, publishedDate: -1 }
   ```
   - Supports multi-field queries
   - Order matters! Can use for:
     - `{ tags: 'React', publishedDate: ... }`
     - `{ tags: 'React' }` (prefix)
   - Cannot use for: `{ publishedDate: ... }` alone

3. **Sparse Index**
   ```javascript
   { googleId: 1 }, { sparse: true }
   ```
   - Only indexes documents where field exists
   - Saves space (not all users have googleId)

4. **Text Index**
   ```javascript
   { title: 'text', excerpt: 'text' }
   ```
   - Full-text search
   - Supports natural language queries
   - Weighted scoring

### Index Cardinality

**High Cardinality (Good):**
- `email` - Every user unique → excellent for index
- `slug` - Every blog unique → excellent for index

**Medium Cardinality (Okay):**
- `tags` - ~20 unique values → good for filtering
- `author` - ~10 authors → okay for filtering

**Low Cardinality (Avoid indexing alone):**
- `status` - 3 values (draft/published/archived) → poor for index
- `isActive` - 2 values (true/false) → poor for index

### Monitoring Indexes

```javascript
// Check index usage
db.blogs.aggregate([
  { $indexStats: {} }
])

// Explain query plan
db.blogs.find({ tags: 'React' }).explain('executionStats')
```

**Look for:**
- `IXSCAN` (good - using index)
- `COLLSCAN` (bad - full collection scan)
- `nReturned` vs `totalDocsExamined` (should be close)

---

## Queries & Performance

### Common Query Patterns

#### 1. Get Recent Blogs (Paginated)

```javascript
Blog.find({ status: 'published' })
  .sort({ publishedDate: -1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .select('-content')  // Exclude large content field
  .lean();             // Return plain JS objects (faster)
```

**Index Used:** `{ publishedDate: -1 }`

**Performance:** O(log n) + O(k) where k = limit

#### 2. Filter by Tag and Sort

```javascript
Blog.find({
  tags: 'JavaScript',
  status: 'published'
})
.sort({ publishedDate: -1 })
.limit(10);
```

**Index Used:** `{ tags: 1, publishedDate: -1 }`

**Performance:** O(log n)

#### 3. Full-Text Search

```javascript
Blog.find({
  $text: { $search: 'arrow functions' }
})
.select({
  score: { $meta: 'textScore' }
})
.sort({ score: { $meta: 'textScore' } })
.limit(10);
```

**Index Used:** Text index on `{ title: 'text', excerpt: 'text' }`

**Performance:** O(log n) + scoring

#### 4. Find User by OAuth Provider

```javascript
User.findOne({ googleId: profile.id })
  .select('-password');
```

**Index Used:** `{ googleId: 1 }`

**Performance:** O(log n)

### Query Optimization Tips

1. **Use `lean()` for Read-Only**
   ```javascript
   Blog.find({}).lean()  // 10x faster for large results
   ```
   
2. **Select Only Needed Fields**
   ```javascript
   Blog.find({}).select('title slug excerpt')
   ```
   
3. **Use `limit()` Always**
   ```javascript
   Blog.find({}).limit(100)  // Prevent memory issues
   ```
   
4. **Avoid `$where` and `$regex` on Large Collections**
   ```javascript
   // Slow
   Blog.find({ title: { $regex: /react/i } })
   
   // Fast
   Blog.find({ $text: { $search: 'react' } })
   ```

---

## Migrations

### Initial Data Seed

**File:** `src/scripts/seedBlogs.js`

```javascript
const Blog = require('../models/Blog');
const blogsData = require('../data/blogs');

const seedBlogs = async () => {
  // Clear existing
  await Blog.deleteMany({});
  
  // Insert blogs
  await Blog.insertMany(blogsData);
  
  console.log('✅ Blogs seeded');
};
```

**Run:**
```bash
npm run seed
```

### Schema Migrations

**When to migrate:**
- Add new field
- Change field type
- Add index
- Rename field

**Example: Add `views` field to existing blogs**

```javascript
// migration-add-views.js
const Blog = require('../models/Blog');

const migrate = async () => {
  await Blog.updateMany(
    { views: { $exists: false } },
    { $set: { views: 0 } }
  );
  
  console.log('✅ Migration complete');
};
```

---

## Backup & Recovery

### Automated Backups (MongoDB Atlas)

- **Frequency:** Daily
- **Retention:** 7 days (free tier)
- **Location:** Same region as cluster

### Manual Export

```bash
# Export collection
mongodump --uri="mongodb+srv://..." --collection=blogs --out=backup/

# Import collection
mongorestore --uri="mongodb+srv://..." --collection=blogs backup/blogs.bson
```

---

## Monitoring

### MongoDB Atlas Dashboard

**Metrics to watch:**
- **Connections:** Should stay < 500 (free tier limit)
- **Query performance:** Slow queries > 100ms
- **Storage:** < 512MB (free tier limit)
- **Index usage:** Ensure indexes are being used

### Alerts

Set up alerts for:
- High CPU usage (> 80%)
- Slow queries (> 1000ms)
- Connection spikes
- Storage approaching limit

---

## Best Practices

### ✅ Do

1. **Always use indexes for queries**
2. **Use `lean()` for read-only queries**
3. **Select only needed fields**
4. **Use connection pooling** (default with Mongoose)
5. **Handle connection errors gracefully**
6. **Use transactions for multi-document updates** (if needed)

### ❌ Don't

1. **Don't fetch entire collections** (use pagination)
2. **Don't use `$where` in production** (slow)
3. **Don't store large files in MongoDB** (use S3/CDN)
4. **Don't create too many indexes** (slows writes)
5. **Don't expose MongoDB to public internet** (use whitelist)

---

## Next: [Design Decisions →](./05-DESIGN_DECISIONS.md)
