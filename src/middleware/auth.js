const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const { AuthenticationError } = require('./errorHandler');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }
    
    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      throw new AuthenticationError('Password recently changed. Please login again.');
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const authenticateOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive && !user.changedPasswordAfter(decoded.iat)) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

/**
 * Check if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      if (!roles.includes(req.user.role)) {
        const { AuthorizationError } = require('./errorHandler');
        throw new AuthorizationError('Insufficient permissions');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { 
  authenticate, 
  authenticateOptional,
  authorize 
};
