/**
 * CẤU HÌNH KẾT NỐI SUPABASE POSTGRESQL KÈM BỘ CHUYỂN ĐỔI TỰ ĐỘNG T-SQL
 */
const { Pool, types } = require('pg');
require('dotenv').config({ quiet: true });

// Tự động ép kiểu DECIMAL/NUMERIC của Postgres sang Number
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

const CONNECTION_STRING = process.env.DATABASE_URL || process.env.DB_CONNECTION_STRING || 'postgresql://postgres.jrxqznqitjzfbhzbppuu:Doquocthinh123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

const COLUMN_MAP = {
  categoryid: 'CategoryId', categoryslug: 'CategorySlug', categoryname: 'CategoryName',
  productid: 'ProductId', sku: 'Sku', carnumber: 'CarNumber', name: 'Name', slug: 'Slug',
  brand: 'Brand', scale: 'Scale', packagingtype: 'PackagingType', pricebox: 'PriceBox',
  pricecard: 'PriceCard', discountpercent: 'DiscountPercent', price: 'Price',
  oldprice: 'OldPrice', depositamount: 'DepositAmount', editionnote: 'EditionNote',
  preorderdeadline: 'PreOrderDeadline', stockbox: 'StockBox', stockcard: 'StockCard',
  stock: 'Stock', imageurl: 'ImageUrl', description: 'Description', status: 'Status',
  releasedate: 'ReleaseDate', expecteddelivery: 'ExpectedDelivery',
  depositpercent: 'DepositPercent', isfeatured: 'IsFeatured', isnew: 'IsNew',
  isactive: 'IsActive', createdat: 'CreatedAt', updatedat: 'UpdatedAt', soldcount: 'SoldCount',
  imageid: 'ImageId', sortorder: 'SortOrder',
  userid: 'UserId', fullname: 'FullName', email: 'Email', passwordhash: 'PasswordHash',
  googleid: 'GoogleId', avatarurl: 'AvatarUrl', phone: 'Phone', address: 'Address',
  authprovider: 'AuthProvider', role: 'Role', lastloginat: 'LastLoginAt',
  orderid: 'OrderId', ordercode: 'OrderCode', note: 'Note', shippingmethod: 'ShippingMethod',
  paymentmethod: 'PaymentMethod', paymentstatus: 'PaymentStatus', cancelreason: 'CancelReason',
  receiptimage: 'ReceiptImage', subtotal: 'Subtotal', shippingfee: 'ShippingFee',
  total: 'Total', stockreserved: 'StockReserved', trackingcode: 'TrackingCode',
  trackingcarrier: 'TrackingCarrier', haspreorder: 'HasPreOrder',
  preorderexpected: 'PreOrderExpected', preordernotified: 'PreOrderNotified',
  orderitemid: 'OrderItemId', productname: 'ProductName', packagingoption: 'PackagingOption',
  unitprice: 'UnitPrice', quantity: 'Quantity', linetotal: 'LineTotal',
  historyid: 'HistoryId', fromstatus: 'FromStatus', tostatus: 'ToStatus', changedby: 'ChangedBy',
  reviewid: 'ReviewId', rating: 'Rating', comment: 'Comment',
  settingkey: 'SettingKey', settingvalue: 'SettingValue', subscriberid: 'SubscriberId'
};

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const out = { ...row };
    for (const [k, v] of Object.entries(row)) {
      const pascalKey = COLUMN_MAP[k.toLowerCase()];
      if (pascalKey && out[pascalKey] === undefined) {
        out[pascalKey] = v;
      }
    }
    return out;
  });
}

let pool = null;
let isConnected = false;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: CONNECTION_STRING,
      ssl: { rejectUnauthorized: false }
    });

    pool.on('connect', () => {
      isConnected = true;
      console.log('✅ [DB] Đã kết nối thành công tới Supabase (PostgreSQL)!');
    });

    pool.on('error', (err) => {
      console.error('❌ [DB] Lỗi kết nối Supabase:', err.message);
      isConnected = false;
    });
  }
  return pool;
}

getPool();

function transformQuery(queryString, params = {}) {
  let text = queryString;
  const values = [];

  // 1. Bỏ tiền tố dbo.
  text = text.replace(/\bdbo\./gi, '');

  // 2. Chuyển hàm thời gian & ISNULL
  text = text.replace(/\bSYSDATETIME\(\)/gi, 'NOW()');
  text = text.replace(/\bGETDATE\(\)/gi, 'NOW()');
  text = text.replace(/\bISNULL\s*\(/gi, 'COALESCE(');

  // 3. Chuyển TRY_CAST(x AS INT) sang cú pháp an toàn của PostgreSQL
  text = text.replace(
    /TRY_CAST\s*\(\s*([^)]+?)\s+AS\s+INT\s*\)/gi,
    "(CASE WHEN CAST($1 AS TEXT) ~ '^[0-9]+$' THEN CAST(CAST($1 AS TEXT) AS INT) ELSE NULL END)"
  );

  // 4. Tự động chuyển OUTPUT INSERTED.* ở giữa câu lệnh thành RETURNING * ở cuối câu lệnh
  let returningClause = '';
  const outputMatch = text.match(/\bOUTPUT\s+(INSERTED\.[*\w\s,._]+?)(?=\s+(?:VALUES|WHERE|SELECT)\b)/i);
  if (outputMatch) {
    const cols = outputMatch[1].replace(/\bINSERTED\./gi, '').trim();
    returningClause = ` RETURNING ${cols}`;
    text = text.replace(outputMatch[0], '');
  }

  // 5. Chuyển các phép gán/so sánh cột Boolean từ 1/0 sang TRUE/FALSE
  text = text.replace(/\b(IsActive|IsFeatured|IsNew|StockReserved|HasPreOrder|PreOrderNotified)\s*=\s*1\b/gi, '$1 = TRUE');
  text = text.replace(/\b(IsActive|IsFeatured|IsNew|StockReserved|HasPreOrder|PreOrderNotified)\s*=\s*0\b/gi, '$1 = FALSE');

  if (returningClause) {
    text = text.replace(/;?\s*$/, `${returningClause};`);
  }

  // 6. Chuyển tham số @param sang $1, $2...
  if (params && typeof params === 'object' && !Array.isArray(params)) {
    let index = 1;
    for (const [key, val] of Object.entries(params)) {
      const regex = new RegExp(`@${key}\\b`, 'g');
      if (regex.test(text)) {
        text = text.replace(regex, `$${index}`);
        values.push(val === undefined ? null : val);
        index++;
      }
    }
  } else if (Array.isArray(params)) {
    values.push(...params);
  }

  return { text, values };
}

async function query(queryString, params = {}) {
  const p = getPool();
  const { text, values } = transformQuery(queryString, params);
  const res = await p.query(text, values);

  const normalized = normalizeRows(res.rows);
  res.rows = normalized;
  res.recordset = normalized;
  res.recordsets = [normalized];
  res.rowsAffected = [res.rowCount];
  return res;
}

async function withTransaction(work) {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const q = async (text, params) => {
      const { text: transformedText, values } = transformQuery(text, params);
      const res = await client.query(transformedText, values);
      const normalized = normalizeRows(res.rows);
      res.rows = normalized;
      res.recordset = normalized;
      res.recordsets = [normalized];
      res.rowsAffected = [res.rowCount];
      return res;
    };
    const result = await work(q);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getPool,
  query,
  withTransaction,
  isConnected: () => isConnected
};