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

// =====================================================================
// BẢO MẬT QUYỀN TRUY CẬP ĐƠN HÀNG & CHỐNG LỘ THÔNG TIN CÁ NHÂN (PII)
// =====================================================================
function cleanPhoneDigits(p) {
  return String(p || '').replace(/\D/g, '');
}

function maskPhoneStr(phone) {
  const digits = cleanPhoneDigits(phone);
  if (!digits) return '';
  if (digits.length <= 6) return '***' + digits.slice(-2);
  return `${digits.slice(0, 3)}****${digits.slice(-3)}`;
}

function maskEmailStr(email) {
  const str = String(email || '').trim();
  if (!str || !str.includes('@')) return '';
  const [local, domain] = str.split('@');
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

function maskAddressStr(addr) {
  const str = String(addr || '').trim();
  if (!str) return '';
  const parts = str.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return `***, ${parts.slice(-2).join(', ')}`;
  }
  return str.length > 10 ? `***${str.slice(-8)}` : '***';
}

function maskOrderPII(order) {
  if (!order || typeof order !== 'object') return order;
  const maskedPhone = maskPhoneStr(order.phone || order.Phone || order.customer?.phone);
  const maskedEmail = maskEmailStr(order.email || order.Email || order.customer?.email);
  const maskedAddress = maskAddressStr(order.address || order.Address || order.customer?.address);
  const rawName = String(order.fullName || order.FullName || order.customer?.fullName || '');
  const nameParts = rawName.trim().split(/\s+/).filter(Boolean);
  const maskedName = nameParts.length > 1
    ? `${nameParts[0]} *** ${nameParts[nameParts.length - 1]}`
    : rawName;

  const clone = {
    ...order,
    fullName: maskedName,
    FullName: maskedName,
    phone: maskedPhone,
    Phone: maskedPhone,
    email: maskedEmail,
    Email: maskedEmail,
    address: maskedAddress,
    Address: maskedAddress,
    piiMasked: true
  };
  if (clone.customer && typeof clone.customer === 'object') {
    clone.customer = {
      ...clone.customer,
      fullName: maskedName,
      phone: maskedPhone,
      email: maskedEmail,
      address: maskedAddress
    };
  }
  return clone;
}

async function canViewFullOrderPII(order, req, extraQuery = '') {
  if (!order) return false;
  if (req.user && req.user.role === 'admin') return true;

  const orderUid = Number(order.userId || order.UserId || 0);
  if (req.user && req.user.userId && orderUid > 0 && Number(req.user.userId) === orderUid) {
    return true;
  }

  const orderPhone = cleanPhoneDigits(order.phone || order.Phone || order.customer?.phone);
  const orderEmail = String(order.email || order.Email || order.customer?.email || '').trim().toLowerCase();

  const candidatePhones = [
    req.query?.phone,
    req.query?.verifyPhone,
    req.body?.phone,
    req.body?.verifyPhone,
    req.headers?.['x-order-phone'],
    extraQuery
  ].map(cleanPhoneDigits).filter(d => d.length >= 9);

  if (orderPhone && candidatePhones.includes(orderPhone)) {
    return true;
  }

  const candidateEmails = [
    req.query?.email,
    req.body?.email,
    extraQuery
  ].map(e => String(e || '').trim().toLowerCase()).filter(e => e.includes('@'));

  if (orderEmail && candidateEmails.includes(orderEmail)) {
    return true;
  }

  if (req.user && req.user.userId) {
    try {
      const uRes = await db.query('SELECT Email, Phone FROM Users WHERE UserId = @id', { id: Number(req.user.userId) });
      const uRow = uRes.recordset && uRes.recordset[0];
      if (uRow) {
        const uPhone = cleanPhoneDigits(uRow.Phone || uRow.phone);
        const uEmail = String(uRow.Email || uRow.email || '').trim().toLowerCase();
        if (orderPhone && uPhone && orderPhone === uPhone) return true;
        if (orderEmail && uEmail && orderEmail === uEmail) return true;
      }
    } catch (_) {}
  }

  return false;
}

async function sanitizeOrderForCaller(order, req, extraQuery = '') {
  if (!order) return null;
  const fullAllowed = await canViewFullOrderPII(order, req, extraQuery);
  return fullAllowed ? order : maskOrderPII(order);
}

