/**
 * MINI GT STORE - CLIENT APPLICATION JAVASCRIPT
 * Xử lý: Danh mục, Lọc sản phẩm, Pre-order countdown, Giỏ hàng, Đặt cọc,
 * Đăng nhập Gmail/Google, Tra cứu đơn hàng, Quick view, VietQR
 */

// =====================================================================
// 1. DỮ LIỆU MẪU ĐẦY ĐỦ (FALLBACK DATA KHI MỞ TRỰC TIẾP FILE:// HOẶC OFFLINE)
// =====================================================================
const FALLBACK_PRODUCTS = [
  {
    ProductId: 1,
    Sku: "MGTS0026",
    Name: "Lamborghini Huracán Sterrato All-Terrain Set (Box 4 xe)",
    Slug: "lamborghini-huracan-sterrato-box-4-xe",
    CategoryId: 4,
    CategorySlug: "box-sets",
    CategoryName: "Box Sets & Combo",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 1850000,
    OldPrice: null,
    DepositAmount: 500000,
    QuotaPercent: 82,
    EditionNote: "+ Box Set Camo",
    PreOrderDeadline: "2026-10-30",
    Stock: 20,
    ImageUrl: "image/lambo-sterrato-set.png",
    Description: "Set 4 xe Lamborghini Huracán Sterrato All-Terrain với hộp trưng bày Collector Box sang trọng, chi tiết lốp off-road và giá nóc safari độc quyền.",
    Status: "pre_order",
    IsFeatured: 1,
    IsNew: 1
  },
  {
    ProductId: 2,
    Sku: "MGT01413",
    Name: "Aston Martin AMR24 #18 Lance Stroll F1 Las Vegas GP",
    Slug: "aston-martin-amr24-18-lance-stroll-las-vegas-gp",
    CategoryId: 2,
    CategorySlug: "f1-racing",
    CategoryName: "Formula 1 Racing",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 460000,
    OldPrice: 500000,
    DepositAmount: 150000,
    QuotaPercent: 75,
    EditionNote: "+ LHD Edition",
    PreOrderDeadline: "2026-10-30",
    Stock: 45,
    ImageUrl: "image/aston-amr24-stroll.png",
    Description: "Chiến mã F1 AMR24 của tay đua Lance Stroll tại chặng Las Vegas GP 2024. Cánh gió sau khí động học, tem tài trợ Aramco sắc nét.",
    Status: "pre_order",
    IsFeatured: 1,
    IsNew: 1
  },
  {
    ProductId: 3,
    Sku: "MGT01396",
    Name: "Aston Martin AMR24 #14 Fernando Alonso F1 Las Vegas GP",
    Slug: "aston-martin-amr24-14-fernando-alonso-las-vegas-gp",
    CategoryId: 2,
    CategorySlug: "f1-racing",
    CategoryName: "Formula 1 Racing",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 450000,
    OldPrice: null,
    DepositAmount: 150000,
    QuotaPercent: 90,
    EditionNote: "+ 2x World Champ",
    PreOrderDeadline: "2026-10-30",
    Stock: 12,
    ImageUrl: "image/aston-amr24-alonso.png",
    Description: "Mẫu xe F1 AMR24 của huyền thoại 2 lần vô địch thế giới Fernando Alonso chặng Las Vegas GP. Chi tiết halo buồng lái và bánh xe lốp Pirelli soft viền đỏ.",
    Status: "pre_order",
    IsFeatured: 1,
    IsNew: 1
  },
  {
    ProductId: 4,
    Sku: "MGT00550",
    Name: "Oracle Red Bull Racing RB18 #1 Max Verstappen 2022 Monaco GP",
    Slug: "oracle-red-bull-racing-rb18-1-max-verstappen-monaco-gp",
    CategoryId: 2,
    CategorySlug: "f1-racing",
    CategoryName: "Formula 1 Racing",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 420000,
    OldPrice: null,
    DepositAmount: 150000,
    QuotaPercent: 60,
    EditionNote: "+ Champion Livery",
    PreOrderDeadline: null,
    Stock: 18,
    ImageUrl: "image/f1_redbull.jpg",
    Description: "Mô hình Red Bull Racing RB18 số 1 Max Verstappen vô địch chặng đua Monaco GP danh giá. Màu sơn nhám mờ đặc trưng đội đua Áo.",
    Status: "in_stock",
    IsFeatured: 1,
    IsNew: 0
  },
  {
    ProductId: 5,
    Sku: "MGT01055",
    Name: "LB★WORKS Lamborghini Huracán GT Gravity Racing #5",
    Slug: "lb-works-lamborghini-huracan-gt-gravity-racing-5",
    CategoryId: 1,
    CategorySlug: "liberty-walk",
    CategoryName: "Liberty Walk LBWK",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 350000,
    OldPrice: null,
    DepositAmount: null,
    QuotaPercent: 0,
    EditionNote: "+ Widebody Aero",
    PreOrderDeadline: null,
    Stock: 25,
    ImageUrl: "image/mgt01055.webp",
    Description: "Bản độ Liberty Walk Huracán GT phong cách Gravity Racing với body kit vòm bánh rộng tán đinh tán đặc trưng, cánh gió GT to bản.",
    Status: "in_stock",
    IsFeatured: 1,
    IsNew: 0
  },
  {
    ProductId: 6,
    Sku: "MGT01143",
    Name: "Porsche 911 GT3 R #77 AO Racing \"Skeleton\" 2024 IMSA",
    Slug: "porsche-911-gt3-r-77-ao-racing-skeleton-2024-imsa",
    CategoryId: 3,
    CategorySlug: "gt-racing",
    CategoryName: "IMSA & GT3 Racing",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 390000,
    OldPrice: null,
    DepositAmount: 150000,
    QuotaPercent: 70,
    EditionNote: "+ Halloween Skeleton",
    PreOrderDeadline: "2026-10-30",
    Stock: 30,
    ImageUrl: "image/ske.webp",
    Description: "Phiên bản đặc biệt Halloween của đội AO Racing với tem khung xương phát quang cực kỳ độc đáo trên nền sơn đen tuyền.",
    Status: "pre_order",
    IsFeatured: 1,
    IsNew: 1
  },
  {
    ProductId: 7,
    Sku: "MGT01093",
    Name: "Porsche 911 GT3 R #77 AO Racing \"Roxy\" 2024 IMSA Road America",
    Slug: "porsche-911-gt3-r-77-ao-racing-roxy-2024-imsa",
    CategoryId: 3,
    CategorySlug: "gt-racing",
    CategoryName: "IMSA & GT3 Racing",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 360000,
    OldPrice: null,
    DepositAmount: null,
    QuotaPercent: 88,
    EditionNote: "+ Pink Livery IMSA",
    PreOrderDeadline: null,
    Stock: 15,
    ImageUrl: "image/Roxy.webp",
    Description: "Chiếc Porsche khủng long hồng Roxy nổi tiếng của AO Racing tại giải đua Road America. Cặp răng nanh hầm hố trước đầu xe.",
    Status: "in_stock",
    IsFeatured: 1,
    IsNew: 0
  },
  {
    ProductId: 8,
    Sku: "MGT00782",
    Name: "Porsche 911 GT3 R #80 AO Racing \"Rexy\" 2024 IMSA",
    Slug: "porsche-911-gt3-r-80-ao-racing-rexy-2024-imsa",
    CategoryId: 3,
    CategorySlug: "gt-racing",
    CategoryName: "IMSA & GT3 Racing",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 380000,
    OldPrice: null,
    DepositAmount: null,
    QuotaPercent: 95,
    EditionNote: "+ IMSA Dino Edition",
    PreOrderDeadline: null,
    Stock: 8,
    ImageUrl: "image/rexy.jpg",
    Description: "Biểu tượng khủng long xanh Rexy gầm rú khuấy đảo các trường đua IMSA và Le Mans. Mẫu xe diecast được săn lùng nhiều nhất năm.",
    Status: "in_stock",
    IsFeatured: 1,
    IsNew: 0
  },
  {
    ProductId: 9,
    Sku: "MGT01129",
    Name: "Lamborghini Huracán GT3 EVO2 #45 DEX Imaging 2024 IMSA Daytona 24h",
    Slug: "lamborghini-huracan-gt3-evo2-45-dex-imaging-daytona-24h",
    CategoryId: 3,
    CategorySlug: "gt-racing",
    CategoryName: "IMSA & GT3 Racing",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 330000,
    OldPrice: null,
    DepositAmount: null,
    QuotaPercent: 0,
    EditionNote: "+ Daytona 24h Spec",
    PreOrderDeadline: null,
    Stock: 14,
    ImageUrl: "image/minigt_lambogt3.jpg",
    Description: "Mẫu xe đua Lamborghini Huracán GT3 EVO2 tham chiến 24 Giờ Daytona với bộ tem đỏ đen ấn tượng.",
    Status: "in_stock",
    IsFeatured: 0,
    IsNew: 0
  },
  {
    ProductId: 10,
    Sku: "MGT00465",
    Name: "LB-Super Silhouette Nissan S15 Silvia Presentation",
    Slug: "lb-super-silhouette-nissan-s15-silvia-presentation",
    CategoryId: 1,
    CategorySlug: "liberty-walk",
    CategoryName: "Liberty Walk LBWK",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 320000,
    OldPrice: null,
    DepositAmount: null,
    QuotaPercent: 0,
    EditionNote: "+ Silhouette Wing",
    PreOrderDeadline: null,
    Stock: 22,
    ImageUrl: "image/Minigt_s15chop_lbwk.jpg",
    Description: "Huyền thoại S15 phong cách Super Silhouette từ nhà độ Liberty Walk Wataru Kato.",
    Status: "in_stock",
    IsFeatured: 1,
    IsNew: 0
  },
  {
    ProductId: 11,
    Sku: "MGT00618",
    Name: "LB-Super Silhouette Nissan S15 Silvia #23 2022 Goodwood FoS",
    Slug: "lb-super-silhouette-nissan-s15-silvia-23-goodwood-fos",
    CategoryId: 1,
    CategorySlug: "liberty-walk",
    CategoryName: "Liberty Walk LBWK",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 340000,
    OldPrice: null,
    DepositAmount: null,
    QuotaPercent: 100,
    EditionNote: "+ Goodwood FoS #23",
    PreOrderDeadline: null,
    Stock: 0,
    ImageUrl: "image/Minigt_S15_LBWK.jpg",
    Description: "Chiếc S15 drift tại lễ hội tốc độ Goodwood Festival of Speed 2022 màu vàng đen nổi bật.",
    Status: "sold_out",
    IsFeatured: 0,
    IsNew: 0
  },
  {
    ProductId: 12,
    Sku: "PR640325",
    Name: "Pop Race Toyota Supra Top Secret GT300 Silver Chrome",
    Slug: "pop-race-toyota-supra-top-secret-gt300-silver-chrome",
    CategoryId: 5,
    CategorySlug: "partner",
    CategoryName: "Pop Race & Collab",
    Brand: "Pop Race",
    Scale: "1:64",
    Price: 420000,
    OldPrice: null,
    DepositAmount: null,
    QuotaPercent: 0,
    EditionNote: "+ Top Secret Chrome",
    PreOrderDeadline: null,
    Stock: 19,
    ImageUrl: "image/Poprace_Supra_Secret.webp",
    Description: "Siêu phẩm Top Secret Supra màu bạc tráng gương có thể mở nắp capo chi tiết động cơ 2JZ.",
    Status: "in_stock",
    IsFeatured: 1,
    IsNew: 0
  },
  {
    ProductId: 13,
    Sku: "PR640110",
    Name: "Pop Race Lamborghini Huracán STO Blu Laufey",
    Slug: "pop-race-lamborghini-huracan-sto-blu-laufey",
    CategoryId: 5,
    CategorySlug: "partner",
    CategoryName: "Pop Race & Collab",
    Brand: "Pop Race",
    Scale: "1:64",
    Price: 450000,
    OldPrice: null,
    DepositAmount: null,
    QuotaPercent: 0,
    EditionNote: "+ Openable Engine",
    PreOrderDeadline: null,
    Stock: 11,
    ImageUrl: "image/Poprace_Lambo_Secret.webp",
    Description: "Huracán STO màu xanh Laufey đặc trưng, mở nắp khoang động cơ cực kỳ tinh xảo.",
    Status: "in_stock",
    IsFeatured: 0,
    IsNew: 1
  },
  {
    ProductId: 14,
    Sku: "TH-ULTRA63",
    Name: "Trends Hobby Lamborghini Huracán GT3 EVO2 #63 Ultraman Tiga",
    Slug: "trends-hobby-lamborghini-huracan-gt3-evo2-63-ultraman-tiga",
    CategoryId: 5,
    CategorySlug: "partner",
    CategoryName: "Pop Race & Collab",
    Brand: "Trends Hobby",
    Scale: "1:64",
    Price: 590000,
    OldPrice: null,
    DepositAmount: null,
    QuotaPercent: 0,
    EditionNote: "+ Bản quyền Ultraman",
    PreOrderDeadline: null,
    Stock: 7,
    ImageUrl: "image/TH_LamboUltraman.jpg",
    Description: "Phiên bản giới hạn bản quyền chính thức Ultraman Tiga với hộp acrylic cao cấp và đế da sang trọng.",
    Status: "in_stock",
    IsFeatured: 1,
    IsNew: 1
  },
  {
    ProductId: 15,
    Sku: "COMBO-AMR24",
    Name: "Combo Aston Martin AMR24 Las Vegas 2024 (Stroll #18 + Alonso #14)",
    Slug: "combo-aston-martin-amr24-las-vegas-2024",
    CategoryId: 4,
    CategorySlug: "box-sets",
    CategoryName: "Box Sets & Combo",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 880000,
    OldPrice: 950000,
    DepositAmount: 300000,
    QuotaPercent: 85,
    EditionNote: "+ Trọn Bộ 2 Xe F1",
    PreOrderDeadline: "2026-10-30",
    Stock: 10,
    ImageUrl: "image/aston-amr24-stroll.png",
    Description: "Cặp bài trùng AMR24 Las Vegas của 2 tay đua Lance Stroll và Fernando Alonso, tặng kèm decal bảo vệ.",
    Status: "pre_order",
    IsFeatured: 1,
    IsNew: 1
  },
  {
    ProductId: 16,
    Sku: "COMBO-AO3",
    Name: "Combo AO Racing Porsche 911 GT3 R \"Rexy – Roxy – Skeleton\"",
    Slug: "combo-ao-racing-porsche-911-gt3-r-rexy-roxy-skeleton",
    CategoryId: 4,
    CategorySlug: "box-sets",
    CategoryName: "Box Sets & Combo",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 1090000,
    OldPrice: 1150000,
    DepositAmount: 400000,
    QuotaPercent: 92,
    EditionNote: "+ Bộ 3 Khủng Long IMSA",
    PreOrderDeadline: "2026-10-30",
    Stock: 8,
    ImageUrl: "image/Roxy.webp",
    Description: "Bộ ba khủng long AO Racing vang danh làng đua xe thể thao IMSA Mỹ.",
    Status: "pre_order",
    IsFeatured: 1,
    IsNew: 1
  },
  {
    ProductId: 17,
    Sku: "MGT01055-LW",
    Name: "LB★WORKS Lamborghini Huracán GT Gravity (Vỉ Blister Card)",
    Slug: "lb-works-lamborghini-huracan-gt-gravity-blister-card",
    CategoryId: 1,
    CategorySlug: "liberty-walk",
    CategoryName: "Liberty Walk LBWK",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 370000,
    OldPrice: null,
    DepositAmount: null,
    QuotaPercent: 0,
    EditionNote: "+ Đóng Gói Vỉ Blister",
    PreOrderDeadline: null,
    Stock: 16,
    ImageUrl: "image/minig_lambo_lbwk.webp",
    Description: "Quy cách đóng vỉ Blister Card dành cho collector thích giữ nguyên seal treo tường trưng bày.",
    Status: "in_stock",
    IsFeatured: 0,
    IsNew: 0
  }
];

