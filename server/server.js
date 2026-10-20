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

// 3. Phục vụ Static Files
const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(rootDir, 'admin', 'index.html'));
});

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/categories', async (req, res, next) => {
  try {
    const productService = require('./services/productService');
    const categories = await productService.listCategories();
    return res.status(200).json({ success: true, data: categories });
  } catch (err) { next(err); }
});

app.get('/api/health', (req, res) => {
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
    // Kích hoạt kết nối pool ngay lập tức tới Supabase
    try { await db.query('SELECT 1'); } catch (dbErr) { console.warn('Cảnh báo DB khởi động:', dbErr.message); }
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