// server/routes/messages.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');

// POST /api/messages — send contact message (public)
router.post('/', async (req, res) => {
  const { name, contact, message } = req.body;
  if (!name || !contact || !message) {
    return res.status(400).json({ success: false, message: 'Name, contact and message are required.' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ success: false, message: 'Message too long (max 2000 chars).' });
  }
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    await db.query(
      'INSERT INTO messages (name, contact, message, ip_address) VALUES (?,?,?,?)',
      [name.trim(), contact.trim(), message.trim(), ip]
    );
    res.status(201).json({ success: true, message: 'Message sent! We\'ll reply within 24 hours.' });
  } catch (err) {
    console.error('POST /messages error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message. Please call us directly.' });
  }
});

// GET /api/messages — all messages (admin)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM messages';
    const params = [];
    if (status) { sql += ' WHERE status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    const [counts] = await db.query(
      'SELECT status, COUNT(*) as cnt FROM messages GROUP BY status'
    );
    const countMap = {};
    counts.forEach(r => countMap[r.status] = r.cnt);
    res.json({ success: true, messages: rows, counts: countMap });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/messages/:id/status — mark read/replied (admin)
router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status, reply_note } = req.body;
  if (!['read','replied','unread'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }
  try {
    await db.query(
      'UPDATE messages SET status = ?, reply_note = ? WHERE id = ?',
      [status, reply_note || null, req.params.id]
    );
    res.json({ success: true, message: 'Message updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/messages/:id (admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM messages WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
