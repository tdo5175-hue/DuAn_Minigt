/**
 * Validate helpers for Mini GT Store
 */
module.exports = {
  cleanStr: (val, max = 255) => String(val || '').trim().slice(0, max),
  cleanPhone: (val) => String(val || '').replace(/[\s.\-()]/g, ''),
  isVNPhone: (val) => /^(0|\+?84)\d{8,10}$/.test(String(val || '').replace(/[\s.\-()]/g, '')),
  posInt: (val, def = 0) => {
    const n = parseInt(val, 10);
    return (Number.isFinite(n) && n > 0) ? n : def;
  },
  isPassword: (val) => String(val || '').length >= 6,
  isEmail: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || '').trim())
};
