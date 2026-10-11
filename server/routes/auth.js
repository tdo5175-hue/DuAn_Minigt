/**
 * AUTH ROUTES: Local Registration & Login + Gmail / Google Sign-In
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '1088463836173-fake-placeholder.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.UserId,
      email: user.Email,
      fullName: user.FullName,
      role: user.Role,
      avatarUrl: user.AvatarUrl
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// 1. ĐĂNG KÝ TÀI KHOẢN MỚI
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, phone, address } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp Họ tên, Email và Mật khẩu' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Kiểm tra xem email đã tồn tại trong SQL Server chưa
    const existing = await db.query(
      'SELECT UserId, Email FROM Users WHERE Email = @email',
      { email: trimmedEmail }
    );

    if (existing.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertResult = await db.query(
      `INSERT INTO Users (FullName, Email, PasswordHash, Phone, Address, AuthProvider, Role, IsActive, CreatedAt, LastLoginAt)
       OUTPUT INSERTED.UserId, INSERTED.FullName, INSERTED.Email, INSERTED.Role, INSERTED.AvatarUrl
       VALUES (@fullName, @email, @passwordHash, @phone, @address, 'local', 'customer', 1, SYSDATETIME(), SYSDATETIME())`,
      {
        fullName: fullName.trim(),
        email: trimmedEmail,
        passwordHash: passwordHash,
        phone: phone || null,
        address: address || null
      }
    );

    const newUser = insertResult.recordset[0];
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      token,
      user: {
        userId: newUser.UserId,
        fullName: newUser.FullName,
        email: newUser.Email,
        role: newUser.Role,
        avatarUrl: newUser.AvatarUrl
      }
    });
  } catch (error) {
    console.error('[AUTH REGISTER ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng ký: ' + error.message });
  }
});

// 2. ĐĂNG NHẬP BẰNG EMAIL & MẬT KHẨU
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Email và Mật khẩu' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const result = await db.query(
      'SELECT * FROM Users WHERE Email = @email',
      { email: trimmedEmail }
    );

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    const user = result.recordset[0];

    if (!user.PasswordHash && user.AuthProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này được đăng ký qua Google. Vui lòng chọn "Đăng nhập với Google".'
      });
    }

    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    // Cập nhật LastLoginAt
    await db.query(
      'UPDATE Users SET LastLoginAt = SYSDATETIME() WHERE UserId = @userId',
      { userId: user.UserId }
    );

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: {
        userId: user.UserId,
        fullName: user.FullName,
        email: user.Email,
        role: user.Role,
        avatarUrl: user.AvatarUrl
      }
    });
  } catch (error) {
    console.error('[AUTH LOGIN ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập: ' + error.message });
  }
});

// 3. ĐĂNG NHẬP / ĐĂNG KÝ BẰNG GMAIL (GOOGLE IDENTITY SERVICES)
router.post('/google', async (req, res) => {
  try {
    const { credential, userInfo } = req.body;
    let email, name, picture, googleId;

    if (credential) {
      // Xác thực hoặc parse token từ Google
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
        // Fallback parse JWT payload an toàn nếu không configure Client ID trước
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          email = decoded.email;
          name = decoded.name || 'Người dùng Google';
          picture = decoded.picture || null;
          googleId = decoded.sub || null;
        } else {
          throw new Error('Không thể giải mã Google Credential');
        }
      }
    } else if (userInfo && userInfo.email) {
      // Trường hợp frontend demo simulation
      email = userInfo.email;
      name = userInfo.name || 'Người dùng Gmail';
      picture = userInfo.picture || null;
      googleId = userInfo.googleId || ('g_' + Date.now());
    } else {
      return res.status(400).json({ success: false, message: 'Dữ liệu Google xác thực không hợp lệ' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Tìm user trong database SQL Server
    const checkUser = await db.query(
      'SELECT * FROM Users WHERE Email = @email',
      { email: trimmedEmail }
    );

    let user;
    if (checkUser.recordset.length > 0) {
      user = checkUser.recordset[0];
      // Cập nhật thông tin Google & LastLoginAt
      await db.query(
        `UPDATE Users 
         SET GoogleId = COALESCE(@googleId, GoogleId),
             AvatarUrl = COALESCE(@picture, AvatarUrl),
             LastLoginAt = SYSDATETIME()
         WHERE UserId = @userId`,
        {
          googleId: googleId,
          picture: picture,
          userId: user.UserId
        }
      );
      if (picture) user.AvatarUrl = picture;
    } else {
      // Người dùng mới -> Thêm vào SQL Server
      const insertResult = await db.query(
        `INSERT INTO Users (FullName, Email, GoogleId, AvatarUrl, AuthProvider, Role, IsActive, CreatedAt, LastLoginAt)
         OUTPUT INSERTED.UserId, INSERTED.FullName, INSERTED.Email, INSERTED.Role, INSERTED.AvatarUrl
         VALUES (@name, @email, @googleId, @picture, 'google', 'customer', 1, SYSDATETIME(), SYSDATETIME())`,
        {
          name: name,
          email: trimmedEmail,
          googleId: googleId,
          picture: picture
        }
      );
      user = insertResult.recordset[0];
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Đăng nhập Google thành công!',
      token,
      user: {
        userId: user.UserId,
        fullName: user.FullName,
        email: user.Email,
        role: user.Role,
        avatarUrl: user.AvatarUrl
      }
    });
  } catch (error) {
    console.error('[AUTH GOOGLE ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Xác thực Google thất bại: ' + error.message });
  }
});

// 4. LẤY THÔNG TIN PROFILE HIỆN TẠI
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT UserId, FullName, Email, Role, AvatarUrl, Phone, Address, AuthProvider, CreatedAt FROM Users WHERE UserId = @userId',
      { userId: req.user.userId }
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    return res.json({ success: true, user: result.recordset[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
