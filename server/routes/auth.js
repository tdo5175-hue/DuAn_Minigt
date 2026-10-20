/**
 * AUTH ROUTES (/api/auth) — SUPABASE POSTGRESQL + GMAIL NODEMAILER OTP THẬT
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const db = require('../config/db');
const { signToken, authenticate, requireActiveUser } = require('../middleware/auth');
const { ok, badRequest, unauthorized, forbidden, conflict } = require('../utils/http');

// Bộ nhớ lưu tạm OTP (có hiệu lực 5 phút)
const otpStore = new Map();

// Cấu hình gửi mail qua Gmail
const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'tdo5175@gmail.com',
    pass: (process.env.EMAIL_PASS || 'lyengcphlvqxyoff').replace(/\s+/g, '')
  }
});

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

    // 1. Kiểm tra Email duy nhất trong toàn hệ thống (cả Google và Local)
    const checkUser = await db.query(
      'SELECT UserId, FullName, Email, AuthProvider, PasswordHash FROM Users WHERE LOWER(Email) = @email',
      { email }
    );
    if (checkUser.recordset.length > 0) {
      const existing = checkUser.recordset[0];
      const isGoogleLinked = (existing.AuthProvider === 'google' || existing.authprovider === 'google' || !existing.PasswordHash);
      if (isGoogleLinked) {
        throw conflict('Email này đã được liên kết với tài khoản Google! Mỗi email chỉ dùng cho 1 tài khoản duy nhất. Vui lòng bấm "Tiếp tục với tài khoản Google" để đăng nhập, hoặc bấm "Quên mật khẩu" để tạo mật khẩu riêng.');
      }
      throw conflict('Email này đã được đăng ký tài khoản hội viên! Mỗi email chỉ dùng cho 1 tài khoản. Vui lòng chuyển sang tab Đăng Nhập.');
    }

    // 2. Kiểm tra Số điện thoại duy nhất (nếu có cung cấp)
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone) {
        const checkPhone = await db.query(`
          SELECT UserId, FullName, Email
          FROM Users
          WHERE REPLACE(REPLACE(COALESCE(Phone, ''), ' ', ''), '.', '') = @cleanPhone
        `, { cleanPhone });
        if (checkPhone.recordset.length > 0) {
          throw conflict('Số điện thoại này đã được sử dụng cho một tài khoản hội viên khác! Vui lòng kiểm tra lại.');
        }
      }
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

// POST /api/auth/login
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
      throw unauthorized('Tài khoản chưa tồn tại! Vui lòng kiểm tra lại hoặc đăng ký tài khoản hội viên.', 'USER_NOT_FOUND');
    }

    const user = normalizeUserRow(result.recordset[0]);
    if (!user.IsActive) {
      throw forbidden('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ cửa hàng.');
    }

    // Nếu tài khoản được tạo qua Google và chưa từng thiết lập mật khẩu riêng qua Quên mật khẩu
    if (!user.PasswordHash) {
      throw unauthorized(
        'Tài khoản này được đăng ký thông qua Google và chưa cài đặt mật khẩu riêng. Vui lòng bấm "Tiếp tục với tài khoản Google" để đăng nhập, hoặc bấm "Quên mật khẩu" để tạo mật khẩu đăng nhập riêng.',
        'OAUTH_ACCOUNT_NO_PASSWORD'
      );
    }

    // So sánh mật khẩu bằng bcrypt
    const match = await bcrypt.compare(password, user.PasswordHash);

    // Mật khẩu phát triển dự phòng chỉ dành cho tài khoản Admin
    const isDevAdmin = (user.Role === 'admin' && (
      password === 'admin' ||
      password === 'Admin@2026!' ||
      password === 'Admin@123' ||
      password === 'admin123' ||
      password === 'quocthinh' ||
      password === 'quocthinh123' ||
      password === 'Doquocthinh123'
    ));

    if (!match && !isDevAdmin) {
      throw unauthorized('Mật khẩu không chính xác! Vui lòng kiểm tra lại hoặc sử dụng "Quên mật khẩu".', 'WRONG_PASSWORD');
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

// GET /api/auth/google/config
router.get('/google/config', (req, res) => {
  return res.status(200).json({
    success: true,
    clientId: process.env.GOOGLE_CLIENT_ID || '670662206600-el2nstl8uokismch5grjt9f2g6m9rfdr.apps.googleusercontent.com'
  });
});

// POST /api/auth/google
router.post('/google', async (req, res, next) => {
  try {
    let googleData = null;
    if (req.body.credential) {
      try {
        const parts = String(req.body.credential).split('.');
        if (parts.length === 3) {
          const payloadBase64 = parts[1];
          const decoded = Buffer.from(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
          googleData = JSON.parse(decoded);
        }
      } catch (jwtErr) {
        console.warn('[GOOGLE JWT PARSE WARNING]:', jwtErr.message);
      }
    }

    const userInfo = googleData || req.body.userInfo || req.body;
    if (!userInfo || !userInfo.email) {
      throw badRequest('Không nhận được thông tin xác thực từ Google');
    }

    const email = v.cleanStr(userInfo.email, 150).toLowerCase();
    const fullName = v.cleanStr(userInfo.name || userInfo.fullName || email.split('@')[0], 100);
    const googleId = v.cleanStr(userInfo.sub || userInfo.id || userInfo.googleId, 100);
    const avatarUrl = v.cleanStr(userInfo.picture || userInfo.avatarUrl, 500) || 'image/anh-clone.jpg';

    const existing = await db.query('SELECT * FROM Users WHERE LOWER(Email) = @email OR (GoogleId IS NOT NULL AND GoogleId = @googleId)', { email, googleId: googleId || null });
    let user;

    if (existing.recordset.length > 0) {
      user = normalizeUserRow(existing.recordset[0]);
      if (!user.IsActive) throw forbidden('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
      const up = await db.query(`
        UPDATE Users
        SET GoogleId = COALESCE(GoogleId, @googleId),
            AvatarUrl = CASE WHEN (AvatarUrl IS NULL OR AvatarUrl = '' OR AvatarUrl = 'image/anh-clone.jpg') THEN @avatarUrl ELSE AvatarUrl END,
            FullName = COALESCE(NULLIF(@fullName, ''), FullName),
            LastLoginAt = NOW()
        WHERE UserId = @userId
        RETURNING *
      `, { googleId: googleId || null, avatarUrl, fullName, userId: user.UserId });
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
      message: `Đăng nhập Google thành công! Chào mừng ${clean.fullName}.`,
      token,
      user: clean,
      data: { token, user: clean }
    });
  } catch (err) { next(err); }
});

// POST /api/auth/forgot — GỬI MÃ OTP THẬT QUA GMAIL
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
    const otpCode = String(Math.floor(100000 + Math.random() * 900000)); // Mã 6 số ngẫu nhiên
    const expiresAt = Date.now() + 5 * 60 * 1000; // Hạn 5 phút

    otpStore.set(u.Email.toLowerCase(), { otp: otpCode, expiresAt });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15,23,42,0.08); border: 1px solid #e2e8f0; }
          .header { background: #0f172a; padding: 28px 24px; text-align: center; border-bottom: 3px solid #dc2626; }
          .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1.5px; }
          .header p { color: #94a3b8; margin: 6px 0 0; font-size: 12px; }
          .content { padding: 32px 28px; color: #1e293b; line-height: 1.6; }
          .greeting { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
          .otp-box { background: #fef2f2; border: 2px dashed #dc2626; border-radius: 12px; padding: 22px 16px; text-align: center; margin: 24px 0; }
          .otp-label { font-size: 11.5px; font-weight: 800; color: #b91c1c; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #dc2626; margin: 0; }
          .note { font-size: 12.5px; color: #64748b; background: #f8fafc; border-left: 3px solid #f59e0b; padding: 10px 14px; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11.5px; color: #64748b; }
          .footer strong { color: #0f172a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MINI GT STORE BIÊN HÒA</h1>
            <p>Hệ thống mô hình tĩnh 1:64 & Pre-order Collector Pass</p>
          </div>
          <div class="content">
            <div class="greeting">Xin chào ${u.FullName || 'Quý khách'},</div>
            <p style="margin: 0 0 14px 0; font-size: 13.5px; color: #334155;">
              Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản hội viên liên kết với địa chỉ email: <strong>${u.Email}</strong>.
            </p>
            <div class="otp-box">
              <div class="otp-label">MÃ XÁC THỰC ĐẶT LẠI MẬT KHẨU (OTP)</div>
              <div class="otp-code">${otpCode}</div>
            </div>
            <div class="note">
              ⏱️ <strong>Thời hạn hiệu lực:</strong> Mã xác thực trên chỉ có giá trị trong vòng <strong>5 phút</strong>.<br>
              🔒 <strong>Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email.
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0 0 4px 0;"><strong>MINI GT STORE BIÊN HÒA - SĂN XE BIÊN HÒA</strong></p>
            <p style="margin: 0 0 4px 0;">Showroom: 38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai</p>
            <p style="margin: 0;">Hotline / Zalo hỗ trợ: <strong>0988.164.164</strong> • Email: ${process.env.EMAIL_USER || 'tdo5175@gmail.com'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    let emailSent = false;
    try {
      await mailTransporter.sendMail({
        from: `"MINI GT STORE BIÊN HÒA" <${process.env.EMAIL_USER || 'tdo5175@gmail.com'}>`,
        to: u.Email,
        subject: `[MINI GT STORE] Mã xác thực OTP đặt lại mật khẩu: ${otpCode}`,
        html: emailHtml
      });
      emailSent = true;
      console.log(`[MAIL OTP SUCCESS]: Đã gửi OTP ${otpCode} tới ${u.Email}`);
    } catch (err) {
      console.error('[MAIL OTP ERROR]: Lỗi gửi email qua Gmail SMTP:', err.message);
    }

    return res.status(200).json({
      success: true,
      emailSent,
      email: u.Email,
      message: emailSent
        ? `Mã xác thực OTP gồm 6 chữ số đã được gửi tới hộp thư Gmail (${u.Email})! Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam).`
        : `Hệ thống đã tạo mã xác thực OTP cho tài khoản ${u.Email}. Vui lòng kiểm tra Gmail hoặc dùng mã thử nghiệm 6868.`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password — KIỂM TRA OTP VÀ ĐỔI MẬT KHẨU
router.post('/reset-password', async (req, res, next) => {
  try {
    const identifier = v.cleanStr(req.body.email, 150).toLowerCase();
    const otp = v.cleanStr(req.body.otp, 10).trim();
    const newPassword = String(req.body.newPassword || '');

    if (!v.isPassword(newPassword)) throw badRequest('Mật khẩu mới phải có tối thiểu 6 ký tự');

    const cleanPhone = identifier.replace(/\D/g, '');
    const userRes = await db.query(`
      SELECT UserId, Email
      FROM Users
      WHERE LOWER(Email) = @identifier
         OR (@cleanPhone <> '' AND REPLACE(REPLACE(COALESCE(Phone, ''), ' ', ''), '.', '') = @cleanPhone)
    `, { identifier, cleanPhone });

    if (userRes.recordset.length === 0) {
      throw badRequest('Không tìm thấy tài khoản để cập nhật mật khẩu!');
    }

    const u = normalizeUserRow(userRes.recordset[0]);
    const savedRecord = otpStore.get(u.Email.toLowerCase());

    // Vẫn cho phép mã dự phòng '6868' để test nhanh theo yêu cầu
    const isMatchOtp = savedRecord && (Date.now() <= savedRecord.expiresAt) && (savedRecord.otp === otp);
    const isDevFallback = (otp === '6868');

    if (!isMatchOtp && !isDevFallback) {
      if (savedRecord && Date.now() > savedRecord.expiresAt) {
        throw badRequest('Mã xác thực OTP đã hết hạn sau 5 phút! Vui lòng bấm gửi lại mã mới.');
      }
      throw badRequest('Mã xác thực OTP không chính xác! Vui lòng kiểm tra lại Gmail (hoặc dùng mã test 6868).');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.query(`
      UPDATE Users
      SET PasswordHash = @passwordHash
      WHERE UserId = @uid
    `, { uid: u.UserId, passwordHash });

    otpStore.delete(u.Email.toLowerCase());

    return res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới.'
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
      SET FullName = CASE WHEN @fullName <> '' THEN @fullName ELSE FullName END,
          Phone = CASE WHEN @phone <> '' THEN @phone ELSE Phone END,
          Address = CASE WHEN @address <> '' THEN @address ELSE Address END
      WHERE (UserId = @userId AND @userId > 0) OR (LOWER(Email) = @email AND @email <> '')
      RETURNING *
    `, { userId, email, fullName, phone, address });

    if (up.recordset.length === 0) {
      throw badRequest('Không tìm thấy tài khoản để cập nhật');
    }

    const clean = publicUser(up.recordset[0]);
    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin tài khoản hội viên thành công!',
      user: clean,
      data: clean
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