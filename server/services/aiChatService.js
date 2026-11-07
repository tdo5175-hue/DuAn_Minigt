/**
 * AI CHAT SERVICE v5 — "BÉ BOT SĂN XE 1:64" | MINI GT STORE BIÊN HÒA
 * ---------------------------------------------------------------------------
 * Kiến trúc Lean Inverted-Index + Đồng bộ dữ liệu sống 100% + NLU Đa tầng:
 *   1. Siêu nhẹ & Tốc độ O(1):
 *      - Chỉ mục ngược (Inverted Token Map) trên RAM, không lưu chuỗi context khổng lồ.
 *      - Micro-RAG cho Gemini API (chỉ nạp Top 4 mẫu liên quan < 250 tokens).
 *   2. Đồng bộ dữ liệu 100% Thời gian thực (Zero-Lag Sync):
 *      - Đồng bộ trực tiếp với Settings (phí ship SPX 11.000đ, ngưỡng Freeship, MB Bank...),
 *        Products (giá sau giảm DiscountPercent, Box-only/Card-only, tồn kho thật, % cọc riêng)
 *        và Coupons + Đặc quyền VIP 1–5.
 *      - Hỗ trợ invalidateStoreCache() để cập nhật tức thì ngay khi Admin vừa bấm Lưu!
 *   3. Đọc hiểu Tiếng Việt tự nhiên & Teencode / Viết tắt:
 *      - Tự chuẩn hóa k/ko/hok -> không, dc -> được, bn -> bao nhiêu, ck -> chuyển khoản, fship...
 *      - Giải quyết câu ghép nhiều ý trong 1 tin nhắn (VD: hỏi xe + phí ship + mã giảm giá + người tạo web).
 *      - Tự tính thử mã Voucher cụ thể cho xe đang hỏi, lọc xe đang Sale giảm giá, tra đơn bằng Mã đơn hoặc SĐT.
 *   4. Non-blocking Escalation:
 *      - Câu hỏi ngoài phạm vi được gắn cờ chuyển Admin kèm ngữ cảnh, khách hỏi tiếp câu khác Bé Bot vẫn trả lời ngay.
 */
const db = require('../config/db');
const settingsService = require('./settingsService');
const couponService = require('./couponService');
const { calcDiscountedPrice } = require('./productService');
// v6: Bộ đọc hiểu tiếng Việt 0-token + Bản đồ tri thức website (chạy hoàn toàn trên RAM)
const { normalizeVietnamese, setVocabulary } = require('./aiVietNormalizer');
const { searchKnowledge, docPlainText, allKeyPhrases } = require('./aiSiteKnowledge');

const SHOP = {
  name: 'MINI GT STORE BIÊN HÒA',
  address: '38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai',
  hotline: '0981.903.400',
  storeHotline: '0988.164.164',
  zalo: '0981903400',
  email: 'quocthinh.admin@minigt.vn',
  hours: '8:00 – 21:00 hằng ngày (kể cả Thứ 7 & Chủ Nhật)',
  shippingFee: 11000,
  freeShipThreshold: 1000000,
  depositRate: 0.3,
  preorderDeadline: 'Tháng 11/2026',
  bankName: 'Ngân hàng Quân Đội (MB Bank)',
  bankAccountNo: '87654321082007',
  bankAccountName: 'DO QUOC THINH',
  wholesaleQty: 5
};

const CREATOR_MARKER = 'Đỗ Quốc Thịnh';
const CREATORS = {
  university: 'Trường Đại Học Lạc Hồng (LHU) — TP. Biên Hòa, Đồng Nai',
  project: 'Đồ án Thiết kế Web Thương mại Điện tử & Showroom Mô hình Die-cast 1:64 — MINI GT STORE BIÊN HÒA',
  thinh: {
    fullName: 'Đỗ Quốc Thịnh',
    shortName: 'Thịnh',
    role: 'Đồng sáng lập (Co-Founder), Quản trị viên chính & Full-Stack Lead Developer',
    email: 'quocthinh.admin@minigt.vn',
    zalo: '0981.903.400',
    location: '38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai',
    highlights: [
      'Thiết kế kiến trúc Backend Node.js / Express & Cơ sở dữ liệu đám mây Supabase PostgreSQL.',
      'Phát triển hệ thống Trợ lý AI Bé Bot 1:64 v5 (Inverted Index siêu nhẹ) & Bảng điều khiển Chat thời gian thực cho Admin.',
      'Tích hợp thanh toán tự động VietQR MB Bank / PayOS, xác thực bảo mật Gmail OTP và quản lý kho Showroom.'
    ]
  },
  nam: {
    fullName: 'Nguyễn Đình Nam',
    shortName: 'Nam',
    role: 'Đồng sáng lập (Co-Founder), Quản trị viên & Frontend / UI-UX Architect',
    email: 'dinhnam.admin@minigt.vn',
    zalo: '0981.903.400 (Zalo Showroom)',
    location: 'TP. Biên Hòa, Đồng Nai',
    highlights: [
      'Thiết kế giao diện người dùng (UI/UX) hiện đại, chuẩn phong cách Showroom xe đua 1:64 trên cả máy tính và điện thoại.',
      'Xây dựng trải nghiệm mua sắm, xem nhanh QuickView đa góc ảnh, giỏ hàng Box/Card và quy trình đặt cọc Pre-Order trực quan.',
      'Biên tập nội dung chuyên sâu các bộ sưu tập MINI GT, Pop Race, F1, Liberty Walk LBWK và chăm sóc hội viên VIP.'
    ]
  },
  techStack: [
    'Frontend: HTML5, CSS3 Custom Design System, Vanilla JavaScript SPA tốc độ cao, đồng bộ tab Real-time (BroadcastChannel).',
    'Backend: Node.js + Express RESTful API tối ưu Incremental Sync (sinceId), tương thích cả Local & Cloud Serverless (Vercel).',
    'Database: PostgreSQL trên đám mây Supabase đồng bộ trực tiếp tồn kho Box/Card, thiết lập phí ship, Voucher & đơn hàng.',
    'Tích hợp thông minh: Cổng VietQR / PayOS tự động, gửi biên nhận điện tử Gmail (Nodemailer) và Hybrid AI Chatbot v5.'
  ]
};

// =====================================================================
// 1. BỘ NHỚ ĐỆM SIÊU NHẸ + CHỈ MỤC NGƯỢC (INVERTED INDEX) + ĐỒNG BỘ SỐNG
// =====================================================================
let cachedProducts = [];
let cachedCoupons = [];
let invertedTokenMap = new Map(); // token -> Array<productIndex>
let lastFetch = 0;
let lastCatalogFingerprint = '';
let lastFingerprintCheckAt = 0;
const CACHE_TTL_MS = 90 * 1000;
const FINGERPRINT_CHECK_THROTTLE_MS = 600;

function invalidateStoreCache() {
  lastFetch = 0;
  lastCatalogFingerprint = '';
  lastFingerprintCheckAt = 0;
  vocabInitialized = false;
}

function getCatalogSignature() {
  return lastCatalogFingerprint || `${cachedProducts.length}`;
}

async function queryLiveCatalogFingerprint() {
  try {
    const fpRes = await db.query(`
      SELECT
        COUNT(*)::int AS cnt,
        COALESCE(SUM(COALESCE(StockBox, 0) + COALESCE(StockCard, 0) + COALESCE(Stock, 0)), 0)::int AS st,
        COALESCE(SUM(COALESCE(Price, 0) + COALESCE(PriceBox, 0) + COALESCE(PriceCard, 0)), 0)::bigint AS pr,
        COALESCE(SUM(COALESCE(DiscountPercent, 0)), 0)::int AS dc,
        MD5(COALESCE(STRING_AGG(
          ProductId::text || ':' || COALESCE(Sku, '') || ':' || COALESCE(Name, '') || ':' ||
          COALESCE(Status, '') || ':' || COALESCE(PackagingType, '') || ':' ||
          COALESCE(PriceBox, 0)::text || ':' || COALESCE(PriceCard, 0)::text || ':' ||
          COALESCE(DiscountPercent, 0)::text || ':' ||
          COALESCE(StockBox, 0)::text || ':' || COALESCE(StockCard, 0)::text || ':' ||
          COALESCE(Stock, 0)::text || ':' || COALESCE(ImageUrl, ''),
          '|' ORDER BY ProductId ASC
        ), '')) AS h
      FROM Products
      WHERE IsActive = TRUE
    `);
    const r = fpRes.recordset?.[0] || {};
    return `${r.cnt || 0}:${r.st || 0}:${r.pr || 0}:${r.dc || 0}:${r.h || ''}`;
  } catch (_) {
    return '';
  }
}

const TAG_RULES = [
  [/lamborghini|huracan|sterrato/, 'lambo lamborghini sieu xe y italia sterrato dia hinh'],
  [/roxy/, 'khung long hong mau hong pink ao racing road america 77'],
  [/rexy/, 'khung long xanh la green mau xanh ao racing sebring 80'],
  [/skeleton/, 'xuong khung long den mau den raw carbon ao racing petit le mans halloween'],
  [/ao racing/, 'khung long bao chua imsa gt3 porsche'],
  [/porsche|911/, 'porsche 911 gt3 gt3r duc'],
  [/formula|(^|\s)f1(\s|$)|amr24|rb18/, 'f1 formula dua cong thuc 1 grand prix xe dua f1'],
  [/red bull|rb18/, 'redbull red bull bo tot verstappen monaco xanh den'],
  [/verstappen/, 'max verstappen nha vo dich so 1'],
  [/alonso/, 'fernando alonso tay dua 14'],
  [/stroll/, 'lance stroll las vegas 18'],
  [/aston martin|amr24/, 'aston martin amr24 xanh la racing green anh kim'],
  [/(^|\s)lb(\s|$)|liberty|lbwk|silhouette/, 'lbwk liberty walk widebody than rong nhat ban xe do'],
  [/supra/, 'toyota supra jdm nhat ban a80 chay pho'],
  [/bomex|brian|fast and the furious/, 'brian oconner fast furious fnf mau cam orange phim qua nhanh qua nguy hiem'],
  [/top secret.+red chrome|mg1132/, 'top secret mau do red chrome crom supra do'],
  [/silver chrome|pr640325/, 'top secret mau bac silver chrome crom sang bong supra bac'],
  [/skyline|(^|\s)gt r(\s|$)|r32|r34|r35/, 'gtr gt-r nissan skyline r32 godzilla jdm nhat ban'],
  [/silvia|s15/, 'nissan silvia s15 presentation drift xe truot jdm trang vang'],
  [/huracan sto|pr101/, 'huracan sto pop race sieu xe'],
  [/gravity/, 'huracan gt gravity tim xam'],
  [/pop race|poprace|^pr/, 'poprace pop race mo nap capo'],
  [/combo|twin pack|box 4 xe|set/, 'combo twin pack cap doi bo doi rexy roxy set nhieu xe'],
  [/bmw|m4/, 'bmw m4 gt3 china gt 90'],
  [/kaido|kh0/, 'kaido house jun imai mo capo jdm'],
  [/imsa|gt3/, 'gt3 imsa suc ben xe dua']
];

// Từ điển chuẩn hóa viết tắt / teencode phổ biến của khách hàng Việt Nam
const SLANG_MAP = {
  k: 'khong',
  ko: 'khong',
  kh: 'khong',
  hok: 'khong',
  hong: 'khong',
  hem: 'khong',
  hum: 'khong',
  kg: 'khong',
  dc: 'duoc',
  dk: 'duoc',
  duok: 'duoc',
  bn: 'bao nhieu',
  bnh: 'bao nhieu',
  bnhiu: 'bao nhieu',
  nhiu: 'nhieu',
  sp: 'san pham',
  ad: 'admin',
  qtv: 'admin',
  nv: 'nhan vien',
  ck: 'chuyen khoan',
  tk: 'tai khoan',
  mk: 'mat khau',
  sdt: 'so dien thoai',
  dt: 'dien thoai',
  fship: 'freeship',
  fs: 'freeship',
  sz: 'kich thuoc',
  ib: 'nhan tin',
  inbox: 'nhan tin',
  km: 'khuyen mai',
  ik: 'di',
  j: 'gi',
  z: 'vay',
  zay: 'vay',
  vs: 'so sanh',
  ord: 'order',
  pre: 'preorder'
};

