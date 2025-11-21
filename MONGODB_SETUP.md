# 🗄️ MongoDB Setup & Testing Guide

## ✅ What We've Implemented

- ✅ **Mongoose installed**: ORM for MongoDB
- ✅ **Blog model created**: Schema with validation
- ✅ **Database connection**: Auto-connects on server start
- ✅ **Routes updated**: All routes now use MongoDB
- ✅ **Seed script ready**: Migrates existing 5 blogs to database
- ✅ **.env.example created**: Configuration template

---

## 🚀 Quick Start (MongoDB Atlas - Cloud)

### Step 1: Create MongoDB Atlas Account (5 min)

1. **Go to**: https://www.mongodb.com/cloud/atlas/register
2. **Sign up** with email or GitHub
3. **Create Free Cluster**:
   - Click "Build a Database"
   - Choose: **M0 Free**
   - Provider: AWS
   - Region: `us-east-1` (closest to Render)
   - Click "Create"

### Step 2: Create Database User

1. **Security → Database Access**
2. Click "Add New Database User"
3. **Authentication Method**: Password
4. **Username**: `unsugar_admin`
5. **Password**: Click "Autogenerate" and **SAVE IT**
6. **Database User Privileges**: "Atlas admin"
7. Click "Add User"

### Step 3: Allow Network Access

1. **Security → Network Access**
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
   - IP: `0.0.0.0/0`
4. Click "Confirm"

### Step 4: Get Connection String

1. Click "Database" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: Node.js, Version: 5.5 or later
5. **Copy connection string**:
   ```
   mongodb+srv://unsugar_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace `<password>`** with your actual password
7. **Add database name** before the `?`:
   ```
   mongodb+srv://unsugar_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/unsugar-blog?retryWrites=true&w=majority
   ```

### Step 5: Update .env File

Add to `/Users/kshitijshah/Desktop/Workspaces/unsugar-api/.env`:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://unsugar_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/unsugar-blog?retryWrites=true&w=majority
```

### Step 6: Seed Database with Existing Blogs

```bash
cd /Users/kshitijshah/Desktop/Workspaces/unsugar-api
npm run seed
```

**Expected output:**
```
✅ Connected to MongoDB
🗑️  Deleted 0 existing blogs
✅ Seeded 5 blogs successfully

📚 Seeded blogs:
  - Desugaring Arrow Functions (1)
  - Desugaring ES6 Classes (2)
  - Desugaring Async/Await (3)
  - Desugaring Destructuring Assignment (4)
  - Desugaring Template Literals (5)

🎉 Database seeding completed!
```

### Step 7: Start Server

```bash
npm run dev
```

**You should see:**
```
✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
📊 Database: unsugar-blog
🚀 Server is running!
```

### Step 8: Test API

```bash
# Test getting all blogs
curl http://localhost:3001/api/v1/blogs | jq .

# Test getting single blog
curl http://localhost:3001/api/v1/blogs/1 | jq .

# Test tags
curl http://localhost:3001/api/v1/blogs/tags/all | jq .
```

---

## 🔄 Alternative: Local MongoDB (For Development)

### Install MongoDB Locally (Mac)

```bash
# Install MongoDB
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify it's running
mongosh
```

### Update .env

```env
MONGODB_URI=mongodb://localhost:27017/unsugar-blog
```

### Seed and Run

```bash
npm run seed
npm run dev
```

---

## 🚀 Deploy to Production (Render)

### Step 1: Push Code to GitHub

```bash
cd /Users/kshitijshah/Desktop/Workspaces/unsugar-api
git add .
git commit -m "Add MongoDB database integration"
git push origin main
```

### Step 2: Add Environment Variable on Render

1. Go to: https://dashboard.render.com
2. Click on `unsugar-api` service
3. **Environment** tab
4. Add new environment variable:
   ```
   Key: MONGODB_URI
   Value: mongodb+srv://unsugar_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/unsugar-blog?retryWrites=true&w=majority
   ```
5. Click "Save Changes"

Render will auto-deploy with the new changes.

### Step 3: Seed Production Database

After deployment completes:

1. **Shell** tab in Render
2. Run:
   ```bash
   npm run seed
   ```

---

## 🧪 Testing MongoDB Connection

### Test Script

Create a quick test file:

```javascript
// test-db.js
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });
```

Run: `node test-db.js`

---

## 📋 Summary of Changes

### New Files:
- `/src/models/Blog.js` - Mongoose schema/model
- `/src/config/database.js` - Database connection
- `/src/scripts/seedBlogs.js` - Migration script
- `.env.example` - Environment variables template

### Modified Files:
- `/src/routes/blogs.js` - All routes now use MongoDB
- `/src/server.js` - Connects to MongoDB on startup
- `/src/config/config.js` - Added MongoDB URI config
- `package.json` - Added seed script

### Static Data:
- `/src/data/blogs.js` - **Still exists** (used by seed script)

---

## 🎯 Next Steps

After MongoDB is working:

1. ✅ **Test locally**: Verify all endpoints work
2. ✅ **Deploy to Render**: Push changes + add MONGODB_URI
3. ✅ **Seed production**: Run seed script on Render
4. ✅ **Test live API**: Verify blogs load on frontend
5. ✅ **Add CRUD endpoints**: POST, PUT, DELETE blogs (optional)

---

## 🆘 Troubleshooting

### "MongoNetworkError: failed to connect"
- Check connection string is correct
- Verify password doesn't have special characters (URL encode if needed)
- Check Network Access allows your IP (0.0.0.0/0)

### "Authentication failed"
- Double-check username and password
- Ensure user has correct privileges

### "Cannot find module 'mongoose'"
```bash
npm install mongoose
```

### Seed script fails
- Ensure MONGODB_URI is set in .env
- Check MongoDB is running (Atlas or local)
- Verify blogs.js file exists

---

## ✅ Ready to Go!

Your MongoDB integration is complete! Choose your path:

**Path A - Cloud (Recommended):**
1. Create MongoDB Atlas account (5 min)
2. Get connection string
3. Update .env
4. Run `npm run seed`
5. Run `npm run dev`

**Path B - Local:**
1. Install MongoDB locally
2. Update .env with localhost URI
3. Run `npm run seed`
4. Run `npm run dev`

Both paths lead to the same result: a database-backed blog API! 🎉