// =====================================================================
// 2. BIẾN TRẠNG THÁI ỨNG DỤNG (STATE)
// =====================================================================
let allProducts = [];
let currentFilter = 'all';
let cart = JSON.parse(localStorage.getItem('minigt_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('minigt_user')) || null;
let currentToken = localStorage.getItem('minigt_token') || null;

// =====================================================================
// 3. TIỆN ÍCH ĐỊNH DẠNG (FORMATTERS)
// =====================================================================
function formatVND(amount) {
  if (amount == null) return '';
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'toast-success' : ''}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span> <div>${message}</div>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// =====================================================================
// SAFE FETCH WRAPPER - TỰ ĐỘNG NHẬN DIỆN PORT 5000 & CHỐNG LỖI 405
// =====================================================================
const API_BASE = (() => {
  if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000')) {
    return 'http://localhost:5000';
  }
  return '';
})();

async function safeFetch(url, options = {}) {
  try {
    const fullUrl = url.startsWith('http') ? url : (API_BASE + url);
    const response = await fetch(fullUrl, options);
    const text = await response.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (err) {
        data = { success: false, message: text || 'Phản hồi không phải JSON hợp lệ', data: null };
      }
    }
    if (!response.ok) {
      throw new Error(data.message || `Lỗi máy chủ HTTP: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`[SAFE FETCH ERROR] (${url}):`, error);
    throw error;
  }
}

// =====================================================================
// 4. KHỞI TẠO VÀ TẢI SẢN PHẨM (API HOẶC FALLBACK)
// =====================================================================
async function loadProducts() {
  try {
    const json = await safeFetch('/api/products');
    if (json.success && json.data && json.data.length > 0) {
      allProducts = json.data;
      console.log('Đã tải sản phẩm trực tiếp từ SQL Server (QUOCTHINH\\DOQUOCTHINH):', allProducts.length);
    } else {
      allProducts = FALLBACK_PRODUCTS;
    }
  } catch (err) {
    console.warn('Sử dụng dữ liệu cục bộ:', err.message);
    allProducts = FALLBACK_PRODUCTS;
  }

  renderProductsGrid();
  renderF1Section();
  renderBoxSetsSection();
  updateFilterCounts();
}

// =====================================================================
// 5. RENDER CARD SẢN PHẨM CHUẨN DESIGN THEO ẢNH MẪU
// =====================================================================
function createProductCardHTML(p) {
  const isPreOrder = p.Status === 'pre_order';
  const isSoldOut = p.Status === 'sold_out';
  const isChase = p.Sku.startsWith('PR') || p.Sku.startsWith('TH') || (p.Name && p.Name.includes('Secret'));

  // Badge góc trái trên
  let statusBadge = '';
  if (isPreOrder) {
    statusBadge = '<span class="badge-preorder-pill">PRE-ORDER</span>';
  } else if (isSoldOut) {
    statusBadge = '<span class="badge-soldout">HẾT HÀNG</span>';
  } else {
    statusBadge = '<span class="badge badge-instock">CÓ SẴN</span>';
  }

  // Ribbon góc phải trên
  let ribbonHtml = '';
  if (isChase) {
    ribbonHtml = '<span class="badge-chase-pill">CHASE 1/24</span>';
  } else if (isPreOrder) {
    ribbonHtml = '<span class="badge-slanted-red">PRE-ORDER</span>';
  }

  // Quota bar (hạn ngạch đặt cọc đúng theo ảnh mẫu)
  let quotaHtml = '';
  if (p.QuotaPercent && p.QuotaPercent > 0) {
    let quotaText = `Đã cọc ${p.QuotaPercent}% hạn ngạch`;
    if (p.QuotaPercent >= 90) quotaText = `Sắp đóng sổ cọc (${p.QuotaPercent}%)`;
    else if (p.QuotaPercent === 75) quotaText = 'Còn 15 suất cọc đợt 1';

    quotaHtml = `
      <div class="quota-box">
        <div class="quota-label">
          <span>${quotaText}</span>
        </div>
        <div class="quota-progress">
          <div class="quota-bar" style="width: ${p.QuotaPercent}%;"></div>
        </div>
      </div>
    `;
  } else {
    quotaHtml = `
      <div class="quota-box">
        <div class="quota-label" style="color: #64748b;">
          <span>100% Seal Hãng Bản Quyền</span>
        </div>
        <div class="quota-progress">
          <div class="quota-bar" style="width: 100%; background: #e2e8f0;"></div>
        </div>
      </div>
    `;
  }

  const oldPriceHtml = p.OldPrice ? `<span class="old-price">${formatVND(p.OldPrice)}</span>` : '';
  const btnText = isPreOrder ? '+ Đặt cọc' : (isSoldOut ? 'Hết hàng' : '+ Thêm giỏ');

  return `
    <article class="product-card reveal-on-scroll" data-id="${p.ProductId}">
      <div class="card-image-box">
        <div class="card-badge-top-left">${statusBadge}</div>
        <div class="card-ribbon-top-right">${ribbonHtml}</div>
        <img class="card-image" src="${p.ImageUrl}" alt="${p.Name}" loading="lazy" onerror="this.src='image/hero-banner.png'">
        <div class="card-quick-actions">
          <button class="quick-action-btn" title="Xem chi tiết" onclick="openQuickView(${p.ProductId})">👁</button>
          <button class="quick-action-btn" title="Thêm vào yêu thích" onclick="toggleWishlist(${p.ProductId})">❤</button>
        </div>
      </div>
      <div class="card-body">
        ${quotaHtml}
        <h3 class="product-title" onclick="openQuickView(${p.ProductId})" style="cursor: pointer;">${p.Name}</h3>
        <div class="product-meta-sub">
          #${p.Sku} ${p.EditionNote ? '• ' + p.EditionNote : ''}
        </div>
        <div class="card-footer">
          <div class="price-box">
            <span class="current-price">${formatVND(p.Price)}</span>
            ${oldPriceHtml}
          </div>
          <button class="card-order-btn" ${isSoldOut ? 'disabled' : ''} onclick="handleCardAction(${p.ProductId})">
            ${btnText}
          </button>
        </div>
      </div>
    </article>
  `;
}

// =====================================================================
// 6. RENDER CÁC KHU VỰC SẢN PHẨM
// =====================================================================
function renderProductsGrid() {
  const container = document.getElementById('mainProductGrid');
  if (!container) return;

  let filtered = [...allProducts];

  if (currentFilter === 'pre_order') {
    filtered = filtered.filter(p => p.Status === 'pre_order');
  } else if (currentFilter === 'lbwk') {
    filtered = filtered.filter(p => p.CategorySlug === 'liberty-walk' || p.Name.toLowerCase().includes('lb'));
  } else if (currentFilter === 'chase') {
    filtered = filtered.filter(p => p.Sku.startsWith('PR') || p.Sku.startsWith('TH') || p.Name.toLowerCase().includes('secret'));
  } else if (currentFilter === 'f1') {
    filtered = filtered.filter(p => p.CategorySlug === 'f1-racing' || p.Name.toLowerCase().includes('f1'));
  } else if (currentFilter === 'ao_racing') {
    filtered = filtered.filter(p => p.Name.toLowerCase().includes('ao racing') || p.Name.toLowerCase().includes('rexy') || p.Name.toLowerCase().includes('roxy') || p.Name.toLowerCase().includes('ske'));
  } else if (currentFilter === 'in_stock') {
    filtered = filtered.filter(p => p.Status === 'in_stock');
  }

  container.innerHTML = filtered.map(p => createProductCardHTML(p)).join('');
  refreshScrollReveal();
}

function renderF1Section() {
  const container = document.getElementById('f1ProductGrid');
  if (!container) return;
  const f1List = allProducts.filter(p => p.CategorySlug === 'f1-racing' || p.Name.toLowerCase().includes('f1') || p.Name.toLowerCase().includes('amr24'));
  container.innerHTML = f1List.map(p => createProductCardHTML(p)).join('');
  refreshScrollReveal();
}

function renderBoxSetsSection() {
  const container = document.getElementById('boxSetsProductGrid');
  if (!container) return;
  const boxList = allProducts.filter(p => p.CategorySlug === 'box-sets' || p.Name.toLowerCase().includes('box') || p.Name.toLowerCase().includes('combo'));
  container.innerHTML = boxList.map(p => createProductCardHTML(p)).join('');
  refreshScrollReveal();
}

function updateFilterCounts() {
  const counts = {
    all: allProducts.length,
    pre_order: allProducts.filter(p => p.Status === 'pre_order').length,
    lbwk: allProducts.filter(p => p.CategorySlug === 'liberty-walk' || p.Name.toLowerCase().includes('lb')).length,
    chase: allProducts.filter(p => p.Sku.startsWith('PR') || p.Sku.startsWith('TH') || p.Name.toLowerCase().includes('secret')).length,
    f1: allProducts.filter(p => p.CategorySlug === 'f1-racing' || p.Name.toLowerCase().includes('f1')).length,
    ao_racing: allProducts.filter(p => p.Name.toLowerCase().includes('ao racing') || p.Name.toLowerCase().includes('rexy') || p.Name.toLowerCase().includes('roxy') || p.Name.toLowerCase().includes('ske')).length,
    in_stock: allProducts.filter(p => p.Status === 'in_stock').length
  };

  document.querySelectorAll('.filter-pill').forEach(btn => {
    const filterKey = btn.getAttribute('data-filter');
    const badge = btn.querySelector('.pill-count');
    if (badge && counts[filterKey] !== undefined) {
      badge.textContent = `(${counts[filterKey]})`;
    }
  });
}

// =====================================================================
// 7. BỘ LỌC DANH MỤC (FILTER PILLS INTERACTION)
// =====================================================================
function setupFilterPills() {
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter') || 'all';
      renderProductsGrid();
    });
  });
}

// =====================================================================
// 8. ĐỒNG HỒ ĐẾM NGƯỢC PRE-ORDER (COUNTDOWN TIMER)
// =====================================================================
function setupCountdown() {
  // Hạn đóng cọc: 30/10/2026 23:59:59
  const targetDate = new Date('2026-10-30T23:59:59').getTime();

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      document.getElementById('daysVal').textContent = '00';
      document.getElementById('hoursVal').textContent = '00';
      document.getElementById('minsVal').textContent = '00';
      document.getElementById('secsVal').textContent = '00';
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
// 9. QUẢN LÝ GIỎ HÀNG & ĐẶT CỌC (CART DRAWER)
// =====================================================================
function handleCardAction(productId) {
  addToCart(productId, 1);
  openCartDrawer();
}

function addToCart(productId, quantity = 1) {
  const prod = allProducts.find(p => p.ProductId === productId);
  if (!prod) return;

  const existing = cart.find(it => it.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      productId: prod.ProductId,
      name: prod.Name,
      sku: prod.Sku,
      price: prod.Price,
      depositAmount: prod.DepositAmount || Math.round(prod.Price * 0.35),
      imageUrl: prod.ImageUrl,
      isPreOrder: prod.Status === 'pre_order',
      quantity: quantity
    });
  }

  saveCart();
  renderCartDrawer();
  showToast(`Đã thêm "${prod.Name}" vào giỏ cọc!`, 'success');
}

function saveCart() {
  localStorage.setItem('minigt_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const count = cart.reduce((acc, it) => acc + it.quantity, 0);
  const badge = document.getElementById('cartBadgeCount');
  if (badge) {
    badge.textContent = count;
    badge.classList.remove('bump');
    void badge.offsetWidth; // Force reflow
    if (count > 0) {
      badge.classList.add('bump');
    }
  }
}

function changeCartQty(productId, delta) {
  const it = cart.find(i => i.productId === productId);
  if (!it) return;
  it.quantity += delta;
  if (it.quantity <= 0) {
    cart = cart.filter(i => i.productId !== productId);
  }
  saveCart();
  renderCartDrawer();
}

function removeCartItem(productId) {
  cart = cart.filter(i => i.productId !== productId);
  saveCart();
  renderCartDrawer();
}

function renderCartDrawer() {
  const itemsContainer = document.getElementById('cartDrawerItems');
  const totalAmountEl = document.getElementById('cartTotalAmount');
  const depositAmountEl = document.getElementById('cartDepositAmount');
  if (!itemsContainer) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <p style="font-size: 32px; margin-bottom: 8px;">🛒</p>
        <p>Giỏ hàng của bạn đang trống</p>
        <p style="font-size: 12px; margin-top: 4px;">Khám phá các mẫu Pre-order MINI GT 2026 ngay!</p>
      </div>
    `;
    if (totalAmountEl) totalAmountEl.textContent = '0đ';
    if (depositAmountEl) depositAmountEl.textContent = '0đ';
    return;
  }

  let total = 0;
  let totalDeposit = 0;

  itemsContainer.innerHTML = cart.map(it => {
    total += it.price * it.quantity;
    totalDeposit += it.depositAmount * it.quantity;

    return `
      <div class="cart-item">
        <img class="cart-item-thumb" src="${it.imageUrl}" alt="${it.name}">
        <div class="cart-item-details">
          <div class="cart-item-title">${it.name}</div>
          <div class="cart-item-price">${formatVND(it.price)} ${it.isPreOrder ? '<span class="badge badge-preorder" style="font-size:9px;">Cọc trước</span>' : ''}</div>
          <div class="cart-item-actions">
            <div class="quantity-stepper">
              <button onclick="changeCartQty(${it.productId}, -1)">-</button>
              <span>${it.quantity}</span>
              <button onclick="changeCartQty(${it.productId}, 1)">+</button>
            </div>
            <button class="remove-cart-item" onclick="removeCartItem(${it.productId})">Xóa</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (totalAmountEl) totalAmountEl.textContent = formatVND(total);
  if (depositAmountEl) depositAmountEl.textContent = formatVND(totalDeposit);
}

function openCartDrawer() {
  const overlay = document.getElementById('cartDrawerOverlay');
  if (overlay) overlay.classList.add('active');
}

function closeCartDrawer() {
  const overlay = document.getElementById('cartDrawerOverlay');
  if (overlay) overlay.classList.remove('active');
}

// =====================================================================
// 10. MODAL XEM NHANH SẢN PHẨM (QUICK VIEW)
// =====================================================================
function openQuickView(productId) {
  const prod = allProducts.find(p => p.ProductId === productId);
  if (!prod) return;

  const modal = document.getElementById('quickViewModal');
  const body = document.getElementById('quickViewModalBody');
  if (!modal || !body) return;

  const isPreOrder = prod.Status === 'pre_order';
  const isSoldOut = prod.Status === 'sold_out';

  body.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); align-items: center;">
      <div style="background: radial-gradient(circle, #fff 50%, #f1f5f9 100%); border-radius: var(--radius-lg); padding: 1.5rem; text-align: center; border: 1px solid var(--color-gray-200);">
        <img src="${prod.ImageUrl}" alt="${prod.Name}" style="max-height: 240px; margin: 0 auto; object-fit: contain;">
      </div>
      <div>
        <span class="badge ${isPreOrder ? 'badge-preorder' : 'badge-instock'}" style="margin-bottom: 8px;">
          ${isPreOrder ? 'PRE-ORDER 2026' : 'CÓ SẴN GIAO NGAY'}
        </span>
        <h2 style="font-size: var(--text-lg); margin-bottom: 6px; color: var(--color-navy);">${prod.Name}</h2>
        <div style="font-size: var(--text-xs); color: var(--color-primary); font-weight: bold; margin-bottom: 12px;">
          #${prod.Sku} ${prod.EditionNote ? '• ' + prod.EditionNote : ''}
        </div>
        <div style="font-size: var(--text-2xl); font-weight: 800; color: var(--color-navy); margin-bottom: 12px;">
          ${formatVND(prod.Price)}
          ${prod.OldPrice ? `<span style="font-size: var(--text-sm); color: var(--color-gray-400); text-decoration: line-through; margin-left: 8px;">${formatVND(prod.OldPrice)}</span>` : ''}
        </div>
        <p style="font-size: var(--text-xs); color: var(--color-gray-600); margin-bottom: 14px; line-height: 1.6;">
          ${prod.Description || 'Mô hình diecast tỉ lệ 1:64 chính hãng bản quyền, chi tiết sơn sắc nét, lốp cao su cao cấp.'}
        </p>
        <div style="font-size: var(--text-xs); margin-bottom: 16px; display: flex; flex-direction: column; gap: 4px;">
          <div><strong>Thương hiệu:</strong> ${prod.Brand}</div>
          <div><strong>Tỉ lệ:</strong> ${prod.Scale}</div>
          <div><strong>Bản quyền:</strong> Official Licensed Product</div>
          ${prod.PreOrderDeadline ? `<div><strong>Hạn chốt cọc:</strong> <span style="color:var(--color-primary); font-weight:bold;">${prod.PreOrderDeadline}</span></div>` : ''}
        </div>
        <button class="btn btn-primary" style="width: 100%;" ${isSoldOut ? 'disabled' : ''} onclick="addToCart(${prod.ProductId}, 1); closeModal('quickViewModal'); openCartDrawer();">
          ${isPreOrder ? '🛒 Đặt cọc giữ slot ngay' : '🛒 Thêm vào giỏ hàng'}
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// =====================================================================
// 11. CHECKOUT & TẠO MÃ VIETQR TỰ ĐỘNG
// =====================================================================
function openCheckoutModal() {
  if (cart.length === 0) {
    showToast('Giỏ hàng trống!', 'error');
    return;
  }
  closeCartDrawer();
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    // Tự động điền nếu đã đăng nhập
    if (currentUser) {
      const nameInput = document.getElementById('checkoutName');
      const emailInput = document.getElementById('checkoutEmail');
      const phoneInput = document.getElementById('checkoutPhone');
      if (nameInput) nameInput.value = currentUser.fullName || '';
      if (emailInput) emailInput.value = currentUser.email || '';
      if (phoneInput && currentUser.phone) phoneInput.value = currentUser.phone;
    }
    updateCheckoutSummary();
    modal.classList.add('active');
  }
}

function updateCheckoutSummary() {
  const summaryBox = document.getElementById('checkoutSummaryBox');
  if (!summaryBox) return;

  const total = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const totalDeposit = cart.reduce((acc, it) => acc + (it.depositAmount * it.quantity), 0);
  const shippingFee = total > 1000000 ? 0 : 35000;

  summaryBox.innerHTML = `
    <div style="border-bottom: 1px solid var(--color-gray-200); padding-bottom: 8px; margin-bottom: 8px;">
      ${cart.map(it => `
        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
          <span>${it.name} (x${it.quantity})</span>
          <strong>${formatVND(it.price * it.quantity)}</strong>
        </div>
      `).join('')}
    </div>
    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
      <span>Phí vận chuyển bọc chống sốc:</span>
      <span>${shippingFee === 0 ? '<strong style="color:green;">Miễn phí</strong>' : formatVND(shippingFee)}</span>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:bold; margin-top:6px; color:var(--color-navy);">
      <span>Tổng giá trị đơn:</span>
      <span style="color:var(--color-primary);">${formatVND(total + shippingFee)}</span>
    </div>
    ${totalDeposit > 0 ? `
      <div style="margin-top:8px; padding:8px; background:#fff1f1; border-radius:var(--radius-sm); font-size:12px; color:var(--color-primary);">
        <strong>Tiền cọc giữ mẫu đợt này:</strong> ${formatVND(totalDeposit)}
      </div>
    ` : ''}
  `;
}

async function submitOrder() {
  const name = document.getElementById('checkoutName')?.value.trim();
  const phone = document.getElementById('checkoutPhone')?.value.trim();
  const address = document.getElementById('checkoutAddress')?.value.trim();
  const note = document.getElementById('checkoutNote')?.value.trim();
  const rawMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'BANK_TRANSFER';
  const standardizedMethod = rawMethod.toUpperCase().includes('COD') ? 'COD' : 'BANK_TRANSFER';

  if (!name || !phone || !address) {
    showToast('Vui lòng điền Họ tên, Số điện thoại và Địa chỉ nhận hàng!', 'error');
    return;
  }

  const payload = {
    fullName: name,
    phone: phone,
    address: address,
    note: note,
    paymentMethod: standardizedMethod,
    items: cart.map(i => ({ productId: i.productId, quantity: i.quantity }))
  };

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

    const json = await safeFetch('/api/orders', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (json.success && (json.order || json.data)) {
      handleOrderSuccess(json.order || json.data);
    } else {
      handleOrderSuccessLocal(payload);
    }
  } catch (err) {
    console.warn('Lỗi khi gửi đơn lên máy chủ:', err.message);
    handleOrderSuccessLocal(payload);
  }
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

function startPaymentPolling(orderCode) {
  if (paymentPollInterval) clearInterval(paymentPollInterval);

  paymentPollInterval = setInterval(async () => {
    try {
      const json = await safeFetch(`/api/orders/check-status/${orderCode}`);
      if (json.success && json.data) {
        const ord = json.data;
        if (ord.PaymentStatus === 'PAID') {
          clearInterval(paymentPollInterval);
          paymentPollInterval = null;

          const box = document.getElementById('paymentLiveStatusBox');
          if (box) {
            box.style.background = '#f0fdf4';
            box.style.border = '1.5px solid #86efac';
            box.style.color = '#15803d';
            box.innerHTML = `
              <div style="font-size:24px;">🎉</div>
              <div style="text-align:left;">
                <div style="font-size:13px; font-weight:800; color:#15803d;">ĐÃ NHẬN TIỀN CỌC THÀNH CÔNG!</div>
                <div style="font-size:11.5px; color:#166534; margin-top:2px;">
                  Hệ thống Admin đã xác nhận thanh toán đơn <strong>#${orderCode}</strong>. Kiện hàng đang được đóng gói chuẩn bị giao qua <strong>SPX Express</strong>!
                </div>
              </div>
            `;
          }
          showToast(`🎉 Cửa hàng đã xác nhận thanh toán đơn #${orderCode}!`, 'success');
        }
      }
    } catch (e) {
      // silent polling failure
    }
  }, 3500);
}

