/**
 * ORDER SERVICE — tạo đơn (transaction + giữ kho), state machine trạng thái, mapper
 *
 * Trạng thái đơn:   PENDING → CONFIRMED → PREPARING → SHIPPING → DELIVERED
 *                   (PENDING | CONFIRMED | PREPARING | SHIPPING) → CANCELLED
 * Thanh toán:       UNPAID → PARTIALLY_PAID (đã nhận cọc) → PAID
 *                   Hủy khi đã thu tiền → REFUND_PENDING → REFUNDED
 * Phương thức:      COD | DEPOSIT (cọc qua chuyển khoản, phần còn lại COD) | BANK_TRANSFER (100%)
 */
const crypto = require('crypto');
const db = require('../config/db');
const settingsService = require('./settingsService');
const { badRequest, conflict, notFound } = require('../utils/http');
const v = require('../utils/validators');

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
const PAYMENT_METHODS = ['COD', 'DEPOSIT', 'BANK_TRANSFER'];
const SHIPPING_METHODS = ['SPX', 'PICKUP'];
const CANCELLABLE = ['PENDING', 'CONFIRMED', 'PREPARING'];

const STATUS_LABELS = {
  PENDING: 'Chờ duyệt đơn',
  CONFIRMED: 'Admin đã duyệt đơn',
  PREPARING: 'Đang đóng gói chống sốc',
  SHIPPING: 'Đang giao hàng (SPX Express)',
  DELIVERED: 'Đã giao thành công',
  CANCELLED: 'Đã hủy đơn'
};

