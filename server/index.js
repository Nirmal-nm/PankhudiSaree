// ─── Load env ────────────────────────────────────────────────
require('dotenv').config();

// ─── Imports ─────────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

// ✅ create app (IMPORTANT)
const app = express();

const PORT = process.env.PORT || 3000;

console.log("SERVER STARTED 🔥");

// ─── Ensure uploads dir exists ────────────────────────────────
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static files ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sarees', require('./routes/sarees'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));

// ✅ CUSTOM ROUTES (ONLY ONCE)
const changePasswordRoute = require("./routes/changePassword");
app.use("/api", changePasswordRoute);

const userAuthRoutes = require("./routes/userAuth");
app.use("/api/user", userAuthRoutes);
console.log("User auth routes loaded...");

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date()
  });
});

// ─── Frontend routes ──────────────────────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── 404 handler (IMPORTANT: LAST BEFORE LISTEN) ─────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found.'
    });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});