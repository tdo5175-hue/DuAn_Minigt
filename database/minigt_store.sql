-- =====================================================================
-- CƠ SỞ DỮ LIỆU: MINI GT STORE - HỆ THỐNG MÔ HÌNH XE DIE-CAST 1:64
-- MÁY CHỦ: QUOCTHINH\DOQUOCTHINH (Microsoft SQL Server / SSMS)
-- PHIÊN BẢN ĐỒNG BỘ TOÀN DIỆN 2026 (BOX & BLISTER CARD + SPX EXPRESS)
-- =====================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'MiniGTStore')
BEGIN
    CREATE DATABASE MiniGTStore;
END
GO

USE MiniGTStore;
GO

-- =====================================================================
-- 1. BẢNG CATEGORIES (Danh mục bộ sưu tập)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
BEGIN
    CREATE TABLE dbo.Categories (
        CategoryId INT IDENTITY(1,1) PRIMARY KEY,
        Slug VARCHAR(50) NOT NULL UNIQUE,
        Name NVARCHAR(100) NOT NULL,
        Description NVARCHAR(255) NULL,
        ImageUrl NVARCHAR(255) NULL,
        SortOrder INT NOT NULL DEFAULT 0
    );
END
GO

-- =====================================================================
-- 2. BẢNG PRODUCTS (Sản phẩm mô hình MINI GT, Pop Race, TSM, Kaido House)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
BEGIN
    CREATE TABLE dbo.Products (
        ProductId INT IDENTITY(1,1) PRIMARY KEY,
        Sku VARCHAR(30) NOT NULL UNIQUE,
        CarNumber VARCHAR(20) NULL,
        Name NVARCHAR(200) NOT NULL,
        Slug VARCHAR(200) NOT NULL,
        CategoryId INT NOT NULL,
        Brand NVARCHAR(100) NOT NULL DEFAULT N'MINI GT',
        Scale VARCHAR(20) NOT NULL DEFAULT '1:64',
        PackagingType VARCHAR(20) NOT NULL DEFAULT 'both', -- 'both', 'box_only', 'card_only'
        PriceBox DECIMAL(18,2) NOT NULL DEFAULT 0,
        PriceCard DECIMAL(18,2) NOT NULL DEFAULT 0,
        DiscountPercent INT NOT NULL DEFAULT 0,
        Price DECIMAL(18,2) NOT NULL,
        OldPrice DECIMAL(18,2) NULL,
        DepositAmount DECIMAL(18,2) NULL,
        EditionNote NVARCHAR(150) NULL,
        PreOrderDeadline DATE NULL,
        StockBox INT NOT NULL DEFAULT 0,
        StockCard INT NOT NULL DEFAULT 0,
        Stock INT NOT NULL DEFAULT 0,
        ImageUrl NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Status VARCHAR(20) NOT NULL DEFAULT 'in_stock', -- 'in_stock', 'pre_order', 'sold_out'
        ReleaseDate DATE NULL,
        ExpectedDelivery NVARCHAR(100) NULL,
        DepositPercent INT NULL DEFAULT 30,
        IsFeatured BIT NOT NULL DEFAULT 0,
        IsNew BIT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(CategoryId)
    );
END
GO

-- Đảm bảo tương thích với DB đã tồn tại trước đó: tự động bổ sung cột nếu chưa có
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'PackagingType')
        ALTER TABLE dbo.Products ADD PackagingType VARCHAR(20) NOT NULL DEFAULT 'both';

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'PriceBox')
        ALTER TABLE dbo.Products ADD PriceBox DECIMAL(18,2) NOT NULL DEFAULT 0;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'PriceCard')
        ALTER TABLE dbo.Products ADD PriceCard DECIMAL(18,2) NOT NULL DEFAULT 0;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'DiscountPercent')
        ALTER TABLE dbo.Products ADD DiscountPercent INT NOT NULL DEFAULT 0;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'StockBox')
        ALTER TABLE dbo.Products ADD StockBox INT NOT NULL DEFAULT 0;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'StockCard')
        ALTER TABLE dbo.Products ADD StockCard INT NOT NULL DEFAULT 0;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'ExpectedDelivery')
        ALTER TABLE dbo.Products ADD ExpectedDelivery NVARCHAR(100) NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'DepositPercent')
        ALTER TABLE dbo.Products ADD DepositPercent INT NULL DEFAULT 30;
