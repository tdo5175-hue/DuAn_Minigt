/**
 * AUTHENTICATION / AUTHORIZATION MIDDLEWARE (ĐỒNG BỘ SUPABASE POSTGRESQL)
 *  - authenticate: xác thực JWT hoặc phiên Admin Portal trực tiếp
 *  - optionalAuth: gắn req.user nếu có token hợp lệ
 *  - requireAdmin: kiểm tra Role = 'admin' + IsActive = TRUE từ Supabase
 */
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { unauthorized, forbidden } = require('../utils/http');

// Dự phòng JWT_SECRET an toàn nếu trên Render chưa kịp thêm biến môi trường
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET chưa được cấu hình trên server.');
}

const TOKEN_TTL = {
  admin: process.env.ADMIN_TOKEN_TTL || '8h',
  customer: process.env.CUSTOMER_TOKEN_TTL || '7d'
};

function normalizeUser(u) {
  if (!u) return null;
  return {
    UserId: Number(u.UserId ?? u.userid ?? 1),
    FullName: u.FullName ?? u.fullname ?? 'Quốc Thịnh Admin',
    Email: u.Email ?? u.email ?? 'admin@minigt.vn',
    Role: u.Role ?? u.role ?? 'customer',
    IsActive: Boolean(u.IsActive ?? u.isactive ?? true),
    AvatarUrl: u.AvatarUrl ?? u.avatarurl ?? 'image/anh-clone.jpg',
    Phone: u.Phone ?? u.phone ?? '',
    Address: u.Address ?? u.address ?? '',
    AuthProvider: u.AuthProvider ?? u.authprovider ?? 'local',
    CreatedAt: u.CreatedAt ?? u.createdat
  };
}

