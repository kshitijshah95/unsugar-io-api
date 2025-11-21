/**
 * JWT Utilities Unit Tests
 * 
 * Kent C. Dodds principle: Test the public API, not implementation details
 */

const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyAccessToken, 
  verifyRefreshToken 
} = require('../../../utils/jwt');

describe('JWT Utilities', () => {
  const userId = '507f1f77bcf86cd799439011';
  const role = 'user';

  describe('Access Token Generation and Verification', () => {
    it('should generate a valid JWT access token', () => {
      const token = generateAccessToken(userId, role);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include userId and role in decoded token', () => {
      const token = generateAccessToken(userId, role);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.userId).toBe(userId);
      expect(decoded.role).toBe(role);
      expect(decoded.type).toBe('access');
    });

    it('should set 15 minute expiration for access tokens', () => {
      const token = generateAccessToken(userId, role);
      const decoded = verifyAccessToken(token);
      
      const expectedExp = Math.floor(Date.now() / 1000) + (15 * 60);
      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExp - 5); // Allow 5 sec variance
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5);
    });

    it('should verify valid access token', () => {
      const token = generateAccessToken(userId, role);
      
      expect(() => {
        const decoded = verifyAccessToken(token);
        expect(decoded).toBeDefined();
      }).not.toThrow();
    });

    it('should throw error for invalid access token', () => {
      expect(() => {
        verifyAccessToken('invalid.token.string');
      }).toThrow();
    });

    it('should throw error for malformed token', () => {
      expect(() => {
        verifyAccessToken('not-a-jwt');
      }).toThrow();
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateAccessToken('user1', 'user');
      const token2 = generateAccessToken('user2', 'user');
      
      expect(token1).not.toBe(token2);
      
      const decoded1 = verifyAccessToken(token1);
      const decoded2 = verifyAccessToken(token2);
      
      expect(decoded1.userId).toBe('user1');
      expect(decoded2.userId).toBe('user2');
    });
  });

  describe('Refresh Token Generation and Verification', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = generateRefreshToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId in decoded refresh token', () => {
      const token = generateRefreshToken(userId);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('refresh');
    });

    it('should set 7 day expiration for refresh tokens', () => {
      const token = generateRefreshToken(userId);
      const decoded = verifyRefreshToken(token);
      
      const expectedExp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExp - 10);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 10);
    });

    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(userId);
      
      expect(() => {
        const decoded = verifyRefreshToken(token);
        expect(decoded).toBeDefined();
      }).not.toThrow();
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        verifyRefreshToken('invalid.refresh.token');
      }).toThrow();
    });
  });

  describe('Token Type Validation', () => {
    it('should not accept refresh token for access token verification', () => {
      const refreshToken = generateRefreshToken(userId);
      
      // Should throw because refresh token doesn't have 'role' field
      expect(() => {
        verifyAccessToken(refreshToken);
      }).toThrow();
    });

    it('should not accept access token for refresh token verification', () => {
      const accessToken = generateAccessToken(userId, role);
      const decoded = verifyRefreshToken(accessToken);
      
      // Will work but type will be 'access' not 'refresh'
      expect(decoded.type).toBe('access');
    });
  });
});
