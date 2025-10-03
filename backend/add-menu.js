const { connectDB, getPool } = require('./dist/database');

async function addMenuData() {
  try {
    await connectDB();
    const pool = getPool();
    
    if (!pool) {
      console.log('Database not connected');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    console.log('Adding menu for date:', today);

    // Clear existing menu for today
    await pool.request().query(`DELETE FROM Menu WHERE meal_date = '${today}'`);

    // Add breakfast items
    await pool.request().query(`
      INSERT INTO Menu (meal_date, meal_type, dish_name, description)
      VALUES ('${today}', 'breakfast', 'Idli', 'Steamed rice cakes with coconut chutney')
    `);

    await pool.request().query(`
      INSERT INTO Menu (meal_date, meal_type, dish_name, description)
      VALUES ('${today}', 'breakfast', 'Sambar', 'Lentil curry with vegetables')
    `);

    await pool.request().query(`
      INSERT INTO Menu (meal_date, meal_type, dish_name, description)
      VALUES ('${today}', 'breakfast', 'Coconut Chutney', 'Fresh coconut chutney')
    `);

    // Add lunch items
    await pool.request().query(`
      INSERT INTO Menu (meal_date, meal_type, dish_name, description)
      VALUES ('${today}', 'lunch', 'Rice', 'Steamed basmati rice')
    `);

    await pool.request().query(`
      INSERT INTO Menu (meal_date, meal_type, dish_name, description)
      VALUES ('${today}', 'lunch', 'Dal Tadka', 'Yellow lentils with spices')
    `);

    await pool.request().query(`
      INSERT INTO Menu (meal_date, meal_type, dish_name, description)
      VALUES ('${today}', 'lunch', 'Mixed Vegetable Curry', 'Seasonal vegetables in curry')
    `);

    // Add dinner items
    await pool.request().query(`
      INSERT INTO Menu (meal_date, meal_type, dish_name, description)
      VALUES ('${today}', 'dinner', 'Chapati', 'Fresh wheat flatbread')
    `);

    await pool.request().query(`
      INSERT INTO Menu (meal_date, meal_type, dish_name, description)
      VALUES ('${today}', 'dinner', 'Paneer Curry', 'Cottage cheese in rich gravy')
    `);

    await pool.request().query(`
      INSERT INTO Menu (meal_date, meal_type, dish_name, description)
      VALUES ('${today}', 'dinner', 'Jeera Rice', 'Cumin flavored rice')
    `);

    console.log('✅ Menu data added successfully!');

    // Create test users
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Add test user
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM Users WHERE username = 'testuser')
      INSERT INTO Users (username, email, password_hash, role_id)
      VALUES ('testuser', 'test@mess.com', '${hashedPassword}', 2)
    `);

    // Add admin user  
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM Users WHERE username = 'admin')
      INSERT INTO Users (username, email, password_hash, role_id)
      VALUES ('admin', 'admin@mess.com', '${adminPassword}', 1)
    `);

    console.log('✅ Test users created!');
    console.log('📝 Login credentials:');
    console.log('   User: testuser / password123');
    console.log('   Admin: admin / admin123');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addMenuData();