function handleOrderSuccess(order) {
  cart = [];
  saveCart();
  closeModal('checkoutModal');

  const successModal = document.getElementById('orderSuccessModal');
  const detailsEl = document.getElementById('orderSuccessDetails');

  const isCOD = (order.paymentMethod || '').toUpperCase().includes('COD');
  const transferAmount = order.totalDeposit > 0 ? order.totalDeposit : order.total;
  const transferDesc = `MINI GT ${order.orderCode}`;
  const bankAcc = '87654321082007';
  const bankName = 'MBBank (Ngân Hàng Quân Đội)';
  const accName = 'DO QUOC THINH';
  const dynamicQrUrl = `https://img.vietqr.io/image/MB-${bankAcc}-compact2.png?amount=${transferAmount}&addInfo=${encodeURIComponent(transferDesc)}&accountName=${encodeURIComponent(accName)}`;
  const originalQrImg = 'image/qr-mb-doquocthinh.png';

  if (detailsEl) {
    detailsEl.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:40px; margin-bottom:6px;">🎉</div>
        <h3 style="font-size:var(--text-lg); color:var(--color-navy); margin-bottom:4px;">Đặt Hàng / Cọc Thành Công!</h3>
        <p style="font-size:13px; color:var(--color-gray-600); margin-bottom:12px;">
          Mã đơn hàng của bạn: <strong style="color:var(--color-primary); font-size:16px;">#${order.orderCode}</strong>
        </p>

        ${isCOD ? `
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:16px; margin-bottom:12px; text-align:left;">
            <p style="font-size:13px; font-weight:700; color:#15803d; margin-bottom:4px;">💵 Phương thức: Thanh toán khi nhận hàng (COD)</p>
            <p style="font-size:12px; color:#166534; line-height:1.5;">
              Đơn hàng của bạn đã được ghi nhận vào hệ thống. Cửa hàng sẽ sớm kiểm tra, duyệt đơn và đóng gói chuyển cho đơn vị vận chuyển <strong>SPX Express</strong>. Bạn sẽ thanh toán <strong>${formatVND(order.total)}</strong> trực tiếp cho shipper khi nhận hàng.
            </p>
          </div>
        ` : `
          <!-- Khối Thanh Toán Chi Tiết MB Bank & Mã QR của Đỗ Quốc Thịnh -->
          <div class="bank-payment-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #f1f5f9; padding-bottom:8px;">
              <span style="font-size:12px; font-weight:800; color:#dc2626; text-transform:uppercase;">
                🏦 Chuyển khoản cọc giữ mẫu (MB Bank)
              </span>
              <button type="button" class="btn btn-sm btn-outline" style="font-size:11px; padding:2px 8px;" onclick="const img=document.getElementById('displayQrImage'); if(img.dataset.mode==='dynamic'){img.src='${originalQrImg}'; img.dataset.mode='original'; this.textContent='Chuyển sang QR tự điền tiền';}else{img.src='${dynamicQrUrl}'; img.dataset.mode='dynamic'; this.textContent='Xem QR gốc MB';}">
                Chuyển sang QR tự điền tiền
              </button>
            </div>

            <div class="bank-info-grid">
              <div class="qr-display-wrap">
                <img src="${originalQrImg}" data-mode="original" id="displayQrImage" alt="Mã QR MBBank Đỗ Quốc Thịnh" class="qr-display-img" title="Bấm để phóng to hoặc quét mã thanh toán">
                <div style="font-size:10.5px; color:#64748b; margin-top:4px;">Quét mã VietQR MB</div>
              </div>

              <div style="text-align:left;">
                <div class="bank-detail-item">
                  <span style="color:#64748b;">Ngân hàng:</span>
                  <span class="bank-detail-val" style="color:#1d4ed8;">MB (Ngân Hàng Quân Đội)</span>
                </div>
                <div class="bank-detail-item">
                  <span style="color:#64748b;">Số tài khoản:</span>
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span class="bank-detail-val" style="font-family:var(--font-mono); font-size:13px; color:#dc2626;">${bankAcc}</span>
                    <button type="button" class="btn-copy-mini" onclick="copyToClipboard('${bankAcc}', 'Đã sao chép Số tài khoản MB Bank!')">📋 Copy</button>
                  </div>
                </div>
                <div class="bank-detail-item">
                  <span style="color:#64748b;">Chủ tài khoản:</span>
                  <span class="bank-detail-val">${accName}</span>
                </div>
                <div class="bank-detail-item">
                  <span style="color:#64748b;">Số tiền cọc:</span>
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span class="bank-detail-val" style="color:#dc2626;">${formatVND(transferAmount)}</span>
                    <button type="button" class="btn-copy-mini" onclick="copyToClipboard('${transferAmount}', 'Đã sao chép Số tiền cọc!')">📋 Copy</button>
                  </div>
                </div>
                <div class="bank-detail-item">
                  <span style="color:#64748b;">Nội dung CK:</span>
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span class="bank-detail-val" style="color:#2563eb; font-weight:800;">${transferDesc}</span>
                    <button type="button" class="btn-copy-mini" onclick="copyToClipboard('${transferDesc}', 'Đã sao chép Nội dung chuyển khoản!')">📋 Copy</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Thanh tự động kiểm tra trạng thái thanh toán thời gian thực -->
            <div id="paymentLiveStatusBox" class="payment-status-pulsing">
              <div class="pulse-spinner"></div>
              <span>Hệ thống đang tự động kiểm tra trạng thái chuyển khoản từ Admin...</span>
            </div>
          </div>

          <!-- Khu vực tải lên biên lai chuyển khoản -->
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:12px; text-align:left;">
            <label style="font-size:12px; font-weight:700; color:var(--color-navy); display:block; margin-bottom:6px;">
              🧾 Tải lên ảnh biên lai chuyển khoản (Tùy chọn):
            </label>
            <div style="display:flex; gap:8px;">
              <input type="text" id="userReceiptInput" class="form-control" style="font-size:12px; padding:6px 10px; flex:1;" placeholder="Nhập đường dẫn ảnh bill (vd: image/bill.png)">
              <button type="button" class="btn btn-sm btn-primary" style="padding:6px 12px; font-size:12px;" onclick="uploadUserReceipt('${order.orderCode}')">
                Gửi bill
              </button>
            </div>
            <p style="font-size:10.5px; color:#64748b; margin-top:4px;">Gửi ảnh biên lai giúp nhân viên duyệt đơn cọc của bạn nhanh hơn!</p>
          </div>
        `}

        <div style="display:flex; justify-content:center; gap:10px; margin-top:12px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="closeModal('orderSuccessModal'); openMyOrdersModal();">
            📦 Xem trong Đơn của tôi
          </button>
          <button type="button" class="btn btn-primary btn-sm" onclick="closeModal('orderSuccessModal')">
            Tiếp tục xem mô hình ➔
          </button>
        </div>

        <p style="font-size:11.5px; color:var(--color-gray-500); margin-top:10px;">
          Hotline hỗ trợ & đối soát: <strong>0848.184.164</strong> (Zalo Do Quoc Thinh) | Vận chuyển chính thức: <strong>SPX Express</strong>
        </p>
      </div>
    `;

    // Khởi động polling tự động nếu là chuyển khoản
    if (!isCOD) {
      startPaymentPolling(order.orderCode);
    }
  }

  if (successModal) successModal.classList.add('active');
}

async function uploadUserReceipt(orderCode) {
  const input = document.getElementById('userReceiptInput');
  const receiptImage = input ? input.value.trim() : '';
  if (!receiptImage) {
    showToast('Vui lòng nhập đường dẫn hoặc tên ảnh biên lai!', 'error');
    return;
  }

  try {
    const json = await safeFetch('/api/orders/upload-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderCode, receiptImage })
    });
    if (json.success) {
      showToast(json.message, 'success');
      if (input) input.disabled = true;
    } else {
      showToast(json.message, 'error');
    }
  } catch (err) {
    showToast('Lỗi gửi biên lai: ' + err.message, 'error');
  }
}

function handleOrderSuccessLocal(payload) {
  const code = 'MGT-2026-' + Math.floor(10000 + Math.random() * 90000);
  const total = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const totalDeposit = cart.reduce((acc, it) => acc + (it.depositAmount * it.quantity), 0);
  const qrUrl = `https://img.vietqr.io/image/MB-87654321082007-compact2.png?amount=${totalDeposit}&addInfo=MINI%20GT%20${code}&accountName=DO%20QUOC%20THINH`;

  handleOrderSuccess({
    orderCode: code,
    total,
    totalDeposit,
    paymentMethod: payload.paymentMethod || 'BANK_TRANSFER',
    qrUrl
  });
}

// =====================================================================
// 12. ĐĂNG NHẬP / ĐĂNG KÝ BẰNG GMAIL & TÀI KHOẢN (AUTH SYSTEM)
// =====================================================================
function openAuthModal(defaultTab = 'login') {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  switchAuthTab(defaultTab);
  modal.classList.add('active');
}

function switchAuthTab(tab) {
  const tabLogin = document.getElementById('tabBtnLogin');
  const tabRegister = document.getElementById('tabBtnRegister');
  const formLogin = document.getElementById('authFormLogin');
  const formRegister = document.getElementById('authFormRegister');

  if (tab === 'login') {
    tabLogin?.classList.add('active');
    tabRegister?.classList.remove('active');
    formLogin?.style.setProperty('display', 'block');
    formRegister?.style.setProperty('display', 'none');
  } else {
    tabRegister?.classList.add('active');
    tabLogin?.classList.remove('active');
    formRegister?.style.setProperty('display', 'block');
    formLogin?.style.setProperty('display', 'none');
  }
}

async function handleLocalLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;

  if (!email || !password) {
    showToast('Vui lòng nhập email và mật khẩu!', 'error');
    return;
  }

  try {
    const json = await safeFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (json.success) {
      loginSuccess(json.user, json.token);
    } else {
      showToast(json.message || 'Đăng nhập không thành công', 'error');
    }
  } catch (err) {
    showToast('Lỗi đăng nhập: ' + err.message, 'error');
  }
}

