/**
 * ORDER SERVICE — MÁY TRẠNG THÁI ĐƠN HÀNG & QUẢN LÝ TỒN KHO TRANSACTIONAL (SUPABASE POSTGRESQL)
 */
const db = require('../config/db');
const { getSettings } = require('./settingsService');
const { calcDiscountedPrice } = require('./productService');
const { badRequest, notFound, conflict } = require('../utils/http');
const v = require('../utils/validate');

const ALLOWED_TRANSITIONS = {
  PENDING:   ['CONFIRMED', 'PREPARING', 'SHIPPING', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED'],
  PREPARING: ['SHIPPING', 'DELIVERED', 'CANCELLED'],
  SHIPPING:  ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: []
};

function generateOrderCode() {
  const d = new Date();
  const ymd = d.getFullYear().toString()
    + String(d.getMonth() + 1).padStart(2, '0')
    + String(d.getDate()).padStart(2, '0');
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `MGT-${ymd}-${rnd}`;
}

async function createOrder(payload, authUser = null) {
  const fullName = v.cleanStr(payload.fullName, 100);
  const phone = v.cleanStr(payload.phone, 20);
  const email = v.cleanStr(payload.email, 150);
  const address = v.cleanStr(payload.address, 255);
  const note = v.cleanStr(payload.note, 500);

  const rawPay = String(payload.paymentMethod || 'BANK_TRANSFER').toUpperCase();
  const paymentMethod = ['COD', 'BANK_TRANSFER', 'DEPOSIT'].includes(rawPay)
    ? rawPay
    : (rawPay === 'VIETQR' || rawPay === 'BANK' || rawPay === 'FULL_TRANSFER' ? 'BANK_TRANSFER' : 'COD');

  const rawShip = String(payload.shippingMethod || 'SPX').toUpperCase();
  const shippingMethod = rawShip.includes('PICKUP')
    ? 'PICKUP'
    : (rawShip.includes('BOX_SAVER') ? 'BOX_SAVER' : 'SPX');

  if (fullName.length < 2) throw badRequest('Vui lòng nhập họ tên người nhận (tối thiểu 2 ký tự)');
  if (!v.isVNPhone(phone)) throw badRequest('Số điện thoại không đúng định dạng Việt Nam');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw badRequest('Địa chỉ Email không hợp lệ');
  if (shippingMethod === 'SPX' && address.length < 5) {
    throw badRequest('Vui lòng nhập địa chỉ nhận hàng chi tiết');
  }

  const reqItems = Array.isArray(payload.items) ? payload.items : [];
  if (reqItems.length === 0) throw badRequest('Giỏ hàng đang trống');

  const merged = new Map();
  for (const raw of reqItems) {
    const pid = v.posInt(raw.productId || raw.ProductId || raw.id, 0);
    const qty = v.posInt(raw.quantity || raw.Quantity, 0);
    const packType = String(raw.packType || raw.packagingOption || 'box').toLowerCase() === 'card' ? 'card' : 'box';
    if (!pid || !qty) throw badRequest('Sản phẩm hoặc số lượng trong giỏ không hợp lệ');
    const key = `${pid}_${packType}`;
    const prev = merged.get(key);
    merged.set(key, {
      productId: pid,
      packType,
      quantity: (prev ? prev.quantity : 0) + qty
    });
  }

  const cfg = await getSettings();

  return await db.withTransaction(async (q) => {
    const lineItems = [];
    let subtotal = 0;
    let depositRequired = 0;
    let hasPreOrder = false;
    let preOrderExpected = null;

    for (const entry of merged.values()) {
      const { productId, packType, quantity } = entry;
      const pRes = await q(`
        SELECT ProductId, Sku, Name, Price, OldPrice, PriceBox, PriceCard, DiscountPercent,
               PackagingType, DepositAmount, DepositPercent, ExpectedDelivery, ReleaseDate,
               Stock, Status, IsActive
        FROM Products
        WHERE ProductId = @pid
      `, { pid: productId });

      if (pRes.recordset.length === 0 || !pRes.recordset[0].IsActive) {
        throw badRequest(`Sản phẩm #${productId} không tồn tại hoặc đã ngừng kinh doanh`);
      }
      const p = pRes.recordset[0];
      const isPreOrder = p.Status === 'pre_order';
      if (isPreOrder) {
        hasPreOrder = true;
        if (p.ExpectedDelivery && !preOrderExpected) {
          preOrderExpected = p.ExpectedDelivery;
        } else if (p.ReleaseDate && !preOrderExpected) {
          preOrderExpected = `Tháng ${new Date(p.ReleaseDate).getMonth() + 1}/${new Date(p.ReleaseDate).getFullYear()}`;
        }
      }

      if (p.Status === 'sold_out' || (!isPreOrder && p.Stock < quantity)) {
        throw conflict(`"${p.Name}" chỉ còn ${p.Stock} sản phẩm trong kho (bạn chọn ${quantity})`);
      }

      await q(`
        UPDATE Products
        SET Stock = CASE WHEN Stock >= @qty THEN Stock - @qty ELSE 0 END,
            Status = CASE WHEN Stock - @qty <= 0 AND Status = 'in_stock' THEN 'sold_out' ELSE Status END,
            UpdatedAt = NOW()
        WHERE ProductId = @pid
      `, { pid: productId, qty: quantity });

      const effectivePack = p.PackagingType === 'card_only'
        ? 'card'
        : (p.PackagingType === 'box_only' ? 'box' : packType);

      const disc = Math.min(80, Math.max(0, Number(p.DiscountPercent || 0)));
      const baseBox = Number(p.PriceBox || 0) > 0 ? Number(p.PriceBox) : Number(p.Price);
      const baseCard = Number(p.PriceCard || 0) > 0 ? Number(p.PriceCard) : (p.PackagingType === 'box_only' ? baseBox : baseBox + 60000);
      const finalBox = disc > 0 ? calcDiscountedPrice(baseBox, disc) : Number(p.Price || baseBox);
      const finalCard = disc > 0 ? calcDiscountedPrice(baseCard, disc) : baseCard;

      const unitPrice = effectivePack === 'card' ? finalCard : finalBox;
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;

      const depPct = Number(p.DepositPercent || (p.DepositAmount && unitPrice > 0 ? Math.round((Number(p.DepositAmount) / unitPrice) * 100) : 30));
      const unitDeposit = isPreOrder ? Math.round((unitPrice * (depPct / 100)) / 1000) * 1000 : 0;
      depositRequired += unitDeposit * quantity;

      lineItems.push({
        productId: p.ProductId,
        productName: p.Name,
        packagingOption: effectivePack,
        unitPrice,
        quantity,
        lineTotal,
        isPreOrder,
        expectedDelivery: p.ExpectedDelivery || null
      });
    }

    const baseShipping = Number(cfg.shipping_fee) || 11000;
    const freeThreshold = Number(cfg.free_shipping_threshold) || 0;
    let shippingFee = (shippingMethod === 'PICKUP' || shippingMethod === 'BOX_SAVER')
      ? 0
      : (freeThreshold > 0 && subtotal >= freeThreshold ? 0 : baseShipping);

    const protectorFee = (payload.boxProtector || Number(payload.protectorFee) > 0) ? 15000 : 0;
    const voucherCode = String(payload.voucherCode || '').trim().toUpperCase();
    let voucherDiscount = 0;
    if (voucherCode) {
      try {
        const couponService = require('./couponService');
        const vRes = await couponService.validateAndApplyCoupon(voucherCode, subtotal, authUser);
        if (vRes && vRes.valid) {
          voucherDiscount = Number(vRes.discount || 0);
        }
      } catch (e) {
        console.warn('[ORDER] Lỗi kiểm tra voucher:', e.message);
      }
    }

    const total = Math.max(0, subtotal + shippingFee + protectorFee - voucherDiscount);
    let finalPaymentMethod = paymentMethod;
    if (hasPreOrder) finalPaymentMethod = 'DEPOSIT';

    // KIỂM TRA ĐIỀU KIỆN SHIP COD 100% PHÒNG CHỐNG BOM ĐƠN
    if (finalPaymentMethod === 'COD') {
      let isCodEligible = false;
      if (authUser && authUser.userId) {
        const userDeliveredRes = await q(`
          SELECT COALESCE(SUM(Total), 0) AS total_delivered
          FROM Orders
          WHERE UserId = @uid AND Status = 'DELIVERED'
        `, { uid: authUser.userId });
        const deliveredSum = Number(userDeliveredRes.recordset[0]?.total_delivered || 0);
        if (deliveredSum >= 1000001) {
          isCodEligible = true;
        }
      }
      if (!isCodEligible) {
        throw badRequest('Phương thức "Thanh toán khi nhận hàng (Ship COD 100%)" chỉ dành cho thành viên VIP 4 trở lên (đã từng tích lũy mua và nhận hàng thành công từ 1.000.001đ trở lên) để đảm bảo an toàn đơn hàng và chống bom đơn. Vui lòng chọn Đặt cọc 30% hoặc Chuyển khoản VietQR MB Bank!');
      }
    }

    const depositAmount = finalPaymentMethod === 'DEPOSIT'
      ? Math.min(total, depositRequired || Math.round(total * 0.3))
      : (finalPaymentMethod === 'BANK_TRANSFER' ? total : 0);

    const orderCode = generateOrderCode();
    const oIns = await q(`
      INSERT INTO Orders
        (OrderCode, UserId, FullName, Phone, Email, Address, Note,
         ShippingMethod, PaymentMethod, PaymentStatus,
         Subtotal, ShippingFee, Total, DepositAmount, StockReserved,
         HasPreOrder, PreOrderExpected, Status)
      VALUES
        (@code, @uid, @name, @phone, @email, @addr, @note,
         @shipMethod, @payMethod, 'UNPAID',
         @sub, @ship, @tot, @dep, TRUE,
         @hasPre, @preExp, 'PENDING')
      RETURNING *
    `, {
      code: orderCode,
      uid: authUser ? authUser.userId : null,
      name: fullName,
      phone: phone,
      email: email || null,
      addr: shippingMethod === 'PICKUP' && !address ? 'Nhận tại cửa hàng' : address,
      note: note || null,
      shipMethod: shippingMethod,
      payMethod: finalPaymentMethod,
      sub: subtotal,
      ship: shippingFee,
      tot: total,
      dep: depositAmount,
      hasPre: hasPreOrder,
      preExp: preOrderExpected || (hasPreOrder ? 'Tháng 11/2026' : null)
    });
    const order = oIns.recordset[0];

    for (const it of lineItems) {
      await q(`
        INSERT INTO OrderItems (OrderId, ProductId, ProductName, PackagingOption, UnitPrice, Quantity)
        VALUES (@oid, @pid, @pname, @pack, @uprice, @qty)
      `, {
        oid: order.OrderId,
        pid: it.productId,
        pname: it.productName,
        pack: it.packagingOption,
        uprice: it.unitPrice,
        qty: it.quantity
      });
    }

    await q(`
      INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
      VALUES (@oid, NULL, 'PENDING', 'Khách tạo đơn và giữ hàng', @by)
    `, {
      oid: order.OrderId,
      by: authUser ? authUser.userId : null
    });

    return mapOrder(order, lineItems);
  });
}

async function transitionOrderStatus(orderIdOrCode, toStatus, { note, cancelReason, actorId = null, isAdmin = false, trackingCode = null, trackingCarrier = null } = {}) {
  const target = String(toStatus || '').toUpperCase();
  if (!ALLOWED_TRANSITIONS[target] && target !== 'DELIVERED' && target !== 'CANCELLED') {
    throw badRequest(`Trạng thái "${toStatus}" không hợp lệ`);
  }

  return await db.withTransaction(async (q) => {
    const isNum = /^\d+$/.test(String(orderIdOrCode));
    const oRes = await q(`
      SELECT * FROM Orders
      WHERE ${isNum ? 'OrderId = @val' : 'OrderCode = @val'}
    `, { val: isNum ? parseInt(orderIdOrCode, 10) : String(orderIdOrCode) });

    if (oRes.recordset.length === 0) throw notFound('Không tìm thấy đơn hàng');
    const order = oRes.recordset[0];

    const fromStatus = String(order.Status).toUpperCase();
    if (fromStatus === target) {
      return getOrderByCodeOrId(order.OrderId);
    }

    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(target)) {
      throw conflict(`Không thể chuyển đơn từ "${fromStatus}" sang "${target}"`);
    }

    if (!isAdmin && !(fromStatus === 'PENDING' && target === 'CANCELLED')) {
      throw conflict('Bạn chỉ có thể hủy đơn khi đơn đang ở trạng thái Chờ xác nhận');
    }

    if (target === 'CANCELLED' && order.StockReserved) {
      const itemsRes = await q('SELECT ProductId, Quantity FROM OrderItems WHERE OrderId = @oid', { oid: order.OrderId });
      for (const it of itemsRes.recordset) {
        await q(`
          UPDATE Products
          SET Stock = Stock + @qty,
              Status = CASE WHEN Status = 'sold_out' AND Stock + @qty > 0 THEN 'in_stock' ELSE Status END,
              UpdatedAt = NOW()
          WHERE ProductId = @pid
        `, { pid: it.ProductId, qty: it.Quantity });
      }
    }

    if (target !== 'CANCELLED' && !order.StockReserved) {
      const itemsRes = await q('SELECT ProductId, Quantity FROM OrderItems WHERE OrderId = @oid', { oid: order.OrderId });
      for (const it of itemsRes.recordset) {
        await q('UPDATE Products SET Stock = CASE WHEN Stock >= @qty THEN Stock - @qty ELSE 0 END WHERE ProductId = @pid', { pid: it.ProductId, qty: it.Quantity });
      }
    }

    let newPayStatus = order.PaymentStatus;
    if (target === 'DELIVERED' && order.PaymentMethod === 'COD') {
      newPayStatus = 'PAID';
    } else if (target === 'CANCELLED' && (order.PaymentStatus === 'PAID' || order.PaymentStatus === 'PARTIALLY_PAID')) {
      newPayStatus = 'REFUND_PENDING';
    } else if (['CONFIRMED', 'PREPARING', 'SHIPPING'].includes(target) && order.PaymentStatus === 'UNPAID') {
      if (order.PaymentMethod === 'DEPOSIT') newPayStatus = 'PARTIALLY_PAID';
      else if (order.PaymentMethod === 'BANK_TRANSFER') newPayStatus = 'PAID';
    }

    const newReserved = target === 'CANCELLED' ? false : true;
    await q(`
      UPDATE Orders
      SET Status = @st,
          PaymentStatus = @pst,
          StockReserved = @res,
          CancelReason = @reason,
          TrackingCode = @tCode,
          TrackingCarrier = @tCarrier,
          UpdatedAt = NOW()
      WHERE OrderId = @oid
    `, {
      oid: order.OrderId,
      st: target,
      pst: newPayStatus,
      res: newReserved,
      reason: target === 'CANCELLED' ? (cancelReason || note || 'Đã hủy') : order.CancelReason,
      tCode: trackingCode ? v.cleanStr(trackingCode, 100) : order.TrackingCode,
      tCarrier: trackingCarrier ? v.cleanStr(trackingCarrier, 50) : (trackingCode ? (order.TrackingCarrier || 'SPX Express') : order.TrackingCarrier)
    });

    await q(`
      INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
      VALUES (@oid, @from, @to, @note, @by)
    `, {
      oid: order.OrderId,
      from: fromStatus,
      to: target,
      note: v.cleanStr(cancelReason || note || '', 500) || null,
      by: actorId
    });

    return getOrderByCodeOrId(order.OrderId);
  });
}

