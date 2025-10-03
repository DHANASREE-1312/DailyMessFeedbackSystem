import * as sql from 'mssql';
import * as dotenv from 'dotenv';

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

async function initializeDatabase() {
  let pool: sql.ConnectionPool | null = null;

  try {
    console.log('🔄 Connecting to database...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to Azure SQL Database');

    // Create Roles table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Roles' AND xtype='U')
      CREATE TABLE Roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        role_name NVARCHAR(20) UNIQUE NOT NULL,
        description NVARCHAR(100),
        created_at DATETIME DEFAULT GETDATE()
      )
    `);

    // Create Users table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) UNIQUE NOT NULL,
        email NVARCHAR(100) UNIQUE NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        role_id INT DEFAULT 2,
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        last_login DATETIME,
        FOREIGN KEY (role_id) REFERENCES Roles(id)
      )
    `);

    // Create Menu table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Menu' AND xtype='U')
      CREATE TABLE Menu (
        id INT IDENTITY(1,1) PRIMARY KEY,
        meal_date DATE NOT NULL,
        meal_type NVARCHAR(20) NOT NULL,
        dish_name NVARCHAR(100) NOT NULL,
        description NVARCHAR(200),
        created_at DATETIME DEFAULT GETDATE(),
        UNIQUE(meal_date, meal_type, dish_name)
      )
    `);

    // Create Feedback table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Feedback' AND xtype='U')
      CREATE TABLE Feedback (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT,
        rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        comment NVARCHAR(500),
        is_anonymous BIT DEFAULT 0,
        meal_date DATE DEFAULT CAST(GETDATE() AS DATE),
        meal_type NVARCHAR(20),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        UNIQUE(user_id, meal_date, meal_type)
      )
    `);

    console.log('✅ Database tables created successfully!');

    // Seed initial data
    console.log('🌱 Seeding initial data...');

    // Insert default roles
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM Roles WHERE role_name = 'admin')
      INSERT INTO Roles (role_name, description) VALUES ('admin', 'System Administrator');
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM Roles WHERE role_name = 'user')
      INSERT INTO Roles (role_name, description) VALUES ('user', 'Regular User');
    `);

    console.log('✅ Roles seeded successfully!');

    // Note: Users are seeded through the application login
    console.log('✅ Database initialization complete!');

  } catch (err) {
    console.error('❌ Database initialization failed:', err);
  } finally {
    if (pool) {
      await pool.close();
      console.log('🔌 Database connection closed');
    }
  }
}

initializeDatabase();
