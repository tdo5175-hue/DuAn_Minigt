/**
 * AI VIET NORMALIZER v6 — Bộ đọc hiểu tiếng Việt "0 token" cho Bé Bot Săn Xe 1:64
 * ---------------------------------------------------------------------------
 * Chạy hoàn toàn trên RAM server (không gọi API ngoài → không tốn dữ liệu/token):
 *   1. Gộp ký tự kéo dài:            "đẹppppp", "okkkk", "khôngggg"  → "dep", "ok", "khong"
 *   2. Sửa gõ Telex sót dấu:          "dduwowcj", "giamr", "khoong"   → "duoc", "giam", "khong"
 *   3. Viết tắt / teencode theo NGỮ CẢNH:
 *        "300 k" (giữ nghìn) ≠ "còn k" (không) · "quên mk" (mật khẩu) ≠ "mk muốn" (mình)
 *        "màu hồng" (giữ hồng) ≠ "còn hông" (không) · "mã gg" (giảm giá) ≠ "gg" (google)
 *   4. Từ tiếng Anh phổ biến:          "how much", "shipping fee", "in stock" → tiếng Việt
 *   5. Sửa lỗi chính tả mờ theo từ điển sống (tên xe, hãng, từ khóa shop):
 *        "verstapen" → "verstappen", "lambogini" → "lamborghini", "vouhcer" → "voucher"
 * Đầu vào: chuỗi ĐÃ bỏ dấu + chữ thường (cleanText). Đầu ra: chuỗi đã chuẩn hóa.
 */

const isNum = (t) => /^\d+(?:[.,]\d+)?$/.test(t || '');

// ---------------------------------------------------------------------
// 1. TỪ ĐIỂN VIẾT TẮT TĨNH (token → cụm chuẩn)
// ---------------------------------------------------------------------
const STATIC_ABBR = {
  // không
  ko: 'khong', kh: 'khong', khg: 'khong', kg: 'khong', k0: 'khong', hok: 'khong', hk: 'khong',
  khum: 'khong', khom: 'khong', hongg: 'khong', kp: 'khong phai', kphai: 'khong phai',
  // được
  dc: 'duoc', dk: 'duoc', dx: 'duoc', duoc: 'duoc', dzc: 'duoc', duok: 'duoc', dcj: 'duoc', dck: 'duoc',
  // bao nhiêu / nhiêu
  bn: 'bao nhieu', bnh: 'bao nhieu', bnhiu: 'bao nhieu', bnhieu: 'bao nhieu', bnieu: 'bao nhieu',
  baonhieu: 'bao nhieu', baonhiu: 'bao nhieu', nhiu: 'nhieu', nhju: 'nhieu',
  // mua sắm
  sp: 'san pham', spham: 'san pham', mh: 'mo hinh', sl: 'so luong', slg: 'so luong',
  ck: 'chuyen khoan', ckhoan: 'chuyen khoan', tk: 'tai khoan', tkhoan: 'tai khoan', stk: 'so tai khoan',
  sdt: 'so dien thoai', sdth: 'so dien thoai', sodt: 'so dien thoai', dt: 'dien thoai', dthoai: 'dien thoai',
  fship: 'freeship', fs: 'freeship', frs: 'freeship', freship: 'freeship', frship: 'freeship', frees: 'freeship',
  sip: 'ship', shjp: 'ship', shiper: 'shipper',
  mgg: 'ma giam gia', ctkm: 'chuong trinh khuyen mai', vouncher: 'voucher', voucer: 'voucher', vocher: 'voucher',
  ord: 'order', od: 'order', oder: 'order', pre: 'preorder', po: 'preorder', preoder: 'preorder', preodrer: 'preorder',
  sz: 'kich thuoc', size: 'kich thuoc', pk: 'phu kien', pb: 'phien ban', sx: 'san xuat',
  ib: 'nhan tin', inb: 'nhan tin', inbox: 'nhan tin', nt: 'nhan tin', ns: 'noi', nc: 'noi chuyen', nch: 'noi chuyen',
  // người / xưng hô
  ad: 'admin', adm: 'admin', qtv: 'admin', nv: 'nhan vien', ng: 'nguoi', ngta: 'nguoi ta',
  mn: 'moi nguoi', mng: 'moi nguoi', mik: 'minh', mjk: 'minh', mih: 'minh', mjh: 'minh',
  ae: 'anh em', ace: 'anh chi em', cty: 'cong ty',
  // câu hỏi / trạng từ
  ntn: 'nhu the nao', nthe: 'nhu the', lsao: 'lam sao', lmsao: 'lam sao', lms: 'lam sao',
  j: 'gi', gj: 'gi', ji: 'gi', z: 'vay', zay: 'vay', dzay: 'vay', zi: 'vay', dzi: 'vay',
  trc: 'truoc', cx: 'cung', cg: 'cung', cug: 'cung', ms: 'moi', hnay: 'hom nay', hqua: 'hom qua',
  bgio: 'bao gio', bjo: 'bao gio', bjh: 'bao gio', tg: 'thoi gian', tgian: 'thoi gian',
  dag: 'dang', dg: 'dang', lun: 'luon', lm: 'lam', kq: 'ket qua', ik: 'di', nek: 'ne', hix: 'hic',
  wa: 'qua', qa: 'qua', mun: 'muon', mog: 'mong', iu: 'yeu', thik: 'thich', thjk: 'thich', xink: 'xinh',
  bik: 'biet', bjk: 'biet', bit: 'biet', pit: 'biet',
  // lịch sự
  oke: 'ok', oki: 'ok', okie: 'ok', okela: 'ok', okla: 'ok', okee: 'ok', okk: 'ok', okey: 'ok', okay: 'ok',
  tks: 'cam on', thks: 'cam on', thx: 'cam on', camon: 'cam on', cmon: 'cam on', tkx: 'cam on',
  xl: 'xin loi', sr: 'xin loi', sorry: 'xin loi', srr: 'xin loi',
  // địa danh / mạng xã hội
  hcm: 'ho chi minh', tphcm: 'ho chi minh', sg: 'sai gon', sgn: 'sai gon', fb: 'facebook', face: 'facebook',
  // so sánh
  ss: 'so sanh', sosanh: 'so sanh'
};

