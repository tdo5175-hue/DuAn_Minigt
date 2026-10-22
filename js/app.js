/**
 * MINI GT STORE - CLIENT APPLICATION JAVASCRIPT
 * Xử lý: Danh mục, Lọc sản phẩm, Pre-order countdown, Giỏ hàng, Đặt cọc,
 * Đăng nhập Gmail/Google, Tra cứu đơn hàng, Quick view, VietQR
 */

// =====================================================================
// 1. DỮ LIỆU MẪU ĐẦY ĐỦ (FALLBACK DATA KHI MỞ TRỰC TIẾP FILE:// HOẶC OFFLINE)
// =====================================================================
const FALLBACK_PRODUCTS = (typeof window !== 'undefined' && window.api && typeof window.api.getSharedProducts === 'function')
  ? window.api.getSharedProducts()
  : [
  {
    ProductId: 1, id: 1, Sku: 'MGTS0026', CarNumber: 'S026',
    Name: 'Lamborghini Huracán Sterrato All-Terrain Set (Box 4 xe)',
    Slug: 'lamborghini-huracan-sterrato-box-4-xe',
    CategoryId: 4, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'MINI GT', Scale: '1:64',
    PriceBox: 1850000, PriceCard: 1850000, Price: 1850000, OldPrice: 2100000,
    DiscountPercent: 0, PackagingType: 'box_only',
    DepositAmount: 500000, QuotaPercent: 92, EditionNote: 'Box Set Đặc Biệt (Giới hạn 3000 bộ)',
    PreOrderDeadline: '2026-10-30', Stock: 15,
    ImageUrl: 'image/lambo-sterrato-set.png',
    Description: 'Bộ 4 xe Lamborghini Huracán Sterrato địa hình kèm hộp trưng bày Collector Box cao cấp chính hãng TSM-Model.',
    Status: 'pre_order', IsFeatured: 1, IsNew: 1, soldCount: undefined
  },
  {
    ProductId: 2, id: 2, Sku: 'MGT01413', CarNumber: '1413',
    Name: 'Aston Martin AMR24 #18 Lance Stroll 2024 F1 Las Vegas GP',
    Slug: 'aston-martin-amr24-18-lance-stroll-las-vegas-gp',
    CategoryId: 2, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'MINI GT', Scale: '1:64',
    PriceBox: 420000, PriceCard: 480000, Price: 378000, OldPrice: 420000,
    DiscountPercent: 10, PackagingType: 'both',
    DepositAmount: 150000, QuotaPercent: 88, EditionNote: 'Kèm Figure Tay Đua F1 Las Vegas',
    PreOrderDeadline: '2026-10-30', Stock: 25,
    ImageUrl: 'image/aston-amr24-stroll.png',
    Description: 'Mô hình xe đua F1 Aston Martin AMR24 #18 chặng Las Vegas GP 2024, sơn xanh Racing Green ánh kim tuyệt đẹp.',
    Status: 'pre_order', IsFeatured: 1, IsNew: 1, soldCount: undefined
  },
  {
    ProductId: 3, id: 3, Sku: 'MGT01396', CarNumber: '1396',
    Name: 'Aston Martin AMR24 #14 Fernando Alonso 2024 F1 Las Vegas GP',
    Slug: 'aston-martin-amr24-14-fernando-alonso-las-vegas-gp',
    CategoryId: 2, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'MINI GT', Scale: '1:64',
    PriceBox: 420000, PriceCard: 480000, Price: 420000, OldPrice: null,
    DiscountPercent: 0, PackagingType: 'both',
    DepositAmount: 150000, QuotaPercent: 95, EditionNote: 'Bản Đua Đêm Las Vegas GP',
    PreOrderDeadline: '2026-10-30', Stock: 18,
    ImageUrl: 'image/aston-amr24-alonso.png',
    Description: 'Phiên bản xe đua F1 của huyền thoại Fernando Alonso #14 tại chặng đua đêm Las Vegas 2024.',
    Status: 'pre_order', IsFeatured: 1, IsNew: 1, soldCount: undefined
  },
  {
    ProductId: 4, id: 4, Sku: 'MGT00550', CarNumber: '550',
    Name: 'Oracle Red Bull Racing RB18 #1 Max Verstappen 2022 Monaco GP',
    Slug: 'oracle-red-bull-racing-rb18-1-max-verstappen-monaco-gp',
    CategoryId: 2, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'MINI GT', Scale: '1:64',
    PriceBox: 420000, PriceCard: 480000, Price: 378000, OldPrice: 420000,
    DiscountPercent: 10, PackagingType: 'both',
    DepositAmount: 0, QuotaPercent: 100, EditionNote: 'World Champion Edition • Box & Card',
    PreOrderDeadline: null, Stock: 14,
    ImageUrl: 'image/f1_redbull.jpg',
    Description: 'Chiếc xe vô địch thế giới F1 Red Bull RB18 #1 của Max Verstappen với chi tiết khí động học tỉ lệ 1:64 sắc nét.',
    Status: 'in_stock', IsFeatured: 1, IsNew: 1, soldCount: undefined
  },
  {
    ProductId: 5, id: 5, Sku: 'MGT01055', CarNumber: '1055',
    Name: 'LB★WORKS Lamborghini Huracán GT Gravity Racing #5',
    Slug: 'lb-works-lamborghini-huracan-gt-gravity-racing-5',
    CategoryId: 1, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'MINI GT', Scale: '1:64',
    PriceBox: 350000, PriceCard: 410000, Price: 350000, OldPrice: null,
    DiscountPercent: 0, PackagingType: 'both',
    DepositAmount: 0, QuotaPercent: 82, EditionNote: 'Liberty Walk Widebody #5',
    PreOrderDeadline: null, Stock: 22,
    ImageUrl: 'image/mgt01055.webp',
    Description: 'Siêu phẩm độ thân rộng Liberty Walk Lamborghini Huracán GT màu tím xanh Gravity Racing cực kỳ nổi bật.',
    Status: 'in_stock', IsFeatured: 1, IsNew: 1, soldCount: undefined
  },
  {
    ProductId: 6, id: 6, Sku: 'MGT01143', CarNumber: '1143',
    Name: 'Porsche 911 GT3 R #77 AO Racing "Skeleton" 2024 IMSA Petit Le Mans',
    Slug: 'porsche-911-gt3-r-77-ao-racing-skeleton-2024-imsa',
    CategoryId: 3, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'MINI GT', Scale: '1:64',
    PriceBox: 390000, PriceCard: 470000, Price: 390000, OldPrice: null,
    DiscountPercent: 0, PackagingType: 'both',
    DepositAmount: 150000, QuotaPercent: 89, EditionNote: 'Bản Giới Hạn Halloween Skeleton #77',
    PreOrderDeadline: '2026-10-30', Stock: 20,
    ImageUrl: 'image/ske.webp',
    Description: 'Phiên bản giới hạn Halloween Petit Le Mans với đồ họa bộ xương khủng long Rexy trên nền đen mờ.',
    Status: 'pre_order', IsFeatured: 1, IsNew: 1, soldCount: undefined
  },
  {
    ProductId: 7, id: 7, Sku: 'MGT01093', CarNumber: '1093',
    Name: 'Porsche 911 GT3 R #77 AO Racing "Roxy" 2024 IMSA Road America',
    Slug: 'porsche-911-gt3-r-77-ao-racing-roxy-2024-imsa',
    CategoryId: 3, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'MINI GT', Scale: '1:64',
    PriceBox: 360000, PriceCard: 420000, Price: 342000, OldPrice: 360000,
    DiscountPercent: 5, PackagingType: 'both',
    DepositAmount: 0, QuotaPercent: 94, EditionNote: 'Khủng Long Hồng Roxy #77',
    PreOrderDeadline: null, Stock: 12,
    ImageUrl: 'image/Roxy.webp',
    Description: 'Mẫu Porsche 911 GT3 R khủng long hồng Roxy #77 siêu hot của đội đua AO Racing tại giải IMSA.',
    Status: 'in_stock', IsFeatured: 1, IsNew: 1, soldCount: undefined
  },
  {
    ProductId: 8, id: 8, Sku: 'MGT00782', CarNumber: '782',
    Name: 'Porsche 911 GT3 R #80 AO Racing "Rexy" 2023 IMSA Sebring 12h',
    Slug: 'porsche-911-gt3-r-80-ao-racing-rexy-2024-imsa',
    CategoryId: 3, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'MINI GT', Scale: '1:64',
    PriceBox: 380000, PriceCard: 450000, Price: 380000, OldPrice: 420000,
    DiscountPercent: 0, PackagingType: 'both',
    DepositAmount: 0, QuotaPercent: 96, EditionNote: 'Khủng Long Xanh Rexy #80 Best-Seller',
    PreOrderDeadline: null, Stock: 8,
    ImageUrl: 'image/rexy.jpg',
    Description: 'Huyền thoại khủng long xanh Rexy #80 AO Racing được săn đón nhất trong giới sưu tầm MINI GT 1:64.',
    Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: undefined
  },
  {
    ProductId: 9, id: 9, Sku: 'MGT01129', CarNumber: '1129',
    Name: 'Lamborghini Huracán GT3 EVO2 #45 DEX Imaging 2024 IMSA Daytona 24h',
    Slug: 'lamborghini-huracan-gt3-evo2-45-dex-imaging-daytona-24h',
    CategoryId: 3, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'MINI GT', Scale: '1:64',
    PriceBox: 330000, PriceCard: 390000, Price: 330000, OldPrice: null,
    DiscountPercent: 0, PackagingType: 'both',
    DepositAmount: 0, QuotaPercent: 75, EditionNote: 'Đua Sức Bền Daytona 24 Hours',
    PreOrderDeadline: null, Stock: 19,
    ImageUrl: 'image/Minigt_Lambo_GT3.jpg',
    Description: 'Mẫu xe đua Lamborghini Huracán GT3 EVO2 tham chiến giải đua sức bền 24 Giờ Daytona 2024.',
    Status: 'in_stock', IsFeatured: 0, IsNew: 1, soldCount: undefined
  },
  {
    ProductId: 10, id: 10, Sku: 'MGT00465', CarNumber: '465',
    Name: 'LB-Super Silhouette Nissan S15 Silvia Presentation',
    Slug: 'lb-super-silhouette-nissan-s15-silvia-presentation',
    CategoryId: 1, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'MINI GT', Scale: '1:64',
    PriceBox: 320000, PriceCard: 370000, Price: 320000, OldPrice: 350000,
    DiscountPercent: 0, PackagingType: 'both',
    DepositAmount: 0, QuotaPercent: 90, EditionNote: 'Liberty Walk Group 5 Silhouette',
    PreOrderDeadline: null, Stock: 16,
    ImageUrl: 'image/Minigt_s15chop_lbwk.jpg',
    Description: 'Biểu tượng JDM Nissan Silvia S15 độ bodykit Super Silhouette hầm hố từ nhà độ Liberty Walk Nhật Bản.',
    Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: undefined
  },
  {
    ProductId: 11, id: 11, Sku: 'MGT00618', CarNumber: '618',
    Name: 'LB-Super Silhouette Nissan S15 Silvia #23 2022 Goodwood Festival of Speed',
    Slug: 'lb-super-silhouette-nissan-s15-silvia-23-goodwood-fos',
    CategoryId: 1, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'MINI GT', Scale: '1:64',
    PriceBox: 340000, PriceCard: 400000, Price: 340000, OldPrice: 380000,
    DiscountPercent: 0, PackagingType: 'both',
    DepositAmount: 0, QuotaPercent: 95, EditionNote: 'Kỷ Niệm Lễ Hội Tốc Độ Goodwood #23',
    PreOrderDeadline: null, Stock: 9,
    ImageUrl: 'image/Minigt_S15_LBWK.jpg',
    Description: 'Phiên bản kỷ niệm màn trình diễn drift của chiếc S15 #23 tại lễ hội tốc độ Goodwood Vương Quốc Anh.',
    Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: undefined
  },
  {
    ProductId: 12, id: 12, Sku: 'PR640325', CarNumber: '325',
    Name: 'Pop Race Top Secret GT300 Toyota Supra (A80) Silver Chrome',
    Slug: 'pop-race-toyota-supra-top-secret-gt300-silver-chrome',
    CategoryId: 5, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'Pop Race', Scale: '1:64',
    PriceBox: 480000, PriceCard: 480000, Price: 480000, OldPrice: 550000,
    DiscountPercent: 0, PackagingType: 'box_only',
    DepositAmount: 0, QuotaPercent: 92, EditionNote: 'Secret Chase 1/24 • Mở Nắp Ca-pô Động Cơ 2JZ',
    PreOrderDeadline: null, Stock: 11,
    ImageUrl: 'image/Poprace_Supra_Secret.webp',
    Description: 'Phiên bản mạ Chrome bạc đặc biệt của Top Secret Supra GT300, mở được nắp ca-pô chiêm ngưỡng khối động cơ 2JZ.',
    Status: 'in_stock', IsFeatured: 1, IsNew: 1, soldCount: undefined
  },
  {
    ProductId: 13, id: 13, Sku: 'PR640118', CarNumber: '118',
    Name: 'Pop Race Nissan Skyline GT-R V8 Drift (Hakosuka) Red Metallic',
    Slug: 'pop-race-nissan-skyline-gt-r-v8-drift-hakosuka-red',
    CategoryId: 5, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'Pop Race', Scale: '1:64',
    PriceBox: 450000, PriceCard: 450000, Price: 450000, OldPrice: 490000,
    DiscountPercent: 0, PackagingType: 'box_only',
    DepositAmount: 0, QuotaPercent: 86, EditionNote: 'Tháo Rời Nắp Máy Động Cơ V8',
    PreOrderDeadline: null, Stock: 14,
    ImageUrl: 'image/Poprace_Skyline.webp',
    Description: 'Huyền thoại Hakosuka độ Drift động cơ V8 của Pop Race với sơn đỏ Metallic và bánh lốp cao su thật.',
    Status: 'in_stock', IsFeatured: 0, IsNew: 1, soldCount: undefined
  },
  {
    ProductId: 14, id: 14, Sku: 'TH640012', CarNumber: 'KH12',
    Name: 'Toyota Yaris WRC #18 Katsuta Takamoto Rally Japan Acrylic Case',
    Slug: 'toyota-yaris-wrc-18-katsuta-takamoto-rally-japan',
    CategoryId: 5, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'Kaido House', Scale: '1:64',
    PriceBox: 500000, PriceCard: 500000, Price: 450000, OldPrice: 500000,
    DiscountPercent: 10, PackagingType: 'box_only',
    DepositAmount: 0, QuotaPercent: 80, EditionNote: 'Kèm Đế Da & Hộp Mica Trưng Bày',
    PreOrderDeadline: null, Stock: 10,
    ImageUrl: 'image/Toyota_Yaris_TrendsHobby.webp',
    Description: 'Mô hình xe đua địa hình WRC Toyota Yaris kèm đế trưng bày và hộp chống bụi Acrylic sang trọng.',
    Status: 'in_stock', IsFeatured: 0, IsNew: 1, soldCount: undefined
  },
  {
    ProductId: 15, id: 15, Sku: 'MGTS0019', CarNumber: 'S019',
    Name: 'Combo 2 Xe Porsche 911 GT3 R AO Racing Rexy #80 & Roxy #77 Twin Pack',
    Slug: 'combo-2-xe-porsche-911-gt3-r-ao-racing-rexy-roxy',
    CategoryId: 4, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'MINI GT', Scale: '1:64',
    PriceBox: 750000, PriceCard: 870000, Price: 713000, OldPrice: 750000,
    DiscountPercent: 5, PackagingType: 'both',
    DepositAmount: 0, QuotaPercent: 95, EditionNote: 'Combo Rexy + Roxy Tiết Kiệm',
    PreOrderDeadline: null, Stock: 6,
    ImageUrl: 'image/roxy-rexy-2.webp',
    Description: 'Bộ đôi khủng long đường đua Rexy #80 (Xanh) và Roxy #77 (Hồng) đóng gói Combo 2 xe ưu đãi.',
    Status: 'in_stock', IsFeatured: 1, IsNew: 1, soldCount: undefined
  },
  {
    ProductId: 16, id: 16, Sku: 'MGT00642', CarNumber: '642',
    Name: 'Red Bull RB18 #11 Sergio Perez & RB18 #1 Verstappen Pit Crew Box Set',
    Slug: 'red-bull-rb18-verstappen-perez-pit-crew-box-set',
    CategoryId: 4, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'TSM-Model', Scale: '1:64',
    PriceBox: 1150000, PriceCard: 1150000, Price: 1150000, OldPrice: 1290000,
    DiscountPercent: 0, PackagingType: 'box_only',
    DepositAmount: 0, QuotaPercent: 88, EditionNote: 'Set 2 Xe F1 + Đội Kỹ Thuật Pit Stop',
    PreOrderDeadline: null, Stock: 7,
    ImageUrl: 'image/f1-redbull-live.webp',
    Description: 'Hộp sa bàn Pit Stop Red Bull Racing gồm 2 xe F1 RB18 và dàn nhân vật kỹ thuật viên thay lốp.',
    Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: undefined
  },
  {
    ProductId: 17, id: 17, Sku: 'MGT01055-LW', CarNumber: '1055C',
    Name: 'LB★WORKS Lamborghini Huracán GT Gravity (Bản Vỉ Blister Card)',
    Slug: 'lb-works-lamborghini-huracan-gt-gravity-blister-card',
    CategoryId: 1, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'MINI GT', Scale: '1:64',
    PriceBox: 410000, PriceCard: 410000, Price: 410000, OldPrice: 450000,
    DiscountPercent: 0, PackagingType: 'card_only',
    DepositAmount: 0, QuotaPercent: 91, EditionNote: 'Vỉ Nhựa Blister Card Art Nguyên Seal',
    PreOrderDeadline: null, Stock: 12,
    ImageUrl: 'image/minig_lambo_lbwk.webp',
    Description: 'Phiên bản đóng gói Vỉ nhựa cứng Blister Card cao cấp kèm ảnh bìa nghệ thuật Liberty Walk chống cấn góc 100%.',
    Status: 'in_stock', IsFeatured: 0, IsNew: 1, soldCount: undefined
  },
  {
    ProductId: 18, id: 18, Sku: 'MGT00688', CarNumber: '688',
    Name: 'LB★WORKS Lamborghini Aventador Limited Edition Matte Black',
    Slug: 'lb-works-lamborghini-aventador-limited-edition-matte-black',
    CategoryId: 1, CategorySlug: 'undefined', CategoryName: 'undefined',
    Brand: 'MINI GT', Scale: '1:64',
    PriceBox: 380000, PriceCard: 440000, Price: 380000, OldPrice: 420000,
    DiscountPercent: 0, PackagingType: 'both',
    DepositAmount: 0, QuotaPercent: 89, EditionNote: 'Siêu Bò Aventador Widebody Đen Nhám',
    PreOrderDeadline: null, Stock: 10,
    ImageUrl: 'image/Minigt_Lambo_LBWK.jpg',
    Description: 'Siêu bò Lamborghini Aventador độ thân rộng LB★WORKS màu đen nhám kết hợp cánh gió GT cỡ lớn.',
    Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: undefined
  }
];

// =====================================================================
// 2. BIẾN TRẠNG THÁI ỨNG DỤNG (STATE)
// =====================================================================
let allProducts = [];
let currentFilter = 'all';
let currentSort = 'default';
let currentBrandFilter = 'all';

// Cấu hình động cửa hàng (Đồng bộ trực tiếp từ SQL Server Settings table)
let storeSettings = {
  store_name: "MINI GT STORE BIÊN HÒA",
  store_hotline: "0981 400 400",
  store_email: "quocthinh.admin@minigt.vn",
  store_address: "38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai",
  shipping_fee: 11000,
  free_shipping_threshold: 1000000,
  deposit_rate: 0.3,
  low_stock_threshold: 5,
  preorder_deadline: "Tháng 11/2026",
  bank_id: "MB",
  bank_name: "Ngân hàng Quân Đội (MB Bank)",
  bank_account_no: "87654321082007",
  bank_account_name: "DO QUOC THINH",
  announcement: "🔥 CHÀO MỪNG ĐẾN VỚI SĂN XE BIÊN HÒA - ĐẠI LÝ CHÍNH HÃNG MINI GT VIỆT NAM!"
};

async function loadStoreSettings() {
  try {
    const res = await api.get('/api/settings');
    if (res && res.success && res.data) {
      storeSettings = Object.assign(storeSettings, res.data);
      applyStoreSettingsUI();
    }
  } catch (err) {
    console.warn('Sử dụng cấu hình mặc định:', err.message);
  }
}

function applyStoreSettingsUI() {
  if (!storeSettings) return;

  // 1. Cập nhật thanh thông báo chạy đầu trang (Announcement Ticker)
  const ticker = document.querySelector('.announcement-ticker span:nth-child(2)');
  if (ticker && storeSettings.announcement) {
    ticker.innerHTML = `${escapeHtml(storeSettings.announcement)} | <i class="fa-regular fa-clock" style="font-size:11px; margin-left:4px;"></i> Hạn chốt cọc: <strong>${escapeHtml(storeSettings.preorder_deadline || 'Tháng 11/2026')}</strong>`;
  }

  // 2. Cập nhật tên cửa hàng ở các vị trí hiển thị
  if (storeSettings.store_name) {
    document.querySelectorAll('.store-name-dynamic, .store-brand-text').forEach(el => {
      el.textContent = storeSettings.store_name;
    });
  }

  // 3. Cập nhật Hotline / Số điện thoại liên hệ
  if (storeSettings.store_hotline) {
    const cleanPhone = String(storeSettings.store_hotline).replace(/\D/g, '');
    document.querySelectorAll('a.hotline-link, a[href^="tel:"]').forEach(a => {
      a.href = `tel:${cleanPhone}`;
      const strong = a.querySelector('strong');
      if (strong) strong.textContent = storeSettings.store_hotline;
      else if (!a.querySelector('*')) a.textContent = storeSettings.store_hotline;
    });
  }

  // 4. Cập nhật Email liên hệ
  if (storeSettings.store_email) {
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      a.href = `mailto:${storeSettings.store_email}`;
      const strong = a.querySelector('strong');
      if (strong) strong.textContent = storeSettings.store_email;
      else if (!a.querySelector('*')) a.textContent = storeSettings.store_email;
    });
  }

  // 5. Cập nhật địa chỉ kho hàng
  if (storeSettings.store_address) {
    document.querySelectorAll('.store-address-dynamic').forEach(el => {
      el.textContent = storeSettings.store_address;
    });
  }

  // 6. Cập nhật hạn chốt cọc đợt này & đồng hồ đếm ngược
  if (storeSettings.preorder_deadline) {
    const stripSub = document.querySelector('#preorder-strip .preorder-strip-text p');
    if (stripSub) {
      stripSub.innerHTML = `<span data-i18n="countdown_sub">Đợt mở đặt trước xe mô hình giới hạn:</span> <strong>Dự kiến giao ${escapeHtml(storeSettings.preorder_deadline)}</strong>`;
    }
    if (typeof setupCountdown === 'function') {
      setupCountdown();
    }
  }
}

// Khởi tạo wishlist (mặc định rỗng, người dùng bấm tim mới có xe)
let rawWishlist = localStorage.getItem('minigt_wishlist');
if (rawWishlist === '[1, 2, 10, 11]' || rawWishlist === '[1,2,10,11]') {
  localStorage.setItem('minigt_wishlist', '[]');
  rawWishlist = '[]';
}
let wishlist = [];
try {
  wishlist = JSON.parse(rawWishlist || '[]');
  if (!Array.isArray(wishlist)) wishlist = [];
} catch (_) {
  wishlist = [];
}

function isInWishlist(id) {
  return wishlist.includes(Number(id));
}

function updateWishlistBadge() {
  const el = document.getElementById('wishlistBadgeCount');
  if (el) el.textContent = wishlist.length;
}

function toggleWishlist(id, e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const numId = Number(id);
  const idx = wishlist.indexOf(numId);
  const p = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(x => x.ProductId === numId || x.id === numId);
  const pName = p ? (p.Name || p.name) : 'Mô hình xe';

  if (idx > -1) {
    wishlist.splice(idx, 1);
    showToast(`Đã xóa khỏi danh sách yêu thích: ${pName}`, 'info');
  } else {
    wishlist.push(numId);
    showToast(`Đã lưu vào danh sách yêu thích: ${pName}`, 'success');
  }
  localStorage.setItem('minigt_wishlist', JSON.stringify(wishlist));
  if (currentUser) {
    const uKey = currentUser.userId || currentUser.id || currentUser.email;
    if (uKey) {
      try { localStorage.setItem('minigt_wishlist_user_' + uKey, JSON.stringify(wishlist)); } catch (_) {}
    }
  }
  updateWishlistBadge();

  // Cập nhật mượt mà trực tiếp tại nút tim trên thẻ, không re-render toàn bộ grid gây giật
  const isWish = (idx === -1);
  const btns = document.querySelectorAll(`.product-card[data-id="${numId}"] .card-wishlist-btn`);
  btns.forEach(btn => {
    btn.classList.toggle('active', isWish);
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = isWish ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    }
    btn.classList.remove('heart-pop');
    void btn.offsetWidth;
    btn.classList.add('heart-pop');
  });

  const wishModal = document.getElementById('wishlistModal');
  if (wishModal && wishModal.classList.contains('active')) {
    renderWishlistModal();
  }
  updateQuickViewWishlistBtn(numId);
}

function updateQuickViewWishlistBtn(productId) {
  const btn = document.getElementById('quickViewWishlistBtn');
  if (!btn) return;
  const isWish = isInWishlist(productId);
  btn.innerHTML = `<i class="fa-${isWish ? 'solid' : 'regular'} fa-heart" style="color:${isWish ? '#dc2626' : 'inherit'};"></i>`;
  btn.title = isWish ? 'Đã lưu yêu thích (Bấm để bỏ)' : 'Lưu vào danh sách yêu thích';
}

function openWishlistModal() {
  const modal = document.getElementById('wishlistModal');
  if (!modal) return;
  renderWishlistModal();
  modal.classList.add('active');
}

function renderWishlistModal() {
  const container = document.getElementById('wishlistModalContent');
  if (!container) return;

  const prods = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS);
  const items = wishlist.map(id => prods.find(p => p.ProductId === id || p.id === id)).filter(Boolean);

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:2.5rem 1rem;">
        <div style="font-size:40px; margin-bottom:8px; color:#cbd5e1;"><i class="fa-regular fa-heart"></i></div>
        <h4 style="font-size:15px; color:var(--color-navy); margin-bottom:6px;">Danh Sách Yêu Thích Đang Trống</h4>
        <p style="font-size:12.5px; color:#64748b; margin-bottom:14px;">
          Hãy duyệt catalogue và bấm vào biểu tượng trái tim để lưu lại mẫu xe mô hình bạn yêu thích!
        </p>
        <button class="btn btn-primary btn-sm" onclick="closeModal('wishlistModal'); scrollToSection('catalog');">
          <i class="fa-solid fa-car-side" style="margin-right:5px;"></i> Khám Phá Mô Hình Ngay
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(p => {
    const isPreOrder = (p.Status || p.status) === 'pre_order';
    const isSoldOut = (p.Status || p.status) === 'sold_out';
    const pId = p.ProductId || p.id;
    const pName = p.Name || p.name;
    const pImg = p.ImageUrl || p.image || 'image/hero-banner.jpg';
    const pPrice = p.Price || p.price;
    const pSku = p.Sku || p.sku;

    return `
      <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #f1f5f9;">
        <img src="${pImg}" alt="${escapeHtml(pName)}" style="width:60px; height:60px; object-fit:contain; border-radius:8px; background:#f8fafc; border:1px solid #e2e8f0; padding:2px; cursor:pointer;" onclick="closeModal('wishlistModal'); openQuickView(${pId});">
        <div style="flex:1;">
          <div style="font-weight:700; font-size:13px; color:var(--color-navy); line-height:1.3; cursor:pointer;" onclick="closeModal('wishlistModal'); openQuickView(${pId});">${escapeHtml(pName)}</div>
          <div style="display:flex; align-items:center; gap:6px; margin-top:3px;">
            <span style="font-size:10px; background:#f1f5f9; color:#475569; padding:1px 5px; border-radius:3px; font-weight:700;">#${escapeHtml(pSku)}</span>
            <strong style="color:var(--color-primary); font-size:13px;">${formatVND(pPrice)}</strong>
            ${isPreOrder ? '<span class="badge badge-preorder" style="font-size:9.5px; padding:1px 6px;">Pre-Order</span>' : (isSoldOut ? '<span class="badge badge-soldout" style="font-size:9.5px; padding:1px 6px;">Hết hàng</span>' : '<span class="badge badge-instock" style="font-size:9.5px; padding:1px 6px;">Sẵn hàng</span>')}
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" class="btn btn-sm btn-primary" ${isSoldOut ? 'disabled' : ''} style="font-size:11.5px; padding:4px 10px;" onclick="addToCart(${pId}, 1); closeModal('wishlistModal'); openCartDrawer();">
            <i class="fa-solid fa-cart-shopping" style="margin-right:4px;"></i> ${isPreOrder ? 'Đặt cọc' : 'Mua ngay'}
          </button>
          <button type="button" class="btn btn-sm btn-outline" style="color:#dc2626; border-color:#fca5a5; font-size:11.5px; padding:4px 8px;" onclick="toggleWishlist(${pId}, event); renderWishlistModal();" title="Xóa khỏi yêu thích">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function clearWishlist() {
  if (!wishlist.length) return;
  if (!confirm('Bạn có muốn xóa toàn bộ danh sách xe yêu thích không?')) return;
  wishlist = [];
  localStorage.setItem('minigt_wishlist', '[]');
  if (currentUser) {
    const uKey = currentUser.userId || currentUser.id || currentUser.email;
    if (uKey) {
      try { localStorage.setItem('minigt_wishlist_user_' + uKey, '[]'); } catch (_) {}
    }
  }
  updateWishlistBadge();
  renderProductsGrid();
  renderWishlistModal();
  showToast('Đã xóa tất cả mẫu xe khỏi danh sách yêu thích', 'info');
}

// Khởi tạo giỏ hàng người dùng (mặc định rỗng, tải từ bộ nhớ phiên hiện tại)
let savedCart = localStorage.getItem('minigt_cart');
let cart = [];
try {
  if (savedCart) {
    const parsed = JSON.parse(savedCart);
    if (Array.isArray(parsed)) cart = parsed;
  }
} catch (_) {
  cart = [];
}

// Tự động chuẩn hóa ảnh và làm sạch cờ Pre-Order nếu cache trình duyệt còn lưu dữ liệu cũ
if (Array.isArray(cart)) {
  cart.forEach(item => {
    if (!item.imageUrl || item.imageUrl.includes('amr24.webp')) item.imageUrl = 'image/aston-amr24-alonso.png';
    else if (item.imageUrl.includes('f1.webp')) item.imageUrl = 'image/aston-amr24-stroll.png';
    else if (item.imageUrl.includes('huracan.webp')) item.imageUrl = 'image/lambo-sterrato-set.png';
    else if (item.imageUrl.includes('lambo.webp')) item.imageUrl = 'image/Minigt_Lambo_GT3.jpg';

    // Rà soát lại với FALLBACK_PRODUCTS: nếu không phải xe pre_order thì reset isPreOrder = false, depositAmount = 0
    const matchedP = FALLBACK_PRODUCTS.find(p => (p.ProductId || p.id) == item.productId);
    if (matchedP && String(matchedP.Status || matchedP.status || '').toLowerCase() !== 'pre_order') {
      item.isPreOrder = false;
      item.depositAmount = 0;
    }
  });
}
let currentUser = JSON.parse(localStorage.getItem('minigt_user')) || null;
let currentToken = localStorage.getItem('minigt_token') || null;

// =====================================================================
// 3. TIỆN ÍCH ĐỊNH DẠNG (FORMATTERS)
// =====================================================================
function formatVND(amount) {
  if (amount == null) return '';
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;

function getCustomerVipInfo(totalSpent = 0) {
  const spent = Math.max(0, Number(totalSpent) || 0);
  if (spent <= 200000) {
    return {
      level: 1,
      label: 'VIP 1',
      tierName: 'Hội viên Mới (0 - 200K)',
      color: '#475569',
      bg: '#f1f5f9',
      border: '#cbd5e1',
      icon: 'fa-shield',
      min: 0,
      max: 200000,
      nextTarget: 201000,
      nextLabel: 'VIP 2',
      progressPercent: Math.min(100, Math.round((spent / 200000) * 100))
    };
  } else if (spent <= 500000) {
    return {
      level: 2,
      label: 'VIP 2',
      tierName: 'Collector Bạc (201K - 500K)',
      color: '#0284c7',
      bg: '#e0f2fe',
      border: '#bae6fd',
      icon: 'fa-medal',
      min: 201000,
      max: 500000,
      nextTarget: 501000,
      nextLabel: 'VIP 3',
      progressPercent: Math.min(100, Math.round(((spent - 200000) / 300000) * 100))
    };
  } else if (spent <= 1000000) {
    return {
      level: 3,
      label: 'VIP 3',
      tierName: 'Collector Vàng (501K - 1TR)',
      color: '#d97706',
      bg: '#fef3c7',
      border: '#fde68a',
      icon: 'fa-award',
      min: 501000,
      max: 1000000,
      nextTarget: 1001000,
      nextLabel: 'VIP 4',
      progressPercent: Math.min(100, Math.round(((spent - 500000) / 500000) * 100))
    };
  } else if (spent <= 5000000) {
    return {
      level: 4,
      label: 'VIP 4',
      tierName: 'VIP Bạch Kim (1TR - 5TR)',
      color: '#7c3aed',
      bg: '#f3e8ff',
      border: '#ddd6fe',
      icon: 'fa-gem',
      min: 1001000,
      max: 5000000,
      nextTarget: 5001000,
      nextLabel: 'VIP 5',
      progressPercent: Math.min(100, Math.round(((spent - 1000000) / 4000000) * 100))
    };
  } else {
    return {
      level: 5,
      label: 'VIP 5',
      tierName: 'VIP Kim Cương (Từ 5TR)',
      color: '#dc2626',
      bg: '#fee2e2',
      border: '#fca5a5',
      icon: 'fa-crown',
      min: 5001000,
      max: 10000000,
      nextTarget: null,
      nextLabel: 'Cấp tối đa',
      progressPercent: 100
    };
  }
}
window.getCustomerVipInfo = getCustomerVipInfo;

function showToast(message, type = 'info', title = null) {
  const container = document.getElementById('toastContainer');
  if (!container || !message) return;

  const msgClean = String(message).trim();
  // Tránh lặp lại toast cùng nội dung đang hiển thị
  const existingMessages = Array.from(container.querySelectorAll('.toast-message')).map(el => el.textContent.trim());
  if (existingMessages.includes(msgClean)) return;

  // Giới hạn tối đa 2 toast hiển thị cùng lúc để không đè lên nhau
  while (container.children.length >= 2) {
    if (container.firstElementChild) {
      container.firstElementChild.remove();
    } else {
      break;
    }
  }

  const validTypes = ['success', 'error', 'warning', 'info'];
  const t = validTypes.includes(type) ? type : 'info';

  const toast = document.createElement('div');
  toast.className = `toast toast-${t}`;

  let iconHtml = '<i class="fa-solid fa-circle-info"></i>';
  let defaultTitle = 'Thông báo';
  if (t === 'success') {
    iconHtml = '<i class="fa-solid fa-circle-check"></i>';
    defaultTitle = 'Thành công';
  } else if (t === 'error') {
    iconHtml = '<i class="fa-solid fa-circle-exclamation"></i>';
    defaultTitle = 'Thông báo lỗi';
  } else if (t === 'warning') {
    iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
    defaultTitle = 'Lưu ý';
  }

  const finalTitle = title || defaultTitle;

  toast.innerHTML = `
    <div class="toast-icon-wrap">${iconHtml}</div>
    <div class="toast-body">
      <div class="toast-title">${escapeHtml(finalTitle)}</div>
      <div class="toast-message">${escapeHtml(msgClean)}</div>
    </div>
    <button type="button" class="toast-close-btn" aria-label="Đóng" onclick="const p = this.closest('.toast'); if (p) { p.classList.add('toast-hiding'); setTimeout(() => p.remove(), 260); }">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <div class="toast-progress toast-progress-${t}"></div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 260);
    }
  }, 3500);
}

// =====================================================================
// SLIM TOP PROGRESS BAR (STOREFRONT)
// =====================================================================
let siteProgressTimer = null;
function startSiteProgressBar() {
  const bar = document.getElementById('siteTopProgressBar');
  if (!bar) return;
  if (siteProgressTimer) clearTimeout(siteProgressTimer);
  bar.classList.remove('done');
  bar.classList.add('loading');
  bar.style.width = '28%';
  siteProgressTimer = setTimeout(() => {
    if (bar.classList.contains('loading')) {
      bar.style.width = '74%';
    }
  }, 160);
}

function finishSiteProgressBar() {
  const bar = document.getElementById('siteTopProgressBar');
  if (!bar) return;
  if (siteProgressTimer) clearTimeout(siteProgressTimer);
  bar.style.width = '100%';
  setTimeout(() => {
    bar.classList.remove('loading');
    bar.classList.add('done');
    setTimeout(() => {
      bar.classList.remove('done');
      bar.style.width = '0%';
    }, 350);
  }, 130);
}

// =====================================================================
// 3. UNIFIED SAFE FETCH (DELEGATES TO WINDOW.API)
// =====================================================================
async function safeFetch(url, options = {}) {
  startSiteProgressBar();
  try {
    const method = (options.method || 'GET').toUpperCase();
    let body = options.body;
    if (body && typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) {}
    }

    if (method === 'GET') {
      return await api.get(url);
    } else if (method === 'POST') {
      return await api.post(url, body);
    } else if (method === 'PUT') {
      return await api.put(url, body);
    } else if (method === 'PATCH') {
      return await api.patch(url, body);
    } else if (method === 'DELETE') {
      return await api.delete(url);
    }
    return await api.get(url);
  } catch (err) {
    console.warn(`[SAFE FETCH] (${url}):`, err.message || err);
    return {
      success: false,
      data: null,
      error: err.message,
      message: err.message,
      code: err.code || 'API_ERROR',
      status: err.status || 500
    };
  } finally {
    finishSiteProgressBar();
  }
}

function renderProductSkeletons(containerId, count = 6) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = Array(count).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-box" style="height: 190px; width: 100%;"></div>
      <div class="skeleton-box" style="height: 12px; width: 55%; margin-top: 4px;"></div>
      <div class="skeleton-box" style="height: 18px; width: 90%;"></div>
      <div class="skeleton-box" style="height: 12px; width: 40%;"></div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 8px;">
        <div class="skeleton-box" style="height: 22px; width: 38%;"></div>
        <div class="skeleton-box" style="height: 32px; width: 42%; border-radius: 6px;"></div>
      </div>
    </div>
  `).join('');
}

// =====================================================================
// 4. KHỞI TẠO VÀ TẢI SẢN PHẨM (API HOẶC FALLBACK)
// =====================================================================
// Lưu trạng thái chọn Box / Card trên từng card sản phẩm (mặc định: 'box')
const selectedCardPackaging = {};

function getProductBoxCardPricing(p) {
  const norm = (window.api && typeof window.api.normalizeProductObject === 'function')
    ? window.api.normalizeProductObject(p)
    : p;

  const packagingType = String(norm.packagingType || norm.PackagingType || 'both').toLowerCase();
  const rawDisc = Number(norm.discountPercent ?? norm.DiscountPercent ?? 0);
  const pPriceLegacy = Number(norm.Price ?? norm.price ?? 350000);
  const pOldLegacy = Number(norm.OldPrice ?? norm.oldPrice ?? 0);

  let discountPercent = Math.max(0, Math.min(90, Math.round(rawDisc)));
  if (discountPercent === 0 && (norm.hasDiscount || norm.HasDiscount) && pOldLegacy > pPriceLegacy && pOldLegacy > 0) {
    discountPercent = Math.max(1, Math.round(((pOldLegacy - pPriceLegacy) / pOldLegacy) * 100));
  }

  let baseBox = Number(norm.priceBox ?? norm.PriceBox ?? 0);
  let baseCard = Number(norm.priceCard ?? norm.PriceCard ?? 0);

  if (packagingType === 'card_only') {
    if (!baseCard) baseCard = (discountPercent > 0 && pOldLegacy > pPriceLegacy ? pOldLegacy : pPriceLegacy) || 380000;
    if (!baseBox) baseBox = baseCard;
  } else if (packagingType === 'box_only') {
    if (!baseBox) baseBox = (discountPercent > 0 && pOldLegacy > pPriceLegacy ? pOldLegacy : pPriceLegacy) || 320000;
    if (!baseCard) baseCard = baseBox;
  } else {
    // 'both'
    if (!baseBox) baseBox = (discountPercent > 0 && pOldLegacy > pPriceLegacy ? pOldLegacy : pPriceLegacy) || 320000;
    if (!baseCard || baseCard <= 0) {
      baseCard = baseBox;
    }
  }

  // Trừ trực tiếp % giảm giá vào tiền
  const calcFinal = (base) => {
    if (discountPercent <= 0) return base;
    return Math.round(((base * (100 - discountPercent)) / 100) / 1000) * 1000;
  };

  const finalPriceBox = Number(norm.finalPriceBox ?? norm.FinalPriceBox ?? calcFinal(baseBox));
  const finalPriceCard = Number(norm.finalPriceCard ?? norm.FinalPriceCard ?? calcFinal(baseCard));

  // Tồn kho thực tế của từng bản Box và Card
  const totalStock = typeof norm.stock === 'number' ? norm.stock : (typeof norm.Stock === 'number' ? norm.Stock : 0);
  const rawBox = norm.stockBox ?? norm.StockBox ?? norm.stockbox;
  const rawCard = norm.stockCard ?? norm.StockCard ?? norm.stockcard;

  let stockBox = rawBox != null ? Math.max(0, Number(rawBox)) : (packagingType === 'card_only' ? 0 : Math.ceil(totalStock / 2));
  let stockCard = rawCard != null ? Math.max(0, Number(rawCard)) : (packagingType === 'box_only' ? 0 : Math.floor(totalStock / 2));

  if (packagingType === 'box_only') stockCard = 0;
  if (packagingType === 'card_only') stockBox = 0;

  const isPreOrder = String(norm.status || norm.Status || '').toLowerCase() === 'pre_order';
  const isBoxAvailable = packagingType !== 'card_only' && (isPreOrder || stockBox > 0);
  const isCardAvailable = packagingType !== 'box_only' && (isPreOrder || stockCard > 0);

  let defaultPack = 'box';
  if (!isBoxAvailable && isCardAvailable) {
    defaultPack = 'card';
  } else if (packagingType === 'card_only') {
    defaultPack = 'card';
  }

  return {
    packagingType,
    discountPercent,
    hasDiscount: discountPercent > 0,
    priceBox: baseBox,
    priceCard: baseCard,
    finalPriceBox,
    finalPriceCard,
    stockBox,
    stockCard,
    isBoxAvailable,
    isCardAvailable,
    defaultPack
  };
}

function getSelectedPackForProduct(p) {
  const pId = p.ProductId || p.id;
  const pricing = getProductBoxCardPricing(p);

  // Nếu chỉ có 1 bản khả dụng, bắt buộc chọn bản đó
  if (!pricing.isBoxAvailable && pricing.isCardAvailable) return 'card';
  if (!pricing.isCardAvailable && pricing.isBoxAvailable) return 'box';
  if (pricing.packagingType === 'box_only') return 'box';
  if (pricing.packagingType === 'card_only') return 'card';

  const userChoice = selectedCardPackaging[pId];
  if (userChoice === 'box' && !pricing.isBoxAvailable && pricing.isCardAvailable) return 'card';
  if (userChoice === 'card' && !pricing.isCardAvailable && pricing.isBoxAvailable) return 'box';

  return userChoice || pricing.defaultPack || (pricing.isBoxAvailable ? 'box' : (pricing.isCardAvailable ? 'card' : 'box'));
}

async function loadProducts() {
  renderProductSkeletons('mainProductGrid', 8);

  try {
    const json = await safeFetch('/api/products');
    if (json.success && json.data && json.data.length > 0) {
      allProducts = json.data.map(p => (window.api && window.api.normalizeProductObject) ? window.api.normalizeProductObject(p) : p);
    } else {
      allProducts = FALLBACK_PRODUCTS.map(p => (window.api && window.api.normalizeProductObject) ? window.api.normalizeProductObject(p) : p);
    }
  } catch (err) {
    console.warn('Sử dụng dữ liệu cục bộ:', err.message);
    allProducts = FALLBACK_PRODUCTS.map(p => (window.api && window.api.normalizeProductObject) ? window.api.normalizeProductObject(p) : p);
  }

  // Tự động kiểm tra và chuẩn hóa lại giỏ hàng theo trạng thái thực tế của sản phẩm
  if (Array.isArray(cart) && cart.length > 0) {
    let cartModified = false;
    cart.forEach(it => {
      const p = allProducts.find(prod => (prod.ProductId || prod.id) == it.productId);
      if (p) {
        const isPre = String(p.Status || p.status || '').toLowerCase() === 'pre_order';
        if (it.isPreOrder !== isPre) {
          it.isPreOrder = isPre;
          it.depositAmount = isPre ? Math.round((it.price || 350000) * 0.3) : 0;
          cartModified = true;
        }

        // Tự động kiểm tra tính khả dụng của bản Box / Card trong giỏ
        if (!isPre) {
          const pricing = getProductBoxCardPricing(p);
          const pack = it.packType || 'box';
          const avail = pack === 'card' ? pricing.stockCard : pricing.stockBox;
          if (avail <= 0) {
            // Nếu bản hiện tại hết hàng nhưng bản còn lại còn hàng -> tự động chuyển sang bản còn hàng
            if (pack === 'box' && pricing.isCardAvailable) {
              it.packType = 'card';
              it.price = pricing.finalPriceCard;
              it.originalPrice = pricing.priceCard;
              cartModified = true;
            } else if (pack === 'card' && pricing.isBoxAvailable) {
              it.packType = 'box';
              it.price = pricing.finalPriceBox;
              it.originalPrice = pricing.priceBox;
              cartModified = true;
            }
          }
        }
      }
    });
    if (cartModified) {
      saveCart();
      renderCartDrawer();
    }
  }

  await loadAppCategories();
  renderDynamicBrandFilter();
  renderProductsGrid();
  renderPreOrderQuickRow();
  updateFilterCounts();
}

// Đồng bộ sản phẩm tức thì khi Admin thêm/sửa Box, Card hoặc % giảm giá
try {
  if (typeof BroadcastChannel !== 'undefined') {
    const prodSyncChannel = new BroadcastChannel('minigt_realtime_sync');
    prodSyncChannel.addEventListener('message', (ev) => {
      if (ev.data && (ev.data.type === 'PRODUCTS_UPDATED' || ev.data === 'PRODUCTS_UPDATED')) {
        loadProducts();
      }
    });
  }
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'minigt_products_catalog_v5_canonical' || ev.key === 'minigt_products_catalog_v4_canonical' || ev.key === 'minigt_realtime_event') {
      loadProducts();
    }
  });
} catch (_) {}

// =====================================================================
// 5. RENDER CARD SẢN PHẨM GỌN ĐẸP CHUẨN COLLECTOR (CHỌN BOX / CARD & TRỪ % TRỰC TIẾP)
// =====================================================================
function createProductCardHTML(p, idx = 0) {
  const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
  const pId = p.ProductId || p.id;
  const pName = p.Name || p.name || 'Mini GT 1:64';
  const pSku = p.Sku || p.sku || 'MGT0000';
  let pImg = p.ImageUrl || p.imageUrl || p.image || p.Image || 'image/hero-banner.jpg';
  if ((pImg.startsWith('/api/images/') || pImg.startsWith('/images/')) && typeof api !== 'undefined' && api.BASE_URL) {
    pImg = api.BASE_URL.replace(/\/+$/, '') + pImg;
  }
  if (pImg.includes('amr24.webp')) pImg = 'image/aston-amr24-alonso.png';
  else if (pImg.includes('f1.webp')) pImg = 'image/aston-amr24-stroll.png';
  else if (pImg.includes('huracan.webp')) pImg = 'image/lambo-sterrato-set.png';
  else if (pImg.includes('lambo.webp')) pImg = 'image/Minigt_Lambo_GT3.jpg';
  const statusVal = String(p.Status || p.status || 'in_stock').toLowerCase();
  const isPreOrder = statusVal === 'pre_order';
  const stockCount = typeof p.Stock === 'number' ? p.Stock : (typeof p.stock === 'number' ? p.stock : 10);
  const isOutOfStock = stockCount <= 0 || statusVal === 'sold_out' || statusVal === 'out_of_stock' || Boolean(p.isOutOfStock);

  const pricing = getProductBoxCardPricing(p);
  const activePack = getSelectedPackForProduct(p);
  const currentFinalPrice = activePack === 'card' ? pricing.finalPriceCard : pricing.finalPriceBox;
  const currentBasePrice = activePack === 'card' ? pricing.priceCard : pricing.priceBox;
  const expDelivery = p.ExpectedDelivery || p.expectedDelivery || (isPreOrder ? 'Tháng 11/2026' : null);
  const depPct = Number(p.DepositPercent || p.depositPercent || 30);
  const currentDeposit = Math.round((currentFinalPrice * (depPct / 100)) / 1000) * 1000;

  const hasDiscount = !isOutOfStock && pricing.hasDiscount && pricing.discountPercent > 0;
  const discountPct = pricing.discountPercent;

  // 1. Badge góc trái trên: chỉ hiện -% giảm giá hoặc Hết hàng
  let statusBadge = '';
  if (isOutOfStock) {
    statusBadge = `<span class="card-badge-soldout">${isEn ? 'Sold Out' : 'Hết hàng'}</span>`;
  } else if (hasDiscount) {
    statusBadge = `<span class="card-badge-discount">-${discountPct}%</span>`;
  }

  // 2. Dải băng góc phải trên: Tự động nhận diện LB★WORKS, GT3 IMSA, FORMULA 1, BOX SET, CHASE
  const catSlug = String(p.CategorySlug || p.categorySlug || '').toLowerCase();
  const rawName = (pName + ' ' + (p.EditionNote || '')).toLowerCase();
  let ribbonTag = null;
  if (catSlug === 'liberty-walk' || rawName.includes('lb') || rawName.includes('liberty') || rawName.includes('lbwk')) {
    ribbonTag = { text: 'LB★WORKS', type: 'lbwk' };
  } else if (catSlug === 'gt-racing' || catSlug === 'gt3' || rawName.includes('gt3') || rawName.includes('rexy') || rawName.includes('roxy') || rawName.includes('skeleton') || rawName.includes('imsa')) {
    ribbonTag = { text: 'GT3 IMSA', type: 'gt3' };
  } else if (catSlug === 'f1-racing' || catSlug === 'f1' || rawName.includes('f1') || rawName.includes('red bull') || rawName.includes('amr24')) {
    ribbonTag = { text: 'F1 RACING', type: 'f1' };
  } else if (catSlug === 'box-sets' || rawName.includes('box set') || rawName.includes('set 4') || rawName.includes('combo')) {
    ribbonTag = { text: 'BOX SET', type: 'set' };
  } else if (rawName.includes('chase') || rawName.includes('secret')) {
    ribbonTag = { text: 'CHASE 1/24', type: 'chase' };
  }

  const ribbonHtml = ribbonTag ? `<span class="card-top-ribbon ribbon-${ribbonTag.type}">${ribbonTag.text}</span>` : '';
  const wishRibbonClass = ribbonTag ? 'has-ribbon' : '';

  const carNum = p.CarNumber || (pSku ? pSku.replace(/\D/g, '').replace(/^0+/, '') : '') || '64';
  const isWish = isInWishlist(pId);

  // 3. Thanh chọn Box / Card ngay trên card sản phẩm (nhỏ gọn, tinh tế, gạch nếu không có)
  const isBoxDisabled = !pricing.isBoxAvailable;
  const isCardDisabled = !pricing.isCardAvailable;
  const boxReason = pricing.packagingType === 'card_only'
    ? (isEn ? 'No Box' : 'Không có Box')
    : (pricing.stockBox <= 0 ? (isEn ? 'Out of Box' : 'Hết Box') : '');
  const cardReason = pricing.packagingType === 'box_only'
    ? (isEn ? 'No Card' : 'Không có Card')
    : (pricing.stockCard <= 0 ? (isEn ? 'Out of Card' : 'Hết Card') : '');

  const boxLabelHtml = isBoxDisabled
    ? `<span class="pack-label"><i class="fa-solid fa-cube"></i> <del>Box</del><span class="pack-sub-status">(${boxReason})</span></span>`
    : `<span class="pack-label"><i class="fa-solid fa-cube"></i> Box</span>`;

  const cardLabelHtml = isCardDisabled
    ? `<span class="pack-label"><i class="fa-solid fa-shield-halved"></i> <del>Card</del><span class="pack-sub-status">(${cardReason})</span></span>`
    : `<span class="pack-label"><i class="fa-solid fa-shield-halved"></i> Card</span>`;

  const packSwitchHtml = `
    <div class="card-pack-switch" role="group" aria-label="Chọn Box hoặc Card">
      <button type="button"
        class="card-pack-btn ${activePack === 'box' ? 'active' : ''} ${isBoxDisabled ? 'pack-unavailable' : ''}"
        ${isBoxDisabled ? `disabled title="${boxReason}"` : ''}
        onclick="selectCardPackaging(${pId}, 'box', event)">
        ${boxLabelHtml}
        <span class="pack-price">${formatVND(pricing.finalPriceBox)}</span>
      </button>
      <button type="button"
        class="card-pack-btn ${activePack === 'card' ? 'active' : ''} ${isCardDisabled ? 'pack-unavailable' : ''}"
        ${isCardDisabled ? `disabled title="${cardReason}"` : ''}
        onclick="selectCardPackaging(${pId}, 'card', event)">
        ${cardLabelHtml}
        <span class="pack-price">${formatVND(pricing.finalPriceCard)}</span>
      </button>
    </div>
  `;

  let priceBlockHtml = '';
  let actionBtnHtml = '';

  if (isOutOfStock) {
    priceBlockHtml = `
      <div class="price-box">
        <div class="price-soldout-label">${isEn ? 'OUT OF STOCK' : 'HẾT HÀNG'}</div>
        <span class="price-soldout-sub">${isEn ? 'Restocking soon' : 'Tạm hết hàng'}</span>
      </div>
    `;
    actionBtnHtml = `<button class="card-btn-soldout" disabled>${isEn ? 'Sold Out' : 'Hết hàng'}</button>`;
  } else {
    const oldPriceHtml = (hasDiscount && currentBasePrice > currentFinalPrice)
      ? `<span class="old-price" id="cardOldPrice_${pId}">${formatVND(currentBasePrice)}</span>`
      : `<span class="old-price" id="cardOldPrice_${pId}" style="display:none;"></span>`;

    let priceSubHintHtml = '';
    if (isPreOrder) {
      priceSubHintHtml = `<span class="card-deposit-hint" id="cardSubHint_${pId}">${isEn ? `Deposit ${depPct}%:` : `Cọc ${depPct}%:`} ${formatVND(currentDeposit)}</span>`;
    } else if (hasDiscount) {
      priceSubHintHtml = `<span class="card-deposit-hint" id="cardSubHint_${pId}">${isEn ? 'Save' : 'Giảm trực tiếp'} ${formatVND(currentBasePrice - currentFinalPrice)} (-${discountPct}%)</span>`;
    } else {
      const diffCardBox = Math.max(40000, pricing.finalPriceCard - pricing.finalPriceBox);
      priceSubHintHtml = `<span class="card-official-hint" id="cardSubHint_${pId}">${activePack === 'box' ? (isEn ? `Box saves ${formatVND(diffCardBox)}` : `Box tiết kiệm ${formatVND(diffCardBox)}`) : (isEn ? 'Sealed Blister Card' : 'Vỉ nhựa Blister Seal')}</span>`;
    }

    priceBlockHtml = `
      <div class="price-box">
        <div class="price-main-row">
          <span class="current-price" id="cardCurrPrice_${pId}">${formatVND(currentFinalPrice)}</span>
          ${oldPriceHtml}
        </div>
        ${priceSubHintHtml}
      </div>
    `;

    if (isPreOrder) {
      actionBtnHtml = `<button class="card-btn-preorder" onclick="handleCardAction(${pId}, event)"><i class="fa-solid fa-plus"></i> ${isEn ? 'Pre-Order' : 'Đặt cọc'}</button>`;
    } else {
      actionBtnHtml = `<button class="card-btn-buy" onclick="handleCardAction(${pId}, event)"><i class="fa-solid fa-bag-shopping"></i> ${isEn ? 'Buy Now' : 'Mua ngay'}</button>`;
    }
  }

  const statusPillText = isOutOfStock
    ? (isEn ? 'Sold Out' : 'Hết hàng')
    : (isPreOrder ? 'Pre-Order' : (isEn ? 'In Stock' : 'Sẵn hàng'));
  const statusPillColor = isOutOfStock ? '#dc2626' : (isPreOrder ? '#d97706' : '#059669');
  const editionLabel = p.EditionNote || p.editionNote || (isEn ? 'Alloy Body • Rubber Tires' : 'Thân kim loại • Lốp cao su');
  const scaleLabel = p.Scale || p.scale || '1:64';

  return `
    <article class="product-card" data-id="${pId}" data-pack="${activePack}" style="--stagger-idx: ${idx % 12};">
      <div class="card-image-box">
        ${statusBadge ? `<div class="card-badge-top-left">${statusBadge}</div>` : ''}
        ${ribbonHtml}
        <button class="card-wishlist-btn ${isWish ? 'active' : ''} ${wishRibbonClass}" title="${isEn ? 'Wishlist' : 'Yêu thích'}" onclick="toggleWishlist(${pId}, event)">
          <i class="${isWish ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>
        <img class="card-image" src="${escapeHtml(pImg)}" alt="${escapeHtml(pName)}" loading="lazy" onerror="this.onerror=null; this.src='image/hero-banner.jpg';">
        <span class="card-car-num"><span class="play-icon">▶</span> ${escapeHtml(String(carNum))}</span>
        <span class="card-scale-pill">${activePack === 'card' ? 'CARD BLISTER' : 'BOX SEAL'}</span>
        
        <div class="card-hover-overlay">
          <button class="card-hover-btn btn-view" onclick="openQuickView(${pId})"><i class="fa-solid fa-eye"></i> ${isEn ? 'Details' : 'Chi tiết'}</button>
          ${!isOutOfStock ? `<button class="card-hover-btn btn-buy" onclick="handleCardAction(${pId}, event)"><i class="fa-solid fa-bag-shopping"></i> ${isPreOrder ? (isEn ? 'Pre-Order' : 'Đặt cọc') : (isEn ? 'Buy Now' : 'Mua ngay')}</button>` : ''}
        </div>
      </div>
      <div class="card-body">
        <div class="card-brand-sku-row">
          <span class="card-sku-code">#${escapeHtml(pSku)}</span>
          <span style="font-size:10px; font-weight:700; color:${statusPillColor};">${statusPillText}</span>
        </div>
        <h3 class="product-title" onclick="openQuickView(${pId})" title="${escapeHtml(pName)}">${escapeHtml(pName)}</h3>
        <div class="card-collector-specs">
          <span class="spec-chip"><i class="fa-solid fa-ruler-combined"></i> ${escapeHtml(scaleLabel)} Diecast</span>
          <span class="spec-edition" title="${escapeHtml(editionLabel)}">${escapeHtml(editionLabel)}</span>
        </div>
        ${isPreOrder && expDelivery ? `
          <div class="card-preorder-eta" style="font-size:10.5px; color:#6d28d9; background:#f5f3ff; border:1px solid #ddd6fe; border-radius:5px; padding:3px 7px; margin-top:5px; font-weight:700; display:flex; align-items:center; gap:5px;">
            <i class="fa-regular fa-calendar-check" style="color:#7c3aed;"></i>
            <span>Dự kiến về: <strong>${escapeHtml(expDelivery)}</strong></span>
          </div>
        ` : ''}
        ${packSwitchHtml}
        <div class="card-footer">
          ${priceBlockHtml}
          ${actionBtnHtml}
        </div>
      </div>
    </article>
  `;
}

function selectCardPackaging(productId, packType, event) {
  if (event && event.stopPropagation) event.stopPropagation();
  const normalizedPack = packType === 'card' ? 'card' : 'box';

  const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == productId);
  if (!prod) return;

  const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
  const pricing = getProductBoxCardPricing(prod);

  // Không cho phép chuyển sang quy cách không được mở bán hoặc đã hết hàng
  if (normalizedPack === 'card' && !pricing.isCardAvailable) return;
  if (normalizedPack === 'box' && !pricing.isBoxAvailable) return;

  selectedCardPackaging[productId] = normalizedPack;
  const finalPrice = normalizedPack === 'card' ? pricing.finalPriceCard : pricing.finalPriceBox;
  const basePrice = normalizedPack === 'card' ? pricing.priceCard : pricing.priceBox;
  const isPreOrder = String(prod.Status || prod.status || '').toLowerCase() === 'pre_order';

  // Cập nhật nhanh DOM trên tất cả card của sản phẩm này (kể cả trên catalog grid và chuyên trang GT3 Dino)
  document.querySelectorAll(`.product-card[data-id="${productId}"], .gt3-dino-card[data-id="${productId}"]`).forEach(cardEl => {
    cardEl.setAttribute('data-pack', normalizedPack);
    const btns = cardEl.querySelectorAll('.card-pack-btn');
    if (btns.length >= 2) {
      btns[0].classList.toggle('active', normalizedPack === 'box');
      btns[1].classList.toggle('active', normalizedPack === 'card');
    }
    const scalePill = cardEl.querySelector('.card-scale-pill');
    if (scalePill) scalePill.textContent = normalizedPack === 'card' ? 'CARD BLISTER' : 'BOX SEAL';

    const currEl = cardEl.querySelector('.current-price') || cardEl.querySelector('.gt3-price-group strong');
    if (currEl) currEl.textContent = formatVND(finalPrice);

    const dinoSubEl = cardEl.querySelector('.gt3-price-group span');
    if (dinoSubEl) {
      dinoSubEl.textContent = normalizedPack === 'card'
        ? (isEn ? 'Blister Display Card' : 'Bản Vỉ Card Trưng Bày')
        : (isEn ? 'Paper Box Edition' : 'Bản Hộp Giấy (Box Tiết Kiệm)');
    }

    const oldEl = cardEl.querySelector('.old-price');
    if (oldEl) {
      if (pricing.hasDiscount && basePrice > finalPrice) {
        oldEl.textContent = formatVND(basePrice);
        oldEl.style.display = 'inline';
      } else {
        oldEl.style.display = 'none';
      }
    }

    const hintEl = cardEl.querySelector('.card-deposit-hint, .card-official-hint');
    if (hintEl) {
      if (isPreOrder) {
        hintEl.textContent = `${isEn ? 'Deposit 30%:' : 'Cọc 30%:'} ${formatVND(Math.round(finalPrice * 0.3))}`;
      } else if (pricing.hasDiscount) {
        hintEl.textContent = `${isEn ? 'Save' : 'Giảm trực tiếp'} ${formatVND(basePrice - finalPrice)} (-${pricing.discountPercent}%)`;
      } else {
        const diff = Math.max(40000, pricing.finalPriceCard - pricing.finalPriceBox);
        hintEl.textContent = normalizedPack === 'box'
          ? (isEn ? `Box saves ${formatVND(diff)}` : `Box tiết kiệm ${formatVND(diff)}`)
          : (isEn ? 'Sealed Blister Card' : 'Vỉ nhựa Blister Seal');
      }
    }
  });
}
window.selectCardPackaging = selectCardPackaging;

function renderPreOrderQuickRow() {
  const container = document.getElementById('preorderQuickRow');
  if (!container) return;

  const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
  const sourceList = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).slice(0, 3);

  container.innerHTML = sourceList.map(p => {
    const pId = p.ProductId || p.id;
    const pricing = getProductBoxCardPricing(p);
    return `
      <div class="preorder-quick-card">
        <div>
          <div class="quick-card-meta">#${escapeHtml(p.Sku || p.sku || 'MGT')} • Box / Card</div>
          <div class="quick-card-price">
            ${formatVND(pricing.finalPriceBox)}
            ${pricing.hasDiscount ? `<span class="quick-card-old">${formatVND(pricing.priceBox)}</span>` : ''}
          </div>
        </div>
        <button class="btn-quick-deposit" onclick="handleCardAction(${pId}, event)">+ ${isEn ? 'Pre-Order' : 'Đặt cọc'}</button>
      </div>
    `;
  }).join('');
}

// =====================================================================
// 6. RENDER CÁC KHU VỰC SẢN PHẨM & PHÂN TRANG CATALOGUE (PAGINATION)
// =====================================================================
let catalogCurrentPage = 1;
const CATALOG_PER_PAGE = 8;

function handleCatalogSort(sortVal) {
  startSiteProgressBar();
  currentSort = sortVal;
  catalogCurrentPage = 1;
  renderProductsGrid();
  setTimeout(() => finishSiteProgressBar(), 180);
}

function handleCatalogBrandChange(brandVal) {
  startSiteProgressBar();
  currentBrandFilter = brandVal;
  catalogCurrentPage = 1;
  renderProductsGrid();
  setTimeout(() => finishSiteProgressBar(), 180);
}

function matchesProductFilter(p, filterKey) {
  if (!p) return false;
  if (!filterKey || filterKey === 'all') return true;

  const stockVal = (typeof p.Stock === 'number') ? p.Stock : (typeof p.stock === 'number' ? p.stock : 10);
  const st = String(p.Status || p.status || 'in_stock').toLowerCase();
  const isOutOfStock = stockVal <= 0 || st === 'sold_out' || st === 'out_of_stock' || Boolean(p.isOutOfStock);

  if (filterKey === 'bestseller') {
    return Boolean(p.IsBestSeller || (p.soldCount && p.soldCount > 20) || p.isHot || [10, 8, 4, 5, 1, 2, 6].includes(Number(p.ProductId || p.id)));
  }
  if (filterKey === 'in_stock') {
    return !isOutOfStock && st !== 'pre_order';
  }
  if (filterKey === 'pre_order') {
    return st === 'pre_order';
  }

  const catSlug = String(p.CategorySlug || p.categorySlug || '').toLowerCase();
  const catId = String(p.CategoryId || p.categoryId || '');
  const catName = String(p.CategoryName || p.categoryName || (p.category && p.category.name) || '').toLowerCase();
  const name = String(p.Name || p.name || '').toLowerCase();
  const sku = String(p.Sku || p.sku || '').toUpperCase();
  const note = String(p.EditionNote || p.editionNote || '').toLowerCase();

  const targetKey = String(filterKey).toLowerCase();

  // Backward compatibility aliases
  if (targetKey === 'lbwk' || targetKey === 'liberty-walk') {
    return catSlug === 'liberty-walk' || name.includes('lb') || note.includes('liberty');
  }
  if (targetKey === 'chase' || targetKey === 'partner') {
    return catSlug === 'partner' || sku.startsWith('PR') || sku.startsWith('TH') || name.includes('secret') || name.includes('chase');
  }
  if (targetKey === 'f1' || targetKey === 'f1-racing') {
    return catSlug === 'f1-racing' || name.includes('f1') || name.includes('red bull') || name.includes('amr24');
  }
  if (targetKey === 'box_sets' || targetKey === 'box-sets') {
    return catSlug === 'box-sets' || name.includes('box') || name.includes('set') || name.includes('combo');
  }
  if (targetKey === 'ao_racing' || targetKey === 'gt-racing') {
    return catSlug === 'gt-racing' || name.includes('ao racing') || name.includes('rexy') || name.includes('roxy') || name.includes('ske');
  }

  return catSlug === targetKey || catId === targetKey || catName.includes(targetKey);
}

function renderProductsGrid() {
  const container = document.getElementById('mainProductGrid');
  if (!container) return;

  let filtered = [...allProducts];

  // 1. Lọc theo Danh mục Filter Pill
  filtered = filtered.filter(p => matchesProductFilter(p, currentFilter));

  // 2. Lọc theo Hãng xe (Brand)
  if (currentBrandFilter && currentBrandFilter !== 'all') {
    filtered = filtered.filter(p => p.Brand && p.Brand.toLowerCase().includes(currentBrandFilter.toLowerCase()));
  }

  // 3. Sắp xếp (Sorting)
  if (currentSort === 'price_asc') {
    filtered.sort((a, b) => (a.Price || a.price) - (b.Price || b.price));
  } else if (currentSort === 'price_desc') {
    filtered.sort((a, b) => (b.Price || b.price) - (a.Price || a.price));
  } else if (currentSort === 'name_asc') {
    filtered.sort((a, b) => (a.Name || a.name || '').localeCompare(b.Name || b.name || '', 'vi'));
  } else if (currentSort === 'name_desc') {
    filtered.sort((a, b) => (b.Name || b.name || '').localeCompare(a.Name || a.name || '', 'vi'));
  } else if (currentSort === 'newest') {
    filtered.sort((a, b) => ((b.IsNew || b.isNew || 0) - (a.IsNew || a.isNew || 0)) || ((b.ProductId || b.id) - (a.ProductId || a.id)));
  } else if (currentSort === 'best_selling') {
    filtered.sort((a, b) => ((b.soldCount || 0) - (a.soldCount || 0)) || ((b.QuotaPercent || 0) - (a.QuotaPercent || 0)));
  }

  // Cập nhật nhãn bộ lọc trên toolbar
  const filterLabelEl = document.getElementById('currentFilterLabel');
  if (filterLabelEl) {
    const pillBtn = document.querySelector(`.filter-pill[data-filter="${currentFilter}"]`);
    const pillText = pillBtn ? pillBtn.textContent.replace(/\(\d+\)/g, '').trim() : 'Tất cả';
    const brandText = currentBrandFilter !== 'all' ? ` • Hãng: ${currentBrandFilter}` : '';
    filterLabelEl.textContent = `${pillText}${brandText} (${filtered.length} xe)`;
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / CATALOG_PER_PAGE) || 1;
  if (catalogCurrentPage > totalPages) catalogCurrentPage = totalPages;
  if (catalogCurrentPage < 1) catalogCurrentPage = 1;

  if (totalItems === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: #64748b; background: #f8fafc; border-radius: 14px; border: 1px dashed #cbd5e1;">
        <i class="fa-solid fa-car-side" style="font-size: 40px; margin-bottom: 14px; opacity: 0.4;"></i>
        <h4 style="margin: 0 0 8px 0; color: #0f172a; font-weight: 700;">Không có mô hình xe nào phù hợp bộ lọc</h4>
        <p style="margin: 0 0 16px 0; font-size: 13px;">Hãy thử chọn bộ lọc khác hoặc đặt lại bộ lọc ban đầu.</p>
        <button class="btn btn-secondary btn-sm" onclick="currentBrandFilter='all'; currentSort='default'; const selB=document.getElementById('catalogBrandFilter'); if(selB) selB.value='all'; const selS=document.getElementById('catalogSortSelect'); if(selS) selS.value='default'; filterAndScroll(event, 'all');">
          <i class="fa-solid fa-rotate-left"></i> Đặt lại bộ lọc
        </button>
      </div>
    `;
    renderCatalogPagination(0, 1);
    return;
  }

  const startIdx = (catalogCurrentPage - 1) * CATALOG_PER_PAGE;
  const endIdx = startIdx + CATALOG_PER_PAGE;
  const pageItems = filtered.slice(startIdx, endIdx);

  container.innerHTML = pageItems.map((p, idx) => createProductCardHTML(p, idx)).join('');
  renderCatalogPagination(totalItems, totalPages);
  refreshScrollReveal();
}

function renderCatalogPagination(totalItems, totalPages) {
  const wrap = document.getElementById('catalogPaginationWrap');
  const infoEl = document.getElementById('catalogPaginationInfo');
  const controlsEl = document.getElementById('catalogPaginationControls');
  if (!wrap || !controlsEl) return;

  if (totalItems <= CATALOG_PER_PAGE) {
    if (infoEl) infoEl.innerHTML = `Hiển thị toàn bộ <strong>${totalItems}</strong> mô hình xe`;
    controlsEl.innerHTML = '';
    return;
  }

  const start = (catalogCurrentPage - 1) * CATALOG_PER_PAGE + 1;
  const end = Math.min(catalogCurrentPage * CATALOG_PER_PAGE, totalItems);
  if (infoEl) {
    infoEl.innerHTML = `Hiển thị <strong>${start} - ${end}</strong> trong số <strong>${totalItems}</strong> mô hình xe (Trang ${catalogCurrentPage}/${totalPages})`;
  }

  let html = '';
  // Nút Trước
  html += `
    <button type="button" class="page-btn" ${catalogCurrentPage === 1 ? 'disabled' : ''} onclick="goToCatalogPage(${catalogCurrentPage - 1})">
      <i class="fa-solid fa-chevron-left"></i> Trước
    </button>
  `;

  // Các số trang
  for (let p = 1; p <= totalPages; p++) {
    html += `
      <button type="button" class="page-btn ${p === catalogCurrentPage ? 'active' : ''}" onclick="goToCatalogPage(${p})">
        ${p}
      </button>
    `;
  }

  // Nút Sau
  html += `
    <button type="button" class="page-btn" ${catalogCurrentPage === totalPages ? 'disabled' : ''} onclick="goToCatalogPage(${catalogCurrentPage + 1})">
      Sau <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  controlsEl.innerHTML = html;
}

function goToCatalogPage(page) {
  startSiteProgressBar();
  catalogCurrentPage = page;
  renderProductsGrid();
  const catalog = document.getElementById('catalog');
  if (catalog) {
    catalog.scrollIntoView({ behavior: 'smooth' });
  }
  setTimeout(() => finishSiteProgressBar(), 180);
}

function renderF1Section() {
  const container = document.getElementById('f1ProductGrid');
  if (!container) return;
  const f1List = allProducts.filter(p => p.CategorySlug === 'f1-racing' || p.Name.toLowerCase().includes('f1') || p.Name.toLowerCase().includes('amr24'));
  container.innerHTML = f1List.map((p, idx) => createProductCardHTML(p, idx)).join('');
  refreshScrollReveal();
}

function renderBoxSetsSection() {
  const container = document.getElementById('boxSetsProductGrid');
  if (!container) return;
  const boxList = allProducts.filter(p => p.CategorySlug === 'box-sets' || p.Name.toLowerCase().includes('box') || p.Name.toLowerCase().includes('combo'));
  container.innerHTML = boxList.map((p, idx) => createProductCardHTML(p, idx)).join('');
  refreshScrollReveal();
}

let appCategories = [];

async function loadAppCategories() {
  try {
    const res = await safeFetch('/api/categories');
    if (res && res.success && Array.isArray(res.data)) {
      appCategories = res.data;
    }
  } catch (e) {
    if (window.api && typeof window.api.getSharedCategories === 'function') {
      appCategories = window.api.getSharedCategories();
    }
  }
  renderDynamicCategoryFilterPills();
}

function renderDynamicCategoryFilterPills() {
  const container = document.querySelector('.filter-tags-wrapper');
  if (!container) return;

  const staticPills = [
    { key: 'all', icon: 'fa-solid fa-border-all', label: 'Tất cả mô hình', countId: 'count-all' },
    { key: 'bestseller', icon: 'fa-solid fa-fire', iconColor: '#e10600', label: 'Bán chạy nhất', countId: 'count-bestseller' },
    { key: 'in_stock', icon: 'fa-solid fa-circle-check', iconColor: '#10b981', label: 'Còn hàng', countId: 'count-in_stock' },
    { key: 'pre_order', icon: 'fa-solid fa-clock', label: 'Pre-Order Đợt Mới', countId: 'count-pre_order' }
  ];

  const dynamicPills = (appCategories && appCategories.length > 0)
    ? appCategories.map(c => {
        const slug = (c.slug || c.Slug || '').toLowerCase();
        let icon = 'fa-solid fa-car-side';
        let iconColor = '';
        if (slug === 'liberty-walk') { icon = 'fa-solid fa-bolt'; }
        else if (slug === 'partner') { icon = 'fa-solid fa-gem'; iconColor = '#f59e0b'; }
        else if (slug === 'f1-racing') { icon = 'fa-solid fa-flag-checkered'; }
        else if (slug === 'box-sets') { icon = 'fa-solid fa-boxes-stacked'; }
        else if (slug === 'gt-racing') { icon = 'fa-solid fa-shield-cat'; }

        return {
          key: slug,
          icon,
          iconColor,
          label: c.name || c.Name,
          countId: `count-${slug}`
        };
      })
    : [
        { key: 'lbwk', icon: 'fa-solid fa-bolt', label: 'Liberty Walk LBWK', countId: 'count-lbwk' },
        { key: 'chase', icon: 'fa-solid fa-gem', iconColor: '#f59e0b', label: 'Secret Chase Car', countId: 'count-chase' },
        { key: 'f1', icon: 'fa-solid fa-flag-checkered', label: 'Formula 1 Series', countId: 'count-f1' },
        { key: 'box_sets', icon: 'fa-solid fa-boxes-stacked', label: 'Box Sets & Combo', countId: 'count-box_sets' },
        { key: 'ao_racing', icon: 'fa-solid fa-shield-cat', label: 'AO Racing GT3', countId: 'count-ao_racing' }
      ];

  const allPills = [...staticPills, ...dynamicPills];

  container.innerHTML = allPills.map(p => {
    const isActive = (currentFilter === p.key);
    const count = (allProducts || []).filter(prod => matchesProductFilter(prod, p.key)).length;
    const styleAttr = p.iconColor ? `style="color:${p.iconColor};"` : '';
    return `
      <button class="filter-pill ${isActive ? 'active' : ''}" data-filter="${escapeHtml(p.key)}" type="button">
        <i class="${p.icon}" ${styleAttr}></i> <span>${escapeHtml(p.label)}</span> <span class="pill-count" id="${p.countId}">(${count})</span>
      </button>
    `;
  }).join('');

  setupFilterPills();
}

function renderDynamicBrandFilter() {
  const brandSelect = document.getElementById('catalogBrandFilter');
  if (!brandSelect) return;
  const currentVal = brandSelect.value || currentBrandFilter || 'all';

  const brandSet = new Set();
  (allProducts || []).forEach(p => {
    const b = (p.Brand || p.brand || '').trim();
    if (b) brandSet.add(b);
  });

  const sortedBrands = Array.from(brandSet).sort((a, b) => a.localeCompare(b, 'vi'));

  let html = `<option value="all" ${currentVal === 'all' ? 'selected' : ''}>Tất cả hãng xe</option>`;
  sortedBrands.forEach(b => {
    const isSel = currentVal.toLowerCase() === b.toLowerCase();
    html += `<option value="${escapeHtml(b)}" ${isSel ? 'selected' : ''}>${escapeHtml(b)}</option>`;
  });

  brandSelect.innerHTML = html;
}

function updateFilterCounts() {
  document.querySelectorAll('.filter-pill').forEach(btn => {
    const filterKey = btn.getAttribute('data-filter');
    const badge = btn.querySelector('.pill-count');
    if (badge && filterKey) {
      const count = (allProducts || []).filter(p => matchesProductFilter(p, filterKey)).length;
      badge.textContent = `(${count})`;
    }
  });
}

// =====================================================================
// 7. BỘ LỌC DANH MỤC (FILTER PILLS INTERACTION)
// =====================================================================
function setupFilterPills() {
  const container = document.querySelector('.filter-tags-wrapper');
  if (!container) return;

  if (!container.__hasFilterListener) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-pill');
      if (!btn) return;
      container.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter') || 'all';
      catalogCurrentPage = 1;
      renderProductsGrid();
    });
    container.__hasFilterListener = true;
  }
}

// =====================================================================
// HERO CAROUSEL CONTROLLER (INTERACTIVE BANNER SLIDER - 10s AUTO-ROTATE)
// =====================================================================
let currentHeroSlideIndex = 0;
let heroSlideTimer = null;

function resetHeroSlideTimer() {
  if (heroSlideTimer) {
    clearInterval(heroSlideTimer);
    heroSlideTimer = null;
  }
  heroSlideTimer = setInterval(() => {
    nextHeroSlide(false);
  }, 10000); // Tự động chuyển banner sau đúng 10 giây
}

function goToHeroSlide(index, manual = false) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('#heroDotsWrap .hero-dot');
  if (!slides.length) return;

  const total = slides.length;
  currentHeroSlideIndex = ((index % total) + total) % total;

  slides.forEach((sl, idx) => {
    sl.classList.toggle('active', idx === currentHeroSlideIndex);
    sl.setAttribute('aria-hidden', idx === currentHeroSlideIndex ? 'false' : 'true');
  });

  dots.forEach((dot, idx) => {
    const isAct = idx === currentHeroSlideIndex;
    dot.classList.remove('active');
    if (isAct) {
      void dot.offsetWidth; // Force reflow để khởi động lại thanh tiến trình 10s của dot
      dot.classList.add('active');
    }
    dot.setAttribute('aria-current', isAct ? 'true' : 'false');
  });

  resetHeroSlideTimer();
}

function nextHeroSlide(manual = true) {
  goToHeroSlide(currentHeroSlideIndex + 1, manual);
  if (manual && typeof playHoverBeep === 'function') playHoverBeep(560, 0.03);
}

function prevHeroSlide(manual = true) {
  goToHeroSlide(currentHeroSlideIndex - 1, manual);
  if (manual && typeof playHoverBeep === 'function') playHoverBeep(500, 0.03);
}

function initHeroSlider() {
  const wrap = document.getElementById('heroSliderWrap');
  if (!wrap) return;

  goToHeroSlide(0, false);
  resetHeroSlideTimer();

  wrap.addEventListener('keydown', (event) => {
    if (event.target.matches('.hero-hotspot') && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      event.target.click();
      return;
    }
    if (event.key === 'ArrowRight') nextHeroSlide(true);
    else if (event.key === 'ArrowLeft') prevHeroSlide(true);
  });

  wrap.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    wrap.dataset.touchStartX = String(event.clientX);
  }, { passive: true });

  wrap.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'touch') return;
    const deltaX = event.clientX - Number(wrap.dataset.touchStartX);
    if (Math.abs(deltaX) > 45) deltaX < 0 ? nextHeroSlide(true) : prevHeroSlide(true);
    delete wrap.dataset.touchStartX;
  }, { passive: true });

  wrap.addEventListener('pointercancel', () => {
    delete wrap.dataset.touchStartX;
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resetHeroSlideTimer();
  });
}

// =====================================================================
// 8. ĐỒNG HỒ ĐẾM NGƯỢC PRE-ORDER (COUNTDOWN TIMER)
// =====================================================================
function setupCountdown() {
  let targetDate;
  const rawDl = (storeSettings && storeSettings.preorder_deadline) ? String(storeSettings.preorder_deadline).trim() : '2026-11-30';
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDl)) {
    targetDate = new Date(`${rawDl}T23:59:59`).getTime();
  } else if (rawDl.includes('/')) {
    const parts = rawDl.match(/(\d{1,2})\/(\d{4})/);
    if (parts) {
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      const lastDay = new Date(year, month, 0).getDate();
      targetDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59`).getTime();
    } else {
      targetDate = new Date('2026-11-30T23:59:59').getTime();
    }
  } else {
    targetDate = new Date('2026-11-30T23:59:59').getTime();
  }

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      const dEl = document.getElementById('daysVal');
      const hEl = document.getElementById('hoursVal');
      const mEl = document.getElementById('minsVal');
      const sEl = document.getElementById('secsVal');
      if (dEl) dEl.textContent = '00';
      if (hEl) hEl.textContent = '00';
      if (mEl) mEl.textContent = '00';
      if (sEl) sEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const pad = n => String(n).padStart(2, '0');

    const dEl = document.getElementById('daysVal');
    const hEl = document.getElementById('hoursVal');
    const mEl = document.getElementById('minsVal');
    const sEl = document.getElementById('secsVal');

    if (dEl) dEl.textContent = pad(days);
    if (hEl) hEl.textContent = pad(hours);
    if (mEl) mEl.textContent = pad(minutes);
    if (sEl) sEl.textContent = pad(seconds);
  }

  update();
  setInterval(update, 1000);
}

// =====================================================================
// 9. QUẢN LÝ GIỎ HÀNG & ĐẶT CỌC (CART DRAWER & HIỆU ỨNG BAY VÀO GIỎ)
// =====================================================================
function handleCardAction(productId, event, explicitPackType = null) {
  if (event && event.stopPropagation) {
    event.stopPropagation();
  }

  // YÊU CẦU: Chỉ có đăng nhập thì mới mua ngay / đặt cọc được xe, chưa đăng nhập thì xem được chi tiết nhưng không mua được mà phải đăng nhập
  const currentUser = (api && api.getCurrentUser) ? api.getCurrentUser() : null;
  const token = (api && api.getToken) ? api.getToken() : null;
  if (!currentUser && !token) {
    const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
    showToast(isEn ? 'Please sign in to buy or pre-order models!' : 'Vui lòng đăng nhập tài khoản để tiến hành đặt mua / cọc xe mô hình!', 'info');
    openAuthModal('login');
    return;
  }

  flyToCart(productId, event);
  addToCart(productId, 1, explicitPackType);

  // Micro-feedback badge animation
  const targetBadge = document.getElementById('cartBadgeCount');
  if (targetBadge) {
    targetBadge.classList.remove('bump');
    void targetBadge.offsetWidth;
    targetBadge.classList.add('bump');
  }

  // Open cart drawer smoothly after fly animation
  setTimeout(() => {
    openCartDrawer();
  }, 380);
}

function flyToCart(productId, event) {
  try {
    const cartBtn = document.getElementById('cartBadgeCount') || document.querySelector('.cart-btn');
    if (!cartBtn) return;

    let sourceEl = null;
    if (event && event.currentTarget) {
      const card = event.currentTarget.closest('.product-card');
      if (card) sourceEl = card.querySelector('.card-image');
    }
    if (!sourceEl) return;

    const srcRect = sourceEl.getBoundingClientRect();
    const dstRect = cartBtn.getBoundingClientRect();

    const clone = document.createElement('img');
    clone.src = sourceEl.src;
    clone.className = 'flying-car-clone';
    clone.style.width = '76px';
    clone.style.height = '54px';
    clone.style.left = `${srcRect.left + srcRect.width / 2 - 38}px`;
    clone.style.top = `${srcRect.top + srcRect.height / 2 - 27}px`;
    clone.style.opacity = '1';
    clone.style.transform = 'scale(1) rotate(0deg)';
    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      clone.style.left = `${dstRect.left + dstRect.width / 2 - 16}px`;
      clone.style.top = `${dstRect.top + dstRect.height / 2 - 12}px`;
      clone.style.width = '28px';
      clone.style.height = '20px';
      clone.style.opacity = '0.2';
      clone.style.transform = 'scale(0.35) rotate(12deg)';
    });

    setTimeout(() => {
      clone.remove();
      const wrap = cartBtn.closest('button') || cartBtn;
      wrap.classList.remove('cart-bounce-anim');
      void wrap.offsetWidth;
      wrap.classList.add('cart-bounce-anim');
    }, 720);
  } catch (e) {}
}

function addToCart(productId, quantity = 1, explicitPackType = null) {
  const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id || p.productid) == productId);
  if (!prod) return;

  const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
  const stock = typeof prod.Stock === 'number' ? prod.Stock : (typeof prod.stock === 'number' ? prod.stock : 999);
  const pName = prod.Name || prod.name;
  if (stock <= 0) {
    showToast(isEn ? `"${pName}" is currently out of stock!` : `Mẫu xe "${pName}" hiện đã hết hàng!`, 'error');
    return;
  }

  const pricing = getProductBoxCardPricing(prod);
  const isPreOrder = String(prod.Status || prod.status || '').toLowerCase() === 'pre_order';
  let chosenPack = explicitPackType || getSelectedPackForProduct(prod) || 'box';
  if (pricing.packagingType === 'box_only') chosenPack = 'box';
  if (pricing.packagingType === 'card_only') chosenPack = 'card';

  // Tự động chuyển đổi nếu bản người dùng chọn đã hết hàng nhưng bản còn lại còn hàng
  if (!isPreOrder) {
    if (chosenPack === 'box' && !pricing.isBoxAvailable) {
      if (pricing.isCardAvailable) {
        chosenPack = 'card';
        showToast(isEn ? `"${pName}" (Paper Box) is sold out, automatically switched to Blister Card!` : `Mẫu xe "${pName}" (Bản Box) đã hết hàng, hệ thống tự động chọn Bản Vỉ Card cho bạn!`, 'info');
      } else {
        showToast(isEn ? `"${pName}" is completely sold out!` : `Mẫu xe "${pName}" hiện đã hết hàng cả bản Box và Card!`, 'error');
        return;
      }
    } else if (chosenPack === 'card' && !pricing.isCardAvailable) {
      if (pricing.isBoxAvailable) {
        chosenPack = 'box';
        showToast(isEn ? `"${pName}" (Blister Card) is sold out, automatically switched to Paper Box!` : `Mẫu xe "${pName}" (Bản Card) đã hết hàng, hệ thống tự động chọn Bản Hộp Box cho bạn!`, 'info');
      } else {
        showToast(isEn ? `"${pName}" is completely sold out!` : `Mẫu xe "${pName}" hiện đã hết hàng cả bản Box và Card!`, 'error');
        return;
      }
    }
  }

  // ========================================================
  // KHAI BÁO & TÍNH TOÁN GIÁ (KHẮC PHỤC LỖI unitFinalPrice)
  // ========================================================
  const unitFinalPrice = chosenPack === 'card' 
    ? (pricing.finalPriceCard || pricing.priceCard || prod.PriceCard || prod.Price || prod.price || 0)
    : (pricing.finalPriceBox || pricing.priceBox || prod.PriceBox || prod.Price || prod.price || 0);

  const unitOriginalPrice = chosenPack === 'card'
    ? (pricing.priceCard || prod.PriceCard || prod.OldPrice || prod.oldPrice || unitFinalPrice)
    : (pricing.priceBox || prod.PriceBox || prod.OldPrice || prod.oldPrice || unitFinalPrice);

  const existing = cart.find(it => (it.productId == productId || it.id == productId) && (it.packType || 'box') === chosenPack);
  const packInCart = existing ? existing.quantity : 0;
  const maxPackStock = chosenPack === 'card' ? (pricing.stockCard ?? 0) : (pricing.stockBox ?? 0);
  const packLabel = chosenPack === 'card' ? 'Bản Vỉ Card' : 'Bản Hộp Box';

  // Kiểm tra tồn kho độc lập cho từng bản Hộp Box và Vỉ Card (không gộp chung)
  if (!isPreOrder) {
    if (packInCart + quantity > maxPackStock) {
      if (maxPackStock <= 0) {
        showToast(isEn ? `"${pName}" (${packLabel}) is currently sold out!` : `Mẫu xe "${pName}" (${packLabel}) hiện đã hết hàng!`, 'error');
      } else {
        showToast(
          isEn 
            ? `Only ${maxPackStock} left in stock for ${packLabel} (you already have ${packInCart} in cart).` 
            : `Rất tiếc! Mẫu "${pName}" (${packLabel}) chỉ còn ${maxPackStock} xe trong kho (bạn đã có ${packInCart} trong giỏ).`,
          'error'
        );
      }
      return;
    }

    const totalInCartForProd = cart.filter(it => (it.productId == productId || it.id == productId)).reduce((s, i) => s + i.quantity, 0);
    if (totalInCartForProd + quantity > stock) {
      showToast(isEn ? `Total available stock for "${pName}" is ${stock} models.` : `Tổng số lượng tồn kho của mẫu xe "${pName}" chỉ còn ${stock} xe (cả Box & Card).`, 'error');
      return;
    }
  }

  const depPct = isPreOrder ? Number(prod.DepositPercent || prod.depositPercent || 30) : 0;
  const pDeposit = isPreOrder ? (Math.round((unitFinalPrice * (depPct / 100)) / 1000) * 1000) : 0;
  const expDelivery = isPreOrder ? (prod.ExpectedDelivery || prod.expectedDelivery || null) : null;

  if (existing) {
    existing.quantity += quantity;
    existing.selected = true;
    existing.price = unitFinalPrice;
    existing.originalPrice = unitOriginalPrice;
    existing.discountPercent = pricing.discountPercent;
    existing.priceBox = pricing.priceBox;
    existing.priceCard = pricing.priceCard;
    existing.finalPriceBox = pricing.finalPriceBox;
    existing.finalPriceCard = pricing.finalPriceCard;
    existing.packagingType = pricing.packagingType;
    existing.depositAmount = pDeposit;
    existing.depositPercent = depPct;
    existing.isPreOrder = isPreOrder;
    existing.expectedDelivery = expDelivery;
  } else {
    cart.push({
      productId: prod.ProductId || prod.id || prod.productid,
      packType: chosenPack,
      packagingType: pricing.packagingType,
      name: pName,
      sku: prod.Sku || prod.sku,
      price: unitFinalPrice,
      originalPrice: unitOriginalPrice,
      discountPercent: pricing.discountPercent,
      priceBox: pricing.priceBox,
      priceCard: pricing.priceCard,
      finalPriceBox: pricing.finalPriceBox,
      finalPriceCard: pricing.finalPriceCard,
      depositAmount: pDeposit,
      depositPercent: depPct,
      expectedDelivery: expDelivery,
      imageUrl: prod.ImageUrl || prod.image || prod.imageurl,
      isPreOrder: isPreOrder,
      quantity: quantity,
      selected: true
    });
  }

  saveCart();
  renderCartDrawer();
  const packName = chosenPack === 'card' ? 'Bản Card Blister' : 'Bản Hộp Box';
  showToast(isEn ? `Added "${pName}" (${chosenPack.toUpperCase()}) to cart!` : `Đã thêm "${pName}" (${packName}) vào giỏ!`, 'success');
}

function switchCartItemPackaging(productId, currentPack, newPack) {
  const targetPack = newPack === 'card' ? 'card' : 'box';
  const curPack = currentPack || 'box';
  if (curPack === targetPack) return;

  const idx = cart.findIndex(i => i.productId == productId && (i.packType || 'box') === curPack);
  if (idx === -1) return;

  const item = cart[idx];
  const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == productId);
  const pricing = prod ? getProductBoxCardPricing(prod) : {
    packagingType: item.packagingType || 'both',
    discountPercent: item.discountPercent || 0,
    priceBox: item.priceBox || item.price || 350000,
    priceCard: item.priceCard || ((item.price || 350000) + 60000),
    finalPriceBox: item.finalPriceBox || item.price || 350000,
    finalPriceCard: item.finalPriceCard || ((item.price || 350000) + 60000)
  };

  if (pricing.packagingType === 'box_only' && targetPack === 'card') return;
  if (pricing.packagingType === 'card_only' && targetPack === 'box') return;

  const isPreOrder = prod ? String(prod.Status || prod.status || '').toLowerCase() === 'pre_order' : false;
  const targetStock = targetPack === 'card' ? (pricing.stockCard ?? 0) : (pricing.stockBox ?? 0);
  const targetPackLabel = targetPack === 'card' ? 'Bản Vỉ Card' : 'Bản Hộp Box';
  const existingTarget = cart.find((i, k) => k !== idx && i.productId == productId && (i.packType || 'box') === targetPack);
  const totalTargetQty = (existingTarget ? existingTarget.quantity : 0) + item.quantity;

  if (!isPreOrder && totalTargetQty > targetStock) {
    showToast(`Không thể chuyển! ${targetPackLabel} chỉ còn ${targetStock} xe trong kho.`, 'error');
    return;
  }

  const newUnitFinal = targetPack === 'card' ? pricing.finalPriceCard : pricing.finalPriceBox;
  const newUnitOrig = targetPack === 'card' ? pricing.priceCard : pricing.priceBox;
  const newDeposit = Math.round(newUnitFinal * (storeSettings.deposit_rate || 0.3));

  // Kiểm tra nếu đã có dòng cùng sản phẩm + targetPack thì gộp số lượng
  const duplicateIdx = cart.findIndex((i, k) => k !== idx && i.productId == productId && (i.packType || 'box') === targetPack);
  if (duplicateIdx !== -1) {
    cart[duplicateIdx].quantity += item.quantity;
    cart[duplicateIdx].price = newUnitFinal;
    cart[duplicateIdx].originalPrice = newUnitOrig;
    cart[duplicateIdx].depositAmount = newDeposit;
    cart.splice(idx, 1);
  } else {
    item.packType = targetPack;
    item.price = newUnitFinal;
    item.originalPrice = newUnitOrig;
    item.discountPercent = pricing.discountPercent;
    item.priceBox = pricing.priceBox;
    item.priceCard = pricing.priceCard;
    item.finalPriceBox = pricing.finalPriceBox;
    item.finalPriceCard = pricing.finalPriceCard;
    item.depositAmount = newDeposit;
  }

  selectedCardPackaging[productId] = targetPack;
  saveCart();
  renderCartDrawer();
  if (document.getElementById('checkoutModal')?.classList.contains('active')) {
    renderCheckoutStep1();
    if (typeof renderCheckoutStep3 === 'function') renderCheckoutStep3();
  }
}
window.switchCartItemPackaging = switchCartItemPackaging;

function saveCart() {
  localStorage.setItem('minigt_cart', JSON.stringify(cart));
  if (currentUser) {
    const uKey = currentUser.userId || currentUser.id || currentUser.email;
    if (uKey) {
      try { localStorage.setItem('minigt_cart_user_' + uKey, JSON.stringify(cart)); } catch (_) {}
    }
  }
  updateCartBadge();
}

function updateCartBadge() {
  const count = cart.reduce((acc, it) => acc + it.quantity, 0);
  const badge = document.getElementById('cartBadgeCount');
  const dockBadge = document.getElementById('dockCartBadge');
  const mobBadge = document.getElementById('mobCartBadgeCount');

  if (badge) {
    badge.textContent = count;
    badge.classList.remove('bump');
    void badge.offsetWidth;
    if (count > 0) {
      badge.classList.add('bump');
    }
  }

  if (dockBadge) {
    dockBadge.textContent = count;
    dockBadge.classList.remove('bump');
    void dockBadge.offsetWidth;
    if (count > 0) {
      dockBadge.classList.add('bump');
    }
  }

  if (mobBadge) {
    mobBadge.textContent = count;
  }
}

function changeCartQty(productId, delta, packType = null) {
  const it = cart.find(i => i.productId == productId && (!packType || (i.packType || 'box') === packType));
  if (!it) return;

  if (delta > 0) {
    const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == productId);
    if (prod) {
      const isPreOrder = String(prod.Status || prod.status || '').toLowerCase() === 'pre_order';
      if (!isPreOrder) {
        const pricing = getProductBoxCardPricing(prod);
        const itemPack = it.packType || 'box';
        const maxPackStock = itemPack === 'card' ? (pricing.stockCard ?? 0) : (pricing.stockBox ?? 0);
        const packLabel = itemPack === 'card' ? 'Bản Vỉ Card' : 'Bản Hộp Box';

        if (it.quantity + delta > maxPackStock) {
          showToast(`Mẫu này chỉ còn ${maxPackStock} xe (${packLabel}) trong kho.`, 'error');
          return;
        }

        const totalStock = typeof prod.Stock === 'number' ? prod.Stock : (typeof prod.stock === 'number' ? prod.stock : 999);
        const totalInCart = cart.filter(i => i.productId == productId).reduce((s, x) => s + x.quantity, 0);
        if (totalInCart + delta > totalStock) {
          showToast(`Tổng số lượng có thể đặt tối đa cho mẫu xe này là ${totalStock} xe.`, 'error');
          return;
        }
      }
    }
  }

  it.quantity += delta;
  if (it.quantity <= 0) {
    cart = cart.filter(i => !(i.productId == productId && (i.packType || 'box') === (it.packType || 'box')));
  }
  saveCart();
  renderCartDrawer();
}

function removeCartItem(productId, packType = null) {
  if (packType) {
    cart = cart.filter(i => !(i.productId == productId && (i.packType || 'box') === packType));
  } else {
    cart = cart.filter(i => i.productId != productId);
  }
  saveCart();
  renderCartDrawer();
  if (document.getElementById('checkoutModal')?.classList.contains('active')) {
    renderCheckoutStep1();
  }
}

function clearCart() {
  if (!cart.length) return;
  if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) return;
  cart = [];
  saveCart();
  renderCartDrawer();
  showToast('Đã xóa tất cả sản phẩm khỏi giỏ hàng', 'info');
}

function toggleCartItemSelection(productId, packType, isChecked) {
  const targetPack = packType || 'box';
  const item = cart.find(i => (i.productId == productId || i.id == productId) && (i.packType || 'box') === targetPack);
  if (item) {
    item.selected = Boolean(isChecked);
    saveCart();
    renderCartDrawer();
  }
}
window.toggleCartItemSelection = toggleCartItemSelection;

function toggleAllCartSelection(selectAll) {
  cart.forEach(it => {
    it.selected = Boolean(selectAll);
  });
  saveCart();
  renderCartDrawer();
}
window.toggleAllCartSelection = toggleAllCartSelection;

function renderCartDrawer() {
  const itemsContainer = document.getElementById('cartDrawerItems');
  const totalAmountEl = document.getElementById('cartTotalAmount');
  const depositAmountEl = document.getElementById('cartDepositAmount');
  const remainingAmountEl = document.getElementById('cartRemainingAmount');
  const headerCountPill = document.getElementById('cartHeaderCountPill');
  if (!itemsContainer) return;

  const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
  const totalQty = cart.reduce((acc, it) => acc + (it.quantity || 1), 0);
  if (headerCountPill) headerCountPill.textContent = totalQty;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <p style="font-size: 38px; margin-bottom: 10px; color:#cbd5e1;"><i class="fa-solid fa-cart-shopping"></i></p>
        <strong style="font-size:15px; color:#0f172a; display:block; margin-bottom:4px;">${isEn ? 'Your cart is empty' : 'Giỏ hàng của bạn đang trống'}</strong>
        <p style="font-size: 12px; margin: 0; color:#64748b;">${isEn ? 'Explore 1:64 Box & Blister Card models now!' : 'Khám phá các mẫu MINI GT 1:64 (Box & Card) ngay!'}</p>
      </div>
    `;
    if (totalAmountEl) totalAmountEl.textContent = '0đ';
    if (depositAmountEl) depositAmountEl.textContent = '0đ';
    if (remainingAmountEl) remainingAmountEl.textContent = '0đ';
    const checkoutBtn = document.querySelector('.btn-checkout-drawer');
    if (checkoutBtn) {
      const span = checkoutBtn.querySelector('span');
      if (span) span.textContent = isEn ? 'Cart is empty (0đ)' : 'Giỏ hàng trống (0đ)';
      checkoutBtn.style.opacity = '0.5';
      checkoutBtn.style.pointerEvents = 'none';
    }
    return;
  }

  // TÍNH TOÁN DỰA TRÊN SẢN PHẨM ĐƯỢC CHỌN (SELECTED)
  const selectedItems = cart.filter(it => it.selected !== false);
  const selectedCount = selectedItems.length;
  const selectedQty = selectedItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const isAllSelected = cart.length > 0 && selectedCount === cart.length;
  const isNoneSelected = selectedCount === 0;

  let total = 0;
  let totalDeposit = 0;

  const headerHtml = `
    <div class="cart-drawer-toolbar" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:10px 12px; background:#fff; border-radius:10px; border:1px solid #e2e8f0; gap:8px; flex-wrap:wrap;">
      <label class="cart-select-all-label" style="display:inline-flex; align-items:center; gap:8px; font-size:12.5px; font-weight:700; color:#1e293b; cursor:pointer; user-select:none;">
        <input type="checkbox" class="cart-select-checkbox" ${isAllSelected ? 'checked' : ''} onchange="toggleAllCartSelection(this.checked)" style="width:18px; height:18px; accent-color:#e10600; cursor:pointer;">
        <span>${isEn ? `Selected ${selectedCount}/${cart.length} (${selectedQty} pcs)` : `Đã chọn ${selectedCount}/${cart.length} mẫu (${selectedQty} chiếc)`}</span>
      </label>
      <div style="display:flex; align-items:center; gap:6px;">
        <button type="button" class="cart-unselect-all-btn" onclick="toggleAllCartSelection(false)" title="Bỏ chọn tất cả sản phẩm" style="background:${isNoneSelected ? '#f8fafc' : '#eff6ff'}; border:1px solid ${isNoneSelected ? '#e2e8f0' : '#bfdbfe'}; color:${isNoneSelected ? '#94a3b8' : '#2563eb'}; font-size:11.5px; font-weight:700; cursor:pointer; padding:4px 8px; border-radius:6px; transition:all 0.15s ease;">
          <i class="fa-solid fa-square-minus"></i> ${isEn ? 'Uncheck all' : 'Bỏ chọn tất cả'}
        </button>
        <button type="button" class="cart-select-all-btn" onclick="toggleAllCartSelection(true)" title="Chọn tất cả sản phẩm" style="background:#f1f5f9; border:1px solid #e2e8f0; color:#334155; font-size:11.5px; font-weight:700; cursor:pointer; padding:4px 8px; border-radius:6px; transition:all 0.15s ease;">
          <i class="fa-solid fa-check-double"></i> ${isEn ? 'Check all' : 'Chọn tất cả'}
        </button>
        <span style="color:#cbd5e1;">|</span>
        <button type="button" style="color:#dc2626; border:none; background:none; font-size:11.5px; cursor:pointer; font-weight:700; display:inline-flex; align-items:center; gap:3px; padding:4px 6px;" onclick="clearCart()" title="Xóa toàn bộ giỏ hàng">
          <i class="fa-solid fa-trash-can"></i> ${isEn ? 'Clear' : 'Xóa hết'}
        </button>
      </div>
    </div>
  `;

  const itemsHtml = cart.map(it => {
    const isSelected = it.selected !== false;
    const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == it.productId);
    const pricing = prod ? getProductBoxCardPricing(prod) : {
      packagingType: it.packagingType || 'both',
      discountPercent: it.discountPercent || 0,
      priceBox: it.priceBox || it.price || 350000,
      priceCard: it.priceCard || ((it.price || 350000) + 60000),
      finalPriceBox: it.finalPriceBox || it.price || 350000,
      finalPriceCard: it.finalPriceCard || ((it.price || 350000) + 60000)
    };
    const pack = it.packType || 'box';
    const unitPrice = pack === 'card' ? pricing.finalPriceCard : pricing.finalPriceBox;
    const origPrice = pack === 'card' ? pricing.priceCard : pricing.priceBox;
    it.price = unitPrice;

    const isPreOrder = Boolean(it.isPreOrder || (prod && String(prod.Status || prod.status || '').toLowerCase() === 'pre_order'));
    it.isPreOrder = isPreOrder;
    it.depositAmount = isPreOrder ? Math.round(unitPrice * 0.3) : 0;

    if (isSelected) {
      total += unitPrice * it.quantity;
      if (isPreOrder) {
        totalDeposit += it.depositAmount * it.quantity;
      }
    }

    const boxDisabled = pricing.packagingType === 'card_only' || (!isPreOrder && (pricing.stockBox ?? 0) <= 0);
    const cardDisabled = pricing.packagingType === 'box_only' || (!isPreOrder && (pricing.stockCard ?? 0) <= 0);

    // Xác định ảnh hợp lệ có fallback onerror
    let itemImg = it.imageUrl || (prod ? (prod.ImageUrl || prod.image) : 'image/hero-banner.jpg');
    if (itemImg.includes('amr24.webp')) itemImg = 'image/aston-amr24-alonso.png';
    else if (itemImg.includes('f1.webp')) itemImg = 'image/aston-amr24-stroll.png';
    else if (itemImg.includes('huracan.webp')) itemImg = 'image/lambo-sterrato-set.png';
    else if (itemImg.includes('lambo.webp')) itemImg = 'image/Minigt_Lambo_GT3.jpg';

    return `
      <div class="cart-item ${!isSelected ? 'is-unselected' : ''}" data-id="${it.productId}" data-pack="${pack}" style="${!isSelected ? 'opacity:0.62; background:#f8fafc; border-style:dashed;' : ''}">
        <div class="cart-item-select-wrap">
          <input type="checkbox" class="cart-select-checkbox" ${isSelected ? 'checked' : ''} onchange="toggleCartItemSelection(${it.productId}, '${pack}', this.checked)" title="Chọn/Bỏ chọn mẫu này để đặt cọc" style="width:18px; height:18px; accent-color:#e10600; cursor:pointer;">
        </div>
        <div class="cart-item-thumb-box">
          <img class="cart-item-thumb" src="${escapeHtml(itemImg)}" alt="${escapeHtml(it.name)}" loading="lazy" onerror="this.onerror=null; this.src='image/hero-banner.jpg';">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-meta-top">
            <span class="cart-item-sku">#${escapeHtml(it.sku || (prod && prod.Sku) || 'MGT')}</span>
            <span class="pack-badge ${pack === 'card' ? 'pack-card' : 'pack-box'}">${pack === 'card' ? '<i class="fa-solid fa-shield-halved"></i> VỈ CARD' : '<i class="fa-solid fa-cube"></i> HỘP BOX'}</span>
            <span class="cart-item-tag ${isPreOrder ? 'is-preorder' : 'is-instock'}">
              ${isPreOrder ? (isEn ? 'Pre-Order' : 'Cọc Trước') : (isEn ? 'In Stock' : 'Sẵn Kho')}
            </span>
          </div>
          <h4 class="cart-item-title" title="${escapeHtml(it.name)}">${escapeHtml(it.name)}</h4>
          <div class="cart-pack-switch" role="group" aria-label="Đổi Box / Card">
            <button type="button" class="cart-pack-btn is-box ${pack === 'box' ? 'active' : ''}" ${boxDisabled ? `disabled title="${pricing.packagingType === 'card_only' ? 'Chỉ có bản Card' : 'Hết hàng Bản Box'}"` : ''} onclick="switchCartItemPackaging(${it.productId}, '${pack}', 'box')">
              <i class="fa-solid fa-cube"></i> Box (${formatVND(pricing.finalPriceBox)}) ${pack === 'box' ? '<i class="fa-solid fa-check" style="font-size:10px; margin-left:2px;"></i>' : ''}
            </button>
            <button type="button" class="cart-pack-btn is-card ${pack === 'card' ? 'active' : ''}" ${cardDisabled ? `disabled title="${pricing.packagingType === 'box_only' ? 'Chỉ có bản Box' : 'Hết hàng Bản Card'}"` : ''} onclick="switchCartItemPackaging(${it.productId}, '${pack}', 'card')">
              <i class="fa-solid fa-shield-halved"></i> Card (${formatVND(pricing.finalPriceCard)}) ${pack === 'card' ? '<i class="fa-solid fa-check" style="font-size:10px; margin-left:2px;"></i>' : ''}
            </button>
          </div>
          <div class="cart-item-price-row">
            <div class="cart-item-price">
              ${formatVND(unitPrice)}
              ${pricing.discountPercent > 0 && origPrice > unitPrice ? `<span class="old-p">${formatVND(origPrice)}</span> <span style="font-size:10px; color:#e11d48; font-weight:800;">(-${pricing.discountPercent}%)</span>` : ''}
            </div>
            ${isPreOrder 
              ? `<span class="cart-deposit-hint">${isEn ? 'Deposit 30%:' : 'Cọc 30%:'} ${formatVND(it.depositAmount * it.quantity)}</span>`
              : `<span class="cart-deposit-hint" style="color:#059669; font-weight:700;"><i class="fa-solid fa-circle-check"></i> ${isEn ? 'In Stock (100%)' : 'Sẵn kho 100%'}</span>`
            }
          </div>
          <div class="cart-item-actions">
            <div class="cart-stepper">
              <button type="button" aria-label="Giảm" onclick="changeCartQty(${it.productId}, -1, '${pack}')">-</button>
              <span>${it.quantity}</span>
              <button type="button" aria-label="Tăng" onclick="changeCartQty(${it.productId}, 1, '${pack}')">+</button>
            </div>
            <button type="button" class="cart-item-remove-btn" title="Xóa mẫu này" onclick="removeCartItem(${it.productId}, '${pack}')">
              <i class="fa-regular fa-trash-can"></i> ${isEn ? 'Remove' : 'Xóa'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  itemsContainer.innerHTML = headerHtml + itemsHtml;

  const hasAnyPreOrder = selectedItems.some(it => {
    const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == it.productId);
    return it.isPreOrder || (prod && String(prod.Status || prod.status || '').toLowerCase() === 'pre_order');
  });

  const isCodEligible = typeof isCustomerCodEligible === 'function' ? isCustomerCodEligible() : false;
  const deliveredSpent = typeof getCustomerDeliveredSpent === 'function' ? getCustomerDeliveredSpent() : 0;
  const isVip4Plus = isCodEligible || deliveredSpent >= 1000000;

  // Cập nhật tiêu đề drawer theo loại hàng (Pre-Order vs Sẵn kho)
  const drawerTitleEl = document.querySelector('.cart-drawer-title-row h3');
  if (drawerTitleEl) {
    drawerTitleEl.textContent = hasAnyPreOrder 
      ? (isEn ? 'Pre-Order Cart (Deposit)' : 'Giỏ Đặt Cọc Mô Hình (Pre-Order)')
      : (isEn ? 'Shopping Cart (In Stock)' : 'Giỏ Hàng Mua Sắm (Hàng Có Sẵn)');
  }

  const totalRemaining = Math.max(0, total - totalDeposit);
  if (totalAmountEl) totalAmountEl.textContent = formatVND(total);
  if (depositAmountEl) depositAmountEl.textContent = formatVND(totalDeposit);
  if (remainingAmountEl) remainingAmountEl.textContent = formatVND(totalRemaining);

  const depositRow = document.querySelector('.cart-summary-row.highlight-deposit');
  const remainingRow = document.querySelector('.cart-summary-row.remaining-row');
  
  if (!hasAnyPreOrder) {
    if (depositRow) {
      depositRow.style.display = 'flex';
      depositRow.innerHTML = `
        <span class="summary-label" style="color:#047857;"><i class="fa-solid fa-money-bill-wave"></i> ${isEn ? 'Payment Mode:' : 'Hình thức:'}</span>
        <span class="summary-val deposit-val" style="color:#047857; font-size:12px; font-weight:800;">${isVip4Plus ? 'Thanh toán tiền mặt (COD 100%)' : 'Thanh toán đủ 100%'}</span>
      `;
    }
    if (remainingRow) {
      remainingRow.style.display = 'none';
    }
  } else {
    if (depositRow) {
      depositRow.style.display = 'flex';
      depositRow.innerHTML = `
        <span class="summary-label"><i class="fa-solid fa-shield-halved"></i> ${isEn ? 'Deposit (30%):' : 'Tiền cọc giữ mẫu (30%):'}</span>
        <span class="summary-val deposit-val" id="cartDepositAmount">${formatVND(totalDeposit)}</span>
      `;
    }
    if (remainingRow) {
      remainingRow.style.display = 'flex';
      remainingRow.innerHTML = `
        <span class="summary-label"><i class="fa-solid fa-hand-holding-dollar"></i> ${isEn ? 'Remaining (70%):' : 'Còn lại khi nhận xe (70%):'}</span>
        <span class="summary-val" id="cartRemainingAmount">${formatVND(totalRemaining)}</span>
      `;
    }
  }

  const checkoutBtn = document.querySelector('.btn-checkout-drawer');
  if (checkoutBtn) {
    const span = checkoutBtn.querySelector('span');
    checkoutBtn.style.pointerEvents = 'auto';
    if (isNoneSelected) {
      checkoutBtn.classList.add('disabled-empty');
      checkoutBtn.style.opacity = '0.6';
      if (span) span.textContent = isEn ? 'No models selected (0đ)' : 'Chưa chọn mẫu xe nào (0đ)';
    } else if (hasAnyPreOrder) {
      checkoutBtn.classList.remove('disabled-empty');
      checkoutBtn.style.opacity = '1';
      if (span) span.textContent = isEn ? `Proceed to Pre-Order (${formatVND(totalDeposit)})` : `Tiến Hành Đặt Cọc Ngay (${formatVND(totalDeposit)})`;
    } else {
      checkoutBtn.classList.remove('disabled-empty');
      checkoutBtn.style.opacity = '1';
      if (span) span.textContent = isEn ? `Proceed to Checkout (${formatVND(total)})` : `Tiến Hành Mua Hàng (${formatVND(total)})`;
    }
  }
}

function openCartDrawer() {
  renderCartDrawer();
  const overlay = document.getElementById('cartDrawerOverlay');
  if (overlay) overlay.classList.add('active');
}

function closeCartDrawer() {
  const overlay = document.getElementById('cartDrawerOverlay');
  if (overlay) overlay.classList.remove('active');
}

// =====================================================================
// 10. MODAL XEM NHANH SẢN PHẨM (QUICK VIEW VỚI CHỌN BOX / CARD & TRỪ % TRỰC TIẾP)
// =====================================================================
function openQuickView(productId) {
  const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == productId);
  if (!prod) return;

  const modal = document.getElementById('quickViewModal');
  const body = document.getElementById('quickViewModalBody');
  if (!modal || !body) return;

  const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
  const pId = prod.ProductId || prod.id;
  const pName = prod.Name || prod.name;
  let pImg = prod.ImageUrl || prod.image || 'image/hero-banner.jpg';
  if ((pImg.startsWith('/api/images/') || pImg.startsWith('/images/')) && typeof api !== 'undefined' && api.BASE_URL) {
    pImg = api.BASE_URL.replace(/\/+$/, '') + pImg;
  }
  if (pImg.includes('amr24.webp')) pImg = 'image/aston-amr24-alonso.png';
  else if (pImg.includes('f1.webp')) pImg = 'image/aston-amr24-stroll.png';
  else if (pImg.includes('huracan.webp')) pImg = 'image/lambo-sterrato-set.png';
  else if (pImg.includes('lambo.webp')) pImg = 'image/Minigt_Lambo_GT3.jpg';
  const pSku = prod.Sku || prod.sku;
  const pBrand = prod.Brand || prod.brand || 'MINI GT';
  const pScale = prod.Scale || prod.scale || '1:64';
  const pDesc = prod.Description || prod.description || 'Mô hình diecast tỉ lệ 1:64 chính hãng bản quyền, thân kim loại nguyên khối, lốp cao su Real Riders.';
  const pStock = typeof prod.Stock === 'number' ? prod.Stock : (typeof prod.stock === 'number' ? prod.stock : 0);
  const isPreOrder = String(prod.Status || prod.status || '').toLowerCase() === 'pre_order';
  const isSoldOut = String(prod.Status || prod.status || '').toLowerCase() === 'sold_out' || pStock <= 0;
  const isWish = isInWishlist(pId);

  const pricing = getProductBoxCardPricing(prod);
  const activePack = getSelectedPackForProduct(prod);
  const currentFinal = activePack === 'card' ? pricing.finalPriceCard : pricing.finalPriceBox;
  const currentOrig = activePack === 'card' ? pricing.priceCard : pricing.priceBox;
  const diffPrice = Math.max(40000, pricing.finalPriceCard - pricing.finalPriceBox);
  const expectedArrival = prod.ExpectedDelivery || prod.expectedDelivery || (isPreOrder ? 'Tháng 11/2026 (Có thể trễ hơn dự kiến)' : null);
  const depPct = Number(prod.DepositPercent || prod.depositPercent || 30);

  const isBoxDisabled = !pricing.isBoxAvailable;
  const isCardDisabled = !pricing.isCardAvailable;
  const boxReason = pricing.packagingType === 'card_only'
    ? (isEn ? 'No Box' : 'Không có Box')
    : (pricing.stockBox <= 0 ? (isEn ? 'Out of Box' : 'Hết Box') : '');
  const cardReason = pricing.packagingType === 'box_only'
    ? (isEn ? 'No Card' : 'Không có Card')
    : (pricing.stockCard <= 0 ? (isEn ? 'Out of Card' : 'Hết Card') : '');

  body.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; align-items: start;">
      <div style="background: #f8fafc; border-radius: 14px; padding: 1.5rem; text-align: center; border: 1px solid #e2e8f0; position: relative;">
        ${pricing.hasDiscount && !isSoldOut ? `<span style="position:absolute; top:12px; left:12px; background:#e11d48; color:#fff; font-size:11px; font-weight:800; padding:4px 10px; border-radius:6px;">-${pricing.discountPercent}% TRỰC TIẾP</span>` : ''}
        <img src="${pImg}" alt="${escapeHtml(pName)}" style="max-height: 240px; margin: 0 auto; object-fit: contain;" onerror="this.onerror=null; this.src='image/hero-banner.jpg';">
      </div>
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
          <span class="badge ${isPreOrder ? 'badge-preorder' : (isSoldOut ? 'badge-soldout' : 'badge-instock')}">
            ${isPreOrder ? 'PRE-ORDER 2026' : (isSoldOut ? (isEn ? 'SOLD OUT' : 'HẾT HÀNG') : (isEn ? 'IN STOCK' : 'SẴN HÀNG GIAO NGAY'))}
          </span>
          <span style="font-size:12px; color:#64748b; font-weight:700;">#${escapeHtml(pSku)} • ${escapeHtml(pScale)}</span>
        </div>
        <h2 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 8px; color: #0f172a; line-height: 1.35;">${escapeHtml(pName)}</h2>

        <div id="qvPriceBox_${pId}" style="margin-bottom: 12px; padding: 10px 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
          <div style="display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;">
            <span id="qvCurrentPrice_${pId}" style="font-size: 1.45rem; font-weight: 800; color: #e11d48;">${formatVND(currentFinal)}</span>
            <span id="qvOldPrice_${pId}" style="font-size: 0.9rem; color: #94a3b8; text-decoration: line-through; display: ${pricing.hasDiscount && currentOrig > currentFinal ? 'inline' : 'none'};">${formatVND(currentOrig)}</span>
            ${pricing.hasDiscount ? `<span style="font-size:11px; font-weight:800; color:#059669; background:#ecfdf5; padding:2px 8px; border-radius:99px;">Đã trừ ${pricing.discountPercent}% (-${formatVND(currentOrig - currentFinal)})</span>` : ''}
          </div>
          <div id="qvPackHint_${pId}" style="font-size:11.5px; color:#475569; margin-top:4px; font-weight:600;">
            ${activePack === 'box'
              ? `📦 Bản Hộp Giấy (Box) nguyên seal — Rẻ hơn bản Card ${formatVND(diffPrice)}`
              : `🛡️ Bản Vỉ Nhựa (Card Blister) seal trưng bày chống bụi cao cấp`}
          </div>
        </div>

        ${isPreOrder && expectedArrival ? `
          <div style="margin-bottom: 12px; padding: 10px 14px; background: #f5f3ff; border-radius: 10px; border: 1.5px solid #c4b5fd; color: #5b21b6;">
            <div style="font-weight: 800; font-size: 12.5px; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-calendar-check" style="color: #7c3aed;"></i> THÔNG TIN ĐỢT HÀNG PRE-ORDER
            </div>
            <div style="margin-top: 5px; font-size: 12.5px; color: #4c1d95;">
              📅 <strong>Hàng dự kiến về kho:</strong> <span style="font-weight: 800; color: #6d28d9;">${escapeHtml(expectedArrival)}</span>
            </div>
            <div style="margin-top: 4px; font-size: 11.5px; color: #6d28d9; line-height: 1.45;">
              🔒 <strong>Chính sách đặt cọc:</strong> Khách hàng chỉ cọc trước <strong>${depPct}%</strong> giá bán. Khi lô xe cập bến tại cửa hàng Biên Hòa, Admin sẽ chủ động liên hệ gửi thông báo qua Zalo / Email hoặc gọi điện thoại trực tiếp trước khi giao.
            </div>
          </div>
        ` : ''}

        <div style="font-size:11.5px; font-weight:800; color:#334155; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px;">
          ${isEn ? 'Select Packaging (Box vs Blister Card):' : 'Chọn quy cách đóng gói (Box / Card):'}
        </div>
        <div class="qv-pack-selector" id="qvPackSelector_${pId}">
          <div class="qv-pack-option ${activePack === 'box' ? 'active' : ''} ${isBoxDisabled ? 'disabled' : ''}" ${isBoxDisabled ? `title="${boxReason}"` : `onclick="selectQuickViewPack(${pId}, 'box')"`}>
            <div class="qv-pack-option-title">
              <i class="fa-solid fa-cube" style="color:${isBoxDisabled ? '#94a3b8' : '#0284c7'};"></i>
              ${isBoxDisabled ? `<del>${isEn ? 'Paper Box' : 'Hộp Giấy (Box)'}</del><span class="qv-pack-disabled-badge">${boxReason}</span>` : (isEn ? 'Paper Box' : 'Hộp Giấy (Box)')}
            </div>
            <div class="qv-pack-option-price">${formatVND(pricing.finalPriceBox)} ${pricing.hasDiscount ? `<span style="font-size:10.5px; color:#94a3b8; text-decoration:line-through; font-weight:500;">${formatVND(pricing.priceBox)}</span>` : ''}</div>
            <div class="qv-pack-option-sub">${isBoxDisabled ? (isEn ? 'Unavailable' : 'Không có sẵn') : (isEn ? `Saves ${formatVND(diffPrice)} vs Card` : `Tiết kiệm ${formatVND(diffPrice)} so với Card`)}</div>
          </div>
          <div class="qv-pack-option ${activePack === 'card' ? 'active' : ''} ${isCardDisabled ? 'disabled' : ''}" ${isCardDisabled ? `title="${cardReason}"` : `onclick="selectQuickViewPack(${pId}, 'card')"`}>
            <div class="qv-pack-option-title">
              <i class="fa-solid fa-shield-halved" style="color:${isCardDisabled ? '#94a3b8' : '#e11d48'};"></i>
              ${isCardDisabled ? `<del>${isEn ? 'Blister Card' : 'Vỉ Nhựa (Card)'}</del><span class="qv-pack-disabled-badge">${cardReason}</span>` : (isEn ? 'Blister Card' : 'Vỉ Nhựa (Card)')}
            </div>
            <div class="qv-pack-option-price">${formatVND(pricing.finalPriceCard)} ${pricing.hasDiscount ? `<span style="font-size:10.5px; color:#94a3b8; text-decoration:line-through; font-weight:500;">${formatVND(pricing.priceCard)}</span>` : ''}</div>
            <div class="qv-pack-option-sub">${isCardDisabled ? (isEn ? 'Unavailable' : 'Không có sẵn') : (isEn ? 'Collector display blister' : 'Vỉ nhựa trưng bày kèm hộp giấy')}</div>
          </div>
        </div>

        <p style="font-size: 12.5px; color: #475569; margin: 12px 0; line-height: 1.55;">
          ${escapeHtml(pDesc)}
        </p>

        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button class="btn btn-primary" id="qvActionBtn_${pId}" style="flex: 1;" ${isSoldOut ? 'disabled' : ''} onclick="handleCardAction(${pId}, event, selectedCardPackaging[${pId}] || '${activePack}'); closeModal('quickViewModal');">
            ${isSoldOut
              ? (isEn ? 'Sold Out' : 'Hết hàng')
              : `<i class="fa-solid fa-bag-shopping" style="margin-right:6px;"></i> ${isPreOrder ? (isEn ? 'Pre-Order' : 'Đặt cọc') : (isEn ? 'Buy Now' : 'Mua ngay')} (${activePack === 'card' ? 'Card' : 'Box'} - ${formatVND(currentFinal)})`}
          </button>
          <button type="button" class="btn btn-outline" id="quickViewWishlistBtn" style="min-width: 44px; padding: 0 12px;" onclick="toggleWishlist(${pId}, event);" title="${isWish ? 'Đã lưu yêu thích' : 'Yêu thích'}">
            <i class="fa-${isWish ? 'solid' : 'regular'} fa-heart" style="color:${isWish ? '#dc2626' : 'inherit'}; font-size: 14px;"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function selectQuickViewPack(productId, packType) {
  const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == productId);
  if (!prod) return;

  const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
  const pricing = getProductBoxCardPricing(prod);
  const chosen = packType === 'card' ? 'card' : 'box';
  if (chosen === 'box' && !pricing.isBoxAvailable) return;
  if (chosen === 'card' && !pricing.isCardAvailable) return;

  selectCardPackaging(productId, packType);
  const finalPrice = chosen === 'card' ? pricing.finalPriceCard : pricing.finalPriceBox;
  const origPrice = chosen === 'card' ? pricing.priceCard : pricing.priceBox;
  const diffPrice = Math.max(40000, pricing.finalPriceCard - pricing.finalPriceBox);
  const isPreOrder = String(prod.Status || prod.status || '').toLowerCase() === 'pre_order';

  const selector = document.getElementById(`qvPackSelector_${productId}`);
  if (selector) {
    const opts = selector.querySelectorAll('.qv-pack-option');
    if (opts.length >= 2) {
      opts[0].classList.toggle('active', chosen === 'box');
      opts[1].classList.toggle('active', chosen === 'card');
    }
  }

  const currEl = document.getElementById(`qvCurrentPrice_${productId}`);
  if (currEl) currEl.textContent = formatVND(finalPrice);

  const oldEl = document.getElementById(`qvOldPrice_${productId}`);
  if (oldEl) {
    if (pricing.hasDiscount && origPrice > finalPrice) {
      oldEl.textContent = formatVND(origPrice);
      oldEl.style.display = 'inline';
    } else {
      oldEl.style.display = 'none';
    }
  }

  const hintEl = document.getElementById(`qvPackHint_${productId}`);
  if (hintEl) {
    hintEl.textContent = chosen === 'box'
      ? `📦 Bản Hộp Giấy (Box) nguyên seal — Rẻ hơn bản Card ${formatVND(diffPrice)}`
      : `🛡️ Bản Vỉ Nhựa (Card Blister) seal trưng bày chống bụi cao cấp`;
  }

  const actionBtn = document.getElementById(`qvActionBtn_${productId}`);
  if (actionBtn && !actionBtn.disabled) {
    actionBtn.innerHTML = `<i class="fa-solid fa-bag-shopping" style="margin-right:6px;"></i> ${isPreOrder ? (isEn ? 'Pre-Order' : 'Đặt cọc') : (isEn ? 'Buy Now' : 'Mua ngay')} (${chosen === 'card' ? 'Card' : 'Box'} - ${formatVND(finalPrice)})`;
  }
}
window.selectQuickViewPack = selectQuickViewPack;

// =====================================================================
// 11. CHECKOUT & TẠO MÃ VIETQR TỰ ĐỘNG (NÂNG CẤP LOGIC VẬN HÀNH & COLLECTOR)
// =====================================================================
let currentCheckoutStep = 1;
let selectedCheckoutPaymentMethod = 'DEPOSIT';
let checkoutShippingMode = 'SPX_STANDARD';
let checkoutBoxProtector = false;
let checkoutAppliedVoucher = null;

function calculateCheckoutTotals() {
  const selectedItems = cart.filter(it => it.selected !== false);
  const subtotal = selectedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);

  const hasPreOrder = selectedItems.some(it => {
    const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == it.productId);
    return it.isPreOrder || (prod && String(prod.Status || prod.status || '').toLowerCase() === 'pre_order');
  });

  const totalDepositRaw = selectedItems
    .filter(it => {
      const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == it.productId);
      return it.isPreOrder || (prod && String(prod.Status || prod.status || '').toLowerCase() === 'pre_order');
    })
    .reduce((acc, it) => acc + ((it.depositAmount || Math.round(it.price * 0.3)) * it.quantity), 0);

  let shippingFee = 11000;
  let shippingLabel = 'SPX Express Tiêu Chuẩn (Đồng giá toàn quốc)';
  if (checkoutShippingMode === 'BOX_SAVER') {
    shippingFee = 0;
    shippingLabel = 'Gom đơn lưu kho (Box Saver - Miễn phí lưu kho)';
  } else if (checkoutShippingMode === 'SHOWROOM_PICKUP') {
    shippingFee = 0;
    shippingLabel = 'Nhận trực tiếp tại Showroom Biên Hòa (0đ)';
  }

  const protectorFee = checkoutBoxProtector ? 15000 : 0;

  let voucherDiscount = 0;
  let voucherDesc = '';
  if (checkoutAppliedVoucher) {
    if (checkoutAppliedVoucher.minOrderAmount && subtotal < checkoutAppliedVoucher.minOrderAmount) {
      voucherDiscount = 0;
      voucherDesc = `(Chưa đạt đơn tối thiểu ${formatVND(checkoutAppliedVoucher.minOrderAmount)})`;
    } else if (checkoutAppliedVoucher.discountType === 'percent') {
      const pct = Math.min(10, Math.max(1, Number(checkoutAppliedVoucher.discountValue || 0)));
      voucherDiscount = Math.round(subtotal * (pct / 100));
      if (checkoutAppliedVoucher.maxDiscount && voucherDiscount > checkoutAppliedVoucher.maxDiscount) {
        voucherDiscount = checkoutAppliedVoucher.maxDiscount;
      }
    } else {
      voucherDiscount = Math.min(subtotal, Number(checkoutAppliedVoucher.discountValue || checkoutAppliedVoucher.discount || 0));
    }
    if (voucherDiscount > 0) {
      voucherDesc = checkoutAppliedVoucher.description || `Mã ${checkoutAppliedVoucher.code} (-${formatVND(voucherDiscount)})`;
    }
  }

  const grandTotal = Math.max(0, subtotal + shippingFee + protectorFee - voucherDiscount);
  const isDepositChosen = typeof selectedCheckoutPaymentMethod !== 'undefined' && selectedCheckoutPaymentMethod === 'DEPOSIT';
  const inStockDeposit = Math.min(grandTotal, Math.max(50000, Math.round(grandTotal * 0.3)));
  const depositAmount = hasPreOrder 
    ? Math.min(grandTotal, totalDepositRaw) 
    : (isDepositChosen ? inStockDeposit : 0);

  return {
    subtotal,
    shippingFee,
    shippingLabel,
    protectorFee,
    voucherDiscount,
    voucherDesc,
    grandTotal,
    depositAmount,
    hasPreOrder
  };
}

function handleCheckoutAddonChange() {
  const shipEl = document.getElementById('checkoutShippingMode');
  const boxEl = document.getElementById('checkoutBoxProtectorCheck');
  if (shipEl) checkoutShippingMode = shipEl.value || 'SPX_STANDARD';
  if (boxEl) checkoutBoxProtector = Boolean(boxEl.checked);
  renderCheckoutStep3();
}

function selectVoucherChip(code) {
  const input = document.getElementById('checkoutVoucherInput');
  if (input) {
    input.value = code;
    applyCheckoutVoucher();
  }
}

async function renderCheckoutVoucherChips() {
  const container = document.getElementById('checkoutVoucherChipsContainer');
  if (!container) return;

  const user = (api && api.getCurrentUser) ? api.getCurrentUser() : (typeof currentUser !== 'undefined' ? currentUser : null);
  const spent = typeof getCustomerDeliveredSpent === 'function' ? getCustomerDeliveredSpent() : 0;
  const vip = typeof getCustomerVipInfo === 'function' ? getCustomerVipInfo(spent) : { level: 1, label: 'VIP 1' };

  let chipsHtml = '';

  // 1. Mã đặc quyền VIP theo cấp bậc tài khoản (tối đa 10%)
  if (user && vip.level >= 2) {
    const vipCode = `VIP${vip.level}`;
    const vipPct = vip.level === 2 ? 2 : (vip.level === 3 ? 4 : (vip.level === 4 ? 7 : 10));
    const isVipActive = checkoutAppliedVoucher && checkoutAppliedVoucher.code === vipCode;
    chipsHtml += `
      <button type="button" class="voucher-chip-btn vip-chip ${isVipActive ? 'active' : ''}" onclick="selectVoucherChip('${vipCode}')" title="Mã giảm giá đặc quyền ${vip.label} (Giảm ${vipPct}%)">
        <i class="fa-solid fa-crown" style="color:#d97706;"></i> ${vipCode} (VIP ${vip.level} -${vipPct}%)
      </button>
    `;
  }

  // 2. Lấy danh sách mã giảm giá do Admin tạo từ backend
  try {
    const res = await safeFetch('/api/coupons');
    const adminCoupons = (res && res.success && Array.isArray(res.data)) ? res.data : [];
    adminCoupons.slice(0, 4).forEach(c => {
      const isPct = c.discountType === 'percent';
      const label = isPct ? `-${c.discountValue}%` : `-${Math.round(c.discountValue / 1000)}k`;
      const isActive = checkoutAppliedVoucher && checkoutAppliedVoucher.code === c.code;
      chipsHtml += `
        <button type="button" class="voucher-chip-btn ${isActive ? 'active' : ''}" onclick="selectVoucherChip('${escapeHtml(c.code)}')" title="${escapeHtml(c.description || '')} (Đơn từ ${formatVND(c.minOrderAmount || 0)})">
          <i class="fa-solid fa-ticket" style="color:#2563eb;"></i> ${escapeHtml(c.code)} (${label})
        </button>
      `;
    });
  } catch (_) {}

  container.innerHTML = chipsHtml || `
    <span style="font-size:11.5px; color:#64748b; font-style:italic;">
      <i class="fa-solid fa-circle-info"></i> Nhập mã ưu đãi từ Showroom hoặc thăng hạng VIP để nhận thêm chiết khấu.
    </span>
  `;
}

async function applyCheckoutVoucher() {
  const input = document.getElementById('checkoutVoucherInput');
  const statusEl = document.getElementById('checkoutVoucherStatus');
  const rawCode = (input ? input.value : '').trim().toUpperCase();

  document.querySelectorAll('.voucher-chip-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(rawCode) && rawCode.length > 0);
  });

  if (!rawCode) {
    checkoutAppliedVoucher = null;
    if (statusEl) {
      statusEl.style.color = '#64748b';
      statusEl.innerHTML = 'Chưa áp dụng mã ưu đãi nào.';
    }
    renderCheckoutStep3();
    return;
  }

  const totals = calculateCheckoutTotals();
  const user = (api && api.getCurrentUser) ? api.getCurrentUser() : (typeof currentUser !== 'undefined' ? currentUser : null);
  const phone = document.getElementById('checkoutPhone')?.value.trim() || user?.phone || localStorage.getItem('minigt_customer_phone') || '';
  const email = document.getElementById('checkoutEmail')?.value.trim() || user?.email || '';

  try {
    const res = await safeFetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: rawCode,
        subtotal: totals.subtotal,
        user,
        phone,
        email
      })
    });

    if (res && res.success && res.data) {
      checkoutAppliedVoucher = res.data;
      if (res.data.code && input) {
        input.value = res.data.code;
      }
      const newTotals = calculateCheckoutTotals();
      if (statusEl) {
        statusEl.style.color = '#059669';
        statusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Đã áp dụng mã <strong>${escapeHtml(res.data.code || rawCode)}</strong>: Giảm ngay <strong>${formatVND(newTotals.voucherDiscount)}</strong> (${escapeHtml(res.data.description || newTotals.voucherDesc)})`;
      }
      showToast(`Áp dụng mã ${res.data.code || rawCode} thành công! Giảm ${formatVND(newTotals.voucherDiscount)}`, 'success');
    } else {
      checkoutAppliedVoucher = null;
      const errMsg = res?.message || `Mã giảm giá "${rawCode}" không hợp lệ hoặc đã hết hạn!`;
      if (statusEl) {
        statusEl.style.color = '#dc2626';
        statusEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${escapeHtml(errMsg)}`;
      }
      showToast(errMsg, 'error', 4500);
    }
  } catch (err) {
    checkoutAppliedVoucher = null;
    if (statusEl) {
      statusEl.style.color = '#dc2626';
      statusEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${escapeHtml(err.message || 'Lỗi kiểm tra mã!')}`;
    }
    showToast(err.message || 'Lỗi kiểm tra mã ưu đãi!', 'error');
  }

  renderCheckoutStep3();
}
window.selectVoucherChip = selectVoucherChip;
window.applyCheckoutVoucher = applyCheckoutVoucher;
window.renderCheckoutVoucherChips = renderCheckoutVoucherChips;

let currentCheckoutAddressType = 'NEW';

const KNOWN_MERGED_MAP = [
  { match: /hòa\s*bình/i, oldName: 'P. Hòa Bình', newName: 'P. Quang Vinh', city: 'TP. Biên Hòa' },
  { match: /thanh\s*bình/i, oldName: 'P. Thanh Bình', newName: 'P. Quyết Thắng', city: 'TP. Biên Hòa' },
  { match: /tam\s*hòa/i, oldName: 'P. Tam Hòa', newName: 'P. Bình Đa', city: 'TP. Biên Hòa' },
  { match: /quận\s*2|quận\s*9|quận\s*thủ\s*đức/i, oldName: 'Q.2 / Q.9 / Q.Thủ Đức', newName: 'TP. Thủ Đức', city: 'TP.HCM' },
  { match: /phường\s*6\s*,\s*quận\s*3|phường\s*7\s*,\s*quận\s*3|phường\s*8\s*,\s*quận\s*3/i, oldName: 'P.6 / P.7 / P.8 (Q.3)', newName: 'Phường Võ Thị Sáu (Quận 3)', city: 'TP.HCM' }
];

function handleCheckoutAddressTypeChange(type) {
  currentCheckoutAddressType = type === 'OLD' ? 'OLD' : 'NEW';
  const badge = document.getElementById('checkoutAddrTypeBadge');
  const cardNew = document.getElementById('addrCardNew');
  const cardOld = document.getElementById('addrCardOld');
  const helper = document.getElementById('checkoutOldAddrHelper');

  if (currentCheckoutAddressType === 'OLD') {
    if (badge) {
      badge.textContent = '⚠️ Địa chỉ CŨ (Trước sáp nhập)';
      badge.style.background = '#fffbeb';
      badge.style.color = '#b45309';
      badge.style.borderColor = '#fde68a';
    }
    if (cardNew) {
      cardNew.classList.remove('active');
      cardNew.style.borderColor = '#cbd5e1';
    }
    if (cardOld) {
      cardOld.classList.add('active');
      cardOld.style.borderColor = 'var(--color-primary)';
    }
    if (helper) helper.style.display = 'block';
  } else {
    if (badge) {
      badge.textContent = '✓ Địa chỉ MỚI (Sau sáp nhập)';
      badge.style.background = '#ecfdf5';
      badge.style.color = '#047857';
      badge.style.borderColor = '#a7f3d0';
    }
    if (cardNew) {
      cardNew.classList.add('active');
      cardNew.style.borderColor = 'var(--color-primary)';
    }
    if (cardOld) {
      cardOld.classList.remove('active');
      cardOld.style.borderColor = '#cbd5e1';
    }
    if (helper) helper.style.display = 'none';
  }
  saveCheckoutFormState();
}

function handleAddressInputDebounced(val) {
  saveCheckoutFormState();
  const tip = document.getElementById('checkoutAddrMatchTip');
  if (!tip) return;
  if (!val || val.length < 3) {
    tip.style.display = 'none';
    return;
  }

  const matched = KNOWN_MERGED_MAP.find(m => m.match.test(val));
  if (matched) {
    tip.style.display = 'block';
    tip.innerHTML = `<i class="fa-solid fa-circle-info"></i> <strong>Lưu ý sáp nhập ĐVHC (${matched.city}):</strong> Địa chỉ có chứa <strong>${matched.oldName}</strong> cũ. Trong hệ thống SPX Express, khu vực này tương ứng là <strong>${matched.newName}</strong>. Shop sẽ tự động bổ sung ghi chú để shipper phát chuẩn xác!`;
  } else {
    tip.style.display = 'none';
  }
}

function handleRegAddressTypeChange(type) {
  const isOld = type === 'OLD';
  const cardNew = document.getElementById('regAddrCardNew');
  const cardOld = document.getElementById('regAddrCardOld');
  const helper = document.getElementById('regOldAddrHelper');
  if (isOld) {
    if (cardOld) { cardOld.classList.add('active'); cardOld.style.borderColor = 'var(--color-primary)'; }
    if (cardNew) { cardNew.classList.remove('active'); cardNew.style.borderColor = '#cbd5e1'; }
    if (helper) helper.style.display = 'block';
  } else {
    if (cardNew) { cardNew.classList.add('active'); cardNew.style.borderColor = 'var(--color-primary)'; }
    if (cardOld) { cardOld.classList.remove('active'); cardOld.style.borderColor = '#cbd5e1'; }
    if (helper) helper.style.display = 'none';
  }
}

function handleRegAddressInput(val) {
  const tip = document.getElementById('regAddrMatchTip');
  if (!tip) return;
  if (!val || val.length < 3) {
    tip.style.display = 'none';
    return;
  }
  const matched = KNOWN_MERGED_MAP.find(m => m.match.test(val));
  if (matched) {
    tip.style.display = 'block';
    tip.innerHTML = `<i class="fa-solid fa-circle-info"></i> <strong>Lưu ý (${matched.city}):</strong> Địa chỉ có chứa <strong>${matched.oldName}</strong> cũ. Trong hệ thống SPX Express, khu vực này tương ứng là <strong>${matched.newName}</strong>.`;
  } else {
    tip.style.display = 'none';
  }
}

function handleProfileAddressTypeChange(type) {
  const isOld = type === 'OLD';
  const cardNew = document.getElementById('profileAddrCardNew');
  const cardOld = document.getElementById('profileAddrCardOld');
  const helper = document.getElementById('profileOldAddrHelper');
  if (isOld) {
    if (cardOld) { cardOld.classList.add('active'); cardOld.style.borderColor = '#dc2626'; }
    if (cardNew) { cardNew.classList.remove('active'); cardNew.style.borderColor = '#cbd5e1'; }
    if (helper) helper.style.display = 'block';
  } else {
    if (cardNew) { cardNew.classList.add('active'); cardNew.style.borderColor = '#dc2626'; }
    if (cardOld) { cardOld.classList.remove('active'); cardOld.style.borderColor = '#cbd5e1'; }
    if (helper) helper.style.display = 'none';
  }
}

function handleEditShippingAddressTypeChange(type) {
  const isOld = type === 'OLD';
  const cardNew = document.getElementById('editShippingCardNew');
  const cardOld = document.getElementById('editShippingCardOld');
  const helper = document.getElementById('editShippingOldAddrHelper');
  if (isOld) {
    if (cardOld) { cardOld.classList.add('active'); cardOld.style.borderColor = 'var(--color-primary)'; }
    if (cardNew) { cardNew.classList.remove('active'); cardNew.style.borderColor = '#cbd5e1'; }
    if (helper) helper.style.display = 'block';
  } else {
    if (cardNew) { cardNew.classList.add('active'); cardNew.style.borderColor = 'var(--color-primary)'; }
    if (cardOld) { cardOld.classList.remove('active'); cardOld.style.borderColor = '#cbd5e1'; }
    if (helper) helper.style.display = 'none';
  }
}

window.handleCheckoutAddressTypeChange = handleCheckoutAddressTypeChange;
window.handleAddressInputDebounced = handleAddressInputDebounced;
window.handleRegAddressTypeChange = handleRegAddressTypeChange;
window.handleRegAddressInput = handleRegAddressInput;
window.handleProfileAddressTypeChange = handleProfileAddressTypeChange;
window.handleEditShippingAddressTypeChange = handleEditShippingAddressTypeChange;

function saveCheckoutFormState() {
  const formState = {
    name: document.getElementById('checkoutName')?.value || '',
    phone: document.getElementById('checkoutPhone')?.value || '',
    email: document.getElementById('checkoutEmail')?.value || '',
    address: document.getElementById('checkoutAddress')?.value || '',
    addressType: currentCheckoutAddressType,
    oldWardNote: document.getElementById('checkoutOldWardNote')?.value || '',
    note: document.getElementById('checkoutNote')?.value || ''
  };
  sessionStorage.setItem('minigt_checkout_info', JSON.stringify(formState));
}

function loadCheckoutFormState() {
  try {
    const saved = sessionStorage.getItem('minigt_checkout_info');
    if (saved) {
      const data = JSON.parse(saved);
      if (document.getElementById('checkoutName') && data.name) document.getElementById('checkoutName').value = data.name;
      if (document.getElementById('checkoutPhone') && data.phone) document.getElementById('checkoutPhone').value = data.phone;
      if (document.getElementById('checkoutEmail') && data.email) document.getElementById('checkoutEmail').value = data.email;
      if (document.getElementById('checkoutAddress') && data.address) document.getElementById('checkoutAddress').value = data.address;
      if (document.getElementById('checkoutNote') && data.note) document.getElementById('checkoutNote').value = data.note;
      if (document.getElementById('checkoutOldWardNote') && data.oldWardNote) document.getElementById('checkoutOldWardNote').value = data.oldWardNote;
      if (data.addressType) {
        const radio = document.querySelector(`input[name="checkoutAddressType"][value="${data.addressType}"]`);
        if (radio) radio.checked = true;
        handleCheckoutAddressTypeChange(data.addressType);
      }
    }
  } catch (e) {
    console.warn('Không thể khôi phục form từ sessionStorage:', e);
  }

  // Nếu đã đăng nhập, tự động ưu tiên thông tin tài khoản nếu trường đang trống
  if (currentUser) {
    const nameInput = document.getElementById('checkoutName');
    const emailInput = document.getElementById('checkoutEmail');
    const phoneInput = document.getElementById('checkoutPhone');
    const addressInput = document.getElementById('checkoutAddress');
    if (nameInput && !nameInput.value) nameInput.value = currentUser.fullName || '';
    if (emailInput && !emailInput.value) emailInput.value = currentUser.email || '';
    if (phoneInput && !phoneInput.value && currentUser.phone) phoneInput.value = currentUser.phone;
    if (addressInput && !addressInput.value && currentUser.address) addressInput.value = currentUser.address;
    if (currentUser.addressType) {
      const radio = document.querySelector(`input[name="checkoutAddressType"][value="${currentUser.addressType}"]`);
      if (radio) {
        radio.checked = true;
        handleCheckoutAddressTypeChange(currentUser.addressType);
      }
    }
    if (currentUser.oldAddressNote) {
      const oldWardInput = document.getElementById('checkoutOldWardNote');
      if (oldWardInput && !oldWardInput.value) oldWardInput.value = currentUser.oldAddressNote;
    }
  }
}

function openCheckoutModal() {
  // YÊU CẦU: Chỉ có đăng nhập thì mới thanh toán được xe, chưa đăng nhập thì xem được chi tiết nhưng không thanh toán được mà phải đăng nhập
  const currentUser = (api && api.getCurrentUser) ? api.getCurrentUser() : null;
  const token = (api && api.getToken) ? api.getToken() : null;
  if (!currentUser && !token) {
    showToast('Vui lòng đăng nhập tài khoản trước khi tiến hành thanh toán đơn hàng!', 'info');
    closeCartDrawer();
    openAuthModal('login');
    return;
  }

  if (cart.length === 0) {
    showToast('Giỏ hàng của bạn đang trống! Hãy chọn mô hình trước khi thanh toán.', 'error');
    return;
  }

  const selectedItems = cart.filter(it => it.selected !== false);
  if (selectedItems.length === 0) {
    showToast('Vui lòng tích chọn ít nhất 1 mô hình xe trong giỏ hàng để tiến hành mua hàng!', 'warning');
    return;
  }
  closeCartDrawer();
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    currentCheckoutStep = 1;
    activeStep4OrderCode = null;
    sessionStorage.removeItem('minigt_checkout_step');
    loadCheckoutFormState();

    const hasPreOrder = selectedItems.some(it => {
      const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == it.productId);
      return it.isPreOrder || (prod && String(prod.Status || prod.status || '').toLowerCase() === 'pre_order');
    });

    const modalTitle = document.getElementById('checkoutModalTitle');
    if (modalTitle) {
      modalTitle.innerHTML = hasPreOrder
        ? '<i class="fa-solid fa-shield-halved" style="color:var(--color-primary); margin-right:6px;"></i><span>MINI GT STORE • THANH TOÁN &amp; ĐẶT CỌC PRE-ORDER</span>'
        : '<i class="fa-solid fa-cart-shopping" style="color:var(--color-primary); margin-right:6px;"></i><span>MINI GT STORE • THANH TOÁN ĐƠN HÀNG SẴN KHO</span>';
    }

    const step1IndLabel = document.getElementById('step1IndicatorLabel');
    if (step1IndLabel) {
      step1IndLabel.textContent = hasPreOrder ? 'Giỏ Hàng & Cọc' : 'Kiểm Tra Đơn';
    }

    const step1Desc = document.querySelector('#checkoutStepPane1 .step-pane-desc');
    if (step1Desc) {
      step1Desc.textContent = hasPreOrder
        ? 'Xem lại danh sách mô hình diecast 1:64 và số tiền cọc cần thanh toán giữ mẫu giới hạn.'
        : 'Xem lại danh sách mô hình diecast 1:64 có sẵn trong kho và tổng tiền cần thanh toán 100%.';
    }

    goToCheckoutStep(1);
    modal.classList.add('active');
    document.body.classList.add('checkout-modal-open');
  }
}

function goToCheckoutStep(step) {
  if (!Number.isInteger(step) || step < 1 || step > 4) return;

  // Khi đơn hàng vừa thanh toán thành công (Step 4), nếu khách bấm quay lại thì thông báo hoàn tất
  if (currentCheckoutStep === 4 && step < 4 && activeStep4OrderCode) {
    closeModal('checkoutModal');
    showToast('Đơn hàng đã được đặt thành công. Bạn có thể tiếp tục chọn mô hình mới!', 'info');
    return;
  }

  // Chỉ kiểm tra giỏ hàng rỗng ở Bước 2 & Bước 3. Bước 4 là màn hình Cảm ơn & VietQR thanh toán hoàn tất đơn, tuyệt đối không được chặn giỏ hàng rỗng!
  if ((step === 2 || step === 3) && cart.length === 0) {
    showToast('Giỏ hàng của bạn đang trống! Hãy chọn mô hình trước khi thanh toán.', 'error');
    return;
  }

  if (step === 3) {
    const name = document.getElementById('checkoutName')?.value.trim();
    const phone = document.getElementById('checkoutPhone')?.value.trim();
    const address = document.getElementById('checkoutAddress')?.value.trim();
    if (!name || !phone || !address) {
      showToast('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng!', 'error');
      goToCheckoutStep(2);
      return;
    }
    // Cập nhật thông tin tóm tắt bước 3
    const nameEl = document.getElementById('reviewRecipientName');
    const phoneEl = document.getElementById('reviewRecipientPhone');
    const addrEl = document.getElementById('reviewRecipientAddress');
    if (nameEl) nameEl.textContent = name;
    if (phoneEl) phoneEl.textContent = phone;
    if (addrEl) addrEl.textContent = address;
  }

  currentCheckoutStep = step;
  sessionStorage.setItem('minigt_checkout_step', step.toString());

  // Cập nhật trạng thái các Step Indicator và Line
  for (let i = 1; i <= 4; i++) {
    const ind = document.getElementById(`stepIndicator${i}`);
    const line = document.getElementById(`stepLine${i}`);
    const pane = document.getElementById(`checkoutStepPane${i}`);

    if (ind) {
      ind.classList.remove('active', 'completed', 'is-success-finish');
      const circle = ind.querySelector('.step-circle');
      if (i === step) {
        ind.classList.add('active');
        if (i === 4) {
          ind.classList.add('is-success-finish');
          if (circle) circle.innerHTML = '<i class="fa-solid fa-check"></i>';
        } else if (circle) {
          circle.textContent = i;
        }
      } else if (i < step) {
        ind.classList.add('completed');
        if (circle) circle.innerHTML = `<i class="fa-solid fa-check" style="font-size:11px;"></i>`;
      } else if (circle) {
        circle.textContent = i;
      }
    }

    if (line) {
      line.classList.toggle('active', i < step);
    }

    if (pane) {
      pane.style.display = (i === step) ? 'block' : 'none';
    }
  }

  // Render nội dung tương ứng theo bước
  if (step === 1) {
    renderCheckoutStep1();
  } else if (step === 3) {
    renderCheckoutVoucherChips();
    renderCheckoutStep3();
  }

  const checkoutContainer = document.querySelector('#checkoutModal .checkout-stepper-container');
  if (checkoutContainer) checkoutContainer.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function renderCheckoutStep1() {
  const listEl = document.getElementById('checkoutStep1ItemList');
  const summaryEl = document.getElementById('checkoutStep1SummaryBox');
  if (!listEl || !summaryEl) return;

  const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
  const selectedItems = cart.filter(it => it.selected !== false);

  if (selectedItems.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; padding:36px 16px; color:#64748b;">
        <div style="font-size:42px; color:#cbd5e1; margin-bottom:10px;"><i class="fa-solid fa-cart-shopping"></i></div>
        <strong style="font-size:15px; color:#0f172a; display:block; margin-bottom:4px;">Chưa chọn mẫu xe nào để mua hàng</strong>
        <p style="font-size:12px; margin:0 0 16px; color:#64748b;">Vui lòng mở giỏ hàng và tích chọn các mô hình xe bạn muốn mua.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="closeModal('checkoutModal'); openCartDrawer();">
          <i class="fa-solid fa-cart-plus" style="margin-right:4px;"></i> Mở giỏ hàng chọn xe ➔
        </button>
      </div>
    `;
    summaryEl.innerHTML = '';
    return;
  }

  const hasPreOrder = selectedItems.some(it => {
    const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == it.productId);
    return it.isPreOrder || (prod && String(prod.Status || prod.status || '').toLowerCase() === 'pre_order');
  });

  const step1Desc = document.querySelector('#checkoutStepPane1 .step-pane-desc');
  if (step1Desc) {
    step1Desc.textContent = hasPreOrder
      ? 'Xem lại danh sách mô hình diecast 1:64 và số tiền cọc cần thanh toán giữ mẫu giới hạn.'
      : 'Xem lại danh sách mô hình diecast 1:64 có sẵn trong kho và tổng tiền cần thanh toán 100%.';
  }

  const modalTitle = document.getElementById('checkoutModalTitle');
  if (modalTitle) {
    modalTitle.innerHTML = hasPreOrder
      ? '<i class="fa-solid fa-shield-halved" style="color:var(--color-primary); margin-right:6px;"></i><span>MINI GT STORE • THANH TOÁN &amp; ĐẶT CỌC PRE-ORDER</span>'
      : '<i class="fa-solid fa-cart-shopping" style="color:var(--color-primary); margin-right:6px;"></i><span>MINI GT STORE • THANH TOÁN ĐƠN HÀNG SẴN KHO</span>';
  }

  const totals = calculateCheckoutTotals();

  listEl.innerHTML = selectedItems.map((it) => {
    const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == it.productId);
    const pricing = prod ? getProductBoxCardPricing(prod) : {
      packagingType: it.packagingType || 'both',
      discountPercent: it.discountPercent || 0,
      priceBox: it.priceBox || it.price || 350000,
      priceCard: it.priceCard || ((it.price || 350000) + 60000),
      finalPriceBox: it.finalPriceBox || it.price || 350000,
      finalPriceCard: it.finalPriceCard || ((it.price || 350000) + 60000)
    };
    const pack = it.packType || 'box';
    const unitPrice = pack === 'card' ? pricing.finalPriceCard : pricing.finalPriceBox;
    const origPrice = pack === 'card' ? pricing.priceCard : pricing.priceBox;
    it.price = unitPrice;

    // CHỈ tính tiền cọc nếu sản phẩm THỰC SỰ là xe Pre-Order, hàng có sẵn (IN_STOCK) tiền cọc luôn là 0đ!
    const isRealPreOrder = Boolean(it.isPreOrder || (prod && String(prod.Status || prod.status || '').toLowerCase() === 'pre_order'));
    it.isPreOrder = isRealPreOrder;
    it.depositAmount = isRealPreOrder ? Math.round(unitPrice * 0.3) : 0;
    const isPreOrder = isRealPreOrder;

    const boxDisabled = pricing.packagingType === 'card_only' || (!isPreOrder && (pricing.stockBox ?? 0) <= 0);
    const cardDisabled = pricing.packagingType === 'box_only' || (!isPreOrder && (pricing.stockCard ?? 0) <= 0);

    return `
      <div style="display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #f1f5f9;">
        <img src="${it.imageUrl || 'image/hero-banner.jpg'}" alt="${escapeHtml(it.name)}" style="width:58px; height:58px; object-fit:contain; border-radius:8px; background:#f8fafc; border:1.5px solid #e2e8f0; padding:2px; flex-shrink:0;">
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:3px;">
            <span class="pack-badge ${pack === 'card' ? 'pack-card' : 'pack-box'}">${pack === 'card' ? '<i class="fa-solid fa-shield-halved"></i> VỈ CARD BLISTER' : '<i class="fa-solid fa-cube"></i> HỘP GIẤY BOX'}</span>
            ${isPreOrder ? `<span style="font-size:10px; background:#fff1f1; color:#dc2626; padding:1px 5px; border-radius:3px; font-weight:800;">CỌC TRƯỚC</span>` : `<span style="font-size:10px; background:#ecfdf5; color:#059669; padding:1px 5px; border-radius:3px; font-weight:700;">CÓ SẴN (100%)</span>`}
          </div>
          <div style="font-weight:700; font-size:13px; color:var(--color-navy); line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(it.name)}</div>
          
          <div class="cart-pack-switch" style="margin:5px 0;">
            <button type="button" class="cart-pack-btn is-box ${pack === 'box' ? 'active' : ''}" ${boxDisabled ? `disabled title="${pricing.packagingType === 'card_only' ? 'Chỉ có bản Card' : 'Hết hàng Bản Box'}"` : ''} onclick="switchCartItemPackaging(${it.productId}, '${pack}', 'box'); renderCheckoutStep1();">
              <i class="fa-solid fa-cube"></i> Box (${formatVND(pricing.finalPriceBox)}) ${pack === 'box' ? '<i class="fa-solid fa-check" style="margin-left:2px; font-size:10px;"></i>' : ''}
            </button>
            <button type="button" class="cart-pack-btn is-card ${pack === 'card' ? 'active' : ''}" ${cardDisabled ? `disabled title="${pricing.packagingType === 'box_only' ? 'Chỉ có bản Box' : 'Hết hàng Bản Card'}"` : ''} onclick="switchCartItemPackaging(${it.productId}, '${pack}', 'card'); renderCheckoutStep1();">
              <i class="fa-solid fa-shield-halved"></i> Card (${formatVND(pricing.finalPriceCard)}) ${pack === 'card' ? '<i class="fa-solid fa-check" style="margin-left:2px; font-size:10px;"></i>' : ''}
            </button>
          </div>

          <div style="display:flex; align-items:center; gap:6px; margin-top:2px; font-size:11.5px; color:#64748b; flex-wrap:wrap;">
            <span>Đơn giá: <strong style="color:#0f172a;">${formatVND(unitPrice)}</strong></span>
            ${pricing.discountPercent > 0 && origPrice > unitPrice ? `<del style="color:#94a3b8;">${formatVND(origPrice)}</del> <span style="color:#e11d48; font-weight:700;">(-${pricing.discountPercent}%)</span>` : ''}
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button type="button" class="btn btn-sm btn-outline" style="padding:2px 8px; font-size:11px;" onclick="changeCartQty(${it.productId}, -1, '${pack}'); renderCheckoutStep1();">-</button>
          <span style="font-weight:800; font-size:12px; min-width:18px; text-align:center;">${it.quantity}</span>
          <button type="button" class="btn btn-sm btn-outline" style="padding:2px 8px; font-size:11px;" onclick="changeCartQty(${it.productId}, 1, '${pack}'); renderCheckoutStep1();">+</button>
        </div>
        <div style="text-align:right; min-width:85px;">
          <strong style="color:var(--color-primary); font-size:13.5px;">${formatVND(unitPrice * it.quantity)}</strong>
        </div>
      </div>
    `;
  }).join('');

  const recalcTotals = calculateCheckoutTotals();
  summaryEl.innerHTML = `
    <div style="background:#f8fafc; border-radius:10px; padding:12px 14px; margin-top:12px; border:1px solid #e2e8f0; font-size:12.5px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
        <span style="color:#64748b;">${isEn ? `Subtotal (${cart.length} items):` : `Tổng tiền hàng (${cart.length} mẫu):`}</span>
        <strong style="color:var(--color-navy);">${formatVND(recalcTotals.subtotal)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
        <span style="color:#64748b;"><i class="fa-solid fa-truck-fast" style="color:#ea580c; margin-right:4px;"></i> ${isEn ? 'Estimated SPX Shipping:' : 'Phí vận chuyển dự kiến:'}</span>
        <strong style="color:#059669;">${formatVND(recalcTotals.shippingFee)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:8px; border-top:1px dashed #cbd5e1; padding-top:8px; font-size:14px; font-weight:800;">
        <span style="color:var(--color-navy);">${isEn ? 'Estimated Total:' : 'Tạm tính tổng đơn:'}</span>
        <span style="color:var(--color-primary);">${formatVND(recalcTotals.grandTotal)}</span>
      </div>
      ${hasPreOrder ? `
        <div style="margin-top:8px; padding:8px 10px; background:#fff1f1; border-radius:6px; font-size:12px; color:#b91c1c; display:flex; justify-content:space-between; align-items:center;">
          <span><strong>${isEn ? '30% Pre-Order Deposit:' : 'Tiền cọc giữ slot đợt này:'}</strong></span>
          <span style="font-size:14px; font-weight:800;">${formatVND(recalcTotals.depositAmount)}</span>
        </div>
      ` : `
        <div style="margin-top:8px; padding:8px 10px; background:#ecfdf5; border-radius:6px; font-size:12px; color:#047857; display:flex; justify-content:space-between; align-items:center;">
          <span><strong>${isEn ? 'Order Type:' : 'Loại đơn hàng:'}</strong></span>
          <span style="font-weight:700;"><i class="fa-solid fa-circle-check"></i> Hàng có sẵn trong kho (Thanh toán 100%)</span>
        </div>
      `}
    </div>
  `;
}

function validateStep2AndProceed() {
  const name = document.getElementById('checkoutName')?.value.trim();
  const phone = document.getElementById('checkoutPhone')?.value.trim();
  const address = document.getElementById('checkoutAddress')?.value.trim();

  if (!name || !phone || !address) {
    showToast('Vui lòng điền Họ tên, Số điện thoại và Địa chỉ nhận hàng!', 'error');
    return;
  }
  saveCheckoutFormState();
  goToCheckoutStep(3);
}

function getCustomerDeliveredSpent() {
  const user = (api && api.getCurrentUser) ? api.getCurrentUser() : (typeof currentUser !== 'undefined' ? currentUser : null);
  if (!user) return 0;

  let spent = 0;
  try {
    const allOrders = (api && api.getSharedOrders) ? api.getSharedOrders() : [];
    const uid = user.userId || user.id;
    const myOrders = allOrders.filter(o => {
      const st = String(o.status || o.Status || '').toUpperCase();
      const pst = String(o.paymentStatus || o.PaymentStatus || '').toUpperCase();
      if (st === 'CANCELLED') return false;
      const isValid = (st === 'DELIVERED') || ['PAID', 'PARTIALLY_PAID'].includes(pst) || ['CONFIRMED', 'PREPARING', 'SHIPPING'].includes(st);
      const matchUid = Boolean(uid && (o.userId || o.UserId) && Number(uid) === Number(o.userId || o.UserId));
      const matchEmail = Boolean(user.email && (o.email || o.Email) && user.email.toLowerCase() === String(o.email || o.Email).toLowerCase());
      return isValid && (matchUid || matchEmail);
    });
    spent = myOrders.reduce((sum, o) => sum + Number(o.total || o.totalAmount || o.Total || 0), 0);
  } catch (_) {}

  // Lấy chi tiêu thực tế cao nhất giữa đơn hợp lệ và thuộc tính user
  if (user.deliveredSpent && Number(user.deliveredSpent) > spent) {
    spent = Number(user.deliveredSpent);
  }
  if (user.totalSpent && Number(user.totalSpent) > spent) {
    spent = Number(user.totalSpent);
  }

  return spent;
}
window.getCustomerDeliveredSpent = getCustomerDeliveredSpent;

function isCustomerCodEligible() {
  const user = (api && api.getCurrentUser) ? api.getCurrentUser() : (typeof currentUser !== 'undefined' ? currentUser : null);
  if (!user) return false;
  const spent = getCustomerDeliveredSpent();
  const vip = getCustomerVipInfo(spent);
  // BẮT BUỘC: Chỉ mở cho thành viên từ VIP 4 trở lên (tích lũy đơn trên 1.000.000đ)
  // VIP 1 (0 - 200K), VIP 2 (201K - 500K), VIP 3 (501K - 1TR) -> KHÓA HOÀN TOÀN
  return vip.level >= 4 && spent >= 1000000;
}
window.isCustomerCodEligible = isCustomerCodEligible;

function handlePaymentMethodChange(val) {
  const selectedItems = cart.filter(it => it.selected !== false);
  const hasPreOrder = selectedItems.some(it => {
    const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == it.productId);
    return it.isPreOrder || (prod && String(prod.Status || prod.status || '').toLowerCase() === 'pre_order');
  });

  if (hasPreOrder && val !== 'DEPOSIT' && val !== 'VIETQR_PAYOS') {
    showToast('Đơn hàng có mô hình Pre-Order áp dụng phương thức Đặt cọc giữ mẫu (MB Bank hoặc PayOS VietQR)!', 'warning', 'Chỉ cọc Pre-Order');
    selectedCheckoutPaymentMethod = 'VIETQR_PAYOS';
    val = 'VIETQR_PAYOS';
    const payosRadio = document.querySelector('input[name="checkoutPaymentMethod"][value="VIETQR_PAYOS"]');
    if (payosRadio) payosRadio.checked = true;
  } else if (val === 'COD') {
    if (!isCustomerCodEligible()) {
      const deliveredSpent = getCustomerDeliveredSpent();
      const vip = getCustomerVipInfo(deliveredSpent);
      showToast(`🔒 Phương thức Ship COD 100% đang bị khóa để chống bom đơn! Chỉ áp dụng cho tài khoản từ VIP 4 trở lên (đã mua & nhận hàng trên 1.000.000đ). Cấp hiện tại của bạn: ${vip.label} (Đã tích lũy: ${formatVND(deliveredSpent)} / 1.000.000đ). Vui lòng chọn Thanh toán PayOS VietQR hoặc Chuyển khoản MB Bank!`, 'warning', 5000);
      const fallbackRadio = document.querySelector('input[name="checkoutPaymentMethod"][value="VIETQR_PAYOS"]') || document.querySelector('input[name="checkoutPaymentMethod"][value="BANK_TRANSFER"]');
      if (fallbackRadio) fallbackRadio.checked = true;
      selectedCheckoutPaymentMethod = fallbackRadio ? fallbackRadio.value : 'VIETQR_PAYOS';
      renderCheckoutStep3();
      return;
    } else {
      selectedCheckoutPaymentMethod = 'COD';
    }
  } else if (val === 'VIETQR_PAYOS') {
    selectedCheckoutPaymentMethod = 'VIETQR_PAYOS';
  } else if (val === 'DEPOSIT') {
    selectedCheckoutPaymentMethod = 'DEPOSIT';
  } else {
    selectedCheckoutPaymentMethod = (val === 'FULL_TRANSFER') ? 'BANK_TRANSFER' : val;
  }

  const optCod = document.getElementById('payOptCod');
  const optDeposit = document.getElementById('payOptDeposit');
  const optFull = document.getElementById('payOptFull');
  const optPayOS = document.getElementById('payOptPayOS');

  [optCod, optDeposit, optFull, optPayOS].forEach(el => {
    if (el) {
      el.classList.remove('active');
      el.style.borderColor = '#cbd5e1';
      el.style.background = '#f8fafc';
    }
  });

  let activeEl = optPayOS;
  if (selectedCheckoutPaymentMethod === 'COD') activeEl = optCod;
  else if (selectedCheckoutPaymentMethod === 'DEPOSIT') activeEl = optDeposit;
  else if (selectedCheckoutPaymentMethod === 'BANK_TRANSFER') activeEl = optFull;
  else if (selectedCheckoutPaymentMethod === 'VIETQR_PAYOS') activeEl = optPayOS;

  if (activeEl) {
    activeEl.classList.add('active');
    activeEl.style.borderColor = (selectedCheckoutPaymentMethod === 'VIETQR_PAYOS') ? '#0284c7' : 'var(--color-primary)';
    activeEl.style.background = (selectedCheckoutPaymentMethod === 'VIETQR_PAYOS') ? '#f0f9ff' : '#fff7f7';
  }

  renderCheckoutStep3();
}

function renderCheckoutStep3() {
  const summaryEl = document.getElementById('checkoutStep3SummaryBox');
  if (!summaryEl) return;

  const selectedItems = cart.filter(it => it.selected !== false);
  const hasPreOrder = selectedItems.some(it => {
    const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == it.productId);
    return it.isPreOrder || (prod && String(prod.Status || prod.status || '').toLowerCase() === 'pre_order');
  });

  const optCod = document.getElementById('payOptCod');
  const optDeposit = document.getElementById('payOptDeposit');
  const optFull = document.getElementById('payOptFull');
  const optPayOS = document.getElementById('payOptPayOS');

  const deliveredSpent = getCustomerDeliveredSpent();
  const vip = getCustomerVipInfo(deliveredSpent);
  const isCodEligible = isCustomerCodEligible();

  const codRadio = document.querySelector('input[name="checkoutPaymentMethod"][value="COD"]') || document.getElementById('checkoutPaymentCodRadio');
  const codBadge = document.getElementById('payOptCodBadge');
  const codDesc = document.getElementById('payOptCodDesc');
  const codProgressText = document.getElementById('payOptCodProgressText');
  const codTooltip = document.getElementById('payOptCodLockTooltip');

  let preNotice = document.getElementById('preOrderPaymentNoticeInStep3');
  if (hasPreOrder) {
    if (selectedCheckoutPaymentMethod !== 'DEPOSIT' && selectedCheckoutPaymentMethod !== 'VIETQR_PAYOS') {
      selectedCheckoutPaymentMethod = 'VIETQR_PAYOS';
      const payosRadio = document.querySelector('input[name="checkoutPaymentMethod"][value="VIETQR_PAYOS"]');
      if (payosRadio) payosRadio.checked = true;
    }
    if (optCod) optCod.style.display = 'none';
    if (optFull) optFull.style.display = 'none';
    if (optDeposit) {
      optDeposit.style.display = 'flex';
      const depTitle = optDeposit.querySelector('.opt-title');
      const depBadge = optDeposit.querySelector('.opt-header span');
      const depDesc = optDeposit.querySelector('.opt-desc');
      if (depTitle) depTitle.innerHTML = '<i class="fa-solid fa-bolt" style="color:#dc2626; margin-right:4px;"></i> Đặt cọc giữ mẫu (VietQR PayOS Tự Động)';
      if (depBadge) {
        depBadge.textContent = '⚡ Khuyên Dùng Pre-Order • Tự Động Duyệt';
        depBadge.style.background = '#dc2626';
      }
      if (depDesc) depDesc.innerHTML = 'Quét mã VietQR chuyển cọc 30% giữ slot xe giới hạn. Hệ thống tự động xác nhận &amp; duyệt đơn ngay tức thì. Số tiền còn lại thanh toán COD khi nhận xe.';
    }
    if (optPayOS) optPayOS.style.display = 'flex';

    if (!preNotice && optPayOS && optPayOS.parentNode) {
      preNotice = document.createElement('div');
      preNotice.id = 'preOrderPaymentNoticeInStep3';
      preNotice.style.cssText = 'background:#f5f3ff; border:1.5px solid #c4b5fd; border-radius:10px; padding:10px 12px; margin-bottom:10px; font-size:12px; color:#5b21b6; line-height:1.45;';
      preNotice.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color:#7c3aed; margin-right:4px;"></i> <strong>Đơn hàng chứa xe Pre-Order:</strong> Mẫu xe chưa có sẵn tại kho thực tế nên cửa hàng <strong>áp dụng Đặt Cọc giữ suất</strong> qua VietQR PayOS (tự động) hoặc chuyển khoản MB Bank để đảm bảo quyền lợi collector!';
      optPayOS.parentNode.insertBefore(preNotice, optPayOS);
    } else if (preNotice) {
      preNotice.style.display = 'block';
    }
  } else {
    if (optPayOS) optPayOS.style.display = 'flex';
    if (optFull) optFull.style.display = 'flex';
    if (preNotice) preNotice.style.display = 'none';

    // Tùy chọn Đặt cọc trước 30% cho hàng có sẵn
    if (optDeposit) {
      optDeposit.style.display = 'flex';
      const depTitle = optDeposit.querySelector('.opt-title');
      const depBadge = optDeposit.querySelector('.opt-header span');
      const depDesc = optDeposit.querySelector('.opt-desc');
      if (depTitle) depTitle.innerHTML = '<i class="fa-solid fa-money-bill-transfer" style="color:#dc2626; margin-right:4px;"></i> Đặt cọc trước 30% + COD khi nhận xe (PayOS VietQR)';
      if (depBadge) {
        depBadge.textContent = '⚡ Đặt Cọc Linh Hoạt (30%)';
        depBadge.style.background = '#ea580c';
      }
      if (depDesc) depDesc.innerHTML = 'Quét mã VietQR chuyển cọc 30% chốt đơn giữ xe. Số tiền còn lại sẽ thanh toán COD cho Shipper SPX khi nhận xe.';
    }

    if (optCod) {
      optCod.style.display = 'flex';
      if (!isCodEligible) {
        // Chưa đủ điều kiện VIP 4 (>= 1.000.001đ): Làm mờ và khóa tương tác
        optCod.classList.add('is-locked');
        optCod.style.opacity = '0.55';
        optCod.style.background = '#f8fafc';
        optCod.style.borderColor = '#cbd5e1';
        optCod.style.cursor = 'not-allowed';
        if (codRadio) {
          codRadio.disabled = true;
          if (codRadio.checked) codRadio.checked = false;
        }
        if (selectedCheckoutPaymentMethod === 'COD') {
          selectedCheckoutPaymentMethod = 'VIETQR_PAYOS';
          const payosRadio = document.querySelector('input[name="checkoutPaymentMethod"][value="VIETQR_PAYOS"]');
          if (payosRadio) payosRadio.checked = true;
        }
        if (codBadge) {
          codBadge.innerHTML = '<i class="fa-solid fa-lock" style="color:#dc2626;"></i> Khóa: Cần VIP 4 (trên 1.000.000đ)';
          codBadge.style.background = '#fef2f2';
          codBadge.style.color = '#dc2626';
          codBadge.style.borderColor = '#fecaca';
        }
        if (codDesc) {
          codDesc.innerHTML = `🔒 <strong>Phương thức bị khóa để phòng chống bom đơn.</strong> Chỉ mở cho thành viên từ VIP 4 trở lên (đã mua & nhận hàng thành công từ 1.000.001đ trở lên). Di chuột vào để xem chi tiết.`;
        }
        if (codProgressText) {
          codProgressText.innerHTML = `Cấp bậc hiện tại: <strong>${vip.label} (${vip.tierName})</strong><br>Tích lũy nhận hàng: <strong>${formatVND(deliveredSpent)} / 1.000.000đ</strong><br><span style="color:#f59e0b;">(Cần thêm ${formatVND(Math.max(0, 1000001 - deliveredSpent))} để mở khóa Ship COD)</span>`;
        }
        optCod.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          showToast(`🔒 Phương thức Ship COD 100% đang bị khóa để chống bom đơn! Chỉ mở cho thành viên từ VIP 4 trở lên (đã mua & nhận hàng trên 1.000.000đ). Hiện tại: ${vip.label} (${formatVND(deliveredSpent)} / 1.000.000đ). Bạn có thể chọn Đặt cọc 30% hoặc Thanh toán PayOS VietQR!`, 'warning', 5000);
          return false;
        };
      } else {
        // Đã đủ điều kiện >= 1.000.001đ (VIP 4, VIP 5)
        optCod.classList.remove('is-locked');
        optCod.style.opacity = '1';
        optCod.style.cursor = 'pointer';
        optCod.onclick = null;
        if (codRadio) codRadio.disabled = false;
        if (codBadge) {
          codBadge.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#059669;"></i> Đã Đạt Chuẩn COD VIP 4';
          codBadge.style.background = '#ecfdf5';
          codBadge.style.color = '#059669';
          codBadge.style.borderColor = '#a7f3d0';
        }
        if (codDesc) {
          codDesc.innerHTML = `Thanh toán toàn bộ tiền hàng cho shipper SPX Express khi nhận và đồng kiểm kiện xe nguyên seal (Đặc quyền VIP 4+).`;
        }
        if (codProgressText) {
          codProgressText.innerHTML = `Tài khoản đạt chuẩn VIP 4+ (${vip.label}). Đã mở khóa quyền lợi nhận hàng COD 100%!`;
        }
      }
    }
  }

  const totals = calculateCheckoutTotals();
  const { subtotal, shippingFee, shippingLabel, protectorFee, voucherDiscount, grandTotal, depositAmount } = totals;

  let payNowAmount = 0;
  let remainingCodAmount = grandTotal;
  let labelPayNow = '';
  let noteText = '';

  if (selectedCheckoutPaymentMethod === 'COD') {
    payNowAmount = 0;
    remainingCodAmount = grandTotal;
    labelPayNow = 'Thanh toán khi nhận xe (COD):';
    noteText = `<i class="fa-solid fa-hand-holding-dollar" style="color:#059669;"></i> Bạn sẽ thanh toán <strong>${formatVND(grandTotal)}</strong> khi nhận và kiểm tra mô hình xe.`;
  } else if (selectedCheckoutPaymentMethod === 'VIETQR_PAYOS') {
    payNowAmount = hasPreOrder ? depositAmount : grandTotal;
    remainingCodAmount = Math.max(0, grandTotal - payNowAmount);
    labelPayNow = hasPreOrder ? 'Tiền cọc thanh toán PayOS VietQR 24/7:' : 'Thanh toán PayOS VietQR tự động 100%:';
    noteText = `<i class="fa-solid fa-bolt" style="color:#0284c7;"></i> Cổng PayOS tự động tạo mã VietQR có sẵn số tiền <strong>${formatVND(payNowAmount)}</strong>. ${remainingCodAmount > 0 ? `Số tiền còn lại <strong>${formatVND(remainingCodAmount)}</strong> thanh toán COD khi nhận xe.` : 'Hệ thống tự động xác nhận đơn ngay khi bạn quét mã!'}`;
  } else if (selectedCheckoutPaymentMethod === 'BANK_TRANSFER' || selectedCheckoutPaymentMethod === 'FULL_TRANSFER') {
    payNowAmount = grandTotal;
    remainingCodAmount = 0;
    labelPayNow = 'Chuyển khoản Full 100% qua MB Bank:';
    noteText = `<i class="fa-solid fa-credit-card" style="color:#2563eb;"></i> Bạn chuyển khoản <strong>${formatVND(grandTotal)}</strong> qua VietQR. Khi nhận kiện xe bạn <strong>không phải trả thêm tiền</strong>.`;
  } else {
    payNowAmount = depositAmount;
    remainingCodAmount = Math.max(0, grandTotal - payNowAmount);
    labelPayNow = 'Tiền cọc quét mã VietQR MB Bank ngay:';
    noteText = `<i class="fa-solid fa-money-bill-transfer" style="color:#dc2626;"></i> Quét mã cọc trước <strong>${formatVND(payNowAmount)}</strong>. Số tiền còn lại <strong>${formatVND(remainingCodAmount)}</strong> thanh toán khi nhận xe.`;
  }

  const itemsPreviewHtml = `
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; margin-bottom:12px; text-align:left;">
      <div style="font-size:11.5px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <span><i class="fa-solid fa-cubes-stacked" style="color:var(--color-primary); margin-right:4px;"></i> Mô hình đã chọn (${selectedItems.length} mẫu):</span>
        <button type="button" onclick="goToCheckoutStep(1)" style="border:none; background:none; color:#2563eb; font-size:11.5px; font-weight:700; cursor:pointer;">
          <i class="fa-solid fa-pen-to-square"></i> Đổi Box/Card
        </button>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${selectedItems.map(it => {
          const pack = it.packType || 'box';
          return `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:12px; border-bottom:1px dashed #e2e8f0; padding-bottom:5px;">
              <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                <img src="${it.imageUrl || 'image/hero-banner.jpg'}" style="width:36px; height:36px; object-fit:contain; border-radius:6px; border:1px solid #e2e8f0; background:#fff; padding:1px; flex-shrink:0;">
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                  <div style="font-weight:700; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:280px;">${escapeHtml(it.name)}</div>
                  <div style="display:flex; align-items:center; gap:6px; margin-top:1px;">
                    <span class="pack-badge ${pack === 'card' ? 'pack-card' : 'pack-box'}">${pack === 'card' ? '🛡️ VỈ CARD' : '📦 HỘP BOX'}</span>
                    <span style="color:#64748b; font-size:11px;">x${it.quantity}</span>
                  </div>
                </div>
              </div>
              <div style="text-align:right; flex-shrink:0;">
                <strong style="color:var(--color-primary); font-size:12.5px;">${formatVND(it.price * it.quantity)}</strong>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  summaryEl.innerHTML = `
    ${itemsPreviewHtml}
    <div style="background:#f8fafc; border-radius:10px; padding:12px 14px; border:1px solid #e2e8f0; font-size:12.5px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
        <span style="color:#64748b;">Tổng giá trị sản phẩm (${cart.length} mẫu):</span>
        <strong>${formatVND(subtotal)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
        <span style="color:#64748b;"><i class="fa-solid fa-truck-fast" style="color:#ea580c; margin-right:4px;"></i> ${escapeHtml(shippingLabel)}:</span>
        <strong style="color:#059669;">${shippingFee === 0 ? '0đ (Miễn phí)' : formatVND(shippingFee)}</strong>
      </div>
      ${protectorFee > 0 ? `
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
          <span style="color:#64748b;"><i class="fa-solid fa-shield-cat" style="color:#2563eb; margin-right:4px;"></i> Hộp nhựa PVC Protector chống cấn góc:</span>
          <strong style="color:#2563eb;">+${formatVND(protectorFee)}</strong>
        </div>
      ` : ''}
      ${voucherDiscount > 0 ? `
        <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#059669;">
          <span><i class="fa-solid fa-ticket" style="margin-right:4px;"></i> Ưu đãi Voucher (${escapeHtml(checkoutAppliedVoucher?.code || '')}):</span>
          <strong>-${formatVND(voucherDiscount)}</strong>
        </div>
      ` : ''}
      <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-weight:800; padding-top:5px; border-top:1px dashed #cbd5e1;">
        <span style="color:var(--color-navy);">Tổng thanh toán đơn hàng:</span>
        <span style="color:var(--color-navy); font-size:14px;">${formatVND(grandTotal)}</span>
      </div>
      <div style="border-top:1.5px solid #e2e8f0; margin-top:8px; padding-top:8px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:13px; font-weight:800; color:${payNowAmount > 0 ? '#dc2626' : '#059669'};">
          ${labelPayNow}
        </span>
        <span style="font-size:17px; font-weight:900; color:${payNowAmount > 0 ? '#dc2626' : '#059669'};">
          ${formatVND(payNowAmount > 0 ? payNowAmount : grandTotal)}
        </span>
      </div>
      <div style="font-size:11.5px; color:#475569; margin-top:6px; line-height:1.4; background:#ffffff; padding:8px 10px; border-radius:6px; border:1px solid #e2e8f0;">
        ${noteText}
      </div>
    </div>
  `;
}

let activeStep4OrderCode = null;

async function handleCheckoutSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const name = document.getElementById('checkoutName')?.value.trim();
  const phone = document.getElementById('checkoutPhone')?.value.trim();
  const email = document.getElementById('checkoutEmail')?.value.trim();
  const address = document.getElementById('checkoutAddress')?.value.trim();
  const rawNote = document.getElementById('checkoutNote')?.value.trim() || '';

  if (!name || !phone || !address) {
    showToast('Vui lòng điền Họ tên, Số điện thoại và Địa chỉ nhận hàng!', 'error');
    goToCheckoutStep(2);
    return;
  }

  const btn = document.getElementById('btnSubmitOrder');
  const btnText = document.getElementById('submitOrderBtnText');
  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi đơn sang hệ thống Admin...';

  const normalizedPayMethod = selectedCheckoutPaymentMethod === 'FULL_TRANSFER'
    ? 'BANK_TRANSFER'
    : (selectedCheckoutPaymentMethod || 'DEPOSIT');

  if (normalizedPayMethod === 'COD' && !isCustomerCodEligible()) {
    const deliveredSpent = getCustomerDeliveredSpent();
    const vip = getCustomerVipInfo(deliveredSpent);
    showToast(`🔒 Phương thức Ship COD 100% đang bị khóa để chống bom đơn! Chỉ áp dụng cho tài khoản từ VIP 4 trở lên (đã mua & nhận hàng trên 1.000.000đ). Cấp hiện tại của bạn: ${vip.label} (${formatVND(deliveredSpent)} / 1.000.000đ). Vui lòng chọn Đặt cọc 30% hoặc Chuyển khoản VietQR MB Bank!`, 'error', 5500);
    if (btn) btn.disabled = false;
    if (btnText) btnText.innerHTML = 'Xác Nhận Đặt Cọc & Hoàn Tất Đơn Hàng <i class="fa-solid fa-arrow-right" style="margin-left:6px;"></i>';
    selectedCheckoutPaymentMethod = 'DEPOSIT';
    const depRadio = document.querySelector('input[name="checkoutPaymentMethod"][value="DEPOSIT"]');
    if (depRadio) depRadio.checked = true;
    goToCheckoutStep(3);
    return;
  }

  const totals = calculateCheckoutTotals();
  const addonTags = [];
  if (checkoutShippingMode === 'BOX_SAVER') addonTags.push('[GOM ĐƠN BOX SAVER]');
  else if (checkoutShippingMode === 'SHOWROOM_PICKUP') addonTags.push('[NHẬN TẠI SHOWROOM BIÊN HÒA]');
  if (checkoutBoxProtector) addonTags.push('[+HỘP NHỰA PROTECTOR PVC 15K]');
  if (checkoutAppliedVoucher) addonTags.push(`[VOUCHER: ${checkoutAppliedVoucher.code} -${formatVND(totals.voucherDiscount)}]`);

  const finalNote = [addonTags.join(' '), rawNote].filter(Boolean).join(' | ');

  const shippingMethod = checkoutShippingMode === 'BOX_SAVER'
    ? 'BOX_SAVER'
    : (checkoutShippingMode === 'SHOWROOM_PICKUP' ? 'PICKUP' : 'SPX');

  const selectedCheckoutItems = cart.filter(it => it.selected !== false);
  if (!selectedCheckoutItems.length) {
    showToast('Chưa có mô hình xe nào được chọn để đặt cọc!', 'warning');
    if (btn) btn.disabled = false;
    return;
  }

  // Kiểm tra tồn kho độc lập Box / Card từng món trước khi gửi đơn hàng
  for (const it of selectedCheckoutItems) {
    const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == it.productId);
    if (!prod) continue;
    const isPre = String(prod.Status || prod.status || '').toLowerCase() === 'pre_order';
    if (!isPre) {
      const pricing = getProductBoxCardPricing(prod);
      const pack = it.packType || 'box';
      const available = pack === 'card' ? Number(pricing.stockCard ?? 0) : Number(pricing.stockBox ?? 0);
      const packLabel = pack === 'card' ? 'Bản Vỉ Card' : 'Bản Hộp Box';
      if (available <= 0) {
        showToast(`Rất tiếc! Mẫu xe "${it.name}" (${packLabel}) hiện đã hết hàng trong kho! Vui lòng chọn bản còn hàng hoặc xóa khỏi giỏ để tiếp tục!`, 'error', 6000);
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerHTML = 'Xác Nhận Đặt Cọc & Hoàn Tất Đơn Hàng <i class="fa-solid fa-arrow-right" style="margin-left:6px;"></i>';
        goToCheckoutStep(1);
        renderCartDrawer();
        return;
      }
      if (it.quantity > available) {
        showToast(`Rất tiếc! Mẫu xe "${it.name}" (${packLabel}) chỉ còn ${available} xe trong kho (bạn đặt ${it.quantity}). Vui lòng giảm số lượng!`, 'error', 6000);
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerHTML = 'Xác Nhận Đặt Cọc & Hoàn Tất Đơn Hàng <i class="fa-solid fa-arrow-right" style="margin-left:6px;"></i>';
        goToCheckoutStep(1);
        renderCartDrawer();
        return;
      }
    }
  }

  const payload = {
    fullName: name,
    phone: phone,
    email: email || (currentUser ? currentUser.email : ''),
    address: address,
    addressType: (typeof currentCheckoutAddressType !== 'undefined' ? currentCheckoutAddressType : 'NEW'),
    oldAddressNote: document.getElementById('checkoutOldWardNote')?.value.trim() || '',
    note: finalNote,
    paymentMethod: normalizedPayMethod,
    shippingMethod: shippingMethod,
    shippingFee: totals.shippingFee,
    boxProtector: checkoutBoxProtector ? 1 : 0,
    protectorFee: totals.protectorFee || 0,
    voucherCode: checkoutAppliedVoucher ? checkoutAppliedVoucher.code : null,
    voucherDiscount: totals.voucherDiscount || 0,
    totalAmount: totals.grandTotal,
    depositAmount: totals.depositAmount,
    items: selectedCheckoutItems.map(i => {
      const chosenPack = i.packType || 'box';
      return {
        productId: i.productId,
        sku: i.sku,
        name: i.name,
        price: i.price,
        packType: chosenPack,
        packagingOption: chosenPack,
        deposit: i.depositAmount || Math.round(i.price * 0.3),
        image: i.imageUrl,
        orderType: i.isPreOrder ? 'PRE_ORDER' : 'IN_STOCK',
        quantity: i.quantity
      };
    })
  };

  try {
    try {
      localStorage.setItem('minigt_customer_phone', phone);
      localStorage.setItem('minigt_customer_name', name);
    } catch (_) {}

    const json = await api.post('/api/orders', payload);
    const createdOrder = json.order || json.data;

    if (json.success && createdOrder) {
      const code = createdOrder.code || createdOrder.orderCode || createdOrder.OrderCode;
      if (api.addMyOrderCode) api.addMyOrderCode(code);
      if (typeof launchCollectorConfetti === 'function') launchCollectorConfetti();

      // Cập nhật điểm thưởng & đơn hàng cho tài khoản hội viên đang đăng nhập
      if (currentUser) {
        currentUser.totalOrders = (currentUser.totalOrders || 0) + 1;
        const dep = createdOrder.depositAmount || 0;
        const earnedPoints = Math.max(20, Math.floor(dep / 10000));
        currentUser.points = (currentUser.points || 0) + earnedPoints;
        currentUser.totalSpent = (currentUser.totalSpent || 0) + (createdOrder.totalAmount || dep);

        // Tự động đồng bộ số điện thoại và địa chỉ nhận hàng vào hồ sơ hội viên Supabase
        let profileChanged = false;
        if (phone && (!currentUser.phone || currentUser.phone !== phone)) {
          currentUser.phone = phone;
          profileChanged = true;
        }
        if (address && (!currentUser.address || currentUser.address !== address)) {
          currentUser.address = address;
          profileChanged = true;
        }
        if (name && (!currentUser.fullName || currentUser.fullName !== name)) {
          currentUser.fullName = name;
          profileChanged = true;
        }

        try { localStorage.setItem('minigt_user', JSON.stringify(currentUser)); } catch (_) {}

        if (profileChanged) {
          try {
            safeFetch('/api/auth/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: currentUser.userId || currentUser.id,
                email: currentUser.email,
                fullName: currentUser.fullName,
                phone: currentUser.phone,
                address: currentUser.address
              })
            }).catch(() => {});
          } catch (_) {}
        }
        if (api && api.getSharedUsers && api.saveSharedUsers) {
          try {
            const uList = api.getSharedUsers();
            const matchU = uList.find(u => u.email === currentUser.email || u.userId == currentUser.userId);
            if (matchU) {
              matchU.totalOrders = currentUser.totalOrders;
              matchU.points = currentUser.points;
              matchU.totalSpent = currentUser.totalSpent;
              api.saveSharedUsers(uList);
            }
          } catch (_) {}
        }
        updateUserHeaderUI();
      }

      showToast(`🎉 Đặt đơn #${code} thành công! Cảm ơn bạn đã đặt hàng, thông tin xác nhận kiện mô hình đã được gửi tự động qua email của bạn!`, 'success', 6000);
      renderCheckoutStep4(createdOrder);
    } else {
      showToast(json.message || 'Không thể khởi tạo đơn hàng, vui lòng kiểm tra lại.', 'error');
    }
  } catch (err) {
    showToast('Lỗi tạo đơn hàng: ' + (err.message || 'Vui lòng kiểm tra lại thông tin'), 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.innerHTML = 'Xác Nhận & Đặt Hàng Ngay ➔';
  }
}

function confirmCustomerTransferDone(orderCode) {
  const btn = document.getElementById('btnConfirmTransferDone');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã báo Admin kiểm tra chuyển khoản!';
    btn.style.background = '#059669';
    btn.style.borderColor = '#059669';
  }
  const box = document.getElementById('paymentLiveStatusBox');
  if (box) {
    box.style.background = '#eff6ff';
    box.style.borderColor = '#60a5fa';
    box.innerHTML = `
      <div class="pulse-spinner" style="border-color:#2563eb; border-top-color:transparent;"></div>
      <div style="text-align:left;">
        <div style="font-weight:800; color:#1d4ed8; font-size:13px;">
          ✅ Đã gửi thông báo xác nhận chuyển khoản đơn #${escapeHtml(orderCode)} tới Admin!
        </div>
        <div style="font-size:11.5px; color:#334155; margin-top:2px;">
          Admin đang mở App MB Bank đối soát biến động số dư. Ngay khi Admin duyệt tiền, trạng thái sẽ nhảy trực tiếp tại đây!
        </div>
      </div>
    `;
  }
  safeFetch('/api/orders/notify-transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderCode })
  }).catch(() => {});
  if (api && typeof api.emitRealtimeSync === 'function') {
    api.emitRealtimeSync('CUSTOMER_REPORTED_TRANSFER', { orderCode, timestamp: Date.now() });
  }
  showToast(`Đã gửi thông báo chuyển khoản đơn #${orderCode} tới Admin!`, 'success');
}

function renderCheckoutStep4(rawOrder) {
  const order = api.normalizeOrderObject ? api.normalizeOrderObject(rawOrder) : rawOrder;
  const orderCode = order.code || order.orderCode || order.OrderCode;
  activeStep4OrderCode = orderCode;

  // Chỉ xóa các mô hình xe đã được tích chọn và thanh toán trong đơn này, giữ lại xe chưa chọn
  cart = cart.filter(it => it.selected === false);
  saveCart();
  renderCartDrawer();
  updateCartBadge();
  sessionStorage.removeItem('minigt_checkout_info');

  goToCheckoutStep(4);

  const container = document.getElementById('checkoutStep4Details');
  if (!container) return;

  const paymentMethod = (order.paymentMethod || selectedCheckoutPaymentMethod || 'DEPOSIT').toUpperCase();
  const isPayOS = paymentMethod.includes('PAYOS') || paymentMethod.includes('VIETQR_PAYOS') || paymentMethod === 'DEPOSIT';
  const isCOD = paymentMethod.includes('COD');
  const isFull = paymentMethod.includes('FULL') || paymentMethod.includes('BANK_TRANSFER');

  const totalAmount = Number(order.totalAmount ?? order.total ?? 0);
  const depositAmount = Number(order.depositAmount ?? order.totalDeposit ?? 0);
  let transferAmount = depositAmount > 0 ? depositAmount : totalAmount;
  if (isFull) transferAmount = totalAmount;

  const transferDesc = `MINI GT #${orderCode}`;
  const bankAcc = storeSettings?.bank_account_no || '87654321082007';
  const bankName = storeSettings?.bank_name || 'MBBank (Ngân Hàng Quân Đội)';
  const accName = storeSettings?.bank_account_name || 'DO QUOC THINH';
  const dynamicQrUrl = `https://img.vietqr.io/image/MB-${bankAcc}-compact2.png?amount=${Math.round(transferAmount)}&addInfo=${encodeURIComponent(transferDesc)}&accountName=${encodeURIComponent(accName)}`;
  const originalQrImg = 'image/qr-mb-doquocthinh.png';

  const orderItemsList = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
  const itemsPreviewStep4Html = orderItemsList.length > 0 ? `
    <div style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:12px; padding:12px 14px; margin-bottom:14px; text-align:left;">
      <div style="font-size:11.5px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:8px;">
        <i class="fa-solid fa-cube" style="color:var(--color-primary); margin-right:4px;"></i> Danh sách mô hình xe đã đặt (${orderItemsList.length} mẫu):
      </div>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${orderItemsList.map(it => {
          const pack = String(it.packagingOption || it.packType || 'box').toLowerCase();
          const itPrice = Number(it.price || it.unitPrice || 0);
          const itQty = Number(it.quantity || 1);
          const pid = it.productId || it.ProductId || it.id;
          let pName = it.name || it.productName || it.ProductName || '';
          let pImg = it.image || it.imageUrl || it.ImageUrl || it.productImage || '';
          if ((!pName || !pImg || pImg.includes('hero-banner')) && pid) {
            const matched = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == pid);
            if (matched) {
              if (!pName) pName = matched.Name || matched.name;
              if (!pImg || pImg.includes('hero-banner')) pImg = matched.ImageUrl || matched.image;
            }
          }
          if (!pName) pName = 'Mô hình MINI GT 1:64';
          if (!pImg) pImg = 'image/hero-banner.jpg';
          return `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:12px; border-bottom:1px dashed #f1f5f9; padding-bottom:5px;">
              <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                <img src="${pImg}" onerror="this.src='image/hero-banner.jpg'" style="width:36px; height:36px; object-fit:contain; border-radius:6px; border:1px solid #e2e8f0; background:#f8fafc; padding:1px; flex-shrink:0;">
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                  <div style="font-weight:700; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:260px;" title="${escapeHtml(pName)}">${escapeHtml(pName)}</div>
                  <div style="display:flex; align-items:center; gap:6px; margin-top:1px;">
                    <span class="pack-badge ${pack === 'card' ? 'pack-card' : 'pack-box'}">${pack === 'card' ? '🛡️ VỈ CARD' : '📦 HỘP BOX'}</span>
                    <span style="color:#64748b; font-size:11px;">x${itQty}</span>
                  </div>
                </div>
              </div>
              <div style="text-align:right; flex-shrink:0;">
                <strong style="color:var(--color-primary); font-size:12.5px;">${formatVND(itPrice * itQty)}</strong>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  ` : '';

  container.innerHTML = `
    <div style="text-align:center;">
      <!-- KHỐI TRẠNG THÁI ĐƠN HÀNG & MÃ SPX THỜI GIAN THỰC (NẰM GỌN TRONG MODAL, KHÔNG ĐÈ NÚT) -->
      <div id="step4RealtimeApprovalBanner" style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:12px; padding:16px; margin-bottom:14px; text-align:left;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:10px;">
            <i class="fa-solid fa-circle-check" style="font-size:26px; color:#16a34a;"></i>
            <div>
              <h3 style="margin:0; font-size:16px; color:#15803d; font-weight:800;">ĐẶT HÀNG THÀNH CÔNG! ĐÃ GỬI TỚI ADMIN</h3>
              <div style="font-size:12.5px; color:#166534;">Mã đơn hàng của bạn: <strong style="color:#b91c1c; font-size:15px; font-family:monospace;">#${escapeHtml(orderCode)}</strong></div>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-outline" style="font-size:11px; padding:4px 10px;" onclick="copyToClipboard('${escapeHtml(orderCode)}', 'Đã sao chép mã đơn hàng!')">
            <i class="fa-regular fa-copy"></i> Copy mã đơn
          </button>
        </div>

        <div id="paymentLiveStatusBox" class="payment-status-pulsing" style="margin-top:8px; background:#ffffff; border:1.5px dashed #86efac; border-radius:10px; padding:12px 14px;">
          <div class="pulse-spinner"></div>
          <div style="text-align:left;">
            <div style="font-weight:800; color:#d97706; font-size:13px;">
              ⏳ Đang kết nối trực tiếp với Admin — Chờ Admin duyệt đơn &amp; dán mã vận đơn SPX Express...
            </div>
            <div style="font-size:11.5px; color:#475569; margin-top:2px;">
              Ngay khi Admin bấm <strong>Duyệt đơn</strong> hoặc lưu <strong>Mã SPX Express</strong>, thông báo và mã vận đơn sẽ tự động xuất hiện ngay tại đây!
            </div>
          </div>
        </div>
      </div>

      ${itemsPreviewStep4Html}

      ${isCOD ? `
        <div style="background:#f8fafc; border:1.5px solid #cbd5e1; border-radius:10px; padding:12px 14px; margin-bottom:14px; text-align:left;">
          <div style="font-weight:700; color:#1e293b; font-size:13px; margin-bottom:4px;">
            <i class="fa-solid fa-hand-holding-dollar" style="color:#059669; margin-right:4px;"></i> Hình thức: Thanh toán khi nhận hàng (Ship COD SPX)
          </div>
          <div style="font-size:12px; color:#64748b;">
            Tổng tiền thanh toán cho bưu tá SPX khi nhận và kiểm tra kiện xe: <strong style="color:#dc2626; font-size:14px;">${formatVND(totalAmount)}</strong>.
          </div>
        </div>
      ` : (isPayOS ? `
        <div class="payos-payment-card" style="background:#ffffff; border:2px solid #0284c7; border-radius:12px; padding:16px; margin-bottom:14px; text-align:left; box-shadow:0 6px 20px rgba(2,132,199,0.12);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #e0f2fe; padding-bottom:10px; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="background:#0284c7; color:#fff; font-size:11px; font-weight:900; padding:3px 8px; border-radius:6px; letter-spacing:0.5px;">⚡ PAYOS VIETQR</span>
              <strong style="font-size:14px; color:#0f172a;">${depositAmount > 0 ? 'QUÉT MÃ THANH TOÁN TIỀN CỌC TỰ ĐỘNG' : 'QUÉT MÃ THANH TOÁN ĐƠN HÀNG TỰ ĐỘNG'}</strong>
            </div>
            <span style="font-size:11.5px; color:#0369a1; background:#f0f9ff; padding:3px 10px; border-radius:12px; border:1px solid #bae6fd; font-weight:700;">
              <i class="fa-solid fa-bolt"></i> Xác nhận tức thì 24/7
            </span>
          </div>

          <div id="payosPaymentArea_${escapeHtml(orderCode)}" style="min-height:160px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <div class="pulse-spinner" style="border-color:#0284c7; border-top-color:transparent; margin-bottom:10px;"></div>
            <div style="font-size:13px; font-weight:700; color:#0369a1;">Đang khởi tạo cổng thanh toán tự động PayOS VietQR...</div>
          </div>
        </div>
      ` : `
        <div class="bank-payment-card" style="background:#ffffff; border:1.5px solid #fecaca; border-radius:12px; padding:14px; margin-bottom:14px; text-align:left; box-shadow:0 4px 12px rgba(220,38,38,0.06);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #f1f5f9; padding-bottom:8px;">
            <span style="font-size:12px; font-weight:800; color:#dc2626; text-transform:uppercase;">
              <i class="fa-solid fa-building-columns"></i> ${isFull ? 'Thanh toán Full 100% qua MB Bank' : 'Chuyển khoản cọc MB Bank'} (Đỗ Quốc Thịnh)
            </span>
            <button type="button" class="btn btn-sm btn-outline" style="font-size:10.5px; padding:2px 8px;" onclick="const img=document.getElementById('step4QrImg'); if(img.dataset.mode==='dynamic'){img.src='${originalQrImg}'; img.dataset.mode='original'; this.textContent='Chuyển sang QR tự điền tiền';}else{img.src='${dynamicQrUrl}'; img.dataset.mode='dynamic'; this.textContent='Xem QR gốc MB';}">
              Xem QR gốc MB
            </button>
          </div>

          <div style="display:grid; grid-template-columns: minmax(180px, 210px) 1fr; gap:16px; align-items:center;">
            <div style="text-align:center;">
              <img src="${dynamicQrUrl}" data-mode="dynamic" id="step4QrImg" alt="QR MB Bank" style="width:100%; max-width:210px; border-radius:10px; border:1.5px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.08); padding:4px; background:#fff; margin:0 auto; display:block;" onerror="this.src='${originalQrImg}'">
              <div style="font-size:11px; color:#64748b; margin-top:5px; font-weight:600;"><i class="fa-solid fa-qrcode"></i> Quét mã VietQR MB</div>
            </div>

            <div style="font-size:12px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#64748b;">Ngân hàng:</span>
                <strong style="color:#1d4ed8;">${escapeHtml(bankName)}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="color:#64748b;">Số tài khoản:</span>
                <div style="display:flex; align-items:center; gap:4px;">
                  <strong style="font-family:var(--font-mono); color:#dc2626; font-size:13px;">${escapeHtml(bankAcc)}</strong>
                  <button type="button" class="btn-copy-mini" onclick="copyToClipboard('${escapeHtml(bankAcc)}', 'Đã copy STK MB Bank!')"><i class="fa-regular fa-copy"></i></button>
                </div>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#64748b;">Chủ tài khoản:</span>
                <strong>${escapeHtml(accName)}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="color:#64748b;">${isFull ? 'Số tiền Full:' : 'Số tiền cọc:'}</span>
                <div style="display:flex; align-items:center; gap:4px;">
                  <strong style="color:#dc2626; font-size:13.5px; font-weight:800;">${formatVND(transferAmount)}</strong>
                  <button type="button" class="btn-copy-mini" onclick="copyToClipboard('${transferAmount}', 'Đã copy Số tiền!')"><i class="fa-regular fa-copy"></i></button>
                </div>
              </div>
              <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px; padding:6px 8px; margin-top:4px;">
                <div style="font-size:10px; color:#1e40af; font-weight:700;">NỘI DUNG CHUYỂN KHOẢN (MEMO):</div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                  <strong style="color:#1d4ed8; font-family:var(--font-mono); font-size:13px;">${escapeHtml(transferDesc)}</strong>
                  <button type="button" class="btn-copy-mini" style="background:#2563eb; color:#fff;" onclick="copyToClipboard('${escapeHtml(transferDesc)}', 'Đã copy Nội dung chuyển khoản!')"><i class="fa-regular fa-copy"></i> Copy</button>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top:12px; padding-top:10px; border-top:1px dashed #e2e8f0; display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
            <span style="font-size:11.5px; color:#64748b;"><i class="fa-solid fa-bolt" style="color:#eab308;"></i> Sau khi quét mã chuyển khoản xong, bấm nút bên cạnh để báo Admin ưu tiên duyệt ngay:</span>
            <button type="button" id="btnConfirmTransferDone" class="btn btn-sm btn-primary" style="background:#2563eb; border-color:#2563eb; font-weight:800;" onclick="confirmCustomerTransferDone('${escapeHtml(orderCode)}')">
              <i class="fa-solid fa-paper-plane"></i> Tôi đã chuyển khoản xong
            </button>
          </div>
        </div>
      `)}

      <div class="stepper-actions" style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
        <button type="button" class="btn btn-outline" onclick="printCustomerOrderInvoice('${escapeHtml(orderCode)}')">
          <i class="fa-solid fa-print" style="margin-right:4px;"></i> In Phiếu Đơn / Cọc
        </button>
        <button type="button" class="btn btn-outline" onclick="closeModal('checkoutModal'); openMyOrdersModal();">
          <i class="fa-solid fa-box-archive" style="margin-right:4px;"></i> Mở Trung Tâm Đơn Hàng
        </button>
        <button type="button" class="btn btn-primary" onclick="closeModal('checkoutModal');">
          Hoàn tất &amp; Tiếp tục xem xe ➔
        </button>
      </div>
    </div>
  `;

  updateLiveStep4OrderStatus(order);
  startPaymentPolling(orderCode);
  if (isPayOS) {
    initPayosStep4Checkout(orderCode, transferAmount);
  }
}

async function initPayosStep4Checkout(orderCode, expectedAmount) {
  const container = document.getElementById(`payosPaymentArea_${orderCode}`);
  if (!container) return;

  try {
    const json = await safeFetch(`/api/orders/${encodeURIComponent(orderCode)}/payos-link`, {
      method: 'POST'
    });

    if (json && json.success && json.data) {
      const { checkoutUrl, qrCode, amount, accountNumber, accountName, bin } = json.data;
      const transferAmount = Number(amount || expectedAmount || 0);
      const memoCode = String(orderCode || '').startsWith('MGT') ? String(orderCode) : `MGT ${orderCode}`;

      const qrImageSrc = (qrCode && (qrCode.startsWith('http') || qrCode.startsWith('data:image')))
        ? qrCode
        : `https://img.vietqr.io/image/${bin || '970422'}-${accountNumber || '87654321082007'}-compact2.png?amount=${Math.round(transferAmount)}&addInfo=${encodeURIComponent(memoCode)}&accountName=${encodeURIComponent(accountName || 'DO QUOC THINH')}`;

      container.innerHTML = `
        <div style="display:grid; grid-template-columns: minmax(210px, 240px) 1fr; gap:18px; align-items:center; width:100%;">
          <div style="text-align:center;">
            <img src="${qrImageSrc}" alt="VietQR PayOS" style="width:100%; max-width:240px; border-radius:12px; border:2px solid #0284c7; box-shadow:0 6px 18px rgba(2,132,199,0.2); padding:6px; background:#fff; margin:0 auto; display:block;">
            <div style="font-size:11.5px; color:#475569; margin-top:6px; font-weight:700;"><i class="fa-solid fa-qrcode" style="color:#0284c7;"></i> Quét bằng app ngân hàng</div>
          </div>

          <div style="font-size:12.5px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
              <span style="color:#64748b;">Số tiền cần thanh toán:</span>
              <strong style="color:#dc2626; font-size:16px; font-weight:900;">${formatVND(transferAmount)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="color:#64748b;">Nội dung chuyển khoản (Memo):</span>
              <div style="display:flex; align-items:center; gap:6px;">
                <strong style="color:#0284c7; font-family:var(--font-mono, monospace); font-size:14px; font-weight:900; background:#f0f9ff; padding:2px 8px; border-radius:6px; border:1px solid #bae6fd;">${escapeHtml(memoCode)}</strong>
                <button type="button" class="btn-copy-mini" style="background:#0284c7; color:#fff;" onclick="copyToClipboard('${escapeHtml(memoCode)}', 'Đã copy nội dung!')"><i class="fa-regular fa-copy"></i> Copy</button>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
              <span style="color:#64748b;">Chủ tài khoản:</span>
              <strong>${escapeHtml(accountName || 'DO QUOC THINH')}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <span style="color:#64748b;">Số tài khoản PayOS:</span>
              <div style="display:flex; align-items:center; gap:6px;">
                <strong style="font-family:var(--font-mono, monospace); color:#0f172a; font-size:13.5px;">${escapeHtml(accountNumber || '87654321082007')}</strong>
                <button type="button" class="btn-copy-mini" onclick="copyToClipboard('${escapeHtml(accountNumber || '87654321082007')}', 'Đã copy STK!')"><i class="fa-regular fa-copy"></i></button>
              </div>
            </div>

            <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
              <a href="${checkoutUrl}" target="_blank" class="btn btn-sm" style="background:#0284c7; color:#fff; border:none; padding:8px 15px; border-radius:8px; font-weight:800; font-size:12px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(2,132,199,0.3);">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Mở Cổng Thanh Toán PayOS ↗
              </a>
              <button type="button" class="btn btn-sm" style="background:#16a34a; color:#fff; border:none; padding:8px 15px; border-radius:8px; font-weight:800; font-size:12px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(22,163,74,0.3); cursor:pointer;" onclick="triggerInstantPayOSCheck('${escapeHtml(orderCode)}')">
                <i class="fa-solid fa-arrows-rotate"></i> Tôi đã chuyển tiền (Kiểm tra ngay)
              </button>
              <button type="button" class="btn btn-sm btn-outline" style="border-color:#0284c7; color:#0284c7; font-weight:700; font-size:12px; padding:7px 12px;" onclick="copyToClipboard('${checkoutUrl}', 'Đã copy link thanh toán PayOS!')">
                <i class="fa-regular fa-copy"></i> Copy Link PayOS
              </button>
            </div>
          </div>
        </div>

        <div style="margin-top:14px; width:100%; background:#eff6ff; border:1px dashed #93c5fd; border-radius:8px; padding:10px 12px; display:flex; align-items:center; gap:10px;">
          <div class="pulse-spinner" style="border-color:#2563eb; border-top-color:transparent; flex-shrink:0;"></div>
          <div style="font-size:12px; color:#1e40af; line-height:1.4;">
            <strong>Hệ thống đang chờ bạn chuyển khoản:</strong> Sau khi bạn thực hiện giao dịch trên App ngân hàng, PayOS Webhook sẽ tự động xác nhận đơn hàng của bạn trong <strong>1 - 3 giây</strong>!
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="padding:12px; color:#b91c1c; font-size:12.5px; text-align:center;">
          <i class="fa-solid fa-triangle-exclamation"></i> Không thể tạo mã PayOS tự động. Vui lòng liên hệ Admin hoặc quét mã chuyển khoản MB Bank!
        </div>
      `;
    }
  } catch (err) {
    console.warn('[PayOS Init Error]:', err);
    container.innerHTML = `
      <div style="padding:12px; color:#b91c1c; font-size:12.5px; text-align:center;">
        <i class="fa-solid fa-triangle-exclamation"></i> Lỗi kết nối PayOS: ${escapeHtml(err.message || 'Không thể tạo link')}.
      </div>
    `;
  }
}

const notifiedOrdersInStep4 = new Set();

function updateLiveStep4OrderStatus(rawOrd) {
  if (!rawOrd) return;
  const ord = api.normalizeOrderObject ? api.normalizeOrderObject(rawOrd) : rawOrd;
  const box = document.getElementById('paymentLiveStatusBox');
  if (!box) return;

  const code = ord.code || ord.orderCode || ord.OrderCode || '';

  // CHẶN TRIỆT ĐỂ: Tuyệt đối không cho phép đơn hàng khác (kể cả đơn cũ bị hủy) ghi đè lên Step 4 của đơn đang mở!
  if (!activeStep4OrderCode || (code && code !== activeStep4OrderCode)) {
    return;
  }

  // Cập nhật trạng thái box thanh toán PayOS nếu đơn đã thanh toán thành công
  const payosArea = document.getElementById(`payosPaymentArea_${code}`);
  if (payosArea && (ord.paymentStatus === 'PAID' || ord.paymentStatus === 'PARTIALLY_PAID' || ord.status === 'CONFIRMED')) {
    payosArea.innerHTML = `
      <div style="text-align:center; padding:16px; width:100%; background:#f0fdf4; border:1.5px solid #86efac; border-radius:10px;">
        <i class="fa-solid fa-circle-check" style="color:#16a34a; font-size:36px; margin-bottom:8px;"></i>
        <div style="font-size:15px; font-weight:900; color:#15803d; text-transform:uppercase;">
          🎉 ĐÃ XÁC NHẬN THANH TOÁN TỰ ĐỘNG THÀNH CÔNG!
        </div>
        <div style="font-size:12px; color:#166534; margin-top:4px;">
          Cổng PayOS đã khớp lệnh và tự động duyệt đơn hàng của bạn. Bạn không cần chuyển khoản thêm nữa!
        </div>
      </div>
    `;
  }

  const status = String(ord.status || ord.Status || 'PENDING').toUpperCase();
  const trackingCode = ord.trackingCode || ord.TrackingCode || null;
  const isApproved = ['CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED'].includes(status) || Boolean(trackingCode);

  // Kích hoạt pháo hoa và thông báo chúc mừng khi đơn vừa được chuyển trạng thái thanh toán thành công
  if ((ord.paymentStatus === 'PAID' || ord.paymentStatus === 'PARTIALLY_PAID' || isApproved) && status !== 'CANCELLED' && !notifiedOrdersInStep4.has(code)) {
    notifiedOrdersInStep4.add(code);
    if (typeof launchCollectorConfetti === 'function') launchCollectorConfetti();
    showToast(`🎉 Đơn hàng #${code} đã được xác nhận thanh toán tự động thành công!`, 'success', 5000);
  }

  if (status === 'CANCELLED') {
    const cancelReason = ord.cancelReason || ord.CancelReason || 'Admin đã xử lý hủy đơn';
    const isCustCancel = cancelReason.toLowerCase().includes('khách') || cancelReason.toLowerCase().includes('chủ động') || cancelReason.toLowerCase().includes('yêu cầu');
    const cancelTitle = isCustCancel
      ? `⚠️ ĐƠN HÀNG #${escapeHtml(code)} ĐÃ ĐƯỢC BẠN HỦY THÀNH CÔNG`
      : `❌ ĐƠN HÀNG #${escapeHtml(code)} ĐÃ BỊ HỦY BỞI QUẢN TRỊ VIÊN`;

    box.className = '';
    box.style.background = '#ffffff';
    box.style.border = isCustCancel ? '2px solid #f59e0b' : '2px solid #ef4444';
    box.style.borderRadius = '8px';
    box.style.padding = '16px';
    box.style.color = '#1f2937';
    box.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';

    box.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:12px; text-align:left;">
        <div style="font-size:24px; color:${isCustCancel ? '#d97706' : '#dc2626'}; line-height:1; flex-shrink:0;">
          <i class="fa-solid ${isCustCancel ? 'fa-triangle-exclamation' : 'fa-circle-xmark'}"></i>
        </div>
        <div style="flex:1;">
          <div style="font-size:14px; font-weight:800; color:${isCustCancel ? '#b45309' : '#dc2626'};">
            ${cancelTitle}
          </div>
          <div style="margin-top:8px; background:${isCustCancel ? '#fffbeb' : '#fef2f2'}; border:1px solid ${isCustCancel ? '#fde68a' : '#fee2e2'}; border-radius:6px; padding:8px 12px; font-size:13px; color:#374151;">
            <strong>Lý do hủy đơn:</strong> <span style="color:${isCustCancel ? '#b45309' : '#dc2626'}; font-weight:700;">${escapeHtml(cancelReason)}</span>
          </div>
          <div style="margin-top:10px; font-size:12.5px; color:#4b5563; line-height:1.5;">
            Quý khách có nhu cầu đặt lại mẫu xe hoặc cần hỗ trợ, vui lòng liên hệ Hotline / Zalo: <strong style="color:#dc2626; font-size:13px;">0981 400 400</strong>.
          </div>
          <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
            <a href="tel:0981400400" class="btn btn-sm" style="background:#dc2626; color:#ffffff; border:none; padding:7px 14px; border-radius:6px; font-size:12px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-phone"></i> Gọi Hotline 0981 400 400
            </a>
            <a href="https://zalo.me/0981400400" target="_blank" class="btn btn-sm" style="background:#ffffff; color:#0284c7; border:1px solid #0284c7; padding:7px 14px; border-radius:6px; font-size:12px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-comments"></i> Nhắn Zalo Hỗ Trợ
            </a>
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (!isApproved && ord.paymentStatus !== 'PAID' && ord.paymentStatus !== 'PARTIALLY_PAID') {
    return;
  }

  const isPreOrderOriginal = Boolean(ord.wasPreOrder || ord.hasPreOrder || ord.HasPreOrder);
  const isStockArrived = Boolean(ord.isStockArrived || ord.preOrderNotified || ord.PreOrderNotified) || (isPreOrderOriginal && ['PREPARING', 'SHIPPING', 'DELIVERED'].includes(status));
  const isWaitingPreOrder = isPreOrderOriginal && !isStockArrived;

  box.className = '';
  box.style.background = isWaitingPreOrder ? '#f5f3ff' : '#ecfdf5';
  box.style.border = isWaitingPreOrder ? '2px solid #a855f7' : '2px solid #10b981';
  box.style.borderRadius = '10px';
  box.style.padding = '14px';
  box.style.color = isWaitingPreOrder ? '#5b21b6' : '#065f46';

  if (isWaitingPreOrder) {
    box.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:10px; text-align:left;">
        <div style="font-size:26px; color:#7c3aed; line-height:1;"><i class="fa-solid fa-clock"></i></div>
        <div style="flex:1;">
          <div style="font-size:14px; font-weight:900; color:#6d28d9; text-transform:uppercase;">
            ⏳ ĐÃ XÁC NHẬN ĐẶT CỌC PRE-ORDER #${escapeHtml(code)} THÀNH CÔNG!
          </div>
          <div style="font-size:12px; color:#5b21b6; margin-top:3px;">
            Trạng thái: <strong>${escapeHtml(ord.statusLabel || status)}</strong> | Thanh toán: <strong>${escapeHtml(ord.paymentStatusLabel || ord.paymentStatus)}</strong>
          </div>
          <div style="margin-top:8px; background:#ffffff; border:1px solid #ddd6fe; border-radius:8px; padding:10px 12px; font-size:12.5px; color:#4c1d95; line-height:1.5;">
            Cửa hàng Mini GT Biên Hòa đã ghi nhận suất cọc xe của bạn. Admin sẽ chủ động gửi thông báo qua <strong>Zalo</strong>, <strong>Email</strong> hoặc <strong>gọi điện thoại trực tiếp</strong> vào số điện thoại của bạn trong thời gian sắp tới ngay khi lô hàng mô hình cập bến tại cửa hàng Biên Hòa. Sau đó cửa hàng sẽ đóng gói chống sốc và bàn giao SPX Express kèm mã vận đơn gửi đến bạn.
          </div>
          ${trackingCode ? `
            <div style="margin-top:10px; background:#fff7ed; border:1.5px solid #fb923c; border-radius:8px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <div>
                <div style="font-size:10.5px; font-weight:800; color:#c2410c; text-transform:uppercase;">
                  <i class="fa-solid fa-truck-fast"></i> MÃ VẬN ĐƠN SPX EXPRESS ĐÃ ĐƯỢC CẤP:
                </div>
                <div style="font-family:monospace; font-size:17px; font-weight:900; color:#ea580c; letter-spacing:0.5px;">
                  ${escapeHtml(trackingCode)}
                </div>
              </div>
              <div style="display:flex; gap:6px;">
                <button type="button" class="btn btn-sm btn-outline" style="border-color:#fdba74; color:#ea580c; background:#fff; font-size:11.5px; padding:4px 10px;" onclick="copyToClipboard('${escapeHtml(trackingCode)}', 'Đã sao chép mã SPX: ${escapeHtml(trackingCode)}')">
                  <i class="fa-regular fa-copy"></i> Sao chép mã SPX
                </button>
                <a href="https://spx.vn/vi" target="_blank" class="btn btn-sm btn-primary" style="background:#ea580c; border-color:#ea580c; font-size:11.5px; padding:4px 10px; text-decoration:none;">
                  Tra cứu SPX.vn ↗
                </a>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  } else if (isPreOrderOriginal && isStockArrived) {
    box.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:10px; text-align:left;">
        <div style="font-size:26px; color:#059669; line-height:1;"><i class="fa-solid fa-boxes-packing"></i></div>
        <div style="flex:1;">
          <div style="font-size:14px; font-weight:900; color:#047857; text-transform:uppercase;">
            📦 LÔ HÀNG PRE-ORDER ĐÃ VỀ KHO BIÊN HÒA #${escapeHtml(code)}!
          </div>
          <div style="font-size:12px; color:#065f46; margin-top:3px;">
            Trạng thái hiện tại: <strong>${escapeHtml(ord.statusLabel || status)}</strong> | Thanh toán: <strong>${escapeHtml(ord.paymentStatusLabel || ord.paymentStatus)}</strong>
          </div>
          <div style="margin-top:8px; background:#ffffff; border:1px solid #a7f3d0; border-radius:8px; padding:10px 12px; font-size:12.5px; color:#065f46; line-height:1.5;">
            Lô xe mô hình đặt trước của bạn đã <strong>chính thức cập bến kho Biên Hòa</strong> và chuyển sang trạng thái <strong>hàng có sẵn</strong>. Đội ngũ cửa hàng đang kiểm tra chất lượng và bọc 4 lớp bóng khí chống sốc để bàn giao sớm nhất cho SPX Express.
          </div>
          ${trackingCode ? `
            <div style="margin-top:10px; background:#fff7ed; border:1.5px solid #fb923c; border-radius:8px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <div>
                <div style="font-size:10.5px; font-weight:800; color:#c2410c; text-transform:uppercase;">
                  <i class="fa-solid fa-truck-fast"></i> MÃ VẬN ĐƠN SPX EXPRESS ĐÃ ĐƯỢC CẤP:
                </div>
                <div style="font-family:monospace; font-size:17px; font-weight:900; color:#ea580c; letter-spacing:0.5px;">
                  ${escapeHtml(trackingCode)}
                </div>
              </div>
              <div style="display:flex; gap:6px;">
                <button type="button" class="btn btn-sm btn-outline" style="border-color:#fdba74; color:#ea580c; background:#fff; font-size:11.5px; padding:4px 10px;" onclick="copyToClipboard('${escapeHtml(trackingCode)}', 'Đã sao chép mã SPX: ${escapeHtml(trackingCode)}')">
                  <i class="fa-regular fa-copy"></i> Sao chép mã SPX
                </button>
                <a href="https://spx.vn/vi" target="_blank" class="btn btn-sm btn-primary" style="background:#ea580c; border-color:#ea580c; font-size:11.5px; padding:4px 10px; text-decoration:none;">
                  Tra cứu SPX.vn ↗
                </a>
              </div>
            </div>
          ` : `
            <div style="margin-top:6px; font-size:11.5px; color:#047857;">
              Kiện xe của bạn đang được đóng gói chống sốc 4 lớp. Mã vận đơn SPX Express sẽ hiển thị ngay khi bưu tá nhận kiện!
            </div>
          `}
        </div>
      </div>
    `;
  } else {
    box.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:10px; text-align:left;">
        <div style="font-size:26px; color:#059669; line-height:1;"><i class="fa-solid fa-circle-check"></i></div>
        <div style="flex:1;">
          <div style="font-size:14px; font-weight:900; color:#047857; text-transform:uppercase;">
            🎉 ADMIN ĐÃ DUYỆT ĐƠN HÀNG #${escapeHtml(code)} CỦA BẠN!
          </div>
          <div style="font-size:12px; color:#065f46; margin-top:3px;">
            Trạng thái hiện tại: <strong>${escapeHtml(ord.statusLabel || status)}</strong> | Thanh toán: <strong>${escapeHtml(ord.paymentStatusLabel || ord.paymentStatus)}</strong>
          </div>
          ${trackingCode ? `
            <div style="margin-top:10px; background:#fff7ed; border:1.5px solid #fb923c; border-radius:8px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <div>
                <div style="font-size:10.5px; font-weight:800; color:#c2410c; text-transform:uppercase;">
                  <i class="fa-solid fa-truck-fast"></i> MÃ VẬN ĐƠN SPX EXPRESS ĐÃ ĐƯỢC CẤP:
                </div>
                <div style="font-family:monospace; font-size:17px; font-weight:900; color:#ea580c; letter-spacing:0.5px;">
                  ${escapeHtml(trackingCode)}
                </div>
              </div>
              <div style="display:flex; gap:6px;">
                <button type="button" class="btn btn-sm btn-outline" style="border-color:#fdba74; color:#ea580c; background:#fff; font-size:11.5px; padding:4px 10px;" onclick="copyToClipboard('${escapeHtml(trackingCode)}', 'Đã sao chép mã SPX: ${escapeHtml(trackingCode)}')">
                  <i class="fa-regular fa-copy"></i> Sao chép mã SPX
                </button>
                <a href="https://spx.vn/vi" target="_blank" class="btn btn-sm btn-primary" style="background:#ea580c; border-color:#ea580c; font-size:11.5px; padding:4px 10px; text-decoration:none;">
                  Tra cứu SPX.vn ↗
                </a>
              </div>
            </div>
          ` : `
            <div style="margin-top:6px; font-size:11.5px; color:#047857;">
              Kiện xe của bạn đang được đóng gói chống sốc 4 lớp. Mã vận đơn SPX Express sẽ hiển thị ngay khi bưu tá nhận kiện!
            </div>
          `}
        </div>
      </div>
    `;
  }
}

// Giữ lại hàm cũ để fallback nếu có nơi nào gọi
async function submitOrder() {
  await handleCheckoutSubmit();
}

let paymentPollInterval = null;

function copyToClipboard(text, successMsg = 'Đã sao chép vào bộ nhớ tạm!') {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg, 'success');
    }).catch(() => {
      fallbackCopyText(text, successMsg);
    });
  } else {
    fallbackCopyText(text, successMsg);
  }
}

function fallbackCopyText(text, successMsg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(successMsg, 'success');
  } catch (err) {
    showToast('Vui lòng chọn và sao chép thủ công: ' + text, 'info');
  }
  document.body.removeChild(ta);
}


async function triggerInstantPayOSCheck(orderCode) {
  if (!orderCode) return;
  showToast('Đang kết nối cổng PayOS để kiểm tra giao dịch tức thì...', 'info');
  try {
    const json = await safeFetch(`/api/orders/check-status/${encodeURIComponent(orderCode)}`);
    if (json && json.success && json.data) {
      const ord = api.normalizeOrderObject ? api.normalizeOrderObject(json.data) : json.data;
      updateLiveStep4OrderStatus(ord);
      if (ord.paymentStatus === 'PAID' || ord.paymentStatus === 'PARTIALLY_PAID' || ord.status === 'CONFIRMED') {
        showToast('🎉 Giao dịch thành công! Đơn hàng của bạn đã được xác nhận tự động!', 'success');
      } else {
        showToast('Hệ thống ngân hàng đang chuyển tiền. Vui lòng đợi trong 5 - 15 giây, hệ thống sẽ tự động khớp lệnh ngay!', 'info');
      }
    }
  } catch (err) {
    showToast('Đang chờ tín hiệu xác nhận từ cổng thanh toán PayOS...', 'info');
  }
}
window.triggerInstantPayOSCheck = triggerInstantPayOSCheck;

function startPaymentPolling(orderCode) {
  if (!orderCode) return;
  if (paymentPollInterval) clearInterval(paymentPollInterval);

  paymentPollInterval = setInterval(async () => {
    try {
      if (!document.getElementById('checkoutModal')?.classList.contains('active') || activeStep4OrderCode !== orderCode) {
        clearInterval(paymentPollInterval);
        paymentPollInterval = null;
        return;
      }
      const json = await safeFetch(`/api/orders/check-status/${encodeURIComponent(orderCode)}`);
      if (json && json.success && json.data) {
        const ord = api.normalizeOrderObject ? api.normalizeOrderObject(json.data) : json.data;
        updateLiveStep4OrderStatus(ord);
        if (ord.trackingCode && ord.status === 'SHIPPING') {
          clearInterval(paymentPollInterval);
          paymentPollInterval = null;
        }
      }
    } catch (e) {}
  }, 3000);
}

function handleOrderSuccess(order) {
  renderCheckoutStep4(order);
}

async function uploadUserReceipt(orderCode) {
  const input = document.getElementById(`receiptInput_${orderCode}`) || document.getElementById('userReceiptInput');
  const receiptImage = input ? input.value.trim() : '';
  if (!receiptImage) {
    showToast('Vui lòng nhập đường dẫn ảnh hoặc mã giao dịch biên lai!', 'error');
    return;
  }

  try {
    const json = await safeFetch('/api/orders/upload-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderCode, receiptImage })
    });
    if (json.success) {
      showToast(json.message || 'Đã gửi biên lai thành công!', 'success');
      if (input) input.disabled = true;
    } else {
      showToast(json.message || 'Không thể gửi biên lai', 'error');
    }
  } catch (err) {
    showToast('Đã ghi nhận thông tin biên lai chuyển khoản cho đơn #' + orderCode, 'success');
  }
}

// =====================================================================
// =====================================================================
// 12. ĐĂNG NHẬP / ĐĂNG KÝ HỘI VIÊN & HỒ SƠ COLLECTOR CLUB PASS
// =====================================================================
const DEFAULT_USER_AVATAR = 'image/anh-clone.jpg';

function openAuthModal(defaultTab = 'login') {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  switchAuthTab(defaultTab);
  modal.classList.add('active');
}

function switchAuthTab(tab) {
  const tabLogin = document.getElementById('tabBtnLogin');
  const tabRegister = document.getElementById('tabBtnRegister');
  const tabsNav = document.getElementById('authTabsNav');
  const socialWrapper = document.getElementById('authSocialWrapper');
  const formLogin = document.getElementById('authFormLogin');
  const formRegister = document.getElementById('authFormRegister');
  const formForgot = document.getElementById('authFormForgot');
  const title = document.getElementById('authModalTitle');
  const subtitle = document.getElementById('authModalSubtitle');

  // Reset errors and hints
  document.querySelectorAll('.auth-field-hint, .field-error-text').forEach(el => el.textContent = '');

  if (tab === 'login') {
    tabLogin?.classList.add('active');
    tabRegister?.classList.remove('active');
    if (tabsNav) tabsNav.style.display = 'flex';
    if (socialWrapper) socialWrapper.style.display = 'block';
    if (formLogin) formLogin.style.display = 'flex';
    if (formRegister) formRegister.style.display = 'none';
    if (formForgot) formForgot.style.display = 'none';
    if (title) title.textContent = 'Đăng Nhập Tài Khoản';
    if (subtitle) subtitle.textContent = 'Quản lý đơn cọc xe, tự động điền địa chỉ giao hàng và theo dõi vận đơn SPX Express.';
  } else if (tab === 'register') {
    tabRegister?.classList.add('active');
    tabLogin?.classList.remove('active');
    if (tabsNav) tabsNav.style.display = 'flex';
    if (socialWrapper) socialWrapper.style.display = 'block';
    if (formRegister) formRegister.style.display = 'flex';
    if (formLogin) formLogin.style.display = 'none';
    if (formForgot) formForgot.style.display = 'none';
    if (title) title.textContent = 'Đăng Ký Hội Viên Mới';
    if (subtitle) subtitle.textContent = 'Tạo tài khoản để tự động lưu địa chỉ nhận hàng SPX và tra cứu biên lai cọc xe.';
  } else if (tab === 'forgot') {
    if (tabsNav) tabsNav.style.display = 'none';
    if (socialWrapper) socialWrapper.style.display = 'none';
    if (formLogin) formLogin.style.display = 'none';
    if (formRegister) formRegister.style.display = 'none';
    if (formForgot) {
      formForgot.style.display = 'flex';
      // Tự động sao chép email từ ô đăng nhập nếu người dùng đã gõ trước đó
      const loginEmailInput = document.getElementById('loginEmail');
      const forgotEmailInput = document.getElementById('forgotEmail');
      if (loginEmailInput && forgotEmailInput && loginEmailInput.value.trim() && !forgotEmailInput.value.trim()) {
        forgotEmailInput.value = loginEmailInput.value.trim();
      }
      // Reset OTP step
      const otpArea = document.getElementById('forgotStepOtpArea');
      const submitText = document.getElementById('btnForgotSubmitText');
      const otpInput = document.getElementById('forgotOtpInput');
      const newPwdInput = document.getElementById('forgotNewPassword');
      if (otpArea) otpArea.style.display = 'none';
      if (otpInput) otpInput.value = '';
      if (newPwdInput) newPwdInput.value = '';
      if (submitText) submitText.textContent = 'GỬI MÃ KHÔI PHỤC OTP';
    }
    if (title) title.textContent = 'Khôi Phục Mật Khẩu';
    if (subtitle) subtitle.textContent = 'Nhập email hoặc số điện thoại đã đăng ký để nhận mã OTP tạo lại mật khẩu.';
  }
}

function toggleAuthPasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPwd = input.type === 'password';
  input.type = isPwd ? 'text' : 'password';
  if (btn) {
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = isPwd ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    }
  }
}

function updatePasswordStrength(val) {
  const fill = document.getElementById('pwdBarFill');
  const label = document.getElementById('pwdMeterLabel');
  if (!label) return;

  if (!val || val.length === 0) {
    if (fill) {
      fill.style.width = '0%';
      fill.style.backgroundColor = '#ef4444';
    }
    label.textContent = 'Độ bảo mật: Tối thiểu 6 ký tự';
    label.style.color = '#64748b';
    return;
  }

  let score = 0;
  if (val.length >= 6) score++;
  if (val.length >= 8 && /[0-9]/.test(val)) score++;
  if (val.length >= 10 && /[A-Z]/.test(val) && /[^A-Za-z0-9]/.test(val)) score++;

  if (score === 0 || val.length < 6) {
    if (fill) {
      fill.style.width = '25%';
      fill.style.backgroundColor = '#ef4444';
    }
    label.textContent = 'Độ bảo mật: Quá ngắn (< 6 ký tự)';
    label.style.color = '#ef4444';
  } else if (score === 1) {
    if (fill) {
      fill.style.width = '45%';
      fill.style.backgroundColor = '#ef4444';
    }
    label.textContent = 'Độ bảo mật: Yếu (hãy thêm số hoặc chữ hoa)';
    label.style.color = '#ef4444';
  } else if (score === 2) {
    if (fill) {
      fill.style.width = '75%';
      fill.style.backgroundColor = '#f59e0b';
    }
    label.textContent = 'Độ bảo mật: Tốt & Đạt chuẩn';
    label.style.color = '#f59e0b';
  } else {
    if (fill) {
      fill.style.width = '100%';
      fill.style.backgroundColor = '#10b981';
    }
    label.textContent = 'Độ bảo mật: Rất mạnh & an toàn tuyệt đối!';
    label.style.color = '#10b981';
  }
}

function checkPasswordMatch() {
  const pwd = document.getElementById('regPassword')?.value || '';
  const confirmPwd = document.getElementById('regConfirmPassword')?.value || '';
  const confirmInput = document.getElementById('regConfirmPassword');
  if (!confirmInput) return;

  if (!confirmPwd) {
    confirmInput.style.borderColor = '#e2e8f0';
    return;
  }
  if (pwd === confirmPwd) {
    confirmInput.style.borderColor = '#10b981';
  } else {
    confirmInput.style.borderColor = '#ef4444';
  }
}

function fillDemoAccount(email, password) {
  switchAuthTab('login');
  const emailInput = document.getElementById('loginEmail');
  const pwdInput = document.getElementById('loginPassword');
  if (emailInput && pwdInput) {
    emailInput.value = email;
    pwdInput.value = password;
    emailInput.focus();
    showToast(`Đã điền tài khoản mẫu: ${email}`, 'info');
  }
}

let currentLoginMode = 'password';

// No-op for backward compatibility
function switchLoginMode(mode) {
  currentLoginMode = 'password';
}

async function handleLocalLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const pwdInput = document.getElementById('loginPassword');
  const rememberCheckbox = document.getElementById('loginRemember');
  const emailError = document.getElementById('loginEmailError');
  const pwdError = document.getElementById('loginPasswordError');
  const btnSubmit = document.getElementById('btnLoginSubmit');

  if (emailError) emailError.textContent = '';
  if (pwdError) pwdError.textContent = '';

  const identifier = emailInput ? emailInput.value.trim() : '';
  const rememberMe = rememberCheckbox ? rememberCheckbox.checked : true;

  if (!identifier) {
    if (emailError) emailError.textContent = 'Vui lòng nhập email hoặc số điện thoại của bạn';
    emailInput?.focus();
    return;
  }

  const password = pwdInput ? pwdInput.value : '';
  if (!password) {
    if (pwdError) pwdError.textContent = 'Vui lòng nhập mật khẩu';
    pwdInput?.focus();
    return;
  }

  const originalBtnHtml = btnSubmit ? btnSubmit.innerHTML : '';
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang xác thực...</span>';
  }

  try {
    const json = await safeFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, password, rememberMe })
    });

    if (json && json.success && json.user) {
      loginSuccess(json.user, json.token, rememberMe, password);
    } else {
      const errMsg = json?.message || json?.error || 'Đăng nhập không thành công!';
      if (json?.code === 'WRONG_PASSWORD' && pwdError) {
        pwdError.textContent = errMsg;
        pwdInput?.focus();
      } else if (json?.code === 'OAUTH_ACCOUNT_NO_PASSWORD') {
        if (pwdError) pwdError.textContent = errMsg;
        const ggBtn = document.getElementById('googleLoginBtn');
        if (ggBtn) {
          ggBtn.style.boxShadow = '0 0 0 3px rgba(66, 133, 244, 0.45)';
          setTimeout(() => { if (ggBtn) ggBtn.style.boxShadow = ''; }, 3500);
        }
      } else if (emailError) {
        emailError.textContent = errMsg;
        emailInput?.focus();
      }
      showToast(errMsg, 'error');
    }
  } catch (err) {
    console.error('[AUTH LOGIN ERROR]:', err);
    showToast(err.message || 'Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại!', 'error');
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalBtnHtml;
    }
  }
}

async function handleLocalRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById('regFullName')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();
  const phone = document.getElementById('regPhone')?.value.trim();
  const address = document.getElementById('regAddress')?.value.trim() || '';
  const addressTypeRadio = document.querySelector('input[name="regAddressType"]:checked');
  const addressType = addressTypeRadio ? addressTypeRadio.value : 'NEW';
  const oldWardNote = document.getElementById('regOldWardNote')?.value.trim() || '';
  const password = document.getElementById('regPassword')?.value;
  const confirmPassword = document.getElementById('regConfirmPassword')?.value;
  const termsCheckbox = document.getElementById('regTerms');
  const btnSubmit = document.getElementById('btnRegisterSubmit');

  if (!fullName || !email || !phone || !password) {
    showToast('Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)!', 'error');
    return;
  }

  // Kiểm tra email hợp lệ
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Địa chỉ email không đúng định dạng (ví dụ: ten@gmail.com)!', 'error');
    document.getElementById('regEmail')?.focus();
    return;
  }

  // Kiểm tra số điện thoại (10 - 11 số)
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    showToast('Số điện thoại phải từ 10 đến 11 chữ số để SPX Express liên hệ phát hàng!', 'error');
    document.getElementById('regPhone')?.focus();
    return;
  }

  // Kiểm tra mật khẩu
  if (password.length < 6) {
    showToast('Mật khẩu phải có tối thiểu 6 ký tự để bảo mật tài khoản!', 'error');
    document.getElementById('regPassword')?.focus();
    return;
  }

  if (password !== confirmPassword) {
    showToast('Mật khẩu xác nhận không trùng khớp!', 'error');
    document.getElementById('regConfirmPassword')?.focus();
    return;
  }

  if (termsCheckbox && !termsCheckbox.checked) {
    showToast('Vui lòng tích đồng ý với Điều khoản dịch vụ và Chính sách bảo mật!', 'info');
    return;
  }

  const originalBtnHtml = btnSubmit ? btnSubmit.innerHTML : '';
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang tạo tài khoản...</span>';
  }

  try {
    const json = await safeFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phone, address, addressType, oldAddressNote: oldWardNote, password, avatarUrl: DEFAULT_USER_AVATAR })
    });

    if (json && json.success) {
      const userObj = Object.assign({}, json.user, {
        avatarUrl: DEFAULT_USER_AVATAR,
        tier: json.user?.tier || 'Collector',
        points: json.user?.points || 100,
        addressType,
        oldAddressNote: oldWardNote
      });
      showToast('Đăng ký tài khoản thành công! Tặng bạn 100 điểm thưởng hội viên chào mừng.', 'success');
      loginSuccess(userObj, json.token, true);
    } else {
      const errMsg = json?.message || json?.error || 'Đăng ký không thành công!';
      showToast(errMsg, 'error', 5000);
      const regEmail = document.getElementById('regEmail');
      if (regEmail && (errMsg.toLowerCase().includes('email') || json?.code === 'USER_EXISTS')) {
        regEmail.focus();
        regEmail.style.borderColor = '#ef4444';
        setTimeout(() => { if (regEmail) regEmail.style.borderColor = ''; }, 3500);
      }
    }
  } catch (err) {
    console.error('[AUTH REGISTER ERROR]:', err);
    showToast(err.message || 'Có lỗi xảy ra trong quá trình đăng ký tài khoản!', 'error');
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalBtnHtml;
    }
  }
}

// =====================================================================
// KHÔI PHỤC MẬT KHẨU (GỬI MÃ OTP TỰ ĐỘNG VỀ GMAIL)
// =====================================================================
async function handleForgotPassword(e) {
  e.preventDefault();
  const emailInput = document.getElementById('forgotEmail');
  const otpArea = document.getElementById('forgotStepOtpArea');
  const otpNoticeText = document.getElementById('forgotOtpNoticeText');
  const otpInput = document.getElementById('forgotOtpInput');
  const newPwdInput = document.getElementById('forgotNewPassword');
  const submitText = document.getElementById('btnForgotSubmitText');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email) {
    showToast('Vui lòng nhập Email hoặc Số điện thoại tài khoản của bạn!', 'error');
    emailInput?.focus();
    return;
  }

  // Bước 1: Gửi mã OTP xác thực tự động về Gmail
  if (!otpArea || otpArea.style.display === 'none') {
    const originalText = submitText ? submitText.textContent : 'GỬI MÃ KHÔI PHỤC OTP';
    if (submitText) submitText.textContent = 'ĐANG GỬI MÃ VỀ GMAIL...';
    try {
      const json = await safeFetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (json && json.success) {
        delete json.otp;
        delete json.devOtp;
        otpArea.style.display = 'block';
        if (submitText) submitText.textContent = 'XÁC NHẬN ĐẶT LẠI MẬT KHẨU';

        if (otpNoticeText) {
          otpNoticeText.innerHTML = `
            <div style="display:flex; align-items:flex-start; gap:8px;">
              <i class="fa-solid fa-envelope-circle-check" style="color:#059669; font-size:18px; margin-top:2px; flex-shrink:0;"></i>
              <div>
                <strong style="color:#0f172a; font-size:13px;">Mã xác thực OTP đã được gửi về Gmail của bạn!</strong><br>
                <span style="font-size:12px; color:#475569; line-height:1.45;">
                  Hệ thống đã gửi mã 6 chữ số tới hộp thư <strong>${escapeHtml(json.email || email)}</strong>. Vui lòng mở Gmail (kiểm tra cả Hộp thư đến và Thư mục Spam) để lấy mã và nhập vào ô bên dưới.
                </span>
              </div>
            </div>
          `;
        }
        if (otpInput) {
          otpInput.value = '';
          otpInput.placeholder = 'Nhập mã 6 số từ Gmail...';
          otpInput.focus();
        }
        if (newPwdInput) {
          newPwdInput.value = '';
        }

        let toastMsg = json.message || '';
        if (!toastMsg || toastMsg.includes('tự động điền') || toastMsg.includes('Mã OTP khôi phục') || toastMsg.includes('Mã dự phòng')) {
          toastMsg = `Mã xác thực OTP đã được gửi tới Gmail (${escapeHtml(json.email || email)}). Vui lòng mở Gmail để lấy mã!`;
        }
        showToast(toastMsg, 'success');
      } else {
        if (submitText) submitText.textContent = originalText;
        showToast(json?.message || 'Không thể gửi mã OTP, vui lòng kiểm tra lại địa chỉ email!', 'error');
      }
    } catch (err) {
      if (submitText) submitText.textContent = originalText;
      showToast(err.message || 'Có lỗi kết nối khi gửi mã OTP về Gmail. Vui lòng thử lại!', 'error');
    }
    return;
  }

  // Bước 2: Xác nhận OTP từ Gmail và đặt mật khẩu mới
  const otp = otpInput ? otpInput.value.trim() : '';
  const newPassword = newPwdInput ? newPwdInput.value : '';

  if (!otp || otp.length !== 6) {
    showToast('Vui lòng mở Gmail và nhập đúng mã xác thực OTP gồm 6 chữ số!', 'error');
    otpInput?.focus();
    return;
  }
  if (!newPassword || newPassword.length < 6) {
    showToast('Vui lòng nhập mật khẩu mới tối thiểu 6 ký tự!', 'error');
    newPwdInput?.focus();
    return;
  }

  const originalText = submitText ? submitText.textContent : 'XÁC NHẬN ĐẶT LẠI MẬT KHẨU';
  if (submitText) submitText.textContent = 'ĐANG CẬP NHẬT MẬT KHẨU...';

  try {
    const json = await safeFetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    if (json && json.success) {
      showToast('✅ Đặt lại mật khẩu thành công! Giờ đây bạn có thể đăng nhập bằng mật khẩu mới.', 'success');

      // Đồng bộ vào Shared Users & LocalStorage
      try {
        if (api && typeof api.getSharedUsers === 'function' && typeof api.saveSharedUsers === 'function') {
          const uList = api.getSharedUsers();
          const cleanIdent = email.replace(/\s+/g, '');
          const uItem = uList.find(u => (u.email && u.email.toLowerCase() === email.toLowerCase()) || (u.phone && u.phone.replace(/\D/g, '') === cleanIdent.replace(/\D/g, '')));
          if (uItem) {
            uItem.password = newPassword;
            uItem.hasPassword = true;
            if (uItem.authProvider === 'google') uItem.authProvider = 'google+local';
            api.saveSharedUsers(uList);
          }
        }
      } catch (_) {}

      switchAuthTab('login');
      const loginEmail = document.getElementById('loginEmail');
      const loginPwd = document.getElementById('loginPassword');
      if (loginEmail) loginEmail.value = email;
      if (loginPwd) {
        loginPwd.value = newPassword;
      }
      const btnLoginSubmit = document.getElementById('btnLoginSubmit');
      if (btnLoginSubmit) btnLoginSubmit.focus();
    } else {
      if (submitText) submitText.textContent = originalText;
      showToast(json?.message || 'Mã OTP không chính xác hoặc đã hết hạn!', 'error');
      otpInput?.focus();
    }
  } catch (err) {
    if (submitText) submitText.textContent = originalText;
    console.error('[AUTH RESET PWD ERROR]:', err);
    showToast(err.message || 'Có lỗi xảy ra khi đặt lại mật khẩu! Vui lòng thử lại.', 'error');
  }
}

async function resendForgotOtp() {
  const emailInput = document.getElementById('forgotEmail');
  const otpNoticeText = document.getElementById('forgotOtpNoticeText');
  const otpInput = document.getElementById('forgotOtpInput');
  const email = emailInput ? emailInput.value.trim() : '';
  if (!email) {
    showToast('Vui lòng nhập Email hoặc Số điện thoại tài khoản!', 'error');
    return;
  }
  showToast('Đang gửi lại mã xác thực OTP về Gmail của bạn...', 'info');
  try {
    const json = await safeFetch('/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (json && json.success) {
      delete json.otp;
      delete json.devOtp;
      if (otpInput) {
        otpInput.value = '';
        otpInput.placeholder = 'Nhập mã 6 số từ Gmail...';
        otpInput.focus();
      }
      if (otpNoticeText) {
        otpNoticeText.innerHTML = `
          <div style="display:flex; align-items:flex-start; gap:8px;">
            <i class="fa-solid fa-envelope-circle-check" style="color:#059669; font-size:18px; margin-top:2px; flex-shrink:0;"></i>
            <div>
              <strong style="color:#0f172a; font-size:13px;">Mã OTP mới đã được gửi tới Gmail của bạn!</strong><br>
              <span style="font-size:12px; color:#475569; line-height:1.45;">
                Vui lòng kiểm tra Hộp thư đến (hoặc Thư mục Spam) của <strong>${escapeHtml(json.email || email)}</strong> để lấy mã xác thực mới.
              </span>
            </div>
          </div>
        `;
      }
      let toastMsg = json.message || '';
      if (!toastMsg || toastMsg.includes('tự động điền') || toastMsg.includes('Mã OTP khôi phục') || toastMsg.includes('Mã dự phòng')) {
        toastMsg = `Mã OTP mới đã được gửi tới Gmail (${escapeHtml(json.email || email)}). Vui lòng mở Gmail để lấy mã!`;
      }
      showToast(toastMsg, 'success');
    } else {
      showToast(json?.message || 'Không thể gửi lại mã, vui lòng thử lại sau!', 'error');
    }
  } catch (e) {
    showToast('Lỗi gửi lại mã OTP về Gmail. Vui lòng thử lại sau!', 'error');
  }
}

// =====================================================================
// GOOGLE IDENTITY SERVICES (GSI) & GOOGLE SIGN-IN THẬT 100%
// =====================================================================
window.GOOGLE_CLIENT_ID = '670662206600-el2nstl8uokismch5grjt9f2g6m9rfdr.apps.googleusercontent.com';
let googleTokenClient = null;

function initGoogleIdentityServices() {
  const tryInitGsi = () => {
    if (typeof google === 'undefined' || !google.accounts) return false;

    // Tải Client ID cấu hình từ backend
    safeFetch('/api/auth/google/config').then(cfg => {
      if (cfg && cfg.clientId) window.GOOGLE_CLIENT_ID = cfg.clientId;
    }).catch(() => {}).finally(() => {
      const clientId = window.GOOGLE_CLIENT_ID || '670662206600-el2nstl8uokismch5grjt9f2g6m9rfdr.apps.googleusercontent.com';

      // 1. Khởi tạo Google One-Tap & Credential API
      try {
        if (google.accounts.id) {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });
        }
      } catch (err) {
        console.warn('[GSI ID Init Notice]:', err.message);
      }

      // 2. Khởi tạo Google OAuth2 Token Client (Dùng cho popup chọn Gmail chính thức)
      try {
        if (google.accounts.oauth2) {
          googleTokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'email profile openid',
            callback: handleGoogleOAuthResponse
          });
        }
      } catch (err) {
        console.warn('[GSI OAuth2 Init Notice]:', err.message);
      }
    });

    return true;
  };

  if (!tryInitGsi()) {
    let retries = 0;
    const gTimer = setInterval(() => {
      retries++;
      if (tryInitGsi() || retries > 10) clearInterval(gTimer);
    }, 600);
  }
}

// Xử lý phản hồi OAuth2 từ cửa sổ Google chọn tài khoản Gmail thật
async function handleGoogleOAuthResponse(tokenResponse) {
  resetGoogleButtonState();

  if (!tokenResponse || tokenResponse.error) {
    if (tokenResponse?.error === 'popup_closed_by_user') {
      showToast('Bạn đã đóng cửa sổ đăng nhập Google.', 'info');
      return;
    }
    showToast('Chưa thể đăng nhập Google: ' + (tokenResponse?.error_description || tokenResponse?.error || 'Vui lòng kiểm tra quyền truy cập'), 'error');
    return;
  }

  try {
    // Lấy thông tin tài khoản thật từ Google UserInfo API
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
    });
    const profile = await userinfoRes.json();

    if (!profile || !profile.email) {
      showToast('Không lấy được địa chỉ Gmail từ Google. Vui lòng kiểm tra lại!', 'error');
      return;
    }

    // Đồng bộ tài khoản Google thật lên Supabase PostgreSQL thông qua Backend Render / Node.js
    const res = await safeFetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInfo: {
          email: profile.email,
          name: profile.name || profile.given_name || profile.email.split('@')[0],
          picture: profile.picture || DEFAULT_USER_AVATAR,
          googleId: profile.sub
        }
      })
    });

    if (res && res.success) {
      const u = res.user || res.data?.user;
      const tok = res.token || res.data?.token;
      closeModal('authModal');
      loginSuccess(u, tok, true);
    } else {
      showToast(res?.message || 'Đăng nhập Google thất bại!', 'error');
    }
  } catch (err) {
    console.error('[Google OAuth UserInfo Error]:', err);
    showToast('Lỗi kết nối tài khoản Google: ' + err.message, 'error');
  }
}

// Xử lý JWT Credential phản hồi từ Google Identity Services (One Tap hoặc nút Google Button)
async function handleGoogleCredentialResponse(response) {
  resetGoogleButtonState();
  if (!response || !response.credential) {
    showToast('Không nhận được mã xác thực từ Google!', 'error');
    return;
  }
  try {
    const res = await safeFetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: response.credential
      })
    });

    if (res && res.success) {
      const u = res.user || res.data?.user;
      const tok = res.token || res.data?.token;
      closeModal('authModal');
      loginSuccess(u, tok, true);
    } else {
      showToast(res?.message || 'Đăng nhập Google thất bại!', 'error');
    }
  } catch (err) {
    console.error('[Google Credential Error]:', err);
    showToast('Lỗi xử lý xác thực Google: ' + err.message, 'error');
  }
}

// Khôi phục trạng thái nút Google
function resetGoogleButtonState() {
  const btn = document.getElementById('googleLoginBtn');
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
      </svg>
      <span>Tiếp tục với tài khoản Google</span>
    `;
  }
}

// Xử lý khi người dùng nhấn nút Đăng nhập Google trên giao diện (Mở cửa sổ chọn Gmail thật của Google)
async function handleGoogleLoginClick() {
  const btn = document.getElementById('googleLoginBtn');
  if (btn) {
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang mở cửa sổ Google...</span>`;
    btn.disabled = true;
  }

  // 1. Nếu Google OAuth2 Token Client đã sẵn sàng, mở cửa sổ chính thức của Google
  if (googleTokenClient) {
    try {
      googleTokenClient.requestAccessToken({ prompt: 'select_account' });
      return;
    } catch (e) {
      console.warn('[GSI requestAccessToken Error]:', e);
    }
  }

  // 2. Thử khởi tạo ngay nếu thư viện Google đã nạp
  if (typeof google !== 'undefined' && google.accounts?.oauth2) {
    try {
      const clientId = window.GOOGLE_CLIENT_ID || '670662206600-el2nstl8uokismch5grjt9f2g6m9rfdr.apps.googleusercontent.com';
      googleTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: handleGoogleOAuthResponse
      });
      googleTokenClient.requestAccessToken({ prompt: 'select_account' });
      return;
    } catch (err) {
      console.warn('[GSI Direct Init Error]:', err);
    }
  }

  // 3. Nếu chưa sẵn sàng, mở One Tap Prompt nếu có
  if (typeof google !== 'undefined' && google.accounts?.id) {
    try {
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          resetGoogleButtonState();
          showToast('Vui lòng kiểm tra Google Client ID trong Google Cloud Console và thêm tên miền hiện tại vào Authorized JavaScript Origins.', 'warning');
        }
      });
      return;
    } catch (e) {
      console.warn('[GSI Prompt Error]:', e);
    }
  }

  resetGoogleButtonState();
  showToast('Đang tải thư viện Google Identity Services... Vui lòng thử lại sau 2 giây.', 'info');
}

function loginSuccess(user, token, rememberMe = true, rawPassword = '') {
  const cleanUser = Object.assign({}, user, {
    role: user?.role || 'customer',
    tier: user?.tier || 'Collector',
    points: user?.points != null ? user.points : 100,
    avatarUrl: (!user?.avatarUrl || user.avatarUrl.includes('DoQuocThinh_anhthe')) ? DEFAULT_USER_AVATAR : user.avatarUrl
  });
  currentUser = cleanUser;
  currentToken = token;
  api.setAuthSession(token, cleanUser);

  // Đảm bảo thông tin người dùng và mật khẩu đồng bộ chắc chắn vào Shared Users
  try {
    if (api && typeof api.getSharedUsers === 'function' && typeof api.saveSharedUsers === 'function') {
      const uList = api.getSharedUsers();
      const uItem = uList.find(u => (u.userId == cleanUser.userId || u.id == cleanUser.id || (cleanUser.email && u.email && u.email.toLowerCase() === cleanUser.email.toLowerCase())));
      if (uItem) {
        if (rawPassword) {
          uItem.password = rawPassword;
          uItem.hasPassword = true;
        }
        api.saveSharedUsers(uList);
      }
    }
  } catch (_) {}

  // Lưu tùy chọn Remember Me
  try {
    if (!rememberMe) {
      sessionStorage.setItem('minigt_session_active', '1');
    }
  } catch (_) {}

  // Tự động điền dữ liệu người dùng vào modal Checkout nếu người dùng đang đặt cọc
  const checkoutName = document.getElementById('checkoutName');
  const checkoutEmail = document.getElementById('checkoutEmail');
  const checkoutPhone = document.getElementById('checkoutPhone');
  const checkoutAddress = document.getElementById('checkoutAddress');
  if (checkoutName) checkoutName.value = cleanUser.fullName || checkoutName.value || '';
  if (checkoutEmail) checkoutEmail.value = cleanUser.email || checkoutEmail.value || '';
  if (checkoutPhone && cleanUser.phone) checkoutPhone.value = cleanUser.phone;
  if (checkoutAddress && cleanUser.address) checkoutAddress.value = cleanUser.address;

  // Reset sạch sẽ bộ nhớ cache đơn hàng của phiên cũ
  myOrdersCache = [];
  customerOrderStateSnapshot = {};

  updateUserHeaderUI();
  closeModal('authModal');

  // Khôi phục giỏ hàng riêng của người dùng nếu có lưu trước đó (tài khoản mới luôn là giỏ hàng rỗng)
  const uKey = cleanUser.userId || cleanUser.id || cleanUser.email;
  if (uKey) {
    try {
      const savedUserCart = localStorage.getItem('minigt_cart_user_' + uKey);
      if (savedUserCart) {
        const parsed = JSON.parse(savedUserCart);
        cart = Array.isArray(parsed) ? parsed : [];
      } else {
        cart = [];
      }
      localStorage.setItem('minigt_cart', JSON.stringify(cart));
    } catch (_) {
      cart = [];
    }

    // Khôi phục wishlist riêng của người dùng nếu có lưu trước đó (tài khoản mới luôn là wishlist rỗng)
    try {
      const savedUserWishlist = localStorage.getItem('minigt_wishlist_user_' + uKey);
      if (savedUserWishlist) {
        const parsedW = JSON.parse(savedUserWishlist);
        wishlist = Array.isArray(parsedW) ? parsedW : [];
      } else {
        wishlist = [];
      }
      localStorage.setItem('minigt_wishlist', JSON.stringify(wishlist));
    } catch (_) {
      wishlist = [];
    }
  }

  updateCartBadge();
  renderCartDrawer();
  updateWishlistBadge();
  if (typeof renderWishlistModal === 'function') renderWishlistModal();

  // Thông báo đăng nhập thông minh & duy nhất (Tránh spam nhiều thông báo chồng chéo)
  const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
  const hasFullInfo = Boolean(cleanUser.phone && cleanUser.address && cleanUser.hasPassword);

  if (!hasFullInfo) {
    // Tài khoản mới (hoặc đăng nhập bằng Google lần đầu chưa có SĐT / Địa chỉ / Mật khẩu riêng)
    const missing = [];
    if (!cleanUser.phone) missing.push('Số điện thoại');
    if (!cleanUser.address) missing.push('Địa chỉ nhận hàng SPX');
    if (!cleanUser.hasPassword) missing.push('Mật khẩu liên kết');

    showToast(
      isEn
        ? `🔔 Welcome, ${cleanUser.fullName || cleanUser.email}! Please complete your ${missing.join(', ')} to finish account setup.`
        : `🔔 Xin chào, ${cleanUser.fullName || cleanUser.email}! Vui lòng cập nhật ${missing.join(', ')} để gộp tài khoản và nhận hàng qua SPX Express.`,
      'info',
      6500
    );
    // Tự động mở form Hồ sơ hội viên & Địa chỉ sau 600ms để khách hàng dễ dàng cập nhật
    setTimeout(() => {
      openUserProfileModal();
    }, 600);
  } else {
    // Tài khoản đã có đầy đủ thông tin -> Chỉ 1 thông báo ngắn gọn chào mừng
    showToast(
      isEn
        ? `Welcome back, ${cleanUser.fullName || cleanUser.email}!`
        : `Xin chào, ${cleanUser.fullName || cleanUser.email}! Đăng nhập thành công.`,
      'success'
    );
  }
}

function logout() {
  // 1. Lưu giỏ hàng & wishlist của tài khoản đang đăng xuất để khôi phục khi họ đăng nhập lại
  if (currentUser) {
    const uKey = currentUser.userId || currentUser.id || currentUser.email;
    if (uKey) {
      try {
        localStorage.setItem('minigt_cart_user_' + uKey, JSON.stringify(cart || []));
        localStorage.setItem('minigt_wishlist_user_' + uKey, JSON.stringify(wishlist || []));
      } catch (_) {}
    }
  }

  // 2. Xóa session auth và phân lập dữ liệu người dùng
  api.clearAuthSession();
  currentUser = null;
  currentToken = null;

  // 3. Reset sạch cache đơn hàng & số điện thoại phiên cũ để không rò rỉ sang tài khoản khác
  myOrdersCache = [];
  customerOrderStateSnapshot = {};
  activeStep4OrderCode = null;
  try {
    localStorage.removeItem('minigt_customer_phone');
    localStorage.removeItem('minigt_customer_name');
    localStorage.removeItem('minigt_last_phone');
    localStorage.removeItem('minigt_my_order_codes');
    localStorage.removeItem('minigt_my_order_codes_guest');
  } catch (_) {}

  // Đóng modal đơn hàng nếu đang mở
  const myOrdersModal = document.getElementById('myOrdersModal');
  if (myOrdersModal) myOrdersModal.classList.remove('active');
  const trackingModal = document.getElementById('trackingModal');
  if (trackingModal) trackingModal.classList.remove('active');

  // 4. Reset giỏ hàng và danh sách yêu thích của phiên khách về rỗng
  cart = [];
  wishlist = [];
  try {
    localStorage.removeItem('minigt_cart');
    localStorage.setItem('minigt_wishlist', '[]');
  } catch (_) {}
  updateCartBadge();
  updateWishlistBadge();
  closeCartDrawer();
  renderCartDrawer();
  if (typeof renderWishlistModal === 'function') renderWishlistModal();

  // 5. Reset form thông tin thanh toán
  const checkoutName = document.getElementById('checkoutName');
  const checkoutEmail = document.getElementById('checkoutEmail');
  const checkoutPhone = document.getElementById('checkoutPhone');
  const checkoutAddress = document.getElementById('checkoutAddress');
  if (checkoutName) checkoutName.value = '';
  if (checkoutEmail) checkoutEmail.value = '';
  if (checkoutPhone) checkoutPhone.value = '';
  if (checkoutAddress) checkoutAddress.value = '';

  // 6. Cập nhật giao diện header
  updateUserHeaderUI();

  const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
  showToast(isEn ? 'Signed out successfully!' : 'Đã đăng xuất tài khoản!', 'info');
}

function updateUserHeaderUI() {
  const container = document.getElementById('userProfileArea');
  const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
  const drawerUserArea = document.getElementById('mobileDrawerUserArea');
  const mobBottomUserLabel = document.getElementById('mobBottomUserLabel');
  const mobBottomUserIcon = document.getElementById('mobBottomUserIcon');

  if (currentUser) {
    if (!currentUser.avatarUrl || currentUser.avatarUrl.includes('DoQuocThinh_anhthe')) {
      currentUser.avatarUrl = DEFAULT_USER_AVATAR;
      try { localStorage.setItem('minigt_user', JSON.stringify(currentUser)); } catch (_) {}
    }
    const avatarSrc = currentUser.avatarUrl || DEFAULT_USER_AVATAR;
    const tierName = currentUser.tier || 'Collector';
    const pts = currentUser.points != null ? currentUser.points : 100;
    const shortName = currentUser.fullName ? currentUser.fullName.split(' ').slice(-1)[0] : 'Hội viên';

    if (container) {
      container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="user-profile-btn" onclick="toggleUserDropdown(event)">
            <img class="user-avatar" src="${avatarSrc}" alt="${escapeHtml(currentUser.fullName)}" onerror="this.src='image/anh-clone.jpg'">
            <div class="user-info-text" style="display:flex; flex-direction:column; align-items:flex-start; text-align:left; line-height:1.2;">
              <span style="font-size:12px; font-weight:700; color:var(--color-navy);">${escapeHtml(currentUser.fullName || currentUser.email)}</span>
              <span class="user-dropdown-tier"><i class="fa-solid fa-crown" style="font-size:9px;"></i> ${escapeHtml(tierName)}</span>
            </div>
            <span class="user-caret" style="font-size:10px; color:#94a3b8; margin-left:4px;"><i class="fa-solid fa-chevron-down"></i></span>
            <div class="user-dropdown" id="userDropdownMenu">
              <div class="user-dropdown-header">
                <div class="user-dropdown-name">${escapeHtml(currentUser.fullName)}</div>
                <div class="user-dropdown-email">${escapeHtml(currentUser.email)}</div>
                <div style="font-size:11px; color:#e10600; font-weight:700; margin-top:4px;">
                  <i class="fa-solid fa-coins"></i> Điểm cọc: ${pts} pts
                </div>
              </div>
              <div class="user-dropdown-item" onclick="openUserProfileModal()"><i class="fa-solid fa-id-card" style="margin-right:6px; color:#e10600;"></i> ${isEn ? 'Collector Pass' : 'Hồ sơ hội viên & Địa chỉ'}</div>
              <div class="user-dropdown-item" onclick="openMyOrdersModal()"><i class="fa-solid fa-box-archive" style="margin-right:6px;"></i> ${isEn ? 'My Orders (SPX)' : 'Đơn hàng của tôi (SPX)'}</div>
              <div class="user-dropdown-item" onclick="openTrackingModal()"><i class="fa-solid fa-magnifying-glass" style="margin-right:6px;"></i> ${isEn ? 'Track Order' : 'Tra cứu đơn cọc'}</div>
              <div class="user-dropdown-item" onclick="logout()"><i class="fa-solid fa-right-from-bracket" style="margin-right:6px; color:#dc2626;"></i> <strong style="color:#dc2626;">${isEn ? 'Sign Out' : 'Đăng xuất tài khoản'}</strong></div>
            </div>
          </div>
        </div>
      `;
    }

    // Render khu vực tài khoản trong Mobile Drawer
    if (drawerUserArea) {
      drawerUserArea.innerHTML = `
        <div style="background:var(--bg-card, #f8fafc); border:1px solid var(--border-subtle, #e2e8f0); border-radius:12px; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <img src="${avatarSrc}" alt="${escapeHtml(currentUser.fullName)}" onerror="this.src='image/anh-clone.jpg'" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid var(--color-primary, #dc2626);">
            <div style="overflow:hidden; flex:1;">
              <div style="font-size:13.5px; font-weight:800; color:var(--text-primary, #0f172a); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${escapeHtml(currentUser.fullName || 'Hội viên MINI GT')}
              </div>
              <div style="font-size:11.5px; color:var(--text-secondary, #64748b); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${escapeHtml(currentUser.email || '')}
              </div>
              <div style="display:inline-flex; align-items:center; gap:4px; font-size:10.5px; font-weight:700; color:#b45309; background:#fef3c7; padding:1px 6px; border-radius:6px; margin-top:3px;">
                <i class="fa-solid fa-crown" style="font-size:9px;"></i> ${escapeHtml(tierName)} • ${pts} pts
              </div>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">
            <button type="button" onclick="closeMobileNav(); openUserProfileModal();" style="padding:7px 8px; font-size:11.5px; font-weight:700; border-radius:8px; border:1px solid #cbd5e1; background:#fff; color:#1e293b; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;">
              <i class="fa-solid fa-id-card" style="color:#dc2626;"></i> Hồ sơ
            </button>
            <button type="button" onclick="closeMobileNav(); openMyOrdersModal();" style="padding:7px 8px; font-size:11.5px; font-weight:700; border-radius:8px; border:1px solid #cbd5e1; background:#fff; color:#1e293b; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;">
              <i class="fa-solid fa-box-archive" style="color:#2563eb;"></i> Đơn SPX
            </button>
          </div>
          <button type="button" onclick="closeMobileNav(); logout();" style="width:100%; padding:8px; font-size:12px; font-weight:800; border-radius:8px; border:1px solid #fecdd3; background:#fff1f2; color:#e11d48; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
            <i class="fa-solid fa-right-from-bracket"></i> ĐĂNG XUẤT TÀI KHOẢN
          </button>
        </div>
      `;
    }

    if (mobBottomUserLabel) mobBottomUserLabel.textContent = shortName;
    if (mobBottomUserIcon) {
      mobBottomUserIcon.className = 'fa-solid fa-user-check';
      mobBottomUserIcon.style.color = '#dc2626';
    }
  } else {
    if (container) {
      container.innerHTML = `
        <button class="btn-login-clean" onclick="openAuthModal('login')">
          <i class="fa-regular fa-user"></i>
          <span data-i18n="btnSignIn">${isEn ? 'Sign In' : 'Đăng nhập'}</span>
        </button>
      `;
    }

    if (drawerUserArea) {
      drawerUserArea.innerHTML = `
        <div style="background:var(--bg-card, #f8fafc); border:1px solid var(--border-subtle, #e2e8f0); border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:12.5px; color:var(--text-secondary, #64748b); margin-bottom:8px;">
            Đăng nhập để nhận cọc 11k, tích điểm và theo dõi đơn SPX Express
          </div>
          <button type="button" class="btn btn-primary" style="width:100%; height:40px; font-size:12.5px; font-weight:800; border-radius:8px; display:flex; align-items:center; justify-content:center; gap:6px;" onclick="closeMobileNav(); openAuthModal('login');">
            <i class="fa-regular fa-user"></i> ĐĂNG NHẬP / ĐĂNG KÝ
          </button>
        </div>
      `;
    }

    if (mobBottomUserLabel) mobBottomUserLabel.textContent = isEn ? 'Sign In' : 'Tài khoản';
    if (mobBottomUserIcon) {
      mobBottomUserIcon.className = 'fa-regular fa-user';
      mobBottomUserIcon.style.color = '';
    }
  }
}

function handleMobileBottomUserClick() {
  if (currentUser) {
    openUserProfileModal();
  } else {
    openAuthModal('login');
  }
}
window.handleMobileBottomUserClick = handleMobileBottomUserClick;

function toggleUserDropdown(e) {
  e.stopPropagation();
  const menu = document.getElementById('userDropdownMenu');
  if (menu) menu.classList.toggle('active');
}

// User Profile Modal Logic (Giao diện lớn, to rõ, hiện đại & logic nhất)
function openUserProfileModal() {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }
  const modal = document.getElementById('userProfileModal');
  const body = document.getElementById('userProfileModalBody');
  if (!modal || !body) return;

  let totalSpent = Number(currentUser.totalSpent || 0);
  let totalDeposit = Number(currentUser.totalDeposit || 0);
  let totalOrders = Number(currentUser.totalOrders || 0);

  if (Array.isArray(myOrdersCache) && myOrdersCache.length > 0) {
    const validOrders = myOrdersCache.filter(o => String(o.Status || o.status || '').toUpperCase() !== 'CANCELLED');
    const orderSum = validOrders.reduce((sum, o) => sum + Number(o.Total || o.total || 0), 0);
    const depositSum = validOrders.reduce((sum, o) => sum + Number(o.DepositAmount || o.depositAmount || 0), 0);
    totalSpent = Math.max(totalSpent, orderSum);
    totalDeposit = Math.max(totalDeposit, depositSum);
    totalOrders = Math.max(totalOrders, validOrders.length);
    currentUser.totalSpent = totalSpent;
    currentUser.totalDeposit = totalDeposit;
    currentUser.totalOrders = totalOrders;
    try { localStorage.setItem('minigt_user', JSON.stringify(currentUser)); } catch (_) {}
  }

  const pts = currentUser.points != null ? currentUser.points : (100 + Math.floor(totalSpent / 10000));
  const vip = getCustomerVipInfo(totalSpent);

  body.innerHTML = `
    <!-- Modal Header -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #e2e8f0;">
      <div>
        <h3 style="margin:0; font-size:18px; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:8px;">
          <i class="fa-solid fa-id-card-clip" style="color:#dc2626;"></i>
          HỒ SƠ HỘI VIÊN & ĐỊA CHỈ NHẬN HÀNG
        </h3>
        <p style="margin:4px 0 0; font-size:12px; color:#64748b;">
          Đồng bộ tài khoản 24/7 với hệ thống bưu cục SPX Express giao hàng toàn quốc.
        </p>
      </div>
      <span class="user-pass-tier-badge" style="background:${vip.bg}; color:${vip.color}; border:1px solid ${vip.border}; display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:20px; font-weight:800; font-size:12px;">
        <i class="fa-solid ${vip.icon}"></i>
        <span>${vip.label} • ${vip.tierName}</span>
      </span>
    </div>

    <!-- VIP Pass Card (Thẻ Hội Viên Cao Cấp) -->
    <div class="user-pass-card" style="border:1px solid rgba(255,255,255,0.15); box-shadow:0 15px 35px -5px rgba(15,23,42,0.45); border-radius:16px; padding:20px;">
      <div class="user-pass-header" style="margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
        <div class="user-pass-brand" style="display:flex; align-items:center; gap:8px;">
          <img src="image/logo-minigt.webp" alt="MINI GT" style="height:18px; width:auto; filter:brightness(0) invert(1);">
          <span style="letter-spacing:1px; font-weight:800; color:#ffffff; font-size:11.5px;">MINI GT BIÊN HÒA • OFFICIAL COLLECTOR PASS</span>
        </div>
        <div style="font-size:11px; color:#94a3b8; font-family:monospace; background:rgba(0,0,0,0.3); padding:2px 8px; border-radius:6px;">
          ID: #${String(currentUser.userId || currentUser.id || '8888').padStart(5, '0')}
        </div>
      </div>

      <div class="user-pass-body" style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
        <div style="position:relative;">
          <img class="user-pass-avatar" src="${currentUser.avatarUrl || DEFAULT_USER_AVATAR}" alt="${escapeHtml(currentUser.fullName)}" onerror="this.src='image/anh-clone.jpg'" style="width:72px; height:72px; border-radius:50%; border:3px solid #dc2626; box-shadow:0 0 15px rgba(220,38,38,0.4); object-fit:cover;">
          <span style="position:absolute; bottom:0; right:0; background:#10b981; color:#fff; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; border:2px solid #0f172a;"><i class="fa-solid fa-check"></i></span>
        </div>
        <div style="flex:1;">
          <h3 class="user-pass-name" style="margin:0 0 4px; font-size:20px; font-weight:900; color:#ffffff; letter-spacing:0.3px;">
            ${escapeHtml(currentUser.fullName || 'Hội viên MINI GT')}
          </h3>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span style="font-size:13px; color:#cbd5e1;"><i class="fa-regular fa-envelope" style="margin-right:4px;"></i> ${escapeHtml(currentUser.email || '')}</span>
            ${currentUser.authProvider === 'google' ? `
              <span style="background:rgba(66,133,244,0.25); color:#93c5fd; border:1px solid rgba(66,133,244,0.4); padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
                <svg viewBox="0 0 24 24" width="12" height="12"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg> Google Verified
              </span>
            ` : `
              <span style="background:rgba(16,185,129,0.25); color:#6ee7b7; border:1px solid rgba(16,185,129,0.4); padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700;">
                <i class="fa-solid fa-shield-check" style="margin-right:3px;"></i> Hội viên xác thực
              </span>
            `}
          </div>
        </div>
      </div>

      <div class="user-pass-stats" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; background:rgba(0,0,0,0.25); border-radius:12px; padding:12px; border:1px solid rgba(255,255,255,0.08);">
        <div class="user-pass-stat-box" style="text-align:center;">
          <div class="user-pass-stat-val" style="font-size:22px; font-weight:900; color:#fbbf24;">${pts}</div>
          <div class="user-pass-stat-lbl" style="font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">Điểm cọc tích lũy</div>
        </div>
        <div class="user-pass-stat-box" style="text-align:center; border-left:1px solid rgba(255,255,255,0.1); border-right:1px solid rgba(255,255,255,0.1);">
          <div class="user-pass-stat-val" style="font-size:22px; font-weight:900; color:#38bdf8;">${totalOrders}</div>
          <div class="user-pass-stat-lbl" style="font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">Đơn xe đã đặt</div>
        </div>
        <div class="user-pass-stat-box" style="text-align:center;">
          <div class="user-pass-stat-val" style="font-size:22px; font-weight:900; color:#4ade80;">${formatVND(totalSpent) || '0đ'}</div>
          <div class="user-pass-stat-lbl" style="font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">Tổng cọc & chi tiêu</div>
        </div>
      </div>

      <!-- Thanh tiến độ VIP -->
      <div style="margin-top:12px; background:rgba(255,255,255,0.08); border-radius:10px; padding:8px 12px; border:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; margin-bottom:5px; color:#ffffff;">
          <span>Phân hạng: <strong style="color:#fdba74;">${vip.label}</strong> (Chi tiêu: ${formatVND(totalSpent)})</span>
          <span style="font-size:11px; opacity:0.9;">${vip.nextTarget ? `Mục tiêu ${vip.nextLabel}: ${formatVND(vip.nextTarget)}` : '⭐ Cấp VIP tối đa'}</span>
        </div>
        <div style="background:rgba(255,255,255,0.2); height:6px; border-radius:3px; overflow:hidden;">
          <div style="background:linear-gradient(90deg, #10b981, #059669); height:100%; width:${vip.progressPercent}%; border-radius:3px; transition:width 0.5s ease;"></div>
        </div>
      </div>
    </div>

    <!-- Cảnh báo nếu chưa có SĐT, Địa chỉ hoặc chưa cài Mật khẩu -->
    ${(!currentUser.phone || !currentUser.address || !currentUser.hasPassword) ? `
      <div style="background:#fffbeb; border:1.5px solid #fde68a; color:#92400e; border-radius:12px; padding:12px 16px; margin-bottom:16px; font-size:13px; display:flex; align-items:center; gap:12px; box-shadow:0 4px 12px rgba(245,158,11,0.08);">
        <i class="fa-solid fa-triangle-exclamation" style="color:#d97706; font-size:20px; flex-shrink:0;"></i>
        <div>
          <strong style="font-size:13.5px;">Hồ sơ hội viên cần hoàn thiện &amp; liên kết mật khẩu!</strong><br>
          <span style="font-size:12px; color:#b45309;">
            ${(!currentUser.phone || !currentUser.address) ? 'Vui lòng điền <strong>Số điện thoại</strong> và <strong>Địa chỉ nhận hàng SPX</strong> để tự động lên đơn. ' : ''}
            ${!currentUser.hasPassword ? 'Hãy <strong>thiết lập Mật khẩu</strong> bên dưới để gộp tài khoản: Đăng nhập được cả Google lẫn Email + Mật khẩu!' : ''}
          </span>
        </div>
      </div>
    ` : `
      <div style="background:#f0fdf4; border:1.5px solid #bbf7d0; color:#166534; border-radius:12px; padding:10px 16px; margin-bottom:16px; font-size:12.5px; display:flex; align-items:center; gap:8px;">
        <i class="fa-solid fa-circle-check" style="color:#16a34a; font-size:16px;"></i>
        <span>Tài khoản đã hoàn thiện đầy đủ thông tin giao hàng SPX Express và đã liên kết mật khẩu đăng nhập đa kênh!</span>
      </div>
    `}

    <form onsubmit="handleUpdateUserProfile(event)" class="profile-edit-form">
      <div class="profile-form-grid" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:16px;">
        <!-- Họ và tên -->
        <div class="auth-input-group">
          <label class="auth-label" for="profileFullName" style="font-size:12.5px; font-weight:800; color:#1e293b; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-user" style="color:#dc2626;"></i>
            Họ và tên người nhận hàng <span class="required-star" style="color:#dc2626;">*</span>
          </label>
          <div class="auth-input-box" style="border:1.5px solid #cbd5e1; border-radius:10px; height:46px; display:flex; align-items:center; padding:0 12px; background:#fff;">
            <i class="fa-solid fa-user" style="color:#94a3b8; font-size:14px; margin-right:8px;"></i>
            <input type="text" id="profileFullName" style="border:none; outline:none; width:100%; font-size:13.5px; font-weight:700; color:#0f172a;" value="${escapeHtml(currentUser.fullName || '')}" required placeholder="Ví dụ: Đỗ Quốc Thịnh">
          </div>
        </div>

        <!-- Số điện thoại nhận hàng -->
        <div class="auth-input-group">
          <label class="auth-label" for="profilePhone" style="font-size:12.5px; font-weight:800; color:#1e293b; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-phone" style="color:#059669;"></i>
            Số điện thoại nhận hàng SPX <span class="required-star" style="color:#dc2626;">*</span>
          </label>
          <div class="auth-input-box" style="border:1.5px solid #cbd5e1; border-radius:10px; height:46px; display:flex; align-items:center; padding:0 12px; background:#fff;">
            <i class="fa-solid fa-phone" style="color:#059669; font-size:14px; margin-right:8px;"></i>
            <input type="tel" id="profilePhone" style="border:none; outline:none; width:100%; font-size:13.5px; font-weight:700; color:#0f172a;" value="${escapeHtml(currentUser.phone || '')}" placeholder="0981 903 400" required pattern="[0-9]{10,11}">
          </div>
        </div>

        <!-- Email tài khoản -->
        <div class="auth-input-group">
          <label class="auth-label" for="profileEmail" style="font-size:12.5px; font-weight:800; color:#1e293b; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            <i class="fa-regular fa-envelope" style="color:#2563eb;"></i>
            Email tài khoản
            <span style="font-size:10.5px; background:#f1f5f9; color:#475569; padding:1px 6px; border-radius:4px; margin-left:auto;"><i class="fa-solid fa-lock" style="font-size:9px;"></i> Định danh</span>
          </label>
          <div class="auth-input-box" style="border:1.5px solid #e2e8f0; border-radius:10px; height:46px; display:flex; align-items:center; padding:0 12px; background:#f8fafc;">
            <i class="fa-regular fa-envelope" style="color:#94a3b8; font-size:14px; margin-right:8px;"></i>
            <input type="email" id="profileEmail" style="border:none; outline:none; width:100%; font-size:13.5px; font-weight:600; color:#64748b; background:transparent;" value="${escapeHtml(currentUser.email || '')}" disabled>
          </div>
        </div>

        <!-- Khu vực Tỉnh / Thành phố -->
        <div class="auth-input-group">
          <label class="auth-label" for="profileCity" style="font-size:12.5px; font-weight:800; color:#1e293b; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-city" style="color:#6366f1;"></i>
            Tỉnh / Thành phố nhận hàng
          </label>
          <div class="auth-input-box" style="border:1.5px solid #cbd5e1; border-radius:10px; height:46px; display:flex; align-items:center; padding:0 12px; background:#fff;">
            <i class="fa-solid fa-city" style="color:#6366f1; font-size:14px; margin-right:8px;"></i>
            <input type="text" id="profileCity" style="border:none; outline:none; width:100%; font-size:13.5px; font-weight:700; color:#0f172a;" value="${escapeHtml(currentUser.city || 'Đồng Nai')}" placeholder="Ví dụ: Đồng Nai, TP.HCM, Bình Dương...">
          </div>
        </div>

        <!-- Mật khẩu đăng nhập (Liên kết để gộp tài khoản) -->
        <div class="auth-input-group" style="grid-column: 1 / -1; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 14px 16px; margin: 4px 0;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
            <label class="auth-label" style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-key" style="color: #dc2626;"></i>
              Mật khẩu đăng nhập hội viên
            </label>
            ${currentUser.hasPassword ? `
              <span style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 3px 10px; border-radius: 12px; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
                <i class="fa-solid fa-circle-check"></i> Đã có mật khẩu riêng
              </span>
            ` : `
              <span style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; padding: 3px 10px; border-radius: 12px; font-size: 11.5px; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;">
                <i class="fa-solid fa-shield-halved"></i> Chưa cài mật khẩu riêng (Chỉ dùng Google)
              </span>
            `}
          </div>

          ${currentUser.hasPassword ? `
            <!-- Thanh hiển thị mật khẩu đã lưu & Nút Đổi mật khẩu -->
            <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fa-solid fa-lock" style="color: #16a34a; font-size: 16px;"></i>
                <div>
                  <div style="font-size: 14px; font-weight: 800; color: #0f172a; letter-spacing: 3px;">••••••••••••</div>
                  <div style="font-size: 11px; color: #64748b;">Mật khẩu đã được mã hóa an toàn (Dùng để đăng nhập bằng Email / SĐT)</div>
                </div>
              </div>
              <button type="button" id="btnToggleChangePwd" onclick="toggleProfilePasswordEdit()" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 700; color: #1e293b; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s ease;">
                <i class="fa-solid fa-pen-to-square"></i> Đổi mật khẩu
              </button>
            </div>

            <!-- Khung nhập đổi mật khẩu mới (Ẩn mặc định, hiện khi bấm Đổi mật khẩu) -->
            <div id="profilePasswordChangeArea" style="display: none; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 8px;">
              <div style="font-size: 12px; font-weight: 700; color: #dc2626; margin-bottom: 8px;">
                <i class="fa-solid fa-shield-halved"></i> Thay đổi mật khẩu đăng nhập (Yêu cầu xác thực mật khẩu cũ):
              </div>

              <!-- Mật khẩu cũ (hiện tại) -->
              <div style="margin-bottom: 10px;">
                <label style="font-size: 11.5px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
                  Mật khẩu cũ (hiện tại) <span style="color: #dc2626;">*</span>
                </label>
                <div class="auth-input-box" style="border: 1.5px solid #cbd5e1; border-radius: 8px; height: 42px; display: flex; align-items: center; padding: 0 10px; background: #ffffff;">
                  <input type="password" id="profileOldPassword" style="border: none; outline: none; width: 100%; font-size: 13px; font-weight: 600; color: #0f172a;" placeholder="Nhập mật khẩu hiện tại đang dùng..." autocomplete="current-password">
                  <button type="button" onclick="togglePasswordInput('profileOldPassword', this)" style="background: transparent; border: none; cursor: pointer; color: #64748b; padding: 2px;" title="Xem/Ẩn">
                    <i class="fa-regular fa-eye"></i>
                  </button>
                </div>
              </div>

              <!-- Mật khẩu mới & Xác nhận mật khẩu mới -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <label style="font-size: 11.5px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
                    Mật khẩu mới (Tối thiểu 6 ký tự) <span style="color: #dc2626;">*</span>
                  </label>
                  <div class="auth-input-box" style="border: 1.5px solid #cbd5e1; border-radius: 8px; height: 42px; display: flex; align-items: center; padding: 0 10px; background: #ffffff;">
                    <input type="password" id="profileNewPassword" style="border: none; outline: none; width: 100%; font-size: 13px; font-weight: 600; color: #0f172a;" placeholder="Nhập mật khẩu mới..." autocomplete="new-password">
                    <button type="button" onclick="togglePasswordInput('profileNewPassword', this)" style="background: transparent; border: none; cursor: pointer; color: #64748b; padding: 2px;" title="Xem/Ẩn">
                      <i class="fa-regular fa-eye"></i>
                    </button>
                  </div>
                </div>
                <div>
                  <label style="font-size: 11.5px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
                    Xác nhận mật khẩu mới <span style="color: #dc2626;">*</span>
                  </label>
                  <div class="auth-input-box" style="border: 1.5px solid #cbd5e1; border-radius: 8px; height: 42px; display: flex; align-items: center; padding: 0 10px; background: #ffffff;">
                    <input type="password" id="profileConfirmPassword" style="border: none; outline: none; width: 100%; font-size: 13px; font-weight: 600; color: #0f172a;" placeholder="Gõ lại mật khẩu mới..." autocomplete="new-password">
                    <button type="button" onclick="togglePasswordInput('profileConfirmPassword', this)" style="background: transparent; border: none; cursor: pointer; color: #64748b; padding: 2px;" title="Xem/Ẩn">
                      <i class="fa-regular fa-eye"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ` : `
            <!-- Tài khoản Google chưa cài mật khẩu riêng -->
            <div style="font-size: 12px; color: #475569; line-height: 1.45; margin-bottom: 10px;">
              Tài khoản của bạn hiện đang đăng nhập thông qua Google. Hãy tạo mật khẩu riêng bên dưới để có thể đăng nhập trực tiếp bằng <strong>Email/SĐT + Mật khẩu</strong> trên mọi thiết bị:
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="font-size: 11.5px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Tạo mật khẩu riêng (Tối thiểu 6 ký tự)</label>
                <div class="auth-input-box" style="border: 1.5px solid #cbd5e1; border-radius: 8px; height: 42px; display: flex; align-items: center; padding: 0 10px; background: #ffffff;">
                  <input type="password" id="profileNewPassword" style="border: none; outline: none; width: 100%; font-size: 13px; font-weight: 600; color: #0f172a;" placeholder="Mật khẩu hội viên..." autocomplete="new-password">
                  <button type="button" onclick="togglePasswordInput('profileNewPassword', this)" style="background: transparent; border: none; cursor: pointer; color: #64748b; padding: 2px;" title="Xem/Ẩn">
                    <i class="fa-regular fa-eye"></i>
                  </button>
                </div>
              </div>
              <div>
                <label style="font-size: 11.5px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Xác nhận lại mật khẩu</label>
                <div class="auth-input-box" style="border: 1.5px solid #cbd5e1; border-radius: 8px; height: 42px; display: flex; align-items: center; padding: 0 10px; background: #ffffff;">
                  <input type="password" id="profileConfirmPassword" style="border: none; outline: none; width: 100%; font-size: 13px; font-weight: 600; color: #0f172a;" placeholder="Gõ lại mật khẩu..." autocomplete="new-password">
                  <button type="button" onclick="togglePasswordInput('profileConfirmPassword', this)" style="background: transparent; border: none; cursor: pointer; color: #64748b; padding: 2px;" title="Xem/Ẩn">
                    <i class="fa-regular fa-eye"></i>
                  </button>
                </div>
              </div>
            </div>
          `}
        </div>

        <!-- Chọn loại địa chỉ Mới hoặc Cũ -->
        <div class="auth-input-group" style="grid-column: 1 / -1;">
          <label class="auth-label" style="font-size:12.5px; font-weight:800; color:#1e293b; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-map-location-dot" style="color:#dc2626;"></i>
            Loại địa chỉ nhận hàng SPX Express
          </label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:8px;">
            <label class="addr-type-pill-card ${(!currentUser.addressType || currentUser.addressType === 'NEW') ? 'active' : ''}" id="profileAddrCardNew" style="display:flex; align-items:flex-start; gap:8px; padding:8px 12px; border:1.5px solid ${(!currentUser.addressType || currentUser.addressType === 'NEW') ? '#dc2626' : '#cbd5e1'}; border-radius:10px; background:#fff; cursor:pointer;">
              <input type="radio" name="profileAddressType" value="NEW" ${(!currentUser.addressType || currentUser.addressType === 'NEW') ? 'checked' : ''} onchange="handleProfileAddressTypeChange('NEW')" style="margin-top:2px;">
              <div>
                <div style="font-weight:700; font-size:12.5px; color:#0f172a;"><i class="fa-solid fa-circle-check" style="color:#16a34a; font-size:11px;"></i> Địa chỉ MỚI (Sau sáp nhập)</div>
                <div style="font-size:11px; color:#64748b; line-height:1.3; margin-top:2px;">Tên Phường/Xã mới nhất theo hệ thống bưu cục SPX Express</div>
              </div>
            </label>
            <label class="addr-type-pill-card ${currentUser.addressType === 'OLD' ? 'active' : ''}" id="profileAddrCardOld" style="display:flex; align-items:flex-start; gap:8px; padding:8px 12px; border:1.5px solid ${currentUser.addressType === 'OLD' ? '#dc2626' : '#cbd5e1'}; border-radius:10px; background:#fff; cursor:pointer;">
              <input type="radio" name="profileAddressType" value="OLD" ${currentUser.addressType === 'OLD' ? 'checked' : ''} onchange="handleProfileAddressTypeChange('OLD')" style="margin-top:2px;">
              <div>
                <div style="font-weight:700; font-size:12.5px; color:#0f172a;"><i class="fa-solid fa-clock-rotate-left" style="color:#ea580c; font-size:11px;"></i> Địa chỉ CŨ (Trước sáp nhập)</div>
                <div style="font-size:11px; color:#64748b; line-height:1.3; margin-top:2px;">Tên Phường/Xã cũ quen thuộc (Shop tự đối chiếu khi tạo vận đơn)</div>
              </div>
            </label>
          </div>

          <div id="profileOldAddrHelper" style="display:${currentUser.addressType === 'OLD' ? 'block' : 'none'}; background:#fffbeb; border:1px dashed #fde68a; border-radius:8px; padding:8px 12px; font-size:12px; color:#92400e; margin-bottom:8px;">
            <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:5px;">
              <i class="fa-solid fa-triangle-exclamation" style="color:#d97706;"></i>
              <span>Lưu ý khi sử dụng địa chỉ cũ trước đợt sáp nhập ĐVHC:</span>
            </div>
            <div style="line-height:1.45; font-size:11.5px; margin-bottom:6px;">
              Tại TP. Biên Hòa, các phường cũ (P. Hòa Bình ➔ P. Quang Vinh, P. Thanh Bình ➔ P. Quyết Thắng...). Shop sẽ căn cứ ghi chú cũ bên dưới để đối chiếu tạo vận đơn SPX.
            </div>
            <input type="text" id="profileOldWardNote" style="width:100%; padding:6px 10px; font-size:12px; border:1px solid #fcd34d; border-radius:6px; outline:none; background:#ffffff; color:#78350f; font-weight:600;" value="${escapeHtml(currentUser.oldAddressNote || '')}" placeholder="Ghi chú tên Phường/Xã cũ (Ví dụ: Trước sáp nhập là Phường Hòa Bình, Biên Hòa)">
          </div>
        </div>

        <!-- Địa chỉ nhận hàng chi tiết -->
        <div class="auth-input-group" style="grid-column: 1 / -1;">
          <label class="auth-label" for="profileAddress" style="font-size:12.5px; font-weight:800; color:#1e293b; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-location-dot" style="color:#dc2626;"></i>
            Địa chỉ nhận hàng chi tiết (Số nhà, tên đường, Phường/Xã) <span class="required-star" style="color:#dc2626;">*</span>
          </label>
          <div class="auth-input-box" style="border:1.5px solid #cbd5e1; border-radius:10px; height:46px; display:flex; align-items:center; padding:0 12px; background:#fff;">
            <i class="fa-solid fa-location-dot" style="color:#dc2626; font-size:14px; margin-right:8px;"></i>
            <input type="text" id="profileAddress" style="border:none; outline:none; width:100%; font-size:13.5px; font-weight:700; color:#0f172a;" value="${escapeHtml(currentUser.address || '')}" placeholder="Ví dụ: 38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai" required oninput="handleAddressInputDebounced(this.value)">
          </div>
          <div style="font-size:11.5px; color:#64748b; margin-top:4px; display:flex; align-items:center; gap:5px;">
            <i class="fa-solid fa-truck-fast" style="color:#dc2626;"></i> Hệ thống sẽ tự động điền địa chỉ này vào mỗi đơn đặt cọc mô hình mới của bạn qua SPX Express.
          </div>
        </div>

        <!-- Ghi chú giao hàng mặc định cho Shipper -->
        <div class="auth-input-group" style="grid-column: 1 / -1;">
          <label class="auth-label" for="profileDeliveryNote" style="font-size:12.5px; font-weight:800; color:#1e293b; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            <i class="fa-regular fa-comment-dots" style="color:#0284c7;"></i>
            Ghi chú giao hàng mặc định cho Shipper SPX
          </label>
          <div class="auth-input-box" style="border:1.5px solid #cbd5e1; border-radius:10px; height:46px; display:flex; align-items:center; padding:0 12px; background:#fff;">
            <i class="fa-regular fa-comment-dots" style="color:#0284c7; font-size:14px; margin-right:8px;"></i>
            <input type="text" id="profileDeliveryNote" style="border:none; outline:none; width:100%; font-size:13px; font-weight:600; color:#0f172a;" value="${escapeHtml(currentUser.deliveryNote || '')}" placeholder="Ví dụ: Gọi trước khi giao 15 phút, giao giờ hành chính, kiện mô hình bọc xốp kỹ">
          </div>
        </div>
      </div>

      <!-- Khối Cam Kết Đặc Quyền -->
      <div style="margin-top:16px; display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px;">
        <div style="display:flex; align-items:center; gap:8px; font-size:11.5px; color:#334155;">
          <i class="fa-solid fa-box-open" style="color:#dc2626; font-size:15px;"></i>
          <span>100% Nguyên Seal Nhà SX</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px; font-size:11.5px; color:#334155; border-left:1px solid #e2e8f0; border-right:1px solid #e2e8f0; padding:0 8px;">
          <i class="fa-solid fa-shield-halved" style="color:#2563eb; font-size:15px;"></i>
          <span>Bọc xốp khí 4 lớp SPX</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px; font-size:11.5px; color:#334155;">
          <i class="fa-solid fa-rotate-left" style="color:#059669; font-size:15px;"></i>
          <span>Đổi trả 7 ngày nếu lỗi hộp</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="margin-top:18px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <button type="submit" id="btnSaveProfile" style="flex:1; min-width:200px; height:46px; background:linear-gradient(135deg, #dc2626, #b91c1c); color:#ffffff; font-size:13.5px; font-weight:800; border:none; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 20px -4px rgba(220,38,38,0.4); text-transform:uppercase; letter-spacing:0.5px; transition:transform 0.15s ease;">
          <i class="fa-solid fa-floppy-disk"></i> LƯU THAY ĐỔI HỒ SƠ
        </button>
        <button type="button" class="btn btn-outline" style="height:46px; padding:0 20px; font-size:13px; font-weight:700; border-radius:10px; display:flex; align-items:center; gap:6px;" onclick="closeModal('userProfileModal'); openMyOrdersModal();">
          <i class="fa-solid fa-box-archive"></i> Đơn mua của tôi
        </button>
      </div>

      <!-- Nút Đăng xuất tiện lợi trên thiết bị di động & máy tính -->
      <div style="margin-top:14px; border-top:1px solid #e2e8f0; padding-top:12px;">
        <button type="button" onclick="closeModal('userProfileModal'); logout();" style="width:100%; height:44px; background:#fff1f2; border:1.5px solid #fecdd3; color:#e11d48; font-weight:800; font-size:13px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:background 0.2s ease;">
          <i class="fa-solid fa-right-from-bracket"></i> ĐĂNG XUẤT KHỎI TÀI KHOẢN NÀY
        </button>
      </div>
    </form>
  `;

  modal.classList.add('active');
}

function toggleProfilePasswordEdit() {
  const area = document.getElementById('profilePasswordChangeArea');
  const btn = document.getElementById('btnToggleChangePwd');
  if (!area) return;
  const isHidden = area.style.display === 'none';
  area.style.display = isHidden ? 'block' : 'none';
  if (btn) {
    btn.innerHTML = isHidden
      ? '<i class="fa-solid fa-xmark"></i> Hủy đổi mật khẩu'
      : '<i class="fa-solid fa-pen-to-square"></i> Đổi mật khẩu';
    btn.style.color = isHidden ? '#dc2626' : '#1e293b';
  }
  if (isHidden) {
    document.getElementById('profileOldPassword')?.focus();
  } else {
    const pOld = document.getElementById('profileOldPassword');
    const p1 = document.getElementById('profileNewPassword');
    const p2 = document.getElementById('profileConfirmPassword');
    if (pOld) pOld.value = '';
    if (p1) p1.value = '';
    if (p2) p2.value = '';
  }
}

function togglePasswordInput(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPwd = input.type === 'password';
  input.type = isPwd ? 'text' : 'password';
  const icon = btn?.querySelector('i');
  if (icon) {
    icon.className = isPwd ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
  }
}

async function handleUpdateUserProfile(e) {
  e.preventDefault();
  if (!currentUser) return;

  const fullName = document.getElementById('profileFullName')?.value.trim();
  const phone = document.getElementById('profilePhone')?.value.trim();
  const address = document.getElementById('profileAddress')?.value.trim();
  const city = document.getElementById('profileCity')?.value.trim();
  const deliveryNote = document.getElementById('profileDeliveryNote')?.value.trim();
  const oldPassword = document.getElementById('profileOldPassword')?.value.trim() || '';
  const newPassword = document.getElementById('profileNewPassword')?.value.trim() || '';
  const confirmPassword = document.getElementById('profileConfirmPassword')?.value.trim() || '';

  if (!fullName || !phone || !address) {
    showToast('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng!', 'error');
    return;
  }

  // Xác thực khi người dùng đổi mật khẩu
  if (currentUser.hasPassword) {
    if (newPassword || oldPassword) {
      if (!oldPassword) {
        showToast('Vui lòng nhập Mật khẩu cũ (hiện tại) để xác thực thay đổi!', 'warning');
        document.getElementById('profileOldPassword')?.focus();
        return;
      }
      if (!newPassword) {
        showToast('Vui lòng nhập Mật khẩu mới cần đổi!', 'warning');
        document.getElementById('profileNewPassword')?.focus();
        return;
      }
      if (newPassword.length < 6) {
        showToast('Mật khẩu mới phải có tối thiểu 6 ký tự!', 'error');
        document.getElementById('profileNewPassword')?.focus();
        return;
      }
      if (newPassword === oldPassword) {
        showToast('Mật khẩu mới không được trùng với mật khẩu cũ!', 'warning');
        document.getElementById('profileNewPassword')?.focus();
        return;
      }
      if (!confirmPassword) {
        showToast('Vui lòng nhập xác nhận lại mật khẩu mới!', 'warning');
        document.getElementById('profileConfirmPassword')?.focus();
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.', 'error');
        document.getElementById('profileConfirmPassword')?.focus();
        return;
      }
    }
  } else {
    // Tài khoản OAuth tạo mật khẩu riêng lần đầu
    if (newPassword) {
      if (newPassword.length < 6) {
        showToast('Mật khẩu mới phải có tối thiểu 6 ký tự!', 'error');
        document.getElementById('profileNewPassword')?.focus();
        return;
      }
      if (confirmPassword && newPassword !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.', 'error');
        document.getElementById('profileConfirmPassword')?.focus();
        return;
      }
    }
  }

  const btnSave = document.getElementById('btnSaveProfile');
  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG LƯU DỮ LIỆU...';
  }

  currentUser.fullName = fullName;
  currentUser.phone = phone;
  currentUser.address = address;
  const addressTypeRadio = document.querySelector('input[name="profileAddressType"]:checked');
  const addressType = addressTypeRadio ? addressTypeRadio.value : 'NEW';
  const oldWardNote = document.getElementById('profileOldWardNote')?.value.trim() || '';
  currentUser.addressType = addressType;
  currentUser.oldAddressNote = oldWardNote;
  if (city) currentUser.city = city;
  if (deliveryNote) currentUser.deliveryNote = deliveryNote;
  if (newPassword) currentUser.hasPassword = true;

  try {
    const updateRes = await safeFetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.userId || currentUser.id,
        email: currentUser.email,
        fullName,
        phone,
        address,
        addressType,
        oldAddressNote: oldWardNote,
        city,
        deliveryNote,
        oldPassword: oldPassword || undefined,
        password: newPassword || undefined,
        newPassword: newPassword || undefined
      })
    });

    if (updateRes && updateRes.success === false) {
      if (btnSave) {
        btnSave.disabled = false;
        btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> LƯU THAY ĐỔI HỒ SƠ';
      }
      showToast(updateRes.message || 'Không thể lưu thông tin hồ sơ. Vui lòng kiểm tra lại!', 'error');
      if (updateRes.message && (updateRes.message.includes('Mật khẩu cũ') || updateRes.message.includes('mật khẩu cũ'))) {
        document.getElementById('profileOldPassword')?.focus();
      }
      return;
    }

    if (updateRes && (updateRes.user || updateRes.data)) {
      const updatedData = updateRes.user || updateRes.data;
      currentUser = Object.assign({}, currentUser, updatedData);
      if (updateRes.token) {
        currentToken = updateRes.token;
        if (api && api.setAuthSession) api.setAuthSession(updateRes.token, currentUser);
      }
    }
  } catch (err) {
    console.warn('Lưu profile offline fallback:', err);
  }

  // Đảm bảo đồng bộ thông tin mật khẩu vào Shared Users & LocalStorage
  try {
    if (api && typeof api.getSharedUsers === 'function' && typeof api.saveSharedUsers === 'function') {
      const uList = api.getSharedUsers();
      const uItem = uList.find(u => (u.userId == currentUser.userId || u.id == currentUser.id || (u.email && u.email.toLowerCase() === currentUser.email?.toLowerCase())));
      if (uItem) {
        uItem.fullName = fullName;
        uItem.phone = phone;
        uItem.address = address;
        uItem.addressType = addressType;
        uItem.oldAddressNote = oldWardNote;
        uItem.city = city;
        uItem.deliveryNote = deliveryNote;
        if (newPassword) {
          uItem.password = newPassword;
          uItem.hasPassword = true;
          if (uItem.authProvider === 'google') uItem.authProvider = 'google+local';
        }
        api.saveSharedUsers(uList);
      }
    }
  } catch (_) {}

  try {
    localStorage.setItem('minigt_user', JSON.stringify(currentUser));
  } catch (_) {}

  // Tự động đồng bộ sang các trường thông tin thanh toán nếu có
  const checkoutName = document.getElementById('checkoutName');
  const checkoutPhone = document.getElementById('checkoutPhone');
  const checkoutAddress = document.getElementById('checkoutAddress');
  if (checkoutName) checkoutName.value = fullName;
  if (checkoutPhone) checkoutPhone.value = phone;
  if (checkoutAddress) checkoutAddress.value = address;

  updateUserHeaderUI();
  closeModal('userProfileModal');
  showToast(
    newPassword
      ? '✅ Đã lưu hồ sơ và đổi mật khẩu mới thành công! Giờ đây bạn có thể đăng nhập bằng mật khẩu mới.'
      : '✅ Cập nhật hồ sơ hội viên & địa chỉ nhận hàng thành công!',
    'success'
  );
}

document.addEventListener('click', () => {
  const menu = document.getElementById('userDropdownMenu');
  if (menu) menu.classList.remove('active');
});

// =====================================================================
// 13. TRUNG TÂM ĐƠN HÀNG CỦA KHÁCH (MY ORDERS) & TRA CỨU VẬN ĐƠN SPX
// =====================================================================
let myOrdersCache = [];
let myOrdersActiveFilter = 'ALL';
let myOrdersSearchKeyword = '';
let customerOrderStateSnapshot = {};
let customerOrderRealtimeTimer = null;

function getSavedCustomerOrderCodes() {
  try {
    const uKey = currentUser ? (currentUser.userId || currentUser.id || currentUser.email) : 'guest';
    const raw = JSON.parse(localStorage.getItem('minigt_my_order_codes_' + uKey) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    return [];
  }
}

function rememberCustomerOrderCode(code) {
  if (!code) return;
  try {
    const uKey = currentUser ? (currentUser.userId || currentUser.id || currentUser.email) : 'guest';
    const key = 'minigt_my_order_codes_' + uKey;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const next = [code, ...(Array.isArray(existing) ? existing.filter(c => c !== code) : [])].slice(0, 50);
    localStorage.setItem(key, JSON.stringify(next));
  } catch (e) {
    // ignore
  }
}

function openTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.add('active');
}

function openMyOrdersModal() {
  const modal = document.getElementById('myOrdersModal');
  if (!modal) return;
  modal.classList.add('active');
  loadMyOrdersList();
}

async function fetchCustomerOrdersUnified() {
  const headers = {};
  if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

  let url = '/api/orders/my-orders';

  if (!currentUser) {
    // Khách vãng lai: chỉ gửi danh sách mã đơn được đặt trong phiên khách hiện tại
    const savedCodes = getSavedCustomerOrderCodes();
    const queryParams = new URLSearchParams();
    if (savedCodes.length > 0) queryParams.set('codes', savedCodes.join(','));
    if (queryParams.toString()) url += '?' + queryParams.toString();
  }

  const json = await safeFetch(url, { headers });
  let apiOrders = (json && json.success && Array.isArray(json.data)) ? json.data : [];

  // Đồng bộ vào kho chia sẻ local để cả online/offline đều nhất quán
  if (typeof upsertSharedOrder === 'function') {
    apiOrders.forEach(o => upsertSharedOrder(o));
  }

  // Hợp nhất thêm đơn hàng từ kho bộ đệm sharedOrders NHƯNG CHỈ LỌC ĐÚNG ĐƠN CỦA TÀI KHOẢN HIỆN TẠI
  const sharedOrders = typeof getSharedOrdersList === 'function' ? getSharedOrdersList() : [];
  const byCode = new Map();
  apiOrders.forEach(o => {
    const c = o.OrderCode || o.orderCode || o.code;
    if (c) byCode.set(c, o);
  });

  const savedCodes = getSavedCustomerOrderCodes();

  sharedOrders.forEach(o => {
    const c = o.OrderCode || o.orderCode || o.code;
    if (!c || byCode.has(c)) return;

    if (currentUser) {
      // Đã đăng nhập: CHỈ khớp đơn hàng có đúng userId hoặc email của tài khoản đang đăng nhập
      const oUid = o.UserId || o.userId || (o.customer && (o.customer.userId || o.customer.id));
      const myUid = currentUser.userId || currentUser.id;
      const oEmail = String(o.Email || o.email || (o.customer && o.customer.email) || '').trim().toLowerCase();
      const myEmail = String(currentUser.email || '').trim().toLowerCase();

      const matchUser = (oUid && myUid && Number(oUid) === Number(myUid)) || (oEmail && myEmail && oEmail === myEmail);
      if (matchUser) {
        byCode.set(c, o);
      }
    } else {
      // Khách vãng lai: chỉ lấy các đơn có mã trùng khớp trong phiên khách
      if (savedCodes.includes(c)) {
        byCode.set(c, o);
      }
    }
  });

  const merged = Array.from(byCode.values()).sort((a, b) => {
    const da = new Date(a.CreatedAt || a.createdAt || 0).getTime();
    const db = new Date(b.CreatedAt || b.createdAt || 0).getTime();
    return db - da;
  });

  merged.forEach(o => {
    const c = o.OrderCode || o.orderCode || o.code;
    const status = String(o.Status || o.status || 'PENDING').toUpperCase();
    const tracking = String(o.TrackingCode || o.trackingCode || '').trim();
    if (c) {
      customerOrderStateSnapshot[c] = { status, tracking };
    }
  });

  return merged;
}

async function loadMyOrdersList(silent = false) {
  const container = document.getElementById('myOrdersModalContent');
  if (!container) return;

  if (!silent) {
    container.innerHTML = `
      <div style="text-align:center; padding:2rem; color:#64748b;">
        <i class="fa-solid fa-circle-notch fa-spin" style="font-size:24px; color:var(--color-primary); margin-bottom:8px;"></i>
        <p style="font-size:13px; font-weight:600;">Đang đồng bộ danh sách đơn hàng & mã vận đơn SPX Express...</p>
      </div>
    `;
  }

  try {
    const orders = await fetchCustomerOrdersUnified();
    myOrdersCache = orders;
    renderMyOrdersCenterUI(container);
  } catch (err) {
    container.innerHTML = `
      <div style="text-align:center; padding:1.5rem; color:#dc2626;">
        <p>Lỗi tải đơn hàng: ${escapeHtml(err.message)}</p>
        <button class="btn btn-sm btn-outline" style="margin-top:8px;" onclick="loadMyOrdersList()">Thử lại</button>
      </div>
    `;
  }
}

function setMyOrdersFilter(filterKey) {
  myOrdersActiveFilter = filterKey;
  const container = document.getElementById('myOrdersModalContent');
  if (container) renderMyOrdersCenterUI(container);
}

function handleMyOrdersSearchInput(val) {
  myOrdersSearchKeyword = String(val || '').trim();
  const listEl = document.getElementById('myOrdersCardsList');
  if (listEl) {
    const filtered = getFilteredMyOrders();
    listEl.innerHTML = filtered.length > 0
      ? filtered.map(ord => buildUnifiedCustomerOrderCardHTML(ord)).join('')
      : `<div style="text-align:center; padding:2rem; background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1; color:#64748b;">Không tìm thấy đơn hàng nào khớp với bộ lọc hiện tại.</div>`;
  }
}

function getFilteredMyOrders() {
  return myOrdersCache.filter(ord => {
    const status = String(ord.Status || ord.status || 'PENDING').toUpperCase();
    const tracking = String(ord.TrackingCode || ord.trackingCode || '').trim();

    if (myOrdersActiveFilter === 'PENDING' && status !== 'PENDING') return false;
    if (myOrdersActiveFilter === 'APPROVED' && !['CONFIRMED', 'PREPARING'].includes(status)) return false;
    if (myOrdersActiveFilter === 'SHIPPING' && !(status === 'SHIPPING' || (tracking && status !== 'DELIVERED' && status !== 'CANCELLED'))) return false;
    if (myOrdersActiveFilter === 'DELIVERED' && status !== 'DELIVERED') return false;
    if (myOrdersActiveFilter === 'CANCELLED' && status !== 'CANCELLED') return false;

    if (myOrdersSearchKeyword) {
      const kw = myOrdersSearchKeyword.toLowerCase();
      const code = String(ord.OrderCode || ord.orderCode || ord.code || '').toLowerCase();
      const spx = tracking.toLowerCase();
      const phone = String(ord.Phone || ord.customer?.phone || '').toLowerCase();
      const itemNames = Array.isArray(ord.items)
        ? ord.items.map(i => String(i.ProductName || i.name || '').toLowerCase()).join(' ')
        : '';
      if (!code.includes(kw) && !spx.includes(kw) && !phone.includes(kw) && !itemNames.includes(kw)) {
        return false;
      }
    }
    return true;
  });
}

function renderMyOrdersCenterUI(container) {
  if (!myOrdersCache || myOrdersCache.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:2.5rem 1.5rem; background:#f8fafc; border-radius:14px; border:1px dashed #cbd5e1;">
        <div style="font-size:42px; margin-bottom:10px; color:#94a3b8;"><i class="fa-solid fa-box-open"></i></div>
        <h4 style="font-size:16px; color:var(--color-navy); margin-bottom:6px; font-weight:800;">Chưa Có Đơn Hàng Nào Trên Thiết Bị Này</h4>
        <p style="font-size:13px; color:#64748b; margin-bottom:16px; max-width:520px; margin-inline:auto; line-height:1.5;">
          Bạn có thể đặt mua mô hình ngay trên trang chủ, hoặc nhập <strong>Số điện thoại / Mã đơn hàng</strong> bên dưới để đồng bộ tất cả đơn hàng đã đặt.
        </p>
        <div style="display:flex; gap:8px; max-width:420px; margin:0 auto 14px;">
          <input type="text" id="quickSyncPhoneOrCode" class="form-input" placeholder="Nhập SĐT (VD: 0988...) hoặc Mã đơn MGT-..." style="flex:1;">
          <button type="button" class="btn btn-primary btn-sm" onclick="syncCustomerOrderByQuery()">
            <i class="fa-solid fa-rotate"></i> Đồng bộ đơn
          </button>
        </div>
        <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick="closeModal('myOrdersModal'); scrollToSection('catalog');">
            <i class="fa-solid fa-car-side" style="margin-right:5px;"></i> Khám phá Catalogue 1:64
          </button>
          ${!currentUser ? `
            <button class="btn btn-outline btn-sm" onclick="closeModal('myOrdersModal'); openAuthModal('login');">
              <i class="fa-solid fa-user-check" style="margin-right:5px;"></i> Đăng nhập tài khoản
            </button>
          ` : ''}
        </div>
      </div>
    `;
    return;
  }

  const totalOrders = myOrdersCache.length;
  const approvedCount = myOrdersCache.filter(o => ['CONFIRMED', 'PREPARING'].includes(String(o.Status || o.status || '').toUpperCase())).length;
  const shippingWithSpxCount = myOrdersCache.filter(o => {
    const st = String(o.Status || o.status || '').toUpperCase();
    const tk = String(o.TrackingCode || o.trackingCode || '').trim();
    return st === 'SHIPPING' || Boolean(tk);
  }).length;
  const totalSpent = myOrdersCache
    .filter(o => String(o.Status || o.status || '').toUpperCase() !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.Total || o.total || 0), 0);

  // Tìm đơn hàng mới nhất đã được Admin duyệt hoặc dán mã SPX để hiện thông báo nổi bật trên đầu
  const latestApprovedOrSpx = myOrdersCache.find(o => {
    const st = String(o.Status || o.status || '').toUpperCase();
    const tk = String(o.TrackingCode || o.trackingCode || '').trim();
    return ['CONFIRMED', 'PREPARING', 'SHIPPING'].includes(st) || Boolean(tk);
  });

  const filteredOrders = getFilteredMyOrders();

  const tabs = [
    { key: 'ALL', label: `Tất cả (${totalOrders})`, icon: 'fa-layer-group' },
    { key: 'PENDING', label: `Chờ duyệt (${myOrdersCache.filter(o => String(o.Status || o.status || 'PENDING').toUpperCase() === 'PENDING').length})`, icon: 'fa-hourglass-half' },
    { key: 'APPROVED', label: `Admin đã duyệt (${approvedCount})`, icon: 'fa-circle-check' },
    { key: 'SHIPPING', label: `Đã có mã SPX (${shippingWithSpxCount})`, icon: 'fa-truck-fast' },
    { key: 'DELIVERED', label: `Hoàn tất (${myOrdersCache.filter(o => String(o.Status || o.status || '').toUpperCase() === 'DELIVERED').length})`, icon: 'fa-award' },
    { key: 'CANCELLED', label: `Đã hủy (${myOrdersCache.filter(o => String(o.Status || o.status || '').toUpperCase() === 'CANCELLED').length})`, icon: 'fa-ban' }
  ];

  container.innerHTML = `
    <!-- 3 Thẻ thống kê tinh gọn, hiện đại -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; margin-bottom:14px;">
      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:10px 14px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="width:36px; height:36px; border-radius:10px; background:#f1f5f9; color:#0f172a; display:flex; align-items:center; justify-content:center; font-size:16px;">
          <i class="fa-solid fa-boxes-stacked"></i>
        </div>
        <div>
          <div style="font-size:11px; color:#64748b; font-weight:700; text-transform:uppercase;">Tổng đơn hàng</div>
          <div style="font-size:18px; font-weight:900; color:#0f172a;">${totalOrders} đơn</div>
        </div>
      </div>
      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:10px 14px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="width:36px; height:36px; border-radius:10px; background:#ecfdf5; color:#16a34a; display:flex; align-items:center; justify-content:center; font-size:16px;">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <div>
          <div style="font-size:11px; color:#16a34a; font-weight:700; text-transform:uppercase;">Admin đã duyệt</div>
          <div style="font-size:18px; font-weight:900; color:#15803d;">${approvedCount} đơn</div>
        </div>
      </div>
      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:10px 14px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="width:36px; height:36px; border-radius:10px; background:#fff7ed; color:#ea580c; display:flex; align-items:center; justify-content:center; font-size:16px;">
          <i class="fa-solid fa-truck-fast"></i>
        </div>
        <div>
          <div style="font-size:11px; color:#ea580c; font-weight:700; text-transform:uppercase;">Đang giao SPX</div>
          <div style="font-size:18px; font-weight:900; color:#c2410c;">${shippingWithSpxCount} đơn</div>
        </div>
      </div>
    </div>

    <!-- Thanh bộ lọc trạng thái & Tìm kiếm nhanh -->
    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:14px; background:#f8fafc; padding:10px; border-radius:12px; border:1px solid #e2e8f0;">
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        ${tabs.map(t => `
          <button type="button"
            onclick="setMyOrdersFilter('${t.key}')"
            style="border:1px solid ${myOrdersActiveFilter === t.key ? '#0f172a' : '#cbd5e1'}; background:${myOrdersActiveFilter === t.key ? '#0f172a' : '#ffffff'}; color:${myOrdersActiveFilter === t.key ? '#ffffff' : '#334155'}; border-radius:999px; padding:5px 11px; font-size:11.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:all 0.2s;">
            <i class="fa-solid ${t.icon}"></i> ${t.label}
          </button>
        `).join('')}
      </div>
      <div style="display:flex; gap:6px; align-items:center; flex:1; min-width:220px; max-width:320px;">
        <input type="text" id="myOrdersSearchInput" class="form-input" value="${escapeHtml(myOrdersSearchKeyword)}"
          oninput="handleMyOrdersSearchInput(this.value)"
          placeholder="Tìm mã đơn, mã SPX, tên xe..."
          style="padding:6px 10px; font-size:12px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="loadMyOrdersList()" title="Đồng bộ mới nhất từ Admin" style="padding:6px 10px; white-space:nowrap;">
          <i class="fa-solid fa-rotate"></i> Làm mới
        </button>
      </div>
    </div>

    <!-- Danh sách thẻ đơn hàng chi tiết -->
    <div id="myOrdersCardsList">
      ${filteredOrders.length > 0
        ? filteredOrders.map(ord => buildUnifiedCustomerOrderCardHTML(ord)).join('')
        : `<div style="text-align:center; padding:2rem; background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1; color:#64748b;">Không có đơn hàng nào trong mục này.</div>`
      }
    </div>
  `;
}

async function syncCustomerOrderByQuery() {
  const input = document.getElementById('quickSyncPhoneOrCode');
  const q = input ? input.value.trim() : '';
  if (!q) {
    showToast('Vui lòng nhập Số điện thoại hoặc Mã đơn hàng!', 'error');
    return;
  }
  try {
    const json = await safeFetch(`/api/orders/track/${encodeURIComponent(q)}`);
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      json.data.forEach(o => {
        const c = o.OrderCode || o.orderCode || o.code;
        rememberCustomerOrderCode(c);
        if (typeof upsertSharedOrder === 'function') upsertSharedOrder(o);
      });
      if (/^0\d{8,10}$/.test(q)) {
        localStorage.setItem('minigt_last_phone', q);
      }
      showToast(`Đã đồng bộ ${json.data.length} đơn hàng thành công!`, 'success');
      loadMyOrdersList();
    } else {
      showToast('Không tìm thấy đơn hàng nào với thông tin vừa nhập.', 'error');
    }
  } catch (err) {
    showToast('Lỗi đồng bộ đơn hàng: ' + err.message, 'error');
  }
}

function buildUnifiedCustomerOrderCardHTML(ord) {
  const orderCode = ord.OrderCode || ord.orderCode || ord.code || '';
  const ordStatus = String(ord.Status || ord.status || 'PENDING').toUpperCase();
  const payStatus = String(ord.PaymentStatus || ord.paymentStatus || 'UNPAID').toUpperCase();
  const payMethod = String(ord.PaymentMethod || ord.paymentMethod || 'DEPOSIT').toUpperCase();
  const trackingCode = String(ord.TrackingCode || ord.trackingCode || '').trim();
  const isPaid = payStatus === 'PAID';
  const isPartiallyPaid = payStatus === 'PARTIALLY_PAID';
  const isApproved = Boolean(ord.isApproved) || ['CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED'].includes(ordStatus) || Boolean(trackingCode);

  const subtotal = Number(ord.Subtotal || ord.subtotal || 0);
  const shippingFee = Number(ord.ShippingFee || ord.shippingFee || 11000);
  const total = Number(ord.Total || ord.total || (subtotal + shippingFee));
  const depositAmount = Number(ord.DepositAmount || ord.depositAmount || ord.totalDeposit || 0);
  const codToCollect = ord.codAmount != null
    ? Number(ord.codAmount)
    : (isPaid ? 0 : (payMethod === 'DEPOSIT' ? Math.max(0, total - depositAmount) : (payMethod === 'BANK_TRANSFER' ? 0 : total)));

  const paymentMemo = ord.paymentMemo || ord.PaymentMemo || `MINI GT ${orderCode}`;
  const bankAcc = storeSettings?.bank_account_no || '87654321082007';
  const bankName = storeSettings?.bank_name || 'MBBank (Ngân Hàng Quân Đội)';
  const bankOwner = storeSettings?.bank_account_name || 'DO QUOC THINH';

  const fullName = ord.FullName || ord.customer?.fullName || 'Khách hàng';
  const phone = ord.Phone || ord.customer?.phone || '';
  const address = ord.Address || ord.customer?.address || '';
  const note = ord.Note || ord.note || '';

  const wasPreOrder = Boolean(ord.wasPreOrder || ord.hasPreOrder || ord.HasPreOrder);
  const isStockArrived = Boolean(ord.isStockArrived || ord.preOrderNotified || ord.PreOrderNotified) || (wasPreOrder && ['PREPARING', 'SHIPPING', 'DELIVERED'].includes(ordStatus));
  const isWaitingPreOrder = wasPreOrder && !isStockArrived;

  // Tiến trình 5 bước của đơn hàng (Tách biệt logic trực quan giữa Hàng có sẵn và Đơn Pre-Order)
  let activeStep = 1;
  if (ordStatus === 'CONFIRMED') activeStep = 2;
  else if (ordStatus === 'PREPARING') activeStep = 3;
  else if (ordStatus === 'SHIPPING' || (trackingCode && ordStatus !== 'DELIVERED')) activeStep = 4;
  else if (ordStatus === 'DELIVERED') activeStep = 5;

  const progressSteps = wasPreOrder ? [
    { step: 1, label: isPartiallyPaid || isPaid ? 'Đã cọc Pre-Order' : 'Đặt cọc xe', icon: 'fa-hand-holding-dollar' },
    { step: 2, label: isStockArrived ? 'Xe đã về kho' : 'Chờ xe về kho', icon: isStockArrived ? 'fa-warehouse' : 'fa-hourglass-half' },
    { step: 3, label: 'Bọc xốp hộp', icon: 'fa-box-open' },
    { step: 4, label: 'Đang giao SPX', icon: 'fa-truck-fast' },
    { step: 5, label: 'Đã nhận xe', icon: 'fa-circle-check' }
  ] : [
    { step: 1, label: 'Đặt đơn', icon: 'fa-file-invoice' },
    { step: 2, label: 'Admin đã duyệt', icon: 'fa-user-check' },
    { step: 3, label: 'Bọc xốp hộp', icon: 'fa-box-open' },
    { step: 4, label: 'Đã có mã SPX', icon: 'fa-truck-fast' },
    { step: 5, label: 'Đã nhận xe', icon: 'fa-circle-check' }
  ];

  let payStatusBadge = '';
  if (payMethod === 'COD') {
    payStatusBadge = `<span style="font-size:11px; font-weight:700; padding:3px 9px; border-radius:9999px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;"><i class="fa-solid fa-hand-holding-dollar" style="margin-right:3px;"></i> Thanh toán COD</span>`;
  } else if (isPaid) {
    payStatusBadge = `<span style="font-size:11px; font-weight:700; padding:3px 9px; border-radius:9999px; background:#ecfdf5; color:#059669; border:1px solid #a7f3d0;"><i class="fa-solid fa-circle-check" style="margin-right:3px;"></i> Đã thanh toán 100%</span>`;
  } else if (isPartiallyPaid) {
    payStatusBadge = `<span style="font-size:11px; font-weight:700; padding:3px 9px; border-radius:9999px; background:#ecfdf5; color:#059669; border:1px solid #a7f3d0;"><i class="fa-solid fa-circle-check" style="margin-right:3px;"></i> Đã xác nhận cọc ${formatVND(depositAmount)}</span>`;
  } else {
    payStatusBadge = `<span style="font-size:11px; font-weight:700; padding:3px 9px; border-radius:9999px; background:#fef3c7; color:#b45309; border:1px solid #fde68a;"><i class="fa-solid fa-clock" style="margin-right:3px;"></i> ${payMethod === 'DEPOSIT' ? 'Chờ duyệt cọc' : 'Chờ duyệt chuyển khoản'}</span>`;
  }

  let statusBadgeHTML = `<span style="font-size:11px; font-weight:800; padding:3px 10px; border-radius:9999px; background:#fef3c7; color:#b45309;">⏳ Chờ Admin duyệt đơn</span>`;
  if (ordStatus === 'CONFIRMED') {
    if (isWaitingPreOrder) {
      statusBadgeHTML = `<span style="font-size:11px; font-weight:800; padding:3px 10px; border-radius:9999px; background:#ede9fe; color:#6d28d9;"><i class="fa-solid fa-clock"></i> Đã cọc Pre-Order • Chờ hàng về</span>`;
    } else if (isStockArrived) {
      statusBadgeHTML = `<span style="font-size:11px; font-weight:800; padding:3px 10px; border-radius:9999px; background:#dcfce7; color:#15803d;"><i class="fa-solid fa-boxes-stacked"></i> Hàng đã về kho • Sẵn sàng</span>`;
    } else {
      statusBadgeHTML = `<span style="font-size:11px; font-weight:800; padding:3px 10px; border-radius:9999px; background:#dcfce7; color:#15803d;">✅ Admin đã duyệt đơn</span>`;
    }
  } else if (ordStatus === 'PREPARING') {
    if (wasPreOrder && isStockArrived) {
      statusBadgeHTML = `<span style="font-size:11px; font-weight:800; padding:3px 10px; border-radius:9999px; background:#dcfce7; color:#15803d;"><i class="fa-solid fa-boxes-packing"></i> Hàng đã về kho • Đang đóng gói</span>`;
    } else {
      statusBadgeHTML = `<span style="font-size:11px; font-weight:800; padding:3px 10px; border-radius:9999px; background:#e0f2fe; color:#0369a1;">📦 Đang đóng gói chống sốc</span>`;
    }
  } else if (ordStatus === 'SHIPPING' || (trackingCode && ordStatus !== 'DELIVERED' && ordStatus !== 'CANCELLED')) {
    statusBadgeHTML = `<span style="font-size:11px; font-weight:800; padding:3px 10px; border-radius:9999px; background:#ffedd5; color:#c2410c;">🚚 Đang giao SPX (${escapeHtml(trackingCode || 'SPX')})</span>`;
  } else if (ordStatus === 'DELIVERED') {
    statusBadgeHTML = `<span style="font-size:11px; font-weight:800; padding:3px 10px; border-radius:9999px; background:#dcfce7; color:#166534;">🏆 Giao hàng thành công</span>`;
  } else if (ordStatus === 'CANCELLED') {
    statusBadgeHTML = `<span style="font-size:11px; font-weight:800; padding:3px 10px; border-radius:9999px; background:#fee2e2; color:#991b1b;">✖ Đã hủy đơn</span>`;
  }

  const canEditShipping = ['PENDING', 'CONFIRMED', 'PREPARING'].includes(ordStatus) && !trackingCode;
  const canConfirmReceived = (ordStatus === 'SHIPPING' || Boolean(trackingCode)) && ordStatus !== 'DELIVERED' && ordStatus !== 'CANCELLED';
  const canCancel = ordStatus === 'PENDING' && !trackingCode;
  const needsQrTransfer = !isPaid && !isPartiallyPaid && payMethod !== 'COD' && ordStatus !== 'CANCELLED';

  return `
    <div class="customer-order-card" style="background:#ffffff; border:1.5px solid ${trackingCode ? '#fed7aa' : (isApproved ? '#bbf7d0' : '#e2e8f0')}; border-radius:14px; padding:16px; margin-bottom:16px; box-shadow:0 4px 14px rgba(15,23,42,0.04);">
      <!-- Header đơn hàng -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding-bottom:10px; border-bottom:1px solid #f1f5f9;">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span style="font-size:11px; font-weight:800; background:#0f172a; color:#fff; padding:3px 8px; border-radius:6px;">MÃ ĐƠN</span>
          <strong style="color:var(--color-navy); font-size:15px; font-family:monospace;">#${escapeHtml(orderCode)}</strong>
          <button type="button" class="btn-copy-mini" onclick="copyToClipboard('${escapeHtml(orderCode)}', 'Đã sao chép mã đơn #${escapeHtml(orderCode)}')" title="Sao chép mã đơn">
            <i class="fa-regular fa-copy"></i>
          </button>
          <span style="font-size:11.5px; color:#64748b;">
            • ${ord.CreatedAt || ord.createdAt ? new Date(ord.CreatedAt || ord.createdAt).toLocaleString('vi-VN') : 'Vừa đặt'}
          </span>
        </div>
        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
          ${payStatusBadge}
          ${statusBadgeHTML}
        </div>
      </div>

      <!-- Thanh tiến trình 5 bước (ẩn nếu đơn đã hủy) -->
      ${ordStatus !== 'CANCELLED' ? `
        <div class="order-progress-track" style="margin:14px 0;">
          ${progressSteps.map(s => {
            const isDone = activeStep > s.step || ordStatus === 'DELIVERED';
            const isCurr = activeStep === s.step && ordStatus !== 'DELIVERED';
            return `
              <div class="order-step-node ${isDone ? 'completed' : ''} ${isCurr ? 'active' : ''}">
                <div class="order-step-circle"><i class="fa-solid ${isDone ? 'fa-check' : s.icon}"></i></div>
                <div class="order-step-label">${s.label}</div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      <!-- KHỐI THÔNG BÁO ĐƠN HỦY KÈM LÝ DO (PHÂN BIỆT RÕ KHÁCH TỰ HỦY VS ADMIN HỦY) -->
      ${ordStatus === 'CANCELLED' ? (() => {
        const cancelReason = ord.CancelReason || ord.cancelReason || 'Admin đã xử lý hủy đơn';
        const isCustCancel = cancelReason.toLowerCase().includes('khách') || cancelReason.toLowerCase().includes('chủ động') || cancelReason.toLowerCase().includes('yêu cầu');
        const cancelTitle = isCustCancel
          ? `⚠️ ĐƠN HÀNG #${escapeHtml(orderCode)} ĐÃ ĐƯỢC BẠN HỦY THÀNH CÔNG`
          : `❌ ĐƠN HÀNG #${escapeHtml(orderCode)} ĐÃ BỊ HỦY BỞI QUẢN TRỊ VIÊN`;
        const cancelBorder = isCustCancel ? '2px solid #f59e0b' : '2px solid #ef4444';
        const iconColor = isCustCancel ? '#d97706' : '#dc2626';
        const titleColor = isCustCancel ? '#b45309' : '#dc2626';
        const bgReason = isCustCancel ? '#fffbeb' : '#fef2f2';
        const borderReason = isCustCancel ? '#fde68a' : '#fee2e2';

        return `
        <div style="background:#ffffff; border:${cancelBorder}; border-radius:8px; padding:14px 16px; margin-bottom:14px; text-align:left; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
          <div style="display:flex; align-items:flex-start; gap:12px;">
            <div style="font-size:24px; color:${iconColor}; line-height:1; flex-shrink:0;">
              <i class="fa-solid ${isCustCancel ? 'fa-triangle-exclamation' : 'fa-circle-xmark'}"></i>
            </div>
            <div style="flex:1;">
              <div style="font-size:14px; font-weight:800; color:${titleColor};">
                ${cancelTitle}
              </div>
              <div style="margin-top:8px; background:${bgReason}; border:1px solid ${borderReason}; border-radius:6px; padding:8px 12px; font-size:13px; color:#374151;">
                <strong>Lý do:</strong> <span style="color:${titleColor}; font-weight:700;">${escapeHtml(cancelReason)}</span>
              </div>
              <div style="margin-top:10px; font-size:12.5px; color:#4b5563; line-height:1.5;">
                Quý khách có nhu cầu đặt lại mẫu xe hoặc cần hỗ trợ, vui lòng liên hệ Hotline / Zalo: <strong style="color:#dc2626; font-size:13px;">0981 400 400</strong>.
              </div>
              <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
                <a href="tel:0981400400" class="btn btn-sm" style="background:#dc2626; color:#ffffff; border:none; padding:7px 14px; border-radius:6px; font-size:12px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
                  <i class="fa-solid fa-phone"></i> Gọi Hotline 0981 400 400
                </a>
                <a href="https://zalo.me/0981400400" target="_blank" class="btn btn-sm" style="background:#ffffff; color:#0284c7; border:1px solid #0284c7; padding:7px 14px; border-radius:6px; font-size:12px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
                  <i class="fa-solid fa-comments"></i> Nhắn Zalo Hỗ Trợ
                </a>
              </div>
            </div>
          </div>
        </div>
        `;
      })() : (isApproved ? (isWaitingPreOrder ? `
        <div style="background:#f5f3ff; border:1px solid #c4b5fd; border-radius:10px; padding:10px 14px; margin-bottom:12px; display:flex; align-items:center; gap:10px;">
          <i class="fa-solid fa-clock" style="color:#7c3aed; font-size:18px;"></i>
          <div style="flex:1; font-size:12.5px; color:#4c1d95;">
            <strong>Đã xác nhận cọc Pre-Order thành công!</strong> Kiện xe đang được hãng sản xuất và vận chuyển về kho. Cửa hàng sẽ chủ động thông báo ngay khi lô xe cập bến Biên Hòa.
          </div>
        </div>
      ` : (wasPreOrder && isStockArrived ? `
        <div style="background:#f0fdf4; border:1.5px solid #22c55e; border-radius:10px; padding:12px 14px; margin-bottom:12px; display:flex; align-items:flex-start; gap:10px;">
          <div style="font-size:22px; color:#16a34a; line-height:1;"><i class="fa-solid fa-boxes-packing"></i></div>
          <div style="flex:1; font-size:12.5px; color:#14532d; line-height:1.5;">
            <div style="font-weight:800; color:#15803d; font-size:13px; margin-bottom:2px;">
              📦 LÔ HÀNG PRE-ORDER ĐÃ CẬP BẾN KHO BIÊN HÒA!
            </div>
            Lô xe mô hình bạn đặt cọc đã về đến kho cửa hàng và chuyển sang hàng có sẵn. Shop đang tiến hành bọc xốp chống sốc 4 lớp và chuẩn bị giao cho SPX Express${codToCollect > 0 ? ` (Số tiền còn lại cần thanh toán khi nhận xe: <strong>${formatVND(codToCollect)}</strong>)` : ''}.
          </div>
        </div>
      ` : `
        <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:10px; padding:10px 14px; margin-bottom:12px; display:flex; align-items:center; gap:10px;">
          <i class="fa-solid fa-circle-check" style="color:#16a34a; font-size:18px;"></i>
          <div style="flex:1; font-size:12.5px; color:#166534;">
            <strong>Admin đã xác nhận đơn hàng!</strong> ${trackingCode ? 'Kiện xe đã bàn giao cho SPX Express kèm mã vận đơn bên dưới.' : 'Kiện xe đang được đóng bọc xốp chống sốc để gửi SPX Express.'}
          </div>
        </div>
      `)) : `
        <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:10px 14px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
          <div style="font-size:12px; color:#92400e;">
            <i class="fa-solid fa-hourglass-half" style="color:#d97706; margin-right:5px;"></i>
            <strong>Đang chờ Admin duyệt đơn:</strong> Ngay khi Admin kiểm tra và lưu mã SPX, trạng thái sẽ cập nhật tự động tại đây.
          </div>
          <span style="font-size:10px; font-weight:700; background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:999px;">Đồng bộ thời gian thực</span>
        </div>
      `)}

      <!-- KHỐI HIỂN THỊ MÃ VẬN ĐƠN SPX EXPRESS NỔI BẬT KHI ĐÃ CÓ MÃ -->
      ${trackingCode && ordStatus !== 'CANCELLED' ? `
        <div class="spx-tracking-card" style="margin-bottom:12px; border:2px solid #fb923c; background:linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);">
          <div class="spx-card-header">
            <span class="spx-badge-pill">
              <i class="fa-solid fa-truck-fast"></i> VẬN ĐƠN SPX EXPRESS CHÍNH THỨC
            </span>
            <span style="font-size:12px; color:#c2410c; font-weight:800; display:inline-flex; align-items:center; gap:5px;">
              <i class="fa-solid fa-circle-check" style="color:#16a34a;"></i> Đã có mã vận đơn
            </span>
          </div>
          <div class="spx-code-box" style="margin-top:8px;">
            <div>
              <div style="font-size:10px; color:#9a3412; text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">Mã vận đơn SPX của bạn:</div>
              <div class="spx-code-val" style="font-size:18px; letter-spacing:1px;">${escapeHtml(trackingCode)}</div>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button type="button" class="btn-copy-spx" onclick="copyToClipboard('${escapeHtml(trackingCode)}', 'Đã sao chép mã vận đơn SPX: ${escapeHtml(trackingCode)}')">
                <i class="fa-regular fa-copy"></i> Sao chép mã SPX
              </button>
              <a href="https://spx.vn/vi" target="_blank" class="btn-open-spx-link" style="margin:0; padding:8px 12px; font-size:12px;">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Tra cứu trên spx.vn/vi ↗
              </a>
            </div>
          </div>
          <div style="font-size:11.5px; color:#9a3412; margin-top:8px; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-circle-info"></i>
            <span>Bấm <strong>"Sao chép mã SPX"</strong> rồi mở <strong>spx.vn/vi</strong> để xem vị trí bưu tá đang giao kiện xe của bạn.</span>
          </div>
        </div>
      ` : ''}

      <!-- Danh sách sản phẩm + Thông tin người nhận trên 2 cột gọn gàng -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px; margin-bottom:12px;">
        <!-- Cột 1: Danh sách xe mô hình -->
        <div style="border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; background:#f8fafc;">
          <div style="font-size:11px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:6px;">
            <i class="fa-solid fa-car-side" style="color:var(--color-primary); margin-right:4px;"></i> Danh sách mô hình (${Array.isArray(ord.items) ? ord.items.length : 0})
          </div>
          ${Array.isArray(ord.items) && ord.items.length > 0 ? ord.items.map(it => {
            const pack = String(it.PackagingOption || it.packagingOption || it.PackType || it.packType || 'box').toLowerCase();
            const pid = it.productId || it.ProductId || it.id;
            let pName = it.ProductName || it.productName || it.name || it.Name || '';
            let pImg = it.productImage || it.ImageUrl || it.imageUrl || it.image || '';
            if ((!pName || !pImg || pImg.includes('hero-banner')) && pid) {
              const matched = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => (p.ProductId || p.id) == pid);
              if (matched) {
                if (!pName || pName === 'Mô hình 1:64') pName = matched.Name || matched.name;
                if (!pImg || pImg.includes('hero-banner')) pImg = matched.ImageUrl || matched.image;
              }
            }
            if (!pName) pName = 'Mô hình MINI GT 1:64';
            if (!pImg) pImg = 'image/hero-banner.jpg';
            const unitPrice = Number(it.UnitPrice ?? it.unitPrice ?? it.price ?? 0);
            const qty = Number(it.Quantity ?? it.quantity ?? 1);
            const itemStatus = String(it.PackagingOption || it.packagingOption || it.status || it.Status || '').toLowerCase();
            const isItemPre = itemStatus.includes('pre') || wasPreOrder;
            const itemPreStatusBadge = isItemPre
              ? (isStockArrived
                  ? `<span style="font-size:10px; font-weight:700; padding:1px 6px; border-radius:4px; background:#dcfce7; color:#166534;"><i class="fa-solid fa-circle-check"></i> Đã về kho</span>`
                  : `<span style="font-size:10px; font-weight:700; padding:1px 6px; border-radius:4px; background:#ede9fe; color:#6d28d9;"><i class="fa-solid fa-clock"></i> Pre-Order</span>`)
              : '';
            return `
            <div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px dashed #e2e8f0; font-size:12px;">
              <img src="${pImg}" onerror="this.src='image/hero-banner.jpg'" style="width:38px; height:38px; object-fit:contain; border-radius:6px; border:1px solid #cbd5e1; background:#fff; padding:2px; flex-shrink:0;">
              <div style="flex:1; min-width:0;">
                <div style="font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(pName)}">${escapeHtml(pName)}</div>
                <div style="display:flex; align-items:center; gap:6px; margin-top:2px; flex-wrap:wrap;">
                  <span class="pack-badge ${pack === 'card' ? 'pack-card' : 'pack-box'}">${pack === 'card' ? '🛡️ Card' : '📦 Box'}</span>
                  ${itemPreStatusBadge}
                  <span style="font-size:11px; color:#64748b;">SL: <strong>x${qty}</strong> • Đơn giá: ${formatVND(unitPrice)}</span>
                </div>
              </div>
              <strong style="color:#0f172a; font-size:12.5px;">${formatVND(unitPrice * qty)}</strong>
            </div>
            `;
          }).join('') : `<div style="font-size:12px; color:#64748b;">Đơn hàng tiêu chuẩn Săn Xe Biên Hòa</div>`}
        </div>

        <!-- Cột 2: Địa chỉ giao nhận & Đối soát tài chính -->
        <div style="border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; background:#ffffff;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:11px; font-weight:800; color:#475569; text-transform:uppercase;">
              <i class="fa-solid fa-location-dot" style="color:#ef4444; margin-right:4px;"></i> Thông tin nhận hàng
            </span>
            ${canEditShipping ? `
              <button type="button" onclick="openEditOrderShippingModal('${escapeHtml(orderCode)}')" style="border:none; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:700; padding:2px 8px; border-radius:6px; cursor:pointer;">
                <i class="fa-solid fa-pen-to-square"></i> Sửa địa chỉ
              </button>
            ` : ''}
          </div>
          <div style="font-size:12px; color:#334155; line-height:1.5; margin-bottom:8px; padding-bottom:8px; border-bottom:1px dashed #e2e8f0;">
            <div>Người nhận: <strong>${escapeHtml(fullName)}</strong> • SĐT: <strong>${escapeHtml(phone)}</strong></div>
            <div>Địa chỉ: <span>${escapeHtml(address)}</span></div>
            ${note ? `<div style="color:#64748b; font-style:italic;">Ghi chú: ${escapeHtml(note)}</div>` : ''}
          </div>
          <div style="font-size:12px; line-height:1.6;">
            <div style="display:flex; justify-content:space-between;"><span>Tổng đơn (gồm ship SPX ${formatVND(shippingFee)}):</span><strong>${formatVND(total)}</strong></div>
            ${payMethod === 'DEPOSIT' ? `<div style="display:flex; justify-content:space-between; color:#2563eb;"><span>Tiền cọc giữ mẫu (30%):</span><strong>${formatVND(depositAmount)}</strong></div>` : ''}
            <div style="display:flex; justify-content:space-between; font-weight:800; color:${codToCollect === 0 ? '#15803d' : '#dc2626'}; margin-top:2px; padding-top:4px; border-top:1px solid #f1f5f9;">
              <span>Cần thanh toán khi nhận xe (COD):</span>
              <span>${codToCollect === 0 ? '0đ (Đã trả đủ 100%)' : formatVND(codToCollect)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Khung VietQR thu gọn (bấm để mở) nếu đơn chưa thanh toán chuyển khoản/cọc -->
      ${needsQrTransfer ? `
        <div id="qrPanel_${escapeHtml(orderCode)}" style="display:none; background:#fffbeb; border:1.5px solid #fde68a; border-radius:10px; padding:14px; margin-bottom:12px;">
          <div style="display:grid; grid-template-columns:minmax(170px, 200px) 1fr; gap:16px; align-items:center;">
            <div style="text-align:center;">
              <img src="https://img.vietqr.io/image/MB-${encodeURIComponent(bankAcc)}-compact2.png?amount=${Math.round(payMethod === 'DEPOSIT' ? depositAmount : total)}&addInfo=${encodeURIComponent(paymentMemo)}&accountName=${encodeURIComponent(bankOwner)}" alt="VietQR" style="width:100%; max-width:200px; border-radius:10px; border:1.5px solid #e2e8f0; background:#fff; padding:4px; box-shadow:0 3px 10px rgba(0,0,0,0.06); display:block; margin:0 auto;">
              <div style="font-size:11px; color:#92400e; margin-top:4px; font-weight:700;"><i class="fa-solid fa-qrcode"></i> Quét mã VietQR</div>
            </div>
            <div style="font-size:12.5px; color:#451a03; line-height:1.65;">
              <div>Ngân hàng: <strong>${escapeHtml(bankName)}</strong> • Chủ TK: <strong>${escapeHtml(bankOwner)}</strong></div>
              <div>STK: <strong style="color:#dc2626; font-family:monospace; font-size:13.5px;">${escapeHtml(bankAcc)}</strong> <button type="button" class="btn-copy-mini" onclick="copyToClipboard('${escapeHtml(bankAcc)}', 'Đã sao chép STK!')"><i class="fa-regular fa-copy"></i></button></div>
              <div>Số tiền cần chuyển: <strong style="color:#dc2626; font-size:14px; font-weight:900;">${formatVND(payMethod === 'DEPOSIT' ? depositAmount : total)}</strong></div>
              <div>Nội dung CK: <strong style="color:#1d4ed8; font-family:monospace; font-size:13.5px; background:#eff6ff; padding:2px 6px; border-radius:4px;">${escapeHtml(paymentMemo)}</strong> <button type="button" class="btn-copy-mini" style="background:#2563eb; color:#fff;" onclick="copyToClipboard('${escapeHtml(paymentMemo)}', 'Đã sao chép nội dung CK!')"><i class="fa-regular fa-copy"></i> Copy</button></div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- THANH CHỨC NĂNG DÀNH CHO KHÁCH HÀNG -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding-top:10px; border-top:1px solid #f1f5f9;">
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-sm" style="font-size:11.5px; padding:5px 10px;" onclick="printCustomerOrderInvoice('${escapeHtml(orderCode)}')">
            <i class="fa-solid fa-print" style="margin-right:4px;"></i> In phiếu đặt cọc / Hóa đơn
          </button>
          <button type="button" class="btn btn-outline btn-sm" style="font-size:11.5px; padding:5px 10px;" onclick="reorderCustomerOrder('${escapeHtml(orderCode)}')">
            <i class="fa-solid fa-cart-plus" style="margin-right:4px;"></i> Mua lại đơn này
          </button>
          ${canEditShipping ? `
            <button type="button" class="btn btn-outline btn-sm" style="font-size:11.5px; padding:5px 10px; color:#1d4ed8; border-color:#bfdbfe;" onclick="openEditOrderShippingModal('${escapeHtml(orderCode)}')">
              <i class="fa-solid fa-location-pen" style="margin-right:4px;"></i> Đổi địa chỉ nhận
            </button>
          ` : ''}
          ${needsQrTransfer ? `
            <button type="button" class="btn btn-outline btn-sm" style="font-size:11.5px; padding:5px 10px; color:#b45309; border-color:#fde68a; background:#fffbeb;" onclick="toggleOrderQrPanel('${escapeHtml(orderCode)}')">
              <i class="fa-solid fa-qrcode" style="margin-right:4px;"></i> Hiện mã QR thanh toán
            </button>
          ` : ''}
        </div>

        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${canConfirmReceived ? `
            <button type="button" class="btn btn-primary btn-sm" style="background:#16a34a; border-color:#16a34a; font-size:11.5px; padding:6px 12px;" onclick="customerConfirmOrderReceived('${escapeHtml(orderCode)}')">
              <i class="fa-solid fa-box-check" style="margin-right:4px;"></i> Đã nhận được hàng
            </button>
          ` : ''}
          ${canCancel ? `
            <button type="button" class="btn btn-outline btn-sm" style="color:#dc2626; border-color:#fca5a5; font-size:11.5px; padding:5px 10px;" onclick="cancelMyOrder('${escapeHtml(orderCode)}')">
              <i class="fa-solid fa-ban" style="margin-right:4px;"></i> Hủy đơn
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function toggleOrderQrPanel(orderCode) {
  const el = document.getElementById(`qrPanel_${orderCode}`);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function findOrderInCustomerMemory(orderCode) {
  const fromCache = myOrdersCache.find(o => (o.OrderCode || o.orderCode || o.code) === orderCode);
  if (fromCache) return fromCache;
  if (typeof getSharedOrdersList === 'function') {
    return getSharedOrdersList().find(o => (o.OrderCode || o.orderCode || o.code) === orderCode) || null;
  }
  return null;
}

// Chức năng 1: Mở modal sửa địa chỉ / SĐT nhận hàng khi đơn chưa giao SPX
function openEditOrderShippingModal(orderCode) {
  const ord = findOrderInCustomerMemory(orderCode);
  const modal = document.getElementById('editOrderShippingModal');
  if (!modal) return;

  document.getElementById('editShippingOrderCode').value = orderCode;
  document.getElementById('editShippingFullName').value = ord?.FullName || ord?.customer?.fullName || '';
  document.getElementById('editShippingPhone').value = ord?.Phone || ord?.customer?.phone || '';
  document.getElementById('editShippingAddress').value = ord?.Address || ord?.customer?.address || '';
  document.getElementById('editShippingNote').value = ord?.Note || ord?.note || '';

  const addrType = String(ord?.addressType || ord?.AddressType || 'NEW').toUpperCase();
  const oldRadio = document.querySelector('input[name="editShippingAddressType"][value="OLD"]');
  const newRadio = document.querySelector('input[name="editShippingAddressType"][value="NEW"]');
  if (addrType === 'OLD' && oldRadio) {
    oldRadio.checked = true;
    handleEditShippingAddressTypeChange('OLD');
  } else if (newRadio) {
    newRadio.checked = true;
    handleEditShippingAddressTypeChange('NEW');
  }
  const oldWardInput = document.getElementById('editShippingOldWardNote');
  if (oldWardInput) oldWardInput.value = ord?.oldAddressNote || ord?.OldAddressNote || '';

  modal.classList.add('active');
}

async function submitCustomerEditShipping(event) {
  if (event) event.preventDefault();
  const orderCode = document.getElementById('editShippingOrderCode')?.value.trim();
  const fullName = document.getElementById('editShippingFullName')?.value.trim();
  const phone = document.getElementById('editShippingPhone')?.value.trim();
  const address = document.getElementById('editShippingAddress')?.value.trim();
  const note = document.getElementById('editShippingNote')?.value.trim();
  const addressTypeRadio = document.querySelector('input[name="editShippingAddressType"]:checked');
  const addressType = addressTypeRadio ? addressTypeRadio.value : 'NEW';
  const oldAddressNote = document.getElementById('editShippingOldWardNote')?.value.trim() || '';

  if (!orderCode || !fullName || !phone || !address) {
    showToast('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng!', 'error');
    return;
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

    const json = await safeFetch(`/api/orders/${encodeURIComponent(orderCode)}/shipping-info`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ fullName, phone, address, note, addressType, oldAddressNote })
    });

    if (json.success) {
      if (json.data && typeof upsertSharedOrder === 'function') upsertSharedOrder(json.data);
      if (typeof emitRealtimeSync === 'function') {
        emitRealtimeSync('ORDER_UPDATED', { orderCode, order: json.data });
      }
      closeModal('editOrderShippingModal');
      showToast(`Đã cập nhật địa chỉ nhận hàng cho đơn #${orderCode}!`, 'success');
      loadMyOrdersList(true);
    } else {
      showToast(json.message || 'Không thể cập nhật thông tin giao hàng', 'error');
    }
  } catch (err) {
    showToast('Lỗi cập nhật địa chỉ: ' + err.message, 'error');
  }
}

// Chức năng 2: Khách hàng xác nhận đã nhận được kiện xe mô hình nguyên vẹn
async function customerConfirmOrderReceived(orderCode) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

    const json = await safeFetch(`/api/orders/${encodeURIComponent(orderCode)}/confirm-received`, {
      method: 'PUT',
      headers
    });

    if (json.success) {
      if (json.data && typeof upsertSharedOrder === 'function') upsertSharedOrder(json.data);
      if (typeof emitRealtimeSync === 'function') {
        emitRealtimeSync('ORDER_UPDATED', { orderCode, status: 'DELIVERED', order: json.data });
      }
      if (typeof launchCollectorConfetti === 'function') launchCollectorConfetti();
      showToast(`🎉 Cảm ơn bạn đã xác nhận nhận hàng đơn #${orderCode}! Thư cảm ơn & cẩm nang bảo quản mô hình 1:64 đã được gửi tự động qua email của bạn!`, 'success', 6000);
      loadMyOrdersList(true);
    } else {
      showToast(json.message || 'Không thể xác nhận đã nhận hàng', 'error');
    }
  } catch (err) {
    showToast('Lỗi xác nhận nhận hàng: ' + err.message, 'error');
  }
}

// Chức năng 3: Mua lại các mẫu xe trong đơn hàng cũ
function reorderCustomerOrder(orderCode) {
  const ord = findOrderInCustomerMemory(orderCode);
  if (!ord || !Array.isArray(ord.items) || ord.items.length === 0) {
    showToast('Không tìm thấy danh sách sản phẩm của đơn hàng này để mua lại.', 'error');
    return;
  }

  let addedCount = 0;
  ord.items.forEach(it => {
    const pid = Number(it.ProductId || it.productId);
    const prod = allProducts.find(p => Number(p.ProductId || p.Id || p.id) === pid);
    const unitPrice = Number(prod?.Price || it.UnitPrice || it.unitPrice || 290000);
    const qty = Number(it.Quantity || it.quantity || 1);
    const existing = cart.find(c => Number(c.productId) === pid);

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({
        productId: pid || Number(prod?.ProductId) || 1,
        name: prod?.Name || it.ProductName || it.name || 'Mô hình Mini GT 1:64',
        sku: prod?.Sku || it.Sku || it.sku || 'MGT-164',
        price: unitPrice,
        depositAmount: Number(prod?.DepositAmount || Math.round(unitPrice * 0.3)),
        imageUrl: prod?.ImageUrl || it.ImageUrl || it.image || 'image/hero-banner.jpg',
        isPreOrder: (prod?.Status || '') === 'pre_order',
        quantity: qty
      });
    }
    addedCount++;
  });

  saveCart();
  renderCartDrawer();
  closeModal('myOrdersModal');
  showToast(`Đã thêm ${addedCount} mẫu xe từ đơn #${orderCode} vào giỏ hàng!`, 'success');
  openCheckoutModal();
}

// Chức năng 4: In Phiếu Xác Nhận Đặt Cọc / Hóa Đơn Điện Tử Săn Xe Biên Hòa
function printCustomerOrderInvoice(orderCode) {
  const ord = findOrderInCustomerMemory(orderCode);
  if (!ord) {
    showToast('Không tìm thấy dữ liệu đơn hàng để in phiếu.', 'error');
    return;
  }
  const subtotal = Number(ord.Subtotal || ord.subtotal || 0);
  const shippingFee = Number(ord.ShippingFee || ord.shippingFee || 11000);
  const total = Number(ord.Total || ord.total || (subtotal + shippingFee));
  const depositAmount = Number(ord.DepositAmount || ord.depositAmount || 0);
  const trackingCode = ord.TrackingCode || ord.trackingCode || 'Đang cập nhật';
  const itemsHTML = (ord.items || []).map((it, idx) => `
    <tr>
      <td style="padding:8px; border:1px solid #cbd5e1; text-align:center;">${idx + 1}</td>
      <td style="padding:8px; border:1px solid #cbd5e1;"><strong>${escapeHtml(it.ProductName || it.name)}</strong></td>
      <td style="padding:8px; border:1px solid #cbd5e1; text-align:center;">${it.Quantity || it.quantity}</td>
      <td style="padding:8px; border:1px solid #cbd5e1; text-align:right;">${formatVND(it.UnitPrice || it.unitPrice)}</td>
      <td style="padding:8px; border:1px solid #cbd5e1; text-align:right; font-weight:700;">${formatVND((it.UnitPrice || it.unitPrice) * (it.Quantity || it.quantity))}</td>
    </tr>
  `).join('');

  const win = window.open('', '_blank', 'width=820,height=720');
  if (!win) {
    showToast('Trình duyệt đang chặn cửa sổ bật lên (Pop-up). Vui lòng cho phép để in hóa đơn!', 'error');
    return;
  }
  win.document.write(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Phiếu Đơn Hàng #${escapeHtml(orderCode)} - Săn Xe Biên Hòa</title>
      <style>
        body { font-family: Arial, sans-serif; color: #0f172a; padding: 28px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
        table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; }
        .summary { margin-left: auto; width: 320px; font-size: 13.5px; }
        .summary div { display: flex; justify-content: space-between; padding: 4px 0; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom:16px; text-align:right;">
        <button onclick="window.print()" style="background:#e11d48; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:700; cursor:pointer;">🖨️ In Phiếu / Lưu PDF</button>
      </div>
      <div class="header">
        <div>
          <h2 style="margin:0; color:#e11d48;">SĂN XE BIÊN HÒA - MINI GT 1:64</h2>
          <div style="font-size:12px; color:#475569;">Showroom Mô Hình Diecast Chính Hãng • Hotline: 0988.164.164</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:800; font-size:16px;">PHIẾU XÁC NHẬN ĐƠN HÀNG</div>
          <div style="font-family:monospace; font-size:14px;">#${escapeHtml(orderCode)}</div>
          <div style="font-size:12px; color:#64748b;">Mã vận đơn SPX: <strong>${escapeHtml(trackingCode)}</strong></div>
        </div>
      </div>
      <div style="font-size:13px; margin-bottom:12px;">
        <div><strong>Khách hàng:</strong> ${escapeHtml(ord.FullName || ord.customer?.fullName || '')} - <strong>SĐT:</strong> ${escapeHtml(ord.Phone || ord.customer?.phone || '')}</div>
        <div><strong>Địa chỉ giao hàng:</strong> ${escapeHtml(ord.Address || ord.customer?.address || '')}</div>
        <div><strong>Trạng thái đơn:</strong> ${escapeHtml(ord.Status || ord.status || 'PENDING')} | <strong>Phương thức:</strong> ${escapeHtml(ord.PaymentMethod || ord.paymentMethod || '')}</div>
      </div>
      <table>
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:8px; border:1px solid #cbd5e1;">STT</th>
            <th style="padding:8px; border:1px solid #cbd5e1; text-align:left;">Mẫu xe mô hình 1:64</th>
            <th style="padding:8px; border:1px solid #cbd5e1;">SL</th>
            <th style="padding:8px; border:1px solid #cbd5e1; text-align:right;">Đơn giá</th>
            <th style="padding:8px; border:1px solid #cbd5e1; text-align:right;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <div class="summary">
        <div><span>Tạm tính tiền xe:</span><strong>${formatVND(subtotal)}</strong></div>
        <div><span>Phí vận chuyển SPX Express:</span><strong>${formatVND(shippingFee)}</strong></div>
        <div style="border-top:1px solid #cbd5e1; font-size:15px;"><span>Tổng giá trị đơn:</span><strong>${formatVND(total)}</strong></div>
        <div><span>Tiền đặt cọc (30%):</span><strong>${formatVND(depositAmount)}</strong></div>
      </div>
      <p style="margin-top:24px; font-size:12px; color:#64748b; text-align:center;">
        Cảm ơn quý khách đã tin tưởng sưu tầm mô hình tại Săn Xe Biên Hòa!
      </p>
    </body>
    </html>
  `);
  win.document.close();
}

// Chức năng 5: Hủy đơn hàng khi đang PENDING
async function cancelMyOrder(orderCode) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

    const json = await safeFetch(`/api/orders/${encodeURIComponent(orderCode)}/cancel`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ reason: 'Khách hàng chủ động hủy đơn trên giao diện' })
    });

    if (json.success) {
      // Đánh dấu snapshot đã hủy bởi khách để polling không thông báo cảnh báo admin
      if (customerOrderStateSnapshot) {
        customerOrderStateSnapshot[orderCode] = { status: 'CANCELLED', tracking: '', cancelledByCustomer: true };
      }
      if (json.data && typeof upsertSharedOrder === 'function') upsertSharedOrder(json.data);

      // Yêu cầu: khi khách tự hủy đơn thì sản phẩm đó trong giỏ hàng mất luôn (đồng bộ giỏ hàng sạch)
      cart = [];
      saveCart();
      renderCartDrawer();
      updateCartBadge();

      if (typeof emitRealtimeSync === 'function') {
        emitRealtimeSync('ORDER_UPDATED', { orderCode, status: 'CANCELLED', order: json.data, cancelledByCustomer: true });
      }
      showToast(`Đã hủy đơn hàng #${orderCode} thành công!`, 'success');
      loadMyOrdersList(true);
    } else {
      showToast(json.message || 'Không thể hủy đơn hàng', 'error');
    }
  } catch (err) {
    showToast('Lỗi khi hủy đơn hàng: ' + err.message, 'error');
  }
}

// Tra cứu vận đơn nhanh (Tracking Modal)
async function searchOrderTracking() {
  const query = document.getElementById('trackingInput')?.value.trim();
  const resultsContainer = document.getElementById('trackingResults');
  if (!query) {
    showToast('Vui lòng nhập Mã đơn hàng, Mã SPX hoặc Số điện thoại!', 'error');
    return;
  }

  if (resultsContainer) {
    resultsContainer.innerHTML = '<p style="text-align:center; padding:1rem; color:var(--color-gray-500);"><i class="fa-solid fa-spinner fa-spin"></i> Đang tra cứu dữ liệu từ hệ thống...</p>';
  }

  try {
    const json = await safeFetch(`/api/orders/track/${encodeURIComponent(query)}`);
    if (json.success && json.data && json.data.length > 0) {
      json.data.forEach(o => {
        const c = o.OrderCode || o.orderCode || o.code;
        rememberCustomerOrderCode(c);
        if (typeof upsertSharedOrder === 'function') upsertSharedOrder(o);
      });
      renderTrackingResults(json.data);
    } else {
      if (resultsContainer) {
        resultsContainer.innerHTML = `
          <div style="text-align:center; padding:2rem; color:var(--color-gray-500); background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1;">
            <p>Không tìm thấy đơn hàng nào khớp với "<strong>${escapeHtml(query)}</strong>".</p>
            <p style="font-size:12px; margin-top:4px;">Vui lòng kiểm tra lại mã đơn (dạng MGT-2026-XXXXX), mã SPX hoặc số điện thoại khi đặt hàng.</p>
          </div>
        `;
      }
    }
  } catch (e) {
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div style="padding:1rem; background:#fef2f2; border:1px solid #fecaca; border-radius:var(--radius-md); font-size:12px; color:#991b1b;">
          <p><strong>Lỗi tra cứu:</strong> ${escapeHtml(e.message)}</p>
        </div>
      `;
    }
  }
}

function renderTrackingResults(orders) {
  const resultsContainer = document.getElementById('trackingResults');
  if (!resultsContainer) return;
  resultsContainer.innerHTML = orders.map(ord => buildUnifiedCustomerOrderCardHTML(ord)).join('');
}

// =====================================================================
// HỆ THỐNG ĐỒNG BỘ REAL-TIME CHO KHÁCH HÀNG KHI ADMIN DUYỆT ĐƠN / LƯU MÃ SPX
// =====================================================================
function showCustomerOrderRealtimeBanner(orderCode, status, trackingCode, cancelReason, extraInfo = {}) {
  if (!orderCode) return;

  // Chống lặp thông báo: Mỗi thay đổi trạng thái chỉ hiển thị thông báo 1 lần duy nhất
  const alertKey = `minigt_seen_alert_${orderCode}_${status}_${trackingCode || ''}_${extraInfo.isStockArrived ? 'arrived' : ''}`;
  try {
    if (sessionStorage.getItem(alertKey)) return;
    sessionStorage.setItem(alertKey, '1');
  } catch (_) {}

  const existing = document.getElementById('customerRealtimeOrderAlert');
  if (existing) existing.remove();

  const isDelivered = status === 'DELIVERED';
  const isCancelled = status === 'CANCELLED';
  const isCustomerCancel = cancelReason && (
    cancelReason.toLowerCase().includes('khách') ||
    cancelReason.toLowerCase().includes('chủ động') ||
    cancelReason.toLowerCase().includes('yêu cầu')
  );

  // Nếu là khách tự hủy đơn thì không hiện cảnh báo bị hủy bởi quản trị viên
  if (isCancelled && isCustomerCancel) return;

  // Nếu khách đang mở trực tiếp cửa sổ Thanh Toán (Checkout Modal), CHỈ CẬP NHẬT khi mã đơn đúng với activeStep4OrderCode
  if (document.getElementById('checkoutModal')?.classList.contains('active')) {
    if (activeStep4OrderCode && activeStep4OrderCode === orderCode) {
      if (typeof updateLiveStep4OrderStatus === 'function') {
        updateLiveStep4OrderStatus({
          code: orderCode,
          status: status || 'CONFIRMED',
          paymentStatus: isCancelled ? 'REFUND_PENDING' : (isDelivered ? 'PAID' : 'PARTIALLY_PAID'),
          trackingCode: trackingCode || null,
          cancelReason: cancelReason || null
        });
      }
      if (isCancelled) {
        showToast(`Đơn #${orderCode} đã bị hủy bởi Admin. Lý do: ${cancelReason || 'Vui lòng liên hệ Hotline 0981 400 400'}`, 'error', 'Hủy đơn hàng');
      } else if (isDelivered) {
        if (typeof launchCollectorConfetti === 'function') launchCollectorConfetti();
        showToast(`🎉 Cảm ơn quý khách! Đơn hàng #${orderCode} đã giao thành công!`, 'success', 'Giao Hàng Thành Công');
      } else {
        showToast(trackingCode ? `Đơn #${orderCode} đã được duyệt & cấp mã SPX: ${trackingCode}` : `Admin đã duyệt đơn hàng #${orderCode}!`, 'success', 'Cập nhật đơn hàng');
      }
      return;
    }
    if (isCancelled) return;
  }

  const banner = document.createElement('div');
  banner.id = 'customerRealtimeOrderAlert';

  if (isDelivered) {
    // 1. MÀN HÌNH CẢM ƠN & GIAO HÀNG THÀNH CÔNG (NỀN TRẮNG SANG TRỌNG, HIỆU ỨNG CONFETTI)
    if (typeof launchCollectorConfetti === 'function') launchCollectorConfetti();

    banner.style.cssText = 'position:fixed; top:82px; right:20px; z-index:999999; max-width:440px; background:#ffffff; color:#0f172a; border:2px solid #10b981; border-radius:16px; padding:16px; box-shadow:0 20px 45px -8px rgba(16,185,129,0.28), 0 4px 14px rgba(15,23,42,0.06); animation:toast-spring-in 0.4s cubic-bezier(0.16, 1.25, 0.35, 1) forwards; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
    banner.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:12px; text-align:left;">
        <div style="width:44px; height:44px; border-radius:12px; background:#ecfdf5; color:#059669; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0;">
          <i class="fa-solid fa-gift"></i>
        </div>
        <div style="flex:1;">
          <div style="font-size:11px; font-weight:800; color:#059669; text-transform:uppercase; letter-spacing:0.5px;">
            🎉 CẢM ƠN QUÝ KHÁCH • MINI GT BIÊN HÒA
          </div>
          <div style="font-size:14px; font-weight:800; color:#065f46; margin-top:2px; line-height:1.35;">
            ĐƠN HÀNG #${escapeHtml(orderCode)} ĐÃ GIAO THÀNH CÔNG!
          </div>
          <div style="margin-top:6px; font-size:12px; color:#334155; line-height:1.45; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:8px 10px;">
            Đơn hàng đã được shipper SPX bàn giao nguyên seal đến bạn. Chân thành cảm ơn bạn đã tin tưởng sưu tầm mô hình tại Săn Xe Biên Hòa! Chúc bạn có những phút giây trưng bày mãn nhãn.
          </div>
          <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
            <button type="button" onclick="document.getElementById('customerRealtimeOrderAlert')?.remove(); openMyOrdersModal();" style="background:#059669; color:#ffffff; border:none; border-radius:8px; padding:7px 14px; font-size:12px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 6px rgba(5,150,105,0.3);">
              <i class="fa-solid fa-box-open"></i> Xem đơn hàng
            </button>
            <button type="button" onclick="document.getElementById('customerRealtimeOrderAlert')?.remove();" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; border-radius:8px; padding:7px 12px; font-size:12px; font-weight:600; cursor:pointer;">
              Đóng
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (isCancelled) {
    // 2. MÀN HÌNH ĐƠN BỊ HỦY (NỀN TRẮNG SẠCH SẼ, VIỀN ĐỎ RÕ RÀNG)
    banner.style.cssText = 'position:fixed; top:82px; right:20px; z-index:999999; max-width:440px; background:#ffffff; color:#0f172a; border:2px solid #ef4444; border-radius:16px; padding:16px; box-shadow:0 20px 45px -8px rgba(239,68,68,0.24), 0 4px 14px rgba(15,23,42,0.06); animation:toast-spring-in 0.4s cubic-bezier(0.16, 1.25, 0.35, 1) forwards; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
    banner.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:12px; text-align:left;">
        <div style="width:44px; height:44px; border-radius:12px; background:#fef2f2; color:#dc2626; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0;">
          <i class="fa-solid fa-circle-xmark"></i>
        </div>
        <div style="flex:1;">
          <div style="font-size:11px; font-weight:800; color:#dc2626; text-transform:uppercase; letter-spacing:0.5px;">
            ⚠️ THÔNG BÁO TỪ QUẢN TRỊ VIÊN
          </div>
          <div style="font-size:14px; font-weight:800; color:#b91c1c; margin-top:2px;">
            ĐƠN HÀNG #${escapeHtml(orderCode)} ĐÃ BỊ HỦY
          </div>
          <div style="margin-top:6px; background:#fef2f2; border:1px solid #fee2e2; border-radius:8px; padding:8px 10px; font-size:12px; color:#374151;">
            <strong>Lý do hủy đơn:</strong> <span style="color:#dc2626; font-weight:700;">${escapeHtml(cancelReason || 'Admin đã xử lý hủy đơn')}</span>
          </div>
          <div style="margin-top:8px; font-size:11.5px; color:#4b5563; line-height:1.45;">
            Quý khách vui lòng liên hệ Hotline / Zalo: <strong style="color:#dc2626;">0981 400 400</strong> để được hỗ trợ tốt nhất.
          </div>
          <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
            <a href="tel:0981400400" style="background:#dc2626; color:#ffffff; border:none; border-radius:8px; padding:7px 12px; font-size:11.5px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
              <i class="fa-solid fa-phone"></i> Gọi 0981 400 400
            </a>
            <a href="https://zalo.me/0981400400" target="_blank" style="background:#ffffff; color:#0284c7; border:1px solid #0284c7; border-radius:8px; padding:7px 12px; font-size:11.5px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
              <i class="fa-solid fa-comments"></i> Nhắn Zalo
            </a>
            <button type="button" onclick="document.getElementById('customerRealtimeOrderAlert')?.remove(); openMyOrdersModal();" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; border-radius:8px; padding:7px 10px; font-size:11.5px; font-weight:600; cursor:pointer;">
              Chi tiết
            </button>
            <button type="button" onclick="document.getElementById('customerRealtimeOrderAlert')?.remove();" style="background:#ffffff; color:#94a3b8; border:1px solid #e2e8f0; border-radius:8px; padding:7px 8px; font-size:11.5px; cursor:pointer;">
              Đóng
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    // 3. THÔNG BÁO CẬP NHẬT TRẠNG THÁI / DÁN MÃ SPX / BÁO HÀNG VỀ (NỀN TRẮNG HIỆN ĐẠI)
    const isSpx = Boolean(trackingCode);
    const isStockArrived = Boolean(extraInfo?.isStockArrived || extraInfo?.action === 'preorder-arrived');
    const borderColor = isStockArrived ? '#10b981' : (isSpx ? '#ea580c' : '#2563eb');
    const iconBg = isStockArrived ? '#ecfdf5' : (isSpx ? '#fff7ed' : '#eff6ff');
    const iconColor = isStockArrived ? '#059669' : (isSpx ? '#ea580c' : '#2563eb');
    const kickerColor = isStockArrived ? '#047857' : (isSpx ? '#c2410c' : '#1d4ed8');

    let statusText = 'Đã được duyệt bởi Admin';
    if (isStockArrived) {
      statusText = '📦 Hàng pre-order đã về kho Biên Hòa! Chuẩn bị gửi SPX Express';
    } else if (status === 'PREPARING') {
      statusText = 'Đang đóng gói 4 lớp xốp khí chống sốc';
    } else if (status === 'SHIPPING') {
      statusText = 'Đang trên đường vận chuyển SPX Express';
    } else if (status === 'CONFIRMED') {
      statusText = 'Đã được Quản trị viên duyệt xác nhận';
    }

    showToast(isStockArrived ? `Đơn #${orderCode}: Lô hàng pre-order đã về kho Biên Hòa!` : (isSpx ? `Đơn #${orderCode} đã có mã SPX: ${trackingCode}` : `Đơn #${orderCode}: ${statusText}`), 'info', 'Cập Nhật Đơn Hàng');

    banner.style.cssText = `position:fixed; top:82px; right:20px; z-index:999999; max-width:440px; background:#ffffff; color:#0f172a; border:2px solid ${borderColor}; border-radius:16px; padding:16px; box-shadow:0 20px 45px -8px rgba(15,23,42,0.18), 0 4px 14px rgba(15,23,42,0.06); animation:toast-spring-in 0.4s cubic-bezier(0.16, 1.25, 0.35, 1) forwards; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;`;
    banner.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:12px; text-align:left;">
        <div style="width:44px; height:44px; border-radius:12px; background:${iconBg}; color:${iconColor}; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">
          <i class="fa-solid ${isStockArrived ? 'fa-boxes-packing' : (isSpx ? 'fa-truck-fast' : 'fa-circle-check')}"></i>
        </div>
        <div style="flex:1;">
          <div style="font-size:11px; font-weight:800; color:${kickerColor}; text-transform:uppercase; letter-spacing:0.5px;">
            ${isStockArrived ? '📦 HÀNG ĐÃ VỀ KHO • MINI GT BIÊN HÒA' : '🔔 CẬP NHẬT ĐƠN HÀNG • MINI GT BIÊN HÒA'}
          </div>
          <div style="font-size:14px; font-weight:800; color:#0f172a; margin-top:2px;">
            ${isStockArrived ? `LÔ HÀNG PRE-ORDER #${escapeHtml(orderCode)} ĐÃ VỀ KHO!` : (isSpx ? `ĐƠN HÀNG #${escapeHtml(orderCode)} ĐÃ XUẤT MÃ SPX` : `ĐƠN HÀNG #${escapeHtml(orderCode)}: ${statusText}`)}
          </div>
          ${isSpx ? `
            <div style="margin-top:6px; background:#fff7ed; border:1px solid #fed7aa; border-radius:8px; padding:8px 10px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
              <span style="font-family:monospace; font-size:13px; font-weight:800; color:#ea580c;">${escapeHtml(trackingCode)}</span>
              <button type="button" onclick="copyToClipboard('${escapeHtml(trackingCode)}', 'Đã sao chép mã SPX: ${escapeHtml(trackingCode)}')" style="background:#ea580c; color:#fff; border:none; border-radius:6px; padding:4px 9px; font-size:11px; font-weight:700; cursor:pointer;">Sao chép</button>
            </div>
          ` : `
            <div style="margin-top:6px; font-size:12px; color:#475569; line-height:1.45;">
              Trạng thái đơn hàng của bạn đã được Admin cập nhật sang: <strong style="color:${isStockArrived ? '#059669' : '#2563eb'};">${escapeHtml(statusText)}</strong>.
            </div>
          `}
          <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
            <button type="button" onclick="document.getElementById('customerRealtimeOrderAlert')?.remove(); openMyOrdersModal();" style="background:${isStockArrived ? '#059669' : '#2563eb'}; color:#fff; border:none; border-radius:8px; padding:7px 14px; font-size:12px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:5px;">
              <i class="fa-solid fa-list-check"></i> Xem chi tiết đơn
            </button>
            <button type="button" onclick="document.getElementById('customerRealtimeOrderAlert')?.remove();" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; border-radius:8px; padding:7px 12px; font-size:12px; font-weight:600; cursor:pointer;">
              Đóng
            </button>
          </div>
        </div>
      </div>
    `;
  }

  document.body.appendChild(banner);
  setTimeout(() => {
    if (banner && banner.parentNode) banner.remove();
  }, 15000);
}

function initCustomerRealtimeOrderWatcher() {
  // 1. Lắng nghe sự kiện tức thì từ BroadcastChannel / localStorage khi Admin bấm Duyệt hoặc Lưu mã SPX
  window.addEventListener('minigt:realtime', (ev) => {
    const detail = ev.detail || {};
    if (detail.type === 'ORDER_UPDATED' || detail.type === 'ORDER_CREATED') {
      const payload = detail.payload || {};
      const orderObj = payload.order || payload;
      const code = payload.orderCode || orderObj?.OrderCode || orderObj?.orderCode || orderObj?.code;
      const newStatus = String(payload.status || orderObj?.Status || orderObj?.status || '').toUpperCase();
      const newTracking = String(payload.trackingCode || orderObj?.TrackingCode || orderObj?.trackingCode || '').trim();
      const cancelReason = payload.cancelReason || orderObj?.CancelReason || orderObj?.cancelReason || null;

      if (code) {
        const myCodes = getSavedCustomerOrderCodes();
        const isMyOrder = myCodes.includes(code) || (activeStep4OrderCode && activeStep4OrderCode === code);
        if (isMyOrder && detail.type === 'ORDER_UPDATED') {
          if (payload.cancelledByCustomer) {
            customerOrderStateSnapshot[code] = { status: newStatus, tracking: newTracking, cancelledByCustomer: true };
            return;
          }
          const prev = customerOrderStateSnapshot[code] || {};
          const isCustCancel = String(cancelReason || '').toLowerCase().includes('khách');
          const newlyDelivered = newStatus === 'DELIVERED' && prev.status !== 'DELIVERED';
          const newlyApproved = ['CONFIRMED', 'PREPARING', 'SHIPPING'].includes(newStatus) && prev.status === 'PENDING';
          const newlyTracked = Boolean(newTracking) && newTracking !== prev.tracking;
          const newlyCancelled = newStatus === 'CANCELLED' && prev.status !== 'CANCELLED' && !prev.cancelledByCustomer && !isCustCancel;
          const statusChanged = Boolean(newStatus) && newStatus !== prev.status;

          customerOrderStateSnapshot[code] = { status: newStatus || prev.status, tracking: newTracking || prev.tracking, cancelledByCustomer: prev.cancelledByCustomer || isCustCancel };

          // Cập nhật tích lũy đã giao (deliveredSpent) của khách nếu giao thành công
          if (newlyDelivered && currentUser) {
            const ordTotal = Number(orderObj?.Total || orderObj?.total || orderObj?.totalAmount || 0);
            if (ordTotal > 0) {
              currentUser.deliveredSpent = (currentUser.deliveredSpent || 0) + ordTotal;
              currentUser.totalSpent = (currentUser.totalSpent || 0) + ordTotal;
              try { localStorage.setItem('minigt_user', JSON.stringify(currentUser)); } catch (_) {}
            }
            updateUserHeaderUI();
          }

          const isPreOrderArrived = Boolean(payload.isStockArrived || payload.action === 'preorder-arrived' || orderObj?.isStockArrived);
          if (newlyDelivered || newlyApproved || newlyTracked || newlyCancelled || statusChanged || isPreOrderArrived) {
            showCustomerOrderRealtimeBanner(code, newStatus, newTracking, cancelReason, {
              isStockArrived: isPreOrderArrived,
              action: payload.action
            });
          }
        }
      }

      // Cập nhật ngay lập tức các modal đang mở
      if (document.getElementById('myOrdersModal')?.classList.contains('active')) {
        loadMyOrdersList(true);
      }
      if (document.getElementById('checkoutModal')?.classList.contains('active') && activeStep4OrderCode) {
        if (!code || activeStep4OrderCode === code) {
          safeFetch(`/api/orders/check-status/${encodeURIComponent(activeStep4OrderCode)}`).then(res => {
            if (res && res.success && res.data && typeof updateLiveStep4OrderStatus === 'function') {
              updateLiveStep4OrderStatus(res.data);
            }
          }).catch(() => {});
        }
      }
    }

    // 1.1 Đồng bộ cấu hình Store khi Admin bấm Lưu thiết lập Store
    if (detail.type === 'SETTINGS_UPDATED') {
      if (typeof loadStoreSettings === 'function') {
        loadStoreSettings();
      }
    }

    // 1.2 Đồng bộ danh mục xe khi Admin đổi trạng thái xe hoặc chuyển từ Pre-Order sang có sẵn
    if (detail.type === 'PRODUCTS_UPDATED') {
      if (typeof loadProducts === 'function') {
        loadProducts();
      }
    }

    // 1.3 Cập nhật danh sách đơn hàng khi Admin thao tác hàng loạt
    if (detail.type === 'ORDERS_UPDATED') {
      if (document.getElementById('myOrdersModal')?.classList.contains('active')) {
        loadMyOrdersList(true);
      }
    }
  });

  // 2. Polling nhẹ mỗi 6 giây tới Backend SQL để phát hiện thay đổi từ máy Admin khác
  if (customerOrderRealtimeTimer) clearInterval(customerOrderRealtimeTimer);
  customerOrderRealtimeTimer = setInterval(async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    const codes = getSavedCustomerOrderCodes();
    if (codes.length === 0 && !currentToken) return;
    try {
      const prevSnap = { ...customerOrderStateSnapshot };
      const isFirstRun = Object.keys(prevSnap).length === 0;
      const orders = await fetchCustomerOrdersUnified();
      if (!Array.isArray(orders)) return;
      myOrdersCache = orders;

      orders.forEach(o => {
        const c = o.OrderCode || o.orderCode || o.code;
        if (!c) return;
        const st = String(o.Status || o.status || 'PENDING').toUpperCase();
        const tk = String(o.TrackingCode || o.trackingCode || '').trim();
        const old = prevSnap[c];
        const isCustCancel = String(o.CancelReason || o.cancelReason || '').toLowerCase().includes('khách');
        const isNotified = Boolean(o.PreOrderNotified || o.preOrderNotified || o.isStockArrived);
        const wasPre = Boolean(o.wasPreOrder || o.hasPreOrder);
        const newlyArrived = wasPre && isNotified && !old?.isStockArrived;

        if (old && !isFirstRun) {
          const newlyDelivered = st === 'DELIVERED' && old.status !== 'DELIVERED';
          const newlyApproved = ['CONFIRMED', 'PREPARING', 'SHIPPING'].includes(st) && old.status === 'PENDING';
          const newlyTracked = Boolean(tk) && tk !== old.tracking;
          const newlyCancelled = st === 'CANCELLED' && old.status !== 'CANCELLED' && !old.cancelledByCustomer && !isCustCancel;
          const statusChanged = Boolean(st) && st !== old.status;

          if (newlyDelivered || newlyApproved || newlyTracked || newlyCancelled || statusChanged || newlyArrived) {
            showCustomerOrderRealtimeBanner(c, st, tk, o.CancelReason || o.cancelReason, { isStockArrived: isNotified });
          }
        }
        customerOrderStateSnapshot[c] = {
          status: st,
          tracking: tk,
          isStockArrived: isNotified,
          cancelledByCustomer: old?.cancelledByCustomer || isCustCancel
        };
      });

      if (document.getElementById('myOrdersModal')?.classList.contains('active')) {
        const container = document.getElementById('myOrdersModalContent');
        if (container && document.activeElement?.id !== 'myOrdersSearchInput') {
          renderMyOrdersCenterUI(container);
        }
      }
    } catch (_) {}
  }, 6000);
}


// =====================================================================
// 14. TÌM KIẾM SẢN PHẨM REAL-TIME
// =====================================================================
function setupSearch() {
  const input = document.getElementById('headerSearchInput');
  const dropdown = document.getElementById('searchResultsDropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) {
      dropdown.classList.remove('active');
      return;
    }

    const matched = allProducts.filter(p => {
      const name = String(p.Name || p.name || '').toLowerCase();
      const sku = String(p.Sku || p.sku || '').toLowerCase();
      const carNum = String(p.CarNumber || p.carNumber || '').toLowerCase();
      const brand = String(p.Brand || p.brand || '').toLowerCase();
      const catName = String(p.CategoryName || p.categoryName || (p.category && p.category.name) || '').toLowerCase();
      const edition = String(p.EditionNote || p.editionNote || '').toLowerCase();
      return name.includes(q) || sku.includes(q) || carNum.includes(q) || brand.includes(q) || catName.includes(q) || edition.includes(q);
    }).slice(0, 8);

    if (matched.length === 0) {
      dropdown.innerHTML = '<div style="padding:12px; font-size:12px; color:var(--color-gray-500); text-align:center;">Không tìm thấy mô hình nào</div>';
    } else {
      dropdown.innerHTML = matched.map(p => `
        <div class="search-result-item" onclick="openQuickView(${p.ProductId}); document.getElementById('searchResultsDropdown').classList.remove('active');">
          <img class="search-result-thumb" src="${p.ImageUrl}" alt="${p.Name}">
          <div class="search-result-info">
            <div class="search-result-title">${p.Name}</div>
            <div class="search-result-price">${formatVND(p.Price)}</div>
          </div>
        </div>
      `).join('');
    }

    dropdown.classList.add('active');
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });

  // Hiệu ứng chữ chuyển động gõ (Typewriter animation) cho ô tìm kiếm
  initSearchTypewriter(input);
}

function initSearchTypewriter(input) {
  if (!input) return;

  const phrases = [
    'Tìm theo tên xe, SKU, hãng...',
    'Tìm Porsche 911 GT3 R Rexy #80...',
    'Tìm Nissan Silvia S15 LB★WORKS...',
    'Tìm Oracle Red Bull Racing RB19...',
    'Tìm Scania Transporter Box Set...',
    'Tìm Pop Race Secret Chase 1:64...',
    'Tìm Lamborghini Huracán Sterrato...'
  ];

  let phraseIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let isPaused = false;
  let timer = null;

  input.addEventListener('focus', () => {
    isPaused = true;
    input.setAttribute('placeholder', 'Tìm theo tên xe, SKU, hãng...');
  });

  input.addEventListener('blur', () => {
    if (!input.value.trim()) {
      isPaused = false;
      charIdx = 0;
      isDeleting = false;
      clearTimeout(timer);
      timer = setTimeout(tick, 300);
    }
  });

  function tick() {
    if (isPaused || input.value.trim()) {
      timer = setTimeout(tick, 500);
      return;
    }

    const current = phrases[phraseIdx];

    if (isDeleting) {
      charIdx--;
      input.setAttribute('placeholder', current.substring(0, charIdx) || ' ');
      if (charIdx <= 0) {
        isDeleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        timer = setTimeout(tick, 450);
        return;
      }
      timer = setTimeout(tick, 35);
    } else {
      charIdx++;
      input.setAttribute('placeholder', current.substring(0, charIdx));
      if (charIdx >= current.length) {
        isDeleting = true;
        timer = setTimeout(tick, 2000);
        return;
      }
      timer = setTimeout(tick, 65);
    }
  }

  timer = setTimeout(tick, 600);
}

// =====================================================================
// 15. ĐĂNG KÝ BẢN TIN (NEWSLETTER)
// =====================================================================
async function handleNewsletterSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('newsletterEmail');
  if (!input) return;
  const email = input.value.trim();

  if (!email || !email.includes('@')) {
    showToast('Vui lòng nhập địa chỉ email hợp lệ!', 'error');
    return;
  }

  try {
    const json = await safeFetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    showToast(json.message || 'Đăng ký thành công!', 'success');
    input.value = '';
  } catch (e) {
    showToast('Đăng ký nhận tin đợt mở cọc thành công!', 'success');
    input.value = '';
  }
}

// =====================================================================
// 16. MODAL & NAVIGATION UTILITIES (MOBILE DRAWER, FILTER & SCROLL)
// =====================================================================
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
  if (modalId === 'checkoutModal') {
    document.body.classList.remove('checkout-modal-open');
    if (paymentPollInterval) {
      clearInterval(paymentPollInterval);
      paymentPollInterval = null;
    }
    activeStep4OrderCode = null;
    currentCheckoutStep = 1;
    sessionStorage.removeItem('minigt_checkout_step');
    const p4 = document.getElementById('checkoutStepPane4');
    if (p4) p4.style.display = 'none';
    const p1 = document.getElementById('checkoutStepPane1');
    if (p1) p1.style.display = 'block';
    renderCartDrawer();
    updateCartBadge();
  }
}

function toggleMobileNav() {
  const drawer = document.getElementById('mobileNavDrawer');
  const overlay = document.getElementById('mobileDrawerOverlay');
  if (drawer) {
    const isOpen = drawer.classList.contains('active');
    if (isOpen) {
      closeMobileNav();
    } else {
      drawer.classList.add('active');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (typeof playHoverBeep === 'function') playHoverBeep(600, 0.05);
    }
  }
}

function closeMobileNav() {
  const drawer = document.getElementById('mobileNavDrawer');
  const overlay = document.getElementById('mobileDrawerOverlay');
  if (drawer) drawer.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

window.toggleMobileNav = toggleMobileNav;
window.closeMobileNav = closeMobileNav;

function handleMobileSearch(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById('mobileSearchInput');
  if (!input) return;
  const query = input.value.trim().toLowerCase();
  closeMobileNav();
  if (!query) return;

  const catalog = document.getElementById('catalog');
  if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });

  const container = document.getElementById('mainProductGrid');
  if (!container) return;

  const filtered = allProducts.filter(p => {
    const name = String(p.Name || p.name || '').toLowerCase();
    const sku = String(p.Sku || p.sku || '').toLowerCase();
    const carNum = String(p.CarNumber || p.carNumber || '').toLowerCase();
    const brand = String(p.Brand || p.brand || '').toLowerCase();
    const catName = String(p.CategoryName || p.categoryName || (p.category && p.category.name) || '').toLowerCase();
    const edition = String(p.EditionNote || p.editionNote || '').toLowerCase();
    return name.includes(query) || sku.includes(query) || carNum.includes(query) || brand.includes(query) || catName.includes(query) || edition.includes(query);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: #64748b; background: #f8fafc; border-radius: 14px; border: 1px dashed #cbd5e1;">
        <i class="fa-solid fa-car-side" style="font-size: 40px; margin-bottom: 14px; opacity: 0.4;"></i>
        <h4 style="margin: 0 0 8px 0; color: #0f172a; font-weight: 700;">Không tìm thấy mô hình xe phù hợp</h4>
        <p style="margin: 0 0 16px 0;">Từ khóa tra cứu: "<strong>${escapeHtml(query)}</strong>"</p>
        <button class="btn btn-secondary" onclick="filterAndScroll(event, 'all')">Xem tất cả xe</button>
      </div>
    `;
  } else {
    container.innerHTML = filtered.map((p, idx) => createProductCardHTML(p, idx)).join('');
    refreshScrollReveal();
  }
}

function scrollToSection(eventOrId, possibleId) {
  let id = possibleId;
  if (typeof eventOrId === 'string') {
    id = eventOrId;
  } else if (eventOrId && eventOrId.preventDefault) {
    eventOrId.preventDefault();
  }
  if (!id && typeof eventOrId === 'string') id = eventOrId;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

function filterAndScroll(event, filterKey) {
  if (event && event.preventDefault) event.preventDefault();
  currentFilter = filterKey;
  startSiteProgressBar();

  // Active filter pills
  document.querySelectorAll('.filter-pill').forEach(btn => {
    if (btn.getAttribute('data-filter') === filterKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderProductsGrid();

  const catalog = document.getElementById('catalog');
  if (catalog) {
    catalog.scrollIntoView({ behavior: 'smooth' });
  }
  if (typeof playHoverBeep === 'function') playHoverBeep(520, 0.04);
  setTimeout(() => finishSiteProgressBar(), 180);
}

function filterGt3Cards(type, btn) {
  document.querySelectorAll('.gt3-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const cards = document.querySelectorAll('.gt3-dino-card');
  cards.forEach(card => {
    if (type === 'all' || card.classList.contains(`${type}-theme`)) {
      card.style.display = 'flex';
      card.style.opacity = '1';
    } else {
      card.style.display = 'none';
    }
  });
  if (typeof playHoverBeep === 'function') playHoverBeep(640, 0.04);
}

function scrollToAoCard(cardId) {
  const el = document.getElementById(cardId);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.remove('card-highlight-pulse');
  void el.offsetWidth; // Force reflow to re-trigger animation
  el.classList.add('card-highlight-pulse');
  if (typeof playHoverBeep === 'function') playHoverBeep(580, 0.05);
}

// =====================================================================
// 17. HIỆU ỨNG GIAO DIỆN CAO CẤP: MAGNETIC GLIDER, 3D TILT, SOUND FX, COUNTERS
// =====================================================================

// 17.1 Web Audio API Synthesizer (Micro-interactions)
let audioCtx = null;
let soundFxEnabled = false;

function initAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function toggleAudioFx() {
  initAudioContext();
  soundFxEnabled = !soundFxEnabled;
  const btn = document.getElementById('soundToggleBtn');
  if (btn) {
    if (soundFxEnabled) {
      btn.classList.add('active');
      btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      btn.setAttribute('title', 'Âm thanh tương tác: Bật (Nhấn để tắt)');
      playHoverBeep(660, 0.1);
      showToast('Đã bật âm thanh tương tác Mini GT!', 'info');
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
      btn.setAttribute('title', 'Âm thanh tương tác: Tắt (Nhấn để bật)');
      showToast('Đã tắt âm thanh giao diện!', 'info');
    }
  }
}

function playHoverBeep() {
  // Audio effects disabled per user request
}

// 17.2 Magnetic Menu Glider
function initMagneticNavGlider() {
  const navList = document.getElementById('mainNavList');
  const glider = document.getElementById('navGlider');
  if (!navList || !glider) return;

  const navLinks = navList.querySelectorAll('.nav-item > .nav-link');

  function updateGliderTo(link) {
    if (!link) {
      glider.style.opacity = '0';
      return;
    }
    const item = link.closest('.nav-item');
    if (!item) return;

    const itemRect = item.getBoundingClientRect();
    const listRect = navList.getBoundingClientRect();
    const left = itemRect.left - listRect.left + navList.scrollLeft;
    const width = itemRect.width;

    glider.style.opacity = '1';
    glider.style.transform = `translateX(${left}px)`;
    glider.style.width = `${width}px`;
  }

  // Khởi tạo vị trí ban đầu theo link active
  const activeLink = navList.querySelector('.nav-link.active') || navLinks[0];
  if (activeLink) {
    setTimeout(() => updateGliderTo(activeLink), 150);
  }

  navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      updateGliderTo(link);
      playHoverBeep(520, 0.03);
    });

    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      updateGliderTo(link);
      playHoverBeep(620, 0.05);
    });
  });

  navList.addEventListener('mouseleave', () => {
    const currentActive = navList.querySelector('.nav-link.active');
    if (currentActive) {
      updateGliderTo(currentActive);
    } else {
      glider.style.opacity = '0';
    }
  });

  window.addEventListener('resize', () => {
    const currentActive = navList.querySelector('.nav-link.active');
    if (currentActive) updateGliderTo(currentActive);
  });
}

// 17.3 Scroll Progress Bar (Throttled with requestAnimationFrame for 60fps Mobile Performance)
function initScrollProgressBar() {
  const progressBar = document.getElementById('navScrollProgress');
  if (!progressBar) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// 17.4 Animated Live Storefront Counters
function initInteractiveCounters() {
  const counters = document.querySelectorAll('.metric-counter');
  if (!counters.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counters.forEach(el => {
      const target = parseFloat(el.getAttribute('data-target')) || 0;
      const isDecimal = String(el.getAttribute('data-target')).includes('.');
      el.textContent = isDecimal ? target.toFixed(1) : target.toLocaleString('vi-VN');
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        observer.unobserve(el);

        const target = parseFloat(el.getAttribute('data-target')) || 0;
        const isDecimal = String(el.getAttribute('data-target')).includes('.');
        const duration = 1600;
        const startTime = performance.now();

        function updateCount(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const ease = 1 - Math.pow(1 - progress, 3);
          const currentVal = target * ease;

          if (isDecimal) {
            el.textContent = currentVal.toFixed(1);
          } else {
            el.textContent = Math.round(currentVal).toLocaleString('vi-VN');
          }

          if (progress < 1) {
            requestAnimationFrame(updateCount);
          } else {
            if (isDecimal) el.textContent = target.toFixed(1);
            else el.textContent = target.toLocaleString('vi-VN');
          }
        }

        requestAnimationFrame(updateCount);
      }
    });
  }, { threshold: 0.2 });

  counters.forEach(c => observer.observe(c));
}

// 17.5 3D Parallax Tilt Effects on Cards & Hero Banner
function init3DParallaxTilt() {
  // Disabled as per user request to prevent 3D tilting on mouse movement/click
}

// 17.6 Hiệu ứng bắn pháo giấy chúc mừng khi đặt đơn hoặc xác nhận nhận hàng
function launchCollectorConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#fb923c'];
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed; inset:0; pointer-events:none; z-index:99998; overflow:hidden;';
  document.body.appendChild(container);

  for (let i = 0; i < 42; i++) {
    const piece = document.createElement('div');
    const size = 6 + Math.random() * 7;
    const left = 15 + Math.random() * 70;
    const color = colors[i % colors.length];
    const duration = 1200 + Math.random() * 1100;
    const delay = Math.random() * 220;

    piece.style.cssText = `
      position:absolute;
      top:-20px;
      left:${left}%;
      width:${size}px;
      height:${size * 1.4}px;
      background:${color};
      border-radius:2px;
      opacity:0.95;
      transform:rotate(${Math.random() * 360}deg);
      transition:transform ${duration}ms cubic-bezier(0.2, 0.8, 0.3, 1), top ${duration}ms cubic-bezier(0.2, 0.8, 0.3, 1), opacity ${duration}ms ease;
    `;
    container.appendChild(piece);

    setTimeout(() => {
      piece.style.top = `${70 + Math.random() * 30}%`;
      piece.style.transform = `translateX(${(Math.random() - 0.5) * 240}px) rotate(${360 + Math.random() * 720}deg)`;
      piece.style.opacity = '0';
    }, 20 + delay);
  }

  setTimeout(() => {
    if (container.parentNode) container.remove();
  }, 2600);
}

// 17.7 Bộ đếm số liệu Showroom (Showroom Stats Strip)
function initShowroomCounters() {
  const counters = document.querySelectorAll('#showroomStatsGrid .counter-value');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el);

      const target = parseFloat(el.getAttribute('data-count')) || 0;
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 1500;
      const start = performance.now();

      function step(now) {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const val = Math.round(target * ease);
        el.textContent = val.toLocaleString('vi-VN') + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.25 });

  counters.forEach(c => observer.observe(c));
}

// 17.8 So sánh thông số mô hình 1:64 (Tối đa 3 xe)
function toggleCompareModel(productId, event) {
  if (event && event.stopPropagation) event.stopPropagation();
  const id = Number(productId);
  const idx = compareList.indexOf(id);

  if (idx >= 0) {
    compareList.splice(idx, 1);
    showToast('Đã bỏ mẫu xe khỏi danh sách so sánh.', 'info');
  } else {
    if (compareList.length >= 3) {
      showToast('Chỉ có thể so sánh tối đa 3 mẫu mô hình cùng lúc!', 'error');
      return;
    }
    compareList.push(id);
    showToast(`Đã thêm vào khay so sánh (${compareList.length}/3 mẫu xe)!`, 'success');
  }

  localStorage.setItem('minigt_compare_ids', JSON.stringify(compareList));
  renderProductsGrid();
  renderPreOrderQuickRow();
  renderCompareFloatingBar();
}

function renderCompareFloatingBar() {
  const bar = document.getElementById('compareFloatingBar');
  const slotsEl = document.getElementById('compareBarSlots');
  const countEl = document.getElementById('compareCountBadge');
  if (!bar || !slotsEl) return;

  const validProducts = compareList
    .map(id => allProducts.find(p => Number(p.Id || p.ProductId) === Number(id)))
    .filter(Boolean);

  if (countEl) countEl.textContent = `${validProducts.length}/3`;

  if (validProducts.length === 0) {
    bar.classList.remove('active');
    return;
  }

  bar.classList.add('active');
  slotsEl.innerHTML = validProducts.map(p => {
    const pid = p.Id || p.ProductId;
    return `
      <div class="compare-slot-chip">
        <img src="${p.ImageUrl || 'image/hero-banner.jpg'}" onerror="this.src='image/hero-banner.jpg'" alt="${escapeHtml(p.Name)}">
        <span>${escapeHtml(p.Name)}</span>
        <button type="button" onclick="toggleCompareModel(${pid}, event)" title="Xóa khỏi so sánh">&times;</button>
      </div>
    `;
  }).join('');
}

function clearCompareList() {
  compareList = [];
  localStorage.removeItem('minigt_compare_ids');
  renderCompareFloatingBar();
  renderProductsGrid();
  renderPreOrderQuickRow();
}

function openCompareModal() {
  const modal = document.getElementById('compareModal');
  const body = document.getElementById('compareModalContent') || document.getElementById('compareModalBody');
  if (!modal || !body) return;

  const prods = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS);
  const items = compareList
    .map(id => prods.find(p => Number(p.Id || p.ProductId || p.id) === Number(id)))
    .filter(Boolean);

  if (items.length === 0) {
    showToast('Vui lòng chọn ít nhất 1 mẫu mô hình để so sánh!', 'error');
    return;
  }

  body.innerHTML = `
    <div style="overflow-x:auto;">
      <table style="width:100%; border-collapse:collapse; font-size:13px;">
        <thead>
          <tr>
            <th style="padding:12px; border:1px solid #e2e8f0; background:#f8fafc; text-align:left; width:170px;">Tiêu chí so sánh</th>
            ${items.map(p => {
              const pImg = p.ImageUrl || p.imageUrl || p.image || 'image/hero-banner.jpg';
              const pName = p.Name || p.name;
              const pSku = p.Sku || p.sku;
              return `
              <th style="padding:12px; border:1px solid #e2e8f0; text-align:center; min-width:210px;">
                <img src="${escapeHtml(pImg)}" onerror="this.src='image/hero-banner.jpg'" style="width:110px; height:80px; object-fit:contain; margin:0 auto 8px;">
                <div style="font-size:13.5px; color:var(--color-navy); font-weight:800;">${escapeHtml(pName)}</div>
                <div style="font-size:11px; color:#64748b; font-family:monospace; margin-top:2px;">SKU: #${escapeHtml(pSku)}</div>
              </th>
            `;}).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:10px 12px; border:1px solid #e2e8f0; font-weight:700; background:#f8fafc;">Giá Box / Card</td>
            ${items.map(p => {
              const pricing = getProductBoxCardPricing(p);
              return `
              <td style="padding:10px 12px; border:1px solid #e2e8f0; text-align:center;">
                <div style="font-weight:800; color:var(--color-primary); font-size:15px;">Box: ${formatVND(pricing.finalPriceBox)}</div>
                <div style="font-size:12px; color:#64748b;">Card: ${formatVND(pricing.finalPriceCard)}</div>
                ${pricing.hasDiscount ? `<span style="font-size:10.5px; color:#dc2626; font-weight:700;">(-${pricing.discountPercent}%)</span>` : ''}
              </td>`;
            }).join('')}
          </tr>
          <tr>
            <td style="padding:10px 12px; border:1px solid #e2e8f0; font-weight:700; background:#f8fafc;">Mức cọc giữ xe (30%)</td>
            ${items.map(p => {
              const pricing = getProductBoxCardPricing(p);
              const isPreOrder = String(p.Status || p.status || '').toLowerCase() === 'pre_order';
              const dep = p.DepositAmount || Math.round(pricing.finalPriceBox * 0.3);
              return `<td style="padding:10px 12px; border:1px solid #e2e8f0; text-align:center; font-weight:700; color:#2563eb;">${isPreOrder ? formatVND(dep) : 'Sẵn hàng (Không cần cọc)'}</td>`;
            }).join('')}
          </tr>
          <tr>
            <td style="padding:10px 12px; border:1px solid #e2e8f0; font-weight:700; background:#f8fafc;">Trạng thái kho</td>
            ${items.map(p => {
              const st = String(p.Status || p.status || '').toLowerCase();
              return `<td style="padding:10px 12px; border:1px solid #e2e8f0; text-align:center;">${st === 'in_stock' ? '<span style="color:#16a34a; font-weight:800;">✅ Sẵn hàng giao ngay</span>' : (st === 'pre_order' ? '<span style="color:#d97706; font-weight:800;">⏳ Nhận cọc Pre-Order</span>' : '<span style="color:#dc2626; font-weight:800;">Hết hàng</span>')}</td>`;
            }).join('')}
          </tr>
          <tr>
            <td style="padding:10px 12px; border:1px solid #e2e8f0; font-weight:700; background:#f8fafc;">Phiên bản / Ghi chú</td>
            ${items.map(p => `<td style="padding:10px 12px; border:1px solid #e2e8f0; text-align:center;">${escapeHtml(p.EditionNote || p.editionNote || p.CategoryName || 'Standard Blister / Box 1:64')}</td>`).join('')}
          </tr>
          <tr>
            <td style="padding:10px 12px; border:1px solid #e2e8f0; font-weight:700; background:#f8fafc;">Chất liệu & Tỷ lệ</td>
            ${items.map(() => `<td style="padding:10px 12px; border:1px solid #e2e8f0; text-align:center;">Diecast Kim Loại • Lốp Cao Su • Tỷ lệ 1:64</td>`).join('')}
          </tr>
          <tr>
            <td style="padding:10px 12px; border:1px solid #e2e8f0; font-weight:700; background:#f8fafc;">Thao tác nhanh</td>
            ${items.map(p => {
              const pid = p.Id || p.ProductId || p.id;
              const isPreOrder = String(p.Status || p.status || '').toLowerCase() === 'pre_order';
              return `
                <td style="padding:10px 12px; border:1px solid #e2e8f0; text-align:center;">
                  <button type="button" class="btn btn-primary btn-sm" onclick="closeModal('compareModal'); addToCart(${pid});">
                    <i class="fa-solid fa-cart-plus"></i> ${isPreOrder ? 'Đặt cọc mẫu này' : 'Mua mẫu này'}
                  </button>
                </td>
              `;
            }).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;
  modal.classList.add('active');
}

// 17.9 Hiệu ứng thông báo hoạt động sưu tầm trực tiếp (Live Collector Activity)
function initLiveCollectorActivityPopup() {
  const popup = document.getElementById('liveCollectorPopup');
  if (!popup) return;

  const collectors = [
    { name: 'Anh Minh Quân (Biên Hòa)', action: 'vừa đặt cọc giữ mẫu', model: 'Nissan LB-Super Silhouette S15 #490', time: 'Vừa xong' },
    { name: 'Bạn Hoàng Long (TP.HCM)', action: 'vừa nhận mã vận đơn SPX', model: 'Porsche 911 (992) GT3 RS Weissach', time: '1 phút trước' },
    { name: 'Anh Quốc Bảo (Bình Dương)', action: 'vừa thanh toán 100%', model: 'Bugatti Chiron Super Sport 300+', time: '2 phút trước' },
    { name: 'Bạn Tuấn Kiệt (Đồng Nai)', action: 'vừa đặt mua tại Showroom', model: 'Lamborghini Huracán GT3 EVO2 #63', time: '3 phút trước' }
  ];

  let idx = 0;
  function showSampleCollectorToast() {
    if (document.querySelector('.modal-overlay.active')) return;
    const item = collectors[idx % collectors.length];
    idx++;
    const titleEl = document.getElementById('liveCollectorTitle');
    const descEl = document.getElementById('liveCollectorDesc');
    const timeEl = document.getElementById('liveCollectorTime');
    if (titleEl) titleEl.textContent = item.name;
    if (descEl) descEl.innerHTML = `${item.action} <strong>${escapeHtml(item.model)}</strong>`;
    if (timeEl) timeEl.textContent = item.time;

    popup.classList.add('active');
    setTimeout(() => popup.classList.remove('active'), 5500);
  }

  setTimeout(showSampleCollectorToast, 9000);
  setInterval(showSampleCollectorToast, 28000);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupScrollEffects() {
  const header = document.querySelector('.main-header');
  const bttBtn = document.getElementById('backToTopBtn');
  const progressFill = document.getElementById('scrollProgressFill');
  const circumference = 2 * Math.PI * 20;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) : 0;

        // Sticky Frosted Header
        if (header) {
          if (scrollTop > 40) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
        }

        // Back to Top Progress & Visibility
        if (bttBtn) {
          if (scrollTop > 220) {
            bttBtn.classList.add('visible');
          } else {
            bttBtn.classList.remove('visible');
          }

          if (progressFill) {
            const offset = circumference - (scrollPercent * circumference);
            progressFill.style.strokeDashoffset = Math.max(0, offset);
          }
        }

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

let scrollObserver = null;
function setupScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.08
  });

  document.querySelectorAll('.section-header, .benefit-card, .combo-card, .flow-step, .metric-card').forEach(el => {
    el.classList.add('reveal-on-scroll');
    scrollObserver.observe(el);
  });
}

function refreshScrollReveal() {
  if (!scrollObserver) return;
  const cards = document.querySelectorAll('.product-card.reveal-on-scroll:not(.revealed)');
  cards.forEach((card, idx) => {
    card.style.transitionDelay = `${(idx % 6) * 0.045}s`;
    scrollObserver.observe(card);
  });
}

function setupShortcuts() {
  const searchInput = document.getElementById('headerSearchInput');
  if (!searchInput) return;

  document.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea') return;

    if (e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
}

// =====================================================================
// 17.10 CÀI ĐẶT GIAO DIỆN SÁNG/TỐI (THEME MODE) & ĐA NGÔN NGỮ (VN / EN)
// =====================================================================
let currentThemeMode = localStorage.getItem('minigt_theme') || 'light';
let currentSiteLang = localStorage.getItem('minigt_lang') || 'vi';

function applyThemeMode(theme, showFeedback = false) {
  currentThemeMode = theme === 'dark' ? 'dark' : 'light';
  try { localStorage.setItem('minigt_theme', currentThemeMode); } catch (_) {}

  document.documentElement.setAttribute('data-theme', currentThemeMode);
  document.body.classList.toggle('dark-mode', currentThemeMode === 'dark');

  const btn = document.getElementById('themeToggleBtn');
  const label = document.getElementById('themeToggleLabel');
  const mobBtn = document.getElementById('mobThemeToggleBtn');
  const isEn = currentSiteLang === 'en';

  if (btn) {
    btn.classList.toggle('active', currentThemeMode === 'dark');
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = currentThemeMode === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
  }
  if (label) {
    label.textContent = currentThemeMode === 'dark'
      ? (isEn ? 'Light' : 'Sáng')
      : (isEn ? 'Dark' : 'Tối');
  }
  if (mobBtn) {
    mobBtn.innerHTML = currentThemeMode === 'dark'
      ? `<i class="fa-solid fa-sun"></i> ${isEn ? 'Light Mode' : 'Giao diện Sáng'}`
      : `<i class="fa-solid fa-moon"></i> ${isEn ? 'Dark Mode' : 'Giao diện Tối'}`;
  }

  if (showFeedback) {
    showToast(
      currentThemeMode === 'dark'
        ? (isEn ? 'Switched to Collector Dark Mode 🌙' : 'Đã bật Giao diện Tối (Dark Mode Collector) 🌙')
        : (isEn ? 'Switched to Showroom Light Mode ☀️' : 'Đã chuyển sang Giao diện Sáng (Showroom Light) ☀️'),
      'info'
    );
  }
}

function toggleThemeMode() {
  applyThemeMode(currentThemeMode === 'dark' ? 'light' : 'dark', true);
}

function toggleHeaderSettingsMenu(event) {
  if (event && event.stopPropagation) {
    event.stopPropagation();
  }
  const menu = document.getElementById('headerSettingsMenu');
  if (menu) menu.classList.toggle('active');
}
window.toggleHeaderSettingsMenu = toggleHeaderSettingsMenu;

document.addEventListener('click', (e) => {
  const wrap = document.getElementById('headerSettingsWrap');
  const menu = document.getElementById('headerSettingsMenu');
  if (menu && menu.classList.contains('active') && wrap && !wrap.contains(e.target)) {
    menu.classList.remove('active');
  }
});

const I18N_TRANSLATIONS = {
  en: {
    // Topbar & Navigation
    topbar_ticker: 'Global Pre-Order: <strong>Liberty Walk LBWK, GT3 IMSA, F1 Las Vegas &amp; Secret Chase</strong> | <i class="fa-regular fa-clock" style="font-size:11px; margin-left:4px;"></i> Deadline: <strong>Oct 30, 2026</strong>',
    topbarLeft: '<i class="fa-solid fa-shield-halved" style="color:#e11d48; margin-right:4px;"></i> Official <strong>TSM-Model (MINI GT) 1:64</strong> Distributor in Bien Hoa • Sealed Box &amp; Blister Card',
    topbarTrackBtn: '<i class="fa-solid fa-magnifying-glass-location"></i> Track Order',
    topbarOrdersBtn: '<i class="fa-solid fa-box-archive"></i> My Orders (SPX)',
    topbarThemeLabel: '<i class="fa-solid fa-circle-half-stroke"></i> Theme Mode',
    topbarLangLabel: '<i class="fa-solid fa-language"></i> Language (VN / EN)',
    nav_admin: 'Store Admin',
    nav_track: 'Track Order',
    nav_guide: '1:64 Handbook',
    nav_home: 'Home',
    nav_preorder: 'Pre-Order 2026',
    nav_lbwk: 'Liberty Walk LBWK',
    nav_gt3: 'IMSA GT3 &amp; F1',
    nav_chase: 'Secret Chase',
    nav_hub: '1:64 Collector Hub',
    btnSignIn: 'Sign In',
    btn_signin: 'Sign In',
    search_placeholder: 'Search SKU, model name (LBWK, GT3, F1, Rexy)...',
    searchPlaceholder: 'Search SKU, model name (LBWK, GT3, F1, Rexy)...',
    settings_title: '<i class="fa-solid fa-sliders"></i> Display Settings',
    settings_theme: 'Theme',
    settings_lang: 'Language',
    navAll: 'All Models',
    navPreOrder: 'Pre-Order 2026',
    navLbwk: 'Liberty Walk',
    navGt3: 'GT3 & F1 Paddock',
    navBoxSets: 'Box Sets',
    navGuide: '1:64 Collector Hub',
    navShowroom: 'Showroom',
    btnMyOrders: 'My Orders',
    btnCart: 'Cart',
    mob_home: 'Home',
    mob_catalog: 'Kho Xe',
    mob_orders: 'Orders',
    mob_cart: 'Cart',
    mobHome: 'Home',
    mobCatalog: '1:64 Models',
    mobLbwk: 'LBWK & GT3',
    mobOrders: 'Orders',
    mobCart: 'Cart',
    // Hero Slide 1
    s1Tag: '<span class="pulse-dot"></span> MINI GT 2026 COLLECTION • SEALED BOX & BLISTER CARD',
    s1Title: 'OFFICIAL 1:64 DIECAST<br>MINI GT BIEN HOA',
    s1Desc: 'Choose between <strong>Paper Box</strong> or <strong>Blister Card</strong> packaging, with direct percentage discounts and nationwide SPX Express delivery.',
    s1BtnBuy: 'Explore 1:64 Models &rarr;',
    s1BtnTrack: '<i class="fa-solid fa-magnifying-glass"></i> Track Pre-Order',
    s1PanelBadge: '🔥 HOT PRE-ORDER • BOX & CARD',
    s1PanelTitle: 'SECURE YOUR SLOT',
    s1CountdownLabel: '⏰ Pre-Order Batch Closes In:',
    // Hero Slide 2
    s2_badge: '🔥 OFFICIAL LIBERTY WALK NAGOYA • SEALED BOX & BLISTER CARD',
    s2_title: 'NISSAN SILVIA S15 LB-SUPER SILHOUETTE',
    s2_desc: 'Signature riveted widebody fenders, deep dish racing rims and authentic racing liveries.',
    s2_btn1: 'Explore LB★WORKS &rarr;',
    s2_btn2: 'View S15 #465 Details',
    s2Tag: '✨ WATARU KATO • NAGOYA WIDEBODY 1:64',
    s2Title: 'LIBERTY WALK<br>LB★WORKS EDITION',
    s2Desc: 'Featuring Nissan S15 Super Silhouette, GT-R R35 Type 2, Lamborghini Countach & Ferrari F40 LBWK in both Sealed Box and Blister Card.',
    s2BtnExplore: '<i class="fa-solid fa-bolt"></i> View LBWK Collection &rarr;',
    s2BtnAll: 'Filter LBWK Models',
    // Hero Slide 3
    s3_badge: '🏆 WORLD CHAMPION F1 RACING • ORACLE RED BULL',
    s3_title: 'ORACLE RED BULL RACING F1 - MAX VERSTAPPEN #1',
    s3_desc: 'Authentic 1:64 championship RB18 / RB19 diecast models with pit-crew figures and collector box sets.',
    s3_btn1: 'View Red Bull RB18 #1 &rarr;',
    s3_btn2: 'F1 Series Collection',
    s3Tag: '🏆 FORMULA 1 ORACLE RED BULL RACING 1:64',
    s3Title: 'ORACLE RED BULL<br>F1 RB18 & RB19 MAX #1',
    s3Desc: 'Authentic 1:64 F1 championship cars of Max Verstappen #1 & Sergio Perez #11 with pit-crew figures and collector box sets.',
    s3BtnF1: '<i class="fa-solid fa-flag-checkered"></i> Shop F1 Red Bull &rarr;',
    s3BtnBox: 'View Collector Box Sets',
    // Hero Slide 4
    s4_badge: '<i class="fa-solid fa-trophy"></i> IMSA WEATHERTECH GTD PRO • AO RACING',
    s4_title: 'PORSCHE 911 GT3 R: REXY • ROXY • SKELETON',
    s4_desc: 'Complete the iconic AO Racing Porsche 911 GT3 R trio: Green dinosaur <strong>Rexy #80</strong>, Pink dinosaur <strong>Roxy #77</strong> and limited edition <strong>Skeleton #77</strong> Petit Le Mans. Available in both <strong>Box</strong> and <strong>Blister Card</strong>.',
    s4_btn1: 'View AO Racing Trio &rarr;',
    s4_btn2: 'Filter AO Racing Cars',
    s4Tag: '🦖 AO RACING IMSA GTD PRO • 911 GT3 R (992)',
    s4Title: 'REXY • ROXY<br>& SKELETON TRIO',
    s4Desc: 'Complete the iconic AO Racing Porsche 911 GT3 R trio: #80 Rexy (Green), #80 Roxy (Pink) & #77 Skeleton Halloween Livery.',
    s4BtnRexy: '<i class="fa-solid fa-dragon"></i> Collect Rexy • Roxy • Skeleton &rarr;',
    s4BtnGt3: 'Explore GT3 Paddock',
    // Countdown Box
    countdown_title: 'TSM-MODEL & POP RACE GLOBAL PRE-ORDER SYSTEM',
    countdown_sub: 'Batch deadline: Estimated delivery Nov 2026',
    cd_days: 'DAYS',
    cd_hours: 'HOURS',
    cd_mins: 'MINS',
    cd_secs: 'SECS',
    countdown_btn: 'Pre-Order Slot Now',
    // Category Visual Cards
    cat1Sub: 'S15, R35, F40, Countach Widebody',
    cat2Sub: 'Rexy #80, Roxy #80 & Skeleton #77',
    cat3Sub: 'Oracle Red Bull Racing RB18 / RB19',
    cat4Sub: 'Raw Metal & Chrome Limited 1/24',
    // Catalogue & Filter Pills
    catalog_eyebrow: 'OFFICIAL 1:64 DIE-CAST CATALOGUE (BOX & BLISTER CARD)',
    catalog_title: 'OFFICIAL 2026 1:64 DIECAST COLLECTION',
    catalog_desc: 'Choose between Paper Box (save 40k-100k) or Blister Card right on each model — Direct % discount deducted automatically.',
    catalogTitle: 'OFFICIAL 1:64 DIECAST CATALOGUE',
    catalogSub: 'Select Box (Paper Box) or Card (Blister Pack) right on each model — Direct % discount deducted automatically',
    filter_all: 'All Models',
    filter_bestseller: 'Best Sellers',
    filter_instock: 'In Stock',
    filter_preorder: 'Pre-Order 2026',
    filter_lbwk: 'Liberty Walk LBWK',
    filter_chase: 'Secret Chase Car',
    filter_f1: 'Formula 1 Series',
    filter_boxsets: 'Box Sets & Combo',
    filter_aoracing: 'AO Racing GT3',
    pillAll: 'All',
    pillBestSeller: 'Best Sellers',
    pillInStock: 'In Stock',
    pillPreOrder: 'Pre-Order 2026',
    pillLbwk: 'Liberty Walk',
    pillChase: 'Secret / Chase',
    pillF1: 'F1 Red Bull',
    pillBoxSets: 'Box Sets',
    pillAoRacing: 'AO Racing',
    // Toolbar & Sort
    toolbar_filtering: 'Filter:',
    toolbar_brand: 'Brand:',
    brand_all: 'All Brands',
    toolbar_sort: 'Sort by:',
    sort_default: 'Default (Featured)',
    sort_price_asc: 'Price: Low to High ↑',
    sort_price_desc: 'Price: High to Low ↓',
    sort_name_asc: 'Name: A → Z',
    sort_name_desc: 'Name: Z → A',
    sort_newest: 'Newest 2026',
    sort_bestselling: 'Best Sellers',
    // Thematic Sections
    lbwk_title: 'LIBERTY WALK (LB★WORKS) 1:64 WIDEBODY COLLECTION',
    lbwk_desc: 'Authentic Nagoya riveted widebody culture by Wataru Kato. Choose between Paper Box and Blister Card.',
    lbwk_btn_all: 'View All LB★WORKS Models',
    lbwkBadge: '🇯🇵 WATARU KATO • NAGOYA WIDEBODY CULTURE',
    lbwkTitle: 'LIBERTY WALK LB★WORKS 1:64 SHOWCASE',
    lbwkDesc: 'Signature riveted widebody fenders, deep-dish rims, and iconic liveries — available in both Paper Box and Blister Card.',
    lbwkBtnFilter: 'Filter All LBWK Models &rarr;',
    gt3_title: 'AO RACING: REXY • ROXY • SKELETON & GT3 TRACK',
    gt3_desc: '<span class="gt3-checkered-badge"><i class="fa-solid fa-flag-checkered"></i> Black &amp; white checkered flag on the track: The finish flag (Checkered flag)</span>',
    gt3Badge: '🏁 IMSA GTD PRO & FIA WEC PADDOCK',
    gt3Title: 'AO RACING: REXY • ROXY • SKELETON & GT3',
    gt3Desc: '<span class="gt3-checkered-badge"><i class="fa-solid fa-flag-checkered"></i> Black &amp; white checkered flag on the track: The finish flag (Checkered flag)</span>',
    gt3BtnFilter: 'View All GT3 & Motorsport &rarr;',
    aoHeadline: 'TRIO REXY #80 • ROXY #80 • SKELETON #77',
    aoSubDesc: 'Authentic AO Racing Porsche 911 GT3 R (992) models in both Box & Blister Card.',
    aoBtnFilter: 'Filter AO Racing Trio',
    boxBadge: '🎁 LIMITED COLLECTOR SETS',
    boxTitle: 'MINI GT COLLECTOR BOX SETS & PADDOCK PACKS',
    boxDesc: 'Multi-car gift sets with pit crew figures and numbered collector packaging.',
    chase_badge: '<i class="fa-solid fa-gem"></i> SECRET CHASE 1/24 • POP RACE & MINI GT',
    chase_title: 'WHAT IS A "SECRET CHASE" 1/24 DIECAST?',
    chase_desc: 'Secret Chase is a rare collector variant randomly inserted into factory sealed master cartons with a 1/24 chance.',
    chase_b1_title: '2x to 5x Collector Market Value',
    chase_b1_desc: 'Highly sought after by worldwide collectors thanks to limited release ratios.',
    chase_b2_title: '100% Factory Sealed Box & Card',
    chase_b2_desc: 'Official TSM-Model & Pop Race anti-counterfeit labels with collector box protectors.',
    chase_btn: 'View Chase Eligible Models in this Batch',
    chaseBadge: '💎 COLLECTOR GUIDE & SECRET CHASE 1/24',
    chaseTitle: 'BOX VS BLISTER CARD & CHASE EDITION GUIDE',
    chaseDesc: 'Understand the difference between Paper Box and Blister Card packaging (Box is 40k–100k cheaper than Card) and how to spot 1/24 Chase models.',
    chaseBtnFilter: 'View Chase Eligible Models &rarr;',
    hub_title: 'EXCLUSIVE 1:64 COLLECTOR TOOLS & GUIDES',
    hub_desc: 'Tools to compare models, estimate pre-order quotas, choose packaging, and learn scale details.'
  },
  vi: {
    // Topbar & Navigation
    topbar_ticker: 'Đợt mở đặt trước toàn cầu: <strong>Liberty Walk LBWK, GT3 IMSA, F1 Las Vegas &amp; Secret Chase</strong> | <i class="fa-regular fa-clock" style="font-size:11px; margin-left:4px;"></i> Hạn chốt đợt cọc: <strong>30/10/2026</strong>',
    topbarLeft: '<i class="fa-solid fa-shield-halved" style="color:#e11d48; margin-right:4px;"></i> Đại lý phân phối <strong>TSM-Model (MINI GT) 1:64</strong> Chính Hãng tại Biên Hòa • Đầy đủ bản Box &amp; Vỉ Card Blister',
    topbarTrackBtn: '<i class="fa-solid fa-magnifying-glass-location"></i> Tra cứu đơn cọc',
    topbarOrdersBtn: '<i class="fa-solid fa-box-archive"></i> Đơn hàng của tôi (SPX)',
    topbarThemeLabel: '<i class="fa-solid fa-circle-half-stroke"></i> Chế độ giao diện',
    topbarLangLabel: '<i class="fa-solid fa-language"></i> Ngôn ngữ (VN / EN)',
    nav_admin: 'Quản trị Store',
    nav_track: 'Tra cứu đơn hàng',
    nav_guide: 'Cẩm nang 1:64',
    nav_home: 'Trang chủ',
    nav_preorder: 'Pre-Order 2026',
    nav_lbwk: 'Liberty Walk LBWK',
    nav_gt3: 'IMSA GT3 &amp; F1',
    nav_chase: 'Secret Chase',
    nav_hub: 'Tiện ích 1:64',
    btnSignIn: 'Đăng nhập',
    btn_signin: 'Đăng nhập',
    search_placeholder: 'Tìm theo tên xe, hãng...',
    searchPlaceholder: 'Tìm mã MGT, tên xe (LBWK, F1, Porsche, Rexy)... ',
    settings_title: '<i class="fa-solid fa-sliders"></i> Cài Đặt Hiển Thị',
    settings_theme: 'Giao diện',
    settings_lang: 'Ngôn ngữ',
    navAll: 'Tất Cả Xe',
    navPreOrder: 'Pre-Order 2026',
    navLbwk: 'Liberty Walk',
    navGt3: 'GT3 & F1 Paddock',
    navBoxSets: 'Box Sets',
    navGuide: 'Cẩm Nang 1:64',
    navShowroom: 'Showroom',
    btnMyOrders: 'Đơn của tôi',
    btnCart: 'Giỏ cọc',
    mob_home: 'Trang chủ',
    mob_catalog: 'Kho Xe',
    mob_orders: 'Đơn SPX',
    mob_cart: 'Giỏ cọc',
    mobHome: 'Trang chủ',
    mobCatalog: 'Kho xe 1:64',
    mobLbwk: 'LBWK & GT3',
    mobOrders: 'Đơn hàng',
    mobCart: 'Giỏ cọc',
    // Hero Slide 1
    s1Tag: '<span class="pulse-dot"></span> BỘ SƯU TẬP MINI GT 2026 • ĐẦY ĐỦ BẢN BOX & CARD BLISTER',
    s1Title: 'THẾ GIỚI MÔ HÌNH<br>MINI GT 1:64 BIÊN HÒA',
    s1Desc: 'Tùy chọn <strong>Hộp Giấy (Box)</strong> tiết kiệm hoặc <strong>Vỉ Nhựa (Card Blister)</strong> trưng bày cao cấp — Giảm giá trừ trực tiếp % trên từng mẫu xe.',
    s1BtnBuy: 'Khám phá kho xe 1:64 &rarr;',
    s1BtnTrack: '<i class="fa-solid fa-magnifying-glass"></i> Tra cứu đơn cọc',
    s1PanelBadge: '🔥 MẪU HOT NHẬN CỌC • CHỌN BOX / CARD',
    s1PanelTitle: 'ĐẶT CỌC GIỮ SLOT SỚM',
    s1CountdownLabel: '⏰ Thời gian chốt sổ đợt cọc hiện tại:',
    // Hero Slide 2
    s2_badge: '🔥 CHÍNH HÃNG LIBERTY WALK NAGOYA • BẢN BOX & CARD NGUYÊN SEAL',
    s2_title: 'NISSAN SILVIA S15 LB-SUPER SILHOUETTE',
    s2_desc: 'Huyền thoại độ thân rộng Widebody đinh tán trứ danh của Wataru Kato với cánh gió Super Silhouette hầm hố.',
    s2_btn1: 'Khám phá LB★WORKS &rarr;',
    s2_btn2: 'Xem chi tiết S15 #465',
    s2Tag: '✨ WATARU KATO • NAGOYA WIDEBODY 1:64',
    s2Title: 'CHUYÊN TRANG<br>LIBERTY WALK LB★WORKS',
    s2Desc: 'Quy tụ Nissan S15 Super Silhouette, GT-R R35 Type 2, Lamborghini Countach & Ferrari F40 LBWK chuẩn tỉ lệ 1:64 nguyên seal Box & Card.',
    s2BtnExplore: '<i class="fa-solid fa-bolt"></i> Xem bộ sưu tập LBWK &rarr;',
    s2BtnAll: 'Lọc toàn bộ xe LBWK',
    // Hero Slide 3
    s3_badge: '🏆 ĐỘI ĐUA VÔ ĐỊCH THẾ GIỚI F1 • ORACLE RED BULL',
    s3_title: 'ORACLE RED BULL RACING F1 - MAX VERSTAPPEN #1',
    s3_desc: 'Cỗ máy vô địch F1 RB18 / RB19 tái hiện tỉ mỉ từng chi tiết khí động học kèm đội ngũ Pit-Crew thay lốp 1:64.',
    s3_btn1: 'Xem Red Bull RB18 #1 &rarr;',
    s3_btn2: 'Bộ sưu tập F1 Series',
    s3Tag: '🏆 ĐỘI ĐUA VÔ ĐỊCH FORMULA 1 ORACLE RED BULL RACING',
    s3Title: 'ORACLE RED BULL<br>F1 RB18 & RB19 MAX #1',
    s3Desc: 'Tái hiện cỗ máy vô địch F1 Oracle Red Bull Racing RB18 / RB19 của Max Verstappen #1 & Sergio Perez #11 kèm đội ngũ Pit Crew 1:64.',
    s3BtnF1: '<i class="fa-solid fa-flag-checkered"></i> Săn ngay F1 Red Bull &rarr;',
    s3BtnBox: 'Xem Collector Box Sets',
    // Hero Slide 4
    s4_badge: '<i class="fa-solid fa-trophy"></i> IMSA WEATHERTECH GTD PRO • AO RACING',
    s4_title: 'PORSCHE 911 GT3 R: REXY • ROXY • SKELETON',
    s4_desc: 'Trọn bộ 3 mẫu Porsche 911 GT3 R được săn đón nhất của đội đua AO Racing: Khủng long xanh <strong>Rexy #80</strong>, Khủng long hồng <strong>Roxy #77</strong> và bản giới hạn <strong>Skeleton #77</strong> Petit Le Mans. Có đầy đủ tùy chọn <strong>Box</strong> và <strong>Blister Card</strong>.',
    s4_btn1: 'Xem Bộ 3 AO Racing &rarr;',
    s4_btn2: 'Lọc xe AO Racing',
    s4Tag: '🦖 AO RACING IMSA GTD PRO • PORSCHE 911 GT3 R (992)',
    s4Title: 'BỘ BA REXY • ROXY<br>& SKELETON TRỨ DANH',
    s4Desc: 'Sưu tầm trọn bộ 3 siêu phẩm Porsche 911 GT3 R đội đua AO Racing: Khủng long xanh #80 Rexy, Khủng long hồng #80 Roxy và #77 Skeleton.',
    s4BtnRexy: '<i class="fa-solid fa-dragon"></i> Săn trọn bộ Rexy • Roxy • Skeleton &rarr;',
    s4BtnGt3: 'Khám phá GT3 Paddock',
    // Countdown Box
    countdown_title: 'HỆ THỐNG ĐẶT TRƯỚC TOÀN CẦU TSM-MODEL & POP RACE',
    countdown_sub: 'Đợt mở đặt trước xe mô hình giới hạn: Dự kiến giao Tháng 11/2026',
    cd_days: 'NGÀY',
    cd_hours: 'GIỜ',
    cd_mins: 'PHÚT',
    cd_secs: 'GIÂY',
    countdown_btn: 'Đặt cọc giữ mẫu ngay',
    // Category Visual Cards
    cat1Sub: 'S15, R35, F40, Countach Widebody',
    cat2Sub: 'Rexy #80, Roxy #80 & Skeleton #77',
    cat3Sub: 'Oracle Red Bull Racing RB18 / RB19',
    cat4Sub: 'Bản giới hạn Raw Metal & Chrome 1/24',
    // Catalogue & Filter Pills
    catalog_eyebrow: 'CATALOGUE CHÍNH HÃNG 1:64 DIE-CAST (BOX & BLISTER CARD)',
    catalog_title: 'BỘ SƯU TẬP XE MÔ HÌNH CHÍNH HÃNG 2026',
    catalog_desc: 'Chọn nhanh quy cách Hộp Giấy (Box) tiết kiệm hoặc Vỉ Nhựa (Card) cao cấp ngay trên từng mẫu xe — Trừ trực tiếp % chiết khấu.',
    catalogTitle: 'KHO XE MÔ HÌNH TỈ LỆ 1:64 CHÍNH HÃNG',
    catalogSub: 'Chọn nhanh phiên bản Hộp giấy (Box) hoặc Vỉ nhựa (Card) ngay trên từng mẫu xe — Giá ưu đãi đã trừ trực tiếp % giảm giá',
    filter_all: 'Tất cả mô hình',
    filter_bestseller: 'Bán chạy nhất',
    filter_instock: 'Còn hàng',
    filter_preorder: 'Pre-Order Đặt Mới',
    filter_lbwk: 'Liberty Walk LBWK',
    filter_chase: 'Secret Chase Car',
    filter_f1: 'Formula 1 Series',
    filter_boxsets: 'Box Sets & Combo',
    filter_aoracing: 'AO Racing GT3',
    pillAll: 'Tất cả',
    pillBestSeller: 'Bán chạy',
    pillInStock: 'Còn hàng',
    pillPreOrder: 'Pre-Order 2026',
    pillLbwk: 'Liberty Walk',
    pillChase: 'Secret / Chase',
    pillF1: 'F1 Red Bull',
    pillBoxSets: 'Box Sets',
    pillAoRacing: 'AO Racing',
    // Toolbar & Sort
    toolbar_filtering: 'Đang lọc:',
    toolbar_brand: 'Hãng:',
    brand_all: 'Tất cả hãng xe',
    toolbar_sort: 'Sắp xếp:',
    sort_default: 'Mặc định (Nổi bật nhất)',
    sort_price_asc: 'Giá: Thấp đến Cao ↑',
    sort_price_desc: 'Giá: Cao đến Thấp ↓',
    sort_name_asc: 'Tên: A → Z',
    sort_name_desc: 'Tên: Z → A',
    sort_newest: 'Mới nhất 2026',
    sort_bestselling: 'Bán chạy nhất',
    // Thematic Sections
    lbwk_title: 'BỘ SƯU TẬP BẢN ĐỘ LIBERTY WALK (LB★WORKS) 1:64',
    lbwk_desc: 'Văn hóa widebody đinh tán trứ danh Nagoya Nhật Bản từ Wataru Kato. Có sẵn cả bản Hộp Giấy và Vỉ Blister.',
    lbwk_btn_all: 'Xem tất cả xe LB★WORKS',
    lbwkBadge: '🇯🇵 WATARU KATO • NAGOYA WIDEBODY CULTURE',
    lbwkTitle: 'CHUYÊN TRANG LIBERTY WALK LB★WORKS 1:64',
    lbwkDesc: 'Thiết kế vè tán đinh tán Widebody đặc trưng từ Nagoya Nhật Bản — Có sẵn tùy chọn Hộp Giấy (Box) và Vỉ Nhựa (Card Blister).',
    lbwkBtnFilter: 'Lọc toàn bộ xe Liberty Walk &rarr;',
    gt3_title: 'BỘ BA REXY • ROXY • SKELETON & ĐƯỜNG ĐUA GT3',
    gt3_desc: '<span class="gt3-checkered-badge"><i class="fa-solid fa-flag-checkered"></i> Cờ caro đen trắng trên đường đua: Là cờ đích (Checkered flag)</span>',
    gt3Badge: '🏁 ĐƯỜNG ĐUA IMSA GTD PRO & FIA WEC',
    gt3Title: 'BỘ BA REXY • ROXY • SKELETON & ĐƯỜNG ĐUA GT3',
    gt3Desc: '<span class="gt3-checkered-badge"><i class="fa-solid fa-flag-checkered"></i> Cờ caro đen trắng trên đường đua: Là cờ đích (Checkered flag)</span>',
    gt3BtnFilter: 'Xem toàn bộ xe GT3 & Đua &rarr;',
    aoHeadline: 'BỘ 3 REXY #80 • ROXY #80 • SKELETON #77',
    aoSubDesc: 'Đầy đủ cả phiên bản Box (Hộp giấy) và Card (Vỉ Blister có hình minh họa khủng long).',
    aoBtnFilter: 'Lọc ngay bộ 3 AO Racing',
    boxBadge: '🎁 BỘ SƯU TẬP HỘP QUÀ GIỚI HẠN',
    boxTitle: 'MINI GT COLLECTOR BOX SETS & PADDOCK PACKS',
    boxDesc: 'Hộp quà nhiều xe kèm mô hình nhân vật kỹ thuật viên Pit Crew và đánh số thứ tự giới hạn.',
    chase_badge: '<i class="fa-solid fa-gem"></i> BÍ MẬT XE CHASE 1/24 • POP RACE & MINI GT',
    chase_title: 'BÍ MẬT XE "SECRET CHASE" 1/24 LÀ GÌ?',
    chase_desc: 'Secret Chase là phiên bản xe đặc biệt được nhà sản xuất bỏ ngẫu nhiên vào thùng carton nguyên seal với tỷ lệ 1/24.',
    chase_b1_title: 'Giá trị sưu tầm cao gấp 2 đến 5 lần',
    chase_b1_desc: 'Được giới collector quốc tế săn đón nhờ số lượng phát hành giới hạn theo tỷ lệ 1/24.',
    chase_b2_title: 'Nguyên seal Box & Blister chính hãng',
    chase_b2_desc: 'Đầy đủ tem chống giả TSM-Model / Pop Race và hộp bảo vệ chuyên dụng.',
    chase_btn: 'Xem các mẫu Secret Chase trong đợt này',
    chaseBadge: '💎 CẨM NANG COLLECTOR 1:64: PHÂN BIỆT BOX / CARD & CHASE',
    chaseTitle: 'SO SÁNH BẢN BOX VÀ CARD BLISTER • SĂN CHASE 1/24',
    chaseDesc: 'Tìm hiểu vì sao bản Box rẻ hơn bản Card từ 40.000đ – 100.000đ và bí quyết săn phiên bản giới hạn Chase Raw Metal 1/24.',
    chaseBtnFilter: 'Xem các mẫu có cơ hội trúng Chase &rarr;',
    hub_title: 'TIỆN ÍCH ĐỘC QUYỀN COLLECTOR 1:64 DIE-CAST',
    hub_desc: 'Bộ công cụ so sánh mô hình, tính toán hạn ngạch cọc, chọn quy cách đóng gói và cẩm nang tỉ lệ chuẩn.'
  }
};

function applySiteLanguage(lang, showFeedback = false) {
  currentSiteLang = lang === 'en' ? 'en' : 'vi';
  try { localStorage.setItem('minigt_lang', currentSiteLang); } catch (_) {}
  document.documentElement.setAttribute('lang', currentSiteLang);

  const dict = I18N_TRANSLATIONS[currentSiteLang] || I18N_TRANSLATIONS.vi;
  const langBtn = document.getElementById('langToggleBtn');
  const langLabel = document.getElementById('langToggleLabel') || document.getElementById('langCodeLabel');
  const langFlagIcon = document.getElementById('langFlagIcon');
  const topLangText = document.getElementById('topLangText');
  const topLangFlag = document.getElementById('topLangFlag');
  const mobLangBtn = document.getElementById('mobLangToggleBtn');

  if (langBtn) langBtn.classList.toggle('active', currentSiteLang === 'en');
  if (langLabel) langLabel.textContent = currentSiteLang === 'en' ? 'EN' : 'VN';
  if (langFlagIcon) langFlagIcon.textContent = currentSiteLang === 'en' ? '🇺🇸' : '🇻🇳';
  if (topLangText) topLangText.textContent = currentSiteLang === 'en' ? 'EN' : 'VN';
  if (topLangFlag) topLangFlag.textContent = currentSiteLang === 'en' ? '🇺🇸' : '🇻🇳';

  if (mobLangBtn) {
    mobLangBtn.innerHTML = currentSiteLang === 'en'
      ? '<i class="fa-solid fa-globe"></i> Language: EN (Switch to VN)'
      : '<i class="fa-solid fa-globe"></i> Ngôn ngữ: VN / EN';
  }

  // Dịch tự động toàn bộ phần tử có thuộc tính [data-i18n]
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && dict[key] !== undefined) {
      el.innerHTML = dict[key];
    }
  });

  // Dịch các input có [data-i18n-placeholder]
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && dict[key] !== undefined) {
      el.placeholder = dict[key];
    }
  });

  // Search Input
  const searchInput = document.getElementById('headerSearchInput');
  if (searchInput && (dict.search_placeholder || dict.searchPlaceholder)) {
    searchInput.placeholder = dict.search_placeholder || dict.searchPlaceholder;
  }

  // Main Navigation Links
  const navLinks = document.querySelectorAll('#mainNavList .nav-link');
  const navKeys = ['navAll', 'navPreOrder', 'navLbwk', 'navGt3', 'navBoxSets', 'navGuide', 'navShowroom'];
  navLinks.forEach((a, idx) => {
    const key = navKeys[idx];
    if (!key || !dict[key]) return;
    const badge = a.querySelector('.nav-badge-hot');
    a.textContent = dict[key] + ' ';
    if (badge) a.appendChild(badge);
  });

  // Header Action Labels
  const myOrdersSpan = document.querySelector('#myOrdersHeaderBtn span');
  if (myOrdersSpan) myOrdersSpan.textContent = dict.btnMyOrders;
  const cartSpan = document.querySelector('#cartToggleBtn > span:not(.cart-badge)');
  if (cartSpan) cartSpan.textContent = dict.btnCart;

  // Mobile Bottom Nav
  const mobSpans = document.querySelectorAll('#mobileBottomNav .mob-bottom-item > span');
  const mobKeys = ['mobHome', 'mobCatalog', 'mobLbwk', 'mobOrders', 'mobCart'];
  mobSpans.forEach((sp, idx) => {
    if (mobKeys[idx] && dict[mobKeys[idx]]) sp.textContent = dict[mobKeys[idx]];
  });

  // Filter Pills
  const pillMap = {
    all: dict.pillAll,
    best_seller: dict.pillBestSeller,
    in_stock: dict.pillInStock,
    pre_order: dict.pillPreOrder,
    lbwk: dict.pillLbwk,
    chase: dict.pillChase,
    f1: dict.pillF1,
    box_sets: dict.pillBoxSets,
    ao_racing: dict.pillAoRacing
  };
  document.querySelectorAll('.filter-pill').forEach(btn => {
    const fKey = btn.getAttribute('data-filter');
    if (fKey && pillMap[fKey]) {
      const icon = btn.querySelector('i');
      const countEl = btn.querySelector('.pill-count');
      const countText = countEl ? countEl.textContent : '';
      btn.innerHTML = `${icon ? icon.outerHTML + ' ' : ''}${pillMap[fKey]} <span class="pill-count">${countText}</span>`;
    }
  });

  // Đồng bộ lại các thành phần động theo ngôn ngữ mới
  applyThemeMode(currentThemeMode, false);
  updateUserHeaderUI();
  if (typeof allProducts !== 'undefined' && allProducts && allProducts.length > 0) {
    renderProductsGrid();
    renderPreOrderQuickRow();
    updateFilterCounts();
  }
  renderCartDrawer();

  const currFilterEl = document.getElementById('currentFilterLabel');
  if (currFilterEl && (typeof currentFilter === 'undefined' || currentFilter === 'all')) {
    currFilterEl.textContent = dict.filter_all || 'Tất cả mô hình';
  }

  if (showFeedback) {
    showToast(
      currentSiteLang === 'en'
        ? 'Language switched to English (EN) 🌐'
        : 'Đã chuyển ngôn ngữ sang Tiếng Việt (VN) 🇻🇳',
      'info'
    );
  }
}

function toggleSiteLanguage() {
  applySiteLanguage(currentSiteLang === 'vi' ? 'en' : 'vi', true);
}

// =====================================================================
// 18. KHỞI CHẠY TẤT CẢ KHI TẢI XONG DOM
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
  applyThemeMode(currentThemeMode, false);
  applySiteLanguage(currentSiteLang, false);
  loadStoreSettings();
  setupScrollEffects();
  setupScrollReveal();
  setupShortcuts();
  initHeroSlider();
  initMagneticNavGlider();
  initScrollProgressBar();
  initInteractiveCounters();
  initShowroomCounters();
  init3DParallaxTilt();
  loadProducts().then(() => {
    renderCompareFloatingBar();
  });
  setupFilterPills();
  setupCountdown();
  setupSearch();
  updateCartBadge();
  updateWishlistBadge();
  renderPreOrderQuickRow();
  updateUserHeaderUI();
  initGoogleIdentityServices();
  initCustomerRealtimeOrderWatcher();
  initLiveCollectorActivityPopup();

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const activeModal = Array.from(document.querySelectorAll('.modal-overlay.active')).pop();
    if (activeModal) closeModal(activeModal.id);
    else if (document.getElementById('mobileNavDrawer')?.classList.contains('active')) closeMobileNav();
  });

  // Đóng modal khi bấm overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });
});


