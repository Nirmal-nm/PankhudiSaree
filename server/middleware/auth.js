const jwt = require('jsonwebtoken');

// 👤 USER AUTH (NEW)
function requireUserAuth(req, res, next) {
  let token = null;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rangmahal_secret');
    req.user = decoded;
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