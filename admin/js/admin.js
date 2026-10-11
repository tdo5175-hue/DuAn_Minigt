/**
 * MINI GT STORE - ADMIN PORTAL SCRIPT
 * Quản lý Dashboard, Sản phẩm, Khách hàng, Bản tin
 * Phân hệ Quản trị Đơn hàng Toàn diện & Máy trạng thái nghiêm ngặt
 * Tích hợp Xác thực dùng chung (Unified Auth) & Tự động nhận diện API Port 5000
 */

// Tự động chuyển đổi API Base URL nếu trang web được mở qua Live Server (Port 5500, 5501...) hoặc file://
const API_BASE = (() => {
  if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000')) {
    return 'http://localhost:5000';
  }
  return '';
})();

let adminToken = localStorage.getItem('minigt_token') || null;
let currentAdmin = JSON.parse(localStorage.getItem('minigt_user')) || null;
let currentProducts = [];
let currentOrders = [];
let orderToCancelId = null;
let shipSpxOrderId = null;

let currentOrderFilter = {
  status: 'ALL',
  paymentStatus: 'ALL',
  paymentMethod: 'ALL',
  search: ''
};

// =====================================================================
// 1. SAFE FETCH WRAPPER (CHỐNG LỖI "Unexpected end of JSON input" & 405)
// =====================================================================
async function safeFetch(url, options = {}) {
  try {
    const fullUrl = url.startsWith('http') ? url : (API_BASE + url);
    const response = await fetch(fullUrl, options);
    const text = await response.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (err) {
        data = { success: false, message: text || 'Phản hồi từ máy chủ không đúng định dạng JSON', data: null };
      }
    }

    if (!response.ok) {
      throw new Error(data.message || `Lỗi máy chủ HTTP: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[SAFE FETCH ERROR] (${url}):`, error);
    throw error;
  }
}

// =====================================================================
// 2. KIỂM TRA ĐĂNG NHẬP & PHIÊN LÀM VIỆC DÙNG CHUNG
// =====================================================================
function checkAuth() {
  if (!adminToken || !currentAdmin) {
    // Chưa đăng nhập: Mở modal đăng nhập dùng chung
    document.getElementById('adminLoginModal').classList.add('active');
    const warnEl = document.getElementById('authRoleWarning');
    if (warnEl) warnEl.style.display = 'none';
  } else if (currentAdmin.role !== 'admin') {
    // Đã đăng nhập nhưng là tài khoản Khách hàng
    document.getElementById('adminLoginModal').classList.add('active');
    const warnEl = document.getElementById('authRoleWarning');
    const warnText = document.getElementById('authRoleWarningText');
    if (warnEl) warnEl.style.display = 'block';
    if (warnText) {
      warnText.innerHTML = `Tài khoản <strong>${currentAdmin.email}</strong> là tài khoản Khách hàng thông thường và không có quyền Quản trị viên!`;
    }
  } else {
    // Đã đăng nhập tài khoản Admin hợp lệ
    document.getElementById('adminLoginModal').classList.remove('active');
    updateAdminProfileUI();
    loadDashboard();
  }
}

// Chuyển đổi tab Đăng nhập / Đăng ký trong modal
function switchUnifiedAuthTab(tab) {
  const btnLogin = document.getElementById('tabAuthLogin');
  const btnRegister = document.getElementById('tabAuthRegister');
  const formLogin = document.getElementById('formUnifiedLogin');
  const formRegister = document.getElementById('formUnifiedRegister');

  if (tab === 'login') {
    btnLogin.style.borderBottomColor = 'var(--admin-primary)';
    btnLogin.style.color = 'var(--admin-primary)';
    btnRegister.style.borderBottomColor = 'transparent';
    btnRegister.style.color = '#64748b';
    formLogin.style.display = 'block';
    formRegister.style.display = 'none';
  } else {
    btnRegister.style.borderBottomColor = 'var(--admin-primary)';
    btnRegister.style.color = 'var(--admin-primary)';
    btnLogin.style.borderBottomColor = 'transparent';
    btnLogin.style.color = '#64748b';
    formRegister.style.display = 'block';
    formLogin.style.display = 'none';
  }
}

// Điền nhanh thông tin test
function quickFillAccount(type) {
  switchUnifiedAuthTab('login');
  const emailInput = document.getElementById('loginEmailInput');
  const passInput = document.getElementById('loginPasswordInput');
  if (type === 'admin') {
    if (emailInput) emailInput.value = 'admin@gmail.com';
    if (passInput) passInput.value = 'Admin@2026!';
  } else {
    if (emailInput) emailInput.value = 'khachhang@gmail.com';
    if (passInput) passInput.value = 'Khach@2026!';
  }
}

function togglePasswordVisibility(inputId, toggleEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    toggleEl.textContent = '🔒 Ẩn';
  } else {
    input.type = 'password';
    toggleEl.textContent = '👁️ Hiện';
  }
}

// Xử lý đăng nhập tài khoản dùng chung
async function handleUnifiedLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmailInput').value.trim();
  const password = document.getElementById('loginPasswordInput').value;

  try {
    const json = await safeFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (json.success && json.user) {
      adminToken = json.token;
      currentAdmin = json.user;
      localStorage.setItem('minigt_token', adminToken);
      localStorage.setItem('minigt_user', JSON.stringify(currentAdmin));

      if (json.user.role === 'admin') {
        document.getElementById('adminLoginModal').classList.remove('active');
        updateAdminProfileUI();
        loadDashboard();
        alert('Đăng nhập Quản trị viên thành công!');
      } else {
        // Tài khoản khách hàng
        const warnEl = document.getElementById('authRoleWarning');
        const warnText = document.getElementById('authRoleWarningText');
        if (warnEl) warnEl.style.display = 'block';
        if (warnText) {
          warnText.innerHTML = `Tài khoản <strong>${json.user.email}</strong> là tài khoản Khách hàng. Bạn có thể quay lại trang chủ mua sắm hoặc đăng nhập tài khoản Quản trị viên.`;
        }
      }
    } else {
      alert(json.message || 'Email hoặc mật khẩu không chính xác!');
    }
  } catch (err) {
    alert('Lỗi đăng nhập: ' + err.message);
  }
}

// Xử lý đăng ký tài khoản mới dùng chung
async function handleUnifiedRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById('regFullNameInput').value.trim();
  const email = document.getElementById('regEmailInput').value.trim();
  const phone = document.getElementById('regPhoneInput').value.trim();
  const password = document.getElementById('regPasswordInput').value;

  try {
    const json = await safeFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phone, password })
    });

    if (json.success && json.user) {
      adminToken = json.token;
      currentAdmin = json.user;
      localStorage.setItem('minigt_token', adminToken);
      localStorage.setItem('minigt_user', JSON.stringify(currentAdmin));

      alert('Đăng ký tài khoản thành công! Đây là tài khoản Khách hàng.');
      switchUnifiedAuthTab('login');
      quickFillAccount('customer');
    } else {
      alert(json.message || 'Lỗi đăng ký tài khoản');
    }
  } catch (err) {
    alert('Lỗi đăng ký: ' + err.message);
  }
}

function adminLogout() {
  localStorage.removeItem('minigt_token');
  localStorage.removeItem('minigt_user');
  adminToken = null;
  currentAdmin = null;
  location.reload();
}

function updateAdminProfileUI() {
  if (currentAdmin) {
    const nameEl1 = document.getElementById('sidebarAdminName');
    const nameEl2 = document.getElementById('topbarAdminName');
    if (nameEl1) nameEl1.textContent = currentAdmin.fullName || 'Admin';
    if (nameEl2) nameEl2.textContent = currentAdmin.fullName || 'Admin';
  }
}

// =====================================================================
// 3. CHUYỂN ĐỔI TAB QUẢN TRỊ
// =====================================================================
function switchTab(tabId) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(el => el.style.display = 'none');

  const navBtn = document.getElementById(`nav-${tabId}`);
  const pane = document.getElementById(`pane-${tabId}`);

  if (navBtn) navBtn.classList.add('active');
  if (pane) pane.style.display = 'block';

  if (tabId === 'dashboard') loadDashboard();
  else if (tabId === 'products') loadProducts();
  else if (tabId === 'orders') loadOrders();
  else if (tabId === 'users') loadUsers();
  else if (tabId === 'subscribers') loadSubscribers();
}

