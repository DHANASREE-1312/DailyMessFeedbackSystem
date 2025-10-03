const { connectDB, getPool } = require('./dist/database');

async function removeUniqueConstraint() {
  try {
    await connectDB();
    const pool = getPool();
    
    if (!pool) {
      console.log('Database not connected');
      return;
    }

    console.log('🔧 Removing unique constraint to allow multiple submissions...');

    // First, find the constraint name
    const constraintResult = await pool.request().query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_NAME = 'Feedback' 
      AND CONSTRAINT_TYPE = 'UNIQUE'
    `);

    if (constraintResult.recordset.length > 0) {
      const constraintName = constraintResult.recordset[0].CONSTRAINT_NAME;
      console.log(`Found constraint: ${constraintName}`);
      
      // Drop the unique constraint
      await pool.request().query(`
        ALTER TABLE Feedback DROP CONSTRAINT ${constraintName}
      `);
      
      console.log('✅ Unique constraint removed successfully!');
      console.log('🎉 Users can now submit multiple feedbacks for the same meal type on the same day!');
    } else {
      console.log('ℹ️ No unique constraint found on Feedback table');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

removeUniqueConstraint();
