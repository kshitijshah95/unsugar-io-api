/**
 * Environment Setup Script
 * Generates JWT secrets and creates .env file
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate random secrets
const generateSecret = () => crypto.randomBytes(32).toString('hex');

const envTemplate = `# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,https://unsugar.io,https://unsugar-io.netlify.app

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:5173

# API Base URL (for OAuth callbacks)
API_BASE_URL=http://localhost:3001

# MongoDB Configuration
MONGODB_URI=mongodb+srv://unsugar_admin:zAZD87coVNi2p9IG@unsugar-blog.dkigttd.mongodb.net/unsugar-blog?appName=unsugar-blog

# JWT Secrets (auto-generated)
JWT_ACCESS_SECRET=${generateSecret()}
JWT_REFRESH_SECRET=${generateSecret()}

# Google OAuth (get from https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# GitHub OAuth (get from https://github.com/settings/developers)
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here

# Apple Sign In (optional - get from https://developer.apple.com)
# APPLE_CLIENT_ID=your-apple-service-id
# APPLE_TEAM_ID=your-apple-team-id
# APPLE_KEY_ID=your-apple-key-id
# APPLE_PRIVATE_KEY_PATH=path/to/AuthKey_XXX.p8
`;

const envPath = path.join(__dirname, '.env');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('');
  console.log('To regenerate, delete .env and run this script again.');
  console.log('Or manually add these JWT secrets to your .env:');
  console.log('');
  console.log(`JWT_ACCESS_SECRET=${generateSecret()}`);
  console.log(`JWT_REFRESH_SECRET=${generateSecret()}`);
  console.log('');
  process.exit(0);
}

// Create .env file
fs.writeFileSync(envPath, envTemplate);

console.log('✅ .env file created successfully!');
console.log('');
console.log('📝 Next steps:');
console.log('1. Update OAuth credentials in .env file');
console.log('2. See SSO_IMPLEMENTATION_GUIDE.md for OAuth setup');
console.log('3. Run: npm start');
console.log('');
console.log('🔐 JWT Secrets have been auto-generated');
