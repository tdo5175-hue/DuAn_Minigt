/**
 * MINI GT STORE - UNIFIED API CLIENT & REAL-TIME SYNC ENGINE
 * Thư viện gọi API dùng chung cho cả Khách hàng (index.html) và Admin Panel (admin/index.html)
 * - Tách biệt Session Admin và Khách hàng để mở song song 2 tab không bao giờ ghi đè Token nhau
 * - Đồng bộ Thời gian thực (Real-time BroadcastChannel + Storage Event) giữa Khách hàng <-> Admin
 * - Tự động lưu bộ nhớ đệm & Fallback thông minh khi mất kết nối máy chủ
 */
(function (global) {
  'use strict';

  const getApiBase = () => {
    if (global.MINIGT_API_BASE) return global.MINIGT_API_BASE.replace(/\/+$/, '');
    if (global.location) {
      if (global.location.protocol === 'file:' || (global.location.port && global.location.port !== '5000')) {
        return 'http://localhost:5000';
      }
    }
    return '';
  };

  const API_BASE = getApiBase();
  const SHARED_ORDERS_KEY = 'minigt_shared_orders_v2';
  const MY_ORDER_CODES_KEY = 'minigt_my_order_codes';
  const REALTIME_EVENT_KEY = 'minigt_realtime_event';

  // Kênh đồng bộ thời gian thực giữa các Tab (Khách hàng <-> Admin)
  let syncChannel = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      syncChannel = new BroadcastChannel('minigt_realtime_sync');
    }
  } catch (e) {
    syncChannel = null;
  }

  const isAdminContext = (endpoint = '') => {
    const path = (global.location && global.location.pathname) ? global.location.pathname.toLowerCase() : '';
    if (endpoint && endpoint.startsWith('/api/admin')) return true;
    return path.includes('/admin');
  };

  class ApiError extends Error {
    constructor(message, status = 0, code = 'NETWORK_ERROR', details = null) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
      this.details = details;
    }
  }

  // Quản lý Token độc lập cho Admin và Khách hàng
  const getToken = (endpoint = '') => {
    try {
      if (isAdminContext(endpoint)) {
        const adminTok = localStorage.getItem('minigt_admin_token');
        if (adminTok) return adminTok;
      }
      return localStorage.getItem('minigt_token') || null;
    } catch (e) {
      return null;
    }
  };

  const getCurrentUser = (endpoint = '') => {
    try {
      if (isAdminContext(endpoint)) {
        const rawAdmin = localStorage.getItem('minigt_admin_user');
        if (rawAdmin) return JSON.parse(rawAdmin);
      }
      const raw = localStorage.getItem('minigt_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const setAuthSession = (token, user) => {
    try {
      const isAdminRole = user && String(user.role || user.Role || '').toLowerCase() === 'admin';
      if (isAdminContext() || isAdminRole) {
        if (token) localStorage.setItem('minigt_admin_token', token);
        else localStorage.removeItem('minigt_admin_token');

        if (user) localStorage.setItem('minigt_admin_user', JSON.stringify(user));
        else localStorage.removeItem('minigt_admin_user');
      }

      if (!isAdminContext()) {
        if (token) localStorage.setItem('minigt_token', token);
        else localStorage.removeItem('minigt_token');

        if (user) localStorage.setItem('minigt_user', JSON.stringify(user));
        else localStorage.removeItem('minigt_user');
      }
    } catch (e) {
      console.warn('Không thể ghi localStorage:', e);
    }
  };

  const clearAuthSession = () => {
    try {
      if (isAdminContext()) {
        localStorage.removeItem('minigt_admin_token');
        localStorage.removeItem('minigt_admin_user');
      } else {
        localStorage.removeItem('minigt_token');
        localStorage.removeItem('minigt_user');
      }
    } catch (e) {
      console.warn('Lỗi khi xóa session:', e);
    }
  };

  // =====================================================================
  // BỘ ĐỒNG BỘ ĐƠN HÀNG SHARED LOCALSTORAGE & REALTIME EVENT
  // =====================================================================
  const getSharedOrders = () => {
    try {
      const raw = localStorage.getItem(SHARED_ORDERS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  };

  const saveSharedOrders = (orders) => {
    try {
      localStorage.setItem(SHARED_ORDERS_KEY, JSON.stringify(orders.slice(0, 200)));
    } catch (e) {
      console.warn('Không thể lưu bộ đệm đơn hàng:', e);
    }
  };

  const getMyOrderCodes = () => {
    try {
      const raw = localStorage.getItem(MY_ORDER_CODES_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  };

  const addMyOrderCode = (code) => {
    if (!code) return;
    try {
      const clean = String(code).trim().toUpperCase();
      const codes = getMyOrderCodes();
      if (!codes.includes(clean)) {
        codes.unshift(clean);
        localStorage.setItem(MY_ORDER_CODES_KEY, JSON.stringify(codes.slice(0, 50)));
      }
    } catch (e) {}
  };

  const STATUS_LABELS = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Admin đã duyệt đơn',
    PREPARING: 'Đang đóng gói bảo vệ Blister',
    SHIPPING: 'Đang giao hàng (SPX Express)',
    DELIVERED: 'Giao hàng thành công',
    CANCELLED: 'Đã hủy'
  };

  const PAYMENT_STATUS_LABELS = {
    UNPAID: 'Chưa thanh toán',
    PARTIALLY_PAID: 'Đã thu cọc',
    PAID: 'Đã thanh toán đủ',
    REFUND_PENDING: 'Chờ hoàn tiền',
    REFUNDED: 'Đã hoàn tiền'
  };

  const normalizeOrderObject = (ord) => {
    if (!ord || typeof ord !== 'object') return ord;
    const code = ord.code || ord.orderCode || ord.OrderCode || '';
    const status = String(ord.status || ord.Status || 'PENDING').toUpperCase();
    const paymentMethod = String(ord.paymentMethod || ord.PaymentMethod || 'COD').toUpperCase();
    const paymentStatus = String(ord.paymentStatus || ord.PaymentStatus || 'UNPAID').toUpperCase();
    const trackingCode = ord.trackingCode || ord.TrackingCode || null;
    const trackingCarrier = ord.trackingCarrier || ord.TrackingCarrier || 'SPX Express';
    const isApproved = ['CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED'].includes(status) || Boolean(trackingCode);
    const totalAmount = Number(ord.totalAmount ?? ord.TotalAmount ?? 0);
    const depositAmount = Number(ord.depositAmount ?? ord.totalDeposit ?? ord.DepositAmount ?? 0);
    const remainingAmount = Math.max(0, totalAmount - depositAmount);

    let approvalNotice = null;
    if (trackingCode) {
      approvalNotice = `Admin đã duyệt đơn & bàn giao cho ${trackingCarrier} — Mã vận đơn: ${trackingCode}`;
    } else if (isApproved) {
      approvalNotice = `Admin đã duyệt đơn hàng #${code}. Kiện hàng đang được đóng gói chống sốc chuẩn Collector!`;
    }

    const fullName = ord.fullName || ord.FullName || (ord.customer && ord.customer.fullName) || 'Khách hàng';
    const phone = ord.phone || ord.Phone || (ord.customer && ord.customer.phone) || '';
    const email = ord.email || ord.Email || (ord.customer && ord.customer.email) || '';
    const address = ord.address || ord.Address || (ord.shipping && ord.shipping.address) || (ord.customer && ord.customer.address) || '';
    const city = ord.city || ord.City || (ord.shipping && ord.shipping.city) || (ord.customer && ord.customer.city) || '';
    const district = ord.district || ord.District || (ord.shipping && ord.shipping.district) || (ord.customer && ord.customer.district) || '';
    const codAmount = paymentStatus === 'PAID' ? 0 : (depositAmount > 0 ? Math.max(0, totalAmount - depositAmount) : totalAmount);

    return Object.assign({}, ord, {
      id: Number(ord.id || ord.orderId || ord.OrderId || Date.now()),
      orderId: Number(ord.orderId || ord.id || ord.OrderId || Date.now()),
      OrderId: Number(ord.OrderId || ord.id || ord.orderId || Date.now()),
      code,
      orderCode: code,
      OrderCode: code,
      fullName,
      FullName: fullName,
      phone,
      Phone: phone,
      email,
      Email: email,
      address,
      Address: address,
      city,
      City: city,
      district,
      District: district,
      customer: {
        id: ord.userId || ord.UserId || null,
        fullName,
        phone,
        email,
        address,
        city,
        district
      },
      status,
      Status: status,
      statusLabel: STATUS_LABELS[status] || status,
      paymentMethod,
      PaymentMethod: paymentMethod,
      paymentStatus,
      PaymentStatus: paymentStatus,
      paymentStatusLabel: PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus,
      subtotal: Number(ord.subtotal ?? ord.Subtotal ?? totalAmount),
      shippingFee: Number(ord.shippingFee ?? ord.ShippingFee ?? 0),
      total: totalAmount,
      totalAmount,
      TotalAmount: totalAmount,
      depositAmount,
      totalDeposit: depositAmount,
      DepositAmount: depositAmount,
      remainingAmount,
      RemainingAmount: remainingAmount,
      codAmount,
      trackingCode,
      TrackingCode: trackingCode,
      trackingCarrier,
      TrackingCarrier: trackingCarrier,
      trackingUrl: trackingCode ? 'https://spx.vn/vi' : null,
      isApproved,
      hasTracking: Boolean(trackingCode),
      approvalNotice,
      createdAt: ord.createdAt || ord.CreatedAt || new Date().toISOString(),
      CreatedAt: ord.CreatedAt || ord.createdAt || new Date().toISOString(),
      updatedAt: ord.updatedAt || ord.UpdatedAt || new Date().toISOString(),
      UpdatedAt: ord.UpdatedAt || ord.updatedAt || new Date().toISOString(),
      items: Array.isArray(ord.items) ? ord.items : [],
      history: Array.isArray(ord.history) ? ord.history : (Array.isArray(ord.timeline) ? ord.timeline.map(t => ({
        to: t.statusLabel || t.newStatus,
        note: t.note || '',
        createdAt: t.createdAt || new Date().toISOString()
      })) : [])
    });
  };

  const upsertSharedOrder = (ord) => {
    if (!ord) return null;
    const normalized = normalizeOrderObject(ord);
    if (!normalized.code) return normalized;
    const list = getSharedOrders();
    const idx = list.findIndex(o =>
      (o.code && o.code === normalized.code) ||
      (o.id && normalized.id && Number(o.id) === Number(normalized.id))
    );
    if (idx >= 0) {
      const mergedItems = (normalized.items && normalized.items.length > 0)
        ? normalized.items
        : (list[idx].items || []);
      list[idx] = Object.assign({}, list[idx], normalized, { items: mergedItems });
    } else {
      list.unshift(normalized);
    }
    saveSharedOrders(list);
    return idx >= 0 ? list[idx] : normalized;
  };

  const emitRealtimeSync = (type, payload) => {
    const eventData = {
      type,
      payload,
      timestamp: Date.now()
    };
    try {
      if (syncChannel) {
        syncChannel.postMessage(eventData);
      }
    } catch (e) {}
    try {
      localStorage.setItem(REALTIME_EVENT_KEY, JSON.stringify(eventData));
    } catch (e) {}
    if (global.dispatchEvent) {
      global.dispatchEvent(new CustomEvent('minigt:realtime', { detail: eventData }));
    }
  };

  // Lắng nghe sự kiện từ Tab bên kia (Admin <-> Khách hàng)
  if (syncChannel) {
    syncChannel.onmessage = (ev) => {
      if (ev && ev.data && global.dispatchEvent) {
        global.dispatchEvent(new CustomEvent('minigt:realtime', { detail: ev.data }));
      }
    };
  }
  if (global.addEventListener) {
    global.addEventListener('storage', (ev) => {
      if (ev.key === REALTIME_EVENT_KEY && ev.newValue) {
        try {
          const data = JSON.parse(ev.newValue);
          global.dispatchEvent(new CustomEvent('minigt:realtime', { detail: data }));
        } catch (e) {}
      }
    });
  }

  // Tự động đồng bộ dữ liệu đơn hàng khi API trả về thành công
  const syncOrderSideEffects = (endpoint, method, responseData) => {
    if (!responseData || !responseData.success) return;
    const d = responseData.data;

    // 1. Khách hàng vừa đặt đơn hàng mới
    if (method === 'POST' && endpoint === '/api/orders' && d) {
      const saved = upsertSharedOrder(d);
      addMyOrderCode(saved.code);
      emitRealtimeSync('ORDER_CREATED', saved);
      return;
    }

    // 2. Admin cập nhật trạng thái, duyệt đơn, lưu mã SPX, xác nhận thanh toán
    if ((method === 'PUT' || method === 'PATCH') && endpoint.includes('/orders/') && d) {
      const saved = upsertSharedOrder(d);
      emitRealtimeSync('ORDER_UPDATED', saved);
      return;
    }

    // 3. Khi lấy danh sách đơn hàng từ Server, đồng bộ vào bộ nhớ chung
    if (method === 'GET' && Array.isArray(d) && endpoint.includes('/orders')) {
      d.forEach(item => upsertSharedOrder(item));
    } else if (method === 'GET' && d && (d.code || d.OrderCode) && endpoint.includes('/orders')) {
      upsertSharedOrder(d);
    }
  };

  // =====================================================================
  // FALLBACK OFFLINE ENGINE (Khi người dùng chưa bật node server/server.js)
  // =====================================================================
  const handleOfflineFallback = (endpoint, options) => {
    const method = (options.method || 'GET').toUpperCase();
    let body = {};
    if (options.body) {
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch (e) {}
    }

    // 1. Tạo đơn hàng mới (POST /api/orders)
    if (method === 'POST' && endpoint === '/api/orders') {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(1000 + Math.random() * 9000);
      const code = `MGT-${dateStr}-${rand}`;
      const items = (body.items || []).map((it, idx) => ({
        id: idx + 1,
        productId: it.productId || idx + 1,
        productSku: it.sku || `MGT-${it.productId || idx + 1}`,
        productName: it.name || `Mô hình Mini GT #${it.productId || idx + 1}`,
        productImage: it.image || 'images/10001.png',
        orderType: it.orderType || 'IN_STOCK',
        unitPrice: Number(it.price || 320000),
        depositPrice: Number(it.deposit || 0),
        quantity: Number(it.quantity || 1),
        lineTotal: Number(it.price || 320000) * Number(it.quantity || 1)
      }));
      const subtotal = items.reduce((s, i) => s + i.lineTotal, 0) || Number(body.totalAmount || 350000);
      const shippingFee = subtotal >= 1000000 ? 0 : 30000;
      const totalAmount = subtotal + shippingFee;
      const payMethod = body.paymentMethod === 'FULL_TRANSFER' ? 'BANK_TRANSFER' : (body.paymentMethod || 'COD');
      const depositAmount = payMethod === 'DEPOSIT' ? Math.round(totalAmount * 0.3) : 0;

      const newOrder = normalizeOrderObject({
        id: Date.now(),
        code,
        fullName: body.fullName || 'Khách hàng',
        phone: body.phone || '',
        email: body.email || '',
        address: body.address || '',
        city: body.city || '',
        district: body.district || '',
        note: body.note || '',
        paymentMethod: payMethod,
        paymentStatus: 'UNPAID',
        status: 'PENDING',
        subtotal,
        shippingFee,
        totalAmount,
        depositAmount,
        items,
        createdAt: now.toISOString(),
        timeline: [{
          newStatus: 'PENDING',
          statusLabel: 'Chờ xác nhận',
          note: 'Đơn hàng được khởi tạo thành công',
          createdAt: now.toISOString()
        }]
      });

      upsertSharedOrder(newOrder);
      addMyOrderCode(newOrder.code);
      emitRealtimeSync('ORDER_CREATED', newOrder);
      return {
        success: true,
        message: 'Đặt hàng thành công!',
        data: newOrder
      };
    }

    // 2. Admin lấy danh sách đơn hàng (GET /api/admin/orders)
    if (method === 'GET' && endpoint.startsWith('/api/admin/orders')) {
      const idMatch = endpoint.match(/^\/api\/admin\/orders\/(\d+)$/);
      const allOrders = getSharedOrders().map(normalizeOrderObject);

      if (idMatch) {
        const oid = Number(idMatch[1]);
        const found = allOrders.find(o => Number(o.id) === oid || Number(o.orderId) === oid);
        if (found) return { success: true, data: found };
      }

      const counts = {
        all: allOrders.length,
        pending: allOrders.filter(o => o.status === 'PENDING').length,
        confirmed: allOrders.filter(o => o.status === 'CONFIRMED').length,
        preparing: allOrders.filter(o => o.status === 'PREPARING').length,
        shipping: allOrders.filter(o => o.status === 'SHIPPING').length,
        delivered: allOrders.filter(o => o.status === 'DELIVERED').length,
        cancelled: allOrders.filter(o => o.status === 'CANCELLED').length
      };
      return {
        success: true,
        data: allOrders,
        counts,
        pagination: { page: 1, limit: 50, total: allOrders.length, totalPages: 1 }
      };
    }

    // 3. Admin cập nhật trạng thái / mã vận đơn SPX / thanh toán
    const adminOrderMatch = endpoint.match(/^\/api\/admin\/orders\/(\d+)\/(status|tracking|confirm-payment|payment|cancel)/);
    if (method === 'PUT' && adminOrderMatch) {
      const oid = Number(adminOrderMatch[1]);
      const action = adminOrderMatch[2];
      const allOrders = getSharedOrders();
      const target = allOrders.find(o => Number(o.id) === oid || Number(o.orderId) === oid);

      if (target) {
        if (action === 'status') {
          target.status = String(body.status || 'CONFIRMED').toUpperCase();
          if (body.trackingCode) target.trackingCode = String(body.trackingCode).trim().toUpperCase();
          if (body.carrier) target.trackingCarrier = body.carrier;
          if (['CONFIRMED', 'PREPARING', 'SHIPPING'].includes(target.status) && target.paymentStatus === 'UNPAID') {
            target.paymentStatus = target.paymentMethod === 'DEPOSIT' ? 'PARTIALLY_PAID' : (target.paymentMethod === 'BANK_TRANSFER' ? 'PAID' : 'UNPAID');
          }
        } else if (action === 'tracking') {
          target.trackingCode = String(body.trackingCode || '').trim().toUpperCase();
          target.trackingCarrier = body.carrier || 'SPX Express';
          if (body.autoShip) {
            target.status = 'SHIPPING';
          } else if (target.status === 'PENDING') {
            target.status = 'CONFIRMED';
          }
        } else if (action === 'confirm-payment' || action === 'payment') {
          target.paymentStatus = body.kind === 'deposit' ? 'PARTIALLY_PAID' : 'PAID';
          if (target.status === 'PENDING') target.status = 'CONFIRMED';
        } else if (action === 'cancel') {
          target.status = 'CANCELLED';
          target.cancelReason = body.cancelReason || 'Admin hủy đơn';
        }
        target.updatedAt = new Date().toISOString();
        const saved = upsertSharedOrder(target);
        emitRealtimeSync('ORDER_UPDATED', saved);
        return {
          success: true,
          message: 'Đã cập nhật đơn hàng thành công!',
          data: saved
        };
      }
    }

    // 4. Khách hàng kiểm tra trạng thái đơn / danh sách đơn của tôi / tra cứu
    if (method === 'GET' && endpoint.startsWith('/api/orders/')) {
      const allOrders = getSharedOrders().map(normalizeOrderObject);

      if (endpoint.startsWith('/api/orders/my-orders')) {
        const myCodes = getMyOrderCodes();
        const myOrders = allOrders.filter(o => myCodes.includes(o.code));
        return { success: true, data: myOrders.length > 0 ? myOrders : allOrders };
      }

      const checkMatch = endpoint.match(/\/api\/orders\/(?:check-status|track)\/([^?]+)/);
      if (checkMatch) {
        const q = decodeURIComponent(checkMatch[1]).trim().toUpperCase();
        const matched = allOrders.filter(o =>
          (o.code && o.code.toUpperCase() === q) ||
          (o.phone && o.phone.includes(q)) ||
          (o.trackingCode && o.trackingCode.toUpperCase() === q)
        );
        if (endpoint.includes('/check-status/')) {
          return matched[0] ? { success: true, data: matched[0] } : null;
        }
        return { success: true, data: matched };
      }

      const detailMatch = endpoint.match(/^\/api\/orders\/([^/?]+)$/);
      if (detailMatch) {
        const code = decodeURIComponent(detailMatch[1]).trim().toUpperCase();
        const found = allOrders.find(o => o.code && o.code.toUpperCase() === code);
        if (found) return { success: true, data: found };
      }
    }

    // 5. Khách hàng cập nhật địa chỉ / xác nhận đã nhận hàng / hủy đơn
    const custActionMatch = endpoint.match(/^\/api\/orders\/([^/]+)\/(cancel|confirm-received|shipping-info)/);
    if (method === 'PUT' && custActionMatch) {
      const code = decodeURIComponent(custActionMatch[1]).trim().toUpperCase();
      const act = custActionMatch[2];
      const allOrders = getSharedOrders();
      const target = allOrders.find(o => o.code && o.code.toUpperCase() === code);
      if (target) {
        if (act === 'cancel') {
          target.status = 'CANCELLED';
          target.cancelReason = body.reason || 'Khách hàng yêu cầu hủy đơn';
        } else if (act === 'confirm-received') {
          target.status = 'DELIVERED';
          target.paymentStatus = 'PAID';
        } else if (act === 'shipping-info') {
          if (body.fullName) target.fullName = body.fullName;
          if (body.phone) target.phone = body.phone;
          if (body.address) target.address = body.address;
          if (body.city) target.city = body.city;
          if (body.district) target.district = body.district;
          if (body.note !== undefined) target.note = body.note;
        }
        target.updatedAt = new Date().toISOString();
        const saved = upsertSharedOrder(target);
        emitRealtimeSync('ORDER_UPDATED', saved);
        return { success: true, message: 'Cập nhật đơn hàng thành công!', data: saved };
      }
    }

    return null;
  };

  async function request(endpoint, options = {}) {
    const fullUrl = endpoint.startsWith('http') ? endpoint : (API_BASE + endpoint);
    const method = (options.method || 'GET').toUpperCase();
    const headers = Object.assign({
      'Accept': 'application/json'
    }, options.headers || {});

    const token = getToken(endpoint);
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const rawBody = options.body;
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const config = Object.assign({}, options, { headers });

    let response;
    try {
      response = await fetch(fullUrl, config);
    } catch (netErr) {
      // Thử xử lý qua bộ đồng bộ Offline LocalStorage nếu máy chủ chưa bật
      const fallbackResult = handleOfflineFallback(endpoint, { method, body: rawBody });
      if (fallbackResult) {
        return fallbackResult;
      }
      console.error('[API NETWORK ERROR]:', netErr);
      throw new ApiError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng hoặc khởi động backend.', 0, 'NETWORK_ERROR');
    }

    const contentType = response.headers.get('content-type') || '';
    let data = null;

    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonErr) {
        data = { success: false, message: 'Dữ liệu máy chủ trả về không đúng định dạng JSON' };
      }
    } else {
      const text = await response.text();
      data = {
        success: response.ok,
        message: text.slice(0, 300) || (response.ok ? 'Thành công' : `Lỗi HTTP: ${response.status}`),
        data: null
      };
    }

    if (response.status === 401) {
      clearAuthSession();
      if (global.dispatchEvent) {
        global.dispatchEvent(new CustomEvent('minigt:unauthorized', { detail: { message: data.message } }));
      }
    }

    if (!response.ok) {
      const errorMsg = data && (data.message || data.error) ? (data.message || data.error) : `Lỗi máy chủ (${response.status})`;
      throw new ApiError(errorMsg, response.status, data.code || 'API_ERROR', data.details || null);
    }

    // Đồng bộ dữ liệu đơn hàng và phát tín hiệu Real-time sang tab kia
    syncOrderSideEffects(endpoint, method, data);

    return data;
  }

  const api = {
    BASE_URL: API_BASE,
    ApiError,
    getToken,
    getCurrentUser,
    setAuthSession,
    clearAuthSession,
    getSharedOrders,
    upsertSharedOrder,
    getMyOrderCodes,
    addMyOrderCode,
    emitRealtimeSync,
    normalizeOrderObject,

    get(url, params = {}) {
      let finalUrl = url;
      const query = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      if (query) {
        finalUrl += (url.includes('?') ? '&' : '?') + query;
      }
      return request(finalUrl, { method: 'GET' });
    },

    post(url, body = {}) {
      return request(url, { method: 'POST', body });
    },

    put(url, body = {}) {
      return request(url, { method: 'PUT', body });
    },

    patch(url, body = {}) {
      return request(url, { method: 'PATCH', body });
    },

    delete(url) {
      return request(url, { method: 'DELETE' });
    }
  };

  global.api = api;
})(typeof window !== 'undefined' ? window : this);