async function updatePaymentStatus(orderId, paymentStatus, { actorId = null, note = null } = {}) {
  const allowed = ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUND_PENDING', 'REFUNDED'];
  const target = String(paymentStatus || '').toUpperCase();
  if (!allowed.includes(target)) throw badRequest('Trạng thái thanh toán không hợp lệ');

  const cur = await db.query('SELECT OrderId, Status, PaymentStatus FROM Orders WHERE OrderId = @id', { id: Number(orderId) });
  if (!cur.recordset.length) throw notFound('Không tìm thấy đơn hàng');

  const currentStatus = cur.recordset[0].Status;
  const nextStatus = (currentStatus === 'PENDING' && (target === 'PAID' || target === 'PARTIALLY_PAID'))
    ? 'CONFIRMED'
    : currentStatus;

  await db.query(`
    UPDATE Orders
    SET PaymentStatus = @pst, Status = @st, UpdatedAt = NOW()
    WHERE OrderId = @id
  `, { id: Number(orderId), pst: target, st: nextStatus });

  await db.query(`
    INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
    VALUES (@id, @st, @nextSt, @note, @by)
  `, {
    id: Number(orderId),
    st: currentStatus,
    nextSt: nextStatus,
    note: note || `Cập nhật thanh toán → ${target}`,
    by: actorId
  });

  return getOrderByCodeOrId(orderId);
}

