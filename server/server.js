/**
 * MINI GT STORE - BACKEND SERVER
 * Máy chủ: Express.js
 * Cơ sở dữ liệu: Microsoft SQL Server (QUOCTHINH\DOQUOCTHINH)
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ quiet: true });

const db = require('./config/db');
const { securityHeaders, corsOptions } = require('./middleware/security');
const { errorHandler } = require('./utils/http');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const newsletterRoutes = require('./routes/newsletter');
const settingsRoutes = require('./routes/settings');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(securityHeaders);
app.use(cors(corsOptions()));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Phục vụ Static Files (CSS, JS, Images, HTML) từ thư mục gốc của dự án
const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));

// Admin Page Route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(rootDir, 'admin', 'index.html'));
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Hệ thống máy chủ hoạt động bình thường',
    data: {
      appName: 'MINI GT STORE BACKEND',
      server: 'QUOCTHINH\\DOQUOCTHINH',
      catalog: 'MiniGTStore',
      connected: db.isConnected(),
      timestamp: new Date().toISOString()
    }
  });
});

// API 404 Handler - Bắt buộc trả về JSON cho mọi route /api không tồn tại
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint không tồn tại: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
    data: null
  });
});

// Fallback: Nếu truy cập các route trang web khác ngoài API, phục vụ index.html
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.sendFile(path.join(rootDir, 'index.html'));
  } else {
    next();
  }
});

// Global Error Handler
app.use(errorHandler);

// Khởi chạy server
async function startServer() {
  try {
    // Khởi tạo kết nối DB trước
    await db.getPool();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 MINI GT STORE Server đang chạy tại:`);
      console.log(`👉 http://localhost:${PORT}`);
      console.log(`🗄️ Kết nối CSDL: QUOCTHINH\\DOQUOCTHINH (MiniGTStore)`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Lỗi khi khởi động server:', error);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
