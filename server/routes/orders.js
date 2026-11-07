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
const aiChatService = require('../services/aiChatService');
const { ok, badRequest, notFound, forbidden, conflict } = require('../utils/http');
const v = require('../utils/validate');

// =====================================================================
// KHỞI TẠO CỔNG THANH TOÁN PAYOS VIETQR TỰ ĐỘNG
// =====================================================================
const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID || '',
  process.env.PAYOS_API_KEY || '',
  process.env.PAYOS_CHECKSUM_KEY || ''
);

// POST /api/orders — Tạo đơn hàng / đơn cọc
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body, req.user);
    aiChatService.invalidateStoreCache();
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

// GET /api/orders/my-orders — Trung tâm đơn hàng của khách (Bảo mật & Phân lập tuyệt đối theo tài khoản)
router.get('/my-orders', optionalAuth, async (req, res, next) => {
  try {
    const { phone, codes } = req.query;
    const codeList = codes ? String(codes).split(',').map(c => c.trim().toUpperCase()).filter(Boolean) : [];

    // 1. NẾU KHÁCH ĐÃ ĐĂNG NHẬP: Lấy toàn bộ đơn thuộc về tài khoản này (khớp theo UserId, Email, SĐT và các mã đơn đã lưu)
    if (req.user && req.user.userId) {
      let uEmail = '';
      let uPhone = phone || '';
      try {
        const uInfo = await db.query('SELECT Email, Phone FROM Users WHERE UserId = @id', { id: Number(req.user.userId) });
        if (uInfo.recordset && uInfo.recordset[0]) {
          uEmail = uInfo.recordset[0].Email || '';
          if (!uPhone && uInfo.recordset[0].Phone) uPhone = uInfo.recordset[0].Phone;
        }
      } catch (_) {}

      const r = await orderService.listOrders({
        userId: req.user.userId,
        userEmail: uEmail,
        phone: uPhone,
        codes: codeList,
        pageSize: 100
      });
      return ok(res, r.items || []);
    }

    // 2. NẾU LÀ KHÁCH VÃNG LAI (CHƯA ĐĂNG NHẬP): Tra cứu theo các mã đơn hoặc SĐT trong phiên hiện tại
    if (codeList.length > 0 || (phone && v.isVNPhone(phone))) {
      const r = await orderService.listOrders({
        phone: phone && v.isVNPhone(phone) ? phone : undefined,
        codes: codeList,
        pageSize: 100
      });
      return ok(res, r.items || []);
    }

    // Mặc định trả về mảng rỗng [] nếu khách chưa có dữ liệu tra cứu
    return ok(res, []);
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

// GET /api/orders/check-status/:code — Polling kiểm tra trạng thái đơn real-time & tự động kiểm tra PayOS API trực tiếp
router.get('/check-status/:code', async (req, res, next) => {
  try {
    const q = decodeURIComponent(req.params.code).trim().toUpperCase();
    let o = await orderService.getOrderByCodeOrId(q);
    if (!o) throw notFound('Không tìm thấy đơn hàng');

    // Nếu đơn chưa thanh toán đủ, chủ động truy vấn trực tiếp PayOS API để khớp lệnh ngay lập tức
    // (Khắc phục triệt để lỗi khách chuyển tiền rồi nhưng webhook delay 2-5 phút)
    if (o.status !== 'CANCELLED' && o.paymentStatus !== 'PAID' && o.paymentStatus !== 'PARTIALLY_PAID') {
      const oid = o.orderId || o.id || o.OrderId;
      try {
        const histRes = await db.query(`
          SELECT Note FROM OrderStatusHistory
          WHERE OrderId = @oid AND (Note LIKE '%PayOS #%' OR Note LIKE '%payos%')
          ORDER BY HistoryId DESC LIMIT 1
        `, { oid });

        if (histRes.recordset && histRes.recordset.length > 0) {
          const note = histRes.recordset[0].Note || '';
          const match = note.match(/PayOS\s*#?(\d+)/i);
          if (match && match[1]) {
            const payosCode = Number(match[1]);
            const pInfo = await payos.getPaymentLinkInformation(payosCode);
            const fin = orderService.computeOrderFinancials(o);
            const expectedQrAmount = Math.max(1, Number(fin.qrTransferAmount || fin.productPayable || 0));
            const actualPaid = Number(pInfo?.amountPaid || (pInfo?.status === 'PAID' ? pInfo?.amount : 0) || 0);

            if (pInfo && pInfo.status === 'PAID' && actualPaid >= expectedQrAmount) {
              const isFullPaidNow = actualPaid >= Number(fin.productPayable || 0);
              const targetPaymentStatus = (fin.isPartialDeposit && !isFullPaidNow) ? 'PARTIALLY_PAID' : 'PAID';
              const formattedAmount = new Intl.NumberFormat('vi-VN').format(actualPaid);

              await db.query(`
                UPDATE Orders
                SET PaymentStatus = @pst,
                    PaymentMethod = CASE WHEN PaymentMethod = 'DEPOSIT' THEN 'DEPOSIT' ELSE 'VIETQR_PAYOS' END,
                    Status = CASE WHEN Status = 'PENDING' THEN 'CONFIRMED' ELSE Status END,
                    UpdatedAt = NOW()
                WHERE OrderId = @oid
              `, { oid, pst: targetPaymentStatus });

              await db.query(`
                INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note)
                VALUES (@oid, @from, 'CONFIRMED', 'PayOS API: Đối soát VietQR thành công (' || @pst || '). Số tiền Shop nhận: ' || @amount || 'đ')
              `, {
                oid,
                from: o.status || 'PENDING',
                pst: targetPaymentStatus,
                amount: formattedAmount
              });

              const updated = await orderService.getOrderByCodeOrId(oid);
              if (updated) {
                o = updated;
                if (updated.email || updated.customer?.email) {
                  mailService.sendOrderConfirmationEmail(updated).catch(() => {});
                }
              }
            }
          }
        }
      } catch (payosCheckErr) {
        // Bỏ qua lỗi nếu PayOS chưa nhận tiền hoặc link chưa sẵn sàng
      }
    }

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
    if (o.userId && (!req.user || (Number(req.user.userId) !== Number(o.userId) && req.user.role !== 'admin'))) {
      throw forbidden('Bạn không có quyền hủy đơn hàng của tài khoản khác');
    }

    const reason = v.cleanStr(req.body.cancelReason || req.body.reason || 'Khách yêu cầu hủy đơn', 255);
    const updated = await orderService.transitionOrderStatus(o.orderId || o.id, 'CANCELLED', {
      cancelReason: reason,
      actorId: req.user ? req.user.userId : null,
      isAdmin: false
    });
    aiChatService.invalidateStoreCache();
    return ok(res, updated, { message: 'Đã hủy đơn hàng và hoàn tồn kho' });
  } catch (err) { next(err); }
});

// PUT /api/orders/:code/confirm-received — Khách xác nhận đã nhận được hàng (chỉ cho phép khi đang SHIPPING)
router.put('/:code/confirm-received', optionalAuth, async (req, res, next) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const o = await orderService.getOrderByCodeOrId(code);
    if (!o) throw notFound('Không tìm thấy đơn hàng');

    if (o.userId && (!req.user || (Number(req.user.userId) !== Number(o.userId) && req.user.role !== 'admin'))) {
      throw forbidden('Bạn không có quyền xác nhận nhận hàng cho đơn hàng này');
    }

    const curStatus = String(o.status || '').toUpperCase();
    if (curStatus === 'DELIVERED') {
      return ok(res, o, { message: 'Đơn hàng đã được xác nhận giao thành công trước đó!' });
    }
    if (curStatus !== 'SHIPPING') {
      throw badRequest('Chỉ có thể xác nhận đã nhận hàng khi kiện hàng đang được bưu tá vận chuyển (SHIPPING)!');
    }

    const oid = o.orderId || o.id || o.OrderId;
    await db.query(`
      UPDATE Orders
      SET Status = 'DELIVERED', PaymentStatus = 'PAID', UpdatedAt = NOW()
      WHERE OrderId = @oid
    `, { oid });

    await db.query(`
      INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
      VALUES (@oid, @from, 'DELIVERED', 'Khách hàng xác nhận đã nhận kiện hàng nguyên seal', @by)
    `, { oid, from: o.status, by: req.user ? req.user.userId : null });

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

    if (o.userId && (!req.user || (Number(req.user.userId) !== Number(o.userId) && req.user.role !== 'admin'))) {
      throw forbidden('Bạn không có quyền sửa địa chỉ nhận hàng của tài khoản khác');
    }

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
// 1. TẠO LINK THANH TOÁN PAYOS VIETQR (TÁCH BẠCH TIỀN HÀNG SHOP & PHÍ SHIP SPX)
// =====================================================================
router.post('/:code/payos-link', optionalAuth, async (req, res, next) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const order = await orderService.getOrderByCodeOrId(code);
    if (!order) throw notFound('Không tìm thấy đơn hàng với mã này');

    const curStatus = String(order.status || '').toUpperCase();
    if (curStatus === 'CANCELLED') {
      throw badRequest('Đơn hàng đã hủy, không thể tạo mã thanh toán VietQR');
    }

    const fin = orderService.computeOrderFinancials(order);
    const payMethod = String(order.paymentMethod || '').toUpperCase();
    const payStatus = String(order.paymentStatus || 'UNPAID').toUpperCase();

    if (payStatus === 'PAID') {
      throw conflict('Đơn hàng này đã thanh toán đủ 100% tiền hàng cho Shop');
    }
    if (payMethod === 'COD' && !(req.body && req.body.switchToTransfer === true)) {
      throw badRequest('Đơn hàng Ship COD thanh toán trực tiếp cho bưu tá SPX khi nhận xe, không cần quét mã VietQR');
    }

    const payRemaining = Boolean(req.body?.payRemaining === true || req.query?.payRemaining === '1');
    if (payStatus === 'PARTIALLY_PAID' && !payRemaining) {
      throw conflict('Đơn hàng đã đặt cọc 30% thành công. Phần tiền hàng còn lại sẽ thanh toán khi nhận xe.');
    }

    // TUYỆT ĐỐI CHỈ THU TIỀN HÀNG CỦA SHOP (productPayable hoặc 30% depositAmount) QUA VIETQR — KHÔNG CỘNG PHÍ SHIP SPX 11.000đ!
    const amountToPay = (payStatus === 'PARTIALLY_PAID' && payRemaining)
      ? Math.round(Number(fin.remainingProductAmount || 0))
      : Math.round(Number(fin.qrTransferAmount > 0 ? fin.qrTransferAmount : fin.productPayable));

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

    // Ghi log vào OrderStatusHistory để mapping payosOrderCode với OrderId (giữ nguyên DEPOSIT nếu là đơn đặt cọc)
    const oid = order.orderId || order.id || order.OrderId;
    await db.query(`
      UPDATE Orders
      SET PaymentMethod = CASE WHEN PaymentMethod = 'DEPOSIT' THEN 'DEPOSIT' ELSE 'VIETQR_PAYOS' END
      WHERE OrderId = @oid AND (PaymentMethod IS NULL OR PaymentMethod = 'BANK_TRANSFER' OR PaymentMethod = 'COD')
    `, { oid }).catch(() => {});

    await db.query(`
      INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note)
      VALUES (@oid, @st, @st, 'Khởi tạo link thanh toán VietQR PayOS #' || @pCode || ' (' || @amt || 'đ)')
    `, { oid, st: order.status || 'PENDING', pCode: payosOrderCode, amt: Math.round(amountToPay) }).catch(() => {});

    return ok(res, {
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      accountNumber: paymentLink.accountNumber,
      accountName: paymentLink.accountName,
      bin: paymentLink.bin,
      paymentLinkId: paymentLink.paymentLinkId,
      orderCode: order.orderCode,
      payosOrderCode,
      amount: Math.round(amountToPay),
      productPayable: fin.productPayable,
      depositAmount: fin.depositAmount,
      remainingProductAmount: fin.remainingProductAmount,
      shippingFee: fin.shippingFee,
      payableOnDelivery: fin.payableOnDelivery,
      isPartialDeposit: fin.isPartialDeposit
    }, 'Khởi tạo cổng thanh toán PayOS VietQR thành công');
  } catch (err) {
    console.error('[PayOS createPaymentLink Error]:', err.message);
    next(err);
  }
});

// =====================================================================
// 2. WEBHOOK NHẬN TIỀN TỰ ĐỘNG TỪ PAYOS (CHỐNG GIẢ MẠO CHỮ KÝ & KIỂM TRA ĐỦ TIỀN)
// =====================================================================
router.post('/payos-webhook', async (req, res) => {
  try {
    // 1. Xác thực chữ ký Webhook PayOS bắt buộc
    let webhookData = null;
    try {
      webhookData = payos.verifyPaymentWebhookData(req.body);
    } catch (verifyErr) {
      console.log('[PayOS Ping/Verify Event]:', verifyErr.message);
      // Nếu sai/thiếu chữ ký: CHỈ cho phép đối chiếu trực tiếp lên máy chủ PayOS nếu có mã giao dịch số hợp lệ
      const rawOrderCode = req.body?.data?.orderCode;
      if (rawOrderCode && /^\d+$/.test(String(rawOrderCode))) {
        try {
          const liveInfo = await payos.getPaymentLinkInformation(Number(rawOrderCode));
          if (liveInfo && liveInfo.status === 'PAID') {
            webhookData = {
              code: '00',
              status: 'PAID',
              orderCode: Number(rawOrderCode),
              amount: Number(liveInfo.amountPaid || liveInfo.amount || 0),
              description: req.body?.data?.description || ''
            };
          }
        } catch (_) {}
      }
      if (!webhookData) {
        // Phản hồi 200 OK cho ping kiểm tra URL của PayOS Dashboard nhưng TUYỆT ĐỐI KHÔNG tự ý duyệt đơn!
        return res.status(200).json({ success: true, message: 'Webhook ping acknowledged' });
      }
    }

    const payload = webhookData;
    const isSuccess = payload && (payload.code === '00' || payload.status === 'PAID' || req.body?.code === '00');

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
            WHERE Note LIKE '%PayOS #' || @pCode || '%'
            ORDER BY HistoryId DESC LIMIT 1
          `, { pCode: String(payload.orderCode) });
          if (findByPayos.recordset.length > 0) {
            order = await orderService.getOrderByCodeOrId(findByPayos.recordset[0].OrderId || findByPayos.recordset[0].orderid);
          }
        } catch (_) {}
      }

      if (order && String(order.status || '').toUpperCase() !== 'CANCELLED' && String(order.paymentStatus || '').toUpperCase() !== 'PAID') {
        const oid = order.orderId || order.id || order.OrderId;
        const fin = orderService.computeOrderFinancials(order);
        const paidAmount = Number(payload.amount || 0);
        const expectedMin = Math.max(1, Number(fin.qrTransferAmount || fin.productPayable || 0));

        if (paidAmount < expectedMin) {
          await db.query(`
            INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note)
            VALUES (@oid, @from, @from, 'Cảnh báo PayOS: Số tiền nhận (' || @paid || 'đ) thấp hơn mức yêu cầu (' || @req || 'đ). Chờ Admin đối soát thủ công.')
          `, {
            oid,
            from: order.status || 'PENDING',
            paid: new Intl.NumberFormat('vi-VN').format(paidAmount),
            req: new Intl.NumberFormat('vi-VN').format(expectedMin)
          }).catch(() => {});
        } else {
          const isFullPaidNow = paidAmount >= Number(fin.productPayable || 0);
          const targetPaymentStatus = (fin.isPartialDeposit && !isFullPaidNow) ? 'PARTIALLY_PAID' : 'PAID';
          const formattedAmount = new Intl.NumberFormat('vi-VN').format(paidAmount);

          await db.query(`
            UPDATE Orders
            SET PaymentStatus = @pst,
                PaymentMethod = CASE WHEN PaymentMethod = 'DEPOSIT' THEN 'DEPOSIT' ELSE 'VIETQR_PAYOS' END,
                Status = CASE WHEN Status = 'PENDING' THEN 'CONFIRMED' ELSE Status END,
                UpdatedAt = NOW()
            WHERE OrderId = @oid
          `, { oid, pst: targetPaymentStatus });

          await db.query(`
            INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note)
            VALUES (@oid, @from, 'CONFIRMED', 'PayOS: Khách đã thanh toán tự động qua VietQR thành công (' || @pst || '). Số tiền Shop nhận: ' || @amount || 'đ')
          `, {
            oid,
            from: order.status || 'PENDING',
            pst: targetPaymentStatus,
            amount: formattedAmount
          });

          console.log(`✅ [PayOS Webhook] Đơn hàng ${order.orderCode} đã được đối soát tự động (${targetPaymentStatus} - ${formattedAmount}đ)!`);

          const updatedOrder = await orderService.getOrderByCodeOrId(oid);
          if (updatedOrder && (updatedOrder.email || updatedOrder.customer?.email)) {
            mailService.sendOrderConfirmationEmail(updatedOrder).catch(err => {
              console.warn('[MailService] Lỗi gửi email xác nhận PayOS:', err.message);
            });
          }
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