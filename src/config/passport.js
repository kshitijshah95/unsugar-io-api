const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

/**
 * Google OAuth Strategy
 */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/v1/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        
        // Check if user exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (!user) {
          // Check if user exists with this email
          user = await User.findOne({ email });
          
          if (user) {
            // Link Google account to existing user
            user.linkOAuthProvider('google', {
              id: profile.id,
              email,
              displayName: profile.displayName,
              avatar: profile.photos[0]?.value,
              emailVerified: profile.emails[0].verified
            });
            await user.save();
          } else {
            // Create new user
            user = await User.create({
              email,
              name: profile.displayName,
              googleId: profile.id,
              avatar: profile.photos[0]?.value,
              isVerified: profile.emails[0].verified,
              oauthProviders: [{
                provider: 'google',
                providerId: profile.id,
                email,
                displayName: profile.displayName,
                avatar: profile.photos[0]?.value
              }]
            });
          }
        }
        
        user.lastLogin = new Date();
        await user.save();
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
}

/**
 * GitHub OAuth Strategy
 */
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/v1/auth/github/callback`,
      scope: ['user:email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        
        if (!email) {
          return done(new Error('Email not provided by GitHub'), null);
        }
        
        // Check if user exists with this GitHub ID
        let user = await User.findOne({ githubId: profile.id });
        
        if (!user) {
          // Check if user exists with this email
          user = await User.findOne({ email });
          
          if (user) {
            // Link GitHub account to existing user
            user.linkOAuthProvider('github', {
              id: profile.id,
              email,
              displayName: profile.displayName,
              avatar: profile.photos[0]?.value,
              emailVerified: true
            });
            await user.save();
          } else {
            // Create new user
            user = await User.create({
              email,
              name: profile.displayName || profile.username,
              githubId: profile.id,
              avatar: profile.photos[0]?.value,
              isVerified: true,
              oauthProviders: [{
                provider: 'github',
                providerId: profile.id,
                email,
                displayName: profile.displayName || profile.username,
                avatar: profile.photos[0]?.value
              }]
            });
          }
        }
        
        user.lastLogin = new Date();
        await user.save();
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
}

/**
 * Apple Sign In Strategy
 * Note: Requires additional setup - see SSO_IMPLEMENTATION_GUIDE.md
 */
// Uncomment when Apple credentials are configured
/*
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID) {
  const AppleStrategy = require('passport-apple');
  
  passport.use(new AppleStrategy({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      callbackURL: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/v1/auth/apple/callback`,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH
    },
    async (accessToken, refreshToken, idToken, profile, done) => {
      try {
        const email = profile.email;
        const appleId = profile.id;
        
        let user = await User.findOne({ appleId });
        
        if (!user) {
          user = await User.findOne({ email });
          
          if (user) {
            user.linkOAuthProvider('apple', {
              id: appleId,
              email,
              displayName: profile.name ? `${profile.name.firstName} ${profile.name.lastName}` : email.split('@')[0],
              emailVerified: true
            });
            await user.save();
          } else {
            const displayName = profile.name 
              ? `${profile.name.firstName} ${profile.name.lastName}`
              : email.split('@')[0];
            
            user = await User.create({
              email,
              name: displayName,
              appleId,
              isVerified: true,
              oauthProviders: [{
                provider: 'apple',
                providerId: appleId,
                email,
                displayName
              }]
            });
          }
        }
        
        user.lastLogin = new Date();
        await user.save();
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
}
*/

// Serialize user for session (not used with JWT, but required by passport)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