function mapOrder(o, items = [], history = []) {
  const mappedHistory = (history || []).map(h => ({
    historyId: h.HistoryId || h.historyid,
    from: h.FromStatus || h.from || h.fromstatus || null,
    to: h.ToStatus || h.to || h.tostatus || h.newStatus || 'PENDING',
    newStatus: h.ToStatus || h.to || h.tostatus || h.newStatus || 'PENDING',
    note: h.Note || h.note || '',
    createdAt: h.CreatedAt || h.createdat,
    by: h.ChangedByName || h.by || null
  }));

  return {
    id: o.OrderId || o.orderid,
    orderId: o.OrderId || o.orderid,
    code: o.OrderCode || o.ordercode,
    orderCode: o.OrderCode || o.ordercode,
    userId: o.UserId || o.userid,
    fullName: o.FullName || o.fullname,
    phone: o.Phone || o.phone,
    email: o.Email || o.email,
    address: o.Address || o.address,
    customer: {
      fullName: o.FullName || o.fullname,
      phone: o.Phone || o.phone,
      email: o.Email || o.email || '',
      address: o.Address || o.address
    },
    note: o.Note || o.note,
    shippingMethod: o.ShippingMethod || o.shippingmethod || 'SPX',
    paymentMethod: o.PaymentMethod || o.paymentmethod,
    paymentStatus: o.PaymentStatus || o.paymentstatus,
    status: o.Status || o.status,
    cancelReason: o.CancelReason || o.cancelreason,
    hasPreOrder: Boolean(o.HasPreOrder ?? o.haspreorder),
    preOrderExpected: o.PreOrderExpected || o.preorderexpected || null,
    preOrderNotified: Boolean(o.PreOrderNotified ?? o.preordernotified),
    receiptImage: o.ReceiptImage || o.receiptimage,
    trackingCode: o.TrackingCode || o.trackingcode || null,
    trackingCarrier: o.TrackingCarrier || o.trackingcarrier || null,
    subtotal: Number(o.Subtotal || o.subtotal || 0),
    shippingFee: Number(o.ShippingFee || o.shippingfee || 0),
    total: Number(o.Total || o.total || 0),
    totalAmount: Number(o.Total || o.total || 0),
    depositAmount: Number(o.DepositAmount || o.depositamount || 0),
    createdAt: o.CreatedAt || o.createdat,
    updatedAt: o.UpdatedAt || o.updatedat,
    items,
    history: mappedHistory,
    timeline: mappedHistory
  };
}

