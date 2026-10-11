/**
 * CẤU HÌNH KẾT NỐI CƠ SỞ DỮ LIỆU SQL SERVER
 * Máy chủ: QUOCTHINH\DOQUOCTHINH (SSMS)
 * Cơ sở dữ liệu: MiniGTStore
 * Driver: ODBC Driver 17 for SQL Server / msnodesqlv8 (Windows Authentication)
 */

const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const connectionString = process.env.DB_CONNECTION_STRING || 
  'Driver={ODBC Driver 17 for SQL Server};Server=QUOCTHINH\\DOQUOCTHINH;Database=MiniGTStore;Trusted_Connection=yes;';

let pool = null;
let isConnected = false;

async function getPool() {
  if (pool && isConnected) return pool;

  try {
    console.log('[DB] Đang kết nối tới SQL Server QUOCTHINH\\DOQUOCTHINH...');
    pool = await sql.connect({
      connectionString: connectionString
    });
    isConnected = true;
    console.log('[DB] Kết nối thành công tới cơ sở dữ liệu MiniGTStore trên QUOCTHINH\\DOQUOCTHINH!');
    return pool;
  } catch (error) {
    console.warn('[DB] Lỗi kết nối SQL Server:', error.message);
    // Thử driver 18 nếu driver 17 gặp lỗi
    try {
      const fallbackConnStr = 'Driver={ODBC Driver 18 for SQL Server};Server=QUOCTHINH\\DOQUOCTHINH;Database=MiniGTStore;Trusted_Connection=yes;TrustServerCertificate=yes;';
      pool = await sql.connect({ connectionString: fallbackConnStr });
      isConnected = true;
      console.log('[DB] Kết nối thành công qua ODBC Driver 18!');
      return pool;
    } catch (err2) {
      console.error('[DB] Không thể kết nối SQL Server:', err2.message);
      isConnected = false;
      return null;
    }
  }
}

async function query(queryString, params = {}) {
  const p = await getPool();
  if (!p) {
    throw new Error('Database connection not available');
  }
  const request = p.request();
  for (const [key, val] of Object.entries(params)) {
    request.input(key, val);
  }
  return await request.query(queryString);
}

module.exports = {
  sql,
  getPool,
  query,
  isConnected: () => isConnected
};
