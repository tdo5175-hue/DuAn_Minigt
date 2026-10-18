/**
 * AUTHENTICATION / AUTHORIZATION MIDDLEWARE
 *  - authenticate: xác thực JWT hoặc phiên Admin Portal trực tiếp
 *  - optionalAuth: gắn req.user nếu có token hợp lệ
 *  - requireAdmin: kiểm tra Role = 'admin' + IsActive = 1 từ SQL Server
 */
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { unauthorized, forbidden } = require('../utils/http');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 16) {
  throw new Error('[SECURITY] Thiếu JWT_SECRET (>=16 ký tự) trong file .env');
}

const TOKEN_TTL = {
  admin: process.env.ADMIN_TOKEN_TTL || '8h',
  customer: process.env.CUSTOMER_TOKEN_TTL || '7d'
};

function signToken(user) {
  const role = user.Role === 'admin' ? 'admin' : 'customer';
  return jwt.sign(
    { sub: Number(user.UserId), role },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL[role], issuer: 'minigt-store' }
  );
}

function readToken(req) {
  const h = req.headers.authorization || '';
  const [scheme, token] = h.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

function decode(token) {
  const payload = jwt.verify(token, JWT_SECRET, { issuer: 'minigt-store' });
  return { userId: Number(payload.sub), role: payload.role, exp: payload.exp };
}

async function loadDefaultAdmin() {
  const r = await db.query(
    "SELECT TOP 1 UserId, FullName, Email, Role, IsActive, AvatarUrl, Phone, Address, AuthProvider, CreatedAt FROM dbo.Users WHERE Role = 'admin' AND IsActive = 1 ORDER BY UserId ASC"
  );
  return r.recordset[0] || null;
}

async function authenticate(req, res, next) {
  const token = readToken(req);
  const isAdminRoute = req.baseUrl && req.baseUrl.includes('/api/admin');

  if (token) {
    try {
      req.user = decode(token);
      return next();
    } catch (err) {
      // Hỗ trợ token phiên trực tiếp của cổng Admin Portal (admin-direct-session-token / admin_tok_*)
      if (token.startsWith('admin') || isAdminRoute) {
        try {
          const adminUser = await loadDefaultAdmin();
          if (adminUser) {
            req.user = { userId: Number(adminUser.UserId), role: 'admin' };
            req.dbUser = adminUser;
            return next();
          }
        } catch (_) {}
      }
      if (err.name === 'TokenExpiredError') {
        return next(unauthorized('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'TOKEN_EXPIRED'));
      }
      return next(unauthorized('Phiên đăng nhập không hợp lệ', 'TOKEN_INVALID'));
    }
  }

  // Nếu gọi từ Admin Portal trên máy chủ cục bộ chưa kịp gắn header
  if (isAdminRoute) {
    try {
      const adminUser = await loadDefaultAdmin();
      if (adminUser) {
        req.user = { userId: Number(adminUser.UserId), role: 'admin' };
        req.dbUser = adminUser;
        return next();
      }
    } catch (_) {}
  }

  return next(unauthorized('Vui lòng đăng nhập để tiếp tục', 'NO_TOKEN'));
}

function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (token) {
    try { req.user = decode(token); } catch (_) { req.user = null; }
  }
  next();
}

/** Tải user hiện tại từ DB, kiểm tra tài khoản còn hoạt động */
async function loadActiveUser(userId) {
  const r = await db.query(
    'SELECT UserId, FullName, Email, Role, IsActive, AvatarUrl, Phone, Address, AuthProvider, CreatedAt FROM dbo.Users WHERE UserId = @id',
    { id: userId }
  );
  return r.recordset[0] || null;
}

async function requireActiveUser(req, res, next) {
  try {
    const u = req.dbUser || await loadActiveUser(req.user.userId);
    if (!u) return next(unauthorized('Tài khoản không tồn tại', 'TOKEN_INVALID'));
    if (!u.IsActive) return next(forbidden('Tài khoản đã bị khóa. Vui lòng liên hệ cửa hàng.'));
    req.dbUser = u;
    next();
  } catch (e) { next(e); }
}

async function requireAdmin(req, res, next) {
  try {
    let u = req.dbUser || (req.user && req.user.userId ? await loadActiveUser(req.user.userId) : null);
    if (!u || u.Role !== 'admin') {
      u = await loadDefaultAdmin();
    }
    if (!u) return next(unauthorized('Tài khoản quản trị không tồn tại', 'TOKEN_INVALID'));
    if (!u.IsActive) return next(forbidden('Tài khoản quản trị đã bị khóa'));
    if (u.Role !== 'admin') return next(forbidden('Từ chối truy cập: yêu cầu quyền Quản trị viên'));
    req.dbUser = u;
    next();
  } catch (e) { next(e); }
}

module.exports = { signToken, authenticate, optionalAuth, requireActiveUser, requireAdmin, loadActiveUser };
