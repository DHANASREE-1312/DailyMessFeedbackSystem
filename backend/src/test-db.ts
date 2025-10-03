import * as sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config: sql.config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

async function testConnection() {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('Connection successful!');
    await pool.close();
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

testConnection();
