/**
 * MIGRATION 002 — ĐỒNG BỘ DỮ LIỆU CHUẨN 2026 (CATEGORIES, 18 PRODUCTS, USERS, SETTINGS)
 * Đảm bảo dữ liệu trong SQL Server khớp 100% với giao diện web (index.html, api.js, app.js, admin)
 * và xử lý triệt để lỗi font tiếng Việt (UTF-8 / NVARCHAR).
 */
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const CANONICAL_CATEGORIES = [
  { id: 1, slug: 'liberty-walk', name: 'Liberty Walk LBWK', desc: 'Phong cách độ thân rộng Widebody huyền thoại từ Nhật Bản', img: 'image/Minigt_Lambo_LBWK.jpg', sort: 1 },
  { id: 2, slug: 'f1-racing', name: 'Formula 1 Racing', desc: 'Xe đua Công thức 1 bản quyền chính thức các đội đua hàng đầu', img: 'image/f1_redbull.jpg', sort: 2 },
  { id: 3, slug: 'gt-racing', name: 'IMSA & GT3 Racing', desc: 'Những chiến binh đường đua sức bền 24h & AO Racing', img: 'image/roxy_rexy_minigt.webp', sort: 3 },
  { id: 4, slug: 'box-sets', name: 'Box Sets & Combo', desc: 'Bộ sưu tập nhiều xe và hộp quà giới hạn đặc biệt', img: 'image/huracan.webp', sort: 4 },
  { id: 5, slug: 'partner', name: 'Pop Race & Secret Chase', desc: 'Thương hiệu đối tác: Pop Race, Kaido House & Secret Chase 1/24', img: 'image/Poprace_Supra_Secret.webp', sort: 5 }
];

