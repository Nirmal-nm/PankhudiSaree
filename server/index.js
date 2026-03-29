// server/index.js
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const path         = require('path');
const fs           = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Ensure uploads dir exists ────────────────────────────────
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || true
    : true,
  credentials: true
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Static files ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/sarees',   require('./routes/sarees'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'RangMahal Store',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// ─── Serve frontend pages ─────────────────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Something went wrong on the server.' });
});

//Baad mein add hua
const changePasswordRoute = require("./routes/changePassword");
app.use("/api", changePasswordRoute);
//yaha tak khtm
//ye user login ke liye add huii
const userAuthRoutes = require("./routes/userAuth");
app.use("/api/user", userAuthRoutes);
//yaha khatm ho gai
// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   🥻  RangMahal Store Server         ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Store:  http://localhost:${PORT}        ║`);
  console.log(`║  Admin:  http://localhost:${PORT}/admin  ║`);
  console.log(`║  API:    http://localhost:${PORT}/api    ║`);
  console.log('╚══════════════════════════════════════╝\n');
});

module.exports = app;