// ---------------------------------------------------------------------
// 2. VIẾT TẮT PHỤ THUỘC NGỮ CẢNH (prev, next, isLast) → cụm chuẩn
// ---------------------------------------------------------------------
const CONTEXT_ABBR = {
  k: (p) => (isNum(p) ? 'k' : 'khong'),
  km: (p) => (isNum(p) ? 'km' : 'khuyen mai'),
  mk: (p, n) => (/^(quen|doi|lay|nhap|sai|reset|dat|cap|mat)$/.test(p) || /^(moi|cu|cua|bi)$/.test(n) ? 'mat khau' : 'minh'),
  hong: (p) => (/^(mau|long|son|xe|ban|vo|hoa|phan|tim|do|pink|roxy|bi|da|lam|hu|loi|de)$/.test(p) ? 'hong' : 'khong'),
  hem: (p, n) => (/^(nay|qua)$/.test(n) ? 'hom' : 'khong'),
  hum: (p, n) => (/^(nay|qua|truoc)$/.test(n) ? 'hom' : 'khong'),
  vs: (p) => (/^(mua|noi|chat|gui|hoi|lien|nhan|di|o|cung|giup|bao)$/.test(p) ? 'voi' : 'so sanh'),
  v: (p, n, last) => (last || /^(a|ha|ta|nhi|nha|ban|shop|em)$/.test(n) ? 'vay' : 'v'),
  gg: (p) => (/^(ma|code|co)$/.test(p) ? 'giam gia' : 'google'),
  dh: (p, n) => (n === 'lac' ? 'dai hoc' : 'don hang'),
  bh: (p, n) => (/^(chinh|sach|the|sao|doi|tra|may|thang|nam|bao|lau)$/.test(n) || /^(che|do|sach|duoc|co)$/.test(p) ? 'bao hanh' : 'bao gio'),
  c: (p, n) => (n === 'oi' || /^(cam|chao|on|giup|nho)$/.test(p) ? 'chi' : 'c'),
  e: () => 'em',
  a: (p, n) => (n === 'oi' || /^(chao|on|giup|nho|cho)$/.test(p) ? 'anh' : 'a'),
  b: (p, n) => (n === 'oi' || /^(chao|on|giup|nho)$/.test(p) ? 'ban' : 'b'),
  r: (p) => (p && p !== 'gt' ? 'roi' : 'r'), // giữ "GT-R" (gt r) cho tên xe Nissan
  m: (p, n) => (n === 'oi' ? 'minh' : 'm'),
  dn: (p) => (/^(o|tai|ve|ship)$/.test(p) ? 'dong nai' : 'dn')
};