async function assertCanModifyOrder(order, req) {
  if (!order) throw notFound('Không tìm thấy đơn hàng');
  if (req.user && req.user.role === 'admin') return true;

  const orderUid = Number(order.userId || order.UserId || 0);
  if (orderUid > 0) {
    if (req.user && Number(req.user.userId) === orderUid) {
      return true;
    }
    throw forbidden('Bạn không có quyền thao tác trên đơn hàng của tài khoản khác');
  }

  // Đơn khách vãng lai (userId == null): Yêu cầu xác minh SĐT hoặc Email đặt hàng
  const isVerified = await canViewFullOrderPII(order, req);
  if (!isVerified) {
    throw forbidden('Vui lòng đăng nhập hoặc cung cấp đúng số điện thoại/email đặt hàng để xác minh quyền thao tác đơn hàng này');
  }
  return true;
}

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
      if (!o) return ok(res, []);
      const safeOrder = await sanitizeOrderForCaller(o, req, phone || '');
      return ok(res, [safeOrder]);
    }
    if (phone) {
      if (!v.isVNPhone(phone)) throw badRequest('Số điện thoại tra cứu không hợp lệ');
      const r = await orderService.listOrders({ phone, page, pageSize });
      const safeItems = await Promise.all((r.items || []).map(item => sanitizeOrderForCaller(item, req, phone)));
      return ok(res, safeItems, { meta: { total: r.total, page: r.page, pageSize: r.pageSize, totalPages: r.totalPages } });
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

    // 1. NẾU KHÁCH ĐÃ ĐĂNG NHẬP: Phân lập tuyệt đối theo UserId và Email xác thực của chính tài khoản đó
    // Tuyệt đối không dùng SĐT từ query string hoặc gộp đơn của UserId khác (tránh rò rỉ lịch sử đơn giữa các tài khoản)
    if (req.user && req.user.userId) {
      const authUid = Number(req.user.userId);
      let uEmail = '';
      let uPhone = '';
      try {
        const uInfo = await db.query('SELECT Email, Phone FROM Users WHERE UserId = @id', { id: authUid });
        if (uInfo.recordset && uInfo.recordset[0]) {
          uEmail = uInfo.recordset[0].Email || '';
          uPhone = uInfo.recordset[0].Phone || '';
        }
      } catch (_) {}

      const r = await orderService.listOrders({
        userId: authUid,
        userEmail: uEmail,
        codes: codeList,
        pageSize: 100
      });
      const strictlyOwnedItems = (r.items || []).filter(item => {
        const itemUid = Number(item.userId ?? item.UserId ?? 0);
        return itemUid === 0 || itemUid === authUid;
      });
      const safeItems = await Promise.all(strictlyOwnedItems.map(item => sanitizeOrderForCaller(item, req, uPhone)));
      return ok(res, safeItems);
    }

    // 2. NẾU LÀ KHÁCH VÃNG LAI (CHƯA ĐĂNG NHẬP): Chỉ tra cứu đơn khách vãng lai theo mã đơn trong phiên hiện tại
    if (codeList.length > 0 || (phone && v.isVNPhone(phone))) {
      const r = await orderService.listOrders({
        phone: phone && v.isVNPhone(phone) ? phone : undefined,
        codes: codeList,
        pageSize: 100
      });
      const guestItems = (r.items || []).filter(item => {
        const itemUid = Number(item.userId ?? item.UserId ?? 0);
        const itemCode = String(item.orderCode || item.OrderCode || item.code || '').toUpperCase();
        return itemUid === 0 || codeList.includes(itemCode);
      });
      const safeItems = await Promise.all(guestItems.map(item => sanitizeOrderForCaller(item, req, phone || '')));
      return ok(res, safeItems);
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
router.get('/check-status/:code', optionalAuth, async (req, res, next) => {
  try {
    const q = decodeURIComponent(req.params.code).trim().toUpperCase();
    let o = await orderService.getOrderByCodeOrId(q, { skipAutoCancel: true });
    if (!o) throw notFound('Không tìm thấy đơn hàng');

    // Nếu đơn chưa thanh toán đủ, chủ động truy vấn trực tiếp PayOS API để khớp lệnh ngay lập tức
    // (Khắc phục triệt để lỗi khách chuyển tiền rồi nhưng webhook delay 2-5 phút)
    if (o.paymentStatus !== 'PAID' && o.paymentStatus !== 'PARTIALLY_PAID') {
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

              // Tự động khôi phục đơn nếu từng bị hủy oan sau 5p và cập nhật xác nhận thanh toán
              await orderService.updatePaymentStatus(oid, targetPaymentStatus, {
                note: `PayOS API: Đối soát VietQR thành công (${targetPaymentStatus}). Số tiền Shop nhận: ${formattedAmount}đ`
              });

              const updated = await orderService.getOrderByCodeOrId(oid, { skipAutoCancel: true });
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

    const safeOrder = await sanitizeOrderForCaller(o, req);
    return ok(res, safeOrder);
  } catch (err) { next(err); }
});

// POST /api/orders/notify-transfer — Khách hàng xác nhận đã chuyển khoản MB Bank
router.post('/notify-transfer', async (req, res, next) => {
  try {
    const { orderCode } = req.body;
    if (!orderCode) throw badRequest('Thiếu mã đơn hàng');
    const q = String(orderCode).trim().toUpperCase();
    const order = await orderService.getOrderByCodeOrId(q, { skipAutoCancel: true });
    if (!order) throw notFound('Không tìm thấy đơn hàng');

    const oid = order.id || order.orderId || order.OrderId;
    // Cập nhật thời gian gia hạn đơn
    await db.query(`UPDATE Orders SET UpdatedAt = NOW() WHERE OrderId = @oid`, { oid });
    await db.query(`
      INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
      VALUES (@oid, @st, @st, 'Khách hàng báo đã chuyển khoản thành công qua MB Bank (STK 87654321082007 - DO QUOC THINH). Chờ Admin check TK.', NULL)
    `, { oid, st: order.status });

    // Kích hoạt PayOS check tức thì
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
          if (pInfo && pInfo.status === 'PAID') {
            const fin = orderService.computeOrderFinancials(order);
            const actualPaid = Number(pInfo.amountPaid || pInfo.amount || 0);
            const isFullPaidNow = actualPaid >= Number(fin.productPayable || 0);
            const targetPaymentStatus = (fin.isPartialDeposit && !isFullPaidNow) ? 'PARTIALLY_PAID' : 'PAID';
            await orderService.updatePaymentStatus(oid, targetPaymentStatus, {
              note: `PayOS API (Khách báo CK): Khớp lệnh PayOS thành công (${targetPaymentStatus}). Số tiền: ${new Intl.NumberFormat('vi-VN').format(actualPaid)}đ`
            });
          }
        }
      }
    } catch (_) {}

    return ok(res, { orderCode: q, reported: true }, 'Đã gửi thông báo chuyển khoản thành công tới Admin!');
  } catch (err) { next(err); }
});

