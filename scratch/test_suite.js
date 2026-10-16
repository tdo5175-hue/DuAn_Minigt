/**
 * COMPREHENSIVE AUTOMATED QA TEST SUITE
 * Test toàn bộ hệ thống MINI GT STORE (API, CSDL, Auth, RBAC, Product CRUD, Order State Machine, Inventory, Settings)
 */
const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: (options.method || 'GET').toUpperCase(),
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    };
    if (options.body) {
      reqOptions.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

const results = [];
function record(testName, passed, detail) {
  results.push({ testName, passed, detail });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${testName}]: ${detail || (passed ? 'PASSED' : 'FAILED')}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('🏁 BẮT ĐẦU AUTOMATED QA TEST SUITE — MINI GT STORE');
  console.log('====================================================\n');

  let adminToken = null;
  let customerToken = null;
  let customerEmail = `qa.collector.${Date.now()}@gmail.com`;
  let customerPassword = 'Collector@2026!';
  let createdOrderId = null;
  let createdOrderCode = null;
  let createdProductId = null;

  try {
    // 1. Health check
    const rHealth = await request('/api/health');
    record('Health Check', rHealth.status === 200 && rHealth.data?.success === true, `Connected to DB: ${rHealth.data?.data?.catalog}`);

    // 2. Public Settings
    const rSettings = await request('/api/settings');
    record('Public Settings', rSettings.status === 200 && rSettings.data?.data?.bank_account_no, `Hotline: ${rSettings.data?.data?.store_hotline}, Bank: ${rSettings.data?.data?.bank_name}`);

    // 3. Products List
    const rProducts = await request('/api/products');
    record('Products List', rProducts.status === 200 && Array.isArray(rProducts.data?.data) && rProducts.data.data.length > 0, `Total products: ${rProducts.data?.data?.length}`);

    // 4. Products Filter
    const rFilter = await request('/api/products?category=liberty-walk');
    record('Products Filter (LBWK)', rFilter.status === 200 && rFilter.data?.data?.length > 0, `Matched LBWK: ${rFilter.data?.data?.length}`);

    // 5. Products Detail
    const firstProd = rProducts.data.data[0];
    const rDetail = await request(`/api/products/${firstProd.id || firstProd.ProductId}`);
    record('Product Detail', rDetail.status === 200 && (rDetail.data?.data?.id || rDetail.data?.data?.ProductId), `Found: ${rDetail.data?.data?.name || rDetail.data?.data?.Name}`);

    // 6. Newsletter Subscription
    const rNews = await request('/api/newsletter', {
      method: 'POST',
      body: { email: `collector.${Date.now()}@gmail.com` }
    });
    record('Newsletter Subscription', (rNews.status === 200 || rNews.status === 201) && rNews.data?.success === true, rNews.data?.message);

    // 7. Customer Registration
    const rReg = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Nguyễn Văn Test',
        email: customerEmail,
        password: customerPassword,
        phone: '0912345678'
      }
    });
    record('Customer Registration', rReg.status === 201 && rReg.data?.token, `Registered: ${customerEmail}`);
    customerToken = rReg.data?.token;

    // 8. Customer Profile /api/auth/me
    const rMe = await request('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    record('Auth /api/auth/me', rMe.status === 200 && rMe.data?.data?.role === 'customer', `Role: ${rMe.data?.data?.role}`);

    // 9. Authorization Protection (Customer cannot access Admin Dashboard)
    const rForbidden = await request('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    record('RBAC: Customer blocked from Admin', rForbidden.status === 403, `HTTP ${rForbidden.status}: ${rForbidden.data?.message}`);

    // 10. Admin Login (Using seeded admin user from DB)
    const rAdminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@gmail.com',
        password: 'Admin@2026!'
      }
    });
    record('Admin Login', rAdminLogin.status === 200 && rAdminLogin.data?.user?.role === 'admin', `Admin token acquired for: ${rAdminLogin.data?.user?.email}`);
    adminToken = rAdminLogin.data?.token;

    // 11. Admin Dashboard KPI
    const rDash = await request('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    record('Admin Dashboard KPI', rDash.status === 200 && rDash.data?.data?.kpis, `Revenue: ${rDash.data?.data?.kpis?.revenue?.totalFormatted || 0}, Orders: ${rDash.data?.data?.kpis?.orders?.total}`);

    // 12. Create Order (with atomic inventory reservation)
    const prodToOrder = rProducts.data.data.find(p => (p.Stock || p.stock) > 2) || rProducts.data.data[0];
    const stockBefore = prodToOrder.Stock || prodToOrder.stock;
    const rCreateOrder = await request('/api/orders', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` },
      body: {
        fullName: 'Nguyễn Văn Test',
        phone: '0912345678',
        email: customerEmail,
        address: '123 Đường 30/4, Biên Hòa, Đồng Nai',
        note: 'Đơn hàng kiểm thử tự động',
        paymentMethod: 'DEPOSIT',
        shippingMethod: 'SPX',
        items: [{ productId: prodToOrder.id || prodToOrder.ProductId, quantity: 1 }]
      }
    });
    record('Create Order (Deposit & VietQR)', rCreateOrder.status === 201 && (rCreateOrder.data?.order?.code || rCreateOrder.data?.data?.code), `Order Code: ${rCreateOrder.data?.order?.code || rCreateOrder.data?.data?.code}`);
    const ordObj = rCreateOrder.data?.order || rCreateOrder.data?.data;
    createdOrderId = ordObj?.id || ordObj?.OrderId;
    createdOrderCode = ordObj?.code || ordObj?.OrderCode;

    // Verify stock was decremented
    const rProdAfter = await request(`/api/products/${prodToOrder.id || prodToOrder.ProductId}`);
    const stockAfter = rProdAfter.data?.data?.Stock ?? rProdAfter.data?.data?.stock;
    record('Atomic Inventory Decrement', stockAfter === stockBefore - 1, `Stock before: ${stockBefore} -> after: ${stockAfter}`);

    // 13. Order Tracking (Public)
    const rTrack = await request(`/api/orders/track/${encodeURIComponent(createdOrderCode)}`);
    record('Public Order Tracking', rTrack.status === 200 && rTrack.data?.data?.length > 0, `Tracked: ${rTrack.data?.data?.[0]?.code || rTrack.data?.data?.[0]?.OrderCode}`);

    // 14. Customer Self Cancel Order (PENDING state)
    const rCancel = await request(`/api/orders/${encodeURIComponent(createdOrderCode)}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${customerToken}` },
      body: { reason: 'Test hủy đơn hàng tự động' }
    });
    record('Customer Cancel PENDING Order', rCancel.status === 200, `Cancelled order: ${createdOrderCode}`);

    // Verify stock was restored upon cancellation
    const rProdRestored = await request(`/api/products/${prodToOrder.id || prodToOrder.ProductId}`);
    const stockRestored = rProdRestored.data?.data?.Stock ?? rProdRestored.data?.data?.stock;
    record('Inventory Restored on Cancel', stockRestored === stockBefore, `Restored stock: ${stockRestored} (matched original: ${stockBefore})`);

    // 15. Admin Product CRUD: Create
    const newSku = 'MGT-TEST-' + Math.floor(1000 + Math.random() * 9000);
    const rProdCreate = await request('/api/admin/products', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: {
        sku: newSku,
        name: 'Porsche 911 GT3 R QA Automated Model',
        brand: 'MINI GT',
        scale: '1:64',
        categoryId: 3,
        price: 380000,
        oldPrice: 420000,
        stock: 15,
        depositAmount: 120000,
        quotaPercent: 50,
        status: 'in_stock',
        imageUrl: 'image/hero-banner.jpg',
        description: 'Mẫu thử nghiệm tự động QA Test Suite',
        isFeatured: 0,
        isNew: 1
      }
    });
    record('Admin Create Product', rProdCreate.status === 201 && (rProdCreate.data?.data?.id || rProdCreate.data?.data?.ProductId), `Created SKU: ${newSku}`);
    createdProductId = rProdCreate.data?.data?.id || rProdCreate.data?.data?.ProductId;

    // 16. Admin Product CRUD: Update
    const rProdUpdate = await request(`/api/admin/products/${createdProductId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: {
        price: 390000,
        stock: 20
      }
    });
    record('Admin Update Product', rProdUpdate.status === 200 && (rProdUpdate.data?.data?.price === 390000 || rProdUpdate.data?.data?.Price === 390000), `Updated Price to 390,000đ, stock: 20`);

    // 17. Admin Product CRUD: Soft Delete
    const rProdDelete = await request(`/api/admin/products/${createdProductId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    record('Admin Soft Delete Product', rProdDelete.status === 200, `Soft deleted product ID: ${createdProductId}`);

    // 18. Admin Order State Machine Transition
    // Create a new order for admin transitions test
    const inStockProd = rProducts.data.data.find(p => (p.Stock || p.stock) > 2 && (p.Status === 'in_stock' || p.status === 'in_stock')) || prodToOrder;
    const isPreOrder = (inStockProd.Status === 'pre_order' || inStockProd.status === 'pre_order');
    const paymentMethodForTest = isPreOrder ? 'DEPOSIT' : 'COD';
    const rOrd2 = await request('/api/orders', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` },
      body: {
        fullName: 'Nguyễn Văn Test 2',
        phone: '0912345678',
        address: 'Biên Hòa, Đồng Nai',
        paymentMethod: paymentMethodForTest,
        shippingMethod: 'SPX',
        items: [{ productId: inStockProd.id || inStockProd.ProductId, quantity: 1 }]
      }
    });
    const ord2 = rOrd2.data?.order || rOrd2.data?.data;
    const ord2Id = ord2?.id || ord2?.OrderId;
    const ord2Code = ord2?.code || ord2?.OrderCode;

    // Transition PENDING -> CONFIRMED
    const rConf = await request(`/api/admin/orders/${ord2Id}/status`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: { status: 'CONFIRMED', note: 'Admin duyệt đơn test' }
    });
    record('Order Transition: PENDING -> CONFIRMED', rConf.status === 200 && (rConf.data?.data?.status === 'CONFIRMED' || rConf.data?.data?.Status === 'CONFIRMED'), `Status: CONFIRMED`);

    // Transition CONFIRMED -> PREPARING
    const rPrep = await request(`/api/admin/orders/${ord2Id}/status`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: { status: 'PREPARING', note: 'Đang đóng gói bọc xốp chống sốc' }
    });
    record('Order Transition: CONFIRMED -> PREPARING', rPrep.status === 200 && (rPrep.data?.data?.status === 'PREPARING' || rPrep.data?.data?.Status === 'PREPARING'), `Status: PREPARING`);

    // Update SPX tracking code
    const trackingSPX = 'SPXVN' + Date.now();
    const rTracking = await request(`/api/admin/orders/${ord2Id}/tracking`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: { trackingCode: trackingSPX, carrier: 'SPX Express' }
    });
    record('Admin Update SPX Tracking Code', rTracking.status === 200, `Tracking Code: ${trackingSPX}`);

    // Transition PREPARING -> SHIPPING
    const rShip = await request(`/api/admin/orders/${ord2Id}/status`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: { status: 'SHIPPING', note: 'Đã giao cho bưu tá SPX Express' }
    });
    record('Order Transition: PREPARING -> SHIPPING', rShip.status === 200, `Status: SHIPPING`);

    // Confirm Payment for COD in SHIPPING
    const rPay = await request(`/api/admin/orders/${ord2Id}/payment`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: { kind: 'full' }
    });
    record('Admin Confirm COD Payment', rPay.status === 200 && (rPay.data?.data?.paymentStatus === 'PAID' || rPay.data?.data?.PaymentStatus === 'PAID'), `PaymentStatus: PAID`);

    // Transition SHIPPING -> DELIVERED
    const rDel = await request(`/api/admin/orders/${ord2Id}/status`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: { status: 'DELIVERED', note: 'Khách đã nhận kiện hàng thành công' }
    });
    record('Order Transition: SHIPPING -> DELIVERED', rDel.status === 200 && (rDel.data?.data?.status === 'DELIVERED' || rDel.data?.data?.Status === 'DELIVERED'), `Status: DELIVERED (Final)`);

    // Illegal Transition check: DELIVERED -> PENDING (Must fail)
    const rIllegal = await request(`/api/admin/orders/${ord2Id}/status`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: { status: 'PENDING' }
    });
    record('Enforce State Machine: Illegal transition blocked', rIllegal.status === 400, `Blocked with HTTP ${rIllegal.status}: ${rIllegal.data?.message}`);

    // 19. Admin Settings Update & Live Cache Invalidation
    const rSetUpdate = await request('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: {
        store_hotline: '0988164164',
        shipping_fee: 11000
      }
    });
    record('Admin Update Store Settings', rSetUpdate.status === 200, `Hotline & Shipping fee updated`);

  } catch (err) {
    record('Unhandled Test Exception', false, err.stack || err.message);
  }

  console.log('\n====================================================');
  console.log('📊 TỔNG KẾT KẾT QUẢ AUTOMATED QA TEST SUITE');
  console.log('====================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`Tổng số bài test: ${total}`);
  console.log(`Thành công (Passed): ${passed}`);
  console.log(`Thất bại (Failed): ${failed}`);
  console.log(`Tỉ lệ thành công: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
