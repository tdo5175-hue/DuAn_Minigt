-- =====================================================================
-- CƠ SỞ DỮ LIỆU: MINI GT STORE - HỆ THỐNG MÔ HÌNH XE DIE-CAST 1:64
-- MÁY CHỦ: QUOCTHINH\DOQUOCTHINH (Microsoft SQL Server / SSMS)
-- NGÀY TẠO: 2026-10-11
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
    CREATE TABLE Categories (
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
-- 2. BẢNG PRODUCTS (Sản phẩm mô hình MINI GT, Pop Race, TSM)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
BEGIN
    CREATE TABLE Products (
        ProductId INT IDENTITY(1,1) PRIMARY KEY,
        Sku VARCHAR(30) NOT NULL UNIQUE,
        Name NVARCHAR(200) NOT NULL,
        Slug VARCHAR(200) NOT NULL,
        CategoryId INT NOT NULL,
        Brand NVARCHAR(100) NOT NULL DEFAULT N'MINI GT',
        Scale VARCHAR(20) NOT NULL DEFAULT '1:64',
        Price DECIMAL(18,2) NOT NULL,
        OldPrice DECIMAL(18,2) NULL,
        DepositAmount DECIMAL(18,2) NULL,
        QuotaPercent INT NULL DEFAULT 0,
        EditionNote NVARCHAR(150) NULL,
        PreOrderDeadline DATE NULL,
        Stock INT NOT NULL DEFAULT 0,
        ImageUrl NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Status VARCHAR(20) NOT NULL DEFAULT 'in_stock', -- in_stock, pre_order, sold_out
        ReleaseDate DATE NULL,
        IsFeatured BIT NOT NULL DEFAULT 0,
        IsNew BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId)
    );
END
GO

-- =====================================================================
-- 3. BẢNG PRODUCT IMAGES (Hình ảnh chi tiết)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductImages')
BEGIN
    CREATE TABLE ProductImages (
        ImageId INT IDENTITY(1,1) PRIMARY KEY,
        ProductId INT NOT NULL,
        ImageUrl NVARCHAR(255) NOT NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        CONSTRAINT FK_ProductImages_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE
    );
END
GO

-- =====================================================================
-- 4. BẢNG USERS (Người dùng, hỗ trợ Đăng nhập Thường + Gmail Google)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
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
    CREATE TABLE Orders (
        OrderId INT IDENTITY(1,1) PRIMARY KEY,
        OrderCode VARCHAR(30) NOT NULL UNIQUE,
        UserId INT NULL,
        FullName NVARCHAR(100) NOT NULL,
        Phone VARCHAR(20) NOT NULL,
        Address NVARCHAR(255) NOT NULL,
        Note NVARCHAR(500) NULL,
        PaymentMethod VARCHAR(30) NOT NULL DEFAULT 'BANK_TRANSFER', -- 'COD', 'BANK_TRANSFER'
        PaymentStatus VARCHAR(20) NOT NULL DEFAULT 'UNPAID',        -- 'UNPAID', 'PAID', 'REFUNDED'
        CancelReason NVARCHAR(255) NULL,
        ReceiptImage NVARCHAR(500) NULL,
        Subtotal DECIMAL(18,2) NOT NULL,
        ShippingFee DECIMAL(18,2) NOT NULL DEFAULT 0,
        Total DECIMAL(18,2) NOT NULL,
        Status VARCHAR(30) NOT NULL DEFAULT 'PENDING',              -- 'PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId) REFERENCES Users(UserId),
        CONSTRAINT CK_Orders_Payment CHECK (PaymentMethod IN ('COD', 'BANK_TRANSFER', 'cod', 'bank', 'vietqr', 'momo')),
        CONSTRAINT CK_Orders_PaymentStatus CHECK (PaymentStatus IN ('UNPAID', 'PAID', 'REFUNDED', 'unpaid', 'paid', 'refunded')),
        CONSTRAINT CK_Orders_Status CHECK (Status IN ('PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled'))
    );
END
GO

-- =====================================================================
-- 6. BẢNG ORDER ITEMS (Chi tiết sản phẩm trong đơn)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderItems')
BEGIN
    CREATE TABLE OrderItems (
        OrderItemId INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL,
        ProductId INT NOT NULL,
        ProductName NVARCHAR(200) NOT NULL,
        UnitPrice DECIMAL(18,2) NOT NULL,
        Quantity INT NOT NULL DEFAULT 1,
        LineTotal AS (UnitPrice * Quantity),
        CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId) ON DELETE CASCADE,
        CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId)
    );
END
GO

