/**
 * MIGRATION 001 — NÂNG CẤP SCHEMA 2026 (idempotent, chạy lại nhiều lần an toàn)
 *
 *  - Orders: Email, ShippingMethod, DepositAmount, StockReserved, UpdatedAt
 *  - Mở rộng CHECK constraint: Status thêm PREPARING; PaymentMethod thêm DEPOSIT;
 *    PaymentStatus thêm PARTIALLY_PAID, REFUND_PENDING
 *  - Products: IsActive (ẩn/hiện, soft delete), UpdatedAt
 *  - Bảng mới: OrderStatusHistory, ProductReviews, Settings
 *  - Seed Settings từ các giá trị cấu hình đang hard-code trong code cũ (không phải dữ liệu giả)
 *
 * Chạy: npm run migrate
 */
const db = require('../config/db');

const steps = [
  ['Orders.Email', `
    IF COL_LENGTH('dbo.Orders','Email') IS NULL
      ALTER TABLE dbo.Orders ADD Email VARCHAR(150) NULL;`],
  ['Orders.ShippingMethod', `
    IF COL_LENGTH('dbo.Orders','ShippingMethod') IS NULL
      ALTER TABLE dbo.Orders ADD ShippingMethod VARCHAR(20) NOT NULL CONSTRAINT DF_Orders_ShippingMethod DEFAULT 'SPX';`],
  ['Orders.DepositAmount', `
    IF COL_LENGTH('dbo.Orders','DepositAmount') IS NULL
      ALTER TABLE dbo.Orders ADD DepositAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_Orders_DepositAmount DEFAULT 0;`],
  ['Orders.StockReserved', `
    IF COL_LENGTH('dbo.Orders','StockReserved') IS NULL
    BEGIN
      ALTER TABLE dbo.Orders ADD StockReserved BIT NOT NULL CONSTRAINT DF_Orders_StockReserved DEFAULT 0;
    END`],
  ['Orders.StockReserved backfill', `
    -- Logic cũ trừ kho khi duyệt đơn => các đơn đã CONFIRMED/SHIPPING/DELIVERED đã được trừ kho
    EXEC('UPDATE dbo.Orders SET StockReserved = 1 WHERE StockReserved = 0 AND UPPER(Status) IN (''CONFIRMED'',''PREPARING'',''SHIPPING'',''DELIVERED'',''COMPLETED'')');`],
  ['Orders.UpdatedAt', `
    IF COL_LENGTH('dbo.Orders','UpdatedAt') IS NULL
      ALTER TABLE dbo.Orders ADD UpdatedAt DATETIME2 NULL;`],
  ['Orders.TrackingCode', `
    IF COL_LENGTH('dbo.Orders','TrackingCode') IS NULL
      ALTER TABLE dbo.Orders ADD TrackingCode NVARCHAR(100) NULL;`],
  ['Orders.TrackingCarrier', `
    IF COL_LENGTH('dbo.Orders','TrackingCarrier') IS NULL
      ALTER TABLE dbo.Orders ADD TrackingCarrier NVARCHAR(50) NULL;`],

  ['Normalize legacy order values', `
    UPDATE dbo.Orders SET Status = 'DELIVERED' WHERE LOWER(Status) = 'completed';
    UPDATE dbo.Orders SET Status = UPPER(Status) WHERE Status <> UPPER(Status) COLLATE Latin1_General_CS_AS;
    UPDATE dbo.Orders SET PaymentStatus = UPPER(PaymentStatus) WHERE PaymentStatus <> UPPER(PaymentStatus) COLLATE Latin1_General_CS_AS;
    UPDATE dbo.Orders SET PaymentMethod = 'BANK_TRANSFER' WHERE LOWER(PaymentMethod) IN ('bank','vietqr','momo');
    UPDATE dbo.Orders SET PaymentMethod = 'COD' WHERE LOWER(PaymentMethod) = 'cod';`],

  ['CK_Orders_Status', `
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Orders_Status')
      ALTER TABLE dbo.Orders DROP CONSTRAINT CK_Orders_Status;
    ALTER TABLE dbo.Orders ADD CONSTRAINT CK_Orders_Status
      CHECK (Status IN ('PENDING','CONFIRMED','PREPARING','SHIPPING','DELIVERED','CANCELLED'));`],
  ['CK_Orders_Payment', `
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Orders_Payment')
      ALTER TABLE dbo.Orders DROP CONSTRAINT CK_Orders_Payment;
    ALTER TABLE dbo.Orders ADD CONSTRAINT CK_Orders_Payment
      CHECK (PaymentMethod IN ('COD','BANK_TRANSFER','DEPOSIT'));`],
  ['CK_Orders_PaymentStatus', `
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Orders_PaymentStatus')
      ALTER TABLE dbo.Orders DROP CONSTRAINT CK_Orders_PaymentStatus;
    ALTER TABLE dbo.Orders ADD CONSTRAINT CK_Orders_PaymentStatus
      CHECK (PaymentStatus IN ('UNPAID','PARTIALLY_PAID','PAID','REFUND_PENDING','REFUNDED'));`],
  ['CK_Orders_ShippingMethod', `
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Orders_ShippingMethod')
      ALTER TABLE dbo.Orders DROP CONSTRAINT CK_Orders_ShippingMethod;
    ALTER TABLE dbo.Orders ADD CONSTRAINT CK_Orders_ShippingMethod CHECK (ShippingMethod IN ('SPX','PICKUP','BOX_SAVER'));`],
  ['CK_Orders_Total', `
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Orders_Total')
      ALTER TABLE dbo.Orders DROP CONSTRAINT CK_Orders_Total;
    ALTER TABLE dbo.Orders ADD CONSTRAINT CK_Orders_Total CHECK (Total >= 0 AND Subtotal >= 0 AND ShippingFee >= 0);`],
  ['Users.DropLegacyGmailConstraint', `
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Users_Gmail')
      ALTER TABLE dbo.Users DROP CONSTRAINT CK_Users_Gmail;`],

  ['Products.IsActive', `
    IF COL_LENGTH('dbo.Products','IsActive') IS NULL
      ALTER TABLE dbo.Products ADD IsActive BIT NOT NULL CONSTRAINT DF_Products_IsActive DEFAULT 1;`],
  ['Products.UpdatedAt', `
    IF COL_LENGTH('dbo.Products','UpdatedAt') IS NULL
      ALTER TABLE dbo.Products ADD UpdatedAt DATETIME2 NULL;`],
  ['Products.CarNumber', `
    IF COL_LENGTH('dbo.Products','CarNumber') IS NULL
      ALTER TABLE dbo.Products ADD CarNumber VARCHAR(20) NULL;`],
  ['Products.PackagingType', `
    IF COL_LENGTH('dbo.Products','PackagingType') IS NULL
      ALTER TABLE dbo.Products ADD PackagingType VARCHAR(20) NOT NULL CONSTRAINT DF_Products_PackagingType DEFAULT 'both';`],
  ['Products.PriceBox', `
    IF COL_LENGTH('dbo.Products','PriceBox') IS NULL
      ALTER TABLE dbo.Products ADD PriceBox DECIMAL(18,2) NOT NULL CONSTRAINT DF_Products_PriceBox DEFAULT 0;`],
  ['Products.PriceCard', `
    IF COL_LENGTH('dbo.Products','PriceCard') IS NULL
      ALTER TABLE dbo.Products ADD PriceCard DECIMAL(18,2) NOT NULL CONSTRAINT DF_Products_PriceCard DEFAULT 0;`],
  ['Products.DiscountPercent', `
    IF COL_LENGTH('dbo.Products','DiscountPercent') IS NULL
      ALTER TABLE dbo.Products ADD DiscountPercent INT NOT NULL CONSTRAINT DF_Products_DiscountPercent DEFAULT 0;`],
  ['Products.PriceBox backfill', `
    EXEC('UPDATE dbo.Products SET PriceBox = CASE WHEN OldPrice IS NOT NULL AND OldPrice > Price THEN OldPrice ELSE Price END WHERE PriceBox = 0');
    EXEC('UPDATE dbo.Products SET PriceCard = CASE WHEN PackagingType = ''box_only'' THEN PriceBox ELSE PriceBox + 60000 END WHERE PriceCard = 0');`],
  ['OrderItems.PackagingOption', `
    IF COL_LENGTH('dbo.OrderItems','PackagingOption') IS NULL
      ALTER TABLE dbo.OrderItems ADD PackagingOption VARCHAR(20) NOT NULL CONSTRAINT DF_OrderItems_PackagingOption DEFAULT 'box';`],
  ['View vw_ProductList', `
    CREATE OR ALTER VIEW dbo.vw_ProductList AS
    SELECT
        p.ProductId, p.Sku, p.CarNumber, p.Name, p.Slug,
        p.Brand, p.Scale, p.PackagingType,
        p.PriceBox, p.PriceCard, p.DiscountPercent,
        p.Price, p.OldPrice, p.DepositAmount,
        p.QuotaPercent, p.EditionNote, p.PreOrderDeadline,
        p.Stock, p.ImageUrl, p.Description, p.Status,
        p.IsFeatured, p.IsNew, p.IsActive, p.CreatedAt, p.UpdatedAt,
        c.CategoryId, c.Name AS CategoryName, c.Slug AS CategorySlug
    FROM dbo.Products p
    INNER JOIN dbo.Categories c ON p.CategoryId = c.CategoryId;`],

  ['Table OrderStatusHistory', `
    IF OBJECT_ID('dbo.OrderStatusHistory','U') IS NULL
    CREATE TABLE dbo.OrderStatusHistory (
      HistoryId INT IDENTITY(1,1) PRIMARY KEY,
      OrderId INT NOT NULL,
      FromStatus VARCHAR(30) NULL,
      ToStatus VARCHAR(30) NOT NULL,
      Note NVARCHAR(500) NULL,
      ChangedBy INT NULL,
      CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_OSH_CreatedAt DEFAULT SYSDATETIME(),
      CONSTRAINT FK_OSH_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(OrderId) ON DELETE CASCADE
    );`],
  ['Table ProductReviews', `
    IF OBJECT_ID('dbo.ProductReviews','U') IS NULL
    CREATE TABLE dbo.ProductReviews (
      ReviewId INT IDENTITY(1,1) PRIMARY KEY,
      ProductId INT NOT NULL,
      UserId INT NOT NULL,
      Rating TINYINT NOT NULL,
      Comment NVARCHAR(1000) NULL,
      CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_PR_CreatedAt DEFAULT SYSDATETIME(),
      CONSTRAINT FK_PR_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId) ON DELETE CASCADE,
      CONSTRAINT FK_PR_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
      CONSTRAINT CK_PR_Rating CHECK (Rating BETWEEN 1 AND 5),
      CONSTRAINT UQ_PR_User_Product UNIQUE (ProductId, UserId)
    );`],
  ['Table Settings', `
    IF OBJECT_ID('dbo.Settings','U') IS NULL
    CREATE TABLE dbo.Settings (
      SettingKey VARCHAR(100) NOT NULL PRIMARY KEY,
      SettingValue NVARCHAR(1000) NULL,
      UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Settings_UpdatedAt DEFAULT SYSDATETIME()
    );`],
  ['Seed Settings (chỉ thêm khóa chưa có)', `
    MERGE dbo.Settings AS t
    USING (VALUES
      ('store_name', N'MINI GT STORE Biên Hòa'),
      ('store_hotline', N'0988164164'),
      ('store_email', N'contact@minigtstore.vn'),
      ('store_address', N'38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai'),
      ('shipping_fee', N'11000'),
      ('free_shipping_threshold', N'0'),
      ('low_stock_threshold', N'5'),
      ('deposit_rate', N'0.3'),
      ('preorder_deadline', N'2026-10-30'),
      ('bank_id', N'MB'),
      ('bank_name', N'MBBank (Ngân Hàng Quân Đội)'),
      ('bank_account_no', N'87654321082007'),
      ('bank_account_name', N'DO QUOC THINH'),
      ('announcement', N'Đợt mở đặt trước: Liberty Walk LBWK, F1 Las Vegas & Secret Chase Edition')
    ) AS s (SettingKey, SettingValue)
    ON t.SettingKey = s.SettingKey
    WHEN NOT MATCHED THEN INSERT (SettingKey, SettingValue) VALUES (s.SettingKey, s.SettingValue);`],
  ['Backfill OrderStatusHistory (đơn cũ chưa có lịch sử)', `
    INSERT INTO dbo.OrderStatusHistory (OrderId, FromStatus, ToStatus, Note, CreatedAt)
    SELECT o.OrderId, NULL, o.Status, N'Dữ liệu trước nâng cấp', o.CreatedAt
    FROM dbo.Orders o
    WHERE NOT EXISTS (SELECT 1 FROM dbo.OrderStatusHistory h WHERE h.OrderId = o.OrderId);`],
  ['Indexes', `
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Orders_Status_CreatedAt')
      CREATE INDEX IX_Orders_Status_CreatedAt ON dbo.Orders(Status, CreatedAt DESC);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Orders_UserId')
      CREATE INDEX IX_Orders_UserId ON dbo.Orders(UserId);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_OrderItems_OrderId')
      CREATE INDEX IX_OrderItems_OrderId ON dbo.OrderItems(OrderId);`]
];

