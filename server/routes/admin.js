/**
 * ADMIN API ROUTES - QUẢN LÝ TOÀN DIỆN CỬA HÀNG MINI GT
 * Yêu cầu: Xác thực JWT token và quyền Role === 'admin'
 * Chuẩn hóa phản hồi API: { success: boolean, message: string, data: any }
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Middleware kiểm tra quyền Quản trị viên
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Từ chối truy cập: Bạn không có quyền Quản trị viên',
      data: null
    });
  }
  next();
}

// Áp dụng middleware cho tất cả các route admin
router.use(verifyToken, requireAdmin);

// =====================================================================
// 1. THỐNG KÊ TỔNG QUAN (DASHBOARD STATS)
// =====================================================================
async function getDashboardStatsHandler(req, res) {
  try {
    const productsCountRes = await db.query('SELECT COUNT(*) AS total FROM Products');
    const ordersStatsRes = await db.query(`
      SELECT 
        COUNT(*) AS totalOrders,
        ISNULL(SUM(CASE WHEN PaymentStatus = 'PAID' THEN Total ELSE 0 END), 0) AS totalRevenue,
        ISNULL(SUM(CASE WHEN Status IN ('CONFIRMED', 'SHIPPING', 'DELIVERED') THEN Total * 0.35 ELSE 0 END), 0) AS totalDeposits,
        SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) AS pendingOrders,
        SUM(CASE WHEN Status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmedOrders,
        SUM(CASE WHEN Status = 'SHIPPING' THEN 1 ELSE 0 END) AS shippingOrders,
        SUM(CASE WHEN Status = 'DELIVERED' THEN 1 ELSE 0 END) AS deliveredOrders,
        SUM(CASE WHEN Status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledOrders
      FROM Orders
    `);
    const usersCountRes = await db.query("SELECT COUNT(*) AS total FROM Users WHERE Role != 'admin'");
    const subscribersCountRes = await db.query('SELECT COUNT(*) AS total FROM Newsletter');

    const recentOrdersRes = await db.query(`
      SELECT TOP 8 OrderId, OrderCode, FullName, Phone, Total, Status, PaymentStatus, PaymentMethod, CreatedAt
      FROM Orders
      ORDER BY CreatedAt DESC
    `);

    const s = ordersStatsRes.recordset[0] || {};

    return res.json({
      success: true,
      message: 'Lấy dữ liệu thống kê thành công',
      data: {
        stats: {
          totalProducts: productsCountRes.recordset[0].total || 0,
          totalOrders: s.totalOrders || 0,
          totalRevenue: s.totalRevenue || 0,
          totalDeposits: s.totalDeposits || 0,
          totalCustomers: usersCountRes.recordset[0].total || 0,
          totalSubscribers: subscribersCountRes.recordset[0].total || 0,
          pendingOrders: s.pendingOrders || 0,
          confirmedOrders: s.confirmedOrders || 0,
          shippingOrders: s.shippingOrders || 0,
          deliveredOrders: s.deliveredOrders || 0,
          cancelledOrders: s.cancelledOrders || 0
        },
        recentOrders: recentOrdersRes.recordset
      }
    });
  } catch (err) {
    console.error('[ADMIN STATS ERROR]:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy dữ liệu thống kê: ' + err.message,
      data: null
    });
  }
}

router.get('/stats', getDashboardStatsHandler);
router.get('/dashboard', getDashboardStatsHandler);


// =====================================================================
// 2. QUẢN LÝ SẢN PHẨM (PRODUCTS CRUD)
// =====================================================================
router.get('/products', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM vw_ProductList ORDER BY ProductId DESC');
    return res.json({
      success: true,
      message: 'Lấy danh sách sản phẩm thành công',
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { sku, name, categoryId, brand, scale, price, oldPrice, depositAmount, quotaPercent, editionNote, preOrderDeadline, stock, imageUrl, description, status } = req.body;

    if (!sku || !name || !categoryId || !price) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ SKU, Tên, Danh mục và Giá bán', data: null });
    }

    const cleanSku = sku.trim();
    const skuCheck = await db.query('SELECT ProductId FROM Products WHERE Sku = @sku', { sku: cleanSku });
    if (skuCheck.recordset.length > 0) {
      return res.status(400).json({ success: false, message: `Mã SKU "${cleanSku}" đã tồn tại trên hệ thống, vui lòng chọn mã khác!`, data: null });
    }

    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'mini-gt';
    let slug = baseSlug;
    const slugCheck = await db.query('SELECT ProductId FROM Products WHERE Slug = @slug', { slug });
    if (slugCheck.recordset.length > 0) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const insertRes = await db.query(`
      INSERT INTO Products (Sku, Name, Slug, CategoryId, Brand, Scale, Price, OldPrice, DepositAmount, QuotaPercent, EditionNote, PreOrderDeadline, Stock, ImageUrl, Description, Status, IsFeatured, IsNew, CreatedAt)
      OUTPUT INSERTED.ProductId
      VALUES (@sku, @name, @slug, @categoryId, @brand, @scale, @price, @oldPrice, @depositAmount, @quotaPercent, @editionNote, @preOrderDeadline, @stock, @imageUrl, @description, @status, 1, 1, SYSDATETIME())
    `, {
      sku: cleanSku,
      name: name.trim(),
      slug: slug,
      categoryId: parseInt(categoryId),
      brand: brand || 'MINI GT',
      scale: scale || '1:64',
      price: parseFloat(price),
      oldPrice: oldPrice ? parseFloat(oldPrice) : null,
      depositAmount: depositAmount ? parseFloat(depositAmount) : null,
      quotaPercent: quotaPercent ? parseInt(quotaPercent) : 0,
      editionNote: editionNote || null,
      preOrderDeadline: preOrderDeadline || null,
      stock: parseInt(stock) || 0,
      imageUrl: imageUrl || 'image/hero-banner.png',
      description: description || '',
      status: status || 'in_stock'
    });

    return res.status(201).json({
      success: true,
      message: 'Thêm mô hình mới thành công!',
      data: { productId: insertRes.recordset[0].ProductId }
    });
  } catch (error) {
    console.error('[ADMIN CREATE PRODUCT ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, categoryId, brand, scale, price, oldPrice, depositAmount, quotaPercent, editionNote, preOrderDeadline, stock, imageUrl, description, status } = req.body;

    await db.query(`
      UPDATE Products SET
        Name = COALESCE(@name, Name),
        CategoryId = COALESCE(@categoryId, CategoryId),
        Brand = COALESCE(@brand, Brand),
        Scale = COALESCE(@scale, Scale),
        Price = COALESCE(@price, Price),
        OldPrice = @oldPrice,
        DepositAmount = @depositAmount,
        QuotaPercent = COALESCE(@quotaPercent, QuotaPercent),
        EditionNote = @editionNote,
        PreOrderDeadline = @preOrderDeadline,
        Stock = COALESCE(@stock, Stock),
        ImageUrl = COALESCE(@imageUrl, ImageUrl),
        Description = COALESCE(@description, Description),
        Status = COALESCE(@status, Status)
      WHERE ProductId = @productId
    `, {
      productId,
      name: name ? name.trim() : null,
      categoryId: categoryId ? parseInt(categoryId) : null,
      brand: brand || null,
      scale: scale || null,
      price: price ? parseFloat(price) : null,
      oldPrice: oldPrice !== undefined ? (oldPrice ? parseFloat(oldPrice) : null) : null,
      depositAmount: depositAmount !== undefined ? (depositAmount ? parseFloat(depositAmount) : null) : null,
      quotaPercent: quotaPercent !== undefined ? parseInt(quotaPercent) : null,
      editionNote: editionNote !== undefined ? editionNote : null,
      preOrderDeadline: preOrderDeadline !== undefined ? preOrderDeadline : null,
      stock: stock !== undefined ? parseInt(stock) : null,
      imageUrl: imageUrl || null,
      description: description || null,
      status: status || null
    });

    return res.json({ success: true, message: 'Cập nhật sản phẩm thành công!', data: { productId } });
  } catch (error) {
    console.error('[ADMIN UPDATE PRODUCT ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    await db.query('DELETE FROM Products WHERE ProductId = @productId', { productId });
    return res.json({ success: true, message: 'Đã xóa sản phẩm thành công', data: { productId } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

// NHÂN BẢN SẢN PHẨM (CLONE / DUPLICATE PRODUCT)
router.post('/products/:id/clone', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const originRes = await db.query('SELECT * FROM Products WHERE ProductId = @productId', { productId });
    if (originRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm nguồn để nhân bản', data: null });
    }
    const orig = originRes.recordset[0];
    const newSku = orig.Sku + '-C' + Math.floor(10 + Math.random() * 90);
    const newName = orig.Name + ' (Bản Sao)';
    const newSlug = newName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const insertRes = await db.query(`
      INSERT INTO Products (Sku, Name, Slug, CategoryId, Brand, Scale, Price, OldPrice, DepositAmount, QuotaPercent, EditionNote, PreOrderDeadline, Stock, ImageUrl, Description, Status, IsFeatured, IsNew, CreatedAt)
      OUTPUT INSERTED.ProductId
      VALUES (@sku, @name, @slug, @categoryId, @brand, @scale, @price, @oldPrice, @depositAmount, @quotaPercent, @editionNote, @preOrderDeadline, @stock, @imageUrl, @description, @status, 1, 1, SYSDATETIME())
    `, {
      sku: newSku,
      name: newName,
      slug: newSlug,
      categoryId: orig.CategoryId,
      brand: orig.Brand,
      scale: orig.Scale,
      price: orig.Price,
      oldPrice: orig.OldPrice,
      depositAmount: orig.DepositAmount,
      quotaPercent: orig.QuotaPercent,
      editionNote: orig.EditionNote,
      preOrderDeadline: orig.PreOrderDeadline,
      stock: orig.Stock,
      imageUrl: orig.ImageUrl,
      description: orig.Description,
      status: orig.Status
    });

    return res.status(201).json({
      success: true,
      message: `Đã nhân bản mô hình thành công với mã SKU mới: #${newSku}!`,
      data: { productId: insertRes.recordset[0].ProductId }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

// CẬP NHẬT NHANH TRẠNG THÁI HOẶC TỒN KHO TRỰC TIẾP
router.patch('/products/:id/quick-update', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { status, stock } = req.body;

    if (status !== undefined) {
      await db.query('UPDATE Products SET Status = @status WHERE ProductId = @productId', { productId, status });
    }
    if (stock !== undefined) {
      await db.query('UPDATE Products SET Stock = @stock WHERE ProductId = @productId', { productId, stock: parseInt(stock) || 0 });
    }

    return res.json({
      success: true,
      message: 'Cập nhật nhanh thông tin sản phẩm thành công',
      data: { productId, status, stock }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

// =====================================================================
// 3. QUẢN LÝ ĐƠN HÀNG TOÀN DIỆN (ADMIN ORDER FLOW & STATE MACHINE)
// =====================================================================

/**
 * GET /api/admin/orders
 * Hỗ trợ bộ lọc: status, paymentStatus, paymentMethod, search (OrderCode, FullName, Phone)
 */
