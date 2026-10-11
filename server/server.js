/**
 * MINI GT STORE - BACKEND SERVER
 * Máy chủ: Express.js
 * Cơ sở dữ liệu: Microsoft SQL Server (QUOCTHINH\DOQUOCTHINH)
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const newsletterRoutes = require('./routes/newsletter');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    data: null
  });
});

// Fallback: Nếu truy cập các route trang web khác, trả về index.html
app.use((req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Global Express Error Handler - Đảm bảo mọi lỗi đều trả về JSON chuẩn
app.use((err, req, res, next) => {
  console.error('[SERVER GLOBAL ERROR]:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi xử lý nội bộ máy chủ',
    data: null
  });
});

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

startServer();
