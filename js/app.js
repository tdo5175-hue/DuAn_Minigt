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
    Sku: "MGT00512",
    CarNumber: "1129",
    Name: "Lamborghini Huracán GT3 EVO #63 Squadra Corse Official",
    Slug: "lamborghini-huracan-gt3-evo-63-squadra-corse-official",
    CategoryId: 3,
    CategorySlug: "gt-racing",
    CategoryName: "IMSA & GT3 Racing",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 460000,
    OldPrice: null,
    DepositAmount: null,
    QuotaPercent: 0,
    EditionNote: "Factory Racing",
    PreOrderDeadline: null,
    Stock: 5,
    ImageUrl: "image/minigt_lambogt3.jpg",
    Description: "Mẫu xe đua Lamborghini Huracán GT3 EVO #63 Squadra Corse Official với bộ tem đen mờ khí động học sắc nét.",
    Status: "in_stock",
    IsFeatured: 1,
    IsNew: 0
  },
  {
    ProductId: 10,
    Sku: "MGT00755",
    CarNumber: "465",
    Name: "Nissan Silvia S15 LB-Super Silhouette #23 Formula Drift",
    Slug: "nissan-silvia-s15-lb-super-silhouette-23-formula-drift",
    CategoryId: 1,
    CategorySlug: "liberty-walk",
    CategoryName: "Liberty Walk LBWK",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 480000,
    OldPrice: null,
    DepositAmount: null,
    QuotaPercent: 0,
    EditionNote: "Liberty Walk",
    PreOrderDeadline: null,
    Stock: 8,
    ImageUrl: "image/Minigt_s15chop_lbwk.jpg",
    Description: "Huyền thoại Nissan S15 phong cách Super Silhouette từ nhà độ Liberty Walk Wataru Kato với cánh gió kép và phối màu vàng óng ánh kim.",
    Status: "in_stock",
    IsFeatured: 1,
    IsNew: 1
  },
  {
    ProductId: 11,
    Sku: "MGT00688",
    CarNumber: "1055",
    Name: "Lamborghini Aventador LB★WORKS Widebody 2.0 Matte Black",
    Slug: "lamborghini-aventador-lb-works-widebody-2-matte-black",
    CategoryId: 1,
    CategorySlug: "liberty-walk",
    CategoryName: "Liberty Walk LBWK",
    Brand: "MINI GT",
    Scale: "1:64",
    Price: 520000,
    OldPrice: null,
    DepositAmount: null,
    QuotaPercent: 0,
    EditionNote: "Zero Fighter Livery",
    PreOrderDeadline: null,
    Stock: 4,
    ImageUrl: "image/Minigt_Lambo_LBWK.jpg",
    Description: "Siêu bò Aventador độ thân rộng LB★WORKS Widebody 2.0 màu sơn đen nhám Zero Fighter với vòm bánh loe rộng bắt đinh tán hầm hố.",
    Status: "in_stock",
    IsFeatured: 1,
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
let currentSort = 'default';
let currentBrandFilter = 'all';

// Cấu hình động cửa hàng (Đồng bộ trực tiếp từ SQL Server Settings table)
let storeSettings = {
  store_name: "MINI GT STORE Biên Hòa",
  store_hotline: "0988164164",
  store_email: "contact@minigtstore.vn",
  store_address: "38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai",
  shipping_fee: 11000,
  free_shipping_threshold: 0,
  deposit_rate: 0.3,
  preorder_deadline: "2026-10-30",
  bank_id: "MB",
  bank_name: "MBBank (Ngân Hàng Quân Đội)",
  bank_account_no: "87654321082007",
  bank_account_name: "DO QUOC THINH",
  announcement: "Đợt mở đặt trước toàn cầu: Liberty Walk LBWK, F1 Las Vegas & Secret Chase Edition"
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
  // Update Announcement Ticker
  const ticker = document.querySelector('.announcement-ticker span:nth-child(2)');
  if (ticker && storeSettings.announcement) {
    const dl = storeSettings.preorder_deadline || '30/10/2026';
    ticker.innerHTML = `${escapeHtml(storeSettings.announcement)} | <i class="fa-regular fa-clock" style="font-size:11px; margin-left:4px;"></i> Hạn chót đợt cọc: <strong>${escapeHtml(dl)}</strong>`;
  }
  // Update Hotline Links
  if (storeSettings.store_hotline) {
    const cleanPhone = String(storeSettings.store_hotline).replace(/\D/g, '');
    document.querySelectorAll('a.hotline-link, a[href^="tel:"]').forEach(a => {
      a.href = `tel:${cleanPhone}`;
      const strong = a.querySelector('strong');
      if (strong) strong.textContent = storeSettings.store_hotline;
    });
  }
}

// Khởi tạo wishlist (lưu trữ trong LocalStorage)
let wishlist = JSON.parse(localStorage.getItem('minigt_wishlist') || '[1, 2, 10, 11]');

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
  updateWishlistBadge();
  renderProductsGrid();
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
  localStorage.setItem('minigt_wishlist', JSON.stringify(wishlist));
  updateWishlistBadge();
  renderProductsGrid();
  renderWishlistModal();
  showToast('Đã xóa tất cả mẫu xe khỏi danh sách yêu thích', 'info');
}

