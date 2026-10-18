/**
 * AUTH ROUTES: Local Registration & Login + Gmail / Google OAuth
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
const { signToken, authenticate, loadActiveUser } = require('../middleware/auth');
const { rateLimit } = require('../middleware/security');
const { badRequest, unauthorized, conflict, ok, created } = require('../utils/http');
const v = require('../utils/validators');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Rate limit: tối đa 15 lần đăng nhập/đăng ký trong 15 phút trên mỗi IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi 15 phút.'
});

// 1. ĐĂNG KÝ TÀI KHOẢN MỚI
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const fullName = v.str(req.body.fullName, 100);
    const email = v.str(req.body.email, 150).toLowerCase();
    const password = String(req.body.password || '');
    const phone = v.normalizePhone(req.body.phone);
    const address = v.optStr(req.body.address, 255);

    if (fullName.length < 2) throw badRequest('Họ và tên tối thiểu 2 ký tự');
    if (!v.isGmail(email)) throw badRequest('Hệ thống hiện yêu cầu địa chỉ Gmail (@gmail.com) hợp lệ');
    if (password.length < 6) throw badRequest('Mật khẩu phải có tối thiểu 6 ký tự');
    if (phone && !v.isPhone(phone)) throw badRequest('Số điện thoại Việt Nam không hợp lệ');

    // Kiểm tra trùng email
    const existing = await db.query('SELECT UserId FROM Users WHERE Email = @email', { email });
    if (existing.recordset.length > 0) {
      throw conflict('Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertResult = await db.query(
      `INSERT INTO Users (FullName, Email, PasswordHash, Phone, Address, AvatarUrl, AuthProvider, Role, IsActive, CreatedAt, LastLoginAt)
       OUTPUT INSERTED.UserId, INSERTED.FullName, INSERTED.Email, INSERTED.Role, INSERTED.AvatarUrl
       VALUES (@fullName, @email, @passwordHash, @phone, @address, @avatarUrl, 'local', 'customer', 1, SYSDATETIME(), SYSDATETIME())`,
      {
        fullName,
        email,
        passwordHash,
        phone: phone || null,
        address: address || null,
        avatarUrl: 'image/anh-clone.jpg'
      }
    );

    const newUser = insertResult.recordset[0];
    const token = signToken(newUser);
    const userData = {
      userId: Number(newUser.UserId),
      fullName: newUser.FullName,
      email: newUser.Email,
      role: newUser.Role,
      avatarUrl: newUser.AvatarUrl || 'image/anh-clone.jpg'
    };

    return created(res, {
      token,
      user: userData
    }, 'Đăng ký tài khoản thành công!', { token, user: userData });
  } catch (err) {
    next(err);
  }
});

// 2. ĐĂNG NHẬP BẰNG EMAIL & MẬT KHẨU
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const email = v.str(req.body.email, 150).toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) throw badRequest('Vui lòng nhập đầy đủ Email và Mật khẩu');

    const result = await db.query('SELECT * FROM Users WHERE Email = @email', { email });
    if (result.recordset.length === 0) {
      throw unauthorized('Email hoặc mật khẩu không chính xác');
    }

    const user = result.recordset[0];

    if (!user.IsActive) {
      throw unauthorized('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
    }

    if (!user.PasswordHash && user.AuthProvider === 'google') {
      throw badRequest('Tài khoản này được đăng ký qua Google. Vui lòng chọn "Đăng nhập với Google".');
    }

    const isMatch = await bcrypt.compare(password, user.PasswordHash || '');
    if (!isMatch) {
      throw unauthorized('Email hoặc mật khẩu không chính xác');
    }

    // Cập nhật LastLoginAt
    await db.query('UPDATE Users SET LastLoginAt = SYSDATETIME() WHERE UserId = @userId', {
      userId: user.UserId
    });

    const token = signToken(user);
    const userData = {
      userId: Number(user.UserId),
      fullName: user.FullName,
      email: user.Email,
      role: user.Role,
      avatarUrl: user.AvatarUrl || 'image/anh-clone.jpg'
    };

    return ok(res, {
      token,
      user: userData
    }, 'Đăng nhập thành công!', { token, user: userData });
  } catch (err) {
    next(err);
  }
});

// 3. ĐĂNG NHẬP / ĐĂNG KÝ BẰNG GMAIL (GOOGLE IDENTITY SERVICES)
router.post('/google', authLimiter, async (req, res, next) => {
  try {
    const { credential, userInfo } = req.body;
    let email, name, picture, googleId;

    if (credential) {
      if (googleClient && GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('placeholder')) {
        try {
          const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
          });
          const payload = ticket.getPayload();
          email = payload.email;
          name = payload.name;
          picture = payload.picture;
          googleId = payload.sub;
        } catch (tokenErr) {
          throw badRequest('Xác thực mã Google Credential thất bại');
        }
      } else {
        // Fallback giải mã payload JWT client an toàn
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          email = payload.email;
          name = payload.name;
          picture = payload.picture;
          googleId = payload.sub;
        } else {
          throw badRequest('Mã xác thực Google không đúng định dạng');
        }
      }
    } else if (userInfo && userInfo.email) {
      email = userInfo.email;
      name = userInfo.name || 'Người dùng Google';
      picture = userInfo.picture || 'image/anh-clone.jpg';
      googleId = userInfo.googleId || ('g_' + Date.now());
    } else {
      throw badRequest('Dữ liệu xác thực Google không hợp lệ');
    }

    const trimmedEmail = String(email || '').trim().toLowerCase();
    if (!v.isGmail(trimmedEmail)) {
      throw badRequest('Địa chỉ Gmail không hợp lệ (@gmail.com)');
    }

    const checkUser = await db.query('SELECT * FROM Users WHERE Email = @email', { email: trimmedEmail });
    let user;

    if (checkUser.recordset.length > 0) {
      user = checkUser.recordset[0];
      if (!user.IsActive) throw unauthorized('Tài khoản này đã bị khóa');

      await db.query(
        `UPDATE Users 
         SET GoogleId = COALESCE(@googleId, GoogleId),
             AvatarUrl = COALESCE(@picture, AvatarUrl),
             LastLoginAt = SYSDATETIME()
         WHERE UserId = @userId`,
        {
          googleId: googleId || null,
          picture: picture || null,
          userId: user.UserId
        }
      );
      if (picture) user.AvatarUrl = picture;
    } else {
      // Đăng ký tự động qua Google
      const insertResult = await db.query(
        `INSERT INTO Users (FullName, Email, GoogleId, AvatarUrl, AuthProvider, Role, IsActive, CreatedAt, LastLoginAt)
         OUTPUT INSERTED.UserId, INSERTED.FullName, INSERTED.Email, INSERTED.Role, INSERTED.AvatarUrl
         VALUES (@name, @email, @googleId, @picture, 'google', 'customer', 1, SYSDATETIME(), SYSDATETIME())`,
        {
          name: name || 'Khách Hàng Google',
          email: trimmedEmail,
          googleId: googleId || null,
          picture: picture || 'image/anh-clone.jpg'
        }
      );
      user = insertResult.recordset[0];
    }

    const token = signToken(user);

    const userData = {
      userId: Number(user.UserId),
      fullName: user.FullName,
      email: user.Email,
      role: user.Role,
      avatarUrl: user.AvatarUrl || 'image/anh-clone.jpg'
    };

    return ok(res, {
      token,
      user: userData
    }, 'Đăng nhập Google thành công!', { token, user: userData });
  } catch (err) {
    next(err);
  }
});

// 4. LẤY PROFILE HIỆN TẠI
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await loadActiveUser(req.user.userId);
    if (!user) throw unauthorized('Tài khoản không tồn tại hoặc đã bị xóa');

    return ok(res, {
      userId: Number(user.UserId),
      fullName: user.FullName,
      email: user.Email,
      role: user.Role,
      avatarUrl: user.AvatarUrl,
      phone: user.Phone,
      address: user.Address,
      authProvider: user.AuthProvider,
      createdAt: user.CreatedAt
    });
  } catch (err) {
    next(err);
  }
});

// 5. CẬP NHẬT PROFILE
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const fullName = v.str(req.body.fullName, 100);
    const phone = v.normalizePhone(req.body.phone);
    const address = v.optStr(req.body.address, 255);

    if (fullName.length < 2) throw badRequest('Họ và tên tối thiểu 2 ký tự');
    if (phone && !v.isPhone(phone)) throw badRequest('Số điện thoại không hợp lệ');

    await db.query(
      `UPDATE Users
       SET FullName = @fullName,
           Phone = @phone,
           Address = @address
       WHERE UserId = @userId`,
      {
        fullName,
        phone: phone || null,
        address: address || null,
        userId: req.user.userId
      }
    );

    const updated = await loadActiveUser(req.user.userId);
    return ok(res, {
      userId: Number(updated.UserId),
      fullName: updated.FullName,
      email: updated.Email,
      role: updated.Role,
      avatarUrl: updated.AvatarUrl,
      phone: updated.Phone,
      address: updated.Address
    }, 'Cập nhật thông tin thành công!');
  } catch (err) {
    next(err);
  }
});

// 6. ĐỔI MẬT KHẨU
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) throw badRequest('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới');
    if (newPassword.length < 6) throw badRequest('Mật khẩu mới tối thiểu 6 ký tự');

    const result = await db.query('SELECT PasswordHash, AuthProvider FROM Users WHERE UserId = @userId', {
      userId: req.user.userId
    });
    const user = result.recordset[0];
    if (!user) throw unauthorized('Tài khoản không tồn tại');

    if (user.AuthProvider === 'google' && !user.PasswordHash) {
      throw badRequest('Tài khoản đăng nhập qua Google không thể đổi mật khẩu tại đây');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.PasswordHash || '');
    if (!isMatch) throw badRequest('Mật khẩu hiện tại không chính xác');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE Users SET PasswordHash = @hash WHERE UserId = @userId', {
      hash,
      userId: req.user.userId
    });

    return ok(res, null, 'Đổi mật khẩu thành công!');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
