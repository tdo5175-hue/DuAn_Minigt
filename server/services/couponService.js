/**
 * COUPON SERVICE — Quản lý mã giảm giá Admin & Đặc quyền VIP
 */
const db = require('../config/db');

// Danh sách mã VIP đặc quyền theo yêu cầu:
// VIP 1 (0 - 200k): 0%
// VIP 2 (201k - 500k): 2%
// VIP 3 (501k - 1tr): 4%
// VIP 4 (1tr001k - 5tr): 7%
// VIP 5 (trên 5tr): 10% (tối đa 10%)
const VIP_TIER_COUPONS = {
  VIP1: {
    code: 'VIP1',
    requiredLevel: 1,
    tierName: 'VIP 1 (Hội viên Mới)',
    discountPercent: 0,
    description: 'Đặc quyền VIP 1: Tích điểm hội viên và quà tặng sinh nhật',
    maxDiscount: 0
  },
  VIP2: {
    code: 'VIP2',
    requiredLevel: 2,
    tierName: 'VIP 2 (Collector Bạc)',
    discountPercent: 2,
    description: 'Đặc quyền VIP 2: Giảm 2% tổng giá trị đơn hàng',
    maxDiscount: 50000
  },
  VIP3: {
    code: 'VIP3',
    requiredLevel: 3,
    tierName: 'VIP 3 (Collector Vàng)',
    discountPercent: 4,
    description: 'Đặc quyền VIP 3: Giảm 4% tổng giá trị đơn hàng',
    maxDiscount: 100000
  },
  VIP4: {
    code: 'VIP4',
    requiredLevel: 4,
    tierName: 'VIP 4 (VIP Bạch Kim)',
    discountPercent: 7,
    description: 'Đặc quyền VIP 4: Giảm 7% tổng đơn + Mở khóa Ship COD',
    maxDiscount: 150000
  },
  VIP5: {
    code: 'VIP5',
    requiredLevel: 5,
    tierName: 'VIP 5 (VIP Kim Cương)',
    discountPercent: 10,
    description: 'Đặc quyền VIP 5: Giảm 10% kịch trần cao nhất hệ thống',
    maxDiscount: 300000
  }
};

const DEFAULT_ADMIN_COUPONS = [
  {
    couponId: 1,
    code: 'MINIGT30K',
    description: 'Ưu đãi đặt cọc khai trương showroom Biên Hòa',
    discountType: 'amount',
    discountValue: 30000,
    minOrderAmount: 300000,
    maxDiscount: 30000,
    usageLimit: 200,
    usedCount: 14,
    isActive: true,
    endDate: '2026-12-31'
  },
  {
    couponId: 2,
    code: 'SANXE50K',
    description: 'Giảm ngay 50.000đ cho đơn hàng xe đua từ 600.000đ',
    discountType: 'amount',
    discountValue: 50000,
    minOrderAmount: 600000,
    maxDiscount: 50000,
    usageLimit: 100,
    usedCount: 28,
    isActive: true,
    endDate: '2026-12-31'
  },
  {
    couponId: 3,
    code: 'MINIGT10P',
    description: 'Mã giảm giá 10% đặc biệt tri ân collector Biên Hòa',
    discountType: 'percent',
    discountValue: 10, // Tối đa 10%
    minOrderAmount: 500000,
    maxDiscount: 120000,
    usageLimit: 80,
    usedCount: 9,
    isActive: true,
    endDate: '2026-12-31'
  }
];

let inMemoryCoupons = [...DEFAULT_ADMIN_COUPONS];
let isTableInitialized = false;

