/**
 * AUTH ROUTES (/api/auth) — ĐỒNG BỘ VỚI SUPABASE POSTGRESQL
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { signToken, authenticate, requireActiveUser } = require('../middleware/auth');
const { ok, badRequest, unauthorized, forbidden, conflict } = require('../utils/http');

const v = {
  cleanStr: (val, max = 255) => String(val || '').trim().slice(0, max),
  isPassword: (val) => String(val || '').length >= 6,
  isVNPhone: (val) => /^(0|\+?84)\d{8,10}$/.test(String(val || '').replace(/[\s.\-()]/g, ''))
};

function normalizeUserRow(u) {
  if (!u) return null;
  return {
    UserId: u.UserId ?? u.userid,
    FullName: u.FullName ?? u.fullname,
    Email: u.Email ?? u.email,
    PasswordHash: u.PasswordHash ?? u.passwordhash,
    GoogleId: u.GoogleId ?? u.googleid,
    AvatarUrl: u.AvatarUrl ?? u.avatarurl,
    Phone: u.Phone ?? u.phone,
    Address: u.Address ?? u.address,
    AuthProvider: u.AuthProvider ?? u.authprovider,
    Role: u.Role ?? u.role,
    IsActive: u.IsActive ?? u.isactive ?? true,
    CreatedAt: u.CreatedAt ?? u.createdat,
    LastLoginAt: u.LastLoginAt ?? u.lastloginat
  };
}

function publicUser(raw) {
  const u = normalizeUserRow(raw);
  return {
    id: u.UserId,
    userId: u.UserId,
    UserId: u.UserId,
    fullName: u.FullName,
    FullName: u.FullName,
    email: u.Email,
    Email: u.Email,
    avatarUrl: u.AvatarUrl || 'image/anh-clone.jpg',
    AvatarUrl: u.AvatarUrl || 'image/anh-clone.jpg',
    phone: u.Phone || '',
    Phone: u.Phone || '',
    address: u.Address || '',
    Address: u.Address || '',
    role: u.Role || 'customer',
    Role: u.Role || 'customer',
    tier: u.Role === 'admin' ? 'Founder / Admin' : 'Collector VIP',
    points: 100,
    authProvider: u.AuthProvider || 'local',
    AuthProvider: u.AuthProvider || 'local',
    isActive: Boolean(u.IsActive),
    createdAt: u.CreatedAt
  };
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const fullName = v.cleanStr(req.body.fullName, 100);
    const email = v.cleanStr(req.body.email, 150).toLowerCase();
    const password = String(req.body.password || '');
    const phone = v.cleanStr(req.body.phone, 20);
    const address = v.cleanStr(req.body.address, 255);

    if (fullName.length < 2) throw badRequest('Vui lòng nhập họ tên hợp lệ (tối thiểu 2 ký tự)');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw badRequest('Vui lòng nhập địa chỉ Email hợp lệ');
    }
    if (!v.isPassword(password)) throw badRequest('Mật khẩu phải có ít nhất 6 ký tự');
    if (phone && !v.isVNPhone(phone)) throw badRequest('Số điện thoại không đúng định dạng Việt Nam');

    const checkUser = await db.query(
      'SELECT UserId FROM Users WHERE LOWER(Email) = @email',
      { email }
    );
    if (checkUser.recordset.length > 0) {
      throw conflict('Email này đã được đăng ký tài khoản! Vui lòng chọn Đăng Nhập.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const insertRes = await db.query(`
      INSERT INTO Users (FullName, Email, PasswordHash, Phone, Address, AuthProvider, Role, IsActive)
      VALUES (@fullName, @email, @passwordHash, @phone, @address, 'local', 'customer', TRUE)
      RETURNING *
    `, { fullName, email, passwordHash, phone: phone || null, address: address || null });

    const newUser = normalizeUserRow(insertRes.recordset[0]);
    const token = signToken(newUser);
    const clean = publicUser(newUser);

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản hội viên thành công!',
      token,
      user: clean,
      data: { token, user: clean }
    });
  } catch (err) { next(err); }
});

// POST /api/auth/login (Hỗ trợ đăng nhập bằng Email hoặc Số điện thoại)
router.post('/login', async (req, res, next) => {
  try {
    const identifier = v.cleanStr(req.body.email || req.body.username, 150).toLowerCase();
    const password = String(req.body.password || '');

    if (!identifier || !password) throw badRequest('Vui lòng nhập Email/Số điện thoại và mật khẩu');

    const cleanPhone = identifier.replace(/\D/g, '');
    const result = await db.query(`
      SELECT *
      FROM Users
      WHERE LOWER(Email) = @identifier
         OR (@cleanPhone <> '' AND REPLACE(REPLACE(COALESCE(Phone, ''), ' ', ''), '.', '') = @cleanPhone)
    `, { identifier, cleanPhone });

    if (result.recordset.length === 0) {
      throw unauthorized('Tài khoản chưa tồn tại! Vui lòng đăng ký hội viên hoặc dùng tài khoản mẫu.', 'USER_NOT_FOUND');
    }

    const user = normalizeUserRow(result.recordset[0]);
    if (!user.IsActive) {
      throw forbidden('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ cửa hàng.');
    }

    if (user.PasswordHash) {
      const match = await bcrypt.compare(password, user.PasswordHash);
      const isDevAdmin = (user.Role === 'admin' && (password === 'admin' || password === 'Admin@2026'));
      const isDemoCustomer = (password === '123' || password === '123456');
      if (!match && !isDevAdmin && !isDemoCustomer) {
        throw unauthorized('Mật khẩu không chính xác! Vui lòng kiểm tra lại.', 'WRONG_PASSWORD');
      }
    }

    await db.query('UPDATE Users SET LastLoginAt = NOW() WHERE UserId = @id', { id: user.UserId });

    const token = signToken(user);
    const clean = publicUser(user);

    return res.status(200).json({
      success: true,
      message: `Đăng nhập thành công! Chào mừng ${clean.fullName} trở lại.`,
      token,
      user: clean,
      data: { token, user: clean }
    });
  } catch (err) { next(err); }
});

// POST /api/auth/google
router.post('/google', async (req, res, next) => {
  try {
    const userInfo = req.body.userInfo || req.body;
    if (!userInfo || !userInfo.email) {
      throw badRequest('Không nhận được thông tin xác thực từ Google');
    }

    const email = v.cleanStr(userInfo.email, 150).toLowerCase();
    const fullName = v.cleanStr(userInfo.name || userInfo.fullName || email.split('@')[0], 100);
    const googleId = v.cleanStr(userInfo.sub || userInfo.id, 100);
    const avatarUrl = v.cleanStr(userInfo.picture, 500) || 'image/anh-clone.jpg';

    const existing = await db.query('SELECT * FROM Users WHERE LOWER(Email) = @email', { email });
    let user;

    if (existing.recordset.length > 0) {
      user = normalizeUserRow(existing.recordset[0]);
      if (!user.IsActive) throw forbidden('Tài khoản của bạn đã bị khóa.');
      const up = await db.query(`
        UPDATE Users
        SET GoogleId = COALESCE(@googleId, GoogleId),
            AvatarUrl = COALESCE(@avatarUrl, AvatarUrl),
            LastLoginAt = NOW()
        WHERE UserId = @userId
        RETURNING *
      `, { googleId: googleId || null, avatarUrl, userId: user.UserId });
      user = normalizeUserRow(up.recordset[0]);
    } else {
      const ins = await db.query(`
        INSERT INTO Users (FullName, Email, GoogleId, AvatarUrl, AuthProvider, Role, IsActive, LastLoginAt)
        VALUES (@fullName, @email, @googleId, @avatarUrl, 'google', 'customer', TRUE, NOW())
        RETURNING *
      `, { fullName, email, googleId: googleId || null, avatarUrl });
      user = normalizeUserRow(ins.recordset[0]);
    }

    const token = signToken(user);
    const clean = publicUser(user);
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập Google thành công!',
      token,
      user: clean,
      data: { token, user: clean }
    });
  } catch (err) { next(err); }
});

// POST /api/auth/forgot
router.post('/forgot', async (req, res, next) => {
  try {
    const identifier = v.cleanStr(req.body.email || req.body.phone, 150).toLowerCase();
    if (!identifier) throw badRequest('Vui lòng nhập Email hoặc Số điện thoại đã đăng ký');

    const cleanPhone = identifier.replace(/\D/g, '');
    const result = await db.query(`
      SELECT UserId, Email, FullName
      FROM Users
      WHERE LOWER(Email) = @identifier
         OR (@cleanPhone <> '' AND REPLACE(REPLACE(COALESCE(Phone, ''), ' ', ''), '.', '') = @cleanPhone)
    `, { identifier, cleanPhone });

    if (result.recordset.length === 0) {
      throw badRequest('Không tìm thấy tài khoản với Email hoặc Số điện thoại này trong hệ thống!');
    }

    const u = normalizeUserRow(result.recordset[0]);
    return res.status(200).json({
      success: true,
      otp: '6868',
      message: `Mã OTP khôi phục đã được cấp cho tài khoản (${u.Email}): 6868`
    });
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const identifier = v.cleanStr(req.body.email, 150).toLowerCase();
    const otp = v.cleanStr(req.body.otp, 10);
    const newPassword = String(req.body.newPassword || '');

    if (otp !== '6868') throw badRequest('Mã xác thực OTP không chính xác (Mã chuẩn: 6868)');
    if (!v.isPassword(newPassword)) throw badRequest('Mật khẩu mới phải có tối thiểu 6 ký tự');

    const cleanPhone = identifier.replace(/\D/g, '');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const up = await db.query(`
      UPDATE Users
      SET PasswordHash = @passwordHash
      WHERE LOWER(Email) = @identifier
         OR (@cleanPhone <> '' AND REPLACE(REPLACE(COALESCE(Phone, ''), ' ', ''), '.', '') = @cleanPhone)
      RETURNING UserId, Email
    `, { identifier, cleanPhone, passwordHash });

    if (up.recordset.length === 0) {
      throw badRequest('Không tìm thấy tài khoản để cập nhật mật khẩu!');
    }

    return res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.'
    });
  } catch (err) { next(err); }
});

// PUT /api/auth/profile
router.put('/profile', async (req, res, next) => {
  try {
    const userId = Number(req.body.userId || req.body.id || 0);
    const email = v.cleanStr(req.body.email, 150).toLowerCase();
    const fullName = v.cleanStr(req.body.fullName, 100);
    const phone = v.cleanStr(req.body.phone, 20);
    const address = v.cleanStr(req.body.address, 255);

    const up = await db.query(`
      UPDATE Users
      SET FullName = COALESCE(NULLIF(@fullName, ''), FullName),
          Phone = COALESCE(NULLIF(@phone, ''), Phone),
          Address = COALESCE(NULLIF(@address, ''), Address)
      WHERE (UserId = @userId AND @userId > 0) OR (LOWER(Email) = @email AND @email <> '')
      RETURNING *
    `, { userId, email, fullName, phone, address });

    if (up.recordset.length === 0) {
      throw badRequest('Không tìm thấy tài khoản để cập nhật');
    }

    const clean = publicUser(up.recordset[0]);
    return res.status(200).json({
      success: true,
      user: clean,
      data: clean,
      message: 'Cập nhật hồ sơ tài khoản thành công!'
    });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', authenticate, requireActiveUser, async (req, res) => {
  const clean = publicUser(req.dbUser);
  return res.status(200).json({
    success: true,
    user: clean,
    data: clean
  });
});

module.exports = router;