const CANONICAL_PRODUCTS = [
  {
    id: 1, sku: 'MGTS0026', carNumber: 'S026',
    name: 'Lamborghini Huracán Sterrato All-Terrain Set (Box 4 xe)',
    slug: 'lamborghini-huracan-sterrato-box-4-xe',
    categoryId: 4, brand: 'MINI GT', scale: '1:64', packagingType: 'box_only',
    priceBox: 1850000, priceCard: 1850000, discountPercent: 0,
    price: 1850000, oldPrice: 2100000, depositAmount: 500000, quotaPercent: 92,
    editionNote: 'Box Set Đặc Biệt (Giới hạn 3000 bộ)', preOrderDeadline: '2026-10-30',
    stock: 15, imageUrl: 'image/lambo-sterrato-set.png',
    description: 'Bộ 4 xe Lamborghini Huracán Sterrato địa hình kèm hộp trưng bày Collector Box cao cấp chính hãng TSM-Model.',
    status: 'pre_order', releaseDate: '2026-12-15', isFeatured: 1, isNew: 1
  },
  {
    id: 2, sku: 'MGT01413', carNumber: '1413',
    name: 'Aston Martin AMR24 #18 Lance Stroll 2024 F1 Las Vegas GP',
    slug: 'aston-martin-amr24-18-lance-stroll-las-vegas-gp',
    categoryId: 2, brand: 'MINI GT', scale: '1:64', packagingType: 'both',
    priceBox: 420000, priceCard: 480000, discountPercent: 10,
    price: 378000, oldPrice: 420000, depositAmount: 150000, quotaPercent: 88,
    editionNote: 'Kèm Figure Tay Đua F1 Las Vegas', preOrderDeadline: '2026-10-30',
    stock: 25, imageUrl: 'image/aston-amr24-stroll.png',
    description: 'Mô hình xe đua F1 Aston Martin AMR24 #18 chặng Las Vegas GP 2024, sơn xanh Racing Green ánh kim tuyệt đẹp.',
    status: 'pre_order', releaseDate: '2026-11-20', isFeatured: 1, isNew: 1
  },
  {
    id: 3, sku: 'MGT01396', carNumber: '1396',
    name: 'Aston Martin AMR24 #14 Fernando Alonso 2024 F1 Las Vegas GP',
    slug: 'aston-martin-amr24-14-fernando-alonso-las-vegas-gp',
    categoryId: 2, brand: 'MINI GT', scale: '1:64', packagingType: 'both',
    priceBox: 420000, priceCard: 480000, discountPercent: 0,
    price: 420000, oldPrice: null, depositAmount: 150000, quotaPercent: 95,
    editionNote: 'Bản Đua Đêm Las Vegas GP', preOrderDeadline: '2026-10-30',
    stock: 18, imageUrl: 'image/aston-amr24-alonso.png',
    description: 'Phiên bản xe đua F1 của huyền thoại Fernando Alonso #14 tại chặng đua đêm Las Vegas 2024.',
    status: 'pre_order', releaseDate: '2026-11-20', isFeatured: 1, isNew: 1
  },
  {
    id: 4, sku: 'MGT00550', carNumber: '550',
    name: 'Oracle Red Bull Racing RB18 #1 Max Verstappen 2022 Monaco GP',
    slug: 'oracle-red-bull-racing-rb18-1-max-verstappen-monaco-gp',
    categoryId: 2, brand: 'MINI GT', scale: '1:64', packagingType: 'both',
    priceBox: 420000, priceCard: 480000, discountPercent: 10,
    price: 378000, oldPrice: 420000, depositAmount: 0, quotaPercent: 100,
    editionNote: 'World Champion Edition • Box & Card', preOrderDeadline: null,
    stock: 14, imageUrl: 'image/f1_redbull.jpg',
    description: 'Chiếc xe vô địch thế giới F1 Red Bull RB18 #1 của Max Verstappen với chi tiết khí động học tỉ lệ 1:64 sắc nét.',
    status: 'in_stock', releaseDate: '2025-05-10', isFeatured: 1, isNew: 1
  },
  {
    id: 5, sku: 'MGT01055', carNumber: '1055',
    name: 'LB★WORKS Lamborghini Huracán GT Gravity Racing #5',
    slug: 'lb-works-lamborghini-huracan-gt-gravity-racing-5',
    categoryId: 1, brand: 'MINI GT', scale: '1:64', packagingType: 'both',
    priceBox: 350000, priceCard: 410000, discountPercent: 0,
    price: 350000, oldPrice: null, depositAmount: 0, quotaPercent: 82,
    editionNote: 'Liberty Walk Widebody #5', preOrderDeadline: null,
    stock: 22, imageUrl: 'image/mgt01055.webp',
    description: 'Siêu phẩm độ thân rộng Liberty Walk Lamborghini Huracán GT màu tím xanh Gravity Racing cực kỳ nổi bật.',
    status: 'in_stock', releaseDate: '2025-08-01', isFeatured: 1, isNew: 1
  },
  {
    id: 6, sku: 'MGT01143', carNumber: '1143',
    name: 'Porsche 911 GT3 R #77 AO Racing "Skeleton" 2024 IMSA Petit Le Mans',
    slug: 'porsche-911-gt3-r-77-ao-racing-skeleton-2024-imsa',
    categoryId: 3, brand: 'MINI GT', scale: '1:64', packagingType: 'both',
    priceBox: 390000, priceCard: 470000, discountPercent: 0,
    price: 390000, oldPrice: null, depositAmount: 150000, quotaPercent: 89,
    editionNote: 'Bản Giới Hạn Halloween Skeleton #77', preOrderDeadline: '2026-10-30',
    stock: 20, imageUrl: 'image/ske.webp',
    description: 'Phiên bản giới hạn Halloween Petit Le Mans với đồ họa bộ xương khủng long Rexy trên nền đen mờ.',
    status: 'pre_order', releaseDate: '2026-11-30', isFeatured: 1, isNew: 1
  },
  {
    id: 7, sku: 'MGT01093', carNumber: '1093',
    name: 'Porsche 911 GT3 R #77 AO Racing "Roxy" 2024 IMSA Road America',
    slug: 'porsche-911-gt3-r-77-ao-racing-roxy-2024-imsa',
    categoryId: 3, brand: 'MINI GT', scale: '1:64', packagingType: 'both',
    priceBox: 360000, priceCard: 420000, discountPercent: 5,
    price: 342000, oldPrice: 360000, depositAmount: 0, quotaPercent: 94,
    editionNote: 'Khủng Long Hồng Roxy #77', preOrderDeadline: null,
    stock: 12, imageUrl: 'image/Roxy.webp',
    description: 'Mẫu Porsche 911 GT3 R khủng long hồng Roxy #77 siêu hot của đội đua AO Racing tại giải IMSA.',
    status: 'in_stock', releaseDate: '2025-09-15', isFeatured: 1, isNew: 1
  },
  {
    id: 8, sku: 'MGT00782', carNumber: '782',
    name: 'Porsche 911 GT3 R #80 AO Racing "Rexy" 2023 IMSA Sebring 12h',
    slug: 'porsche-911-gt3-r-80-ao-racing-rexy-2024-imsa',
    categoryId: 3, brand: 'MINI GT', scale: '1:64', packagingType: 'both',
    priceBox: 380000, priceCard: 450000, discountPercent: 0,
    price: 380000, oldPrice: 420000, depositAmount: 0, quotaPercent: 96,
    editionNote: 'Khủng Long Xanh Rexy #80 Best-Seller', preOrderDeadline: null,
    stock: 8, imageUrl: 'image/rexy.jpg',
    description: 'Huyền thoại khủng long xanh Rexy #80 AO Racing được săn đón nhất trong giới sưu tầm MINI GT 1:64.',
    status: 'in_stock', releaseDate: '2025-03-20', isFeatured: 1, isNew: 0
  },
  {
    id: 9, sku: 'MGT01129', carNumber: '1129',
    name: 'Lamborghini Huracán GT3 EVO2 #45 DEX Imaging 2024 IMSA Daytona 24h',
    slug: 'lamborghini-huracan-gt3-evo2-45-dex-imaging-daytona-24h',
    categoryId: 3, brand: 'MINI GT', scale: '1:64', packagingType: 'both',
    priceBox: 330000, priceCard: 390000, discountPercent: 0,
    price: 330000, oldPrice: null, depositAmount: 0, quotaPercent: 75,
    editionNote: 'Đua Sức Bền Daytona 24 Hours', preOrderDeadline: null,
    stock: 19, imageUrl: 'image/Minigt_Lambo_GT3.jpg',
    description: 'Mẫu xe đua Lamborghini Huracán GT3 EVO2 tham chiến giải đua sức bền 24 Giờ Daytona 2024.',
    status: 'in_stock', releaseDate: '2025-06-12', isFeatured: 0, isNew: 1
  },
  {
    id: 10, sku: 'MGT00465', carNumber: '465',
    name: 'LB-Super Silhouette Nissan S15 Silvia Presentation',
    slug: 'lb-super-silhouette-nissan-s15-silvia-presentation',
    categoryId: 1, brand: 'MINI GT', scale: '1:64', packagingType: 'both',
    priceBox: 320000, priceCard: 370000, discountPercent: 0,
    price: 320000, oldPrice: 350000, depositAmount: 0, quotaPercent: 90,
    editionNote: 'Liberty Walk Group 5 Silhouette', preOrderDeadline: null,
    stock: 16, imageUrl: 'image/Minigt_s15chop_lbwk.jpg',
    description: 'Biểu tượng JDM Nissan Silvia S15 độ bodykit Super Silhouette hầm hố từ nhà độ Liberty Walk Nhật Bản.',
    status: 'in_stock', releaseDate: '2024-11-05', isFeatured: 1, isNew: 0
  },
  {
    id: 11, sku: 'MGT00618', carNumber: '618',
    name: 'LB-Super Silhouette Nissan S15 Silvia #23 2022 Goodwood Festival of Speed',
    slug: 'lb-super-silhouette-nissan-s15-silvia-23-goodwood-fos',
    categoryId: 1, brand: 'MINI GT', scale: '1:64', packagingType: 'both',
    priceBox: 340000, priceCard: 400000, discountPercent: 0,
    price: 340000, oldPrice: 380000, depositAmount: 0, quotaPercent: 95,
    editionNote: 'Kỷ Niệm Lễ Hội Tốc Độ Goodwood #23', preOrderDeadline: null,
    stock: 9, imageUrl: 'image/Minigt_S15_LBWK.jpg',
    description: 'Phiên bản kỷ niệm màn trình diễn drift của chiếc S15 #23 tại lễ hội tốc độ Goodwood Vương Quốc Anh.',
    status: 'in_stock', releaseDate: '2024-04-18', isFeatured: 1, isNew: 0
  },
  {
    id: 12, sku: 'PR640325', carNumber: '325',
    name: 'Pop Race Top Secret GT300 Toyota Supra (A80) Silver Chrome',
    slug: 'pop-race-toyota-supra-top-secret-gt300-silver-chrome',
    categoryId: 5, brand: 'Pop Race', scale: '1:64', packagingType: 'box_only',
    priceBox: 480000, priceCard: 480000, discountPercent: 0,
    price: 480000, oldPrice: 550000, depositAmount: 0, quotaPercent: 92,
    editionNote: 'Secret Chase 1/24 • Mở Nắp Ca-pô Động Cơ 2JZ', preOrderDeadline: null,
    stock: 11, imageUrl: 'image/Poprace_Supra_Secret.webp',
    description: 'Phiên bản mạ Chrome bạc đặc biệt của Top Secret Supra GT300, mở được nắp ca-pô chiêm ngưỡng khối động cơ 2JZ.',
    status: 'in_stock', releaseDate: '2025-07-22', isFeatured: 1, isNew: 1
  },
  {
    id: 13, sku: 'PR640118', carNumber: '118',
    name: 'Pop Race Nissan Skyline GT-R V8 Drift (Hakosuka) Red Metallic',
    slug: 'pop-race-nissan-skyline-gt-r-v8-drift-hakosuka-red',
    categoryId: 5, brand: 'Pop Race', scale: '1:64', packagingType: 'box_only',
    priceBox: 450000, priceCard: 450000, discountPercent: 0,
    price: 450000, oldPrice: 490000, depositAmount: 0, quotaPercent: 86,
    editionNote: 'Tháo Rời Nắp Máy Động Cơ V8', preOrderDeadline: null,
    stock: 14, imageUrl: 'image/Poprace_Skyline.webp',
    description: 'Huyền thoại Hakosuka độ Drift động cơ V8 của Pop Race với sơn đỏ Metallic và bánh lốp cao su thật.',
    status: 'in_stock', releaseDate: '2025-08-30', isFeatured: 0, isNew: 1
  },
  {
    id: 14, sku: 'TH640012', carNumber: 'KH12',
    name: 'Toyota Yaris WRC #18 Katsuta Takamoto Rally Japan Acrylic Case',
    slug: 'toyota-yaris-wrc-18-katsuta-takamoto-rally-japan',
    categoryId: 5, brand: 'Kaido House', scale: '1:64', packagingType: 'box_only',
    priceBox: 500000, priceCard: 500000, discountPercent: 10,
    price: 450000, oldPrice: 500000, depositAmount: 0, quotaPercent: 80,
    editionNote: 'Kèm Đế Da & Hộp Mica Trưng Bày', preOrderDeadline: null,
    stock: 10, imageUrl: 'image/Toyota_Yaris_TrendsHobby.webp',
    description: 'Mô hình xe đua địa hình WRC Toyota Yaris kèm đế trưng bày và hộp chống bụi Acrylic sang trọng.',
    status: 'in_stock', releaseDate: '2025-09-01', isFeatured: 0, isNew: 1
  },
  {
    id: 15, sku: 'MGTS0019', carNumber: 'S019',
    name: 'Combo 2 Xe Porsche 911 GT3 R AO Racing Rexy #80 & Roxy #77 Twin Pack',
    slug: 'combo-2-xe-porsche-911-gt3-r-ao-racing-rexy-roxy',
    categoryId: 4, brand: 'MINI GT', scale: '1:64', packagingType: 'both',
    priceBox: 750000, priceCard: 870000, discountPercent: 5,
    price: 713000, oldPrice: 750000, depositAmount: 0, quotaPercent: 95,
    editionNote: 'Combo Rexy + Roxy Tiết Kiệm', preOrderDeadline: null,
    stock: 6, imageUrl: 'image/roxy-rexy-2.webp',
    description: 'Bộ đôi khủng long đường đua Rexy #80 (Xanh) và Roxy #77 (Hồng) đóng gói Combo 2 xe ưu đãi.',
    status: 'in_stock', releaseDate: '2025-10-01', isFeatured: 1, isNew: 1
  },
  {
    id: 16, sku: 'MGT00642', carNumber: '642',
    name: 'Red Bull RB18 #11 Sergio Perez & RB18 #1 Verstappen Pit Crew Box Set',
    slug: 'red-bull-rb18-verstappen-perez-pit-crew-box-set',
    categoryId: 4, brand: 'TSM-Model', scale: '1:64', packagingType: 'box_only',
    priceBox: 1150000, priceCard: 1150000, discountPercent: 0,
    price: 1150000, oldPrice: 1290000, depositAmount: 0, quotaPercent: 88,
    editionNote: 'Set 2 Xe F1 + Đội Kỹ Thuật Pit Stop', preOrderDeadline: null,
    stock: 7, imageUrl: 'image/f1-redbull-live.webp',
    description: 'Hộp sa bàn Pit Stop Red Bull Racing gồm 2 xe F1 RB18 và dàn nhân vật kỹ thuật viên thay lốp.',
    status: 'in_stock', releaseDate: '2025-06-15', isFeatured: 1, isNew: 0
  },
  {
    id: 17, sku: 'MGT01055-LW', carNumber: '1055C',
    name: 'LB★WORKS Lamborghini Huracán GT Gravity (Bản Vỉ Blister Card)',
    slug: 'lb-works-lamborghini-huracan-gt-gravity-blister-card',
    categoryId: 1, brand: 'MINI GT', scale: '1:64', packagingType: 'card_only',
    priceBox: 410000, priceCard: 410000, discountPercent: 0,
    price: 410000, oldPrice: 450000, depositAmount: 0, quotaPercent: 91,
    editionNote: 'Vỉ Nhựa Blister Card Art Nguyên Seal', preOrderDeadline: null,
    stock: 12, imageUrl: 'image/minig_lambo_lbwk.webp',
    description: 'Phiên bản đóng gói Vỉ nhựa cứng Blister Card cao cấp kèm ảnh bìa nghệ thuật Liberty Walk chống cấn góc 100%.',
    status: 'in_stock', releaseDate: '2025-08-01', isFeatured: 0, isNew: 1
  },
  {
    id: 18, sku: 'MGT00688', carNumber: '688',
    name: 'LB★WORKS Lamborghini Aventador Limited Edition Matte Black',
    slug: 'lb-works-lamborghini-aventador-limited-edition-matte-black',
    categoryId: 1, brand: 'MINI GT', scale: '1:64', packagingType: 'both',
    priceBox: 380000, priceCard: 440000, discountPercent: 0,
    price: 380000, oldPrice: 420000, depositAmount: 0, quotaPercent: 89,
    editionNote: 'Siêu Bò Aventador Widebody Đen Nhám', preOrderDeadline: null,
    stock: 10, imageUrl: 'image/Minigt_Lambo_LBWK.jpg',
    description: 'Siêu bò Lamborghini Aventador độ thân rộng LB★WORKS màu đen nhám kết hợp cánh gió GT cỡ lớn.',
    status: 'in_stock', releaseDate: '2025-04-12', isFeatured: 1, isNew: 0
  }
];

