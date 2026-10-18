/**
 * MINI GT STORE - UNIFIED API CLIENT & REAL-TIME SYNC ENGINE
 * Thư viện gọi API dùng chung cho cả Khách hàng (index.html) và Admin Panel (admin/index.html)
 * - Tách biệt hoàn toàn Session Admin (truy cập trực tiếp /admin/index.html) và Khách hàng
 * - Đồng bộ Thời gian thực (Real-time BroadcastChannel + Storage Event) giữa Khách hàng <-> Admin
 * - Hỗ trợ đầy đủ cấu trúc Giá Box / Giá Card (+40k-100k) & Giảm giá % trực tiếp
 * - Tự động Fallback LocalStorage toàn diện khi mở qua Live Server (127.0.0.1:5500)
 */
(function (global) {
  'use strict';

  const getApiBase = () => {
    if (global.MINIGT_API_BASE) return global.MINIGT_API_BASE.replace(/\/+$/, '');
    if (global.location) {
      if (global.location.protocol === 'file:' || (global.location.port && global.location.port !== '5000')) {
        return 'http://localhost:5000';
      }
    }
    return '';
  };

  const API_BASE = getApiBase();
  const SHARED_ORDERS_KEY = 'minigt_shared_orders_v2';
  const SHARED_PRODUCTS_KEY = 'minigt_products_catalog_v3';
  const SHARED_SETTINGS_KEY = 'minigt_store_settings_v2';
  const SHARED_USERS_KEY = 'minigt_users_list_v2';
  const SHARED_SUBSCRIBERS_KEY = 'minigt_subscribers_v2';
  const MY_ORDER_CODES_KEY = 'minigt_my_order_codes';
  const REALTIME_EVENT_KEY = 'minigt_realtime_event';

  // Kênh đồng bộ thời gian thực giữa các Tab (Khách hàng <-> Admin)
  let syncChannel = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      syncChannel = new BroadcastChannel('minigt_realtime_sync');
    }
  } catch (e) {
    syncChannel = null;
  }

  const isAdminContext = (endpoint = '') => {
    const path = (global.location && global.location.pathname) ? global.location.pathname.toLowerCase() : '';
    if (endpoint && endpoint.startsWith('/api/admin')) return true;
    return path.includes('/admin');
  };

  class ApiError extends Error {
    constructor(message, status = 0, code = 'NETWORK_ERROR', details = null) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
      this.details = details;
    }
  }

  // Quản lý Token độc lập cho Admin và Khách hàng
  const getToken = (endpoint = '') => {
    try {
      if (isAdminContext(endpoint)) {
        const adminTok = localStorage.getItem('minigt_admin_token');
        if (adminTok) return adminTok;
      }
      return localStorage.getItem('minigt_token') || null;
    } catch (e) {
      return null;
    }
  };

  const getCurrentUser = (endpoint = '') => {
    try {
      if (isAdminContext(endpoint)) {
        const rawAdmin = localStorage.getItem('minigt_admin_user');
        if (rawAdmin) return JSON.parse(rawAdmin);
      }
      const raw = localStorage.getItem('minigt_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const setAuthSession = (token, user) => {
    try {
      const isAdminRole = user && String(user.role || user.Role || '').toLowerCase() === 'admin';
      if (isAdminContext() || isAdminRole) {
        if (token) localStorage.setItem('minigt_admin_token', token);
        else localStorage.removeItem('minigt_admin_token');

        if (user) localStorage.setItem('minigt_admin_user', JSON.stringify(user));
        else localStorage.removeItem('minigt_admin_user');
      }

      if (!isAdminContext()) {
        if (token) localStorage.setItem('minigt_token', token);
        else localStorage.removeItem('minigt_token');

        if (user) localStorage.setItem('minigt_user', JSON.stringify(user));
        else localStorage.removeItem('minigt_user');
      }
    } catch (e) {
      console.warn('Không thể ghi localStorage:', e);
    }
  };

  const clearAuthSession = () => {
    try {
      if (isAdminContext()) {
        localStorage.removeItem('minigt_admin_token');
        localStorage.removeItem('minigt_admin_user');
      } else {
        localStorage.removeItem('minigt_token');
        localStorage.removeItem('minigt_user');
      }
    } catch (e) {
      console.warn('Lỗi khi xóa session:', e);
    }
  };

  // =====================================================================
  // DANH MỤC MẶC ĐỊNH & CHUẨN HÓA SẢN PHẨM (BOX vs CARD + GIẢM TRỰC TIẾP %)
  // =====================================================================
  const CATEGORY_MAP = {
    1: { id: 1, name: 'Liberty Walk LBWK', slug: 'liberty-walk' },
    2: { id: 2, name: 'Formula 1 Racing', slug: 'f1-racing' },
    3: { id: 3, name: 'IMSA & GT3 Racing', slug: 'gt-racing' },
    4: { id: 4, name: 'Box Sets & Combo', slug: 'box-sets' },
    5: { id: 5, name: 'Pop Race & Collab', slug: 'partner' }
  };

  const DEFAULT_CATALOG_PRODUCTS = [
    {
      id: 1, ProductId: 1, Sku: 'MGTS0026', CarNumber: 'S0026',
      Name: 'Lamborghini Huracán Sterrato All-Terrain Set (Box 4 xe)',
      CategoryId: 4, CategorySlug: 'box-sets', CategoryName: 'Box Sets & Combo',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 1850000, PriceCard: 1950000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 500000, QuotaPercent: 82, EditionNote: 'Box Set 4 Xe',
      PreOrderDeadline: '2026-10-30', Stock: 20,
      ImageUrl: 'image/lambo-sterrato-set.png',
      Description: 'Set 4 xe Lamborghini Huracán Sterrato All-Terrain với hộp trưng bày Collector Box sang trọng, chi tiết lốp off-road và giá nóc safari độc quyền.',
      Status: 'pre_order', IsFeatured: 1, IsNew: 1, soldCount: 28
    },
    {
      id: 2, ProductId: 2, Sku: 'MGT01413', CarNumber: '1413',
      Name: 'Aston Martin AMR24 #18 Lance Stroll F1 Las Vegas GP',
      CategoryId: 2, CategorySlug: 'f1-racing', CategoryName: 'Formula 1 Racing',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 420000, PriceCard: 480000, DiscountPercent: 10, PackagingType: 'both',
      DepositAmount: 130000, QuotaPercent: 75, EditionNote: 'LHD Edition',
      PreOrderDeadline: '2026-10-30', Stock: 45,
      ImageUrl: 'image/aston-amr24-stroll.png',
      Description: 'Chiến mã F1 AMR24 của tay đua Lance Stroll tại chặng Las Vegas GP. Cánh gió sau khí động học, tem tài trợ sắc nét.',
      Status: 'pre_order', IsFeatured: 1, IsNew: 1, soldCount: 34
    },
    {
      id: 3, ProductId: 3, Sku: 'MGT01396', CarNumber: '1396',
      Name: 'Aston Martin AMR24 #14 Fernando Alonso F1 Las Vegas GP',
      CategoryId: 2, CategorySlug: 'f1-racing', CategoryName: 'Formula 1 Racing',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 420000, PriceCard: 480000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 130000, QuotaPercent: 90, EditionNote: '2x World Champ',
      PreOrderDeadline: '2026-10-30', Stock: 12,
      ImageUrl: 'image/aston-amr24-alonso.png',
      Description: 'Mẫu xe F1 AMR24 của huyền thoại 2 lần vô địch thế giới Fernando Alonso chặng Las Vegas GP.',
      Status: 'pre_order', IsFeatured: 1, IsNew: 1, soldCount: 25
    },
    {
      id: 4, ProductId: 4, Sku: 'MGT00550', CarNumber: '550',
      Name: 'Oracle Red Bull Racing RB18 #1 Max Verstappen Monaco GP',
      CategoryId: 2, CategorySlug: 'f1-racing', CategoryName: 'Formula 1 Racing',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 390000, PriceCard: 450000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 120000, QuotaPercent: 60, EditionNote: 'Champion Livery',
      PreOrderDeadline: null, Stock: 18,
      ImageUrl: 'image/f1_redbull.jpg',
      Description: 'Mô hình Oracle Red Bull Racing RB18 số 1 Max Verstappen vô địch chặng đua Monaco GP danh giá.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: 41
    },
    {
      id: 5, ProductId: 5, Sku: 'MGT01055', CarNumber: '1055',
      Name: 'LB★WORKS Lamborghini Huracán GT Gravity Racing #5',
      CategoryId: 1, CategorySlug: 'liberty-walk', CategoryName: 'Liberty Walk LBWK',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 330000, PriceCard: 390000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 100000, QuotaPercent: 0, EditionNote: 'Widebody Aero',
      PreOrderDeadline: null, Stock: 25,
      ImageUrl: 'image/mgt01055.webp',
      Description: 'Bản độ Liberty Walk Huracán GT phong cách Gravity Racing với body kit vòm bánh rộng tán đinh đặc trưng.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: 36
    },
    {
      id: 6, ProductId: 6, Sku: 'MGT01143', CarNumber: '1143',
      Name: 'Porsche 911 GT3 R #77 AO Racing "Skeleton" IMSA Petit Le Mans',
      CategoryId: 3, CategorySlug: 'gt-racing', CategoryName: 'IMSA & GT3 Racing',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 380000, PriceCard: 440000, DiscountPercent: 5, PackagingType: 'both',
      DepositAmount: 120000, QuotaPercent: 70, EditionNote: 'Halloween Skeleton',
      PreOrderDeadline: '2026-10-30', Stock: 30,
      ImageUrl: 'image/ske.webp',
      Description: 'Phiên bản giới hạn Halloween của đội AO Racing với tem khung xương khủng long phát quang độc đáo trên nền sơn đen.',
      Status: 'pre_order', IsFeatured: 1, IsNew: 1, soldCount: 39
    },
    {
      id: 7, ProductId: 7, Sku: 'MGT01093', CarNumber: '1093',
      Name: 'Porsche 911 GT3 R #77 AO Racing "Roxy" IMSA Road America',
      CategoryId: 3, CategorySlug: 'gt-racing', CategoryName: 'IMSA & GT3 Racing',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 360000, PriceCard: 420000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 110000, QuotaPercent: 88, EditionNote: 'Pink Dino IMSA',
      PreOrderDeadline: null, Stock: 15,
      ImageUrl: 'image/Roxy.webp',
      Description: 'Chiếc Porsche khủng long hồng Roxy nổi tiếng của AO Racing tại giải đua Road America.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: 33
    },
    {
      id: 8, ProductId: 8, Sku: 'MGT00782', CarNumber: '782',
      Name: 'Porsche 911 GT3 R #80 AO Racing "Rexy" IMSA Sebring',
      CategoryId: 3, CategorySlug: 'gt-racing', CategoryName: 'IMSA & GT3 Racing',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 370000, PriceCard: 430000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 120000, QuotaPercent: 95, EditionNote: 'Green Dino IMSA',
      PreOrderDeadline: null, Stock: 8,
      ImageUrl: 'image/rexy.jpg',
      Description: 'Biểu tượng khủng long xanh Rexy gầm rú khuấy đảo các trường đua IMSA và Le Mans.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: 48
    },
    {
      id: 9, ProductId: 9, Sku: 'MGT00512', CarNumber: '1129',
      Name: 'Lamborghini Huracán GT3 EVO #63 Squadra Corse Official',
      CategoryId: 3, CategorySlug: 'gt-racing', CategoryName: 'IMSA & GT3 Racing',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 340000, PriceCard: 400000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 100000, QuotaPercent: 0, EditionNote: 'Factory Racing',
      PreOrderDeadline: null, Stock: 5,
      ImageUrl: 'image/minigt_lambogt3.jpg',
      Description: 'Mẫu xe đua Lamborghini Huracán GT3 EVO #63 Squadra Corse với bộ tem khí động học sắc nét.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: 19
    },
    {
      id: 10, ProductId: 10, Sku: 'MGT00755', CarNumber: '465',
      Name: 'Nissan Silvia S15 LB-Super Silhouette #23 Formula Drift',
      CategoryId: 1, CategorySlug: 'liberty-walk', CategoryName: 'Liberty Walk LBWK',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 320000, PriceCard: 380000, DiscountPercent: 10, PackagingType: 'both',
      DepositAmount: 100000, QuotaPercent: 0, EditionNote: 'LB★WORKS',
      PreOrderDeadline: null, Stock: 12,
      ImageUrl: 'image/Minigt_s15chop_lbwk.jpg',
      Description: 'Huyền thoại Nissan S15 phong cách Super Silhouette từ nhà độ Liberty Walk Wataru Kato.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 1, soldCount: 52
    },
    {
      id: 11, ProductId: 11, Sku: 'MGT00688', CarNumber: '688',
      Name: 'Lamborghini Aventador LB★WORKS Widebody 2.0 Matte Black',
      CategoryId: 1, CategorySlug: 'liberty-walk', CategoryName: 'Liberty Walk LBWK',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 360000, PriceCard: 430000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 110000, QuotaPercent: 0, EditionNote: 'Zero Fighter',
      PreOrderDeadline: null, Stock: 4,
      ImageUrl: 'image/Minigt_Lambo_LBWK.jpg',
      Description: 'Siêu bò Aventador độ thân rộng LB★WORKS Widebody 2.0 màu sơn đen nhám Zero Fighter.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: 22
    },
    {
      id: 12, ProductId: 12, Sku: 'PR640325', CarNumber: '325',
      Name: 'Pop Race Toyota Supra Top Secret GT300 Silver Chrome',
      CategoryId: 5, CategorySlug: 'partner', CategoryName: 'Pop Race & Collab',
      Brand: 'Pop Race', Scale: '1:64',
      PriceBox: 420000, PriceCard: 480000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 130000, QuotaPercent: 0, EditionNote: 'Top Secret Chrome',
      PreOrderDeadline: null, Stock: 19,
      ImageUrl: 'image/Poprace_Supra_Secret.webp',
      Description: 'Siêu phẩm Top Secret Supra màu bạc tráng gương có thể mở nắp capo chi tiết động cơ 2JZ.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: 27
    },
    {
      id: 13, ProductId: 13, Sku: 'PR640110', CarNumber: '110',
      Name: 'Pop Race Lamborghini Huracán STO Blu Laufey',
      CategoryId: 5, CategorySlug: 'partner', CategoryName: 'Pop Race & Collab',
      Brand: 'Pop Race', Scale: '1:64',
      PriceBox: 440000, PriceCard: 500000, DiscountPercent: 5, PackagingType: 'both',
      DepositAmount: 140000, QuotaPercent: 0, EditionNote: 'Openable Engine',
      PreOrderDeadline: null, Stock: 11,
      ImageUrl: 'image/Poprace_Lambo_Secret.webp',
      Description: 'Huracán STO màu xanh Laufey đặc trưng, mở nắp khoang động cơ cực kỳ tinh xảo.',
      Status: 'in_stock', IsFeatured: 0, IsNew: 1, soldCount: 18
    },
    {
      id: 14, ProductId: 14, Sku: 'TH-ULTRA63', CarNumber: '63',
      Name: 'Trends Hobby Lamborghini Huracán GT3 EVO2 #63 Ultraman Tiga',
      CategoryId: 5, CategorySlug: 'partner', CategoryName: 'Pop Race & Collab',
      Brand: 'Trends Hobby', Scale: '1:64',
      PriceBox: 550000, PriceCard: 630000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 180000, QuotaPercent: 0, EditionNote: 'Acrylic Case',
      PreOrderDeadline: null, Stock: 7,
      ImageUrl: 'image/TH_LamboUltraman.jpg',
      Description: 'Phiên bản giới hạn bản quyền chính thức Ultraman Tiga với hộp acrylic cao cấp và đế da sang trọng.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 1, soldCount: 21
    },
    {
      id: 15, ProductId: 15, Sku: 'COMBO-AMR24', CarNumber: 'SET2',
      Name: 'Combo Aston Martin AMR24 Las Vegas (Stroll #18 + Alonso #14)',
      CategoryId: 4, CategorySlug: 'box-sets', CategoryName: 'Box Sets & Combo',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 820000, PriceCard: 920000, DiscountPercent: 10, PackagingType: 'both',
      DepositAmount: 250000, QuotaPercent: 85, EditionNote: 'Trọn Bộ 2 Xe F1',
      PreOrderDeadline: '2026-10-30', Stock: 10,
      ImageUrl: 'image/aston-amr24-stroll.png',
      Description: 'Cặp bài trùng AMR24 Las Vegas của 2 tay đua Lance Stroll và Fernando Alonso.',
      Status: 'pre_order', IsFeatured: 1, IsNew: 1, soldCount: 24
    },
    {
      id: 16, ProductId: 16, Sku: 'COMBO-AO3', CarNumber: 'AO3',
      Name: 'Combo 3 Xe AO Racing Porsche 911 GT3 R (Rexy • Roxy • Skeleton)',
      CategoryId: 4, CategorySlug: 'box-sets', CategoryName: 'Box Sets & Combo',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 1080000, PriceCard: 1180000, DiscountPercent: 5, PackagingType: 'both',
      DepositAmount: 350000, QuotaPercent: 92, EditionNote: 'Bộ 3 Khủng Long IMSA',
      PreOrderDeadline: '2026-10-30', Stock: 8,
      ImageUrl: 'image/roxy_rexy_minigt.webp',
      Description: 'Trọn bộ ba siêu phẩm khủng long AO Racing Porsche 911 GT3 R: Rexy #80, Roxy #77 và Skeleton #77.',
      Status: 'pre_order', IsFeatured: 1, IsNew: 1, soldCount: 37
    },
    {
      id: 17, ProductId: 17, Sku: 'MGT00618', CarNumber: '618',
      Name: 'LB-Super Silhouette Nissan S15 Silvia #23 Goodwood FoS',
      CategoryId: 1, CategorySlug: 'liberty-walk', CategoryName: 'Liberty Walk LBWK',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 330000, PriceCard: 390000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 100000, QuotaPercent: 0, EditionNote: 'Goodwood Edition',
      PreOrderDeadline: null, Stock: 14,
      ImageUrl: 'image/Minigt_S15_LBWK.jpg',
      Description: 'Phiên bản kỷ niệm màn trình diễn drift của Nissan S15 Liberty Walk tại lễ hội tốc độ Goodwood Anh Quốc.',
      Status: 'in_stock', IsFeatured: 0, IsNew: 0, soldCount: 20
    }
  ];

  // Hàm chuẩn hóa sản phẩm: tính toán trực tiếp giá sau giảm từ % giảm giá cho cả Box và Card
  const normalizeProductObject = (raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const id = Number(raw.id || raw.ProductId || Date.now());
    const sku = String(raw.sku || raw.Sku || `MGT${id}`).trim();
    const name = String(raw.name || raw.Name || 'Mô hình MINI GT 1:64').trim();
    const catId = Number(raw.categoryId || raw.CategoryId || (raw.category && raw.category.id) || 1);
    const catInfo = CATEGORY_MAP[catId] || {
      id: catId,
      name: raw.CategoryName || (raw.category && raw.category.name) || 'MINI GT 1:64',
      slug: raw.CategorySlug || (raw.category && raw.category.slug) || 'liberty-walk'
    };

    const packagingType = raw.packagingType || raw.PackagingType || 'both';
    // Giá gốc Bản Box (Hộp giấy)
    const rawBaseBox = Number(raw.priceBox ?? raw.PriceBox ?? raw.basePriceBox ?? raw.oldPrice ?? raw.OldPrice ?? raw.price ?? raw.Price ?? 320000);
    // Giá gốc Bản Card (Vỉ Blister): mặc định cao hơn Box 60.000đ (nằm trong khoảng 40k - 100k)
    const rawBaseCard = Number(raw.priceCard ?? raw.PriceCard ?? raw.basePriceCard ?? (rawBaseBox + 60000));
    const priceCardDiff = Math.max(40000, rawBaseCard - rawBaseBox);
    const basePriceBox = Math.max(50000, rawBaseBox);
    const basePriceCard = Math.max(basePriceBox + 40000, rawBaseCard || (basePriceBox + priceCardDiff));

    // Tính % giảm giá trực tiếp
    let discountPercent = Number(raw.discountPercent ?? raw.DiscountPercent ?? 0);
    if (!discountPercent && raw.oldPrice && raw.price && Number(raw.oldPrice) > Number(raw.price)) {
      discountPercent = Math.round(((Number(raw.oldPrice) - Number(raw.price)) / Number(raw.oldPrice)) * 100);
    }
    discountPercent = Math.max(0, Math.min(80, Math.round(discountPercent)));

    // Lấy % trừ trực tiếp vào tiền: Giá thực thu = Giá gốc * (100 - %) / 100
    const finalPriceBox = discountPercent > 0
      ? Math.round((basePriceBox * (100 - discountPercent)) / 100)
      : basePriceBox;
    const finalPriceCard = discountPercent > 0
      ? Math.round((basePriceCard * (100 - discountPercent)) / 100)
      : basePriceCard;

    const defaultIsCard = packagingType === 'card_only';
    const effectivePrice = defaultIsCard ? finalPriceCard : finalPriceBox;
    const effectiveOldPrice = discountPercent > 0 ? (defaultIsCard ? basePriceCard : basePriceBox) : null;

    const stock = Number(raw.stock ?? raw.Stock ?? 10);
    let status = String(raw.status || raw.Status || 'in_stock').toLowerCase();
    if (stock <= 0) status = 'sold_out';

    const image = raw.image || raw.imageUrl || raw.ImageUrl || 'image/hero-banner.jpg';
    const depositAmount = Number(raw.depositAmount ?? raw.DepositAmount ?? Math.round(effectivePrice * 0.3));
    const quotaPercent = Number(raw.quotaPercent ?? raw.QuotaPercent ?? 0);
    const editionNote = raw.editionNote ?? raw.EditionNote ?? '';
    const preOrderDeadline = raw.preOrderDeadline ?? raw.PreOrderDeadline ?? null;
    const brand = raw.brand || raw.Brand || 'MINI GT';
    const scale = raw.scale || raw.Scale || '1:64';
    const description = raw.description || raw.Description || '';
    const isFeatured = Boolean(raw.isFeatured ?? raw.IsFeatured);
    const isNew = Boolean(raw.isNew ?? raw.IsNew);
    const carNumber = raw.carNumber || raw.CarNumber || sku.replace(/\D/g, '').replace(/^0+/, '') || '1:64';

    return {
      id,
      ProductId: id,
      sku,
      Sku: sku,
      carNumber,
      CarNumber: carNumber,
      name,
      Name: name,
      categoryId: catInfo.id,
      CategoryId: catInfo.id,
      CategorySlug: catInfo.slug,
      CategoryName: catInfo.name,
      category: catInfo,
      brand,
      Brand: brand,
      scale,
      Scale: scale,
      packagingType,
      PackagingType: packagingType,
      // Giá gốc chưa giảm của Box & Card
      priceBox: basePriceBox,
      PriceBox: basePriceBox,
      priceCard: basePriceCard,
      PriceCard: basePriceCard,
      // % Giảm trực tiếp và Giá sau khi trừ % trực tiếp
      discountPercent,
      DiscountPercent: discountPercent,
      hasDiscount: discountPercent > 0,
      HasDiscount: discountPercent > 0,
      finalPriceBox,
      FinalPriceBox: finalPriceBox,
      finalPriceCard,
      FinalPriceCard: finalPriceCard,
      // Trường tương thích ngược
      price: effectivePrice,
      Price: effectivePrice,
      oldPrice: effectiveOldPrice,
      OldPrice: effectiveOldPrice,
      depositAmount,
      DepositAmount: depositAmount,
      quotaPercent,
      QuotaPercent: quotaPercent,
      editionNote,
      EditionNote: editionNote,
      preOrderDeadline,
      PreOrderDeadline: preOrderDeadline,
      stock,
      Stock: stock,
      status,
      Status: status,
      image,
      imageUrl: image,
      ImageUrl: image,
      description,
      Description: description,
      isFeatured,
      IsFeatured: isFeatured ? 1 : 0,
      isNew,
      IsNew: isNew ? 1 : 0,
      soldCount: Number(raw.soldCount || 15)
    };
  };

  const getSharedProducts = () => {
    try {
      const raw = localStorage.getItem(SHARED_PRODUCTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeProductObject);
        }
      }
    } catch (e) {}
    const seeded = DEFAULT_CATALOG_PRODUCTS.map(normalizeProductObject);
    try {
      localStorage.setItem(SHARED_PRODUCTS_KEY, JSON.stringify(seeded));
    } catch (e) {}
    return seeded;
  };

  const saveSharedProducts = (products) => {
    try {
      const normalized = products.map(normalizeProductObject);
      localStorage.setItem(SHARED_PRODUCTS_KEY, JSON.stringify(normalized));
      return normalized;
    } catch (e) {
      return products;
    }
  };

  // =====================================================================
  // BỘ ĐỒNG BỘ ĐƠN HÀNG SHARED LOCALSTORAGE & REALTIME EVENT
  // =====================================================================
  const getSharedOrders = () => {
    try {
      const raw = localStorage.getItem(SHARED_ORDERS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  };

  const saveSharedOrders = (orders) => {
    try {
      localStorage.setItem(SHARED_ORDERS_KEY, JSON.stringify(orders.slice(0, 200)));
    } catch (e) {
      console.warn('Không thể lưu bộ đệm đơn hàng:', e);
    }
  };

  const getMyOrderCodes = () => {
    try {
      const raw = localStorage.getItem(MY_ORDER_CODES_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  };

  const addMyOrderCode = (code) => {
    if (!code) return;
    try {
      const clean = String(code).trim().toUpperCase();
      const codes = getMyOrderCodes();
      if (!codes.includes(clean)) {
        codes.unshift(clean);
        localStorage.setItem(MY_ORDER_CODES_KEY, JSON.stringify(codes.slice(0, 50)));
      }
    } catch (e) {}
  };

  const STATUS_LABELS = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Admin đã duyệt đơn',
    PREPARING: 'Đang đóng gói bảo vệ Blister',
    SHIPPING: 'Đang giao hàng (SPX Express)',
    DELIVERED: 'Giao hàng thành công',
    CANCELLED: 'Đã hủy'
  };

  const PAYMENT_STATUS_LABELS = {
    UNPAID: 'Chưa thanh toán',
    PARTIALLY_PAID: 'Đã thu cọc',
    PAID: 'Đã thanh toán đủ',
    REFUND_PENDING: 'Chờ hoàn tiền',
    REFUNDED: 'Đã hoàn tiền'
  };

  const normalizeOrderObject = (ord) => {
    if (!ord || typeof ord !== 'object') return ord;
    const code = ord.code || ord.orderCode || ord.OrderCode || '';
    const status = String(ord.status || ord.Status || 'PENDING').toUpperCase();
    const paymentMethod = String(ord.paymentMethod || ord.PaymentMethod || 'COD').toUpperCase();
    const paymentStatus = String(ord.paymentStatus || ord.PaymentStatus || 'UNPAID').toUpperCase();
    const trackingCode = ord.trackingCode || ord.TrackingCode || null;
    const trackingCarrier = ord.trackingCarrier || ord.TrackingCarrier || 'SPX Express';
    const isApproved = ['CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED'].includes(status) || Boolean(trackingCode);
    const totalAmount = Number(ord.totalAmount ?? ord.TotalAmount ?? ord.total ?? 0);
    const depositAmount = Number(ord.depositAmount ?? ord.totalDeposit ?? ord.DepositAmount ?? 0);
    const remainingAmount = Math.max(0, totalAmount - depositAmount);

    let approvalNotice = null;
    if (trackingCode) {
      approvalNotice = `Admin đã duyệt đơn & bàn giao cho ${trackingCarrier} — Mã vận đơn: ${trackingCode}`;
    } else if (isApproved) {
      approvalNotice = `Admin đã duyệt đơn hàng #${code}. Kiện hàng đang được đóng gói chống sốc chuẩn Collector!`;
    }

    const fullName = ord.fullName || ord.FullName || (ord.customer && ord.customer.fullName) || 'Khách hàng';
    const phone = ord.phone || ord.Phone || (ord.customer && ord.customer.phone) || '';
    const email = ord.email || ord.Email || (ord.customer && ord.customer.email) || '';
    const address = ord.address || ord.Address || (ord.shipping && ord.shipping.address) || (ord.customer && ord.customer.address) || '';
    const city = ord.city || ord.City || (ord.shipping && ord.shipping.city) || (ord.customer && ord.customer.city) || '';
    const district = ord.district || ord.District || (ord.shipping && ord.shipping.district) || (ord.customer && ord.customer.district) || '';
    const codAmount = paymentStatus === 'PAID' ? 0 : (depositAmount > 0 ? Math.max(0, totalAmount - depositAmount) : totalAmount);

    return Object.assign({}, ord, {
      id: Number(ord.id || ord.orderId || ord.OrderId || Date.now()),
      orderId: Number(ord.orderId || ord.id || ord.OrderId || Date.now()),
      OrderId: Number(ord.OrderId || ord.id || ord.orderId || Date.now()),
      code,
      orderCode: code,
      OrderCode: code,
      fullName,
      FullName: fullName,
      phone,
      Phone: phone,
      email,
      Email: email,
      address,
      Address: address,
      city,
      City: city,
      district,
      District: district,
      customer: {
        id: ord.userId || ord.UserId || null,
        fullName,
        phone,
        email,
        address,
        city,
        district
      },
      status,
      Status: status,
      statusLabel: STATUS_LABELS[status] || status,
      paymentMethod,
      PaymentMethod: paymentMethod,
      paymentStatus,
      PaymentStatus: paymentStatus,
      paymentStatusLabel: PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus,
      subtotal: Number(ord.subtotal ?? ord.Subtotal ?? totalAmount),
      shippingFee: Number(ord.shippingFee ?? ord.ShippingFee ?? 0),
      total: totalAmount,
      totalAmount,
      TotalAmount: totalAmount,
      depositAmount,
      totalDeposit: depositAmount,
      DepositAmount: depositAmount,
      remainingAmount,
      RemainingAmount: remainingAmount,
      codAmount,
      trackingCode,
      TrackingCode: trackingCode,
      trackingCarrier,
      TrackingCarrier: trackingCarrier,
      trackingUrl: trackingCode ? 'https://spx.vn/vi' : null,
      isApproved,
      hasTracking: Boolean(trackingCode),
      approvalNotice,
      createdAt: ord.createdAt || ord.CreatedAt || new Date().toISOString(),
      CreatedAt: ord.CreatedAt || ord.createdAt || new Date().toISOString(),
      updatedAt: ord.updatedAt || ord.UpdatedAt || new Date().toISOString(),
      UpdatedAt: ord.UpdatedAt || ord.updatedAt || new Date().toISOString(),
      items: Array.isArray(ord.items) ? ord.items : [],
      history: Array.isArray(ord.history) ? ord.history : (Array.isArray(ord.timeline) ? ord.timeline.map(t => ({
        to: t.statusLabel || t.newStatus,
        note: t.note || '',
        createdAt: t.createdAt || new Date().toISOString()
      })) : [])
    });
  };

  const upsertSharedOrder = (ord) => {
    if (!ord) return null;
    const normalized = normalizeOrderObject(ord);
    if (!normalized.code) return normalized;
    const list = getSharedOrders();
    const idx = list.findIndex(o =>
      (o.code && o.code === normalized.code) ||
      (o.id && normalized.id && Number(o.id) === Number(normalized.id))
    );
    if (idx >= 0) {
      const mergedItems = (normalized.items && normalized.items.length > 0)
        ? normalized.items
        : (list[idx].items || []);
      list[idx] = Object.assign({}, list[idx], normalized, { items: mergedItems });
    } else {
      list.unshift(normalized);
    }
    saveSharedOrders(list);
    return idx >= 0 ? list[idx] : normalized;
  };

  const emitRealtimeSync = (type, payload) => {
    const eventData = {
      type,
      payload,
      timestamp: Date.now()
    };
    try {
      if (syncChannel) {
        syncChannel.postMessage(eventData);
      }
    } catch (e) {}
    try {
      localStorage.setItem(REALTIME_EVENT_KEY, JSON.stringify(eventData));
    } catch (e) {}
    if (global.dispatchEvent) {
      global.dispatchEvent(new CustomEvent('minigt:realtime', { detail: eventData }));
    }
  };

  // Lắng nghe sự kiện từ Tab bên kia (Admin <-> Khách hàng)
  if (syncChannel) {
    syncChannel.onmessage = (ev) => {
      if (ev && ev.data && global.dispatchEvent) {
        global.dispatchEvent(new CustomEvent('minigt:realtime', { detail: ev.data }));
      }
    };
  }
  if (global.addEventListener) {
    global.addEventListener('storage', (ev) => {
      if (ev.key === REALTIME_EVENT_KEY && ev.newValue) {
        try {
          const data = JSON.parse(ev.newValue);
          global.dispatchEvent(new CustomEvent('minigt:realtime', { detail: data }));
        } catch (e) {}
      }
    });
  }

  // Tự động đồng bộ dữ liệu đơn hàng khi API trả về thành công
  const syncOrderSideEffects = (endpoint, method, responseData) => {
    if (!responseData || !responseData.success) return;
    const d = responseData.data;

    if (method === 'POST' && endpoint === '/api/orders' && d) {
      const saved = upsertSharedOrder(d);
      addMyOrderCode(saved.code);
      emitRealtimeSync('ORDER_CREATED', saved);
      return;
    }

    if ((method === 'PUT' || method === 'PATCH') && endpoint.includes('/orders/') && d) {
      const saved = upsertSharedOrder(d);
      emitRealtimeSync('ORDER_UPDATED', saved);
      return;
    }

    if (method === 'GET' && Array.isArray(d) && endpoint.includes('/orders')) {
      d.forEach(item => upsertSharedOrder(item));
    } else if (method === 'GET' && d && (d.code || d.OrderCode) && endpoint.includes('/orders')) {
      upsertSharedOrder(d);
    }
  };

  // =====================================================================
  // FALLBACK ENGINE TOÀN DIỆN (Khi chạy trên 127.0.0.1:5500 Live Server)
  // =====================================================================
  const parseUrlAndQuery = (rawEndpoint) => {
    const [pathPart, queryPart] = rawEndpoint.split('?');
    const params = {};
    if (queryPart) {
      const usp = new URLSearchParams(queryPart);
      usp.forEach((v, k) => { params[k] = v; });
    }
    return { path: pathPart, params };
  };

  const handleOfflineFallback = (endpoint, options) => {
    const method = (options.method || 'GET').toUpperCase();
    const { path, params } = parseUrlAndQuery(endpoint);
    let body = {};
    if (options.body) {
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch (e) {}
    }

    // 0. XÁC THỰC ADMIN & KHÁCH HÀNG (POST /api/auth/login, /api/auth/register, /api/auth/google, GET /api/auth/me)
    if (method === 'GET' && path === '/api/auth/me') {
      const u = getCurrentUser(endpoint);
      if (u) return { success: true, data: u, user: u };
      if (isAdminContext(endpoint)) {
        const defaultAdmin = {
          id: 1,
          userId: 1,
          fullName: 'Đỗ Quốc Thịnh & Nguyễn Đình Nam',
          email: 'admin@minigt.com',
          role: 'admin',
          avatarUrl: 'image/DoQuocThinh_anhthe.jpg'
        };
        setAuthSession('admin-direct-session-token', defaultAdmin);
        return { success: true, data: defaultAdmin, user: defaultAdmin };
      }
      return { success: false, message: 'Chưa đăng nhập' };
    }

    if (method === 'POST' && path === '/api/auth/login') {
      const email = String(body.email || '').trim();
      const inAdminPage = isAdminContext(endpoint);
      const userObj = inAdminPage
        ? {
            id: 1,
            userId: 1,
            fullName: 'Đỗ Quốc Thịnh & Nguyễn Đình Nam',
            email: email || 'admin@minigt.com',
            role: 'admin',
            avatarUrl: 'image/DoQuocThinh_anhthe.jpg'
          }
        : {
            id: Date.now(),
            userId: Date.now(),
            fullName: email.split('@')[0] || 'Khách hàng',
            email,
            role: 'customer',
            avatarUrl: 'image/anh-clone.jpg'
          };
      const tok = (inAdminPage ? 'admin_tok_' : 'cust_tok_') + Date.now();
      return {
        success: true,
        token: tok,
        user: userObj,
        data: { token: tok, user: userObj }
      };
    }

    if (method === 'POST' && (path === '/api/auth/register' || path === '/api/auth/google')) {
      const info = body.userInfo || body;
      const email = String(info.email || 'collector@gmail.com').trim();
      const fullName = String(info.fullName || info.name || email.split('@')[0]).trim();
      const userObj = {
        id: Date.now(),
        userId: Date.now(),
        fullName,
        email,
        phone: info.phone || '',
        role: 'customer',
        avatarUrl: 'image/anh-clone.jpg'
      };
      const tok = 'cust_tok_' + Date.now();
      return {
        success: true,
        token: tok,
        user: userObj,
        data: { token: tok, user: userObj }
      };
    }

    // 1. DANH SÁCH SẢN PHẨM KHÁCH HÀNG & ADMIN (GET /api/products, GET /api/admin/products, POST/PUT/DELETE)
    if (method === 'GET' && path === '/api/products') {
      const list = getSharedProducts();
      return { success: true, data: list };
    }

    if (method === 'GET' && path === '/api/admin/products') {
      let list = getSharedProducts();
      const q = String(params.search || '').trim().toLowerCase();
      const cat = String(params.category || 'all').toLowerCase();
      const st = String(params.status || 'all').toLowerCase();
      const stk = String(params.stock || 'all').toLowerCase();
      const sort = String(params.sort || 'newest').toLowerCase();

      if (q) {
        list = list.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
        );
      }
      if (cat !== 'all') {
        list = list.filter(p => p.CategorySlug === cat || String(p.categoryId) === cat);
      }
      if (st !== 'all') {
        list = list.filter(p => p.status === st);
      }
      if (stk === 'in_stock') {
        list = list.filter(p => p.stock > 5);
      } else if (stk === 'low_stock') {
        list = list.filter(p => p.stock > 0 && p.stock <= 5);
      } else if (stk === 'out_of_stock') {
        list = list.filter(p => p.stock <= 0);
      }

      if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
      else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
      else if (sort === 'stock_asc') list.sort((a, b) => a.stock - b.stock);
      else if (sort === 'best_selling') list.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
      else list.sort((a, b) => b.id - a.id);

      const page = Math.max(1, Number(params.page || 1));
      const limit = Math.max(1, Number(params.limit || 20));
      const total = list.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const paged = list.slice((page - 1) * limit, page * limit);

      return {
        success: true,
        data: paged,
        pagination: { page, limit, total, totalPages }
      };
    }

    const adminProdDetailMatch = path.match(/^\/api\/admin\/products\/(\d+)$/);
    if (method === 'GET' && adminProdDetailMatch) {
      const pid = Number(adminProdDetailMatch[1]);
      const found = getSharedProducts().find(p => Number(p.id) === pid);
      if (found) return { success: true, data: found };
      return { success: false, message: 'Không tìm thấy sản phẩm' };
    }

    if (method === 'POST' && path === '/api/admin/products') {
      const all = getSharedProducts();
      const nextId = all.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
      const created = normalizeProductObject(Object.assign({}, body, {
        id: nextId,
        ProductId: nextId,
        image: body.imageUrl || body.image || 'image/hero-banner.jpg'
      }));
      all.unshift(created);
      saveSharedProducts(all);
      emitRealtimeSync('PRODUCTS_UPDATED', created);
      return { success: true, message: 'Đã thêm mô hình mới thành công!', data: created };
    }

    if (method === 'PUT' && adminProdDetailMatch) {
      const pid = Number(adminProdDetailMatch[1]);
      const all = getSharedProducts();
      const idx = all.findIndex(p => Number(p.id) === pid);
      if (idx >= 0) {
        const updated = normalizeProductObject(Object.assign({}, all[idx], body, {
          id: pid,
          ProductId: pid,
          image: body.imageUrl || body.image || all[idx].image
        }));
        all[idx] = updated;
        saveSharedProducts(all);
        emitRealtimeSync('PRODUCTS_UPDATED', updated);
        return { success: true, message: 'Đã cập nhật mô hình thành công!', data: updated };
      }
      return { success: false, message: 'Không tìm thấy sản phẩm để cập nhật' };
    }

    const adminProdCloneMatch = path.match(/^\/api\/admin\/products\/(\d+)\/clone$/);
    if (method === 'POST' && adminProdCloneMatch) {
      const pid = Number(adminProdCloneMatch[1]);
      const all = getSharedProducts();
      const src = all.find(p => Number(p.id) === pid);
      if (src) {
        const nextId = all.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
        const cloned = normalizeProductObject(Object.assign({}, src, {
          id: nextId,
          ProductId: nextId,
          sku: `${src.sku}-COPY`,
          name: `${src.name} (Bản sao)`
        }));
        all.unshift(cloned);
        saveSharedProducts(all);
        emitRealtimeSync('PRODUCTS_UPDATED', cloned);
        return { success: true, message: 'Đã nhân bản mô hình thành công!', data: cloned };
      }
    }

    if (method === 'DELETE' && adminProdDetailMatch) {
      const pid = Number(adminProdDetailMatch[1]);
      const all = getSharedProducts().filter(p => Number(p.id) !== pid);
      saveSharedProducts(all);
      emitRealtimeSync('PRODUCTS_UPDATED', { deletedId: pid });
      return { success: true, message: 'Đã xóa sản phẩm khỏi danh mục' };
    }

    // 2. Tạo đơn hàng mới (POST /api/orders)
    if (method === 'POST' && path === '/api/orders') {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(1000 + Math.random() * 9000);
      const code = `MGT-${dateStr}-${rand}`;
      const items = (body.items || []).map((it, idx) => ({
        id: idx + 1,
        productId: it.productId || idx + 1,
        productSku: it.sku || `MGT-${it.productId || idx + 1}`,
        productName: it.name || `Mô hình Mini GT #${it.productId || idx + 1}`,
        productImage: it.image || 'image/hero-banner.jpg',
        packagingOption: it.packagingOption || 'box',
        packagingLabel: it.packagingLabel || (it.packagingOption === 'card' ? 'Bản Card (Vỉ Blister)' : 'Bản Box (Hộp giấy)'),
        orderType: it.orderType || 'IN_STOCK',
        unitPrice: Number(it.price || 320000),
        depositPrice: Number(it.deposit || 0),
        quantity: Number(it.quantity || 1),
        lineTotal: Number(it.price || 320000) * Number(it.quantity || 1)
      }));
      const subtotal = items.reduce((s, i) => s + i.lineTotal, 0) || Number(body.totalAmount || 350000);
      const shippingFee = body.shippingFee !== undefined ? Number(body.shippingFee) : 11000;
      const totalAmount = Number(body.totalAmount || (subtotal + shippingFee));
      const payMethod = body.paymentMethod === 'FULL_TRANSFER' ? 'BANK_TRANSFER' : (body.paymentMethod || 'COD');
      const depositAmount = payMethod === 'DEPOSIT' ? Number(body.depositAmount || Math.round(totalAmount * 0.3)) : 0;

      // Trừ tồn kho sản phẩm
      const catalog = getSharedProducts();
      items.forEach(item => {
        const prod = catalog.find(p => Number(p.id) === Number(item.productId));
        if (prod && prod.stock > 0) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
          if (prod.stock === 0) prod.status = 'sold_out';
        }
      });
      saveSharedProducts(catalog);

      const newOrder = normalizeOrderObject({
        id: Date.now(),
        code,
        fullName: body.fullName || 'Khách hàng',
        phone: body.phone || '',
        email: body.email || '',
        address: body.address || '',
        city: body.city || '',
        district: body.district || '',
        note: body.note || '',
        paymentMethod: payMethod,
        paymentStatus: 'UNPAID',
        status: 'PENDING',
        subtotal,
        shippingFee,
        totalAmount,
        depositAmount,
        items,
        createdAt: now.toISOString(),
        timeline: [{
          newStatus: 'PENDING',
          statusLabel: 'Chờ xác nhận',
          note: 'Đơn hàng được khởi tạo thành công',
          createdAt: now.toISOString()
        }]
      });

      upsertSharedOrder(newOrder);
      addMyOrderCode(newOrder.code);
      emitRealtimeSync('ORDER_CREATED', newOrder);
      return {
        success: true,
        message: 'Đặt hàng thành công!',
        data: newOrder
      };
    }

    // 3. Admin lấy danh sách đơn hàng (GET /api/admin/orders)
    if (method === 'GET' && path.startsWith('/api/admin/orders')) {
      const idMatch = path.match(/^\/api\/admin\/orders\/(\d+)$/);
      const allOrders = getSharedOrders().map(normalizeOrderObject);

      if (idMatch) {
        const oid = Number(idMatch[1]);
        const found = allOrders.find(o => Number(o.id) === oid || Number(o.orderId) === oid);
        if (found) return { success: true, data: found };
      }

      const counts = {
        all: allOrders.length,
        pending: allOrders.filter(o => o.status === 'PENDING').length,
        confirmed: allOrders.filter(o => o.status === 'CONFIRMED').length,
        preparing: allOrders.filter(o => o.status === 'PREPARING').length,
        shipping: allOrders.filter(o => o.status === 'SHIPPING').length,
        delivered: allOrders.filter(o => o.status === 'DELIVERED').length,
        cancelled: allOrders.filter(o => o.status === 'CANCELLED').length
      };

      let filtered = allOrders;
      if (params.status && params.status !== 'ALL') {
        filtered = filtered.filter(o => o.status === params.status);
      }
      if (params.paymentStatus && params.paymentStatus !== 'ALL') {
        filtered = filtered.filter(o => o.paymentStatus === params.paymentStatus);
      }
      if (params.paymentMethod && params.paymentMethod !== 'ALL') {
        filtered = filtered.filter(o => o.paymentMethod === params.paymentMethod);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(o =>
          (o.code && o.code.toLowerCase().includes(q)) ||
          (o.fullName && o.fullName.toLowerCase().includes(q)) ||
          (o.phone && o.phone.includes(q))
        );
      }

      return {
        success: true,
        data: filtered,
        counts,
        pagination: { page: 1, limit: 50, total: filtered.length, totalPages: 1 }
      };
    }

    // 4. Admin Dashboard Thống kê (GET /api/admin/dashboard & /api/stats)
    if (method === 'GET' && (path === '/api/admin/dashboard' || path === '/api/stats')) {
      const allOrders = getSharedOrders().map(normalizeOrderObject);
      const allProds = getSharedProducts();
      const totalRev = allOrders
        .filter(o => o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0) || 15480000;
      const totalDep = allOrders
        .filter(o => o.paymentMethod === 'DEPOSIT' && o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + (o.depositAmount || 0), 0) || 4650000;

      return {
        success: true,
        data: {
          stats: {
            totalRevenue: totalRev,
            totalDeposits: totalDep,
            totalOrders: allOrders.length || 18,
            totalProducts: allProds.length,
            totalCustomers: 45,
            totalSubscribers: 128,
            lowStockProducts: allProds.filter(p => p.stock > 0 && p.stock <= 5).length,
            pendingOrders: allOrders.filter(o => o.status === 'PENDING').length,
            confirmedOrders: allOrders.filter(o => o.status === 'CONFIRMED').length,
            preparingOrders: allOrders.filter(o => o.status === 'PREPARING').length,
            shippingOrders: allOrders.filter(o => o.status === 'SHIPPING').length,
            deliveredOrders: allOrders.filter(o => o.status === 'DELIVERED').length,
            cancelledOrders: allOrders.filter(o => o.status === 'CANCELLED').length
          },
          recentOrders: allOrders.slice(0, 10),
          bestSellers: allProds.slice().sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 5).map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            price: p.price,
            unitsSold: p.soldCount || 25,
            soldCount: p.soldCount || 25,
            revenue: (p.soldCount || 25) * p.price,
            stock: p.stock,
            image: p.image,
            imageUrl: p.image
          }))
        }
      };
    }

    // 5. Khách hàng & Bản tin & Settings trong Admin
    if (method === 'GET' && path === '/api/admin/users') {
      const defaultUsers = [
        { userId: 1, fullName: 'Đỗ Quốc Thịnh', email: 'quocthinh.admin@minigt.vn', phone: '0988164164', address: 'Biên Hòa, Đồng Nai', totalOrders: 12, totalSpent: 8450000, role: 'admin', isActive: true, createdAt: '2026-01-15T08:00:00Z' },
        { userId: 2, fullName: 'Nguyễn Đình Nam', email: 'dinhnam.admin@minigt.vn', phone: '0977164164', address: 'Biên Hòa, Đồng Nai', totalOrders: 9, totalSpent: 6200000, role: 'admin', isActive: true, createdAt: '2026-01-16T09:30:00Z' },
        { userId: 3, fullName: 'Trần Minh Quân', email: 'minhquan.collector@gmail.com', phone: '0912345678', address: 'Quận 1, TP. Hồ Chí Minh', totalOrders: 5, totalSpent: 2450000, role: 'customer', isActive: true, createdAt: '2026-03-10T14:20:00Z' },
        { userId: 4, fullName: 'Lê Hoàng Long', email: 'hoanglong.diecast@gmail.com', phone: '0938112233', address: 'TP. Thủ Dầu Một, Bình Dương', totalOrders: 3, totalSpent: 1380000, role: 'customer', isActive: true, createdAt: '2026-04-02T11:10:00Z' }
      ];
      let users = defaultUsers;
      try {
        const saved = localStorage.getItem(SHARED_USERS_KEY);
        if (saved) users = JSON.parse(saved);
        else localStorage.setItem(SHARED_USERS_KEY, JSON.stringify(defaultUsers));
      } catch (e) {}
      if (params.search) {
        const q = params.search.toLowerCase();
        users = users.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      return { success: true, data: users };
    }

    const userStatusMatch = path.match(/^\/api\/admin\/users\/(\d+)\/(status|role)$/);
    if (method === 'PUT' && userStatusMatch) {
      return { success: true, message: 'Đã cập nhật thông tin tài khoản thành công!' };
    }

    if (method === 'GET' && path === '/api/admin/subscribers') {
      const subs = [
        { SubscriberId: 1, Email: 'collector.bienhoa@gmail.com', CreatedAt: '2026-05-01T08:30:00Z' },
        { SubscriberId: 2, Email: 'lbwk.fanclub.vn@gmail.com', CreatedAt: '2026-05-12T10:15:00Z' },
        { SubscriberId: 3, Email: 'porsche.gt3.vietnam@gmail.com', CreatedAt: '2026-06-02T16:40:00Z' }
      ];
      return { success: true, data: subs };
    }

    if (method === 'DELETE' && path.startsWith('/api/admin/subscribers/')) {
      return { success: true, message: 'Đã xóa email khỏi danh sách bản tin' };
    }

    if (method === 'GET' && (path === '/api/settings' || path === '/api/admin/settings')) {
      const defaultSet = {
        store_name: 'MINI GT STORE Biên Hòa',
        store_hotline: '0988164164',
        store_email: 'contact@minigtstore.vn',
        store_address: '38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai',
        shipping_fee: 11000,
        low_stock_threshold: 5,
        bank_id: 'MB',
        bank_name: 'MBBank (Ngân Hàng Quân Đội)',
        bank_account_no: '87654321082007',
        bank_account_name: 'DO QUOC THINH',
        preorder_deadline: '2026-10-30',
        announcement: 'Đợt mở đặt trước toàn cầu: Liberty Walk LBWK, GT3 IMSA, F1 Red Bull & Secret Chase'
      };
      try {
        const raw = localStorage.getItem(SHARED_SETTINGS_KEY);
        if (raw) return { success: true, data: Object.assign({}, defaultSet, JSON.parse(raw)) };
      } catch (e) {}
      return { success: true, data: defaultSet };
    }

    if (method === 'PUT' && path === '/api/admin/settings') {
      try {
        localStorage.setItem(SHARED_SETTINGS_KEY, JSON.stringify(body));
      } catch (e) {}
      emitRealtimeSync('SETTINGS_UPDATED', body);
      return { success: true, message: 'Đã lưu thiết lập cửa hàng thành công!', data: body };
    }

    // 6. Health Check (GET /api/health)
    if (method === 'GET' && path === '/api/health') {
      return { success: true, message: 'Local storage & Live sync engine active', status: 'OK' };
    }

    // 7. Admin cập nhật trạng thái / mã vận đơn SPX / thanh toán
    const adminOrderMatch = path.match(/^\/api\/admin\/orders\/(\d+)\/(status|tracking|confirm-payment|payment|cancel)/);
    if (method === 'PUT' && adminOrderMatch) {
      const oid = Number(adminOrderMatch[1]);
      const action = adminOrderMatch[2];
      const allOrders = getSharedOrders();
      const target = allOrders.find(o => Number(o.id) === oid || Number(o.orderId) === oid);

      if (target) {
        if (action === 'status') {
          target.status = String(body.status || 'CONFIRMED').toUpperCase();
          if (body.trackingCode) target.trackingCode = String(body.trackingCode).trim().toUpperCase();
          if (body.carrier) target.trackingCarrier = body.carrier;
          if (['CONFIRMED', 'PREPARING', 'SHIPPING'].includes(target.status) && target.paymentStatus === 'UNPAID') {
            target.paymentStatus = target.paymentMethod === 'DEPOSIT' ? 'PARTIALLY_PAID' : (target.paymentMethod === 'BANK_TRANSFER' ? 'PAID' : 'UNPAID');
          }
        } else if (action === 'tracking') {
          target.trackingCode = String(body.trackingCode || '').trim().toUpperCase();
          target.trackingCarrier = body.carrier || 'SPX Express';
          if (body.autoShip) {
            target.status = 'SHIPPING';
          } else if (target.status === 'PENDING') {
            target.status = 'CONFIRMED';
          }
        } else if (action === 'confirm-payment' || action === 'payment') {
          target.paymentStatus = body.kind === 'deposit' ? 'PARTIALLY_PAID' : 'PAID';
          if (target.status === 'PENDING') target.status = 'CONFIRMED';
        } else if (action === 'cancel') {
          target.status = 'CANCELLED';
          target.cancelReason = body.cancelReason || 'Admin hủy đơn';
        }
        target.updatedAt = new Date().toISOString();
        const saved = upsertSharedOrder(target);
        emitRealtimeSync('ORDER_UPDATED', saved);
        return {
          success: true,
          message: 'Đã cập nhật đơn hàng thành công!',
          data: saved
        };
      }
    }

    // 8. Khách hàng kiểm tra trạng thái đơn / danh sách đơn của tôi / tra cứu
    if (method === 'GET' && path.startsWith('/api/orders/')) {
      const allOrders = getSharedOrders().map(normalizeOrderObject);

      if (path.startsWith('/api/orders/my-orders')) {
        const myCodes = getMyOrderCodes();
        const myOrders = allOrders.filter(o => myCodes.includes(o.code));
        return { success: true, data: myOrders.length > 0 ? myOrders : allOrders };
      }

      const checkMatch = path.match(/\/api\/orders\/(?:check-status|track)\/([^?]+)/);
      if (checkMatch) {
        const q = decodeURIComponent(checkMatch[1]).trim().toUpperCase();
        const matched = allOrders.filter(o =>
          (o.code && o.code.toUpperCase() === q) ||
          (o.phone && o.phone.includes(q)) ||
          (o.trackingCode && o.trackingCode.toUpperCase() === q)
        );
        if (path.includes('/check-status/')) {
          return matched[0] ? { success: true, data: matched[0] } : { success: false, data: null };
        }
        return { success: true, data: matched };
      }

      const detailMatch = path.match(/^\/api\/orders\/([^/?]+)$/);
      if (detailMatch) {
        const code = decodeURIComponent(detailMatch[1]).trim().toUpperCase();
        const found = allOrders.find(o => o.code && o.code.toUpperCase() === code);
        if (found) return { success: true, data: found };
      }
    }

    // 9. Khách hàng cập nhật địa chỉ / xác nhận đã nhận hàng / hủy đơn
    const custActionMatch = path.match(/^\/api\/orders\/([^/]+)\/(cancel|confirm-received|shipping-info)/);
    if (method === 'PUT' && custActionMatch) {
      const code = decodeURIComponent(custActionMatch[1]).trim().toUpperCase();
      const act = custActionMatch[2];
      const allOrders = getSharedOrders();
      const target = allOrders.find(o => o.code && o.code.toUpperCase() === code);
      if (target) {
        if (act === 'cancel') {
          target.status = 'CANCELLED';
          target.cancelReason = body.reason || 'Khách hàng yêu cầu hủy đơn';
        } else if (act === 'confirm-received') {
          target.status = 'DELIVERED';
          target.paymentStatus = 'PAID';
        } else if (act === 'shipping-info') {
          if (body.fullName) target.fullName = body.fullName;
          if (body.phone) target.phone = body.phone;
          if (body.address) target.address = body.address;
          if (body.city) target.city = body.city;
          if (body.district) target.district = body.district;
          if (body.note !== undefined) target.note = body.note;
        }
        target.updatedAt = new Date().toISOString();
        const saved = upsertSharedOrder(target);
        emitRealtimeSync('ORDER_UPDATED', saved);
        return { success: true, message: 'Cập nhật đơn hàng thành công!', data: saved };
      }
    }

    return null;
  };

  async function request(endpoint, options = {}) {
    const fullUrl = endpoint.startsWith('http') ? endpoint : (API_BASE + endpoint);
    const method = (options.method || 'GET').toUpperCase();
    const headers = Object.assign({
      'Accept': 'application/json'
    }, options.headers || {});

    const token = getToken(endpoint);
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const rawBody = options.body;
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const config = Object.assign({}, options, { headers });

    let response;
    try {
      response = await fetch(fullUrl, config);
    } catch (netErr) {
      const fallbackResult = handleOfflineFallback(endpoint, { method, body: rawBody });
      if (fallbackResult) {
        return fallbackResult;
      }
      console.error('[API NETWORK ERROR]:', netErr);
      throw new ApiError('Không thể kết nối đến máy chủ.', 0, 'NETWORK_ERROR');
    }

    if (!response.ok) {
      // Nếu chạy qua Live Server (127.0.0.1:5500) hoặc token offline, tự động chuyển qua Local Engine
      const fallbackResult = handleOfflineFallback(endpoint, { method, body: rawBody });
      if (fallbackResult) {
        return fallbackResult;
      }
    }

    const contentType = response.headers.get('content-type') || '';
    let data = null;

    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonErr) {
        data = { success: false, message: 'Dữ liệu máy chủ trả về không đúng định dạng JSON' };
      }
    } else {
      const fallbackResult = handleOfflineFallback(endpoint, { method, body: rawBody });
      if (fallbackResult) return fallbackResult;
      const text = await response.text();
      data = {
        success: response.ok,
        message: text.slice(0, 300) || (response.ok ? 'Thành công' : `Lỗi HTTP: ${response.status}`),
        data: null
      };
    }

    if (!response.ok) {
      const errorMsg = data && (data.message || data.error) ? (data.message || data.error) : `Lỗi máy chủ (${response.status})`;
      throw new ApiError(errorMsg, response.status, data.code || 'API_ERROR', data.details || null);
    }

    // Nếu lấy danh sách sản phẩm từ backend, chuẩn hóa luôn Giá Box / Giá Card & % Giảm giá
    if (method === 'GET' && endpoint.includes('/products') && data && Array.isArray(data.data)) {
      data.data = data.data.map(normalizeProductObject);
    } else if (endpoint.includes('/products/') && data && data.data && typeof data.data === 'object') {
      data.data = normalizeProductObject(data.data);
    }

    syncOrderSideEffects(endpoint, method, data);

    return data;
  }

  const api = {
    BASE_URL: API_BASE,
    ApiError,
    getToken,
    getCurrentUser,
    setAuthSession,
    clearAuthSession,
    getSharedOrders,
    upsertSharedOrder,
    getSharedProducts,
    saveSharedProducts,
    normalizeProductObject,
    getMyOrderCodes,
    addMyOrderCode,
    emitRealtimeSync,
    normalizeOrderObject,

    get(url, params = {}) {
      let finalUrl = url;
      const query = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      if (query) {
        finalUrl += (url.includes('?') ? '&' : '?') + query;
      }
      return request(finalUrl, { method: 'GET' });
    },

    post(url, body = {}) {
      return request(url, { method: 'POST', body });
    },

    put(url, body = {}) {
      return request(url, { method: 'PUT', body });
    },

    patch(url, body = {}) {
      return request(url, { method: 'PATCH', body });
    },

    delete(url) {
      return request(url, { method: 'DELETE' });
    }
  };

  global.api = api;
})(typeof window !== 'undefined' ? window : this);