// =====================================================================
// 4. TAB TỔNG QUAN (DASHBOARD STATS)
// =====================================================================
async function loadDashboard() {
  try {
    const json = await safeFetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!json.success || !json.data) return;

    const s = json.data.stats;
    const recentOrders = json.data.recentOrders || [];

    document.getElementById('statRevenue').textContent = formatVND(s.totalRevenue);
    document.getElementById('statDeposits').textContent = formatVND(s.totalDeposits);
    document.getElementById('statOrders').textContent = s.totalOrders;
    document.getElementById('statProducts').textContent = s.totalProducts;
    document.getElementById('statCustomers').textContent = s.totalCustomers;
    document.getElementById('statSubscribers').textContent = s.totalSubscribers;

    // Render Recent Orders Table
    const tbody = document.getElementById('recentOrdersTbody');
    if (tbody) {
      if (recentOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem;">Chưa có đơn hàng nào</td></tr>';
      } else {
        tbody.innerHTML = recentOrders.map(o => `
          <tr>
            <td><strong>#${o.OrderCode}</strong></td>
            <td>${escapeHtml(o.FullName)}</td>
            <td>${escapeHtml(o.Phone)}</td>
            <td><strong style="color:var(--admin-primary);">${formatVND(o.Total)}</strong></td>
            <td>${renderOrderStatusBadge(o.Status)}</td>
            <td>${new Date(o.CreatedAt).toLocaleDateString('vi-VN')}</td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Lỗi tải thống kê:', err);
  }
}

// =====================================================================
// 5. QUẢN LÝ SẢN PHẨM (PRODUCTS CRUD, CLONE, QUICK UPDATE, LIVE PREVIEW)
// =====================================================================
async function loadProducts() {
  try {
    const json = await safeFetch('/api/admin/products', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!json.success) return;

    currentProducts = json.data || [];
    renderProductsTable(currentProducts);
  } catch (err) {
    console.error('Lỗi tải sản phẩm:', err);
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('productsTbody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:2rem; color:#94a3b8;">Không tìm thấy mô hình nào</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <img class="product-thumb" src="../${p.ImageUrl}" alt="${escapeHtml(p.Name)}" onerror="this.src='../image/hero-banner.png'">
      </td>
      <td><strong>#${p.Sku}</strong></td>
      <td>
        <div style="font-weight:600; color:var(--admin-text-main);">${escapeHtml(p.Name)}</div>
        <div style="font-size:11px; color:var(--admin-primary); font-weight:600;">${p.EditionNote || ''}</div>
      </td>
      <td>${escapeHtml(p.CategoryName || 'Khác')}</td>
      <td>
        <strong>${formatVND(p.Price)}</strong>
        ${p.DepositAmount ? `<div style="font-size:11px; color:#dc2626;">Cọc: ${formatVND(p.DepositAmount)}</div>` : ''}
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:4px;">
          <input type="number" value="${p.Stock || 0}" style="width:50px; font-size:12px; padding:2px 4px; border:1px solid #cbd5e1; border-radius:4px;" onchange="quickUpdateProduct(${p.ProductId}, 'stock', this.value)">
          <button class="btn-admin btn-admin-outline" style="padding:1px 5px; font-size:10px;" onclick="quickUpdateProduct(${p.ProductId}, 'stock', ${(p.Stock || 0) + 5})">+5</button>
        </div>
      </td>
      <td>
        <select class="form-control" style="font-size:11px; padding:3px 6px; width:auto;" onchange="quickUpdateProduct(${p.ProductId}, 'status', this.value)">
          <option value="pre_order" ${p.Status === 'pre_order' ? 'selected' : ''}>Pre-Order</option>
          <option value="in_stock" ${p.Status === 'in_stock' ? 'selected' : ''}>Có sẵn</option>
          <option value="sold_out" ${p.Status === 'sold_out' ? 'selected' : ''}>Hết hàng</option>
        </select>
      </td>
      <td>
        <div style="display:flex; gap:4px;">
          <button class="btn-admin btn-admin-outline" style="padding:3px 7px; font-size:11.5px;" onclick="openEditProductModal(${p.ProductId})" title="Chỉnh sửa">✏️</button>
          <button class="btn-admin btn-admin-outline" style="padding:3px 7px; font-size:11.5px; color:#2563eb;" onclick="cloneProduct(${p.ProductId})" title="Nhân bản mẫu xe">📑</button>
          <button class="btn-admin btn-admin-outline" style="padding:3px 7px; font-size:11.5px; color:#dc2626;" onclick="deleteProduct(${p.ProductId})" title="Xóa">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterProducts() {
  const q = (document.getElementById('searchProductInput').value || '').trim().toLowerCase();
  const cat = document.getElementById('filterProductCategory').value;

  let filtered = currentProducts.filter(p => {
    const matchQ = (p.Name || '').toLowerCase().includes(q) || (p.Sku || '').toLowerCase().includes(q);
    const matchCat = !cat || String(p.CategoryId) === cat;
    return matchQ && matchCat;
  });

  renderProductsTable(filtered);
}

// Cập nhật xem trước ảnh trực tiếp
function updateProductImagePreview(url) {
  const imgEl = document.getElementById('prodImagePreview');
  const textEl = document.getElementById('prodImagePreviewText');
  if (imgEl) {
    imgEl.src = url ? (url.startsWith('http') || url.startsWith('../') ? url : ('../' + url)) : '../image/hero-banner.png';
  }
  if (textEl) {
    textEl.textContent = url ? url : 'Xem trước hình ảnh sản phẩm';
  }
}

function openAddProductModal() {
  document.getElementById('productModalTitle').textContent = 'Thêm Mô Hình Xe Mới';
  document.getElementById('productForm').reset();
  document.getElementById('editProductId').value = '';
  updateProductImagePreview('image/hero-banner.png');
  document.getElementById('productModal').classList.add('active');
}

function openEditProductModal(productId) {
  const p = currentProducts.find(x => x.ProductId === productId);
  if (!p) return;

  document.getElementById('productModalTitle').textContent = 'Chỉnh Sửa Mô Hình: #' + p.Sku;
  document.getElementById('editProductId').value = p.ProductId;
  document.getElementById('prodSku').value = p.Sku;
  document.getElementById('prodName').value = p.Name;
  document.getElementById('prodCategory').value = p.CategoryId;
  document.getElementById('prodBrand').value = p.Brand || 'MINI GT';
  document.getElementById('prodScale').value = p.Scale || '1:64';
  document.getElementById('prodPrice').value = p.Price;
  document.getElementById('prodOldPrice').value = p.OldPrice || '';
  document.getElementById('prodDeposit').value = p.DepositAmount || '';
  document.getElementById('prodQuota').value = p.QuotaPercent || 0;
  document.getElementById('prodEdition').value = p.EditionNote || '';
  document.getElementById('prodDeadline').value = p.PreOrderDeadline ? p.PreOrderDeadline.split('T')[0] : '';
  document.getElementById('prodStock').value = p.Stock || 0;
  document.getElementById('prodImage').value = p.ImageUrl || '';
  document.getElementById('prodStatus').value = p.Status || 'in_stock';
  document.getElementById('prodDesc').value = p.Description || '';

  updateProductImagePreview(p.ImageUrl);
  document.getElementById('productModal').classList.add('active');
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('editProductId').value;
  const isEdit = Boolean(id);

  const payload = {
    sku: document.getElementById('prodSku').value.trim(),
    name: document.getElementById('prodName').value.trim(),
    categoryId: document.getElementById('prodCategory').value,
    brand: document.getElementById('prodBrand').value.trim(),
    scale: document.getElementById('prodScale').value.trim(),
    price: document.getElementById('prodPrice').value,
    oldPrice: document.getElementById('prodOldPrice').value || null,
    depositAmount: document.getElementById('prodDeposit').value || null,
    quotaPercent: document.getElementById('prodQuota').value || 0,
    editionNote: document.getElementById('prodEdition').value.trim() || null,
    preOrderDeadline: document.getElementById('prodDeadline').value || null,
    stock: document.getElementById('prodStock').value || 0,
    imageUrl: document.getElementById('prodImage').value.trim() || 'image/hero-banner.png',
    status: document.getElementById('prodStatus').value,
    description: document.getElementById('prodDesc').value.trim()
  };

  try {
    const url = isEdit ? `/api/admin/products/${id}` : '/api/admin/products';
    const method = isEdit ? 'PUT' : 'POST';

    const json = await safeFetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });

    if (json.success) {
      alert(json.message);
      closeAdminModal('productModal');
      loadProducts();
    } else {
      alert(json.message || 'Lỗi khi lưu sản phẩm');
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

// 5.1. NHÂN BẢN SẢN PHẨM (CLONE)
async function cloneProduct(productId) {
  if (!confirm('Bạn có muốn tạo một bản sao nhân bản của mô hình này để chỉnh sửa nhanh không?')) return;
  try {
    const json = await safeFetch(`/api/admin/products/${productId}/clone`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (json.success) {
      alert(json.message);
      loadProducts();
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert('Lỗi nhân bản: ' + err.message);
  }
}

// 5.2. CẬP NHẬT NHANH TRẠNG THÁI HOẶC TỒN KHO TRỰC TIẾP TRÊN BẢNG
async function quickUpdateProduct(productId, field, value) {
  try {
    const body = {};
    body[field] = value;
    const json = await safeFetch(`/api/admin/products/${productId}/quick-update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(body)
    });
    if (json.success) {
      // Cập nhật mảng local
      const p = currentProducts.find(x => x.ProductId === productId);
      if (p) p[field] = value;
    }
  } catch (err) {
    alert('Lỗi cập nhật nhanh: ' + err.message);
  }
}