-- =====================================================================
-- 7. BẢNG NEWSLETTER (Đăng ký nhận thông báo mở cọc mới)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Newsletter')
BEGIN
    CREATE TABLE Newsletter (
        SubscriberId INT IDENTITY(1,1) PRIMARY KEY,
        Email VARCHAR(150) NOT NULL UNIQUE,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- =====================================================================
-- 8. VIEW DANH SÁCH SẢN PHẨM TOÀN DIỆN CHO API
-- =====================================================================
IF OBJECT_ID('dbo.vw_ProductList', 'V') IS NOT NULL
    DROP VIEW dbo.vw_ProductList;
GO

CREATE VIEW dbo.vw_ProductList
AS
SELECT  p.ProductId, p.Sku, p.Name, p.Slug, p.Brand, p.Scale,
        p.Price, p.OldPrice, p.Stock, p.ImageUrl, p.Description,
        p.Status, p.ReleaseDate, p.IsFeatured, p.IsNew, p.CreatedAt,
        p.QuotaPercent, p.DepositAmount, p.EditionNote, p.PreOrderDeadline,
        c.CategoryId, c.Slug AS CategorySlug, c.Name AS CategoryName
FROM    dbo.Products  AS p
JOIN    dbo.Categories AS c ON c.CategoryId = p.CategoryId;
GO

-- =====================================================================
-- 9. DỮ LIỆU MẪU CHUẨN MINI GT STORE 2026
-- =====================================================================
-- Danh mục
MERGE INTO Categories AS target
USING (VALUES
    (1, 'liberty-walk', N'Liberty Walk LBWK', N'Phong cách widebody huyền thoại từ Nhật Bản', 'image/Minigt_Lambo_LBWK.jpg', 1),
    (2, 'f1-racing', N'Formula 1 Racing', N'Xe đua F1 chính hãng các đội đua hàng đầu', 'image/f1_redbull.jpg', 2),
    (3, 'gt-racing', N'IMSA & GT3 Racing', N'Những chiến binh đường đua sức bền', 'image/minigt_lambogt3.jpg', 3),
    (4, 'box-sets', N'Box Sets & Combo', N'Bộ sưu tập nhiều xe, hộp quà đặc biệt', 'image/lambo-sterrato-set.png', 4),
    (5, 'partner', N'Pop Race & Collab', N'Thương hiệu đối tác: Pop Race, Trends Hobby', 'image/Poprace_Supra_Secret.webp', 5)
) AS source (CategoryId, Slug, Name, Description, ImageUrl, SortOrder)
ON target.Slug = source.Slug
WHEN MATCHED THEN
    UPDATE SET Name = source.Name, Description = source.Description, ImageUrl = source.ImageUrl, SortOrder = source.SortOrder
WHEN NOT MATCHED THEN
    INSERT (Slug, Name, Description, ImageUrl, SortOrder)
    VALUES (source.Slug, source.Name, source.Description, source.ImageUrl, source.SortOrder);
GO

-- Sản phẩm
-- (Đã bao gồm đầy đủ xe F1, Box Set, Liberty Walk, IMSA Rexy/Roxy/Skeleton, Pop Race Chase)
MERGE INTO Products AS target
USING (VALUES
    ('MGTS0026', N'Lamborghini Huracán Sterrato All-Terrain Set (Box 4 xe)', 'lamborghini-huracan-sterrato-box-4-xe', 4, N'MINI GT', '1:64', 1850000, NULL, 500000, 82, N'+ Box Set Camo', '2026-10-30', 20, 'image/lambo-sterrato-set.png', N'Set 4 xe Lamborghini Huracán Sterrato All-Terrain với hộp trưng bày Collector Box sang trọng, chi tiết lốp off-road và giá nóc safari.', 'pre_order', '2026-12-15', 1, 1),
    ('MGT01413', N'Aston Martin AMR24 #18 Lance Stroll F1 Las Vegas GP', 'aston-martin-amr24-18-lance-stroll-las-vegas-gp', 2, N'MINI GT', '1:64', 460000, 500000, 150000, 75, N'+ LHD Edition', '2026-10-30', 45, 'image/aston-amr24-stroll.png', N'Chiến mã F1 AMR24 của tay đua Lance Stroll tại chặng Las Vegas GP 2024. Cánh gió sau khí động học, tem tài trợ Aramco sắc nét.', 'pre_order', '2026-11-20', 1, 1),
    ('MGT01396', N'Aston Martin AMR24 #14 Fernando Alonso F1 Las Vegas GP', 'aston-martin-amr24-14-fernando-alonso-las-vegas-gp', 2, N'MINI GT', '1:64', 450000, NULL, 150000, 90, N'+ 2x World Champ', '2026-10-30', 12, 'image/aston-amr24-alonso.png', N'Mẫu xe F1 AMR24 của huyền thoại 2 lần vô địch thế giới Fernando Alonso chặng Las Vegas GP.', 'pre_order', '2026-11-20', 1, 1),
    ('MGT00550', N'Oracle Red Bull Racing RB18 #1 Max Verstappen 2022 Monaco GP', 'oracle-red-bull-racing-rb18-1-max-verstappen-monaco-gp', 2, N'MINI GT', '1:64', 420000, NULL, 150000, 60, N'+ Champion Livery', NULL, 18, 'image/f1_redbull.jpg', N'Mô hình Red Bull Racing RB18 số 1 Max Verstappen vô địch chặng đua Monaco GP danh giá.', 'in_stock', '2024-05-10', 1, 0),
    ('MGT01055', N'LB★WORKS Lamborghini Huracán GT Gravity Racing #5', 'lb-works-lamborghini-huracan-gt-gravity-racing-5', 1, N'MINI GT', '1:64', 350000, NULL, NULL, 0, N'+ Widebody Aero', NULL, 25, 'image/mgt01055.webp', N'Bản độ Liberty Walk Huracán GT phong cách Gravity Racing với body kit vòm bánh rộng tán đinh tán đặc trưng.', 'in_stock', '2025-08-01', 1, 0),
    ('MGT01143', N'Porsche 911 GT3 R #77 AO Racing "Skeleton" 2024 IMSA', 'porsche-911-gt3-r-77-ao-racing-skeleton-2024-imsa', 3, N'MINI GT', '1:64', 390000, NULL, 150000, 70, N'+ Halloween Skeleton', '2026-10-30', 30, 'image/ske.webp', N'Phiên bản đặc biệt Halloween của đội AO Racing với tem khung xương phát quang cực kỳ độc đáo.', 'pre_order', '2026-11-30', 1, 1),
    ('MGT01093', N'Porsche 911 GT3 R #77 AO Racing "Roxy" 2024 IMSA Road America', 'porsche-911-gt3-r-77-ao-racing-roxy-2024-imsa', 3, N'MINI GT', '1:64', 360000, NULL, NULL, 88, N'+ Pink Livery IMSA', NULL, 15, 'image/Roxy.webp', N'Chiếc Porsche khủng long hồng Roxy nổi tiếng của AO Racing tại giải đua Road America.', 'in_stock', '2025-09-15', 1, 0),
    ('MGT00782', N'Porsche 911 GT3 R #80 AO Racing "Rexy" 2024 IMSA', 'porsche-911-gt3-r-80-ao-racing-rexy-2024-imsa', 3, N'MINI GT', '1:64', 380000, NULL, NULL, 95, N'+ IMSA Dino Edition', NULL, 8, 'image/rexy.jpg', N'Biểu tượng khủng long xanh Rexy gầm rú khuấy đảo các trường đua IMSA và Le Mans.', 'in_stock', '2025-03-20', 1, 0),
    ('MGT01129', N'Lamborghini Huracán GT3 EVO2 #45 DEX Imaging 2024 IMSA Daytona 24h', 'lamborghini-huracan-gt3-evo2-45-dex-imaging-daytona-24h', 3, N'MINI GT', '1:64', 330000, NULL, NULL, 0, N'+ Daytona 24h Spec', NULL, 14, 'image/minigt_lambogt3.jpg', N'Mẫu xe đua Lamborghini Huracán GT3 EVO2 tham chiến 24 Giờ Daytona với bộ tem đỏ đen ấn tượng.', 'in_stock', '2025-06-12', 0, 0),
    ('MGT00465', N'LB-Super Silhouette Nissan S15 Silvia Presentation', 'lb-super-silhouette-nissan-s15-silvia-presentation', 1, N'MINI GT', '1:64', 320000, NULL, NULL, 0, N'+ Silhouette Wing', NULL, 22, 'image/Minigt_s15chop_lbwk.jpg', N'Huyền thoại S15 phong cách Super Silhouette từ nhà độ Liberty Walk Wataru Kato.', 'in_stock', '2024-11-05', 1, 0),
    ('MGT00618', N'LB-Super Silhouette Nissan S15 Silvia #23 2022 Goodwood FoS', 'lb-super-silhouette-nissan-s15-silvia-23-goodwood-fos', 1, N'MINI GT', '1:64', 340000, NULL, NULL, 100, N'+ Goodwood FoS #23', NULL, 0, 'image/Minigt_S15_LBWK.jpg', N'Chiếc S15 drift tại lễ hội tốc độ Goodwood Festival of Speed 2022.', 'sold_out', '2024-04-18', 0, 0),
    ('PR640325', N'Pop Race Toyota Supra Top Secret GT300 Silver Chrome', 'pop-race-toyota-supra-top-secret-gt300-silver-chrome', 5, N'Pop Race', '1:64', 420000, NULL, NULL, 0, N'+ Top Secret Chrome', NULL, 19, 'image/Poprace_Supra_Secret.webp', N'Siêu phẩm Top Secret Supra màu bạc tráng gương có thể mở nắp capo chi tiết động cơ 2JZ.', 'in_stock', '2025-07-22', 1, 0),
    ('PR640110', N'Pop Race Lamborghini Huracán STO Blu Laufey', 'pop-race-lamborghini-huracan-sto-blu-laufey', 5, N'Pop Race', '1:64', 450000, NULL, NULL, 0, N'+ Openable Engine', NULL, 11, 'image/Poprace_Lambo_Secret.webp', N'Huracán STO màu xanh Laufey đặc trưng, mở nắp khoang động cơ cực kỳ tinh xảo.', 'in_stock', '2025-08-30', 0, 1),
    ('TH-ULTRA63', N'Trends Hobby Lamborghini Huracán GT3 EVO2 #63 Ultraman Tiga', 'trends-hobby-lamborghini-huracan-gt3-evo2-63-ultraman-tiga', 5, N'Trends Hobby', '1:64', 590000, NULL, NULL, 0, N'+ Bản quyền Ultraman', NULL, 7, 'image/TH_LamboUltraman.jpg', N'Phiên bản giới hạn bản quyền chính thức Ultraman Tiga với hộp acrylic cao cấp và đế da.', 'in_stock', '2025-09-01', 1, 1),
    ('COMBO-AMR24', N'Combo Aston Martin AMR24 Las Vegas 2024 (Stroll #18 + Alonso #14)', 'combo-aston-martin-amr24-las-vegas-2024', 4, N'MINI GT', '1:64', 880000, 950000, 300000, 85, N'+ Trọn Bộ 2 Xe F1', '2026-10-30', 10, 'image/aston-amr24-stroll.png', N'Cặp bài trùng AMR24 Las Vegas của 2 tay đua Lance Stroll và Fernando Alonso, tặng kèm decal bảo vệ.', 'pre_order', '2026-11-20', 1, 1),
    ('COMBO-AO3', N'Combo AO Racing Porsche 911 GT3 R "Rexy – Roxy – Skeleton"', 'combo-ao-racing-porsche-911-gt3-r-rexy-roxy-skeleton', 4, N'MINI GT', '1:64', 1090000, 1150000, 400000, 92, N'+ Bộ 3 Khủng Long IMSA', '2026-10-30', 8, 'image/Roxy.webp', N'Bộ ba khủng long AO Racing vang danh làng đua xe thể thao IMSA Mỹ.', 'pre_order', '2026-11-30', 1, 1),
    ('MGT01055-LW', N'LB★WORKS Lamborghini Huracán GT Gravity (Vỉ Blister Card)', 'lb-works-lamborghini-huracan-gt-gravity-blister-card', 1, N'MINI GT', '1:64', 370000, NULL, NULL, 0, N'+ Đóng Gói Vỉ Blister', NULL, 16, 'image/minig_lambo_lbwk.webp', N'Quy cách đóng vỉ Blister Card dành cho collector thích giữ nguyên seal treo tường.', 'in_stock', '2025-08-01', 0, 0)
) AS source (Sku, Name, Slug, CategoryId, Brand, Scale, Price, OldPrice, DepositAmount, QuotaPercent, EditionNote, PreOrderDeadline, Stock, ImageUrl, Description, Status, ReleaseDate, IsFeatured, IsNew)
ON target.Sku = source.Sku
WHEN MATCHED THEN
    UPDATE SET 
        Name = source.Name, Slug = source.Slug, CategoryId = source.CategoryId,
        Brand = source.Brand, Scale = source.Scale, Price = source.Price,
        OldPrice = source.OldPrice, DepositAmount = source.DepositAmount,
        QuotaPercent = source.QuotaPercent, EditionNote = source.EditionNote,
        PreOrderDeadline = source.PreOrderDeadline, Stock = source.Stock,
        ImageUrl = source.ImageUrl, Description = source.Description,
        Status = source.Status, ReleaseDate = source.ReleaseDate,
        IsFeatured = source.IsFeatured, IsNew = source.IsNew
WHEN NOT MATCHED THEN
    INSERT (Sku, Name, Slug, CategoryId, Brand, Scale, Price, OldPrice, DepositAmount, QuotaPercent, EditionNote, PreOrderDeadline, Stock, ImageUrl, Description, Status, ReleaseDate, IsFeatured, IsNew)
    VALUES (source.Sku, source.Name, source.Slug, source.CategoryId, source.Brand, source.Scale, source.Price, source.OldPrice, source.DepositAmount, source.QuotaPercent, source.EditionNote, source.PreOrderDeadline, source.Stock, source.ImageUrl, source.Description, source.Status, source.ReleaseDate, source.IsFeatured, source.IsNew);
GO

PRINT N'Cơ sở dữ liệu MiniGTStore đã được khởi tạo và đồng bộ thành công!';
GO