async function handleLocalRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById('regFullName')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();
  const password = document.getElementById('regPassword')?.value;
  const phone = document.getElementById('regPhone')?.value.trim();

  if (!fullName || !email || !password) {
    showToast('Vui lòng điền các trường bắt buộc!', 'error');
    return;
  }

  try {
    const json = await safeFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, phone })
    });
    if (json.success) {
      showToast('Đăng ký tài khoản thành công!', 'success');
      loginSuccess(json.user, json.token);
    } else {
      showToast(json.message || 'Đăng ký không thành công', 'error');
    }
  } catch (err) {
    showToast('Lỗi đăng ký: ' + err.message, 'error');
  }
}

// Xử lý đăng nhập bằng Google / Gmail
async function handleGoogleLoginClick() {
  const gmailInput = prompt('Nhập địa chỉ Gmail của bạn để đăng nhập:', 'quocthinh.diecast@gmail.com');
  if (!gmailInput) return;

  try {
    const json = await safeFetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInfo: {
          email: gmailInput,
          name: gmailInput.split('@')[0].toUpperCase(),
          picture: 'image/DoQuocThinh_anhthe.jpg',
          googleId: 'google_' + Date.now()
        }
      })
    });
    if (json.success) {
      loginSuccess(json.user, json.token);
    } else {
      // Offline fallback
      loginSuccess({
        fullName: gmailInput.split('@')[0],
        email: gmailInput,
        avatarUrl: 'image/DoQuocThinh_anhthe.jpg',
        role: 'customer'
      }, 'demo_token_' + Date.now());
    }
  } catch (err) {
    loginSuccess({
      fullName: gmailInput.split('@')[0],
      email: gmailInput,
      avatarUrl: 'image/DoQuocThinh_anhthe.jpg',
      role: 'customer'
    }, 'demo_token_' + Date.now());
  }
}

