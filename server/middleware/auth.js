/**
 * JWT Authentication Middleware
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'minigt_super_secret_jwt_key_2026';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để thực hiện' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ' });
  }
}

function optionalToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // Ignored for optional
    }
  }
  next();
}

module.exports = {
  verifyToken,
  optionalToken,
  JWT_SECRET
};
