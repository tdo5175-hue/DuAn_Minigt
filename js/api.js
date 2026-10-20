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
  const isLocalEnvironment = () => {
    if (!global.location) return false;
    const h = (global.location.hostname || '').toLowerCase();
    return h === 'localhost' ||
           h === '127.0.0.1' ||
           h === '0.0.0.0' ||
           h.startsWith('192.168.') ||
           h.startsWith('10.') ||
           h.endsWith('.local') ||
           global.location.protocol === 'file:';
  };

  const isDirectNodeServer = () => {
    try {
      if (!global.location) return false;
      if (String(global.location.port) === '5000') return true;
      if (localStorage.getItem('minigt_connect_port_5000') === 'true') return true;
      if (global.MINIGT_API_BASE) return true;
      return false;
    } catch (e) {
      return false;
    }
  };

  const getApiBase = () => {
    if (global.MINIGT_API_BASE) return global.MINIGT_API_BASE.replace(/\/+$/, '');
    
    // Nếu chạy cục bộ / Live Server trên máy cá nhân
    if (isLocalEnvironment()) {
      return 'http://localhost:5000';
    }

    // Khi deploy lên cloud production (Render / Vercel)
    return 'https://duan-nhom2.onrender.com';
  };

  const API_BASE = getApiBase();
  let localServerOffline = null;
  const SHARED_ORDERS_KEY = 'minigt_shared_orders_v2';
  const SHARED_PRODUCTS_KEY = 'minigt_products_catalog_v4_canonical';
  const SHARED_CATEGORIES_KEY = 'minigt_shared_categories_v2';
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
  // DỮ LIỆU TÀI KHOẢN HỘI VIÊN & QUẢN TRỊ (SHARED USERS DATABASE)
  // =====================================================================
  const DEFAULT_USERS_DATA = [
    {
      userId: 1,
      id: 1,
      fullName: 'Đỗ Quốc Thịnh',
      email: 'quocthinh.admin@minigt.vn',
      phone: '0988164164',
      address: '38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai',
      totalOrders: 12,
      totalSpent: 8450000,
      role: 'admin',
      tier: 'Quản Trị Viên',
      points: 9999,
      password: 'admin',
      isActive: true,
      avatarUrl: 'image/DoQuocThinh_anhthe.jpg',
      createdAt: '2026-01-15T08:00:00Z'
    },
    {
      userId: 2,
      id: 2,
      fullName: 'Nguyễn Đình Nam',
      email: 'dinhnam.admin@minigt.vn',
      phone: '0977164164',
      address: 'Biên Hòa, Đồng Nai',
      totalOrders: 9,
      totalSpent: 6200000,
      role: 'admin',
      tier: 'Quản Trị Viên',
      points: 9999,
      password: 'admin',
      isActive: true,
      avatarUrl: 'image/Anh_The_Dinh_Nam.jpg',
      createdAt: '2026-01-16T09:30:00Z'
    },
    {
      userId: 3,
      id: 3,
      fullName: 'Trần Minh Quân',
      email: 'minhquan.collector@gmail.com',
      phone: '0912345678',
      address: 'Quận 1, TP. Hồ Chí Minh',
      totalOrders: 5,
      totalSpent: 2450000,
      role: 'customer',
      tier: 'Gold Collector',
      points: 350,
      password: '123',
      isActive: true,
      avatarUrl: 'image/anh-clone.jpg',
      createdAt: '2026-03-10T14:20:00Z'
    },
    {
      userId: 4,
      id: 4,
      fullName: 'Lê Hoàng Long',
      email: 'hoanglong.diecast@gmail.com',
      phone: '0938112233',
      address: 'TP. Thủ Dầu Một, Bình Dương',
      totalOrders: 3,
      totalSpent: 1380000,
      role: 'customer',
      tier: 'Collector',
      points: 150,
      password: '123',
      isActive: true,
      avatarUrl: 'image/anh-clone.jpg',
      createdAt: '2026-04-02T11:10:00Z'
    },
    {
      userId: 5,
      id: 5,
      fullName: 'VIP Collector Biên Hòa',
      email: 'collector@gmail.com',
      phone: '0988123456',
      address: '123 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai',
      totalOrders: 8,
      totalSpent: 4500000,
      role: 'customer',
      tier: 'Diamond Member',
      points: 500,
      password: '123456',
      isActive: true,
      avatarUrl: 'image/anh-clone.jpg',
      createdAt: '2026-04-10T10:00:00Z'
    },
    {
      userId: 6,
      id: 6,
      fullName: 'AO Racing Fan Club',
      email: 'rexy.fan@gmail.com',
      phone: '0909686868',
      address: '45 Nguyễn Ái Quốc, P. Tân Phong, TP. Biên Hòa',
      totalOrders: 4,
      totalSpent: 2150000,
      role: 'customer',
      tier: 'Gold Collector',
      points: 280,
      password: '123456',
      isActive: true,
      avatarUrl: 'image/anh-clone.jpg',
      createdAt: '2026-05-01T15:30:00Z'
    }
  ];

  const getSharedUsers = () => {
    try {
      const saved = localStorage.getItem(SHARED_USERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem(SHARED_USERS_KEY, JSON.stringify(DEFAULT_USERS_DATA));
      return DEFAULT_USERS_DATA;
    } catch (e) {
      return DEFAULT_USERS_DATA;
    }
  };

  const saveSharedUsers = (users) => {
    try {
      localStorage.setItem(SHARED_USERS_KEY, JSON.stringify(users));
      emitRealtimeSync('users_updated', { count: users.length });
    } catch (e) {
      console.warn('Không thể lưu users vào localStorage:', e);
    }
  };

  // =====================================================================
  // DANH MỤC MẶC ĐỊNH & CHUẨN HÓA SẢN PHẨM (BOX vs CARD + GIẢM TRỰC TIẾP %)
  // =====================================================================
  const DEFAULT_CATEGORIES_DATA = [
    { id: 1, CategoryId: 1, slug: 'liberty-walk', Slug: 'liberty-walk', name: 'Liberty Walk LBWK', Name: 'Liberty Walk LBWK', description: 'Phong cách độ thân rộng Widebody huyền thoại từ Nhật Bản', sortOrder: 1, SortOrder: 1, imageUrl: 'image/Minigt_Lambo_LBWK.jpg' },
    { id: 2, CategoryId: 2, slug: 'f1-racing', Slug: 'f1-racing', name: 'Formula 1 Racing', Name: 'Formula 1 Racing', description: 'Xe đua Công thức 1 bản quyền chính thức các đội đua hàng đầu', sortOrder: 2, SortOrder: 2, imageUrl: 'image/f1_redbull.jpg' },
    { id: 3, CategoryId: 3, slug: 'gt-racing', Slug: 'gt-racing', name: 'IMSA & GT3 Racing', Name: 'IMSA & GT3 Racing', description: 'Những chiến binh đường đua sức bền 24h & AO Racing', sortOrder: 3, SortOrder: 3, imageUrl: 'image/roxy_rexy_minigt.webp' },
    { id: 4, CategoryId: 4, slug: 'box-sets', Slug: 'box-sets', name: 'Box Sets & Combo', Name: 'Box Sets & Combo', description: 'Bộ sưu tập nhiều xe và hộp quà giới hạn đặc biệt', sortOrder: 4, SortOrder: 4, imageUrl: 'image/huracan.webp' },
    { id: 5, CategoryId: 5, slug: 'partner', Slug: 'partner', name: 'Pop Race & Secret Chase', Name: 'Pop Race & Secret Chase', description: 'Thương hiệu đối tác: Pop Race, Kaido House & Secret Chase 1/24', sortOrder: 5, SortOrder: 5, imageUrl: 'image/Poprace_Supra_Secret.webp' }
  ];

  const getSharedCategories = () => {
    try {
      const raw = localStorage.getItem(SHARED_CATEGORIES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    try {
      localStorage.setItem(SHARED_CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES_DATA));
    } catch (e) {}
    return DEFAULT_CATEGORIES_DATA;
  };

  const saveSharedCategories = (cats) => {
    try {
      localStorage.setItem(SHARED_CATEGORIES_KEY, JSON.stringify(cats));
    } catch (e) {}
    return cats;
  };

  const CATEGORY_MAP = {
    1: { id: 1, name: 'Liberty Walk LBWK', slug: 'liberty-walk' },
    2: { id: 2, name: 'Formula 1 Racing', slug: 'f1-racing' },
    3: { id: 3, name: 'IMSA & GT3 Racing', slug: 'gt-racing' },
    4: { id: 4, name: 'Box Sets & Combo', slug: 'box-sets' },
    5: { id: 5, name: 'Pop Race & Secret Chase', slug: 'partner' }
  };

  const DEFAULT_CATALOG_PRODUCTS = [
    {
      id: 1, ProductId: 1, Sku: 'MGTS0026', CarNumber: 'S026',
      Name: 'Lamborghini Huracán Sterrato All-Terrain Set (Box 4 xe)',
      CategoryId: 4, CategorySlug: 'box-sets', CategoryName: 'Box Sets & Combo',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 1850000, PriceCard: 1850000, DiscountPercent: 0, PackagingType: 'box_only',
      DepositAmount: 500000, QuotaPercent: 92, EditionNote: 'Box Set Đặc Biệt (Giới hạn 3000 bộ)',
      PreOrderDeadline: '2026-10-30', Stock: 15,
      ImageUrl: 'image/lambo-sterrato-set.png',
      Description: 'Bộ 4 xe Lamborghini Huracán Sterrato địa hình kèm hộp trưng bày Collector Box cao cấp chính hãng TSM-Model.',
      Status: 'pre_order', IsFeatured: 1, IsNew: 1, soldCount: 38
    },
    {
      id: 2, ProductId: 2, Sku: 'MGT01413', CarNumber: '1413',
      Name: 'Aston Martin AMR24 #18 Lance Stroll 2024 F1 Las Vegas GP',
      CategoryId: 2, CategorySlug: 'f1-racing', CategoryName: 'Formula 1 Racing',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 420000, PriceCard: 480000, DiscountPercent: 10, PackagingType: 'both',
      DepositAmount: 150000, QuotaPercent: 88, EditionNote: 'Kèm Figure Tay Đua F1 Las Vegas',
      PreOrderDeadline: '2026-10-30', Stock: 25,
      ImageUrl: 'image/aston-amr24-stroll.png',
      Description: 'Mô hình xe đua F1 Aston Martin AMR24 #18 chặng Las Vegas GP 2024, sơn xanh Racing Green ánh kim tuyệt đẹp.',
      Status: 'pre_order', IsFeatured: 1, IsNew: 1, soldCount: 34
    },
    {
      id: 3, ProductId: 3, Sku: 'MGT01396', CarNumber: '1396',
      Name: 'Aston Martin AMR24 #14 Fernando Alonso 2024 F1 Las Vegas GP',
      CategoryId: 2, CategorySlug: 'f1-racing', CategoryName: 'Formula 1 Racing',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 420000, PriceCard: 480000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 150000, QuotaPercent: 95, EditionNote: 'Bản Đua Đêm Las Vegas GP',
      PreOrderDeadline: '2026-10-30', Stock: 18,
      ImageUrl: 'image/aston-amr24-alonso.png',
      Description: 'Phiên bản xe đua F1 của huyền thoại Fernando Alonso #14 tại chặng đua đêm Las Vegas 2024.',
      Status: 'pre_order', IsFeatured: 1, IsNew: 1, soldCount: 29
    },
    {
      id: 4, ProductId: 4, Sku: 'MGT00550', CarNumber: '550',
      Name: 'Oracle Red Bull Racing RB18 #1 Max Verstappen 2022 Monaco GP',
      CategoryId: 2, CategorySlug: 'f1-racing', CategoryName: 'Formula 1 Racing',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 420000, PriceCard: 480000, DiscountPercent: 10, PackagingType: 'both',
      DepositAmount: 0, QuotaPercent: 100, EditionNote: 'World Champion Edition • Box & Card',
      PreOrderDeadline: null, Stock: 14,
      ImageUrl: 'image/f1_redbull.jpg',
      Description: 'Chiếc xe vô địch thế giới F1 Red Bull RB18 #1 của Max Verstappen với chi tiết khí động học tỉ lệ 1:64 sắc nét.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 1, soldCount: 52
    },
    {
      id: 5, ProductId: 5, Sku: 'MGT01055', CarNumber: '1055',
      Name: 'LB★WORKS Lamborghini Huracán GT Gravity Racing #5',
      CategoryId: 1, CategorySlug: 'liberty-walk', CategoryName: 'Liberty Walk LBWK',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 350000, PriceCard: 410000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 0, QuotaPercent: 82, EditionNote: 'Liberty Walk Widebody #5',
      PreOrderDeadline: null, Stock: 22,
      ImageUrl: 'image/mgt01055.webp',
      Description: 'Siêu phẩm độ thân rộng Liberty Walk Lamborghini Huracán GT màu tím xanh Gravity Racing cực kỳ nổi bật.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 1, soldCount: 46
    },
    {
      id: 6, ProductId: 6, Sku: 'MGT01143', CarNumber: '1143',
      Name: 'Porsche 911 GT3 R #77 AO Racing "Skeleton" 2024 IMSA Petit Le Mans',
      CategoryId: 3, CategorySlug: 'gt-racing', CategoryName: 'IMSA & GT3 Racing',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 390000, PriceCard: 470000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 150000, QuotaPercent: 89, EditionNote: 'Bản Giới Hạn Halloween Skeleton #77',
      PreOrderDeadline: '2026-10-30', Stock: 20,
      ImageUrl: 'image/ske.webp',
      Description: 'Phiên bản giới hạn Halloween Petit Le Mans với đồ họa bộ xương khủng long Rexy trên nền đen mờ.',
      Status: 'pre_order', IsFeatured: 1, IsNew: 1, soldCount: 42
    },
    {
      id: 7, ProductId: 7, Sku: 'MGT01093', CarNumber: '1093',
      Name: 'Porsche 911 GT3 R #77 AO Racing "Roxy" 2024 IMSA Road America',
      CategoryId: 3, CategorySlug: 'gt-racing', CategoryName: 'IMSA & GT3 Racing',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 360000, PriceCard: 420000, DiscountPercent: 5, PackagingType: 'both',
      DepositAmount: 0, QuotaPercent: 94, EditionNote: 'Khủng Long Hồng Roxy #77',
      PreOrderDeadline: null, Stock: 12,
      ImageUrl: 'image/Roxy.webp',
      Description: 'Mẫu Porsche 911 GT3 R khủng long hồng Roxy #77 siêu hot của đội đua AO Racing tại giải IMSA.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 1, soldCount: 38
    },
    {
      id: 8, ProductId: 8, Sku: 'MGT00782', CarNumber: '782',
      Name: 'Porsche 911 GT3 R #80 AO Racing "Rexy" 2023 IMSA Sebring 12h',
      CategoryId: 3, CategorySlug: 'gt-racing', CategoryName: 'IMSA & GT3 Racing',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 380000, PriceCard: 450000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 0, QuotaPercent: 96, EditionNote: 'Khủng Long Xanh Rexy #80 Best-Seller',
      PreOrderDeadline: null, Stock: 8,
      ImageUrl: 'image/rexy.jpg',
      Description: 'Huyền thoại khủng long xanh Rexy #80 AO Racing được săn đón nhất trong giới sưu tầm MINI GT 1:64.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: 65
    },
    {
      id: 9, ProductId: 9, Sku: 'MGT01129', CarNumber: '1129',
      Name: 'Lamborghini Huracán GT3 EVO2 #45 DEX Imaging 2024 IMSA Daytona 24h',
      CategoryId: 3, CategorySlug: 'gt-racing', CategoryName: 'IMSA & GT3 Racing',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 330000, PriceCard: 390000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 0, QuotaPercent: 75, EditionNote: 'Đua Sức Bền Daytona 24 Hours',
      PreOrderDeadline: null, Stock: 19,
      ImageUrl: 'image/Minigt_Lambo_GT3.jpg',
      Description: 'Mẫu xe đua Lamborghini Huracán GT3 EVO2 tham chiến giải đua sức bền 24 Giờ Daytona 2024.',
      Status: 'in_stock', IsFeatured: 0, IsNew: 1, soldCount: 22
    },
    {
      id: 10, ProductId: 10, Sku: 'MGT00465', CarNumber: '465',
      Name: 'LB-Super Silhouette Nissan S15 Silvia Presentation',
      CategoryId: 1, CategorySlug: 'liberty-walk', CategoryName: 'Liberty Walk LBWK',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 320000, PriceCard: 370000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 0, QuotaPercent: 90, EditionNote: 'Liberty Walk Group 5 Silhouette',
      PreOrderDeadline: null, Stock: 16,
      ImageUrl: 'image/Minigt_s15chop_lbwk.jpg',
      Description: 'Biểu tượng JDM Nissan Silvia S15 độ bodykit Super Silhouette hầm hố từ nhà độ Liberty Walk Nhật Bản.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: 58
    },
    {
      id: 11, ProductId: 11, Sku: 'MGT00618', CarNumber: '618',
      Name: 'LB-Super Silhouette Nissan S15 Silvia #23 2022 Goodwood Festival of Speed',
      CategoryId: 1, CategorySlug: 'liberty-walk', CategoryName: 'Liberty Walk LBWK',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 340000, PriceCard: 400000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 0, QuotaPercent: 95, EditionNote: 'Kỷ Niệm Lễ Hội Tốc Độ Goodwood #23',
      PreOrderDeadline: null, Stock: 9,
      ImageUrl: 'image/Minigt_S15_LBWK.jpg',
      Description: 'Phiên bản kỷ niệm màn trình diễn drift của chiếc S15 #23 tại lễ hội tốc độ Goodwood Vương Quốc Anh.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: 44
    },
    {
      id: 12, ProductId: 12, Sku: 'PR640325', CarNumber: '325',
      Name: 'Pop Race Top Secret GT300 Toyota Supra (A80) Silver Chrome',
      CategoryId: 5, CategorySlug: 'partner', CategoryName: 'Pop Race & Secret Chase',
      Brand: 'Pop Race', Scale: '1:64',
      PriceBox: 480000, PriceCard: 480000, DiscountPercent: 0, PackagingType: 'box_only',
      DepositAmount: 0, QuotaPercent: 92, EditionNote: 'Secret Chase 1/24 • Mở Nắp Ca-pô Động Cơ 2JZ',
      PreOrderDeadline: null, Stock: 11,
      ImageUrl: 'image/Poprace_Supra_Secret.webp',
      Description: 'Phiên bản mạ Chrome bạc đặc biệt của Top Secret Supra GT300, mở được nắp ca-pô chiêm ngưỡng khối động cơ 2JZ.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 1, soldCount: 40
    },
    {
      id: 13, ProductId: 13, Sku: 'PR640118', CarNumber: '118',
      Name: 'Pop Race Nissan Skyline GT-R V8 Drift (Hakosuka) Red Metallic',
      CategoryId: 5, CategorySlug: 'partner', CategoryName: 'Pop Race & Secret Chase',
      Brand: 'Pop Race', Scale: '1:64',
      PriceBox: 450000, PriceCard: 450000, DiscountPercent: 0, PackagingType: 'box_only',
      DepositAmount: 0, QuotaPercent: 86, EditionNote: 'Tháo Rời Nắp Máy Động Cơ V8',
      PreOrderDeadline: null, Stock: 14,
      ImageUrl: 'image/Poprace_Lambo_Secret.webp',
      Description: 'Huyền thoại Hakosuka độ Drift động cơ V8 của Pop Race với sơn đỏ Metallic và bánh lốp cao su thật.',
      Status: 'in_stock', IsFeatured: 0, IsNew: 1, soldCount: 26
    },
    {
      id: 14, ProductId: 14, Sku: 'TH640012', CarNumber: 'KH12',
      Name: 'Toyota Yaris WRC #18 Katsuta Takamoto Rally Japan Acrylic Case',
      CategoryId: 5, CategorySlug: 'partner', CategoryName: 'Pop Race & Secret Chase',
      Brand: 'Kaido House', Scale: '1:64',
      PriceBox: 500000, PriceCard: 500000, DiscountPercent: 10, PackagingType: 'box_only',
      DepositAmount: 0, QuotaPercent: 80, EditionNote: 'Kèm Đế Da & Hộp Mica Trưng Bày',
      PreOrderDeadline: null, Stock: 10,
      ImageUrl: 'image/TH_LamboUltraman.jpg',
      Description: 'Mô hình xe đua địa hình WRC Toyota Yaris kèm đế trưng bày và hộp chống bụi Acrylic sang trọng.',
      Status: 'in_stock', IsFeatured: 0, IsNew: 1, soldCount: 31
    },
    {
      id: 15, ProductId: 15, Sku: 'MGTS0019', CarNumber: 'S019',
      Name: 'Combo 2 Xe Porsche 911 GT3 R AO Racing Rexy #80 & Roxy #77 Twin Pack',
      CategoryId: 4, CategorySlug: 'box-sets', CategoryName: 'Box Sets & Combo',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 750000, PriceCard: 870000, DiscountPercent: 5, PackagingType: 'both',
      DepositAmount: 0, QuotaPercent: 95, EditionNote: 'Combo Rexy + Roxy Tiết Kiệm',
      PreOrderDeadline: null, Stock: 6,
      ImageUrl: 'image/roxy-rexy-2.webp',
      Description: 'Bộ đôi khủng long đường đua Rexy #80 (Xanh) và Roxy #77 (Hồng) đóng gói Combo 2 xe ưu đãi.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 1, soldCount: 35
    },
    {
      id: 16, ProductId: 16, Sku: 'MGT00642', CarNumber: '642',
      Name: 'Red Bull RB18 #11 Sergio Perez & RB18 #1 Verstappen Pit Crew Box Set',
      CategoryId: 4, CategorySlug: 'box-sets', CategoryName: 'Box Sets & Combo',
      Brand: 'TSM-Model', Scale: '1:64',
      PriceBox: 1150000, PriceCard: 1150000, DiscountPercent: 0, PackagingType: 'box_only',
      DepositAmount: 0, QuotaPercent: 88, EditionNote: 'Set 2 Xe F1 + Đội Kỹ Thuật Pit Stop',
      PreOrderDeadline: null, Stock: 7,
      ImageUrl: 'image/f1-redbull-live.webp',
      Description: 'Hộp sa bàn Pit Stop Red Bull Racing gồm 2 xe F1 RB18 và dàn nhân vật kỹ thuật viên thay lốp.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: 27
    },
    {
      id: 17, ProductId: 17, Sku: 'MGT01055-LW', CarNumber: '1055C',
      Name: 'LB★WORKS Lamborghini Huracán GT Gravity (Bản Vỉ Blister Card)',
      CategoryId: 1, CategorySlug: 'liberty-walk', CategoryName: 'Liberty Walk LBWK',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 410000, PriceCard: 410000, DiscountPercent: 0, PackagingType: 'card_only',
      DepositAmount: 0, QuotaPercent: 91, EditionNote: 'Vỉ Nhựa Blister Card Art Nguyên Seal',
      PreOrderDeadline: null, Stock: 12,
      ImageUrl: 'image/minig_lambo_lbwk.webp',
      Description: 'Phiên bản đóng gói Vỉ nhựa cứng Blister Card cao cấp kèm ảnh bìa nghệ thuật Liberty Walk chống cấn góc 100%.',
      Status: 'in_stock', IsFeatured: 0, IsNew: 1, soldCount: 33
    },
    {
      id: 18, ProductId: 18, Sku: 'MGT00688', CarNumber: '688',
      Name: 'LB★WORKS Lamborghini Aventador Limited Edition Matte Black',
      CategoryId: 1, CategorySlug: 'liberty-walk', CategoryName: 'Liberty Walk LBWK',
      Brand: 'MINI GT', Scale: '1:64',
      PriceBox: 380000, PriceCard: 440000, DiscountPercent: 0, PackagingType: 'both',
      DepositAmount: 0, QuotaPercent: 89, EditionNote: 'Siêu Bò Aventador Widebody Đen Nhám',
      PreOrderDeadline: null, Stock: 10,
      ImageUrl: 'image/Minigt_Lambo_LBWK.jpg',
      Description: 'Siêu bò Lamborghini Aventador độ thân rộng LB★WORKS màu đen nhám kết hợp cánh gió GT cỡ lớn.',
      Status: 'in_stock', IsFeatured: 1, IsNew: 0, soldCount: 30
    }
  ];

  // Hàm chuẩn hóa sản phẩm: tính toán trực tiếp giá sau giảm từ % giảm giá cho cả Box và Card
  const normalizeProductObject = (raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const id = Number(raw.id || raw.ProductId || Date.now());
    const sku = String(raw.sku || raw.Sku || `MGT${id}`).trim();
    const name = String(raw.name || raw.Name || 'Mô hình MINI GT 1:64').trim();
    const catId = Number(raw.categoryId || raw.CategoryId || (raw.category && raw.category.id) || 1);
    const allCats = (typeof getSharedCategories === 'function') ? getSharedCategories() : [];
    const foundCat = allCats.find(c => Number(c.id || c.CategoryId) === catId || (c.slug || c.Slug) === String(raw.CategorySlug || raw.categorySlug || '')) || CATEGORY_MAP[catId];
    const catInfo = foundCat ? {
      id: Number(foundCat.id || foundCat.CategoryId || catId),
      name: foundCat.name || foundCat.Name || raw.CategoryName || 'MINI GT 1:64',
      slug: foundCat.slug || foundCat.Slug || raw.CategorySlug || 'liberty-walk'
    } : {
      id: catId,
      name: raw.CategoryName || (raw.category && raw.category.name) || 'MINI GT 1:64',
      slug: raw.CategorySlug || (raw.category && raw.category.slug) || 'liberty-walk'
    };

    const packagingType = raw.packagingType || raw.PackagingType || 'both';

    // Giá gốc Bản Box (Hộp giấy)
    const rawBoxVal = raw.priceBox ?? raw.PriceBox ?? raw.basePriceBox ?? raw.oldPrice ?? raw.OldPrice ?? raw.price ?? raw.Price ?? 320000;
    const basePriceBox = Math.max(50000, Number(rawBoxVal));

    // Giá gốc Bản Card (Vỉ Blister)
    let basePriceCard;
    if (packagingType === 'box_only') {
      basePriceCard = basePriceBox;
    } else if (packagingType === 'card_only') {
      const rawCardVal = raw.priceCard ?? raw.PriceCard ?? raw.basePriceCard ?? raw.price ?? raw.Price;
      basePriceCard = rawCardVal != null ? Number(rawCardVal) : basePriceBox;
    } else {
      const rawCardVal = raw.priceCard ?? raw.PriceCard ?? raw.basePriceCard;
      basePriceCard = rawCardVal != null ? Number(rawCardVal) : basePriceBox + 60000;
    }

    // % giảm giá trực tiếp
    const discountPercent = Math.max(0, Math.min(80, Number(raw.discountPercent ?? raw.DiscountPercent ?? 0)));

    // Giá sau giảm làm tròn đến 1.000đ
    const finalPriceBox = discountPercent > 0
      ? Math.round(((basePriceBox * (100 - discountPercent)) / 100) / 1000) * 1000
      : (raw.finalPriceBox ?? raw.FinalPriceBox ?? (raw.price && !raw.oldPrice ? Number(raw.price) : basePriceBox));
    const finalPriceCard = discountPercent > 0
      ? Math.round(((basePriceCard * (100 - discountPercent)) / 100) / 1000) * 1000
      : (raw.finalPriceCard ?? raw.FinalPriceCard ?? basePriceCard);

    const defaultIsCard = packagingType === 'card_only';
    const effectivePrice = defaultIsCard ? finalPriceCard : finalPriceBox;
    const effectiveOldPrice = discountPercent > 0 ? (defaultIsCard ? basePriceCard : basePriceBox) : (raw.oldPrice ?? raw.OldPrice ?? null);

    const rawStock = Number(raw.stock ?? raw.Stock ?? 10);
    let stockBox = raw.stockBox != null ? Number(raw.stockBox) : (raw.StockBox != null ? Number(raw.StockBox) : (packagingType === 'card_only' ? 0 : Math.ceil(rawStock * 0.6)));
    let stockCard = raw.stockCard != null ? Number(raw.stockCard) : (raw.StockCard != null ? Number(raw.StockCard) : (packagingType === 'box_only' ? 0 : Math.floor(rawStock * 0.4)));
    if (packagingType === 'box_only') stockCard = 0;
    if (packagingType === 'card_only') stockBox = 0;
    const stock = stockBox + stockCard || rawStock;

    const hasBox = packagingType !== 'card_only' && stockBox > 0;
    const hasCard = packagingType !== 'box_only' && stockCard > 0;

    let status = String(raw.status || raw.Status || 'in_stock').toLowerCase();
    if (stock <= 0 && status !== 'pre_order') status = 'sold_out';

    const image = raw.image || raw.imageUrl || raw.ImageUrl || 'image/hero-banner.jpg';
    let depositPercent = Math.max(0, Math.min(100, Number(raw.depositPercent ?? raw.DepositPercent ?? 0)));
    let depositAmount = Number(raw.depositAmount ?? raw.DepositAmount ?? 0);
    if (status === 'pre_order') {
      if (depositPercent <= 0 && depositAmount > 0 && effectivePrice > 0) {
        depositPercent = Math.min(100, Math.max(10, Math.round((depositAmount / effectivePrice) * 100)));
      } else if (depositPercent <= 0) {
        depositPercent = 30;
      }
      if (depositAmount <= 0) {
        depositAmount = Math.round(((effectivePrice * depositPercent) / 100) / 1000) * 1000;
      }
    } else {
      depositPercent = 0;
      depositAmount = 0;
    }
    const expectedDelivery = raw.expectedDelivery ?? raw.ExpectedDelivery ?? null;
    const editionNote = raw.editionNote ?? raw.EditionNote ?? '';
    const preOrderDeadline = raw.preOrderDeadline ?? raw.PreOrderDeadline ?? null;
    const brand = raw.brand || raw.Brand || 'MINI GT';
    const scale = raw.scale || raw.Scale || '1:64';
    const description = raw.description || raw.Description || '';
    const isFeatured = Boolean(raw.isFeatured ?? raw.IsFeatured);
    const isNew = Boolean(raw.isNew ?? raw.IsNew);
    const carNumber = raw.carNumber || raw.CarNumber || sku.replace(/\D/g, '').replace(/^0+/, '') || '64';

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
      priceBox: basePriceBox,
      PriceBox: basePriceBox,
      priceCard: basePriceCard,
      PriceCard: basePriceCard,
      discountPercent,
      DiscountPercent: discountPercent,
      hasDiscount: discountPercent > 0,
      HasDiscount: discountPercent > 0,
      finalPriceBox,
      FinalPriceBox: finalPriceBox,
      finalPriceCard,
      FinalPriceCard: finalPriceCard,
      price: effectivePrice,
      Price: effectivePrice,
      oldPrice: effectiveOldPrice,
      OldPrice: effectiveOldPrice,
      depositPercent,
      DepositPercent: depositPercent,
      depositAmount,
      DepositAmount: depositAmount,
      expectedDelivery,
      ExpectedDelivery: expectedDelivery,
      editionNote,
      EditionNote: editionNote,
      preOrderDeadline,
      PreOrderDeadline: preOrderDeadline,
      stockBox,
      StockBox: stockBox,
      stockCard,
      StockCard: stockCard,
      hasBox,
      HasBox: hasBox,
      hasCard,
      HasCard: hasCard,
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
      soldCount: Number(raw.soldCount || 25)
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
  const DEFAULT_INITIAL_ORDERS = [
    {
      id: 101,
      code: 'MGT-20261019-9801',
      fullName: 'Trần Minh Quân',
      phone: '0912345678',
      email: 'minhquan.collector@gmail.com',
      address: '38/2 Võ Thị Sáu, P. Quang Vinh, TP. Biên Hòa, Đồng Nai',
      addressType: 'NEW',
      addressTypeLabel: 'Địa chỉ MỚI (Sau sáp nhập)',
      oldAddressNote: 'Phường Hòa Bình cũ đã sáp nhập vào P. Quang Vinh',
      newAddressEquivalent: '38/2 Võ Thị Sáu, P. Quang Vinh, TP. Biên Hòa, Đồng Nai',
      city: 'Đồng Nai',
      district: 'TP. Biên Hòa',
      paymentMethod: 'DEPOSIT',
      paymentStatus: 'PARTIALLY_PAID',
      status: 'CONFIRMED',
      hasPreOrder: true,
      preOrderExpected: 'Tháng 11/2026',
      subtotal: 760000,
      shippingFee: 11000,
      totalAmount: 771000,
      depositAmount: 228000,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      items: [
        {
          productId: 1,
          sku: 'MGT00780',
          name: 'LB★WORKS Nissan GT-R R35 Type 2 Magic Purple (Pre-Order 2026)',
          packagingOption: 'box',
          packagingLabel: 'Bản Box (Hộp giấy)',
          unitPrice: 380000,
          quantity: 2,
          lineTotal: 760000,
          productImage: 'image/hero-banner.jpg',
          isPreOrder: true
        }
      ]
    },
    {
      id: 102,
      code: 'MGT-20261019-8722',
      fullName: 'Lê Hoàng Long',
      phone: '0988776655',
      email: 'hoanglong.diecast@gmail.com',
      address: '15 Cách Mạng Tháng 8, P. Thanh Bình, TP. Biên Hòa, Đồng Nai',
      addressType: 'OLD',
      addressTypeLabel: 'Địa chỉ CŨ (Trước sáp nhập)',
      oldAddressNote: 'P. Thanh Bình cũ ➔ nay thuộc P. Quyết Thắng mới',
      newAddressEquivalent: '15 Cách Mạng Tháng 8, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai',
      city: 'Đồng Nai',
      district: 'TP. Biên Hòa',
      paymentMethod: 'DEPOSIT',
      paymentStatus: 'UNPAID',
      status: 'PENDING',
      hasPreOrder: true,
      preOrderExpected: 'Tháng 11/2026',
      subtotal: 440000,
      shippingFee: 11000,
      totalAmount: 451000,
      depositAmount: 132000,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      items: [
        {
          productId: 2,
          sku: 'MGT00782',
          name: 'Porsche 911 GT3 R Rexy #80 AO Racing 2024 IMSA (Pre-Order)',
          packagingOption: 'card',
          packagingLabel: 'Bản Card (Vỉ Blister)',
          unitPrice: 440000,
          quantity: 1,
          lineTotal: 440000,
          productImage: 'image/hero-banner.jpg',
          isPreOrder: true
        }
      ]
    },
    {
      id: 103,
      code: 'MGT-20261019-7611',
      fullName: 'Nguyễn Văn Hùng',
      phone: '0903112233',
      email: 'hungnguyen.diecast@gmail.com',
      address: '124 Bùi Thị Xuân, P. Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
      addressType: 'NEW',
      addressTypeLabel: 'Địa chỉ MỚI (Sau sáp nhập)',
      oldAddressNote: 'Trước sáp nhập là Phường 7, Quận 3',
      newAddressEquivalent: '124 Bùi Thị Xuân, P. Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 3',
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      status: 'SHIPPING',
      trackingCode: 'SPX840192830VN',
      trackingCarrier: 'SPX Express',
      hasPreOrder: false,
      subtotal: 350000,
      shippingFee: 11000,
      totalAmount: 361000,
      depositAmount: 0,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      items: [
        {
          productId: 5,
          sku: 'MGT01055',
          name: 'LB★WORKS Lamborghini Huracán GT Widebody Light Blue',
          packagingOption: 'box',
          packagingLabel: 'Bản Box (Hộp giấy)',
          unitPrice: 350000,
          quantity: 1,
          lineTotal: 350000,
          productImage: 'image/hero-banner.jpg',
          isPreOrder: false
        }
      ]
    }
  ];

  const getSharedOrders = () => {
    try {
      const raw = localStorage.getItem(SHARED_ORDERS_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) return list;
      }
      const seeded = DEFAULT_INITIAL_ORDERS.map(normalizeOrderObject);
      saveSharedOrders(seeded);
      return seeded;
    } catch (e) {
      return DEFAULT_INITIAL_ORDERS.map(normalizeOrderObject);
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
    const addressType = String(ord.addressType || ord.AddressType || (ord.isOldAddress ? 'OLD' : 'NEW')).toUpperCase();
    const isOldAddress = addressType === 'OLD';
    const addressTypeLabel = isOldAddress ? 'Địa chỉ CŨ (Trước sáp nhập)' : 'Địa chỉ MỚI (Sau sáp nhập)';
    const oldAddressNote = ord.oldAddressNote || ord.OldAddressNote || '';
    const newAddressEquivalent = ord.newAddressEquivalent || ord.NewAddressEquivalent || '';
    const city = ord.city || ord.City || (ord.shipping && ord.shipping.city) || (ord.customer && ord.customer.city) || '';
    const district = ord.district || ord.District || (ord.shipping && ord.shipping.district) || (ord.customer && ord.customer.district) || '';
    const codAmount = paymentStatus === 'PAID' ? 0 : (depositAmount > 0 ? Math.max(0, totalAmount - depositAmount) : totalAmount);
    const hasPreOrder = Boolean(
      ord.hasPreOrder ??
      ord.HasPreOrder ??
      (paymentMethod === 'DEPOSIT') ??
      (depositAmount > 0) ??
      (Array.isArray(ord.items) && ord.items.some(i => i.isPreOrder || i.Status === 'pre_order' || String(i.status || '').toLowerCase() === 'pre_order'))
    );
    const preOrderNotified = Boolean(ord.preOrderNotified ?? ord.PreOrderNotified);
    const preOrderExpected = ord.preOrderExpected || ord.PreOrderExpected || (hasPreOrder ? 'Tháng 11/2026' : null);

    return Object.assign({}, ord, {
      id: Number(ord.id || ord.orderId || ord.OrderId || Date.now()),
      orderId: Number(ord.orderId || ord.id || ord.OrderId || Date.now()),
      OrderId: Number(ord.OrderId || ord.id || ord.orderId || Date.now()),
      hasPreOrder,
      HasPreOrder: hasPreOrder,
      preOrderNotified,
      PreOrderNotified: preOrderNotified,
      preOrderExpected,
      PreOrderExpected: preOrderExpected,
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
      addressType,
      AddressType: addressType,
      isOldAddress,
      addressTypeLabel,
      AddressTypeLabel: addressTypeLabel,
      oldAddressNote,
      OldAddressNote: oldAddressNote,
      newAddressEquivalent,
      NewAddressEquivalent: newAddressEquivalent,
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
        addressType,
        isOldAddress,
        addressTypeLabel,
        oldAddressNote,
        newAddressEquivalent,
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
      const identifier = String(body.email || body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      const inAdminPage = isAdminContext(endpoint);

      if (inAdminPage) {
        const defaultAdmin = {
          id: 1,
          userId: 1,
          fullName: 'Đỗ Quốc Thịnh & Nguyễn Đình Nam',
          email: identifier || 'admin@minigt.com',
          role: 'admin',
          avatarUrl: 'image/DoQuocThinh_anhthe.jpg'
        };
        const tok = 'admin_tok_' + Date.now();
        setAuthSession(tok, defaultAdmin);
        return { success: true, token: tok, user: defaultAdmin, data: { token: tok, user: defaultAdmin } };
      }

      // Khách hàng đăng nhập: đối chiếu từ Shared Users DB
      const users = getSharedUsers();
      const cleanIdent = identifier.replace(/\s+/g, '');
      const user = users.find(u => {
        const emailMatch = u.email && u.email.toLowerCase() === identifier;
        const rawPhone = (u.phone || '').replace(/\D/g, '');
        const searchPhone = cleanIdent.replace(/\D/g, '');
        const phoneMatch = Boolean(searchPhone && rawPhone && rawPhone === searchPhone);
        return emailMatch || phoneMatch;
      });

      if (!user) {
        return {
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'Tài khoản chưa tồn tại! Bạn vui lòng chọn tab "Đăng Ký Hội Viên" hoặc sử dụng tài khoản mẫu gợi ý.'
        };
      }

      if (user.isActive === false) {
        return {
          success: false,
          code: 'ACCOUNT_LOCKED',
          message: 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ CSKH qua Hotline hoặc Zalo hỗ trợ!'
        };
      }

      // Kiểm tra mật khẩu (nếu user có mật khẩu cài đặt)
      if (user.password && user.password !== password) {
        return {
          success: false,
          code: 'WRONG_PASSWORD',
          message: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại hoặc nhấn "Quên mật khẩu?".'
        };
      }

      user.lastLogin = new Date().toISOString();
      saveSharedUsers(users);

      const cleanUser = {
        id: user.userId || user.id,
        userId: user.userId || user.id,
        fullName: user.fullName || user.email.split('@')[0],
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        role: user.role || 'customer',
        tier: user.tier || 'Collector',
        points: user.points != null ? user.points : 100,
        totalOrders: user.totalOrders || 0,
        totalSpent: user.totalSpent || 0,
        avatarUrl: (!user.avatarUrl || user.avatarUrl.includes('DoQuocThinh_anhthe')) ? 'image/anh-clone.jpg' : user.avatarUrl,
        createdAt: user.createdAt || new Date().toISOString()
      };

      const tok = 'cust_tok_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      return {
        success: true,
        token: tok,
        user: cleanUser,
        data: { token: tok, user: cleanUser },
        message: `Đăng nhập thành công! Chào mừng ${cleanUser.fullName} trở lại.`
      };
    }

    if (method === 'POST' && path === '/api/auth/register') {
      const users = getSharedUsers();
      const email = String(body.email || '').trim().toLowerCase();
      const phone = String(body.phone || '').trim();
      const fullName = String(body.fullName || '').trim() || (email.split('@')[0] || 'Hội viên MINI GT');
      const address = String(body.address || '').trim();
      const password = String(body.password || '123456');

      if (!email || !password) {
        return { success: false, message: 'Vui lòng cung cấp đầy đủ email và mật khẩu!' };
      }

      const existing = users.find(u => {
        const emailMatch = u.email && u.email.toLowerCase() === email;
        const rawPhone = (u.phone || '').replace(/\D/g, '');
        const searchPhone = phone.replace(/\D/g, '');
        const phoneMatch = Boolean(searchPhone && rawPhone && rawPhone === searchPhone);
        return emailMatch || phoneMatch;
      });

      if (existing) {
        return {
          success: false,
          code: 'USER_EXISTS',
          message: 'Email hoặc số điện thoại này đã được đăng ký tài khoản! Bạn vui lòng chọn Đăng Nhập.'
        };
      }

      const newUser = {
        id: Date.now(),
        userId: Date.now(),
        fullName,
        email,
        phone,
        address,
        password,
        role: 'customer',
        tier: 'Collector',
        points: 100, // Tặng ngay 100 điểm thưởng chào mừng hội viên mới!
        totalOrders: 0,
        totalSpent: 0,
        avatarUrl: 'image/anh-clone.jpg',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      users.unshift(newUser);
      saveSharedUsers(users);

      const tok = 'cust_tok_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      return {
        success: true,
        token: tok,
        user: newUser,
        data: { token: tok, user: newUser },
        message: 'Đăng ký tài khoản thành công! Tặng bạn 100 điểm thưởng hội viên chào mừng.'
      };
    }

    if (method === 'POST' && path === '/api/auth/google') {
      const users = getSharedUsers();
      const info = body.userInfo || body;
      const email = String(info.email || 'collector.google@gmail.com').trim().toLowerCase();
      const fullName = String(info.name || info.fullName || email.split('@')[0].toUpperCase()).trim();

      let user = users.find(u => u.email && u.email.toLowerCase() === email);
      if (!user) {
        user = {
          id: Date.now(),
          userId: Date.now(),
          fullName,
          email,
          phone: '',
          address: '',
          password: 'google_oauth_pass',
          role: 'customer',
          tier: 'Collector',
          points: 100,
          totalOrders: 0,
          totalSpent: 0,
          avatarUrl: 'image/anh-clone.jpg',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        users.unshift(user);
        saveSharedUsers(users);
      } else {
        user.lastLogin = new Date().toISOString();
        saveSharedUsers(users);
      }

      const tok = 'google_tok_' + Date.now();
      return {
        success: true,
        token: tok,
        user,
        data: { token: tok, user },
        message: 'Đăng nhập Google thành công!'
      };
    }

    if (method === 'POST' && path === '/api/auth/forgot') {
      const identifier = String(body.email || body.phone || '').trim().toLowerCase();
      const users = getSharedUsers();
      const cleanIdent = identifier.replace(/\s+/g, '');
      const user = users.find(u => {
        const emailMatch = u.email && u.email.toLowerCase() === identifier;
        const rawPhone = (u.phone || '').replace(/\D/g, '');
        const searchPhone = cleanIdent.replace(/\D/g, '');
        return emailMatch || (searchPhone && rawPhone === searchPhone);
      });

      if (!user) {
        return {
          success: false,
          message: 'Không tìm thấy tài khoản với email hoặc số điện thoại này trong hệ thống hội viên!'
        };
      }

      return {
        success: true,
        otp: '6868',
        message: `Mã OTP khôi phục đã được cấp cho tài khoản (${user.email}): 6868`
      };
    }

    if (method === 'POST' && path === '/api/auth/reset-password') {
      const identifier = String(body.email || '').trim().toLowerCase();
      const otp = String(body.otp || '').trim();
      const newPassword = String(body.newPassword || '').trim();

      if (otp !== '6868') {
        return { success: false, message: 'Mã xác thực OTP không chính xác! Vui lòng thử lại với mã 6868.' };
      }
      if (!newPassword || newPassword.length < 6) {
        return { success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự!' };
      }

      const users = getSharedUsers();
      const cleanIdent = identifier.replace(/\s+/g, '');
      const user = users.find(u => {
        const emailMatch = u.email && u.email.toLowerCase() === identifier;
        const rawPhone = (u.phone || '').replace(/\D/g, '');
        const searchPhone = cleanIdent.replace(/\D/g, '');
        return emailMatch || (searchPhone && rawPhone === searchPhone);
      });

      if (!user) {
        return { success: false, message: 'Không tìm thấy tài khoản để cập nhật mật khẩu mới!' };
      }

      user.password = newPassword;
      saveSharedUsers(users);

      return {
        success: true,
        message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.'
      };
    }

    if (method === 'PUT' && path === '/api/auth/profile') {
      const users = getSharedUsers();
      const userId = body.userId || body.id;
      const user = users.find(u => (u.userId == userId || u.id == userId || (body.email && u.email && u.email.toLowerCase() === body.email.toLowerCase())));

      if (user) {
        if (body.fullName) user.fullName = body.fullName.trim();
        if (body.phone) user.phone = body.phone.trim();
        if (body.address) user.address = body.address.trim();
        saveSharedUsers(users);
        return { success: true, user, message: 'Cập nhật thông tin tài khoản thành công!' };
      }
      return { success: false, message: 'Không tìm thấy tài khoản để cập nhật!' };
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
        list = list.filter(p => {
          const name = String(p.name || p.Name || '').toLowerCase();
          const sku = String(p.sku || p.Sku || '').toLowerCase();
          const carNum = String(p.carNumber || p.CarNumber || '').toLowerCase();
          const brand = String(p.brand || p.Brand || '').toLowerCase();
          const catName = String(p.categoryName || p.CategoryName || (p.category && p.category.name) || '').toLowerCase();
          const edition = String(p.editionNote || p.EditionNote || '').toLowerCase();
          return name.includes(q) || sku.includes(q) || carNum.includes(q) || brand.includes(q) || catName.includes(q) || edition.includes(q);
        });
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

    // 1b. DANH MỤC SẢN PHẨM (GET /api/categories, GET /api/admin/categories, POST /api/admin/categories)
    if (method === 'GET' && (path === '/api/categories' || path === '/api/admin/categories')) {
      const cats = getSharedCategories();
      const prods = getSharedProducts();
      const enriched = cats.map(c => {
        const cid = Number(c.id || c.CategoryId);
        const count = prods.filter(p => Number(p.categoryId || p.CategoryId) === cid).length;
        return {
          id: cid,
          CategoryId: cid,
          slug: c.slug || c.Slug,
          Slug: c.slug || c.Slug,
          name: c.name || c.Name,
          Name: c.name || c.Name,
          description: c.description || c.Description || '',
          Description: c.description || c.Description || '',
          imageUrl: c.imageUrl || c.ImageUrl || '',
          sortOrder: Number(c.sortOrder || c.SortOrder || 0),
          SortOrder: Number(c.sortOrder || c.SortOrder || 0),
          productCount: count,
          ProductCount: count
        };
      });
      return { success: true, data: enriched };
    }

    if (method === 'POST' && (path === '/api/categories' || path === '/api/admin/categories')) {
      const allCats = getSharedCategories();
      const nextId = allCats.reduce((max, c) => Math.max(max, Number(c.id || c.CategoryId) || 0), 0) + 1;
      const cleanName = String(body.name || body.Name || '').trim();
      const cleanSlug = (body.slug && String(body.slug).trim())
        ? String(body.slug).trim().toLowerCase()
        : cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const existing = allCats.find(c => (c.slug || c.Slug) === cleanSlug);
      let catItem;
      if (existing) {
        existing.name = cleanName;
        existing.Name = cleanName;
        if (body.description) existing.description = body.description;
        catItem = existing;
      } else {
        catItem = {
          id: nextId,
          CategoryId: nextId,
          name: cleanName,
          Name: cleanName,
          slug: cleanSlug || ('cat-' + Date.now()),
          Slug: cleanSlug || ('cat-' + Date.now()),
          description: body.description || '',
          Description: body.description || '',
          sortOrder: allCats.length + 1,
          SortOrder: allCats.length + 1,
          imageUrl: body.imageUrl || ''
        };
        allCats.push(catItem);
      }
      saveSharedCategories(allCats);
      return { success: true, data: catItem, message: 'Đã lưu danh mục thành công!' };
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
        addressType: body.addressType || 'NEW',
        oldAddressNote: body.oldAddressNote || '',
        newAddressEquivalent: body.newAddressEquivalent || '',
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

      const preOrdersList = allOrders.filter(o => o.hasPreOrder || o.HasPreOrder || o.paymentMethod === 'DEPOSIT');

      const counts = {
        all: allOrders.length,
        pending: allOrders.filter(o => o.status === 'PENDING').length,
        confirmed: allOrders.filter(o => o.status === 'CONFIRMED').length,
        preparing: allOrders.filter(o => o.status === 'PREPARING').length,
        shipping: allOrders.filter(o => o.status === 'SHIPPING').length,
        delivered: allOrders.filter(o => o.status === 'DELIVERED').length,
        cancelled: allOrders.filter(o => o.status === 'CANCELLED').length,
        preOrder: preOrdersList.length
      };

      const preStages = {
        all: preOrdersList.length,
        needDeposit: preOrdersList.filter(o => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED').length,
        waitingGoods: preOrdersList.filter(o => (o.status === 'CONFIRMED' || o.paymentStatus === 'PARTIALLY_PAID') && !o.preOrderNotified && o.status !== 'CANCELLED').length,
        goodsArrived: preOrdersList.filter(o => (o.preOrderNotified || o.status === 'PREPARING') && o.status !== 'SHIPPING' && o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length,
        shipped: preOrdersList.filter(o => o.status === 'SHIPPING').length
      };

      let filtered = allOrders;
      if (params.status && params.status !== 'ALL') {
        if (params.status === 'PRE_ORDER' || params.status === 'PREORDER') {
          filtered = preOrdersList;
          if (params.preStage && params.preStage !== 'ALL') {
            if (params.preStage === 'NEED_DEPOSIT') {
              filtered = filtered.filter(o => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED');
            } else if (params.preStage === 'WAITING_GOODS') {
              filtered = filtered.filter(o => (o.status === 'CONFIRMED' || o.paymentStatus === 'PARTIALLY_PAID') && !o.preOrderNotified && o.status !== 'CANCELLED');
            } else if (params.preStage === 'GOODS_ARRIVED') {
              filtered = filtered.filter(o => (o.preOrderNotified || o.status === 'PREPARING') && o.status !== 'SHIPPING' && o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
            } else if (params.preStage === 'SHIPPED') {
              filtered = filtered.filter(o => o.status === 'SHIPPING');
            }
          }
        } else {
          filtered = filtered.filter(o => o.status === params.status);
        }
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
        preStages,
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
      let users = getSharedUsers();
      if (params.search) {
        const q = params.search.toLowerCase();
        users = users.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone && u.phone.includes(q)));
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
    const adminOrderMatch = path.match(/^\/api\/admin\/orders\/(\d+)\/(status|tracking|confirm-payment|payment|preorder-arrived|cancel|address-type)/);
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
          if (body.kind === 'deposit') {
            target.depositPaidAt = new Date().toISOString();
          } else {
            target.fullPaidAt = new Date().toISOString();
          }
          if (target.status === 'PENDING') target.status = 'CONFIRMED';
        } else if (action === 'preorder-arrived') {
          target.preOrderNotified = true;
          target.PreOrderNotified = true;
          target.hasPreOrder = true;
          target.HasPreOrder = true;
          if (target.status === 'CONFIRMED' || target.status === 'PENDING') {
            target.status = 'PREPARING';
          }
        } else if (action === 'cancel') {
          target.status = 'CANCELLED';
          target.cancelReason = body.cancelReason || 'Admin hủy đơn';
        } else if (action === 'address-type') {
          target.addressType = body.addressType === 'OLD' ? 'OLD' : 'NEW';
          target.isOldAddress = target.addressType === 'OLD';
          target.addressTypeLabel = target.addressType === 'OLD' ? 'Địa chỉ CŨ (Trước sáp nhập)' : 'Địa chỉ MỚI (Sau sáp nhập)';
          if (body.oldAddressNote !== undefined) target.oldAddressNote = body.oldAddressNote;
          if (body.newAddressEquivalent !== undefined) target.newAddressEquivalent = body.newAddressEquivalent;
        }
        target.updatedAt = new Date().toISOString();
        const saved = upsertSharedOrder(target);
        emitRealtimeSync('ORDER_UPDATED', saved);
        return {
          success: true,
          message: action === 'preorder-arrived'
            ? `Đã cập nhật: Hàng Pre-Order cho đơn #${saved.code} đã về kho! Sẵn sàng đóng gói & gán SPX.`
            : (action === 'confirm-payment'
              ? (body.kind === 'deposit' ? `Đã xác nhận nhận cọc cho đơn #${saved.code} thành công!` : `Đã xác nhận nhận đủ tiền 100% cho đơn #${saved.code}!`)
              : 'Đã cập nhật đơn hàng thành công!'),
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
    const method = (options.method || 'GET').toUpperCase();
    const rawBody = options.body;

    // Khi chạy trên Live Server (127.0.0.1:5500) mà không có backend port 5000:
    // Chuyển thẳng vào Local Storage Engine để không kích hoạt lỗi đỏ net::ERR_CONNECTION_REFUSED trong Console DevTools F12
    if ((isLocalEnvironment() && !isDirectNodeServer()) || (isLocalEnvironment() && localServerOffline === true)) {
      const fallbackResult = handleOfflineFallback(endpoint, { method, body: rawBody });
      if (fallbackResult) return fallbackResult;
    }

    const fullUrl = endpoint.startsWith('http') ? endpoint : (API_BASE + endpoint);
    const headers = Object.assign({
      'Accept': 'application/json'
    }, options.headers || {});

    const token = getToken(endpoint);
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const config = Object.assign({}, options, { headers });

    let response;
    try {
      response = await fetch(fullUrl, config);
      if (isLocalEnvironment()) {
        localServerOffline = false;
      }
    } catch (netErr) {
      if (isLocalEnvironment()) {
        localServerOffline = true;
      }
      const fallbackResult = handleOfflineFallback(endpoint, { method, body: rawBody });
      if (fallbackResult) {
        return fallbackResult;
      }
      console.warn('[API OFFLINE]:', endpoint);
      throw new ApiError('Không thể kết nối đến máy chủ.', 0, 'NETWORK_ERROR');
    }

    if (!response.ok) {
    if (isLocalEnvironment()) {
        const fallbackResult = handleOfflineFallback(endpoint, {
            method,
            body: rawBody
        });

        if (fallbackResult) {
            return fallbackResult;
        }
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
    getSharedUsers,
    saveSharedUsers,
    getSharedCategories,
    saveSharedCategories,
    normalizeProductObject,
    getMyOrderCodes,
    addMyOrderCode,
    emitRealtimeSync,
    normalizeOrderObject,
    isLocalServerOffline: () => localServerOffline,

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