// ---------------------------------------------------------------------
// 3. CỤM TỪ TIẾNG ANH / CỤM PHỔ BIẾN → TIẾNG VIỆT KHÔNG DẤU
// ---------------------------------------------------------------------
const PHRASE_MAP = [
  ['how much', 'bao nhieu'], ['what price', 'gia bao nhieu'], ['price', 'gia'],
  ['shipping fee', 'phi ship'], ['delivery fee', 'phi ship'], ['shipping', 'ship'], ['delivery', 'giao hang'],
  ['in stock', 'con hang'], ['out of stock', 'het hang'], ['available', 'co san'], ['sold out', 'het hang'],
  ['who made', 'ai lam'], ['who created', 'ai tao'], ['who built', 'ai xay dung'], ['developer', 'nha phat trien'],
  ['discount code', 'ma giam gia'], ['promo code', 'ma giam gia'], ['coupon code', 'ma giam gia'], ['discount', 'giam gia'],
  ['on sale', 'dang sale'], ['best seller', 'ban chay'], ['best selling', 'ban chay'], ['new arrival', 'moi ve'],
  ['cheapest', 're nhat'], ['cheap', 'gia re'], ['most expensive', 'dat nhat'],
  ['payment', 'thanh toan'], ['pay', 'thanh toan'], ['bank transfer', 'chuyen khoan'],
  ['address', 'dia chi'], ['opening hours', 'gio mo cua'], ['phone number', 'so dien thoai'],
  ['track order', 'tra cuu don'], ['order status', 'tinh trang don'], ['my order', 'don cua toi'],
  ['deposit', 'dat coc'], ['warranty', 'bao hanh'], ['refund', 'hoan tien'],
  ['sign up', 'dang ky'], ['register', 'dang ky'], ['log in', 'dang nhap'], ['login', 'dang nhap'],
  ['forgot password', 'quen mat khau'], ['dark mode', 'giao dien toi'], ['light mode', 'giao dien sang'],
  ['language', 'ngon ngu'], ['wishlist', 'yeu thich'], ['add to cart', 'them vao gio'], ['cart', 'gio hang'],
  ['compare', 'so sanh'], ['recommend', 'goi y'], ['gift', 'qua tang'], ['what is', 'la gi'],
  // Cụm tiếng Việt hay gõ tắt / thiếu chữ
  ['co hong', 'co khong'], ['con hong', 'con khong'], ['gia sao', 'gia bao nhieu'], ['het nhieu', 'het bao nhieu']
];

// ---------------------------------------------------------------------
// 4. KIỂM TRA ÂM TIẾT TIẾNG VIỆT HỢP LỆ (không dấu) → không "sửa nhầm" từ thật
// ---------------------------------------------------------------------
const VI_SYLLABLE_RE = /^(ngh|ng|nh|ch|gh|gi|kh|ph|qu|th|tr|b|c|d|g|h|k|l|m|n|p|r|s|t|v|x)?(uye|uya|uyu|ieu|yeu|uoi|uou|oai|oay|oeo|uay|uoc|uon|uong|ai|ao|au|ay|eo|eu|ia|ie|iu|oa|oe|oi|ua|ue|ui|uo|uy|uu|ye|ya|a|e|i|o|u|y)(ch|nh|ng|c|m|n|p|t|i|o|u|y)?$/;

function isVietSyllable(tok) {
  return VI_SYLLABLE_RE.test(tok);
}

/** Sửa dấu Telex còn sót: dd→d, aa/aw→a, ee→e, oo/ow→o, uw→u, bỏ chữ cái thanh điệu cuối (s f r x j). */
function telexFix(tok) {
  if (!/^[a-z]+$/.test(tok) || tok.length < 3) return null;
  let t = tok.replace(/dd/g, 'd').replace(/aa|aw/g, 'a').replace(/ee/g, 'e').replace(/oo|ow/g, 'o').replace(/uw/g, 'u');
  // Chữ cái thanh điệu Telex gõ ở cuối từ (VD: "giamr", "hangf", "nhieeuf")
  const tryStrip = (s) => {
    if (isVietSyllable(s)) return s;
    if (/[sfrxj]$/.test(s) && isVietSyllable(s.slice(0, -1))) return s.slice(0, -1);
    return null;
  };
  const fixed = tryStrip(t);
  if (fixed && fixed !== tok) return fixed;
  return null;
}

// ---------------------------------------------------------------------
// 5. TỪ ĐIỂN SỐNG CHO SỬA LỖI CHÍNH TẢ MỜ
// ---------------------------------------------------------------------
let liveVocab = new Set();
let vocabByFirstChar = new Map();

