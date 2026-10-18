/**
 * CẤU HÌNH KẾT NỐI CƠ SỞ DỮ LIỆU POSTGRESQL (SUPABASE CLOUD)
 * Tương thích ngược toàn diện với cú pháp SQL Server cũ:
 * - Hỗ trợ tham số @param tự động đổi thành $1, $2...
 * - Hỗ trợ .recordset, .rowsAffected
 * - Hỗ trợ transaction withTransaction()
 */
const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

const CONNECTION_STRING = process.env.DATABASE_URL || process.env.DB_CONNECTION_STRING;

let pool = null;
let isConnected = false;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: CONNECTION_STRING,
      ssl: {
        rejectUnauthorized: false // Bắt buộc cho kết nối Supabase Cloud
      }
    });

    pool.on('connect', () => {
      isConnected = true;
      console.log('✅ [DB] Đã kết nối thành công tới Database Supabase (PostgreSQL)!');
    });

    pool.on('error', (err) => {
      console.error('❌ [DB] Lỗi kết nối Supabase:', err.message);
      isConnected = false;
    });
  }
  return pool;
}

// Khởi tạo pool ngay khi nạp module
getPool();

/**
 * Xử lý câu lệnh query: tự động chuyển cú pháp T-SQL cũ sang PostgreSQL
 */
function transformQuery(queryString, params = {}) {
  let text = queryString;
  const values = [];

  // 1. Chuyển đổi hàm thời gian & Boolean đặc thù của T-SQL
  text = text.replace(/SYSDATETIME\(\)/gi, 'NOW()');
  text = text.replace(/GETDATE\(\)/gi, 'NOW()');
  text = text.replace(/IsActive\s*=\s*1/gi, 'IsActive = TRUE');
  text = text.replace(/IsActive\s*=\s*0/gi, 'IsActive = FALSE');

  // 2. Chuyển đổi tham số @param thành $1, $2, $3...
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

/**
 * Hàm truy vấn chính (dùng lại được nguyên bản cho tất cả routes)
 */
async function query(queryString, params = {}) {
  const p = getPool();
  const { text, values } = transformQuery(queryString, params);

  const res = await p.query(text, values);

  // Đảm bảo tương thích với toàn bộ code cũ đang dùng result.recordset
  res.recordset = res.rows;
  res.recordsets = [res.rows];
  res.rowsAffected = [res.rowCount];

  return res;
}

/**
 * Chạy nhiều câu lệnh trong 1 transaction cho PostgreSQL
 */
async function withTransaction(work) {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');

    const q = async (text, params) => {
      const { text: transformedText, values } = transformQuery(text, params);
      const res = await client.query(transformedText, values);
      res.recordset = res.rows;
      res.recordsets = [res.rows];
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