router.get('/orders', async (req, res) => {
  try {
    const { status, paymentStatus, paymentMethod, search } = req.query;

    let whereClauses = [];
    let params = {};

    if (status && status !== 'ALL') {
      whereClauses.push('o.Status = @status');
      params.status = status.toUpperCase();
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      whereClauses.push('o.PaymentStatus = @paymentStatus');
      params.paymentStatus = paymentStatus.toUpperCase();
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      whereClauses.push('o.PaymentMethod = @paymentMethod');
      params.paymentMethod = paymentMethod.toUpperCase();
    }

    if (search && search.trim()) {
      whereClauses.push('(o.OrderCode LIKE @search OR o.FullName LIKE @search OR o.Phone LIKE @search)');
      params.search = `%${search.trim()}%`;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const queryStr = `
      SELECT o.*, u.Email AS CustomerEmail
      FROM Orders o
      LEFT JOIN Users u ON u.UserId = o.UserId
      ${whereSql}
      ORDER BY o.CreatedAt DESC
    `;

    const ordersRes = await db.query(queryStr, params);
    const orders = ordersRes.recordset;

    // Lấy items cho từng đơn
    for (const ord of orders) {
      const itemsRes = await db.query(`
        SELECT oi.*, p.Sku, p.ImageUrl, p.Scale
        FROM OrderItems oi
        LEFT JOIN Products p ON p.ProductId = oi.ProductId
        WHERE oi.OrderId = @orderId
      `, { orderId: ord.OrderId });
      ord.items = itemsRes.recordset;
    }

    // Lấy số lượng theo từng trạng thái để hiển thị badge số đếm trên tab và KPI
    const countsRes = await db.query(`
      SELECT 
        COUNT(*) AS totalAll,
        SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) AS countPending,
        SUM(CASE WHEN Status = 'CONFIRMED' THEN 1 ELSE 0 END) AS countConfirmed,
        SUM(CASE WHEN Status = 'SHIPPING' THEN 1 ELSE 0 END) AS countShipping,
        SUM(CASE WHEN Status = 'DELIVERED' THEN 1 ELSE 0 END) AS countDelivered,
        SUM(CASE WHEN Status = 'CANCELLED' THEN 1 ELSE 0 END) AS countCancelled,
        SUM(CASE WHEN PaymentMethod LIKE '%COD%' AND PaymentStatus = 'UNPAID' AND Status != 'CANCELLED' THEN Total ELSE 0 END) AS pendingCodTotal
      FROM Orders
    `);

    const c = countsRes.recordset[0] || {};

    return res.json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      count: orders.length,
      data: orders,
      counts: {
        all: c.totalAll || 0,
        pending: c.countPending || 0,
        confirmed: c.countConfirmed || 0,
        shipping: c.countShipping || 0,
        delivered: c.countDelivered || 0,
        cancelled: c.countCancelled || 0,
        pendingCodTotal: c.pendingCodTotal || 0
      }
    });
  } catch (error) {
    console.error('[ADMIN ORDERS GET ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

/**
 * GET /api/admin/orders/:id
 * Chi tiết đơn hàng đầy đủ
 */
router.get('/orders/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const orderRes = await db.query(`
      SELECT o.*, u.Email AS CustomerEmail
      FROM Orders o
      LEFT JOIN Users u ON u.UserId = o.UserId
      WHERE o.OrderId = @orderId
    `, { orderId });

    if (orderRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng này', data: null });
    }

    const order = orderRes.recordset[0];

    const itemsRes = await db.query(`
      SELECT oi.*, p.Sku, p.ImageUrl, p.Scale
      FROM OrderItems oi
      LEFT JOIN Products p ON p.ProductId = oi.ProductId
      WHERE oi.OrderId = @orderId
    `, { orderId });

    order.items = itemsRes.recordset;

    return res.json({
      success: true,
      message: 'Lấy chi tiết đơn hàng thành công',
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

/**
 * PUT /api/admin/orders/:id/confirm-payment
 * Xác nhận đã nhận tiền (Confirm Paid) cho đơn chuyển khoản
 */
router.put('/orders/:id/confirm-payment', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const orderRes = await db.query('SELECT OrderId, PaymentMethod, Status, PaymentStatus FROM Orders WHERE OrderId = @orderId', { orderId });

    if (orderRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng', data: null });
    }

    const order = orderRes.recordset[0];

    if (order.Status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã bị hủy, không thể xác nhận thanh toán', data: null });
    }

    await db.query(`
      UPDATE Orders 
      SET PaymentStatus = 'PAID'
      WHERE OrderId = @orderId
    `, { orderId });

    return res.json({
      success: true,
      message: `Đã xác nhận nhận tiền thành công cho đơn #${orderId}! Giờ đây bạn có thể duyệt đơn.`,
      data: { orderId, paymentStatus: 'PAID' }
    });
  } catch (error) {
    console.error('[CONFIRM PAYMENT ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

/**
 * PUT /api/admin/orders/:id/approve
 * Duyệt đơn hàng (Approve)
 * Điều kiện:
 * - COD: Duyệt bình thường -> Status = 'CONFIRMED'
 * - BANK_TRANSFER: BẮT BUỘC PaymentStatus == 'PAID' mới được duyệt
 */
router.put('/orders/:id/approve', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const orderRes = await db.query('SELECT OrderId, PaymentMethod, Status, PaymentStatus FROM Orders WHERE OrderId = @orderId', { orderId });

    if (orderRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng', data: null });
    }

    const order = orderRes.recordset[0];

    if (order.Status !== 'PENDING' && order.Status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng đang ở trạng thái "${order.Status}", chỉ đơn "Chờ duyệt" (PENDING) mới có thể duyệt!`,
        data: null
      });
    }

    // Kiểm tra điều kiện phương thức thanh toán
    const isBank = (order.PaymentMethod || '').toUpperCase().includes('BANK');
    const isPaid = (order.PaymentStatus || '').toUpperCase() === 'PAID';

    if (isBank && !isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng Chuyển khoản ngân hàng cần được "Xác nhận đã nhận tiền" trước khi duyệt đơn!',
        data: null
      });
    }

    await db.query(`
      UPDATE Orders 
      SET Status = 'CONFIRMED'
      WHERE OrderId = @orderId
    `, { orderId });

    return res.json({
      success: true,
      message: `Đã duyệt đơn hàng #${orderId} thành công (Trạng thái: ĐÃ DUYỆT / CONFIRMED)`,
      data: { orderId, status: 'CONFIRMED' }
    });
  } catch (error) {
    console.error('[APPROVE ORDER ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

/**
 * PUT /api/admin/orders/:id/ship
 * Bắt đầu giao hàng (qua SPX Express hoặc đối tác vận chuyển)
 * Điều kiện: Status phải là 'CONFIRMED'
 */
router.put('/orders/:id/ship', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { trackingCode, carrier } = req.body || {};
    const orderRes = await db.query('SELECT OrderId, Status, PaymentMethod, PaymentStatus, TrackingCode FROM Orders WHERE OrderId = @orderId', { orderId });

    if (orderRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng', data: null });
    }

    const order = orderRes.recordset[0];
    const ordStatus = (order.Status || '').toUpperCase();
    const isBank = (order.PaymentMethod || '').toUpperCase().includes('BANK');
    const isPaid = (order.PaymentStatus || '').toUpperCase() === 'PAID';

    if (ordStatus === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã bị hủy, không thể giao hàng!', data: null });
    }

    if (isBank && !isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Đơn chuyển khoản ngân hàng cần được "Xác nhận đã nhận tiền" trước khi giao hàng!',
        data: null
      });
    }

    const finalTracking = trackingCode ? trackingCode.trim() : (order.TrackingCode || null);
    const finalCarrier = carrier ? carrier.trim() : 'SPX';

    await db.query(`
      UPDATE Orders 
      SET Status = 'SHIPPING',
          TrackingCode = @trackingCode,
          TrackingCarrier = @carrier
      WHERE OrderId = @orderId
    `, {
      orderId,
      trackingCode: finalTracking,
      carrier: finalCarrier
    });

    return res.json({
      success: true,
      message: `Đơn hàng #${orderId} đã chuyển sang trạng thái "Đang giao hàng" qua ${finalCarrier} Express${finalTracking ? ` (Mã vận đơn: ${finalTracking})` : ''}`,
      data: { orderId, status: 'SHIPPING', trackingCode: finalTracking, carrier: finalCarrier }
    });
  } catch (error) {
    console.error('[SHIP ORDER ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

/**
 * PUT /api/admin/orders/:id/tracking
 * Cập nhật hoặc bổ sung mã vận đơn SPX Express
 */
router.put('/orders/:id/tracking', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { trackingCode, carrier } = req.body || {};

    if (!trackingCode || !trackingCode.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã vận đơn từ app SPX Express', data: null });
    }

    const cleanCode = trackingCode.trim();
    const finalCarrier = (carrier && carrier.trim()) || 'SPX';

    await db.query(`
      UPDATE Orders 
      SET TrackingCode = @trackingCode,
          TrackingCarrier = @carrier
      WHERE OrderId = @orderId
    `, {
      orderId,
      trackingCode: cleanCode,
      carrier: finalCarrier
    });

    return res.json({
      success: true,
      message: `Đã cập nhật mã vận đơn ${finalCarrier} Express: ${cleanCode} cho đơn #${orderId}!`,
      data: { orderId, trackingCode: cleanCode, carrier: finalCarrier }
    });
  } catch (error) {
    console.error('[UPDATE TRACKING ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

/**
 * PUT /api/admin/orders/:id/complete
 * Đã giao hàng thành công & thu tiền (nếu COD)
 * Tự động cập nhật:
 * - Status = 'DELIVERED'
 * - PaymentStatus = 'PAID' (đặc biệt đối với đơn COD)
 */
router.put('/orders/:id/complete', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const orderRes = await db.query('SELECT OrderId, Status, PaymentMethod FROM Orders WHERE OrderId = @orderId', { orderId });

    if (orderRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng', data: null });
    }

    const order = orderRes.recordset[0];

    if (order.Status !== 'SHIPPING' && order.Status !== 'shipping' && order.Status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng cần đang ở trạng thái giao hàng (SHIPPING) để hoàn tất!`,
        data: null
      });
    }

    await db.query(`
      UPDATE Orders 
      SET Status = 'DELIVERED', PaymentStatus = 'PAID'
      WHERE OrderId = @orderId
    `, { orderId });

    return res.json({
      success: true,
      message: `Đơn hàng #${orderId} đã hoàn tất giao hàng & thu tiền thành công (Trạng thái: ĐÃ GIAO / DELIVERED, Thanh toán: ĐÃ THANH TOÁN / PAID)`,
      data: { orderId, status: 'DELIVERED', paymentStatus: 'PAID' }
    });
  } catch (error) {
    console.error('[COMPLETE ORDER ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

/**
 * PUT /api/admin/orders/:id/cancel
 * Hủy đơn hàng kèm lý do
 * Điều kiện: Chỉ cho phép hủy khi Status là 'PENDING' hoặc 'CONFIRMED'
 * Nếu đơn đã thanh toán (PAID), tự động chuyển PaymentStatus thành 'REFUNDED'
 */
router.put('/orders/:id/cancel', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { cancelReason } = req.body;

    if (!cancelReason || !cancelReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do hủy đơn hàng',
        data: null
      });
    }

    const orderRes = await db.query('SELECT OrderId, Status, PaymentStatus FROM Orders WHERE OrderId = @orderId', { orderId });

    if (orderRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng', data: null });
    }

    const order = orderRes.recordset[0];

    const currentStatus = (order.Status || '').toUpperCase();
    if (currentStatus !== 'PENDING' && currentStatus !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy đơn hàng đang giao (SHIPPING) hoặc đã hoàn tất (DELIVERED)!`,
        data: null
      });
    }

    const isPaid = (order.PaymentStatus || '').toUpperCase() === 'PAID';
    const newPaymentStatus = isPaid ? 'REFUNDED' : (order.PaymentStatus || 'UNPAID');

    await db.query(`
      UPDATE Orders 
      SET Status = 'CANCELLED',
          CancelReason = @reason,
          PaymentStatus = @paymentStatus
      WHERE OrderId = @orderId
    `, {
      orderId,
      reason: cancelReason.trim(),
      paymentStatus: newPaymentStatus
    });

    const refundMsg = isPaid ? ' (Đơn đã thanh toán trước đó nên trạng thái thanh toán được chuyển sang CẦN HOÀN TIỀN / REFUNDED)' : '';

    return res.json({
      success: true,
      message: `Đã hủy đơn hàng #${orderId} thành công.${refundMsg}`,
      data: {
        orderId,
        status: 'CANCELLED',
        paymentStatus: newPaymentStatus,
        cancelReason: cancelReason.trim()
      }
    });
  } catch (error) {
    console.error('[CANCEL ORDER ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

// Fallback cập nhật nhanh trạng thái
router.put('/orders/:id/status', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    let { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số status', data: null });
    }

    status = status.toUpperCase();
    const allowed = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái đơn hàng không hợp lệ', data: null });
    }

    await db.query('UPDATE Orders SET Status = @status WHERE OrderId = @orderId', { orderId, status });
    return res.json({ success: true, message: `Đã cập nhật trạng thái đơn sang "${status}"`, data: { orderId, status } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

// =====================================================================
// 4. DANH SÁCH KHÁCH HÀNG & BẢN TIN
// =====================================================================
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT UserId, FullName, Email, Role, AuthProvider, Phone, Address, CreatedAt, LastLoginAt
      FROM Users
      ORDER BY CreatedAt DESC
    `);
    return res.json({
      success: true,
      message: 'Lấy danh sách người dùng thành công',
      data: result.recordset
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (!role || !['admin', 'customer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ (chỉ chấp nhận admin hoặc customer)', data: null });
    }

    if (userId === req.user.userId && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Không thể tự hạ quyền Quản trị viên của chính tài khoản đang đăng nhập', data: null });
    }

    await db.query('UPDATE Users SET Role = @role WHERE UserId = @userId', { userId, role });

    return res.json({
      success: true,
      message: `Đã cập nhật vai trò người dùng thành "${role.toUpperCase()}"`,
      data: { userId, role }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

router.get('/subscribers', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Newsletter ORDER BY CreatedAt DESC');
    return res.json({
      success: true,
      message: 'Lấy danh sách bản tin thành công',
      data: result.recordset
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
});

module.exports = router;