END
GO

-- =====================================================================
-- 3. BẢNG PRODUCT IMAGES (Hình ảnh chi tiết)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductImages')
BEGIN
    CREATE TABLE dbo.ProductImages (
        ImageId INT IDENTITY(1,1) PRIMARY KEY,
        ProductId INT NOT NULL,
        ImageUrl NVARCHAR(255) NOT NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        CONSTRAINT FK_ProductImages_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId) ON DELETE CASCADE
    );
END
GO

-- =====================================================================
-- 4. BẢNG USERS (Người dùng, hỗ trợ Đăng nhập Thường + Gmail Google)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE dbo.Users (
        UserId INT IDENTITY(1,1) PRIMARY KEY,
        FullName NVARCHAR(100) NOT NULL,
        Email VARCHAR(150) NOT NULL UNIQUE,
        PasswordHash VARCHAR(255) NULL,
        GoogleId VARCHAR(100) NULL,
        AvatarUrl NVARCHAR(500) NULL DEFAULT 'image/anh-clone.jpg',
        Phone VARCHAR(20) NULL,
        Address NVARCHAR(255) NULL,
        AuthProvider VARCHAR(20) NOT NULL DEFAULT 'local', -- 'local', 'google'
        Role VARCHAR(20) NOT NULL DEFAULT 'customer',      -- 'customer', 'admin'
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        LastLoginAt DATETIME2 NULL
    );
END
GO

