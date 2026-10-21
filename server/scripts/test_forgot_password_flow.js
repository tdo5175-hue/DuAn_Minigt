/**
 * Integration Test: Full Forgot Password -> Reset Password -> Login with New Password
 */
process.env.NODE_ENV = 'test';
require('dotenv').config();
const http = require('http');
const express = require('express');
const db = require('../config/db');
const authRouter = require('../routes/auth');

async function runTest() {
  console.log('--- BẮT ĐẦU KIỂM TRA CHU TRÌNH ĐẦY ĐỦ: FORGOT -> RESET -> LOGIN ---');

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ success: false, message: err.message });
  });

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/auth`;

  const testEmail = 'quocthinh5175@gmail.com';
  const newSecretPassword = 'ThinhPassword@2026';

  // 1. GỬI OTP VỀ GMAIL
  console.log('\n[1] Gửi OTP khôi phục về Gmail...');
  const forgotRes = await fetch(`${baseUrl}/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail })
  });
  const forgotJson = await forgotRes.json();
  if (!forgotJson.success) throw new Error('Forgot failed: ' + forgotJson.message);
  console.log('✅ Gửi email OTP thành công! Response:', forgotJson);

  // 2. RESET MẬT KHẨU
  console.log(`\n[2] Đặt mật khẩu mới: "${newSecretPassword}"...`);
  const resetRes = await fetch(`${baseUrl}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, otp: '123456', newPassword: newSecretPassword })
  });
  const resetJson = await resetRes.json();
  console.log('Reset Response:', resetJson);
  if (!resetJson.success) throw new Error('Reset password failed: ' + resetJson.message);
  console.log('✅ Đặt lại mật khẩu thành công trong Supabase PostgreSQL!');

  // 3. ĐĂNG NHẬP BẰNG MẬT KHẨU MỚI
  console.log(`\n[3] Thử đăng nhập lại bằng mật khẩu mới: "${newSecretPassword}"...`);
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: newSecretPassword })
  });
  const loginJson = await loginRes.json();
  console.log('Login Response:', loginJson);
  if (!loginJson.success || !loginJson.token) {
    throw new Error('Login failed with new password: ' + loginJson.message);
  }
  console.log(`✅ ĐĂNG NHẬP THÀNH CÔNG VỚI MẬT KHẨU MỚI! Token: ${loginJson.token.slice(0, 20)}...`);

  // 4. KIỂM TRA ĐĂNG NHẬP VỚI MẬT KHẨU SAI
  console.log(`\n[4] Kiểm tra đăng nhập với mật khẩu cũ hoặc mật khẩu sai...`);
  const wrongLoginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'WrongOldPassword' })
  });
  const wrongLoginJson = await wrongLoginRes.json();
  console.log('Wrong Password Response:', wrongLoginJson);
  if (wrongLoginJson.success) {
    throw new Error('Lỗi: Mật khẩu sai mà vẫn đăng nhập được!');
  }
  console.log('✅ Hệ thống từ chối mật khẩu sai chính xác!');

  console.log('\n🎉 TOÀN BỘ CHU TRÌNH: GỬI GMAIL -> XÁC THỰC OTP -> ĐỔI MẬT KHẨU -> ĐĂNG NHẬP HOÀN TOÀN KHỚP VÀ CHUẨN XÁC 100%!');
  process.exit(0);
}

runTest().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
