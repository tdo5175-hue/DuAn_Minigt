
/**
 * AUTHENTICATION / AUTHORIZATION MIDDLEWARE
 * JWT được phát hành bởi /api/auth/login và kiểm tra lại với PostgreSQL.
 */
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { unauthorized, forbidden } = require('../utils/http');

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

  const active = u.IsActive ?? u.isactive;

  return {
    UserId: Number(u.UserId ?? u.userid),
    FullName: u.FullName ?? u.fullname ?? '',
    Email: u.Email ?? u.email ?? '',
    Role: String(u.Role ?? u.role ?? 'customer').toLowerCase(),
    IsActive:
      active === true ||
      active === 1 ||
      String(active).toLowerCase() === 'true',
    AvatarUrl: u.AvatarUrl ?? u.avatarurl ?? 'image/anh-clone.jpg',
    Phone: u.Phone ?? u.phone ?? '',
    Address: u.Address ?? u.address ?? '',
    AuthProvider: u.AuthProvider ?? u.authprovider ?? 'local',
    CreatedAt: u.CreatedAt ?? u.createdat
  };
}

function signToken(user) {
  const u = normalizeUser(user);

  if (!u || !Number.isFinite(u.UserId) || u.UserId <= 0) {
    throw new Error('Không thể tạo token: UserId không hợp lệ.');
  }

  const role = u.Role === 'admin' ? 'admin' : 'customer';

  return jwt.sign(
    { sub: u.UserId, role },
    JWT_SECRET,
    {
      expiresIn: TOKEN_TTL[role],
      issuer: 'minigt-store'
    }
  );
}

function readToken(req) {
  const header = String(req.headers.authorization || '').trim();
  const match = header.match(/^Bearer\s+(\S+)$/i);

  return match ? match[1] : null;
}

function decode(token) {
  const payload = jwt.verify(token, JWT_SECRET, {
    issuer: 'minigt-store'
  });

  const userId = Number(payload.sub);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    const err = new Error('JWT subject không hợp lệ');
    err.name = 'JsonWebTokenError';
    throw err;
  }

  return {
    userId,
    role: String(payload.role || 'customer').toLowerCase(),
    exp: payload.exp
  };
}

async function loadActiveUser(userId) {
  if (!userId) return null;

  const result = await db.query(
    `SELECT UserId, FullName, Email, Role, IsActive,
            AvatarUrl, Phone, Address, AuthProvider, CreatedAt
     FROM Users
     WHERE UserId = @id
     LIMIT 1`,
    { id: Number(userId) }
  );

  const row = result.recordset && result.recordset[0];

  return row ? normalizeUser(row) : null;
}

function authenticationError(err, isAdmin = false) {
  if (err && err.name === 'TokenExpiredError') {
    return unauthorized(
      isAdmin
        ? 'Phiên quản trị đã hết hạn, vui lòng đăng nhập lại.'
        : 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
      'TOKEN_EXPIRED'
    );
  }

  return unauthorized(
    isAdmin
      ? 'Phiên quản trị không hợp lệ, vui lòng đăng nhập lại.'
      : 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.',
    'TOKEN_INVALID'
  );
}

async function authenticate(req, res, next) {
  const token = readToken(req);

  const path = (req.originalUrl || '').split('?')[0];
  const isAdminRoute =
    (req.baseUrl || '').startsWith('/api/admin') ||
    path.startsWith('/api/admin');

  if (!token) {
    return next(
      unauthorized(
        isAdminRoute
          ? 'Vui lòng đăng nhập tài khoản quản trị.'
          : 'Vui lòng đăng nhập để tiếp tục.',
        isAdminRoute ? 'NO_ADMIN_TOKEN' : 'NO_TOKEN'
      )
    );
  }

  let decoded;

  try {
    decoded = decode(token);
  } catch (err) {
    return next(authenticationError(err, isAdminRoute));
  }

  if (isAdminRoute && decoded.role !== 'admin') {
    return next(
      forbidden('Tài khoản không có quyền quản trị.', 'ADMIN_REQUIRED')
    );
  }

  req.user = decoded;
  return next();
}

function optionalAuth(req, res, next) {
  const token = readToken(req);

  if (token) {
    try {
      req.user = decode(token);
    } catch (_) {
      req.user = null;
    }
  }

  return next();
}

async function requireActiveUser(req, res, next) {
  try {
    const user = await loadActiveUser(req.user && req.user.userId);

    if (!user) {
      return next(
        unauthorized(
          'Tài khoản không tồn tại hoặc phiên đã hết hiệu lực.',
          'TOKEN_INVALID'
        )
      );
    }

    if (!user.IsActive) {
      return next(
        forbidden('Tài khoản đã bị khóa. Vui lòng liên hệ cửa hàng.')
      );
    }

    req.dbUser = user;
    req.user.role = user.Role;

    return next();
  } catch (err) {
    return next(err);
  }
}

async function requireAdmin(req, res, next) {
  try {
    const user =
      req.dbUser ||
      await loadActiveUser(req.user && req.user.userId);

    if (!user) {
      return next(
        unauthorized('Tài khoản quản trị không tồn tại.', 'USER_NOT_FOUND')
      );
    }

    if (!user.IsActive) {
      return next(forbidden('Tài khoản quản trị đã bị khóa.'));
    }

    if (String(user.Role).toLowerCase() !== 'admin') {
      return next(
        forbidden('Tài khoản không có quyền quản trị.', 'ADMIN_REQUIRED')
      );
    }

    req.dbUser = user;
    req.user = {
      ...(req.user || {}),
      userId: Number(user.UserId),
      role: 'admin'
    };

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  signToken,
  authenticate,
  optionalAuth,
  requireActiveUser,
  requireAdmin,
  loadActiveUser
};
