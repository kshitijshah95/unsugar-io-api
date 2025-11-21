# 🔧 Fix Render MongoDB Connection

## Current Status
✅ **Trust proxy enabled** - Pushed to GitHub  
⏳ **MongoDB URI missing** - Need to add to Render

---

## 🚀 Add MongoDB URI to Render (2 minutes)

### Option 1: Via Dashboard (Easiest)

1. **Open Render Dashboard**
   - Go to: https://dashboard.render.com
   - Login if needed

2. **Select Your Service**
   - Click on `unsugar-api` (or `unsugar-io-api`)

3. **Go to Environment Tab**
   - Look for "Environment" in the left sidebar
   - Click it

4. **Add Environment Variable**
   - Click "Add Environment Variable" button
   - Fill in:
     ```
     Key: MONGODB_URI
     Value: mongodb+srv://unsugar_admin:zAZD87coVNi2p9IG@unsugar-blog.dkigttd.mongodb.net/unsugar-blog?appName=unsugar-blog
     ```

5. **Save**
   - Click "Save Changes"
   - Render will auto-redeploy (takes 2-3 minutes)

---

## ✅ After Deployment

### Test Your API:

```bash
# Health check
curl https://unsugar-io-api.onrender.com/health

# Get blogs
curl https://unsugar-io-api.onrender.com/api/v1/blogs

# Get tags
curl https://unsugar-io-api.onrender.com/api/v1/blogs/tags/all
```

---

## 🔍 Verify Environment Variables

Your Render service should have these environment variables:

```
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://unsugar.io,https://unsugar-io.netlify.app
MONGODB_URI=mongodb+srv://unsugar_admin:***@unsugar-blog.dkigttd.mongodb.net/unsugar-blog
```

---

## 🐛 If You Still See Errors

### Check Render Logs:
1. In Render Dashboard → Your service
2. Click "Logs" tab
3. Look for:
   - ✅ "MongoDB Connected: ac-2rr5odb..."
   - ✅ "Server is running!"

### Common Issues:

**❌ "Authentication failed"**
- MongoDB password might be wrong
- Check MongoDB Atlas → Database Access → User permissions

**❌ "Network timeout"**
- Check MongoDB Atlas → Network Access
- Make sure `0.0.0.0/0` is allowed (or add Render IPs)

**❌ "Database not found"**
- Make sure database name is in the URI: `/unsugar-blog?`
- Run seed script: In Render Shell → `npm run seed`

---

## 📝 What We Fixed

1. ✅ **Trust Proxy**: Enabled in Express to work with Render's proxy
2. ⏳ **MongoDB URI**: Add this to Render environment variables (you're doing this now)

Once both are done, your API will work perfectly on Render! 🎉