// GET /api/orders/track/:query — Tra cứu theo Mã đơn / SĐT / Mã vận đơn SPX
router.get('/track/:query', optionalAuth, async (req, res, next) => {
  try {
    const q = decodeURIComponent(req.params.query).trim();
    if (!q) throw badRequest('Vui lòng nhập thông tin tra cứu');
    const byCode = await orderService.getOrderByCodeOrId(q.toUpperCase());
    if (byCode) {
      const safeOrder = await sanitizeOrderForCaller(byCode, req, q);
      return ok(res, [safeOrder]);
    }
    const list = await orderService.listOrders({ q, pageSize: 20 });
    const safeItems = await Promise.all((list.items || []).map(item => sanitizeOrderForCaller(item, req, q)));
    return ok(res, safeItems);
  } catch (err) { next(err); }
});

// GET /api/orders/:code — Chi tiết đơn hàng theo mã
router.get('/:code', optionalAuth, async (req, res, next) => {
  try {
    const o = await orderService.getOrderByCodeOrId(String(req.params.code).trim().toUpperCase());
    if (!o) throw notFound('Không tìm thấy đơn hàng với mã này');
    const safeOrder = await sanitizeOrderForCaller(o, req);
    return ok(res, safeOrder);
  } catch (err) { next(err); }
});

// PUT /api/orders/:code/cancel — Khách hủy đơn
router.put('/:code/cancel', optionalAuth, async (req, res, next) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const o = await orderService.getOrderByCodeOrId(code);
    if (!o) throw notFound('Không tìm thấy đơn hàng');
    await assertCanModifyOrder(o, req);

    const reason = v.cleanStr(req.body.cancelReason || req.body.reason || 'Khách yêu cầu hủy đơn', 255);
    const updated = await orderService.transitionOrderStatus(o.orderId || o.id, 'CANCELLED', {
      cancelReason: reason,
      actorId: req.user ? req.user.userId : null,
      isAdmin: req.user?.role === 'admin'
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
    await assertCanModifyOrder(o, req);

    const curStatus = String(o.status || '').toUpperCase();
    if (curStatus === 'DELIVERED') {
      return ok(res, o, { message: 'Đơn hàng đã được xác nhận giao thành công trước đó!' });
    }
    if (curStatus !== 'SHIPPING') {
      throw badRequest('Chỉ có thể xác nhận đã nhận hàng khi kiện hàng đang được bưu tá vận chuyển (SHIPPING)!');
    }

    const oid = o.orderId || o.id || o.OrderId;
    const updated = await orderService.transitionOrderStatus(oid, 'DELIVERED', {
      note: 'Khách hàng xác nhận đã nhận kiện hàng nguyên seal',
      actorId: req.user ? req.user.userId : null,
      isAdmin: req.user?.role === 'admin'
    });
    aiChatService.invalidateStoreCache();
    return ok(res, updated, { message: 'Cảm ơn bạn đã xác nhận nhận hàng thành công!' });
  } catch (err) { next(err); }
});

