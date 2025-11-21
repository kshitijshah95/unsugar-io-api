# 🗄️ Database Migration Guide - Move Blogs to Database

## Current Status
- **Static data**: 5 blogs in `/src/data/blogs.js`
- **In-memory storage**: Data resets on server restart
- **No persistence**: Can't add/edit blogs without code changes

## Goal
Move blogs to a real database with full CRUD operations.

---

## Option 1: MongoDB Atlas (Recommended - Easiest)

### Why MongoDB?
- ✅ **Free tier**: 512MB storage
- ✅ **No schema changes**: JSON-like documents
- ✅ **Easy setup**: Cloud-hosted
- ✅ **Perfect for blogs**: Flexible content structure

### Step 1: Set Up MongoDB Atlas (5 min)

1. **Go to**: https://www.mongodb.com/cloud/atlas/register
2. **Sign up** (free account)
3. **Create a cluster**:
   - Choose: **M0 Free**
   - Provider: AWS
   - Region: `us-east-1` (or closest to Render)
   - Cluster Name: `unsugar-cluster`
4. **Create Database User**:
   - Username: `unsugar_admin`
   - Password: (generate strong password) - **SAVE THIS!**
5. **Network Access**:
   - Click "Network Access"
   - Add IP: `0.0.0.0/0` (allow from anywhere - for Render)
   - Or add Render's IPs specifically
6. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy connection string:
     ```
     mongodb+srv://unsugar_admin:<password>@unsugar-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password

### Step 2: Install Dependencies

```bash
cd /Users/kshitijshah/Desktop/Workspaces/unsugar-api
npm install mongoose
```

### Step 3: Create Blog Model

Create `/src/models/Blog.js`

### Step 4: Create Database Connection

Create `/src/config/database.js`

### Step 5: Update Routes

Modify `/src/routes/blogs.js` to use MongoDB

### Step 6: Seed Initial Data

Create `/src/scripts/seedBlogs.js` to migrate existing blogs

### Step 7: Update Environment Variables

Add to `.env`:
```
MONGODB_URI=mongodb+srv://unsugar_admin:YOUR_PASSWORD@unsugar-cluster.xxxxx.mongodb.net/unsugar-blog?retryWrites=true&w=majority
```

---

## Option 2: PostgreSQL with Supabase (SQL Alternative)

### Why PostgreSQL?
- ✅ **Free tier**: 500MB database
- ✅ **SQL**: Structured queries
- ✅ **Relations**: If you add authors, categories, etc.
- ✅ **Supabase**: Easy PostgreSQL hosting

### Step 1: Set Up Supabase

1. **Go to**: https://supabase.com
2. **Sign up** (free account)
3. **Create new project**:
   - Name: `unsugar-blog`
   - Database Password: (generate & save)
   - Region: Choose closest to you
4. **Get Connection String**:
   - Settings → Database → Connection string
   - Use "Connection pooling" for production

### Step 2: Install Dependencies

```bash
npm install pg
```

---

## 🚀 Implementation (MongoDB - Recommended)

I'll provide the code for MongoDB implementation below.

---

## 📊 Data Migration Strategy

1. **Keep static data**: Don't delete `blogs.js` yet
2. **Create seeder script**: Migrate data to database
3. **Test locally**: Verify database works
4. **Update Render**: Add MongoDB URI environment variable
5. **Deploy**: Push changes to GitHub
6. **Seed production**: Run seed script on Render
7. **Remove static data**: After verification

---

## ⚙️ Environment Variables Needed

### Local (.env)
```env
MONGODB_URI=mongodb://localhost:27017/unsugar-blog
# OR for Atlas:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/unsugar-blog
```

### Production (Render)
```env
MONGODB_URI=mongodb+srv://unsugar_admin:YOUR_PASSWORD@unsugar-cluster.xxxxx.mongodb.net/unsugar-blog?retryWrites=true&w=majority
NODE_ENV=production
CORS_ORIGIN=https://unsugar.io
```

---

## 📝 New API Endpoints After Migration

Once database is set up, you can add:

- `POST /api/v1/blogs` - Create new blog
- `PUT /api/v1/blogs/:id` - Update blog
- `DELETE /api/v1/blogs/:id` - Delete blog
- `POST /api/v1/blogs/:id/publish` - Publish draft
- `GET /api/v1/blogs?status=draft` - Filter by status

---

## 🧪 Testing Locally

### Option A: MongoDB Atlas (cloud)
- Use Atlas connection string
- No local MongoDB needed

### Option B: Local MongoDB
```bash
# Install MongoDB locally (Mac)
brew install mongodb-community
brew services start mongodb-community

# Use local connection string
MONGODB_URI=mongodb://localhost:27017/unsugar-blog
```

---

## ⏱️ Time Estimate

- **MongoDB Atlas setup**: 5-10 minutes
- **Code changes**: 20-30 minutes
- **Testing**: 10 minutes
- **Deployment**: 5 minutes

**Total**: ~1 hour

---

## 🎯 Quick Start (MongoDB)

Want me to implement this? I can:
1. Create all necessary files (models, database config, seed script)
2. Update your routes to use MongoDB
3. Create migration script for your existing blogs
4. Test locally
5. Deploy to production

Ready to start? Let me know and I'll implement the MongoDB solution!