// Khởi tạo giỏ hàng (mặc định 3 mẫu để khớp chính xác badge 3 ở header như ảnh chụp)
let savedCart = localStorage.getItem('minigt_cart');
let cart = savedCart ? JSON.parse(savedCart) : [
  { productId: 1, sku: 'MGTS0026', name: 'Lamborghini Huracán Sterrato All-Terrain Set (Box 4 xe)', price: 1850000, depositAmount: 500000, quantity: 1, imageUrl: 'image/lambo-sterrato-set.png', scale: '1:64' },
  { productId: 2, sku: 'MGT01413', name: 'Aston Martin AMR24 #18 Lance Stroll F1 Las Vegas GP', price: 460000, depositAmount: 150000, quantity: 1, imageUrl: 'image/aston-amr24-stroll.png', scale: '1:64' },
  { productId: 3, sku: 'MGT01396', name: 'Aston Martin AMR24 #14 Fernando Alonso F1 Las Vegas GP', price: 450000, depositAmount: 150000, quantity: 1, imageUrl: 'image/aston-amr24-alonso.png', scale: '1:64' }
];
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

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'toast-success' : (type === 'error' ? 'toast-error' : '')}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span> <div>${escapeHtml(message)}</div>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// =====================================================================
// 3. UNIFIED SAFE FETCH (DELEGATES TO WINDOW.API)
// =====================================================================
async function safeFetch(url, options = {}) {
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
    console.error(`[API ERROR] (${url}):`, err);
    throw err;
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
async function loadProducts() {
  renderProductSkeletons('mainProductGrid', 8);

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
  renderPreOrderQuickRow();
  updateFilterCounts();
}

// =====================================================================
// 5. RENDER CARD SẢN PHẨM CHUẨN DESIGN THEO ẢNH MẪU
// =====================================================================
function createProductCardHTML(p) {
  const isPreOrder = p.Status === 'pre_order';
  const isSoldOut = p.Status === 'sold_out';
  const isChase = (p.Sku && (p.Sku.startsWith('PR') || p.Sku.startsWith('TH'))) || (p.Name && (p.Name.includes('Secret') || p.Name.includes('Ultraman') || p.Name.includes('Chase')));
  const isLbwk = p.CategorySlug === 'liberty-walk' || (p.Name && p.Name.includes('LB')) || (p.EditionNote && p.EditionNote.includes('Liberty'));

  // Badge góc trái trên (Screenshot 2: "CÒN HÀNG" green, "CHASE RARE" gold, "PRE-ORDER" red)
  let statusBadge = '';
  if (isPreOrder) {
    statusBadge = '<span class="badge-preorder-pill">PRE-ORDER</span>';
  } else if (isSoldOut) {
    statusBadge = '<span class="badge-soldout">HẾT HÀNG</span>';
  } else if (isChase) {
    statusBadge = '<span class="badge-chase-pill">CHASE RARE</span>';
  } else {
    statusBadge = '<span class="badge-instock">CÒN HÀNG</span>';
  }

  // Ribbon góc phải trên
  let ribbonHtml = '';
  if (isLbwk) {
    ribbonHtml = '<div class="card-ribbon-top-right"><div class="card-corner-ribbon ribbon-gold">LB★WORKS</div></div>';
  } else if (isChase) {
    ribbonHtml = '<div class="card-ribbon-top-right"><div class="card-corner-ribbon ribbon-chase">CHASE 1/24</div></div>';
  } else if (p.OldPrice && p.OldPrice > p.Price) {
    ribbonHtml = '<div class="card-ribbon-top-right"><div class="card-corner-ribbon ribbon-red">Giảm 10%</div></div>';
  }

  // Release number badge bottom-left (e.g. ▶ 465, ▶ 1055, ▶ 1129)
  const carNum = p.CarNumber || (p.Sku ? p.Sku.replace(/\D/g, '').replace(/^0+/, '') : '') || '1:64';

  // Stock / Quota bar
  let stockBarHtml = '';
  if (isPreOrder) {
    const qPct = p.QuotaPercent || 75;
    stockBarHtml = `
      <div class="card-stock-wrap">
        <div class="card-stock-bar" style="width:${qPct}%;"></div>
        <div class="card-stock-text">Tiến độ cọc ${qPct}% hạn ngạch</div>
      </div>
    `;
  } else {
    const stockCount = p.Stock || 5;
    stockBarHtml = `
      <div class="card-stock-wrap">
        <div class="card-stock-bar" style="width:${Math.min(100, stockCount * 12)}%;"></div>
        <div class="card-stock-text">Kho còn ${stockCount} chiếc sẵn giao</div>
      </div>
    `;
  }

  const oldPriceHtml = p.OldPrice ? `<span class="old-price">${formatVND(p.OldPrice)}</span>` : '';
  const isWish = isInWishlist(p.ProductId);
  const isCompared = typeof isInCompareList === 'function' ? isInCompareList(p.ProductId) : false;

  // Buttons matching Screenshot 2
  let actionBtnHtml = '';
  if (isPreOrder) {
    actionBtnHtml = `<button class="card-btn-preorder" onclick="handleCardAction(${p.ProductId}, event)"><i class="fa-solid fa-plus"></i> Đặt cọc</button>`;
  } else if (isSoldOut) {
    actionBtnHtml = `<button class="card-btn-soldout" disabled>Hết hàng</button>`;
  } else {
    actionBtnHtml = `<button class="card-btn-buy" onclick="handleCardAction(${p.ProductId}, event)"><i class="fa-solid fa-bag-shopping"></i> Mua ngay</button>`;
  }

  return `
    <article class="product-card reveal-on-scroll" data-id="${p.ProductId}">
      <div class="card-image-box">
        <div class="card-badge-top-left">${statusBadge}</div>
        ${ribbonHtml}
        <button class="card-wishlist-btn ${isWish ? 'active' : ''}" title="Thêm vào yêu thích" onclick="toggleWishlist(${p.ProductId}, event)">
          <i class="fa-solid fa-heart"></i>
        </button>
        <button class="card-compare-btn ${isCompared ? 'active' : ''}" title="So sánh thông số mô hình" onclick="toggleCompareModel(${p.ProductId}, event)">
          <i class="fa-solid fa-scale-balanced"></i>
        </button>
        <img class="card-image" src="${p.ImageUrl}" alt="${p.Name}" loading="lazy" onerror="this.src='image/hero-banner.jpg'">
        <span class="card-car-num"><span class="play-icon">▶</span> ${carNum}</span>
        
        <!-- Hover Overlay (matching Card 3 in Screenshot 2) -->
        <div class="card-hover-overlay">
          <button class="card-hover-btn btn-view" onclick="openQuickView(${p.ProductId})"><i class="fa-solid fa-eye"></i> Xem chi tiết</button>
          <button class="card-hover-btn btn-buy" onclick="handleCardAction(${p.ProductId}, event)"><i class="fa-solid fa-bag-shopping"></i> Mua ngay</button>
        </div>
      </div>
      <div class="card-body">
        ${stockBarHtml}
        <h3 class="product-title" onclick="openQuickView(${p.ProductId})">${p.Name}</h3>
        <div class="product-meta-sub">#${p.Sku} ${p.EditionNote ? '• ' + p.EditionNote : ''}</div>
        <div class="card-footer">
          <div class="price-box">
            <span class="current-price">${formatVND(p.Price)}</span>
            ${oldPriceHtml}
          </div>
          ${actionBtnHtml}
        </div>
      </div>
    </article>
  `;
}

function renderPreOrderQuickRow() {
  const container = document.getElementById('preorderQuickRow');
  if (!container) return;

  const topPreOrders = [
    { sku: 'MGTS0026', note: 'Box Set Camo', price: 1850000, oldPrice: null, id: 1 },
    { sku: 'MGT01413', note: 'UHD Edition', price: 460000, oldPrice: 500000, id: 2 },
    { sku: 'MGT01396', note: '2x World Champ', price: 450000, oldPrice: null, id: 3 }
  ];

  container.innerHTML = topPreOrders.map(item => `
    <div class="preorder-quick-card">
      <div>
        <div class="quick-card-meta">#${item.sku} • ${item.note}</div>
        <div class="quick-card-price">
          ${formatVND(item.price)}
          ${item.oldPrice ? `<span class="quick-card-old">${formatVND(item.oldPrice)}</span>` : ''}
        </div>
      </div>
      <button class="btn-quick-deposit" onclick="handleCardAction(${item.id}, event)">+ Đặt cọc</button>
    </div>
  `).join('');
}

// =====================================================================
// 6. RENDER CÁC KHU VỰC SẢN PHẨM
// =====================================================================
// =====================================================================
// 6. RENDER CÁC KHU VỰC SẢN PHẨM & PHÂN TRANG CATALOGUE (PAGINATION)
// =====================================================================
let catalogCurrentPage = 1;
const CATALOG_PER_PAGE = 8;

function handleCatalogSort(sortVal) {
  currentSort = sortVal;
  catalogCurrentPage = 1;
  renderProductsGrid();
}

function handleCatalogBrandChange(brandVal) {
  currentBrandFilter = brandVal;
  catalogCurrentPage = 1;
  renderProductsGrid();
}

function renderProductsGrid() {
  const container = document.getElementById('mainProductGrid');
  if (!container) return;

  let filtered = [...allProducts];

  // 1. Lọc theo Danh mục Filter Pill
  if (currentFilter === 'pre_order') {
    filtered = filtered.filter(p => (p.Status || p.status) === 'pre_order');
  } else if (currentFilter === 'lbwk') {
    filtered = filtered.filter(p => (p.CategorySlug === 'liberty-walk' || (p.Name && p.Name.toLowerCase().includes('lb')) || (p.EditionNote && p.EditionNote.toLowerCase().includes('liberty'))));
  } else if (currentFilter === 'chase') {
    filtered = filtered.filter(p => ((p.Sku && (p.Sku.startsWith('PR') || p.Sku.startsWith('TH'))) || (p.Name && (p.Name.toLowerCase().includes('secret') || p.Name.toLowerCase().includes('chase')))));
  } else if (currentFilter === 'f1') {
    filtered = filtered.filter(p => (p.CategorySlug === 'f1-racing' || (p.Name && p.Name.toLowerCase().includes('f1')) || (p.Name && p.Name.toLowerCase().includes('amr24'))));
  } else if (currentFilter === 'ao_racing') {
    filtered = filtered.filter(p => p.Name && (p.Name.toLowerCase().includes('ao racing') || p.Name.toLowerCase().includes('rexy') || p.Name.toLowerCase().includes('roxy') || p.Name.toLowerCase().includes('ske')));
  } else if (currentFilter === 'in_stock') {
    filtered = filtered.filter(p => (p.Status || p.status) === 'in_stock');
  } else if (currentFilter === 'box_sets') {
    filtered = filtered.filter(p => (p.CategorySlug === 'box-sets' || (p.Name && (p.Name.toLowerCase().includes('box') || p.Name.toLowerCase().includes('set') || p.Name.toLowerCase().includes('combo')))));
  }

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

  container.innerHTML = pageItems.map(p => createProductCardHTML(p)).join('');
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
  catalogCurrentPage = page;
  renderProductsGrid();
  const catalog = document.getElementById('catalog');
  if (catalog) {
    catalog.scrollIntoView({ behavior: 'smooth' });
  }
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
    f1: allProducts.filter(p => p.CategorySlug === 'f1-racing' || p.Name.toLowerCase().includes('f1') || p.Name.toLowerCase().includes('amr24')).length,
    box_sets: allProducts.filter(p => p.CategorySlug === 'box-sets' || p.Name.toLowerCase().includes('box') || p.Name.toLowerCase().includes('combo')).length,
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
      catalogCurrentPage = 1; // Reset về trang 1 khi chuyển filter
      renderProductsGrid();
    });
  });
}

// =====================================================================
// HERO CAROUSEL CONTROLLER (INTERACTIVE BANNER SLIDER)
// =====================================================================
let currentHeroSlideIndex = 0;
let heroSlideTimer = null;

function goToHeroSlide(index) {
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
    dot.classList.toggle('active', idx === currentHeroSlideIndex);
    dot.setAttribute('aria-current', idx === currentHeroSlideIndex ? 'true' : 'false');
  });
}

function nextHeroSlide() {
  goToHeroSlide(currentHeroSlideIndex + 1);
  if (typeof playHoverBeep === 'function') playHoverBeep(560, 0.03);
}

function prevHeroSlide() {
  goToHeroSlide(currentHeroSlideIndex - 1);
  if (typeof playHoverBeep === 'function') playHoverBeep(500, 0.03);
}

