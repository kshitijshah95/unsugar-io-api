/**
 * Feature Flags Configuration
 * Central place to enable/disable features
 */

const features = {
  // SSO Authentication (DISABLED)
  enableGoogleSSO: false,
  enableGitHubSSO: false,
  enableAppleSSO: false,
  
  // Email/Password Authentication (ENABLED)
  enableEmailAuth: true,
  
  // Blog Features
  enableBlogTracking: true,
  
  // User Profile
  enableProfileEditing: true,
};

/**
 * Helper function to check if a feature is enabled
 */
const isFeatureEnabled = (feature) => {
  return features[feature] === true;
};

/**
 * Check if any SSO provider is enabled
 */
const isAnySSOEnabled = () => {
  return features.enableGoogleSSO || features.enableGitHubSSO || features.enableAppleSSO;
};

module.exports = {
  features,
  isFeatureEnabled,
  isAnySSOEnabled,
};