async function ensureTable() {
  if (isTableInitialized) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS Coupons (
        CouponId SERIAL PRIMARY KEY,
        Code VARCHAR(50) UNIQUE NOT NULL,
        Description VARCHAR(255) NOT NULL,
        DiscountType VARCHAR(20) NOT NULL,
        DiscountValue NUMERIC NOT NULL,
        MinOrderAmount NUMERIC DEFAULT 0,
        MaxDiscount NUMERIC DEFAULT NULL,
        UsageLimit INT DEFAULT 100,
        UsedCount INT DEFAULT 0,
        StartDate TIMESTAMP DEFAULT NOW(),
        EndDate TIMESTAMP NULL,
        IsActive BOOLEAN DEFAULT TRUE,
        CreatedAt TIMESTAMP DEFAULT NOW()
      );
    `);

    // Kiểm tra xem bảng đã có dữ liệu chưa
    const check = await db.query('SELECT COUNT(*) as count FROM Coupons');
    const cnt = Number(check.recordset[0]?.count || 0);
    if (cnt === 0) {
      for (const c of DEFAULT_ADMIN_COUPONS) {
        await db.query(`
          INSERT INTO Coupons (Code, Description, DiscountType, DiscountValue, MinOrderAmount, MaxDiscount, UsageLimit, UsedCount, IsActive, EndDate)
          VALUES (@code, @desc, @type, @val, @minOrd, @maxDisc, @limit, @used, @active, @end)
          ON CONFLICT (Code) DO NOTHING
        `, {
          code: c.code,
          desc: c.description,
          type: c.discountType,
          val: c.discountValue,
          minOrd: c.minOrderAmount,
          maxDisc: c.maxDiscount,
          limit: c.usageLimit,
          used: c.usedCount,
          active: c.isActive,
          end: c.endDate
        });
      }
    }
    isTableInitialized = true;
  } catch (err) {
    console.warn('[COUPON SERVICE] Lỗi tạo bảng Coupons trên Supabase, dùng memory/Settings fallback:', err.message);
  }
}

function normalizeCouponRow(r) {
  if (!r) return null;
  return {
    couponId: Number(r.CouponId ?? r.couponid ?? r.id),
    id: Number(r.CouponId ?? r.couponid ?? r.id),
    code: String(r.Code ?? r.code ?? '').toUpperCase().trim(),
    description: String(r.Description ?? r.description ?? ''),
    discountType: String(r.DiscountType ?? r.discounttype ?? 'amount').toLowerCase(),
    discountValue: Number(r.DiscountValue ?? r.discountvalue ?? 0),
    minOrderAmount: Number(r.MinOrderAmount ?? r.minorderamount ?? 0),
    maxDiscount: r.MaxDiscount != null ? Number(r.MaxDiscount) : null,
    usageLimit: Number(r.UsageLimit ?? r.usagelimit ?? 100),
    usedCount: Number(r.UsedCount ?? r.usedcount ?? 0),
    isActive: Boolean(r.IsActive ?? r.isactive ?? true),
    endDate: r.EndDate ? new Date(r.EndDate).toISOString().slice(0, 10) : null,
    createdAt: r.CreatedAt || new Date().toISOString()
  };
}

async function listAdminCoupons() {
  await ensureTable();
  try {
    const res = await db.query('SELECT * FROM Coupons ORDER BY CouponId DESC');
    if (res.recordset && res.recordset.length > 0) {
      return res.recordset.map(normalizeCouponRow);
    }
  } catch (err) {
    console.warn('[COUPONS] Lỗi đọc bảng Coupons từ DB, dùng cache ram:', err.message);
  }
  return inMemoryCoupons;
}

async function getCouponByCode(rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return null;

  // 1. Kiểm tra mã VIP đặc quyền
  if (VIP_TIER_COUPONS[code]) {
    return {
      isVipCoupon: true,
      ...VIP_TIER_COUPONS[code]
    };
  }

  // 2. Kiểm tra mã do Admin tạo trong DB
  await ensureTable();
  try {
    const res = await db.query('SELECT * FROM Coupons WHERE UPPER(Code) = @code', { code });
    if (res.recordset && res.recordset.length > 0) {
      return normalizeCouponRow(res.recordset[0]);
    }
  } catch (err) {
    console.warn('[COUPONS] DB query failed, using memory:', err.message);
  }

  return inMemoryCoupons.find(c => c.code.toUpperCase() === code) || null;
}

async function createCoupon(data) {
  await ensureTable();
  const code = String(data.code || '').trim().toUpperCase();
  const description = String(data.description || 'Ưu đãi từ quản trị viên').trim();
  const discountType = (data.discountType === 'percent') ? 'percent' : 'amount';
  let discountValue = Number(data.discountValue || 0);

  // Quy định tối đa 10% nếu chọn loại giảm %
  if (discountType === 'percent') {
    if (discountValue <= 0) discountValue = 5;
    if (discountValue > 10) discountValue = 10; // Kịch trần 10% theo yêu cầu
  } else {
    if (discountValue < 1000) discountValue = 10000;
  }

  const minOrderAmount = Math.max(0, Number(data.minOrderAmount || 0));
  const maxDiscount = data.maxDiscount ? Math.max(0, Number(data.maxDiscount)) : null;
  const usageLimit = Math.max(1, Number(data.usageLimit || 100));
  const endDate = data.endDate ? String(data.endDate).slice(0, 10) : null;
  const isActive = data.isActive !== false;

  if (!code || code.length < 3) {
    const err = new Error('Mã giảm giá phải có tối thiểu 3 ký tự (chữ hoặc số)!');
    err.status = 400;
    throw err;
  }

  if (VIP_TIER_COUPONS[code]) {
    const err = new Error(`Mã "${code}" trùng với mã đặc quyền VIP hệ thống! Vui lòng chọn mã khác.`);
    err.status = 400;
    throw err;
  }

  try {
    const res = await db.query(`
      INSERT INTO Coupons (Code, Description, DiscountType, DiscountValue, MinOrderAmount, MaxDiscount, UsageLimit, UsedCount, IsActive, EndDate)
      VALUES (@code, @desc, @type, @val, @minOrd, @maxDisc, @limit, 0, @active, @end)
      RETURNING *
    `, {
      code,
      desc: description,
      type: discountType,
      val: discountValue,
      minOrd: minOrderAmount,
      maxDisc: maxDiscount,
      limit: usageLimit,
      active: isActive,
      end: endDate
    });
    return normalizeCouponRow(res.recordset[0]);
  } catch (err) {
    if (err.message && err.message.includes('unique')) {
      const e = new Error(`Mã giảm giá "${code}" đã tồn tại! Vui lòng đặt mã khác.`);
      e.status = 409;
      throw e;
    }
    // Fallback ram
    const newC = {
      couponId: Date.now(),
      id: Date.now(),
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      usedCount: 0,
      isActive,
      endDate
    };
    inMemoryCoupons.unshift(newC);
    return newC;
  }
}

async function updateCoupon(couponId, data) {
  await ensureTable();
  const id = Number(couponId);
  const code = String(data.code || '').trim().toUpperCase();
  const description = String(data.description || '').trim();
  const discountType = (data.discountType === 'percent') ? 'percent' : 'amount';
  let discountValue = Number(data.discountValue || 0);
  if (discountType === 'percent' && discountValue > 10) discountValue = 10;

  const minOrderAmount = Math.max(0, Number(data.minOrderAmount || 0));
  const maxDiscount = data.maxDiscount ? Math.max(0, Number(data.maxDiscount)) : null;
  const usageLimit = Math.max(1, Number(data.usageLimit || 100));
  const endDate = data.endDate ? String(data.endDate).slice(0, 10) : null;
  const isActive = Boolean(data.isActive);

  try {
    const res = await db.query(`
      UPDATE Coupons
      SET Code = COALESCE(NULLIF(@code, ''), Code),
          Description = @desc,
          DiscountType = @type,
          DiscountValue = @val,
          MinOrderAmount = @minOrd,
          MaxDiscount = @maxDisc,
          UsageLimit = @limit,
          IsActive = @active,
          EndDate = @end
      WHERE CouponId = @id
      RETURNING *
    `, {
      code,
      desc: description,
      type: discountType,
      val: discountValue,
      minOrd: minOrderAmount,
      maxDisc: maxDiscount,
      limit: usageLimit,
      active: isActive,
      end: endDate,
      id
    });
    if (res.recordset && res.recordset.length > 0) {
      return normalizeCouponRow(res.recordset[0]);
    }
  } catch (err) {
    console.warn('[COUPONS] DB update error, updating memory:', err.message);
  }

  const idx = inMemoryCoupons.findIndex(c => c.couponId === id || c.id === id);
  if (idx >= 0) {
    inMemoryCoupons[idx] = Object.assign({}, inMemoryCoupons[idx], {
      code, description, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, isActive, endDate
    });
    return inMemoryCoupons[idx];
  }
  return null;
}

async function deleteCoupon(couponId) {
  await ensureTable();
  const id = Number(couponId);
  try {
    await db.query('DELETE FROM Coupons WHERE CouponId = @id', { id });
  } catch (err) {
    console.warn('[COUPONS] Delete error in DB:', err.message);
  }
  inMemoryCoupons = inMemoryCoupons.filter(c => c.couponId !== id && c.id !== id);
  return { success: true };
}

/**
 * XÁC THỰC VÀ ÁP DỤNG MÃ GIẢM GIÁ
 * Chỉ nhận mã do Admin tạo HOẶC mã đặc quyền VIP theo cấp bậc hội viên!
 */
async function validateAndApplyCoupon(rawCode, subtotal = 0, user = null) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, message: 'Vui lòng nhập mã ưu đãi!' };
  }

  // 1. KIỂM TRA MÃ VIP ĐẶC QUYỀN
  if (VIP_TIER_COUPONS[code]) {
    const vipCfg = VIP_TIER_COUPONS[code];
    if (!user) {
      return {
        valid: false,
        message: `Mã "${code}" là đặc quyền của ${vipCfg.tierName}. Vui lòng ĐĂNG NHẬP tài khoản để sử dụng!`
      };
    }

    // Tính cấp VIP hiện tại của người dùng dựa trên totalSpent / deliveredSpent
    const spent = Math.max(0, Number(user.totalSpent || user.deliveredSpent || 0));
    let userLevel = 1;
    if (spent > 5000000) userLevel = 5;
    else if (spent > 1000000) userLevel = 4;
    else if (spent > 500000) userLevel = 3;
    else if (spent > 200000) userLevel = 2;

    if (userLevel < vipCfg.requiredLevel) {
      return {
        valid: false,
        message: `🔒 Mã "${code}" chỉ dành riêng cho thành viên ${vipCfg.tierName} trở lên. Cấp hiện tại của bạn là VIP ${userLevel} (Đã tích lũy: ${new Intl.NumberFormat('vi-VN').format(spent)}đ). Hãy mua thêm để thăng hạng!`
      };
    }

    if (vipCfg.discountPercent === 0) {
      return {
        valid: false,
        message: 'Hội viên VIP 1 đang ở cấp chào mừng. Khi tích lũy trên 200.000đ bạn sẽ lên VIP 2 và nhận mã giảm 2%!'
      };
    }

    let discount = Math.round(subtotal * (vipCfg.discountPercent / 100));
    if (vipCfg.maxDiscount && discount > vipCfg.maxDiscount) {
      discount = vipCfg.maxDiscount;
    }

    return {
      valid: true,
      code,
      isVip: true,
      discount,
      discountType: 'percent',
      discountValue: vipCfg.discountPercent,
      description: `${vipCfg.tierName}: Giảm ${vipCfg.discountPercent}% (-${new Intl.NumberFormat('vi-VN').format(discount)}đ)`
    };
  }

  // 2. KIỂM TRA MÃ DO ADMIN TẠO
  const coupon = await getCouponByCode(code);
  if (!coupon || coupon.isVipCoupon) {
    return {
      valid: false,
      message: `Mã giảm giá "${code}" không tồn tại hoặc đã bị hủy! Hệ thống chỉ áp dụng mã do Admin phát hành hoặc mã đặc quyền VIP.`
    };
  }

  if (!coupon.isActive) {
    return { valid: false, message: `Mã giảm giá "${code}" hiện đang tạm ngừng áp dụng.` };
  }

  if (coupon.endDate) {
    const exp = new Date(coupon.endDate + 'T23:59:59');
    if (Date.now() > exp.getTime()) {
      return { valid: false, message: `Mã giảm giá "${code}" đã hết hạn sử dụng (${coupon.endDate}).` };
    }
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: `Mã giảm giá "${code}" đã hết lượt sử dụng theo chương trình khuyến mãi.` };
  }

  if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Đơn hàng chưa đạt giá trị tối thiểu ${new Intl.NumberFormat('vi-VN').format(coupon.minOrderAmount)}đ để áp dụng mã "${code}".`
    };
  }

  let discount = 0;
  if (coupon.discountType === 'percent') {
    const pct = Math.min(10, Math.max(1, coupon.discountValue)); // Tối đa 10%
    discount = Math.round(subtotal * (pct / 100));
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = Math.min(subtotal, coupon.discountValue);
  }

  return {
    valid: true,
    code: coupon.code,
    isVip: false,
    discount,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    description: coupon.description || `Giảm ngay ${new Intl.NumberFormat('vi-VN').format(discount)}đ`
  };
}

module.exports = {
  VIP_TIER_COUPONS,
  listAdminCoupons,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateAndApplyCoupon
};
