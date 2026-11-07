/**
 * ORDER SERVICE — MÁY TRẠNG THÁI ĐƠN HÀNG & QUẢN LÝ TỒN KHO TRANSACTIONAL (SUPABASE POSTGRESQL)
 */
const db = require('../config/db');
const { getSettings } = require('./settingsService');
const { calcDiscountedPrice } = require('./productService');
const mailService = require('./mailService');
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
  const paymentMethod = ['COD', 'BANK_TRANSFER', 'DEPOSIT', 'VIETQR_PAYOS', 'PAYOS'].includes(rawPay)
    ? (rawPay === 'PAYOS' ? 'VIETQR_PAYOS' : rawPay)
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

  const created = await db.withTransaction(async (q) => {
    const lineItems = [];
    let subtotal = 0;
    let depositRequired = 0;
    let hasPreOrder = false;
    let preOrderExpected = null;

    for (const entry of merged.values()) {
      const { productId, packType, quantity } = entry;
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        throw badRequest('Số lượng đặt cho mỗi mẫu xe phải từ 1 đến 50 chiếc!');
      }
      const pRes = await q(`
        SELECT ProductId, Sku, Name, Price, OldPrice, PriceBox, PriceCard, DiscountPercent,
               PackagingType, DepositAmount, DepositPercent, ExpectedDelivery, ReleaseDate,
               Stock, StockBox, StockCard, Status, IsActive
        FROM Products
        WHERE ProductId = @pid
        FOR UPDATE
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

      const effectivePack = p.PackagingType === 'card_only'
        ? 'card'
        : (p.PackagingType === 'box_only' ? 'box' : packType);

      // Phân tách tồn kho độc lập: Hộp Box vs Vỉ Card
      const totalStock = typeof p.Stock === 'number' ? p.Stock : (typeof p.stock === 'number' ? p.stock : 0);
      let sBox = (p.StockBox != null) ? Number(p.StockBox) : ((p.stockbox != null) ? Number(p.stockbox) : null);
      let sCard = (p.StockCard != null) ? Number(p.StockCard) : ((p.stockcard != null) ? Number(p.stockcard) : null);
      if (sBox === null) sBox = p.PackagingType === 'card_only' ? 0 : Math.ceil(totalStock * 0.5);
      if (sCard === null) sCard = p.PackagingType === 'box_only' ? 0 : Math.floor(totalStock * 0.5);
      if (p.PackagingType === 'box_only') sCard = 0;
      if (p.PackagingType === 'card_only') sBox = 0;

      if (p.Status === 'sold_out') {
        throw conflict(isPreOrder ? `Mẫu xe "${p.Name}" hiện đã hết toàn bộ suất đặt cọc!` : `Mẫu xe "${p.Name}" hiện đã hết hàng trong kho!`);
      }

      // Giới hạn chống gom hàng đầu cơ cho xe Pre-Order: tối đa 5 xe / mẫu
      if (isPreOrder && quantity > 5) {
        throw badRequest(`Để đảm bảo quyền lợi sưu tầm công bằng, mỗi đơn hàng chỉ được đặt cọc tối đa 5 chiếc cho mẫu "${p.Name}"!`);
      }

      const packLabel = effectivePack === 'card' ? 'Bản Vỉ Card' : 'Bản Hộp Box';
      const slotWord = isPreOrder ? 'suất đặt cọc' : 'xe trong kho';

      if (effectivePack === 'box') {
        if (sBox <= 0) {
          throw conflict(isPreOrder ? `Mẫu xe "${p.Name}" (Bản Hộp Box) hiện đã hết suất đặt cọc! Vui lòng chọn Bản Vỉ Card.` : `Mẫu xe "${p.Name}" (Bản Hộp Box) hiện đã hết hàng trong kho! Vui lòng chọn Bản Vỉ Card.`);
        } else if (sBox < quantity) {
          throw conflict(`Mẫu xe "${p.Name}" (${packLabel}) chỉ còn ${sBox} ${slotWord} (bạn đặt ${quantity}).`);
        }
      } else if (effectivePack === 'card') {
        if (sCard <= 0) {
          throw conflict(isPreOrder ? `Mẫu xe "${p.Name}" (Bản Vỉ Card) hiện đã hết suất đặt cọc! Vui lòng chọn Bản Hộp Box.` : `Mẫu xe "${p.Name}" (Bản Vỉ Card) hiện đã hết hàng trong kho! Vui lòng chọn Bản Hộp Box.`);
        } else if (sCard < quantity) {
          throw conflict(`Mẫu xe "${p.Name}" (${packLabel}) chỉ còn ${sCard} ${slotWord} (bạn đặt ${quantity}).`);
        }
      }

      if (totalStock < quantity) {
        throw conflict(`Mẫu xe "${p.Name}" chỉ còn ${totalStock} ${slotWord} khả dụng (bạn đặt ${quantity}).`);
      }

      await q(`
        UPDATE Products
        SET Stock = GREATEST(0, COALESCE(Stock, 0) - @qty),
            StockBox = CASE WHEN @pack = 'box' THEN GREATEST(0, COALESCE(StockBox, 0) - @qty) ELSE COALESCE(StockBox, 0) END,
            StockCard = CASE WHEN @pack = 'card' THEN GREATEST(0, COALESCE(StockCard, 0) - @qty) ELSE COALESCE(StockCard, 0) END,
            Status = CASE WHEN GREATEST(0, COALESCE(Stock, 0) - @qty) <= 0 THEN 'sold_out' ELSE Status END,
            UpdatedAt = NOW()
        WHERE ProductId = @pid
      `, { pid: productId, qty: quantity, pack: effectivePack });

      const disc = Math.min(80, Math.max(0, Number(p.DiscountPercent || 0)));
      const baseBox = Number(p.PriceBox || 0) > 0 ? Number(p.PriceBox) : Number(p.Price);
      const baseCard = Number(p.PriceCard || 0) > 0 ? Number(p.PriceCard) : (p.PackagingType === 'box_only' ? baseBox : baseBox + 60000);
      const finalBox = disc > 0 ? calcDiscountedPrice(baseBox, disc) : Number(p.Price || baseBox);
      const finalCard = disc > 0 ? calcDiscountedPrice(baseCard, disc) : baseCard;

      const unitPrice = effectivePack === 'card' ? finalCard : finalBox;
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;

      const depPct = Math.min(100, Math.max(10, Number(p.DepositPercent || 30)));
      const unitDeposit = isPreOrder ? Math.round(unitPrice * (depPct / 100)) : 0;
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
        const userContext = authUser || { email, phone };
        const vRes = await couponService.validateAndApplyCoupon(voucherCode, subtotal, userContext, { phone, email });
        if (vRes && vRes.valid) {
          voucherDiscount = Number(vRes.discount || 0);
        } else if (vRes && !vRes.valid) {
          throw badRequest(vRes.message || 'Mã giảm giá không hợp lệ hoặc đã hết lượt sử dụng!');
        }
      } catch (e) {
        if (e.status === 400 || (e.message && e.message.includes('Mã giảm giá'))) throw e;
        console.warn('[ORDER] Lỗi kiểm tra voucher:', e.message);
      }
    }

    // TÁCH BẠCH TUYỆT ĐỐI TIỀN HÀNG CỦA SHOP & PHÍ VẬN CHUYỂN CỦA ĐƠN VỊ SPX EXPRESS (11.000đ)
    const productPayable = Math.max(0, subtotal + protectorFee - voucherDiscount);
    const total = productPayable + shippingFee;
    let finalPaymentMethod = paymentMethod;
    if (hasPreOrder && finalPaymentMethod !== 'VIETQR_PAYOS') finalPaymentMethod = 'DEPOSIT';

    // KIỂM TRA ĐIỀU KIỆN SHIP COD 100% PHÒNG CHỐNG BOM ĐƠN (CHỈ TÍNH ĐƠN ĐÃ GIAO THÀNH CÔNG DELIVERED)
    if (finalPaymentMethod === 'COD') {
      if (hasPreOrder) {
        throw badRequest('Đơn hàng chứa mẫu xe Pre-Order bắt buộc đặt cọc giữ suất trước qua VietQR!');
      }
      let isCodEligible = false;
      let totalAccumulated = 0;
      const uid = authUser ? (authUser.userId || authUser.id) : null;
      const uEmail = (authUser && authUser.email) ? String(authUser.email).trim().toLowerCase() : (email ? String(email).trim().toLowerCase() : null);

      if (uid || uEmail) {
        const userOrdersRes = await q(`
          SELECT COALESCE(SUM(Total), 0) AS total_accumulated
          FROM Orders
          WHERE ((UserId = @uid AND @uid > 0) OR (Email IS NOT NULL AND LOWER(Email) = @uEmail AND @uEmail <> ''))
            AND UPPER(Status) = 'DELIVERED'
        `, { uid: uid ? parseInt(uid, 10) : 0, uEmail: uEmail || '' });
        totalAccumulated = Number(userOrdersRes.recordset[0]?.total_accumulated || 0);
        if (totalAccumulated >= 1000000) {
          isCodEligible = true;
        }
      }

      // Kiểm tra thêm theo số điện thoại (đồng bộ cả tài khoản và số điện thoại)
      if (!isCodEligible && phone) {
        const cleanPhone = String(phone).replace(/[\s.\-()]/g, '');
        const phoneOrdersRes = await q(`
          SELECT COALESCE(SUM(Total), 0) AS total_accumulated
          FROM Orders
          WHERE REPLACE(REPLACE(REPLACE(Phone, ' ', ''), '-', ''), '.', '') = @cleanPhone
            AND UPPER(Status) = 'DELIVERED'
        `, { cleanPhone });
        const phoneAccumulated = Number(phoneOrdersRes.recordset[0]?.total_accumulated || 0);
        if (phoneAccumulated >= 1000000) {
          isCodEligible = true;
          totalAccumulated = Math.max(totalAccumulated, phoneAccumulated);
        }
      }

      if (!isCodEligible) {
        throw badRequest(`Phương thức "Thanh toán khi nhận hàng (Ship COD 100%)" chỉ dành cho thành viên VIP 4 trở lên (đã tích lũy mua sắm từ 1.000.000đ trở lên để đảm bảo an toàn đơn hàng). Tích lũy hiện tại của bạn: ${new Intl.NumberFormat('vi-VN').format(totalAccumulated)}đ. Vui lòng chọn Đặt cọc 30% hoặc Chuyển khoản VietQR!`);
      }
    }

    // Tiền cọc 30% CHỈ TÍNH TRÊN TIỀN SẢN PHẨM CỦA SHOP (productPayable), TUYỆT ĐỐI KHÔNG CỘNG PHÍ SHIP SPX 11K VÀO CỌC!
    const isPartialDepositMode = finalPaymentMethod === 'DEPOSIT' || (hasPreOrder && finalPaymentMethod === 'VIETQR_PAYOS');
    let depositAmount = 0;
    if (isPartialDepositMode && productPayable > 0) {
      if (hasPreOrder && depositRequired > 0) {
        const grossGoods = Math.max(1, subtotal + protectorFee);
        const rawPreDeposit = depositRequired + Math.round(protectorFee * 0.3);
        depositAmount = Math.min(productPayable, Math.round(rawPreDeposit * (productPayable / grossGoods)));
      } else {
        depositAmount = Math.min(productPayable, Math.round(productPayable * 0.3));
      }
    }

    // Tự động tìm kiếm và gắn UserId nếu khách hàng đã có tài khoản (theo email hoặc SĐT)
    let finalUserId = authUser ? (authUser.userId || authUser.id) : null;
    if (!finalUserId && (email || phone)) {
      try {
        const cleanP = phone ? String(phone).replace(/[\s.\-()]/g, '') : '';
        const uLookup = await q(`
          SELECT UserId FROM Users
          WHERE (LOWER(Email) = LOWER(@em) AND @em <> '')
             OR (REPLACE(REPLACE(REPLACE(Phone, ' ', ''), '-', ''), '.', '') = @ph AND @ph <> '')
          LIMIT 1
        `, { em: email ? String(email).trim().toLowerCase() : '', ph: cleanP });
        if (uLookup.recordset && uLookup.recordset[0]?.UserId) {
          finalUserId = Number(uLookup.recordset[0].UserId);
        }
      } catch (lookupErr) {
        console.warn('[ORDER] User lookup auto-link error:', lookupErr.message);
      }
    }

    const orderCode = generateOrderCode();
    let oIns;
    try {
      oIns = await q(`
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
        uid: finalUserId,
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
    } catch (insErr) {
      // Fallback an toàn: nếu database có constraint cũ chưa cập nhật, ghi nhận dạng BANK_TRANSFER với ghi chú PayOS
      if (insErr.message && insErr.message.includes('ck_orders_payment') && (finalPaymentMethod === 'VIETQR_PAYOS' || finalPaymentMethod === 'PAYOS')) {
        console.warn('[ORDER] DB constraint fallback: storing BANK_TRANSFER instead of VIETQR_PAYOS');
        oIns = await q(`
          INSERT INTO Orders
            (OrderCode, UserId, FullName, Phone, Email, Address, Note,
             ShippingMethod, PaymentMethod, PaymentStatus,
             Subtotal, ShippingFee, Total, DepositAmount, StockReserved,
             HasPreOrder, PreOrderExpected, Status)
          VALUES
            (@code, @uid, @name, @phone, @email, @addr, @note,
             @shipMethod, 'BANK_TRANSFER', 'UNPAID',
             @sub, @ship, @tot, @dep, TRUE,
             @hasPre, @preExp, 'PENDING')
          RETURNING *
        `, {
          code: orderCode,
          uid: finalUserId,
          name: fullName,
          phone: phone,
          email: email || null,
          addr: shippingMethod === 'PICKUP' && !address ? 'Nhận tại cửa hàng' : address,
          note: (note ? note + ' | ' : '') + '[Thanh toán VietQR PayOS]',
          shipMethod: shippingMethod,
          sub: subtotal,
          ship: shippingFee,
          tot: total,
          dep: depositAmount,
          hasPre: hasPreOrder,
          preExp: preOrderExpected || (hasPreOrder ? 'Tháng 11/2026' : null)
        });
      } else {
        throw insErr;
      }
    }
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

    if (voucherCode && voucherDiscount > 0) {
      try {
        const couponService = require('./couponService');
        await couponService.recordCouponUsage(voucherCode, order.OrderId, order.OrderCode, authUser, phone, email);
      } catch (cErr) {
        console.warn('[ORDER] recordCouponUsage error:', cErr.message);
      }
    }

    return mapOrder(order, lineItems);
  });

  if (created && (created.email || created.customer?.email)) {
    mailService.sendOrderConfirmationEmail(created).catch(err => {
      console.warn('[MailService] Failed to send order confirmation email:', err.message);
    });
  }

  return created;
}