function initHeroSlider() {
  const wrap = document.getElementById('heroSliderWrap');
  if (!wrap) return;

  goToHeroSlide(0);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function startAutoplay() {
    stopAutoplay();
    if (prefersReducedMotion.matches || document.hidden || wrap.matches(':focus-within')) return;
    heroSlideTimer = setInterval(() => {
      nextHeroSlide();
    }, 5500);
  }

  function stopAutoplay() {
    if (heroSlideTimer) {
      clearInterval(heroSlideTimer);
      heroSlideTimer = null;
    }
  }

  wrap.addEventListener('mouseenter', stopAutoplay);
  wrap.addEventListener('mouseleave', startAutoplay);
  wrap.addEventListener('focusin', stopAutoplay);
  wrap.addEventListener('focusout', (event) => {
    if (!wrap.contains(event.relatedTarget)) startAutoplay();
  });
  wrap.addEventListener('keydown', (event) => {
    if (event.target.matches('.hero-hotspot') && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      event.target.click();
      return;
    }
    if (event.key === 'ArrowRight') nextHeroSlide();
    else if (event.key === 'ArrowLeft') prevHeroSlide();
  });
  wrap.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    wrap.dataset.touchStartX = String(event.clientX);
    stopAutoplay();
  }, { passive: true });
  wrap.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'touch') return;
    const deltaX = event.clientX - Number(wrap.dataset.touchStartX);
    if (Math.abs(deltaX) > 45) deltaX < 0 ? nextHeroSlide() : prevHeroSlide();
    delete wrap.dataset.touchStartX;
    startAutoplay();
  }, { passive: true });
  wrap.addEventListener('pointercancel', () => {
    delete wrap.dataset.touchStartX;
    startAutoplay();
  }, { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? stopAutoplay() : startAutoplay());
  prefersReducedMotion.addEventListener?.('change', () => prefersReducedMotion.matches ? stopAutoplay() : startAutoplay());

  startAutoplay();
}

// =====================================================================
// 8. ĐỒNG HỒ ĐẾM NGƯỢC PRE-ORDER (COUNTDOWN TIMER)
// =====================================================================
function setupCountdown() {
  const deadlineStr = (storeSettings && storeSettings.preorder_deadline) ? `${storeSettings.preorder_deadline}T23:59:59` : '2026-10-30T23:59:59';
  const targetDate = new Date(deadlineStr).getTime();

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
function handleCardAction(productId, event) {
  if (event && event.stopPropagation) {
    event.stopPropagation();
  }
  flyToCart(productId, event);
  addToCart(productId, 1);

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

function addToCart(productId, quantity = 1) {
  const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => p.ProductId === productId || p.id === productId);
  if (!prod) return;

  const stock = typeof prod.Stock === 'number' ? prod.Stock : (typeof prod.stock === 'number' ? prod.stock : 999);
  const pName = prod.Name || prod.name;
  if (stock <= 0) {
    showToast(`Mẫu xe "${pName}" hiện đã hết hàng!`, 'error');
    return;
  }

  const existing = cart.find(it => it.productId === productId);
  const currentQty = existing ? existing.quantity : 0;

  if (currentQty + quantity > stock) {
    showToast(`Rất tiếc! Mẫu này chỉ còn ${stock} xe trong kho (bạn đã có ${currentQty} trong giỏ).`, 'error');
    return;
  }

  const pPrice = prod.Price || prod.price;
  const pDeposit = prod.DepositAmount || prod.depositAmount || Math.round(pPrice * (storeSettings.deposit_rate || 0.3));

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      productId: prod.ProductId || prod.id,
      name: pName,
      sku: prod.Sku || prod.sku,
      price: pPrice,
      depositAmount: pDeposit,
      imageUrl: prod.ImageUrl || prod.image,
      isPreOrder: (prod.Status || prod.status) === 'pre_order',
      quantity: quantity
    });
  }

  saveCart();
  renderCartDrawer();
  showToast(`Đã thêm "${pName}" vào giỏ cọc!`, 'success');
}

function saveCart() {
  localStorage.setItem('minigt_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const count = cart.reduce((acc, it) => acc + it.quantity, 0);
  const badge = document.getElementById('cartBadgeCount');
  const dockBadge = document.getElementById('dockCartBadge');

  if (badge) {
    badge.textContent = count;
    badge.classList.remove('bump');
    void badge.offsetWidth; // Force reflow
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
}

function changeCartQty(productId, delta) {
  const it = cart.find(i => i.productId === productId);
  if (!it) return;

  if (delta > 0) {
    const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => p.ProductId === productId || p.id === productId);
    const stock = prod ? (typeof prod.Stock === 'number' ? prod.Stock : (typeof prod.stock === 'number' ? prod.stock : 999)) : 999;
    if (it.quantity + delta > stock) {
      showToast(`Số lượng tối đa có thể đặt là ${stock} sản phẩm.`, 'error');
      return;
    }
  }

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

function clearCart() {
  if (!cart.length) return;
  if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) return;
  cart = [];
  saveCart();
  renderCartDrawer();
  showToast('Đã xóa tất cả sản phẩm khỏi giỏ hàng', 'info');
}

function renderCartDrawer() {
  const itemsContainer = document.getElementById('cartDrawerItems');
  const totalAmountEl = document.getElementById('cartTotalAmount');
  const depositAmountEl = document.getElementById('cartDepositAmount');
  if (!itemsContainer) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <p style="font-size: 36px; margin-bottom: 8px; color:#cbd5e1;"><i class="fa-solid fa-cart-shopping"></i></p>
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

  const headerHtml = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-bottom:6px; border-bottom:1px dashed #e2e8f0;">
      <span style="font-size:12px; color:#64748b; font-weight:600;">${cart.length} mẫu xe trong giỏ</span>
      <button type="button" style="color:#dc2626; border:none; background:none; font-size:11.5px; cursor:pointer; font-weight:700;" onclick="clearCart()">
        <i class="fa-solid fa-trash"></i> Xóa tất cả
      </button>
    </div>
  `;

  const itemsHtml = cart.map(it => {
    total += it.price * it.quantity;
    totalDeposit += (it.depositAmount || Math.round(it.price * 0.3)) * it.quantity;

    return `
      <div class="cart-item">
        <img class="cart-item-thumb" src="${it.imageUrl || 'image/hero-banner.jpg'}" alt="${escapeHtml(it.name)}">
        <div class="cart-item-details">
          <div class="cart-item-title">${escapeHtml(it.name)}</div>
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

  itemsContainer.innerHTML = headerHtml + itemsHtml;

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
  const prod = (allProducts && allProducts.length ? allProducts : FALLBACK_PRODUCTS).find(p => p.ProductId === productId || p.id === productId);
  if (!prod) return;

  const modal = document.getElementById('quickViewModal');
  const body = document.getElementById('quickViewModalBody');
  if (!modal || !body) return;

  const pId = prod.ProductId || prod.id;
  const pName = prod.Name || prod.name;
  const pImg = prod.ImageUrl || prod.image || 'image/hero-banner.jpg';
  const pPrice = prod.Price || prod.price;
  const pOldPrice = prod.OldPrice || prod.oldPrice;
  const pSku = prod.Sku || prod.sku;
  const pBrand = prod.Brand || prod.brand || 'MINI GT';
  const pScale = prod.Scale || prod.scale || '1:64';
  const pDesc = prod.Description || prod.description || 'Mô hình diecast tỉ lệ 1:64 chính hãng bản quyền, chi tiết sơn sắc nét, lốp cao su cao cấp.';
  const pStock = typeof prod.Stock === 'number' ? prod.Stock : (typeof prod.stock === 'number' ? prod.stock : 0);
  const isPreOrder = (prod.Status || prod.status) === 'pre_order';
  const isSoldOut = (prod.Status || prod.status) === 'sold_out' || pStock <= 0;
  const isWish = isInWishlist(pId);
  const deadline = prod.PreOrderDeadline || prod.preOrderDeadline || storeSettings.preorder_deadline;

  body.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); align-items: center;">
      <div style="background: radial-gradient(circle, #fff 50%, #f1f5f9 100%); border-radius: var(--radius-lg); padding: 1.5rem; text-align: center; border: 1px solid var(--color-gray-200);">
        <img src="${pImg}" alt="${escapeHtml(pName)}" style="max-height: 240px; margin: 0 auto; object-fit: contain;">
      </div>
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
          <span class="badge ${isPreOrder ? 'badge-preorder' : (isSoldOut ? 'badge-soldout' : 'badge-instock')}">
            ${isPreOrder ? 'PRE-ORDER 2026' : (isSoldOut ? 'HẾT HÀNG TẠM THỜI' : 'CÓ SẴN GIAO NGAY')}
          </span>
          <span style="font-size:12px; color:#64748b; font-weight:600;">
            ${isPreOrder ? `Tiến độ: ${prod.QuotaPercent || 75}%` : `Kho: ${pStock} chiếc`}
          </span>
        </div>
        <h2 style="font-size: var(--text-lg); margin-bottom: 6px; color: var(--color-navy); line-height: 1.3;">${escapeHtml(pName)}</h2>
        <div style="font-size: var(--text-xs); color: var(--color-primary); font-weight: bold; margin-bottom: 12px;">
          #${escapeHtml(pSku)} ${prod.EditionNote ? '• ' + escapeHtml(prod.EditionNote) : ''}
        </div>
        <div style="font-size: var(--text-2xl); font-weight: 800; color: var(--color-navy); margin-bottom: 12px;">
          ${formatVND(pPrice)}
          ${pOldPrice && pOldPrice > pPrice ? `<span style="font-size: var(--text-sm); color: var(--color-gray-400); text-decoration: line-through; margin-left: 8px;">${formatVND(pOldPrice)}</span>` : ''}
        </div>
        <p style="font-size: var(--text-xs); color: var(--color-gray-600); margin-bottom: 14px; line-height: 1.6;">
          ${escapeHtml(pDesc)}
        </p>
        <div style="font-size: var(--text-xs); margin-bottom: 16px; display: flex; flex-direction: column; gap: 4px;">
          <div><strong>Thương hiệu:</strong> ${escapeHtml(pBrand)}</div>
          <div><strong>Tỉ lệ:</strong> ${escapeHtml(pScale)}</div>
          <div><strong>Bản quyền:</strong> Official Licensed Product</div>
          ${deadline ? `<div><strong>Hạn chốt cọc:</strong> <span style="color:var(--color-primary); font-weight:bold;">${escapeHtml(deadline)}</span></div>` : ''}
        </div>
        <div style="display: flex; gap: 8px; margin-top: 10px;">
          <button class="btn btn-primary" style="flex: 1;" ${isSoldOut ? 'disabled' : ''} onclick="addToCart(${pId}, 1); closeModal('quickViewModal'); openCartDrawer();">
            ${isSoldOut ? 'Hết hàng' : (isPreOrder ? '<i class="fa-solid fa-fire" style="margin-right:6px;"></i> Đặt cọc giữ slot ngay' : '<i class="fa-solid fa-cart-shopping" style="margin-right:6px;"></i> Thêm vào giỏ hàng')}
          </button>
          <button type="button" class="btn btn-outline" id="quickViewWishlistBtn" style="min-width: 46px; padding: 0 12px;" onclick="toggleWishlist(${pId}, event);" title="${isWish ? 'Đã lưu yêu thích (Bấm để xóa)' : 'Lưu danh sách yêu thích'}">
            <i class="fa-${isWish ? 'solid' : 'regular'} fa-heart" style="color:${isWish ? '#dc2626' : 'inherit'}; font-size: 14px;"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// =====================================================================
// 11. CHECKOUT & TẠO MÃ VIETQR TỰ ĐỘNG
// =====================================================================
// MULTI-STEP CHECKOUT STEPPER CONTROLLER & FORM STATE CACHING
// =====================================================================
let currentCheckoutStep = 1;
let selectedCheckoutPaymentMethod = 'DEPOSIT';

function saveCheckoutFormState() {
  const formState = {
    name: document.getElementById('checkoutName')?.value || '',
    phone: document.getElementById('checkoutPhone')?.value || '',
    email: document.getElementById('checkoutEmail')?.value || '',
    address: document.getElementById('checkoutAddress')?.value || '',
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
    }
  } catch (e) {
    console.warn('Không thể khôi phục form từ sessionStorage:', e);
  }

  // Nếu đã đăng nhập, tự động ưu tiên thông tin tài khoản nếu trường đang trống
  if (currentUser) {
    const nameInput = document.getElementById('checkoutName');
    const emailInput = document.getElementById('checkoutEmail');
    const phoneInput = document.getElementById('checkoutPhone');
    if (nameInput && !nameInput.value) nameInput.value = currentUser.fullName || '';
    if (emailInput && !emailInput.value) emailInput.value = currentUser.email || '';
    if (phoneInput && !phoneInput.value && currentUser.phone) phoneInput.value = currentUser.phone;
  }
}

