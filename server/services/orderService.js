/**
 * ORDER SERVICE — MÁY TRẠNG THÁI ĐƠN HÀNG & QUẢN LÝ TỒN KHO TRANSACTIONAL (SQL SERVER 2026)
 *
 *  - Hỗ trợ Giá Bản Box & Bản Card (Blister), % Giảm giá trực tiếp, Box Saver, PVC Protector & Voucher
 *  - State machine chặt chẽ: PENDING → CONFIRMED → PREPARING → SHIPPING → DELIVERED (hoặc CANCELLED)
 *  - Trừ tồn kho ngay khi đặt đơn giữ suất trong SQL Transaction với UPDLOCK, HOLDLOCK
 */
const { sql, getPool, query } = require('../config/db');
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

/**
 * Tạo đơn hàng mới từ giỏ hàng.
 * Toàn bộ: kiểm tra tồn kho, trừ kho, tính giá Box/Card thực tế, tạo Orders + OrderItems + OrderStatusHistory
 * chạy trong 1 SQL Transaction.
 */
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
  if (!v.isVNPhone(phone)) throw badRequest('Số điện thoại không đúng định dạng Việt Nam (10–11 số, bắt đầu bằng 0)');
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
  if (merged.size > 50) throw badRequest('Đơn hàng vượt quá số dòng sản phẩm cho phép');

  const cfg = await getSettings();
  const pool = await getPool();
  if (!pool) throw new Error('Không kết nối được SQL Server');

  const tx = new sql.Transaction(pool);
  await tx.begin(sql.ISOLATION_LEVEL.REPEATABLE_READ);

  try {
    const lineItems = [];
    let subtotal = 0;
    let depositRequired = 0;
    let hasPreOrder = false;
    let preOrderExpected = null;

    for (const entry of merged.values()) {
      const { productId, packType, quantity } = entry;
      const rReq = new sql.Request(tx);
      rReq.input('pid', sql.Int, productId);
      const pRes = await rReq.query(`
        SELECT ProductId, Sku, Name, Price, OldPrice, PriceBox, PriceCard, DiscountPercent,
               PackagingType, DepositAmount, DepositPercent, ExpectedDelivery, ReleaseDate,
               Stock, Status, IsActive
        FROM dbo.Products WITH (UPDLOCK, HOLDLOCK)
        WHERE ProductId = @pid
      `);

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

      const uReq = new sql.Request(tx);
      uReq.input('pid', sql.Int, productId);
      uReq.input('qty', sql.Int, quantity);
      await uReq.query(`
        UPDATE dbo.Products
        SET Stock = CASE WHEN Stock >= @qty THEN Stock - @qty ELSE 0 END,
            Status = CASE WHEN Stock - @qty <= 0 AND Status = 'in_stock' THEN 'sold_out' ELSE Status END,
            UpdatedAt = SYSDATETIME()
        WHERE ProductId = @pid
      `);

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

      const depPct = Number(p.DepositPercent || 30);
      const unitDeposit = p.DepositAmount && Number(p.DepositAmount) > 0
        ? Number(p.DepositAmount)
        : Math.round((unitPrice * (depPct / 100)) / 1000) * 1000;
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
    if (voucherCode === 'MINIGT2026') voucherDiscount = 20000;
    else if (voucherCode === 'FREESHIP') voucherDiscount = shippingFee;
    else if (voucherCode === 'LBWK50K' && subtotal >= 850000) voucherDiscount = 50000;
    else if (Number(payload.voucherDiscount) > 0) voucherDiscount = Math.min(50000, Number(payload.voucherDiscount));

    const total = Math.max(0, subtotal + shippingFee + protectorFee - voucherDiscount);

    // QUY TẮC BẮT BUỘC PRE-ORDER: Không áp dụng thanh toán Full 100% hay COD!
    // Bắt buộc chuyển sang hình thức Đặt cọc giữ xe qua MB Bank!
    let finalPaymentMethod = paymentMethod;
    if (hasPreOrder) {
      finalPaymentMethod = 'DEPOSIT';
    }

    const depositAmount = finalPaymentMethod === 'DEPOSIT'
      ? Math.min(total, depositRequired || Math.round(total * 0.3))
      : (finalPaymentMethod === 'BANK_TRANSFER' ? total : 0);

    const orderCode = generateOrderCode();
    const oReq = new sql.Request(tx);
    oReq.input('code', sql.VarChar(30), orderCode);
    oReq.input('uid', sql.Int, authUser ? authUser.userId : null);
    oReq.input('name', sql.NVarChar(100), fullName);
    oReq.input('phone', sql.VarChar(20), phone);
    oReq.input('email', sql.VarChar(150), email || null);
    oReq.input('addr', sql.NVarChar(255), shippingMethod === 'PICKUP' && !address ? 'Nhận tại cửa hàng' : address);
    oReq.input('note', sql.NVarChar(500), note || null);
    oReq.input('shipMethod', sql.VarChar(20), shippingMethod);
    oReq.input('payMethod', sql.VarChar(30), finalPaymentMethod);
    oReq.input('sub', sql.Decimal(18, 2), subtotal);
    oReq.input('ship', sql.Decimal(18, 2), shippingFee);
    oReq.input('tot', sql.Decimal(18, 2), total);
    oReq.input('dep', sql.Decimal(18, 2), depositAmount);
    oReq.input('hasPre', sql.Bit, hasPreOrder ? 1 : 0);
    oReq.input('preExp', sql.NVarChar(100), preOrderExpected || (hasPreOrder ? 'Tháng 11/2026' : null));

    const oIns = await oReq.query(`
      INSERT INTO dbo.Orders
        (OrderCode, UserId, FullName, Phone, Email, Address, Note,
         ShippingMethod, PaymentMethod, PaymentStatus,
         Subtotal, ShippingFee, Total, DepositAmount, StockReserved,
         HasPreOrder, PreOrderExpected, Status)
      OUTPUT INSERTED.*
      VALUES
        (@code, @uid, @name, @phone, @email, @addr, @note,
         @shipMethod, @payMethod, 'UNPAID',
         @sub, @ship, @tot, @dep, 1,
         @hasPre, @preExp, 'PENDING')
    `);
    const order = oIns.recordset[0];

    for (const it of lineItems) {
      const iReq = new sql.Request(tx);
      iReq.input('oid', sql.Int, order.OrderId);
      iReq.input('pid', sql.Int, it.productId);
      iReq.input('pname', sql.NVarChar(200), it.productName);
      iReq.input('pack', sql.VarChar(20), it.packagingOption);
      iReq.input('uprice', sql.Decimal(18, 2), it.unitPrice);
      iReq.input('qty', sql.Int, it.quantity);
      await iReq.query(`
        INSERT INTO dbo.OrderItems (OrderId, ProductId, ProductName, PackagingOption, UnitPrice, Quantity)
        VALUES (@oid, @pid, @pname, @pack, @uprice, @qty)
      `);
    }

    const hReq = new sql.Request(tx);
    hReq.input('oid', sql.Int, order.OrderId);
    hReq.input('by', sql.Int, authUser ? authUser.userId : null);
    await hReq.query(`
      INSERT INTO dbo.OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
      VALUES (@oid, NULL, 'PENDING', N'Khách tạo đơn và giữ hàng', @by)
    `);

    await tx.commit();
    return mapOrder(order, lineItems);
  } catch (err) {
    try { await tx.rollback(); } catch (_) {}
    throw err;
  }
}

