/**
 * MIGRATION 004: NÂNG CẤP TOÀN DIỆN HỆ THỐNG PRE-ORDER
 * 1. Bổ sung cột ExpectedDelivery (NVARCHAR 100), DepositPercent (INT) vào dbo.Products
 * 2. Bổ sung cột HasPreOrder (BIT), PreOrderExpected (NVARCHAR 100), PreOrderNotified (BIT) vào dbo.Orders
 * 3. Đồng bộ dữ liệu mẫu dự kiến về cho các mẫu xe Pre-Order hiện tại
 * 4. Cập nhật view dbo.vw_ProductList
 */
const db = require('../config/db');

async function migrate() {
  console.log('[Migration 004] Bắt đầu nâng cấp cấu trúc SQL Pre-Order...');

  // 1. Thêm cột ExpectedDelivery vào dbo.Products nếu chưa có
  await db.query(`
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'ExpectedDelivery')
    BEGIN
      ALTER TABLE dbo.Products ADD ExpectedDelivery NVARCHAR(100) NULL;
      PRINT 'Đã thêm cột ExpectedDelivery vào dbo.Products';
    END
  `);

  // 2. Thêm cột DepositPercent vào dbo.Products nếu chưa có
  await db.query(`
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'DepositPercent')
    BEGIN
      ALTER TABLE dbo.Products ADD DepositPercent INT NULL DEFAULT 30;
      PRINT 'Đã thêm cột DepositPercent vào dbo.Products';
    END
  `);

  // 3. Thêm các cột quản lý Pre-Order vào dbo.Orders nếu chưa có
  await db.query(`
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Orders') AND name = 'HasPreOrder')
    BEGIN
      ALTER TABLE dbo.Orders ADD HasPreOrder BIT NOT NULL DEFAULT 0;
      PRINT 'Đã thêm cột HasPreOrder vào dbo.Orders';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Orders') AND name = 'PreOrderExpected')
    BEGIN
      ALTER TABLE dbo.Orders ADD PreOrderExpected NVARCHAR(100) NULL;
      PRINT 'Đã thêm cột PreOrderExpected vào dbo.Orders';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Orders') AND name = 'PreOrderNotified')
    BEGIN
      ALTER TABLE dbo.Orders ADD PreOrderNotified BIT NOT NULL DEFAULT 0;
      PRINT 'Đã thêm cột PreOrderNotified vào dbo.Orders';
    END
  `);

  // 4. Cập nhật dữ liệu thời gian hàng về dự kiến chuẩn cho các mẫu Pre-order hiện có
  await db.query(`
    UPDATE dbo.Products
    SET ExpectedDelivery = N'Tháng 12/2026',
        DepositPercent = 30
    WHERE Sku = 'MGTS0026' AND (ExpectedDelivery IS NULL OR ExpectedDelivery = '');

    UPDATE dbo.Products
    SET ExpectedDelivery = N'Tháng 11/2026',
        DepositPercent = 35
    WHERE Sku IN ('MGT01413', 'MGT01396') AND (ExpectedDelivery IS NULL OR ExpectedDelivery = '');

    UPDATE dbo.Products
    SET ExpectedDelivery = N'Tháng 11/2026',
        DepositPercent = 35
    WHERE Sku = 'MGT01143' AND (ExpectedDelivery IS NULL OR ExpectedDelivery = '');

    -- Các sản phẩm pre_order khác (nếu có)
    UPDATE dbo.Products
    SET ExpectedDelivery = N'Tháng 11/2026',
        DepositPercent = 30
    WHERE Status = 'pre_order' AND (ExpectedDelivery IS NULL OR ExpectedDelivery = '');
  `);

  // 5. Cập nhật lại các đơn hàng đã tạo có chứa sản phẩm Pre-order
  await db.query(`
    UPDATE o
    SET o.HasPreOrder = 1,
        o.PreOrderExpected = ISNULL(p.ExpectedDelivery, N'Tháng 11/2026')
    FROM dbo.Orders o
    INNER JOIN dbo.OrderItems oi ON oi.OrderId = o.OrderId
    INNER JOIN dbo.Products p ON p.ProductId = oi.ProductId
    WHERE p.Status = 'pre_order' OR o.PaymentMethod = 'DEPOSIT';
  `);

  // 6. Cập nhật view vw_ProductList
  await db.query(`
    CREATE OR ALTER VIEW dbo.vw_ProductList
    AS
    SELECT
        p.ProductId, p.Sku, p.CarNumber, p.Name, p.Slug,
        p.Brand, p.Scale, p.PackagingType,
        p.PriceBox, p.PriceCard, p.DiscountPercent,
        p.Price, p.OldPrice, p.DepositAmount, p.DepositPercent,
        p.StockBox, p.StockCard, p.Stock,
        p.ImageUrl, p.Description, p.Status,
        p.ReleaseDate, p.ExpectedDelivery,
        p.IsFeatured, p.IsNew, p.IsActive,
        p.CreatedAt, p.UpdatedAt,
        c.CategoryId, c.Name AS CategoryName, c.Slug AS CategorySlug
    FROM dbo.Products p
    INNER JOIN dbo.Categories c ON p.CategoryId = c.CategoryId;
  `);

  console.log('[Migration 004] Hoàn tất nâng cấp cấu trúc SQL Pre-Order thành công!');
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(err => {
    console.error('Lỗi migration 004:', err);
    process.exit(1);
  });
}

module.exports = migrate;
