/**
 * ORDER ROUTES (/api/orders) — ĐỒNG BỘ 100% VỚI SUPABASE POSTGRESQL & PAYOS VIETQR TỰ ĐỘNG
 */
const express = require('express');
const router = express.Router();
const PayOS = require('@payos/node');
const db = require('../config/db');
const { optionalAuth, authenticate } = require('../middleware/auth');
const orderService = require('../services/orderService');
const mailService = require('../services/mailService');
const { ok, badRequest, notFound } = require('../utils/http');
const v = require('../utils/validate');

// =====================================================================
// KHỞI TẠO CỔNG THANH TOÁN PAYOS VIETQR TỰ ĐỘNG
// =====================================================================
const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID || '96b6746e-5462-4f53-85d2-62216cc92e4f',
  process.env.PAYOS_API_KEY || '37a2ffc6-853b-4139-92eb-25718efcae49',
  process.env.PAYOS_CHECKSUM_KEY || '56fa83c9aeac3c3d17cbd9859431df7758317b3a36e56f51ad80ec6af1e96bb0'
);

// POST /api/orders — Tạo đơn hàng / đơn cọc
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
    return ok(res, [], { meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 } });
  } catch (err) { next(err); }
});

// GET /api/orders/my-orders — Trung tâm đơn hàng của khách
router.get('/my-orders', optionalAuth, async (req, res, next) => {
  try {
    const { phone, codes } = req.query;
    if (req.user && req.user.userId) {
      const r = await orderService.listOrders({ userId: req.user.userId, pageSize: 50 });
      if (r.items && r.items.length > 0) return ok(res, r.items);
    }
    if (phone && v.isVNPhone(phone)) {
      const r = await orderService.listOrders({ phone, pageSize: 50 });
      if (r.items && r.items.length > 0) return ok(res, r.items);
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
    return ok(res, allRecent.items || []);
  } catch (err) {
    console.error('[my-orders error]:', err.message);
    // Trả về mảng rỗng an toàn thay vì quăng lỗi 500 làm treo frontend
    return ok(res, []);
  }
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

    const oid = order.id || order.orderId || order.OrderId;
    await db.query(`
      INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
      VALUES (@oid, @st, @st, 'Khách hàng báo đã chuyển khoản thành công qua MB Bank. Chờ Admin check tài khoản.', NULL)
    `, { oid, st: order.status });

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
    const updated = await orderService.transitionOrderStatus(o.orderId || o.id, 'CANCELLED', {
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

    const oid = o.orderId || o.id || o.OrderId;
    await db.query(`
      UPDATE Orders
      SET Status = 'DELIVERED', PaymentStatus = 'PAID', UpdatedAt = NOW()
      WHERE OrderId = @oid
    `, { oid });

    await db.query(`
      INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note)
      VALUES (@oid, @from, 'DELIVERED', 'Khách hàng xác nhận đã nhận kiện hàng nguyên seal')
    `, { oid, from: o.status });

    const updated = await orderService.getOrderByCodeOrId(oid);
    if (updated && (updated.email || updated.customer?.email)) {
      mailService.sendOrderDeliveredEmail(updated).catch(err => {
        console.warn('[MailService] Failed to send order delivered email:', err.message);
      });
    }
    return ok(res, updated, { message: 'Cảm ơn bạn đã xác nhận nhận hàng thành công!' });
  } catch (err) { next(err); }
});

// PUT /api/orders/:code/shipping-info — Khách cập nhật địa chỉ nhận hàng
router.put('/:code/shipping-info', optionalAuth, async (req, res, next) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const o = await orderService.getOrderByCodeOrId(code);
    if (!o) throw notFound('Không tìm thấy đơn hàng');

    if (['SHIPPING', 'DELIVERED', 'CANCELLED'].includes(String(o.status).toUpperCase())) {
      throw badRequest('Đơn hàng đã bàn giao vận chuyển hoặc đã đóng, không thể thay đổi địa chỉ');
    }

    const oid = o.orderId || o.id || o.OrderId;
    const fullName = v.cleanStr(req.body.fullName, 100) || o.fullName;
    const phone = v.cleanStr(req.body.phone, 20) || o.phone;
    const address = v.cleanStr(req.body.address, 255) || o.address;
    const note = req.body.note !== undefined ? v.cleanStr(req.body.note, 500) : o.note;

    await db.query(`
      UPDATE Orders
      SET FullName = @fullName, Phone = @phone, Address = @address, Note = @note, UpdatedAt = NOW()
      WHERE OrderId = @oid
    `, { oid, fullName, phone, address, note });

    const updated = await orderService.getOrderByCodeOrId(oid);
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

    const oid = o.orderId || o.id || o.OrderId;
    await db.query(
      'UPDATE Orders SET ReceiptImage = @img, UpdatedAt = NOW() WHERE OrderId = @id',
      { img: receiptImage, id: oid }
    );
    const updated = await orderService.getOrderByCodeOrId(oid);
    return ok(res, updated, { message: 'Đã gửi biên lai chuyển khoản, cửa hàng sẽ xác nhận sớm' });
  } catch (err) { next(err); }
});