async function transitionOrderStatus(orderIdOrCode, toStatus, { note, cancelReason, actorId = null, isAdmin = false, trackingCode = null, trackingCarrier = null } = {}) {
  const target = String(toStatus || '').toUpperCase();
  if (!ALLOWED_TRANSITIONS[target] && target !== 'DELIVERED' && target !== 'CANCELLED') {
    throw badRequest(`Trạng thái "${toStatus}" không hợp lệ`);
  }

  const resOrder = await db.withTransaction(async (q) => {
    const isNum = /^\d+$/.test(String(orderIdOrCode));
    const oRes = await q(`
      SELECT * FROM Orders
      WHERE ${isNum ? 'OrderId = @val' : 'OrderCode = @val'}
    `, { val: isNum ? parseInt(orderIdOrCode, 10) : String(orderIdOrCode) });

    if (oRes.recordset.length === 0) throw notFound('Không tìm thấy đơn hàng');
    const order = oRes.recordset[0];

    const fromStatus = String(order.Status).toUpperCase();
    if (fromStatus === target) {
      return order.OrderId;
    }

    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(target)) {
      throw conflict(`Không thể chuyển đơn từ "${fromStatus}" sang "${target}"`);
    }

    if (!isAdmin && !(fromStatus === 'PENDING' && target === 'CANCELLED')) {
      throw conflict('Bạn chỉ có thể hủy đơn khi đơn đang ở trạng thái Chờ xác nhận');
    }

    // RÀNG BUỘC VÒNG ĐỜI TRẠNG THÁI (STATE MACHINE) CHO ĐƠN PRE-ORDER (HÀNG ĐẶT TRƯỚC TỪ HÃNG):
    // 1. preorder_pending (PENDING): Chờ duyệt cọc / Chờ thanh toán -> Chuyển sang CONFIRMED hoặc CANCELLED
    // 2. waiting_from_manufacturer (CONFIRMED & !isGoodsArrived): Đang chờ hãng gửi về -> Tuyệt đối cấm gán SPX, cấm nhảy sang SHIPPING hoặc DELIVERED! Chỉ chuyển sang PREPARING khi bấm "Báo Hàng Về" (arrived_local_warehouse) hoặc CANCELLED
    // 3. arrived_local_warehouse (PREPARING & isGoodsArrived): Hàng đã về kho Biên Hòa -> Mở khóa gán mã vận đơn SPX và chuyển sang SHIPPING
    // 4. shipping (SHIPPING): Đang giao hàng SPX -> Chuyển sang DELIVERED khi hoàn tất
    const isPreOrder = Boolean(order.HasPreOrder || order.haspreorder);
    const isGoodsArrived = Boolean(order.PreOrderNotified || order.preordernotified);

    if (isPreOrder) {
      if (!isGoodsArrived) {
        // Đơn Pre-Order đang ở giai đoạn chờ hãng sản xuất gửi về
        if (['SHIPPING', 'DELIVERED'].includes(target)) {
          throw badRequest('Sản phẩm Pre-order chưa về kho (đang chờ hãng gửi về), không thể gán mã vận đơn hoặc giao hàng! Vui lòng bấm "Báo Hàng Về" sau khi lô xe cập bến kho Biên Hòa.');
        }
        if (trackingCode && String(trackingCode).trim()) {
          throw badRequest('Sản phẩm Pre-order chưa về kho, không thể gán mã vận đơn SPX! Vui lòng bấm "Báo Hàng Về" sau khi xe cập bến kho Biên Hòa.');
        }
        if (fromStatus === 'CONFIRMED' && !['PREPARING', 'CANCELLED'].includes(target)) {
          throw badRequest('Đơn Pre-order đang chờ hãng chỉ có thể chuyển sang "Hàng đã về kho" (PREPARING) khi bấm "Báo Hàng Về", hoặc Hủy đơn.');
        }
      }

      if (target === 'PREPARING' && !isGoodsArrived) {
        // Tự động kích hoạt PreOrderNotified khi chuyển sang PREPARING
        await q('UPDATE Orders SET PreOrderNotified = TRUE, UpdatedAt = NOW() WHERE OrderId = @oid', { oid: order.OrderId });
      }
    }

    if (target === 'CANCELLED' && order.StockReserved) {
      const itemsRes = await q('SELECT ProductId, Quantity, PackagingOption FROM OrderItems WHERE OrderId = @oid', { oid: order.OrderId });
      for (const it of itemsRes.recordset) {
        const itemPack = String(it.PackagingOption || 'box').toLowerCase() === 'card' ? 'card' : 'box';
        await q(`
          UPDATE Products
          SET Stock = Stock + @qty,
              StockBox = CASE WHEN @pack = 'box' THEN StockBox + @qty ELSE StockBox END,
              StockCard = CASE WHEN @pack = 'card' THEN StockCard + @qty ELSE StockCard END,
              Status = CASE 
                WHEN Status = 'sold_out' AND Stock + @qty > 0 THEN 
                  (CASE WHEN COALESCE(DepositPercent, 0) > 0 OR ReleaseDate > NOW() THEN 'pre_order' ELSE 'in_stock' END)
                ELSE Status 
              END,
              UpdatedAt = NOW()
          WHERE ProductId = @pid
        `, { pid: it.ProductId, qty: it.Quantity, pack: itemPack });
      }
    }

    if (target !== 'CANCELLED' && !order.StockReserved) {
      const itemsRes = await q('SELECT ProductId, Quantity FROM OrderItems WHERE OrderId = @oid', { oid: order.OrderId });
      for (const it of itemsRes.recordset) {
        await q('UPDATE Products SET Stock = CASE WHEN Stock >= @qty THEN Stock - @qty ELSE 0 END WHERE ProductId = @pid', { pid: it.ProductId, qty: it.Quantity });
      }
    }

    const payMethodUpper = String(order.PaymentMethod || '').toUpperCase();
    const isTransferOrDeposit = ['VIETQR_PAYOS', 'PAYOS', 'BANK_TRANSFER', 'DEPOSIT'].includes(payMethodUpper);
    const isUnpaid = String(order.PaymentStatus || '').toUpperCase() === 'UNPAID' || !order.PaymentStatus;

    let newPayStatus = order.PaymentStatus;

    // CHỐNG THẤT THOÁT HÀNG HÓA & LỖ HỔNG DUYỆT ĐƠN:
    // Đơn thanh toán Chuyển khoản hoặc Đặt cọc mà CHƯA nhận được tiền (UNPAID):
    // - Khách hàng hoặc luồng tự động không được tự ý duyệt đơn khi chưa thanh toán
    // - Khi Admin chủ động duyệt thủ công (sau khi đã check tài khoản MB Bank thấy tiền vào), hệ thống tự động xác nhận thanh toán
    if (isTransferOrDeposit && isUnpaid && ['CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED'].includes(target)) {
      if (!isAdmin) {
        throw badRequest('Đơn hàng thanh toán Chuyển khoản hoặc Đặt cọc chưa nhận được tiền thanh toán! Vui lòng kiểm tra biến động số dư tài khoản ngân hàng trước khi duyệt đơn.');
      } else {
        const hasDeposit = Number(order.DepositAmount) > 0 || Boolean(order.HasPreOrder);
        newPayStatus = hasDeposit ? 'PARTIALLY_PAID' : 'PAID';
      }
    }

    if (target === 'DELIVERED' && (payMethodUpper === 'COD' || order.PaymentStatus === 'PARTIALLY_PAID')) {
      newPayStatus = 'PAID';
    } else if (target === 'CANCELLED' && (order.PaymentStatus === 'PAID' || order.PaymentStatus === 'PARTIALLY_PAID')) {
      newPayStatus = 'REFUND_PENDING';
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

    if (target === 'CANCELLED') {
      try {
        const couponService = require('./couponService');
        await couponService.restoreCouponUsage(order.OrderCode);
      } catch (cErr) {
        console.warn('[ORDER] restoreCouponUsage error:', cErr.message);
      }
    }

    return order.OrderId;
  });

  const finalOrder = await getOrderByCodeOrId(resOrder, { skipAutoCancel: true });

  if (target === 'DELIVERED' && finalOrder && (finalOrder.email || finalOrder.customer?.email)) {
    mailService.sendOrderDeliveredEmail(finalOrder).catch(err => {
      console.warn('[MailService] Failed to send order delivered email:', err.message);
    });
  }

  return finalOrder;
}

