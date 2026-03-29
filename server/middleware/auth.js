// server/middleware/auth.js
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  // Check Authorization header OR cookie
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.cookies && req.cookies.rm_admin_token) {
    token = req.cookies.rm_admin_token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rangmahal_secret');
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
  }
}

module.exports = { requireAuth };
