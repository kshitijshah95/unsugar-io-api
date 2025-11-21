const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  
  // Password (only for email/password auth)
  password: {
    type: String,
    required: function() {
      // Password required only if no OAuth providers linked
      return !this.googleId && !this.githubId && !this.appleId;
    },
    minlength: 8,
    select: false // Don't include password in queries by default
  },
  
  // OAuth Provider IDs
  googleId: {
    type: String,
    sparse: true,
    unique: true,
    index: true
  },
  githubId: {
    type: String,
    sparse: true,
    unique: true,
    index: true
  },
  appleId: {
    type: String,
    sparse: true,
    unique: true,
    index: true
  },
  
  // OAuth Provider Data (store provider-specific info)
  oauthProviders: [{
    provider: {
      type: String,
      enum: ['google', 'github', 'apple'],
      required: true
    },
    providerId: {
      type: String,
      required: true
    },
    email: String,
    displayName: String,
    avatar: String,
    accessToken: String, // Encrypted in production
    refreshToken: String, // Encrypted in production
    connectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Account Status
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Security
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date,
    device: String,
    ipAddress: String
  }],
  
  // Timestamps
  lastLogin: Date,
  passwordChangedAt: Date
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ githubId: 1 }, { sparse: true });
userSchema.index({ appleId: 1 }, { sparse: true });
userSchema.index({ createdAt: -1 });

/**
 * Hash password before saving
 */
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified and exists
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password for login
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if password was changed after JWT token was issued
 */
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * Link OAuth provider to existing account
 */
userSchema.methods.linkOAuthProvider = function(provider, profile) {
  // Check if provider already linked
  const existingProvider = this.oauthProviders.find(p => p.provider === provider);
  
  if (existingProvider) {
    // Update existing provider data
    existingProvider.providerId = profile.id;
    existingProvider.email = profile.email;
    existingProvider.displayName = profile.displayName;
    existingProvider.avatar = profile.avatar;
  } else {
    // Add new provider
    this.oauthProviders.push({
      provider,
      providerId: profile.id,
      email: profile.email,
      displayName: profile.displayName,
      avatar: profile.avatar
    });
    
    // Set provider ID field
    if (provider === 'google') this.googleId = profile.id;
    if (provider === 'github') this.githubId = profile.id;
    if (provider === 'apple') this.appleId = profile.id;
  }
  
  // Update avatar if not set
  if (!this.avatar && profile.avatar) {
    this.avatar = profile.avatar;
  }
  
  // Mark as verified if OAuth provider email verified
  if (profile.emailVerified) {
    this.isVerified = true;
  }
};

/**
 * Unlink OAuth provider
 */
userSchema.methods.unlinkOAuthProvider = function(provider) {
  this.oauthProviders = this.oauthProviders.filter(p => p.provider !== provider);
  
  // Clear provider ID field
  if (provider === 'google') this.googleId = undefined;
  if (provider === 'github') this.githubId = undefined;
  if (provider === 'apple') this.appleId = undefined;
};

/**
 * Add refresh token
 */
userSchema.methods.addRefreshToken = function(token, expiresIn, device, ipAddress) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  
  this.refreshTokens.push({
    token,
    expiresAt,
    device,
    ipAddress
  });
  
  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

/**
 * Remove refresh token
 */
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
};

/**
 * Clean up expired refresh tokens
 */
userSchema.methods.cleanupExpiredTokens = function() {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(rt => rt.expiresAt > now);
};

/**
 * Get safe user object (without sensitive data)
 */
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  
  delete user.password;
  delete user.refreshTokens;
  delete user.__v;
  
  // Clean OAuth provider data
  if (user.oauthProviders) {
    user.oauthProviders = user.oauthProviders.map(provider => ({
      provider: provider.provider,
      connectedAt: provider.connectedAt
    }));
  }
  
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