async function deleteProduct(productId) {
  if (!confirm('Bạn có chắc chắn muốn xóa mô hình này khỏi CSDL?')) return;

  try {
    const json = await safeFetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (json.success) {
      alert('Đã xóa sản phẩm thành công!');
      loadProducts();
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
}

// =====================================================================
// 6. PHÂN HỆ QUẢN LÝ ĐƠN HÀNG (ADMIN ORDER MANAGEMENT & STATE MACHINE)
// =====================================================================

function setOrderTab(status) {
  currentOrderFilter.status = status;
  document.querySelectorAll('.order-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });
  loadOrders();
}

let filterDebounceTimer = null;
function handleOrderFilterChange() {
  clearTimeout(filterDebounceTimer);
  filterDebounceTimer = setTimeout(() => {
    currentOrderFilter.search = (document.getElementById('searchOrderInput').value || '').trim();
    currentOrderFilter.paymentStatus = document.getElementById('filterPaymentStatus').value;
    currentOrderFilter.paymentMethod = document.getElementById('filterPaymentMethod').value;
    loadOrders();
  }, 250);
}

async function loadOrders() {
  try {
    const params = new URLSearchParams();
    if (currentOrderFilter.status && currentOrderFilter.status !== 'ALL') {
      params.append('status', currentOrderFilter.status);
    }
    if (currentOrderFilter.paymentStatus && currentOrderFilter.paymentStatus !== 'ALL') {
      params.append('paymentStatus', currentOrderFilter.paymentStatus);
    }
    if (currentOrderFilter.paymentMethod && currentOrderFilter.paymentMethod !== 'ALL') {
      params.append('paymentMethod', currentOrderFilter.paymentMethod);
    }
    if (currentOrderFilter.search) {
      params.append('search', currentOrderFilter.search);
    }

    const url = `/api/admin/orders?${params.toString()}`;
    const json = await safeFetch(url, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!json.success) return;

    currentOrders = json.data || [];

    // Cập nhật số lượng trên các tab
    if (json.counts) {
      const c = json.counts;
      const elAll = document.getElementById('countTabAll');
      const elPending = document.getElementById('countTabPending');
      const elConfirmed = document.getElementById('countTabConfirmed');
      const elShipping = document.getElementById('countTabShipping');
      const elDelivered = document.getElementById('countTabDelivered');
      const elCancelled = document.getElementById('countTabCancelled');

      if (elAll) elAll.textContent = c.all || 0;
      if (elPending) elPending.textContent = c.pending || 0;
      if (elConfirmed) elConfirmed.textContent = c.confirmed || 0;
      if (elShipping) elShipping.textContent = c.shipping || 0;
      if (elDelivered) elDelivered.textContent = c.delivered || 0;
      if (elCancelled) elCancelled.textContent = c.cancelled || 0;

      // Cập nhật các thẻ KPI Logistics
      const kpiPending = document.getElementById('kpiPendingCount');
      const kpiConfirmed = document.getElementById('kpiConfirmedCount');
      const kpiShipping = document.getElementById('kpiShippingCount');
      const kpiDelivered = document.getElementById('kpiDeliveredCount');
      const kpiCod = document.getElementById('kpiCodAmount');

      if (kpiPending) kpiPending.textContent = c.pending || 0;
      if (kpiConfirmed) kpiConfirmed.textContent = c.confirmed || 0;
      if (kpiShipping) kpiShipping.textContent = c.shipping || 0;
      if (kpiDelivered) kpiDelivered.textContent = c.delivered || 0;
      if (kpiCod) kpiCod.textContent = formatVND(c.pendingCodTotal || 0);
    }

    renderOrdersTable(currentOrders);
  } catch (err) {
    console.error('Lỗi tải danh sách đơn hàng:', err);
  }
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersTbody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; padding:3rem; color:#94a3b8;">
          <div style="font-size:32px; margin-bottom:8px;">📦</div>
          <div style="font-weight:600; font-size:14px; color:#475569;">Không tìm thấy đơn hàng nào phù hợp với bộ lọc</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const rawMethod = (o.PaymentMethod || 'COD').toUpperCase();
    const isCOD = rawMethod.includes('COD');

    const ordStatus = (o.Status || 'PENDING').toUpperCase();
    const payStatus = (o.PaymentStatus || 'UNPAID').toUpperCase();

    let actionButtonsHtml = '';

    if (isCOD) {
      // COD Flow
      if (ordStatus === 'PENDING') {
        actionButtonsHtml = `
          <button class="btn-action btn-action-approve" onclick="approveOrder('${o.OrderId}')" title="Xác nhận đơn">
            ✅ Duyệt đơn
          </button>
          <button class="btn-action btn-action-ship" onclick="openShipSpxModal('${o.OrderId}')" title="Gán mã SPX và giao ngay">
            🚚 Giao SPX
          </button>
          <button class="btn-action btn-action-cancel" onclick="openCancelOrderModal('${o.OrderId}')">
            ✕ Hủy
          </button>
        `;
      } else if (ordStatus === 'CONFIRMED') {
        actionButtonsHtml = `
          <button class="btn-action btn-action-ship" onclick="openShipSpxModal('${o.OrderId}')" title="Bàn giao shipper SPX Express">
            🚚 Giao SPX
          </button>
          <button class="btn-action btn-action-cancel" onclick="openCancelOrderModal('${o.OrderId}')">
            ✕ Hủy
          </button>
        `;
      } else if (ordStatus === 'SHIPPING') {
        actionButtonsHtml = `
          <button class="btn-action btn-action-complete" onclick="completeOrder('${o.OrderId}')" title="Shipper SPX đã phát thành công và thu đủ COD">
            📦 Đã giao & Thu COD
          </button>
        `;
      } else if (ordStatus === 'DELIVERED') {
        actionButtonsHtml = `<span style="color:#059669; font-weight:700; font-size:12px;">✓ Đã hoàn tất</span>`;
      } else if (ordStatus === 'CANCELLED') {
        actionButtonsHtml = `<span style="color:#dc2626; font-weight:700; font-size:12px;">✕ Đã hủy</span>`;
      }
    } else {
      // Bank Transfer Flow
      if (ordStatus === 'PENDING') {
        if (payStatus !== 'PAID') {
          actionButtonsHtml = `
            <span class="btn-tooltip-wrap" data-tooltip="Cần xác nhận thanh toán trước khi duyệt đơn">
              <button class="btn-action btn-action-approve" disabled>
                ✅ Duyệt đơn
              </button>
            </span>
            <button class="btn-action btn-action-pay" onclick="confirmPayment('${o.OrderId}')" title="Xác nhận đã nhận tiền chuyển khoản MB Bank">
              💰 Xác nhận đã nhận tiền
            </button>
            <button class="btn-action btn-action-cancel" onclick="openCancelOrderModal('${o.OrderId}')">
              ✕ Hủy
            </button>
          `;
        } else {
          actionButtonsHtml = `
            <button class="btn-action btn-action-approve" onclick="approveOrder('${o.OrderId}')">
              ✅ Duyệt đơn
            </button>
            <button class="btn-action btn-action-ship" onclick="openShipSpxModal('${o.OrderId}')">
              🚚 Giao SPX
            </button>
            <button class="btn-action btn-action-cancel" onclick="openCancelOrderModal('${o.OrderId}')">
              ✕ Hủy
            </button>
          `;
        }
      } else if (ordStatus === 'CONFIRMED') {
        actionButtonsHtml = `
          <button class="btn-action btn-action-ship" onclick="openShipSpxModal('${o.OrderId}')">
            🚚 Giao SPX
          </button>
          <button class="btn-action btn-action-cancel" onclick="openCancelOrderModal('${o.OrderId}')">
            ✕ Hủy
          </button>
        `;
      } else if (ordStatus === 'SHIPPING') {
        actionButtonsHtml = `
          <button class="btn-action btn-action-complete" onclick="completeOrder('${o.OrderId}')">
            📦 Xác nhận giao thành công
          </button>
        `;
      } else if (ordStatus === 'DELIVERED') {
        actionButtonsHtml = `<span style="color:#059669; font-weight:700; font-size:12px;">✓ Đã hoàn tất</span>`;
      } else if (ordStatus === 'CANCELLED') {
        actionButtonsHtml = `<span style="color:#dc2626; font-weight:700; font-size:12px;">✕ Đã hủy</span>`;
      }
    }

    const itemsCount = o.items ? o.items.length : 0;
    const firstItemName = o.items && o.items[0] ? o.items[0].ProductName : 'Mô hình xe';
    const itemsSummary = itemsCount > 1 
      ? `${firstItemName} +${itemsCount - 1} xe` 
      : firstItemName;

    return `
      <tr>
        <td>
          <strong style="color:var(--admin-text-main); font-family:monospace; font-size:13px;">#${o.OrderCode}</strong>
        </td>
        <td>
          <div style="font-size:12px; color:#475569;">${new Date(o.CreatedAt).toLocaleDateString('vi-VN')}</div>
          <div style="font-size:11px; color:#94a3b8;">${new Date(o.CreatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
        </td>
        <td>
          <div style="font-weight:700; color:var(--admin-text-main);">${escapeHtml(o.FullName)}</div>
          <div style="font-size:11px; color:#64748b; display:flex; align-items:center; gap:4px;">
            <span>📞 ${escapeHtml(o.Phone)}</span>
            <button type="button" style="border:none; background:none; cursor:pointer; font-size:10px; color:#ea580c; padding:0;" onclick="copyTrackingCode('${escapeHtml(o.Phone)}')" title="Sao chép SĐT">📋</button>
          </div>
          <div style="font-size:10.5px; color:#94a3b8; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(o.Address)}">
            📍 ${escapeHtml(o.Address)}
          </div>
        </td>
        <td>
          <div style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:600;" title="${escapeHtml(itemsSummary)}">
            ${escapeHtml(itemsSummary)}
          </div>
          <div style="font-size:11px; color:#64748b;">Tổng: <strong>${itemsCount}</strong> món</div>
        </td>
        <td>
          <strong style="color:var(--admin-primary); font-size:13.5px;">${formatVND(o.Total)}</strong>
        </td>
        <td>${renderPaymentMethodBadge(o.PaymentMethod)}</td>
        <td>${renderPaymentStatusBadge(o.PaymentStatus)}</td>
        <td>${renderOrderStatusBadge(o.Status)}</td>
        <td>
          ${o.TrackingCode ? `
            <div style="display:flex; flex-direction:column; gap:4px;">
              <div style="display:flex; align-items:center; gap:5px;">
                <span class="spx-badge" style="font-size:10px; padding:2px 6px;">SPX</span>
                <span style="font-weight:700; font-size:12px; color:#ea580c; font-family:monospace; letter-spacing:0.5px;">${escapeHtml(o.TrackingCode)}</span>
              </div>
              <div style="display:flex; gap:4px; margin-top:2px;">
                <button class="btn-admin btn-admin-outline" style="padding:2px 6px; font-size:10.5px; background:#fff;" onclick="copyTrackingCode('${escapeHtml(o.TrackingCode)}')" title="Sao chép mã SPX">
                  📋 Copy
                </button>
                <a href="https://spx.vn/vi" target="_blank" class="btn-admin btn-admin-outline" style="padding:2px 6px; font-size:10.5px; color:#ea580c; text-decoration:none; background:#fff;" title="Mở trang tra cứu spx.vn">
                  🚀 SPX ↗
                </a>
                <button class="btn-admin btn-admin-outline" style="padding:2px 6px; font-size:10.5px; color:#64748b; background:#fff;" onclick="openShipSpxModal('${o.OrderId}')" title="Chỉnh sửa mã vận đơn">
                  ✏️ Sửa
                </button>
              </div>
            </div>
          ` : `
            <button class="btn-admin btn-admin-outline" style="padding:4px 8px; font-size:11px; color:#ea580c; border-color:#fdba74; background:#fff7ed; font-weight:700;" onclick="openShipSpxModal('${o.OrderId}')" title="Nhập hoặc dán mã vận đơn SPX">
              🚚 + Gán mã SPX
            </button>
          `}
        </td>
        <td>
          <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-start;">
            <div style="display:flex; flex-wrap:wrap; gap:4px; align-items:center;">
              ${actionButtonsHtml}
            </div>
            <div style="display:flex; gap:4px; margin-top:2px;">
              <button class="btn-admin btn-admin-outline" style="padding:2px 7px; font-size:11px;" onclick="viewOrderDetail('${o.OrderId}')">
                👁️ Chi tiết
              </button>
              <button class="btn-admin btn-admin-outline" style="padding:2px 7px; font-size:11px; color:#2563eb;" onclick="printOrderInvoice('${o.OrderId}')" title="In phiếu đóng hàng & Vận đơn SPX">
                🖨️ In đơn
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// 6.1. HÀNH ĐỘNG: XÁC NHẬN ĐÃ NHẬN TIỀN (CONFIRM PAID)
async function confirmPayment(orderId) {
  if (!confirm(`Xác nhận bạn đã kiểm tra và nhận đủ tiền thanh toán chuyển khoản MB Bank cho đơn #${orderId}?`)) return;

  try {
    const json = await safeFetch(`/api/admin/orders/${orderId}/confirm-payment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (json.success) {
      alert(json.message);
      loadOrders();
      const modal = document.getElementById('orderDetailModal');
      if (modal && modal.classList.contains('active')) {
        viewOrderDetail(orderId);
      }
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert('Lỗi khi xác nhận tiền: ' + err.message);
  }
}

// 6.2. HÀNH ĐỘNG: DUYỆT ĐƠN (APPROVE)
async function approveOrder(orderId) {
  try {
    const json = await safeFetch(`/api/admin/orders/${orderId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (json.success) {
      alert(json.message);
      loadOrders();
      const modal = document.getElementById('orderDetailModal');
      if (modal && modal.classList.contains('active')) {
        viewOrderDetail(orderId);
      }
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert('Lỗi duyệt đơn: ' + err.message);
  }
}

// 6.3. HÀNH ĐỘNG: QUẢN LÝ VẬN ĐƠN SPX EXPRESS & GIAO HÀNG (SHIP)
let shipSpxDispatchText = '';

async function openShipSpxModal(orderId) {
  let o = currentOrders.find(x => String(x.OrderId) === String(orderId));

  if (!o) {
    try {
      const res = await safeFetch(`/api/admin/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.success && res.data) {
        o = res.data;
      }
    } catch (e) {
      console.error('Lỗi tìm đơn:', e);
    }
  }

  if (!o) {
    alert('Không tìm thấy thông tin đơn hàng #' + orderId);
    return;
  }

  shipSpxOrderId = o.OrderId;
  const isCOD = (o.PaymentMethod || '').toUpperCase().includes('COD');
  const codText = isCOD ? formatVND(o.Total) : '0đ (Đã thanh toán trước qua MB Bank)';

  const codeEl = document.getElementById('shipSpxOrderCodeText');
  if (codeEl) {
    codeEl.innerHTML = `Đơn: <strong>#${o.OrderCode}</strong> — Khách: <strong>${escapeHtml(o.FullName)}</strong>`;
  }

  const dispatchEl = document.getElementById('shipSpxCustomerDispatchInfo');
  if (dispatchEl) {
    dispatchEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:3px; flex-wrap:wrap;">
        <span>Người nhận: <strong>${escapeHtml(o.FullName)}</strong></span>
        <span>SĐT: <strong style="color:#ea580c; font-size:13px;">${escapeHtml(o.Phone)}</strong></span>
      </div>
      <div style="margin-bottom:3px;">Địa chỉ giao: <strong>${escapeHtml(o.Address)}</strong></div>
      <div style="display:flex; justify-content:space-between; border-top:1px dashed #fdba74; padding-top:3px; margin-top:3px; flex-wrap:wrap;">
        <span>Hình thức TT: <strong>${o.PaymentMethod}</strong></span>
        <span>Tiền thu hộ COD: <strong style="color:#ea580c; font-size:13px;">${codText}</strong></span>
      </div>
    `;
  }

  shipSpxDispatchText = `Người nhận: ${o.FullName}\nSĐT: ${o.Phone}\nĐịa chỉ: ${o.Address}\nTiền thu hộ COD: ${codText}\nGhi chú: ${o.Note || 'Cho khách kiểm tra hàng mô hình xe MINI GT'}`;

  const inputEl = document.getElementById('shipSpxTrackingCodeInput');
  if (inputEl) {
    inputEl.value = o.TrackingCode || '';
    setTimeout(() => {
      inputEl.focus();
      inputEl.select();
    }, 150);
  }

  document.getElementById('shipSpxModal').classList.add('active');
}

function shipOrder(orderId) {
  openShipSpxModal(orderId);
}

// Hàm dán mã vận đơn từ Clipboard vào bất kỳ ô input nào
async function pasteTrackingToInput(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;

  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const clean = text.trim().toUpperCase();
        el.value = clean;
        el.focus();
        alert('Đã dán mã vận đơn: ' + clean);
        return;
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc clipboard:', err);
  }

  // Fallback nếu trình duyệt chặn quyền đọc clipboard
  const manual = prompt('Nhập hoặc nhấn Ctrl+V để dán mã vận đơn SPX Express vào đây:');
  if (manual && manual.trim()) {
    const clean = manual.trim().toUpperCase();
    el.value = clean;
    el.focus();
    alert('Đã nhập mã vận đơn: ' + clean);
  }
}

// Sao chép toàn bộ thông tin gửi hàng để dán sang app SPX
function copyShipSpxDispatchInfo() {
  if (!shipSpxDispatchText) return;
  copyTrackingCode(shipSpxDispatchText);
  alert('Đã sao chép đầy đủ thông tin người nhận & tiền COD!\nBạn có thể dán ngay vào app hoặc web SPX Express để tạo đơn.');
}

// Lưu mã vận đơn SPX mà không bắt buộc đổi trạng thái
async function saveSpxTrackingOnly() {
  if (!shipSpxOrderId) return;
  const inputEl = document.getElementById('shipSpxTrackingCodeInput');
  const trackingCode = (inputEl ? inputEl.value : '').trim().toUpperCase();

  if (!trackingCode) {
    alert('Vui lòng nhập hoặc dán mã vận đơn SPX Express trước khi lưu!');
    return;
  }

  try {
    const json = await safeFetch(`/api/admin/orders/${shipSpxOrderId}/tracking`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ trackingCode, carrier: 'SPX' })
    });

    if (json.success) {
      alert(json.message || 'Đã lưu mã vận đơn SPX Express thành công!');
      closeAdminModal('shipSpxModal');
      loadOrders();
      const modal = document.getElementById('orderDetailModal');
      if (modal && modal.classList.contains('active')) {
        viewOrderDetail(shipSpxOrderId);
      }
      shipSpxOrderId = null;
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert('Lỗi cập nhật mã vận đơn: ' + err.message);
  }
}

// Xác nhận giao hàng và chuyển trạng thái sang SHIPPING
async function confirmShipSpxSubmit() {
  if (!shipSpxOrderId) return;
  const inputEl = document.getElementById('shipSpxTrackingCodeInput');
  const trackingCode = (inputEl ? inputEl.value : '').trim().toUpperCase();

  if (!trackingCode) {
    if (!confirm('Bạn chưa nhập mã vận đơn SPX Express. Tiếp tục chuyển sang trạng thái đang giao hàng mà không có mã?')) {
      return;
    }
  }

  try {
    const json = await safeFetch(`/api/admin/orders/${shipSpxOrderId}/ship`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ trackingCode, carrier: 'SPX' })
    });

    if (json.success) {
      alert(json.message || 'Đã chuyển đơn hàng sang trạng thái Đang giao hàng với SPX Express!');
      closeAdminModal('shipSpxModal');
      loadOrders();
      const modal = document.getElementById('orderDetailModal');
      if (modal && modal.classList.contains('active')) {
        viewOrderDetail(shipSpxOrderId);
      }
      shipSpxOrderId = null;
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert('Lỗi chuyển trạng thái giao hàng: ' + err.message);
  }
}

// Lưu mã SPX trực tiếp trong modal chi tiết đơn
async function saveDetailSpxTracking(orderId) {
  const input = document.getElementById('detailSpxTrackingInput');
  const trackingCode = input ? input.value.trim().toUpperCase() : '';
  if (!trackingCode) {
    alert('Vui lòng nhập hoặc dán mã vận đơn SPX Express!');
    return;
  }

  try {
    const json = await safeFetch(`/api/admin/orders/${orderId}/tracking`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ trackingCode, carrier: 'SPX' })
    });

    if (json.success) {
      alert(json.message || 'Đã lưu mã vận đơn SPX thành công!');
      loadOrders();
      viewOrderDetail(orderId);
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert('Lỗi cập nhật mã vận đơn: ' + err.message);
  }
}

function copyTrackingCode(code) {
  if (!code) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      // Sao chép thành công
    }).catch(() => {
      fallbackCopy(code);
    });
  } else {
    fallbackCopy(code);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

// 6.4. HÀNH ĐỘNG: HOÀN TẤT ĐƠN HÀNG & THU TIỀN (COMPLETE)
async function completeOrder(orderId) {
  if (!confirm(`Xác nhận hoàn tất đơn hàng #${orderId} (đã giao thành công cho khách và thu tiền COD)?`)) return;

  try {
    const json = await safeFetch(`/api/admin/orders/${orderId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (json.success) {
      alert(json.message);
      loadOrders();
      const modal = document.getElementById('orderDetailModal');
      if (modal && modal.classList.contains('active')) {
        viewOrderDetail(orderId);
      }
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert('Lỗi hoàn tất đơn: ' + err.message);
  }
}

// 6.5. HÀNH ĐỘNG: HỦY ĐƠN VÀ LÝ DO
function openCancelOrderModal(orderId) {
  const o = currentOrders.find(x => String(x.OrderId) === String(orderId));
  if (!o) return;

  orderToCancelId = orderId;
  document.getElementById('cancelOrderCodeText').textContent = `Mã đơn: #${o.OrderCode} - Khách: ${o.FullName}`;
  document.getElementById('cancelOrderReasonInput').value = '';

  const isPaid = (o.PaymentStatus || '').toUpperCase() === 'PAID';
  const noticeEl = document.getElementById('cancelOrderNotice');
  if (noticeEl) {
    noticeEl.style.display = isPaid ? 'block' : 'none';
  }

  document.getElementById('cancelOrderModal').classList.add('active');
}

async function confirmCancelOrderSubmit() {
  if (!orderToCancelId) return;

  const reason = document.getElementById('cancelOrderReasonInput').value.trim();
  if (!reason) {
    alert('Vui lòng nhập lý do hủy đơn hàng!');
    return;
  }

  try {
    const json = await safeFetch(`/api/admin/orders/${orderToCancelId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ cancelReason: reason })
    });

    if (json.success) {
      alert(json.message);
      closeAdminModal('cancelOrderModal');
      loadOrders();
      const modal = document.getElementById('orderDetailModal');
      if (modal && modal.classList.contains('active')) {
        viewOrderDetail(orderToCancelId);
      }
      orderToCancelId = null;
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert('Lỗi hủy đơn: ' + err.message);
  }
}

// 6.6. XUẤT ĐƠN HÀNG RA FILE EXCEL / CSV
function exportOrdersToCSV() {
  if (!currentOrders || currentOrders.length === 0) {
    alert('Không có dữ liệu đơn hàng để xuất file!');
    return;
  }
  let csvContent = '\uFEFFMã Đơn,Ngày Tạo,Khách Hàng,Số Điện Thoại,Địa Chỉ,Phương Thức,Thanh Toán,Trạng Thái Đơn,Tổng Tiền,Ghi Chú,Sản Phẩm\n';
  currentOrders.forEach(o => {
    const itemsStr = (o.items || []).map(i => `${i.ProductName} (x${i.Quantity})`).join('; ');
    csvContent += `"${o.OrderCode}","${new Date(o.CreatedAt).toLocaleDateString('vi-VN')}","${o.FullName}","${o.Phone}","${(o.Address || '').replace(/"/g, '""')}","${o.PaymentMethod}","${o.PaymentStatus}","${o.Status}","${o.Total}","${(o.Note || '').replace(/"/g, '""')}","${itemsStr.replace(/"/g, '""')}"\n`;
  });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `DonHang_MiniGT_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 6.7. IN PHIẾU ĐÓNG GÓI & VẬN ĐƠN SPX EXPRESS
function printOrderInvoice(orderId) {
  const o = currentOrders.find(x => String(x.OrderId) === String(orderId));
  if (!o) return;

  const isCOD = (o.PaymentMethod || '').toUpperCase().includes('COD');
  const codText = isCOD ? formatVND(o.Total) : '0đ (ĐÃ THANH TOÁN QUA MB BANK - KHÔNG THU TIỀN)';

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Vận Đơn SPX Express #${o.OrderCode}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; line-height: 1.4; color: #111; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 2px solid #ea580c; padding-bottom: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 20px; font-weight: 800; color: #ea580c; display: flex; align-items: center; gap: 8px; }
          .spx-tag { background: #ea580c; color: #fff; font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
          
          .barcode-box {
            border: 2px dashed #ea580c; background: #fffaf5; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 15px;
          }
          .barcode-sim { font-family: monospace; font-size: 26px; font-weight: 900; letter-spacing: 4px; color: #111; margin: 4px 0; }
          
          .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px; }
          .info-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 12px; border-radius: 6px; font-size: 12.5px; }
          .info-box h4 { margin: 0 0 6px 0; font-size: 13px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          
          .cod-highlight {
            background: ${isCOD ? '#fef2f2' : '#f0fdf4'};
            border: 2px solid ${isCOD ? '#dc2626' : '#16a34a'};
            padding: 10px 14px; border-radius: 8px; margin-bottom: 15px;
            display: flex; justify-content: space-between; align-items: center;
          }
          .cod-title { font-weight: 700; color: ${isCOD ? '#991b1b' : '#166534'}; font-size: 13px; }
          .cod-amount { font-size: 20px; font-weight: 900; color: ${isCOD ? '#dc2626' : '#15803d'}; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; font-size: 12px; }
          th { background: #f1f5f9; font-weight: 700; }
          .total { text-align: right; margin-top: 10px; font-size: 14px; font-weight: bold; color: #ea580c; }
          
          .notice-box {
            margin-top: 18px; padding: 8px 12px; background: #fffbeb; border: 1px solid #fef08a; border-radius: 6px;
            font-size: 11.5px; color: #854d0e; text-align: center; font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">
              <span class="spx-tag">SPX EXPRESS</span> MINI GT STORE — PHIẾU VẬN ĐƠN
            </div>
            <div style="font-size:11.5px; color:#64748b; margin-top:2px;">Chuyên Mô Hình Xe Diecast 1:64 Cao Cấp | Tra cứu: spx.vn/vi</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:14px; font-weight:800;">ĐƠN HÀNG: #${o.OrderCode}</div>
            <div style="font-size:11px; color:#64748b;">Ngày in: ${new Date().toLocaleDateString('vi-VN')}</div>
          </div>
        </div>

        <div class="barcode-box">
          <div style="font-size:11px; font-weight:700; color:#ea580c; text-transform:uppercase;">MÃ VẬN ĐƠN SPX EXPRESS (SHOPEE XPRESS)</div>
          <div class="barcode-sim">${o.TrackingCode || o.OrderCode}</div>
          <div style="font-size:11px; color:#64748b;">(Quét mã hoặc dán mã vào https://spx.vn/vi để kiểm tra hành trình giao hàng)</div>
        </div>

        <div class="grid-info">
          <div class="info-box">
            <h4>🏢 NGƯỜI GỬI (SHOP)</h4>
            <strong>MINI GT STORE VIỆT NAM</strong><br>
            Hotline / Zalo: <strong>0848.184.164</strong><br>
            Địa chỉ: Tổng kho mô hình xe Diecast Biên Hòa, Đồng Nai<br>
            Website: minigtstore.vn
          </div>
          <div class="info-box">
            <h4>📍 NGƯỜI NHẬN (KHÁCH HÀNG)</h4>
            Họ tên: <strong>${escapeHtml(o.FullName)}</strong><br>
            Điện thoại: <strong>${escapeHtml(o.Phone)}</strong><br>
            Địa chỉ giao: <strong>${escapeHtml(o.Address)}</strong><br>
            Ghi chú: <em>${escapeHtml(o.Note || 'Không có')}</em>
          </div>
        </div>

        <div class="cod-highlight">
          <div>
            <div class="cod-title">${isCOD ? 'TIỀN THU HỘ COD CHO SHIPPER:' : 'TRẠNG THÁI THANH TOÁN:'}</div>
            <div style="font-size:11px; color:#64748b;">Phương thức: ${o.PaymentMethod}</div>
          </div>
          <div class="cod-amount">${codText}</div>
        </div>

        <h4 style="margin:10px 0 6px 0; font-size:12.5px;">DANH SÁCH MÔ HÌNH XE ĐÓNG GÓI TRONG KIỆN:</h4>
        <table>
          <thead>
            <tr><th>STT</th><th>SKU</th><th>Tên mô hình xe Diecast</th><th>Tỉ lệ</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>
          </thead>
          <tbody>
            ${(o.items || []).map((it, idx) => `
              <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td><strong>#${it.Sku || 'MGT'}</strong></td>
                <td><strong>${escapeHtml(it.ProductName)}</strong></td>
                <td>${it.Scale || '1:64'}</td>
                <td style="text-align:center;"><strong>x${it.Quantity}</strong></td>
                <td>${formatVND(it.UnitPrice)}</td>
                <td>${formatVND(it.UnitPrice * it.Quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">Tổng tiền hàng: ${formatVND(o.Total)}</div>

        <div class="notice-box">
          ⚠️ QUY ĐỊNH GIAO NHẬN: CHO KHÁCH ĐỒNG KIỂM XE MÔ HÌNH — HÀNG DỄ VỠ/GÃY GẬP CHI TIẾT NHỎ, XIN SHIPPER NHẸ TAY!
        </div>

        <script>window.onload = function() { window.print(); };<\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// 6.8. XEM CHI TIẾT ĐƠN HÀNG ĐẦY ĐỦ
async function viewOrderDetail(orderId) {
  try {
    const json = await safeFetch(`/api/admin/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!json.success || !json.data) {
      alert('Không thể tải thông tin đơn hàng');
      return;
    }

    const o = json.data;
    const body = document.getElementById('orderDetailBody');
    if (!body) return;

    const ordStatus = (o.Status || 'PENDING').toUpperCase();
    const payStatus = (o.PaymentStatus || 'UNPAID').toUpperCase();
    const isCOD = (o.PaymentMethod || '').toUpperCase().includes('COD');

    const bankId = 'MB';
    const accountNo = '87654321082007';
    const accountName = 'DO QUOC THINH';
    const transferDesc = `MINI GT ${o.OrderCode}`;
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${o.Total}&addInfo=${encodeURIComponent(transferDesc)}&accountName=${encodeURIComponent(accountName)}`;

    const isStep1 = true;
    const isStep2 = payStatus === 'PAID' || isCOD;
    const isStep3 = ordStatus === 'CONFIRMED' || ordStatus === 'SHIPPING' || ordStatus === 'DELIVERED';
    const isStep4 = ordStatus === 'SHIPPING' || ordStatus === 'DELIVERED';
    const isStep5 = ordStatus === 'DELIVERED';
    const isCancelled = ordStatus === 'CANCELLED';

    let timelineHtml = '';
    if (isCancelled) {
      timelineHtml = `
        <div style="background:#fee2e2; border-radius:8px; padding:12px; margin-bottom:1rem; text-align:center;">
          <div style="color:#b91c1c; font-weight:800; font-size:14px;">✕ ĐƠN HÀNG ĐÃ BỊ HỦY</div>
          <div style="font-size:12px; color:#7f1d1d; margin-top:4px;">
            Lý do hủy: <strong>${escapeHtml(o.CancelReason || 'Không có lý do cụ thể')}</strong>
          </div>
        </div>
      `;
    } else {
      timelineHtml = `
        <div class="order-timeline">
          <div class="timeline-step ${isStep1 ? 'completed' : ''}">
            <div class="step-icon">1</div>
            <div class="step-label">Đặt hàng</div>
          </div>
          <div class="timeline-step ${isStep2 ? 'completed' : (isCOD ? 'completed' : 'active')}">
            <div class="step-icon">${payStatus === 'PAID' ? '✓' : '2'}</div>
            <div class="step-label">${isCOD ? 'COD khi nhận' : 'Thanh toán'}</div>
          </div>
          <div class="timeline-step ${isStep3 ? 'completed' : (ordStatus === 'PENDING' ? 'active' : '')}">
            <div class="step-icon">${isStep3 ? '✓' : '3'}</div>
            <div class="step-label">Đã duyệt</div>
          </div>
          <div class="timeline-step ${isStep4 ? 'completed' : (ordStatus === 'CONFIRMED' ? 'active' : '')}">
            <div class="step-icon">${isStep4 ? '✓' : '4'}</div>
            <div class="step-label">Đang giao</div>
          </div>
          <div class="timeline-step ${isStep5 ? 'completed' : (ordStatus === 'SHIPPING' ? 'active' : '')}">
            <div class="step-icon">${isStep5 ? '✓' : '5'}</div>
            <div class="step-label">Đã giao</div>
          </div>
        </div>
      `;
    }

    let modalActionsHtml = '';
    if (isCOD) {
      if (ordStatus === 'PENDING') {
        modalActionsHtml = `
          <button class="btn-action btn-action-approve" onclick="approveOrder('${o.OrderId}')">✅ Duyệt đơn</button>
          <button class="btn-action btn-action-ship" onclick="openShipSpxModal('${o.OrderId}')">🚚 Giao SPX</button>
          <button class="btn-action btn-action-cancel" onclick="openCancelOrderModal('${o.OrderId}')">✕ Hủy đơn</button>
        `;
      } else if (ordStatus === 'CONFIRMED') {
        modalActionsHtml = `
          <button class="btn-action btn-action-ship" onclick="openShipSpxModal('${o.OrderId}')">🚚 Giao SPX</button>
          <button class="btn-action btn-action-cancel" onclick="openCancelOrderModal('${o.OrderId}')">✕ Hủy đơn</button>
        `;
      } else if (ordStatus === 'SHIPPING') {
        modalActionsHtml = `
          <button class="btn-action btn-action-complete" onclick="completeOrder('${o.OrderId}')">📦 Đã giao & Thu COD</button>
        `;
      }
    } else {
      if (ordStatus === 'PENDING') {
        if (payStatus !== 'PAID') {
          modalActionsHtml = `
            <span class="btn-tooltip-wrap" data-tooltip="Cần xác nhận thanh toán trước khi duyệt đơn">
              <button class="btn-action btn-action-approve" disabled>✅ Duyệt đơn</button>
            </span>
            <button class="btn-action btn-action-pay" onclick="confirmPayment('${o.OrderId}')">💰 Xác nhận đã nhận tiền</button>
            <button class="btn-action btn-action-cancel" onclick="openCancelOrderModal('${o.OrderId}')">✕ Hủy đơn</button>
          `;
        } else {
          modalActionsHtml = `
            <button class="btn-action btn-action-approve" onclick="approveOrder('${o.OrderId}')">✅ Duyệt đơn</button>
            <button class="btn-action btn-action-ship" onclick="openShipSpxModal('${o.OrderId}')">🚚 Giao SPX</button>
            <button class="btn-action btn-action-cancel" onclick="openCancelOrderModal('${o.OrderId}')">✕ Hủy đơn</button>
          `;
        }
      } else if (ordStatus === 'CONFIRMED') {
        modalActionsHtml = `
          <button class="btn-action btn-action-ship" onclick="openShipSpxModal('${o.OrderId}')">🚚 Giao SPX</button>
          <button class="btn-action btn-action-cancel" onclick="openCancelOrderModal('${o.OrderId}')">✕ Hủy đơn</button>
        `;
      } else if (ordStatus === 'SHIPPING') {
        modalActionsHtml = `
          <button class="btn-action btn-action-complete" onclick="completeOrder('${o.OrderId}')">📦 Xác nhận giao thành công</button>
        `;
      }
    }

    body.innerHTML = `
      <div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
        <div>
          <h2 style="font-size:18px; font-weight:800; color:var(--admin-text-main);">
            Chi Tiết Đơn Hàng <span style="color:var(--admin-primary); font-family:monospace;">#${o.OrderCode}</span>
          </h2>
          <div style="font-size:12px; color:#64748b; margin-top:2px;">
            Thời gian tạo: ${new Date(o.CreatedAt).toLocaleString('vi-VN')}
          </div>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          ${renderOrderStatusBadge(o.Status)}
          ${renderPaymentStatusBadge(o.PaymentStatus)}
        </div>
      </div>

      ${timelineHtml}

      <div class="order-detail-grid">
        <!-- Box 1: Thông tin giao nhận -->
        <div class="detail-box">
          <div class="detail-box-title">📍 Thông Tin Khách Hàng & Giao Nhận</div>
          <div class="detail-row"><span>Người nhận:</span> <strong>${escapeHtml(o.FullName)}</strong></div>
          <div class="detail-row"><span>Điện thoại:</span> <strong style="color:#ea580c;">${escapeHtml(o.Phone)}</strong></div>
          <div class="detail-row"><span>Email:</span> <span>${escapeHtml(o.CustomerEmail || 'Chưa cập nhật')}</span></div>
          <div class="detail-row"><span>Địa chỉ:</span> <strong>${escapeHtml(o.Address)}</strong></div>
          <div class="detail-row"><span>Ghi chú:</span> <em>${escapeHtml(o.Note || 'Không có ghi chú')}</em></div>
        </div>

        <!-- Box 2: Thông tin thanh toán & Đối soát -->
        <div class="detail-box">
          <div class="detail-box-title">💳 Chi Tiết & Đối Soát Thanh Toán</div>
          <div class="detail-row">
            <span>Hình thức:</span>
            ${renderPaymentMethodBadge(o.PaymentMethod)}
          </div>
          <div class="detail-row">
            <span>Trạng thái:</span>
            ${renderPaymentStatusBadge(o.PaymentStatus)}
          </div>
          <div class="detail-row">
            <span>Tạm tính hàng:</span>
            <span>${formatVND(o.Subtotal)}</span>
          </div>
          <div class="detail-row">
            <span>Phí vận chuyển:</span>
            <span>${o.ShippingFee > 0 ? formatVND(o.ShippingFee) : '<span style="color:#059669; font-weight:700;">Miễn phí</span>'}</span>
          </div>
          <div class="detail-row" style="border-top:1px dashed #cbd5e1; padding-top:6px; margin-top:6px; font-size:14px;">
            <span>Tổng thanh toán:</span>
            <strong style="color:var(--admin-primary); font-size:15px;">${formatVND(o.Total)}</strong>
          </div>

          ${!isCOD ? `
            <div style="margin-top:10px; padding-top:10px; border-top:1px solid #e2e8f0;">
              <div style="font-size:11px; font-weight:700; color:#334155; margin-bottom:4px;">QR Thanh toán MB Bank / Đối soát:</div>
              <div style="display:flex; gap:10px; align-items:center;">
                <img src="../image/qr-mb-doquocthinh.png" alt="MB Bank QR" style="width:72px; height:72px; border-radius:6px; border:1px solid #e2e8f0; object-fit:contain;" onerror="this.src='${qrUrl}'">
                <div style="font-size:11px; color:#64748b; line-height:1.4;">
                  <div>Ngân hàng: <strong>MB Bank (Quân Đội)</strong></div>
                  <div>Chủ TK: <strong>DO QUOC THINH</strong></div>
                  <div>STK: <strong style="color:#0284c7;">87654321082007</strong></div>
                  <div>Nội dung: <strong style="color:#dc2626;">MINI GT ${o.OrderCode}</strong></div>
                </div>
              </div>
            </div>
          ` : ''}

          <div class="receipt-preview-box">
            <div style="font-size:11px; font-weight:700; color:#475569; margin-bottom:4px;">
              🧾 Biên lai / Ảnh Bill chuyển khoản:
            </div>
            ${o.ReceiptImage ? `
              <a href="../${o.ReceiptImage}" target="_blank" title="Xem ảnh gốc">
                <img class="receipt-img" src="../${o.ReceiptImage}" alt="Biên lai">
              </a>
              <div style="font-size:11px; color:#059669; margin-top:4px;">✓ Khách hàng đã tải lên biên lai</div>
            ` : `
              <div style="font-size:11px; color:#94a3b8; padding:8px 0;">Chưa có ảnh biên lai đính kèm</div>
            `}
          </div>
        </div>
      </div>

      <!-- Box 3: Quản lý Vận chuyển SPX Express -->
      <div style="background:#fff7ed; border:2px solid #fdba74; border-radius:10px; padding:12px 16px; margin-bottom:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
          <div style="font-size:13.5px; font-weight:800; color:#c2410c; display:flex; align-items:center; gap:6px;">
            <span class="spx-badge">SPX</span> Quản Lý Giao Hàng SPX Express (Shopee Xpress)
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn-admin btn-admin-outline" style="background:#fff; color:#ea580c; border-color:#fdba74; font-size:11px; padding:4px 8px;" onclick="openShipSpxModal('${o.OrderId}')">
              📦 Mở Bảng Vận Đơn
            </button>
            <a href="https://spx.vn/vi" target="_blank" class="btn-admin btn-admin-outline" style="background:#fff; color:#ea580c; border-color:#fdba74; font-size:11px; padding:4px 8px; text-decoration:none;">
              🚀 Mở SPX.VN/VI ↗
            </a>
          </div>
        </div>
        <div style="font-size:12px; color:#475569; margin-bottom:10px; line-height:1.5;">
          Tạo đơn qua app SPX ngoài ➔ Lấy <strong>Mã vận đơn</strong> dán vào đây ➔ Bấm <strong>Lưu mã</strong>. Khách hàng sẽ thấy mã ngay để tra cứu lộ trình.
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <div style="font-weight:700; font-size:12px; color:#9a3412;">Mã vận đơn SPX:</div>
          <input type="text" id="detailSpxTrackingInput" class="form-control" style="max-width:240px; font-weight:700; color:#ea580c; font-family:monospace; text-transform:uppercase;" placeholder="Ví dụ: SPXVN0192837465" value="${escapeHtml(o.TrackingCode || '')}" oninput="this.value = this.value.toUpperCase().trim()">
          <button type="button" class="btn-admin btn-admin-outline" style="background:#fff; border-color:#fdba74; color:#ea580c; padding:6px 10px; font-size:12px; font-weight:700;" onclick="pasteTrackingToInput('detailSpxTrackingInput')">
            📋 Dán từ Clipboard
          </button>
          <button type="button" class="btn-admin btn-admin-primary" style="background:#ea580c; border-color:#ea580c; padding:6px 12px; font-size:12px;" onclick="saveDetailSpxTracking('${o.OrderId}')">
            💾 Lưu Mã SPX
          </button>
          ${o.TrackingCode ? `
            <button type="button" class="btn-admin btn-admin-outline" style="background:#fff; padding:6px 10px; font-size:12px;" onclick="copyTrackingCode('${escapeHtml(o.TrackingCode)}')">
              📋 Sao Chép
            </button>
            <a href="https://spx.vn/vi" target="_blank" class="btn-admin btn-admin-outline" style="background:#fff; color:#ea580c; border-color:#fdba74; padding:6px 10px; font-size:12px; text-decoration:none;">
              🔍 Tra Cứu Trên SPX ↗
            </a>
          ` : ''}
        </div>
      </div>

      <!-- Danh sách mô hình xe diecast trong đơn -->
      <h3 style="font-size:14px; font-weight:700; margin-bottom:8px; color:var(--admin-text-main);">
        Danh Sách Mô Hình Trong Đơn (${(o.items || []).length} sản phẩm)
      </h3>
      <div style="border:1px solid var(--admin-border); border-radius:10px; overflow:hidden; margin-bottom:1rem;">
        <table class="admin-table" style="margin:0;">
          <thead>
            <tr>
              <th>Hình ảnh</th>
              <th>Mã SKU</th>
              <th>Tên mô hình</th>
              <th>Tỉ lệ</th>
              <th>Đơn giá</th>
              <th>Số lượng</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${(o.items || []).map(it => `
              <tr>
                <td>
                  <img class="product-thumb" src="../${it.ImageUrl || 'image/hero-banner.png'}" alt="${escapeHtml(it.ProductName)}" onerror="this.src='../image/hero-banner.png'">
                </td>
                <td><strong>#${it.Sku || 'MGT'}</strong></td>
                <td><strong style="color:var(--admin-text-main);">${escapeHtml(it.ProductName)}</strong></td>
                <td><span style="font-size:11px; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${it.Scale || '1:64'}</span></td>
                <td>${formatVND(it.UnitPrice)}</td>
                <td><strong>x${it.Quantity}</strong></td>
                <td><strong style="color:var(--admin-primary);">${formatVND(it.UnitPrice * it.Quantity)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Actions Bar ở cuối modal -->
      <div class="order-actions-bar">
        <button type="button" class="btn-admin btn-admin-outline" style="color:#2563eb;" onclick="printOrderInvoice(${o.OrderId})">
          🖨️ In Phiếu Gửi Hàng
        </button>
        ${modalActionsHtml}
        <button type="button" class="btn-admin btn-admin-outline" onclick="closeAdminModal('orderDetailModal')">
          Đóng
        </button>
      </div>
    `;

    document.getElementById('orderDetailModal').classList.add('active');
  } catch (err) {
    alert('Lỗi tải chi tiết đơn hàng: ' + err.message);
  }
}

// =====================================================================
// 7. QUẢN LÝ KHÁCH HÀNG & PHÂN QUYỀN
// =====================================================================
async function loadUsers() {
  try {
    const json = await safeFetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!json.success) return;

    const tbody = document.getElementById('usersTbody');
    tbody.innerHTML = (json.data || []).map(u => `
      <tr>
        <td>#${u.UserId}</td>
        <td><strong>${escapeHtml(u.FullName)}</strong></td>
        <td>${escapeHtml(u.Email)}</td>
        <td><span class="status-badge ${u.AuthProvider === 'google' ? 'status-deposit' : 'status-instock'}">${u.AuthProvider.toUpperCase()}</span></td>
        <td>${escapeHtml(u.Phone || '—')}</td>
        <td>
          <select class="form-control" style="font-size:11.5px; padding:3px 6px; width:auto; font-weight:700;" onchange="updateUserRole(${u.UserId}, this.value)">
            <option value="customer" ${u.Role === 'customer' ? 'selected' : ''}>Khách hàng (CUSTOMER)</option>
            <option value="admin" ${u.Role === 'admin' ? 'selected' : ''}>Quản trị (ADMIN)</option>
          </select>
        </td>
        <td>${new Date(u.CreatedAt).toLocaleDateString('vi-VN')}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Lỗi tải khách hàng:', err);
  }
}

async function updateUserRole(userId, newRole) {
  try {
    const json = await safeFetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ role: newRole })
    });
    if (json.success) {
      alert(json.message);
      loadUsers();
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert('Lỗi đổi vai trò: ' + err.message);
  }
}

async function loadSubscribers() {
  try {
    const json = await safeFetch('/api/admin/subscribers', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!json.success) return;

    const tbody = document.getElementById('subscribersTbody');
    tbody.innerHTML = (json.data || []).map(s => `
      <tr>
        <td>#${s.SubscriberId}</td>
        <td><strong>${escapeHtml(s.Email)}</strong></td>
        <td>${new Date(s.CreatedAt).toLocaleString('vi-VN')}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Lỗi tải bản tin:', err);
  }
}

// =====================================================================
// 8. HELPER BADGES & FORMATTERS
// =====================================================================
function formatVND(n) {
  if (n == null) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderOrderStatusBadge(status) {
  const st = (status || 'PENDING').toUpperCase();
  const map = {
    'PENDING': '<span class="badge-status badge-status-pending">⏳ Chờ duyệt</span>',
    'CONFIRMED': '<span class="badge-status badge-status-confirmed">✓ Đã duyệt</span>',
    'SHIPPING': '<span class="badge-status badge-status-shipping">🚚 Đang giao</span>',
    'DELIVERED': '<span class="badge-status badge-status-delivered">📦 Đã giao</span>',
    'CANCELLED': '<span class="badge-status badge-status-cancelled">✕ Đã hủy</span>'
  };
  return map[st] || `<span class="badge-status">${st}</span>`;
}

function renderPaymentStatusBadge(status) {
  const st = (status || 'UNPAID').toUpperCase();
  const map = {
    'UNPAID': '<span class="badge-pay badge-pay-unpaid">Chưa TT</span>',
    'PAID': '<span class="badge-pay badge-pay-paid">✓ Đã thanh toán</span>',
    'REFUNDED': '<span class="badge-pay badge-pay-refunded">↩ Cần hoàn tiền</span>'
  };
  return map[st] || `<span class="badge-pay">${st}</span>`;
}

function renderPaymentMethodBadge(method) {
  const m = (method || 'COD').toUpperCase();
  if (m.includes('COD')) {
    return '<span class="badge-method badge-method-cod">💵 COD</span>';
  }
  return '<span class="badge-method badge-method-bank">🏦 Chuyển khoản</span>';
}

function renderProductStatusBadge(st) {
  if (st === 'pre_order') return '<span class="status-badge status-preorder">Pre-Order</span>';
  if (st === 'sold_out') return '<span class="status-badge status-soldout">Hết hàng</span>';
  return '<span class="status-badge status-instock">Có sẵn</span>';
}

function closeAdminModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// =====================================================================
// 9. KHỞI CHẠY KHI TẢI TRANG
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});