async function getOrderByCodeOrId(idOrCode) {
  const isNum = /^\d+$/.test(String(idOrCode));
  const oRes = await db.query(
    `SELECT * FROM Orders WHERE ${isNum ? 'OrderId = @v' : 'OrderCode = @v'}`,
    { v: isNum ? parseInt(idOrCode, 10) : String(idOrCode).trim().toUpperCase() }
  );
  if (!oRes.recordset.length) return null;
  const o = oRes.recordset[0];
  const oid = o.OrderId || o.orderid;

  const [iRes, hRes] = await Promise.all([
    db.query(`
      SELECT oi.OrderItemId, oi.ProductId, oi.ProductName, oi.PackagingOption, oi.UnitPrice, oi.Quantity, oi.LineTotal,
             p.Sku, p.ImageUrl, p.Status AS ProductStatus
      FROM OrderItems oi
      LEFT JOIN Products p ON oi.ProductId = p.ProductId
      WHERE oi.OrderId = @oid
    `, { oid }),
    db.query(`
      SELECT h.HistoryId, h.FromStatus, h.ToStatus, h.Note, h.CreatedAt, u.FullName AS ChangedByName
      FROM OrderStatusHistory h
      LEFT JOIN Users u ON h.ChangedBy = u.UserId
      WHERE h.OrderId = @oid
      ORDER BY h.CreatedAt ASC
    `, { oid })
  ]);

  const items = iRes.recordset.map(i => {
    const packOpt = i.PackagingOption || i.packagingoption || 'box';
    return {
      orderItemId: i.OrderItemId || i.orderitemid,
      productId: i.ProductId || i.productid,
      name: i.ProductName || i.productname,
      productName: i.ProductName || i.productname,
      packagingOption: packOpt,
      packagingLabel: packOpt === 'card' ? 'Bản Card (Vỉ Blister)' : 'Bản Box (Hộp giấy)',
      unitPrice: Number(i.UnitPrice || i.unitprice || 0),
      quantity: i.Quantity || i.quantity || 1,
      lineTotal: Number(i.LineTotal || i.linetotal || 0),
      sku: i.Sku || i.sku,
      productSku: i.Sku || i.sku,
      imageUrl: i.ImageUrl || i.imageurl,
      productImage: i.ImageUrl || i.imageurl,
      orderType: (i.ProductStatus || i.productstatus) === 'pre_order' ? 'PRE_ORDER' : 'IN_STOCK'
    };
  });

  return mapOrder(o, items, hRes.recordset);
}