-- =====================================================================
-- 5. BẢNG ORDERS (Đơn hàng & Đặt cọc Pre-Order)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Orders')
BEGIN
    CREATE TABLE dbo.Orders (
        OrderId INT IDENTITY(1,1) PRIMARY KEY,
        OrderCode VARCHAR(30) NOT NULL UNIQUE,
        UserId INT NULL,
        FullName NVARCHAR(100) NOT NULL,
        Phone VARCHAR(20) NOT NULL,
        Email VARCHAR(150) NULL,
        Address NVARCHAR(255) NOT NULL,
        Note NVARCHAR(500) NULL,
        ShippingMethod VARCHAR(20) NOT NULL DEFAULT 'SPX',
        PaymentMethod VARCHAR(30) NOT NULL DEFAULT 'BANK_TRANSFER',
        PaymentStatus VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
        CancelReason NVARCHAR(255) NULL,
        ReceiptImage NVARCHAR(500) NULL,
        Subtotal DECIMAL(18,2) NOT NULL,
        ShippingFee DECIMAL(18,2) NOT NULL DEFAULT 0,
        Total DECIMAL(18,2) NOT NULL,
        DepositAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        StockReserved BIT NOT NULL DEFAULT 0,
        TrackingCode NVARCHAR(100) NULL,
        TrackingCarrier NVARCHAR(50) NULL,
        HasPreOrder BIT NOT NULL DEFAULT 0,
        PreOrderExpected NVARCHAR(100) NULL,
        PreOrderNotified BIT NOT NULL DEFAULT 0,
        Status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT CK_Orders_Payment CHECK (PaymentMethod IN ('COD', 'BANK_TRANSFER', 'DEPOSIT')),
        CONSTRAINT CK_Orders_PaymentStatus CHECK (PaymentStatus IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUND_PENDING', 'REFUNDED')),
        CONSTRAINT CK_Orders_Status CHECK (Status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED')),
        CONSTRAINT CK_Orders_ShippingMethod CHECK (ShippingMethod IN ('SPX', 'PICKUP', 'BOX_SAVER'))
    );
END
GO

-- =====================================================================
-- 6. BẢNG ORDER ITEMS (Chi tiết sản phẩm trong đơn)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderItems')
BEGIN
    CREATE TABLE dbo.OrderItems (
        OrderItemId INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL,
        ProductId INT NOT NULL,
        ProductName NVARCHAR(200) NOT NULL,
        PackagingOption VARCHAR(20) NOT NULL DEFAULT 'box',
        UnitPrice DECIMAL(18,2) NOT NULL,
        Quantity INT NOT NULL DEFAULT 1,
        LineTotal AS (UnitPrice * Quantity),
        CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(OrderId) ON DELETE CASCADE,
        CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId)
    );
END
GO

-- =====================================================================
-- 7. BẢNG LỊCH SỬ TRẠNG THÁI ĐƠN, ĐÁNH GIÁ, CẤU HÌNH & NEWSLETTER
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderStatusHistory')
BEGIN
    CREATE TABLE dbo.OrderStatusHistory (
        HistoryId INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL,
        FromStatus VARCHAR(30) NULL,
        ToStatus VARCHAR(30) NOT NULL,
        Note NVARCHAR(500) NULL,
        ChangedBy INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_OSH_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(OrderId) ON DELETE CASCADE
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductReviews')
BEGIN
    CREATE TABLE dbo.ProductReviews (
        ReviewId INT IDENTITY(1,1) PRIMARY KEY,
        ProductId INT NOT NULL,
        UserId INT NOT NULL,
        Rating TINYINT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
        Comment NVARCHAR(1000) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_PR_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId) ON DELETE CASCADE,
        CONSTRAINT FK_PR_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT UQ_PR_User_Product UNIQUE (ProductId, UserId)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Settings')
BEGIN
    CREATE TABLE dbo.Settings (
        SettingKey VARCHAR(100) NOT NULL PRIMARY KEY,
        SettingValue NVARCHAR(1000) NULL,
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Newsletter')
BEGIN
    CREATE TABLE dbo.Newsletter (
        SubscriberId INT IDENTITY(1,1) PRIMARY KEY,
        Email VARCHAR(150) NOT NULL UNIQUE,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- =====================================================================
-- 8. VIEW DANH SÁCH SẢN PHẨM TOÀN DIỆN CHO API
-- =====================================================================
CREATE OR ALTER VIEW dbo.vw_ProductList
AS
SELECT
    p.ProductId, p.Sku, p.CarNumber, p.Name, p.Slug,
    p.Brand, p.Scale, p.PackagingType,
    p.PriceBox, p.PriceCard, p.DiscountPercent,
    p.Price, p.OldPrice, p.DepositAmount,
    p.StockBox, p.StockCard, p.Stock,
    p.EditionNote, p.PreOrderDeadline,
    p.ImageUrl, p.Description, p.Status,
    p.IsFeatured, p.IsNew, p.IsActive, p.CreatedAt, p.UpdatedAt,
    c.CategoryId, c.Slug AS CategorySlug, c.Name AS CategoryName
FROM dbo.Products AS p
INNER JOIN dbo.Categories AS c ON c.CategoryId = p.CategoryId;
GO

-- =====================================================================
-- 9. DỮ LIỆU DANH MỤC & 18 MÔ HÌNH XE CHUẨN HIỂN THỊ GIAO DIỆN 2026
-- =====================================================================
MERGE INTO dbo.Categories AS target
USING (VALUES
    (1, 'liberty-walk', N'Liberty Walk LBWK', N'Phong cách độ thân rộng Widebody huyền thoại từ Nhật Bản', 'image/Minigt_Lambo_LBWK.jpg', 1),
    (2, 'f1-racing', N'Formula 1 Racing', N'Xe đua Công thức 1 bản quyền chính thức các đội đua hàng đầu', 'image/f1_redbull.jpg', 2),
    (3, 'gt-racing', N'IMSA & GT3 Racing', N'Những chiến binh đường đua sức bền 24h & AO Racing', 'image/roxy_rexy_minigt.webp', 3),
    (4, 'box-sets', N'Box Sets & Combo', N'Bộ sưu tập nhiều xe và hộp quà giới hạn đặc biệt', 'image/huracan.webp', 4),
    (5, 'partner', N'Pop Race & Secret Chase', N'Thương hiệu đối tác: Pop Race, Kaido House & Secret Chase 1/24', 'image/Poprace_Supra_Secret.webp', 5)
) AS source (CategoryId, Slug, Name, Description, ImageUrl, SortOrder)
ON target.Slug = source.Slug
WHEN MATCHED THEN
    UPDATE SET Name = source.Name, Description = source.Description, ImageUrl = source.ImageUrl, SortOrder = source.SortOrder
WHEN NOT MATCHED THEN
    INSERT (Slug, Name, Description, ImageUrl, SortOrder)
    VALUES (source.Slug, source.Name, source.Description, source.ImageUrl, source.SortOrder);
GO

MERGE INTO dbo.Products AS target
USING (VALUES
    ('MGTS0026', 'S026', N'Lamborghini Huracán Sterrato All-Terrain Set (Box 4 xe)', 'lamborghini-huracan-sterrato-box-4-xe', 4, N'MINI GT', '1:64', 'box_only', 1850000, 1850000, 0, 1850000, 2100000, 500000, N'Box Set Đặc Biệt (Giới hạn 3000 bộ)', '2026-10-30', 15, 0, 15, 'image/huracan.webp', N'Bộ 4 xe Lamborghini Huracán Sterrato địa hình kèm hộp trưng bày Collector Box cao cấp chính hãng TSM-Model.', 'pre_order', '2026-12-15', 1, 1),
    ('MGT01413', '1413', N'Aston Martin AMR24 #18 Lance Stroll 2024 F1 Las Vegas GP', 'aston-martin-amr24-18-lance-stroll-las-vegas-gp', 2, N'MINI GT', '1:64', 'both', 420000, 480000, 10, 378000, 420000, 150000, N'Kèm Figure Tay Đua F1 Las Vegas', '2026-10-30', 15, 10, 25, 'image/f1.webp', N'Mô hình xe đua F1 Aston Martin AMR24 #18 chặng Las Vegas GP 2024, sơn xanh Racing Green ánh kim tuyệt đẹp.', 'pre_order', '2026-11-20', 1, 1),
    ('MGT01396', '1396', N'Aston Martin AMR24 #14 Fernando Alonso 2024 F1 Las Vegas GP', 'aston-martin-amr24-14-fernando-alonso-las-vegas-gp', 2, N'MINI GT', '1:64', 'both', 420000, 480000, 0, 420000, NULL, 150000, N'Bản Đua Đêm Las Vegas GP', '2026-10-30', 11, 7, 18, 'image/amr24.webp', N'Phiên bản xe đua F1 của huyền thoại Fernando Alonso #14 tại chặng đua đêm Las Vegas 2024.', 'pre_order', '2026-11-20', 1, 1),
    ('MGT00550', '550', N'Oracle Red Bull Racing RB18 #1 Max Verstappen 2022 Monaco GP', 'oracle-red-bull-racing-rb18-1-max-verstappen-monaco-gp', 2, N'MINI GT', '1:64', 'both', 420000, 480000, 10, 378000, 420000, 0, N'World Champion Edition • Box & Card', NULL, 9, 5, 14, 'image/f1_redbull.jpg', N'Chiếc xe vô địch thế giới F1 Red Bull RB18 #1 của Max Verstappen với chi tiết khí động học tỉ lệ 1:64 sắc nét.', 'in_stock', '2025-05-10', 1, 1),
    ('MGT01055', '1055', N'LB★WORKS Lamborghini Huracán GT Gravity Racing #5', 'lb-works-lamborghini-huracan-gt-gravity-racing-5', 1, N'MINI GT', '1:64', 'both', 350000, 410000, 0, 350000, NULL, 0, N'Liberty Walk Widebody #5', NULL, 14, 8, 22, 'image/mgt01055.webp', N'Siêu phẩm độ thân rộng Liberty Walk Lamborghini Huracán GT màu tím xanh Gravity Racing cực kỳ nổi bật.', 'in_stock', '2025-08-01', 1, 1),
    ('MGT01143', '1143', N'Porsche 911 GT3 R #77 AO Racing "Skeleton" 2024 IMSA Petit Le Mans', 'porsche-911-gt3-r-77-ao-racing-skeleton-2024-imsa', 3, N'MINI GT', '1:64', 'both', 390000, 470000, 0, 390000, NULL, 150000, N'Bản Giới Hạn Halloween Skeleton #77', '2026-10-30', 12, 8, 20, 'image/ske.webp', N'Phiên bản giới hạn Halloween Petit Le Mans với đồ họa bộ xương khủng long Rexy trên nền đen mờ.', 'pre_order', '2026-11-30', 1, 1),
    ('MGT01093', '1093', N'Porsche 911 GT3 R #77 AO Racing "Roxy" 2024 IMSA Road America', 'porsche-911-gt3-r-77-ao-racing-roxy-2024-imsa', 3, N'MINI GT', '1:64', 'both', 360000, 420000, 5, 342000, 360000, 0, N'Khủng Long Hồng Roxy #77', NULL, 7, 5, 12, 'image/Roxy.webp', N'Mẫu Porsche 911 GT3 R khủng long hồng Roxy #77 siêu hot của đội đua AO Racing tại giải IMSA.', 'in_stock', '2025-09-15', 1, 1),
    ('MGT00782', '782', N'Porsche 911 GT3 R #80 AO Racing "Rexy" 2023 IMSA Sebring 12h', 'porsche-911-gt3-r-80-ao-racing-rexy-2024-imsa', 3, N'MINI GT', '1:64', 'both', 380000, 450000, 0, 380000, 420000, 0, N'Khủng Long Xanh Rexy #80 Best-Seller', NULL, 5, 3, 8, 'image/rexy.jpg', N'Huyền thoại khủng long xanh Rexy #80 AO Racing được săn đón nhất trong giới sưu tầm MINI GT 1:64.', 'in_stock', '2025-03-20', 1, 0),
    ('MGT01129', '1129', N'Lamborghini Huracán GT3 EVO2 #45 DEX Imaging 2024 IMSA Daytona 24h', 'lamborghini-huracan-gt3-evo2-45-dex-imaging-daytona-24h', 3, N'MINI GT', '1:64', 'both', 330000, 390000, 0, 330000, NULL, 0, N'Đua Sức Bền Daytona 24 Hours', NULL, 12, 7, 19, 'image/lambo.webp', N'Mẫu xe đua Lamborghini Huracán GT3 EVO2 tham chiến giải đua sức bền 24 Giờ Daytona 2024.', 'in_stock', '2025-06-12', 0, 1),
    ('MGT00465', '465', N'LB-Super Silhouette Nissan S15 Silvia Presentation', 'lb-super-silhouette-nissan-s15-silvia-presentation', 1, N'MINI GT', '1:64', 'both', 320000, 370000, 0, 320000, 350000, 0, N'Liberty Walk Group 5 Silhouette', NULL, 10, 6, 16, 'image/Minigt_s15chop_lbwk.jpg', N'Biểu tượng JDM Nissan Silvia S15 độ bodykit Super Silhouette hầm hố từ nhà độ Liberty Walk Nhật Bản.', 'in_stock', '2024-11-05', 1, 0),
    ('MGT00618', '618', N'LB-Super Silhouette Nissan S15 Silvia #23 2022 Goodwood Festival of Speed', 'lb-super-silhouette-nissan-s15-silvia-23-goodwood-fos', 1, N'MINI GT', '1:64', 'both', 340000, 400000, 0, 340000, 380000, 0, N'Kỷ Niệm Lễ Hội Tốc Độ Goodwood #23', NULL, 5, 4, 9, 'image/Minigt_S15_LBWK.jpg', N'Phiên bản kỷ niệm màn trình diễn drift của chiếc S15 #23 tại lễ hội tốc độ Goodwood Vương Quốc Anh.', 'in_stock', '2024-04-18', 1, 0),
    ('PR640325', '325', N'Pop Race Top Secret GT300 Toyota Supra (A80) Silver Chrome', 'pop-race-toyota-supra-top-secret-gt300-silver-chrome', 5, N'Pop Race', '1:64', 'box_only', 480000, 480000, 0, 480000, 550000, 0, N'Secret Chase 1/24 • Mở Nắp Ca-pô Động Cơ 2JZ', NULL, 11, 0, 11, 'image/Poprace_Supra_Secret.webp', N'Phiên bản mạ Chrome bạc đặc biệt của Top Secret Supra GT300, mở được nắp ca-pô chiêm ngưỡng khối động cơ 2JZ.', 'in_stock', '2025-07-22', 1, 1),
    ('PR640118', '118', N'Pop Race Nissan Skyline GT-R V8 Drift (Hakosuka) Red Metallic', 'pop-race-nissan-skyline-gt-r-v8-drift-hakosuka-red', 5, N'Pop Race', '1:64', 'box_only', 450000, 450000, 0, 450000, 490000, 0, N'Tháo Rời Nắp Máy Động Cơ V8', NULL, 14, 0, 14, 'image/Poprace_Skyline.webp', N'Huyền thoại Hakosuka độ Drift động cơ V8 của Pop Race với sơn đỏ Metallic và bánh lốp cao su thật.', 'in_stock', '2025-08-30', 0, 1),
    ('TH640012', 'KH12', N'Toyota Yaris WRC #18 Katsuta Takamoto Rally Japan Acrylic Case', 'toyota-yaris-wrc-18-katsuta-takamoto-rally-japan', 5, N'Kaido House', '1:64', 'box_only', 500000, 500000, 10, 450000, 500000, 0, N'Kèm Đế Da & Hộp Mica Trưng Bày', NULL, 10, 0, 10, 'image/Toyota_Yaris_TrendsHobby.webp', N'Mô hình xe đua địa hình WRC Toyota Yaris kèm đế trưng bày và hộp chống bụi Acrylic sang trọng.', 'in_stock', '2025-09-01', 0, 1),
    ('MGTS0019', 'S019', N'Combo 2 Xe Porsche 911 GT3 R AO Racing Rexy #80 & Roxy #77 Twin Pack', 'combo-2-xe-porsche-911-gt3-r-ao-racing-rexy-roxy', 4, N'MINI GT', '1:64', 'both', 750000, 870000, 5, 713000, 750000, 0, N'Combo Rexy + Roxy Tiết Kiệm', NULL, 4, 2, 6, 'image/roxy-rexy-2.webp', N'Bộ đôi khủng long đường đua Rexy #80 (Xanh) và Roxy #77 (Hồng) đóng gói Combo 2 xe ưu đãi.', 'in_stock', '2025-10-01', 1, 1),
    ('MGT00642', '642', N'Red Bull RB18 #11 Sergio Perez & RB18 #1 Verstappen Pit Crew Box Set', 'red-bull-rb18-verstappen-perez-pit-crew-box-set', 4, N'TSM-Model', '1:64', 'box_only', 1150000, 1150000, 0, 1150000, 1290000, 0, N'Set 2 Xe F1 + Đội Kỹ Thuật Pit Stop', NULL, 7, 0, 7, 'image/f1-redbull-live.webp', N'Hộp sa bàn Pit Stop Red Bull Racing gồm 2 xe F1 RB18 và dàn nhân vật kỹ thuật viên thay lốp.', 'in_stock', '2025-06-15', 1, 0),
    ('MGT01055-LW', '1055C', N'LB★WORKS Lamborghini Huracán GT Gravity (Bản Vỉ Blister Card)', 'lb-works-lamborghini-huracan-gt-gravity-blister-card', 1, N'MINI GT', '1:64', 'card_only', 410000, 410000, 0, 410000, 450000, 0, N'Vỉ Nhựa Blister Card Art Nguyên Seal', NULL, 0, 12, 12, 'image/minig_lambo_lbwk.webp', N'Phiên bản đóng gói Vỉ nhựa cứng Blister Card cao cấp kèm ảnh bìa nghệ thuật Liberty Walk chống cấn góc 100%.', 'in_stock', '2025-08-01', 0, 1),
    ('MGT00688', '688', N'LB★WORKS Lamborghini Aventador Limited Edition Matte Black', 'lb-works-lamborghini-aventador-limited-edition-matte-black', 1, N'MINI GT', '1:64', 'both', 380000, 440000, 0, 380000, 420000, 0, N'Siêu Bò Aventador Widebody Đen Nhám', NULL, 6, 4, 10, 'image/Minigt_Lambo_LBWK.jpg', N'Siêu bò Lamborghini Aventador độ thân rộng LB★WORKS màu đen nhám kết hợp cánh gió GT cỡ lớn.', 'in_stock', '2025-04-12', 1, 0)
) AS source (Sku, CarNumber, Name, Slug, CategoryId, Brand, Scale, PackagingType, PriceBox, PriceCard, DiscountPercent, Price, OldPrice, DepositAmount, EditionNote, PreOrderDeadline, StockBox, StockCard, Stock, ImageUrl, Description, Status, ReleaseDate, IsFeatured, IsNew)
ON target.Sku = source.Sku
WHEN MATCHED THEN
    UPDATE SET
        CarNumber = source.CarNumber, Name = source.Name, Slug = source.Slug,
        CategoryId = source.CategoryId, Brand = source.Brand, Scale = source.Scale,
        PackagingType = source.PackagingType, PriceBox = source.PriceBox,
        PriceCard = source.PriceCard, DiscountPercent = source.DiscountPercent,
        Price = source.Price, OldPrice = source.OldPrice, DepositAmount = source.DepositAmount,
        EditionNote = source.EditionNote, PreOrderDeadline = source.PreOrderDeadline,
        StockBox = source.StockBox, StockCard = source.StockCard, Stock = source.Stock,
        ImageUrl = source.ImageUrl, Description = source.Description,
        Status = source.Status, ReleaseDate = source.ReleaseDate,
        IsFeatured = source.IsFeatured, IsNew = source.IsNew, IsActive = 1,
        UpdatedAt = SYSDATETIME()
WHEN NOT MATCHED THEN
    INSERT (Sku, CarNumber, Name, Slug, CategoryId, Brand, Scale, PackagingType, PriceBox, PriceCard, DiscountPercent, Price, OldPrice, DepositAmount, EditionNote, PreOrderDeadline, StockBox, StockCard, Stock, ImageUrl, Description, Status, ReleaseDate, IsFeatured, IsNew, IsActive)
    VALUES (source.Sku, source.CarNumber, source.Name, source.Slug, source.CategoryId, source.Brand, source.Scale, source.PackagingType, source.PriceBox, source.PriceCard, source.DiscountPercent, source.Price, source.OldPrice, source.DepositAmount, source.EditionNote, source.PreOrderDeadline, source.StockBox, source.StockCard, source.Stock, source.ImageUrl, source.Description, source.Status, source.ReleaseDate, source.IsFeatured, source.IsNew, 1);
GO

PRINT N'Cơ sở dữ liệu MiniGTStore đã được khởi tạo và đồng bộ thành công!';
GO
