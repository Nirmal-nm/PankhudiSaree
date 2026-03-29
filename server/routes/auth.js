// server/routes/auth.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET || 'rangmahal_secret',
      { expiresIn: '24h' }
    );

    // Set as HTTP-only cookie
    res.cookie('rm_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24h
      sameSite: 'lax'
    });

    res.json({
      success: true,
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('rm_admin_token');
  res.json({ success: true, message: 'Logged out.' });
});

// GET /api/auth/me — verify token
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, email, name FROM admins WHERE id = ?', [req.admin.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Admin not found.' });
    res.json({ success: true, admin: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }
  try {
    const [rows] = await db.query('SELECT password FROM admins WHERE id = ?', [req.admin.id]);
    const match = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is wrong.' });
    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE admins SET password = ? WHERE id = ?', [hash, req.admin.id]);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