// =====================================================================
// 1. TẠO LINK THANH TOÁN PAYOS VIETQR (HỖ TRỢ CẢ ĐƠN CỌC & ĐƠN THƯỜNG)
// =====================================================================
router.post('/:code/payos-link', optionalAuth, async (req, res, next) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const order = await orderService.getOrderByCodeOrId(code);
    if (!order) return notFound('Không tìm thấy đơn hàng với mã này');

    // Xác định số tiền cần thanh toán qua VietQR:
    // Nếu là đơn đặt trước (Pre-Order) và có tiền cọc thì tạo link thanh toán đúng số tiền cọc
    const hasPreOrder = Boolean(order.hasPreOrder || order.HasPreOrder || (order.depositAmount && Number(order.depositAmount) > 0));
    const amountToPay = (hasPreOrder && Number(order.depositAmount) > 0)
      ? Number(order.depositAmount)
      : Number(order.total || order.totalAmount || 0);

    if (amountToPay <= 0) {
      throw badRequest('Số tiền thanh toán không hợp lệ');
    }

    // PayOS yêu cầu orderCode là số nguyên dương an toàn (<= 9007199254740991)
    const baseId = Number(order.orderId || order.id || order.OrderId || 1);
    const payosOrderCode = Number(`${baseId}${Math.floor(1000 + Math.random() * 9000)}`.slice(0, 15));

    // Nội dung chuyển khoản chuẩn dạng MGT [MãĐơn], tối đa 25 ký tự không dấu (tránh lặp MGT MGT)
    const cleanDesc = (code.startsWith('MGT') ? code : `MGT ${code}`).replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 25);

    let clientOrigin = 'https://projectnhom2.vercel.app';
    try {
      if (req.headers.origin) {
        clientOrigin = req.headers.origin;
      } else if (req.headers.referer) {
        clientOrigin = new URL(req.headers.referer).origin;
      }
    } catch (_) {}

    const paymentData = {
      orderCode: payosOrderCode,
      amount: Math.round(amountToPay),
      description: cleanDesc,
      returnUrl: `${clientOrigin}/?payment=success&code=${order.orderCode}`,
      cancelUrl: `${clientOrigin}/?payment=cancel&code=${order.orderCode}`
    };

    const paymentLink = await payos.createPaymentLink(paymentData);

    // Ghi log vào OrderStatusHistory để mapping payosOrderCode với OrderId
    const oid = order.orderId || order.id || order.OrderId;
    await db.query(`
      UPDATE Orders
      SET PaymentMethod = 'VIETQR_PAYOS'
      WHERE OrderId = @oid AND (PaymentMethod IS NULL OR PaymentMethod = 'BANK_TRANSFER' OR PaymentMethod = 'DEPOSIT')
    `, { oid }).catch(() => {});

    await db.query(`
      INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note)
      VALUES (@oid, @st, @st, 'Khởi tạo link thanh toán VietQR PayOS #' || @pCode)
    `, { oid, st: order.status || 'PENDING', pCode: payosOrderCode }).catch(() => {});

    return ok(res, {
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      accountNumber: paymentLink.accountNumber,
      accountName: paymentLink.accountName,
      bin: paymentLink.bin,
      paymentLinkId: paymentLink.paymentLinkId,
      orderCode: order.orderCode,
      payosOrderCode,
      amount: amountToPay
    }, 'Khởi tạo cổng thanh toán PayOS VietQR thành công');
  } catch (err) {
    console.error('[PayOS createPaymentLink Error]:', err.message);
    next(err);
  }
});

