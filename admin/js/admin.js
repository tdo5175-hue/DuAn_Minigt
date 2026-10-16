/**
 * MINI GT STORE - ADMIN PORTAL APPLICATION SCRIPT
 * Quản lý Dashboard, Sản phẩm, Đơn hàng, Khách hàng, Bản tin và Cài đặt cửa hàng
 * Kiến trúc module sạch sẽ, sử dụng api.js thống nhất, bảo mật tuyệt đối
 */

(function () {
  'use strict';

  // State quản lý ứng dụng Admin
  let currentAdminUser = null;
  let activeTab = 'dashboard';
  let isSidebarOpen = false;

  // Bộ lọc sản phẩm
  const productFilter = {
    search: '',
    category: 'all',
    status: 'all',
    stock: 'all',
    sort: 'newest',
    page: 1,
    limit: 15
  };

  // Bộ lọc đơn hàng
  const orderFilter = {
    status: 'ALL',
    paymentStatus: 'ALL',
    paymentMethod: 'ALL',
    search: '',
    page: 1,
    limit: 20
  };

  let cachedProducts = [];
  let cachedOrders = [];
  let currentActionOrderId = null;
  let currentActionOrderData = null;

  // Debounce helper
  function debounce(fn, delay = 350) {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // =====================================================================
  // 1. TIỆN ÍCH HIỂN THỊ & TOAST
  // =====================================================================
  function formatVND(n) {
    if (n == null || isNaN(n)) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + 'đ';
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

  function adminToast(message, type = 'info') {
    let container = document.getElementById('adminToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'adminToastContainer';
      container.style.cssText = 'position:fixed; top:24px; right:24px; z-index:999999; display:flex; flex-direction:column; gap:8px; pointer-events:none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bg = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#2563eb');
    toast.style.cssText = `background:${bg}; color:#fff; padding:12px 18px; border-radius:8px; box-shadow:0 10px 25px rgba(0,0,0,0.18); font-size:13px; font-weight:700; display:flex; align-items:center; gap:10px; pointer-events:auto; transition:all 0.3s ease; transform:translateY(10px); opacity:0;`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span> <div>${escapeHtml(message)}</div>`;

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function fallbackCopyText(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      adminToast(successMsg, 'success');
    } catch (e) {
      adminToast('Không thể sao chép tự động, vui lòng copy thủ công', 'info');
    }
    document.body.removeChild(ta);
  }

  function copyTextToClipboard(text, successMsg = 'Đã sao chép vào bộ nhớ tạm!') {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        adminToast(successMsg, 'success');
      }).catch(() => {
        fallbackCopyText(text, successMsg);
      });
    } else {
      fallbackCopyText(text, successMsg);
    }
  }

  // =====================================================================
  // 2. AUTHENTICATION & KHỞI CHẠY HỆ THỐNG
  // =====================================================================
  async function checkAdminAuth() {
    const token = api.getToken();
    if (!token) {
      showLoginModal(false);
      return;
    }

    try {
      const res = await api.get('/api/auth/me');
      if (res.success && res.data) {
        if (res.data.role !== 'admin') {
          showLoginModal(true, res.data.email);
          return;
        }

        currentAdminUser = res.data;
        updateAdminProfileUI();
        hideLoginModal();
        initDashboard();
      } else {
        showLoginModal(false);
      }
    } catch (err) {
      console.warn('Phiên đăng nhập không hợp lệ hoặc đã hết hạn:', err.message);
      showLoginModal(false);
    }
  }

  function showLoginModal(isCustomer = false, email = '') {
    const modal = document.getElementById('adminLoginModal');
    if (!modal) return;
    modal.classList.add('active');

    const warning = document.getElementById('authRoleWarning');
    const warningText = document.getElementById('authRoleWarningText');
    if (isCustomer && warning && warningText) {
      warning.style.display = 'block';
      warningText.innerHTML = `Tài khoản <strong>${escapeHtml(email)}</strong> là tài khoản Khách hàng thông thường, không có quyền Quản trị viên!`;
    } else if (warning) {
      warning.style.display = 'none';
    }
  }

  function hideLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) modal.classList.remove('active');
  }

  async function handleAdminLogin(e) {
    if (e && e.preventDefault) e.preventDefault();

    const email = document.getElementById('adminLoginEmail')?.value.trim();
    const password = document.getElementById('adminLoginPassword')?.value;
    const btn = document.getElementById('btnAdminLoginSubmit');

    if (!email || !password) {
      adminToast('Vui lòng nhập đầy đủ Email và Mật khẩu', 'error');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực quyền...';
    }

    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.success && res.data) {
        if (res.data.user.role !== 'admin') {
          adminToast('Tài khoản này không có quyền Quản trị viên!', 'error');
          showLoginModal(true, res.data.user.email);
          return;
        }

        api.setAuthSession(res.data.token, res.data.user);
        currentAdminUser = res.data.user;
        adminToast('Đăng nhập Quản trị viên thành công!', 'success');
        updateAdminProfileUI();
        hideLoginModal();
        initDashboard();
      }
    } catch (err) {
      adminToast(err.message || 'Email hoặc mật khẩu không chính xác', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Đăng Nhập Quản Trị ➔';
      }
    }
  }

  function adminLogout() {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất khỏi Cổng Quản Trị?')) return;
    api.clearAuthSession();
    currentAdminUser = null;
    adminToast('Đã đăng xuất', 'info');
    showLoginModal(false);
  }

  function updateAdminProfileUI() {
    if (!currentAdminUser) return;
    const nameEl = document.getElementById('sidebarAdminName');
    const emailEl = document.getElementById('sidebarAdminEmail');
    const topNameEl = document.getElementById('topbarAdminName');
    const avatarEl = document.getElementById('sidebarAdminAvatar');

    if (nameEl) nameEl.textContent = currentAdminUser.fullName || 'Admin';
    if (emailEl) emailEl.textContent = currentAdminUser.email || '';
    if (topNameEl) topNameEl.textContent = currentAdminUser.fullName || 'Admin';
    if (avatarEl && currentAdminUser.avatarUrl) {
      avatarEl.src = currentAdminUser.avatarUrl.startsWith('http')
        ? currentAdminUser.avatarUrl
        : ('../' + currentAdminUser.avatarUrl.replace(/^\/+/, ''));
    }
  }

  function togglePasswordVisibility(inputId, toggleEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (toggleEl) toggleEl.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Ẩn';
    } else {
      input.type = 'password';
      if (toggleEl) toggleEl.innerHTML = '<i class="fa-solid fa-eye"></i> Hiện';
    }
  }

  // =====================================================================
  // 3. ĐIỀU HƯỚNG TAB
  // =====================================================================
  function switchTab(tabId) {
    activeTab = tabId;

    // Cập nhật nút nav sidebar
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeNavBtn = document.getElementById(`nav-${tabId}`);
    if (activeNavBtn) activeNavBtn.classList.add('active');

    // Cập nhật tab pane
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.style.display = 'none';
      pane.classList.remove('active');
    });
    const activePane = document.getElementById(`pane-${tabId}`);
    if (activePane) {
      activePane.style.display = 'block';
      activePane.classList.add('active');
    }

    // Cập nhật tiêu đề trang
    const titleEl = document.getElementById('pageTitle');
    const titles = {
      dashboard: 'Tổng Quan Quản Trị Store',
      products: 'Quản Lý Danh Mục & Mô Hình Xe',
      orders: 'Quản Lý Đơn Hàng & Vận Đơn SPX',
      users: 'Quản Lý Tài Khoản Khách Hàng',
      subscribers: 'Danh Sách Khách Hàng Nhận Bản Tin',
      settings: 'Cấu Hình Cửa Hàng & Thanh Toán VietQR'
    };
    if (titleEl) titleEl.textContent = titles[tabId] || 'Hệ Thống Quản Trị MINI GT';

    // Đóng sidebar nếu đang xem trên mobile
    if (window.innerWidth <= 992 && isSidebarOpen) {
      toggleSidebar();
    }

    // Tải dữ liệu tương ứng của tab
    if (tabId === 'dashboard') loadDashboard();
    else if (tabId === 'products') loadProducts();
    else if (tabId === 'orders') loadOrders();
    else if (tabId === 'users') loadUsers();
    else if (tabId === 'subscribers') loadSubscribers();
    else if (tabId === 'settings') loadStoreSettings();
  }

  function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    if (!sidebar) return;
    isSidebarOpen = !isSidebarOpen;
    if (isSidebarOpen) sidebar.classList.add('mobile-open');
    else sidebar.classList.remove('mobile-open');
  }

  // =====================================================================
  // 4. TAB 1: DASHBOARD
  // =====================================================================
  async function loadDashboard() {
    try {
      const res = await api.get('/api/admin/dashboard');
      if (!res.success || !res.data) return;

      const { stats, recentOrders, bestSellers } = res.data;

      // 1. Cập nhật 6 thẻ KPI
      const revEl = document.getElementById('statRevenue');
      const depEl = document.getElementById('statDeposits');
      const ordEl = document.getElementById('statOrders');
      const prodEl = document.getElementById('statProducts');
      const custEl = document.getElementById('statCustomers');
      const subEl = document.getElementById('statSubscribers');
      const lowStockNotice = document.getElementById('statLowStockNotice');

      if (revEl) revEl.textContent = formatVND(stats.totalRevenue);
      if (depEl) depEl.textContent = formatVND(stats.totalDeposits);
      if (ordEl) ordEl.textContent = stats.totalOrders;
      if (prodEl) prodEl.textContent = stats.totalProducts;
      if (custEl) custEl.textContent = stats.totalCustomers;
      if (subEl) subEl.textContent = stats.totalSubscribers;

      if (lowStockNotice) {
        lowStockNotice.textContent = `${stats.lowStockProducts} mẫu sắp hết hàng (≤5 chiếc)`;
        lowStockNotice.style.color = stats.lowStockProducts > 0 ? '#dc2626' : '#059669';
      }

      // Cập nhật badge số đơn chờ duyệt trên sidebar
      const sidebarPending = document.getElementById('sidebarPendingCount');
      if (sidebarPending) {
        if (stats.pendingOrders > 0) {
          sidebarPending.textContent = stats.pendingOrders;
          sidebarPending.style.display = 'inline-block';
        } else {
          sidebarPending.style.display = 'none';
        }
      }

      // 2. Dải nút đếm trạng thái đơn hàng
      renderDashboardStatusPills(stats);

      // 3. Đơn hàng gần đây
      renderRecentOrdersTable(recentOrders || []);

      // 4. Bán chạy nhất
      renderBestSellersList(bestSellers || []);
    } catch (err) {
      adminToast('Không thể tải dữ liệu thống kê: ' + err.message, 'error');
    }
  }

  function renderDashboardStatusPills(stats) {
    const container = document.getElementById('dashboardStatusPills');
    if (!container) return;

    const items = [
      { label: 'Chờ duyệt', count: stats.pendingOrders, status: 'PENDING', bg: '#fef3c7', color: '#b45309' },
      { label: 'Đã duyệt', count: stats.confirmedOrders, status: 'CONFIRMED', bg: '#eff6ff', color: '#1d4ed8' },
      { label: 'Đang đóng gói', count: stats.preparingOrders, status: 'PREPARING', bg: '#f3e8ff', color: '#7e22ce' },
      { label: 'Đang giao SPX', count: stats.shippingOrders, status: 'SHIPPING', bg: '#ffedd5', color: '#c2410c' },
      { label: 'Đã giao thành công', count: stats.deliveredOrders, status: 'DELIVERED', bg: '#ecfdf5', color: '#047857' },
      { label: 'Đã hủy', count: stats.cancelledOrders, status: 'CANCELLED', bg: '#fee2e2', color: '#b91c1c' }
    ];

    container.innerHTML = items.map(it => `
      <div style="background:${it.bg}; color:${it.color}; padding:8px 14px; border-radius:8px; display:inline-flex; align-items:center; gap:8px; font-size:12.5px; font-weight:700; cursor:pointer;" onclick="setOrderTab('${it.status}'); switchTab('orders');">
        <span>${it.label}:</span>
        <strong style="font-size:14px; background:#fff; padding:1px 7px; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">${it.count}</strong>
      </div>
    `).join('');
  }

  function renderRecentOrdersTable(orders) {
    const tbody = document.getElementById('recentOrdersTbody');
    if (!tbody) return;

    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:1.5rem; color:#64748b;">Chưa có đơn hàng nào</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><strong style="color:#e10600; font-family:monospace;">#${o.code}</strong></td>
        <td>
          <div style="font-weight:700; color:#0f172a;">${escapeHtml(o.customer.fullName)}</div>
          <div style="font-size:11px; color:#64748b;">${escapeHtml(o.customer.phone)}</div>
        </td>
        <td><strong style="color:#0f172a;">${formatVND(o.total)}</strong></td>
        <td>${renderPaymentBadge(o.paymentStatus, o.paymentMethod)}</td>
        <td>${renderOrderBadge(o.status)}</td>
        <td style="font-size:11.5px; color:#64748b;">${new Date(o.createdAt).toLocaleString('vi-VN')}</td>
        <td>
          <button class="btn-admin btn-admin-outline" style="padding:3px 8px; font-size:11.5px;" onclick="viewOrderDetail(${o.id})">
            Chi tiết ➔
          </button>
        </td>
      </tr>
    `).join('');
  }

  function renderBestSellersList(items) {
    const container = document.getElementById('bestSellersContainer');
    if (!container) return;

    if (!items.length) {
      container.innerHTML = '<div style="text-align:center; padding:1rem; color:#64748b; font-size:12.5px;">Chưa có dữ liệu bán hàng</div>';
      return;
    }

    container.innerHTML = items.map((it, idx) => `
      <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #f1f5f9;">
        <span style="font-weight:800; font-size:14px; width:22px; color:${idx === 0 ? '#e10600' : '#64748b'};">#${idx + 1}</span>
        <img src="../${it.image.replace(/^\/+/, '')}" alt="${escapeHtml(it.name)}" style="width:48px; height:48px; object-fit:contain; border-radius:6px; background:#f8fafc; border:1px solid #e2e8f0;">
        <div style="flex:1; min-width:0;">
          <div style="font-size:12.5px; font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${escapeHtml(it.name)}
          </div>
          <div style="font-size:11px; color:#64748b;">
            SKU: <span style="font-family:monospace; font-weight:600;">${it.sku}</span> | Giá: <strong>${formatVND(it.price)}</strong>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="background:#fef2f2; color:#dc2626; font-size:11px; font-weight:800; padding:2px 8px; border-radius:4px;">
            Đã bán ${it.unitsSold}
          </span>
          <div style="font-size:10.5px; color:#64748b; margin-top:2px;">Kho: ${it.stock}</div>
        </div>
      </div>
    `).join('');
  }

  // =====================================================================
  // 5. TAB 2: QUẢN LÝ SẢN PHẨM (PRODUCTS CRUD)
  // =====================================================================
  async function loadProducts() {
    try {
      const res = await api.get('/api/admin/products', productFilter);
      if (res.success && res.data) {
        cachedProducts = res.data;
        renderProductsTable(cachedProducts);
        renderProductsPagination(res.pagination);
      }
    } catch (err) {
      adminToast('Không thể tải danh sách sản phẩm: ' + err.message, 'error');
    }
  }

  const handleProductSearchDebounced = debounce((val) => {
    productFilter.search = val.trim();
    productFilter.page = 1;
    loadProducts();
  }, 350);

  function handleProductFilterChange() {
    productFilter.category = document.getElementById('prodCategoryFilter')?.value || 'all';
    productFilter.status = document.getElementById('prodStatusFilter')?.value || 'all';
    productFilter.stock = document.getElementById('prodStockFilter')?.value || 'all';
    productFilter.sort = document.getElementById('prodSortFilter')?.value || 'newest';
    productFilter.page = 1;
    loadProducts();
  }

  function renderProductsTable(products) {
    const tbody = document.getElementById('productsTbody');
    if (!tbody) return;

    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:2rem; color:#64748b;">Không tìm thấy mô hình nào phù hợp với bộ lọc</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(p => {
      const imgPath = p.image.startsWith('http') ? p.image : ('../' + p.image.replace(/^\/+/, ''));
      const statusBadge = p.status === 'pre_order'
        ? '<span class="status-badge" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;">Pre-Order</span>'
        : (p.status === 'sold_out'
          ? '<span class="status-badge" style="background:#fee2e2; color:#b91c1c; border:1px solid #fecaca;">Hết hàng</span>'
          : '<span class="status-badge" style="background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;">Có sẵn</span>');

      const stockBadge = p.stock <= 0
        ? '<span style="color:#dc2626; font-weight:800;">0 (Hết)</span>'
        : (p.stock <= 5
          ? `<span style="color:#d97706; font-weight:700;">⚠️ ${p.stock} (Sắp hết)</span>`
          : `<span style="color:#059669; font-weight:600;">${p.stock}</span>`);

      const tags = [];
      if (p.isFeatured) tags.push('<span style="background:#fef3c7; color:#b45309; padding:1px 6px; border-radius:4px; font-size:10px; font-weight:700;">Featured</span>');
      if (p.isNew) tags.push('<span style="background:#dbeafe; color:#1d4ed8; padding:1px 6px; border-radius:4px; font-size:10px; font-weight:700;">New</span>');

      return `
        <tr>
          <td>
            <img src="${imgPath}" alt="${escapeHtml(p.name)}" style="width:50px; height:50px; object-fit:contain; border-radius:6px; background:#fff; border:1px solid #e2e8f0;">
          </td>
          <td><strong style="font-family:monospace; color:#0f172a;">${p.sku}</strong></td>
          <td>
            <div style="font-weight:700; color:#0f172a; max-width:280px; line-height:1.3;">${escapeHtml(p.name)}</div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">
              ${p.editionNote ? escapeHtml(p.editionNote) : 'Bản tiêu chuẩn'}
            </div>
          </td>
          <td>
            <div style="font-weight:600; color:#334155; font-size:12.5px;">${escapeHtml(p.category.name)}</div>
            <div style="font-size:11px; color:#64748b;">${escapeHtml(p.brand)} (${p.scale})</div>
          </td>
          <td>
            <strong style="color:#e10600;">${formatVND(p.price)}</strong>
            ${p.oldPrice ? `<div style="font-size:11px; color:#94a3b8; text-decoration:line-through;">${formatVND(p.oldPrice)}</div>` : ''}
          </td>
          <td>${stockBadge}</td>
          <td>${statusBadge}</td>
          <td>${tags.join(' ') || '<span style="color:#cbd5e1;">-</span>'}</td>
          <td style="text-align:right; white-space:nowrap;">
            <button class="btn-admin btn-admin-outline" style="padding:4px 8px; font-size:11.5px;" onclick="openEditProductModal(${p.id})" title="Chỉnh sửa">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-admin btn-admin-outline" style="padding:4px 8px; font-size:11.5px; color:#2563eb;" onclick="cloneProduct(${p.id})" title="Nhân bản">
              <i class="fa-solid fa-copy"></i>
            </button>
            <button class="btn-admin btn-admin-outline" style="padding:4px 8px; font-size:11.5px; color:#dc2626;" onclick="deleteProduct(${p.id})" title="Xóa hoặc ẩn">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderProductsPagination(pagination) {
    const container = document.getElementById('productsPagination');
    if (!container || !pagination) return;

    const { page, totalPages, total } = pagination;
    if (totalPages <= 1) {
      container.innerHTML = `<span style="font-size:12px; color:#64748b;">Hiển thị tất cả <strong>${total}</strong> mô hình</span>`;
      return;
    }

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; padding-top:12px;">
        <span style="font-size:12.5px; color:#64748b;">Trang <strong>${page}</strong> / <strong>${totalPages}</strong> (Tổng số: <strong>${total}</strong> mô hình)</span>
        <div style="display:flex; gap:6px;">
          <button class="btn-admin btn-admin-outline" style="padding:4px 10px;" ${page <= 1 ? 'disabled' : ''} onclick="goToProductPage(${page - 1})">
            ◀ Trước
          </button>
          <button class="btn-admin btn-admin-outline" style="padding:4px 10px;" ${page >= totalPages ? 'disabled' : ''} onclick="goToProductPage(${page + 1})">
            Sau ▶
          </button>
        </div>
      </div>
    `;
  }

  function goToProductPage(p) {
    productFilter.page = p;
    loadProducts();
  }

  function openAddProductModal() {
    const form = document.getElementById('productForm');
    if (form) form.reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('productModalTitle').textContent = 'Thêm Mô Hình Xe Mới';
    updateProductImagePreview('image/hero-banner.jpg');
    document.getElementById('productModal').classList.add('active');
  }

  async function openEditProductModal(productId) {
    try {
      const res = await api.get(`/api/admin/products/${productId}`);
      if (!res.success || !res.data) return;
      const p = res.data;

      document.getElementById('editProductId').value = p.id;
      document.getElementById('productModalTitle').textContent = `Chỉnh Sửa Mô Hình: #${p.sku}`;

      document.getElementById('prodSku').value = p.sku;
      document.getElementById('prodName').value = p.name;
      document.getElementById('prodCategory').value = p.category.id;
      document.getElementById('prodBrand').value = p.brand;
      document.getElementById('prodScale').value = p.scale;
      document.getElementById('prodPrice').value = p.price;
      document.getElementById('prodOldPrice').value = p.oldPrice || '';
      document.getElementById('prodDeposit').value = p.depositAmount || '';
      document.getElementById('prodQuota').value = p.quotaPercent || 0;
      document.getElementById('prodEdition').value = p.editionNote || '';
      document.getElementById('prodDeadline').value = p.preOrderDeadline || '';
      document.getElementById('prodStatus').value = p.status;
      document.getElementById('prodStock').value = p.stock;
      document.getElementById('prodImage').value = p.image;
      document.getElementById('prodDesc').value = p.description || '';
      document.getElementById('prodIsFeatured').checked = !!p.isFeatured;
      document.getElementById('prodIsNew').checked = !!p.isNew;

      updateProductImagePreview(p.image);
      document.getElementById('productModal').classList.add('active');
    } catch (err) {
      adminToast('Không thể tải chi tiết sản phẩm: ' + err.message, 'error');
    }
  }

  function updateProductImagePreview(url) {
    const img = document.getElementById('prodImagePreview');
    const text = document.getElementById('prodImagePreviewText');
    if (!img) return;
    if (url) {
      const finalUrl = url.startsWith('http') ? url : ('../' + url.replace(/^\/+/, ''));
      img.src = finalUrl;
      img.style.display = 'block';
      if (text) text.textContent = url;
    } else {
      img.style.display = 'none';
      if (text) text.textContent = 'Chưa chọn hình ảnh';
    }
  }

  async function saveProduct(e) {
    if (e && e.preventDefault) e.preventDefault();

    const id = document.getElementById('editProductId').value;
    const payload = {
      sku: document.getElementById('prodSku').value.trim(),
      name: document.getElementById('prodName').value.trim(),
      categoryId: parseInt(document.getElementById('prodCategory').value),
      brand: document.getElementById('prodBrand').value.trim(),
      scale: document.getElementById('prodScale').value.trim(),
      price: parseFloat(document.getElementById('prodPrice').value),
      oldPrice: document.getElementById('prodOldPrice').value ? parseFloat(document.getElementById('prodOldPrice').value) : null,
      depositAmount: document.getElementById('prodDeposit').value ? parseFloat(document.getElementById('prodDeposit').value) : null,
      quotaPercent: parseInt(document.getElementById('prodQuota').value) || 0,
      editionNote: document.getElementById('prodEdition').value.trim(),
      preOrderDeadline: document.getElementById('prodDeadline').value || null,
      status: document.getElementById('prodStatus').value,
      stock: parseInt(document.getElementById('prodStock').value) || 0,
      imageUrl: document.getElementById('prodImage').value.trim(),
      description: document.getElementById('prodDesc').value.trim(),
      isFeatured: document.getElementById('prodIsFeatured').checked,
      isNew: document.getElementById('prodIsNew').checked
    };

    try {
      if (id) {
        await api.put(`/api/admin/products/${id}`, payload);
        adminToast('Cập nhật mô hình xe thành công!', 'success');
      } else {
        await api.post('/api/admin/products', payload);
        adminToast('Thêm mô hình xe mới thành công!', 'success');
      }
      closeAdminModal('productModal');
      loadProducts();
      loadDashboard();
    } catch (err) {
      adminToast('Lỗi lưu sản phẩm: ' + err.message, 'error');
    }
  }

  async function cloneProduct(productId) {
    if (!confirm('Bạn có muốn tạo một bản sao nhân bản cho mô hình này?')) return;
    try {
      const res = await api.post(`/api/admin/products/${productId}/clone`);
      adminToast(res.message || 'Nhân bản sản phẩm thành công!', 'success');
      loadProducts();
    } catch (err) {
      adminToast('Lỗi nhân bản: ' + err.message, 'error');
    }
  }

  async function deleteProduct(productId) {
    if (!confirm('Bạn có chắc chắn muốn xóa/ẩn mô hình này khỏi cửa hàng?')) return;
    try {
      const res = await api.delete(`/api/admin/products/${productId}`);
      adminToast(res.message || 'Đã xử lý xóa sản phẩm', 'info');
      loadProducts();
      loadDashboard();
    } catch (err) {
      adminToast('Lỗi xóa sản phẩm: ' + err.message, 'error');
    }
  }

  // =====================================================================
  // 6. TAB 3: QUẢN LÝ ĐƠN HÀNG (ADMIN ORDERS)
  // =====================================================================
  async function loadOrders() {
    try {
      const res = await api.get('/api/admin/orders', orderFilter);
      if (res.success && res.data) {
        cachedOrders = res.data;
        renderOrdersTable(cachedOrders);
        updateOrderTabBadges(res.counts);
        renderOrdersPagination(res.pagination);
      }
    } catch (err) {
      adminToast('Không thể tải danh sách đơn hàng: ' + err.message, 'error');
    }
  }

  function setOrderTab(status) {
    orderFilter.status = status;
    orderFilter.page = 1;

    document.querySelectorAll('.order-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === status);
    });

    loadOrders();
  }

  const handleOrderSearchDebounced = debounce((val) => {
    orderFilter.search = val.trim();
    orderFilter.page = 1;
    loadOrders();
  }, 350);

  function handleOrderFilterChange() {
    orderFilter.paymentStatus = document.getElementById('orderPayStatusFilter')?.value || 'ALL';
    orderFilter.paymentMethod = document.getElementById('orderPayMethodFilter')?.value || 'ALL';
    orderFilter.page = 1;
    loadOrders();
  }

  function updateOrderTabBadges(counts) {
    if (!counts) return;
    const map = {
      tabCountAll: counts.all,
      tabCountPending: counts.pending,
      tabCountConfirmed: counts.confirmed,
      tabCountPreparing: counts.preparing,
      tabCountShipping: counts.shipping,
      tabCountDelivered: counts.delivered,
      tabCountCancelled: counts.cancelled
    };
    for (const [id, count] of Object.entries(map)) {
      const el = document.getElementById(id);
      if (el) el.textContent = count || 0;
    }
  }

  function renderPaymentBadge(paymentStatus, paymentMethod) {
    const statusMap = {
      UNPAID: { text: 'Chưa thanh toán', bg: '#fee2e2', color: '#b91c1c' },
      PARTIALLY_PAID: { text: 'Đã nhận cọc', bg: '#eff6ff', color: '#1d4ed8' },
      PAID: { text: 'Đã thanh toán đủ', bg: '#ecfdf5', color: '#047857' },
      REFUND_PENDING: { text: 'Chờ hoàn tiền', bg: '#fef3c7', color: '#b45309' },
      REFUNDED: { text: 'Đã hoàn tiền', bg: '#f1f5f9', color: '#475569' }
    };
    const s = statusMap[paymentStatus] || { text: paymentStatus, bg: '#f1f5f9', color: '#334155' };
    return `<span class="status-badge" style="background:${s.bg}; color:${s.color}; border:1px solid rgba(0,0,0,0.06); font-weight:700;">${s.text}</span>`;
  }

  function renderOrderBadge(status) {
    const statusMap = {
      PENDING: { text: 'Chờ duyệt', bg: '#fef3c7', color: '#b45309', icon: 'fa-hourglass-half' },
      CONFIRMED: { text: 'Đã duyệt', bg: '#eff6ff', color: '#1d4ed8', icon: 'fa-check' },
      PREPARING: { text: 'Đang đóng gói', bg: '#f3e8ff', color: '#7e22ce', icon: 'fa-box' },
      SHIPPING: { text: 'Đang giao SPX', bg: '#ffedd5', color: '#c2410c', icon: 'fa-truck-fast' },
      DELIVERED: { text: 'Đã giao thành công', bg: '#ecfdf5', color: '#047857', icon: 'fa-circle-check' },
      CANCELLED: { text: 'Đã hủy', bg: '#fee2e2', color: '#b91c1c', icon: 'fa-ban' }
    };
    const s = statusMap[status] || { text: status, bg: '#f1f5f9', color: '#334155', icon: 'fa-circle' };
    return `<span class="status-badge" style="background:${s.bg}; color:${s.color}; border:1px solid rgba(0,0,0,0.06); font-weight:700;"><i class="fa-solid ${s.icon}"></i> ${s.text}</span>`;
  }

  function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTbody');
    if (!tbody) return;

    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:2rem; color:#64748b;">Không tìm thấy đơn hàng nào</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(o => {
      // Xác định các hành động khả dụng theo State Machine
      const actions = [];

      // 1. Xem chi tiết luôn có
      actions.push(`<button class="btn-admin btn-admin-outline" style="padding:3px 7px; font-size:11.5px;" onclick="viewOrderDetail(${o.id})" title="Xem chi tiết"><i class="fa-solid fa-eye"></i> Chi tiết</button>`);

      // 2. Nút xác nhận thanh toán (nếu đơn chuyển khoản hoặc cọc mà chưa thanh toán)
      if (o.status !== 'CANCELLED' && o.paymentStatus !== 'PAID' && o.paymentMethod !== 'COD') {
        if (o.paymentMethod === 'DEPOSIT' && o.paymentStatus === 'UNPAID') {
          actions.push(`<button class="btn-admin btn-admin-outline" style="padding:3px 7px; font-size:11.5px; color:#2563eb; border-color:#93c5fd;" onclick="confirmPaymentAction(${o.id}, 'deposit')" title="Xác nhận đã nhận cọc"><i class="fa-solid fa-money-bill-transfer"></i> Nhận Cọc</button>`);
        } else if (o.paymentMethod === 'BANK_TRANSFER' && o.paymentStatus === 'UNPAID') {
          actions.push(`<button class="btn-admin btn-admin-outline" style="padding:3px 7px; font-size:11.5px; color:#2563eb; border-color:#93c5fd;" onclick="confirmPaymentAction(${o.id}, 'full')" title="Xác nhận nhận đủ tiền 100%"><i class="fa-solid fa-circle-dollar-to-slot"></i> Nhận Full</button>`);
        }
      }

      // 3. Nút duyệt đơn nhanh (Approve: PENDING -> CONFIRMED)
      if (o.status === 'PENDING') {
        actions.push(`<button class="btn-admin btn-admin-primary" style="padding:3px 8px; font-size:11.5px;" onclick="changeOrderStatus(${o.id}, 'CONFIRMED')" title="Duyệt đơn hàng ngay"><i class="fa-solid fa-check"></i> Duyệt đơn</button>`);
      }

      // 4. Nút chuẩn bị hàng (CONFIRMED -> PREPARING)
      if (o.status === 'CONFIRMED') {
        actions.push(`<button class="btn-admin btn-admin-primary" style="padding:3px 8px; font-size:11.5px; background:#7e22ce; border-color:#7e22ce;" onclick="changeOrderStatus(${o.id}, 'PREPARING')" title="Chuyển sang đóng gói"><i class="fa-solid fa-box"></i> Đóng gói</button>`);
      }

      // 5. Nút dán/lưu mã SPX & giao hàng (Luôn hiển thị cho đơn chưa hủy để Admin dán mã bất cứ lúc nào)
      if (['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING'].includes(o.status)) {
        actions.push(`<button class="btn-admin btn-admin-primary" style="padding:3px 8px; font-size:11.5px; background:#ea580c; border-color:#ea580c;" onclick="openShipSpxModal(${o.id})" title="Dán mã vận đơn SPX Express"><i class="fa-solid fa-truck-fast"></i> ${o.trackingCode ? 'Sửa mã SPX' : 'Dán mã SPX'}</button>`);
      }

      // 6. Nút hoàn tất giao hàng (SHIPPING -> DELIVERED)
      if (o.status === 'SHIPPING') {
        actions.push(`<button class="btn-admin btn-admin-primary" style="padding:3px 8px; font-size:11.5px; background:#059669; border-color:#059669;" onclick="changeOrderStatus(${o.id}, 'DELIVERED')" title="Xác nhận đã giao hàng & thu tiền"><i class="fa-solid fa-circle-check"></i> Đã giao</button>`);
      }

      // 7. Nút hoàn tiền (cho đơn hủy có paymentStatus = REFUND_PENDING)
      if (o.paymentStatus === 'REFUND_PENDING') {
        actions.push(`<button class="btn-admin btn-admin-primary" style="padding:3px 8px; font-size:11.5px; background:#b45309; border-color:#b45309;" onclick="markRefundedAction(${o.id})" title="Xác nhận đã hoàn tiền cho khách"><i class="fa-solid fa-hand-holding-dollar"></i> Đã hoàn tiền</button>`);
      }

      // 8. Nút hủy đơn (Chỉ cho phép khi đơn ở PENDING, CONFIRMED, PREPARING)
      if (['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)) {
        actions.push(`<button class="btn-admin btn-admin-outline" style="padding:3px 7px; font-size:11.5px; color:#dc2626;" onclick="openCancelOrderModal(${o.id})" title="Hủy đơn hàng"><i class="fa-solid fa-ban"></i> Hủy</button>`);
      }

      const custName = (o.customer && o.customer.fullName) || o.fullName || 'Khách hàng';
      const custAddr = (o.customer && o.customer.address) || o.address || '';
      const custPhone = (o.customer && o.customer.phone) || o.phone || '';
      const orderTotal = o.total ?? o.totalAmount ?? 0;

      const trackingBadge = o.trackingCode
        ? `<div style="font-family:monospace; font-weight:800; color:#ea580c; font-size:12px; background:#fff7ed; border:1px solid #fdba74; padding:2px 6px; border-radius:4px; display:inline-block;">${escapeHtml(o.trackingCode)}</div><div><a href="https://spx.vn/vi" target="_blank" style="font-size:10.5px; color:#c2410c; text-decoration:none; font-weight:700;">Tra cứu SPX ↗</a></div>`
        : `<button class="btn-admin btn-admin-outline" style="padding:2px 7px; font-size:11px; color:#ea580c; border-color:#fdba74; background:#fff7ed;" onclick="openShipSpxModal(${o.id})">+ Dán mã SPX</button>`;

      return `
        <tr>
          <td><strong style="color:#e10600; font-family:monospace;">#${o.code}</strong></td>
          <td>
            <div style="font-weight:700; color:#0f172a;">${escapeHtml(custName)}</div>
            <div style="font-size:11px; color:#64748b; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${escapeHtml(custAddr)}
            </div>
          </td>
          <td><span style="font-weight:600;">${escapeHtml(custPhone)}</span></td>
          <td>
            <strong style="color:#0f172a;">${formatVND(orderTotal)}</strong>
            ${o.depositAmount > 0 ? `<div style="font-size:11px; color:#2563eb;">Cọc: ${formatVND(o.depositAmount)}</div>` : ''}
          </td>
          <td style="font-size:12px; font-weight:600; color:#475569;">${o.paymentMethod}</td>
          <td>${renderPaymentBadge(o.paymentStatus, o.paymentMethod)}</td>
          <td>${renderOrderBadge(o.status)}</td>
          <td>${trackingBadge}</td>
          <td style="text-align:right;">
            <div style="display:flex; justify-content:flex-end; gap:5px; flex-wrap:wrap;">
              ${actions.join('')}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderOrdersPagination(pagination) {
    const container = document.getElementById('ordersPagination');
    if (!container || !pagination) return;

    const { page, totalPages, total } = pagination;
    if (totalPages <= 1) {
      container.innerHTML = `<span style="font-size:12px; color:#64748b;">Hiển thị <strong>${total}</strong> đơn hàng</span>`;
      return;
    }

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; padding-top:12px;">
        <span style="font-size:12.5px; color:#64748b;">Trang <strong>${page}</strong> / <strong>${totalPages}</strong> (Tổng cộng: <strong>${total}</strong> đơn)</span>
        <div style="display:flex; gap:6px;">
          <button class="btn-admin btn-admin-outline" style="padding:4px 10px;" ${page <= 1 ? 'disabled' : ''} onclick="goToOrderPage(${page - 1})">◀ Trước</button>
          <button class="btn-admin btn-admin-outline" style="padding:4px 10px;" ${page >= totalPages ? 'disabled' : ''} onclick="goToOrderPage(${page + 1})">Sau ▶</button>
        </div>
      </div>
    `;
  }

  function goToOrderPage(p) {
    orderFilter.page = p;
    loadOrders();
  }

  // Xem chi tiết đơn hàng
  async function viewOrderDetail(orderId) {
    try {
      const res = await api.get(`/api/admin/orders/${orderId}`);
      if (!res.success || !res.data) return;
      const order = res.data;

      const body = document.getElementById('orderDetailBody');
      if (!body) return;

      const itemsHtml = order.items.map(it => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:8px 6px;">
            <div style="font-weight:700; color:#0f172a;">${escapeHtml(it.name)}</div>
            <div style="font-size:11px; color:#64748b;">SKU: <span style="font-family:monospace;">${it.sku || '-'}</span></div>
          </td>
          <td style="text-align:center; padding:8px 6px;">${it.quantity}</td>
          <td style="text-align:right; padding:8px 6px;">${formatVND(it.unitPrice)}</td>
          <td style="text-align:right; padding:8px 6px;"><strong style="color:#0f172a;">${formatVND(it.lineTotal)}</strong></td>
        </tr>
      `).join('');

      const historyHtml = (order.history || []).map(h => `
        <div style="display:flex; gap:10px; margin-bottom:8px; font-size:12px; line-height:1.4;">
          <span style="color:#64748b; font-size:11px; width:130px; flex-shrink:0;">${new Date(h.createdAt).toLocaleString('vi-VN')}</span>
          <div>
            <strong style="color:#0f172a;">${h.to}</strong>
            ${h.note ? `<span style="color:#475569;"> — ${escapeHtml(h.note)}</span>` : ''}
            ${h.by ? `<span style="color:#64748b; font-size:11px;"> (Bởi: ${escapeHtml(h.by)})</span>` : ''}
          </div>
        </div>
      `).join('') || '<div style="font-size:12px; color:#64748b;">Chưa có lịch sử trạng thái</div>';

      body.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:14px;">
          <div>
            <span style="font-size:11px; font-weight:800; background:#fef2f2; color:#dc2626; padding:2px 8px; border-radius:4px;">CHI TIẾT ĐƠN HÀNG</span>
            <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin:4px 0 0 0;">
              Mã đơn: <span style="color:#e10600; font-family:monospace;">#${order.code}</span>
            </h3>
          </div>
          <div>
            ${renderOrderBadge(order.status)}
            ${renderPaymentBadge(order.paymentStatus, order.paymentMethod)}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; background:#f8fafc; padding:12px 14px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:14px; font-size:12.5px;">
          <div>
            <div style="color:#64748b; margin-bottom:2px;">Người nhận hàng:</div>
            <strong style="color:#0f172a; font-size:13.5px;">${escapeHtml(order.customer.fullName)}</strong>
            <div style="margin-top:4px;">Điện thoại: <strong>${escapeHtml(order.customer.phone)}</strong></div>
            ${order.customer.email ? `<div>Email: <span>${escapeHtml(order.customer.email)}</span></div>` : ''}
          </div>
          <div>
            <div style="color:#64748b; margin-bottom:2px;">Địa chỉ giao phát kiện:</div>
            <div style="line-height:1.4;">${escapeHtml(order.customer.address)}</div>
            ${order.note ? `<div style="margin-top:6px; color:#b45309; font-style:italic;">Ghi chú: ${escapeHtml(order.note)}</div>` : ''}
          </div>
        </div>

        <!-- Bảng sản phẩm -->
        <div style="margin-bottom:14px;">
          <h4 style="font-size:13px; font-weight:800; color:#1e293b; margin-bottom:8px;">Danh Sách Mô Hình Trong Đơn:</h4>
          <table style="width:100%; border-collapse:collapse; font-size:12.5px;">
            <thead>
              <tr style="background:#f1f5f9; text-align:left;">
                <th style="padding:8px 6px;">Sản phẩm</th>
                <th style="text-align:center; padding:8px 6px;">SL</th>
                <th style="text-align:right; padding:8px 6px;">Đơn giá</th>
                <th style="text-align:right; padding:8px 6px;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
        </div>

        <!-- Tóm tắt thanh toán & Tiền thu hộ COD -->
        <div style="background:#fff7ed; border:1px solid #fed7aa; padding:12px 16px; border-radius:8px; margin-bottom:14px; font-size:13px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <div>
              <div>Tiền hàng mô hình: <strong>${formatVND(order.subtotal)}</strong></div>
              <div>Phí ship tiêu chuẩn SPX: <strong>${formatVND(order.shippingFee)}</strong></div>
              ${order.depositAmount > 0 ? `<div style="color:#2563eb;">Tiền cọc đã thu trước: <strong>${formatVND(order.depositAmount)}</strong></div>` : ''}
              <div style="font-size:11.5px; color:#64748b; margin-top:2px;">Hình thức: <strong>${order.paymentMethod === 'DEPOSIT' ? 'Đặt cọc giữ xe (100.000đ)' : (order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản full 100%' : 'COD')}</strong></div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:11px; color:#64748b;">TỔNG CỘNG ĐƠN HÀNG</div>
              <div style="font-size:20px; font-weight:800; color:#dc2626;">${formatVND(order.total)}</div>
            </div>
          </div>
          <div style="border-top:1px dashed #fdba74; padding-top:8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="color:#c2410c;">Tiền Shipper SPX thu hộ khi giao (COD):</strong>
            </div>
            <div style="text-align:right;">
              ${(() => {
                const codAmount = order.codAmount !== undefined 
                  ? order.codAmount 
                  : (order.paymentStatus === 'PAID' ? 0 : (order.depositAmount > 0 ? Math.max(0, order.total - order.depositAmount) : order.total));
                if (codAmount === 0) {
                  return '<span style="color:#059669; font-weight:800; font-size:15px;">0đ</span> <span style="font-size:11px; color:#059669;">(Đã thanh toán đủ - Không thu tiền)</span>';
                }
                return `<span style="color:#dc2626; font-weight:800; font-size:17px;">${formatVND(codAmount)}</span> ${order.depositAmount > 0 ? '<span style="font-size:11px; color:#64748b;">(Tiền xe còn lại + ship SPX 11k)</span>' : ''}`;
              })()}
            </div>
          </div>
        </div>

        <!-- Khung đối soát App MB Bank (Nếu đơn chuyển khoản hoặc cọc) -->
        ${(() => {
          const isDeposit = order.paymentMethod === 'DEPOSIT';
          const isTransfer = order.paymentMethod === 'BANK_TRANSFER';
          const memoText = `MINI GT #${order.code}`;
          const codVal = order.codAmount !== undefined 
            ? order.codAmount 
            : (order.paymentStatus === 'PAID' ? 0 : (order.depositAmount > 0 ? Math.max(0, order.total - order.depositAmount) : order.total));

          return `
            <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:12px 14px; margin-bottom:14px; font-size:12.5px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="font-weight:800; color:#0369a1; display:flex; align-items:center; gap:6px;">
                  <i class="fa-solid fa-building-columns"></i> Đối Soát Biến Động Số Dư App MB Bank
                </div>
                <span style="font-size:11px; padding:2px 8px; border-radius:4px; font-weight:700; ${order.paymentStatus === 'PAID' ? 'background:#ecfdf5; color:#047857;' : 'background:#fef3c7; color:#b45309;'}">
                  ${order.paymentStatus === 'PAID' ? '✓ Đã nhận đủ thanh toán' : (order.paymentStatus === 'PARTIALLY_PAID' ? '✓ Đã nhận tiền cọc' : '⏳ Cần check App MB Bank')}
                </span>
              </div>

              <div style="background:#ffffff; border:1px dashed #7dd3fc; border-radius:6px; padding:8px 12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <span style="color:#64748b; font-size:11.5px;">Cú pháp nội dung chuyển khoản trong sao kê:</span>
                  <div style="font-family:monospace; font-size:14px; font-weight:800; color:#0284c7; letter-spacing:0.5px;">
                    ${memoText}
                  </div>
                </div>
                <button type="button" class="btn-admin btn-admin-outline" style="padding:4px 10px; font-size:11px; border-color:#7dd3fc; color:#0284c7;" onclick="copyTextToClipboard('${memoText}', 'Đã sao chép nội dung chuyển khoản!')">
                  <i class="fa-regular fa-copy"></i> Sao chép nội dung
                </button>
              </div>

              <div style="font-size:12px; color:#334155; line-height:1.5;">
                ${isDeposit 
                  ? `• Khách chọn <strong>Đặt cọc giữ xe</strong>: Cần nhận <strong>${formatVND(order.depositAmount || 100000)}</strong> trong App MB Bank. Khi bưu tá SPX giao xe, tiền thu hộ COD còn lại là <strong>${formatVND(codVal)}</strong>.`
                  : (isTransfer 
                    ? `• Khách chọn <strong>Thanh toán Full 100%</strong>: Cần nhận đủ <strong>${formatVND(order.total)}</strong> trong App MB Bank. Khi bưu tá SPX giao xe, tiền thu hộ COD là <strong>0đ</strong>.`
                    : `• Khách chọn <strong>COD</strong>: Thanh toán toàn bộ <strong>${formatVND(order.total)}</strong> trực tiếp cho bưu tá SPX khi nhận kiện.`
                  )
                }
              </div>

              ${order.paymentStatus !== 'PAID' ? `
                <div style="display:flex; gap:8px; margin-top:10px; padding-top:8px; border-top:1px solid #e0f2fe; flex-wrap:wrap; align-items:center;">
                  <span style="font-size:11.5px; color:#64748b;">Sau khi check App thấy số dư:</span>
                  ${isDeposit && order.paymentStatus === 'UNPAID' ? `
                    <button type="button" class="btn-admin btn-admin-primary" style="font-size:11.5px; padding:4px 10px; background:#0284c7; border-color:#0284c7;" onclick="confirmPaymentAction(${order.id}, 'deposit')">
                      <i class="fa-solid fa-check"></i> Đã nhận cọc (${formatVND(order.depositAmount || 100000)})
                    </button>
                  ` : ''}
                  <button type="button" class="btn-admin btn-admin-primary" style="font-size:11.5px; padding:4px 10px; background:#059669; border-color:#059669;" onclick="confirmPaymentAction(${order.id}, 'full')">
                    <i class="fa-solid fa-circle-dollar-to-slot"></i> Đã nhận đủ 100% (${formatVND(order.total)})
                  </button>
                  ${order.status === 'PENDING' ? `
                    <button type="button" class="btn-admin btn-admin-primary" style="font-size:11.5px; padding:4px 10px; background:#1d4ed8; border-color:#1d4ed8;" onclick="changeOrderStatus(${order.id}, 'CONFIRMED')">
                      <i class="fa-solid fa-check-double"></i> Duyệt đơn hàng
                    </button>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          `;
        })()}

        <!-- Quy trình vận đơn SPX Express & Chuyển giao trách nhiệm -->
        <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:8px; padding:12px 14px; margin-bottom:14px; font-size:12.5px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="spx-badge">SPX</span>
              <strong style="color:#c2410c; font-size:13px;">Quy Trình Tạo & Bàn Giao Vận Đơn SPX Express</strong>
            </div>
            <div style="display:flex; gap:6px;">
              <a href="https://spx.vn/vi" target="_blank" class="btn-admin btn-admin-outline" style="background:#fff; color:#ea580c; border-color:#fdba74; font-size:11px; padding:3px 8px; text-decoration:none;">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Mở Web SPX (spx.vn/vi)
              </a>
              <button type="button" class="btn-admin btn-admin-primary" style="background:#ea580c; border-color:#ea580c; font-size:11px; padding:3px 10px;" onclick="openShipSpxModal(${order.id})">
                <i class="fa-solid fa-truck-fast"></i> ${order.trackingCode ? 'Sửa mã SPX' : 'Tạo / Dán mã SPX'}
              </button>
            </div>
          </div>

          <div style="background:#ffffff; border:1px solid #fed7aa; border-radius:6px; padding:8px 12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span style="font-size:11px; color:#64748b;">Mã vận đơn SPX Express:</span>
              <div style="font-family:monospace; font-size:14px; font-weight:800; color:#ea580c;">
                ${order.trackingCode ? order.trackingCode : '<span style="color:#94a3b8; font-weight:normal; font-style:italic;">Chưa gắn mã vận đơn</span>'}
              </div>
            </div>
            ${order.trackingCode ? `
              <div style="display:flex; gap:6px;">
                <button type="button" class="btn-admin btn-admin-outline" style="padding:3px 8px; font-size:11px; border-color:#fdba74; color:#ea580c;" onclick="copyTextToClipboard('${order.trackingCode}', 'Đã sao chép mã vận đơn SPX!')">
                  <i class="fa-regular fa-copy"></i> Sao chép mã
                </button>
                <a href="https://spx.vn/vi" target="_blank" class="btn-admin btn-admin-outline" style="padding:3px 8px; font-size:11px; text-decoration:none; background:#ea580c; color:#fff; border-color:#ea580c;">
                  Lộ trình SPX.vn ↗
                </a>
              </div>
            ` : ''}
          </div>

          <!-- Lưu ý chuyển giao trách nhiệm -->
          <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:8px 10px; font-size:11.5px; color:#92400e; display:flex; gap:8px; align-items:flex-start;">
            <i class="fa-solid fa-shield-halved" style="color:#d97706; margin-top:2px;"></i>
            <div style="line-height:1.45;">
              <strong>Lưu ý chuyển giao trách nhiệm:</strong> Khi bưu tá (shipper) SPX Express tới shop lấy kiện hàng và mã vận đơn đã gửi tới khách, trách nhiệm bảo quản đơn hàng và tiến độ giao phát thuộc về đơn vị SPX Express. Khách hàng và Shop theo dõi trực tiếp qua spx.vn/vi.
            </div>
          </div>
        </div>

        <!-- Lịch sử trạng thái -->
        <div style="border-top:1px solid #e2e8f0; padding-top:12px; margin-top:12px;">
          <h4 style="font-size:13px; font-weight:800; color:#1e293b; margin-bottom:8px;">Nhật Ký Xử Lý Đơn Hàng:</h4>
          <div style="max-height:150px; overflow-y:auto;">${historyHtml}</div>
        </div>
      `;

      document.getElementById('orderDetailModal').classList.add('active');
    } catch (err) {
      adminToast('Không thể tải chi tiết đơn hàng: ' + err.message, 'error');
    }
  }

  // Chuyển trạng thái đơn hàng (1-Click mượt mà, đồng bộ ngay sang khách hàng)
  async function changeOrderStatus(orderId, nextStatus) {
    try {
      const res = await api.put(`/api/admin/orders/${orderId}/status`, { status: nextStatus });
      adminToast(res.message || 'Đã duyệt & cập nhật trạng thái đơn hàng! Khách hàng đã nhận được thông báo.', 'success');
      loadOrders();
      loadDashboard();
      if (document.getElementById('orderDetailModal')?.classList.contains('active')) {
        viewOrderDetail(orderId);
      }
    } catch (err) {
      adminToast('Không thể chuyển trạng thái: ' + err.message, 'error');
    }
  }

  // Xác nhận thanh toán
  async function confirmPaymentAction(orderId, kind) {
    try {
      const res = await api.put(`/api/admin/orders/${orderId}/confirm-payment`, { kind });
      adminToast(res.message || 'Xác nhận thanh toán thành công!', 'success');
      loadOrders();
      loadDashboard();
      if (document.getElementById('orderDetailModal')?.classList.contains('active')) {
        viewOrderDetail(orderId);
      }
    } catch (err) {
      adminToast('Lỗi xác nhận thanh toán: ' + err.message, 'error');
    }
  }

  // Mở modal SPX Express
  async function openShipSpxModal(orderId) {
    currentActionOrderId = orderId;
    try {
      const res = await api.get(`/api/admin/orders/${orderId}`);
      if (!res.success || !res.data) return;
      currentActionOrderData = res.data;

      const codeText = document.getElementById('shipSpxOrderCodeText');
      const dispatchInfo = document.getElementById('shipSpxCustomerDispatchInfo');
      const trackingInput = document.getElementById('shipSpxTrackingCodeInput');

      if (codeText) codeText.textContent = `Đơn hàng #${currentActionOrderData.code} - ${currentActionOrderData.customer.fullName}`;
      if (trackingInput) {
        trackingInput.value = currentActionOrderData.trackingCode || '';
        setTimeout(() => trackingInput.focus(), 100);
      }

      if (dispatchInfo) {
        const codAmount = currentActionOrderData.codAmount !== undefined 
          ? currentActionOrderData.codAmount 
          : (currentActionOrderData.paymentStatus === 'PAID' ? 0 : (currentActionOrderData.depositAmount > 0 ? Math.max(0, currentActionOrderData.total - currentActionOrderData.depositAmount) : currentActionOrderData.total));

        dispatchInfo.innerHTML = `
          <div><strong>Người nhận:</strong> ${escapeHtml(currentActionOrderData.customer.fullName)}</div>
          <div><strong>Số điện thoại:</strong> ${escapeHtml(currentActionOrderData.customer.phone)}</div>
          <div><strong>Địa chỉ:</strong> ${escapeHtml(currentActionOrderData.customer.address)}</div>
          <div><strong>Hình thức:</strong> ${currentActionOrderData.paymentMethod === 'DEPOSIT' ? 'Cọc trước giữ xe' : (currentActionOrderData.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản 100%' : 'COD')}</div>
          <div><strong>Tiền thu hộ Shipper (COD):</strong> <span style="color:#dc2626; font-weight:800; font-size:13.5px;">${formatVND(codAmount)}</span> ${codAmount === 0 ? '<span style="color:#059669; font-size:11px;">(Đã thanh toán đủ - Thu 0đ)</span>' : '<span style="color:#64748b; font-size:11px;">(Tiền xe còn lại + ship SPX)</span>'}</div>
        `;
      }

      document.getElementById('shipSpxModal').classList.add('active');
    } catch (err) {
      adminToast('Lỗi tải thông tin đơn: ' + err.message, 'error');
    }
  }

  function copyShipSpxDispatchInfo() {
    if (!currentActionOrderData) return;
    const codAmount = currentActionOrderData.codAmount !== undefined 
      ? currentActionOrderData.codAmount 
      : (currentActionOrderData.paymentStatus === 'PAID' ? 0 : (currentActionOrderData.depositAmount > 0 ? Math.max(0, currentActionOrderData.total - currentActionOrderData.depositAmount) : currentActionOrderData.total));

    const itemsSummary = (currentActionOrderData.items || []).map(i => `${i.name} (x${i.quantity})`).join(', ');

    const text = `NGƯỜI NHẬN: ${currentActionOrderData.customer.fullName}
SĐT: ${currentActionOrderData.customer.phone}
ĐỊA CHỈ: ${currentActionOrderData.customer.address}
THU HỘ COD: ${formatVND(codAmount)}
HÀNG HÓA: Mô hình 1:64 Mini GT [${itemsSummary || 'Mô hình xe'}]
MÃ ĐƠN SHOP: #${currentActionOrderData.code}`;

    copyTextToClipboard(text, 'Đã sao chép toàn bộ thông tin gửi hàng cho SPX!');
  }

  async function pasteTrackingToInput(inputId) {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const input = document.getElementById(inputId);
        if (input && text) {
          input.value = text.trim().toUpperCase();
          adminToast('Đã dán mã vận đơn!', 'success');
        }
      } else {
        adminToast('Trình duyệt không cho phép đọc clipboard tự động, vui lòng dán bằng Ctrl+V', 'info');
      }
    } catch (e) {
      adminToast('Vui lòng dán bằng Ctrl+V', 'info');
    }
  }

  async function saveSpxTrackingOnly() {
    if (!currentActionOrderId) return;
    const code = document.getElementById('shipSpxTrackingCodeInput')?.value.trim().toUpperCase();
    if (!code) {
      adminToast('Vui lòng nhập hoặc dán mã vận đơn SPX', 'error');
      return;
    }

    try {
      const res = await api.put(`/api/admin/orders/${currentActionOrderId}/tracking`, {
        trackingCode: code,
        carrier: 'SPX Express',
        autoShip: false
      });
      adminToast(`Đã duyệt đơn & lưu mã SPX (${code})! Khách hàng đã nhận được thông báo kèm mã vận đơn.`, 'success');
      closeAdminModal('shipSpxModal');
      loadOrders();
      loadDashboard();
      if (document.getElementById('orderDetailModal')?.classList.contains('active')) {
        viewOrderDetail(currentActionOrderId);
      }
    } catch (err) {
      adminToast('Lỗi lưu mã vận đơn: ' + err.message, 'error');
    }
  }

  async function confirmShipSpxSubmit() {
    if (!currentActionOrderId) return;
    const code = document.getElementById('shipSpxTrackingCodeInput')?.value.trim().toUpperCase();
    if (!code) {
      adminToast('Vui lòng nhập mã vận đơn SPX trước khi chuyển sang Đang giao hàng', 'error');
      return;
    }

    try {
      await api.put(`/api/admin/orders/${currentActionOrderId}/tracking`, {
        trackingCode: code,
        carrier: 'SPX Express',
        autoShip: true
      });
      adminToast(`Đã duyệt & chuyển giao SPX Express (Mã: ${code})! Đã gửi thông báo đến khách hàng.`, 'success');
      closeAdminModal('shipSpxModal');
      loadOrders();
      loadDashboard();
      if (document.getElementById('orderDetailModal')?.classList.contains('active')) {
        viewOrderDetail(currentActionOrderId);
      }
    } catch (err) {
      adminToast('Không thể chuyển trạng thái giao hàng: ' + err.message, 'error');
    }
  }

  // Mở modal hủy đơn
  async function openCancelOrderModal(orderId) {
    currentActionOrderId = orderId;
    try {
      const res = await api.get(`/api/admin/orders/${orderId}`);
      if (!res.success || !res.data) return;
      const order = res.data;

      const codeEl = document.getElementById('cancelOrderCodeText');
      const notice = document.getElementById('cancelOrderNotice');
      const reasonInput = document.getElementById('cancelOrderReasonInput');

      if (codeEl) codeEl.textContent = `Mã đơn: #${order.code} - Khách hàng: ${order.customer.fullName}`;
      if (reasonInput) reasonInput.value = '';

      // Cảnh báo nếu đã thu tiền
      if (notice) {
        notice.style.display = (order.paymentStatus === 'PAID' || order.paymentStatus === 'PARTIALLY_PAID') ? 'block' : 'none';
      }

      document.getElementById('cancelOrderModal').classList.add('active');
    } catch (err) {
      adminToast('Lỗi tải thông tin đơn: ' + err.message, 'error');
    }
  }

  async function confirmCancelOrderSubmit() {
    if (!currentActionOrderId) return;
    const reason = document.getElementById('cancelOrderReasonInput')?.value.trim();
    if (!reason || reason.length < 3) {
      adminToast('Vui lòng nhập lý do hủy đơn (tối thiểu 3 ký tự)', 'error');
      return;
    }

    try {
      const res = await api.put(`/api/admin/orders/${currentActionOrderId}/cancel`, { cancelReason: reason });
      adminToast(res.message || 'Đã hủy đơn hàng thành công!', 'info');
      closeAdminModal('cancelOrderModal');
      loadOrders();
      loadDashboard();
    } catch (err) {
      adminToast('Lỗi hủy đơn: ' + err.message, 'error');
    }
  }

  async function markRefundedAction(orderId) {
    const note = prompt('Ghi chú hoàn tiền (Ví dụ: Đã chuyển khoản lại số tiền cọc qua MB Bank):', 'Đã chuyển khoản hoàn tiền');
    if (note === null) return;
    try {
      const res = await api.put(`/api/admin/orders/${orderId}/mark-refunded`, { note });
      adminToast(res.message || 'Đã xác nhận hoàn tiền thành công', 'success');
      loadOrders();
      loadDashboard();
    } catch (err) {
      adminToast('Lỗi: ' + err.message, 'error');
    }
  }

  function exportOrdersToCSV() {
    if (!cachedOrders.length) {
      adminToast('Không có đơn hàng nào để xuất CSV', 'error');
      return;
    }

    const headers = ['Mã đơn', 'Khách hàng', 'SĐT', 'Địa chỉ', 'Tổng tiền', 'Phương thức', 'Thanh toán', 'Trạng thái', 'Mã vận đơn SPX', 'Ngày đặt'];
    const rows = cachedOrders.map(o => [
      o.code,
      `"${(o.customer.fullName || '').replace(/"/g, '""')}"`,
      `"${o.customer.phone || ''}"`,
      `"${(o.customer.address || '').replace(/"/g, '""')}"`,
      o.total,
      o.paymentMethod,
      o.paymentStatus,
      o.status,
      o.trackingCode || '',
      new Date(o.createdAt).toLocaleString('vi-VN')
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `MINIGT_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    adminToast('Đã xuất file CSV thành công!', 'success');
  }

  // =====================================================================
  // 7. TAB 4: QUẢN LÝ KHÁCH HÀNG (CUSTOMERS)
  // =====================================================================
  let cachedUsers = [];

  async function loadUsers() {
    const search = document.getElementById('userSearchInput')?.value.trim();
    try {
      const res = await api.get('/api/admin/users', { search });
      if (res.success && res.data) {
        cachedUsers = res.data;
        renderUsersTable(cachedUsers);
      }
    } catch (err) {
      adminToast('Không thể tải danh sách khách hàng: ' + err.message, 'error');
    }
  }

  const handleUserSearchDebounced = debounce(() => {
    loadUsers();
  }, 350);

  function renderUsersTable(users) {
    const tbody = document.getElementById('usersTbody');
    if (!tbody) return;

    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:2rem; color:#64748b;">Không tìm thấy khách hàng nào</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>#${u.userId}</td>
        <td>
          <div style="font-weight:700; color:#0f172a;">${escapeHtml(u.fullName)}</div>
          <div style="font-size:11px; color:#64748b;">Tham gia: ${new Date(u.createdAt).toLocaleDateString('vi-VN')}</div>
        </td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.phone || '-')}</td>
        <td style="max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(u.address || '-')}</td>
        <td><strong style="color:#0f172a;">${u.totalOrders}</strong> đơn</td>
        <td><strong style="color:#e10600;">${formatVND(u.totalSpent)}</strong></td>
        <td>
          <span class="status-badge" style="background:${u.role === 'admin' ? '#fef2f2' : '#f1f5f9'}; color:${u.role === 'admin' ? '#dc2626' : '#475569'}; font-weight:700;">
            ${u.role.toUpperCase()}
          </span>
        </td>
        <td>
          <span style="font-size:12px; font-weight:700; color:${u.isActive ? '#059669' : '#dc2626'};">
            ${u.isActive ? '● Hoạt động' : '● Bị khóa'}
          </span>
        </td>
        <td style="text-align:right; white-space:nowrap;">
          <button class="btn-admin btn-admin-outline" style="padding:3px 7px; font-size:11.5px;" onclick="toggleUserStatus(${u.userId}, ${!u.isActive})" title="${u.isActive ? 'Khóa tài khoản' : 'Mở khóa'}">
            ${u.isActive ? '<i class="fa-solid fa-lock" style="color:#dc2626;"></i> Khóa' : '<i class="fa-solid fa-lock-open" style="color:#059669;"></i> Mở'}
          </button>
          <button class="btn-admin btn-admin-outline" style="padding:3px 7px; font-size:11.5px;" onclick="changeUserRole(${u.userId}, '${u.role === 'admin' ? 'customer' : 'admin'}')" title="Đổi quyền">
            ${u.role === 'admin' ? 'Hạ Customer' : 'Lên Admin'}
          </button>
        </td>
      </tr>
    `).join('');
  }

  async function toggleUserStatus(userId, willBeActive) {
    const action = willBeActive ? 'mở khóa' : 'khóa';
    if (!confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;
    try {
      const res = await api.put(`/api/admin/users/${userId}/status`, { isActive: willBeActive });
      adminToast(res.message || 'Cập nhật thành công', 'success');
      loadUsers();
    } catch (err) {
      adminToast('Lỗi: ' + err.message, 'error');
    }
  }

  async function changeUserRole(userId, newRole) {
    if (!confirm(`Bạn có chắc muốn đổi quyền của người dùng này sang "${newRole.toUpperCase()}"?`)) return;
    try {
      const res = await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      adminToast(res.message || 'Cập nhật vai trò thành công', 'success');
      loadUsers();
    } catch (err) {
      adminToast('Lỗi: ' + err.message, 'error');
    }
  }

  // =====================================================================
  // 8. TAB 5: BẢN TIN (NEWSLETTER)
  // =====================================================================
  async function loadSubscribers() {
    const search = document.getElementById('subscriberSearchInput')?.value.trim();
    try {
      const res = await api.get('/api/admin/subscribers', { search });
      if (res.success && res.data) {
        renderSubscribersTable(res.data);
      }
    } catch (err) {
      adminToast('Không thể tải danh sách bản tin: ' + err.message, 'error');
    }
  }

  const handleSubscriberSearchDebounced = debounce(() => {
    loadSubscribers();
  }, 350);

  function renderSubscribersTable(subscribers) {
    const tbody = document.getElementById('subscribersTbody');
    if (!tbody) return;

    if (!subscribers.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:#64748b;">Không có người đăng ký nào</td></tr>';
      return;
    }

    tbody.innerHTML = subscribers.map(s => `
      <tr>
        <td>#${s.SubscriberId}</td>
        <td><strong style="color:#0f172a;">${escapeHtml(s.Email)}</strong></td>
        <td style="color:#64748b;">${new Date(s.CreatedAt).toLocaleString('vi-VN')}</td>
        <td style="text-align:right;">
          <button class="btn-admin btn-admin-outline" style="padding:3px 8px; font-size:11.5px; color:#dc2626;" onclick="deleteSubscriber(${s.SubscriberId})" title="Xóa">
            <i class="fa-solid fa-trash-can"></i> Xóa
          </button>
        </td>
      </tr>
    `).join('');
  }

  async function deleteSubscriber(id) {
    if (!confirm('Xóa email này khỏi danh sách nhận bản tin?')) return;
    try {
      await api.delete(`/api/admin/subscribers/${id}`);
      adminToast('Đã xóa người đăng ký', 'info');
      loadSubscribers();
      loadDashboard();
    } catch (err) {
      adminToast('Lỗi: ' + err.message, 'error');
    }
  }

  // =====================================================================
  // 9. TAB 6: CẤU HÌNH CỬA HÀNG (STORE SETTINGS)
  // =====================================================================
  async function loadStoreSettings() {
    try {
      const res = await api.get('/api/admin/settings');
      if (!res.success || !res.data) return;
      const s = res.data;

      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val != null ? val : '';
      };

      setVal('set_store_name', s.store_name);
      setVal('set_store_hotline', s.store_hotline);
      setVal('set_store_email', s.store_email);
      setVal('set_store_address', s.store_address);
      setVal('set_shipping_fee', s.shipping_fee);
      setVal('set_low_stock_threshold', s.low_stock_threshold);
      setVal('set_bank_id', s.bank_id);
      setVal('set_bank_name', s.bank_name);
      setVal('set_bank_account_no', s.bank_account_no);
      setVal('set_bank_account_name', s.bank_account_name);
      setVal('set_preorder_deadline', s.preorder_deadline);
      setVal('set_announcement', s.announcement);
    } catch (err) {
      adminToast('Không thể tải cấu hình cửa hàng: ' + err.message, 'error');
    }
  }

  async function saveStoreSettings(e) {
    if (e && e.preventDefault) e.preventDefault();

    const getVal = (id) => document.getElementById(id)?.value.trim() || '';

    const payload = {
      store_name: getVal('set_store_name'),
      store_hotline: getVal('set_store_hotline'),
      store_email: getVal('set_store_email'),
      store_address: getVal('set_store_address'),
      shipping_fee: Number(getVal('set_shipping_fee')) || 11000,
      low_stock_threshold: Number(getVal('set_low_stock_threshold')) || 5,
      bank_id: getVal('set_bank_id') || 'MB',
      bank_name: getVal('set_bank_name'),
      bank_account_no: getVal('set_bank_account_no'),
      bank_account_name: getVal('set_bank_account_name'),
      preorder_deadline: getVal('set_preorder_deadline'),
      announcement: getVal('set_announcement')
    };

    try {
      await api.put('/api/admin/settings', payload);
      adminToast('Đã lưu tất cả thiết lập vào CSDL SQL Server thành công!', 'success');
      loadStoreSettings();
    } catch (err) {
      adminToast('Lỗi lưu cấu hình: ' + err.message, 'error');
    }
  }

  function closeAdminModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  let adminSyncInterval = null;
  let lastKnownOrderCode = null;

  // Khởi tạo ứng dụng khi load xong DOM
  function initDashboard() {
    loadDashboard();
    loadOrders();

    // Kiểm tra health check backend
    api.get('/api/health').then(res => {
      const text = document.getElementById('serverStatusText');
      if (text && res.success) {
        text.textContent = 'QUOCTHINH\\DOQUOCTHINH (Connected)';
      }
    }).catch(() => {});

    // Lắng nghe tín hiệu Real-time ngay lập tức khi Khách hàng vừa đặt đơn hoặc cập nhật đơn
    window.addEventListener('minigt:realtime', (ev) => {
      const detail = ev && ev.detail;
      if (!detail) return;
      if (detail.type === 'ORDER_CREATED' && detail.payload) {
        const ord = detail.payload;
        lastKnownOrderCode = ord.code;
        adminToast(`🔔 ĐƠN HÀNG MỚI #${ord.code} từ ${ord.fullName || 'Khách hàng'} (${formatVND(ord.totalAmount || ord.total || 0)})!`, 'success');
        loadDashboard();
        loadOrders();
      } else if (detail.type === 'ORDER_UPDATED') {
        loadDashboard();
        if (activeTab === 'orders') loadOrders();
      }
    });

    // Tự động đồng bộ ngầm mỗi 5 giây để không bỏ sót bất kỳ đơn hàng nào
    if (adminSyncInterval) clearInterval(adminSyncInterval);
    adminSyncInterval = setInterval(async () => {
      if (!currentAdminUser) return;
      try {
        const res = await api.get('/api/admin/orders', orderFilter);
        if (res.success && Array.isArray(res.data)) {
          const newest = res.data[0];
          if (newest && lastKnownOrderCode && newest.code !== lastKnownOrderCode && !cachedOrders.some(o => o.code === newest.code)) {
            adminToast(`🔔 Nhận đơn hàng mới #${newest.code} - ${newest.fullName || (newest.customer && newest.customer.fullName) || 'Khách hàng'}!`, 'success');
            loadDashboard();
          }
          if (newest) lastKnownOrderCode = newest.code;
          cachedOrders = res.data;
          if (activeTab === 'orders') {
            renderOrdersTable(cachedOrders);
            updateOrderTabBadges(res.counts);
            renderOrdersPagination(res.pagination);
          }
          const sidebarPending = document.getElementById('sidebarPendingCount');
          if (sidebarPending && res.counts) {
            if (res.counts.pending > 0) {
              sidebarPending.textContent = res.counts.pending;
              sidebarPending.style.display = 'inline-block';
            } else {
              sidebarPending.style.display = 'none';
            }
          }
        }
      } catch (e) {}
    }, 5000);
  }

  window.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
  });

  // Export các hàm ra window để inline HTML event listeners gọi được
  window.switchTab = switchTab;
  window.toggleSidebar = toggleSidebar;
  window.handleAdminLogin = handleAdminLogin;
  window.adminLogout = adminLogout;
  window.togglePasswordVisibility = togglePasswordVisibility;
  window.closeAdminModal = closeAdminModal;
  window.copyTextToClipboard = copyTextToClipboard;

  // Products
  window.loadProducts = loadProducts;
  window.handleProductSearchDebounced = handleProductSearchDebounced;
  window.handleProductFilterChange = handleProductFilterChange;
  window.goToProductPage = goToProductPage;
  window.openAddProductModal = openAddProductModal;
  window.openEditProductModal = openEditProductModal;
  window.updateProductImagePreview = updateProductImagePreview;
  window.saveProduct = saveProduct;
  window.cloneProduct = cloneProduct;
  window.deleteProduct = deleteProduct;

  // Orders
  window.loadOrders = loadOrders;
  window.setOrderTab = setOrderTab;
  window.handleOrderSearchDebounced = handleOrderSearchDebounced;
  window.handleOrderFilterChange = handleOrderFilterChange;
  window.goToOrderPage = goToOrderPage;
  window.viewOrderDetail = viewOrderDetail;
  window.changeOrderStatus = changeOrderStatus;
  window.confirmPaymentAction = confirmPaymentAction;
  window.openShipSpxModal = openShipSpxModal;
  window.copyShipSpxDispatchInfo = copyShipSpxDispatchInfo;
  window.pasteTrackingToInput = pasteTrackingToInput;
  window.saveSpxTrackingOnly = saveSpxTrackingOnly;
  window.confirmShipSpxSubmit = confirmShipSpxSubmit;
  window.openCancelOrderModal = openCancelOrderModal;
  window.confirmCancelOrderSubmit = confirmCancelOrderSubmit;
  window.markRefundedAction = markRefundedAction;
  window.exportOrdersToCSV = exportOrdersToCSV;

  // Customers & Newsletter & Settings
  window.loadUsers = loadUsers;
  window.handleUserSearchDebounced = handleUserSearchDebounced;
  window.toggleUserStatus = toggleUserStatus;
  window.changeUserRole = changeUserRole;
  window.loadSubscribers = loadSubscribers;
  window.handleSubscriberSearchDebounced = handleSubscriberSearchDebounced;
  window.deleteSubscriber = deleteSubscriber;
  window.loadStoreSettings = loadStoreSettings;
  window.saveStoreSettings = saveStoreSettings;

})();
