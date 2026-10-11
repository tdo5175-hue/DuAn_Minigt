/**
 * AUTOMATED VERIFICATION SCRIPT FOR ADMIN ORDER MANAGEMENT & SAFE JSON RESPONSES
 */
const fetch = global.fetch;

async function runTests() {
  console.log('=====================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM TRA TOÀN DIỆN HỆ THỐNG QUẢN LÝ ĐƠN HÀNG ADMIN');
  console.log('=====================================================================');

  const BASE_URL = 'http://localhost:5000';

  // Helper safeFetch
  async function testFetch(url, options = {}) {
    const res = await fetch(url, options);
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error(`Phản hồi không phải JSON: ${text}`);
    }
    return { status: res.status, ok: res.ok, data: json };
  }

  // 1. HEALTH CHECK
  console.log('\n[TEST 1] Kiểm tra Endpoint Health Check:');
  const healthRes = await testFetch(`${BASE_URL}/api/health`);
  console.log('Status:', healthRes.status, '| Success:', healthRes.data.success);
  if (!healthRes.ok) throw new Error('Health check thất bại');

  // 2. ADMIN LOGIN
  console.log('\n[TEST 2] Đăng nhập tài khoản Quản trị viên (admin@gmail.com):');
  const loginRes = await testFetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'Admin@2026!' })
  });
  console.log('Status:', loginRes.status, '| Success:', loginRes.data.success);
  if (!loginRes.data.success || !loginRes.data.token) throw new Error('Admin login thất bại');
  const adminToken = loginRes.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  };

  // 3. TẠO ĐƠN HÀNG COD
  console.log('\n[TEST 3] Khách hàng đặt đơn COD:');
  const codOrderRes = await testFetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Nguyễn Văn COD',
      phone: '0901234567',
      address: 'Số 15 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa',
      note: 'Giao giờ hành chính',
      paymentMethod: 'COD',
      items: [{ productId: 2, quantity: 1 }] // Aston Martin AMR24 #18
    })
  });
  console.log('Tạo đơn COD:', codOrderRes.status, codOrderRes.data.message);
  const codOrder = codOrderRes.data.data;
  console.log('Mã đơn:', codOrder.orderCode, '| Trạng thái:', codOrder.status, '| Thanh toán:', codOrder.paymentStatus, '| PT:', codOrder.paymentMethod);
  if (codOrder.status !== 'PENDING' || codOrder.paymentStatus !== 'UNPAID' || codOrder.paymentMethod !== 'COD') {
    throw new Error('Đơn COD không khởi tạo đúng giá trị chuẩn PENDING / UNPAID / COD');
  }

  // 4. DUYỆT ĐƠN COD (APPROVE) -> CONFIRMED
  console.log('\n[TEST 4] Admin duyệt đơn COD & gửi hàng:');
  const approveCodRes = await testFetch(`${BASE_URL}/api/admin/orders/${codOrder.orderId}/approve`, {
    method: 'PUT',
    headers: authHeaders
  });
  console.log('Duyệt đơn:', approveCodRes.data.message);
  if (!approveCodRes.data.success || approveCodRes.data.data.status !== 'CONFIRMED') {
    throw new Error('Duyệt đơn COD thất bại');
  }

  // 5. BẮT ĐẦU GIAO HÀNG (SHIP) -> SHIPPING
  console.log('\n[TEST 5] Admin bấm "Bắt đầu giao hàng" cho đơn COD:');
  const shipCodRes = await testFetch(`${BASE_URL}/api/admin/orders/${codOrder.orderId}/ship`, {
    method: 'PUT',
    headers: authHeaders
  });
  console.log('Giao hàng:', shipCodRes.data.message);
  if (!shipCodRes.data.success || shipCodRes.data.data.status !== 'SHIPPING') {
    throw new Error('Chuyển trạng thái SHIPPING thất bại');
  }

  // 6. HOÀN TẤT ĐƠN COD (COMPLETE) -> DELIVERED & PAID
  console.log('\n[TEST 6] Admin bấm "Đã giao & Đã thu tiền COD":');
  const completeCodRes = await testFetch(`${BASE_URL}/api/admin/orders/${codOrder.orderId}/complete`, {
    method: 'PUT',
    headers: authHeaders
  });
  console.log('Hoàn tất:', completeCodRes.data.message);
  if (!completeCodRes.data.success || completeCodRes.data.data.status !== 'DELIVERED' || completeCodRes.data.data.paymentStatus !== 'PAID') {
    throw new Error('Hoàn tất đơn COD không tự động set DELIVERED và PAID');
  }
  console.log('✅ LUỒNG COD THÀNH CÔNG VƯỢT TRỘI!');

  // 7. TẠO ĐƠN CHUYỂN KHOẢN (BANK_TRANSFER)
  console.log('\n[TEST 7] Khách hàng đặt đơn Chuyển khoản (BANK_TRANSFER):');
  const bankOrderRes = await testFetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Trần Thị Chuyển Khoản',
      phone: '0988776655',
      address: 'Đường Đồng Khởi, TP. Biên Hòa',
      note: 'Đã ck cọc',
      paymentMethod: 'BANK_TRANSFER',
      items: [{ productId: 3, quantity: 1 }] // Aston Martin AMR24 #14 Alonso
    })
  });
  const bankOrder = bankOrderRes.data.data;
  console.log('Mã đơn:', bankOrder.orderCode, '| Trạng thái:', bankOrder.status, '| Thanh toán:', bankOrder.paymentStatus);

  // 8. KIỂM TRA MÁY TRẠNG THÁI: DUYỆT ĐƠN KHI CHƯA XÁC NHẬN TIỀN -> PHẢI BỊ CHẶN (400)
  console.log('\n[TEST 8] Kiểm tra bảo vệ: Thử duyệt đơn chuyển khoản khi UNPAID:');
  const invalidApproveRes = await testFetch(`${BASE_URL}/api/admin/orders/${bankOrder.orderId}/approve`, {
    method: 'PUT',
    headers: authHeaders
  });
  console.log('Status code:', invalidApproveRes.status, '| Message:', invalidApproveRes.data.message);
  if (invalidApproveRes.status === 200 || invalidApproveRes.data.success) {
    throw new Error('Lỗi bảo mật logic: Đơn chuyển khoản chưa thanh toán mà vẫn duyệt được!');
  }
  console.log('✅ Hệ thống chặn duyệt thành công khi chưa nhận tiền!');

  // 9. XÁC NHẬN ĐÃ NHẬN TIỀN (CONFIRM PAYMENT) -> PAID
  console.log('\n[TEST 9] Admin bấm "Xác nhận đã nhận tiền":');
  const confirmPayRes = await testFetch(`${BASE_URL}/api/admin/orders/${bankOrder.orderId}/confirm-payment`, {
    method: 'PUT',
    headers: authHeaders
  });
  console.log('Xác nhận tiền:', confirmPayRes.data.message);
  if (!confirmPayRes.data.success || confirmPayRes.data.data.paymentStatus !== 'PAID') {
    throw new Error('Xác nhận tiền thất bại');
  }

  // 10. SAU KHI PAID, DUYỆT ĐƠN (APPROVE) -> CONFIRMED
  console.log('\n[TEST 10] Admin bấm "Duyệt đơn" sau khi đã nhận tiền:');
  const approveBankRes = await testFetch(`${BASE_URL}/api/admin/orders/${bankOrder.orderId}/approve`, {
    method: 'PUT',
    headers: authHeaders
  });
  console.log('Duyệt đơn sau khi trả tiền:', approveBankRes.data.message);
  if (!approveBankRes.data.success || approveBankRes.data.data.status !== 'CONFIRMED') {
    throw new Error('Duyệt đơn sau khi thanh toán thất bại');
  }
  console.log('✅ LUỒNG CHUYỂN KHOẢN (BANK_TRANSFER) THÀNH CÔNG CHUẨN XÁC!');

  // 11. KIỂM TRA HỦY ĐƠN & HOÀN TIỀN (CANCEL & REFUND)
  console.log('\n[TEST 11] Khách yêu cầu hủy đơn đã thanh toán -> Kiểm tra tự động chuyển REFUNDED:');
  const cancelRes = await testFetch(`${BASE_URL}/api/admin/orders/${bankOrder.orderId}/cancel`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ cancelReason: 'Khách hàng đổi ý mua mô hình F1 Red Bull khác' })
  });
  console.log('Hủy đơn:', cancelRes.data.message);
  console.log('Trạng thái đơn:', cancelRes.data.data.status, '| Thanh toán:', cancelRes.data.data.paymentStatus, '| Lý do:', cancelRes.data.data.cancelReason);
  if (cancelRes.data.data.status !== 'CANCELLED' || cancelRes.data.data.paymentStatus !== 'REFUNDED') {
    throw new Error('Hủy đơn đã trả tiền không tự động set REFUNDED');
  }
  console.log('✅ LUỒNG HỦY ĐƠN VÀ HOÀN TIỀN THÀNH CÔNG!');

  // 12. KIỂM TRA LẤY DANH SÁCH & BỘ LỌC
  console.log('\n[TEST 12] Kiểm tra API lọc đơn hàng GET /api/admin/orders:');
  const listAllRes = await testFetch(`${BASE_URL}/api/admin/orders`, { headers: authHeaders });
  console.log('Tổng số đơn trong hệ thống:', listAllRes.data.count, '| Counts:', listAllRes.data.counts);

  const filterPaidRes = await testFetch(`${BASE_URL}/api/admin/orders?paymentStatus=PAID`, { headers: authHeaders });
  console.log('Số đơn đã thanh toán (PAID):', filterPaidRes.data.count);

  const searchRes = await testFetch(`${BASE_URL}/api/admin/orders?search=${encodeURIComponent('COD')}`, { headers: authHeaders });
  console.log('Tìm kiếm từ khóa "COD":', searchRes.data.count, 'đơn');

  // 13. KIỂM TRA CHI TIẾT ĐƠN HÀNG (GET /api/admin/orders/:id)
  console.log('\n[TEST 13] Kiểm tra API chi tiết đơn hàng:');
  const detailRes = await testFetch(`${BASE_URL}/api/admin/orders/${codOrder.orderId}`, { headers: authHeaders });
  const detail = detailRes.data.data;
  console.log('Mã đơn:', detail.OrderCode, '| Số lượng sản phẩm:', detail.items.length, '| Tên xe:', detail.items[0].ProductName);
  if (!detail.items || detail.items.length === 0) {
    throw new Error('API chi tiết đơn hàng không trả về items');
  }

  console.log('\n=====================================================================');
  console.log('🎉 TẤT CẢ 13 KỊCH BẢN KIỂM THỬ ĐÃ VƯỢT QUA 100% THÀNH CÔNG VÀ CHÍNH XÁC!');
  console.log('=====================================================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ LỖI KIỂM THỬ:', err);
  process.exit(1);
});

