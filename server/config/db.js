/**
 * CẤU HÌNH KẾT NỐI CƠ SỞ DỮ LIỆU SQL SERVER
 * Driver: ODBC (msnodesqlv8, Windows Authentication)
 * Chuỗi kết nối đọc từ biến môi trường DB_CONNECTION_STRING (.env)
 */
const sql = require('mssql/msnodesqlv8');
require('dotenv').config({ quiet: true });

const PRIMARY_CONN = process.env.DB_CONNECTION_STRING ||
  'Driver={ODBC Driver 17 for SQL Server};Server=QUOCTHINH\\DOQUOCTHINH;Database=MiniGTStore;Trusted_Connection=yes;';
// Fallback sang ODBC Driver 18 với cùng Server/Database
const FALLBACK_CONN = PRIMARY_CONN
  .replace(/ODBC Driver 17 for SQL Server/i, 'ODBC Driver 18 for SQL Server')
  .replace(/;?$/, ';TrustServerCertificate=yes;');

let pool = null;
let connecting = null;
let isConnected = false;

async function connect(connectionString) {
  const p = new sql.ConnectionPool({ connectionString });
  p.on('error', (err) => {
    console.error('[DB] Pool error:', err.message);
    isConnected = false;
  });
  await p.connect();
  return p;
}

async function getPool() {
  if (pool && isConnected) return pool;
  if (connecting) return connecting;

  connecting = (async () => {
    try {
      pool = await connect(PRIMARY_CONN);
      isConnected = true;
      console.log('[DB] Kết nối SQL Server thành công.');
    } catch (err) {
      console.warn('[DB] Driver 17 lỗi:', err.message, '→ thử ODBC Driver 18');
      try {
        pool = await connect(FALLBACK_CONN);
        isConnected = true;
        console.log('[DB] Kết nối thành công qua ODBC Driver 18.');
      } catch (err2) {
        console.error('[DB] Không thể kết nối SQL Server:', err2.message);
        pool = null;
        isConnected = false;
      }
    } finally {
      connecting = null;
    }
    return pool;
  })();
  return connecting;
}

function bind(request, params) {
  for (const [key, val] of Object.entries(params || {})) {
    request.input(key, val === undefined ? null : val);
  }
  return request;
}

async function query(queryString, params = {}) {
  const p = await getPool();
  if (!p) {
    const e = new Error('Cơ sở dữ liệu hiện không khả dụng');
    e.status = 503;
    throw e;
  }
  return bind(p.request(), params).query(queryString);
}

/**
 * Chạy nhiều câu lệnh trong 1 transaction.
 * usage: await db.withTransaction(async (q) => { await q('UPDATE ...', {...}); })
 */
async function withTransaction(work) {
  const p = await getPool();
  if (!p) {
    const e = new Error('Cơ sở dữ liệu hiện không khả dụng');
    e.status = 503;
    throw e;
  }
  const tx = new sql.Transaction(p);
  await tx.begin();
  const q = (text, params) => bind(new sql.Request(tx), params).query(text);
  try {
    const result = await work(q);
    await tx.commit();
    return result;
  } catch (err) {
    try { await tx.rollback(); } catch (_) { /* ignore */ }
    throw err;
  }
}

module.exports = {
  sql,
  getPool,
  query,
  withTransaction,
  isConnected: () => isConnected
};
