const { connectDB, getPool } = require('./dist/database');
const bcrypt = require('bcryptjs');

async function createUser() {
  try {
    await connectDB();
    const pool = getPool();
    
    if (!pool) {
      console.log('Database not connected');
      return;
    }

    // Get user input (you can modify these values)
    const username = process.argv[2];
    const email = process.argv[3];
    const password = process.argv[4];
    const role = process.argv[5] || 'user'; // default to 'user', can be 'admin'

    if (!username || !email || !password) {
      console.log('Usage: node create-user.js <username> <email> <password> [role]');
      console.log('Example: node create-user.js john john@mess.com john123 user');
      console.log('Example: node create-user.js admin2 admin2@mess.com admin456 admin');
      return;
    }

    console.log(`🔧 Creating user: ${username} (${email}) with role: ${role}`);

    // Check if user already exists
    const existingUser = await pool.request()
      .input('username', username)
      .input('email', email)
      .query('SELECT id FROM Users WHERE username = @username OR email = @email');

    if (existingUser.recordset.length > 0) {
      console.log('❌ User already exists with this username or email');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get role ID
    const roleResult = await pool.request()
      .input('roleName', role)
      .query('SELECT id FROM Roles WHERE role_name = @roleName');

    if (roleResult.recordset.length === 0) {
      console.log(`❌ Role '${role}' not found. Available roles: user, admin`);
      return;
    }

    const roleId = roleResult.recordset[0].id;

    // Create user
    const result = await pool.request()
      .input('username', username)
      .input('email', email)
      .input('password_hash', hashedPassword)
      .input('role_id', roleId)
      .query(`
        INSERT INTO Users (username, email, password_hash, role_id)
        OUTPUT INSERTED.*
        VALUES (@username, @email, @password_hash, @role_id)
      `);

    const newUser = result.recordset[0];
    console.log('✅ User created successfully!');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Username: ${newUser.username}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Role ID: ${newUser.role_id}`);
    console.log(`   Created: ${newUser.created_at}`);
    console.log('');
    console.log('🔑 Login credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error('❌ Error creating user:', error);
  }
}

createUser();
