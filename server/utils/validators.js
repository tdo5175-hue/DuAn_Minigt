/**
 * Validators & sanitizers dùng chung cho các route.
 */
const { badRequest } = require('./http');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GMAIL_RE = /^[^\s@]+@gmail\.com$/i;
const PHONE_RE = /^(0|\+?84)\d{8,10}$/;

function str(v, max = 255) {
  if (v === undefined || v === null) return '';
  return String(v).trim().slice(0, max);
}

function optStr(v, max = 255) {
  const s = str(v, max);
  return s === '' ? null : s;
}

function int(v, { min = -Infinity, max = Infinity, def = null } = {}) {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return def;
  return Math.min(max, Math.max(min, n));
}

function num(v, def = null) {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function normalizePhone(p) {
  return str(p, 20).replace(/[\s.\-()]/g, '');
}

function isEmail(e) { return EMAIL_RE.test(String(e || '')); }
function isGmail(e) { return GMAIL_RE.test(String(e || '')); }
function isPhone(p) { return PHONE_RE.test(normalizePhone(p)); }

function requireFields(obj, fields) {
  const missing = fields.filter((f) => obj[f] === undefined || obj[f] === null || String(obj[f]).trim() === '');
  if (missing.length) throw badRequest('Thiếu thông tin bắt buộc: ' + missing.join(', '), { missing });
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180) || 'mini-gt';
}

/** Escape ký tự đặc biệt của LIKE trong SQL Server */
function likeParam(s) {
  return '%' + String(s).replace(/[\[\]%_]/g, (m) => '[' + m + ']') + '%';
}

module.exports = { str, optStr, int, num, normalizePhone, isEmail, isGmail, isPhone, requireFields, slugify, likeParam };
