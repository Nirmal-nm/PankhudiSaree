const jwt = require('jsonwebtoken');

// ✅ FIXED
function requireAuth(req, res, next) {
  // Check Authorization header first
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }
  // Fallback: check cookie
  if (!token && req.cookies && req.cookies.rm_admin_token) {
    token = req.cookies.rm_admin_token;
  }

  if (!token) {
    return res.status(401).json({ message: "Admin not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rangmahal_secret');
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// 👑 ADMIN AUTH (optional)
function requireAuth(req, res, next) {
  return res.status(403).json({ message: "Admin auth not configured here" });
}

module.exports = { requireUserAuth, requireAuth };