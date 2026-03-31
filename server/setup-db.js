// server/setup-db.js
// Run this once: node server/setup-db.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setup() {
  console.log('\n🔧 RangMahal Database Setup\n');

  // Connect without DB first to create it
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  const db = process.env.DB_NAME || 'rangmahal_db';
  console.log(`📦 Creating database: ${db}`);
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\``);
  await conn.query(`USE \`${db}\``);

  // ─── TABLES ───────────────────────────────────────────────────

  console.log('📋 Creating tables...');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) DEFAULT 'Admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS sarees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      type ENUM('Banarasi','Kanjivaram','Chanderi','Chiffon','Organza','Cotton','Other') NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      old_price DECIMAL(10,2) DEFAULT NULL,
      color VARCHAR(100),
      stock INT DEFAULT 0,
      rating DECIMAL(2,1) DEFAULT 5.0,
      reviews INT DEFAULT 0,
      badge ENUM('new','sale','bestseller','premium','') DEFAULT '',
      emoji VARCHAR(10) DEFAULT '🥻',
      image_url VARCHAR(500) DEFAULT NULL,
      description TEXT,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      order_number VARCHAR(20) UNIQUE NOT NULL,
      customer_name VARCHAR(150) NOT NULL,
      customer_phone VARCHAR(20) NOT NULL,
      customer_email VARCHAR(100),
      address TEXT NOT NULL,
      pincode VARCHAR(10) NOT NULL,
      city VARCHAR(100),
      state VARCHAR(100),
      saree_name VARCHAR(200) NOT NULL,
      color_preference VARCHAR(100),
      quantity INT DEFAULT 1,
      unit_price DECIMAL(10,2),
      total_amount DECIMAL(10,2),
      payment_method VARCHAR(50) NOT NULL,
      special_notes TEXT,
      status ENUM('new','confirmed','processing','shipped','delivered','cancelled') DEFAULT 'new',
      tracking_number VARCHAR(100),
      cart_json TEXT,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      contact VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      status ENUM('unread','read','replied') DEFAULT 'unread',
      reply_note TEXT,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS order_status_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      old_status VARCHAR(30),
      new_status VARCHAR(30) NOT NULL,
      note TEXT,
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  await conn.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

  // ─── SEED ADMIN ────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@rangmahal.com';
  const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@123';
  const hash = await bcrypt.hash(adminPass, 12);
  const [existing] = await conn.query('SELECT id FROM admins WHERE email = ?', [adminEmail]);
  if (existing.length === 0) {
    await conn.query('INSERT INTO admins (email, password, name) VALUES (?, ?, ?)',
      [adminEmail, hash, 'Store Owner']);
    console.log(`✅ Admin created: ${adminEmail} / ${adminPass}`);
  } else {
    console.log(`ℹ️  Admin already exists: ${adminEmail}`);
  }

  // ─── SEED SAREES ───────────────────────────────────────────────
  const [existingSarees] = await conn.query('SELECT COUNT(*) as cnt FROM sarees');
  if (existingSarees[0].cnt === 0) {
    console.log('🌱 Seeding sample sarees...');
    const sarees = [
      ['Banarasi Silk Zari','Banarasi',2499,3200,'Red',12,5.0,234,'bestseller','🥻',null,'Pure Banarasi silk with intricate zari weave. Perfect for weddings and festive occasions.'],
      ['Royal Kanjivaram Gold','Kanjivaram',3999,5000,'Maroon',6,5.0,89,'new','✨',null,'Heavy Kanjivaram with gold border and temple motifs. Exquisite handloom craftsmanship.'],
      ['Chanderi Pastel','Chanderi',1299,1699,'Peach',20,4.0,156,'sale','🌸',null,'Light Chanderi silk-cotton blend for daily wear. Comfortable and elegant.'],
      ['Chiffon Floral Print','Chiffon',899,1200,'Blue',35,4.0,312,'new','🌊',null,'Elegant printed chiffon, perfect for parties and casual outings.'],
      ['Organza Embroidered','Organza',1799,2400,'Gold',8,5.0,78,'','🌟',null,'Hand-embroidered organza with delicate floral motifs and sequin accents.'],
      ['Pure Silk Patola','Banarasi',5499,7000,'Multi',3,5.0,45,'premium','💎',null,'Traditional double-ikat Patola from Patan, Gujarat. Collector\'s piece.'],
      ['Cotton Handloom','Cotton',749,999,'White',50,4.0,421,'sale','🌿',null,'Breathable cotton handloom for everyday comfort. Eco-friendly and durable.'],
      ['Georgette Sequin','Chiffon',1349,1800,'Black',14,4.0,167,'new','💫',null,'Lightweight georgette with tasteful sequin work for evening wear.'],
      ['Bandhani Silk','Cotton',1599,2100,'Multi',11,5.0,93,'','🎨',null,'Traditional bandhani tie-dye on pure silk. Vibrant and colorful.'],
      ['Bridal Lehenga Saree','Kanjivaram',6999,9000,'Bridal Red',2,5.0,62,'premium','👰',null,'Stunning bridal lehenga saree with heavy stonework and zardosi embroidery.'],
      ['Net Saree Embellished','Organza',2199,2800,'Pink',9,4.0,134,'new','🪄',null,'Net saree with pearl and stone embellishments. Perfect for receptions.'],
      ['Linen Handwoven','Cotton',1099,1499,'Beige',22,4.0,208,'','🧵',null,'Eco-friendly handwoven linen. Extremely comfortable for all-day wear.'],
    ];
    for (const s of sarees) {
      await conn.query(
        `INSERT INTO sarees (name,type,price,old_price,color,stock,rating,reviews,badge,emoji,image_url,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        s
      );
    }
    console.log(`✅ ${sarees.length} sample sarees inserted`);
  }

  // ─── SEED SAMPLE ORDERS ────────────────────────────────────────
  const [existingOrders] = await conn.query('SELECT COUNT(*) as cnt FROM orders');
  if (existingOrders[0].cnt === 0) {
    console.log('🌱 Seeding sample orders...');
    const sampleOrders = [
      ['RM-00001','Priya Mehta','9876543210','priya@gmail.com','12 MG Road, Bandra','400001','Mumbai','Maharashtra','Banarasi Silk Zari','Red',1,2499,2499,'Cash on Delivery (COD)','Gift wrap please','delivered'],
      ['RM-00002','Sunita Rao','9123456780','sunita@gmail.com','45 Jubilee Hills','500033','Hyderabad','Telangana','Chanderi Pastel','Peach',3,1299,3897,'UPI / Google Pay','','shipped'],
      ['RM-00003','Anita Sharma','9988776655',null,'88 Lajpat Nagar','110024','Delhi','Delhi','Organza Embroidered','Gold',1,1799,1799,'Cash on Delivery (COD)','','new'],
    ];
    for (const o of sampleOrders) {
      await conn.query(
        `INSERT INTO orders (order_number,customer_name,customer_phone,customer_email,address,pincode,city,state,saree_name,color_preference,quantity,unit_price,total_amount,payment_method,special_notes,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        o
      );
    }
  }

  // ─── SEED SAMPLE MESSAGES ──────────────────────────────────────
  const [existingMsgs] = await conn.query('SELECT COUNT(*) as cnt FROM messages');
  if (existingMsgs[0].cnt === 0) {
    await conn.query(
      `INSERT INTO messages (name,contact,message,status) VALUES (?,?,?,?)`,
      ['Kavya Reddy','9876541230','Do you have Navratri special sarees? Want 5 pieces in different colors.','unread']
    );
    await conn.query(
      `INSERT INTO messages (name,contact,message,status) VALUES (?,?,?,?)`,
      ['Meera Patel','meera@gmail.com','I ordered a Kanjivaram last week but haven\'t received a shipping update.','unread']
    );
  }

  await conn.end();
  console.log('\n✅ Database setup complete!');
  console.log('\n🚀 Now run: npm start');
  console.log(`🔑 Admin login: ${adminEmail} / ${adminPass}\n`);
}

setup().catch(err => {
  console.error('\n❌ Setup failed:', err.message);
  console.error('\nMake sure MySQL is running and your .env DB credentials are correct.\n');
  process.exit(1);
});