async function updatePaymentStatus(orderId, paymentStatus, { actorId = null, note = null } = {}) {
  const allowed = ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUND_PENDING', 'REFUNDED'];
  const target = String(paymentStatus || '').toUpperCase();
  if (!allowed.includes(target)) throw badRequest('Trạng thái thanh toán không hợp lệ');

  const cur = await db.query('SELECT OrderId, Status, PaymentStatus FROM Orders WHERE OrderId = @id', { id: Number(orderId) });
  if (!cur.recordset.length) throw notFound('Không tìm thấy đơn hàng');

  const row = cur.recordset[0];
  const currentStatus = String(row.Status || row.status || 'PENDING').toUpperCase();
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

// TỰ ĐỘNG HỦY ĐƠN HÀNG CHƯA THANH TOÁN SAU 5 PHÚT
// Hoàn lại tồn kho mô hình xe (Box/Card) và mã giảm giá để bảo toàn dữ liệu
async function autoCancelExpiredUnpaidOrders() {
  try {
    const expiredRes = await db.query(`
      SELECT o.OrderId AS "OrderId", o.OrderCode AS "OrderCode", o.CreatedAt AS "CreatedAt"
      FROM Orders o
      WHERE UPPER(COALESCE(o.Status, 'PENDING')) = 'PENDING'
        AND (UPPER(COALESCE(o.PaymentStatus, 'UNPAID')) = 'UNPAID' OR o.PaymentStatus IS NULL)
        AND UPPER(COALESCE(o.PaymentMethod, '')) IN ('VIETQR_PAYOS', 'PAYOS', 'BANK_TRANSFER', 'DEPOSIT')
        AND o.CreatedAt <= (NOW() - INTERVAL '5 minutes')
      ORDER BY o.OrderId ASC
      LIMIT 50
    `);

    if (!expiredRes.recordset || expiredRes.recordset.length === 0) {
      return 0;
    }

    let count = 0;
    for (const ord of expiredRes.recordset) {
      const oid = ord.OrderId || ord.orderid;
      const code = ord.OrderCode || ord.ordercode;
      try {
        await transitionOrderStatus(oid, 'CANCELLED', {
          actorId: null,
          isAdmin: true,
          cancelReason: 'Hệ thống tự động hủy sau 5 phút do khách chưa thanh toán / chuyển cọc',
          note: 'Hệ thống tự động hủy đơn sau 5 phút do quá thời hạn thanh toán VietQR / MB Bank'
        });
        count++;
        console.log(`[AUTO-CANCEL] Đã tự động hủy đơn quá hạn 5p #${code}`);
      } catch (cancelErr) {
        console.warn(`[AUTO-CANCEL] Lỗi khi hủy đơn #${code}:`, cancelErr.message);
      }
    }
    return count;
  } catch (err) {
    console.warn('[AUTO-CANCEL] Lỗi quét đơn hết hạn 5 phút:', err.message);
    return 0;
  }
}

function getCustomerVipInfo(totalSpent = 0) {
  const spent = Math.max(0, Number(totalSpent) || 0);
  if (spent <= 200000) {
    return { level: 1, label: 'VIP 1', tierName: '0 - 200K', color: '#475569', bg: '#f1f5f9', border: '#cbd5e1', icon: 'fa-shield' };
  } else if (spent <= 500000) {
    return { level: 2, label: 'VIP 2', tierName: '201K - 500K', color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd', icon: 'fa-medal' };
  } else if (spent <= 1000000) {
    return { level: 3, label: 'VIP 3', tierName: '501K - 1TR', color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: 'fa-award' };
  } else if (spent <= 5000000) {
    return { level: 4, label: 'VIP 4', tierName: '1TR - 5TR', color: '#7c3aed', bg: '#f3e8ff', border: '#ddd6fe', icon: 'fa-gem' };
  } else {
    return { level: 5, label: 'VIP 5', tierName: 'Từ 5TR', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: 'fa-crown' };
  }
}

// =====================================================================
// HÀM ĐỐI SOÁT TÀI CHÍNH CHUẨN — TÁCH BẠCH DOANH THU SHOP & SHIP SPX 11K
// =====================================================================
function computeOrderFinancials(o = {}) {
  const subtotal = Math.max(0, Number(o.Subtotal ?? o.subtotal ?? 0));
  const shippingFee = Math.max(0, Number(o.ShippingFee ?? o.shippingFee ?? o.shippingfee ?? 0));
  const total = Math.max(0, Number(o.Total ?? o.total ?? o.totalAmount ?? (subtotal + shippingFee)));
  const productPayable = Math.max(0, total - shippingFee);
  const noteStr = String(o.Note ?? o.note ?? '');
  const protectorFee = /PROTECTOR PVC 15K/i.test(noteStr) ? 15000 : 0;
  const discountAmount = Math.max(0, subtotal + protectorFee - productPayable);

  const payMethodUpper = String(o.PaymentMethod ?? o.paymentMethod ?? o.paymentmethod ?? 'DEPOSIT').toUpperCase();
  const payStatusUpper = String(o.PaymentStatus ?? o.paymentStatus ?? o.paymentstatus ?? 'UNPAID').toUpperCase();
  const statusUpper = String(o.Status ?? o.status ?? 'PENDING').toUpperCase();
  const hasPreOrder = Boolean(o.HasPreOrder ?? o.hasPreOrder ?? o.haspreorder);

  const rawDeposit = Math.max(0, Number(o.DepositAmount ?? o.depositAmount ?? o.depositamount ?? 0));
  // Tương thích ngược: đơn BANK_TRANSFER cũ từng lưu DepositAmount = Total thì vẫn nhận diện đúng là Full Transfer
  const isPartialDeposit = payMethodUpper === 'DEPOSIT' ||
                           (hasPreOrder && (payMethodUpper === 'VIETQR_PAYOS' || payMethodUpper === 'PAYOS')) ||
                           (rawDeposit > 0 && rawDeposit < productPayable);
  const isCod = payMethodUpper === 'COD';
  const isFullTransfer = !isPartialDeposit && !isCod;

  const depositAmount = isPartialDeposit
    ? Math.min(productPayable, rawDeposit > 0 ? rawDeposit : Math.round(productPayable * 0.3))
    : 0;

  // Số tiền khách quét mã VietQR chuyển trực tiếp cho Shop (KHÔNG BAO GIỜ gộp cước 11k của SPX)
  const qrTransferAmount = isCod ? 0 : (isPartialDeposit ? depositAmount : productPayable);

  const isDelivered = statusUpper === 'DELIVERED' || statusUpper === 'COMPLETED';
  const isCancelled = statusUpper === 'CANCELLED';
  const isPaidFull = payStatusUpper === 'PAID' || isDelivered;
  const isPartiallyPaid = payStatusUpper === 'PARTIALLY_PAID';

  const paidToShopAmount = isCancelled
    ? 0
    : (isPaidFull ? productPayable : (isPartiallyPaid ? depositAmount : 0));

  // Tiền hàng của Shop còn lại thu hộ qua SPX khi giao kiện
  let remainingProductAmount = 0;
  if (!isCancelled && !isPaidFull) {
    if (isPartialDeposit) {
      remainingProductAmount = Math.max(0, productPayable - depositAmount);
    } else if (isCod) {
      remainingProductAmount = productPayable;
    } else {
      // Đơn chuyển khoản Full: chuyển đủ 100% tiền xe qua VietQR cho Shop trước khi gửi, nên COD tiền xe = 0đ
      remainingProductAmount = 0;
    }
  }

  // Phí ship đơn vị SPX Express thu riêng khi giao hàng (0đ nếu Freeship / Nhận tại shop / Box Saver / Đã giao xong)
  const shippingPayableOnDelivery = (isCancelled || isDelivered) ? 0 : shippingFee;

  // Tổng số tiền thực tế khách thanh toán cho bưu tá SPX khi nhận hàng
  const payableOnDelivery = remainingProductAmount + shippingPayableOnDelivery;

  return {
    subtotal,
    protectorFee,
    discountAmount,
    productPayable,
    shippingFee,
    total,
    depositAmount,
    qrTransferAmount,
    paidToShopAmount,
    remainingProductAmount,
    shippingPayableOnDelivery,
    payableOnDelivery,
    spxCodForShop: remainingProductAmount,
    isPartialDeposit,
    isFullTransfer,
    isCod
  };
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

  const userTotalSpent = Number(o.UserTotalSpent ?? o.usertotalspent ?? 0);
  const vipInfo = getCustomerVipInfo(userTotalSpent);
  const fin = computeOrderFinancials(o);

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
    addressType: String(o.AddressType || o.addresstype || (o.IsOldAddress || o.isoldaddress ? 'OLD' : 'NEW')).toUpperCase(),
    isOldAddress: (o.AddressType || o.addresstype) === 'OLD' || Boolean(o.IsOldAddress || o.isoldaddress),
    oldAddressNote: o.OldAddressNote || o.oldaddressnote || '',
    newAddressEquivalent: o.NewAddressEquivalent || o.newaddressequivalent || '',
    userTotalSpent,
    vip: vipInfo,
    customer: {
      fullName: o.FullName || o.fullname,
      phone: o.Phone || o.phone,
      email: o.Email || o.email || '',
      address: o.Address || o.address,
      addressType: String(o.AddressType || o.addresstype || (o.IsOldAddress || o.isoldaddress ? 'OLD' : 'NEW')).toUpperCase(),
      oldAddressNote: o.OldAddressNote || o.oldaddressnote || '',
      newAddressEquivalent: o.NewAddressEquivalent || o.newaddressequivalent || '',
      userTotalSpent,
      vip: vipInfo
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
    subtotal: fin.subtotal,
    protectorFee: fin.protectorFee,
    discount: fin.discountAmount,
    discountAmount: fin.discountAmount,
    productPayable: fin.productPayable,
    shippingFee: fin.shippingFee,
    total: fin.total,
    totalAmount: fin.total,
    depositAmount: fin.depositAmount,
    qrTransferAmount: fin.qrTransferAmount,
    paidToShopAmount: fin.paidToShopAmount,
    remainingProductAmount: fin.remainingProductAmount,
    shippingPayableOnDelivery: fin.shippingPayableOnDelivery,
    payableOnDelivery: fin.payableOnDelivery,
    codAmount: fin.payableOnDelivery,
    spxCodForShop: fin.spxCodForShop,
    isPartialDeposit: fin.isPartialDeposit,
    isFullTransfer: fin.isFullTransfer,
    createdAt: o.CreatedAt || o.createdat,
    updatedAt: o.UpdatedAt || o.updatedat,
    items,
    history: mappedHistory,
    timeline: mappedHistory
  };
}

async function getOrderByCodeOrId(idOrCode, { skipAutoCancel = false } = {}) {
  const isNum = /^\d+$/.test(String(idOrCode));
  const oRes = await db.query(`
    SELECT o.*,
           COALESCE(u_spent.TotalSpent, phone_spent.TotalSpent, 0) AS "UserTotalSpent"
    FROM Orders o
    LEFT JOIN (
      SELECT UserId, COALESCE(SUM(CASE WHEN UPPER(Status) = 'DELIVERED' THEN Total ELSE 0 END), 0) AS TotalSpent
      FROM Orders
      WHERE UserId IS NOT NULL
      GROUP BY UserId
    ) u_spent ON o.UserId = u_spent.UserId
    LEFT JOIN (
      SELECT Phone, COALESCE(SUM(CASE WHEN UPPER(Status) = 'DELIVERED' THEN Total ELSE 0 END), 0) AS TotalSpent
      FROM Orders
      WHERE Phone IS NOT NULL AND Phone <> ''
      GROUP BY Phone
    ) phone_spent ON o.Phone = phone_spent.Phone
    WHERE ${isNum ? 'o.OrderId = @v' : 'o.OrderCode = @v'}
  `, { v: isNum ? parseInt(idOrCode, 10) : String(idOrCode).trim().toUpperCase() });
  if (!oRes.recordset.length) return null;
  const o = oRes.recordset[0];
  const oid = o.OrderId || o.orderid;

  // Tự động kiểm tra và hủy nếu đơn chờ chuyển khoản/cọc đã quá hạn 5 phút
  const curStatus = String(o.Status || o.status || 'PENDING').toUpperCase();
  const curPayStatus = String(o.PaymentStatus || o.paymentstatus || 'UNPAID').toUpperCase();
  const curPayMethod = String(o.PaymentMethod || o.paymentmethod || '').toUpperCase();
  const isTransferOrDeposit = ['VIETQR_PAYOS', 'PAYOS', 'BANK_TRANSFER', 'DEPOSIT'].includes(curPayMethod);
  const createdAtTime = new Date(o.CreatedAt || o.createdat || 0).getTime();
  const ageMs = Date.now() - createdAtTime;
  const FIVE_MINS = 5 * 60 * 1000;

  if (!skipAutoCancel && curStatus === 'PENDING' && (curPayStatus === 'UNPAID' || !curPayStatus) && isTransferOrDeposit && ageMs >= FIVE_MINS) {
    try {
      await transitionOrderStatus(oid, 'CANCELLED', {
        actorId: null,
        isAdmin: true,
        cancelReason: 'Hệ thống tự động hủy sau 5 phút do khách chưa thanh toán / chuyển cọc',
        note: 'Hệ thống tự động hủy đơn sau 5 phút do quá thời hạn thanh toán VietQR / MB Bank'
      });
      return getOrderByCodeOrId(idOrCode, { skipAutoCancel: true });
    } catch (e) {
      console.warn('[AUTO-CANCEL-ON-GET] Lỗi khi hủy đơn quá hạn:', e.message);
    }
  }

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

async function listOrders({ status, paymentStatus, paymentMethod, q, userId, userEmail, phone, codes, preStage, spxStatus, sortBy = 'newest', dateRange = 'ALL', page = 1, pageSize = 50 } = {}) {
  // Tự động quét và hủy các đơn chờ thanh toán / chuyển cọc quá 5 phút
  try {
    await autoCancelExpiredUnpaidOrders();
  } catch (scanErr) {
    console.warn('[AUTO-CANCEL-SWEEP] Lỗi quét đơn quá hạn:', scanErr.message);
  }

  const where = [];
  const params = {};

  // Lọc theo trạng thái và giai đoạn Pre-Order
  const isPreOrder = status === 'PRE_ORDER' || status === 'PREORDER';
  if (isPreOrder) {
    where.push('o.HasPreOrder = TRUE');
    if (preStage && preStage !== 'ALL') {
      const stage = String(preStage).toUpperCase();
      if (stage === 'NEED_DEPOSIT') {
        where.push("(o.PaymentStatus = 'UNPAID' OR o.PaymentStatus IS NULL) AND o.Status <> 'CANCELLED'");
      } else if (stage === 'WAITING_GOODS') {
        where.push("o.PaymentStatus IN ('PARTIALLY_PAID', 'PAID') AND o.Status IN ('PENDING', 'CONFIRMED') AND (o.PreOrderNotified = FALSE OR o.PreOrderNotified IS NULL)");
      } else if (stage === 'GOODS_ARRIVED') {
        where.push("((o.PreOrderNotified = TRUE) OR (o.Status = 'PREPARING')) AND o.Status NOT IN ('SHIPPING', 'DELIVERED', 'CANCELLED')");
      } else if (stage === 'SHIPPED') {
        where.push("o.Status IN ('SHIPPING', 'DELIVERED', 'COMPLETED')");
      }
    }
  } else if (status && status !== 'all' && status !== 'ALL') {
    where.push('o.Status = @status');
    params.status = String(status).toUpperCase();
  }

  if (paymentStatus && paymentStatus !== 'all' && paymentStatus !== 'ALL') {
    where.push('o.PaymentStatus = @payStatus');
    params.payStatus = String(paymentStatus).toUpperCase();
  }
  if (paymentMethod && paymentMethod !== 'all' && paymentMethod !== 'ALL') {
    if (paymentMethod === 'VIETQR_PAYOS' || paymentMethod === 'PAYOS') {
      where.push("(o.PaymentMethod IN ('VIETQR_PAYOS', 'PAYOS') OR o.PaymentMethod ILIKE '%PAYOS%')");
    } else {
      where.push('o.PaymentMethod = @payMethod');
      params.payMethod = String(paymentMethod).toUpperCase();
    }
  }
  if (spxStatus && spxStatus !== 'ALL') {
    if (spxStatus === 'UNASSIGNED') {
      where.push('(o.TrackingCode IS NULL OR o.TrackingCode = \'\')');
    } else if (spxStatus === 'ASSIGNED') {
      where.push('(o.TrackingCode IS NOT NULL AND o.TrackingCode <> \'\')');
    }
  }

  // Khớp đơn hàng thống nhất bảo đảm không bỏ sót đơn
  if (userId) {
    const uFilters = [];
    uFilters.push('(o.UserId = @uid AND @uid > 0)');
    params.uid = Number(userId);

    if (userEmail && String(userEmail).trim()) {
      uFilters.push('(o.Email IS NOT NULL AND LOWER(o.Email) = @uEmail AND @uEmail <> \'\')');
      params.uEmail = String(userEmail).trim().toLowerCase();
    }
    if (phone) {
      const cleanPh = String(phone).replace(/[\s.\-()]/g, '');
      if (cleanPh) {
        uFilters.push('(o.Phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(o.Phone, \' \', \'\'), \'-\', \'\'), \'.\', \'\') = @cleanPhone AND @cleanPhone <> \'\')');
        params.cleanPhone = cleanPh;
      }
    }
    if (Array.isArray(codes) && codes.length > 0) {
      const safeCodes = codes.map(c => String(c).replace(/[^A-Za-z0-9_-]/g, '')).filter(Boolean);
      if (safeCodes.length > 0) {
        uFilters.push(`o.OrderCode IN (${safeCodes.map(c => `'${c}'`).join(',')})`);
      }
    }
    where.push(`(${uFilters.join(' OR ')})`);
  } else {
    // Trường hợp tra cứu khách vãng lai
    const guestFilters = [];
    if (phone) {
      guestFilters.push('o.Phone = @phone');
      params.phone = v.cleanPhone(phone);
    }
    if (Array.isArray(codes) && codes.length > 0) {
      const safeCodes = codes.map(c => String(c).replace(/[^A-Za-z0-9_-]/g, '')).filter(Boolean);
      if (safeCodes.length > 0) {
        guestFilters.push(`o.OrderCode IN (${safeCodes.map(c => `'${c}'`).join(',')})`);
      }
    }
    if (guestFilters.length > 0) {
      where.push(`(${guestFilters.join(' OR ')})`);
    }
  }

  if (dateRange && dateRange !== 'ALL' && dateRange !== 'all') {
    const dr = String(dateRange).toLowerCase();
    if (dr === 'today') {
      where.push("o.CreatedAt >= CURRENT_DATE");
    } else if (dr === 'yesterday') {
      where.push("o.CreatedAt >= (CURRENT_DATE - INTERVAL '1 day') AND o.CreatedAt < CURRENT_DATE");
    } else if (dr === 'last_7_days' || dr === '7days') {
      where.push("o.CreatedAt >= (CURRENT_DATE - INTERVAL '7 days')");
    } else if (dr === 'last_30_days' || dr === '30days') {
      where.push("o.CreatedAt >= (CURRENT_DATE - INTERVAL '30 days')");
    }
  }

  if (q && String(q).trim()) {
    where.push('(o.OrderCode ILIKE @q OR o.FullName ILIKE @q OR o.Phone ILIKE @q OR o.TrackingCode ILIKE @q)');
    params.q = `%${String(q).trim()}%`;
  }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  let orderByClause = 'o.CreatedAt DESC';
  const sb = String(sortBy || 'newest').toLowerCase();
  if (sb === 'oldest') {
    orderByClause = 'o.CreatedAt ASC';
  } else if (sb === 'pending_longest') {
    orderByClause = "CASE WHEN UPPER(o.Status) = 'PENDING' THEN 0 ELSE 1 END, o.CreatedAt ASC";
  } else if (sb === 'total_desc') {
    orderByClause = 'o.Total DESC, o.CreatedAt DESC';
  } else if (sb === 'total_asc') {
    orderByClause = 'o.Total ASC, o.CreatedAt DESC';
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50));
  params.offset = (p - 1) * ps;
  params.ps = ps;

  const [cRes, dRes] = await Promise.all([
    db.query(`SELECT COUNT(*) AS Total FROM Orders o ${whereClause}`, params),
    db.query(`
      SELECT o.*,
             COALESCE(u_spent.TotalSpent, phone_spent.TotalSpent, 0) AS "UserTotalSpent"
      FROM Orders o
      LEFT JOIN (
        SELECT UserId, COALESCE(SUM(CASE WHEN UPPER(Status) = 'DELIVERED' THEN Total ELSE 0 END), 0) AS TotalSpent
        FROM Orders
        WHERE UserId IS NOT NULL
        GROUP BY UserId
      ) u_spent ON o.UserId = u_spent.UserId
      LEFT JOIN (
        SELECT Phone, COALESCE(SUM(CASE WHEN UPPER(Status) = 'DELIVERED' THEN Total ELSE 0 END), 0) AS TotalSpent
        FROM Orders
        WHERE Phone IS NOT NULL AND Phone <> ''
        GROUP BY Phone
      ) phone_spent ON o.Phone = phone_spent.Phone
      ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT @ps OFFSET @offset
    `, params)
  ]);

  const orders = dRes.recordset;
  if (!orders.length) {
    return { items: [], total: 0, page: p, pageSize: ps, totalPages: 1 };
  }

  // Tự động liên kết các đơn hàng cũ chưa gắn UserId vào tài khoản hội viên nếu phát hiện khớp
  if (userId && Number(userId) > 0) {
    const orphanOids = orders.filter(o => !o.UserId && !o.userid).map(o => o.OrderId || o.orderid);
    if (orphanOids.length > 0) {
      db.query(`UPDATE Orders SET UserId = @uid WHERE OrderId IN (${orphanOids.join(',')}) AND UserId IS NULL`, { uid: Number(userId) }).catch(() => {});
    }
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
  computeOrderFinancials,
  createOrder,
  transitionOrderStatus,
  updatePaymentStatus,
  autoCancelExpiredUnpaidOrders,
  getOrderByCodeOrId,
  listOrders
};