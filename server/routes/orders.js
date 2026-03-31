// server/routes/orders.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ✅ CHANGE: both middlewares import
const { requireAuth, requireUserAuth } = require('../middleware/auth');

// Helper: generate order number
async function generateOrderNumber() {
  const [rows] = await db.query('SELECT MAX(id) as maxId FROM orders');
  const nextId = (rows[0].maxId || 0) + 1;
  return 'RM-' + String(nextId).padStart(5, '0');
}

// ─── USER PROTECTED ROUTE ─────────────────────────────────────────

// ✅ LOGIN REQUIRED ORDER
router.post('/', requireUserAuth, async (req, res) => {
  const {
    customer_name, customer_phone, customer_email,
    address, pincode, city, state,
    saree_name, color_preference, quantity,
    unit_price, payment_method, special_notes,
    cart_items
  } = req.body;

  // ✅ USER ID from token
  const userId = req.user.id;

  // Validation
  if (!customer_name || !customer_phone || !address || !pincode || !saree_name || !payment_method) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
  }

  if (!/^[6-9]\d{9}$/.test(customer_phone.replace(/\D/g, '').slice(-10))) {
    return res.status(400).json({ success: false, message: 'Please enter a valid Indian mobile number.' });
  }

  const qty = parseInt(quantity) || 1;
  const unitP = parseFloat(unit_price) || 0;
  let totalAmount = unitP * qty;

  let cartJson = null;
  if (cart_items && Array.isArray(cart_items) && cart_items.length > 0) {
    cartJson = JSON.stringify(cart_items);
    totalAmount = cart_items.reduce(
      (sum, item) => sum + (parseFloat(item.price)||0) * (parseInt(item.qty)||1),
      0
    );
  }

  try {
    const orderNumber = await generateOrderNumber();

    // ✅ FIX: short IP (avoid DB error)
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    if (ip) ip = ip.split(',')[0].trim();

    const [result] = await db.query(
      `INSERT INTO orders (user_id, order_number, customer_name, customer_phone, customer_email,
        address, pincode, city, state, saree_name, color_preference, quantity,
        unit_price, total_amount, payment_method, special_notes, cart_json, ip_address)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        userId, // ✅ NEW
        orderNumber,
        customer_name.trim(),
        customer_phone.trim(),
        customer_email || null,
        address.trim(),
        pincode.trim(),
        city || null,
        state || null,
        saree_name.trim(),
        color_preference || null,
        qty,
        unitP || null,
        totalAmount || null,
        payment_method.trim(),
        special_notes || null,
        cartJson,
        ip
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! We will contact you within 2 hours.',
      order: {
        id: result.insertId,
        order_number: orderNumber,
        total_amount: totalAmount
      }
    });

  } catch (err) {
    console.error('POST /orders error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to place order. Please try again or call us.'
    });
  }
});


// ✅ NEW: USER ORDER HISTORY
router.get('/my-orders', requireUserAuth, async (req, res) => {
  try {
    const [orders] = await db.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    res.json({ success: true, orders });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ─── PUBLIC TRACK ────────────────────────────────────────────────

router.get('/track/:orderNumber', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT order_number, customer_name, saree_name, quantity, total_amount,
              payment_method, status, tracking_number, created_at, updated_at
       FROM orders WHERE order_number = ?`,
      [req.params.orderNumber.toUpperCase()]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({ success: true, order: rows[0] });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});


// ─── ADMIN ROUTES ────────────────────────────────────────────────

router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, search, limit = 100, offset = 0 } = req.query;

    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (customer_name LIKE ? OR customer_phone LIKE ? OR order_number LIKE ? OR saree_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s,s,s,s);
    }

    sql += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [rows] = await db.query(sql, params);

    res.json({ success: true, orders: rows });

  } catch (err) {
    console.error('GET /orders error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});


// باقي code same 👇 (NO CHANGE)

router.get('/stats/summary', requireAuth, async (req, res) => {
  try {
    const [statusCounts] = await db.query(
      `SELECT status, COUNT(*) as count FROM orders GROUP BY status`
    );

    const [revenue] = await db.query(
      `SELECT COALESCE(SUM(total_amount),0) as total FROM orders WHERE status != 'cancelled'`
    );

    const [todayOrders] = await db.query(
      `SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()`
    );

    const counts = {};
    statusCounts.forEach(r => counts[r.status] = r.count);

    res.json({
      success: true,
      stats: {
        total_orders: statusCounts.reduce((s,r) => s + r.count, 0),
        today_orders: todayOrders[0].count,
        total_revenue: parseFloat(revenue[0].total || 0)
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});


router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({ success: true, order: rows[0] });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});


router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Order deleted.' });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;