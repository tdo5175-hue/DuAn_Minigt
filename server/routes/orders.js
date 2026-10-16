/**
 * ORDERS CLIENT API ROUTES
 * Hỗ trợ: Tạo đơn, Tra cứu đa năng (Mã đơn / SĐT / Mã SPX / Email),
 * Đồng bộ đơn hàng theo cả Tài khoản & Thiết bị (Guest + Logged-in),
 * Kiểm tra trạng thái thời gian thực (Approval + SPX Tracking),
 * Khách tự hủy đơn, Cập nhật địa chỉ nhận, Xác nhận đã nhận hàng
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const orderService = require('../services/orderService');
const settingsService = require('../services/settingsService');
const { optionalAuth } = require('../middleware/auth');
const { ok, created, notFound, badRequest } = require('../utils/http');
const v = require('../utils/validators');

// 1. TẠO ĐƠN HÀNG MỚI (HỖ TRỢ COD / ĐẶT CỌC PRE-ORDER / CHUYỂN KHOẢN 100%)
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const order = await orderService.createOrder(req.body, userId);
    return created(res, order, 'Đặt đơn hàng thành công!', { order });
  } catch (error) {
    next(error);
  }
});

// 2. TẢI LÊN BIÊN LAI CHUYỂN KHOẢN / BÁO ĐÃ CHUYỂN KHOẢN (RECEIPT)
router.post('/upload-receipt', optionalAuth, async (req, res, next) => {
  try {
    const orderCode = v.str(req.body.orderCode, 30);
    const receiptImage = v.str(req.body.receiptImage || 'Khách báo đã chuyển khoản VietQR MB Bank', 500);

    if (!orderCode) {
      throw badRequest('Vui lòng cung cấp mã đơn hàng');
    }

    const orderCheck = await db.query('SELECT OrderId, Status FROM Orders WHERE OrderCode = @code', { code: orderCode });
    if (orderCheck.recordset.length === 0) {
      throw notFound('Không tìm thấy đơn hàng tương ứng');
    }
    const ord = orderCheck.recordset[0];

    await db.query(
      `UPDATE Orders 
       SET ReceiptImage = @receipt, UpdatedAt = SYSDATETIME() 
       WHERE OrderCode = @code`,
      {
        code: orderCode,
        receipt: receiptImage
      }
    );

    await db.query(
      `INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
       VALUES (@id, @st, @st, @note, @uid)`,
      {
        id: ord.OrderId,
        st: ord.Status,
        note: `Khách hàng xác nhận đã chuyển khoản / gửi biên lai: ${receiptImage}`,
        uid: req.user ? req.user.userId : null
      }
    );

    return ok(res, { orderCode, receiptImage }, 'Đã gửi thông báo & biên lai chuyển khoản thành công! Admin sẽ kiểm tra và duyệt đơn ngay.');
  } catch (error) {
    next(error);
  }
});

// 3. TRA CỨU ĐƠN HÀNG (THEO MÃ ĐƠN, SỐ ĐIỆN THOẠI, MÃ VẬN ĐƠN SPX HOẶC EMAIL)
router.get('/track/:query', async (req, res, next) => {
  try {
    const q = v.str(req.params.query, 80).replace(/^#/, '');
    if (!q) throw badRequest('Vui lòng nhập mã đơn hàng, số điện thoại hoặc mã vận đơn SPX');

    const cleanPhone = v.normalizePhone(q);

    const ordersRes = await db.query(
      `SELECT o.*, u.Email AS CustomerEmail 
       FROM Orders o
       LEFT JOIN Users u ON u.UserId = o.UserId
       WHERE o.OrderCode = @q 
          OR o.Phone = @q 
          OR o.Phone = @cleanPhone 
          OR o.TrackingCode = @q 
          OR o.Email = @q
       ORDER BY o.CreatedAt DESC`,
      { q, cleanPhone }
    );

    if (ordersRes.recordset.length === 0) {
      throw notFound('Không tìm thấy đơn hàng nào khớp với thông tin đã nhập');
    }

    const ids = ordersRes.recordset.map(o => Number(o.OrderId));
    const itemsMap = await orderService.getItems(ids);
    const settings = await settingsService.getAll();
    const mapped = [];

    for (const ord of ordersRes.recordset) {
      const id = Number(ord.OrderId);
      const items = itemsMap[id] || [];
      const history = await orderService.getHistory(id);
      const m = orderService.mapOrder(ord, { items, history });
      if (m.transferAmount > 0 && m.paymentStatus === 'UNPAID') {
        m.payment = settingsService.buildVietQr(settings, m.transferAmount, m.code);
      }
      mapped.push(m);
    }

    return ok(res, mapped, 'Tra cứu đơn hàng thành công', { count: mapped.length });
  } catch (error) {
    next(error);
  }
});

// 4. DANH SÁCH ĐƠN HÀNG CỦA KHÁCH HÀNG (ĐỒNG BỘ TÀI KHOẢN + MÃ ĐƠN TRÊN TRÌNH DUYỆT + SĐT/EMAIL)
router.get('/my-orders', optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user ? Number(req.user.userId) : null;
    const rawCodes = String(req.query.codes || '')
      .split(',')
      .map(s => v.str(s, 30).replace(/^#/, ''))
      .filter(Boolean)
      .slice(0, 40);
    const queryPhone = v.normalizePhone(req.query.phone || '');
    const queryEmail = v.str(req.query.email || '', 150).toLowerCase();

    let userEmail = queryEmail;
    let userPhone = queryPhone;
    let isAdminToken = false;

    if (userId) {
      const uRes = await db.query('SELECT Email, Phone, Role FROM Users WHERE UserId = @uid', { uid: userId });
      if (uRes.recordset.length > 0) {
        const uRow = uRes.recordset[0];
        isAdminToken = uRow.Role === 'admin';
        if (!userEmail && uRow.Email && !isAdminToken) userEmail = String(uRow.Email).toLowerCase();
        if (!userPhone && uRow.Phone && !isAdminToken) userPhone = v.normalizePhone(uRow.Phone);
      }
    }

    const conditions = [];
    const params = {};

    // Nếu token hiện tại là khách hàng (hoặc nếu không có mã đơn nào truyền lên thì mới lấy theo userId)
    if (userId && !isAdminToken) {
      conditions.push('o.UserId = @userId');
      params.userId = userId;
    }

    if (userEmail) {
      conditions.push('LOWER(o.Email) = @userEmail');
      params.userEmail = userEmail;
    }

    if (userPhone && userPhone.length >= 8) {
      conditions.push('o.Phone = @userPhone');
      params.userPhone = userPhone;
    }

    if (rawCodes.length > 0) {
      const codePlaceholders = rawCodes.map((c, idx) => {
        const key = `code_${idx}`;
        params[key] = c;
        return `@${key}`;
      });
      conditions.push(`o.OrderCode IN (${codePlaceholders.join(',')})`);
    }

    // Nếu không có điều kiện nào (khách chưa đặt đơn & chưa đăng nhập) -> trả về mảng rỗng
    if (conditions.length === 0) {
      return ok(res, [], 'Chưa có đơn hàng nào', { count: 0 });
    }

    const ordersRes = await db.query(
      `SELECT o.*, u.Email AS CustomerEmail
       FROM Orders o
       LEFT JOIN Users u ON u.UserId = o.UserId
       WHERE ${conditions.join(' OR ')}
       ORDER BY o.CreatedAt DESC`,
      params
    );

    const ids = ordersRes.recordset.map(o => Number(o.OrderId));
    const itemsMap = await orderService.getItems(ids);
    const settings = await settingsService.getAll();

    const mapped = [];
    for (const ord of ordersRes.recordset) {
      const id = Number(ord.OrderId);
      const items = itemsMap[id] || [];
      const history = await orderService.getHistory(id);
      const m = orderService.mapOrder(ord, { items, history });
      if (m.transferAmount > 0 && m.paymentStatus === 'UNPAID') {
        m.payment = settingsService.buildVietQr(settings, m.transferAmount, m.code);
      }
      mapped.push(m);
    }

    return ok(res, mapped, 'Lấy danh sách đơn hàng thành công', { count: mapped.length });
  } catch (error) {
    next(error);
  }
});

// 5. KIỂM TRA TRẠNG THÁI ĐƠN HÀNG THỜI GIAN THỰC (POLLING STEP 4 & BACKGROUND WATCHER)
router.get('/check-status/:orderCode', async (req, res, next) => {
  try {
    const code = v.str(req.params.orderCode, 30).replace(/^#/, '');
    const row = await orderService.loadOrderRow('o.OrderCode = @code', { code });

    if (!row) throw notFound('Không tìm thấy đơn hàng');

    const fullOrder = await orderService.getFullOrder(row);
    return ok(res, fullOrder, 'Trạng thái đơn hàng thời gian thực');
  } catch (err) {
    next(err);
  }
});

// 6. KHÁCH HÀNG TỰ HỦY ĐƠN (CHỈ ÁP DỤNG KHI ĐƠN ĐANG PENDING)
router.put('/:orderCode/cancel', optionalAuth, async (req, res, next) => {
  try {
    const code = v.str(req.params.orderCode, 30).replace(/^#/, '');
    const reason = v.str(req.body.reason, 255) || 'Khách hàng tự hủy đơn';
    const updated = await orderService.customerCancel(code, req.user ? req.user.userId : null, reason);
    return ok(res, updated, 'Đã hủy đơn hàng thành công');
  } catch (err) {
    next(err);
  }
});

// 7. KHÁCH HÀNG XÁC NHẬN ĐÃ NHẬN ĐƯỢC HÀNG TỪ SPX EXPRESS
router.put('/:orderCode/confirm-received', optionalAuth, async (req, res, next) => {
  try {
    const code = v.str(req.params.orderCode, 30).replace(/^#/, '');
    const updated = await orderService.customerConfirmReceived(code, req.user ? req.user.userId : null);
    return ok(res, updated, 'Cảm ơn bạn đã xác nhận nhận hàng thành công!');
  } catch (err) {
    next(err);
  }
});

// 8. KHÁCH HÀNG CẬP NHẬT ĐỊA CHỈ / SĐT NHẬN HÀNG KHI ĐƠN CHƯA GIAO SPX
router.put('/:orderCode/shipping-info', optionalAuth, async (req, res, next) => {
  try {
    const code = v.str(req.params.orderCode, 30).replace(/^#/, '');
    const updated = await orderService.customerUpdateShipping(code, req.body, req.user ? req.user.userId : null);
    return ok(res, updated, 'Đã cập nhật thông tin người nhận & địa chỉ giao hàng thành công!');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