function loginSuccess(user, token) {
  currentUser = user;
  currentToken = token;
  localStorage.setItem('minigt_user', JSON.stringify(user));
  localStorage.setItem('minigt_token', token);

  updateUserHeaderUI();
  closeModal('authModal');
  showToast(`Xin chào, ${user.fullName || user.email}! Đăng nhập thành công.`, 'success');

  if (user.role === 'admin') {
    setTimeout(() => {
      if (confirm('👑 Bạn đã đăng nhập bằng tài khoản Quản Trị Viên! Bạn có muốn truy cập ngay vào Admin Portal để quản lý đơn hàng & mô hình xe không?')) {
        window.location.href = 'admin/index.html';
      }
    }, 450);
  }
}

function quickFillAuth(type) {
  switchAuthTab('login');
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (type === 'admin') {
    if (emailInput) emailInput.value = 'admin@gmail.com';
    if (passInput) passInput.value = 'Admin@2026!';
  } else {
    if (emailInput) emailInput.value = 'khachhang@gmail.com';
    if (passInput) passInput.value = 'Khach@2026!';
  }
}

function logout() {
  currentUser = null;
  currentToken = null;
  localStorage.removeItem('minigt_user');
  localStorage.removeItem('minigt_token');
  updateUserHeaderUI();
  showToast('Đã đăng xuất tài khoản!', 'info');
}

