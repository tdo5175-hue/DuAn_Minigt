/**
 * ORDER ROUTES (/api/orders) — ĐỒNG BỘ 100% VỚI SQL SERVER
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { optionalAuth, authenticate } = require('../middleware/auth');
const orderService = require('../services/orderService');
const { ok, badRequest, notFound, forbidden } = require('../utils/http');
const v = require('../utils/validate');

// POST /api/orders — Tạo đơn hàng / đơn cọc (khách vãng lai hoặc đã đăng nhập)
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: `Tạo đơn hàng ${order.orderCode} thành công`,
      order,
      data: order
    });
  } catch (err) { next(err); }
});

// GET /api/orders — Tra cứu theo phone / code / userId
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { code, phone, page, pageSize } = req.query;
    if (code) {
      const o = await orderService.getOrderByCodeOrId(String(code).trim().toUpperCase());
      return ok(res, o ? [o] : []);
    }
    if (phone) {
      if (!v.isVNPhone(phone)) throw badRequest('Số điện thoại tra cứu không hợp lệ');
      const r = await orderService.listOrders({ phone, page, pageSize });
      return ok(res, r.items, { meta: { total: r.total, page: r.page, pageSize: r.pageSize, totalPages: r.totalPages } });
    }
    if (req.user) {
      if (req.user.role === 'admin') {
        const r = await orderService.listOrders({ page, pageSize: pageSize || 20 });
        return ok(res, r.items, { meta: { total: r.total, page: r.page, pageSize: r.pageSize, totalPages: r.totalPages } });
      }
      const r = await orderService.listOrders({ userId: req.user.userId, page, pageSize });
      return ok(res, r.items, { meta: { total: r.total, page: r.page, pageSize: r.pageSize, totalPages: r.totalPages } });
    }
    // Bảo mật: Ngăn chặn rò rỉ dữ liệu khách hàng — chỉ cho phép tra cứu theo mã đơn hoặc SĐT cụ thể
    return ok(res, [], { meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 } });
  } catch (err) { next(err); }
});

// GET /api/orders/my-orders — Trung tâm đơn hàng của khách
router.get('/my-orders', optionalAuth, async (req, res, next) => {
  try {
    const { phone, codes } = req.query;
    if (req.user && req.user.userId) {
      const r = await orderService.listOrders({ userId: req.user.userId, pageSize: 50 });
      if (r.items.length > 0) return ok(res, r.items);
    }
    if (phone && v.isVNPhone(phone)) {
      const r = await orderService.listOrders({ phone, pageSize: 50 });
      if (r.items.length > 0) return ok(res, r.items);
    }
    if (codes) {
      const codeList = String(codes).split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
      const results = [];
      for (const c of codeList.slice(0, 20)) {
        const o = await orderService.getOrderByCodeOrId(c);
        if (o) results.push(o);
      }
      if (results.length > 0) return ok(res, results);
    }
    const allRecent = await orderService.listOrders({ pageSize: 30 });
    return ok(res, allRecent.items);
  } catch (err) { next(err); }
});

// GET /api/orders/my — Đơn hàng của user đang đăng nhập
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const r = await orderService.listOrders({
      userId: req.user.userId,
      status: req.query.status,
      page: req.query.page,
      pageSize: req.query.pageSize
    });
    return ok(res, r.items, { meta: { total: r.total, page: r.page, pageSize: r.pageSize, totalPages: r.totalPages } });
  } catch (err) { next(err); }
});

// GET /api/orders/check-status/:code — Polling kiểm tra trạng thái đơn real-time
router.get('/check-status/:code', async (req, res, next) => {
  try {
    const q = decodeURIComponent(req.params.code).trim().toUpperCase();
    const o = await orderService.getOrderByCodeOrId(q);
    if (!o) throw notFound('Không tìm thấy đơn hàng');
    return ok(res, o);
  } catch (err) { next(err); }
});

// POST /api/orders/notify-transfer — Khách hàng xác nhận đã chuyển khoản MB Bank
router.post('/notify-transfer', async (req, res, next) => {
  try {
    const { orderCode } = req.body;
    if (!orderCode) throw badRequest('Thiếu mã đơn hàng');
    const q = String(orderCode).trim().toUpperCase();
    const order = await orderService.getOrderByCodeOrId(q);
    if (!order) throw notFound('Không tìm thấy đơn hàng');

    await db.query(`
      INSERT INTO dbo.OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
      VALUES (@oid, @st, @st, N'Khách hàng báo đã chuyển khoản thành công qua MB Bank. Chờ Admin check tài khoản.', NULL)
    `, { oid: order.id, st: order.status });

    return ok(res, { orderCode: q, reported: true }, 'Đã gửi thông báo chuyển khoản thành công tới Admin!');
  } catch (err) { next(err); }
});

// GET /api/orders/track/:query — Tra cứu theo Mã đơn / SĐT / Mã vận đơn SPX
router.get('/track/:query', async (req, res, next) => {
  try {
    const q = decodeURIComponent(req.params.query).trim();
    if (!q) throw badRequest('Vui lòng nhập thông tin tra cứu');
    const byCode = await orderService.getOrderByCodeOrId(q.toUpperCase());
    if (byCode) return ok(res, [byCode]);
    const list = await orderService.listOrders({ q, pageSize: 20 });
    return ok(res, list.items);
  } catch (err) { next(err); }
});

// GET /api/orders/:code — Chi tiết đơn hàng theo mã
router.get('/:code', optionalAuth, async (req, res, next) => {
  try {
    const o = await orderService.getOrderByCodeOrId(String(req.params.code).trim().toUpperCase());
    if (!o) throw notFound('Không tìm thấy đơn hàng với mã này');
    return ok(res, o);
  } catch (err) { next(err); }
});

// PUT /api/orders/:code/cancel — Khách hủy đơn
router.put('/:code/cancel', optionalAuth, async (req, res, next) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const o = await orderService.getOrderByCodeOrId(code);
    if (!o) throw notFound('Không tìm thấy đơn hàng');

    const reason = v.cleanStr(req.body.cancelReason || req.body.reason || 'Khách yêu cầu hủy đơn', 255);
    const updated = await orderService.transitionOrderStatus(o.orderId, 'CANCELLED', {
      cancelReason: reason,
      actorId: req.user ? req.user.userId : null,
      isAdmin: false
    });
    return ok(res, updated, { message: 'Đã hủy đơn hàng và hoàn tồn kho' });
  } catch (err) { next(err); }
});

// PUT /api/orders/:code/confirm-received — Khách xác nhận đã nhận được hàng
router.put('/:code/confirm-received', optionalAuth, async (req, res, next) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const o = await orderService.getOrderByCodeOrId(code);
    if (!o) throw notFound('Không tìm thấy đơn hàng');

    await db.query(`
      UPDATE dbo.Orders
      SET Status = 'DELIVERED', PaymentStatus = 'PAID', UpdatedAt = SYSDATETIME()
      WHERE OrderId = @oid
    `, { oid: o.orderId });

    await db.query(`
      INSERT INTO dbo.OrderStatusHistory (OrderId, FromStatus, ToStatus, Note)
      VALUES (@oid, @from, 'DELIVERED', N'Khách hàng xác nhận đã nhận kiện hàng nguyên seal')
    `, { oid: o.orderId, from: o.status });

    const updated = await orderService.getOrderByCodeOrId(o.orderId);
    return ok(res, updated, { message: 'Cảm ơn bạn đã xác nhận nhận hàng thành công!' });
  } catch (err) { next(err); }
});

// PUT /api/orders/:code/shipping-info — Khách cập nhật địa chỉ nhận hàng khi chưa giao SPX
router.put('/:code/shipping-info', optionalAuth, async (req, res, next) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const o = await orderService.getOrderByCodeOrId(code);
    if (!o) throw notFound('Không tìm thấy đơn hàng');

    if (['SHIPPING', 'DELIVERED', 'CANCELLED'].includes(String(o.status).toUpperCase())) {
      throw badRequest('Đơn hàng đã bàn giao vận chuyển hoặc đã đóng, không thể thay đổi địa chỉ');
    }

    const fullName = v.cleanStr(req.body.fullName, 100) || o.fullName;
    const phone = v.cleanStr(req.body.phone, 20) || o.phone;
    const address = v.cleanStr(req.body.address, 255) || o.address;
    const note = req.body.note !== undefined ? v.cleanStr(req.body.note, 500) : o.note;

    await db.query(`
      UPDATE dbo.Orders
      SET FullName = @fullName, Phone = @phone, Address = @address, Note = @note, UpdatedAt = SYSDATETIME()
      WHERE OrderId = @oid
    `, { oid: o.orderId, fullName, phone, address, note });

    const updated = await orderService.getOrderByCodeOrId(o.orderId);
    return ok(res, updated, { message: 'Đã cập nhật thông tin nhận hàng thành công!' });
  } catch (err) { next(err); }
});

// POST /api/orders/:code/receipt — Khách gửi biên lai chuyển khoản
router.post('/:code/receipt', optionalAuth, async (req, res, next) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const receiptImage = v.cleanStr(req.body.receiptImage, 500);
    if (!receiptImage) throw badRequest('Thiếu đường dẫn ảnh biên lai');

    const o = await orderService.getOrderByCodeOrId(code);
    if (!o) throw notFound('Không tìm thấy đơn hàng');

    await db.query(
      'UPDATE dbo.Orders SET ReceiptImage = @img, UpdatedAt = SYSDATETIME() WHERE OrderId = @id',
      { img: receiptImage, id: o.orderId }
    );
    const updated = await orderService.getOrderByCodeOrId(o.orderId);
    return ok(res, updated, { message: 'Đã gửi biên lai chuyển khoản, cửa hàng sẽ xác nhận sớm' });
  } catch (err) { next(err); }
});

module.exports = router;
