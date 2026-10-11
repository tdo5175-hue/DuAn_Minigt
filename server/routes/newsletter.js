/**
 * NEWSLETTER API ROUTE
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email hợp lệ' });
    }

    const trimmed = email.trim().toLowerCase();

    // Kiểm tra xem đã đăng ký chưa
    const check = await db.query('SELECT * FROM Newsletter WHERE Email = @email', { email: trimmed });
    if (check.recordset.length > 0) {
      return res.json({ success: true, message: 'Email của bạn đã nằm trong danh sách ưu tiên nhận thông báo!' });
    }

    await db.query(
      'INSERT INTO Newsletter (Email, CreatedAt) VALUES (@email, SYSDATETIME())',
      { email: trimmed }
    );

    return res.status(201).json({
      success: true,
      message: 'Đăng ký nhận lịch mở Pre-order thành công! Bạn sẽ nhận được thông báo sớm nhất.'
    });
  } catch (error) {
    console.error('[NEWSLETTER ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

