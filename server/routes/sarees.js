// server/routes/sarees.js
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const db       = require('../db');
const { requireAuth } = require('../middleware/auth');

// ─── Multer for image uploads ──────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `saree-${Date.now()}${ext}`);
  }
});
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }
});

// ─── PUBLIC ROUTES ──────────────────────────────────────────────

// GET /api/sarees — all active sarees (public)
router.get('/', async (req, res) => {
  try {
    const { type, search, min_price, max_price, sort, limit = 100 } = req.query;
    let sql = 'SELECT * FROM sarees WHERE is_active = 1';
    const params = [];

    if (type && type !== 'all') { sql += ' AND type = ?'; params.push(type); }
    if (search) { sql += ' AND (name LIKE ? OR description LIKE ? OR color LIKE ?)'; const s = `%${search}%`; params.push(s,s,s); }
    if (min_price) { sql += ' AND price >= ?'; params.push(parseFloat(min_price)); }
    if (max_price) { sql += ' AND price <= ?'; params.push(parseFloat(max_price)); }

    const sortMap = { price_asc: 'price ASC', price_desc: 'price DESC', newest: 'created_at DESC', rating: 'rating DESC' };
    sql += ` ORDER BY ${sortMap[sort] || 'created_at DESC'}`;
    sql += ` LIMIT ${Math.min(parseInt(limit) || 100, 200)}`;

    const [rows] = await db.query(sql, params);
    res.json({ success: true, count: rows.length, sarees: rows });
  } catch (err) {
    console.error('GET /sarees error:', err);
    res.status(500).json({ success: false, message: 'Failed to load sarees.' });
  }
});

// GET /api/sarees/:id — single saree (public)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sarees WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Saree not found.' });
    res.json({ success: true, saree: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/sarees/meta/categories — category counts (public)
router.get('/meta/categories', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT type, COUNT(*) as count FROM sarees WHERE is_active = 1 GROUP BY type`
    );
    const [total] = await db.query('SELECT COUNT(*) as total FROM sarees WHERE is_active = 1');
    res.json({ success: true, total: total[0].total, categories: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── ADMIN ROUTES (require auth) ────────────────────────────────

// GET /api/sarees/admin/all — all sarees including inactive
router.get('/admin/all', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sarees ORDER BY created_at DESC');
    res.json({ success: true, count: rows.length, sarees: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/sarees — add new saree (admin)
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  const { name, type, price, old_price, color, stock, rating, reviews, badge, emoji, image_url, description } = req.body;
  if (!name || !type || !price) {
    return res.status(400).json({ success: false, message: 'Name, type, and price are required.' });
  }

  // Image: uploaded file takes priority over URL
  let finalImageUrl = image_url || null;
  if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

  try {
    const [result] = await db.query(
      `INSERT INTO sarees (name, type, price, old_price, color, stock, rating, reviews, badge, emoji, image_url, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, type, parseFloat(price), parseFloat(old_price)||null, color||'', parseInt(stock)||0,
       parseFloat(rating)||5.0, parseInt(reviews)||0, badge||'', emoji||'🥻', finalImageUrl, description||'']
    );
    const [newSaree] = await db.query('SELECT * FROM sarees WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Saree added!', saree: newSaree[0] });
  } catch (err) {
    console.error('POST /sarees error:', err);
    res.status(500).json({ success: false, message: 'Failed to add saree.' });
  }
});

// PUT /api/sarees/:id — update saree (admin)
router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
  const { name, type, price, old_price, color, stock, rating, reviews, badge, emoji, image_url, description, is_active } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM sarees WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Saree not found.' });

    let finalImageUrl = image_url !== undefined ? image_url : existing[0].image_url;
    if (req.file) {
      // Delete old file if it was local
      if (existing[0].image_url && existing[0].image_url.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '../../public', existing[0].image_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    await db.query(
      `UPDATE sarees SET name=?, type=?, price=?, old_price=?, color=?, stock=?,
       rating=?, reviews=?, badge=?, emoji=?, image_url=?, description=?, is_active=? WHERE id=?`,
      [name || existing[0].name, type || existing[0].type,
       parseFloat(price) || existing[0].price, parseFloat(old_price) || null,
       color ?? existing[0].color, parseInt(stock) ?? existing[0].stock,
       parseFloat(rating) || existing[0].rating, parseInt(reviews) ?? existing[0].reviews,
       badge ?? existing[0].badge, emoji || existing[0].emoji,
       finalImageUrl, description ?? existing[0].description,
       is_active !== undefined ? parseInt(is_active) : existing[0].is_active,
       req.params.id]
    );

    const [updated] = await db.query('SELECT * FROM sarees WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Saree updated!', saree: updated[0] });
  } catch (err) {
    console.error('PUT /sarees error:', err);
    res.status(500).json({ success: false, message: 'Failed to update saree.' });
  }
});

// DELETE /api/sarees/:id (admin) — soft delete
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id FROM sarees WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Saree not found.' });
    await db.query('UPDATE sarees SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Saree removed from store.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete saree.' });
  }
});

// DELETE /api/sarees/:id/permanent (admin) — hard delete
router.delete('/:id/permanent', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT image_url FROM sarees WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Saree not found.' });
    if (rows[0].image_url && rows[0].image_url.startsWith('/uploads/')) {
      const p = path.join(__dirname, '../../public', rows[0].image_url);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    await db.query('DELETE FROM sarees WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Saree permanently deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete saree.' });
  }
});

module.exports = router;
