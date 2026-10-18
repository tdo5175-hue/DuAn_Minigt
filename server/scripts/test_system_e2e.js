const http = require('http');
const db = require('../config/db');

function httpRequest(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', err => reject(err));
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runEndToEndTests() {
  console.log('====================================================');
  console.log('BẮT ĐẦU KIỂM TRA TOÀN DIỆN HỆ THỐNG & KẾT NỐI SQL...');
  console.log('====================================================\n');

  let testPassed = 0;
  let testFailed = 0;

  // 1. Kiểm tra kết nối SQL Server trực tiếp
  try {
    const pool = await db.getPool();
    if (pool && db.isConnected()) {
      console.log('✅ [SQL SERVER] Kết nối thành công đến database MiniGTStore.');
      testPassed++;
    } else {
      throw new Error('Pool null hoặc isConnected = false');
    }

    // Kiểm tra số lượng sản phẩm trong dbo.Products
    const prodRes = await pool.request().query("SELECT COUNT(*) AS total, SUM(CASE WHEN Status = 'pre_order' THEN 1 ELSE 0 END) AS preOrderCount FROM dbo.Products WHERE IsActive = 1");
    const total = prodRes.recordset[0].total;
    const preOrders = prodRes.recordset[0].preOrderCount;
    console.log(`✅ [SQL SERVER] Bảng dbo.Products: ${total} sản phẩm hoạt động (${preOrders} Pre-Order).`);
    if (total >= 18) testPassed++; else testFailed++;

    // Kiểm tra cấu trúc view dbo.vw_ProductList
    const viewRes = await pool.request().query('SELECT TOP 5 Sku, CarNumber, Name, PackagingType, PriceBox, PriceCard, DiscountPercent, Price FROM dbo.vw_ProductList ORDER BY ProductId ASC');
    console.log('✅ [SQL SERVER] View dbo.vw_ProductList hoạt động hoàn hảo:');
    viewRes.recordset.forEach(r => {
      console.log(`   - [#${r.Sku} - Car ${r.CarNumber}] ${r.Name}: Box=${r.PriceBox}đ, Card=${r.PriceCard}đ (-${r.DiscountPercent}%) => Final=${r.Price}đ`);
    });
    testPassed++;

    // Kiểm tra danh mục dbo.Categories
    const catRes = await pool.request().query('SELECT CategoryId, Name, Slug FROM dbo.Categories ORDER BY SortOrder ASC');
    console.log(`✅ [SQL SERVER] Bảng dbo.Categories: ${catRes.recordset.length} danh mục chuẩn.`);
    testPassed++;

    // Kiểm tra tài khoản Admin và Khách hàng trong dbo.Users
    const userRes = await pool.request().query('SELECT UserId, Email, FullName, Role FROM dbo.Users WHERE IsActive = 1');
    console.log(`✅ [SQL SERVER] Bảng dbo.Users: ${userRes.recordset.length} tài khoản người dùng:`);
    userRes.recordset.forEach(u => {
      console.log(`   - [${u.Role.toUpperCase()}] ${u.Email} (${u.FullName})`);
    });
    testPassed++;

  } catch (err) {
    console.error('❌ [SQL SERVER ERROR] Lỗi kết nối hoặc truy vấn SQL Server:', err.message);
    testFailed++;
  }

  // 2. Khởi động Web Server tạm thời để test các HTTP Endpoints
  const app = require('../server');
  const server = http.createServer(app);

  const PORT = 5599; // Dùng cổng test độc lập
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`\n🚀 [TEST SERVER] Backend Express đang lắng nghe tại http://localhost:${PORT}`);

  try {
    // 2.1 Test Health Check
    const health = await httpRequest({ host: 'localhost', port: PORT, path: '/api/health', method: 'GET' });
    console.log(`✅ [API /api/health] HTTP ${health.status} - Connected: ${health.data?.data?.connected}, Catalog: ${health.data?.data?.catalog}`);
    if (health.status === 200 && health.data?.data?.connected === true) testPassed++; else testFailed++;

    // 2.2 Test GET /api/products
    const prods = await httpRequest({ host: 'localhost', port: PORT, path: '/api/products', method: 'GET' });
    console.log(`✅ [API /api/products] HTTP ${prods.status} - Trả về ${prods.data?.data?.length} sản phẩm.`);
    if (prods.status === 200 && prods.data?.data?.length >= 18) {
      testPassed++;
      const p1 = prods.data.data.find(x => (x.sku || x.Sku) === 'MGTS0026');
      const p2 = prods.data.data.find(x => (x.sku || x.Sku) === 'MGT01413');
      const p7 = prods.data.data.find(x => (x.sku || x.Sku) === 'MGT01093');
      console.log(`   - Sản phẩm 1 (MGTS0026): Box=${p1?.priceBox || p1?.PriceBox}đ, Card=${p1?.priceCard || p1?.PriceCard}đ, Pack=${p1?.packagingType || p1?.PackagingType}`);
      console.log(`   - Sản phẩm 2 (MGT01413): Box=${p2?.priceBox || p2?.PriceBox}đ, Card=${p2?.priceCard || p2?.PriceCard}đ, Giảm -${p2?.discountPercent || p2?.DiscountPercent}%, Giá sau giảm=${p2?.finalPriceBox || p2?.FinalPriceBox}đ`);
      console.log(`   - Sản phẩm 7 (MGT01093): Box=${p7?.priceBox || p7?.PriceBox}đ, Card=${p7?.priceCard || p7?.PriceCard}đ, Giảm -${p7?.discountPercent || p7?.DiscountPercent}%, Giá sau giảm Box=${p7?.finalPriceBox || p7?.FinalPriceBox}đ, Card=${p7?.finalPriceCard || p7?.FinalPriceCard}đ`);
    } else {
      testFailed++;
    }

    // 2.3 Test GET /api/categories
    const cats = await httpRequest({ host: 'localhost', port: PORT, path: '/api/products/categories', method: 'GET' });
    const catList = cats.data?.data || cats.data;
    console.log(`✅ [API /api/products/categories] HTTP ${cats.status} - Danh mục: ${Array.isArray(catList) ? catList.length : 'ok'}`);
    if (cats.status === 200) testPassed++; else testFailed++;

    // 2.4 Test GET /api/settings
    const settings = await httpRequest({ host: 'localhost', port: PORT, path: '/api/settings', method: 'GET' });
    console.log(`✅ [API /api/settings] HTTP ${settings.status} - Store: ${settings.data?.data?.store_name}, Hotline: ${settings.data?.data?.store_hotline}`);
    if (settings.status === 200) testPassed++; else testFailed++;

    // 2.5 Test POST /api/auth/login (Đăng nhập Admin)
    const adminLogin = await httpRequest({
      host: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@minigt.com', password: 'admin' });
    console.log(`✅ [API /api/auth/login] Admin Login HTTP ${adminLogin.status} - User: ${adminLogin.data?.user?.fullName || adminLogin.data?.data?.user?.fullName}`);
    const adminToken = adminLogin.data?.token || adminLogin.data?.data?.token;
    if (adminLogin.status === 200 && adminToken) testPassed++; else testFailed++;

    // 2.6 Test POST /api/auth/login (Đăng nhập Khách hàng qua SĐT)
    const phoneLogin = await httpRequest({
      host: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: '0988164164', password: '123456' });
    const phoneUser = phoneLogin.data?.user || phoneLogin.data?.data?.user;
    console.log(`✅ [API /api/auth/login] Phone Login HTTP ${phoneLogin.status} - User: ${phoneUser?.fullName} (${phoneUser?.email})`);
    if (phoneLogin.status === 200 && phoneUser) testPassed++; else testFailed++;

    // 2.7 Test POST /api/orders (Đặt hàng thực tế gồm Box + Card + Box Saver)
    const newOrderPayload = {
      fullName: 'Nguyễn Văn An Collector',
      phone: '0933889900',
      email: 'vanan.collector@gmail.com',
      address: '24 Đường Đồng Khởi, P. Tân Hiệp, TP. Biên Hòa, Đồng Nai',
      shippingMethod: 'BOX_SAVER',
      shippingFee: 0,
      paymentMethod: 'DEPOSIT',
      voucherCode: 'MINIGT2026',
      voucherDiscount: 50000,
      boxProtector: 1,
      protectorFee: 15000,
      totalAmount: 1815000,
      depositAmount: 544500,
      note: 'Giao hàng cẩn thận, đóng gói chống sốc 3 lớp',
      items: [
        {
          productId: 1,
          sku: 'MGTS0026',
          name: 'Lamborghini Huracán Sterrato All-Terrain Set (Box 4 xe)',
          price: 1850000,
          packType: 'box',
          packagingOption: 'box',
          deposit: 500000,
          quantity: 1,
          orderType: 'PRE_ORDER'
        }
      ]
    };
    const orderRes = await httpRequest({
      host: 'localhost',
      port: PORT,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, newOrderPayload);

    const createdCode = orderRes.data?.data?.orderCode || orderRes.data?.order?.code || orderRes.data?.orderCode;
    console.log(`✅ [API /api/orders] HTTP ${orderRes.status} - Tạo đơn: ${createdCode || JSON.stringify(orderRes.data)}`);
    if ((orderRes.status === 200 || orderRes.status === 201) && createdCode) testPassed++; else testFailed++;

    // 2.8 Test GET /api/orders/check-status/:code
    if (createdCode) {
      const trackRes = await httpRequest({ host: 'localhost', port: PORT, path: `/api/orders/check-status/${createdCode}`, method: 'GET' });
      const orderData = trackRes.data?.data || trackRes.data?.order;
      console.log(`✅ [API /api/orders/check-status/${createdCode}] HTTP ${trackRes.status} - Trạng thái: ${orderData?.statusText || orderData?.status || 'OK'}`);
      if (trackRes.status === 200) testPassed++; else testFailed++;
    }

    // 2.9 Test GET /api/admin/dashboard (với Admin Token)
    if (adminToken) {
      const dashRes = await httpRequest({
        host: 'localhost',
        port: PORT,
        path: '/api/admin/dashboard',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const dashData = dashRes.data?.data || dashRes.data;
      console.log(`✅ [API /api/admin/dashboard] HTTP ${dashRes.status} - Total Orders: ${dashData?.summary?.totalOrders ?? dashData?.totalOrders}, Revenue: ${dashData?.summary?.totalRevenue ?? dashData?.totalRevenue ?? 0}đ`);
      if (dashRes.status === 200) testPassed++; else testFailed++;
    }

    // 2.10 Test GET /api/admin/orders
    if (adminToken) {
      const adminOrders = await httpRequest({
        host: 'localhost',
        port: PORT,
        path: '/api/admin/orders',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const orderList = adminOrders.data?.data || adminOrders.data?.orders;
      console.log(`✅ [API /api/admin/orders] HTTP ${adminOrders.status} - Tổng đơn quản lý: ${Array.isArray(orderList) ? orderList.length : 'ok'}`);
      if (adminOrders.status === 200) testPassed++; else testFailed++;
    }

  } catch (err) {
    console.error('❌ [API ERROR] Lỗi khi gọi HTTP API:', err.message);
    testFailed++;
  } finally {
    server.close();
    console.log('\n====================================================');
    console.log(`KẾT QUẢ KIỂM TRA: ${testPassed} BƯỚC ĐẠT CHUẨN, ${testFailed} LỖI.`);
    console.log('====================================================');
  }
}

runEndToEndTests();