function updateUserHeaderUI() {
  const container = document.getElementById('userProfileArea');
  if (!container) return;

  if (currentUser) {
    const isAdmin = currentUser.role === 'admin';
    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        ${isAdmin ? '<a href="admin/index.html" class="btn btn-sm btn-primary" style="padding: 4px 10px; font-size: 11px;">👑 Quản Trị Admin</a>' : ''}
        <div class="user-profile-btn" onclick="toggleUserDropdown(event)">
          <img class="user-avatar" src="${currentUser.avatarUrl || 'image/DoQuocThinh_anhthe.jpg'}" alt="${currentUser.fullName}" onerror="this.src='image/logominigt.png'">
          <span style="font-size:12px; font-weight:600;">${currentUser.fullName || currentUser.email}</span>
          <span style="font-size:10px;">▼</span>
          <div class="user-dropdown" id="userDropdownMenu">
            <div class="user-dropdown-header">
              <div class="user-dropdown-name">${currentUser.fullName}</div>
              <div class="user-dropdown-email">${currentUser.email}</div>
            </div>
            ${isAdmin ? '<a href="admin/index.html" class="user-dropdown-item" style="color:var(--color-primary); font-weight:bold;">👑 Mở Trang Quản Trị Admin</a>' : ''}
            <div class="user-dropdown-item" onclick="openMyOrdersModal()">🛍️ Đơn hàng của tôi (SPX)</div>
            <div class="user-dropdown-item" onclick="openTrackingModal()">📦 Tra cứu đơn cọc</div>
            <div class="user-dropdown-item" onclick="logout()">🚪 Đăng xuất</div>
          </div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="openAuthModal('login')">
        👤 Đăng nhập Gmail
      </button>
    `;
  }
}

function toggleUserDropdown(e) {
  e.stopPropagation();
  const menu = document.getElementById('userDropdownMenu');
  if (menu) menu.classList.toggle('active');
}

document.addEventListener('click', () => {
  const menu = document.getElementById('userDropdownMenu');
  if (menu) menu.classList.remove('active');
});

// =====================================================================
// 13. TRA CỨU ĐƠN HÀNG (TRACKING MODAL) & ĐƠN HÀNG CỦA TÔI (MY ORDERS)
// =====================================================================
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

async function loadMyOrdersList() {
  const container = document.getElementById('myOrdersModalContent');
  if (!container) return;

  if (!currentUser) {
    container.innerHTML = `
      <div style="text-align:center; padding:2rem; background:#f8fafc; border-radius:10px; border:1px dashed #cbd5e1;">
        <div style="font-size:36px; margin-bottom:8px;">👤</div>
        <h4 style="font-size:15px; color:var(--color-navy); margin-bottom:6px;">Bạn Chưa Đăng Nhập</h4>
        <p style="font-size:12.5px; color:#64748b; margin-bottom:14px;">
          Vui lòng đăng nhập bằng Gmail hoặc tài khoản cá nhân để xem tất cả đơn hàng & mã vận đơn SPX Express đã đặt.
        </p>
        <div style="display:flex; justify-content:center; gap:8px;">
          <button class="btn btn-primary btn-sm" onclick="closeModal('myOrdersModal'); openAuthModal('login');">
            👤 Đăng nhập ngay
          </button>
          <button class="btn btn-outline btn-sm" onclick="closeModal('myOrdersModal'); openTrackingModal();">
            🔍 Tra cứu theo SĐT / Mã đơn
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = '<p style="text-align:center; padding:1.5rem; color:#64748b;">Đang tải danh sách đơn hàng của bạn...</p>';

  try {
    const json = await safeFetch('/api/orders/my-orders', {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });

    if (json.success && json.data && json.data.length > 0) {
      renderMyOrdersCards(json.data, container);
    } else {
      container.innerHTML = `
        <div style="text-align:center; padding:2.5rem 1rem;">
          <div style="font-size:40px; margin-bottom:8px;">🛒</div>
          <h4 style="font-size:15px; color:var(--color-navy); margin-bottom:6px;">Bạn Chưa Có Đơn Hàng Nào</h4>
          <p style="font-size:12.5px; color:#64748b; margin-bottom:14px;">
            Hãy khám phá các mẫu xe mô hình 1:64 cực hot và đặt cọc ngay hôm nay!
          </p>
          <button class="btn btn-primary btn-sm" onclick="closeModal('myOrdersModal'); scrollToSection('catalog');">
            🏎️ Xem Catalogue Mô Hình
          </button>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = `
      <div style="text-align:center; padding:1.5rem; color:#dc2626;">
        <p>Lỗi tải đơn hàng: ${err.message}</p>
        <button class="btn btn-sm btn-outline" style="margin-top:8px;" onclick="loadMyOrdersList()">Thử lại</button>
      </div>
    `;
  }
}

function renderMyOrdersCards(orders, container) {
  container.innerHTML = orders.map(ord => {
    const itemsCount = ord.items ? ord.items.length : 0;
    const isPaid = (ord.PaymentStatus || '').toUpperCase() === 'PAID';
    const ordStatus = (ord.Status || 'PENDING').toUpperCase();

    let statusBadgeText = 'Chờ duyệt đơn';
    let statusBadgeClass = 'badge-preorder';
    if (ordStatus === 'CONFIRMED') {
      statusBadgeText = 'Đã duyệt • Đang chuẩn bị xe';
      statusBadgeClass = 'badge-chase';
    } else if (ordStatus === 'SHIPPING') {
      statusBadgeText = 'Đang giao hàng (SPX)';
      statusBadgeClass = 'badge-chase';
    } else if (ordStatus === 'DELIVERED') {
      statusBadgeText = 'Đã giao thành công';
      statusBadgeClass = 'badge-instock';
    } else if (ordStatus === 'CANCELLED') {
      statusBadgeText = 'Đã hủy';
      statusBadgeClass = 'badge-preorder';
    }

    return `
      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; border-bottom:1px solid #f1f5f9; padding-bottom:8px; flex-wrap:wrap; gap:6px;">
          <div>
            <strong style="color:var(--color-navy); font-size:14px;">#${ord.OrderCode}</strong>
            <span style="font-size:11.5px; color:#94a3b8; margin-left:8px;">${new Date(ord.CreatedAt).toLocaleDateString('vi-VN')}</span>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:9999px; background:${isPaid ? '#ecfdf5' : '#fef2f2'}; color:${isPaid ? '#059669' : '#dc2626'}; border:1px solid ${isPaid ? '#a7f3d0' : '#fecaca'};">
              ${isPaid ? '✓ Đã thanh toán cọc' : 'Chưa nhận cọc'}
            </span>
            <span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:9999px; background:#f1f5f9; color:#1e293b;">
              ${statusBadgeText}
            </span>
          </div>
        </div>

        <!-- Danh sách xe trong đơn -->
        ${ord.items && ord.items.length > 0 ? `
          <div style="margin-bottom:8px;">
            ${ord.items.map(it => `
              <div style="display:flex; align-items:center; gap:8px; font-size:12px; margin-bottom:4px;">
                <img src="${it.ImageUrl || 'image/hero-banner.png'}" style="width:28px; height:28px; object-fit:contain; border-radius:4px; border:1px solid #e2e8f0;">
                <span style="flex:1;"><strong>${it.ProductName}</strong> (x${it.Quantity})</span>
                <span style="color:#64748b;">${formatVND(it.UnitPrice * it.Quantity)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="display:flex; justify-content:space-between; font-size:12.5px; border-top:1px dashed #e2e8f0; padding-top:6px; margin-top:6px;">
          <span>Địa chỉ nhận: <strong style="color:#334155;">${escapeHtml(ord.Address)}</strong></span>
          <strong style="color:var(--color-primary); font-size:14px;">${formatVND(ord.Total)}</strong>
        </div>

        <!-- Khối Vận đơn SPX Express nếu có -->
        ${ord.TrackingCode ? `
          <div class="spx-shipping-box" style="margin-top:10px; margin-bottom:0;">
            <div class="spx-header-row">
              <span class="spx-badge">🚚 SPX Express (Shopee Xpress)</span>
              <span style="font-size:11.5px; color:#c2410c; font-weight:700;">Đang trên đường giao</span>
            </div>
            <div style="font-size:12px; color:#7c2d12; margin-bottom:4px;">
              Đơn hàng của bạn đang được vận chuyển bởi <strong>SPX Express</strong>.
            </div>
            <div class="spx-tracking-number-wrap">
              <div>
                <div style="font-size:10.5px; color:#9a3412; text-transform:uppercase; font-weight:700;">Mã vận đơn SPX:</div>
                <div class="spx-tracking-code">${ord.TrackingCode}</div>
              </div>
              <button type="button" class="btn-copy-tracking" onclick="copyToClipboard('${ord.TrackingCode}', 'Đã sao chép mã vận đơn SPX Express!')">
                📋 Sao chép mã
              </button>
            </div>
            <div class="spx-actions-row">
              <a href="https://spx.vn/vi" target="_blank" class="btn-spx-track">
                🔗 Mở trang tra cứu SPX (https://spx.vn/vi) ↗
              </a>
              <span style="font-size:11px; color:#9a3412; align-self:center;">
                (Chỉ cần dán mã vận đơn vừa sao chép vào trang SPX để xem vị trí kiện xe)
              </span>
            </div>
          </div>
        ` : `
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:6px 10px; margin-top:8px; font-size:11.5px; color:#64748b; display:flex; justify-content:space-between; align-items:center;">
            <span>🚚 Đơn vị vận chuyển: <strong>SPX Express</strong> (Mã vận đơn sẽ cập nhật khi xuất kho)</span>
            <a href="https://spx.vn/vi" target="_blank" style="color:#ea580c; text-decoration:none; font-weight:600;">spx.vn/vi ↗</a>
          </div>
        `}
      </div>
    `;
  }).join('');
}

async function searchOrderTracking() {
  const query = document.getElementById('trackingInput')?.value.trim();
  const resultsContainer = document.getElementById('trackingResults');
  if (!query) {
    showToast('Vui lòng nhập Mã đơn hàng hoặc Số điện thoại!', 'error');
    return;
  }

  if (resultsContainer) {
    resultsContainer.innerHTML = '<p style="text-align:center; padding:1rem; color:var(--color-gray-500);">Đang tra cứu dữ liệu...</p>';
  }

  try {
    const json = await safeFetch(`/api/orders/track/${encodeURIComponent(query)}`);
    if (json.success && json.data && json.data.length > 0) {
      renderTrackingResults(json.data);
    } else {
      if (resultsContainer) {
        resultsContainer.innerHTML = `
          <div style="text-align:center; padding:2rem; color:var(--color-gray-500);">
            <p>Không tìm thấy đơn hàng nào khớp với "<strong>${query}</strong>".</p>
            <p style="font-size:12px; margin-top:4px;">Vui lòng kiểm tra lại mã đơn hoặc số điện thoại khi đặt cọc.</p>
          </div>
        `;
      }
    }
  } catch (e) {
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div style="padding:1rem; background:#f1f5f9; border-radius:var(--radius-md); font-size:12px;">
          <p><strong>Mã tra cứu:</strong> ${query}</p>
          <p><strong>Trạng thái:</strong> <span class="badge badge-preorder">Đang xử lý đơn cọc</span></p>
          <p style="margin-top:6px; color:var(--color-gray-500);">Vui lòng liên hệ Hotline 0848.184.164 nếu cần hỗ trợ thêm.</p>
        </div>
      `;
    }
  }
}

function renderTrackingResults(orders) {
  const resultsContainer = document.getElementById('trackingResults');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = orders.map(ord => {
    const isPaid = (ord.PaymentStatus || '').toUpperCase() === 'PAID';
    return `
      <div style="background:var(--color-gray-50); border:1px solid var(--color-gray-200); border-radius:var(--radius-md); padding:1rem; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
          <strong style="color:var(--color-navy); font-size:14px;">#${ord.OrderCode}</strong>
          <div style="display:flex; gap:6px;">
            <span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:9999px; background:${isPaid ? '#ecfdf5' : '#fef2f2'}; color:${isPaid ? '#059669' : '#dc2626'}; border:1px solid ${isPaid ? '#a7f3d0' : '#fecaca'};">
              ${isPaid ? '✓ Đã nhận tiền' : 'Chưa cọc'}
            </span>
            <span class="badge ${ord.Status === 'completed' || ord.Status === 'DELIVERED' ? 'badge-instock' : 'badge-preorder'}">
              ${(ord.Status || 'PENDING').toUpperCase()}
            </span>
          </div>
        </div>
        <div style="font-size:12px; color:var(--color-gray-600); margin-bottom:4px;">
          Khách hàng: <strong>${escapeHtml(ord.FullName)}</strong> | SĐT: ${escapeHtml(ord.Phone)}
        </div>
        <div style="font-size:12px; color:var(--color-gray-600); margin-bottom:6px;">
          Địa chỉ nhận: ${escapeHtml(ord.Address)}
        </div>
        <div style="font-size:12px; font-weight:bold; color:var(--color-primary); border-top:1px dashed var(--color-gray-200); padding-top:6px;">
          Tổng tiền: ${formatVND(ord.Total)}
        </div>

        <!-- Khối SPX Express nếu có TrackingCode -->
        ${ord.TrackingCode ? `
          <div class="spx-shipping-box" style="margin-top:10px; margin-bottom:0;">
            <div class="spx-header-row">
              <span class="spx-badge">🚚 SPX Express (Shopee Xpress)</span>
              <span style="font-size:11.5px; color:#c2410c; font-weight:700;">Đang giao hàng</span>
            </div>
            <div style="font-size:12px; color:#7c2d12; margin-bottom:4px;">
              Kiện hàng xe mô hình đang được chuyển qua <strong>SPX Express</strong>.
            </div>
            <div class="spx-tracking-number-wrap">
              <div>
                <div style="font-size:10.5px; color:#9a3412; text-transform:uppercase; font-weight:700;">Mã vận đơn SPX:</div>
                <div class="spx-tracking-code">${ord.TrackingCode}</div>
              </div>
              <button type="button" class="btn-copy-tracking" onclick="copyToClipboard('${ord.TrackingCode}', 'Đã sao chép mã vận đơn SPX Express!')">
                📋 Sao chép mã
              </button>
            </div>
            <div class="spx-actions-row">
              <a href="https://spx.vn/vi" target="_blank" class="btn-spx-track">
                🔗 Tra cứu trên SPX Express (https://spx.vn/vi) ↗
              </a>
            </div>
          </div>
        ` : `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:6px 10px; margin-top:8px; font-size:11.5px; color:#64748b;">
            🚚 Vận chuyển: <strong>SPX Express</strong>. Mã vận đơn sẽ cập nhật khi shop bàn giao shipper.
          </div>
        `}
      </div>
    `;
  }).join('');
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

    const matched = allProducts.filter(p =>
      p.Name.toLowerCase().includes(q) ||
      p.Sku.toLowerCase().includes(q) ||
      (p.EditionNote && p.EditionNote.toLowerCase().includes(q))
    ).slice(0, 6);

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
// 16. MODAL UTILITIES
// =====================================================================
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function toggleMobileNav() {
  const menu = document.getElementById('navMenu');
  if (menu) menu.classList.toggle('mobile-open');
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

// =====================================================================
// 17. HIỆU ỨNG CUỘN TRANG, BACK TO TOP & PHÍM TẮT
// =====================================================================
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupScrollEffects() {
  const header = document.querySelector('.main-header');
  const bttBtn = document.getElementById('backToTopBtn');
  const progressFill = document.getElementById('scrollProgressFill');
  const circumference = 2 * Math.PI * 20; // 125.66

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) : 0;

    // 1. Sticky Frosted Header
    if (header) {
      if (scrollTop > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    // 2. Back to Top Progress & Visibility
    if (bttBtn && progressFill) {
      if (scrollTop > 260) {
        bttBtn.classList.add('visible');
      } else {
        bttBtn.classList.remove('visible');
      }

      const offset = circumference - (scrollPercent * circumference);
      progressFill.style.strokeDashoffset = Math.max(0, offset);
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

  // Observe existing static sections
  document.querySelectorAll('.section-header, .benefit-card, .combo-card, .flow-step').forEach(el => {
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
// 18. KHỞI CHẠY TẤT CẢ KHI TẢI XONG DOM
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupScrollEffects();
  setupScrollReveal();
  setupShortcuts();
  loadProducts();
  setupFilterPills();
  setupCountdown();
  setupSearch();
  updateCartBadge();
  updateUserHeaderUI();

  // Đóng modal khi bấm overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
});