const { syncCanonicalData } = require('./002_sync_canonical_data');

async function migrate({ exitOnDone = true } = {}) {
  const pool = await db.getPool();
  if (!pool) throw new Error('Không kết nối được SQL Server');
  for (const [name, sqlText] of steps) {
    try {
      await db.query(sqlText);
      console.log(`[MIGRATION 001] ✔ ${name}`);
    } catch (err) {
      console.error(`[MIGRATION 001] ✖ ${name}: ${err.message}`);
      throw err;
    }
  }

  // Tự động đồng bộ 18 sản phẩm chuẩn nếu chạy trực tiếp hoặc phát hiện dữ liệu chưa chuẩn hóa Box/Card/Unicode
  const checkSync = await db.query(`
    SELECT COUNT(*) AS NeedsSync
    FROM dbo.Products
    WHERE CarNumber IS NULL OR PriceBox = 0 OR Name LIKE N'%Ă%' OR Name LIKE N'%â˜%'
  `);
  const countRes = await db.query('SELECT COUNT(*) AS Total FROM dbo.Products');
  const totalProds = countRes.recordset[0]?.Total || 0;

  if (exitOnDone || (checkSync.recordset[0]?.NeedsSync || 0) > 0 || totalProds < 18) {
    await syncCanonicalData();
  }

  console.log('[MIGRATION 001] Hoàn tất.');
  if (exitOnDone) process.exit(0);
}

if (require.main === module) {
  migrate().catch(() => process.exit(1));
}

module.exports = { migrate };

