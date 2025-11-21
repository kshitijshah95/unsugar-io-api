#!/bin/bash

# Quick script to add MongoDB URI to Render via CLI
# Make sure you have Render CLI installed: npm install -g render-cli

echo "🔧 Setting MongoDB URI on Render..."
echo ""
echo "Run this command in Render Dashboard > Shell:"
echo ""
echo "Or manually add in Environment tab:"
echo ""
echo "Key: MONGODB_URI"
echo "Value: mongodb+srv://unsugar_admin:zAZD87coVNi2p9IG@unsugar-blog.dkigttd.mongodb.net/unsugar-blog?appName=unsugar-blog"
echo ""
echo "After adding, Render will auto-redeploy (~2-3 minutes)"
