/**
 * Auth Integration Tests
 * 
 * Following Kent C. Dodds' testing principles:
 * - Test user flows, not implementation details
 * - Tests should resemble how the software is used
 * - Focus on behavior, not internals
 */

const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');

describe('Authentication Flow', () => {
  /**
   * User Story: As a new user, I want to register an account
   */
  describe('User Registration', () => {
    it('should allow a user to register with valid credentials', async () => {
      // Arrange
      const newUser = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'John Doe',
      };

      // Act - Register
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(201);

      // Assert - Check response structure
      expect(response.body).toMatchObject({
        success: true,
        user: {
          email: newUser.email,
          name: newUser.name,
          role: 'user',
        },
      });
      
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.expiresIn).toBe(900);

      // Assert - User created in database
      const user = await User.findOne({ email: newUser.email });
      expect(user).toBeDefined();
      expect(user.name).toBe(newUser.name);
      
      // Assert - Password was hashed
      expect(user.password).not.toBe(newUser.password);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt format
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      
      // User should not be created
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeNull();
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        name: 'First User',
      };

      // First registration succeeds
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Second registration fails
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...userData, name: 'Second User' })
        .expect(409);

      expect(response.body.code).toBe('CONFLICT_ERROR');
      
      // Only one user should exist
      const users = await User.find({ email: userData.email });
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('First User'); // First user preserved
    });

    it('should enforce rate limiting on registration endpoint', async () => {
      const requests = [];
      
      // Make 6 requests (limit is 5)
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/register')
            .send({
              email: `user${i}@example.com`,
              password: 'SecurePassword123!',
              name: `User ${i}`,
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // Last request should be rate limited
      expect(responses[5].status).toBe(429);
      expect(responses[5].body.message || responses[5].text).toContain('Too many');
    });
  });

  /**
   * User Story: As a registered user, I want to login to access my account
   */
  describe('User Login', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user before each login test
      testUser = await User.create({
        email: 'login@example.com',
        password: 'SecurePassword123!',
        name: 'Login Test User',
      });
    });

    it('should allow user to login with correct credentials', async () => {
      const credentials = {
        email: 'login@example.com',
        password: 'SecurePassword123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          email: credentials.email,
          name: 'Login Test User',
        },
      });
      
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      
      // Verify refresh token was saved
      const user = await User.findById(testUser._id);
      expect(user.refreshTokens).toHaveLength(1);
      expect(user.lastLogin).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid');
    });

    it('should reject login for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123!',
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid');
    });

    it('should lock account after multiple failed login attempts', async () => {
      const wrongCredentials = {
        email: 'login@example.com',
        password: 'WrongPassword!',
      };

      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send(wrongCredentials)
          .expect(401);
      }

      // 6th attempt should indicate account is locked
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePassword123!', // Even correct password fails
        })
        .expect(401);

      expect(response.body.error).toMatch(/locked|too many/i);
      
      // Verify user is locked in database
      const user = await User.findById(testUser._id);
      expect(user.isLocked).toBe(true);
    });

    it('should reject login for inactive account', async () => {
      // Deactivate user
      testUser.isActive = false;
      await testUser.save();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePassword123!',
        })
        .expect(401);

      expect(response.body.error).toMatch(/inactive/i);
    });
  });

  /**
   * User Story: As a logged-in user, I want to access protected resources
   */
  describe('Protected Resource Access', () => {
    let accessToken;
    let user;

    beforeEach(async () => {
      // Register and get token
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'protected@example.com',
          password: 'SecurePassword123!',
          name: 'Protected User',
        });

      accessToken = response.body.accessToken;
      user = response.body.user;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.user).toMatchObject({
        email: user.email,
        name: user.name,
      });
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should update profile with valid token', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.user.name).toBe('Updated Name');
      
      // Verify in database
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.name).toBe('Updated Name');
    });
  });

  /**
   * User Story: As a user, I want to refresh my access token when it expires
   */
  describe('Token Refresh', () => {
    let refreshToken;
    let user;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'refresh@example.com',
          password: 'SecurePassword123!',
          name: 'Refresh User',
        });

      refreshToken = response.body.refreshToken;
      user = response.body.user;
    });

    it('should issue new access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.accessToken).not.toBe(refreshToken);
      expect(response.body.expiresIn).toBe(900);
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid.refresh.token' })
        .expect(401);

      expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject refresh token after logout', async () => {
      // Get access token
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'SecurePassword123!',
        });

      const accessToken = loginRes.body.accessToken;

      // Logout
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Try to use refresh token
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.error).toMatch(/invalid/i);
    });
  });

  /**
   * User Story: As a user, I want to logout and invalidate my session
   */
  describe('User Logout', () => {
    let accessToken;
    let refreshToken;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'logout@example.com',
          password: 'SecurePassword123!',
          name: 'Logout User',
        });

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should logout and invalidate refresh token', async () => {
      // Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(logoutRes.body.success).toBe(true);

      // Try to use refresh token - should fail
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('should allow logout without refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  /**
   * Complete User Journey: The Happy Path
   * Kent C. Dodds: "Test the full user flow"
   */
  describe('Complete Auth Flow (Happy Path)', () => {
    it('should complete: Register → Login → Access Protected → Refresh → Logout', async () => {
      const userData = {
        email: 'journey@example.com',
        password: 'SecurePassword123!',
        name: 'Journey User',
      };

      // 1. Register
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(registerRes.body.success).toBe(true);
      const firstAccessToken = registerRes.body.accessToken;
      const refreshToken = registerRes.body.refreshToken;

      // 2. Access protected resource
      const profileRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${firstAccessToken}`)
        .expect(200);

      expect(profileRes.body.user.email).toBe(userData.email);

      // 3. Update profile
      const updateRes = await request(app)
        .patch('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${firstAccessToken}`)
        .send({ name: 'Updated Journey User' })
        .expect(200);

      expect(updateRes.body.user.name).toBe('Updated Journey User');

      // 4. Refresh token
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const newAccessToken = refreshRes.body.accessToken;
      expect(newAccessToken).toBeDefined();
      expect(newAccessToken).not.toBe(firstAccessToken);

      // 5. Access with new token
      const newProfileRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(newProfileRes.body.user.name).toBe('Updated Journey User');

      // 6. Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(logoutRes.body.success).toBe(true);

      // 7. Verify tokens are invalid
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(401); // Token still works (we only invalidated refresh token)

      await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401); // Refresh token is invalid
    });
  });
});
