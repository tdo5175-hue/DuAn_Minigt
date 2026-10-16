/**
 * NEWSLETTER PUBLIC API ROUTE
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { badRequest, ok, created } = require('../utils/http');
const v = require('../utils/validators');

router.post('/', async (req, res, next) => {
  try {
    const email = v.str(req.body.email, 150).toLowerCase();
    if (!v.isEmail(email)) {
      throw badRequest('Vui lòng cung cấp địa chỉ email hợp lệ');
    }

    // Kiểm tra xem đã đăng ký chưa
    const check = await db.query('SELECT SubscriberId FROM Newsletter WHERE Email = @email', { email });
    if (check.recordset.length > 0) {
      return ok(res, { email }, 'Email của bạn đã nằm trong danh sách ưu tiên nhận thông báo!');
    }

    await db.query(
      'INSERT INTO Newsletter (Email, CreatedAt) VALUES (@email, SYSDATETIME())',
      { email }
    );

    return created(res, { email }, 'Đăng ký nhận lịch mở Pre-order thành công! Bạn sẽ nhận được thông báo sớm nhất.');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
