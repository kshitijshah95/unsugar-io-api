# 🎯 Design Decisions - Database

> Database technology choices and schema design rationale

---

## Database Technology Decisions

### 1. MongoDB vs PostgreSQL vs MySQL

**Chose:** MongoDB 7.x with Mongoose

**Comparison:**

| Factor | MongoDB | PostgreSQL | MySQL |
|--------|---------|------------|-------|
| Schema flexibility | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| JSON storage | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Horizontal scaling | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Complex joins | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| ACID transactions | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Learning curve | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

**Why MongoDB for a blog platform?**

1. **Flexible Schema**
   - Blog content varies (text, code, images, embeds)
   - Easy to add new fields without migrations
   - Can store rich metadata

2. **JSON-Native**
   - Node.js works naturally with JSON
   - No ORM impedance mismatch
   - Fast development

3. **Horizontal Scaling**
   - Built-in sharding
   - Easy to scale as traffic grows
   - Replica sets for high availability

4. **Our Use Case**
   - Simple relationships (no complex joins needed)
   - Document-oriented data (blogs, users)
   - Read-heavy workload (perfect for MongoDB)

**When we'd use PostgreSQL:**
- Need for complex joins (e.g., many-to-many relationships)
- Strict ACID requirements
- Analytical queries (aggregations, window functions)
- Relational data model

**Trade-offs:**
- ✅ Perfect for document storage, horizontal scaling
- ❌ Weaker for complex relationships
- ✅ Worth it for: blog content flexibility, scaling

---

### 2. Mongoose vs Native MongoDB Driver

**Chose:** Mongoose 8.x

**Why Mongoose?**

**Code comparison:**

```javascript
// Native MongoDB Driver (more verbose)
const { MongoClient } = require('mongodb');
const client = new MongoClient(uri);
await client.connect();
const db = client.db('unsugar-blog');
const blogs = await db.collection('blogs')
  .find({ tags: 'JavaScript' })
  .toArray();

// Mongoose (cleaner, with schema)
const Blog = mongoose.model('Blog', blogSchema);
const blogs = await Blog.find({ tags: 'JavaScript' });
```

**Mongoose advantages:**
- ✅ **Schema validation:** Enforce data structure
- ✅ **Middleware:** Pre/post hooks for logic
- ✅ **Virtuals:** Computed properties
- ✅ **Methods:** Add custom model methods
- ✅ **Plugins:** Extend functionality
- ✅ **TypeScript support:** Better DX

**Example of schema validation:**

```javascript
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 200
  },
  tags: {
    type: [String],
    validate: {
      validator: (v) => v.length <= 10,
      message: 'Maximum 10 tags allowed'
    }
  }
});
```

**Trade-offs:**
- ✅ Better DX, validation, features
- ❌ Slight performance overhead
- ❌ Larger bundle size
- ✅ Worth it for: data integrity, DX

---

## Schema Design Decisions

### 1. User Model - Multi-Provider OAuth Support

**Decision:** Support multiple OAuth providers per user

**Schema:**

```javascript
{
  email: String (unique),
  googleId: String (unique, sparse),
  githubId: String (unique, sparse),
  appleId: String (unique, sparse),
  oauthProviders: [{
    provider: String,
    providerId: String,
    email: String
  }]
}
```

**Why this design?**

1. **Flexibility**
   - User can link Google AND GitHub to one account
   - Start with email, add OAuth later
   - Disconnect providers

2. **Sparse Indexes**
   ```javascript
   { googleId: 1 }, { sparse: true, unique: true }
   ```
   - Unique constraint only if value exists
   - Allows users without that provider
   - Saves storage (null values not indexed)

**Alternative considered:**
```javascript
// Separate table for providers (more normalized)
users: { id, email, password }
oauth_providers: { userId, provider, providerId }
```

**Why we didn't choose it:**
- More complex queries (joins)
- MongoDB not optimized for joins
- Current design simpler, faster

**Trade-offs:**
- ✅ Simpler queries, faster
- ❌ Slight denormalization
- ✅ Worth it for: MongoDB strengths

---

### 2. Blog Model - Denormalized Author

**Decision:** Store author name directly, not reference

**Schema:**

```javascript
{
  title: String,
  author: String,  // Not: authorId
  content: String
}
```

**Why denormalize?**

**Query comparison:**

