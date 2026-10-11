/**
 * ORDERS & PRE-ORDER MANAGEMENT ROUTES
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { optionalToken, verifyToken } = require('../middleware/auth');

// 1. TẠO ĐƠN HÀNG HOẶC ĐẶT CỌC PRE-ORDER
router.post('/', optionalToken, async (req, res) => {
  try {
    const { fullName, phone, address, note, paymentMethod, items } = req.body;

    if (!fullName || !phone || !address) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp Họ tên, Số điện thoại và Địa chỉ nhận hàng' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng đang trống' });
    }

    const userId = req.user ? req.user.userId : null;

    // Tính tổng tiền
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const pRes = await db.query(
        'SELECT ProductId, Name, Price, DepositAmount, Status FROM Products WHERE ProductId = @id',
        { id: item.productId }
      );
      if (pRes.recordset.length > 0) {
        const prod = pRes.recordset[0];
        const qty = Math.max(1, parseInt(item.quantity) || 1);
        const unitPrice = prod.Price;
        subtotal += unitPrice * qty;

        validatedItems.push({
          productId: prod.ProductId,
          productName: prod.Name,
          unitPrice: unitPrice,
          quantity: qty,
          depositAmount: prod.DepositAmount || (unitPrice * 0.3)
        });
      }
    }

    if (validatedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy sản phẩm hợp lệ trong giỏ hàng' });
    }

    const shippingFee = subtotal > 1000000 ? 0 : 35000;
    const total = subtotal + shippingFee;

    // Chuẩn hóa phương thức thanh toán: COD hoặc BANK_TRANSFER
    const rawMethod = (paymentMethod || 'BANK_TRANSFER').toUpperCase();
    const standardizedMethod = rawMethod.includes('COD') ? 'COD' : 'BANK_TRANSFER';

    // Sinh mã đơn hàng dạng MGT-2026-XXXXX
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderCode = `MGT-2026-${randomSuffix}`;

    // Lưu vào bảng Orders
    const insertOrder = await db.query(`
      INSERT INTO Orders (OrderCode, UserId, FullName, Phone, Address, Note, PaymentMethod, PaymentStatus, Subtotal, ShippingFee, Total, Status, CreatedAt)
      OUTPUT INSERTED.OrderId, INSERTED.OrderCode, INSERTED.Total, INSERTED.Status, INSERTED.PaymentStatus, INSERTED.PaymentMethod
      VALUES (@orderCode, @userId, @fullName, @phone, @address, @note, @paymentMethod, 'UNPAID', @subtotal, @shippingFee, @total, 'PENDING', SYSDATETIME())
    `, {
      orderCode,
      userId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      note: note || '',
      paymentMethod: standardizedMethod,
      subtotal,
      shippingFee,
      total
    });

    const newOrder = insertOrder.recordset[0];

    // Lưu từng món vào OrderItems
    for (const it of validatedItems) {
      await db.query(`
        INSERT INTO OrderItems (OrderId, ProductId, ProductName, UnitPrice, Quantity)
        VALUES (@orderId, @productId, @productName, @unitPrice, @quantity)
      `, {
        orderId: newOrder.OrderId,
        productId: it.productId,
        productName: it.productName,
        unitPrice: it.unitPrice,
        quantity: it.quantity
      });
    }

    // Tính tổng tiền cọc cần chuyển trước (nếu đơn có sản phẩm Pre-Order)
    const totalDeposit = validatedItems.reduce((acc, curr) => acc + (curr.depositAmount * curr.quantity), 0);

    // URL VietQR tạo mã thanh toán tự động với tài khoản MB Bank của ĐỖ QUỐC THỊNH
    const bankId = 'MB'; // Ngân hàng Quân Đội MBBank
    const accountNo = '87654321082007'; // Số tài khoản MB Bank chính xác của bạn
    const accountName = 'DO QUOC THINH';
    const transferAmount = totalDeposit > 0 ? totalDeposit : total;
    const transferDesc = `MINI GT ${orderCode}`;
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${transferAmount}&addInfo=${encodeURIComponent(transferDesc)}&accountName=${encodeURIComponent(accountName)}`;
    const originalQrImg = 'image/qr-mb-doquocthinh.png';

    const orderData = {
      orderId: newOrder.OrderId,
      orderCode: newOrder.OrderCode,
      fullName,
      phone,
      total,
      totalDeposit,
      status: newOrder.Status,
      paymentMethod: newOrder.PaymentMethod,
      paymentStatus: newOrder.PaymentStatus,
      qrUrl,
      originalQrImg,
      bankInfo: {
        bankName: 'MBBank (Ngân Hàng Quân Đội)',
        accountNo: accountNo,
        accountName: accountName,
        transferAmount: transferAmount,
        content: transferDesc
      },
      items: validatedItems
    };

    return res.status(201).json({
      success: true,
      message: 'Đặt đơn hàng / cọc mô hình thành công!',
      data: orderData,
      order: orderData
    });
  } catch (error) {
    console.error('[ORDER CREATE ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

// CẬP NHẬT ẢNH BIÊN LAI CHUYỂN KHOẢN (RECEIPT)
router.post('/upload-receipt', async (req, res) => {
  try {
    const { orderCode, receiptImage } = req.body;
    if (!orderCode || !receiptImage) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã đơn và hình ảnh biên lai', data: null });
    }

    const orderCheck = await db.query('SELECT OrderId FROM Orders WHERE OrderCode = @code', { code: orderCode.trim() });
    if (orderCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng tương ứng', data: null });
    }

    await db.query('UPDATE Orders SET ReceiptImage = @receipt WHERE OrderCode = @code', {
      code: orderCode.trim(),
      receipt: receiptImage.trim()
    });

    return res.json({
      success: true,
      message: 'Đã tải lên biên lai chuyển khoản thành công! Cửa hàng sẽ xác nhận sớm nhất.',
      data: { orderCode, receiptImage }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

// 2. TRA CỨU ĐƠN HÀNG THEO MÃ ĐƠN HOẶC SỐ ĐIỆN THOẠI
router.get('/track/:query', async (req, res) => {
  try {
    const q = req.params.query.trim();

    const orderRes = await db.query(`
      SELECT o.*, u.Email 
      FROM Orders o
      LEFT JOIN Users u ON u.UserId = o.UserId
      WHERE o.OrderCode = @q OR o.Phone = @q
      ORDER BY o.CreatedAt DESC
    `, { q });

    if (orderRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng với thông tin đã nhập' });
    }

    const orders = orderRes.recordset;

    // Lấy items cho từng đơn
    for (const ord of orders) {
      const itemsRes = await db.query(`
        SELECT oi.*, p.ImageUrl, p.Sku
        FROM OrderItems oi
        LEFT JOIN Products p ON p.ProductId = oi.ProductId
        WHERE oi.OrderId = @orderId
      `, { orderId: ord.OrderId });
      ord.items = itemsRes.recordset;
    }

    return res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('[ORDER TRACK ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. DANH SÁCH ĐƠN HÀNG CỦA TÔI
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const orderRes = await db.query(`
      SELECT * FROM Orders WHERE UserId = @userId ORDER BY CreatedAt DESC
    `, { userId: req.user.userId });

    const orders = orderRes.recordset;

    for (const ord of orders) {
      const itemsRes = await db.query(`
        SELECT oi.*, p.ImageUrl, p.Sku
        FROM OrderItems oi
        LEFT JOIN Products p ON p.ProductId = oi.ProductId
        WHERE oi.OrderId = @orderId
      `, { orderId: ord.OrderId });
      ord.items = itemsRes.recordset;
    }

    return res.json({ success: true, data: orders });
  } catch (error) {
    console.error('[MY ORDERS ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. KIỂM TRA TRẠNG THÁI ĐƠN HÀNG THỜI GIAN THỰC (REAL-TIME POLLING)
router.get('/check-status/:orderCode', async (req, res) => {
  try {
    const code = (req.params.orderCode || '').trim();
    const orderRes = await db.query(`
      SELECT OrderId, OrderCode, Status, PaymentStatus, PaymentMethod, Total, TrackingCode, TrackingCarrier, CreatedAt
      FROM Orders
      WHERE OrderCode = @code
    `, { code });

    if (orderRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    return res.json({ success: true, data: orderRes.recordset[0] });
  } catch (err) {
    console.error('[CHECK STATUS ERROR]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