async function listOrders({ status, paymentStatus, paymentMethod, q, userId, phone, page = 1, pageSize = 50 } = {}) {
  const where = [];
  const params = {};
  if (status === 'PRE_ORDER' || status === 'PREORDER') {
    where.push('o.HasPreOrder = TRUE');
  } else if (status && status !== 'all' && status !== 'ALL') {
    where.push('o.Status = @status');
    params.status = String(status).toUpperCase();
  }
  if (paymentStatus && paymentStatus !== 'all' && paymentStatus !== 'ALL') {
    where.push('o.PaymentStatus = @payStatus');
    params.payStatus = String(paymentStatus).toUpperCase();
  }
  if (paymentMethod && paymentMethod !== 'all' && paymentMethod !== 'ALL') {
    where.push('o.PaymentMethod = @payMethod');
    params.payMethod = String(paymentMethod).toUpperCase();
  }
  if (userId) {
    where.push('o.UserId = @uid');
    params.uid = Number(userId);
  }
  if (phone) {
    where.push('o.Phone = @phone');
    params.phone = v.cleanPhone(phone);
  }
  if (q && String(q).trim()) {
    where.push('(o.OrderCode ILIKE @q OR o.FullName ILIKE @q OR o.Phone ILIKE @q OR o.TrackingCode ILIKE @q)');
    params.q = `%${String(q).trim()}%`;
  }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50));
  params.offset = (p - 1) * ps;
  params.ps = ps;

  const [cRes, dRes] = await Promise.all([
    db.query(`SELECT COUNT(*) AS Total FROM Orders o ${whereClause}`, params),
    db.query(`
      SELECT o.*
      FROM Orders o
      ${whereClause}
      ORDER BY o.CreatedAt DESC
      LIMIT @ps OFFSET @offset
    `, params)
  ]);

  const orders = dRes.recordset;
  if (!orders.length) {
    return { items: [], total: 0, page: p, pageSize: ps, totalPages: 1 };
  }

  const ids = orders.map(o => o.OrderId || o.orderid).join(',');
  const itemsRes = await db.query(`
    SELECT oi.OrderId, oi.OrderItemId, oi.ProductId, oi.ProductName, oi.PackagingOption, oi.UnitPrice, oi.Quantity, oi.LineTotal,
           p.Sku, p.ImageUrl, p.Status AS ProductStatus
    FROM OrderItems oi
    LEFT JOIN Products p ON oi.ProductId = p.ProductId
    WHERE oi.OrderId IN (${ids})
  `);

  const byOrder = new Map();
  for (const row of itemsRes.recordset) {
    const key = String(row.OrderId || row.orderid);
    if (!byOrder.has(key)) byOrder.set(key, []);
    const packOpt = row.PackagingOption || row.packagingoption || 'box';
    byOrder.get(key).push({
      orderItemId: row.OrderItemId || row.orderitemid,
      productId: row.ProductId || row.productid,
      name: row.ProductName || row.productname,
      productName: row.ProductName || row.productname,
      packagingOption: packOpt,
      packagingLabel: packOpt === 'card' ? 'Bản Card (Vỉ Blister)' : 'Bản Box (Hộp giấy)',
      unitPrice: Number(row.UnitPrice || row.unitprice || 0),
      quantity: row.Quantity || row.quantity || 1,
      lineTotal: Number(row.LineTotal || row.linetotal || 0),
      sku: row.Sku || row.sku,
      productSku: row.Sku || row.sku,
      imageUrl: row.ImageUrl || row.imageurl,
      productImage: row.ImageUrl || row.imageurl,
      orderType: (row.ProductStatus || row.productstatus) === 'pre_order' ? 'PRE_ORDER' : 'IN_STOCK'
    });
  }

  const total = Number(cRes.recordset[0]?.Total || cRes.recordset[0]?.total || 0);
  return {
    items: orders.map(o => mapOrder(o, byOrder.get(String(o.OrderId || o.orderid)) || [])),
    total,
    page: p,
    pageSize: ps,
    totalPages: Math.max(1, Math.ceil(total / ps))
  };
}

module.exports = {
  ALLOWED_TRANSITIONS,
  createOrder,
  transitionOrderStatus,
  updatePaymentStatus,
  getOrderByCodeOrId,
  listOrders
};