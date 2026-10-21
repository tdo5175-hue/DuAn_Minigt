/**
 * ROUTE QUẢN LÝ MÃ GIẢM GIÁ & VOUCHER (ADMIN & CHECKOUT)
 */
const express = require('express');
const router = express.Router();
const couponService = require('../services/couponService');

// GET /api/coupons — Danh sách mã công khai & ưu đãi VIP
router.get('/', async (req, res, next) => {
  try {
    const list = await couponService.listAdminCoupons();
    const active = list.filter(c => c.isActive);
    return res.status(200).json({
      success: true,
      data: active,
      vipCoupons: couponService.VIP_TIER_COUPONS
    });
  } catch (err) { next(err); }
});

// POST /api/coupons/validate — Kiểm tra & áp dụng mã giảm giá khi thanh toán
router.post('/validate', async (req, res, next) => {
  try {
    const { code, subtotal, user, phone, email } = req.body;
    const result = await couponService.validateAndApplyCoupon(
      code,
      Number(subtotal || 0),
      user || req.user || null,
      { phone, email }
    );
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    return res.status(200).json({
      success: true,
      message: `Áp dụng mã ${result.code} thành công!`,
      data: result
    });
  } catch (err) { next(err); }
});

// GET /api/admin/coupons — Danh sách mã đầy đủ cho Admin Dashboard
router.get('/admin', async (req, res, next) => {
  try {
    const list = await couponService.listAdminCoupons();
    return res.status(200).json({
      success: true,
      data: list,
      vipTiers: couponService.VIP_TIER_COUPONS
    });
  } catch (err) { next(err); }
});

// POST /api/admin/coupons — Admin tạo mã giảm giá mới
router.post('/admin', async (req, res, next) => {
  try {
    const coupon = await couponService.createCoupon(req.body);
    return res.status(201).json({
      success: true,
      message: `Tạo mã giảm giá "${coupon.code}" thành công!`,
      data: coupon
    });
  } catch (err) { next(err); }
});

// PUT /api/admin/coupons/:id — Admin chỉnh sửa mã giảm giá
router.put('/admin/:id', async (req, res, next) => {
  try {
    const coupon = await couponService.updateCoupon(req.params.id, req.body);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá để cập nhật' });
    }
    return res.status(200).json({
      success: true,
      message: `Cập nhật mã giảm giá "${coupon.code}" thành công!`,
      data: coupon
    });
  } catch (err) { next(err); }
});

// DELETE /api/admin/coupons/:id — Admin xóa mã giảm giá
router.delete('/admin/:id', async (req, res, next) => {
  try {
    await couponService.deleteCoupon(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Đã xóa mã giảm giá thành công!'
    });
  } catch (err) { next(err); }
});

module.exports = router;