// PUT /api/orders/:code/shipping-info — Khách cập nhật địa chỉ nhận hàng
router.put('/:code/shipping-info', optionalAuth, async (req, res, next) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const o = await orderService.getOrderByCodeOrId(code);
    if (!o) throw notFound('Không tìm thấy đơn hàng');
    await assertCanModifyOrder(o, req);

    if (['SHIPPING', 'DELIVERED', 'CANCELLED'].includes(String(o.status).toUpperCase()) || (o.trackingCode && String(o.trackingCode).trim())) {
      throw badRequest('Đơn hàng đã bàn giao vận chuyển hoặc đã đóng, không thể thay đổi địa chỉ');
    }

    const oid = o.orderId || o.id || o.OrderId;
    const fullName = v.cleanStr(req.body.fullName, 100) || o.fullName;
    const phone = v.cleanStr(req.body.phone, 20) || o.phone;
    if (phone && !v.isVNPhone(phone)) {
      throw badRequest('Số điện thoại nhận hàng không hợp lệ');
    }
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

// POST /api/orders/upload-receipt & POST /api/orders/:code/receipt — Khách gửi biên lai chuyển khoản
async function handleUploadReceipt(req, res, next) {
  try {
    const code = String(req.params.code || req.body.orderCode || '').trim().toUpperCase();
    if (!code) throw badRequest('Thiếu mã đơn hàng');
    const receiptImage = v.cleanStr(req.body.receiptImage, 500);
    if (!receiptImage) throw badRequest('Thiếu đường dẫn ảnh hoặc mã giao dịch biên lai');

    const o = await orderService.getOrderByCodeOrId(code);
    if (!o) throw notFound('Không tìm thấy đơn hàng');
    await assertCanModifyOrder(o, req);

    const oid = o.orderId || o.id || o.OrderId;
    await db.query(
      'UPDATE Orders SET ReceiptImage = @img, UpdatedAt = NOW() WHERE OrderId = @id',
      { img: receiptImage, id: oid }
    );
    const updated = await orderService.getOrderByCodeOrId(oid);
    return ok(res, updated, { message: 'Đã gửi biên lai chuyển khoản, cửa hàng sẽ xác nhận sớm' });
  } catch (err) { next(err); }
}

router.post('/upload-receipt', optionalAuth, handleUploadReceipt);
router.post('/:code/receipt', optionalAuth, handleUploadReceipt);

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
      let order = null;

      // 1. Tìm theo định dạng chuẩn MGT-YYYYMMDD-XXXX hoặc MGT YYYYMMDD XXXX hoặc MGT20261107XXXX
      const m1 = desc.match(/MGT[\s-_]*([0-9]{8})[\s-_]*([0-9A-Z]{3,8})/i);
      if (m1) {
        const extractedCode = `MGT-${m1[1]}-${m1[2]}`;
        order = await orderService.getOrderByCodeOrId(extractedCode, { skipAutoCancel: true });
      }
      if (!order) {
        const m2 = desc.match(/MGT[\s-_]*([0-9A-Z-_]{6,20})/i);
        if (m2) {
          order = await orderService.getOrderByCodeOrId(m2[0].replace(/\s+/g, ''), { skipAutoCancel: true });
        }
      }

      // 2. Double-check: Tìm theo payosOrderCode được lưu trong OrderStatusHistory nếu ngân hàng cắt nội dung
      if (!order && payload.orderCode) {
        try {
          const findByPayos = await db.query(`
            SELECT OrderId FROM OrderStatusHistory
            WHERE Note LIKE '%PayOS #' || @pCode || '%'
            ORDER BY HistoryId DESC LIMIT 1
          `, { pCode: String(payload.orderCode) });
          if (findByPayos.recordset.length > 0) {
            order = await orderService.getOrderByCodeOrId(findByPayos.recordset[0].OrderId || findByPayos.recordset[0].orderid, { skipAutoCancel: true });
          }
        } catch (_) {}
      }

      // 3. Khớp lệnh và cập nhật thanh toán an toàn (kể cả khi đơn từng bị hủy oan sau 5p)
      if (order && String(order.paymentStatus || '').toUpperCase() !== 'PAID') {
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

          // Tự động khôi phục đơn nếu từng bị CANCELLED, trừ lại kho và đổi Status = CONFIRMED
          await orderService.updatePaymentStatus(oid, targetPaymentStatus, {
            note: `PayOS Webhook: Đối soát VietQR tự động thành công (${targetPaymentStatus}). Số tiền Shop nhận: ${formattedAmount}đ`
          });

          console.log(`✅ [PayOS Webhook] Đơn hàng ${order.orderCode} đã được đối soát tự động (${targetPaymentStatus} - ${formattedAmount}đ)!`);

          const updatedOrder = await orderService.getOrderByCodeOrId(oid, { skipAutoCancel: true });
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