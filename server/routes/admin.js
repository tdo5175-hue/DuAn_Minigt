/**
 * ADMIN API ROUTES - QUẢN TRỊ TOÀN DIỆN MINI GT STORE
 * Bảo mật: Token JWT hợp lệ + Quyền Role === 'admin' (Xác thực trực tiếp từ CSDL SQL Server)
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const settingsService = require('../services/settingsService');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { ok, created, badRequest, notFound, conflict } = require('../utils/http');
const v = require('../utils/validators');

// Tất cả route admin đều yêu cầu đăng nhập & quyền admin thực tế trong DB
router.use(authenticate, requireAdmin);

// =====================================================================
// 1. DASHBOARD & THỐNG KÊ (REAL-TIME METRICS)
// =====================================================================
router.get(['/stats', '/dashboard'], async (req, res, next) => {
  try {
    const settings = await settingsService.getAll();
    const lowStockThreshold = Number(settings.low_stock_threshold) || 5;

    // 1. Đếm sản phẩm
    const productsRes = await db.query(`
      SELECT 
        COUNT(*) AS totalProducts,
        SUM(CASE WHEN Stock <= @lowStock AND Stock > 0 THEN 1 ELSE 0 END) AS lowStockCount,
        SUM(CASE WHEN Stock = 0 OR Status = 'sold_out' THEN 1 ELSE 0 END) AS outOfStockCount
      FROM Products WHERE IsActive = 1`,
      { lowStock: lowStockThreshold }
    );

    // 2. Thống kê đơn hàng và doanh thu thực
    const ordersRes = await db.query(`
      SELECT 
        COUNT(*) AS totalOrders,
        ISNULL(SUM(CASE WHEN PaymentStatus = 'PAID' THEN Total 
                        WHEN PaymentStatus = 'PARTIALLY_PAID' THEN DepositAmount 
                        ELSE 0 END), 0) AS totalRevenue,
        ISNULL(SUM(CASE WHEN PaymentStatus = 'PARTIALLY_PAID' THEN DepositAmount ELSE 0 END), 0) AS totalDeposits,
        SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) AS pendingOrders,
        SUM(CASE WHEN Status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmedOrders,
        SUM(CASE WHEN Status = 'PREPARING' THEN 1 ELSE 0 END) AS preparingOrders,
        SUM(CASE WHEN Status = 'SHIPPING' THEN 1 ELSE 0 END) AS shippingOrders,
        SUM(CASE WHEN Status = 'DELIVERED' THEN 1 ELSE 0 END) AS deliveredOrders,
        SUM(CASE WHEN Status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledOrders
      FROM Orders
    `);

    // 3. Khách hàng & Bản tin
    const usersCountRes = await db.query("SELECT COUNT(*) AS total FROM Users WHERE Role != 'admin'");
    const subscribersCountRes = await db.query('SELECT COUNT(*) AS total FROM Newsletter');

    // 4. Đơn hàng gần đây nhất (TOP 8)
    const recentOrdersRes = await db.query(`
      SELECT TOP 8 o.OrderId, o.OrderCode, o.FullName, o.Phone, o.Total, o.DepositAmount, o.Status, o.PaymentStatus, o.PaymentMethod, o.CreatedAt,
             (SELECT COUNT(*) FROM OrderItems oi WHERE oi.OrderId = o.OrderId) AS ItemCount
      FROM Orders o
      ORDER BY o.CreatedAt DESC
    `);

    // 5. Mô hình bán chạy nhất (TOP 5)
    const bestSellersRes = await db.query(`
      SELECT TOP 5 p.ProductId, p.Sku, p.Name, p.ImageUrl, p.Price, p.Stock, ISNULL(SUM(oi.Quantity), 0) AS UnitsSold
      FROM OrderItems oi
      JOIN Orders o ON o.OrderId = oi.OrderId AND o.Status <> 'CANCELLED'
      JOIN Products p ON p.ProductId = oi.ProductId
      GROUP BY p.ProductId, p.Sku, p.Name, p.ImageUrl, p.Price, p.Stock
      ORDER BY UnitsSold DESC
    `);

    const p = productsRes.recordset[0] || {};
    const o = ordersRes.recordset[0] || {};

    const kpis = {
      revenue: {
        total: Number(o.totalRevenue) || 0,
        totalFormatted: new Intl.NumberFormat('vi-VN').format(Math.round(Number(o.totalRevenue) || 0)) + 'đ'
      },
      orders: {
        total: Number(o.totalOrders) || 0
      },
      products: {
        total: Number(p.totalProducts) || 0,
        lowStock: Number(p.lowStockCount) || 0
      },
      customers: {
        total: Number(usersCountRes.recordset[0].total) || 0
      }
    };

    return ok(res, {
      stats: {
        totalRevenue: Number(o.totalRevenue) || 0,
        totalDeposits: Number(o.totalDeposits) || 0,
        totalOrders: Number(o.totalOrders) || 0,
        totalProducts: Number(p.totalProducts) || 0,
        lowStockProducts: Number(p.lowStockCount) || 0,
        outOfStockProducts: Number(p.outOfStockCount) || 0,
        totalCustomers: Number(usersCountRes.recordset[0].total) || 0,
        totalSubscribers: Number(subscribersCountRes.recordset[0].total) || 0,
        pendingOrders: Number(o.pendingOrders) || 0,
        confirmedOrders: Number(o.confirmedOrders) || 0,
        preparingOrders: Number(o.preparingOrders) || 0,
        shippingOrders: Number(o.shippingOrders) || 0,
        deliveredOrders: Number(o.deliveredOrders) || 0,
        cancelledOrders: Number(o.cancelledOrders) || 0
      },
      kpis,
      recentOrders: recentOrdersRes.recordset.map(row => orderService.mapOrder(row)),
      bestSellers: bestSellersRes.recordset.map(b => ({
        id: Number(b.ProductId),
        sku: b.Sku,
        name: b.Name,
        image: b.ImageUrl,
        price: Number(b.Price) || 0,
        stock: Number(b.Stock) || 0,
        unitsSold: Number(b.UnitsSold) || 0
      }))
    }, 'Lấy dữ liệu thống kê thành công');
  } catch (err) {
    next(err);
  }
});

// =====================================================================
// 2. QUẢN LÝ SẢN PHẨM (PRODUCTS CRUD)
// =====================================================================

// Danh sách sản phẩm kèm lọc, tìm kiếm, phân trang
router.get('/products', async (req, res, next) => {
  try {
    const { category, status, stock, search, sort, page = 1, limit = 20 } = req.query;

    let queryStr = productService.BASE_SELECT + ' WHERE p.IsActive = 1';
    const params = {};

    if (category && category !== 'all') {
      queryStr += ' AND (c.Slug = @category OR c.CategoryId = TRY_CAST(@category AS INT))';
      params.category = category;
    }

    if (status && status !== 'all') {
      queryStr += ' AND p.Status = @status';
      params.status = status;
    }

    if (stock) {
      if (stock === 'out_of_stock') {
        queryStr += ' AND (p.Stock <= 0 OR p.Status = \'sold_out\')';
      } else if (stock === 'low_stock') {
        queryStr += ' AND p.Stock > 0 AND p.Stock <= 5';
      } else if (stock === 'in_stock') {
        queryStr += ' AND p.Stock > 5';
      }
    }

    if (search && search.trim()) {
      queryStr += ' AND (p.Name LIKE @search OR p.Sku LIKE @search OR p.Brand LIKE @search OR c.Name LIKE @search)';
      params.search = v.likeParam(search.trim());
    }

    // Sort
    switch (sort) {
      case 'price_asc': queryStr += ' ORDER BY p.Price ASC'; break;
      case 'price_desc': queryStr += ' ORDER BY p.Price DESC'; break;
      case 'stock_asc': queryStr += ' ORDER BY p.Stock ASC'; break;
      case 'stock_desc': queryStr += ' ORDER BY p.Stock DESC'; break;
      case 'name_asc': queryStr += ' ORDER BY p.Name ASC'; break;
      case 'best_selling': queryStr += ' ORDER BY SoldCount DESC'; break;
      default: queryStr += ' ORDER BY p.ProductId DESC'; break;
    }

    const result = await db.query(queryStr, params);
    const all = result.recordset.map(productService.mapProduct);

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const total = all.length;
    const paginated = all.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    return ok(res, paginated, 'Lấy danh sách sản phẩm thành công', {
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Chi tiết sản phẩm
router.get('/products/:id', async (req, res, next) => {
  try {
    const id = v.int(req.params.id, { min: 1 });
    if (!id) throw badRequest('Mã sản phẩm không hợp lệ');

    const product = await productService.findById(id);
    if (!product) throw notFound('Không tìm thấy sản phẩm');

    return ok(res, product, 'Chi tiết sản phẩm');
  } catch (error) {
    next(error);
  }
});

// Thêm sản phẩm mới
router.post('/products', async (req, res, next) => {
  try {
    const sku = v.str(req.body.sku, 30);
    const name = v.str(req.body.name, 200);
    const categoryId = v.int(req.body.categoryId, { min: 1 });
    const brand = v.str(req.body.brand || 'MINI GT', 100);
    const scale = v.str(req.body.scale || '1:64', 20);
    const price = v.num(req.body.price);
    const oldPrice = v.num(req.body.oldPrice, null);
    const depositAmount = v.num(req.body.depositAmount, null);
    const quotaPercent = v.int(req.body.quotaPercent, { min: 0, max: 100, def: 0 });
    const editionNote = v.optStr(req.body.editionNote, 150);
    const preOrderDeadline = req.body.preOrderDeadline ? String(req.body.preOrderDeadline).slice(0, 10) : null;
    const stock = v.int(req.body.stock, { min: 0, def: 0 });
    const imageUrl = v.str(req.body.imageUrl || 'image/hero-banner.jpg', 255);
    const description = v.str(req.body.description, 5000);
    const status = ['in_stock', 'pre_order', 'sold_out'].includes(req.body.status) ? req.body.status : 'in_stock';
    const isFeatured = req.body.isFeatured ? 1 : 0;
    const isNew = req.body.isNew ? 1 : 0;

    if (!sku) throw badRequest('Vui lòng nhập mã SKU sản phẩm');
    if (name.length < 3) throw badRequest('Tên sản phẩm tối thiểu 3 ký tự');
    if (!categoryId) throw badRequest('Vui lòng chọn danh mục sản phẩm');
    if (!price || price <= 0) throw badRequest('Giá bán phải lớn hơn 0');
    if (oldPrice != null && oldPrice <= price) throw badRequest('Giá gốc (cũ) phải lớn hơn giá bán');

    // Kiểm tra SKU trùng
    const skuCheck = await db.query('SELECT ProductId FROM Products WHERE Sku = @sku', { sku });
    if (skuCheck.recordset.length > 0) {
      throw conflict(`Mã SKU "${sku}" đã tồn tại. Vui lòng chọn mã khác.`);
    }

    // Tạo slug duy nhất
    let baseSlug = v.slugify(name);
    let slug = baseSlug;
    const slugCheck = await db.query('SELECT ProductId FROM Products WHERE Slug = @slug', { slug });
    if (slugCheck.recordset.length > 0) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const insertRes = await db.query(`
      INSERT INTO Products (Sku, Name, Slug, CategoryId, Brand, Scale, Price, OldPrice, DepositAmount, QuotaPercent, EditionNote, PreOrderDeadline, Stock, ImageUrl, Description, Status, IsFeatured, IsNew, IsActive, CreatedAt, UpdatedAt)
      OUTPUT INSERTED.ProductId
      VALUES (@sku, @name, @slug, @categoryId, @brand, @scale, @price, @oldPrice, @depositAmount, @quotaPercent, @editionNote, @preOrderDeadline, @stock, @imageUrl, @description, @status, @isFeatured, @isNew, 1, SYSDATETIME(), SYSDATETIME())
    `, {
      sku, name, slug, categoryId, brand, scale, price, oldPrice, depositAmount,
      quotaPercent, editionNote, preOrderDeadline, stock, imageUrl, description,
      status, isFeatured, isNew
    });

    const newId = Number(insertRes.recordset[0].ProductId);

    // Lưu gallery ảnh nếu có
    if (Array.isArray(req.body.gallery) && req.body.gallery.length > 0) {
      let order = 1;
      for (const img of req.body.gallery) {
        if (img && typeof img === 'string') {
          await db.query(
            'INSERT INTO ProductImages (ProductId, ImageUrl, SortOrder) VALUES (@id, @url, @ord)',
            { id: newId, url: img.trim(), ord: order++ }
          );
        }
      }
    }

    const product = await productService.findById(newId);
    return created(res, product, 'Thêm mô hình xe thành công!');
  } catch (error) {
    next(error);
  }
});

// Cập nhật sản phẩm
router.put('/products/:id', async (req, res, next) => {
  try {
    const productId = v.int(req.params.id, { min: 1 });
    if (!productId) throw badRequest('Mã sản phẩm không hợp lệ');

    const existingRes = await db.query('SELECT * FROM Products WHERE ProductId = @id', { id: productId });
    if (existingRes.recordset.length === 0) throw notFound('Không tìm thấy sản phẩm');
    const existing = existingRes.recordset[0];

    const sku = req.body.sku !== undefined ? v.str(req.body.sku, 30) : existing.Sku;
    const name = req.body.name !== undefined ? v.str(req.body.name, 200) : existing.Name;
    const categoryId = req.body.categoryId !== undefined ? v.int(req.body.categoryId, { min: 1 }) : existing.CategoryId;
    const brand = req.body.brand !== undefined ? v.str(req.body.brand, 100) : existing.Brand;
    const scale = req.body.scale !== undefined ? v.str(req.body.scale, 20) : existing.Scale;
    const price = req.body.price !== undefined ? v.num(req.body.price) : Number(existing.Price);
    const oldPrice = req.body.oldPrice !== undefined ? v.num(req.body.oldPrice, null) : existing.OldPrice;
    const depositAmount = req.body.depositAmount !== undefined ? v.num(req.body.depositAmount, null) : existing.DepositAmount;
    const quotaPercent = req.body.quotaPercent !== undefined ? v.int(req.body.quotaPercent, { min: 0, max: 100, def: 0 }) : existing.QuotaPercent;
    const editionNote = req.body.editionNote !== undefined ? v.optStr(req.body.editionNote, 150) : existing.EditionNote;
    const preOrderDeadline = req.body.preOrderDeadline !== undefined ? (req.body.preOrderDeadline ? String(req.body.preOrderDeadline).slice(0, 10) : null) : existing.PreOrderDeadline;
    const stock = req.body.stock !== undefined ? v.int(req.body.stock, { min: 0, def: 0 }) : existing.Stock;
    const imageUrl = req.body.imageUrl !== undefined ? v.str(req.body.imageUrl, 255) : existing.ImageUrl;
    const description = req.body.description !== undefined ? v.str(req.body.description, 5000) : existing.Description;
    const status = req.body.status !== undefined ? (['in_stock', 'pre_order', 'sold_out'].includes(req.body.status) ? req.body.status : existing.Status) : existing.Status;
    const isFeatured = req.body.isFeatured !== undefined ? (req.body.isFeatured ? 1 : 0) : existing.IsFeatured;
    const isNew = req.body.isNew !== undefined ? (req.body.isNew ? 1 : 0) : existing.IsNew;

    if (!sku) throw badRequest('Mã SKU không được để trống');
    if (!name || name.length < 3) throw badRequest('Tên sản phẩm tối thiểu 3 ký tự');
    if (!price || price <= 0) throw badRequest('Giá bán phải lớn hơn 0');
    if (oldPrice != null && oldPrice <= price) throw badRequest('Giá gốc (cũ) phải lớn hơn giá bán');

    // Kiểm tra SKU nếu thay đổi
    if (sku !== existing.Sku) {
      const skuCheck = await db.query('SELECT ProductId FROM Products WHERE Sku = @sku AND ProductId <> @id', { sku, id: productId });
      if (skuCheck.recordset.length > 0) throw conflict(`Mã SKU "${sku}" đã được sử dụng bởi sản phẩm khác`);
    }

    await db.query(`
      UPDATE Products SET
        Sku = @sku,
        Name = @name,
        CategoryId = @categoryId,
        Brand = @brand,
        Scale = @scale,
        Price = @price,
        OldPrice = @oldPrice,
        DepositAmount = @depositAmount,
        QuotaPercent = @quotaPercent,
        EditionNote = @editionNote,
        PreOrderDeadline = @preOrderDeadline,
        Stock = @stock,
        ImageUrl = @imageUrl,
        Description = @description,
        Status = @status,
        IsFeatured = @isFeatured,
        IsNew = @isNew,
        UpdatedAt = SYSDATETIME()
      WHERE ProductId = @productId
    `, {
      productId, sku, name, categoryId, brand, scale, price, oldPrice, depositAmount,
      quotaPercent, editionNote, preOrderDeadline, stock, imageUrl, description,
      status, isFeatured, isNew
    });

    // Cập nhật gallery ảnh nếu có gửi lên
    if (Array.isArray(req.body.gallery)) {
      await db.query('DELETE FROM ProductImages WHERE ProductId = @id', { id: productId });
      let order = 1;
      for (const img of req.body.gallery) {
        if (img && typeof img === 'string') {
          await db.query(
            'INSERT INTO ProductImages (ProductId, ImageUrl, SortOrder) VALUES (@id, @url, @ord)',
            { id: productId, url: img.trim(), ord: order++ }
          );
        }
      }
    }

    const updated = await productService.findById(productId);
    return ok(res, updated, 'Cập nhật sản phẩm thành công!');
  } catch (error) {
    next(error);
  }
});

// Xóa sản phẩm (Soft delete an toàn)
router.delete('/products/:id', async (req, res, next) => {
  try {
    const productId = v.int(req.params.id, { min: 1 });
    if (!productId) throw badRequest('Mã sản phẩm không hợp lệ');

    // Kiểm tra xem sản phẩm có nằm trong đơn hàng nào không
    const orderCheck = await db.query('SELECT TOP 1 OrderId FROM OrderItems WHERE ProductId = @id', { id: productId });

    if (orderCheck.recordset.length > 0) {
      // Ẩn sản phẩm (Soft delete) để bảo toàn lịch sử đơn hàng
      await db.query('UPDATE Products SET IsActive = 0, UpdatedAt = SYSDATETIME() WHERE ProductId = @id', { id: productId });
      return ok(res, { productId, softDeleted: true }, 'Sản phẩm đã có trong đơn hàng nên được chuyển sang trạng thái "Ẩn khỏi cửa hàng" để bảo toàn dữ liệu');
    } else {
      // Xóa hoàn toàn
      await db.query('DELETE FROM Products WHERE ProductId = @id', { id: productId });
      return ok(res, { productId, hardDeleted: true }, 'Đã xóa hoàn toàn sản phẩm khỏi hệ thống');
    }
  } catch (error) {
    next(error);
  }
});

// Nhân bản sản phẩm (Clone)
router.post('/products/:id/clone', async (req, res, next) => {
  try {
    const productId = v.int(req.params.id, { min: 1 });
    const orig = await productService.findById(productId);
    if (!orig) throw notFound('Không tìm thấy sản phẩm nguồn để nhân bản');

    const newSku = orig.sku + '-C' + Math.floor(10 + Math.random() * 90);
    const newName = orig.name + ' (Bản Sao)';
    const newSlug = v.slugify(newName) + '-' + Date.now().toString().slice(-4);

    const insertRes = await db.query(`
      INSERT INTO Products (Sku, Name, Slug, CategoryId, Brand, Scale, Price, OldPrice, DepositAmount, QuotaPercent, EditionNote, PreOrderDeadline, Stock, ImageUrl, Description, Status, IsFeatured, IsNew, IsActive, CreatedAt, UpdatedAt)
      OUTPUT INSERTED.ProductId
      VALUES (@sku, @name, @slug, @categoryId, @brand, @scale, @price, @oldPrice, @depositAmount, @quotaPercent, @editionNote, @preOrderDeadline, @stock, @imageUrl, @description, @status, 0, 1, 1, SYSDATETIME(), SYSDATETIME())
    `, {
      sku: newSku,
      name: newName,
      slug: newSlug,
      categoryId: orig.category.id,
      brand: orig.brand,
      scale: orig.scale,
      price: orig.price,
      oldPrice: orig.oldPrice,
      depositAmount: orig.depositAmount,
      quotaPercent: orig.quotaPercent,
      editionNote: orig.editionNote,
      preOrderDeadline: orig.preOrderDeadline,
      stock: orig.stock,
      imageUrl: orig.image,
      description: orig.description,
      status: orig.status
    });

    const newId = Number(insertRes.recordset[0].ProductId);
    const cloned = await productService.findById(newId);
    return created(res, cloned, `Đã nhân bản sản phẩm thành công với mã SKU mới: #${newSku}`);
  } catch (error) {
    next(error);
  }
});

// Cập nhật nhanh trạng thái hoặc tồn kho
router.patch('/products/:id/quick-update', async (req, res, next) => {
  try {
    const productId = v.int(req.params.id, { min: 1 });
    const { status, stock, isFeatured, isNew } = req.body;

    const sets = ['UpdatedAt = SYSDATETIME()'];
    const params = { productId };

    if (status !== undefined && ['in_stock', 'pre_order', 'sold_out'].includes(status)) {
      sets.push('Status = @status');
      params.status = status;
    }
    if (stock !== undefined) {
      sets.push('Stock = @stock');
      params.stock = Math.max(0, parseInt(stock) || 0);
    }
    if (isFeatured !== undefined) {
      sets.push('IsFeatured = @isFeatured');
      params.isFeatured = isFeatured ? 1 : 0;
    }
    if (isNew !== undefined) {
      sets.push('IsNew = @isNew');
      params.isNew = isNew ? 1 : 0;
    }

    await db.query(`UPDATE Products SET ${sets.join(', ')} WHERE ProductId = @productId`, params);
    const updated = await productService.findById(productId);
    return ok(res, updated, 'Cập nhật nhanh thành công');
  } catch (error) {
    next(error);
  }
});

// =====================================================================
// 3. QUẢN LÝ ĐƠN HÀNG TOÀN DIỆN (ADMIN ORDERS)
// =====================================================================

// Danh sách đơn hàng kèm lọc, đếm theo tab
router.get('/orders', async (req, res, next) => {
  try {
    const { status, paymentStatus, paymentMethod, search, page = 1, limit = 20 } = req.query;

    let whereClauses = [];
    const params = {};

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
      whereClauses.push('(o.OrderCode LIKE @search OR o.FullName LIKE @search OR o.Phone LIKE @search OR o.Email LIKE @search)');
      params.search = v.likeParam(search.trim());
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const ordersRes = await db.query(`
      SELECT o.*, u.Email AS CustomerEmail,
             (SELECT COUNT(*) FROM OrderItems oi WHERE oi.OrderId = o.OrderId) AS ItemCount
      FROM Orders o
      LEFT JOIN Users u ON u.UserId = o.UserId
      ${whereSql}
      ORDER BY o.CreatedAt DESC
    `, params);

    const countsRes = await db.query(`
      SELECT 
        COUNT(*) AS totalAll,
        SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) AS countPending,
        SUM(CASE WHEN Status = 'CONFIRMED' THEN 1 ELSE 0 END) AS countConfirmed,
        SUM(CASE WHEN Status = 'PREPARING' THEN 1 ELSE 0 END) AS countPreparing,
        SUM(CASE WHEN Status = 'SHIPPING' THEN 1 ELSE 0 END) AS countShipping,
        SUM(CASE WHEN Status = 'DELIVERED' THEN 1 ELSE 0 END) AS countDelivered,
        SUM(CASE WHEN Status = 'CANCELLED' THEN 1 ELSE 0 END) AS countCancelled
      FROM Orders
    `);

    const c = countsRes.recordset[0] || {};
    const all = ordersRes.recordset.map(row => orderService.mapOrder(row, { admin: true }));

    // Phân trang
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const total = all.length;
    const paginated = all.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    return ok(res, paginated, 'Lấy danh sách đơn hàng thành công', {
      counts: {
        all: Number(c.totalAll) || 0,
        pending: Number(c.countPending) || 0,
        confirmed: Number(c.countConfirmed) || 0,
        preparing: Number(c.countPreparing) || 0,
        shipping: Number(c.countShipping) || 0,
        delivered: Number(c.countDelivered) || 0,
        cancelled: Number(c.countCancelled) || 0
      },
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Chi tiết đơn hàng
router.get('/orders/:id', async (req, res, next) => {
  try {
    const orderId = v.int(req.params.id, { min: 1 });
    if (!orderId) throw badRequest('Mã đơn hàng không hợp lệ');

    const row = await orderService.loadOrderRow('o.OrderId = @id', { id: orderId });
    if (!row) throw notFound('Không tìm thấy đơn hàng');

    const order = await orderService.getFullOrder(row, { admin: true });
    return ok(res, order, 'Chi tiết đơn hàng');
  } catch (error) {
    next(error);
  }
});

// Chuyển trạng thái đơn hàng (Tuân thủ nghiêm ngặt State Machine)
router.put('/orders/:id/status', async (req, res, next) => {
  try {
    const orderId = v.int(req.params.id, { min: 1 });
    const { status, note, trackingCode, carrier, cancelReason } = req.body;
    if (!orderId) throw badRequest('Mã đơn hàng không hợp lệ');

    const updated = await orderService.changeStatus(orderId, status, {
      note, trackingCode, carrier, cancelReason
    }, req.user.userId);

    return ok(res, updated, `Đã cập nhật trạng thái đơn hàng sang "${updated.statusLabel}"`);
  } catch (error) {
    next(error);
  }
});

// Xác nhận thanh toán (Xác nhận cọc hoặc Thanh toán đủ 100%)
router.put(['/orders/:id/confirm-payment', '/orders/:id/payment'], async (req, res, next) => {
  try {
    const orderId = v.int(req.params.id, { min: 1 });
    const { kind = 'full' } = req.body; // 'deposit' hoặc 'full'
    if (!orderId) throw badRequest('Mã đơn hàng không hợp lệ');

    const updated = await orderService.confirmPayment(orderId, kind, req.user.userId);
    return ok(res, updated, `Đã xác nhận thanh toán thành công cho đơn #${updated.code}`);
  } catch (error) {
    next(error);
  }
});

// Cập nhật mã vận đơn giao hàng (SPX Express)
router.put('/orders/:id/tracking', async (req, res, next) => {
  try {
    const orderId = v.int(req.params.id, { min: 1 });
    const { trackingCode, carrier, autoShip } = req.body;
    if (!orderId) throw badRequest('Mã đơn hàng không hợp lệ');

    const updated = await orderService.updateTracking(orderId, trackingCode, carrier, req.user.userId, {
      autoShip: Boolean(autoShip)
    });
    return ok(res, updated, `Đã duyệt đơn & lưu mã vận đơn ${updated.trackingCarrier}: ${updated.trackingCode}`);
  } catch (error) {
    next(error);
  }
});

// Hủy đơn hàng kèm lý do
router.put('/orders/:id/cancel', async (req, res, next) => {
  try {
    const orderId = v.int(req.params.id, { min: 1 });
    const { cancelReason } = req.body;
    if (!orderId) throw badRequest('Mã đơn hàng không hợp lệ');

    const updated = await orderService.changeStatus(orderId, 'CANCELLED', {
      cancelReason
    }, req.user.userId);

    const msg = updated.paymentStatus === 'REFUND_PENDING'
      ? `Đã hủy đơn hàng #${updated.code}. Đơn đã chuyển sang trạng thái "Chờ hoàn tiền" do đã thu tiền trước đó.`
      : `Đã hủy đơn hàng #${updated.code} thành công.`;

    return ok(res, updated, msg);
  } catch (error) {
    next(error);
  }
});

// Hoàn tất hoàn tiền cho đơn đã hủy
router.put('/orders/:id/mark-refunded', async (req, res, next) => {
  try {
    const orderId = v.int(req.params.id, { min: 1 });
    const { note } = req.body;
    if (!orderId) throw badRequest('Mã đơn hàng không hợp lệ');

    const updated = await orderService.markRefunded(orderId, note, req.user.userId);
    return ok(res, updated, `Đã xác nhận hoàn tiền cho đơn hàng #${updated.code}`);
  } catch (error) {
    next(error);
  }
});

// =====================================================================
// 4. QUẢN LÝ KHÁCH HÀNG (CUSTOMERS)
// =====================================================================

// Danh sách khách hàng kèm tổng đơn và chi tiêu
router.get('/users', async (req, res, next) => {
  try {
    const { search } = req.query;
    let where = '';
    const params = {};

    if (search && search.trim()) {
      where = 'WHERE u.FullName LIKE @search OR u.Email LIKE @search OR u.Phone LIKE @search';
      params.search = v.likeParam(search.trim());
    }

    const result = await db.query(`
      SELECT u.UserId, u.FullName, u.Email, u.Role, u.AuthProvider, u.Phone, u.Address, u.IsActive, u.CreatedAt, u.LastLoginAt,
             ISNULL(COUNT(o.OrderId), 0) AS TotalOrders,
             ISNULL(SUM(CASE WHEN o.Status <> 'CANCELLED' THEN o.Total ELSE 0 END), 0) AS TotalSpent
      FROM Users u
      LEFT JOIN Orders o ON o.UserId = u.UserId
      ${where}
      GROUP BY u.UserId, u.FullName, u.Email, u.Role, u.AuthProvider, u.Phone, u.Address, u.IsActive, u.CreatedAt, u.LastLoginAt
      ORDER BY u.CreatedAt DESC
    `, params);

    const users = result.recordset.map(u => ({
      userId: Number(u.UserId),
      fullName: u.FullName,
      email: u.Email,
      role: u.Role,
      authProvider: u.AuthProvider,
      phone: u.Phone,
      address: u.Address,
      isActive: !!u.IsActive,
      totalOrders: Number(u.TotalOrders) || 0,
      totalSpent: Number(u.TotalSpent) || 0,
      createdAt: u.CreatedAt,
      lastLoginAt: u.LastLoginAt
    }));

    return ok(res, users, 'Lấy danh sách người dùng thành công', { count: users.length });
  } catch (error) {
    next(error);
  }
});

// Cập nhật vai trò (Role: admin / customer)
router.put('/users/:id/role', async (req, res, next) => {
  try {
    const userId = v.int(req.params.id, { min: 1 });
    const { role } = req.body;

    if (!role || !['admin', 'customer'].includes(role)) {
      throw badRequest('Vai trò không hợp lệ (chỉ chấp nhận admin hoặc customer)');
    }

    if (userId === req.user.userId && role !== 'admin') {
      throw badRequest('Không thể tự hạ quyền Quản trị viên của chính tài khoản đang đăng nhập');
    }

    await db.query('UPDATE Users SET Role = @role WHERE UserId = @userId', { userId, role });

    return ok(res, { userId, role }, `Đã cập nhật vai trò người dùng thành "${role.toUpperCase()}"`);
  } catch (error) {
    next(error);
  }
});

// Khóa hoặc Mở khóa tài khoản người dùng
router.put('/users/:id/status', async (req, res, next) => {
  try {
    const userId = v.int(req.params.id, { min: 1 });
    const { isActive } = req.body;

    if (userId === req.user.userId) {
      throw badRequest('Không thể tự khóa tài khoản của chính mình');
    }

    const activeVal = isActive ? 1 : 0;
    await db.query('UPDATE Users SET IsActive = @active WHERE UserId = @userId', { userId, active: activeVal });

    return ok(res, { userId, isActive: !!activeVal }, `Đã ${activeVal ? 'mở khóa' : 'khóa'} tài khoản người dùng thành công`);
  } catch (error) {
    next(error);
  }
});

// =====================================================================
// 5. QUẢN LÝ BẢN TIN (NEWSLETTER SUBSCRIBERS)
// =====================================================================
router.get('/subscribers', async (req, res, next) => {
  try {
    const { search } = req.query;
    let where = '';
    const params = {};
    if (search && search.trim()) {
      where = 'WHERE Email LIKE @search';
      params.search = v.likeParam(search.trim());
    }

    const result = await db.query(`SELECT * FROM Newsletter ${where} ORDER BY CreatedAt DESC`, params);
    return ok(res, result.recordset, 'Lấy danh sách bản tin thành công', { count: result.recordset.length });
  } catch (error) {
    next(error);
  }
});

router.delete('/subscribers/:id', async (req, res, next) => {
  try {
    const id = v.int(req.params.id, { min: 1 });
    await db.query('DELETE FROM Newsletter WHERE SubscriberId = @id', { id });
    return ok(res, { subscriberId: id }, 'Đã xóa email khỏi danh sách đăng ký nhận tin');
  } catch (error) {
    next(error);
  }
});

// =====================================================================
// 6. THIẾT LẬP CỬA HÀNG (STORE SETTINGS)
// =====================================================================
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await settingsService.getAll();
    return ok(res, settings, 'Lấy thiết lập hệ thống thành công');
  } catch (error) {
    next(error);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const updated = await settingsService.update(req.body);
    return ok(res, updated, 'Đã cập nhật thiết lập cửa hàng thành công!');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
