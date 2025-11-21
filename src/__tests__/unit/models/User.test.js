/**
 * User Model Unit Tests
 * 
 * Kent C. Dodds: Test the behavior users care about
 */

const User = require('../../../models/User');

describe('User Model', () => {
  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const user = await User.create({
        email: 'hash@example.com',
        password: 'PlainTextPassword123!',
        name: 'Hash Test',
      });

      expect(user.password).toBeDefined();
      expect(user.password).not.toBe('PlainTextPassword123!');
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt format
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        email: 'nohash@example.com',
        password: 'Password123!',
        name: 'No Hash Test',
      });

      const originalHash = user.password;

      // Update name only
      user.name = 'Updated Name';
      await user.save();

      expect(user.password).toBe(originalHash);
    });

    it('should rehash password when changed', async () => {
      const user = await User.create({
        email: 'rehash@example.com',
        password: 'OriginalPassword123!',
        name: 'Rehash Test',
      });

      const originalHash = user.password;

      // Change password
      user.password = 'NewPassword123!';
      await user.save();

      expect(user.password).not.toBe(originalHash);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/);
    });
  });

  describe('Password Comparison', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'compare@example.com',
        password: 'TestPassword123!',
        name: 'Compare Test',
      });
    });

    it('should return true for correct password', async () => {
      const isMatch = await user.comparePassword('TestPassword123!');
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const isMatch = await user.comparePassword('WrongPassword123!');
      expect(isMatch).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const isMatch = await user.comparePassword('testpassword123!');
      expect(isMatch).toBe(false);
    });
  });

  describe('Refresh Token Management', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'token@example.com',
        password: 'Password123!',
        name: 'Token Test',
      });
    });

    it('should add refresh token with metadata', async () => {
      const token = 'test-refresh-token';
      const expirySeconds = 7 * 24 * 60 * 60;
      const userAgent = 'Test Browser';
      const ipAddress = '127.0.0.1';

      user.addRefreshToken(token, expirySeconds, userAgent, ipAddress);
      await user.save();

      expect(user.refreshTokens).toHaveLength(1);
      expect(user.refreshTokens[0]).toMatchObject({
        token,
        userAgent,
        ipAddress,
      });
      expect(user.refreshTokens[0].expiresAt).toBeInstanceOf(Date);
    });

    it('should remove specific refresh token', async () => {
      user.addRefreshToken('token1', 7 * 24 * 60 * 60, 'Browser 1', '127.0.0.1');
      user.addRefreshToken('token2', 7 * 24 * 60 * 60, 'Browser 2', '127.0.0.2');
      await user.save();

      expect(user.refreshTokens).toHaveLength(2);

      user.removeRefreshToken('token1');
      await user.save();

      const reloadedUser = await User.findById(user._id);
      expect(reloadedUser.refreshTokens).toHaveLength(1);
      expect(reloadedUser.refreshTokens[0].token).toBe('token2');
    });

    it('should cleanup expired tokens', async () => {
      // Add expired token (expired 1 day ago)
      user.refreshTokens.push({
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        userAgent: 'Old Browser',
        ipAddress: '127.0.0.1',
      });

      // Add valid token
      user.addRefreshToken('valid-token', 7 * 24 * 60 * 60, 'New Browser', '127.0.0.1');
      await user.save();

      expect(user.refreshTokens).toHaveLength(2);

      user.cleanupExpiredTokens();
      await user.save();

      const reloadedUser = await User.findById(user._id);
      expect(reloadedUser.refreshTokens).toHaveLength(1);
      expect(reloadedUser.refreshTokens[0].token).toBe('valid-token');
    });

    it('should limit number of refresh tokens', async () => {
      // Add 6 tokens (limit is 5)
      for (let i = 1; i <= 6; i++) {
        user.addRefreshToken(`token${i}`, 7 * 24 * 60 * 60, `Browser ${i}`, '127.0.0.1');
      }
      await user.save();

      const reloadedUser = await User.findById(user._id);
      expect(reloadedUser.refreshTokens).toHaveLength(5);
      
      // Oldest token should be removed
      const tokens = reloadedUser.refreshTokens.map(t => t.token);
      expect(tokens).not.toContain('token1');
      expect(tokens).toContain('token6');
    });
  });

  describe('Account Lockout', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'lockout@example.com',
        password: 'Password123!',
        name: 'Lockout Test',
      });
    });

    it('should increment login attempts', async () => {
      expect(user.loginAttempts).toBe(0);

      await user.incLoginAttempts();
      
      const reloadedUser = await User.findById(user._id);
      expect(reloadedUser.loginAttempts).toBe(1);
    });

    it('should lock account after 5 failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await user.incLoginAttempts();
        user = await User.findById(user._id);
      }

      expect(user.loginAttempts).toBe(5);
      expect(user.isLocked).toBe(true);
      expect(user.lockUntil).toBeInstanceOf(Date);
      expect(user.lockUntil).toBeGreaterThan(new Date());
    });

    it('should reset login attempts on successful login', async () => {
      await user.incLoginAttempts();
      await user.incLoginAttempts();
      
      user = await User.findById(user._id);
      expect(user.loginAttempts).toBe(2);

      await user.resetLoginAttempts();
      
      user = await User.findById(user._id);
      expect(user.loginAttempts).toBe(0);
      expect(user.lockUntil).toBeUndefined();
    });

    it('should reset attempts and lock if lock expired', async () => {
      // Set expired lock
      user.loginAttempts = 5;
      user.lockUntil = new Date(Date.now() - 1000); // Expired 1 second ago
      await user.save();

      // Increment again should reset
      await user.incLoginAttempts();
      
      user = await User.findById(user._id);
      expect(user.loginAttempts).toBe(1);
      expect(user.lockUntil).toBeUndefined();
    });
  });

  describe('Model Validation', () => {
    it('should require email', async () => {
      await expect(
        User.create({
          password: 'Password123!',
          name: 'No Email',
        })
      ).rejects.toThrow(/email/i);
    });

    it('should require password', async () => {
      await expect(
        User.create({
          email: 'nopassword@example.com',
          name: 'No Password',
        })
      ).rejects.toThrow(/password/i);
    });

    it('should require name', async () => {
      await expect(
        User.create({
          email: 'noname@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow(/name/i);
    });

    it('should enforce unique email', async () => {
      await User.create({
        email: 'unique@example.com',
        password: 'Password123!',
        name: 'First User',
      });

      await expect(
        User.create({
          email: 'unique@example.com',
          password: 'Password123!',
          name: 'Second User',
        })
      ).rejects.toThrow(/duplicate|unique/i);
    });

    it('should validate email format', async () => {
      await expect(
        User.create({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Invalid Email',
        })
      ).rejects.toThrow(/email/i);
    });
  });

  describe('Default Values', () => {
    it('should set default role to user', async () => {
      const user = await User.create({
        email: 'default@example.com',
        password: 'Password123!',
        name: 'Default User',
      });

      expect(user.role).toBe('user');
    });

    it('should set isActive to true by default', async () => {
      const user = await User.create({
        email: 'active@example.com',
        password: 'Password123!',
        name: 'Active User',
      });

      expect(user.isActive).toBe(true);
    });

    it('should set isVerified to false by default', async () => {
      const user = await User.create({
        email: 'unverified@example.com',
        password: 'Password123!',
        name: 'Unverified User',
      });

      expect(user.isVerified).toBe(false);
    });

    it('should initialize empty refreshTokens array', async () => {
      const user = await User.create({
        email: 'notokens@example.com',
        password: 'Password123!',
        name: 'No Tokens User',
      });

      expect(user.refreshTokens).toEqual([]);
    });
  });
});
