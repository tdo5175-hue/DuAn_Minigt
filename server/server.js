/**
 * MINI GT STORE - BACKEND SERVER (CLOUD READY)
 */
const express = require('express');
const path = require('path');
require('dotenv').config({ quiet: true });

const db = require('./config/db');
const { errorHandler } = require('./utils/http');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const newsletterRoutes = require('./routes/newsletter');
const settingsRoutes = require('./routes/settings');
const adminRoutes = require('./routes/admin');
const couponRoutes = require('./routes/coupons');

const app = express();
const PORT = process.env.PORT || 5000;

// =================================================================
// 1. CẤU HÌNH CORS TỰ ĐỘNG CHO VERCEL & MỌI THIẾT BỊ (KHÔNG BỊ CHẶN)
// =================================================================
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Trả về ngay mã 200 cho mọi request kiểm tra Preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// 2. Parsing Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware chuẩn hóa URL tương thích môi trường Vercel Serverless
app.use((req, res, next) => {
  const originalUrl = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'];
  if (originalUrl) {
    if (req.url === '/api/index.js' || req.url === '/api' || req.url === '/api/index' || req.url.startsWith('/api/[...all]') || !req.url.startsWith('/api')) {
      req.url = originalUrl.startsWith('/api') ? originalUrl : `/api${originalUrl}`;
    }
  }
  next();
});

// 3. Phục vụ Static Files
const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(rootDir, 'admin', 'index.html'));
});

// 4. API Routes (Hỗ trợ cả tiền tố /api và không có /api để tương thích 100% với Vercel Serverless)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/products', '/products'], productRoutes);
app.use(['/api/orders', '/orders'], orderRoutes);
app.use(['/api/newsletter', '/newsletter'], newsletterRoutes);
app.use(['/api/settings', '/settings'], settingsRoutes);
app.use(['/api/admin', '/admin'], adminRoutes);
app.use(['/api/coupons', '/coupons'], couponRoutes);

app.get(['/api/categories', '/categories'], async (req, res, next) => {
  try {
    const productService = require('./services/productService');
    const categories = await productService.listCategories();
    return res.status(200).json({ success: true, data: categories });
  } catch (err) { next(err); }
});

app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    success: true,
    message: 'Hệ thống máy chủ hoạt động bình thường',
    data: {
      appName: 'MINI GT STORE BACKEND',
      database: 'Supabase PostgreSQL Cloud',
      connected: db.isConnected(),
      timestamp: new Date().toISOString()
    }
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint không tồn tại: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
    data: null
  });
});

app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.sendFile(path.join(rootDir, 'index.html'));
  } else {
    next();
  }
});

app.use(errorHandler);

async function startServer() {
  try {
    await db.getPool();
    // Kích hoạt kết nối pool ngay lập tức tới Supabase & bảo đảm constraint ck_orders_payment
    try { 
      await db.query('SELECT 1'); 
      await db.query(`
        DO $$
        BEGIN
          ALTER TABLE orders DROP CONSTRAINT IF EXISTS ck_orders_payment;
          ALTER TABLE orders ADD CONSTRAINT ck_orders_payment 
            CHECK (paymentmethod = ANY (ARRAY['COD'::text, 'BANK_TRANSFER'::text, 'DEPOSIT'::text, 'VIETQR_PAYOS'::text, 'PAYOS'::text]));
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END $$;
      `);
    } catch (dbErr) { console.warn('Cảnh báo DB khởi động:', dbErr.message); }
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 MINI GT STORE Server đang chạy tại Port: ${PORT} (0.0.0.0 & 127.0.0.1)`);
    });
  } catch (error) {
    console.error('Lỗi khi khởi động server:', error);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;