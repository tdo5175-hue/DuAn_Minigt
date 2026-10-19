/**
 * ADMIN API ROUTES - QUẢN TRỊ TOÀN DIỆN MINI GT STORE (SUPABASE POSTGRESQL)
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

// Tất cả route admin đều yêu cầu quyền admin
router.use(authenticate, requireAdmin);

// =====================================================================
// 1. DASHBOARD & THỐNG KÊ (REAL-TIME METRICS)
// =====================================================================
router.get(['/stats', '/dashboard'], async (req, res, next) => {
  try {
    let lowStockThreshold = 5;
    try {
      const settings = settingsService.getAll ? await settingsService.getAll() : {};
      lowStockThreshold = Number(settings.low_stock_threshold) || 5;
    } catch (_) {}

    // 1. Đếm sản phẩm
    const productsRes = await db.query(`
      SELECT 
        COUNT(*) AS "totalProducts",
        COALESCE(SUM(CASE WHEN Stock <= @lowStock AND Stock > 0 THEN 1 ELSE 0 END), 0) AS "lowStockCount",
        COALESCE(SUM(CASE WHEN Stock = 0 OR Status = 'sold_out' THEN 1 ELSE 0 END), 0) AS "outOfStockCount"
      FROM Products WHERE IsActive = TRUE`,
      { lowStock: lowStockThreshold }
    );

    // 2. Thống kê đơn hàng và doanh thu thực
    const ordersRes = await db.query(`
      SELECT 
        COUNT(*) AS "totalOrders",
        COALESCE(SUM(CASE WHEN PaymentStatus = 'PAID' THEN Total 
                          WHEN PaymentStatus = 'PARTIALLY_PAID' THEN DepositAmount 
                          ELSE 0 END), 0) AS "totalRevenue",
        COALESCE(SUM(CASE WHEN PaymentStatus = 'PARTIALLY_PAID' THEN DepositAmount ELSE 0 END), 0) AS "totalDeposits",
        COALESCE(SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END), 0) AS "pendingOrders",
        COALESCE(SUM(CASE WHEN Status = 'CONFIRMED' THEN 1 ELSE 0 END), 0) AS "confirmedOrders",
        COALESCE(SUM(CASE WHEN Status = 'PREPARING' THEN 1 ELSE 0 END), 0) AS "preparingOrders",
        COALESCE(SUM(CASE WHEN Status = 'SHIPPING' THEN 1 ELSE 0 END), 0) AS "shippingOrders",
        COALESCE(SUM(CASE WHEN Status = 'DELIVERED' THEN 1 ELSE 0 END), 0) AS "deliveredOrders",
        COALESCE(SUM(CASE WHEN Status = 'CANCELLED' THEN 1 ELSE 0 END), 0) AS "cancelledOrders"
      FROM Orders
    `);

    // 3. Khách hàng & Bản tin
    const usersCountRes = await db.query(`SELECT COUNT(*) AS "total" FROM Users WHERE Role != 'admin'`);
    const subscribersCountRes = await db.query(`SELECT COUNT(*) AS "total" FROM Newsletter`);

    // 4. Đơn hàng gần đây nhất (TOP 10)
    const recentOrdersList = await orderService.listOrders({ pageSize: 10 });

    // 5. Mô hình bán chạy nhất (TOP 5)
    const bestSellersRes = await db.query(`
      SELECT p.ProductId, p.Sku, p.Name, p.ImageUrl, p.Price, p.Stock, COALESCE(SUM(oi.Quantity), 0) AS "UnitsSold"
      FROM OrderItems oi
      JOIN Orders o ON o.OrderId = oi.OrderId AND o.Status <> 'CANCELLED'
      JOIN Products p ON p.ProductId = oi.ProductId
      GROUP BY p.ProductId, p.Sku, p.Name, p.ImageUrl, p.Price, p.Stock
      ORDER BY "UnitsSold" DESC
      LIMIT 5
    `);

    const p = productsRes.recordset[0] || {};
    const o = ordersRes.recordset[0] || {};

    const totalRevenueVal = Number(o.totalRevenue ?? o.totalrevenue ?? 0);
    const totalOrdersVal = Number(o.totalOrders ?? o.totalorders ?? 0);
    const totalProductsVal = Number(p.totalProducts ?? p.totalproducts ?? 0);
    const lowStockVal = Number(p.lowStockCount ?? p.lowstockcount ?? 0);
    const outOfStockVal = Number(p.outOfStockCount ?? p.outofstockcount ?? 0);
    const totalCustVal = Number(usersCountRes.recordset[0]?.total ?? 0);
    const totalSubVal = Number(subscribersCountRes.recordset[0]?.total ?? 0);

    const kpis = {
      revenue: {
        total: totalRevenueVal,
        totalFormatted: new Intl.NumberFormat('vi-VN').format(Math.round(totalRevenueVal)) + 'đ'
      },
      orders: {
        total: totalOrdersVal
      },
      products: {
        total: totalProductsVal,
        lowStock: lowStockVal
      },
      customers: {
        total: totalCustVal
      }
    };

    return ok(res, {
      stats: {
        totalRevenue: totalRevenueVal,
        totalDeposits: Number(o.totalDeposits ?? o.totaldeposits ?? 0),
        totalOrders: totalOrdersVal,
        totalProducts: totalProductsVal,
        lowStockProducts: lowStockVal,
        outOfStockProducts: outOfStockVal,
        totalCustomers: totalCustVal,
        totalSubscribers: totalSubVal,
        pendingOrders: Number(o.pendingOrders ?? o.pendingorders ?? 0),
        confirmedOrders: Number(o.confirmedOrders ?? o.confirmedorders ?? 0),
        preparingOrders: Number(o.preparingOrders ?? o.preparingorders ?? 0),
        shippingOrders: Number(o.shippingOrders ?? o.shippingorders ?? 0),
        deliveredOrders: Number(o.deliveredOrders ?? o.deliveredorders ?? 0),
        cancelledOrders: Number(o.cancelledOrders ?? o.cancelledorders ?? 0)
      },
      kpis,
      recentOrders: recentOrdersList.items || [],
      bestSellers: (bestSellersRes.recordset || []).map(b => ({
        id: Number(b.ProductId ?? b.productid),
        sku: b.Sku ?? b.sku,
        name: b.Name ?? b.name,
        image: b.ImageUrl ?? b.imageurl,
        imageUrl: b.ImageUrl ?? b.imageurl,
        price: Number(b.Price ?? b.price ?? 0),
        stock: Number(b.Stock ?? b.stock ?? 0),
        unitsSold: Number(b.UnitsSold ?? b.unitssold ?? 0)
      }))
    }, 'Lấy dữ liệu thống kê thành công');
  } catch (err) {
    next(err);
  }
});

// =====================================================================
// 2. QUẢN LÝ DANH MỤC & SẢN PHẨM (CATEGORIES & PRODUCTS CRUD)
// =====================================================================

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await productService.listCategories();
    return ok(res, categories, 'Lấy danh mục sản phẩm thành công');
  } catch (error) {
    next(error);
  }
});

router.post('/categories', async (req, res, next) => {
  try {
    const { name, slug, description, imageUrl, sortOrder } = req.body;
    if (!name || !String(name).trim()) throw badRequest('Vui lòng nhập tên danh mục');
    const createdCat = await productService.addCategory({ name, slug, description, imageUrl, sortOrder });
    return created(res, createdCat, 'Thêm danh mục mới thành công');
  } catch (error) {
    next(error);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const { category, status, stock, search, sort, page = 1, limit = 20 } = req.query;
    const filter = {
      category,
      status,
      q: search,
      sort,
      page: parseInt(page, 10) || 1,
      pageSize: parseInt(limit, 10) || 20
    };
    if (stock === 'out_of_stock') filter.status = 'sold_out';

    const result = await productService.listProducts(filter, { includeInactive: true });

    return ok(res, result.items, 'Lấy danh sách sản phẩm thành công', {
      pagination: {
        page: result.page,
        limit: result.pageSize,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) throw badRequest('Mã sản phẩm không hợp lệ');

    const product = await productService.getProductByIdOrSlug(id, { includeInactive: true });
    if (!product) throw notFound('Không tìm thấy sản phẩm');

    return ok(res, product, 'Chi tiết sản phẩm');
  } catch (error) {
    next(error);
  }
});

router.post('/products', async (req, res, next) => {
  try {
    const sku = String(req.body.sku || '').trim();
    const carNumber = String(req.body.carNumber || sku.replace(/\D/g, '') || '').trim() || null;
    const name = String(req.body.name || '').trim();
    const categoryId = parseInt(req.body.categoryId, 10);
    const brand = String(req.body.brand || 'MINI GT').trim();
    const scale = String(req.body.scale || '1:64').trim();

    const packagingType = ['both', 'box_only', 'card_only'].includes(req.body.packagingType)
      ? req.body.packagingType
      : 'both';

    let priceBox = Number(req.body.priceBox || (packagingType === 'card_only' ? req.body.priceCard : req.body.price) || 320000);
    let priceCard = Number(req.body.priceCard || (packagingType === 'box_only' ? priceBox : priceBox + 60000));
    if (packagingType === 'card_only' && priceBox <= 0) priceBox = priceCard;
    if (packagingType === 'box_only' && priceCard <= 0) priceCard = priceBox;
    const discountPercent = Math.max(0, Math.min(80, parseInt(req.body.discountPercent, 10) || 0));

    const finalPriceBox = discountPercent > 0
      ? productService.calcDiscountedPrice(priceBox, discountPercent)
      : priceBox;
    const finalPriceCard = discountPercent > 0
      ? productService.calcDiscountedPrice(priceCard, discountPercent)
      : priceCard;

    const mainPrice = packagingType === 'card_only' ? finalPriceCard : finalPriceBox;
    const mainOldPrice = discountPercent > 0
      ? (packagingType === 'card_only' ? priceCard : priceBox)
      : (req.body.oldPrice ? Number(req.body.oldPrice) : null);

    const editionNote = String(req.body.editionNote || '').trim() || null;

    let stockBox = req.body.stockBox != null ? Math.max(0, parseInt(req.body.stockBox, 10) || 0) : null;
    let stockCard = req.body.stockCard != null ? Math.max(0, parseInt(req.body.stockCard, 10) || 0) : null;
    const rawStock = Math.max(0, parseInt(req.body.stock, 10) || 0);

    if (packagingType === 'box_only') {
      stockCard = 0;
      stockBox = stockBox != null ? stockBox : rawStock;
    } else if (packagingType === 'card_only') {
      stockBox = 0;
      stockCard = stockCard != null ? stockCard : rawStock;
    } else {
      if (stockBox == null && stockCard == null) {
        stockBox = Math.ceil(rawStock * 0.6);
        stockCard = Math.floor(rawStock * 0.4);
      } else {
        stockBox = stockBox || 0;
        stockCard = stockCard || 0;
      }
    }
    const stock = stockBox + stockCard;

    const imageUrl = String(req.body.imageUrl || req.body.image || 'image/hero-banner.jpg').trim();
    const description = String(req.body.description || '').trim() || null;
    let status = ['in_stock', 'pre_order', 'sold_out'].includes(req.body.status) ? req.body.status : 'in_stock';
    if (stock === 0) status = 'sold_out';

    const isFeatured = Boolean(req.body.isFeatured);
    const isNew = Boolean(req.body.isNew);

    if (!sku) throw badRequest('Vui lòng nhập mã SKU sản phẩm');
    if (name.length < 3) throw badRequest('Tên sản phẩm tối thiểu 3 ký tự');
    if (!categoryId) throw badRequest('Vui lòng chọn danh mục sản phẩm');
    if (priceBox <= 0) throw badRequest('Giá bán phải lớn hơn 0');

    const skuCheck = await db.query('SELECT ProductId FROM Products WHERE Sku = @sku', { sku });
    if (skuCheck.recordset.length > 0) {
      throw conflict(`Mã SKU "${sku}" đã tồn tại. Vui lòng chọn mã khác.`);
    }

    let baseSlug = v.slugify(name);
    let slug = baseSlug;
    const slugCheck = await db.query('SELECT ProductId FROM Products WHERE Slug = @slug', { slug });
    if (slugCheck.recordset.length > 0) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const isPreOrder = status === 'pre_order';
    const depositPercent = isPreOrder ? Math.min(100, Math.max(10, parseInt(req.body.depositPercent, 10) || 30)) : 0;
    const depositAmount = isPreOrder
      ? (req.body.depositAmount != null && Number(req.body.depositAmount) > 0
          ? Math.min(mainPrice, Number(req.body.depositAmount))
          : Math.round((mainPrice * (depositPercent / 100)) / 1000) * 1000)
      : 0;
    const expectedDelivery = isPreOrder
      ? (req.body.expectedDelivery ? String(req.body.expectedDelivery).trim() : 'Tháng 11/2026 (Có thể trễ hơn dự kiến)')
      : null;
    const preOrderDeadline = req.body.preOrderDeadline ? String(req.body.preOrderDeadline).slice(0, 10) : null;

    const insertRes = await db.query(`
      INSERT INTO Products (
        Sku, CarNumber, Name, Slug, CategoryId, Brand, Scale,
        PackagingType, PriceBox, PriceCard, DiscountPercent,
        Price, OldPrice, DepositAmount, DepositPercent, ExpectedDelivery, EditionNote,
        PreOrderDeadline, StockBox, StockCard, Stock, ImageUrl, Description, Status,
        IsFeatured, IsNew, IsActive, CreatedAt, UpdatedAt
      )
      VALUES (
        @sku, @carNumber, @name, @slug, @categoryId, @brand, @scale,
        @packagingType, @priceBox, @priceCard, @discountPercent,
        @price, @oldPrice, @depositAmount, @depositPercent, @expectedDelivery, @editionNote,
        @preOrderDeadline, @stockBox, @stockCard, @stock, @imageUrl, @description, @status,
        @isFeatured, @isNew, TRUE, NOW(), NOW()
      )
      RETURNING ProductId
    `, {
      sku, carNumber, name, slug, categoryId, brand, scale,
      packagingType, priceBox, priceCard, discountPercent,
      price: mainPrice, oldPrice: mainOldPrice, depositAmount, depositPercent, expectedDelivery,
      editionNote, preOrderDeadline, stockBox, stockCard, stock, imageUrl, description,
      status, isFeatured, isNew
    });

    const newId = Number(insertRes.recordset[0].ProductId ?? insertRes.recordset[0].productid);
    const product = await productService.getProductByIdOrSlug(newId, { includeInactive: true });
    return created(res, product, 'Thêm mô hình xe thành công!');
  } catch (error) {
    next(error);
  }
});

router.put('/products/:id', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (!productId) throw badRequest('Mã sản phẩm không hợp lệ');

    const existingRes = await db.query('SELECT * FROM Products WHERE ProductId = @id', { id: productId });
    if (existingRes.recordset.length === 0) throw notFound('Không tìm thấy sản phẩm');
    const existing = existingRes.recordset[0];

    const sku = req.body.sku !== undefined ? String(req.body.sku).trim() : existing.Sku;
    const carNumber = req.body.carNumber !== undefined ? String(req.body.carNumber).trim() : existing.CarNumber;
    const name = req.body.name !== undefined ? String(req.body.name).trim() : existing.Name;
    const categoryId = req.body.categoryId !== undefined ? parseInt(req.body.categoryId, 10) : existing.CategoryId;
    const brand = req.body.brand !== undefined ? String(req.body.brand).trim() : existing.Brand;
    const scale = req.body.scale !== undefined ? String(req.body.scale).trim() : existing.Scale;

    const packagingType = req.body.packagingType !== undefined
      ? (['both', 'box_only', 'card_only'].includes(req.body.packagingType) ? req.body.packagingType : existing.PackagingType)
      : existing.PackagingType;

    let priceBox = req.body.priceBox !== undefined
      ? Number(req.body.priceBox)
      : Number(existing.PriceBox || existing.Price);
    let priceCard = req.body.priceCard !== undefined
      ? Number(req.body.priceCard)
      : Number(existing.PriceCard || (packagingType === 'box_only' ? priceBox : priceBox + 60000));
    if (packagingType === 'card_only' && (priceBox <= 0 || req.body.priceBox === undefined)) priceBox = priceCard;
    if (packagingType === 'box_only' && (priceCard <= 0 || req.body.priceCard === undefined)) priceCard = priceBox;
    const discountPercent = req.body.discountPercent !== undefined
      ? Math.max(0, Math.min(80, parseInt(req.body.discountPercent, 10) || 0))
      : Number(existing.DiscountPercent || 0);

    const finalPriceBox = discountPercent > 0
      ? productService.calcDiscountedPrice(priceBox, discountPercent)
      : priceBox;
    const finalPriceCard = discountPercent > 0
      ? productService.calcDiscountedPrice(priceCard, discountPercent)
      : priceCard;

    const mainPrice = packagingType === 'card_only' ? finalPriceCard : finalPriceBox;
    const mainOldPrice = discountPercent > 0
      ? (packagingType === 'card_only' ? priceCard : priceBox)
      : (req.body.oldPrice !== undefined ? (req.body.oldPrice ? Number(req.body.oldPrice) : null) : existing.OldPrice);

    const editionNote = req.body.editionNote !== undefined
      ? (String(req.body.editionNote).trim() || null)
      : existing.EditionNote;

    let stockBox = req.body.stockBox !== undefined
      ? Math.max(0, parseInt(req.body.stockBox, 10) || 0)
      : (existing.StockBox != null ? Number(existing.StockBox) : null);
    let stockCard = req.body.stockCard !== undefined
      ? Math.max(0, parseInt(req.body.stockCard, 10) || 0)
      : (existing.StockCard != null ? Number(existing.StockCard) : null);

    if (packagingType === 'box_only') {
      stockCard = 0;
      if (req.body.stockBox !== undefined) stockBox = Math.max(0, parseInt(req.body.stockBox, 10) || 0);
      else if (req.body.stock !== undefined) stockBox = Math.max(0, parseInt(req.body.stock, 10) || 0);
      else if (stockBox == null) stockBox = Number(existing.Stock || 0);
    } else if (packagingType === 'card_only') {
      stockBox = 0;
      if (req.body.stockCard !== undefined) stockCard = Math.max(0, parseInt(req.body.stockCard, 10) || 0);
      else if (req.body.stock !== undefined) stockCard = Math.max(0, parseInt(req.body.stock, 10) || 0);
      else if (stockCard == null) stockCard = Number(existing.Stock || 0);
    } else {
      if (req.body.stockBox !== undefined || req.body.stockCard !== undefined) {
        stockBox = stockBox != null ? stockBox : 0;
        stockCard = stockCard != null ? stockCard : 0;
      } else if (req.body.stock !== undefined) {
        const raw = Math.max(0, parseInt(req.body.stock, 10) || 0);
        stockBox = Math.ceil(raw * 0.6);
        stockCard = Math.floor(raw * 0.4);
      } else {
        stockBox = stockBox != null ? stockBox : Math.ceil(Number(existing.Stock || 0) * 0.6);
        stockCard = stockCard != null ? stockCard : Math.floor(Number(existing.Stock || 0) * 0.4);
      }
    }
    const stock = stockBox + stockCard;

    const imageUrl = req.body.imageUrl !== undefined
      ? String(req.body.imageUrl).trim()
      : (req.body.image !== undefined ? String(req.body.image).trim() : existing.ImageUrl);
    const description = req.body.description !== undefined
      ? (String(req.body.description).trim() || null)
      : existing.Description;
    let status = req.body.status !== undefined
      ? (['in_stock', 'pre_order', 'sold_out'].includes(req.body.status) ? req.body.status : existing.Status)
      : existing.Status;
    if (stock === 0) status = 'sold_out';

    const isPreOrder = status === 'pre_order';
    const depositPercent = isPreOrder
      ? (req.body.depositPercent !== undefined ? Math.min(100, Math.max(10, parseInt(req.body.depositPercent, 10) || 30)) : (existing.DepositPercent || 30))
      : 0;
    const depositAmount = isPreOrder
      ? (req.body.depositAmount !== undefined && req.body.depositAmount !== null && Number(req.body.depositAmount) > 0
          ? Math.min(mainPrice, Number(req.body.depositAmount))
          : Math.round((mainPrice * (depositPercent / 100)) / 1000) * 1000)
      : 0;
    const expectedDelivery = isPreOrder
      ? (req.body.expectedDelivery !== undefined ? (String(req.body.expectedDelivery).trim() || null) : (existing.ExpectedDelivery || 'Tháng 11/2026 (Có thể trễ hơn dự kiến)'))
      : null;
    const preOrderDeadline = req.body.preOrderDeadline ? String(req.body.preOrderDeadline).slice(0, 10) : null;

    const isFeatured = req.body.isFeatured !== undefined ? Boolean(req.body.isFeatured) : Boolean(existing.IsFeatured);
    const isNew = req.body.isNew !== undefined ? Boolean(req.body.isNew) : Boolean(existing.IsNew);

    if (!sku) throw badRequest('Mã SKU không được để trống');
    if (!name || name.length < 3) throw badRequest('Tên sản phẩm tối thiểu 3 ký tự');
    if (priceBox <= 0) throw badRequest('Giá bán phải lớn hơn 0');

    if (sku !== existing.Sku) {
      const skuCheck = await db.query('SELECT ProductId FROM Products WHERE Sku = @sku AND ProductId <> @id', { sku, id: productId });
      if (skuCheck.recordset.length > 0) throw conflict(`Mã SKU "${sku}" đã được sử dụng bởi sản phẩm khác`);
    }

    await db.query(`
      UPDATE Products SET
        Sku = @sku,
        CarNumber = @carNumber,
        Name = @name,
        CategoryId = @categoryId,
        Brand = @brand,
        Scale = @scale,
        PackagingType = @packagingType,
        PriceBox = @priceBox,
        PriceCard = @priceCard,
        DiscountPercent = @discountPercent,
        Price = @price,
        OldPrice = @oldPrice,
        DepositAmount = @depositAmount,
        DepositPercent = @depositPercent,
        ExpectedDelivery = @expectedDelivery,
        EditionNote = @editionNote,
        PreOrderDeadline = @preOrderDeadline,
        StockBox = @stockBox,
        StockCard = @stockCard,
        Stock = @stock,
        ImageUrl = @imageUrl,
        Description = @description,
        Status = @status,
        IsFeatured = @isFeatured,
        IsNew = @isNew,
        UpdatedAt = NOW()
      WHERE ProductId = @productId
    `, {
      productId, sku, carNumber, name, categoryId, brand, scale,
      packagingType, priceBox, priceCard, discountPercent,
      price: mainPrice, oldPrice: mainOldPrice, depositAmount,
      depositPercent,
      expectedDelivery,
      editionNote, preOrderDeadline, stockBox, stockCard, stock, imageUrl, description,
      status, isFeatured, isNew
    });

    const updated = await productService.getProductByIdOrSlug(productId, { includeInactive: true });
    return ok(res, updated, 'Cập nhật sản phẩm thành công!');
  } catch (error) {
    next(error);
  }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (!productId) throw badRequest('Mã sản phẩm không hợp lệ');

    const orderCheck = await db.query('SELECT OrderId FROM OrderItems WHERE ProductId = @id LIMIT 1', { id: productId });

    if (orderCheck.recordset.length > 0) {
      await db.query('UPDATE Products SET IsActive = FALSE, UpdatedAt = NOW() WHERE ProductId = @id', { id: productId });
      return ok(res, { productId, softDeleted: true }, 'Sản phẩm đã có trong đơn hàng nên được chuyển sang trạng thái "Ẩn khỏi cửa hàng"');
    } else {
      await db.query('DELETE FROM Products WHERE ProductId = @id', { id: productId });
      return ok(res, { productId, hardDeleted: true }, 'Đã xóa hoàn toàn sản phẩm khỏi hệ thống');
    }
  } catch (error) {
    next(error);
  }
});

router.post('/products/:id/clone', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const orig = await productService.getProductByIdOrSlug(productId, { includeInactive: true });
    if (!orig) throw notFound('Không tìm thấy sản phẩm nguồn để nhân bản');

    const newSku = orig.sku + '-C' + Math.floor(10 + Math.random() * 90);
    const newName = orig.name + ' (Bản Sao)';
    const newSlug = v.slugify(newName) + '-' + Date.now().toString().slice(-4);

    const insertRes = await db.query(`
      INSERT INTO Products (
        Sku, CarNumber, Name, Slug, CategoryId, Brand, Scale,
        PackagingType, PriceBox, PriceCard, DiscountPercent,
        Price, OldPrice, DepositAmount, DepositPercent, EditionNote,
        PreOrderDeadline, StockBox, StockCard, Stock, ImageUrl, Description, Status,
        IsFeatured, IsNew, IsActive, CreatedAt, UpdatedAt
      )
      VALUES (
        @sku, @carNumber, @name, @slug, @categoryId, @brand, @scale,
        @packagingType, @priceBox, @priceCard, @discountPercent,
        @price, @oldPrice, @depositAmount, @depositPercent, @editionNote,
        @preOrderDeadline, @stockBox, @stockCard, @stock, @imageUrl, @description, @status,
        FALSE, TRUE, TRUE, NOW(), NOW()
      )
      RETURNING ProductId
    `, {
      sku: newSku,
      carNumber: orig.carNumber,
      name: newName,
      slug: newSlug,
      categoryId: orig.categoryId,
      brand: orig.brand,
      scale: orig.scale,
      packagingType: orig.packagingType,
      priceBox: orig.priceBox,
      priceCard: orig.priceCard,
      discountPercent: orig.discountPercent,
      price: orig.price,
      oldPrice: orig.oldPrice,
      depositAmount: orig.depositAmount,
      depositPercent: orig.depositPercent || 30,
      editionNote: orig.editionNote,
      preOrderDeadline: orig.preOrderDeadline,
      stockBox: orig.stockBox || 0,
      stockCard: orig.stockCard || 0,
      stock: orig.stock,
      imageUrl: orig.imageUrl,
      description: orig.description,
      status: orig.status
    });

    const newId = Number(insertRes.recordset[0].ProductId ?? insertRes.recordset[0].productid);
    const cloned = await productService.getProductByIdOrSlug(newId, { includeInactive: true });
    return created(res, cloned, `Đã nhân bản sản phẩm thành công với mã SKU mới: #${newSku}`);
  } catch (error) {
    next(error);
  }
});

// =====================================================================
// 3. QUẢN LÝ ĐƠN HÀNG (ADMIN ORDERS)
// =====================================================================

router.get('/orders', async (req, res, next) => {
  try {
    const { status, paymentStatus, paymentMethod, search, page = 1, limit = 50 } = req.query;

    const result = await orderService.listOrders({
      status,
      paymentStatus,
      paymentMethod,
      q: search,
      page: parseInt(page, 10) || 1,
      pageSize: parseInt(limit, 10) || 50
    });

    const countsRes = await db.query(`
      SELECT 
        COUNT(*) AS "totalAll",
        COALESCE(SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END), 0) AS "countPending",
        COALESCE(SUM(CASE WHEN Status = 'CONFIRMED' THEN 1 ELSE 0 END), 0) AS "countConfirmed",
        COALESCE(SUM(CASE WHEN Status = 'PREPARING' THEN 1 ELSE 0 END), 0) AS "countPreparing",
        COALESCE(SUM(CASE WHEN Status = 'SHIPPING' THEN 1 ELSE 0 END), 0) AS "countShipping",
        COALESCE(SUM(CASE WHEN Status = 'DELIVERED' THEN 1 ELSE 0 END), 0) AS "countDelivered",
        COALESCE(SUM(CASE WHEN Status = 'CANCELLED' THEN 1 ELSE 0 END), 0) AS "countCancelled",
        COALESCE(SUM(CASE WHEN HasPreOrder = TRUE THEN 1 ELSE 0 END), 0) AS "countPreOrder"
      FROM Orders
    `);
    const c = countsRes.recordset[0] || {};

    return ok(res, result.items, 'Lấy danh sách đơn hàng thành công', {
      counts: {
        all: Number(c.totalAll ?? c.totalall ?? 0),
        pending: Number(c.countPending ?? c.countpending ?? 0),
        confirmed: Number(c.countConfirmed ?? c.countconfirmed ?? 0),
        preparing: Number(c.countPreparing ?? c.countpreparing ?? 0),
        shipping: Number(c.countShipping ?? c.countshipping ?? 0),
        delivered: Number(c.countDelivered ?? c.countdelivered ?? 0),
        cancelled: Number(c.countCancelled ?? c.countcancelled ?? 0),
        preOrder: Number(c.countPreOrder ?? c.countpreorder ?? 0)
      },
      pagination: {
        page: result.page,
        limit: result.pageSize,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await orderService.getOrderByCodeOrId(req.params.id);
    if (!order) throw notFound('Không tìm thấy đơn hàng');
    return ok(res, order, 'Chi tiết đơn hàng');
  } catch (error) {
    next(error);
  }
});

router.put('/orders/:id/status', async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { status, note, trackingCode, carrier, cancelReason } = req.body;

    const updated = await orderService.transitionOrderStatus(orderId, status, {
      note, trackingCode, trackingCarrier: carrier, cancelReason,
      actorId: req.user ? req.user.userId : null,
      isAdmin: true
    });

    return ok(res, updated, `Đã cập nhật trạng thái đơn hàng sang "${updated.status}"`);
  } catch (error) {
    next(error);
  }
});

router.put(['/orders/:id/confirm-payment', '/orders/:id/payment'], async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { kind = 'full' } = req.body;
    const targetStatus = kind === 'deposit' ? 'PARTIALLY_PAID' : 'PAID';

    const updated = await orderService.updatePaymentStatus(orderId, targetStatus, {
      actorId: req.user ? req.user.userId : null,
      note: kind === 'deposit' ? 'Admin xác nhận đã nhận cọc' : 'Admin xác nhận đã nhận đủ tiền 100%'
    });

    return ok(res, updated, `Đã xác nhận thanh toán thành công cho đơn #${updated.code}`);
  } catch (error) {
    next(error);
  }
});

router.put('/orders/:id/tracking', async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { trackingCode, carrier = 'SPX Express', autoShip } = req.body;

    const o = await orderService.getOrderByCodeOrId(orderId);
    if (!o) throw notFound('Không tìm thấy đơn hàng');

    const oid = o.orderId || o.id;
    const nextStatus = (autoShip || o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PREPARING')
      ? (autoShip ? 'SHIPPING' : (o.status === 'PENDING' ? 'CONFIRMED' : o.status))
      : o.status;

    await db.query(`
      UPDATE Orders
      SET TrackingCode = @tCode, TrackingCarrier = @tCarrier, Status = @st, UpdatedAt = NOW()
      WHERE OrderId = @oid
    `, {
      oid,
      tCode: String(trackingCode || '').trim().toUpperCase(),
      tCarrier: carrier || 'SPX Express',
      st: nextStatus
    });

    await db.query(`
      INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
      VALUES (@oid, @from, @to, @note, @by)
    `, {
      oid,
      from: o.status,
      to: nextStatus,
      note: `Gắn mã vận đơn SPX: ${trackingCode}`,
      by: req.user ? req.user.userId : null
    });

    const updated = await orderService.getOrderByCodeOrId(oid);
    return ok(res, updated, `Đã duyệt đơn & lưu mã vận đơn ${updated.trackingCarrier}: ${updated.trackingCode}`);
  } catch (error) {
    next(error);
  }
});

router.put('/orders/:id/preorder-arrived', async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const o = await orderService.getOrderByCodeOrId(orderId);
    if (!o) throw notFound('Không tìm thấy đơn hàng');

    const oid = o.orderId || o.id;
    await db.query(`
      UPDATE Orders
      SET PreOrderNotified = TRUE, UpdatedAt = NOW()
      WHERE OrderId = @oid
    `, { oid });

    if (o.status === 'CONFIRMED') {
      await orderService.transitionOrderStatus(oid, 'PREPARING', {
        note: 'Lô hàng Pre-Order đã cập bến kho Mini GT Biên Hòa. Đang kiểm tra & chuẩn bị bàn giao cho SPX Express.',
        actorId: req.user ? req.user.userId : null,
        isAdmin: true
      });
    } else {
      await db.query(`
        INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, ChangedBy)
        VALUES (@oid, @from, @to, @note, @by)
      `, {
        oid,
        from: o.status,
        to: o.status,
        note: 'Thông báo: Lô hàng Pre-Order đã cập bến kho Mini GT Biên Hòa.',
        by: req.user ? req.user.userId : null
      });
    }

    const updated = await orderService.getOrderByCodeOrId(oid);
    return ok(res, updated, `Đã cập nhật: Hàng Pre-Order cho đơn #${updated.code} đã về kho!`);
  } catch (error) {
    next(error);
  }
});

router.put('/orders/:id/cancel', async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { cancelReason } = req.body;

    const updated = await orderService.transitionOrderStatus(orderId, 'CANCELLED', {
      cancelReason: cancelReason || 'Admin hủy đơn',
      actorId: req.user ? req.user.userId : null,
      isAdmin: true
    });

    const msg = updated.paymentStatus === 'REFUND_PENDING'
      ? `Đã hủy đơn hàng #${updated.code}. Đơn đã chuyển sang trạng thái "Chờ hoàn tiền".`
      : `Đã hủy đơn hàng #${updated.code} thành công.`;

    return ok(res, updated, msg);
  } catch (error) {
    next(error);
  }
});

router.put('/orders/:id/mark-refunded', async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { note } = req.body;

    const updated = await orderService.updatePaymentStatus(orderId, 'REFUNDED', {
      actorId: req.user ? req.user.userId : null,
      note: note || 'Admin xác nhận đã chuyển khoản hoàn tiền cho khách'
    });

    return ok(res, updated, `Đã xác nhận hoàn tiền cho đơn hàng #${updated.code}`);
  } catch (error) {
    next(error);
  }
});

// =====================================================================
// 4. QUẢN LÝ KHÁCH HÀNG (CUSTOMERS)
// =====================================================================
router.get('/users', async (req, res, next) => {
  try {
    const { search } = req.query;
    let where = '';
    const params = {};

    if (search && search.trim()) {
      where = 'WHERE u.FullName ILIKE @search OR u.Email ILIKE @search OR u.Phone ILIKE @search';
      params.search = `%${search.trim()}%`;
    }

    const result = await db.query(`
      SELECT u.UserId, u.FullName, u.Email, u.Role, u.AuthProvider, u.Phone, u.Address, u.IsActive, u.CreatedAt, u.LastLoginAt,
             COALESCE(COUNT(o.OrderId), 0) AS "TotalOrders",
             COALESCE(SUM(CASE WHEN o.Status <> 'CANCELLED' THEN o.Total ELSE 0 END), 0) AS "TotalSpent"
      FROM Users u
      LEFT JOIN Orders o ON o.UserId = u.UserId
      ${where}
      GROUP BY u.UserId, u.FullName, u.Email, u.Role, u.AuthProvider, u.Phone, u.Address, u.IsActive, u.CreatedAt, u.LastLoginAt
      ORDER BY u.CreatedAt DESC
    `, params);

    const users = (result.recordset || []).map(u => ({
      userId: Number(u.UserId ?? u.userid),
      fullName: u.FullName ?? u.fullname,
      email: u.Email ?? u.email,
      role: u.Role ?? u.role,
      authProvider: u.AuthProvider ?? u.authprovider,
      phone: u.Phone ?? u.phone,
      address: u.Address ?? u.address,
      isActive: Boolean(u.IsActive ?? u.isactive ?? true),
      totalOrders: Number(u.TotalOrders ?? u.totalorders ?? 0),
      totalSpent: Number(u.TotalSpent ?? u.totalspent ?? 0),
      createdAt: u.CreatedAt ?? u.createdat,
      lastLoginAt: u.LastLoginAt ?? u.lastloginat
    }));

    return ok(res, users, 'Lấy danh sách người dùng thành công', { count: users.length });
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id/role', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (!role || !['admin', 'customer'].includes(role)) {
      throw badRequest('Vai trò không hợp lệ');
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

router.put('/users/:id/status', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { isActive } = req.body;

    if (userId === req.user.userId) {
      throw badRequest('Không thể tự khóa tài khoản của chính mình');
    }

    const activeVal = Boolean(isActive);
    await db.query('UPDATE Users SET IsActive = @active WHERE UserId = @userId', { userId, active: activeVal });
    return ok(res, { userId, isActive: activeVal }, `Đã ${activeVal ? 'mở khóa' : 'khóa'} tài khoản người dùng thành công`);
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
      where = 'WHERE Email ILIKE @search';
      params.search = `%${search.trim()}%`;
    }

    const result = await db.query(`SELECT * FROM Newsletter ${where} ORDER BY CreatedAt DESC`, params);
    return ok(res, result.recordset || [], 'Lấy danh sách bản tin thành công', { count: (result.recordset || []).length });
  } catch (error) {
    next(error);
  }
});

router.delete('/subscribers/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
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
    const settings = settingsService.getAll ? await settingsService.getAll() : {};
    return ok(res, settings, 'Lấy thiết lập hệ thống thành công');
  } catch (error) {
    next(error);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const updated = settingsService.update ? await settingsService.update(req.body) : req.body;
    return ok(res, updated, 'Đã cập nhật thiết lập cửa hàng thành công!');
  } catch (error) {
    next(error);
  }
});

module.exports = router;