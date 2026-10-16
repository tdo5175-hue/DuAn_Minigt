/**
 * SECURITY MIDDLEWARE: security headers, CORS whitelist, rate limiter (in-memory, không cần thư viện ngoài)
 */
const { HttpError } = require('../utils/http');

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

/**
 * CORS: cho phép same-origin, localhost (dev) và danh sách CORS_ORIGINS trong .env
 * (VD: CORS_ORIGINS=https://minigt-store.vercel.app,https://admin.minigt.vn)
 */
function corsOptions() {
  const whitelist = String(process.env.CORS_ORIGINS || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const devRe = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  return {
    origin(origin, cb) {
      if (!origin || origin === 'null') return cb(null, true); // same-origin / file:// / curl
      if (devRe.test(origin) || whitelist.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600
  };
}

/** Rate limiter cửa sổ trượt đơn giản theo key */
function rateLimit({ windowMs = 15 * 60 * 1000, max = 10, keyFn, message } = {}) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : req.ip;
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.reset < now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return next(new HttpError(429, message || 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút', 'RATE_LIMITED'));
    }
    next();
  };
}

module.exports = { securityHeaders, corsOptions, rateLimit };