```javascript
// Denormalized (one query)
const blogs = await Blog.find({ author: 'John Doe' });
// Fast: O(log n) with index

// Normalized (two queries or join)
const user = await User.findOne({ name: 'John Doe' });
const blogs = await Blog.find({ authorId: user._id });
// OR
const blogs = await Blog.aggregate([
  {
    $lookup: {
      from: 'users',
      localField: 'authorId',
      foreignField: '_id',
      as: 'author'
    }
  }
]);
// Slow: aggregation pipeline
```

**Benefits:**
- ✅ One query instead of two
- ✅ Faster (no join)
- ✅ Simpler code

**Drawbacks:**
- ❌ Must update all blogs if author changes name
- ❌ Data duplication

**When is this okay?**
- Author names rarely change
- Read-heavy workload (optimize for reads)
- Can add batch update script if needed

**Trade-offs:**
- ✅ Much faster queries
- ❌ Update complexity if author changes
- ✅ Worth it for: read performance

---

### 3. Refresh Tokens - Embedded vs Separate Collection

**Decision:** Embed refresh tokens in User model

**Schema:**

```javascript
// User model
{
  email: String,
  refreshTokens: [{
    token: String,
    expiresAt: Date,
    device: String
  }]
}
```

**Why embed?**

1. **Single query for auth**
   ```javascript
   const user = await User.findById(userId);
   const validToken = user.refreshTokens.find(rt => rt.token === token);
   ```

2. **Atomic updates**
   ```javascript
   user.refreshTokens.push(newToken);
   await user.save();  // Atomic
   ```

3. **Limited size**
   - Max 5 tokens per user
   - Total: ~500 bytes per user
   - Well within 16MB document limit

**Alternative (separate collection):**
```javascript
users: { _id, email }
refresh_tokens: { userId, token, expiresAt }
```

**Why we didn't:**
- Need two queries
- More complex (manage two collections)
- No real benefit for small arrays

**Trade-offs:**
- ✅ Faster, simpler
- ❌ Not suitable for large arrays
- ✅ Worth it for: small, bounded arrays

---

## Indexing Decisions

### 1. Compound Index Strategy

**Decision:** Create compound indexes for common query patterns

**Example:**

```javascript
{ tags: 1, publishedDate: -1 }
```

**Why compound?**

**Query it supports:**
```javascript
// Perfect: Uses full index
Blog.find({ tags: 'React' }).sort({ publishedDate: -1 });

// Good: Uses prefix
Blog.find({ tags: 'React' });

// Bad: Can't use this index
Blog.find({}).sort({ publishedDate: -1 });
```

**Benefits:**
- ✅ One index serves multiple queries
- ✅ Faster than separate indexes
- ✅ Less storage

**Order matters:**
```javascript
{ tags: 1, publishedDate: -1 }    // Different from
{ publishedDate: -1, tags: 1 }    // This one
```

**Rule:** Put equality fields first, sort fields last

**Trade-offs:**
- ✅ Better query performance, less storage
- ❌ Must think about query patterns
- ✅ Worth it for: common queries

---

### 2. Sparse Index for OAuth IDs

**Decision:** Sparse indexes on googleId, githubId, appleId

**Schema:**

```javascript
{ googleId: 1 }, { sparse: true, unique: true }
```

**Why sparse?**

**Without sparse:**
```javascript
// All null values indexed
users: [
  { _id: 1, email: 'a@ex.com', googleId: null },  // Indexed
  { _id: 2, email: 'b@ex.com', googleId: null },  // Indexed
  { _id: 3, email: 'c@ex.com', googleId: null }   // Indexed
]
// Unique constraint: Can't have multiple nulls!
```

**With sparse:**
```javascript
// Only non-null values indexed
users: [
  { _id: 1, email: 'a@ex.com', googleId: null },  // NOT indexed
  { _id: 2, email: 'b@ex.com', googleId: '123' }, // Indexed
  { _id: 3, email: 'c@ex.com', googleId: null }   // NOT indexed
]
// Multiple nulls OK, unique only for actual values
```

**Benefits:**
- ✅ Saves storage (nulls not indexed)
- ✅ Allows unique constraint on optional fields
- ✅ Faster lookups (smaller index)

---

### 3. Text Index for Search

**Decision:** Text index on title and excerpt

**Schema:**

