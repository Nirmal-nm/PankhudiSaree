// // server/db.js
// require('dotenv').config();
// const mysql = require('mysql2/promise');

// const pool = mysql.createPool({
//   host:     process.env.DB_HOST     || 'localhost',
//   port:     parseInt(process.env.DB_PORT) || 3306,
//   user:     process.env.DB_USER     || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME     || 'rangmahal_db',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   charset: 'utf8mb4',
// });

// // Test connection on startup
// pool.getConnection()
//   .then(conn => {
//     console.log('✅ MySQL connected:', process.env.DB_NAME || 'rangmahal_db');
//     conn.release();
//   })
//   .catch(err => {
//     console.error('❌ MySQL connection failed:', err.message);
//     console.error('   Make sure MySQL is running and .env DB credentials are set correctly.');
//   });

// module.exports = pool;


const mysql = require("mysql2/promise");

const pool = mysql.createPool(process.env.MYSQL_URL);

module.exports = pool;