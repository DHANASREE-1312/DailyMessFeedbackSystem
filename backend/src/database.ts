import * as sql from 'mssql';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let pool: sql.ConnectionPool | null = null;

const config: sql.config = {
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || '',
  database: process.env.DB_NAME || '',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export const connectDB = async (): Promise<void> => {
  try {
    console.log('Attempting to connect to database...');
    console.log(`Server: ${config.server}`);
    console.log(`Database: ${config.database}`);
    console.log(`User: ${config.user}`);

    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to Azure SQL Database');
    
    // Test the connection immediately
    const testResult = await pool.request().query('SELECT 1 as test');
    console.log('✅ Database connection test successful:', testResult.recordset[0]);
    
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    console.error('Error details:', {
      server: config.server,
      database: config.database,
      user: config.user,
      error: err
    });
    // Don't throw error - let server continue without database
    pool = null;
  }
};

export const closeDB = async (): Promise<void> => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Database connection closed');
    }
  } catch (err) {
    console.error('Error closing database:', err);
  }
};

export const getPool = (): sql.ConnectionPool | null => {
  return pool;
};

export const isConnected = (): boolean => {
  return pool !== null && pool.connected;
};

export { pool };

module.exports = { connectDB, closeDB, pool, getPool, isConnected };