```javascript
{ title: 'text', excerpt: 'text' }
```

**Why text index?**

**Query:**
```javascript
Blog.find({ $text: { $search: 'arrow functions' } })
  .select({ score: { $meta: 'textScore' } })
  .sort({ score: { $meta: 'textScore' } });
```

**Benefits:**
- ✅ Full-text search
- ✅ Relevance scoring
- ✅ Supports natural language
- ✅ Case-insensitive

**Limitations:**
- ❌ One text index per collection
- ❌ Slower than exact match
- ❌ Can't use with other indexes

**When we'd upgrade:**
- Add Elasticsearch for advanced search
- Add faceted search
- Add search suggestions

**Trade-offs:**
- ✅ Good enough for blog search
- ❌ Limited features
- ✅ Worth it for: current needs

---

## Data Integrity Decisions

### 1. Required Fields

**Decision:** Mark critical fields as required

**Schema:**

```javascript
{
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true }
}
```

**Why?**
- ✅ Enforces data integrity at DB level
- ✅ Prevents incomplete documents
- ✅ Clear contract

**Validation happens:**
1. Mongoose schema validation
2. MongoDB server validation (if enabled)

---

### 2. Default Values

**Decision:** Use defaults for optional fields

**Schema:**

```javascript
{
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}
```

**Benefits:**
- ✅ Consistent data
- ✅ Fewer null checks in code
- ✅ Better query performance

---

### 3. Password Storage

**Decision:** Never return password by default

**Schema:**

```javascript
password: {
  type: String,
  select: false  // Never include in queries by default
}
```

**Usage:**

```javascript
// Default: No password
const user = await User.findById(id);
// user.password → undefined

// Explicit: Include password
const user = await User.findById(id).select('+password');
// user.password → hashed value
```

**Benefits:**
- ✅ Can't accidentally leak passwords
- ✅ Must explicitly request
- ✅ Security by default

---

## Performance Optimizations

### 1. Lean Queries for Read-Only

**Decision:** Use `.lean()` for data not being modified

**Example:**

```javascript
// Regular query (creates Mongoose document)
const blogs = await Blog.find({});
// Returns: Mongoose documents with methods, virtuals, etc.
// Slower, uses more memory

// Lean query (plain JavaScript objects)
const blogs = await Blog.find({}).lean();
// Returns: Plain JS objects
// 5-10x faster for large result sets
```

**When to use:**
- ✅ Read-only data
- ✅ API responses
- ✅ Large result sets

**When NOT to use:**
- ❌ Need to call `.save()`
- ❌ Need virtuals/methods
- ❌ Small result sets

---

### 2. Field Selection

**Decision:** Only select needed fields

**Example:**

```javascript
// Bad: Get all fields
const blogs = await Blog.find({});
// Returns: title, content, author, tags, createdAt, updatedAt, ...

// Good: Only needed fields
const blogs = await Blog.find({}).select('title slug excerpt');
// Returns: Only title, slug, excerpt
// Faster, less bandwidth
```

---

## Future Improvements

### Planned

1. **Add Blog Analytics Collection** (Q2 2026)
   ```javascript
   {
     blogId: ObjectId,
     views: Number,
     uniqueVisitors: Number,
     avgTimeOnPage: Number,
     date: Date
   }
   ```
   - Track engagement metrics
   - Time-series data
   - Aggregate by day/week/month

2. **Add Comments Collection** (Q3 2026)
   ```javascript
   {
     blogId: ObjectId,
     userId: ObjectId,
     content: String,
     createdAt: Date
   }
   ```
   - User comments on blogs
   - Threaded discussions
   - Moderation support

3. **Add Full-Text Search (Elasticsearch)** (when needed)
   - Better search relevance
   - Faceted search
   - Search suggestions

---

## Summary

### Key Principles

1. **Denormalize for reads** - Blog platform is read-heavy
2. **Index common queries** - Optimize for actual usage patterns
3. **Embed small arrays** - Simpler than separate collections
4. **Validate at DB level** - Data integrity

### Technology Choices

- **MongoDB:** Perfect for flexible blog content
- **Mongoose:** Schema validation, better DX
- **Compound indexes:** Optimize common queries
- **Denormalization:** Faster reads, acceptable trade-off

All choices optimized for a read-heavy blog platform with flexible content.
