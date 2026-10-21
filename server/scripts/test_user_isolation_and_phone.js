const http = require('http');
const app = require('../server');
const db = require('../config/db');

function makeRequest(server, method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqHeaders = Object.assign({
      'Content-Type': 'application/json'
    }, headers);

    const postData = body ? JSON.stringify(body) : null;
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (_) { parsed = data; }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ TÍNH NĂNG MỚI ===');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  console.log('Server test đang lắng nghe tại port:', server.address().port);

  const testPhone = '0988164164';
  const emailA = `test_user_a_${Date.now()}@minigt.vn`;
  const emailB = `test_user_b_${Date.now()}@minigt.vn`;
  const passA = 'PassUserA123!';
  const passB = 'PassUserB456!';

  // 1. Đăng ký tài khoản A với số điện thoại testPhone
  const regA = await makeRequest(server, 'POST', '/api/auth/register', {
    fullName: 'Người Dùng A',
    email: emailA,
    password: passA,
    phone: testPhone,
    address: 'Biên Hòa Đồng Nai'
  });

  console.log('1. Đăng ký User A:', regA.status, regA.body?.success, regA.body?.message);
  if (regA.status !== 201) throw new Error('Đăng ký User A thất bại: ' + JSON.stringify(regA.body));

  const tokenA = regA.body.token;
  const userA = regA.body.user;

  // 2. Đăng ký tài khoản B VỚI CÙNG SỐ ĐIỆN THOẠI testPhone (phải THÀNH CÔNG, không bị chặn)
  const regB = await makeRequest(server, 'POST', '/api/auth/register', {
    fullName: 'Người Dùng B',
    email: emailB,
    password: passB,
    phone: testPhone, // CÙNG SỐ ĐIỆN THOẠI!
    address: 'Thành phố Biên Hòa'
  });

  console.log('2. Đăng ký User B (CÙNG SĐT testPhone):', regB.status, regB.body?.success, regB.body?.message);
  if (regB.status !== 201) throw new Error('Đăng ký User B cùng số điện thoại thất bại: ' + JSON.stringify(regB.body));

  const tokenB = regB.body.token;
  const userB = regB.body.user;

  // 3. Đăng nhập bằng số điện thoại testPhone + passA -> Phải ra đúng User A
  const loginByPhoneA = await makeRequest(server, 'POST', '/api/auth/login', {
    email: testPhone,
    password: passA
  });

  console.log('3. Đăng nhập SĐT + passA:', loginByPhoneA.status, loginByPhoneA.body?.user?.email);
  if (loginByPhoneA.body?.user?.email !== emailA) {
    throw new Error('Đăng nhập bằng SĐT + passA không trả về đúng User A!');
  }

  // 4. Đăng nhập bằng số điện thoại testPhone + passB -> Phải ra đúng User B
  const loginByPhoneB = await makeRequest(server, 'POST', '/api/auth/login', {
    email: testPhone,
    password: passB
  });

  console.log('4. Đăng nhập SĐT + passB:', loginByPhoneB.status, loginByPhoneB.body?.user?.email);
  if (loginByPhoneB.body?.user?.email !== emailB) {
    throw new Error('Đăng nhập bằng SĐT + passB không trả về đúng User B!');
  }

  // 5. Kiểm tra phân lập đơn hàng: User B mới tạo chưa có đơn nào -> /api/orders/my-orders PHẢI TRẢ VỀ []
  const myOrdersB = await makeRequest(server, 'GET', '/api/orders/my-orders', null, {
    'Authorization': `Bearer ${tokenB}`
  });

  console.log('5. Đơn hàng của User B (tài khoản mới):', myOrdersB.status, 'Số lượng đơn:', myOrdersB.body?.data?.length);
  if (myOrdersB.body?.data?.length !== 0) {
    throw new Error('LỖI RÒ RỈ: User B mới tạo nhưng /api/orders/my-orders lại thấy đơn của tài khoản khác!');
  }

  // 6. User A tạo 1 đơn hàng
  const createOrderA = await makeRequest(server, 'POST', '/api/orders', {
    fullName: 'Người Dùng A',
    email: emailA,
    phone: testPhone,
    address: '123 Đường Võ Thị Sáu Biên Hòa',
    paymentMethod: 'BANK_TRANSFER',
    items: [
      {
        productId: 15,
        quantity: 1,
        packagingOption: 'box',
        unitPrice: 780000
      }
    ]
  }, {
    'Authorization': `Bearer ${tokenA}`
  });

  console.log('6. Tạo đơn hàng cho User A:', createOrderA.status, JSON.stringify(createOrderA.body));
  const orderCodeA = createOrderA.body?.order?.orderCode;

  // 7. User A kiểm tra my-orders -> Thấy đúng 1 đơn của A
  const myOrdersA = await makeRequest(server, 'GET', '/api/orders/my-orders', null, {
    'Authorization': `Bearer ${tokenA}`
  });

  console.log('7. Đơn hàng của User A:', myOrdersA.status, 'Số lượng:', myOrdersA.body?.data?.length, 'Mã:', myOrdersA.body?.data?.[0]?.orderCode || myOrdersA.body?.data?.[0]?.OrderCode);
  if (myOrdersA.body?.data?.length !== 1) {
    throw new Error('User A không thấy đúng đơn vừa tạo!');
  }

  // 8. User B (dù chung số điện thoại testPhone!) kiểm tra my-orders -> PHẢI VẪN LÀ 0 ĐƠN, TUYỆT ĐỐI KHÔNG THẤY ĐƠN CỦA A
  const checkIsolationB = await makeRequest(server, 'GET', '/api/orders/my-orders', null, {
    'Authorization': `Bearer ${tokenB}`
  });

  console.log('8. User B kiểm tra lại my-orders sau khi A đặt đơn (CHUNG SĐT):', checkIsolationB.status, 'Số lượng đơn:', checkIsolationB.body?.data?.length);
  if (checkIsolationB.body?.data?.length !== 0) {
    throw new Error('LỖI BẢO MẬT: User B thấy đơn hàng của User A do dùng chung số điện thoại!');
  }

  // 9. Kiểm tra gửi OTP login
  const otpRes = await makeRequest(server, 'POST', '/api/auth/send-login-otp', {
    email: emailA
  });

  console.log('9. Gửi OTP login:', otpRes.status, 'success:', otpRes.body?.success, 'emailSent:', otpRes.body?.emailSent, 'devOtp:', otpRes.body?.devOtp);
  if (!otpRes.body?.success) {
    throw new Error('Gửi OTP login thất bại!');
  }

  // 10. Dọn dẹp tài khoản test trong DB
  try {
    await db.query('DELETE FROM OrderItems WHERE OrderId IN (SELECT OrderId FROM Orders WHERE UserId IN (@uidA, @uidB))', { uidA: userA.userId, uidB: userB.userId });
    await db.query('DELETE FROM OrderStatusHistory WHERE OrderId IN (SELECT OrderId FROM Orders WHERE UserId IN (@uidA, @uidB))', { uidA: userA.userId, uidB: userB.userId });
    await db.query('DELETE FROM Orders WHERE UserId IN (@uidA, @uidB)', { uidA: userA.userId, uidB: userB.userId });
    await db.query('DELETE FROM Users WHERE UserId IN (@uidA, @uidB)', { uidA: userA.userId, uidB: userB.userId });
    console.log('10. Đã dọn sạch dữ liệu test thành công!');
  } catch (cleanErr) {
    console.warn('Cảnh báo dọn dẹp:', cleanErr.message);
  }

  server.close();
  console.log('🎉 TẤT CẢ 10 BƯỚC KIỂM THỬ ĐÃ THÀNH CÔNG RỰC RỠ!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ LỖI KIỂM THỬ:', err);
  process.exit(1);
});