/**
 * Chuyển trạng thái đơn hàng (dùng cho cả Admin và khách hủy đơn).
 */
async function transitionOrderStatus(orderIdOrCode, toStatus, { note, cancelReason, actorId = null, isAdmin = false, trackingCode = null, trackingCarrier = null } = {}) {
  const target = String(toStatus || '').toUpperCase();
  if (!ALLOWED_TRANSITIONS[target] && target !== 'DELIVERED' && target !== 'CANCELLED') {
    throw badRequest(`Trạng thái "${toStatus}" không hợp lệ`);
  }

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin(sql.ISOLATION_LEVEL.REPEATABLE_READ);

  try {
    const fReq = new sql.Request(tx);
    const isNum = /^\d+$/.test(String(orderIdOrCode));
    fReq.input('val', isNum ? sql.Int : sql.VarChar(30), isNum ? parseInt(orderIdOrCode, 10) : String(orderIdOrCode));
    const oRes = await fReq.query(`
      SELECT * FROM dbo.Orders WITH (UPDLOCK, HOLDLOCK)
      WHERE ${isNum ? 'OrderId = @val' : 'OrderCode = @val'}
    `);
    if (oRes.recordset.length === 0) throw notFound('Không tìm thấy đơn hàng');
    const order = oRes.recordset[0];

    const fromStatus = String(order.Status).toUpperCase();
    if (fromStatus === target) {
      await tx.rollback();
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
      const itemsRes = await new sql.Request(tx)
        .input('oid', sql.Int, order.OrderId)
        .query('SELECT ProductId, Quantity FROM dbo.OrderItems WHERE OrderId = @oid');

      for (const it of itemsRes.recordset) {
        await new sql.Request(tx)
          .input('pid', sql.Int, it.ProductId)
          .input('qty', sql.Int, it.Quantity)
          .query(`
            UPDATE dbo.Products
            SET Stock = Stock + @qty,
                Status = CASE WHEN Status = 'sold_out' AND Stock + @qty > 0 THEN 'in_stock' ELSE Status END,
                UpdatedAt = SYSDATETIME()
            WHERE ProductId = @pid
          `);
      }
    }

    if (target !== 'CANCELLED' && !order.StockReserved) {
      const itemsRes = await new sql.Request(tx)
        .input('oid', sql.Int, order.OrderId)
        .query('SELECT ProductId, Quantity FROM dbo.OrderItems WHERE OrderId = @oid');
      for (const it of itemsRes.recordset) {
        await new sql.Request(tx)
          .input('pid', sql.Int, it.ProductId)
          .input('qty', sql.Int, it.Quantity)
          .query('UPDATE dbo.Products SET Stock = CASE WHEN Stock >= @qty THEN Stock - @qty ELSE 0 END WHERE ProductId = @pid');
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

    const newReserved = target === 'CANCELLED' ? 0 : 1;
    const uReq = new sql.Request(tx);
    uReq.input('oid', sql.Int, order.OrderId);
    uReq.input('st', sql.VarChar(30), target);
    uReq.input('pst', sql.VarChar(20), newPayStatus);
    uReq.input('res', sql.Bit, newReserved);
    uReq.input('reason', sql.NVarChar(255), target === 'CANCELLED' ? (cancelReason || note || 'Đã hủy') : order.CancelReason);
    uReq.input('tCode', sql.NVarChar(100), trackingCode ? v.cleanStr(trackingCode, 100) : order.TrackingCode);
    uReq.input('tCarrier', sql.NVarChar(50), trackingCarrier ? v.cleanStr(trackingCarrier, 50) : (trackingCode ? (order.TrackingCarrier || 'SPX Express') : order.TrackingCarrier));

    await uReq.query(`
      UPDATE dbo.Orders
      SET Status = @st,
          PaymentStatus = @pst,
          StockReserved = @res,
          CancelReason = @reason,
          TrackingCode = @tCode,
          TrackingCarrier = @tCarrier,
          UpdatedAt = SYSDATETIME()
      WHERE OrderId = @oid
    `);

    const hReq = new sql.Request(tx);
    hReq.input('oid', sql.Int, order.OrderId);
    hReq.input('from', sql.VarChar(30), fromStatus);
    hReq.input('to', sql.VarChar(30), target);
    hReq.input('note', sql.NVarChar(500), v.cleanStr(cancelReason || note || '', 500) || null);
    hReq.input('by', sql.Int, actorId);
    await hReq.query(`
      INSERT INTO dbo.OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
      VALUES (@oid, @from, @to, @note, @by)
    `);

    await tx.commit();
    return getOrderByCodeOrId(order.OrderId);
  } catch (err) {
    try { await tx.rollback(); } catch (_) {}
    throw err;
  }
}

async function updatePaymentStatus(orderId, paymentStatus, { actorId = null, note = null } = {}) {
  const allowed = ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUND_PENDING', 'REFUNDED'];
  const target = String(paymentStatus || '').toUpperCase();
  if (!allowed.includes(target)) throw badRequest('Trạng thái thanh toán không hợp lệ');

  const cur = await query('SELECT OrderId, Status, PaymentStatus FROM dbo.Orders WHERE OrderId = @id', { id: Number(orderId) });
  if (!cur.recordset.length) throw notFound('Không tìm thấy đơn hàng');

  const currentStatus = cur.recordset[0].Status;
  const nextStatus = (currentStatus === 'PENDING' && (target === 'PAID' || target === 'PARTIALLY_PAID'))
    ? 'CONFIRMED'
    : currentStatus;

  await query(`
    UPDATE dbo.Orders
    SET PaymentStatus = @pst, Status = @st, UpdatedAt = SYSDATETIME()
    WHERE OrderId = @id
  `, { id: Number(orderId), pst: target, st: nextStatus });

  await query(`
    INSERT INTO dbo.OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
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
    historyId: h.HistoryId || h.historyId,
    from: h.FromStatus || h.from || null,
    to: h.ToStatus || h.to || h.newStatus || 'PENDING',
    newStatus: h.ToStatus || h.to || h.newStatus || 'PENDING',
    note: h.Note || h.note || '',
    createdAt: h.CreatedAt || h.createdAt,
    by: h.ChangedByName || h.by || null,
    HistoryId: h.HistoryId || h.historyId,
    FromStatus: h.FromStatus || h.from || null,
    ToStatus: h.ToStatus || h.to || h.newStatus || 'PENDING',
    Note: h.Note || h.note || '',
    CreatedAt: h.CreatedAt || h.createdAt,
    ChangedByName: h.ChangedByName || h.by || null
  }));

  return {
    id: o.OrderId,
    orderId: o.OrderId,
    code: o.OrderCode,
    orderCode: o.OrderCode,
    userId: o.UserId,
    fullName: o.FullName,
    phone: o.Phone,
    email: o.Email,
    address: o.Address,
    customer: {
      fullName: o.FullName,
      phone: o.Phone,
      email: o.Email || '',
      address: o.Address
    },
    note: o.Note,
    shippingMethod: o.ShippingMethod || 'SPX',
    paymentMethod: o.PaymentMethod,
    paymentStatus: o.PaymentStatus,
    status: o.Status,
    cancelReason: o.CancelReason,
    hasPreOrder: Boolean(o.HasPreOrder),
    preOrderExpected: o.PreOrderExpected || null,
    preOrderNotified: Boolean(o.PreOrderNotified),
    receiptImage: o.ReceiptImage,
    trackingCode: o.TrackingCode || null,
    trackingCarrier: o.TrackingCarrier || null,
    subtotal: Number(o.Subtotal),
    shippingFee: Number(o.ShippingFee),
    total: Number(o.Total),
    totalAmount: Number(o.Total),
    depositAmount: Number(o.DepositAmount || 0),
    createdAt: o.CreatedAt,
    updatedAt: o.UpdatedAt,
    items,
    history: mappedHistory,
    timeline: mappedHistory,
    // Tương thích ngược PascalCase
    OrderId: o.OrderId,
    OrderCode: o.OrderCode,
    FullName: o.FullName,
    Phone: o.Phone,
    Email: o.Email,
    Address: o.Address,
    Note: o.Note,
    ShippingMethod: o.ShippingMethod || 'SPX',
    PaymentMethod: o.PaymentMethod,
    PaymentStatus: o.PaymentStatus,
    Status: o.Status,
    CancelReason: o.CancelReason,
    HasPreOrder: Boolean(o.HasPreOrder),
    PreOrderExpected: o.PreOrderExpected || null,
    PreOrderNotified: Boolean(o.PreOrderNotified),
    ReceiptImage: o.ReceiptImage,
    TrackingCode: o.TrackingCode || null,
    TrackingCarrier: o.TrackingCarrier || null,
    Subtotal: Number(o.Subtotal),
    ShippingFee: Number(o.ShippingFee),
    Total: Number(o.Total),
    DepositAmount: Number(o.DepositAmount || 0),
    CreatedAt: o.CreatedAt
  };
}

async function getOrderByCodeOrId(idOrCode) {
  const isNum = /^\d+$/.test(String(idOrCode));
  const oRes = await query(
    `SELECT * FROM dbo.Orders WHERE ${isNum ? 'OrderId = @v' : 'OrderCode = @v'}`,
    { v: isNum ? parseInt(idOrCode, 10) : String(idOrCode).trim().toUpperCase() }
  );
  if (!oRes.recordset.length) return null;
  const o = oRes.recordset[0];

  const [iRes, hRes] = await Promise.all([
    query(`
      SELECT oi.OrderItemId, oi.ProductId, oi.ProductName, oi.PackagingOption, oi.UnitPrice, oi.Quantity, oi.LineTotal,
             p.Sku, p.ImageUrl, p.Status AS ProductStatus
      FROM dbo.OrderItems oi
      LEFT JOIN dbo.Products p ON oi.ProductId = p.ProductId
      WHERE oi.OrderId = @oid
    `, { oid: o.OrderId }),
    query(`
      SELECT h.HistoryId, h.FromStatus, h.ToStatus, h.Note, h.CreatedAt, u.FullName AS ChangedByName
      FROM dbo.OrderStatusHistory h
      LEFT JOIN dbo.Users u ON h.ChangedBy = u.UserId
      WHERE h.OrderId = @oid
      ORDER BY h.CreatedAt ASC
    `, { oid: o.OrderId })
  ]);

  const items = iRes.recordset.map(i => {
    const packOpt = i.PackagingOption || 'box';
    return {
      orderItemId: i.OrderItemId,
      productId: i.ProductId,
      name: i.ProductName,
      productName: i.ProductName,
      packagingOption: packOpt,
      packagingLabel: packOpt === 'card' ? 'Bản Card (Vỉ Blister)' : 'Bản Box (Hộp giấy)',
      unitPrice: Number(i.UnitPrice),
      quantity: i.Quantity,
      lineTotal: Number(i.LineTotal),
      sku: i.Sku,
      productSku: i.Sku,
      imageUrl: i.ImageUrl,
      productImage: i.ImageUrl,
      orderType: i.ProductStatus === 'pre_order' ? 'PRE_ORDER' : 'IN_STOCK',
      ProductId: i.ProductId,
      ProductName: i.ProductName,
      PackagingOption: packOpt,
      UnitPrice: Number(i.UnitPrice),
      Quantity: i.Quantity,
      LineTotal: Number(i.LineTotal),
      Sku: i.Sku,
      ImageUrl: i.ImageUrl
    };
  });

  return mapOrder(o, items, hRes.recordset);
}

async function listOrders({ status, paymentStatus, paymentMethod, q, userId, phone, page = 1, pageSize = 50 } = {}) {
  const where = [];
  const params = {};
  if (status === 'PRE_ORDER' || status === 'PREORDER') {
    where.push('o.HasPreOrder = 1');
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
    where.push('(o.OrderCode LIKE @q OR o.FullName LIKE @q OR o.Phone LIKE @q OR o.TrackingCode LIKE @q)');
    params.q = `%${String(q).trim()}%`;
  }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50));
  params.offset = (p - 1) * ps;
  params.ps = ps;

  const [cRes, dRes] = await Promise.all([
    query(`SELECT COUNT(*) AS Total FROM dbo.Orders o ${whereClause}`, params),
    query(`
      SELECT o.*
      FROM dbo.Orders o
      ${whereClause}
      ORDER BY o.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @ps ROWS ONLY
    `, params)
  ]);

  const orders = dRes.recordset;
  if (!orders.length) {
    return { items: [], total: 0, page: p, pageSize: ps, totalPages: 1 };
  }

  const ids = orders.map(o => o.OrderId).join(',');
  const itemsRes = await query(`
    SELECT oi.OrderId, oi.OrderItemId, oi.ProductId, oi.ProductName, oi.PackagingOption, oi.UnitPrice, oi.Quantity, oi.LineTotal,
           p.Sku, p.ImageUrl, p.Status AS ProductStatus
    FROM dbo.OrderItems oi
    LEFT JOIN dbo.Products p ON oi.ProductId = p.ProductId
    WHERE oi.OrderId IN (${ids})
  `);

  const byOrder = new Map();
  for (const row of itemsRes.recordset) {
    const key = String(row.OrderId);
    if (!byOrder.has(key)) byOrder.set(key, []);
    const packOpt = row.PackagingOption || 'box';
    byOrder.get(key).push({
      orderItemId: row.OrderItemId,
      productId: row.ProductId,
      name: row.ProductName,
      productName: row.ProductName,
      packagingOption: packOpt,
      packagingLabel: packOpt === 'card' ? 'Bản Card (Vỉ Blister)' : 'Bản Box (Hộp giấy)',
      unitPrice: Number(row.UnitPrice),
      quantity: row.Quantity,
      lineTotal: Number(row.LineTotal),
      sku: row.Sku,
      productSku: row.Sku,
      imageUrl: row.ImageUrl,
      productImage: row.ImageUrl,
      orderType: row.ProductStatus === 'pre_order' ? 'PRE_ORDER' : 'IN_STOCK',
      ProductName: row.ProductName,
      PackagingOption: packOpt,
      UnitPrice: Number(row.UnitPrice),
      Quantity: row.Quantity,
      LineTotal: Number(row.LineTotal),
      Sku: row.Sku,
      ImageUrl: row.ImageUrl
    });
  }

  const total = cRes.recordset[0]?.Total || 0;
  return {
    items: orders.map(o => mapOrder(o, byOrder.get(String(o.OrderId)) || [])),
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