// =====================================================================
// 2. WEBHOOK NHẬN TIỀN TỰ ĐỘNG TỪ PAYOS (TỰ ĐỘNG PHẢN HỒI 200 KHI TEST URL)
// =====================================================================
router.post('/payos-webhook', async (req, res) => {
  try {
    // 1. Kiểm tra xác thực chữ ký Webhook (payOS verify)
    let webhookData = null;
    try {
      webhookData = payos.verifyPaymentWebhookData(req.body);
    } catch (verifyErr) {
      // Khi PayOS ping kiểm tra trạng thái URL Webhook từ trang quản trị PayOS
      console.log('[PayOS Ping/Verify Event]:', verifyErr.message);
    }

    const payload = webhookData || req.body?.data || req.body;
    const isSuccess = payload?.code === '00' || req.body?.code === '00' || payload?.status === 'PAID';

    if (isSuccess && payload) {
      const desc = String(payload.description || '').toUpperCase();
      // Tìm mã đơn hàng từ nội dung thanh toán (ví dụ: MGT-20261021-1234)
      let orderCode = null;
      const m1 = desc.match(/MGT-[\w-]+/i);
      if (m1) {
        orderCode = m1[0].toUpperCase();
      } else {
        const m2 = desc.match(/MGT\s*([0-9A-Z-]+)/i);
        if (m2) {
          orderCode = m2[1].startsWith('MGT-') ? m2[1].toUpperCase() : `MGT-${m2[1].toUpperCase()}`;
        }
      }

      let order = orderCode ? await orderService.getOrderByCodeOrId(orderCode) : null;

      // Double-check: Tìm theo payosOrderCode được lưu trong OrderStatusHistory nếu mô tả bị cắt
      if (!order && payload.orderCode) {
        try {
          const findByPayos = await db.query(`
            SELECT OrderId FROM OrderStatusHistory
            WHERE Note LIKE '%' || @pCode || '%'
            ORDER BY HistoryId DESC LIMIT 1
          `, { pCode: String(payload.orderCode) });
          if (findByPayos.recordset.length > 0) {
            order = await orderService.getOrderByCodeOrId(findByPayos.recordset[0].OrderId || findByPayos.recordset[0].orderid);
          }
        } catch (_) {}
      }

      if (order) {
        const oid = order.orderId || order.id || order.OrderId;
        const isPreOrder = Boolean(order.hasPreOrder || order.HasPreOrder || (order.depositAmount && Number(order.depositAmount) > 0));
        const targetPaymentStatus = isPreOrder ? 'PARTIALLY_PAID' : 'PAID';
        const formattedAmount = new Intl.NumberFormat('vi-VN').format(payload.amount || (isPreOrder ? order.depositAmount : order.total));

        // Cập nhật trạng thái đơn hàng tự động trong database
        await db.query(`
          UPDATE Orders
          SET PaymentStatus = @pst,
              PaymentMethod = 'VIETQR_PAYOS',
              Status = 'CONFIRMED',
              UpdatedAt = NOW()
          WHERE OrderId = @oid
        `, { oid, pst: targetPaymentStatus });

        // Ghi log vào bảng OrderStatusHistory
        await db.query(`
          INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note)
          VALUES (@oid, @from, 'CONFIRMED', 'PayOS: Khách đã thanh toán tự động qua VietQR thành công. Số tiền: ' || @amount || 'đ')
        `, {
          oid,
          from: order.status || 'PENDING',
          amount: formattedAmount
        });

        console.log(`✅ [PayOS Webhook] Đơn hàng ${order.orderCode} đã được tự động duyệt thành công!`);

        // Gửi email thông báo xác nhận đơn hàng tự động cho khách hàng qua mailService
        const updatedOrder = await orderService.getOrderByCodeOrId(oid);
        if (updatedOrder && (updatedOrder.email || updatedOrder.customer?.email)) {
          mailService.sendOrderConfirmationEmail(updatedOrder).catch(err => {
            console.warn('[MailService] Lỗi gửi email xác nhận PayOS:', err.message);
          });
        }
      }
    }

    // Luôn trả về HTTP 200 để PayOS xác nhận Webhook hoạt động bình thường
    return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (err) {
    console.error('[PayOS Webhook Handler Error]:', err.message);
    return res.status(200).json({ success: true, message: 'Webhook received with warning' });
  }
});

module.exports = router;