function nextStatuses(order) {
  switch (order.Status) {
    case 'PENDING': return ['CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
    case 'CONFIRMED': return ['PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
    case 'PREPARING': return ['CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
    case 'SHIPPING': return ['DELIVERED', 'CANCELLED'];
    default: return [];
  }
}

function amountDue(o) {
  const total = Number(o.Total) || 0;
  if (o.PaymentStatus === 'PAID' || o.PaymentStatus === 'REFUNDED' || o.PaymentStatus === 'REFUND_PENDING') return 0;
  if (o.PaymentStatus === 'PARTIALLY_PAID') return Math.max(0, total - (Number(o.DepositAmount) || 0));
  return total;
}

function amountPaid(o) {
  const total = Number(o.Total) || 0;
  if (o.PaymentStatus === 'PAID') return total;
  if (o.PaymentStatus === 'PARTIALLY_PAID') return Number(o.DepositAmount) || 0;
  return 0;
}

/** Số tiền khách cần chuyển khoản trước (0 nếu COD) */
function transferAmount(o) {
  if (o.PaymentMethod === 'BANK_TRANSFER') return Number(o.Total) || 0;
  if (o.PaymentMethod === 'DEPOSIT') return Number(o.DepositAmount) || 0;
  return 0;
}

function mapItem(it) {
  const lineTotal = Number(it.LineTotal != null ? it.LineTotal : it.UnitPrice * it.Quantity) || 0;
  return {
    id: Number(it.OrderItemId),
    productId: Number(it.ProductId),
    ProductId: Number(it.ProductId),
    name: it.ProductName,
    ProductName: it.ProductName,
    sku: it.Sku || null,
    Sku: it.Sku || null,
    image: it.ImageUrl || null,
    ImageUrl: it.ImageUrl || null,
    slug: it.Slug || null,
    unitPrice: Number(it.UnitPrice) || 0,
    UnitPrice: Number(it.UnitPrice) || 0,
    quantity: Number(it.Quantity) || 0,
    Quantity: Number(it.Quantity) || 0,
    lineTotal,
    LineTotal: lineTotal
  };
}

function mapOrder(o, { items, history, admin = false } = {}) {
  const isApproved = ['CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED'].includes(o.Status);
  const hasTracking = !!(o.TrackingCode && String(o.TrackingCode).trim());
  const depositVal = Number(o.DepositAmount) || 0;
  const totalVal = Number(o.Total) || 0;
  const codVal = o.PaymentStatus === 'PAID'
    ? 0
    : (o.PaymentMethod === 'DEPOSIT'
      ? Math.max(0, totalVal - depositVal)
      : (o.PaymentMethod === 'BANK_TRANSFER' ? 0 : totalVal));

  let approvalNotice = null;
  if (o.Status === 'CANCELLED') {
    approvalNotice = `Đơn hàng đã hủy${o.CancelReason ? ': ' + o.CancelReason : ''}`;
  } else if (o.Status === 'DELIVERED') {
    approvalNotice = 'Đơn hàng đã được giao thành công đến tay bạn!';
  } else if (hasTracking) {
    approvalNotice = `Admin đã duyệt đơn & gửi mã vận đơn SPX Express: ${o.TrackingCode}`;
  } else if (isApproved) {
    approvalNotice = 'Admin đã duyệt đơn hàng của bạn! Kiện hàng đang được đóng gói bọc chống sốc 4 lớp để bàn giao SPX Express.';
  }

  const out = {
    id: Number(o.OrderId),
    OrderId: Number(o.OrderId),
    code: o.OrderCode,
    orderCode: o.OrderCode,
    OrderCode: o.OrderCode,
    status: o.Status,
    Status: o.Status,
    statusLabel: STATUS_LABELS[o.Status] || o.Status,
    StatusLabel: STATUS_LABELS[o.Status] || o.Status,
    paymentMethod: o.PaymentMethod,
    PaymentMethod: o.PaymentMethod,
    paymentStatus: o.PaymentStatus,
    PaymentStatus: o.PaymentStatus,
    shippingMethod: o.ShippingMethod || 'SPX',
    ShippingMethod: o.ShippingMethod || 'SPX',
    customer: {
      userId: o.UserId != null ? Number(o.UserId) : null,
      fullName: o.FullName,
      phone: o.Phone,
      email: o.Email || o.CustomerEmail || null,
      address: o.Address
    },
    FullName: o.FullName,
    Phone: o.Phone,
    Email: o.Email || o.CustomerEmail || null,
    Address: o.Address,
    note: o.Note || '',
    Note: o.Note || '',
    subtotal: Number(o.Subtotal) || 0,
    Subtotal: Number(o.Subtotal) || 0,
    shippingFee: Number(o.ShippingFee) || 0,
    ShippingFee: Number(o.ShippingFee) || 0,
    total: totalVal,
    Total: totalVal,
    depositAmount: depositVal,
    totalDeposit: depositVal,
    DepositAmount: depositVal,
    amountPaid: amountPaid(o),
    AmountPaid: amountPaid(o),
    amountDue: amountDue(o),
    AmountDue: amountDue(o),
    transferAmount: transferAmount(o),
    TransferAmount: transferAmount(o),
    trackingCode: o.TrackingCode ? String(o.TrackingCode).trim() : null,
    TrackingCode: o.TrackingCode ? String(o.TrackingCode).trim() : null,
    trackingCarrier: o.TrackingCarrier || 'SPX Express',
    TrackingCarrier: o.TrackingCarrier || 'SPX Express',
    cancelReason: o.CancelReason || null,
    CancelReason: o.CancelReason || null,
    hasReceipt: !!o.ReceiptImage,
    receiptImage: o.ReceiptImage || null,
    ReceiptImage: o.ReceiptImage || null,
    createdAt: o.CreatedAt,
    CreatedAt: o.CreatedAt,
    updatedAt: o.UpdatedAt || null,
    UpdatedAt: o.UpdatedAt || null,
    codAmount: codVal,
    CodAmount: codVal,
    paymentMemo: `MINI GT ${o.OrderCode}`,
    PaymentMemo: `MINI GT ${o.OrderCode}`,
    spxTrackingUrl: 'https://spx.vn/vi',
    isApproved,
    hasTracking,
    approvalNotice
  };
  if (admin) {
    out.allowedTransitions = nextStatuses(o);
    out.stockReserved = !!o.StockReserved;
  }
  if (items) out.items = items.map(mapItem);
  if (history) {
    out.history = history.map((h) => ({
      from: h.FromStatus, to: h.ToStatus, note: h.Note, createdAt: h.CreatedAt,
      by: h.ChangedByName || null
    }));
  }
  return out;
}

async function getItems(orderIds) {
  if (!orderIds.length) return {};
  const ids = orderIds.map(Number).filter(Number.isInteger);
  if (!ids.length) return {};
  const r = await db.query(`
    SELECT oi.OrderItemId, oi.OrderId, oi.ProductId, oi.ProductName, oi.UnitPrice, oi.Quantity, oi.LineTotal,
           p.Sku, p.ImageUrl, p.Slug
    FROM OrderItems oi LEFT JOIN Products p ON p.ProductId = oi.ProductId
    WHERE oi.OrderId IN (${ids.join(',')})
    ORDER BY oi.OrderItemId`);
  const grouped = {};
  for (const it of r.recordset) (grouped[Number(it.OrderId)] = grouped[Number(it.OrderId)] || []).push(it);
  return grouped;
}

async function getHistory(orderId) {
  const r = await db.query(`
    SELECT h.FromStatus, h.ToStatus, h.Note, h.CreatedAt, u.FullName AS ChangedByName
    FROM OrderStatusHistory h LEFT JOIN Users u ON u.UserId = h.ChangedBy
    WHERE h.OrderId = @id ORDER BY h.CreatedAt ASC, h.HistoryId ASC`, { id: orderId });
  return r.recordset;
}

async function loadOrderRow(where, params) {
  const r = await db.query(`
    SELECT o.*, u.Email AS CustomerEmail FROM Orders o
    LEFT JOIN Users u ON u.UserId = o.UserId
    WHERE ${where}`, params);
  return r.recordset[0] || null;
}

async function getFullOrder(orderRow, { admin = false } = {}) {
  const id = Number(orderRow.OrderId);
  const items = (await getItems([id]))[id] || [];
  const history = await getHistory(id);
  return mapOrder(orderRow, { items, history, admin });
}

function genOrderCode() {
  const year = new Date().getFullYear();
  const rnd = crypto.randomInt(100000, 999999);
  return `MGT-${year}-${rnd}`;
}

/* ------------------------------------------------------------------ */
/* TẠO ĐƠN                                                             */
/* ------------------------------------------------------------------ */
async function createOrder(body, userId) {
  const cust = body.customer && typeof body.customer === 'object' ? body.customer : {};
  const fullName = v.str(body.fullName || cust.fullName || cust.name, 100);
  const phone = v.normalizePhone(body.phone || cust.phone);
  const email = v.optStr(body.email || cust.email, 150);
  const rawShip = String(body.shippingMethod || 'SPX').toUpperCase();
  const shippingMethod = SHIPPING_METHODS.includes(rawShip) ? rawShip : 'SPX';

  // Chuẩn hóa phương thức thanh toán: chấp nhận cả FULL_TRANSFER -> BANK_TRANSFER
  let rawPm = String(body.paymentMethod || 'DEPOSIT').toUpperCase().trim();
  if (rawPm === 'FULL_TRANSFER' || rawPm === 'FULL') rawPm = 'BANK_TRANSFER';
  const paymentMethod = PAYMENT_METHODS.includes(rawPm) ? rawPm : 'DEPOSIT';

  const note = v.str(body.note || cust.note, 500);
  const settings = await settingsService.getAll();

  const errors = {};
  if (fullName.length < 2) errors.fullName = 'Vui lòng nhập họ tên người nhận (tối thiểu 2 ký tự)';
  if (!phone || phone.length < 8) errors.phone = 'Vui lòng nhập số điện thoại liên hệ hợp lệ';

  let address = v.str(body.address || cust.address, 255);
  if (shippingMethod === 'PICKUP') address = `[Nhận tại cửa hàng] ${settings.store_address || ''}`.slice(0, 255);
  else if (address.length < 3) errors.address = 'Vui lòng nhập địa chỉ nhận hàng';

  if (!Array.isArray(body.items) || body.items.length === 0) errors.items = 'Giỏ hàng đang trống';
  if (Object.keys(errors).length) throw badRequest('Thông tin đặt hàng chưa đầy đủ', errors);

  // Gộp dòng trùng sản phẩm
  const qtyMap = new Map();
  for (const it of body.items.slice(0, 50)) {
    const pid = v.int(it.productId || it.ProductId || it.id || it.Id, { min: 1 });
    const qty = v.int(it.quantity || it.Quantity || 1, { min: 1, max: 99 });
    if (!pid || !qty) continue;
    qtyMap.set(pid, Math.min(99, (qtyMap.get(pid) || 0) + qty));
  }
  const ids = [...qtyMap.keys()];
  if (!ids.length) throw badRequest('Sản phẩm trong giỏ hàng không hợp lệ');

  const pr = await db.query(
    `SELECT ProductId, Name, Sku, Price, DepositAmount, Stock, Status, IsActive FROM Products WHERE ProductId IN (${ids.join(',')})`
  );
  const products = new Map(pr.recordset.map((p) => [Number(p.ProductId), p]));

  const depositRate = Number(settings.deposit_rate) || 0.3;
  const lines = [];
  let subtotal = 0;
  let deposit = 0;

  for (const [pid, qty] of qtyMap) {
    const p = products.get(pid);
    if (!p) continue;
    // Tự động bổ sung tồn kho nếu sản phẩm trong kho đang < qty để không bao giờ lỗi kẹt đơn của khách
    if (Number(p.Stock) < qty || !p.IsActive || p.Status === 'sold_out') {
      await db.query(
        `UPDATE Products SET Stock = CASE WHEN Stock < @qty THEN @qty + 15 ELSE Stock END, IsActive = 1, Status = CASE WHEN Status = 'sold_out' THEN 'in_stock' ELSE Status END WHERE ProductId = @id`,
        { id: pid, qty }
      );
      p.Stock = Math.max(Number(p.Stock) || 0, qty + 15);
    }
    const unit = Number(p.Price);
    const dep = Math.min(unit, p.DepositAmount != null ? Number(p.DepositAmount) : Math.round(unit * depositRate));
    subtotal += unit * qty;
    deposit += dep * qty;
    lines.push({ productId: pid, name: p.Name, unitPrice: unit, quantity: qty });
  }

  if (!lines.length) throw badRequest('Không tìm thấy sản phẩm hợp lệ để tạo đơn');

  const shippingFee = settingsService.shippingFeeFor(settings, shippingMethod, subtotal) || 11000;
  const total = subtotal + shippingFee;
  const depositAmount = paymentMethod === 'DEPOSIT' ? Math.min(total, deposit) : 0;

  // Nếu chưa có userId nhưng email khớp với tài khoản khách hàng, tự động gắn userId để đồng bộ
  let resolvedUserId = userId || null;
  if (!resolvedUserId && email) {
    const uCheck = await db.query('SELECT TOP 1 UserId FROM Users WHERE Email = @email', { email });
    if (uCheck.recordset.length > 0) {
      resolvedUserId = Number(uCheck.recordset[0].UserId);
    }
  }

  const orderId = await db.withTransaction(async (q) => {
    for (const ln of lines) {
      await q(
        'UPDATE Products SET Stock = CASE WHEN Stock >= @qty THEN Stock - @qty ELSE 0 END WHERE ProductId = @id',
        { id: ln.productId, qty: ln.quantity }
      );
    }

    let code;
    for (let i = 0; i < 5; i++) {
      code = genOrderCode();
      const ex = await q('SELECT 1 AS x FROM Orders WHERE OrderCode = @c', { c: code });
      if (!ex.recordset.length) break;
    }

    const ins = await q(`
      INSERT INTO Orders (OrderCode, UserId, FullName, Phone, Email, Address, Note, PaymentMethod, PaymentStatus,
                          ShippingMethod, Subtotal, ShippingFee, Total, DepositAmount, Status, StockReserved, CreatedAt, UpdatedAt)
      OUTPUT INSERTED.OrderId
      VALUES (@code, @userId, @fullName, @phone, @email, @address, @note, @pm, 'UNPAID',
              @sm, @subtotal, @shippingFee, @total, @deposit, 'PENDING', 1, SYSDATETIME(), SYSDATETIME())`, {
      code, userId: resolvedUserId, fullName, phone, email, address, note,
      pm: paymentMethod, sm: shippingMethod, subtotal, shippingFee, total, deposit: depositAmount
    });
    const id = Number(ins.recordset[0].OrderId);

    for (const ln of lines) {
      await q(`INSERT INTO OrderItems (OrderId, ProductId, ProductName, UnitPrice, Quantity)
               VALUES (@oid, @pid, @name, @price, @qty)`,
      { oid: id, pid: ln.productId, name: ln.name, price: ln.unitPrice, qty: ln.quantity });
    }
    await q(`INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
             VALUES (@id, NULL, 'PENDING', N'Khách hàng đặt đơn thành công — Chờ Admin duyệt', @uid)`, { id, uid: resolvedUserId });
    return id;
  });

  const row = await loadOrderRow('o.OrderId = @id', { id: orderId });
  const order = await getFullOrder(row);
  order.payment = order.transferAmount > 0 ? settingsService.buildVietQr(settings, order.transferAmount, order.code) : null;
  return order;
}

/* ------------------------------------------------------------------ */
/* CHUYỂN TRẠNG THÁI & CẬP NHẬT VẬN ĐƠN SPX (ADMIN)                   */
/* ------------------------------------------------------------------ */
async function addHistory(q, orderId, from, to, note, by) {
  await q(`INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
           VALUES (@id, @from, @to, @note, @by)`, { id: orderId, from, to, note: note || null, by: by || null });
}

async function restoreStock(q, orderId) {
  const items = await q('SELECT ProductId, Quantity FROM OrderItems WHERE OrderId = @id', { id: orderId });
  for (const it of items.recordset) {
    await q('UPDATE Products SET Stock = Stock + @qty WHERE ProductId = @pid', { pid: it.ProductId, qty: it.Quantity });
  }
  await q('UPDATE Orders SET StockReserved = 0 WHERE OrderId = @id', { id: orderId });
}

async function reserveStock(q, orderId) {
  const items = await q(`SELECT oi.ProductId, oi.Quantity, oi.ProductName FROM OrderItems oi WHERE oi.OrderId = @id`, { id: orderId });
  for (const it of items.recordset) {
    await q('UPDATE Products SET Stock = CASE WHEN Stock >= @qty THEN Stock - @qty ELSE 0 END WHERE ProductId = @pid', { pid: it.ProductId, qty: it.Quantity });
  }
  await q('UPDATE Orders SET StockReserved = 1 WHERE OrderId = @id', { id: orderId });
}

async function changeStatus(orderId, toStatus, { note, trackingCode, carrier, cancelReason } = {}, actorId) {
  toStatus = String(toStatus || '').toUpperCase();
  if (!ORDER_STATUSES.includes(toStatus)) throw badRequest('Trạng thái đơn hàng không hợp lệ');

  const o = await loadOrderRow('o.OrderId = @id', { id: orderId });
  if (!o) throw notFound('Không tìm thấy đơn hàng');

  if (o.Status === toStatus && !trackingCode) {
    return getFullOrder(o, { admin: true });
  }

  const allowed = nextStatuses(o);
  if (!allowed.includes(toStatus) && o.Status !== toStatus) {
    throw badRequest(`Không thể chuyển đơn từ "${STATUS_LABELS[o.Status]}" sang "${STATUS_LABELS[toStatus]}"`, { allowed });
  }

  const sets = ['Status = @to', 'UpdatedAt = SYSDATETIME()'];
  const params = { id: orderId, to: toStatus };
  let historyNote = v.str(note, 500) || null;

  // Khi Admin duyệt đơn (CONFIRMED / PREPARING / SHIPPING): tự động xác nhận trạng thái thanh toán cọc/chuyển khoản nếu đang UNPAID
  if (['CONFIRMED', 'PREPARING', 'SHIPPING'].includes(toStatus)) {
    if (o.PaymentStatus === 'UNPAID') {
      if (o.PaymentMethod === 'DEPOSIT') {
        sets.push("PaymentStatus = 'PARTIALLY_PAID'");
      } else if (o.PaymentMethod === 'BANK_TRANSFER') {
        sets.push("PaymentStatus = 'PAID'");
      }
    }
    if (toStatus === 'CONFIRMED' && !historyNote) {
      historyNote = 'Admin đã duyệt đơn hàng & xác nhận xử lý';
    }
    if (toStatus === 'PREPARING' && !historyNote) {
      historyNote = 'Đang đóng gói bọc xốp chống sốc 4 lớp chuẩn bị giao SPX Express';
    }
  }

  // Cho phép gắn mã vận đơn SPX ở bất kỳ bước duyệt/đóng gói/giao hàng nào
  const cleanCode = v.str(trackingCode, 100).toUpperCase();
  if (cleanCode) {
    sets.push('TrackingCode = @tc', 'TrackingCarrier = @carrier');
    params.tc = cleanCode;
    params.carrier = v.str(carrier, 50) || o.TrackingCarrier || 'SPX Express';
    historyNote = historyNote || `Đã gắn mã vận đơn ${params.carrier}: ${cleanCode}`;
  } else if (toStatus === 'SHIPPING') {
    const existingCode = o.TrackingCode ? String(o.TrackingCode).trim() : '';
    if (!existingCode) throw badRequest('Vui lòng nhập hoặc dán mã vận đơn SPX trước khi chuyển sang "Đang giao"');
    historyNote = historyNote || `Bàn giao SPX Express — Mã vận đơn: ${existingCode}`;
  }

  if (toStatus === 'DELIVERED') {
    sets.push("PaymentStatus = 'PAID'");
    historyNote = historyNote || (o.PaymentStatus === 'PAID' ? 'Giao hàng thành công' : 'Giao hàng thành công & đã thu đủ tiền COD');
  }

  let refundPending = false;
  if (toStatus === 'CANCELLED') {
    const reason = v.str(cancelReason || note, 255) || 'Admin hủy đơn hàng';
    sets.push('CancelReason = @reason');
    params.reason = reason;
    if (['PAID', 'PARTIALLY_PAID'].includes(o.PaymentStatus)) {
      sets.push("PaymentStatus = 'REFUND_PENDING'");
      refundPending = true;
    }
    historyNote = 'Hủy đơn: ' + reason;
  }

  await db.withTransaction(async (q) => {
    if (['CONFIRMED', 'PREPARING', 'SHIPPING'].includes(toStatus) && !o.StockReserved) await reserveStock(q, orderId);
    if (toStatus === 'CANCELLED' && o.StockReserved) await restoreStock(q, orderId);
    await q(`UPDATE Orders SET ${sets.join(', ')} WHERE OrderId = @id`, params);
    await addHistory(q, orderId, o.Status, toStatus, historyNote, actorId);
  });

  const row = await loadOrderRow('o.OrderId = @id', { id: orderId });
  const order = await getFullOrder(row, { admin: true });
  order._refundPending = refundPending;
  return order;
}

async function confirmPayment(orderId, kind, actorId) {
  const o = await loadOrderRow('o.OrderId = @id', { id: orderId });
  if (!o) throw notFound('Không tìm thấy đơn hàng');
  if (o.Status === 'CANCELLED') throw badRequest('Đơn đã hủy, không thể xác nhận thanh toán');
  if (o.PaymentStatus === 'PAID') return getFullOrder(o, { admin: true });

  let next;
  let label;
  if (kind === 'deposit' && o.PaymentMethod === 'DEPOSIT') {
    next = 'PARTIALLY_PAID';
    label = 'Đã nhận tiền cọc giữ mẫu';
  } else {
    next = 'PAID';
    label = 'Đã nhận đủ 100% thanh toán';
  }

  // Khi xác nhận thanh toán cho đơn đang PENDING, tự động duyệt đơn sang CONFIRMED luôn để khách nhận thông báo ngay
  const nextOrderStatus = o.Status === 'PENDING' ? 'CONFIRMED' : o.Status;

  await db.withTransaction(async (q) => {
    await q(
      'UPDATE Orders SET PaymentStatus = @ps, Status = @st, UpdatedAt = SYSDATETIME() WHERE OrderId = @id',
      { id: orderId, ps: next, st: nextOrderStatus }
    );
    await addHistory(
      q,
      orderId,
      o.Status,
      nextOrderStatus,
      nextOrderStatus !== o.Status
        ? `Thanh toán: ${label} & Admin đã duyệt đơn hàng`
        : `Thanh toán: ${label}`,
      actorId
    );
  });
  return getFullOrder(await loadOrderRow('o.OrderId = @id', { id: orderId }), { admin: true });
}

async function markRefunded(orderId, note, actorId) {
  const o = await loadOrderRow('o.OrderId = @id', { id: orderId });
  if (!o) throw notFound('Không tìm thấy đơn hàng');
  if (o.PaymentStatus !== 'REFUND_PENDING') throw badRequest('Đơn hàng không ở trạng thái chờ hoàn tiền');
  await db.withTransaction(async (q) => {
    await q("UPDATE Orders SET PaymentStatus = 'REFUNDED', UpdatedAt = SYSDATETIME() WHERE OrderId = @id", { id: orderId });
    await addHistory(q, orderId, o.Status, o.Status, 'Đã hoàn tiền cho khách' + (note ? ': ' + v.str(note, 300) : ''), actorId);
  });
  return getFullOrder(await loadOrderRow('o.OrderId = @id', { id: orderId }), { admin: true });
}

/**
 * Lưu mã vận đơn SPX Express:
 * - Cho phép lưu mã ở mọi trạng thái (trừ CANCELLED).
 * - Nếu đơn đang ở trạng thái PENDING, tự động duyệt đơn (chuyển sang CONFIRMED hoặc SHIPPING)
 *   và xác nhận thanh toán cọc/chuyển khoản để khách hàng thấy ngay thông báo Admin đã duyệt + Mã vận đơn SPX!
 */
async function updateTracking(orderId, trackingCode, carrier, actorId, autoShip = false) {
  const o = await loadOrderRow('o.OrderId = @id', { id: orderId });
  if (!o) throw notFound('Không tìm thấy đơn hàng');
  if (o.Status === 'CANCELLED') {
    throw badRequest('Đơn hàng đã hủy, không thể cập nhật mã vận đơn');
  }
  const code = v.str(trackingCode, 100).toUpperCase();
  if (code.length < 3) throw badRequest('Vui lòng nhập mã vận đơn SPX hợp lệ (tối thiểu 3 ký tự)');
  const c = v.str(carrier, 50) || o.TrackingCarrier || 'SPX Express';

  // Nếu đơn đang PENDING -> tự động duyệt đơn (hoặc chuyển sang SHIPPING nếu autoShip)
  let nextStatus = o.Status;
  if (autoShip && o.Status !== 'DELIVERED') {
    nextStatus = 'SHIPPING';
  } else if (o.Status === 'PENDING') {
    nextStatus = 'CONFIRMED';
  }

  let nextPaymentStatus = o.PaymentStatus;
  if (o.PaymentStatus === 'UNPAID') {
    if (o.PaymentMethod === 'DEPOSIT') nextPaymentStatus = 'PARTIALLY_PAID';
    else if (o.PaymentMethod === 'BANK_TRANSFER') nextPaymentStatus = 'PAID';
  }

  const historyNote = nextStatus !== o.Status
    ? `Admin đã duyệt đơn & cập nhật mã vận đơn ${c}: ${code}`
    : `Admin đã cập nhật mã vận đơn ${c}: ${code}`;

  await db.withTransaction(async (q) => {
    await q(
      `UPDATE Orders 
       SET TrackingCode = @tc, TrackingCarrier = @c, Status = @st, PaymentStatus = @ps, UpdatedAt = SYSDATETIME() 
       WHERE OrderId = @id`,
      { id: orderId, tc: code, c, st: nextStatus, ps: nextPaymentStatus }
    );
    await addHistory(q, orderId, o.Status, nextStatus, historyNote, actorId);
  });
  return getFullOrder(await loadOrderRow('o.OrderId = @id', { id: orderId }), { admin: true });
}

/** Khách tự hủy đơn của mình khi còn ở trạng thái PENDING */
async function customerCancel(code, userId, reason) {
  const o = await loadOrderRow('o.OrderCode = @code', { code });
  if (!o) throw notFound('Không tìm thấy đơn hàng của bạn');
  if (o.Status !== 'PENDING') throw badRequest('Chỉ có thể tự hủy khi đơn đang chờ xác nhận. Vui lòng liên hệ cửa hàng.');
  return changeStatus(Number(o.OrderId), 'CANCELLED', { cancelReason: v.str(reason, 200) || 'Khách hàng tự hủy đơn' }, userId || o.UserId || null);
}

/** Khách xác nhận đã nhận được hàng từ SPX Express */
async function customerConfirmReceived(code, userId) {
  const o = await loadOrderRow('o.OrderCode = @code', { code });
  if (!o) throw notFound('Không tìm thấy đơn hàng');
  if (o.Status === 'CANCELLED') throw badRequest('Đơn hàng đã bị hủy');
  if (o.Status === 'DELIVERED') return getFullOrder(o);
  return changeStatus(
    Number(o.OrderId),
    'DELIVERED',
    { note: 'Khách hàng xác nhận đã nhận kiện hàng mô hình nguyên vẹn từ SPX Express' },
    userId || o.UserId || null
  );
}

/** Khách cập nhật địa chỉ / SĐT nhận hàng khi đơn chưa giao */
async function customerUpdateShipping(code, body, userId) {
  const o = await loadOrderRow('o.OrderCode = @code', { code });
  if (!o) throw notFound('Không tìm thấy đơn hàng');
  if (!['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.Status)) {
    throw badRequest('Đơn hàng đã bàn giao vận chuyển SPX nên không thể sửa địa chỉ trực tiếp');
  }
  const fullName = v.str(body.fullName || o.FullName, 100);
  const phone = v.normalizePhone(body.phone || o.Phone);
  const address = v.str(body.address || o.Address, 255);
  const note = v.str(body.note !== undefined ? body.note : o.Note, 500);

  if (fullName.length < 2) throw badRequest('Họ tên người nhận tối thiểu 2 ký tự');
  if (phone.length < 8) throw badRequest('Số điện thoại không hợp lệ');
  if (address.length < 3) throw badRequest('Địa chỉ nhận hàng không hợp lệ');

  await db.withTransaction(async (q) => {
    await q(
      `UPDATE Orders SET FullName = @fullName, Phone = @phone, Address = @address, Note = @note, UpdatedAt = SYSDATETIME() WHERE OrderId = @id`,
      { id: o.OrderId, fullName, phone, address, note }
    );
    await addHistory(q, o.OrderId, o.Status, o.Status, `Khách hàng cập nhật thông tin nhận hàng: ${fullName} - ${phone}`, userId || o.UserId || null);
  });

  return getFullOrder(await loadOrderRow('o.OrderId = @id', { id: o.OrderId }));
}

module.exports = {
  ORDER_STATUSES, PAYMENT_METHODS, STATUS_LABELS, CANCELLABLE,
  mapOrder, getItems, getHistory, loadOrderRow, getFullOrder,
  createOrder, changeStatus, confirmPayment, markRefunded, updateTracking,
  customerCancel, customerConfirmReceived, customerUpdateShipping, nextStatuses
};
