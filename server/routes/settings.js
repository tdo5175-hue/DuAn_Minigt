/**
 * PUBLIC SETTINGS API ROUTE
 * Trả về thông tin công khai của cửa hàng (Hotline, VietQR, Phí ship, Thông báo...)
 */
const express = require('express');
const router = express.Router();
const settingsService = require('../services/settingsService');
const { ok } = require('../utils/http');

router.get('/', async (req, res, next) => {
  try {
    const settings = await settingsService.getPublic();
    return ok(res, settings, 'Lấy cấu hình cửa hàng thành công');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
