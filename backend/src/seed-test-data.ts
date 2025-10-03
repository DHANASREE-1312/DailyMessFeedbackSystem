import { getPool } from './database';
import * as bcrypt from 'bcryptjs';

const seedTestData = async () => {
  try {
    const pool = getPool();
    if (!pool) {
      console.error('Database not connected');
      return;
    }

    console.log('🌱 Seeding test data...');

    // Create test users with proper password hashing
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create test user
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM Users WHERE username = 'testuser')
      INSERT INTO Users (username, email, password_hash, role_id)
      SELECT 'testuser', 'test@mess.com', '${hashedPassword}', role_id
      FROM Roles WHERE role_name = 'user';
    `);

    // Create admin user
    const adminHashedPassword = await bcrypt.hash('admin123', 10);
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM Users WHERE username = 'admin')
      INSERT INTO Users (username, email, password_hash, role_id)
      SELECT 'admin', 'admin@mess.com', '${adminHashedPassword}', role_id
      FROM Roles WHERE role_name = 'admin';
    `);

    // Get user IDs
    const userResult = await pool.request().query(`
      SELECT id FROM Users WHERE username = 'testuser'
    `);
    const userId = userResult.recordset[0]?.id;

    if (userId) {
      // Create sample feedback for the last few days
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Breakfast feedback
        await pool.request().query(`
          IF NOT EXISTS (SELECT * FROM Feedback WHERE user_id = ${userId} AND meal_date = '${dateStr}' AND meal_type = 'breakfast')
          INSERT INTO Feedback (user_id, rating, comment, is_anonymous, status, meal_date, meal_type)
          VALUES (${userId}, ${Math.floor(Math.random() * 5) + 1}, 'Great breakfast! Really enjoyed the idli and sambar.', 0, 'pending', '${dateStr}', 'breakfast');
        `);

        // Lunch feedback
        await pool.request().query(`
          IF NOT EXISTS (SELECT * FROM Feedback WHERE user_id = ${userId} AND meal_date = '${dateStr}' AND meal_type = 'lunch')
          INSERT INTO Feedback (user_id, rating, comment, is_anonymous, status, meal_date, meal_type)
          VALUES (${userId}, ${Math.floor(Math.random() * 5) + 1}, 'Lunch was good. Rice and dal were well cooked.', 0, 'processing', '${dateStr}', 'lunch');
        `);

        // Dinner feedback (some days)
        if (i < 3) {
          await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM Feedback WHERE user_id = ${userId} AND meal_date = '${dateStr}' AND meal_type = 'dinner')
            INSERT INTO Feedback (user_id, rating, comment, is_anonymous, status, meal_date, meal_type)
            VALUES (${userId}, ${Math.floor(Math.random() * 5) + 1}, 'Dinner was satisfying. Chapati and curry were tasty.', 0, 'resolved', '${dateStr}', 'dinner');
          `);
        }
      }
    }

    console.log('✅ Test data seeded successfully!');
    console.log('📝 Test credentials:');
    console.log('   User: testuser / password123');
    console.log('   Admin: admin / admin123');
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  }
};

// Run if called directly
if (require.main === module) {
  seedTestData().then(() => {
    process.exit(0);
  });
}

export { seedTestData };
