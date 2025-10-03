import * as express from 'express';
import * as bcrypt from 'bcryptjs';
import { getPool } from '../database';

const router = express.Router();

// Simple test endpoint that doesn't require database
router.get('/test', (req: any, res: any) => {
  res.json({
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Register endpoint
router.post('/register', async (req: any, res: any) => {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      return res.status(503).json({
        error: 'Database not connected'
      });
    }

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await dbPool.request()
      .input('username', username)
      .query('SELECT id FROM Users WHERE username = @username');

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({
        error: 'Username already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Get user role id
    const roleResult = await dbPool.request()
      .query('SELECT id FROM Roles WHERE role_name = \'user\'');

    const roleId = roleResult.recordset[0]?.id || 2;

    // Create user
    await dbPool.request()
      .input('username', username)
      .input('email', email)
      .input('passwordHash', passwordHash)
      .input('roleId', roleId)
      .query('INSERT INTO Users (username, email, password_hash, role_id) VALUES (@username, @email, @passwordHash, @roleId)');

    res.status(201).json({
      message: 'User registered successfully'
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Login endpoint
router.post('/login', async (req: any, res: any) => {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      return res.status(503).json({
        error: 'Database not connected'
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Find user
    const userResult = await dbPool.request()
      .input('username', username)
      .query('SELECT id, username, email, password_hash, role_id FROM Users WHERE username = @username AND is_active = 1');

    if (userResult.recordset.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const user = userResult.recordset[0];

    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role_id: user.role_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      tokens: {
        accessToken: token,
        refreshToken: token // For now, using same token
      },
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role_id: user.role_id
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// Get current user profile (requires authentication)
router.get('/me', async (req: any, res: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      const dbPool = getPool();
      if (!dbPool) {
        return res.status(503).json({
          error: 'Database not connected'
        });
      }

      // Get user from database
      const userResult = await dbPool.request()
        .input('userId', decoded.userId)
        .query('SELECT id, username, email, role_id FROM Users WHERE id = @userId AND is_active = 1');

      if (userResult.recordset.length === 0) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const user = userResult.recordset[0];
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role_id: user.role_id
        }
      });
    } catch (jwtError) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get user profile',
      message: error.message
    });
  }
});

export default router;
