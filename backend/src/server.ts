const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, getPool, isConnected } = require('./database');
const { createTables, seedInitialData } = require('./models');
const authRoutes = require('./routes/auth').default;
const feedbackRoutes = require('./routes/feedback').default;
const mealsRoutes = require('./routes/meals').default;

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

// Connect to database and initialize schema (async, non-blocking)
connectDB().then(async () => {
  console.log('✅ Database connected successfully!');
  try {
    await createTables();
    await seedInitialData();
    console.log('✅ Database schema initialized!');
  } catch (error) {
    console.error('❌ Error initializing database schema:', error);
  }
}).catch((err: any) => {
  console.error('❌ Failed to connect to database:', err);
  console.log('⚠️ Server will start without database connection.');
  console.log('📝 Note: Some features may not work until database is connected.');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/meals', mealsRoutes);

// Basic route
app.get('/', (req: any, res: any) => {
  res.json({
    message: 'Daily Mess Feedback System Backend is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      feedback: '/api/feedback',
      meals: '/api/meals'
    }
  });
});

// CORS test endpoint
app.get('/cors-test', (req: any, res: any) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req: any, res: any) => {
  const pool = getPool();
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: isConnected() ? 'Connected' : 'Disconnected',
    poolStatus: pool ? 'Available' : 'Not Available'
  });
});

// Test database connection
app.get('/test-db', async (req: any, res: any) => {
  try {
    const pool = getPool();
    if (pool) {
      const result = await pool.request().query('SELECT 1 as test');
      res.json({ message: 'Database connected successfully', result: result.recordset });
    } else {
      res.status(500).json({ error: 'Database not connected' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err });
  }
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Daily Mess Feedback System Backend running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
