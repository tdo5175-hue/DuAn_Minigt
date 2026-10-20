/**
 * SETTINGS SERVICE — cấu hình cửa hàng lưu trong bảng Settings (cache 60s)
 */
const db = require('../config/db');

const PUBLIC_KEYS = [
  'store_name', 'store_hotline', 'store_email', 'store_address',
  'shipping_fee', 'free_shipping_threshold', 'deposit_rate', 'preorder_deadline',
  'bank_id', 'bank_name', 'bank_account_no', 'bank_account_name', 'announcement'
];
const EDITABLE_KEYS = [...PUBLIC_KEYS, 'low_stock_threshold'];
const NUMERIC_KEYS = ['shipping_fee', 'free_shipping_threshold', 'deposit_rate', 'low_stock_threshold'];

const DEFAULT_SETTINGS = {
  store_name: 'MINI GT STORE BIÊN HÒA',
  store_hotline: '0988.164.164',
  store_email: 'quocthinh.admin@minigt.vn',
  store_address: '38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai',
  shipping_fee: 11000,
  free_shipping_threshold: 1000000,
  deposit_rate: 0.3,
  low_stock_threshold: 5,
  preorder_deadline: 'Tháng 11/2026',
  bank_id: 'MB',
  bank_name: 'Ngân hàng Quân Đội (MB Bank)',
  bank_account_no: '0988164164',
  bank_account_name: 'DO QUOC THINH',
  announcement: 'Chào mừng bạn đến với MINI GT STORE BIÊN HÒA - Hệ thống phân phối mô hình tĩnh 1:64 chính hãng!'
};

let cache = null;
let cacheAt = 0;

async function getAll(force = false) {
  if (!force && cache && Date.now() - cacheAt < 60000) return cache;
  const out = { ...DEFAULT_SETTINGS };
  try {
    const r = await db.query('SELECT SettingKey, SettingValue FROM Settings');
    for (const row of (r.recordset || [])) {
      const k = row.SettingKey || row.settingkey;
      const v = row.SettingValue ?? row.settingvalue;
      if (k) {
        out[k] = NUMERIC_KEYS.includes(k) ? (Number(v) || 0) : v;
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc bảng Settings từ DB, dùng cấu hình mặc định:', err.message);
  }
  cache = out;
  cacheAt = Date.now();
  return out;
}

async function getPublic() {
  const all = await getAll();
  const pub = {};
  for (const k of PUBLIC_KEYS) pub[k] = all[k] ?? null;
  return pub;
}

async function update(values) {
  const entries = Object.entries(values || {}).filter(([k]) => EDITABLE_KEYS.includes(k));
  for (const [k, v] of entries) {
    let val = v === null || v === undefined ? '' : String(v).trim().slice(0, 1000);
    if (NUMERIC_KEYS.includes(k)) {
      const n = Number(val);
      if (!Number.isFinite(n) || n < 0) {
        const e = new Error(`Giá trị "${k}" phải là số không âm`); e.status = 400; throw e;
      }
      if (k === 'deposit_rate' && n > 1) {
        const e = new Error('Tỉ lệ cọc phải trong khoảng 0 – 1 (VD: 0.3 = 30%)'); e.status = 400; throw e;
      }
      val = String(n);
    }
    await db.query(`
      INSERT INTO Settings (SettingKey, SettingValue, UpdatedAt)
      VALUES (@k, @v, NOW())
      ON CONFLICT (SettingKey)
      DO UPDATE SET SettingValue = EXCLUDED.SettingValue, UpdatedAt = NOW()
    `, { k, v: val });
  }
  return getAll(true);
}

function shippingFeeFor(settings, method, subtotal) {
  if (method === 'PICKUP') return 0;
  const threshold = Number(settings.free_shipping_threshold) || 0;
  if (threshold > 0 && subtotal >= threshold) return 0;
  return Number(settings.shipping_fee) || 0;
}

function buildVietQr(settings, amount, orderCode) {
  if (!settings.bank_id || !settings.bank_account_no) return null;
  const content = `MINI GT ${orderCode}`;
  return {
    bankId: settings.bank_id,
    bankName: settings.bank_name,
    accountNo: settings.bank_account_no,
    accountName: settings.bank_account_name,
    amount,
    content,
    qrUrl: `https://img.vietqr.io/image/${encodeURIComponent(settings.bank_id)}-${encodeURIComponent(settings.bank_account_no)}-compact2.png?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(settings.bank_account_name || '')}`
  };
}

module.exports = { getAll, getSettings: getAll, getPublic, update, shippingFeeFor, buildVietQr, EDITABLE_KEYS };
