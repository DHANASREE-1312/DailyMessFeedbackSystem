import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { getPool } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface User {
  id: number;
  username: string;
  email: string;
  role_id: number;
  is_active: boolean;
  created_at: Date;
  last_login?: Date;
  role_name?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT tokens
  static generateTokens(user: User): AuthTokens {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id
    };

    // Generate access token
    const accessToken = (jwt as any).sign(
      payload as object,
      JWT_SECRET as string,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Generate refresh token
    const refreshToken = (jwt as any).sign(
      { userId: user.id, type: 'refresh' } as object,
      JWT_SECRET as string,
      { expiresIn: '30d' }
    );

    return { accessToken, refreshToken };
  }

  // Verify JWT token
  static verifyToken(token: string): any {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Register new user
  static async register(userData: RegisterData): Promise<User> {
    try {
      const pool = getPool();
      if (!pool) {
        throw new Error('Database not connected');
      }

      // Check if user already exists
      const existingUser = await pool.request()
        .input('username', userData.username)
        .input('email', userData.email)
        .query('SELECT id FROM Users WHERE username = @username OR email = @email');

      if (existingUser.recordset.length > 0) {
        throw new Error('User already exists with this username or email');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Get default user role
      const roleResult = await pool.request()
        .query('SELECT id FROM Roles WHERE role_name = \'user\'');

      if (roleResult.recordset.length === 0) {
        throw new Error('User role not found');
      }

      const roleId = roleResult.recordset[0].id;

      // Create user
      const result = await pool.request()
        .input('username', userData.username)
        .input('email', userData.email)
        .input('password_hash', hashedPassword)
        .input('role_id', roleId)
        .query(`
          INSERT INTO Users (username, email, password_hash, role_id)
          OUTPUT INSERTED.*
          VALUES (@username, @email, @password_hash, @role_id)
        `);

      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const pool = getPool();
      if (!pool) {
        throw new Error('Database not connected');
      }

      // Find user by username
      const result = await pool.request()
        .input('username', credentials.username)
        .query(`
          SELECT u.*, r.role_name FROM Users u
          JOIN Roles r ON u.role_id = r.id
          WHERE u.username = @username AND u.is_active = 1
        `);

      if (result.recordset.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.recordset[0];

      // Verify password
      const isValidPassword = await this.verifyPassword(credentials.password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await pool.request()
        .input('userId', user.id)
        .query('UPDATE Users SET last_login = GETDATE() WHERE id = @userId');

      // Generate tokens
      const tokens = this.generateTokens(user);

      return { user, tokens };
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(userId: number): Promise<User | null> {
    try {
      const pool = getPool();
      if (!pool) {
        throw new Error('Database not connected');
      }

      const result = await pool.request()
        .input('userId', userId)
        .query(`
          SELECT u.*, r.role_name FROM Users u
          JOIN Roles r ON u.role_id = r.id
          WHERE u.id = @userId AND u.is_active = 1
        `);

      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Middleware to verify JWT token
  static authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error: any) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  }

  // Middleware to check admin role
  static requireAdmin(req: any, res: any, next: any) {
    if (req.user.role_id !== 1) { // Assuming role_id 1 is admin
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  }
}