async function syncCanonicalData() {
  // 1. Đồng bộ 5 Danh mục chuẩn (Categories)
  for (const cat of CANONICAL_CATEGORIES) {
    const existing = await db.query('SELECT CategoryId FROM dbo.Categories WHERE CategoryId = @id', { id: cat.id });
    if (existing.recordset.length > 0) {
      await db.query(`
        UPDATE dbo.Categories
        SET Slug = @slug, Name = @name, Description = @desc, ImageUrl = @img, SortOrder = @sort
        WHERE CategoryId = @id
      `, cat);
    } else {
      await db.query(`
        SET IDENTITY_INSERT dbo.Categories ON;
        INSERT INTO dbo.Categories (CategoryId, Slug, Name, Description, ImageUrl, SortOrder)
        VALUES (@id, @slug, @name, @desc, @img, @sort);
        SET IDENTITY_INSERT dbo.Categories OFF;
      `, cat);
    }
  }
  console.log('[MIGRATION 002] ✔ Đồng bộ 5 danh mục chuẩn (Categories)');

  // 2. Xóa các dòng sản phẩm rác / bản sao thử nghiệm ngoài 18 mẫu chuẩn (nếu có)
  await db.query(`
    DELETE FROM dbo.OrderItems WHERE ProductId > 18;
    DELETE FROM dbo.Products WHERE ProductId > 18;
  `);

  // Để tránh xung đột UNIQUE(Sku) khi cập nhật theo ProductId 1..18, tạm đổi Sku của các dòng lệch
  await db.query(`
    UPDATE dbo.Products
    SET Sku = CONCAT('TMP_', ProductId, '_', LEFT(Sku, 18))
    WHERE ProductId <= 18;
  `);

  // 3. Đồng bộ chính xác 18 sản phẩm theo đúng ProductId 1..18
  for (const p of CANONICAL_PRODUCTS) {
    const check = await db.query('SELECT ProductId FROM dbo.Products WHERE ProductId = @id', { id: p.id });
    if (check.recordset.length > 0) {
      await db.query(`
        UPDATE dbo.Products
        SET Sku = @sku, CarNumber = @carNumber, Name = @name, Slug = @slug,
            CategoryId = @categoryId, Brand = @brand, Scale = @scale,
            PackagingType = @packagingType, PriceBox = @priceBox, PriceCard = @priceCard,
            DiscountPercent = @discountPercent, Price = @price, OldPrice = @oldPrice,
            DepositAmount = @depositAmount, QuotaPercent = @quotaPercent,
            EditionNote = @editionNote, PreOrderDeadline = @preOrderDeadline,
            Stock = @stock, ImageUrl = @imageUrl, Description = @description,
            Status = @status, ReleaseDate = @releaseDate,
            IsFeatured = @isFeatured, IsNew = @isNew, IsActive = 1,
            UpdatedAt = SYSDATETIME()
        WHERE ProductId = @id
      `, p);
    } else {
      await db.query(`
        SET IDENTITY_INSERT dbo.Products ON;
        INSERT INTO dbo.Products (
          ProductId, Sku, CarNumber, Name, Slug, CategoryId, Brand, Scale,
          PackagingType, PriceBox, PriceCard, DiscountPercent, Price, OldPrice,
          DepositAmount, QuotaPercent, EditionNote, PreOrderDeadline, Stock,
          ImageUrl, Description, Status, ReleaseDate, IsFeatured, IsNew, IsActive
        ) VALUES (
          @id, @sku, @carNumber, @name, @slug, @categoryId, @brand, @scale,
          @packagingType, @priceBox, @priceCard, @discountPercent, @price, @oldPrice,
          @depositAmount, @quotaPercent, @editionNote, @preOrderDeadline, @stock,
          @imageUrl, @description, @status, @releaseDate, @isFeatured, @isNew, 1
        );
        SET IDENTITY_INSERT dbo.Products OFF;
      `, p);
    }
  }
  console.log('[MIGRATION 002] ✔ Đồng bộ chuẩn 18 mô hình xe (ID 1..18, Giá Box/Card, % Giảm, Tiếng Việt Unicode)');

  // 4. Đồng bộ tên sản phẩm trong OrderItems hiện có cho khớp tiếng Việt chuẩn
  await db.query(`
    UPDATE oi
    SET oi.ProductName = p.Name
    FROM dbo.OrderItems oi
    INNER JOIN dbo.Products p ON oi.ProductId = p.ProductId;
  `);

  // 5. Dọn tài khoản QA test rác và đồng bộ tài khoản Admin & Hội viên mẫu
  await db.query(`
    UPDATE dbo.Orders SET UserId = NULL WHERE UserId IN (SELECT UserId FROM dbo.Users WHERE Email LIKE 'qa.collector.%@gmail.com');
    DELETE FROM dbo.Users WHERE Email LIKE 'qa.collector.%@gmail.com';
  `);

  const adminHash = await bcrypt.hash('Admin@2026', 10);
  const demoHash = await bcrypt.hash('123456', 10);

  const canonicalUsers = [
    {
      fullName: 'Đỗ Quốc Thịnh (Admin)',
      email: 'admin@minigt.com',
      passwordHash: adminHash,
      phone: '0988164164',
      address: '38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai',
      role: 'admin'
    },
    {
      fullName: 'Đỗ Quốc Thịnh',
      email: 'quocthinh.admin@minigt.vn',
      passwordHash: adminHash,
      phone: '0988164164',
      address: '38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai',
      role: 'admin'
    },
    {
      fullName: 'Nguyễn Đình Nam',
      email: 'dinhnam.admin@minigt.vn',
      passwordHash: adminHash,
      phone: '0912345678',
      address: 'Cơ sở 1 ĐH Lạc Hồng, P. Bửu Long, TP. Biên Hòa, Đồng Nai',
      role: 'admin'
    },
    {
      fullName: 'Đỗ Quốc Thịnh (Collector)',
      email: 'collector@gmail.com',
      passwordHash: demoHash,
      phone: '0988164164',
      address: '38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai',
      role: 'customer'
    },
    {
      fullName: 'Đỗ Quốc Thịnh',
      email: 'quocthinh@lhu.edu.vn',
      passwordHash: demoHash,
      phone: '0988164164',
      address: '38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai',
      role: 'admin'
    },
    {
      fullName: 'Nguyễn Đình Nam',
      email: 'dinhnam@lhu.edu.vn',
      passwordHash: demoHash,
      phone: '0912345678',
      address: 'P. Bửu Long, TP. Biên Hòa, Đồng Nai',
      role: 'admin'
    }
  ];

  for (const u of canonicalUsers) {
    const existingU = await db.query('SELECT UserId FROM dbo.Users WHERE LOWER(Email) = LOWER(@email)', { email: u.email });
    if (existingU.recordset.length > 0) {
      await db.query(`
        UPDATE dbo.Users
        SET FullName = @fullName, PasswordHash = @passwordHash, Phone = @phone,
            Address = @address, Role = @role, IsActive = 1
        WHERE LOWER(Email) = LOWER(@email)
      `, u);
    } else {
      await db.query(`
        INSERT INTO dbo.Users (FullName, Email, PasswordHash, Phone, Address, AuthProvider, Role, IsActive)
        VALUES (@fullName, @email, @passwordHash, @phone, @address, 'local', @role, 1)
      `, u);
    }
  }
  console.log('[MIGRATION 002] ✔ Đồng bộ tài khoản Quản trị viên & Hội viên chuẩn');
}

module.exports = { syncCanonicalData, CANONICAL_CATEGORIES, CANONICAL_PRODUCTS };