function setVocabulary(words) {
  const next = new Set();
  for (const w of words || []) {
    for (const part of String(w || '').split(/\s+/)) {
      if (part && part.length >= 2 && /^[a-z0-9]+$/.test(part)) next.add(part);
    }
  }
  for (const v of Object.values(STATIC_ABBR)) for (const part of v.split(' ')) next.add(part);
  liveVocab = next;
  vocabByFirstChar = new Map();
  for (const w of next) {
    if (w.length < 4 || /\d/.test(w)) continue;
    const c = w[0];
    if (!vocabByFirstChar.has(c)) vocabByFirstChar.set(c, []);
    vocabByFirstChar.get(c).push(w);
  }
}

function damerau(a, b, maxDist) {
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > maxDist) return maxDist + 1;
  const d = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) d[i][0] = i;
  for (let j = 0; j <= bl; j++) d[0][j] = j;
  for (let i = 1; i <= al; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
      if (d[i][j] < rowMin) rowMin = d[i][j];
    }
    if (rowMin > maxDist) return maxDist + 1;
  }
  return d[al][bl];
}

/** Sửa lỗi chính tả mờ: chỉ áp dụng khi từ KHÔNG phải âm tiết Việt hợp lệ & KHÔNG có trong từ điển. */
function fuzzyCorrect(tok) {
  if (tok.length < 5 || !/^[a-z]+$/.test(tok) || liveVocab.has(tok)) return null;
  const maxDist = tok.length >= 8 ? 2 : 1;
  const pool = vocabByFirstChar.get(tok[0]) || [];
  let best = null;
  let bestDist = maxDist + 1;
  let tie = false;
  for (const w of pool) {
    if (Math.abs(w.length - tok.length) > maxDist) continue;
    const dist = damerau(tok, w, maxDist);
    if (dist < bestDist) { best = w; bestDist = dist; tie = false; }
    else if (dist === bestDist && w !== best) tie = true;
  }
  return best && bestDist <= maxDist && !tie ? best : null;
}

// ---------------------------------------------------------------------
// 6. HÀM CHUẨN HÓA CHÍNH
// ---------------------------------------------------------------------
function applyPhraseMap(text) {
  let out = ` ${text} `;
  for (const [from, to] of PHRASE_MAP) {
    if (out.includes(` ${from} `)) out = out.split(` ${from} `).join(` ${to} `);
  }
  return out.trim();
}

function stripAccents(str) {
  return String(str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9.,\s/-]/g, ' ')
    .replace(/[/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeVietnamese(cleaned) {
  if (!cleaned) return '';
  const rawNorm = stripAccents(cleaned);
  // B1: gộp ký tự kéo dài (chỉ chữ cái, ≥3 lần) — "dep qua troiii" → "dep qua troi"
  const collapsed = rawNorm.replace(/([a-z])\1{2,}/g, '$1');
  // B2: cụm tiếng Anh / cụm phổ biến
  const phrased = applyPhraseMap(collapsed);
  const toks = phrased.split(' ').filter(Boolean);
  const out = [];

  for (let i = 0; i < toks.length; i++) {
    let tok = toks[i];
    const prev = out.length ? out[out.length - 1].split(' ').pop() : '';
    const next = toks[i + 1] || '';
    const isLast = i === toks.length - 1;

    // B3: viết tắt theo ngữ cảnh → viết tắt tĩnh
    if (Object.prototype.hasOwnProperty.call(CONTEXT_ABBR, tok)) {
      out.push(CONTEXT_ABBR[tok](prev, next, isLast));
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(STATIC_ABBR, tok)) {
      out.push(STATIC_ABBR[tok]);
      continue;
    }

    // B4: từ đã đúng (âm tiết Việt / có trong từ điển / có số) → giữ nguyên
    if (/\d/.test(tok) || liveVocab.has(tok) || isVietSyllable(tok)) {
      out.push(tok);
      continue;
    }

    // B5: sửa Telex sót dấu → sửa chính tả mờ theo từ điển sống
    const tx = telexFix(tok);
    if (tx) {
      out.push(Object.prototype.hasOwnProperty.call(STATIC_ABBR, tx) ? STATIC_ABBR[tx] : tx);
      continue;
    }
    const fz = fuzzyCorrect(tok);
    out.push(fz || tok);
  }

  return applyPhraseMap(out.join(' ').replace(/\s+/g, ' ').trim());
}

module.exports = {
  normalizeVietnamese,
  setVocabulary,
  isVietSyllable,
  telexFix,
  fuzzyCorrect,
  STATIC_ABBR
};