function normalize(str) {
  return String(str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9.,\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(str) {
  return normalize(str).replace(/[/-]/g, ' ').replace(/\s+/g, ' ').trim();
}

let vocabInitialized = false;

function buildSiteVocabulary(products = []) {
  const words = [
    // Hãng & dòng xe diecast 1:64
    'mini', 'gt', 'minigt', 'tsm', 'pop', 'race', 'poprace', 'kaido', 'house', 'jun', 'imai',
    'lbwk', 'liberty', 'walk', 'widebody', 'silhouette', 'super', 'f1', 'formula', 'grand', 'prix',
    'imsa', 'gt3', 'porsche', 'rexy', 'roxy', 'skeleton', 'ao', 'racing', 'red', 'bull', 'verstappen',
    'alonso', 'stroll', 'aston', 'martin', 'amr24', 'rb18', 'rb19', 'supra', 'skyline', 'silvia',
    'lamborghini', 'huracan', 'sterrato', 'sto', 'bmw', 'm4', 'diecast', 'die-cast', 'chase',
    // Tác giả & trường
    'thinh', 'nam', 'do', 'quoc', 'nguyen', 'dinh', 'lac', 'hong', 'lhu',
    // Tính năng & chính sách
    'box', 'card', 'blister', 'saver', 'protector', 'vietqr', 'payos', 'spx', 'express',
    'cod', 'preorder', 'voucher', 'coupon', 'freeship', 'showroom', 'bien', 'hoa', 'dong', 'nai'
  ];

  if (Array.isArray(products)) {
    for (const p of products) {
      if (p.Sku) words.push(String(p.Sku).toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (p.Brand) words.push(...String(p.Brand).toLowerCase().split(/\s+/));
      if (p.Name) words.push(...cleanText(p.Name).split(/\s+/));
      if (p.CategoryName) words.push(...cleanText(p.CategoryName).split(/\s+/));
    }
  }

  try {
    for (const phrase of allKeyPhrases()) {
      words.push(...phrase.split(/\s+/));
    }
  } catch (_) {}

  setVocabulary(words);
  vocabInitialized = true;
}

function ensureVocabulary() {
  if (!vocabInitialized) {
    buildSiteVocabulary(cachedProducts);
  }
}

function expandSlang(text) {
  if (!text) return '';
  // Giữ tương thích ngược: dùng bộ chuẩn hóa tiếng Việt v6 theo ngữ cảnh
  ensureVocabulary();
  return normalizeVietnamese(text);
}

function stripHtmlCompact(str, maxLen = 190) {
  const clean = String(str || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 1).trim() + '…';
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasAny(text, phrases) {
  return phrases.some(ph => new RegExp(`(?:^|\\s)${escapeRe(ph)}(?=\\s|$)`).test(text));
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

function formatVnd(n) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(Number(n) || 0)) + 'đ';
}

const roundK = (n) => Math.round((Number(n) || 0) / 1000) * 1000;

function buildIndex(p) {
  const base = cleanText(`${p.Sku} ${p.CarNumber || ''} ${p.Name} ${p.Brand || ''} ${p.CategoryName || ''} ${p.EditionNote || ''}`).replace(/[.,]/g, ' ');
  const descForTags = cleanText(p.Description || '');
  let tags = '';
  for (const [re, add] of TAG_RULES) if (re.test(base) || re.test(descForTags)) tags += ' ' + add;
  const text = `${base} ${tags}`.replace(/\s+/g, ' ').trim();
  const skuKey = String(p.Sku || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const tokens = new Set(text.split(' ').filter(t => t.length >= 2));
  return {
    text,
    tokens,
    skuKey,
    skuDigits: skuKey.replace(/[^0-9]/g, '').replace(/^0+/, '')
  };
}

function syncShopWithSettings(cfg) {
  if (!cfg || typeof cfg !== 'object') return;
  if (cfg.store_name) SHOP.name = String(cfg.store_name).trim();
  if (cfg.store_address) SHOP.address = String(cfg.store_address).trim();
  if (cfg.store_email) SHOP.email = String(cfg.store_email).trim();
  if (cfg.store_hotline) SHOP.storeHotline = String(cfg.store_hotline).trim();
  if (cfg.shipping_fee !== undefined && cfg.shipping_fee !== null && !Number.isNaN(Number(cfg.shipping_fee))) {
    SHOP.shippingFee = Math.max(0, Number(cfg.shipping_fee));
  }
  if (cfg.free_shipping_threshold !== undefined && cfg.free_shipping_threshold !== null && !Number.isNaN(Number(cfg.free_shipping_threshold))) {
    SHOP.freeShipThreshold = Math.max(0, Number(cfg.free_shipping_threshold));
  }
  if (cfg.deposit_rate !== undefined && cfg.deposit_rate !== null && Number(cfg.deposit_rate) > 0 && Number(cfg.deposit_rate) <= 1) {
    SHOP.depositRate = Number(cfg.deposit_rate);
  }
  if (cfg.preorder_deadline) SHOP.preorderDeadline = String(cfg.preorder_deadline).trim();
  if (cfg.bank_name) SHOP.bankName = String(cfg.bank_name).trim();
  if (cfg.bank_account_no) SHOP.bankAccountNo = String(cfg.bank_account_no).trim();
  if (cfg.bank_account_name) SHOP.bankAccountName = String(cfg.bank_account_name).trim();
}

async function getStoreData(force = false) {
  const now = Date.now();
  if (!force && cachedProducts.length && (now - lastFetch) < CACHE_TTL_MS) {
    if ((now - lastFingerprintCheckAt) < FINGERPRINT_CHECK_THROTTLE_MS && lastCatalogFingerprint) {
      return { products: cachedProducts, coupons: cachedCoupons, shop: SHOP };
    }
    lastFingerprintCheckAt = now;
    const liveFp = await queryLiveCatalogFingerprint();
    if (liveFp && liveFp === lastCatalogFingerprint) {
      return { products: cachedProducts, coupons: cachedCoupons, shop: SHOP };
    }
  }
  try {
    const [prodRes, allCoupons, liveSettings] = await Promise.all([
      db.query(`
        SELECT p.ProductId, p.Sku, p.CarNumber, p.Name, p.Brand, p.Scale, p.CategoryId,
               p.Price, p.OldPrice, p.PriceBox, p.PriceCard, p.DiscountPercent, p.PackagingType,
               p.DepositAmount, p.DepositPercent, p.ImageUrl,
               p.Status, p.Stock, p.StockBox, p.StockCard, c.Name AS CategoryName,
               p.ExpectedDelivery, p.EditionNote, p.Description, p.IsFeatured, p.IsNew,
               COALESCE((
                 SELECT SUM(oi.Quantity)::int
                 FROM OrderItems oi
                 JOIN Orders o ON o.OrderId = oi.OrderId
                 WHERE oi.ProductId = p.ProductId
                   AND UPPER(COALESCE(o.Status, '')) <> 'CANCELLED'
               ), 0) AS SoldCount
        FROM Products p
        LEFT JOIN Categories c ON p.CategoryId = c.CategoryId
        WHERE p.IsActive = TRUE
        ORDER BY p.ProductId ASC
      `),
      couponService.listAdminCoupons().catch(() => []),
      settingsService.getAll(force).catch(() => null)
    ]);

    if (liveSettings) {
      syncShopWithSettings(liveSettings);
    }

    const nextInvMap = new Map();
    cachedProducts = (prodRes.recordset || []).map((r, idx) => {
      const packagingType = String(r.PackagingType ?? r.packagingtype ?? 'both').toLowerCase();
      const rawPrice = Number(r.Price ?? r.price ?? 0);
      const rawOldPrice = Number(r.OldPrice ?? r.oldprice ?? 0);
      const discountPercent = Math.min(80, Math.max(0, Number(r.DiscountPercent ?? r.discountpercent ?? 0)));

      const rawBox = Number(r.PriceBox ?? r.pricebox ?? 0);
      const rawCard = Number(r.PriceCard ?? r.pricecard ?? 0);

      const baseBox = rawBox > 0 ? rawBox : (rawOldPrice > rawPrice ? rawOldPrice : rawPrice);
      const baseCard = rawCard > 0 ? rawCard : (packagingType === 'box_only' ? baseBox : baseBox + 60000);

      const finalBox = discountPercent > 0 ? calcDiscountedPrice(baseBox, discountPercent) : (rawPrice > 0 && packagingType !== 'card_only' ? rawPrice : baseBox);
      const finalCard = discountPercent > 0 ? calcDiscountedPrice(baseCard, discountPercent) : baseCard;

      const rawStock = Number(r.Stock ?? r.stock ?? 0);
      const sbRaw = r.StockBox ?? r.stockbox;
      const scRaw = r.StockCard ?? r.stockcard;
      let stockBox = sbRaw != null ? Math.max(0, Number(sbRaw)) : (packagingType === 'card_only' ? 0 : Math.ceil(rawStock / 2));
      let stockCard = scRaw != null ? Math.max(0, Number(scRaw)) : (packagingType === 'box_only' ? 0 : Math.floor(rawStock / 2));
      if (packagingType === 'box_only') stockCard = 0;
      if (packagingType === 'card_only') stockBox = 0;

      const depPctRaw = Number(r.DepositPercent ?? r.depositpercent ?? 0);
      const depositPercent = depPctRaw > 0 ? depPctRaw : Math.round(SHOP.depositRate * 100);
      const depAmtRaw = Number(r.DepositAmount ?? r.depositamount ?? 0);

      const p = {
        ProductId: Number(r.ProductId ?? r.productid),
        CategoryId: Number(r.CategoryId ?? r.categoryid ?? 0),
        Sku: String(r.Sku ?? r.sku ?? '').trim(),
        CarNumber: String(r.CarNumber ?? r.carnumber ?? '').trim(),
        Name: String(r.Name ?? r.name ?? '').trim(),
        Brand: String(r.Brand ?? r.brand ?? 'MINI GT').trim(),
        Scale: String(r.Scale ?? r.scale ?? '1:64').trim(),
        PackagingType: packagingType,
        BasePriceBox: baseBox,
        BasePriceCard: baseCard,
        PriceBox: finalBox,
        PriceCard: finalCard,
        OldPrice: rawOldPrice,
        DiscountPercent: discountPercent,
        HasDiscount: discountPercent > 0 || (rawOldPrice > finalBox && rawOldPrice > 0),
        DepositPercent: depositPercent,
        DepositAmount: depAmtRaw > 0 ? depAmtRaw : 0,
        Status: String(r.Status ?? r.status ?? 'in_stock').toLowerCase(),
        Stock: stockBox + stockCard,
        StockBox: stockBox,
        StockCard: stockCard,
        ImageUrl: String(r.ImageUrl ?? r.imageurl ?? 'image/hero-banner.jpg').trim() || 'image/hero-banner.jpg',
        CategoryName: String(r.CategoryName ?? r.categoryname ?? 'Mô hình 1:64').trim(),
        ExpectedDelivery: r.ExpectedDelivery ?? r.expecteddelivery ?? SHOP.preorderDeadline,
        EditionNote: stripHtmlCompact(r.EditionNote ?? r.editionnote ?? '', 120),
        Description: stripHtmlCompact(r.Description ?? r.description ?? '', 190),
        IsFeatured: Boolean(r.IsFeatured ?? r.isfeatured),
        IsNew: Boolean(r.IsNew ?? r.isnew),
        SoldCount: Number(r.SoldCount ?? r.soldcount ?? 0)
      };
      p._idx = buildIndex(p);
      for (const tok of p._idx.tokens) {
        let bucket = nextInvMap.get(tok);
        if (!bucket) {
          bucket = [];
          nextInvMap.set(tok, bucket);
        }
        bucket.push(idx);
      }
      return p;
    });

    invertedTokenMap = nextInvMap;

    const todayMs = new Date().setHours(0, 0, 0, 0);
    cachedCoupons = (allCoupons || [])
      .filter(c => {
        if (!c || !c.isActive) return false;
        if (c.usageLimit && Number(c.usedCount || 0) >= Number(c.usageLimit)) return false;
        if (c.endDate) {
          const endMs = new Date(`${c.endDate}T23:59:59`).getTime();
          if (!Number.isNaN(endMs) && endMs < todayMs) return false;
        }
        return true;
      })
      .map(c => ({
        code: String(c.code || '').toUpperCase().trim(),
        description: c.description || '',
        discountType: String(c.discountType || 'amount').toLowerCase(),
        discountValue: Number(c.discountValue) || 0,
        minOrderAmount: Number(c.minOrderAmount) || 0,
        maxDiscount: Number(c.maxDiscount) || 0
      }));

    lastCatalogFingerprint = (await queryLiveCatalogFingerprint()) || `${cachedProducts.length}:${now}`;
    lastFingerprintCheckAt = Date.now();
    lastFetch = lastFingerprintCheckAt;
    buildSiteVocabulary(cachedProducts);
  } catch (err) {
    console.warn('[AI CHAT v5] Không tải được dữ liệu cửa hàng:', err.message);
  }
  return { products: cachedProducts, coupons: cachedCoupons, shop: SHOP };
}

function toLiveCardPayload(p) {
  if (!p) return null;
  return {
    id: p.ProductId,
    productId: p.ProductId,
    ProductId: p.ProductId,
    categoryId: p.CategoryId,
    CategoryId: p.CategoryId,
    sku: p.Sku,
    Sku: p.Sku,
    carNumber: p.CarNumber,
    name: p.Name,
    Name: p.Name,
    brand: p.Brand,
    scale: p.Scale,
    packagingType: p.PackagingType,
    price: p.PackagingType === 'card_only' ? p.PriceCard : p.PriceBox,
    priceBox: p.BasePriceBox,
    priceCard: p.BasePriceCard,
    basePriceBox: p.BasePriceBox,
    basePriceCard: p.BasePriceCard,
    finalPriceBox: p.PriceBox,
    finalPriceCard: p.PriceCard,
    oldPrice: p.DiscountPercent > 0 ? (p.PackagingType === 'card_only' ? p.BasePriceCard : p.BasePriceBox) : p.OldPrice,
    discountPercent: p.DiscountPercent,
    hasDiscount: p.HasDiscount,
    depositPercent: p.DepositPercent,
    depositAmount: p.DepositAmount,
    status: p.Status,
    stock: p.StockBox + p.StockCard,
    stockBox: p.StockBox,
    stockCard: p.StockCard,
    imageUrl: p.ImageUrl || 'image/hero-banner.jpg',
    categoryName: p.CategoryName,
    soldCount: p.SoldCount || 0
  };
}

function extractSkusFromText(text) {
  if (!text) return [];
  const raw = [...String(text).matchAll(/\[([A-Z0-9][A-Z0-9\-_]{1,22})\]/gi)].map(m => m[1].toUpperCase());
  const out = [];
  for (const s of raw) {
    if (s === 'ESCALATE' || s === 'SKU') continue;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

function resolveProductCardsBySkus(skus = []) {
  if (!Array.isArray(skus) || !skus.length || !cachedProducts.length) return [];
  const bySku = new Map(cachedProducts.map(p => [String(p.Sku || '').toUpperCase(), p]));
  const cards = [];
  const seen = new Set();
  for (const rawSku of skus) {
    const key = String(rawSku || '').trim().toUpperCase();
    if (!key || seen.has(key)) continue;
    const prod = bySku.get(key);
    if (prod) {
      seen.add(key);
      cards.push(toLiveCardPayload(prod));
    }
  }
  return cards;
}

function detectRegionEtaFromAddress(address) {
  const norm = cleanText(address || '');
  if (!norm) return null;
  if (/(ha noi|hai phong|quang ninh|bac ninh|bac giang|hai duong|hung yen|vinh phuc|thai nguyen|nam dinh|thai binh|ninh binh|phu tho|lao cai|yen bai|son la|dien bien|lai chau|hoa binh|lang son|cao bang|bac kan|ha giang|tuyen quang)/.test(norm)) {
    return { region: 'Miền Bắc', days: '3 – 4 ngày' };
  }
  if (/(da nang|thua thien|hue|thanh hoa|nghe an|ha tinh|quang binh|quang tri|quang nam|quang ngai|binh dinh|quy nhon|phu yen|khanh hoa|nha trang|ninh thuan|binh thuan|phan thiet|kon tum|gia lai|pleiku|dak lak|buon ma thuot|dak nong|lam dong|da lat)/.test(norm)) {
    return { region: 'Miền Trung / Tây Nguyên', days: '2 – 3 ngày' };
  }
  if (/(dong nai|bien hoa|ho chi minh|tphcm|tp hcm|sai gon|binh duong|ba ria|vung tau|tay ninh|binh phuoc|long an|tien giang|ben tre|vinh long|tra vinh|dong thap|an giang|kien giang|can tho|hau giang|soc trang|bac lieu|ca mau)/.test(norm)) {
    return { region: 'Miền Nam', days: '1 – 2 ngày' };
  }
  return null;
}

function computeVipTierFromSpend(totalSpent = 0) {
  const spent = Math.max(0, Number(totalSpent) || 0);
  if (spent > 5000000) {
    return { level: 5, name: 'VIP 5 — Kim Cương', couponCode: 'VIP5', discountPercent: 10, maxDiscount: 300000, canCod: true, nextName: null, needed: 0 };
  }
  if (spent >= 1000000) {
    return { level: 4, name: 'VIP 4 — Bạch Kim', couponCode: 'VIP4', discountPercent: 7, maxDiscount: 150000, canCod: true, nextName: 'VIP 5 — Kim Cương', needed: 5000001 - spent };
  }
  if (spent > 500000) {
    return { level: 3, name: 'VIP 3 — Collector Vàng', couponCode: 'VIP3', discountPercent: 4, maxDiscount: 100000, canCod: false, nextName: 'VIP 4 — Bạch Kim (mở khóa Ship COD)', needed: 1000000 - spent };
  }
  if (spent > 200000) {
    return { level: 2, name: 'VIP 2 — Collector Bạc', couponCode: 'VIP2', discountPercent: 2, maxDiscount: 50000, canCod: false, nextName: 'VIP 3 — Collector Vàng', needed: 500001 - spent };
  }
  return { level: 1, name: 'VIP 1 — Tân Thủ 1:64', couponCode: null, discountPercent: 0, maxDiscount: 0, canCod: false, nextName: 'VIP 2 — Collector Bạc', needed: 200001 - spent };
}

async function getLoggedInAccountContext(opts = {}) {
  const uid = opts && opts.userId && Number.isFinite(Number(opts.userId)) && Number(opts.userId) > 0 ? Number(opts.userId) : null;
  const email = opts && opts.customerEmail ? String(opts.customerEmail).trim().toLowerCase() : '';
  const rawPhone = opts && opts.customerPhone ? String(opts.customerPhone).replace(/[\s.\-()]/g, '') : '';
  const phone = rawPhone ? (rawPhone.startsWith('+84') ? '0' + rawPhone.slice(3) : rawPhone) : '';

  if (!uid && !email && !phone) {
    return { isLoggedIn: false, userId: null, orders: [], totalSpent: 0, vip: computeVipTierFromSpend(0), cartItems: [], wishlistIds: [] };
  }

  try {
    let userRow = null;
    if (uid) {
      const uRes = await db.query('SELECT UserId, FullName, Email, Phone, CartData, WishlistData FROM Users WHERE UserId = @uid LIMIT 1', { uid });
      userRow = uRes.recordset?.[0] || null;
    }
    const effEmail = email || String(userRow?.Email || userRow?.email || '').trim().toLowerCase();
    const uPhoneRaw = String(userRow?.Phone || userRow?.phone || '').replace(/[\s.\-()]/g, '');
    const effPhone = phone || (uPhoneRaw ? (uPhoneRaw.startsWith('+84') ? '0' + uPhoneRaw.slice(3) : uPhoneRaw) : '');

    const conds = [];
    const params = {};
    if (uid) {
      conds.push('o.UserId = @uid');
      params.uid = uid;
    }
    if (effEmail) {
      conds.push('LOWER(COALESCE(o.Email, \'\')) = @em');
      params.em = effEmail;
    }
    if (effPhone && effPhone.length >= 9) {
      conds.push("REPLACE(REPLACE(REPLACE(COALESCE(o.Phone, ''), ' ', ''), '-', ''), '.', '') = @ph");
      params.ph = effPhone;
    }

    let orders = [];
    let totalSpent = 0;
    if (conds.length > 0) {
      const whereClause = conds.join(' OR ');
      const [ordRes, spentRes] = await Promise.all([
        db.query(`
          SELECT o.OrderId, o.OrderCode, o.Status, o.PaymentMethod, o.PaymentStatus,
                 o.Subtotal, o.ShippingFee, o.ShippingMethod, o.Total, o.DepositAmount,
                 o.FullName, o.Phone, o.Email, o.Address, o.Note,
                 o.TrackingCode, o.TrackingCarrier, o.HasPreOrder, o.PreOrderExpected, o.PreOrderNotified,
                 o.CancelReason, o.CreatedAt, o.UpdatedAt,
                 (SELECT STRING_AGG(oi.Quantity::text || 'x ' || oi.ProductName || ' (' || UPPER(COALESCE(oi.PackagingOption, 'box')) || ')', ', ')
                  FROM OrderItems oi WHERE oi.OrderId = o.OrderId) AS ItemsSummary
          FROM Orders o
          WHERE (${whereClause})
          ORDER BY o.OrderId DESC
          LIMIT 5
        `, params),
        db.query(`
          SELECT COALESCE(SUM(o.Total), 0)::bigint AS spent
          FROM Orders o
          WHERE (${whereClause}) AND UPPER(COALESCE(o.Status, '')) = 'DELIVERED'
        `, params)
      ]);
      orders = ordRes.recordset || [];
      totalSpent = Number(spentRes.recordset?.[0]?.spent || 0);
    }

    let cartItems = [];
    let wishlistIds = [];
    const rawCart = userRow?.CartData ?? userRow?.cartdata;
    if (rawCart) {
      const parsedCart = typeof rawCart === 'string' ? JSON.parse(rawCart) : rawCart;
      if (Array.isArray(parsedCart)) cartItems = parsedCart;
    }
    const rawWish = userRow?.WishlistData ?? userRow?.wishlistdata;
    if (rawWish) {
      const parsedWish = typeof rawWish === 'string' ? JSON.parse(rawWish) : rawWish;
      if (Array.isArray(parsedWish)) wishlistIds = parsedWish;
    }

    return {
      isLoggedIn: Boolean(uid || effEmail),
      userId: uid,
      fullName: userRow?.FullName || userRow?.fullname || opts.customerName || '',
      email: effEmail,
      phone: effPhone,
      orders,
      totalSpent,
      vip: computeVipTierFromSpend(totalSpent),
      cartItems,
      wishlistIds
    };
  } catch (err) {
    console.warn('[AI Chat getLoggedInAccountContext Error]:', err.message);
    return { isLoggedIn: Boolean(uid || email), userId: uid, orders: [], totalSpent: 0, vip: computeVipTierFromSpend(0), cartItems: [], wishlistIds: [] };
  }
}

const ORDER_LOOKUP_SELECT_SQL = `
  SELECT o.OrderId, o.OrderCode, o.Status, o.PaymentMethod, o.PaymentStatus,
         o.Subtotal, o.ShippingFee, o.ShippingMethod, o.Total, o.DepositAmount,
         o.FullName, o.Phone, o.Email, o.Address, o.Note,
         o.TrackingCode, o.TrackingCarrier, o.HasPreOrder, o.PreOrderExpected, o.PreOrderNotified,
         o.CancelReason, o.CreatedAt, o.UpdatedAt,
         (SELECT STRING_AGG(oi.Quantity::text || 'x ' || oi.ProductName || ' (' || UPPER(COALESCE(oi.PackagingOption, 'box')) || ')', ', ')
          FROM OrderItems oi WHERE oi.OrderId = o.OrderId) AS ItemsSummary
  FROM Orders o
`;

function extractOrderCodeFromText(rawText, products = []) {
  const s = String(rawText || '');
  // Ưu tiên khớp chuẩn mã đơn: MGT-20261107-1234, #MGT-20261107-1234, MGT 20261107 1234, MGT202611071234, ORD-..., DH-...
  const datedMgt = s.match(/(?:^|[\s#(\["'«])(?:MGT)[\s\-_]?(20\d{6})[\s\-_]?([A-Z0-9]{2,10})(?=$|[\s)\]"'».,!?;:])/i);
  if (datedMgt) {
    return `MGT-${datedMgt[1]}-${datedMgt[2]}`.toUpperCase();
  }
  const codeMatch = s.match(/(?:^|[\s#(\["'«])((?:MGT[-_][A-Z0-9\-_]{3,24})|(?:(?:ORD|DH)[-_]?[A-Z0-9\-_]{4,24}))(?=$|[\s)\]"'».,!?;:])/i);
  if (!codeMatch) return null;
  const code = codeMatch[1].toUpperCase().replace(/_/g, '-');
  const isProductSku = Array.isArray(products) && products.some(
    p => String(p.Sku || '').toUpperCase() === code || String(p.Sku || '').replace(/[-_]/g, '').toUpperCase() === code.replace(/[-_]/g, '')
  );
  return isProductSku ? null : code;
}

function getContextOrderCodeFromHistory(history = [], products = []) {
  if (!Array.isArray(history) || !history.length) return null;
  const recent = history.slice(-10);
  for (let i = recent.length - 1; i >= 0; i--) {
    const msg = recent[i] && (recent[i].message || recent[i].content || '');
    const code = extractOrderCodeFromText(msg, products);
    if (code) return code;
  }
  return null;
}

function isOrderFollowUpQuestion(ctx, products = []) {
  if (!ctx || !ctx.text) return false;
  const t = ctx.text;
  const I = ctx.intents || {};
  // Không can thiệp nếu khách đang hỏi danh sách xe mới hoặc hỏi đích danh 1 mẫu xe khác trong kho
  if (I.saleList || I.cheapest || I.expensive || I.bestSeller || I.newArrival || I.instockList || I.creatorAsk || I.botIdentity) {
    return false;
  }
  if (Array.isArray(products) && products.length && searchProducts(ctx.searchText, products).length > 0 && !/(don nay|don do|kien nay|trong don)/.test(t)) {
    return false;
  }
  return /(don nay|don do|don tren|don vua|kien nay|kien hang nay|ma don nay|khi nhan xe|khi nhan hang|nhan xe tra|nhan hang tra|tra cho shipper|tra cho buu ta|con phai tra|con lai bao nhieu|can thanh toan bao nhieu|sao tien coc|tinh coc|tien coc tinh|phi ship don|tien ship bao nhieu|bao lau giao|bao lau toi|bao lau nhan|khi nao giao|khi nao toi|khi nao nhan|may ngay toi|may ngay nhan|tien trinh|tien do|toi dau roi|den dau roi|ma van don|doi dia chi|sua dia chi|doi so dien thoai|sua so dien thoai|huy don)/.test(t);
}

// Tra cứu đơn hàng thông minh theo Mã đơn (MGT-... / ORD-... / DH-...) HOẶC theo SĐT HOẶC theo Bộ nhớ hội thoại
// Tuyệt đối không nhầm với mã SKU sản phẩm (MGT01093, MGTS0026, PR64-0102...)
async function lookupOrderSmart(rawText, hasOrderIntent = false, products = [], history = [], ctx = null) {
  const explicitCode = extractOrderCodeFromText(rawText, products);
  if (explicitCode) {
    try {
      const res = await db.query(`
        ${ORDER_LOOKUP_SELECT_SQL}
        WHERE UPPER(o.OrderCode) = @code
        LIMIT 1
      `, { code: explicitCode });
      if (res.recordset && res.recordset.length > 0) {
        return { mode: 'code', found: true, orders: [res.recordset[0]], query: explicitCode };
      }
      return { mode: 'code', found: false, orders: [], query: explicitCode };
    } catch (err) {
      console.warn('[AI Chat lookupOrderSmart by code Error]:', err.message);
      return null;
    }
  }

  if (hasOrderIntent) {
    const cleanDigits = String(rawText || '').replace(/[\s.\-()]/g, '');
    const phoneMatch = cleanDigits.match(/(?:\+?84|0)(3|5|7|8|9)\d{8}\b/);
    if (phoneMatch) {
      const normPhone = '0' + phoneMatch[0].replace(/^(?:\+?84|0)/, '');
      try {
        const res = await db.query(`
          ${ORDER_LOOKUP_SELECT_SQL}
          WHERE REPLACE(REPLACE(REPLACE(COALESCE(o.Phone, ''), ' ', ''), '-', ''), '.', '') = @ph
          ORDER BY o.OrderId DESC
          LIMIT 3
        `, { ph: normPhone });
        return {
          mode: 'phone',
          found: Boolean(res.recordset && res.recordset.length > 0),
          orders: res.recordset || [],
          query: normPhone
        };
      } catch (err) {
        console.warn('[AI Chat lookupOrderSmart by phone Error]:', err.message);
        return null;
      }
    }
  }

  // Tra cứu nối tiếp theo bộ nhớ hội thoại khi khách vừa hỏi 1 đơn #MGT-... trước đó
  if (ctx && isOrderFollowUpQuestion(ctx, products)) {
    const contextCode = getContextOrderCodeFromHistory(history, products);
    if (contextCode) {
      try {
        const res = await db.query(`
          ${ORDER_LOOKUP_SELECT_SQL}
          WHERE UPPER(o.OrderCode) = @code
          LIMIT 1
        `, { code: contextCode });
        if (res.recordset && res.recordset.length > 0) {
          return { mode: 'followup', found: true, orders: [res.recordset[0]], query: contextCode };
        }
      } catch (err) {
        console.warn('[AI Chat lookupOrderSmart followup Error]:', err.message);
      }
    }
  }

  return null;
}

// =====================================================================
// 2. PHÂN TÍCH TIỀN TỆ, SỐ LƯỢNG, TEENCODE & Ý ĐỊNH ĐA TẦNG
// =====================================================================
const NUM = '(\\d+(?:[.,]\\d+)*)';
const UNIT = '(trieu|tr|cu|k|nghin|ngan|vnd|dong|d)';
const PRICE_UNIT_RE = new RegExp(`${NUM}\\s*${UNIT}(?![a-z])`, 'g');

function toVnd(numStr, unit) {
  const s = String(numStr || '');
  const u = String(unit || '');
  let n;
  if (/^(trieu|tr|cu)$/.test(u)) n = parseFloat(s.replace(',', '.')) * 1e6;
  else if (/^(k|nghin|ngan)$/.test(u)) n = parseFloat(s.replace(',', '.')) * 1e3;
  else {
    n = parseInt(s.replace(/[.,]/g, ''), 10);
    if (n < 10000) n *= 1000;
  }
  return Number.isFinite(n) ? Math.round(n) : null;
}

function parsePriceRange(text) {
  const opt = `${NUM}\\s*${UNIT}?(?![a-z0-9])`;
  const valid = (v) => v && v >= 50000 && v <= 100000000;
  let m = text.match(new RegExp(`(?:tu|khoang tu|tam tu)\\s*${opt}\\s*(?:den|toi|~|-)\\s*${opt}`));
  if (m) {
    const a = toVnd(m[1], m[2] || m[4]);
    const b = toVnd(m[3], m[4] || m[2]);
    if (valid(a) && valid(b)) return { min: Math.min(a, b), max: Math.max(a, b), exactBudget: null };
  }
  m = text.match(new RegExp(`(?:duoi|nho hon|it hon|khong qua|toi da|re hon|be hon|quay dau)\\s*${opt}`));
  if (m) {
    const v = toVnd(m[1], m[2]);
    if (valid(v) && (m[2] || parseInt(m[1], 10) >= 100)) return { min: 0, max: v, exactBudget: v };
  }
  m = text.match(new RegExp(`(?:tren|lon hon|nhieu hon|it nhat|toi thieu|tu)\\s*${opt}\\s*(?:tro len)?`));
  if (m && !/den|toi/.test(text)) {
    const v = toVnd(m[1], m[2]);
    if (valid(v) && /(tren|lon hon|it nhat|toi thieu|tro len)/.test(m[0])) return { min: v, max: Infinity, exactBudget: null };
  }
  m = text.match(new RegExp(`(?:co|cam|ngan sach|budget|tam|khoang|tam gia|co khoang|voi)\\s*${opt}`));
  if (m && (m[2] || parseInt(m[1], 10) >= 150)) {
    const v = toVnd(m[1], m[2]);
    if (valid(v)) return { min: roundK(v * 0.75), max: roundK(v * 1.12), exactBudget: v };
  }
  return null;
}

function describeRange(r) {
  if (!r) return '';
  if (r.min <= 0) return `dưới ${formatVnd(r.max)}`;
  if (r.max === Infinity) return `trên ${formatVnd(r.min)}`;
  return `từ ${formatVnd(r.min)} đến ${formatVnd(r.max)}`;
}

const WORD_NUM = { mot: 1, hai: 2, ba: 3, bon: 4, tu: 4, nam: 5, sau: 6, bay: 7, tam: 8, chin: 9, muoi: 10 };
const QTY_UNITS = '(chiec|con|cai|hop|vi|bo|xe|mau|ban|em|suat|slot)';

function parseQuantity(text) {
  let m = text.match(new RegExp(`(?:^|\\s)(\\d{1,3})\\s*${QTY_UNITS}(?![a-z])`));
  if (m) return parseInt(m[1], 10) || null;
  m = text.match(new RegExp(`(?:^|\\s)(mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi)\\s+${QTY_UNITS}(?![a-z])`));
  if (m) return WORD_NUM[m[1]];
  return null;
}

const P = {
  greet: ['hi', 'hello', 'helo', 'hey', 'chao', 'xin chao', 'alo', 'shop oi', 'be bot', 'bot oi', 'chao shop', 'chao ban', 'chao em', 'quay lai chat', 'chat lai', 'chat voi bot', 'noi chuyen voi bot', 'tro lai chat', 'good morning', 'good evening'],
  botIdentity: ['ban ten gi', 'em ten gi', 'ten la gi', 'ban la ai', 'em la ai', 'may la ai', 'ai dang chat', 'ai dang tra loi', 'gioi thieu ban than', 'ban la robot', 'ban la bot', 'ban la ai vay', 'ten cua ban', 'ten gi the', 'ten gi vay'],
  botCapability: ['ban lam duoc gi', 'em lam duoc gi', 'biet lam gi', 'giup gi duoc', 'co tac dung gi', 'chuc nang cua ban', 'hoi gi duoc', 'tu van gi'],
  smallTalk: ['khoe khong', 'hom nay the nao', 'an com chua', 'may tuoi', 'bao nhieu tuoi', 'thong minh qua', 'gioi qua', 'de thuong qua', 'cute qua', 'dang yeu qua', 'hay qua', 'xin qua bot'],
  ackPraise: ['ok', 'oke', 'okay', 'okie', 'da', 'vang', 'uh', 'uhm', 'duoc do', 'dep qua', 'dep ghe', 'chat qua', 'ngon', 'ung qua', 'thich qua', 'tuyet voi'],
  thanks: ['cam on', 'thanks', 'thank', 'tks', 'thank you', 'cam on nhe', 'ok cam on', 'cam on shop', 'cam on em', 'cam on bot'],
  bye: ['tam biet', 'bye', 'goodbye', 'hen gap lai', 'bai bai', 'bb', 'ngu ngon'],

  // Nhà sáng tạo web Thịnh & Nam
  creatorAsk: [
    'ai tao', 'ai lam ra', 'ai lam web', 'ai sang tao', 'ai thiet ke', 'ai code', 'ai lap trinh',
    'ai xay dung', 'ai phat trien', 'nguoi tao', 'nguoi lam', 'tac gia', 'nha sang tao', 'nha phat trien',
    'chu web', 'chu trang web', 'chu shop la ai', 'admin ten gi', 'admin la ai', 'quan tri vien la ai',
    'nhom nao lam', 'ai dung sau', 'do an cua ai', 'web nay cua ai', 'trang nay ai lam', 'web do ai',
    'do quoc thinh', 'nguyen dinh nam', 'quoc thinh', 'dinh nam', 'dai hoc lac hong', 'lac hong', 'lhu'
  ],
  moreInfo: [
    'thong tin them', 'ke them', 'hoi them', 'chi tiet hon', 'biet them', 'noi them', 'con gi nua',
    'gioi thieu them', 'ro hon', 'cu the hon', 'hoc truong nao', 'truong gi', 'nganh gi', 'vai tro',
    'lam phan nao', 'ai lam gi', 'cong nghe gi', 'ngon ngu gi', 'viet bang gi', 'lien he voi'
  ],

  // Ý định mua sắm & sản phẩm
  price: ['gia', 'bao nhieu', 'nhieu tien', 'bao tien', 'gia ca', 'may tien', 'gia sao', 'ro gia'],
  stock: ['con hang', 'con khong', 'het hang', 'con bao nhieu', 'ton kho', 'con may', 'con nua', 'san khong', 'co san khong', 'con chiec nao'],
  deposit: ['coc', 'tien coc', 'dat coc', 'coc truoc', 'giu suat', 'giu slot'],
  eta: ['khi nao ve', 'bao gio ve', 'ngay ve', 'du kien', 'khi nao co', 'bao gio co', 'thang may ve', 'hang ve chua'],
  total: ['tong', 'tinh tien', 'het bao nhieu', 'tong cong', 'tong tien', 'tat ca bao nhieu', 'thanh toan bao nhieu', 'lan banh', 'ca ship'],
  compare: ['so sanh', 'nen chon', 'khac gi nhau', 'mau nao dep hon', 'chon mau nao', 'hay la', 'hon nhau'],
  cheapest: ['re nhat', 'gia thap nhat', 'gia mem nhat', 'gia re', 're re', 'binh dan', 'mem nhat', 'it tien nhat'],
  expensive: ['dat nhat', 'cao cap nhat', 'hiem nhat', 'xin nhat', 'gia cao nhat', 'vip nhat', 'mac nhat'],
  saleList: ['dang giam gia', 'xe giam gia', 'mau giam gia', 'dang sale', 'xe sale', 'san sale', 'giam phan tram', 'dang khuyen mai', 'xe khuyen mai'],
  bestSeller: ['ban chay', 'ban chay nhat', 'nhieu nguoi mua', 'duoc mua nhieu', 'ua chuong nhat'],
  newArrival: ['moi ve', 'xe moi', 'mau moi', 'moi nhat', 'hang moi'],
  instockList: ['co san', 'san hang', 'giao ngay', 'hang co san', 'hot nhat', 'tat ca xe', 'toan bo xe', 'shop co xe gi', 'co nhung xe nao', 'danh sach xe', 'san pham co san'],
  preorderWord: ['pre order', 'preorder', 'dat truoc', 'order truoc', 'hang order', 'sap ve'],
  listWord: ['mau nao', 'nhung mau', 'xe nao', 'danh sach', 'list', 'co gi', 'nhung xe', 'cac mau', 'co may mau', 'gom nhung'],
  gift: ['qua', 'tang', 'sinh nhat', 'tang ban', 'tang nguoi yeu', 'moi choi', 'nguoi moi', 'goi y', 'tu van', 'nen mua', 'recommend', 'de xuat', 'chon giup'],
  categories: ['dong xe', 'danh muc', 'nhung dong', 'loai nao', 'thuong hieu', 'co nhung hang nao', 'ban nhung hang nao', 'ban nhung gi', 'ban gi', 'shop chuyen gi'],

  // Kiến thức Die-cast 1:64 & Chính sách
  boxcard: ['ban hop', 'ban vi', 'blister', 'nen mua ban', 'box hay card', 'box voi card', 'box va card', 'card hay box', 'hop va vi', 'hop hay vi', 'phan biet box'],
  materialSpec: ['chat lieu', 'lam bang gi', 'nhua hay sat', 'kim loai', 'hop kim', 'banh cao su', 'lop cao su', 'lan banh', 'chay duoc khong', 'guong chieu hau', 'mo cua', 'mo nap', 'capo', 'ca po', 'dong co', 'chi tiet may'],
  scaleSize: ['dai bao nhieu', 'to co nao', 'kich thuoc', 'kich co', 'bao nhieu cm', 'ty le 1 64 la', 'ti le 1 64 la', '1 64 la sao', 'nho co nao', 'bang ban tay'],
  chaseAsk: ['chase la gi', 'secret chase', 'xe chase', 'ban chase', 'raw metal', 'ti le trung chase', 'san chase'],
  careTip: ['bao quan', 've sinh', 'rom son', 'bay mau', 'hop mica', 'trung bay', 'chong bui', 'oxi hoa'],
  couponAsk: ['ma giam gia', 'voucher', 'coupon', 'khuyen mai', 'uu dai', 'code giam', 'giam gia khong', 'ma uu dai', 'ap ma'],
  vipAsk: ['hang vip', 'thanh vien vip', 'len vip', 'dac quyen vip', 'vip 1', 'vip 2', 'vip 3', 'vip 4', 'vip 5', 'tich luy vip', 'cap vip'],
  warrantyInfo: ['chinh sach bao hanh', 'chinh sach doi tra', 'bao hanh the nao', 'bao hanh sao', 'doi tra sao', 'doi tra the nao', 'co duoc kiem tra hang', 'dong kiem'],
  accountHelp: ['dang ky tai khoan', 'tao tai khoan', 'quen mat khau', 'dang nhap', 'lay lai mat khau', 'hoi vien', 'tich diem'],
  preorderPolicy: ['chinh sach coc', 'quy trinh coc', 'cach coc', 'cach dat coc', 'dat coc the nao', 'dat coc nhu the nao', 'coc nhu the nao', 'pre order la gi', 'chinh sach pre order', 'coc bao nhieu phan tram'],
  shipping: ['ship', 'van chuyen', 'giao hang', 'giao xe', 'gui xe', 'gui hang', 'nhan xe', 'phi giao', 'freeship', 'free ship', 'mien phi ship', 'bao lau nhan', 'bao lau toi', 'may ngay', 'spx', 'dong goi', 'phi ship', 'ship tinh', 'ship cod', 'ha noi', 'mien bac', 'mien trung', 'mien nam', 'sai gon', 'tphcm', 'ngay giao', 'khi nao toi', 'khi nao giao', 'bao lau thi co', 'bao lau thi den', 'bao lau toi noi', 'thoi gian giao'],
  payment: ['thanh toan', 'chuyen khoan', 'qr', 'vietqr', 'cod', 'nhan hang tra tien', 'tien mat', 'tra gop', 'momo', 'payos', 'ngan hang', 'tra tien', 'so tai khoan'],
  address: ['dia chi', 'o dau', 'cho nao', 'showroom', 'cua hang', 'den xem', 'ghe shop', 'ghe xem', 'ban do', 'duong nao', 'chi duong', 'map', 'bien hoa'],
  hours: ['gio mo cua', 'may gio', 'mo cua', 'dong cua', 'gio lam viec', 'chu nhat co mo', 'mo den may gio'],
  contact: ['hotline', 'so dien thoai', 'zalo', 'lien he', 'facebook', 'fanpage', 'so phone', 'gmail', 'email shop'],
  authentic: ['chinh hang', 'hang that', 'fake', 'real', 'auth', 'nguon goc', 'hang gia', 'hang nhai', 'xuat xu', 'ban quyen'],
  howToOrder: ['dat hang', 'cach mua', 'mua nhu the nao', 'dat mua', 'huong dan mua', 'huong dan dat hang', 'cach dat hang', 'mua sao', 'mua the nao', 'order nhu the nao', 'cach dat', 'chot don sao'],
  orderTracking: ['tra cuu don', 'kiem tra don', 'xem don hang', 'theo doi don', 'tra don hang', 'tra ma don', 'tra cuu don hang', 'xem tinh trang don', 'tinh trang don', 'tien trinh don', 'tien trinh giao', 'kiem tra chi tiet don', 'hoi ve don', 've don nay'],
  myOrderAsk: ['don cua toi', 'don hang cua toi', 'don cua minh', 'don hang cua minh', 'don cua em', 'don hang cua em', 'kien hang cua em', 'ma van don', 'don vua dat', 'don moi dat', 'don hang bao lau toi', 'don bao lau toi', 'khi nao nhan duoc', 'bao gio nhan duoc', 'kiem tra don cua toi', 'don toi dau', 'tien trinh cua toi'],
  myCartAsk: ['gio hang cua toi', 'gio cua toi', 'tinh tien gio hang', 'gio hang co gi', 'trong gio co gi', 'gio coc cua toi'],
  followUp: ['mau do', 'mau nay', 'mau tren', 'xe do', 'xe nay', 'chiec do', 'chiec nay', 'con do', 'cai do', 'cai nay', 'em do', 'em nay', 'mau vua roi', 'mau vua noi']
};

const ESC = {
  damage: ['tray', 'xuoc', 'nut kinh', 'be kinh', 'vo kinh', 'gay guong', 'bi gay', 'gay banh', 'mop', 'rach seal', 'bong tem', 'loi son', 'hu hong', 'bi hong', 'bi loi', 'hang loi', 'vo hop', 'mat banh', 'rot banh', 'bi mop', 'cong truc', 'ket banh'],
  receipt: ['nhan', 'nhan duoc', 'vua nhan', 'giao toi', 'da mua', 'mua roi', 'dat roi', 've toi', 'vua ve', 'mo ra', 'khui', 'mo hop', 'cua toi', 'cua minh', 'cua em', 'shop gui', 'gui sai'],
  refund: ['khieu nai', 'tra hang', 'hoan tien', 'hoan coc', 'tra coc', 'lay lai coc', 'huy don', 'huy coc', 'doi hang', 'giao nham', 'sai hang', 'thieu hang', 'giao thieu', 'mat hang'],
  orderIssue: ['gop chung', 'gop don', 'gui chung kien', 'sua don', 'giao tre', 'giao cham', 'chua thay don', 'da chuyen khoan ma', 'chuyen khoan roi ma', 'thanh toan roi ma', 'loi thanh toan', 'khong nhan duoc otp', 'tru tien roi', 'hen gio giao'],
  human: ['gap admin', 'gap chu shop', 'gap quan ly', 'noi chuyen voi nguoi', 'nguoi that', 'nhan vien tu van', 'tu van vien', 'nho admin', 'admin oi', 'anh thinh oi', 'anh nam oi', 'goi lai cho', 'goi cho minh', 'goi cho toi', 'cho gap admin', 'chuyen cho admin', 'ket noi admin', 'lien he admin', 'lien he shop', 'can admin ho tro', 'nho admin ho tro', 'admin xu ly', 'can gap admin', 'lien quan den admin'],
  wholesale: ['mua si', 'gia si', 'lay si', 'nhap si', 'dai ly', 'cong tac vien', 'ctv', 'chiet khau si', 'bot gia', 'fix gia', 'mac ca', 'tra gia'],
  negative: ['lua dao', 'te qua', 'that vong', 'buc minh', 'qua te', 'kem chat luong', 'lam an kieu gi', 'boc phot'],
  customMod: ['do den', 'do mam', 'son lai', 'custom mau', 'dat lam rieng', 'in 3d', 'nhan sua xe', 'thay truc banh']
};

const OTHER_CAR_BRANDS = [
  'hot wheels', 'hotwheels', 'hotwheel', 'tomica', 'majorette', 'tarmac', 'tarmac works', 'inno64', 'inno',
  'autoart', 'bburago', 'maisto', 'greenlight', 'johnny lightning', 'minichamps', 'kyosho', 'spark',
  'bugatti', 'ferrari', 'mclaren', 'mercedes', 'amg', 'audi', 'bentley', 'rolls royce', 'honda', 'civic',
  'mazda', 'rx7', 'mitsubishi', 'evo', 'subaru', 'ford', 'mustang', 'chevrolet', 'corvette', 'camaro',
  'dodge', 'tesla', 'koenigsegg', 'pagani', 'hyundai', 'kia', 'vinfast', 'lexus', 'volkswagen', 'scania', 'alphard'
];

const STOPWORDS = new Set((
  'shop co khong ko k kh hok hong xe mau mo hinh san pham cho minh toi tui em anh chi ban gia bao nhieu bn con hang nao la gi vay a ah oi nhe nha nhi voi va hay the nay do muon mua tim hoi xem cai chiec ve dang duoc can san het ton kho tien coc dat truoc khi du kien so sanh nen chon tong tinh lay chot giup di roi thi ma de len cua o tai sao lam bao gio ngay nua them mot hai ba bon nam vi hop box card blister pre order preorder ship phi giao dia chi zalo hotline ty le scale gt mini minigt racing team edition model dong loai nhung cac sieu pham hot re dat nhat it nhieu tam khoang duoi tren tu den toi da qua tang goi y tu van ok oke uh um nhu vs thu so dau cuoi kia ay bot chat quay lai tro chuyen sang ai nguoi tao web trang sale giam khuyen mai ap voucher coupon admin nhan vien chuyen khoan freeship vip cod thanh toan chinh sach dac quyen hoi vien cap bac tich luy bao hanh doi tra tai khoan mat khau quen van chuyen spx vietqr'
).split(' '));

function analyze(raw) {
  let rawClean = cleanText(String(raw || '').replace(/1\s*[:/]\s*64/g, ' 1 64 '))
    .replace(/[.,](?!\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  rawClean = rawClean.replace(/(\d+)\s*(?:trieu|tr|cu)\s*(\d)(?!\d)/g, '$1.$2tr');

  // Mở rộng viết tắt / teencode trước khi phân tích ngữ nghĩa
  const text = expandSlang(rawClean);

  const price = parsePriceRange(text);
  const qty = parseQuantity(text);
  const pref = /(^|\s)(card|blister|ban vi|vi nhua|vi card)(\s|$)/.test(text) ? 'card'
    : /(^|\s)(box|ban hop|hop giay|paper box)(\s|$)/.test(text) ? 'box' : null;

  // Nhận diện mã giảm giá cụ thể mà khách nêu trong câu (VD: MINIGT30K, SANXE50K, MINIGT10P, VIP4...)
  const explicitCouponMatch = String(raw || '').toUpperCase().match(/\b(VIP[1-5]|[A-Z]{3,12}\d{1,4}[A-Z0-9]{0,4})\b/);
  let explicitCouponCode = null;
  if (explicitCouponMatch) {
    const cand = explicitCouponMatch[1];
    const matchesCachedSku = cachedProducts.some(
      p => String(p.Sku || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === cand.replace(/[^A-Z0-9]/g, '')
    );
    // Không nhầm với mã SKU sản phẩm / tên khung gầm xe (MGT1215, MGTS0019, PR640325, GT300, RB18, AMR24...)
    if (!matchesCachedSku && !/^(MGT\d|MGTS\d|MG\d|PR\d|KH\d|KHMG|AMR\d|RB\d|GT\d|S15|R32|R34|R35|A80|EVO\d)/.test(cand)) {
      explicitCouponCode = cand;
    }
  }

  const searchText = text
    .replace(PRICE_UNIT_RE, ' ')
    .replace(/(duoi|tren|tam|khoang|tu|den|toi|ngan sach|budget)\s*\d+(?:[.,]\d+)*/g, ' ')
    .replace(new RegExp(`(?:^|\\s)\\d{1,3}\\s*${QTY_UNITS}(?![a-z])`, 'g'), ' ')
    .replace(/\b1\s+64\b/g, ' ')
    .replace(explicitCouponCode ? new RegExp(`\\b${escapeRe(explicitCouponCode.toLowerCase())}\\b`, 'g') : /$^/, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let ordinal = null;
  if (/(^|\s)(dau tien|thu nhat|so 1|cai 1|mau 1|cai dau|mau dau)(\s|$)/.test(text)) ordinal = 0;
  else if (/(^|\s)(thu|so|cai|mau)\s*(2|hai)(\s|$)/.test(text)) ordinal = 1;
  else if (/(^|\s)(thu|so|cai|mau)\s*(3|ba)(\s|$)/.test(text)) ordinal = 2;
  else if (/(^|\s)(thu|so|cai|mau)\s*(4|tu|bon)(\s|$)/.test(text)) ordinal = 3;
  else if (/(^|\s)(cuoi|cuoi cung)(\s|$)/.test(text)) ordinal = -1;

  const intents = {};
  for (const key of Object.keys(P)) intents[key] = hasAny(text, P[key]);

  if (/(ai|nguoi nao|nhom nao|tac gia).*(tao|lam|thiet ke|code|xay dung|sang tao|phat trien).*(web|trang|shop|he thong)/.test(text)) {
    intents.creatorAsk = true;
  }
  if (/(^|\s)(thinh|nam)(\s|$)/.test(text) && /(la ai|thong tin|gioi thieu|lam gi|hoc o dau|email|so dien thoai|zalo|vai tro|ke them)/.test(text)) {
    intents.creatorAsk = true;
  }

  if (explicitCouponCode && /(ma|ap|dung|voucher|coupon|code|giam|con bao nhieu|tinh)/.test(text)) {
    intents.couponAsk = true;
  }

  intents.preorderList = intents.preorderWord && (intents.listWord || /(xe|mau|san pham)\s+(pre\s*order|preorder|dat truoc)/.test(text));
  intents.preorderPolicy = intents.preorderPolicy || (intents.preorderWord && !intents.preorderList);

  return {
    raw: String(raw || '').trim(),
    text,
    searchText,
    tokens: text.split(' ').filter(Boolean),
    price,
    qty,
    pref,
    ordinal,
    explicitCouponCode,
    intents
  };
}

function detectEscalation(ctx, history = []) {
  const t = ctx.text;
  const hasExplicitAdminRequest = hasAny(t, ESC.human) || (hasAny(t, ['gap', 'lien he', 'noi chuyen', 'ket noi']) && hasAny(t, ['admin', 'quan ly', 'chu shop', 'nguoi that', 'chu web']));
  if (hasExplicitAdminRequest) return 'customer_request';

  // Nếu khách đang tra cứu 1 mã đơn cụ thể hoặc đang hỏi nối tiếp về đơn hàng (hướng dẫn hủy đơn / sửa địa chỉ) -> để bộ máy SQL đọc đơn thực tế xử lý trước!
  const hasExplicitOrderCode = Boolean(extractOrderCodeFromText(ctx.raw, cachedProducts));
  const hasHistoryOrder = Boolean(getContextOrderCodeFromHistory(history, cachedProducts));
  if ((hasExplicitOrderCode || hasHistoryOrder) && /(doi dia chi|sua dia chi|doi so dien thoai|sua so dien thoai|lam sao huy|cach huy|huy don nay sao|co huy don duoc khong)/.test(t)) {
    return null;
  }
  if (hasExplicitOrderCode && !hasAny(t, ESC.damage) && !hasAny(t, ESC.negative) && !/(hoan tien|hoan coc|tra hang|chuyen khoan roi ma|da chuyen khoan ma|tru tien roi)/.test(t)) {
    return null;
  }

  if (hasAny(t, ESC.orderIssue)) {
    if (hasExplicitOrderCode) return null;
    if (ctx.intents.orderTracking && /(?:\+?84|0)(3|5|7|8|9)\d{8}\b/.test(ctx.raw.replace(/[\s.\-()]/g, ''))) return null;
    return 'order_support';
  }
  if (hasAny(t, ESC.customMod)) return 'not_understood';
  if (ctx.intents.creatorAsk || ctx.intents.botIdentity) return null;
  if (hasAny(t, ESC.negative)) return 'complaint_defect';
  if (hasAny(t, ESC.refund)) {
    if (ctx.intents.warrantyInfo && !hasAny(t, ESC.receipt)) return null;
    if (/(lam sao huy|cach huy|co huy don duoc|huong dan huy)/.test(t) && !/(hoan tien|hoan coc|tra hang)/.test(t)) return null;
    return 'complaint_defect';
  }
  if (hasAny(t, ESC.wholesale) || (ctx.qty && ctx.qty > SHOP.wholesaleQty)) return 'wholesale_deal';

  if (hasAny(t, ESC.damage)) {
    const isPresaleQuestion = (/(^|\s)(co bi|co hay|so bi|lieu co|co dam bao|khong)(\s|$)/.test(t) || ctx.intents.warrantyInfo) && !hasAny(t, ESC.receipt);
    return isPresaleQuestion ? null : 'complaint_defect';
  }
  return null;
}

function buildEscalationMessage(reason, rawQuestion, relatedOrderCode = null) {
  const shortQ = String(rawQuestion || '').length > 85 ? String(rawQuestion).slice(0, 82) + '...' : String(rawQuestion || '');
  const orderBadge = relatedOrderCode ? ` (Đơn liên quan: **#${relatedOrderCode}**)` : '';
  const tailNote = '\n\n💡 _Trong lúc chờ Admin phản hồi câu hỏi này, anh/chị **vẫn có thể hỏi Bé Bot bình thường** về giá xe, tồn kho, mã giảm giá, tiến trình đơn SPX... em vẫn trả lời ngay lập tức ạ!_ ✨';

  switch (reason) {
    case 'complaint_defect':
      return `Dạ Bé Bot rất tiếc về sự bất tiện này ạ 🙏 Em đã **gửi khẩn cấp nội dung phản ánh «${shortQ}»${orderBadge} kèm lịch sử trò chuyện trước đó lên Quản trị viên Showroom** để kiểm tra và hỗ trợ bảo hành/xử lý ưu tiên cho anh/chị ngay tại đây!${tailNote}`;
    case 'order_support':
      return `Dạ vấn đề đơn hàng «${shortQ}»${orderBadge} cần đối chiếu trên hệ thống vận đơn thực tế, em đã **chuyển thông báo kèm đoạn chat trước đó lên Admin Showroom** rồi ạ 📨 Admin sẽ kiểm tra và phản hồi trực tiếp cho mình ngay nhé!${tailNote}`;
    case 'wholesale_deal':
      return `Dạ với nhu cầu mua số lượng lớn / chính sách giá ưu đãi riêng («${shortQ}»), em đã **gửi thông báo kèm nội dung trao đổi lên Quản lý Showroom (Thịnh & Nam)** để báo mức chiết khấu tốt nhất cho anh/chị ạ! ⏳${tailNote}`;
    case 'customer_request':
      return `Dạ em đã **gửi tín hiệu mời Quản trị viên Showroom kèm nội dung cuộc trò chuyện${orderBadge}** vào hỗ trợ trực tiếp cho anh/chị rồi ạ! 🙋‍♂️ Admin sẽ phản hồi mình sớm nhất ngay tại khung chat này nhé.${tailNote}`;
    default:
      return `Dạ câu hỏi **«${shortQ}»**${orderBadge} nằm ngoài dữ liệu tự động hiện tại của Bé Bot nên em đã **gửi thông báo câu hỏi này kèm các tin nhắn trước đó lên Admin Showroom** rồi ạ! 📨\n\nAdmin khi vào hệ thống sẽ thấy ngay câu hỏi này và trả lời chi tiết cho anh/chị.${tailNote}`;
  }
}

// =====================================================================
// 3. TÌM KIẾM SẢN PHẨM SIÊU TỐC QUA INVERTED INDEX & BỘ NHỚ HỘI THOẠI
// =====================================================================
function searchProducts(searchText, products) {
  if (!products.length || !searchText) return [];
  const qTokens = searchText.split(/[\s.,]+/).filter(t => t.length >= 2 && !STOPWORDS.has(t));
  const compact = searchText.replace(/[^a-z0-9]/g, '');
  if (!qTokens.length && compact.length < 4) return [];

  // Lọc ứng viên siêu nhanh qua Inverted Index (nếu đang dùng danh sách sản phẩm đã cache)
  const useGlobalInv = products === cachedProducts && invertedTokenMap.size > 0;
  const candidateIndices = new Set();

  if (useGlobalInv) {
    for (const t of qTokens) {
      const hits = invertedTokenMap.get(t);
      if (hits) for (const idx of hits) candidateIndices.add(idx);
    }
    // Bổ sung quét SKU hoặc từ sai chính tả nhẹ nếu chưa khớp token trực tiếp
    if (candidateIndices.size === 0 || compact.length >= 4) {
      for (let i = 0; i < products.length; i++) {
        const idx = products[i]._idx;
        if (idx.skuKey.length >= 4 && compact.includes(idx.skuKey)) {
          candidateIndices.add(i);
        } else if (candidateIndices.size === 0) {
          candidateIndices.add(i);
        }
      }
    }
  } else {
    for (let i = 0; i < products.length; i++) candidateIndices.add(i);
  }

  const scored = [];
  for (const i of candidateIndices) {
    const p = products[i];
    const idx = p._idx || buildIndex(p);
    let score = 0;
    if (idx.skuKey.length >= 4 && compact.includes(idx.skuKey)) score += 120 + idx.skuKey.length;
    for (const t of qTokens) {
      if (/^\d+$/.test(t)) {
        if (t.length >= 3 && t === idx.skuDigits) { score += 90; continue; }
        if (idx.tokens.has(t)) score += 10;
        continue;
      }
      if (idx.tokens.has(t)) { score += t.length >= 4 ? 14 : 9; continue; }
      if (t.length >= 5) {
        for (const pt of idx.tokens) {
          if (pt.length >= 5 && Math.abs(pt.length - t.length) <= 2 && levenshtein(t, pt) <= (t.length >= 7 ? 2 : 1)) {
            score += 8;
            break;
          }
        }
      }
    }
    for (let k = 0; k < qTokens.length - 1; k++) {
      if (idx.text.includes(`${qTokens[k]} ${qTokens[k + 1]}`)) score += 7;
    }
    if (score > 0) scored.push({ p, score });
  }

  if (!scored.length) return [];
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0].score;
  if (top >= 100) return scored.filter(x => x.score === top).map(x => x.p);
  const threshold = Math.max(8, top * 0.6);
  return scored.filter(x => x.score >= threshold).map(x => x.p);
}

function getContextProducts(history, products) {
  const bySku = new Map(products.map(p => [String(p.Sku).toUpperCase(), p]));
  let checked = 0;
  for (let i = history.length - 1; i >= 0 && checked < 4; i--) {
    const h = history[i];
    if (h.sender_type === 'user') continue;
    checked++;
    const skus = [...String(h.message || '').matchAll(/\[([A-Z0-9][A-Z0-9-]{2,})\]/gi)].map(m => m[1].toUpperCase());
    const found = [];
    for (const s of skus) {
      const p = bySku.get(s);
      if (p && !found.includes(p)) found.push(p);
    }
    if (found.length) return found;
  }
  return [];
}

function wasLastTopicCreators(history) {
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i];
    if (h.sender_type === 'user') continue;
    const msg = String(h.message || '');
    return msg.includes(CREATOR_MARKER) || msg.includes('Nguyễn Đình Nam') || msg.includes('Đại Học Lạc Hồng');
  }
  return false;
}

// =====================================================================
// 4. ĐỊNH DẠNG SẢN PHẨM, GIÁ GIẢM TRỰC TIẾP, BAO BÌ & VOUCHER ĐỒNG BỘ 100%
// =====================================================================
function effectivePack(p, requestedPack) {
  if (p.PackagingType === 'box_only') return 'box';
  if (p.PackagingType === 'card_only') return 'card';
  if (requestedPack) return requestedPack;
  if (p.Status !== 'pre_order' && p.StockBox <= 0 && p.StockCard > 0) return 'card';
  return 'box';
}

const priceOf = (p, pack) => (effectivePack(p, pack) === 'card' ? p.PriceCard : p.PriceBox);
const basePriceOf = (p, pack) => (effectivePack(p, pack) === 'card' ? p.BasePriceCard : p.BasePriceBox);
const stockOf = (p, pack) => (effectivePack(p, pack) === 'card' ? p.StockCard : p.StockBox);
const packName = (pack) => (pack === 'card' ? 'Vỉ (Card)' : 'Hộp (Box)');

function depositOfProduct(p, subtotalAmount) {
  const pct = (p && p.DepositPercent > 0) ? (p.DepositPercent / 100) : SHOP.depositRate;
  if (p && p.DepositAmount > 0 && subtotalAmount === p.PriceBox) return p.DepositAmount;
  return roundK(subtotalAmount * pct);
}

function statusTag(p) {
  if (p.Status === 'sold_out') return '❌ Cháy hàng';
  const saleTag = p.DiscountPercent > 0 ? ` · 🔥 Sale -${p.DiscountPercent}%` : '';
  if (p.Status === 'pre_order') return `⏳ Pre-Order (cọc ${p.DepositPercent || 30}%)${saleTag}`;
  const total = p.StockBox + p.StockCard;
  if (total <= 0) return '❌ Tạm hết';
  if (total <= 4) return `🔥 Sắp hết (còn ${total})${saleTag}`;
  return `✅ Có sẵn${saleTag}`;
}

function stockLabel(p, pack) {
  if (p.PackagingType === 'box_only' && pack === 'card') return 'hãng chỉ phát hành bản Hộp Box';
  if (p.PackagingType === 'card_only' && pack === 'box') return 'hãng chỉ phát hành bản Vỉ Card';
  if (p.Status === 'sold_out') return 'đã cháy hàng';
  if (p.Status === 'pre_order') return 'đang nhận đặt cọc giữ suất';
  const n = pack === 'card' ? p.StockCard : p.StockBox;
  if (n <= 0) return 'tạm hết';
  if (n <= 3) return `chỉ còn ${n} chiếc 🔥`;
  return `còn ${n} chiếc`;
}

function isOrderable(p) {
  return p.Status === 'pre_order' || (p.Status === 'in_stock' && (p.StockBox + p.StockCard) > 0);
}

function calcCouponSaving(coupon, subtotal) {
  if (!coupon || subtotal < (coupon.minOrderAmount || 0)) return 0;
  if (coupon.isVipCoupon) {
    if (!coupon.discountPercent) return 0;
    return Math.min(roundK((subtotal * coupon.discountPercent) / 100), coupon.maxDiscount || Infinity);
  }
  if (coupon.discountType === 'percent') {
    return Math.min(roundK((subtotal * coupon.discountValue) / 100), coupon.maxDiscount || Infinity);
  }
  return Math.min(subtotal, coupon.discountValue);
}

function bestCouponHint(subtotal, coupons) {
  if (!Array.isArray(coupons) || !coupons.length || subtotal <= 0) return '';
  let best = null;
  let bestSave = 0;
  for (const c of coupons) {
    const save = calcCouponSaving(c, subtotal);
    if (save > bestSave) {
      bestSave = save;
      best = c;
    }
  }
  if (!best || bestSave <= 0) return '';
  return `🎟️ **Mẹo săn deal:** Đơn này đủ điều kiện áp mã **${best.code}** giảm ngay **${formatVnd(bestSave)}** → tiền xe chỉ còn **${formatVnd(Math.max(0, subtotal - bestSave))}**!`;
}

function formatPackPriceLine(p, pack) {
  const finalP = pack === 'card' ? p.PriceCard : p.PriceBox;
  const baseP = pack === 'card' ? p.BasePriceCard : p.BasePriceBox;
  const saleNote = (p.DiscountPercent > 0 && baseP > finalP)
    ? ` _(đã giảm -${p.DiscountPercent}% từ ${formatVnd(baseP)})_`
    : '';
  return `**${formatVnd(finalP)}**${saleNote} — ${stockLabel(p, pack)}`;
}

function productDetail(p) {
  const lines = [
    `🏎️ **[${p.Sku}] ${p.Name}**`,
    `• Thương hiệu: **${p.Brand}** · Dòng: ${p.CategoryName} · Tỷ lệ ${p.Scale}`
  ];

  if (p.PackagingType === 'box_only') {
    lines.push(`• Phiên bản Hộp (Box Set): ${formatPackPriceLine(p, 'box')} _(mẫu đặc biệt chỉ phát hành bản Box)_`);
  } else if (p.PackagingType === 'card_only') {
    lines.push(`• Phiên bản Vỉ (Blister Card): ${formatPackPriceLine(p, 'card')} _(chỉ phát hành bản Card)_`);
  } else {
    lines.push(`• Bản Hộp (Box): ${formatPackPriceLine(p, 'box')}`);
    lines.push(`• Bản Vỉ (Card): ${formatPackPriceLine(p, 'card')}`);
  }

  if (p.Status === 'pre_order') {
    const depPct = p.DepositPercent || 30;
    const depBox = depositOfProduct(p, p.PriceBox);
    const depCard = depositOfProduct(p, p.PriceCard);
    const depStr = p.PackagingType === 'box_only'
      ? `Box **${formatVnd(depBox)}**`
      : (p.PackagingType === 'card_only' ? `Card **${formatVnd(depCard)}**` : `Box **${formatVnd(depBox)}** / Card **${formatVnd(depCard)}**`);
    lines.push(`• ⏳ Pre-Order · dự kiến về: **${p.ExpectedDelivery || SHOP.preorderDeadline}** · cọc ${depPct}%: ${depStr}`);
  }
  if (p.EditionNote) lines.push(`• ✨ Điểm nhấn: ${p.EditionNote}`);
  if (p.Description) lines.push(`• 📝 Chi tiết: ${p.Description}`);
  return lines.join('\n');
}

function listLine(p) {
  if (p.PackagingType === 'box_only') {
    return `• **[${p.Sku}] ${p.Name}**\n   Box **${formatVnd(p.PriceBox)}** — ${statusTag(p)}`;
  }
  if (p.PackagingType === 'card_only') {
    return `• **[${p.Sku}] ${p.Name}**\n   Card **${formatVnd(p.PriceCard)}** — ${statusTag(p)}`;
  }
  return `• **[${p.Sku}] ${p.Name}**\n   Box **${formatVnd(p.PriceBox)}** · Card **${formatVnd(p.PriceCard)}** — ${statusTag(p)}`;
}

function findSimilar(p, products, n = 2) {
  const pool = products.filter(x => x !== p && isOrderable(x));
  const same = pool.filter(x => x.CategoryName === p.CategoryName);
  const base = same.length ? same : pool;
  return base.sort((a, b) => Math.abs(a.PriceBox - p.PriceBox) - Math.abs(b.PriceBox - p.PriceBox)).slice(0, n);
}

function similarBlock(p, products) {
  const sim = findSimilar(p, products);
  if (!sim.length) return '';
  return `\n\n💡 Bé Bot gợi ý mẫu tương tự đang đặt được:\n${sim.map(listLine).join('\n')}`;
}

const reply = (message, suggestions = [], extra = {}) => ({
  message,
  suggestions,
  isEscalated: false,
  confident: true,
  ...extra
});

// =====================================================================
// 5. TRẢ LỜI NHÀ SÁNG TẠO WEBSITE (THỊNH & NAM) + HỎI THÊM CHI TIẾT
// =====================================================================
function answerCreators(ctx, isFollowUp = false) {
  const t = ctx.text;
  const askThinhOnly = /(^|\s)(thinh|quoc thinh)(\s|$)/.test(t) && !/(^|\s)(nam|dinh nam)(\s|$)/.test(t);
  const askNamOnly = /(^|\s)(nam|dinh nam)(\s|$)/.test(t) && !/(^|\s)(thinh|quoc thinh)(\s|$)/.test(t);
  const askTech = /(cong nghe|ngon ngu|code|lap trinh|database|csdl|framework|viet bang|ky thuat)/.test(t);
  const askContact = /(lien he|zalo|so dien thoai|email|gmail|gap hai ban|dia chi)/.test(t);

  if (askThinhOnly) {
    const th = CREATORS.thinh;
    return reply(
      `👨‍💻 **Thông tin chi tiết về bạn ${th.fullName} (${th.shortName}):**\n\n` +
      `• **Vai trò:** ${th.role}\n` +
      `• **Đơn vị học tập:** ${CREATORS.university}\n` +
      `• **Đóng góp nổi bật trên Website:**\n` +
      th.highlights.map(x => `  ◦ ${x}`).join('\n') +
      `\n• **Liên hệ trực tiếp:** Zalo/Hotline **${th.zalo}** _(bấm icon Zalo kế bên Bé Bot ở góc dưới)_ · Email: **${th.email}**\n\n` +
      `Anh/chị có muốn tìm hiểu thêm về bạn **Nguyễn Đình Nam** hoặc công nghệ làm nên website này không ạ? ✨`,
      ['Thông tin thêm về Nam', 'Website dùng công nghệ gì?', 'Xe nào đang có sẵn?']
    );
  }

  if (askNamOnly) {
    const nm = CREATORS.nam;
    return reply(
      `🎨 **Thông tin chi tiết về bạn ${nm.fullName} (${nm.shortName}):**\n\n` +
      `• **Vai trò:** ${nm.role}\n` +
      `• **Đơn vị học tập:** ${CREATORS.university}\n` +
      `• **Đóng góp nổi bật trên Website:**\n` +
      nm.highlights.map(x => `  ◦ ${x}`).join('\n') +
      `\n• **Liên hệ:** Email **${nm.email}** · Zalo Showroom: **${SHOP.hotline}**\n\n` +
      `Anh/chị muốn hỏi thêm về bạn **Đỗ Quốc Thịnh** hay khám phá dàn siêu xe 1:64 trên web ạ? ✨`,
      ['Thông tin thêm về Thịnh', 'Website dùng công nghệ gì?', 'Xe nào đang có sẵn?']
    );
  }

  if (askTech) {
    return reply(
      `⚙️ **Công nghệ đứng sau Website ${SHOP.name} (do Thịnh & Nam phát triển):**\n\n` +
      CREATORS.techStack.map(x => `• ${x}`).join('\n') +
      `\n\nDự án được **Đỗ Quốc Thịnh** và **Nguyễn Đình Nam** (${CREATORS.university}) tối ưu vừa thông minh vừa siêu nhẹ băng thông ạ! 🚀`,
      ['Thông tin thêm về Thịnh', 'Thông tin thêm về Nam', 'Xem xe sẵn hàng']
    );
  }

  if (askContact) {
    return reply(
      `📞 **Cách liên hệ với 2 nhà sáng tạo Thịnh & Nam:**\n\n` +
      `• **Đỗ Quốc Thịnh:** Zalo / Hotline **${CREATORS.thinh.zalo}** · Email: **${CREATORS.thinh.email}**\n` +
      `• **Nguyễn Đình Nam:** Email **${CREATORS.nam.email}** · Zalo Showroom: **${SHOP.hotline}**\n` +
      `• **Showroom thực tế:** ${SHOP.address}\n\n` +
      `👉 Anh/chị có thể bấm ngay **icon Zalo màu xanh** nằm sát bên phải Bé Bot ở góc dưới để nhắn trực tiếp cho Thịnh nhé ạ! 💬`,
      ['Thông tin thêm về Thịnh', 'Thông tin thêm về Nam', 'Xe nào đang có sẵn?']
    );
  }

  if (isFollowUp || ctx.intents.moreInfo) {
    return reply(
      `🌟 **Hồ sơ chi tiết 2 tác giả sáng tạo Website — Thịnh & Nam:**\n\n` +
      `1️⃣ **${CREATORS.thinh.fullName} (Thịnh)**\n` +
      `• Vai trò: ${CREATORS.thinh.role}\n` +
      `• Phụ trách: Kiến trúc Backend Node.js, CSDL đám mây Supabase, thanh toán tự động VietQR/PayOS, bảo mật OTP Gmail & phát triển Trợ lý AI Bé Bot.\n` +
      `• Liên hệ: Zalo **${CREATORS.thinh.zalo}** · Email: ${CREATORS.thinh.email}\n\n` +
      `2️⃣ **${CREATORS.nam.fullName} (Nam)**\n` +
      `• Vai trò: ${CREATORS.nam.role}\n` +
      `• Phụ trách: Thiết kế UI/UX chuẩn Showroom 1:64, hiệu ứng tương tác mượt mà trên Mobile/PC, trải nghiệm QuickView & biên tập bộ sưu tập xe.\n` +
      `• Liên hệ: Email ${CREATORS.nam.email}\n\n` +
      `🎓 Cả hai hiện là sinh viên **${CREATORS.university}**, cùng xây dựng nên **${SHOP.name}** với tâm huyết dành cho cộng đồng đam mê mô hình tĩnh 1:64! 💕`,
      ['Website dùng công nghệ gì?', 'Thông tin thêm về Thịnh', 'Thông tin thêm về Nam', 'Xe nào đang có sẵn?']
    );
  }

  return reply(
    `Dạ website **${SHOP.name}** được sáng tạo và phát triển bởi hai bạn **Thịnh** (**${CREATORS.thinh.fullName}**) và **Nam** (**${CREATORS.nam.fullName}**) — sinh viên **${CREATORS.university}** ạ! 👨‍💻✨\n\n` +
    `• **Bạn Thịnh:** Phụ trách hệ thống Backend, CSDL đám mây, cổng thanh toán VietQR tự động & Trợ lý AI Bé Bot.\n` +
    `• **Bạn Nam:** Phụ trách thiết kế giao diện UI/UX Showroom hiện đại, trải nghiệm người dùng & nội dung bộ sưu tập 1:64.\n\n` +
    `Anh/chị muốn hỏi thêm thông tin chi tiết về **Thịnh**, về **Nam**, hay **công nghệ làm nên trang web** cứ nhắn Bé Bot nhé ạ! 💕`,
    ['Thông tin thêm về Thịnh', 'Thông tin thêm về Nam', 'Hai bạn dùng công nghệ gì?', 'Liên hệ với Thịnh và Nam']
  );
}

// =====================================================================
// 6. TRẢ LỜI ĐA Ý ĐỊNH, TÍNH TIỀN, ÁP THỬ MÃ GIẢM GIÁ & LỌC XE SALE
// =====================================================================
function appendSecondaryIntents(baseMsg, ctx, coupons, skipKeys = {}) {
  const I = ctx.intents;
  const extras = [];
  if (I.shipping && !skipKeys.shipping && !baseMsg.includes('SPX Express')) {
    extras.push(`🚚 **Vận chuyển:** Giao nhanh **SPX Express** toàn quốc phí chỉ **${formatVnd(SHOP.shippingFee)}** (hộp cứng chống sốc 4 lớp), **FREESHIP 0đ** cho đơn từ **${formatVnd(SHOP.freeShipThreshold)}**.`);
  }
  if (I.payment && !skipKeys.payment && !baseMsg.includes('VietQR')) {
    extras.push(`💳 **Thanh toán:** Quét **VietQR tự động** (${SHOP.bankName}) xác nhận trong vài giây, đặt cọc 30% cho xe Pre-Order, hoặc **Ship COD** cho hội viên VIP 4+ (tích lũy từ 1 triệu).`);
  }
  if (I.boxcard && !skipKeys.boxcard && !baseMsg.includes('Blister Card')) {
    extras.push('📦 **Box vs Card:** Bản **Box** (hộp giấy) tiết kiệm hơn và dễ mở ngắm xe; bản **Card** (vỉ nhựa ép tranh Art) sang trọng để treo trưng bày & làm quà tặng.');
  }
  if (I.couponAsk && !skipKeys.couponAsk && coupons.length && !baseMsg.includes('Mẹo săn deal') && !baseMsg.includes('Voucher')) {
    extras.push(`🎟️ **Voucher đang mở:** ${coupons.map(c => `**${c.code}** (đơn từ ${formatVnd(c.minOrderAmount)})`).join(', ')}.`);
  }
  if (I.creatorAsk && !skipKeys.creatorAsk && !baseMsg.includes(CREATOR_MARKER)) {
    extras.push(`👨‍💻 **Tác giả Website:** Phát triển bởi **Đỗ Quốc Thịnh & Nguyễn Đình Nam** (${CREATORS.university}).`);
  }
  if ((I.address || I.contact) && !skipKeys.contact && !baseMsg.includes(SHOP.address)) {
    extras.push(`📍 **Showroom:** ${SHOP.address} · Zalo/Hotline: **${SHOP.hotline}**.`);
  }
  return extras.length ? `${baseMsg}\n\n${extras.join('\n')}` : baseMsg;
}

// Tự động tính thử mã giảm giá cụ thể cho sản phẩm đang chọn
function answerCouponCalculation(items, codeStr, ctx, coupons) {
  const normCode = String(codeStr || '').toUpperCase().trim();
  const vipMap = couponService.VIP_TIER_COUPONS || {};
  const foundCoupon = coupons.find(c => c.code === normCode) || (vipMap[normCode] ? { isVipCoupon: true, ...vipMap[normCode], minOrderAmount: 0 } : null);

  if (!foundCoupon) {
    const avail = coupons.length ? `Hiện Showroom đang có các mã hợp lệ: ${coupons.map(c => `**${c.code}**`).join(', ')}.` : '';
    return reply(
      `Dạ mã **${normCode}** hiện không tồn tại hoặc đã hết lượt sử dụng trên hệ thống ạ 🥺 ${avail}`,
      ['Shop có mã giảm giá không?', 'Xe nào đang có sẵn?'],
      items.length ? { matchedProducts: items.map(p => p.Sku) } : {}
    );
  }

  if (!items.length) {
    const benefit = foundCoupon.isVipCoupon
      ? `Giảm **${foundCoupon.discountPercent}%** (tối đa ${formatVnd(foundCoupon.maxDiscount)}) dành cho ${foundCoupon.tierName}`
      : (foundCoupon.discountType === 'percent'
        ? `Giảm **${foundCoupon.discountValue}%** (tối đa ${formatVnd(foundCoupon.maxDiscount)}) cho đơn từ **${formatVnd(foundCoupon.minOrderAmount)}**`
        : `Giảm trực tiếp **${formatVnd(foundCoupon.discountValue)}** cho đơn từ **${formatVnd(foundCoupon.minOrderAmount)}**`);
    return reply(
      `🎟️ Mã **${normCode}** đang **HOẠT ĐỘNG** ạ!\n• Ưu đãi: ${benefit}\n• Mô tả: _${foundCoupon.description}_\n\nAnh/chị muốn áp thử mã **${normCode}** cho mẫu xe nào cứ nhắn tên xe (VD: _"áp mã ${normCode} cho Roxy"_) để em tính ra số tiền chính xác nhé! ✨`,
      ['Xe nào đang có sẵn?', 'Xe nào đang giảm giá?']
    );
  }

  const qty = ctx.qty || 1;
  const pack = effectivePack(items[0], ctx.pref);
  const subtotal = items.length === 1
    ? priceOf(items[0], pack) * qty
    : items.reduce((s, p) => s + priceOf(p, effectivePack(p, ctx.pref)), 0);

  const label = items.length === 1
    ? `${qty} × **[${items[0].Sku}] ${items[0].Name}** (bản ${packName(pack)})`
    : items.map(p => `**[${p.Sku}]**`).join(' + ');

  if (subtotal < (foundCoupon.minOrderAmount || 0)) {
    const diff = foundCoupon.minOrderAmount - subtotal;
    const altHint = bestCouponHint(subtotal, coupons);
    return reply(
      `⚠️ Đơn ${label} hiện có tạm tính **${formatVnd(subtotal)}**, còn thiếu **${formatVnd(diff)}** nữa mới đủ điều kiện áp mã **${normCode}** (yêu cầu đơn từ **${formatVnd(foundCoupon.minOrderAmount)}**) ạ.\n\n` +
      (altHint ? `${altHint}\n` : '') +
      `💡 Anh/chị có thể chọn bản Card hoặc gộp thêm 1 xe nữa để vừa dùng được mã **${normCode}** vừa tiến sát mốc Freeship **${formatVnd(SHOP.freeShipThreshold)}** nhé!`,
      ['Mua 2 chiếc hết bao nhiêu?', 'Xe nào đang giảm giá?'],
      { matchedProducts: items.map(p => p.Sku) }
    );
  }

  const discount = calcCouponSaving(foundCoupon, subtotal);
  const afterVoucher = Math.max(0, subtotal - discount);
  const ship = subtotal >= SHOP.freeShipThreshold ? 0 : SHOP.shippingFee;

  return reply(
    `🎉 **Áp thử mã ${normCode} thành công!** Bảng tính chi tiết của anh/chị:\n\n` +
    `• Sản phẩm: ${label}\n` +
    `• Tiền xe hiện tại: **${formatVnd(subtotal)}** (${items.length === 1 && isOrderable(items[0]) ? '✅ Còn hàng sẵn' : statusTag(items[0])})\n` +
    `• 🎟️ Áp mã **${normCode}**: **-${formatVnd(discount)}** → Tiền xe còn **${formatVnd(afterVoucher)}**\n` +
    `• 🚚 Phí ship SPX Express: ${ship === 0 ? '**0đ (FREESHIP)** 🎉' : `**${formatVnd(ship)}**`}\n` +
    `• 💰 **Tổng thanh toán cuối cùng: ${formatVnd(afterVoucher + ship)}**` +
    (foundCoupon.isVipCoupon ? `\n_(Lưu ý: Mã ${normCode} yêu cầu tài khoản đạt hạng ${foundCoupon.tierName} khi thanh toán ạ)_` : ''),
    ['Hướng dẫn đặt hàng', 'Thanh toán bằng cách nào?'],
    { matchedProducts: items.map(p => p.Sku) }
  );
}

function answerProduct(p, ctx, products, coupons) {
  const I = ctx.intents;
  if (ctx.explicitCouponCode) return answerCouponCalculation([p], ctx.explicitCouponCode, ctx, coupons);
  if (ctx.qty || I.total) return answerTotal(p, ctx, products, coupons);
  if (I.deposit) return answerDeposit(p, ctx, products);
  if (I.eta) return answerEta(p, products);
  if (I.stock || (ctx.pref && !I.price)) {
    const stReply = answerStock(p, ctx.pref, products);
    stReply.message = appendSecondaryIntents(stReply.message, ctx, coupons);
    return stReply;
  }

  let msg = `Dạ đây là thông tin thực tế mới nhất của mẫu xe anh/chị đang hỏi ạ:\n\n${productDetail(p)}`;
  if (!isOrderable(p)) {
    msg += `\n\nTiếc quá, mẫu này hiện đã tạm hết hàng 🥺${similarBlock(p, products)}`;
  } else {
    const chosenP = priceOf(p, ctx.pref);
    const couponLine = bestCouponHint(chosenP, coupons);
    if (couponLine) msg += `\n\n${couponLine}`;
    msg += `\n\n👉 Bấm vào mã **[${p.Sku}]** hoặc thẻ xe bên dưới để xem ảnh lớn & thêm vào giỏ nhé!`;
  }
  msg = appendSecondaryIntents(msg, ctx, coupons);

  const sugg = p.Status === 'pre_order'
    ? ['Cọc mẫu này bao nhiêu?', 'Khi nào xe về?', 'Mua 2 chiếc hết bao nhiêu?']
    : (p.PackagingType === 'both'
      ? ['Còn hàng bản Card không?', 'Mua 2 chiếc hết bao nhiêu?', 'Shop có mã giảm giá không?']
      : ['Mua 1 chiếc cả ship bao nhiêu?', 'Shop có mã giảm giá không?', 'Xe nào đang giảm giá?']);
  return reply(msg, isOrderable(p) ? sugg : ['Xe nào đang có sẵn?'], { matchedProducts: [p.Sku] });
}

function answerTotal(p, ctx, products, coupons) {
  if (!isOrderable(p)) {
    return reply(`Dạ mẫu **[${p.Sku}] ${p.Name}** hiện ${p.Status === 'sold_out' ? 'đã cháy hàng' : 'tạm hết hàng'} nên em chưa tính đơn được ạ 🥺${similarBlock(p, products)}`, ['Xe nào đang có sẵn?'], { matchedProducts: [p.Sku] });
  }
  const qty = ctx.qty || 1;
  const pack = effectivePack(p, ctx.pref);
  const unit = priceOf(p, pack);
  const sub = unit * qty;
  const ship = sub >= SHOP.freeShipThreshold ? 0 : SHOP.shippingFee;

  const lines = [
    '🧮 **Bảng tạm tính chi tiết đơn hàng (đồng bộ trực tiếp hệ thống):**',
    `• Mẫu xe: ${qty} × **[${p.Sku}] ${p.Name}** — bản ${packName(pack)}`,
    `• Tiền xe: ${qty} × ${formatVnd(unit)} = **${formatVnd(sub)}**${p.DiscountPercent > 0 ? ` _(đã áp giá Sale -${p.DiscountPercent}%)_` : ''}`,
    `• Phí vận chuyển SPX Express: ${ship ? `**${formatVnd(ship)}**` : '**MIỄN PHÍ 0đ** 🎉'}`,
    `• 💰 **Tổng thanh toán tạm tính: ${formatVnd(sub + ship)}**`
  ];
  const cHint = bestCouponHint(sub, coupons);
  if (cHint) {
    const bestSave = Math.max(...coupons.map(c => calcCouponSaving(c, sub)), 0);
    lines.push(`• ${cHint} _(Tổng cả ship sau khi nhập mã chỉ còn **${formatVnd(Math.max(0, sub - bestSave) + ship)}**!)_`);
  }

  if (p.Status === 'pre_order') {
    const dep = depositOfProduct(p, sub);
    lines.push(`• ⏳ Xe Pre-Order chỉ cần đặt cọc trước ${p.DepositPercent || 30}%: **${formatVnd(dep)}**, khi xe về mới thanh toán phần còn lại.`);
  } else {
    const stock = stockOf(p, pack);
    if (stock < qty) {
      const other = pack === 'card' ? 'box' : 'card';
      if (p.PackagingType === 'both') {
        lines.push(stock > 0
          ? `⚠️ Lưu ý: Kho bản ${packName(pack)} hiện chỉ còn **${stock} chiếc**, anh/chị có thể lấy ${stock} chiếc hoặc kết hợp thêm bản ${packName(other)} (${stockLabel(p, other)}) nhé ạ.`
          : `⚠️ Lưu ý: Bản ${packName(pack)} vừa tạm hết, hiện còn bản ${packName(other)} (${stockLabel(p, other)}) ạ.`);
      } else {
        lines.push(`⚠️ Lưu ý: Kho hiện chỉ còn **${stock} chiếc** cho mẫu này ạ.`);
      }
    }
  }
  if (ship > 0) lines.push(`💡 Mua thêm **${formatVnd(SHOP.freeShipThreshold - sub)}** nữa là được **FREESHIP 0đ** toàn quốc ạ!`);
  if (!ctx.pref && p.PackagingType === 'both' && p.PriceCard !== p.PriceBox) {
    const subCard = p.PriceCard * qty;
    const shipCard = subCard >= SHOP.freeShipThreshold ? 0 : SHOP.shippingFee;
    lines.push(`_(Nếu chọn bản Vỉ Card thì tổng cả ship là **${formatVnd(subCard + shipCard)}** ạ.)_`);
  }
  const finalMsg = appendSecondaryIntents(lines.join('\n'), ctx, coupons, { shipping: true });
  return reply(finalMsg, ['Shop có mã giảm giá không?', 'Hướng dẫn đặt hàng', 'Thanh toán bằng cách nào?'], { matchedProducts: [p.Sku] });
}

function answerDeposit(p, ctx, products) {
  if (!isOrderable(p)) {
    return reply(`Dạ mẫu **[${p.Sku}] ${p.Name}** hiện chưa mở nhận cọc do đã hết suất ạ 🥺${similarBlock(p, products)}`, ['Xe nào đang có sẵn?'], { matchedProducts: [p.Sku] });
  }
  const qty = ctx.qty || 1;
  const qtyText = qty > 1 ? ` (${qty} chiếc)` : '';
  const depPct = p.DepositPercent || Math.round(SHOP.depositRate * 100);
  const dBox = depositOfProduct(p, p.PriceBox * qty);
  const dCard = depositOfProduct(p, p.PriceCard * qty);
  if (p.Status === 'pre_order') {
    const packLines = [];
    if (p.PackagingType !== 'card_only') {
      packLines.push(`• Bản Box: cọc **${formatVnd(dBox)}** — còn lại **${formatVnd(p.PriceBox * qty - dBox)}** thanh toán khi xe về`);
    }
    if (p.PackagingType !== 'box_only') {
      packLines.push(`• Bản Card: cọc **${formatVnd(dCard)}** — còn lại **${formatVnd(p.PriceCard * qty - dCard)}** thanh toán khi xe về`);
    }
    return reply(
      `Dạ mẫu **[${p.Sku}] ${p.Name}** đang mở **Pre-Order** (dự kiến về: **${p.ExpectedDelivery || SHOP.preorderDeadline}**).\nMức cọc ${depPct}% giữ suất${qtyText}:\n` +
      packLines.join('\n') +
      '\n\nNgay sau khi quét VietQR cọc, hệ thống tự động gửi **Biên nhận cọc điện tử qua Gmail** cho anh/chị ạ! 🛡️',
      ['Khi nào xe về?', 'Hướng dẫn đặt hàng'],
      { matchedProducts: [p.Sku] }
    );
  }
  return reply(
    `Dạ mẫu **[${p.Sku}] ${p.Name}** hiện **đang có sẵn tại Showroom** nên anh/chị không cần chờ Pre-Order mà có thể đặt mua giao ngay luôn ạ! 🚀\n` +
    (p.PackagingType === 'box_only'
      ? `• Giá Box: **${formatVnd(p.PriceBox * qty)}**${qtyText}.`
      : `• Giá Box: **${formatVnd(p.PriceBox * qty)}** · Giá Card: **${formatVnd(p.PriceCard * qty)}**${qtyText}.`),
    ['Mua 1 chiếc hết bao nhiêu?', 'Hướng dẫn đặt hàng'],
    { matchedProducts: [p.Sku] }
  );
}

function answerEta(p, products) {
  if (p.Status === 'pre_order') {
    return reply(`Dạ mẫu **[${p.Sku}] ${p.Name}** dự kiến cập bến Showroom vào **${p.ExpectedDelivery || SHOP.preorderDeadline}** ạ. Anh/chị có thể đặt cọc ${p.DepositPercent || 30}% (từ **${formatVnd(depositOfProduct(p, p.PriceBox))}**) để khóa giá ưu đãi và giữ slot sớm nhé! ⏳`, ['Cọc mẫu này bao nhiêu?'], { matchedProducts: [p.Sku] });
  }
  if (isOrderable(p)) {
    return reply(`Dạ mẫu **[${p.Sku}] ${p.Name}** đang **sẵn hàng tại Biên Hòa** ạ! Đặt hôm nay shop đóng gói chống sốc 4 lớp gửi SPX Express (phí chỉ **${formatVnd(SHOP.shippingFee)}**): Đồng Nai/HCM tầm **1–2 ngày**, tỉnh khác **2–4 ngày** là nhận được xe ạ 🚀`, ['Mua 1 chiếc hết bao nhiêu?'], { matchedProducts: [p.Sku] });
  }
  return reply(`Dạ mẫu **[${p.Sku}] ${p.Name}** đã bán hết đợt phát hành và hãng chưa công bố lịch tái bản ạ 🥺${similarBlock(p, products)}`, ['Xe nào đang có sẵn?'], { matchedProducts: [p.Sku] });
}

function answerStock(p, pack, products) {
  if (p.Status === 'sold_out') {
    return reply(`Dạ tiếc quá, mẫu **[${p.Sku}] ${p.Name}** hiện đã **cháy hàng** toàn bộ rồi ạ 🥺${similarBlock(p, products)}`, ['Xe nào đang có sẵn?'], { matchedProducts: [p.Sku] });
  }
  if (p.Status === 'pre_order') {
    return reply(`Dạ mẫu **[${p.Sku}] ${p.Name}** là hàng **Pre-Order** đang mở nhận cọc giữ suất (dự kiến về ${p.ExpectedDelivery || SHOP.preorderDeadline}), mức cọc ${p.DepositPercent || 30}% chỉ từ **${formatVnd(depositOfProduct(p, p.PriceBox))}** ạ.`, ['Cọc mẫu này bao nhiêu?'], { matchedProducts: [p.Sku] });
  }
  if (pack) {
    if (p.PackagingType === 'box_only' && pack === 'card') {
      return reply(`Dạ mẫu **[${p.Sku}] ${p.Name}** hãng chỉ phát hành phiên bản **Hộp (Box)** chứ không có bản Vỉ Card ạ. Hiện bản Box đang **${stockLabel(p, 'box')}** với giá **${formatVnd(p.PriceBox)}**!`, ['Mua 1 chiếc bản Box hết bao nhiêu?'], { matchedProducts: [p.Sku] });
    }
    if (p.PackagingType === 'card_only' && pack === 'box') {
      return reply(`Dạ mẫu **[${p.Sku}] ${p.Name}** hãng chỉ phát hành phiên bản **Vỉ (Card)** ạ. Hiện bản Card đang **${stockLabel(p, 'card')}** với giá **${formatVnd(p.PriceCard)}**!`, ['Mua 1 chiếc bản Card hết bao nhiêu?'], { matchedProducts: [p.Sku] });
    }
    const other = pack === 'card' ? 'box' : 'card';
    let msg = `Dạ bản ${packName(pack)} của **[${p.Sku}] ${p.Name}** hiện **${stockLabel(p, pack)}** (giá **${formatVnd(priceOf(p, pack))}**).`;
    if (stockOf(p, pack) <= 0 && p.PackagingType === 'both') {
      msg += `\nTuy nhiên bản ${packName(other)} vẫn **${stockLabel(p, other)}** (giá **${formatVnd(priceOf(p, other))}**) đó ạ!`;
    }
    return reply(msg, [`Mua 1 chiếc bản ${pack === 'card' ? 'Card' : 'Box'} hết bao nhiêu?`], { matchedProducts: [p.Sku] });
  }

  const stockLines = [];
  if (p.PackagingType !== 'card_only') stockLines.push(`• Bản Hộp (Box): **${stockLabel(p, 'box')}** — **${formatVnd(p.PriceBox)}**`);
  if (p.PackagingType !== 'box_only') stockLines.push(`• Bản Vỉ (Card): **${stockLabel(p, 'card')}** — **${formatVnd(p.PriceCard)}**`);

  let msg = `Dạ tồn kho thực tế của **[${p.Sku}] ${p.Name}** ngay lúc này:\n${stockLines.join('\n')}`;
  if (p.StockBox + p.StockCard <= 0) msg += similarBlock(p, products);
  return reply(msg, ['Mua 1 chiếc hết bao nhiêu?', 'Box và Card khác nhau thế nào?'], { matchedProducts: [p.Sku] });
}

function answerCompare(a, b) {
  const lines = [
    '⚖️ **Đặt lên bàn cân 2 siêu phẩm 1:64:**', '',
    `🅰️ **[${a.Sku}] ${a.Name}**`,
    `• Hãng: ${a.Brand} · Dòng: ${a.CategoryName}`,
    `• Giá thực tế: ${a.PackagingType === 'box_only' ? `Box **${formatVnd(a.PriceBox)}**` : `Box **${formatVnd(a.PriceBox)}** | Card **${formatVnd(a.PriceCard)}**`} — ${statusTag(a)}`, '',
    `🅱️ **[${b.Sku}] ${b.Name}**`,
    `• Hãng: ${b.Brand} · Dòng: ${b.CategoryName}`,
    `• Giá thực tế: ${b.PackagingType === 'box_only' ? `Box **${formatVnd(b.PriceBox)}**` : `Box **${formatVnd(b.PriceBox)}** | Card **${formatVnd(b.PriceCard)}**`} — ${statusTag(b)}`, ''
  ];
  const notes = [];
  const diff = a.PriceBox - b.PriceBox;
  if (diff !== 0) notes.push(`**[${diff < 0 ? a.Sku : b.Sku}]** mềm hơn **${formatVnd(Math.abs(diff))}** (bản Box)`);
  else notes.push('Cả 2 mẫu có cùng mức giá bản Box');
  if (isOrderable(a) !== isOrderable(b)) notes.push(`hiện chỉ **[${isOrderable(a) ? a.Sku : b.Sku}]** còn suất đặt mua`);
  else if (a.Status !== b.Status) notes.push(`**[${a.Status === 'in_stock' ? a.Sku : b.Sku}]** sẵn hàng nhận ngay, mẫu kia là Pre-Order cọc trước`);
  lines.push(`💡 **Đánh giá nhanh:** ${notes.join('; ')}.`);
  lines.push('Anh/chị ưng mẫu nào hơn để em tính tổng kèm mã giảm giá cho mình luôn ạ? ✨');
  return reply(lines.join('\n'), [`Tính tiền mẫu ${a.Sku}`, `Tính tiền mẫu ${b.Sku}`, 'Tính tiền mua cả 2 mẫu'], { matchedProducts: [a.Sku, b.Sku] });
}

function answerComboTotal(items, ctx, coupons) {
  if (ctx.explicitCouponCode) return answerCouponCalculation(items, ctx.explicitCouponCode, ctx, coupons);
  let subtotal = 0;
  let depositTotal = 0;
  let hasPreOrder = false;
  const lines = ['🧮 **Tạm tính đơn gộp nhiều xe cho anh/chị:**', ''];

  items.forEach((p, idx) => {
    const pack = effectivePack(p, ctx.pref);
    const unit = priceOf(p, pack);
    subtotal += unit;
    if (p.Status === 'pre_order') {
      hasPreOrder = true;
      depositTotal += depositOfProduct(p, unit);
    }
    lines.push(`• **Xe ${idx + 1}:** **[${p.Sku}]** ${p.Name}`);
    lines.push(`  Bản ${packName(pack)}: **${formatVnd(unit)}** — ${statusTag(p)}`);
  });

  const ship = subtotal >= SHOP.freeShipThreshold ? 0 : SHOP.shippingFee;
  lines.push('');
  lines.push(`• Tổng tiền xe (${items.length} mẫu): **${formatVnd(subtotal)}**`);
  lines.push(`• Phí ship SPX Express: ${ship ? `**${formatVnd(ship)}**` : '**MIỄN PHÍ 0đ** 🎉'}`);
  lines.push(`• 💰 **Tổng thanh toán: ${formatVnd(subtotal + ship)}**`);

  const cHint = bestCouponHint(subtotal, coupons);
  if (cHint) lines.push(`• ${cHint}`);
  if (hasPreOrder) lines.push(`• ⏳ Phần cọc giữ suất cho xe Pre-Order trong đơn: **${formatVnd(depositTotal)}**.`);
  if (ship > 0) lines.push(`💡 Gộp thêm **${formatVnd(SHOP.freeShipThreshold - subtotal)}** nữa là được **FREESHIP 0đ** toàn quốc ạ!`);

  return reply(lines.join('\n'), ['Shop có mã giảm giá không?', 'Hướng dẫn đặt hàng'], {
    matchedProducts: items.map(p => p.Sku)
  });
}

function answerSaleCars(products, coupons) {
  const saleList = products
    .filter(p => p.HasDiscount && isOrderable(p))
    .sort((a, b) => (b.DiscountPercent || 0) - (a.DiscountPercent || 0));

  if (!saleList.length) {
    return reply(
      `Dạ hiện tại các mẫu trên kệ đang niêm yết giá chuẩn, nhưng anh/chị vẫn áp được **Voucher giảm trực tiếp** (${coupons.map(c => `**${c.code}**`).join(', ') || 'Freeship'}) cực hời ạ!`,
      ['Shop có mã giảm giá không?', 'Xe nào đang có sẵn?']
    );
  }

  const lines = saleList.slice(0, 6).map(p => {
    const save = Math.max(0, (p.BasePriceBox || p.OldPrice || p.PriceBox) - p.PriceBox);
    const pctTxt = p.DiscountPercent > 0 ? `🔥 **-${p.DiscountPercent}%**` : `🔥 **Tiết kiệm ${formatVnd(save)}**`;
    return `• **[${p.Sku}] ${p.Name}**\n   ${pctTxt}: từ ${formatVnd(p.BasePriceBox || p.OldPrice)} chỉ còn **${formatVnd(p.PriceBox)}** (Box) — ${p.Status === 'pre_order' ? '⏳ Pre-Order' : '✅ Sẵn kho'}`;
  });

  return reply(
    `🔥 **Danh sách ${saleList.length} siêu phẩm 1:64 đang Giảm Giá Trực Tiếp tại Showroom:**\n\n` +
    lines.join('\n\n') +
    `\n\n💡 _Đặc biệt: Giá đã giảm ở trên vẫn được **cộng dồn thêm mã giảm giá Voucher** (như **${coupons[0]?.code || 'MINIGT30K'}**) khi thanh toán nữa đó ạ!_ ✨`,
    [`Tính tiền mẫu ${saleList[0].Sku}`, 'Shop có mã giảm giá không?', 'Xe nào đang có sẵn?'],
    { matchedProducts: saleList.slice(0, 3).map(p => p.Sku) }
  );
}

function answerBudgetCombo(budget, desiredQty, requestedPack, products, coupons) {
  const ready = products.filter(p => {
    if (p.Status !== 'in_stock') return false;
    const pk = effectivePack(p, requestedPack);
    return stockOf(p, pk) > 0;
  }).sort((a, b) => priceOf(a, requestedPack) - priceOf(b, requestedPack));

  if (ready.length < 2) return null;

  const qty = Math.min(Math.max(desiredQty || 2, 2), 3);
  let bestCombo = null;
  let bestSum = 0;

  if (qty === 2) {
    for (let i = 0; i < ready.length; i++) {
      for (let j = i + 1; j < ready.length; j++) {
        const sum = priceOf(ready[i], requestedPack) + priceOf(ready[j], requestedPack);
        if (sum <= budget && sum > bestSum) {
          bestSum = sum;
          bestCombo = [ready[i], ready[j]];
        }
      }
    }
  } else {
    const picked = [];
    let sum = 0;
    for (const p of ready) {
      if (picked.length < qty && sum + priceOf(p, requestedPack) <= budget) {
        picked.push(p);
        sum += priceOf(p, requestedPack);
      }
    }
    if (picked.length >= 2) { bestCombo = picked; bestSum = sum; }
  }

  if (!bestCombo) return null;
  const cHint = bestCouponHint(bestSum, coupons);
  return reply(
    `🎯 Với ngân sách **${formatVnd(budget)}**, Bé Bot ghép được combo **${bestCombo.length} mẫu sẵn hàng** cực hợp lý (bản ${packName(requestedPack || 'box')}):\n\n` +
    bestCombo.map(listLine).join('\n\n') +
    `\n\n• 🧮 Tổng ${bestCombo.length} xe: **${formatVnd(bestSum)}** (dư **${formatVnd(budget - bestSum)}** trong ngân sách!)` +
    (cHint ? `\n• ${cHint}` : '') +
    '\n\n👉 Anh/chị bấm trực tiếp nút **+Box / +Card** trên thẻ xe bên dưới để bỏ giỏ ngay nhé! ✨',
    ['So sánh cái 1 và cái 2', 'Shop có mã giảm giá không?'],
    { matchedProducts: bestCombo.map(p => p.Sku) }
  );
}

function applyFilters(list, ctx) {
  const I = ctx.intents;
  const pack = ctx.pref || 'box';
  let out = list.slice();
  if (I.saleList) out = out.filter(p => p.HasDiscount);
  if (I.instockList && !I.preorderList) out = out.filter(p => p.Status === 'in_stock' && (p.StockBox + p.StockCard) > 0);
  if (I.preorderList) out = out.filter(p => p.Status === 'pre_order');
  if (ctx.price) out = out.filter(p => priceOf(p, pack) >= ctx.price.min && priceOf(p, pack) <= ctx.price.max);
  if (I.cheapest) out.sort((a, b) => priceOf(a, pack) - priceOf(b, pack));
  else if (I.expensive) out.sort((a, b) => priceOf(b, pack) - priceOf(a, pack));
  else if (I.bestSeller) out.sort((a, b) => (b.SoldCount - a.SoldCount) || ((b.StockBox + b.StockCard) - (a.StockBox + a.StockCard)));
  else if (I.newArrival) out.sort((a, b) => (Number(b.IsNew) - Number(a.IsNew)) || (b.ProductId - a.ProductId));
  return out;
}

function answerList(list, ctx, products, fromMemory, coupons) {
  const filtered = applyFilters(list, ctx);
  if (!filtered.length) {
    const why = ctx.price ? `trong tầm giá ${describeRange(ctx.price)}` : 'theo tiêu chí vừa lọc';
    return reply(
      `Dạ ${fromMemory ? 'trong các mẫu vừa xem' : 'dòng xe này'} hiện chưa có mẫu nào ${why} ạ 🥺 Anh/chị tham khảo các mẫu cùng dòng đang có nhé:\n\n${list.slice(0, 4).map(listLine).join('\n')}`,
      ['Xe nào đang có sẵn?', 'Xe dưới 400k'],
      { matchedProducts: list.slice(0, 3).map(x => x.Sku) }
    );
  }
  const shown = filtered.slice(0, 6);
  const more = filtered.length - shown.length;
  let head = fromMemory ? 'Dạ thông tin các mẫu xe vừa nhắc tới ạ:' : `Dạ Bé Bot tìm được **${filtered.length} mẫu** khớp chuẩn yêu cầu của anh/chị ạ:`;
  if (ctx.price) head = `Dạ có **${filtered.length} mẫu** ${describeRange(ctx.price)} (bản ${packName(ctx.pref || 'box')}) ạ:`;
  let msg = `${head}\n\n${shown.map(listLine).join('\n\n')}`;
  if (more > 0) msg += `\n\n…và **${more} mẫu** khác nữa ạ.`;
  msg += '\n\n👉 Bấm vào **mã xe màu đỏ** hoặc **thẻ xe bên dưới** để xem ảnh chi tiết, hoặc nhắn _"so sánh cái 1 và cái 2"_ nhé! ✨';
  msg = appendSecondaryIntents(msg, ctx, coupons);

  const sugg = shown.length >= 2
    ? [`Chi tiết mẫu ${shown[0].Sku}`, 'So sánh cái 1 và cái 2', 'Shop có mã giảm giá không?']
    : [`Tính tiền mẫu ${shown[0].Sku}`, 'Shop có mã giảm giá không?'];
  return reply(msg, sugg, { matchedProducts: shown.map(x => x.Sku) });
}

function answerFilter(products, ctx, coupons) {
  const I = ctx.intents;
  const pack = ctx.pref || 'box';

  if (ctx.price && ctx.price.exactBudget && ctx.qty && ctx.qty >= 2) {
    const comboReply = answerBudgetCombo(ctx.price.exactBudget, ctx.qty, pack, products, coupons);
    if (comboReply) return comboReply;
  }

  if (I.saleList && !ctx.price && !I.preorderList) {
    return answerSaleCars(products, coupons);
  }

  let list = applyFilters(products.filter(p => p.Status !== 'sold_out'), ctx);
  if (!I.cheapest && !I.expensive && !I.bestSeller && !I.newArrival) {
    list.sort((a, b) => priceOf(a, pack) - priceOf(b, pack));
  }

  if (!list.length) {
    if (ctx.price) {
      const mid = ctx.price.max === Infinity ? ctx.price.min : ctx.price.min <= 0 ? ctx.price.max : (ctx.price.min + ctx.price.max) / 2;
      const near = products.filter(isOrderable).sort((a, b) => Math.abs(priceOf(a, pack) - mid) - Math.abs(priceOf(b, pack) - mid)).slice(0, 3);
      return reply(`Dạ tầm giá ${describeRange(ctx.price)} hiện chưa có mẫu khớp hẳn ạ 🥺 Em gửi 3 mẫu có mức giá gần nhất để mình tham khảo nhé:\n\n${near.map(listLine).join('\n\n')}`, ['Xe nào đang có sẵn?'], { matchedProducts: near.map(x => x.Sku) });
    }
    return reply('Dạ hiện chưa có mẫu nào khớp điều kiện lọc này ạ 🥺', ['Xe nào đang có sẵn?']);
  }

  const limit = (I.cheapest || I.expensive || I.bestSeller) && !ctx.price ? 4 : 6;
  let head = 'Dạ đây là các mẫu phù hợp nhất cho anh/chị ạ:';
  if (I.preorderList) head = `⏳ Đang có **${list.length} siêu phẩm Pre-Order** mở nhận cọc giữ suất:`;
  else if (ctx.price) head = `💰 Có **${list.length} mẫu xe** ${describeRange(ctx.price)} (tính theo bản ${packName(pack)}):`;
  else if (I.cheapest) head = '🏷️ Top **mẫu giá mềm dễ tiếp cận nhất** đang có tại Showroom:';
  else if (I.expensive) head = '👑 Top **siêu phẩm sưu tầm giá trị cao nhất** tại Showroom:';
  else if (I.bestSeller) head = '🔥 Top **mô hình bán chạy & được săn đón nhất** tại Showroom:';
  else if (I.newArrival) head = '✨ Các **siêu phẩm mới cập bến** kệ Showroom:';
  else if (I.instockList) head = `✅ Hiện Showroom đang có **${list.length} mẫu sẵn hàng** giao ngay trong ngày:`;

  const shown = list.slice(0, limit);
  let msg = `${head}\n\n${shown.map(listLine).join('\n\n')}`;
  if (list.length > shown.length) msg += `\n\n…cùng **${list.length - shown.length} mẫu** khác trên kệ Showroom ạ.`;
  msg += '\n\n👉 Bấm vào **mã xe** hoặc **thẻ xe bên dưới** để xem ảnh sắc nét & bỏ giỏ nhanh nhé!';
  msg = appendSecondaryIntents(msg, ctx, coupons);
  return reply(msg, [`Chi tiết mẫu ${shown[0].Sku}`, 'So sánh cái 1 và cái 2', 'Xe nào đang giảm giá?'], { matchedProducts: shown.map(x => x.Sku) });
}

function answerGift(products, ctx) {
  const pool = products.filter(p => p.Status === 'in_stock' && (p.StockBox + p.StockCard) > 0);
  const range = ctx.price || { min: 300000, max: 550000 };
  let inRange = pool.filter(p => p.PriceBox >= range.min && p.PriceBox <= range.max);
  if (!inRange.length) inRange = pool;
  inRange.sort((a, b) => (b.StockBox + b.StockCard) - (a.StockBox + a.StockCard));
  const picks = [];
  const usedCat = new Set();
  for (const p of inRange) if (!usedCat.has(p.CategoryName) && picks.length < 3) { picks.push(p); usedCat.add(p.CategoryName); }
  for (const p of inRange) if (!picks.includes(p) && picks.length < 3) picks.push(p);
  if (!picks.length) return reply('Dạ hiện các mẫu sẵn hàng đang tạm hết, anh/chị xem thử xe Pre-Order nhé ạ!', ['Có những mẫu Pre-Order nào?']);
  return reply(
    `🎁 Để **làm quà tặng hoặc bắt đầu chơi 1:64**${ctx.price ? ` (${describeRange(ctx.price)})` : ''}, Bé Bot tuyển chọn 3 mẫu sẵn hàng nổi bật nhất từ 3 phong cách khác nhau:\n\n${picks.map(listLine).join('\n\n')}\n\n` +
    '💡 **Bí quyết chọn quà:** Nếu tặng bạn bè/người yêu, anh/chị chọn **bản Vỉ nhựa (Card)** có bìa tranh Art ép nổi nhìn cực kỳ sang trọng và xịn xò ạ!',
    ['Box và Card khác nhau thế nào?', 'Shop có mã giảm giá không?'],
    { matchedProducts: picks.map(x => x.Sku) }
  );
}

function answerCategories(products) {
  const groups = new Map();
  for (const p of products) {
    const g = groups.get(p.CategoryName) || { total: 0, ready: 0 };
    g.total++;
    if (isOrderable(p)) g.ready++;
    groups.set(p.CategoryName, g);
  }
  const brands = [...new Set(products.map(p => p.Brand))];
  const lines = [...groups.entries()].sort((a, b) => b[1].total - a[1].total)
    .map(([name, g]) => `• **${name}** — ${g.total} mẫu (${g.ready} mẫu đặt được ngay)`);
  return reply(
    `Dạ **${SHOP.name}** chuyên mô hình tĩnh tỷ lệ **1:64 chính hãng** từ các thương hiệu **${brands.join(', ')}** với tổng cộng **${products.length} mẫu** chia theo các dòng:\n\n${lines.join('\n')}\n\nAnh/chị hứng thú dòng nào nhất để Bé Bot mở danh sách kèm giá thực tế ạ? 🏎️`,
    ['Shop có xe đua F1 nào?', 'Xe độ LBWK', 'Porsche khủng long', 'Xe nào đang giảm giá?']
  );
}

function answerCoupons(coupons, userCtx = null) {
  const vipNote = (userCtx && userCtx.isLoggedIn && userCtx.vip)
    ? (userCtx.vip.couponCode
        ? `\n\n👑 **Đặc quyền tài khoản của anh/chị (${userCtx.vip.name}):** Đang mở khóa mã riêng **${userCtx.vip.couponCode}** giảm **${userCtx.vip.discountPercent}%** (tối đa **${formatVnd(userCtx.vip.maxDiscount)}**)${userCtx.vip.canCod ? ' + **Ship COD 100%**' : ''}!`
        : `\n\n👑 **Tài khoản của anh/chị (${userCtx.vip.name}):** Tích lũy đã giao **${formatVnd(userCtx.totalSpent)}** — chỉ cần thêm **${formatVnd(userCtx.vip.needed)}** để lên **${userCtx.vip.nextName}** và mở khóa mã **VIP2 (-2%)**!`)
    : `\n\n👑 Ngoài ra, hội viên tích lũy còn có mã **VIP2 (-2%) → VIP5 (-10%)** và **MIỄN PHÍ SHIP SPX** cho đơn từ **${formatVnd(SHOP.freeShipThreshold)}**!`;

  if (!coupons || !coupons.length) {
    return reply(
      `Dạ hiện tại Showroom đang áp dụng ưu đãi **FREESHIP 0đ toàn quốc** cho mọi đơn hàng từ **${formatVnd(SHOP.freeShipThreshold)}** (phí ship đơn thường cũng chỉ **${formatVnd(SHOP.shippingFee)}**) cùng đặc quyền giảm tới **10%** cho hội viên VIP ạ!${vipNote}`,
      ['Đặc quyền hội viên VIP là gì?', 'Tính tiền giỏ hàng của tôi', 'Xe nào đang giảm giá?']
    );
  }
  const lines = coupons.map(c => {
    const benefit = c.discountType === 'percent'
      ? `Giảm **${c.discountValue}%** (tối đa **${formatVnd(c.maxDiscount)}**)`
      : `Giảm trực tiếp **${formatVnd(c.discountValue)}**`;
    return `• 🎟️ Mã **${c.code}** — ${benefit} cho đơn từ **${formatVnd(c.minOrderAmount)}**\n  _(${c.description})_`;
  });
  return reply(
    `🎉 Dạ hiện Showroom đang có **${coupons.length} mã giảm giá (Voucher)** hoạt động trực tiếp trên hệ thống:\n\n${lines.join('\n\n')}${vipNote}\n\nAnh/chị nhắm mẫu nào (hoặc nhắn _"tính tiền giỏ hàng của tôi"_) để em tính giá áp mã hời nhất luôn nhé! ✨`,
    ['Tính tiền giỏ hàng của tôi', 'Xe nào đang giảm giá?', 'Đặc quyền hội viên VIP là gì?']
  );
}

function answerVipTiers(userCtx = null) {
  let personalHeader = '';
  if (userCtx && userCtx.isLoggedIn && userCtx.vip) {
    const v = userCtx.vip;
    personalHeader =
      `👤 **Hạng hiện tại của anh/chị${userCtx.fullName ? ` (${userCtx.fullName})` : ''}:** **${v.name}**\n` +
      `• Tổng chi tiêu đơn giao thành công: **${formatVnd(userCtx.totalSpent)}**\n` +
      (v.couponCode ? `• Mã ưu đãi riêng đang mở: **${v.couponCode}** (giảm **${v.discountPercent}%**, tối đa **${formatVnd(v.maxDiscount)}**)${v.canCod ? ' · **Đã mở khóa Ship COD 100%** ✅' : ''}\n` : '') +
      (v.nextName ? `• Cột mốc kế tiếp: cần thêm **${formatVnd(v.needed)}** để thăng hạng **${v.nextName}**.\n\n` : '• Anh/chị đã đạt hạng cao nhất tại Showroom! 🏆\n\n');
  }
  return reply(
    personalHeader +
    '👑 **Bảng Hạng Hội Viên VIP & Đặc quyền tại MINI GT STORE BIÊN HÒA:**\n\n' +
    '• **VIP 1 (0đ – 200k):** Tích điểm hội viên & nhận thông báo suất Pre-Order sớm\n' +
    '• **VIP 2 — Collector Bạc (trên 200k):** Mã **VIP2** giảm **2%** tổng đơn (tối đa 50k)\n' +
    '• **VIP 3 — Collector Vàng (trên 500k):** Mã **VIP3** giảm **4%** tổng đơn (tối đa 100k)\n' +
    '• **VIP 4 — Bạch Kim (từ 1.000.000đ):** Mã **VIP4** giảm **7%** (tối đa 150k) + **Mở khóa đặc quyền Ship COD tiền mặt 100%**\n' +
    '• **VIP 5 — Kim Cương (trên 5.000.000đ):** Mã **VIP5** giảm kịch trần **10%** (tối đa 300k) + Ưu tiên giữ xe hiếm!\n\n' +
    '💡 Hệ thống tự động đồng bộ hạng VIP trên mọi thiết bị theo **Tài khoản & Số điện thoại** sau mỗi đơn giao thành công ạ!',
    ['Shop có mã giảm giá không?', 'Kiểm tra đơn hàng của tôi', 'Xe nào đang có sẵn?']
  );
}

function computeAiOrderFinancials(o) {
  const rawStatus = String(o.Status || o.status || 'PENDING').toUpperCase();
  const payMethod = String(o.PaymentMethod || o.paymentmethod || 'COD').toUpperCase();
  const payStatus = String(o.PaymentStatus || o.paymentstatus || 'UNPAID').toUpperCase();
  const total = Number(o.Total ?? o.total ?? 0);
  const shippingFee = Number(o.ShippingFee ?? o.shippingfee ?? 0);
  const subtotal = Number(o.Subtotal ?? o.subtotal ?? Math.max(0, total - shippingFee));
  const note = String(o.Note ?? o.note ?? '');
  const protectorFee = /PROTECT|BẢO VỆ|PVC\s*15K/i.test(note) ? 15000 : 0;
  const productPayable = Math.max(0, total - shippingFee);
  const discountAmount = Math.max(0, subtotal + protectorFee - productPayable);
  const rawDeposit = Number(o.DepositAmount ?? o.depositamount ?? 0);
  const isPartialDeposit = payMethod === 'DEPOSIT' || (rawDeposit > 0 && rawDeposit < productPayable);
  const deposit = isPartialDeposit
    ? (rawDeposit > 0 && rawDeposit <= productPayable ? rawDeposit : Math.round(productPayable * 0.3))
    : 0;
  const qrTransferAmount = payMethod === 'COD' ? 0 : (isPartialDeposit ? deposit : productPayable);
  const remainingProductAmount = (rawStatus === 'CANCELLED' || payStatus === 'PAID')
    ? 0
    : (isPartialDeposit ? Math.max(0, productPayable - deposit) : (payMethod === 'COD' ? productPayable : 0));
  const shippingPayableOnDelivery = (rawStatus === 'DELIVERED' || rawStatus === 'CANCELLED') ? 0 : shippingFee;
  const payableOnDelivery = (rawStatus === 'DELIVERED' || rawStatus === 'CANCELLED')
    ? 0
    : (remainingProductAmount + shippingPayableOnDelivery);
  return {
    rawStatus, payMethod, payStatus, total, shippingFee, subtotal, protectorFee,
    productPayable, discountAmount, isPartialDeposit, deposit, qrTransferAmount,
    remainingProductAmount, shippingPayableOnDelivery, payableOnDelivery
  };
}

function buildOrderProgressBarText(rawStatus) {
  if (rawStatus === 'CANCELLED') return '❌ **Tiến trình:** Đơn hàng đã hủy';
  const steps = [
    { k: 'PENDING', label: 'Đặt đơn' },
    { k: 'CONFIRMED', label: 'Đã xác nhận' },
    { k: 'PREPARING', label: 'Đóng gói 4 lớp' },
    { k: 'SHIPPING', label: 'Đang giao SPX' },
    { k: 'DELIVERED', label: 'Đã nhận xe' }
  ];
  const curIdx = Math.max(0, steps.findIndex(s => s.k === rawStatus));
  const rendered = steps.map((s, idx) => {
    if (idx < curIdx) return `✅ ${s.label}`;
    if (idx === curIdx) return `👉 **[${s.label}]**`;
    return `⚪ ${s.label}`;
  }).join(' → ');
  return `📍 **Tiến trình:** ${rendered}`;
}

function formatSingleOrderSummary(o, detailed = false) {
  const statusMap = {
    PENDING: '⏳ Chờ xác nhận',
    CONFIRMED: '✅ Đã xác nhận đơn',
    PREPARING: '📦 Đang đóng gói chống sốc 4 lớp',
    SHIPPING: '🚚 Đang giao qua SPX Express',
    DELIVERED: '🎉 Đã giao thành công',
    CANCELLED: '❌ Đã hủy'
  };
  const payMap = {
    PAID: '✅ Đã thanh toán đủ 100% tiền hàng',
    PARTIALLY_PAID: '🛡️ Đã cọc 30% giữ suất',
    DEPOSIT_PAID: '🛡️ Đã thanh toán cọc 30%',
    REFUND_PENDING: '⏳ Chờ hoàn tiền',
    REFUNDED: '↩️ Đã hoàn tiền',
    UNPAID: '⏳ Chờ thanh toán',
    PENDING: '⏳ Chờ thanh toán'
  };

  const code = o.OrderCode || o.ordercode;
  const fin = computeAiOrderFinancials(o);
  const st = statusMap[fin.rawStatus] || (o.Status || o.status);
  const pst = fin.payMethod === 'COD' && fin.payStatus === 'UNPAID'
    ? '💵 Thanh toán khi nhận xe (Ship COD)'
    : (payMap[fin.payStatus] || fin.payStatus);

  const itemsSummary = o.ItemsSummary || o.itemssummary || '';
  const fullName = o.FullName || o.fullname || '';
  const phone = o.Phone || o.phone || '';
  const addr = o.Address || o.address || '';
  const regionEta = detectRegionEtaFromAddress(addr);
  const tCode = o.TrackingCode || o.trackingcode;

  let paymentBlock = '';
  if (fin.isPartialDeposit) {
    const depState = (fin.payStatus === 'PARTIALLY_PAID' || fin.payStatus === 'PAID') ? 'đã nhận' : 'chờ quét VietQR';
    paymentBlock =
      `  💳 Tiền hàng Shop: **${formatVnd(fin.productPayable)}** · Cọc 30% cho Shop: **${formatVnd(fin.deposit)}** _(${depState}, không tính phí ship SPX)_\n` +
      `  🚚 **Trả bưu tá SPX khi nhận xe: ${formatVnd(fin.payableOnDelivery)}** _(gồm **${formatVnd(fin.remainingProductAmount)}** tiền hàng còn lại + **${formatVnd(fin.shippingFee)}** phí ship SPX)_`;
  } else if (fin.payMethod === 'COD') {
    paymentBlock =
      `  💵 **Trả bưu tá SPX khi nhận xe (COD): ${formatVnd(fin.payableOnDelivery)}** _(gồm **${formatVnd(fin.productPayable)}** tiền hàng Shop + **${formatVnd(fin.shippingFee)}** phí ship SPX)_`;
  } else {
    const qrState = fin.payStatus === 'PAID' ? 'Shop đã nhận đủ 100%' : 'chờ quét VietQR cho Shop';
    paymentBlock =
      `  💳 Chuyển khoản 100% tiền hàng cho Shop: **${formatVnd(fin.productPayable)}** _(${qrState})_\n` +
      `  🚚 **Trả bưu tá SPX khi nhận xe: ${formatVnd(fin.payableOnDelivery)}** _(${fin.shippingFee > 0 ? `chỉ trả phí ship của SPX Express, tiền hàng 0đ` : 'Miễn phí 0đ'})_`;
  }

  let etaLine = '';
  if (fin.rawStatus === 'DELIVERED') {
    etaLine = '  ✅ Đơn hàng đã được giao thành công tới tay anh/chị!';
  } else if (fin.rawStatus === 'CANCELLED') {
    etaLine = `  ℹ️ Đơn hàng này đã hủy${o.CancelReason || o.cancelreason ? ` (${o.CancelReason || o.cancelreason})` : ''}.`;
  } else if (regionEta) {
    etaLine = `  ⏱️ **Dự kiến giao tới ${regionEta.region}:** khoảng **${regionEta.days}** qua SPX Express *(chưa tính ~1 ngày kiểm seal & bọc chống sốc 4 lớp tại kho Biên Hòa)*.`;
  } else {
    etaLine = '  ⏱️ **Dự kiến SPX Express (từ Biên Hòa):** Miền Nam **1–2 ngày** · Miền Trung **2–3 ngày** · Miền Bắc **3–4 ngày** *(+ ~1 ngày kiểm seal & đóng gói 4 lớp)*.';
  }

  const lines = [
    `• **#${code}** — ${st} · ${pst}`,
    detailed ? `  ${buildOrderProgressBarText(fin.rawStatus)}` : null,
    itemsSummary ? `  🏎️ Mô hình: **${itemsSummary}**` : null,
    detailed && (fullName || addr) ? `  📍 Nhận hàng: **${fullName || 'Khách hàng'}**${phone ? ` (${phone})` : ''}${addr ? ` — ${addr}` : ''}` : null,
    `  💰 Tổng giá trị đơn (Hàng + Ship SPX): **${formatVnd(fin.total)}**`,
    paymentBlock,
    tCode ? `  📦 Mã vận đơn SPX Express: **${tCode}** _(tra cứu tại spx.vn/vi)_` : null,
    etaLine
  ].filter(Boolean);

  return lines.join('\n');
}

function answerLoggedInOrders(userCtx) {
  const caller = userCtx.fullName ? ` **${userCtx.fullName}**` : ' anh/chị';
  if (!userCtx.orders || !userCtx.orders.length) {
    return reply(
      `Dạ em vừa kiểm tra trực tiếp trên tài khoản của${caller} nhưng hiện chưa có đơn hàng nào được ghi nhận ạ 😊\n\n` +
      '• Nếu anh/chị vừa đặt bằng SĐT khác, hãy gõ **mã đơn #MGT-...** hoặc _"kiểm tra đơn 09xxxxxxxx"_ để em tra cứu ngay.\n' +
      '• Hoặc anh/chị có thể xem các mẫu đang Sale giảm giá để lên đơn đầu tiên nhé!',
      ['Xe nào đang giảm giá?', 'Hướng dẫn đặt hàng', 'Shop có mã giảm giá không?']
    );
  }
  const latestCode = userCtx.orders[0].OrderCode || userCtx.orders[0].ordercode;
  return reply(
    `📦 **Đơn hàng đồng bộ trực tiếp trên tài khoản của${caller} (${userCtx.orders.length} đơn gần nhất):**\n\n` +
    userCtx.orders.map((ord, idx) => formatSingleOrderSummary(ord, idx === 0)).join('\n\n') +
    '\n\n💡 _Anh/chị có thể bấm vào mã đơn hoặc hỏi tiếp em về thời gian giao, số tiền trả bưu tá SPX, sửa địa chỉ nhận hàng; hoặc nhắn **"gặp admin"** nếu cần Quản trị viên hỗ trợ riêng ạ!_',
    [
      latestCode ? `Kiểm tra chi tiết đơn #${latestCode}` : 'Khi nhận xe tôi cần trả bao nhiêu?',
      'Khi nhận xe tôi cần trả bao nhiêu?',
      'Đổi địa chỉ nhận hàng được không?',
      'Gặp Admin hỗ trợ trực tiếp'
    ]
  );
}

function answerMyCart(userCtx, products, coupons) {
  if (!userCtx || !userCtx.isLoggedIn) {
    return reply(
      '🔐 Dạ anh/chị vui lòng **đăng nhập tài khoản** để Bé Bot đọc giỏ hàng đồng bộ đám mây và tính mã giảm giá hời nhất cho mình nhé!\n\n' +
      '_(Hoặc anh/chị nhắn trực tiếp tên mẫu xe, VD: "tính tiền Roxy bản Card" để em báo giá liền ạ!)_',
      ['Xe nào đang giảm giá?', 'Shop có mã giảm giá không?', 'Hướng dẫn đặt hàng']
    );
  }
  const rawItems = Array.isArray(userCtx.cartItems) ? userCtx.cartItems : [];
  if (!rawItems.length) {
    return reply(
      `🛍️ Giỏ hàng đồng bộ trên tài khoản của anh/chị hiện đang trống ạ!\n\nAnh/chị có thể bấm **+Box / +Card** trên thẻ xe bất kỳ (trên Laptop hay Điện thoại đều tự động lưu đồng bộ) rồi hỏi lại em nhé! ✨`,
      ['Xe nào đang giảm giá?', 'Xe nào đang có sẵn?', 'Shop có mã giảm giá không?']
    );
  }

  const byId = new Map(products.map(p => [Number(p.ProductId), p]));
  let subtotal = 0;
  let depositSub = 0;
  let hasPreOrder = false;
  const matchedSkus = [];
  const lines = [];

  for (const item of rawItems) {
    const pid = Number(item.productId || item.id);
    const qty = Math.max(1, Number(item.quantity) || 1);
    const reqPack = String(item.packType || 'box').toLowerCase() === 'card' ? 'card' : 'box';
    const liveProd = byId.get(pid);
    if (liveProd) {
      const pack = effectivePack(liveProd, reqPack);
      const unit = priceOf(liveProd, pack);
      const lineTotal = unit * qty;
      subtotal += lineTotal;
      if (liveProd.Status === 'pre_order') {
        hasPreOrder = true;
        depositSub += depositOfProduct(liveProd, lineTotal);
      }
      if (matchedSkus.length < 3) matchedSkus.push(liveProd.Sku);
      lines.push(`• ${qty} × **[${liveProd.Sku}] ${liveProd.Name}** (${packName(pack)}): **${formatVnd(lineTotal)}**`);
    } else {
      const fallbackPrice = Math.max(0, Number(item.price) || 0);
      subtotal += fallbackPrice * qty;
      lines.push(`• ${qty} × **${item.name || `#${pid}`}** (${packName(reqPack)}): **${formatVnd(fallbackPrice * qty)}**`);
    }
  }

  const ship = subtotal >= SHOP.freeShipThreshold ? 0 : SHOP.shippingFee;
  let bestCode = null;
  let bestSave = 0;
  for (const c of (coupons || [])) {
    const s = calcCouponSaving(c, subtotal);
    if (s > bestSave) { bestSave = s; bestCode = c.code; }
  }
  if (userCtx.vip && userCtx.vip.couponCode) {
    const vipSave = Math.min(roundK((subtotal * userCtx.vip.discountPercent) / 100), userCtx.vip.maxDiscount || Infinity);
    if (vipSave > bestSave) { bestSave = vipSave; bestCode = userCtx.vip.couponCode; }
  }

  const out = [
    `🛍️ **Giỏ hàng đồng bộ hiện tại của anh/chị (${rawItems.length} dòng sản phẩm):**`,
    '',
    ...lines,
    '',
    `• Tạm tính tiền xe: **${formatVnd(subtotal)}**`,
    `• Phí ship SPX Express: ${ship === 0 ? '**0đ (FREESHIP)** 🎉' : `**${formatVnd(ship)}** _(thêm ${formatVnd(SHOP.freeShipThreshold - subtotal)} để Freeship)_`}`
  ];
  if (bestCode && bestSave > 0) {
    out.push(`• 🎟️ **Mã khuyên dùng hời nhất:** nhập **${bestCode}** giảm ngay **-${formatVnd(bestSave)}** → Tổng thanh toán cả ship chỉ còn **${formatVnd(Math.max(0, subtotal - bestSave) + ship)}**!`);
  } else {
    out.push(`• 💰 **Tổng thanh toán tạm tính: ${formatVnd(subtotal + ship)}**`);
  }
  if (hasPreOrder && depositSub > 0) {
    out.push(`• ⏳ Phần cọc giữ suất cho mẫu Pre-Order trong giỏ: **${formatVnd(depositSub)}**.`);
  }

  return reply(out.join('\n'), ['Hướng dẫn đặt hàng', 'Shop có mã giảm giá không?', 'Kiểm tra đơn hàng của tôi'], { matchedProducts: matchedSkus });
}

function answerOrderLookup(lookup, ctx = null) {
  if (!lookup.found) {
    const label = lookup.mode === 'phone' ? `số điện thoại **${lookup.query}**` : `mã đơn **#${lookup.query}**`;
    return reply(
      `Dạ em vừa tra trực tiếp trên CSDL nhưng chưa tìm thấy đơn hàng nào khớp với ${label} ạ 🥺\n` +
      '• Anh/chị kiểm tra lại mã đơn (VD: _#MGT-2026..._) hoặc đăng nhập đúng tài khoản đặt hàng rồi hỏi _"đơn hàng của tôi"_ nhé.\n' +
      '• Nếu cần Admin hỗ trợ trực tiếp ngay, anh/chị chỉ cần nhắn _"gặp admin"_ hoặc gọi/Zalo **0981.903.400** để Quản trị viên tiếp quản liền ạ!',
      ['Kiểm tra đơn hàng của tôi', 'Gặp Admin hỗ trợ đơn hàng', 'Bao lâu nhận được xe?']
    );
  }
  if (lookup.mode === 'phone') {
    const topCode = lookup.orders[0] ? (lookup.orders[0].OrderCode || lookup.orders[0].ordercode) : '';
    return reply(
      `📦 **Tìm thấy ${lookup.orders.length} đơn hàng gần nhất của SĐT ${lookup.query}:**\n\n` +
      lookup.orders.map((ord, idx) => formatSingleOrderSummary(ord, idx === 0)).join('\n\n') +
      '\n\n💡 _(Anh/chị có thể bấm vào mã đơn để xem chi tiết, hoặc nhắn "gặp admin" nếu cần hỗ trợ riêng nhé!)_',
      [
        topCode ? `Kiểm tra chi tiết đơn #${topCode}` : 'Bao lâu nhận được xe?',
        'Khi nhận xe tôi cần trả bao nhiêu?',
        'Gặp Admin Showroom'
      ]
    );
  }

  const o = lookup.orders[0];
  const code = o.OrderCode || o.ordercode;
  const fin = computeAiOrderFinancials(o);
  const addr = o.Address || o.address || '';
  const orderRegionEta = detectRegionEtaFromAddress(addr);
  const t = ctx && ctx.text ? ctx.text : '';
  const askedRegionEta = detectRegionEtaFromAddress(t);
  const regionEta = askedRegionEta || orderRegionEta;

  let directFocus = '';
  if (/(huy don)/.test(t)) {
    if (fin.rawStatus === 'PENDING' && fin.payStatus === 'UNPAID') {
      directFocus = `✅ **Hướng dẫn hủy đơn #${code}:** Đơn hiện đang ở trạng thái **Chờ xác nhận (chưa thanh toán)** — anh/chị có thể mở mục **Đơn hàng của tôi (Đơn SPX)** và bấm nút **🚫 Hủy đơn** để hủy ngay lập tức và hoàn tồn kho tự động ạ!\n\n`;
    } else if (fin.rawStatus === 'CANCELLED') {
      directFocus = `ℹ️ Đơn hàng **#${code}** đã được hủy trên hệ thống rồi ạ.\n\n`;
    } else {
      directFocus = `⚠️ Đơn hàng **#${code}** hiện đã chuyển sang trạng thái **${fin.rawStatus}**${fin.payStatus !== 'UNPAID' ? ' và đã ghi nhận thanh toán' : ''}. Để hủy/hoàn tiền an toàn, anh/chị bấm nút **"Gặp Admin hỗ trợ đơn #${code}"** bên dưới để Quản trị viên xử lý trực tiếp ngay nhé!\n\n`;
    }
  } else if (/(doi dia chi|sua dia chi|doi so dien thoai|sua so dien thoai)/.test(t)) {
    if (!['SHIPPING', 'DELIVERED', 'CANCELLED'].includes(fin.rawStatus)) {
      directFocus = `✏️ **Đổi địa chỉ / SĐT cho đơn #${code}:** Đơn chưa bàn giao bưu cục nên anh/chị có thể mở ngay **Đơn hàng của tôi (Đơn SPX)** → bấm nút **✏️ Sửa địa chỉ** trên thẻ đơn **#${code}** để cập nhật tức thì ạ!\n\n`;
    } else {
      directFocus = `🚚 Đơn **#${code}** đã bàn giao vận chuyển SPX nên hệ thống khóa sửa tự động. Anh/chị bấm **"Gặp Admin hỗ trợ đơn #${code}"** bên dưới để Admin điều phối bưu cục giúp mình nhé!\n\n`;
    }
  } else if (/(khi nhan xe|khi nhan hang|nhan xe tra|nhan hang tra|tra cho shipper|tra cho buu ta|con phai tra|con lai bao nhieu|can thanh toan|sao tien coc|tinh coc|tien ship|phi ship)/.test(t)) {
    if (fin.rawStatus === 'DELIVERED' || fin.rawStatus === 'CANCELLED') {
      directFocus = `💰 **Chi tiết thanh toán đơn #${code}:** Đơn đã kết thúc nên số tiền cần trả thêm khi nhận hàng là **0đ** ạ.\n\n`;
    } else if (fin.isPartialDeposit) {
      directFocus =
        `💰 **Giải thích chi tiết số tiền đơn #${code}:**\n` +
        `• Tiền hàng của Shop: **${formatVnd(fin.productPayable)}** _(Cọc 30% chỉ tính trên tiền hàng = **${formatVnd(fin.deposit)}**, tuyệt đối không cộng phí ship SPX vào tiền cọc)_\n` +
        `• Tiền hàng còn lại (70%): **${formatVnd(fin.remainingProductAmount)}**\n` +
        `• Phí vận chuyển của đơn vị SPX Express: **${formatVnd(fin.shippingFee)}**\n` +
        `👉 **Tổng cần trả cho bưu tá SPX khi nhận xe là: ${formatVnd(fin.payableOnDelivery)}** ạ!\n\n`;
    } else if (fin.payMethod === 'COD') {
      directFocus =
        `💰 **Số tiền thanh toán khi nhận xe đơn #${code}:**\n` +
        `• Tiền hàng của Shop: **${formatVnd(fin.productPayable)}** + Phí ship của SPX Express: **${formatVnd(fin.shippingFee)}**\n` +
        `👉 **Tổng trả cho bưu tá SPX khi nhận xe: ${formatVnd(fin.payableOnDelivery)}** ạ!\n\n`;
    } else {
      directFocus =
        `💰 **Chi tiết thanh toán đơn #${code}:**\n` +
        `• Chuyển khoản VietQR cho Shop (100% tiền hàng): **${formatVnd(fin.productPayable)}** _(${fin.payStatus === 'PAID' ? 'Shop đã nhận đủ' : 'chờ quét mã VietQR'})_\n` +
        `• Phí ship của đơn vị SPX Express: **${formatVnd(fin.shippingFee)}**\n` +
        `👉 **Khi nhận xe anh/chị chỉ trả cho bưu tá SPX đúng ${formatVnd(fin.payableOnDelivery)}** (tiền hàng còn lại 0đ) ạ!\n\n`;
    }
  } else if (lookup.mode === 'followup' && /(bao lau|khi nao|may ngay|ngay giao|thoi gian giao)/.test(t)) {
    if (askedRegionEta) {
      directFocus = `⏱️ **Thời gian giao SPX Express tới ${askedRegionEta.region}:** Khoảng **${askedRegionEta.days}** kể từ khi bàn giao SPX Express *(chưa tính ~1 ngày kiểm seal & bọc chống sốc 4 lớp tại kho Biên Hòa)* ạ!\n\n`;
    } else if (orderRegionEta) {
      directFocus = `⏱️ **Thời gian giao dự kiến đơn #${code} (${orderRegionEta.region}):** Khoảng **${orderRegionEta.days}** kể từ khi bàn giao SPX Express *(chưa tính ~1 ngày kiểm seal & bọc chống sốc 4 lớp tại kho Biên Hòa)* ạ!\n\n`;
    } else {
      directFocus = `⏱️ **Thời gian giao SPX Express đơn #${code}:** Miền Nam **1–2 ngày** · Miền Trung **2–3 ngày** · Miền Bắc **3–4 ngày** *(chưa tính ~1 ngày đóng gói 4 lớp chống sốc tại kho Biên Hòa)* ạ!\n\n`;
    }
  }

  const headerTitle = directFocus
    ? `📦 **Thông tin trực tiếp đơn hàng #${code}:**\n`
    : `📦 **Chi tiết & Tiến trình đơn hàng #${code} (dữ liệu thời gian thực):**\n\n`;

  const supportFooter =
    `\n\n🤝 **Anh/chị cần Bé Bot hỗ trợ gì thêm về đơn #${code} không ạ?**\n` +
    `_(Em có thể giải đáp ngay số tiền trả bưu tá SPX, thời gian giao theo khu vực, cách đổi địa chỉ nhận hàng; hoặc nhắn **"gặp admin"** để kết nối Quản trị viên trực tiếp!)_`;

  return reply(
    directFocus + headerTitle + formatSingleOrderSummary(o, true) + supportFooter,
    [
      'Khi nhận xe tôi cần trả bao nhiêu?',
      'Bao lâu giao tới địa chỉ của tôi?',
      'Đổi địa chỉ nhận hàng được không?',
      `Gặp Admin hỗ trợ đơn #${code}`
    ]
  );
}

const KNOWLEDGE = {
  botIdentity: (opts) => {
    const caller = opts.customerName && !/khach hang/i.test(cleanText(opts.customerName)) ? ` **${opts.customerName}**` : ' anh/chị';
    return reply(
      `Dạ em tên là **Bé Bot Săn Xe 1:64** 🤖💕 — Trợ lý AI thông minh thế hệ mới trực 24/7 của **${SHOP.name}** (website được sáng tạo bởi hai bạn **Đỗ Quốc Thịnh & Nguyễn Đình Nam**).\n\n` +
      `Chào${caller} nha! Dữ liệu của em được **đồng bộ thời gian thực 100%** với kho xe, giỏ hàng đa thiết bị, đơn vận chuyển SPX (**${formatVnd(SHOP.shippingFee)}**), hạng VIP và bảng mã Voucher của Showroom ạ! ✨`,
      ['Ai là người tạo web này?', 'Xe nào đang giảm giá?', 'Shop có mã giảm giá không?']
    );
  },
  botCapability: () => reply(
    'Dạ **Bé Bot Săn Xe 1:64** có thể hỗ trợ anh/chị siêu tốc các việc sau ạ:\n\n' +
    '1️⃣ **Tra cứu xe, ảnh Box/Card & giá Sale thật 100%:** Hỏi tên xe, F1, LBWK, Porsche khủng long, xe đang giảm giá...\n' +
    '2️⃣ **Đọc Giỏ hàng đồng bộ & Tìm mã hời nhất:** Nhắn _"tính tiền giỏ hàng của tôi"_ hoặc _"áp mã MINIGT30K cho Roxy"_\n' +
    '3️⃣ **Ghép Combo theo ngân sách:** VD nhắn _"có 800k mua được 2 xe nào?"_\n' +
    '4️⃣ **Tra cứu đơn hàng & Hạng VIP tự động:** Nhắn _"đơn hàng của tôi bao lâu tới?"_, _"hạng VIP của tôi"_, hoặc gõ mã _MGT-..._\n' +
    '5️⃣ **Kết nối Admin thông minh:** Nhắn _"gặp admin"_ bất cứ lúc nào để Quản trị viên trả lời trực tiếp trên mọi thiết bị! 🚀',
    ['Tính tiền giỏ hàng của tôi', 'Kiểm tra đơn hàng của tôi', 'Xe nào đang giảm giá?']
  ),
  smallTalk: (ctx) => {
    const t = ctx.text;
    if (/thong minh|gioi|de thuong|cute|dang yeu|hay qua|xin qua/.test(t)) {
      return reply('Hihi Bé Bot cảm ơn anh/chị nhiều lắm ạ! 🥰 Được khen là em có thêm 200% năng lượng để săn xe đẹp giá hời cho anh/chị luôn đó! Mình đang ngắm mẫu nào để em tư vấn tiếp nè? ✨', ['Xe nào đang giảm giá?', 'Shop có mã giảm giá không?']);
    }
    if (/may tuoi|bao nhieu tuoi/.test(t)) {
      return reply('Dạ em sinh năm 2026 cùng lúc hai anh **Thịnh & Nam** xây dựng Showroom số này, nhưng kiến thức về thế giới xe mô hình 1:64 của em thì dày dặn lắm nha! 😄🏎️', ['Ai là người tạo web này?', 'Xe nào đang có sẵn?']);
    }
    return reply('Dạ hôm nay Bé Bot vẫn tràn đầy năng lượng, trực Showroom 24/7 chờ tư vấn siêu xe cho anh/chị đây ạ! 💪✨ Hôm nay anh/chị thích ngắm xe đua F1, Porsche khủng long hay xe đang Sale giảm giá nè?', ['Xe nào đang giảm giá?', 'Xe đua F1', 'Porsche khủng long']);
  },
  boxcard: () => reply(
    'Dạ hai phiên bản đóng gói chuẩn hãng khác nhau như sau ạ:\n\n' +
    '📦 **Bản Hộp giấy (Paper Box)**\n' +
    '• Mức giá tiết kiệm hơn khoảng 40.000đ – 70.000đ\n' +
    '• Hộp giấy nhỏ gọn nguyên seal, dễ mở lấy xe ra cầm ngắm, chụp ảnh sa bàn hoặc trưng tủ mica.\n\n' +
    '🛡️ **Bản Vỉ nhựa (Blister Card)**\n' +
    '• Xe nằm trong khay nhựa trong suốt ép kín cùng **bìa tranh Art sưu tầm độc quyền**\n' +
    '• Cực đẹp để treo tường trưng bày nguyên vỉ, làm quà tặng sang trọng và giữ giá trị sưu tầm lâu dài.\n\n' +
    '👉 _Tóm gọn:_ Thích lấy xe ra ngắm chọn **Box** · Thích treo đẹp/làm quà/giữ nguyên seal chọn **Card** ạ! 💕',
    ['Xe dưới 400k', 'Gợi ý quà tặng', 'Shop có mã giảm giá không?']
  ),
  materialSpec: () => reply(
    '🔧 **Thông số kỹ thuật chuẩn của mô hình 1:64 tại Showroom:**\n\n' +
    '• **Chất liệu:** Thân xe (Body) và gầm xe đúc **hợp kim kẽm (Die-cast Metal)** cầm đầm tay, nước sơn tĩnh điện nhiều lớp sắc nét.\n' +
    '• **Bánh xe:** **100% lốp cao su thật** có vân lốp chi tiết, trục bánh lăn trơn tru êm ái.\n' +
    '• **Chi tiết ngoại thất:** Đèn pha nhựa trong suốt gắn rời (không phải sơn giả), gương chiếu hậu cao su dẻo chống gãy (đặc trưng của MINI GT).\n' +
    '• **Cơ cấu mở nắp capo:** Dòng **MINI GT** đúc liền khối để giữ khe cửa siêu khít chuẩn tỉ lệ thật; riêng các mẫu **Pop Race** (như Top Secret Supra / Huracán STO / Skyline R32) có **nắp capo mở được** khoe khoang máy cực đỉnh ạ! 🔥',
    ['Xem các mẫu Pop Race', 'Xe nào đang có sẵn?']
  ),
  scaleSize: () => reply(
    '📏 **Kích thước thực tế của mô hình tỷ lệ 1:64:**\n\n' +
    '• Chiều dài trung bình khoảng **7cm – 8cm**, rộng khoảng **3cm** (nhỏ hơn xe thật đúng 64 lần — nằm gọn vừa vặn trong lòng bàn tay).\n' +
    '• Đây là tỷ lệ "vàng" được giới sưu tầm ưa chuộng nhất vì vừa đủ độ chi tiết tinh xảo (tem đấu, phanh đĩa, lốp cao su, nội thất), vừa dễ trưng bày hàng chục chiếc trên bàn làm việc hoặc kệ mica ạ! ✨',
    ['Xe nào đang có sẵn?', 'Box và Card khác nhau thế nào?']
  ),
  chaseAsk: () => reply(
    '💎 **Secret Chase trong thế giới 1:64 là gì?**\n\n' +
    '• **Chase** là phiên bản **siêu giới hạn (Limited Secret)** được hãng sản xuất ngẫu nhiên cài vào các thùng hàng nguyên đai (thường tỷ lệ chỉ **1/24** hoặc **1/48** xe thường).\n' +
    '• Đặc điểm nhận diện: Thân xe để màu kim loại mộc (**Raw Metal**), mạ **Chrome đặc biệt**, hoặc mâm/nội thất đổi màu độc bản.\n' +
    '• Tại shop, các mẫu **Pop Race Top Secret Chrome** ([PR640325], [MG1132]) cũng sở hữu lớp sơn mạ Chrome bóng gương cực kỳ nổi bật chẳng kém bản Chase ạ!',
    ['Chi tiết mẫu PR640325', 'Chi tiết mẫu MG1132']
  ),
  careTip: () => reply(
    '🧼 **Bí kíp bảo quản mô hình 1:64 bền đẹp không lo rôm sơn:**\n\n' +
    '1️⃣ Tránh ánh nắng gắt chiếu trực tiếp và nơi ẩm thấp (nên đặt 1 gói hút ẩm nhỏ trong tủ trưng bày).\n' +
    '2️⃣ Dùng **cọ trang điểm lông mềm** hoặc bóng thổi bụi để vệ sinh nhẹ nhàng, tránh dùng cồn/hóa chất mạnh lau lên tem decal.\n' +
    '3️⃣ Trưng trong **hộp mica trong suốt** hoặc giữ nguyên vỉ Blister Card để xe luôn bóng mới như ngày đầu khui hộp ạ! 🛡️',
    ['Xe nào đang có sẵn?', 'Box và Card khác nhau thế nào?']
  ),
  warranty: () => reply(
    '🛡️ **Chính sách Đảm bảo & Đổi trả tại MINI GT STORE BIÊN HÒA:**\n\n' +
    '• **Cam kết 100% nguyên seal chính hãng**, kiểm tra kỹ ngoại quan hộp/vỉ và bọc **chống sốc 4 lớp** trước khi giao.\n' +
    '• Khi nhận hàng, anh/chị vui lòng **quay video mở kiện hàng (unbox)**. Nếu phát sinh lỗi do vận chuyển (bể vỉ, móp nặng) hoặc giao nhầm mẫu, Showroom hỗ trợ **đổi mới / hoàn tiền 100%** nhanh chóng!\n' +
    '• Nếu có đơn hàng đang cần bảo hành thực tế, anh/chị chỉ cần nhắn tình trạng tại đây để Admin xử lý ngay ạ.',
    ['Phí ship thế nào?', 'Xe nào đang có sẵn?']
  ),
  accountHelp: () => reply(
    '👤 **Hướng dẫn Tài khoản & Hội viên VIP trên Website:**\n\n' +
    '• Bấm biểu tượng **Đăng nhập / Tài khoản** ở góc trên bên phải màn hình để đăng ký hoặc đăng nhập nhanh (hỗ trợ cả **Google** và xác thực **OTP qua Gmail**).\n' +
    '• Nếu quên mật khẩu, chọn **"Quên mật khẩu"** → hệ thống gửi mã OTP 6 số trực tiếp về Gmail để đặt lại mật khẩu mới trong 30 giây.\n' +
    '• Tích lũy mua sắm trên tài khoản giúp tự động thăng hạng **VIP 1 → VIP 5** (giảm thêm tới **10%** & mở khóa Ship COD từ VIP 4) ạ!',
    ['Đặc quyền hội viên VIP là gì?', 'Xe nào đang có sẵn?']
  ),
  preorder: () => reply(
    `⏳ **Quy trình đặt cọc xe Pre-Order chuẩn an toàn tại Showroom:**\n\n` +
    `1️⃣ Đặt cọc trước **${Math.round(SHOP.depositRate * 100)}%** giá trị xe qua mã **VietQR tự động** để giữ suất phát hành giới hạn.\n` +
    '2️⃣ Hệ thống gửi ngay **Biên nhận xác nhận cọc điện tử về Gmail** của anh/chị.\n' +
    '3️⃣ Ngay khi xe cập bến Showroom Biên Hòa, hệ thống thông báo để anh/chị thanh toán phần còn lại và nhận xe nguyên seal sớm nhất!\n\n' +
    'Anh/chị muốn xem mẫu Pre-Order nào đang mở cọc không ạ?',
    ['Có những mẫu Pre-Order nào?', 'Xe nào đang có sẵn?']
  ),
  shipping: () => reply(
    `🚚 **Thời gian Giao hàng SPX Express & Quy cách Đóng gói (từ Kho Biên Hòa, Đồng Nai):**\n\n` +
    `📍 **Thời gian giao hàng dự kiến theo từng khu vực:**\n` +
    `• 🏁 **Miền Nam** (TP.HCM, Đồng Nai, Bình Dương, Tây Nam Bộ...): **1 – 2 ngày**\n` +
    `• ⚡ **Miền Trung** (Đà Nẵng, Huế, Quảng Nam, Nha Trang, Bình Định...): **2 – 3 ngày**\n` +
    `• 🚀 **Miền Bắc** (Hà Nội, Hải Phòng, Quảng Ninh, các tỉnh phía Bắc...): **3 – 4 ngày**\n` +
    `*(Lưu ý: Thời gian trên là hành trình vận chuyển của bưu tá SPX Express, chưa bao gồm thời gian Shop kiểm tra mô hình xe nguyên seal và đóng gói bảo vệ khoảng 1 ngày hoặc trong ngày nếu đặt sớm)*\n\n` +
    `📦 **Phí ship & Quy chuẩn đóng gói bảo vệ collector:**\n` +
    `• **Phí ship đồng giá toàn quốc:** chỉ **${formatVnd(SHOP.shippingFee)}** — đặc biệt **FREESHIP 0đ** cho đơn từ **${formatVnd(SHOP.freeShipThreshold)}**!\n` +
    `• **Bảo vệ tối đa:** Bọc xốp nổ chống sốc 4 lớp + Hộp carton cứng + Dán băng keo niêm phong "Hàng dễ vỡ / Mô hình sưu tầm", bảo vệ nguyên vẹn góc hộp giấy & vỉ card sưu tầm 100%.\n\n` +
    `📞 **Cần hỗ trợ đơn hàng hoặc gặp Admin trực tiếp?**\n` +
    `• Anh/chị chỉ cần nhắn tin có chữ **"gặp admin"** hoặc gọi/Zalo **${SHOP.hotline}** (Đỗ Quốc Thịnh) để Quản trị viên tiếp quản và hỗ trợ tức thì ạ!`,
    ['Đơn hàng của tôi bao lâu tới?', 'Shop có mã giảm giá không?', 'Gặp Admin hỗ trợ trực tiếp']
  ),
  payment: () => reply(
    `💳 **Các hình thức thanh toán minh bạch tại ${SHOP.name}:**\n\n` +
    `• **Chuyển khoản VietQR 100% tiền hàng (Khuyên dùng):** Quét mã QR (${SHOP.bankName} — **${SHOP.bankAccountNo}** · **${SHOP.bankAccountName}**) chỉ chuyển **đúng 100% tiền hàng cho Shop**, còn phí vận chuyển **${formatVnd(SHOP.shippingFee)}** anh/chị thanh toán riêng cho bưu tá **SPX Express** khi nhận xe (Freeship 0đ cho đơn từ **${formatVnd(SHOP.freeShipThreshold)}**).\n` +
    `• **Đặt cọc ${Math.round(SHOP.depositRate * 100)}% + COD phần còn lại:** Mức cọc **30%** chỉ tính trên **tiền hàng của Shop** (tuyệt đối không tính trên phí ship SPX). Khi nhận xe, anh/chị thanh toán **70% tiền hàng còn lại + ${formatVnd(SHOP.shippingFee)} phí ship** cho bưu tá SPX.\n` +
    '• **Thanh toán khi nhận hàng (Ship COD 100%):** Đặc quyền mở khóa tự động cho thành viên **VIP 4 trở lên** (đã tích lũy giao thành công từ **1.000.000đ** trên hệ thống) ạ!',
    ['Đặc quyền hội viên VIP là gì?', 'Shop có mã giảm giá không?', 'Hướng dẫn đặt hàng']
  ),
  contact: () => reply(
    `📍 **Thông tin liên hệ ${SHOP.name}:**\n\n` +
    `• **Địa chỉ Showroom:** ${SHOP.address}\n` +
    `• **Giờ mở cửa:** ${SHOP.hours}\n` +
    `• **Zalo / Hotline trực tiếp:** **${SHOP.hotline}** _(anh/chị bấm **icon Zalo** nằm ngay bên phải Bé Bot ở góc dưới để chat Zalo trực tiếp nhé!)_\n` +
    `• **Email hỗ trợ:** ${SHOP.email}\n\n` +
    'Rất hân hạnh được đón anh/chị ghé ngắm dàn xe thật trên sa bàn ạ! 🏁',
    ['Ai là người tạo web này?', 'Xe nào đang có sẵn?']
  ),
  authentic: () => reply(
    '✅ **Cam kết 100% Bản quyền Chính hãng:**\n\n' +
    'Toàn bộ mô hình tại Showroom đều được phân phối chính ngạch từ **MINI GT (TSM-Model)** và **Pop Race** — đầy đủ tem chống giả Hologram bản quyền của hãng sản xuất xe thật (Porsche, Lamborghini, Red Bull Racing, Aston Martin, Liberty Walk...), nguyên seal 100% chưa khui ạ! 🛡️',
    ['Xe nào đang có sẵn?', 'Chính sách bảo hành thế nào?']
  ),
  howToOrder: (coupons = []) => {
    const voucherExamples = coupons.length ? coupons.slice(0, 2).map(c => `**${c.code}**`).join(', ') : '**VIP2 → VIP5**';
    return reply(
      '🛒 **Quy trình 4 bước đặt xe chuẩn & nhanh nhất trên Website:**\n\n' +
      '1️⃣ **Chọn xe & Quy cách:** Bấm vào thẻ xe chọn **📦 Bản Hộp (Box)** hoặc **🛡️ Bản Vỉ (Card)** _(ảnh sản phẩm tự động chuyển đúng ảnh Box/Card thật)_ → bấm **Thêm vào giỏ** hoặc **Mua ngay**.\n' +
      `2️⃣ **Kiểm tra Giỏ hàng & Áp Voucher:** Mở **Giỏ hàng** _(đồng bộ tự động trên cả Laptop & Điện thoại)_ → bấm **Tiến Hành Mua Hàng** → chọn mã giảm giá (${voucherExamples}).\n` +
      `3️⃣ **Chọn Giao nhận & Thanh toán:**\n` +
      `   • Giao tận nơi **SPX Express** (**${formatVnd(SHOP.shippingFee)}**, Freeship từ **${formatVnd(SHOP.freeShipThreshold)}**), **Gom đơn Box Saver (0đ)** hoặc **Nhận tại Showroom (0đ)**.\n` +
      `   • Quét **VietQR PayOS tự động** (xác nhận đơn ngay trong vài giây), đặt cọc **${Math.round(SHOP.depositRate * 100)}%** cho xe Pre-Order, hoặc **Ship COD 100%** (từ **VIP 4+**).\n` +
      '4️⃣ **Theo dõi hành trình:** Biên nhận điện tử gửi ngay về **Gmail**; anh/chị xem mục **Đơn hàng của tôi (Đơn SPX)** hoặc hỏi thẳng Bé Bot _"kiểm tra đơn hàng của tôi"_ bất cứ lúc nào ạ!',
      ['Tính tiền giỏ hàng của tôi', 'Shop có mã giảm giá không?', 'Xe nào đang giảm giá?']
    );
  },
  tracking: () => reply(
    '📦 **Cách tra cứu đơn hàng cực nhanh ngay trong khung chat:**\n\n' +
    '• **Cách 1 (Đã đăng nhập):** Chỉ cần nhắn _"kiểm tra đơn hàng của tôi"_, Bé Bot tự động lấy danh sách đơn, trạng thái thanh toán và thời gian giao SPX theo đúng tài khoản của anh/chị!\n' +
    '• **Cách 2 (Theo Mã đơn / SĐT):** Gõ trực tiếp **Mã đơn hàng** (VD: _MGT-2026..._) hoặc _"kiểm tra đơn 09xxxxxxxx"_.\n' +
    '• **Cách 3:** Mở mục **Đơn hàng của tôi (Đơn SPX)** trên thanh điều hướng.\n\n' +
    'Nếu cần hỗ trợ gấp, anh/chị nhắn _"gặp admin"_ để Quản trị viên xử lý trực tiếp nhé ạ!',
    ['Kiểm tra đơn hàng của tôi', 'Gặp Admin Showroom', 'Xe nào đang có sẵn?']
  )
};

function answerGreeting(products, coupons, opts) {
  const ready = products.filter(p => p.Status === 'in_stock' && (p.StockBox + p.StockCard) > 0).length;
  const saleCnt = products.filter(p => p.HasDiscount && isOrderable(p)).length;
  const name = opts.customerName && !/khach hang/i.test(cleanText(opts.customerName)) ? ` **${opts.customerName}**` : ' anh/chị';
  const topCode = coupons && coupons[0] ? ` · Voucher **${coupons[0].code}**` : '';
  return reply(
    `Dạ **Bé Bot Săn Xe 1:64** xin chào${name}! ✨\n` +
    `Showroom đang đồng bộ trực tiếp **${ready} siêu phẩm sẵn kho**${saleCnt ? `, **${saleCnt} mẫu đang Sale giảm giá**` : ''}${topCode} (Ship SPX toàn quốc chỉ **${formatVnd(SHOP.shippingFee)}**). Anh/chị có thể hỏi em tự nhiên như:\n` +
    '• 🏎️ _"Xe nào đang giảm giá?"_, _"Roxy còn k, áp mã MINIGT30K bn?"_\n' +
    '• 🛍️ _"Tính tiền giỏ hàng của tôi"_, _"Đơn hàng của tôi bao lâu tới?"_\n' +
    '• 🧮 _"Có 800k mua được 2 xe nào?"_, _"Hướng dẫn đặt hàng"_\n\n' +
    'Anh/chị đang muốn tìm mẫu xe nào để em kiểm tra ngay ạ? 💕',
    ['Xe nào đang giảm giá?', 'Tính tiền giỏ hàng của tôi', 'Shop có mã giảm giá không?', 'Kiểm tra đơn hàng của tôi']
  );
}

function answerOtherBrand(brand, products) {
  const isToyBrand = /hot\s*wheels?|tomica|majorette|bburago|maisto|greenlight|tarmac|inno|autoart|kyosho|spark|minichamps/.test(brand);
  const label = brand.replace(/\b\w/g, c => c.toUpperCase());
  const picks = products.filter(isOrderable).sort((a, b) => (b.StockBox + b.StockCard) - (a.StockBox + a.StockCard)).slice(0, 3);

  if (isToyBrand) {
    return reply(
      `Dạ hiện tại Showroom tập trung chuyên sâu 2 dòng mô hình tỷ lệ chuẩn 1:64 cao cấp là **MINI GT (TSM-Model)** và **Pop Race** nên chưa kinh doanh dòng **${label}** ạ.\n\n` +
      `💡 Điểm ăn tiền của **MINI GT & Pop Race** là **100% lốp cao su thật, đèn pha nhựa trong gắn rời, gương chiếu hậu chi tiết** và đúng chuẩn tỷ lệ 1:64 thực tế! Anh/chị ngắm thử 3 mẫu đang bán chạy nhất tại shop nhé:\n\n${picks.map(listLine).join('\n\n')}`,
      ['Xe nào đang giảm giá?', 'Các mẫu Pop Race mở capo', 'Gặp Admin đặt hàng riêng'],
      { matchedProducts: picks.map(x => x.Sku) }
    );
  }

  return reply(
    `Dạ hiện tại kệ Showroom đang tạm hết / chưa về mẫu thuộc hãng **${label}** ạ 🥺 Nếu anh/chị muốn dặn đặt riêng dòng ${label}, có thể nhắn _"nhờ Admin đặt riêng ${label}"_ để Quản trị viên tìm nguồn báo giá nhé!\n\nTrong lúc đó, mời anh/chị tham khảo 3 siêu phẩm đang được săn đón nhất tại shop ạ:\n\n${picks.map(listLine).join('\n\n')}`,
    [`Nhờ Admin báo khi có ${label}`, 'Xe nào đang có sẵn?'],
    { matchedProducts: picks.map(x => x.Sku) }
  );
}

// =====================================================================
// 7. BỘ MÁY SUY LUẬN TRUNG TÂM v5 (DEEP SEMANTIC ENGINE)
// =====================================================================
async function runEngine(ctx, history, opts) {
  const { products, coupons } = await getStoreData();
  const I = ctx.intents;

  // 1. Tra cứu đơn hàng trực tiếp theo Mã đơn (MGT-...) HOẶC theo SĐT HOẶC câu hỏi nối tiếp về đơn vừa xem
  const orderLookup = await lookupOrderSmart(ctx.raw, I.orderTracking || I.myOrderAsk, products, history, ctx);
  if (orderLookup) return answerOrderLookup(orderLookup, ctx);

  // 1b. Tra cứu đơn hàng hoặc giỏ hàng đồng bộ của tài khoản đang đăng nhập
  if (I.myCartAsk) {
    const userCtx = await getLoggedInAccountContext(opts);
    return answerMyCart(userCtx, products, coupons);
  }
  if (I.myOrderAsk || I.orderTracking) {
    const userCtx = await getLoggedInAccountContext(opts);
    if (userCtx.isLoggedIn || (userCtx.orders && userCtx.orders.length > 0)) {
      return answerLoggedInOrders(userCtx);
    }
    if (I.myOrderAsk && !I.orderTracking) {
      return KNOWLEDGE.tracking();
    }
  }

  // 2. Hỏi về Nhà sáng tạo web Thịnh & Nam (nếu câu chỉ hỏi về tác giả hoặc hỏi nối tiếp chủ đề Thịnh & Nam)
  const found = searchProducts(ctx.searchText, products);
  const prevWasCreators = wasLastTopicCreators(history);
  if (!found.length && (I.creatorAsk || (prevWasCreators && (I.moreInfo || /(^|\s)(thinh|nam|2 ban|hai ban|ho|truong|cong nghe)(\s|$)/.test(ctx.text))))) {
    const crReply = answerCreators(ctx, prevWasCreators && !I.creatorAsk);
    crReply.message = appendSecondaryIntents(crReply.message, ctx, coupons, { creatorAsk: true });
    return crReply;
  }

  // 2b. Nếu khách gõ đích danh một mã SKU sản phẩm (VD: MGTS0026, MGT9999, F1-TEST-99, [POP001]...) nhưng mã đó KHÔNG tồn tại hoặc ĐÃ BỊ ADMIN XÓA khỏi kho -> báo rõ ngay, tuyệt đối không trả nhầm xe cùng dòng (VD: chữ "F1" trong "F1-TEST-99") hay xe cũ trong bộ nhớ!
  if (!ctx.explicitCouponCode && !I.orderTracking && !I.myOrderAsk && !extractOrderCodeFromText(ctx.raw, products)) {
    const rawStr = String(ctx.raw || '');
    const normStr = normalize(rawStr);
    const bracketSku = rawStr.match(/\[([A-Z0-9][A-Z0-9\-_]{2,22})\]/i);
    const hashSku = rawStr.match(/#([A-Z][A-Z0-9\-_]{3,22})\b/i);
    const labeledSku = normStr.match(/(?:^|\s)(?:ma|mau|sku)\s+([a-z0-9]+-[a-z0-9\-]{1,18}|[a-z]{2,6}\d{3,10})\b/i);
    const prefixSku = rawStr.match(/\b((?:MGT\d|MGTS\d|MG\d{3,}|PR\d{2,}|KH\d{2,}|KHMG|POP\d{2,}|INNO\d{2,}|TW\d{2,})[A-Z0-9\-_]{0,14})\b/i);
    const hyphenCodeSku = rawStr.match(/\b([A-Z]{1,6}\d{0,3}-[A-Z0-9]+-[A-Z0-9\-_]+)\b/i);

    const candidateSku = (
      (bracketSku && bracketSku[1]) ||
      (labeledSku && labeledSku[1]) ||
      (prefixSku && prefixSku[1]) ||
      (hyphenCodeSku && hyphenCodeSku[1]) ||
      (hashSku && /\d/.test(hashSku[1]) ? hashSku[1] : '')
    ).trim();

    if (candidateSku && /[a-z]/i.test(candidateSku) && /\d/.test(candidateSku) && !/^(1[-/:]64|gt[-_]?r\d*|gt[-_]?3\w*|lb[-_]?w\w*|s[-_]?15|r[-_]?3[2345]|f[-_]?40|mgt[-_\s]*20\d{2}[a-z0-9\-_]*|ord[-_][a-z0-9\-_]*|dh[-_][a-z0-9\-_]*)$/i.test(candidateSku)) {
      const askSku = candidateSku.toUpperCase();
      const askNorm = askSku.replace(/[-_]/g, '');
      const isMgtShorthand = /^MGT0*\d{2,5}$/.test(askNorm);
      const askDigits = isMgtShorthand ? askNorm.replace(/\D/g, '').replace(/^0+/, '') : '';

      const skuExistsInCatalog = products.some(p => {
        const ps = String(p.Sku || '').toUpperCase();
        if (ps === askSku || ps.replace(/[-_]/g, '') === askNorm) return true;
        if (askDigits && p._idx && p._idx.skuDigits === askDigits && ps.startsWith('MGT')) return true;
        return false;
      });

      if (!skuExistsInCatalog) {
        return reply(
          `Dạ em vừa kiểm tra trực tiếp trên hệ thống kho hiện tại nhưng Showroom **chưa có (hoặc đã ngừng kinh doanh) mã #${askSku}** ạ 🥺\n\n` +
          `• Anh/chị kiểm tra lại mã xe giúp em, hoặc bấm gợi ý bên dưới để nhờ **Admin Thịnh & Nam** tìm nguồn đặt riêng nhé!\n` +
          `• Anh/chị cũng có thể xem ngay các siêu phẩm đang sẵn kho giao ngay tại shop ạ! ✨`,
          [`Nhờ Admin đặt riêng mã ${askSku}`, 'Xe nào đang có sẵn?', 'Xe nào đang giảm giá?'],
          { matchedProducts: [] }
        );
      }
    }
  }

  // 3. Hỏi danh tính Bot / Khả năng của Bot
  if (I.botIdentity && !found.length) return KNOWLEDGE.botIdentity(opts);
  if (I.botCapability && !found.length) return KNOWLEDGE.botCapability();

  // 3b. Tri thức tính năng website / định nghĩa chuyên sâu (chạy trên RAM, 0 token)
  const kHit = searchKnowledge(ctx.text);
  if (kHit && kHit.doc && !I.howToOrder && !I.vipAsk && !I.couponAsk) {
    const isDef = kHit.doc.definition && (kHit.isDefinitionQuestion || !found.length);
    const isStrongSiteFeature = kHit.strong && !ctx.explicitCouponCode && !ctx.price && !ctx.qty;
    if (isDef || isStrongSiteFeature) {
      const kRes = kHit.doc.answer(SHOP, formatVnd, { products, coupons });
      return reply(
        kRes.message,
        kRes.suggestions || ['Xe nào đang giảm giá?', 'Shop có mã giảm giá không?', 'Ai là người tạo web này?'],
        { matchedProducts: kRes.matchedProducts || [] }
      );
    }
  }

  // 4. Kết hợp sản phẩm tìm được & bộ nhớ ngữ cảnh hội thoại
  const memory = getContextProducts(history, products);

  const policyIntent = I.shipping || I.payment || I.address || I.hours || I.contact || I.boxcard ||
                       I.preorderPolicy || I.authentic || I.howToOrder || I.categories ||
                       I.materialSpec || I.scaleSize || I.chaseAsk || I.careTip || (I.couponAsk && !ctx.explicitCouponCode) ||
                       I.vipAsk || I.warrantyInfo || I.accountHelp || I.orderTracking || I.myOrderAsk || I.myCartAsk;
  const catalogListIntent = I.saleList || I.cheapest || I.expensive || I.bestSeller ||
                            I.newArrival || I.instockList || I.preorderList || I.listWord || I.gift;
  const productQuestion = I.price || I.stock || I.deposit || I.eta || I.total || !!ctx.qty || !!ctx.pref || I.compare || !!ctx.explicitCouponCode;

  let focus = found;
  let fromMemory = false;
  if (!found.length && memory.length) {
    if (ctx.ordinal !== null) {
      const p = ctx.ordinal === -1 ? memory[memory.length - 1] : memory[ctx.ordinal];
      if (p) { focus = [p]; fromMemory = true; }
    } else if (I.followUp || !!ctx.explicitCouponCode || (productQuestion && !catalogListIntent && !ctx.price && !(policyIntent && !ctx.qty) && !I.boxcard)) {
      focus = memory;
      fromMemory = true;
    }
  }

  if (!found.length && I.compare && memory.length >= 2) {
    const nums = [...ctx.text.matchAll(/(?:cai|mau|so|thu)\s*(\d)/g)]
      .map(m => parseInt(m[1], 10) - 1)
      .filter(n => n >= 0 && n < memory.length);
    focus = nums.length >= 2 ? [memory[nums[0]], memory[nums[1]]] : memory.slice(0, 2);
    fromMemory = true;
  }

  // Nếu khách gõ mã giảm giá cụ thể mà chưa nêu xe nào
  if (ctx.explicitCouponCode && !focus.length) {
    return answerCouponCalculation([], ctx.explicitCouponCode, ctx, coupons);
  }

  // 5. Chào hỏi / Cảm ơn / Tạm biệt / Khen ngợi ngữ cảnh
  if (I.greet && !focus.length && !policyIntent && !I.saleList && ctx.tokens.length <= 7) {
    return answerGreeting(products, coupons, opts);
  }
  if ((I.thanks || I.bye) && !found.length && !policyIntent) {
    return reply(
      I.bye
        ? `Dạ Bé Bot cảm ơn anh/chị đã ghé thăm **${SHOP.name}**! Chúc anh/chị một ngày thật nhiều niềm vui, khi nào cần săn xe 1:64 cứ gọi em nhé! 👋✨💕`
        : 'Dạ không có gì đâu ạ! 🥰 Anh/chị cần tra giá, thử mã ưu đãi hay xem thêm mẫu xe nào cứ nhắn Bé Bot thoải mái nhé!',
      ['Xe nào đang giảm giá?', 'Xe nào đang có sẵn?']
    );
  }
  if (I.smallTalk && !found.length && !policyIntent) {
    return KNOWLEDGE.smallTalk(ctx);
  }
  if (I.ackPraise && !found.length && !policyIntent && ctx.tokens.length <= 5) {
    if (memory.length === 1) {
      const mp = memory[0];
      return reply(
        `Dạ mẫu **[${mp.Sku}] ${mp.Name}** ở ngoài nhìn nước sơn và bộ mâm lốp cao su còn mê hơn trên hình nữa ạ! 😍 Anh/chị muốn em tính tổng tiền áp mã giảm giá hay xem thêm mẫu khác cùng dòng không ạ?`,
        [`Tính tiền mẫu ${mp.Sku}`, 'Shop có mã giảm giá không?', 'Xem mẫu tương tự'],
        { matchedProducts: [mp.Sku] }
      );
    }
    return reply('Dạ vâng ạ! 😊 Anh/chị cần Bé Bot kiểm tra thêm mẫu xe nào hay tư vấn tầm giá bao nhiêu cứ nhắn em nhé!', ['Xe nào đang giảm giá?', 'Xe dưới 400k']);
  }

  // 6. Trả lời sản phẩm cụ thể / So sánh / Tính Combo
  if (focus.length >= 2 && I.compare) return answerCompare(focus[0], focus[1]);
  const wantsMultiCombo = hasAny(ctx.text, ['ca 2', 'ca hai', 'mua ca', 'gop lai', 'tong 2', '2 mau']) ||
                          (ctx.qty && ctx.qty >= 2 && found.length >= 2) ||
                          ((I.total || !!ctx.explicitCouponCode) && /\b(va|voi|cung)\b/.test(ctx.searchText) && found.length >= 2);
  if (focus.length >= 2 && wantsMultiCombo) {
    return answerComboTotal(focus.slice(0, 3), ctx, coupons);
  }
  if (focus.length >= 1 && ctx.explicitCouponCode) {
    return answerCouponCalculation([focus[0]], ctx.explicitCouponCode, ctx, coupons);
  }
  if (focus.length === 1) return answerProduct(focus[0], ctx, products, coupons);
  if (focus.length > 1) return answerList(focus, ctx, products, fromMemory, coupons);

  // 7. Hỏi hãng xe chưa có trong kho
  const otherBrand = OTHER_CAR_BRANDS.find(b => hasAny(ctx.text, [b]));
  if (otherBrand) return answerOtherBrand(otherBrand, products);

  // 8. Lọc theo Sale giảm giá / Ngân sách / Rẻ nhất / Đắt nhất / Bán chạy / Mới về / Có sẵn / Pre-Order
  if (I.saleList || ctx.price || I.cheapest || I.expensive || I.bestSeller || I.newArrival || I.instockList || I.preorderList) {
    return answerFilter(products, ctx, coupons);
  }
  if (I.gift) return answerGift(products, ctx);
  if (I.vipAsk) {
    const userCtx = await getLoggedInAccountContext(opts);
    return answerVipTiers(userCtx);
  }
  if (I.couponAsk) {
    const userCtx = await getLoggedInAccountContext(opts);
    const r = answerCoupons(coupons, userCtx);
    r.message = appendSecondaryIntents(r.message, ctx, coupons, { couponAsk: true });
    return r;
  }
  if (I.howToOrder) return KNOWLEDGE.howToOrder(coupons);
  if (I.materialSpec) {
    const r = KNOWLEDGE.materialSpec();
    r.message = appendSecondaryIntents(r.message, ctx, coupons);
    return r;
  }
  if (I.scaleSize) return KNOWLEDGE.scaleSize();
  if (I.chaseAsk) return KNOWLEDGE.chaseAsk();
  if (I.careTip) return KNOWLEDGE.careTip();
  if (I.categories) return answerCategories(products);
  if (I.orderTracking) return KNOWLEDGE.tracking();
  if (I.boxcard) {
    const r = KNOWLEDGE.boxcard();
    r.message = appendSecondaryIntents(r.message, ctx, coupons, { boxcard: true });
    return r;
  }
  if (I.warrantyInfo || hasAny(ctx.text, ESC.damage)) return KNOWLEDGE.warranty();
  if (I.accountHelp) return KNOWLEDGE.accountHelp();
  if (I.preorderPolicy || I.deposit) return KNOWLEDGE.preorder();
  if (I.shipping) {
    const r = KNOWLEDGE.shipping();
    r.message = appendSecondaryIntents(r.message, ctx, coupons, { shipping: true });
    return r;
  }
  if (I.payment) {
    const r = KNOWLEDGE.payment();
    r.message = appendSecondaryIntents(r.message, ctx, coupons, { payment: true });
    return r;
  }
  if (I.address || I.hours || I.contact) {
    const r = KNOWLEDGE.contact();
    r.message = appendSecondaryIntents(r.message, ctx, coupons, { contact: true });
    return r;
  }
  if (I.authentic) return KNOWLEDGE.authentic();
  if (I.greet) return answerGreeting(products, coupons, opts);

  // 9. Ký tự quá ngắn (VD: "?", ".") -> nhắc nhẹ nhàng không làm rác Admin
  if (ctx.text.replace(/\s+/g, '').length < 2) {
    return reply(
      'Dạ anh/chị đang muốn hỏi mẫu xe hay thông tin gì để Bé Bot hỗ trợ ngay ạ? 😊',
      ['Xe nào đang giảm giá?', 'Shop có mã giảm giá không?', 'Ai là người tạo web này?']
    );
  }

  // 10. Tra cứu lại kho tri thức website trước khi phải chuyển Admin
  if (kHit && kHit.doc && kHit.score >= 5) {
    const kRes = kHit.doc.answer(SHOP, formatVnd, { products, coupons });
    return reply(
      kRes.message,
      kRes.suggestions || ['Xe nào đang giảm giá?', 'Shop có mã giảm giá không?', 'Ai là người tạo web này?'],
      { matchedProducts: kRes.matchedProducts || [] }
    );
  }

  // 11. Câu hỏi thực sự nằm ngoài tri thức của AI -> tự động chuyển thông báo + ngữ cảnh lên Admin
  return {
    message: buildEscalationMessage('not_understood', ctx.raw),
    suggestions: ['Xe nào đang giảm giá?', 'Shop có mã giảm giá không?', 'Ai là người tạo web này?'],
    matchedProducts: [],
    isEscalated: true,
    confident: false,
    reason: 'not_understood'
  };
}

// =====================================================================
// 8. MICRO-RAG GEMINI API (CHỈ NẠP TOP 4 XE LIÊN QUAN — TIẾT KIỆM 90% TOKEN)
// =====================================================================
function buildMicroRagContext(ctx, history, products, coupons, userCtx = null) {
  const matched = searchProducts(ctx.searchText, products);
  const mem = getContextProducts(history, products);
  const pool = [];
  for (const p of [...matched, ...mem]) {
    if (p && !pool.includes(p) && pool.length < 4) pool.push(p);
  }
  if (pool.length === 0) {
    const hot = products.filter(isOrderable).slice(0, 4);
    pool.push(...hot);
  }
  const prodLines = pool.map(p =>
    `• [${p.Sku}] ${p.Name} | ${p.Brand} | Box: ${formatVnd(p.PriceBox)} (kho ${p.StockBox}) | Card: ${formatVnd(p.PriceCard)} (kho ${p.StockCard})${p.DiscountPercent > 0 ? ` | Sale -${p.DiscountPercent}%` : ''} | ${statusTag(p)}`
  ).join('\n');
  const coupLines = coupons.map(c =>
    `• ${c.code}: ${c.discountType === 'percent' ? `-${c.discountValue}%` : `-${formatVnd(c.discountValue)}`} (đơn từ ${formatVnd(c.minOrderAmount)})`
  ).join('\n');

  const kHit = searchKnowledge(ctx.text);
  let knowledgeSnippet = '';
  if (kHit && kHit.doc) {
    const docText = docPlainText(kHit.doc, SHOP, formatVnd, { products, coupons });
    if (docText) {
      knowledgeSnippet = `\nTri thức web liên quan [${kHit.doc.title}]: ${docText}`;
    }
  }

  let userSnippet = '';
  if (userCtx && userCtx.isLoggedIn) {
    const latestOrd = userCtx.orders && userCtx.orders[0]
      ? ` · Đơn mới nhất: #${userCtx.orders[0].OrderCode || userCtx.orders[0].ordercode} (${userCtx.orders[0].Status || userCtx.orders[0].status})`
      : '';
    userSnippet = `\nKhách đang đăng nhập: ${userCtx.fullName || 'Hội viên'} · ${userCtx.vip.name} (đã mua ${formatVnd(userCtx.totalSpent)})${latestOrd}`;
  }

  return `Tổng kho: ${products.length} mẫu.\nMẫu liên quan nhất:\n${prodLines}${coupLines ? `\nVoucher:\n${coupLines}` : ''}${knowledgeSnippet}${userSnippet}`;
}

async function callGeminiApi(ctx, userMessage, history, opts) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  const [{ products, coupons }, userCtx] = await Promise.all([
    getStoreData(),
    getLoggedInAccountContext(opts)
  ]);
  const microContext = buildMicroRagContext(ctx, history, products, coupons, userCtx);

  const systemInstruction = `Bạn là "Bé Bot Săn Xe 1:64" của "${SHOP.name}".
Tác giả web: Đỗ Quốc Thịnh & Nguyễn Đình Nam (${CREATORS.university}), Zalo ${SHOP.hotline}.
Địa chỉ: ${SHOP.address} · Ship SPX ${formatVnd(SHOP.shippingFee)} (Nam 1-2 ngày, Trung 2-3 ngày, Bắc 3-4 ngày + 1 ngày bọc 4 lớp), Freeship từ ${formatVnd(SHOP.freeShipThreshold)}. VietQR PayOS tự động (${SHOP.bankName}), cọc Pre-Order ${Math.round(SHOP.depositRate * 100)}%, hoặc COD cho VIP 4+ (từ 1tr). Giỏ hàng, Yêu thích & Lịch sử Chat đồng bộ 100% đa thiết bị theo tài khoản.
DỮ LIỆU THỰC TẾ:
${microContext}
QUY TẮC: Xưng "em/Bé Bot", gọi "anh/chị". Nhắc xe phải ghi [MGT...] đúng mã thật, không tự bịa giá/tồn kho. Nếu ngoài phạm vi hoặc khiếu nại/mua sỉ >5 xe/gặp người thật thì thêm [ESCALATE] ở cuối.`;

  const past = history.slice(-6);
  if (past.length && past[past.length - 1].sender_type === 'user' && past[past.length - 1].message === userMessage) past.pop();
  const contents = past.map(h => ({ role: h.sender_type === 'user' ? 'user' : 'model', parts: [{ text: String(h.message || '').slice(0, 400) }] }));
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.2, maxOutputTokens: 550 }
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (_) {
    return null;
  }
}

// =====================================================================
// 9. ĐIỀU PHỐI CHÍNH
// =====================================================================
function finalizeBotResult(resObj) {
  if (!resObj || typeof resObj !== 'object') return resObj;
  const rawSkus = (Array.isArray(resObj.matchedProducts) && resObj.matchedProducts.length)
    ? resObj.matchedProducts
    : (!resObj.isEscalated ? extractSkusFromText(resObj.message) : []);
  const matchedProductCards = resolveProductCardsBySkus(rawSkus);
  return {
    ...resObj,
    matchedProducts: matchedProductCards.map(c => c.sku),
    matchedProductCards,
    catalogSig: getCatalogSignature()
  };
}

async function generateBotReply(userMessage, conversationHistory = [], opts = {}) {
  // Đảm bảo dữ liệu sản phẩm luôn đồng bộ 100% với PostgreSQL TRƯỚC KHI phân tích câu hỏi
  await getStoreData();
  const ctx = analyze(userMessage);

  // B1. Phát hiện yêu cầu cần Admin can thiệp trực tiếp (khiếu nại, đơn cá nhân, mua sỉ, đòi gặp Admin)
  const reason = detectEscalation(ctx, conversationHistory);
  const activeOrderCode = extractOrderCodeFromText(ctx.raw, cachedProducts) || getContextOrderCodeFromHistory(conversationHistory, cachedProducts);
  if (reason) {
    return finalizeBotResult({
      message: buildEscalationMessage(reason, ctx.raw, activeOrderCode),
      isEscalated: true,
      confident: true,
      suggestions: activeOrderCode
        ? [`Kiểm tra chi tiết đơn #${activeOrderCode}`, 'Xe nào đang giảm giá?']
        : ['Xe nào đang giảm giá?', 'Shop có mã giảm giá không?'],
      matchedProducts: [],
      reason
    });
  }

  // B2. Gemini Micro-RAG (nếu có key) — các câu hỏi tra cứu dữ liệu cá nhân (đơn hàng, giỏ hàng, VIP, voucher, tác giả) ưu tiên bộ máy SQL chuẩn xác 100%
  const preferSqlEngine = ctx.intents.creatorAsk || ctx.intents.orderTracking || ctx.intents.myOrderAsk ||
                          ctx.intents.myCartAsk || ctx.intents.vipAsk || ctx.intents.couponAsk ||
                          ctx.intents.howToOrder || Boolean(extractOrderCodeFromText(ctx.raw, cachedProducts)) ||
                          Boolean(activeOrderCode && isOrderFollowUpQuestion(ctx, cachedProducts)) ||
                          wasLastTopicCreators(conversationHistory);
  if (!preferSqlEngine) {
    const gemini = await callGeminiApi(ctx, userMessage, conversationHistory, opts);
    if (gemini) {
      const isEscalated = gemini.includes('[ESCALATE]');
      const cleanGeminiMsg = gemini.replace(/\[ESCALATE\]/g, '').trim();
      const geminiSkus = isEscalated ? [] : extractSkusFromText(cleanGeminiMsg);
      return finalizeBotResult({
        message: isEscalated ? buildEscalationMessage('not_understood', ctx.raw) : cleanGeminiMsg,
        isEscalated,
        confident: !isEscalated,
        suggestions: ['Xe nào đang giảm giá?', 'Shop có mã giảm giá không?', 'Ai là người tạo web này?'],
        matchedProducts: geminiSkus,
        reason: isEscalated ? 'not_understood' : undefined
      });
    }
  }

  // B3. Bộ máy suy luận ngữ nghĩa nội bộ v5
  try {
    const engineRes = await runEngine(ctx, conversationHistory, opts);
    return finalizeBotResult(engineRes);
  } catch (err) {
    console.warn('[AI CHAT v5] Lỗi bộ máy suy luận:', err.message);
    return finalizeBotResult({
      message: buildEscalationMessage('not_understood', ctx.raw),
      isEscalated: true,
      confident: false,
      suggestions: ['Xe nào đang có sẵn?'],
      matchedProducts: [],
      reason: 'not_understood'
    });
  }
}

module.exports = {
  generateBotReply,
  getStoreData,
  invalidateStoreCache,
  getCatalogSignature,
  extractSkusFromText,
  extractOrderCodeFromText,
  getContextOrderCodeFromHistory,
  resolveProductCardsBySkus,
  buildEscalationMessage,
  _internal: { analyze, detectEscalation, searchProducts, parsePriceRange, parseQuantity, expandSlang, extractOrderCodeFromText, getContextOrderCodeFromHistory }
};