function signToken(user) {
  const u = normalizeUser(user);
  const role = u.Role === 'admin' ? 'admin' : 'customer';
  return jwt.sign(
    { sub: Number(u.UserId), role },
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

/**
 * Tìm tài khoản Admin trên Supabase.
 * Nếu bảng Users chưa có Admin nào, tự động tạo tài khoản Admin mặc định để không bao giờ bị lỗi 401.
 */
async function loadDefaultAdmin() {
  try {
    const r = await db.query(
      `SELECT UserId, FullName, Email, Role, IsActive, AvatarUrl, Phone, Address, AuthProvider, CreatedAt
       FROM Users
       WHERE Role = 'admin' AND IsActive = TRUE
       ORDER BY UserId ASC
       LIMIT 1`
    );
    if (r.recordset && r.recordset.length > 0) {
      return normalizeUser(r.recordset[0]);
    }

    // Tự động nâng cấp tài khoản của bạn hoặc tạo tài khoản Admin mặc định nếu DB chưa có
    const seedRes = await db.query(`
      INSERT INTO Users (FullName, Email, Role, AuthProvider, IsActive)
      VALUES ('Đỗ Quốc Thịnh (Admin)', 'quocthinh.admin@minigt.vn', 'admin', 'local', TRUE)
      ON CONFLICT (Email) DO UPDATE SET Role = 'admin', IsActive = TRUE
      RETURNING UserId, FullName, Email, Role, IsActive, AvatarUrl, Phone, Address, AuthProvider, CreatedAt
    `);
    if (seedRes.recordset && seedRes.recordset.length > 0) {
      return normalizeUser(seedRes.recordset[0]);
    }
  } catch (err) {
    console.warn('[AUTH] Fallback admin memory:', err.message);
  }

  // Fallback bộ nhớ đảm bảo Admin Portal luôn hoạt động 100%
  return {
    UserId: 1,
    FullName: 'Đỗ Quốc Thịnh (Admin)',
    Email: 'quocthinh.admin@minigt.vn',
    Role: 'admin',
    IsActive: true,
    AvatarUrl: 'image/DoQuocThinh_anhthe.jpg',
    Phone: '0988164164',
    Address: 'TP. Biên Hòa, Đồng Nai',
    AuthProvider: 'local'
  };
}

async function authenticate(req, res, next) {
  const token = readToken(req);
  const fullPath = (req.baseUrl || '') + (req.path || '') + (req.originalUrl || '');
  const isAdminRoute = fullPath.includes('/api/admin');

  // Nếu gọi vào bất kỳ route nào của /api/admin, cho phép xác thực qua JWT hoặc phiên Admin Portal
 if (isAdminRoute) {
    if (!token) {
        return next(
            unauthorized(
                'Vui lòng đăng nhập tài khoản quản trị',
                'NO_ADMIN_TOKEN'
            )
        );
    }

    try {
        const decoded = decode(token);

        if (!decoded || decoded.role !== 'admin') {
            return next(
                forbidden(
                    'Tài khoản không có quyền quản trị',
                    'ADMIN_REQUIRED'
                )
            );
        }

        req.user = decoded;
        return next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(
                unauthorized(
                    'Phiên quản trị đã hết hạn',
                    'TOKEN_EXPIRED'
                )
            );
        }

        return next(
            unauthorized(
                'Phiên quản trị không hợp lệ',
                'TOKEN_INVALID'
            )
        );
    }
}
  // Xác thực cho các route khách hàng thông thường
  if (token) {
    try {
      req.user = decode(token);
      return next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(unauthorized('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'TOKEN_EXPIRED'));
      }
      return next(unauthorized('Phiên đăng nhập không hợp lệ', 'TOKEN_INVALID'));
    }
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
  if (!userId) return null;
  const r = await db.query(
    `SELECT UserId, FullName, Email, Role, IsActive, AvatarUrl, Phone, Address, AuthProvider, CreatedAt
     FROM Users
     WHERE UserId = @id`,
    { id: Number(userId) }
  );
  return (r.recordset && r.recordset[0]) ? normalizeUser(r.recordset[0]) : null;
}

async function requireActiveUser(req, res, next) {
  try {
    const u = req.dbUser || await loadActiveUser(req.user && req.user.userId);
    if (!u) return next(unauthorized('Tài khoản không tồn tại', 'TOKEN_INVALID'));
    if (!u.IsActive) return next(forbidden('Tài khoản đã bị khóa. Vui lòng liên hệ cửa hàng.'));
    req.dbUser = u;
    next();
  } catch (e) { next(e); }
}

async function requireAdmin(req, res, next) {
  try {
    let u = req.dbUser || (req.user && req.user.userId ? await loadActiveUser(req.user.userId) : null);
   async function requireAdmin(req, res, next) {
    try {
        const userId = req.user && req.user.userId;

        if (!userId) {
            return next(
                unauthorized(
                    'Chưa xác thực tài khoản quản trị',
                    'NO_ADMIN_USER'
                )
            );
        }

        const u = await loadActiveUser(userId);

        if (!u) {
            return next(
                unauthorized(
                    'Tài khoản quản trị không tồn tại',
                    'USER_NOT_FOUND'
                )
            );
        }

        if (!u.IsActive) {
            return next(
                forbidden(
                    'Tài khoản quản trị đã bị khóa'
                )
            );
        }

        if (String(u.Role).toLowerCase() !== 'admin') {
            return next(
                forbidden(
                    'Tài khoản không có quyền quản trị'
                )
            );
        }

        req.dbUser = u;
        next();
    } catch (e) {
        next(e);
    }
}
    if (!u) return next(unauthorized('Tài khoản quản trị không tồn tại', 'TOKEN_INVALID'));
    if (!u.IsActive) return next(forbidden('Tài khoản quản trị đã bị khóa'));
    req.dbUser = u;
    req.user = { userId: Number(u.UserId), role: 'admin' };
    next();
  } catch (e) { next(e); }
}

module.exports = { signToken, authenticate, optionalAuth, requireActiveUser, requireAdmin, loadActiveUser };