function openCheckoutModal() {
  if (cart.length === 0) {
    showToast('Giỏ hàng của bạn đang trống! Hãy chọn mô hình trước khi thanh toán.', 'error');
    return;
  }
  closeCartDrawer();
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    loadCheckoutFormState();
    goToCheckoutStep(1);
    modal.classList.add('active');
    document.body.classList.add('checkout-modal-open');
  }
}

function goToCheckoutStep(step) {
  if (!Number.isInteger(step) || step < 1 || step > 4) return;
  if (step === 2 && cart.length === 0) {
    showToast('Giỏ hàng trống!', 'error');
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
      ind.classList.remove('active', 'completed');
      if (i === step) ind.classList.add('active');
      else if (i < step) ind.classList.add('completed');
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
    renderCheckoutStep3();
  }

  const checkoutContainer = document.querySelector('#checkoutModal .checkout-stepper-container');
  if (checkoutContainer) checkoutContainer.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function renderCheckoutStep1() {
  const listEl = document.getElementById('checkoutStep1ItemList');
  const summaryEl = document.getElementById('checkoutStep1SummaryBox');
  if (!listEl || !summaryEl) return;

  const total = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const totalDeposit = cart.reduce((acc, it) => acc + ((it.depositAmount || Math.round(it.price * 0.35)) * it.quantity), 0);
  const shippingFee = 11000; // Phí ship bọc chống sốc SPX đồng giá 11.000đ toàn quốc
  const grandTotal = total + shippingFee;

  listEl.innerHTML = cart.map((it, idx) => {
    const isPreOrder = it.depositAmount && it.depositAmount > 0;
    return `
      <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #f1f5f9;">
        <img src="${it.imageUrl || 'image/hero-banner.jpg'}" alt="${it.name}" style="width:54px; height:54px; object-fit:contain; border-radius:6px; background:#f8fafc; border:1px solid #e2e8f0; padding:2px;">
        <div style="flex:1;">
          <div style="font-weight:700; font-size:13px; color:var(--color-navy); line-height:1.3;">${it.name}</div>
          <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
            <span style="font-size:10px; background:#f1f5f9; color:#475569; padding:1px 5px; border-radius:3px; font-weight:700;">1:64</span>
            <span style="font-size:11px; color:#64748b;">Đơn giá: ${formatVND(it.price)}</span>
            ${isPreOrder ? `<span style="font-size:10px; background:#fff1f1; color:#dc2626; padding:1px 5px; border-radius:3px; font-weight:800;">PRE-ORDER (Cọc ${formatVND(it.depositAmount)})</span>` : `<span style="font-size:10px; background:#ecfdf5; color:#059669; padding:1px 5px; border-radius:3px; font-weight:700;">CÓ SẴN</span>`}
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button type="button" class="btn btn-sm btn-outline" style="padding:2px 8px; font-size:11px;" onclick="changeCartQty(${it.productId}, -1); renderCheckoutStep1();">-</button>
          <span style="font-weight:800; font-size:12px; min-width:18px; text-align:center;">${it.quantity}</span>
          <button type="button" class="btn btn-sm btn-outline" style="padding:2px 8px; font-size:11px;" onclick="changeCartQty(${it.productId}, 1); renderCheckoutStep1();">+</button>
        </div>
        <div style="text-align:right; min-width:85px;">
          <strong style="color:var(--color-primary); font-size:13px;">${formatVND(it.price * it.quantity)}</strong>
        </div>
      </div>
    `;
  }).join('');

  summaryEl.innerHTML = `
    <div style="background:#f8fafc; border-radius:10px; padding:12px 14px; margin-top:12px; border:1px solid #e2e8f0; font-size:12.5px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
        <span style="color:#64748b;">Tổng tiền hàng (${cart.length} mẫu):</span>
        <strong style="color:var(--color-navy);">${formatVND(total)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
        <span style="color:#64748b;"><i class="fa-solid fa-truck-fast" style="color:#ea580c; margin-right:4px;"></i> Phí vận chuyển bọc hộp SPX:</span>
        <strong style="color:#059669;">${formatVND(shippingFee)} (Đồng giá toàn quốc)</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:8px; border-top:1px dashed #cbd5e1; padding-top:8px; font-size:14px; font-weight:800;">
        <span style="color:var(--color-navy);">Tổng đơn hàng:</span>
        <span style="color:var(--color-primary);">${formatVND(grandTotal)}</span>
      </div>
      ${totalDeposit > 0 ? `
        <div style="margin-top:8px; padding:8px 10px; background:#fff1f1; border-radius:6px; font-size:12px; color:#b91c1c; display:flex; justify-content:space-between; align-items:center;">
          <span><strong>Tiền cọc giữ slot đợt này:</strong></span>
          <span style="font-size:14px; font-weight:800;">${formatVND(totalDeposit)}</span>
        </div>
      ` : ''}
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

function handlePaymentMethodChange(val) {
  selectedCheckoutPaymentMethod = (val === 'FULL_TRANSFER') ? 'BANK_TRANSFER' : val;
  const optCod = document.getElementById('payOptCod');
  const optDeposit = document.getElementById('payOptDeposit');
  const optFull = document.getElementById('payOptFull');

  [optCod, optDeposit, optFull].forEach(el => {
    if (el) {
      el.classList.remove('active');
      el.style.borderColor = '#cbd5e1';
      el.style.background = '#f8fafc';
    }
  });

  let activeEl = optDeposit;
  if (selectedCheckoutPaymentMethod === 'COD') activeEl = optCod;
  else if (selectedCheckoutPaymentMethod === 'BANK_TRANSFER') activeEl = optFull;

  if (activeEl) {
    activeEl.classList.add('active');
    activeEl.style.borderColor = 'var(--color-primary)';
    activeEl.style.background = '#fff7f7';
  }

  renderCheckoutStep3();
}

function renderCheckoutStep3() {
  const summaryEl = document.getElementById('checkoutStep3SummaryBox');
  if (!summaryEl) return;

  const total = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const totalDeposit = cart.reduce((acc, it) => acc + ((it.depositAmount || Math.round(it.price * 0.35)) * it.quantity), 0);
  const shippingFee = 11000;
  const grandTotal = total + shippingFee;

  let payNowAmount = 0;
  let remainingCodAmount = grandTotal;
  let labelPayNow = '';
  let noteText = '';

  if (selectedCheckoutPaymentMethod === 'COD') {
    payNowAmount = 0;
    remainingCodAmount = grandTotal;
    labelPayNow = 'Thanh toán cho Shipper SPX khi nhận:';
    noteText = `<i class="fa-solid fa-hand-holding-dollar" style="color:#059669;"></i> Bạn sẽ thanh toán <strong>${formatVND(grandTotal)}</strong> (đã gồm 11.000đ phí ship) cho shipper SPX khi nhận và kiểm tra xe.`;
  } else if (selectedCheckoutPaymentMethod === 'BANK_TRANSFER' || selectedCheckoutPaymentMethod === 'FULL_TRANSFER') {
    payNowAmount = grandTotal;
    remainingCodAmount = 0;
    labelPayNow = 'Số tiền chuyển khoản Full 100% qua MB Bank:';
    noteText = `<i class="fa-solid fa-credit-card" style="color:#2563eb;"></i> Bạn chuyển khoản <strong>${formatVND(grandTotal)}</strong> qua VietQR. Khi shipper SPX giao đến, bạn chỉ cần nhận kiện mà <strong>không phải trả thêm tiền</strong>.`;
  } else {
    // DEPOSIT
    payNowAmount = totalDeposit > 0 ? totalDeposit : Math.round(total * 0.35);
    remainingCodAmount = grandTotal - payNowAmount;
    labelPayNow = 'Tiền cọc quét mã VietQR MB Bank ngay:';
    noteText = `<i class="fa-solid fa-money-bill-transfer" style="color:#dc2626;"></i> Quét mã cọc trước <strong>${formatVND(payNowAmount)}</strong>. Số tiền còn lại <strong>${formatVND(remainingCodAmount)}</strong> (đã gồm 11.000đ phí ship) sẽ thanh toán COD cho shipper SPX khi nhận xe.`;
  }

  summaryEl.innerHTML = `
    <div style="background:#f8fafc; border-radius:10px; padding:12px 14px; border:1px solid #e2e8f0; font-size:12.5px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
        <span style="color:#64748b;">Tổng giá trị sản phẩm:</span>
        <strong>${formatVND(total)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
        <span style="color:#64748b;"><i class="fa-solid fa-truck-fast" style="color:#ea580c; margin-right:4px;"></i> Phí vận chuyển bọc hộp SPX:</span>
        <strong style="color:#059669;">${formatVND(shippingFee)} (Đồng giá toàn quốc)</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-weight:700;">
        <span style="color:var(--color-navy);">Tổng đơn hàng:</span>
        <span style="color:var(--color-navy); font-size:13.5px;">${formatVND(grandTotal)}</span>
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
  const note = document.getElementById('checkoutNote')?.value.trim();

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

  const payload = {
    fullName: name,
    phone: phone,
    email: email || (currentUser ? currentUser.email : ''),
    address: address,
    note: note || '',
    paymentMethod: normalizedPayMethod,
    items: cart.map(i => ({
      productId: i.productId,
      sku: i.sku,
      name: i.name,
      price: i.price,
      deposit: i.depositAmount || Math.round(i.price * 0.3),
      image: i.imageUrl,
      orderType: i.isPreOrder ? 'PRE_ORDER' : 'IN_STOCK',
      quantity: i.quantity
    }))
  };

  try {
    // Lưu SĐT khách hàng để tự động tra cứu trong "Đơn hàng của tôi"
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
      showToast(`Đặt đơn #${code} thành công! Đơn hàng đã chuyển tới Admin.`, 'success');
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

function renderCheckoutStep4(rawOrder) {
  const order = api.normalizeOrderObject ? api.normalizeOrderObject(rawOrder) : rawOrder;
  const orderCode = order.code || order.orderCode || order.OrderCode;
  activeStep4OrderCode = orderCode;

  cart = [];
  saveCart();
  sessionStorage.removeItem('minigt_checkout_info');

  goToCheckoutStep(4);

  const container = document.getElementById('checkoutStep4Details');
  if (!container) return;

  const paymentMethod = (order.paymentMethod || selectedCheckoutPaymentMethod || 'DEPOSIT').toUpperCase();
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

  container.innerHTML = `
    <div style="text-align:center;">
      <!-- KHỐI TRẠNG THÁI ĐƠN HÀNG & MÃ SPX THỜI GIAN THỰC -->
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

      ${isCOD ? `
        <div style="background:#f8fafc; border:1.5px solid #cbd5e1; border-radius:10px; padding:12px 14px; margin-bottom:14px; text-align:left;">
          <div style="font-weight:700; color:#1e293b; font-size:13px; margin-bottom:4px;">
            <i class="fa-solid fa-hand-holding-dollar" style="color:#059669; margin-right:4px;"></i> Hình thức: Thanh toán khi nhận hàng (Ship COD SPX)
          </div>
          <div style="font-size:12px; color:#64748b;">
            Tổng tiền thanh toán cho bưu tá SPX khi nhận và kiểm tra kiện xe: <strong style="color:#dc2626; font-size:14px;">${formatVND(totalAmount)}</strong>.
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

          <div style="display:grid; grid-template-columns: 140px 1fr; gap:14px; align-items:center;">
            <div style="text-align:center;">
              <img src="${dynamicQrUrl}" data-mode="dynamic" id="step4QrImg" alt="QR MB Bank" style="width:100%; border-radius:8px; border:1px solid #e2e8f0; box-shadow:0 2px 6px rgba(0,0,0,0.05); padding:2px; background:#fff;" onerror="this.src='${originalQrImg}'">
              <div style="font-size:10px; color:#64748b; margin-top:4px;">Quét mã VietQR MB</div>
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
        </div>
      `}

      <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
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
}

function updateLiveStep4OrderStatus(rawOrd) {
  if (!rawOrd) return;
  const ord = api.normalizeOrderObject ? api.normalizeOrderObject(rawOrd) : rawOrd;
  const box = document.getElementById('paymentLiveStatusBox');
  if (!box) return;

  const status = String(ord.status || ord.Status || 'PENDING').toUpperCase();
  const trackingCode = ord.trackingCode || ord.TrackingCode || null;
  const isApproved = ['CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED'].includes(status) || Boolean(trackingCode);
  const code = ord.code || ord.orderCode || ord.OrderCode || '';

  if (!isApproved && ord.paymentStatus !== 'PAID' && ord.paymentStatus !== 'PARTIALLY_PAID') {
    return;
  }

  box.className = '';
  box.style.background = '#ecfdf5';
  box.style.border = '2px solid #10b981';
  box.style.borderRadius = '10px';
  box.style.padding = '14px';
  box.style.color = '#065f46';

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

function startPaymentPolling(orderCode) {
  if (!orderCode) return;
  if (paymentPollInterval) clearInterval(paymentPollInterval);

  paymentPollInterval = setInterval(async () => {
    try {
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
  api.setAuthSession(token, user);

  updateUserHeaderUI();
  closeModal('authModal');
  showToast(`Xin chào, ${user.fullName || user.email}! Đăng nhập thành công.`, 'success');

  if (user.role === 'admin') {
    setTimeout(() => {
      if (confirm('[Quản Trị Viên] Bạn đã đăng nhập bằng tài khoản Admin! Bạn có muốn truy cập ngay vào Admin Portal để quản lý đơn hàng & mô hình xe không?')) {
        window.location.href = 'admin/index.html';
      }
    }, 450);
  }
}

function logout() {
  api.clearAuthSession();
  currentUser = null;
  currentToken = null;
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
        ${isAdmin ? '<a href="admin/index.html" class="btn btn-sm btn-primary" style="padding: 4px 10px; font-size: 11px;"><i class="fa-solid fa-crown" style="margin-right:4px;"></i> Quản Trị Admin</a>' : ''}
        <div class="user-profile-btn" onclick="toggleUserDropdown(event)">
          <img class="user-avatar" src="${currentUser.avatarUrl || 'image/DoQuocThinh_anhthe.jpg'}" alt="${currentUser.fullName}" onerror="this.src='image/logominigt.png'">
          <span style="font-size:12px; font-weight:600;">${currentUser.fullName || currentUser.email}</span>
          <span style="font-size:10px;"><i class="fa-solid fa-chevron-down"></i></span>
          <div class="user-dropdown" id="userDropdownMenu">
            <div class="user-dropdown-header">
              <div class="user-dropdown-name">${currentUser.fullName}</div>
              <div class="user-dropdown-email">${currentUser.email}</div>
            </div>
            ${isAdmin ? '<a href="admin/index.html" class="user-dropdown-item" style="color:var(--color-primary); font-weight:bold;"><i class="fa-solid fa-crown" style="margin-right:6px;"></i> Mở Trang Quản Trị Admin</a>' : ''}
            <div class="user-dropdown-item" onclick="openMyOrdersModal()"><i class="fa-solid fa-box-archive" style="margin-right:6px;"></i> Đơn hàng của tôi (SPX)</div>
            <div class="user-dropdown-item" onclick="openTrackingModal()"><i class="fa-solid fa-magnifying-glass" style="margin-right:6px;"></i> Tra cứu đơn cọc</div>
            <div class="user-dropdown-item" onclick="logout()"><i class="fa-solid fa-right-from-bracket" style="margin-right:6px;"></i> Đăng xuất</div>
          </div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="openAuthModal('login')">
        <i class="fa-solid fa-user" style="margin-right:5px;"></i> Đăng nhập Gmail
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
// 13. TRUNG TÂM ĐƠN HÀNG CỦA KHÁCH (MY ORDERS) & TRA CỨU VẬN ĐƠN SPX
// =====================================================================
let myOrdersCache = [];
let myOrdersActiveFilter = 'ALL';
let myOrdersSearchKeyword = '';
let customerOrderStateSnapshot = {};
let customerOrderRealtimeTimer = null;

function getSavedCustomerOrderCodes() {
  try {
    const raw = JSON.parse(localStorage.getItem('minigt_my_order_codes') || '[]');
    const shared = typeof getSharedOrdersList === 'function' ? getSharedOrdersList() : [];
    const sharedCodes = shared.map(o => o.OrderCode || o.orderCode || o.code).filter(Boolean);
    return Array.from(new Set([...(Array.isArray(raw) ? raw : []), ...sharedCodes])).slice(0, 30);
  } catch (e) {
    return [];
  }
}

function rememberCustomerOrderCode(code) {
  if (!code) return;
  try {
    const existing = JSON.parse(localStorage.getItem('minigt_my_order_codes') || '[]');
    const next = [code, ...(Array.isArray(existing) ? existing.filter(c => c !== code) : [])].slice(0, 30);
    localStorage.setItem('minigt_my_order_codes', JSON.stringify(next));
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
  const savedCodes = getSavedCustomerOrderCodes();
  const savedPhone = currentUser?.phone || localStorage.getItem('minigt_customer_phone') || localStorage.getItem('minigt_last_phone') || '';
  const queryParams = new URLSearchParams();
  if (savedCodes.length > 0) queryParams.set('codes', savedCodes.join(','));
  if (savedPhone) queryParams.set('phone', savedPhone);

  const headers = {};
  if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

  const url = `/api/orders/my-orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const json = await safeFetch(url, { headers });
  let apiOrders = (json && json.success && Array.isArray(json.data)) ? json.data : [];

  // Đồng bộ vào kho chia sẻ local để cả online/offline đều nhất quán
  if (typeof upsertSharedOrder === 'function') {
    apiOrders.forEach(o => upsertSharedOrder(o));
  }

  // Hợp nhất thêm các đơn hàng vừa đặt trong localStorage nếu cần
  const sharedOrders = typeof getSharedOrdersList === 'function' ? getSharedOrdersList() : [];
  const byCode = new Map();
  apiOrders.forEach(o => {
    const c = o.OrderCode || o.orderCode || o.code;
    if (c) byCode.set(c, o);
  });
  sharedOrders.forEach(o => {
    const c = o.OrderCode || o.orderCode || o.code;
    if (!c || byCode.has(c)) return;
    const matchCode = savedCodes.includes(c);
    const matchPhone = savedPhone && (o.Phone === savedPhone || o.customer?.phone === savedPhone);
    const matchEmail = currentUser?.email && ((o.Email || o.customer?.email || '').toLowerCase() === currentUser.email.toLowerCase());
    if (matchCode || matchPhone || matchEmail) {
      byCode.set(c, o);
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
    <!-- Banner thông báo trạng thái duyệt & mã SPX mới nhất từ Admin -->
    ${latestApprovedOrSpx ? (() => {
      const code = latestApprovedOrSpx.OrderCode || latestApprovedOrSpx.orderCode || latestApprovedOrSpx.code;
      const tk = String(latestApprovedOrSpx.TrackingCode || latestApprovedOrSpx.trackingCode || '').trim();
      return `
        <div style="background:linear-gradient(135deg, #ecfdf5 0%, #fff7ed 100%); border:1.5px solid ${tk ? '#fdba74' : '#86efac'}; border-radius:12px; padding:12px 16px; margin-bottom:14px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:38px; height:38px; border-radius:10px; background:${tk ? '#ea580c' : '#16a34a'}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">
              <i class="fa-solid ${tk ? 'fa-truck-fast' : 'fa-bell'}"></i>
            </div>
            <div>
              <div style="font-size:13px; font-weight:800; color:#0f172a;">
                ${tk
                  ? `🎉 Admin đã duyệt đơn #${escapeHtml(code)} và cập nhật mã SPX Express: <span style="color:#ea580c; font-family:monospace;">${escapeHtml(tk)}</span>`
                  : `✅ Admin đã duyệt đơn hàng #${escapeHtml(code)} của bạn! Đang đóng gói bọc xốp chống sốc.`}
              </div>
              <div style="font-size:11.5px; color:#475569; margin-top:2px;">
                Dữ liệu được đồng bộ thời gian thực trực tiếp từ Hệ thống Admin Săn Xe Biên Hòa.
              </div>
            </div>
          </div>
          ${tk ? `
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn btn-sm" style="background:#ea580c; color:#fff; border:none; font-size:11.5px; padding:6px 10px;" onclick="copyToClipboard('${escapeHtml(tk)}', 'Đã sao chép mã SPX: ${escapeHtml(tk)}')">
                <i class="fa-regular fa-copy"></i> Copy mã SPX
              </button>
              <a href="https://spx.vn/vi" target="_blank" class="btn btn-sm btn-outline" style="font-size:11.5px; padding:6px 10px; border-color:#fdba74; color:#c2410c;">
                Tra cứu SPX ↗
              </a>
            </div>
          ` : ''}
        </div>
      `;
    })() : ''}

    <!-- 4 Thẻ thống kê tổng quan của khách hàng -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(165px, 1fr)); gap:10px; margin-bottom:14px;">
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px;">
        <div style="font-size:11px; color:#64748b; font-weight:700; text-transform:uppercase;">Tổng đơn đã đặt</div>
        <div style="font-size:20px; font-weight:900; color:#0f172a; margin-top:2px;">${totalOrders} đơn</div>
      </div>
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:10px 12px;">
        <div style="font-size:11px; color:#15803d; font-weight:700; text-transform:uppercase;">Admin đã duyệt</div>
        <div style="font-size:20px; font-weight:900; color:#166534; margin-top:2px;">${approvedCount} đơn</div>
      </div>
      <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:10px 12px;">
        <div style="font-size:11px; color:#c2410c; font-weight:700; text-transform:uppercase;">Đã có mã SPX Express</div>
        <div style="font-size:20px; font-weight:900; color:#9a3412; margin-top:2px;">${shippingWithSpxCount} đơn</div>
      </div>
      <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:10px 12px;">
        <div style="font-size:11px; color:#1d4ed8; font-weight:700; text-transform:uppercase;">Tổng giá trị sưu tầm</div>
        <div style="font-size:18px; font-weight:900; color:#1e40af; margin-top:2px;">${formatVND(totalSpent)}</div>
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
  const bankAcc = storeSettings?.bank_account_no || '0988164164';
  const bankName = storeSettings?.bank_name || 'MBBank (Ngân Hàng Quân Đội)';
  const bankOwner = storeSettings?.bank_account_name || 'DO QUOC THINH';

  const fullName = ord.FullName || ord.customer?.fullName || 'Khách hàng';
  const phone = ord.Phone || ord.customer?.phone || '';
  const address = ord.Address || ord.customer?.address || '';
  const note = ord.Note || ord.note || '';

  // Tiến trình 5 bước của đơn hàng
  let activeStep = 1;
  if (ordStatus === 'CONFIRMED') activeStep = 2;
  else if (ordStatus === 'PREPARING') activeStep = 3;
  else if (ordStatus === 'SHIPPING' || (trackingCode && ordStatus !== 'DELIVERED')) activeStep = 4;
  else if (ordStatus === 'DELIVERED') activeStep = 5;

  const progressSteps = [
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
    statusBadgeHTML = `<span style="font-size:11px; font-weight:800; padding:3px 10px; border-radius:9999px; background:#dcfce7; color:#15803d;">✅ Admin đã duyệt đơn</span>`;
  } else if (ordStatus === 'PREPARING') {
    statusBadgeHTML = `<span style="font-size:11px; font-weight:800; padding:3px 10px; border-radius:9999px; background:#e0f2fe; color:#0369a1;">📦 Đang đóng gói chống sốc</span>`;
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

      <!-- KHỐI THÔNG BÁO ADMIN ĐÃ DUYỆT ĐƠN & MÃ VẬN ĐƠN SPX EXPRESS -->
      ${ordStatus === 'CANCELLED' ? `
        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:12.5px; color:#991b1b;">
          <strong><i class="fa-solid fa-ban"></i> Đơn hàng này đã bị hủy.</strong>
          ${ord.CancelReason || ord.cancelReason ? `<div style="margin-top:3px;">Lý do: ${escapeHtml(ord.CancelReason || ord.cancelReason)}</div>` : ''}
        </div>
      ` : (isApproved ? `
        <div style="background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border:1.5px solid #86efac; border-radius:12px; padding:12px 14px; margin-bottom:12px; display:flex; align-items:flex-start; gap:10px;">
          <i class="fa-solid fa-circle-check" style="color:#16a34a; font-size:20px; margin-top:2px;"></i>
          <div style="flex:1;">
            <div style="font-size:13.5px; font-weight:800; color:#14532d;">
              🎉 THÔNG BÁO TỪ ADMIN: Đơn hàng #${escapeHtml(orderCode)} đã được Admin duyệt xác nhận!
            </div>
            <div style="font-size:12px; color:#166534; margin-top:2px; line-height:1.45;">
              ${trackingCode
                ? `Admin đã bàn giao kiện hàng cho <strong>SPX Express</strong> và cập nhật mã vận đơn chính thức bên dưới cho bạn.`
                : `Admin đã xác nhận đơn hàng & kiểm tra mô hình. Kiện xe đang được bọc xốp chống sốc 3 lớp để lấy mã vận đơn SPX Express.`}
            </div>
          </div>
        </div>
      ` : `
        <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:11px 14px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
          <div style="font-size:12px; color:#92400e; line-height:1.45;">
            <i class="fa-solid fa-hourglass-half" style="color:#d97706; margin-right:5px;"></i>
            <strong>Đang chờ Admin duyệt đơn & dán mã SPX:</strong> Ngay khi Admin bấm duyệt hoặc lưu mã SPX, thông báo và mã vận đơn sẽ hiện ngay tại đây!
          </div>
          <span style="font-size:10.5px; font-weight:700; background:#fef3c7; color:#b45309; padding:3px 8px; border-radius:999px;">Real-time Sync</span>
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
          ${Array.isArray(ord.items) && ord.items.length > 0 ? ord.items.map(it => `
            <div style="display:flex; align-items:center; gap:8px; padding:5px 0; border-bottom:1px dashed #e2e8f0; font-size:12px;">
              <img src="${it.ImageUrl || it.image || 'image/hero-banner.jpg'}" onerror="this.src='image/hero-banner.jpg'" style="width:38px; height:38px; object-fit:contain; border-radius:6px; border:1px solid #cbd5e1; background:#fff; padding:2px;">
              <div style="flex:1; min-width:0;">
                <div style="font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(it.ProductName || it.name || 'Mô hình 1:64')}</div>
                <div style="font-size:11px; color:#64748b;">SL: <strong>x${it.Quantity || it.quantity || 1}</strong> • Đơn giá: ${formatVND(it.UnitPrice || it.unitPrice || 0)}</div>
              </div>
              <strong style="color:#0f172a; font-size:12.5px;">${formatVND(Number(it.UnitPrice || it.unitPrice || 0) * Number(it.Quantity || it.quantity || 1))}</strong>
            </div>
          `).join('') : `<div style="font-size:12px; color:#64748b;">Đơn hàng tiêu chuẩn Săn Xe Biên Hòa</div>`}
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
        <div id="qrPanel_${escapeHtml(orderCode)}" style="display:none; background:#fffbeb; border:1.5px solid #fde68a; border-radius:10px; padding:12px; margin-bottom:12px;">
          <div style="display:grid; grid-template-columns:110px 1fr; gap:12px; align-items:center;">
            <img src="https://img.vietqr.io/image/MB-${encodeURIComponent(bankAcc)}-compact2.png?amount=${Math.round(payMethod === 'DEPOSIT' ? depositAmount : total)}&addInfo=${encodeURIComponent(paymentMemo)}&accountName=${encodeURIComponent(bankOwner)}" alt="VietQR" style="width:100%; border-radius:8px; border:1px solid #e2e8f0; background:#fff; padding:2px;">
            <div style="font-size:12px; color:#451a03; line-height:1.6;">
              <div>Ngân hàng: <strong>${escapeHtml(bankName)}</strong> • Chủ TK: <strong>${escapeHtml(bankOwner)}</strong></div>
              <div>STK: <strong style="color:#dc2626; font-family:monospace;">${escapeHtml(bankAcc)}</strong> <button type="button" class="btn-copy-mini" onclick="copyToClipboard('${escapeHtml(bankAcc)}', 'Đã sao chép STK!')"><i class="fa-regular fa-copy"></i></button></div>
              <div>Số tiền chuyển: <strong style="color:#dc2626;">${formatVND(payMethod === 'DEPOSIT' ? depositAmount : total)}</strong></div>
              <div>Nội dung CK: <strong style="color:#1d4ed8; font-family:monospace;">${escapeHtml(paymentMemo)}</strong> <button type="button" class="btn-copy-mini" onclick="copyToClipboard('${escapeHtml(paymentMemo)}', 'Đã sao chép nội dung CK!')"><i class="fa-regular fa-copy"></i></button></div>
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
  modal.classList.add('active');
}

async function submitCustomerEditShipping(event) {
  if (event) event.preventDefault();
  const orderCode = document.getElementById('editShippingOrderCode')?.value.trim();
  const fullName = document.getElementById('editShippingFullName')?.value.trim();
  const phone = document.getElementById('editShippingPhone')?.value.trim();
  const address = document.getElementById('editShippingAddress')?.value.trim();
  const note = document.getElementById('editShippingNote')?.value.trim();

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
      body: JSON.stringify({ fullName, phone, address, note })
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
      showToast(`🎉 Cảm ơn bạn đã xác nhận nhận hàng đơn #${orderCode}! Chúc bạn trưng bày mô hình thật đẹp!`, 'success');
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
      if (json.data && typeof upsertSharedOrder === 'function') upsertSharedOrder(json.data);
      if (typeof emitRealtimeSync === 'function') {
        emitRealtimeSync('ORDER_UPDATED', { orderCode, status: 'CANCELLED', order: json.data });
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
function showCustomerOrderRealtimeBanner(orderCode, status, trackingCode) {
  const existing = document.getElementById('customerRealtimeOrderAlert');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'customerRealtimeOrderAlert';
  banner.style.cssText = 'position:fixed; top:82px; right:20px; z-index:99999; max-width:420px; background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color:#fff; border:2px solid #fb923c; border-radius:14px; padding:14px 16px; box-shadow:0 16px 38px rgba(15,23,42,0.35); animation:slideInRight 0.35s ease;';
  banner.innerHTML = `
    <div style="display:flex; align-items:flex-start; gap:12px;">
      <div style="width:40px; height:40px; border-radius:10px; background:${trackingCode ? '#ea580c' : '#16a34a'}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">
        <i class="fa-solid ${trackingCode ? 'fa-truck-fast' : 'fa-circle-check'}"></i>
      </div>
      <div style="flex:1;">
        <div style="font-size:11px; font-weight:800; color:#fdba74; text-transform:uppercase; letter-spacing:0.5px;">
          🔔 Thông báo mới từ Admin Săn Xe Biên Hòa
        </div>
        <div style="font-size:13.5px; font-weight:800; margin-top:2px;">
          ${trackingCode
            ? `Đơn #${escapeHtml(orderCode)} đã được duyệt & có mã SPX!`
            : `Admin đã duyệt đơn hàng #${escapeHtml(orderCode)} của bạn!`}
        </div>
        ${trackingCode ? `
          <div style="margin-top:6px; background:rgba(255,255,255,0.1); border:1px dashed #fdba74; border-radius:8px; padding:6px 10px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
            <span style="font-family:monospace; font-size:13px; font-weight:800; color:#fde047;">${escapeHtml(trackingCode)}</span>
            <button type="button" onclick="copyToClipboard('${escapeHtml(trackingCode)}', 'Đã sao chép mã SPX: ${escapeHtml(trackingCode)}')" style="background:#ea580c; color:#fff; border:none; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:700; cursor:pointer;">Copy mã</button>
          </div>
        ` : ''}
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button type="button" onclick="document.getElementById('customerRealtimeOrderAlert')?.remove(); openMyOrdersModal();" style="background:#22c55e; color:#fff; border:none; border-radius:8px; padding:6px 12px; font-size:11.5px; font-weight:800; cursor:pointer;">
            Xem đơn hàng ngay
          </button>
          <button type="button" onclick="document.getElementById('customerRealtimeOrderAlert')?.remove();" style="background:rgba(255,255,255,0.12); color:#cbd5e1; border:none; border-radius:8px; padding:6px 10px; font-size:11.5px; cursor:pointer;">
            Đóng
          </button>
        </div>
      </div>
    </div>
  `;
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

      if (code) {
        const myCodes = getSavedCustomerOrderCodes();
        const isMyOrder = myCodes.includes(code) || (currentOrder && (currentOrder.code === code || currentOrder.orderCode === code));
        if (isMyOrder && detail.type === 'ORDER_UPDATED') {
          const prev = customerOrderStateSnapshot[code] || {};
          const newlyApproved = ['CONFIRMED', 'PREPARING', 'SHIPPING'].includes(newStatus) && prev.status === 'PENDING';
          const newlyTracked = Boolean(newTracking) && newTracking !== prev.tracking;
          customerOrderStateSnapshot[code] = { status: newStatus || prev.status, tracking: newTracking || prev.tracking };

          if (newlyApproved || newlyTracked) {
            showCustomerOrderRealtimeBanner(code, newStatus, newTracking);
          }
        }
      }

      // Cập nhật ngay lập tức các modal đang mở
      if (document.getElementById('myOrdersModal')?.classList.contains('active')) {
        loadMyOrdersList(true);
      }
      if (document.getElementById('checkoutModal')?.classList.contains('active') && currentOrder) {
        const activeCode = currentOrder.code || currentOrder.orderCode || currentOrder.OrderCode;
        if (!code || activeCode === code) {
          safeFetch(`/api/orders/check-status/${encodeURIComponent(activeCode)}`).then(res => {
            if (res && res.success && res.data && typeof updateLiveStep4OrderStatus === 'function') {
              updateLiveStep4OrderStatus(res.data);
            }
          }).catch(() => {});
        }
      }
    }
  });

  // 2. Polling nhẹ mỗi 6 giây tới Backend SQL để phát hiện thay đổi từ máy Admin khác
  if (customerOrderRealtimeTimer) clearInterval(customerOrderRealtimeTimer);
  customerOrderRealtimeTimer = setInterval(async () => {
    const codes = getSavedCustomerOrderCodes();
    if (codes.length === 0 && !currentToken) return;
    try {
      const prevSnap = { ...customerOrderStateSnapshot };
      const orders = await fetchCustomerOrdersUnified();
      myOrdersCache = orders;

      orders.forEach(o => {
        const c = o.OrderCode || o.orderCode || o.code;
        const st = String(o.Status || o.status || 'PENDING').toUpperCase();
        const tk = String(o.TrackingCode || o.trackingCode || '').trim();
        const old = prevSnap[c];
        if (old) {
          const newlyApproved = ['CONFIRMED', 'PREPARING', 'SHIPPING'].includes(st) && old.status === 'PENDING';
          const newlyTracked = Boolean(tk) && tk !== old.tracking;
          if (newlyApproved || newlyTracked) {
            showCustomerOrderRealtimeBanner(c, st, tk);
          }
        }
      });

      if (document.getElementById('myOrdersModal')?.classList.contains('active')) {
        const container = document.getElementById('myOrdersModalContent');
        if (container && document.activeElement?.id !== 'myOrdersSearchInput') {
          renderMyOrdersCenterUI(container);
        }
      }
    } catch (e) {
      // ignore background error
    }
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
// 16. MODAL & NAVIGATION UTILITIES (MOBILE DRAWER, FILTER & SCROLL)
// =====================================================================
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
  if (modalId === 'checkoutModal') document.body.classList.remove('checkout-modal-open');
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

  const filtered = allProducts.filter(p =>
    p.Name.toLowerCase().includes(query) ||
    p.Sku.toLowerCase().includes(query) ||
    (p.Brand && p.Brand.toLowerCase().includes(query)) ||
    (p.CategoryName && p.CategoryName.toLowerCase().includes(query))
  );

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
    container.innerHTML = filtered.map(p => createProductCardHTML(p)).join('');
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

// 17.3 Scroll Progress Bar
function initScrollProgressBar() {
  const progressBar = document.getElementById('navScrollProgress');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;
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
  const body = document.getElementById('compareModalBody');
  if (!modal || !body) return;

  const items = compareList
    .map(id => allProducts.find(p => Number(p.Id || p.ProductId) === Number(id)))
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
            ${items.map(p => `
              <th style="padding:12px; border:1px solid #e2e8f0; text-align:center; min-width:210px;">
                <img src="${p.ImageUrl}" onerror="this.src='image/hero-banner.jpg'" style="width:110px; height:80px; object-fit:contain; margin:0 auto 8px;">
                <div style="font-size:13.5px; color:var(--color-navy); font-weight:800;">${escapeHtml(p.Name)}</div>
                <div style="font-size:11px; color:#64748b; font-family:monospace; margin-top:2px;">SKU: #${escapeHtml(p.Sku)}</div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:10px 12px; border:1px solid #e2e8f0; font-weight:700; background:#f8fafc;">Giá niêm yết</td>
            ${items.map(p => `<td style="padding:10px 12px; border:1px solid #e2e8f0; text-align:center; font-weight:800; color:var(--color-primary); font-size:15px;">${formatVND(p.Price)}</td>`).join('')}
          </tr>
          <tr>
            <td style="padding:10px 12px; border:1px solid #e2e8f0; font-weight:700; background:#f8fafc;">Mức cọc giữ xe (30%)</td>
            ${items.map(p => `<td style="padding:10px 12px; border:1px solid #e2e8f0; text-align:center; font-weight:700; color:#2563eb;">${formatVND(Math.round(p.Price * ((p.DepositRate || 30) / 100)))}</td>`).join('')}
          </tr>
          <tr>
            <td style="padding:10px 12px; border:1px solid #e2e8f0; font-weight:700; background:#f8fafc;">Trạng thái kho</td>
            ${items.map(p => `<td style="padding:10px 12px; border:1px solid #e2e8f0; text-align:center;">${p.Status === 'IN_STOCK' ? '<span style="color:#16a34a; font-weight:800;">✅ Sẵn hàng giao ngay</span>' : (p.Status === 'PRE_ORDER' ? '<span style="color:#d97706; font-weight:800;">⏳ Nhận cọc Pre-Order</span>' : '<span style="color:#dc2626; font-weight:800;">Hết hàng</span>')}</td>`).join('')}
          </tr>
          <tr>
            <td style="padding:10px 12px; border:1px solid #e2e8f0; font-weight:700; background:#f8fafc;">Phiên bản / Dòng xe</td>
            ${items.map(p => `<td style="padding:10px 12px; border:1px solid #e2e8f0; text-align:center;">${escapeHtml(p.EditionNote || p.CategoryName || 'Standard Blister / Box 1:64')}</td>`).join('')}
          </tr>
          <tr>
            <td style="padding:10px 12px; border:1px solid #e2e8f0; font-weight:700; background:#f8fafc;">Chất liệu & Tỷ lệ</td>
            ${items.map(() => `<td style="padding:10px 12px; border:1px solid #e2e8f0; text-align:center;">Diecast Kim Loại Nguyên Khối • Lốp Cao Su • Chuẩn 1:64</td>`).join('')}
          </tr>
          <tr>
            <td style="padding:10px 12px; border:1px solid #e2e8f0; font-weight:700; background:#f8fafc;">Thao tác nhanh</td>
            ${items.map(p => {
              const pid = p.Id || p.ProductId;
              return `
                <td style="padding:10px 12px; border:1px solid #e2e8f0; text-align:center;">
                  <button type="button" class="btn btn-primary btn-sm" onclick="closeModal('compareModal'); addToCart(${pid});">
                    <i class="fa-solid fa-cart-plus"></i> Chọn mẫu này
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

  window.addEventListener('scroll', () => {
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
// 18. KHỞI CHẠY TẤT CẢ KHI TẢI XONG DOM
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
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


