const { connectDB, getPool } = require('./dist/database');

async function addMissingColumns() {
  try {
    await connectDB();
    const pool = getPool();
    
    if (!pool) {
      console.log('Database not connected');
      return;
    }

    console.log('🔧 Checking for missing columns...');

    // Check if status column exists
    const statusResult = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Feedback' AND COLUMN_NAME = 'status'
    `);

    if (statusResult.recordset.length === 0) {
      console.log('Adding status column...');
      await pool.request().query(`
        ALTER TABLE Feedback ADD status NVARCHAR(20) DEFAULT 'pending'
      `);
      console.log('✅ Status column added');
    } else {
      console.log('✅ Status column already exists');
    }

    // Check if updated_at column exists
    const updatedAtResult = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Feedback' AND COLUMN_NAME = 'updated_at'
    `);

    if (updatedAtResult.recordset.length === 0) {
      console.log('Adding updated_at column...');
      await pool.request().query(`
        ALTER TABLE Feedback ADD updated_at DATETIME DEFAULT GETDATE()
      `);
      console.log('✅ updated_at column added');
    } else {
      console.log('✅ updated_at column already exists');
    }

    console.log('🎉 Database schema updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addMissingColumns();
