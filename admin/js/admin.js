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
    addressType: 'ALL',
    spxStatus: 'ALL',
    search: '',
    preStage: 'ALL',
    page: 1,
    limit: 10
  };

  let cachedProducts = [];
  let cachedOrders = [];
  let cachedDashboardStats = null;
  let cachedRecentOrders = [];
  let cachedBestSellers = [];
  let cachedSubscribers = [];
  let currentDetailOrderId = null;
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
  // I18N DICTIONARY FOR ADMIN PORTAL (VI / EN)
  // =====================================================================
  const ADMIN_I18N = {
  vi: {
    "sidebar_brand_title": "MINI GT BIÊN HÒA",
    "sidebar_brand_subtitle": "Hệ Thống Quản Trị Store",
    "nav_dashboard": "Tổng quan hệ thống",
    "nav_products": "Sản phẩm & Kho hàng",
    "nav_orders": "Đơn hàng & SPX",
    "nav_users": "Tài khoản & Phân quyền",
    "nav_subscribers": "Đăng ký Bản tin",
    "nav_settings": "Cài đặt cửa hàng",
    "nav_about": "Giới thiệu Đề tài & Tác giả",
    "dash_title": "Tổng Quan Quản Trị Store",
    "prod_title": "Quản Lý Sản Phẩm & Kho Hàng",
    "ord_title": "Xử Lý Đơn Hàng & Vận Đơn SPX",
    "users_title": "Quản Lý Khách Hàng & Phân Quyền",
    "subscribers_title": "Bản Tin & Khách Hàng Tiềm Năng",
    "settings_title": "Cài Đặt Cửa Hàng & Thanh Toán",
    "topbar_display_settings": "Cài Đặt Hiển Thị",
    "topbar_theme": "Giao diện",
    "topbar_theme_dark": "Tối",
    "topbar_theme_light": "Sáng",
    "topbar_lang": "Ngôn ngữ",
    "topbar_authors": "Nhóm Tác Giả",
    "topbar_view_store": "Xem Cửa Hàng",
    "topbar_server_live": "Đồng bộ thời gian thực",
    "notif_title": "Thông Báo Đơn Hàng",
    "notif_mark_all": "Đánh dấu đã đọc",
    "notif_view_all": "Xem Tất Cả Đơn Hàng ➔",
    "kpi_revenue": "Tổng Doanh Thu",
    "kpi_revenue_desc": "Đơn hoàn tất & cọc đã thu",
    "kpi_deposit": "Tiền Cọc Pre-Order",
    "kpi_deposit_desc": "Giữ slot các đợt phát hành",
    "kpi_orders": "Tổng Đơn Hàng",
    "kpi_orders_desc": "Tất cả các trạng thái",
    "kpi_products": "Mẫu Xe Đang Bán",
    "kpi_products_desc": "Mô hình tỉ lệ 1:64",
    "kpi_customers": "Khách Hàng",
    "kpi_customers_desc": "Thành viên & Khách mua",
    "kpi_subscribers": "Đăng Ký Nhận Tin",
    "kpi_subscribers_desc": "Email quan tâm đợt xe mới",
    "btn_quick_add_product": "+ Thêm Mô Hình Mới",
    "btn_sync_orders": "Đồng Bộ Đơn",
    "recent_orders_title": "Đơn Hàng Gần Đây Cần Xử Lý",
    "recent_orders_subtitle": "Theo dõi nhanh các đơn mới đặt cọc, cần đóng gói và lên vận đơn SPX",
    "btn_view_all_orders": "Xem tất cả ➔",
    "th_order_code": "Mã Đơn",
    "th_customer": "Khách Hàng",
    "th_total": "Tổng Tiền",
    "th_payment": "Thanh Toán",
    "th_order_status": "Trạng Thái",
    "th_created_at": "Ngày Đặt",
    "th_actions": "Thao Tác",
    "best_sellers_title": "Mô Hình Bán Chạy Nhất",
    "best_sellers_subtitle": "Dựa trên số lượt đặt mua thực tế",
    "filter_search_placeholder": "Tìm kiếm theo tên xe, mã SKU (VD: MGT01413)...",
    "filter_cat_all": "Tất cả danh mục",
    "filter_status_all": "Tất cả trạng thái",
    "filter_status_instock": "Có sẵn giao ngay",
    "filter_status_preorder": "Đang mở Pre-Order",
    "filter_status_soldout": "Đã hết hàng",
    "filter_stock_all": "Tất cả kho",
    "filter_stock_low": "Sắp hết hàng (≤ 5 chiếc)",
    "filter_stock_out": "Hết hàng tồn (0 chiếc)",
    "filter_sort_newest": "Mới nhất",
    "filter_sort_price_asc": "Giá: Thấp đến Cao",
    "filter_sort_price_desc": "Giá: Cao đến Thấp",
    "filter_sort_stock_desc": "Tồn kho: Nhiều nhất",
    "order_tab_all": "Tất Cả",
    "order_tab_pending": "Chờ Duyệt",
    "order_tab_confirmed": "Đã Duyệt",
    "order_tab_preparing": "Đang Đóng Gói",
    "order_tab_shipping": "Đang Giao SPX",
    "order_tab_delivered": "Đã Giao Thành Công",
    "order_tab_cancelled": "Đã Hủy",
    "prod_modal_add_title": "Thêm Mô Hình Mới",
    "prod_modal_edit_title": "Chỉnh Sửa Mô Hình",
    "prod_modal_sku": "Mã SKU *",
    "prod_modal_car_number": "Số xe (Car # / Serial)",
    "prod_modal_category": "Danh mục *",
    "prod_modal_btn_new_cat": "Tạo danh mục mới",
    "prod_modal_new_cat_title": "Thêm Danh Mục Mới:",
    "prod_modal_new_cat_placeholder": "Tên danh mục (VD: JDM Street, Supercars...)",
    "prod_modal_slug_placeholder": "Slug (Tự động tạo)",
    "prod_modal_btn_save_cat": "Lưu Danh Mục",
    "prod_modal_name": "Tên mô hình đầy đủ *",
    "prod_modal_name_placeholder": "Aston Martin AMR24 #18 Lance Stroll F1 Las Vegas GP",
    "prod_modal_brand": "Thương hiệu *",
    "prod_modal_brand_custom": "-- Thương hiệu khác (Nhập tay) --",
    "prod_modal_brand_custom_placeholder": "Nhập tên thương hiệu khác (ví dụ: GCD, CM Model, Schuco...)",
    "prod_modal_scale": "Tỉ lệ",
    "prod_modal_pkg_config_title": "Cấu hình Giá Bản Box & Bản Card (Blister) + Khuyến mãi %",
    "prod_modal_pkg_config_desc": "Linh hoạt: Bản Box và Bản Card có thể để giá bằng nhau hoặc Card cộng thêm chênh lệch tùy theo bạn cấu hình.",
    "prod_modal_discount_none": "Không giảm giá (0%)",
    "prod_modal_discount_sale": "Giảm giá trực tiếp (%)",
    "prod_modal_packaging": "Quy cách đóng gói mở bán *",
    "prod_modal_pkg_both": "Có cả Bản Box & Bản Card (Khách tự chọn)",
    "prod_modal_pkg_box": "Chỉ có Bản Box (Hộp giấy)",
    "prod_modal_pkg_card": "Chỉ có Bản Card (Vỉ Blister)",
    "prod_modal_discount_percent_lbl": "Phần trăm giảm giá trực tiếp (%)",
    "prod_modal_quick_discount": "Chọn nhanh % trừ vào tiền:",
    "prod_modal_price_box": "Giá gốc Bản BOX - Hộp giấy (VNĐ) *",
    "prod_modal_preset": "Mẫu:",
    "prod_modal_box_disabled": "Mẫu này chỉ bán Bản Card (Tự động đồng bộ bằng giá Card)",
    "prod_modal_price_card": "Giá gốc Bản CARD - Vỉ Blister (VNĐ) *",
    "prod_modal_card_preset": "Mẫu Card:",
    "prod_modal_card_equal": "(=) Bằng giá Box",
    "prod_modal_card_disabled": "Mẫu này chỉ bán Bản Box (Không áp dụng Bản Card)",
    "prod_modal_edition": "Ghi chú phiên bản (Edition Note)",
    "prod_modal_status": "Tình trạng mở bán *",
    "prod_modal_status_instock": "Có sẵn giao ngay",
    "prod_modal_status_preorder": "Pre-Order (Đang mở cọc)",
    "prod_modal_status_soldout": "Hết hàng (Sold Out)",
    "prod_modal_preorder_config": "Cấu hình Đợt Hàng & Mức Cọc Pre-Order (Chỉ khi mở cọc)",
    "prod_modal_expected_delivery": "Dự kiến hàng về (Tháng / Năm) *",
    "prod_modal_preview_label": "Hiển thị:",
    "prod_modal_deposit_req": "Mức cọc yêu cầu (% & VNĐ) *",
    "prod_modal_deposit_placeholder": "Số tiền cọc VNĐ",
    "prod_modal_deposit_hint": "Hai chiều tự tính: Bấm chọn % hoặc gõ số tiền VNĐ (10% – 100%, không vượt giá xe).",
    "prod_modal_stock_title": "Kiểm Kho Thực Tế (Số Lượng Box & Card Còn Lại) *",
    "prod_modal_stock_box": "Tồn kho thực tế Bản BOX (Hộp giấy)",
    "prod_modal_stock_card": "Tồn kho thực tế Bản CARD (Vỉ Blister)",
    "prod_modal_images_title": "Bộ sưu tập hình ảnh sản phẩm (Thêm nhiều ảnh)",
    "prod_modal_images_desc": "Ảnh 1 hiển thị chính ở trên • Ảnh 2, 3, 4, 5... nằm hàng bên dưới • Bấm ô [+] để thêm ảnh tiếp theo hoặc chọn nhiều ảnh cùng lúc.",
    "prod_modal_btn_clear_images": "Xóa tất cả ảnh",
    "prod_modal_pick_images": "Chọn nhiều ảnh từ máy...",
    "prod_modal_img_url_placeholder": "Dán đường dẫn ảnh (VD: image/rexy.jpg hoặc https://...)",
    "prod_modal_add_url": "Thêm URL",
    "prod_modal_select_preset": "-- + Thêm từ ảnh có sẵn --",
    "prod_modal_featured": "Đánh dấu Mô hình Nổi Bật (Featured)",
    "prod_modal_new_release": "Đánh dấu Hàng Mới Về (New Release)",
    "prod_modal_desc": "Mô tả chi tiết sản phẩm",
    "prod_modal_desc_placeholder": "Chi tiết xe, bản quyền hãng, quy cách đóng gói...",
    "prod_modal_btn_save": "Lưu Mô Hình",
    "btn_cancel": "Hủy",
    "btn_close": "Đóng",
    "cancel_modal_title": "Xác Nhận Hủy Đơn Hàng",
    "cancel_modal_notice": "Lưu ý: Đơn hàng này đã thu tiền trước đó. Sau khi xác nhận hủy, hệ thống sẽ tự động chuyển trạng thái thanh toán sang CHỜ HOÀN TIỀN (REFUND_PENDING) để kế toán hoàn trả cho khách.",
    "cancel_modal_reason_lbl": "Lý do hủy đơn hàng",
    "cancel_reason_cust_request": "Khách yêu cầu hủy đơn",
    "cancel_reason_unpaid": "Chưa nhận được tiền CK / Cọc qua MB Bank",
    "cancel_reason_out_of_stock": "Hết hàng từ nhà phân phối Mini GT",
    "cancel_reason_no_contact": "Không liên lạc được số điện thoại khách",
    "cancel_reason_wrong_addr": "Thông tin địa chỉ nhận hàng không chính xác",
    "cancel_modal_placeholder": "Nhập hoặc chọn nhanh lý do hủy bên trên...",
    "cancel_modal_hint": "Lý do này sẽ hiển thị trực tiếp và rõ ràng cho khách hàng kèm Hotline/Zalo hỗ trợ 0981 400 400.",
    "cancel_modal_btn_confirm": "Xác Nhận Hủy Đơn",
    "ship_modal_title": "Quản Lý Vận Đơn SPX Express",
    "ship_modal_dispatch_title": "Thông tin gửi kiện cho Shipper SPX:",
    "ship_modal_btn_copy": "Sao chép thông tin",
    "ship_modal_steps_title": "Các bước tạo đơn nhanh trên SPX Express:",
    "ship_modal_step1": "Bước 1: Bấm \"Sao chép thông tin\" ở trên để lấy tên, SĐT, địa chỉ & tiền COD.",
    "ship_modal_step2": "Bước 2: Bấm Mở trang SPX Express (spx.vn/vi) hoặc mở App SPX trên điện thoại để dán thông tin tạo vận đơn.",
    "ship_modal_step3": "Bước 3: Sao chép mã vận đơn từ SPX (VD: SPXVN...), dán vào ô bên dưới và bấm \"Bắt Đầu Giao Hàng\".",
    "ship_modal_tracking_lbl": "Mã vận đơn SPX Express (Tracking Code)",
    "ship_modal_tracking_placeholder": "Dán mã SPXVN... vào đây",
    "ship_modal_btn_paste": "Dán mã",
    "ship_modal_liability_notice": "Lưu ý chuyển giao trách nhiệm: Khi bưu tá (shipper) SPX tới lấy kiện hàng từ shop, mã vận đơn đã gửi tới khách, trách nhiệm bảo quản đơn hàng và tiến độ giao phát thuộc về đơn vị SPX Express.",
    "ship_modal_btn_save_only": "Lưu Mã Vận Đơn",
    "ship_modal_btn_start": "Bắt Đầu Giao Hàng (SPX) ➔",
    "coupon_modal_title": "Tạo Mã Giảm Giá Mới",
    "coupon_modal_code_lbl": "Mã Giảm Giá (Code)",
    "coupon_modal_code_placeholder": "Ví dụ: MINIGT50K, HE2026...",
    "coupon_modal_code_hint": "Mã viết liền không dấu, hệ thống tự động viết hoa (VD: MINIGT50K).",
    "coupon_modal_desc_lbl": "Nội dung / Mô tả chương trình ưu đãi",
    "coupon_modal_desc_placeholder": "Ví dụ: Giảm ngay 50.000đ mừng tuần lễ xe đua IMSA...",
    "coupon_modal_type_lbl": "Hình thức giảm giá",
    "coupon_type_amount": "Giảm số tiền cố định (VNĐ)",
    "coupon_type_percent": "Giảm theo phần trăm (%) - Tối đa 10%",
    "coupon_modal_val_lbl": "Số tiền giảm (VNĐ)",
    "coupon_modal_val_placeholder": "VD: 50000",
    "coupon_modal_min_order": "Đơn hàng tối thiểu (VNĐ)",
    "coupon_modal_max_discount": "Giảm tối đa (VNĐ)",
    "coupon_modal_usage_limit": "Giới hạn lượt dùng",
    "coupon_modal_end_date": "Ngày hết hạn",
    "coupon_modal_active_lbl": "Kích hoạt mã ngay",
    "coupon_modal_btn_save": "Lưu Mã Giảm Giá",
    "user_orders_loading": "Đang tải hồ sơ & lịch sử mua hàng của khách...",
    "user_orders_title": "Hồ Sơ & Lịch Sử Mua Hàng Của Khách",
    "order_status_pending": "Chờ duyệt",
    "order_status_confirmed": "Đã duyệt",
    "order_status_preparing": "Đang đóng gói",
    "order_status_shipping": "Đang giao SPX",
    "order_status_delivered": "Đã giao thành công",
    "order_status_cancelled": "Đã hủy",
    "pay_vietqr_auto_paid": "VietQR Tự động • Đã thanh toán",
    "pay_vietqr_auto_deposit": "VietQR Tự động • Đã cọc",
    "pay_payos_refund_pending": "PayOS: Chờ hoàn tiền",
    "pay_payos_refunded": "PayOS: Đã hoàn tiền",
    "pay_payos_awaiting_scan": "VietQR PayOS (Chờ quét)",
    "pay_auto_reconcile": "Hệ thống tự động đối soát",
    "pay_full_paid": "Đã nhận đủ tiền",
    "pay_partially_paid": "Đã nhận cọc",
    "pay_refund_pending": "Chờ hoàn tiền",
    "pay_refunded": "Đã hoàn tiền",
    "pay_check_mbbank": "Check TK MB Bank",
    "pay_check_mbbank_hint": "Kiểm tra TK trước khi duyệt!",
    "pay_cod_on_delivery": "Thu COD khi giao",
    "btn_approve": "Duyệt",
    "btn_pack": "Đóng gói",
    "btn_edit_spx": "Sửa SPX",
    "btn_assign_spx": "Gán SPX",
    "btn_delivered": "Đã giao",
    "btn_detail": "Chi tiết",
    "btn_print": "In đơn",
    "btn_confirm_paid": "Xác nhận thu tiền",
    "btn_refund": "Hoàn tiền",
    "btn_cancel_order": "Hủy đơn",
    "btn_edit": "Sửa",
    "btn_delete": "Xóa",
    "btn_lock": "Khóa",
    "btn_unlock": "Mở",
    "btn_demote_cust": "Hạ Cust",
    "btn_promote_admin": "Lên Admin",
    "btn_view_history": "Lịch sử",
    "view_user_orders_title": "Xem lịch sử mua hàng của khách",
    "status_sold_out": "Hết hàng",
    "status_in_stock": "Có sẵn",
    "stock_out": "Hết",
    "stock_low": "Sắp hết",
    "pack_box_only": "Chỉ Box",
    "pack_card_only": "Chỉ Card",
    "pack_both": "Box & Card",
    "no_box_sale": "(Không bán Box)",
    "out_of_box": "Hết Box",
    "no_card_sale": "(Không bán Card)",
    "out_of_card": "Hết Card",
    "standard_edition": "Bản tiêu chuẩn",
    "cust_fallback_name": "Hội viên MINI GT",
    "cust_joined": "Tham gia",
    "cust_addr_old": "ĐC CŨ",
    "cust_addr_new": "ĐC MỚI",
    "orders_unit": "đơn",
    "user_active": "Hoạt động",
    "user_locked": "Bị khóa",
    "date_unknown": "Đơn không rõ ngày",
    "date_today": "Hôm nay",
    "date_yesterday": "Hôm qua",
    "date_prefix": "Ngày",
    "orders_empty": "Không tìm thấy đơn hàng nào phù hợp với bộ lọc",
    "no_sales_data": "Chưa có dữ liệu bán hàng",
    "no_orders_yet": "Khách hàng chưa có đơn hàng nào",
    "th_total_orders": "Tổng Đơn Hàng",
    "user_joined_date": "Ngày Tham Gia",
    "phone_lbl": "Điện thoại",
    "address_lbl": "Địa chỉ",
    "account_status_lbl": "Trạng thái",
    "th_items_count": "Số Lượng",
    "items_unit": "mẫu",
    "topbar_notifications": "Thông Báo Đơn Hàng",
    "topbar_notif_mark_read": "Đánh dấu đã đọc",
    "topbar_notif_empty": "Không có thông báo mới",
    "topbar_notif_view_orders": "Xem Tất Cả Đơn Hàng ➔",
    "dash_kpi_net_revenue": "Doanh Thu Thực Thu",
    "dash_kpi_deposit": "Tiền Cọc Pre-Order",
    "dash_kpi_total_orders": "Tổng Đơn Hàng",
    "dash_kpi_models_in_stock": "Mẫu Xe Đang Bán",
    "dash_kpi_customers": "Khách Hàng Thành Viên",
    "dash_kpi_subscribers": "Đăng Ký Nhận Tin",
    "dash_flow_status": "Tiến Trình Xử Lý Đơn",
    "dash_recent_orders": "Đơn Hàng Gần Đây Cần Xử Lý",
    "dash_view_all_orders": "Xem tất cả ➔",
    "dash_best_sellers": "Mô Hình Bán Chạy Nhất",
    "btn_refresh": "Làm Mới",
    "col_order_code": "Mã Đơn",
    "col_customer": "Khách Hàng",
    "col_total": "Tổng Tiền",
    "col_payment": "Thanh Toán",
    "col_status": "Trạng Thái",
    "col_time": "Ngày Đặt",
    "col_actions": "Thao Tác",
    "col_photo": "Ảnh",
    "col_sku": "Mã SKU",
    "col_model_name": "Tên Mô Hình",
    "col_category_brand": "Danh Mục / Hãng",
    "col_price": "Giá Bán",
    "col_stock": "Tồn Kho",
    "col_special": "Đặc Điểm",
    "col_order_code_time": "Mã Đơn & Thời Gian",
    "col_customer_phone": "Khách Hàng & SĐT",
    "col_model_pack": "Mô Hình & Quy Cách",
    "col_total_deposit": "Tổng Tiền & Cọc",
    "col_payment_status": "Thanh Toán",
    "col_status_spx": "Trạng Thái & SPX",
    "col_action_processing": "Xử Lý Tiến Trình",
    "col_id": "ID",
    "col_email": "Email",
    "col_phone": "Số Điện Thoại",
    "col_address": "Địa Chỉ",
    "col_total_orders": "Tổng Đơn",
    "col_total_spent": "Tổng Chi Tiêu",
    "col_vip_tier": "Hạng Thành Viên",
    "col_role": "Vai Trò",
    "col_coupon_code": "Mã Giảm Giá",
    "col_coupon_desc": "Nội Dung / Chương Trình",
    "col_coupon_type": "Loại Ưu Đãi",
    "col_coupon_value": "Mức Giảm",
    "col_coupon_min_order": "Đơn Tối Thiểu",
    "col_coupon_usage": "Lượt Dùng",
    "col_coupon_expiry": "Hạn Sử Dụng",
    "col_subscribed_at": "Ngày Đăng Ký",
    "prod_btn_add": "+ Thêm Mô Hình Mới",
    "prod_search_placeholder": "Tìm theo tên xe, mã SKU (VD: MGT01413)...",
    "filter_all_categories": "Tất cả danh mục",
    "filter_all_statuses": "Tất cả trạng thái",
    "status_pre_order": "Đang mở Pre-Order",
    "prod_show_hidden": "Hiển thị cả sản phẩm đang ẩn",
    "filter_stock_many": "Còn nhiều hàng (> 5 chiếc)",
    "sort_newest": "Mới nhất",
    "sort_best_selling": "Bán chạy nhất",
    "sort_price_asc": "Giá: Thấp đến Cao",
    "sort_price_desc": "Giá: Cao đến Thấp",
    "sort_stock_asc": "Tồn kho: Ít đến Nhiều",
    "orders_title": "Quản Lý Đơn Hàng & Vận Đơn SPX",
    "orders_subtitle": "Theo dõi tiến trình duyệt đơn, khớp lệnh VietQR PayOS tự động và bàn giao shipper SPX",
    "orders_btn_export_csv": "Xuất Excel / CSV",
    "order_tab_pre_order": "Pre-Order",
    "preorder_filter_title": "Giai Đoạn Hàng Pre-Order",
    "preorder_filter_hint": "Phân loại theo đợt hàng để gom đơn hoặc báo hàng về",
    "pre_stage_all": "Tất cả giai đoạn",
    "pre_stage_need_deposit": "Cần thu tiền cọc",
    "pre_stage_waiting_goods": "Đang chờ hàng về kho",
    "pre_stage_goods_arrived": "Hàng đã về kho Biên Hòa",
    "pre_stage_shipped": "Đã giao trả cọc & hàng",
    "orders_search_placeholder": "Tìm theo mã đơn (MG...), SĐT khách, tên khách...",
    "filter_pay_all": "Tất cả thanh toán",
    "filter_pay_unpaid": "Chưa thanh toán",
    "filter_pay_partial": "Đã nhận cọc",
    "filter_pay_paid": "Đã thanh toán đủ",
    "filter_pay_refund_pending": "Chờ hoàn tiền",
    "filter_pay_refunded": "Đã hoàn tiền",
    "filter_method_all": "Tất cả phương thức",
    "filter_method_payos": "VietQR PayOS (Tự động)",
    "filter_method_cod": "Ship COD (Thu tiền khi nhận)",
    "filter_method_deposit": "Cọc chuyển khoản (Pre-Order)",
    "filter_method_bank": "Chuyển khoản đủ 100%",
    "filter_payos_tooltip": "Chỉ lọc các đơn thanh toán tự động qua PayOS",
    "btn_payos_orders": "Đơn PayOS",
    "filter_addr_all": "Tất cả địa chỉ",
    "filter_addr_new": "Địa chỉ MỚI (Chuẩn)",
    "filter_addr_old": "Địa chỉ CŨ (Cần check)",
    "filter_spx_all": "Tất cả SPX",
    "filter_spx_unassigned": "Chưa có mã vận đơn SPX",
    "filter_spx_assigned": "Đã có mã vận đơn SPX",
    "users_search_placeholder": "Tìm theo họ tên, email, số điện thoại...",
    "coupons_vip_title": "Mã Giảm Giá & Voucher Tri Ân VIP",
    "coupons_vip_badge": "Hệ Thống Voucher",
    "coupons_title": "Quản Lý Mã Giảm Giá & Voucher VIP",
    "coupons_subtitle": "Tạo mã khuyến mãi kích cầu mua sắm và chăm sóc hội viên",
    "coupons_btn_add": "+ Tạo Mã Giảm Giá Mới",
    "subscribers_search_placeholder": "Tìm theo email người đăng ký...",
    "settings_btn_save": "Lưu Cấu Hình Cửa Hàng",
    "settings_sec_store": "1. Thông Tin Cửa Hàng & Vận Hành",
    "settings_lbl_store_name": "Tên cửa hàng *",
    "settings_lbl_hotline": "Hotline / Zalo *",
    "settings_lbl_email": "Email liên hệ *",
    "settings_lbl_address": "Địa chỉ cửa hàng *",
    "settings_lbl_shipping_fee": "Phí ship đồng giá SPX (VNĐ) *",
    "settings_lbl_low_stock": "Ngưỡng cảnh báo sắp hết hàng (chiếc) *",
    "settings_sec_bank": "2. Thông Tin Tài Khoản Ngân Hàng Nhận Tiền & VietQR",
    "settings_lbl_bank_id": "Mã ngân hàng (VietQR Bank BIN) *",
    "settings_lbl_bank_name": "Tên ngân hàng *",
    "settings_lbl_account_no": "Số tài khoản nhận tiền *",
    "settings_lbl_account_name": "Tên chủ tài khoản (In hoa không dấu) *",
    "settings_lbl_preorder_deadline": "Đợt hàng Pre-Order mặc định",
    "settings_lbl_announcement": "Thông báo nổi bật đầu trang chủ",
    "auth_security_tag": "Bảo mật SSL 256-Bit",
    "auth_title": "Đăng Nhập Quản Trị Store",
    "auth_subtitle": "Hệ Thống Phân Phối Mô Hình MINI GT Biên Hòa",
    "auth_email_lbl": "Email Quản Trị Viên",
    "auth_password_lbl": "Mật Khẩu",
    "auth_remember_me": "Ghi nhớ đăng nhập 30 ngày",
    "auth_forgot_password": "Quên mật khẩu?",
    "auth_btn_submit": "Đăng Nhập Vào Hệ Thống",
    "auth_back_to_store": "← Quay lại xem Cửa Hàng",
    "about_title": "Giới Thiệu Đề Tài & Nhóm Tác Giả",
    "default_title": "Hệ Thống Quản Trị MINI GT",
    "btn_preorder_arrived": "Báo Hàng Về",
    "badge_arrived": "Đã về kho",
    "cust_addr_old_hint": "Khách chọn Địa chỉ CŨ trước sáp nhập - Khi tạo đơn SPX cần đối chiếu hoặc báo khách!",
    "cust_addr_new_hint": "Địa chỉ MỚI chuẩn sau sáp nhập",
    "deposit_lbl": "Cọc",
    "cod_rem_lbl": "COD còn",
    "pay_cod_100": "Thu COD 100%",
    "pay_full_100": "Thanh toán Full",
    "pay_method_deposit": "⚡ Cọc MB Bank",
    "pay_method_cod": "📦 Ship COD",
    "pay_method_bank": "💳 Chuyển khoản",
    "items_more": "mẫu xe khác...",
    "coupon_modal_edit_title": "Sửa Mã Giảm Giá",
    "coupon_type_pct": "Giảm theo %",
    "coupon_type_amt": "Giảm tiền mặt",
    "coupon_no_min": "Không yêu cầu",
    "coupon_expired": "Đã hết hạn",
    "coupon_no_exp": "Vô thời hạn",
    "coupon_active": "Đang Bật",
    "coupon_inactive": "Đã Tắt",
    "coupons_empty": "Chưa có mã giảm giá nào do Admin tạo. Bấm nút \"+ Tạo Mã Giảm Giá Mới\" để thêm mã ưu đãi!",
    "subscribers_empty": "Không có người đăng ký nào",
    "subscribers_th_id": "Mã",
    "subscribers_th_email": "Email Khách Hàng",
    "subscribers_th_date": "Ngày Đăng Ký",
    "subscribers_th_action": "Thao Tác"
},
  en: {
    "sidebar_brand_title": "MINI GT BIEN HOA",
    "sidebar_brand_subtitle": "Store Admin Portal",
    "nav_dashboard": "Dashboard Overview",
    "nav_products": "Products & Stock",
    "nav_orders": "Orders & SPX",
    "nav_users": "Customers & Roles",
    "nav_subscribers": "Newsletter CRM",
    "nav_settings": "Store Settings",
    "nav_about": "Project & Authors",
    "dash_title": "Store Administration Overview",
    "prod_title": "Product Catalog & Inventory",
    "ord_title": "Order Processing & SPX Logistics",
    "users_title": "Customer Accounts & Roles",
    "subscribers_title": "Newsletter CRM & Leads",
    "settings_title": "Store Settings & Operations",
    "topbar_display_settings": "Display Settings",
    "topbar_theme": "Theme",
    "topbar_theme_dark": "Dark",
    "topbar_theme_light": "Light",
    "topbar_lang": "Language",
    "topbar_authors": "Authors",
    "topbar_view_store": "View Storefront",
    "topbar_server_live": "Real-time Sync Active",
    "notif_title": "Order Notifications",
    "notif_mark_all": "Mark all as read",
    "notif_view_all": "View All Orders ➔",
    "kpi_revenue": "Total Revenue",
    "kpi_revenue_desc": "Completed orders & received deposits",
    "kpi_deposit": "Pre-Order Deposits",
    "kpi_deposit_desc": "Held slots for upcoming releases",
    "kpi_orders": "Total Orders",
    "kpi_orders_desc": "Across all order statuses",
    "kpi_products": "Catalog Models",
    "kpi_products_desc": "Active 1:64 scale diecast models",
    "kpi_customers": "Members & Collectors",
    "kpi_customers_desc": "Registered collectors & buyers",
    "kpi_subscribers": "Newsletter CRM",
    "kpi_subscribers_desc": "Interested collector leads",
    "btn_quick_add_product": "+ Add New Model",
    "btn_sync_orders": "Live Sync",
    "recent_orders_title": "Recent Orders Requiring Attention",
    "recent_orders_subtitle": "Review deposits, confirm packaging & generate SPX waybills",
    "btn_view_all_orders": "View all orders ➔",
    "th_order_code": "Order Code",
    "th_customer": "Customer",
    "th_total": "Total",
    "th_payment": "Payment",
    "th_order_status": "Status",
    "th_created_at": "Date",
    "th_actions": "Actions",
    "best_sellers_title": "Top Selling Models",
    "best_sellers_subtitle": "Based on verified checkout numbers",
    "filter_search_placeholder": "Search by SKU, car name, car #...",
    "filter_cat_all": "All Categories",
    "filter_status_all": "All Statuses",
    "filter_status_instock": "In Stock (Ready)",
    "filter_status_preorder": "Pre-Order",
    "filter_status_soldout": "Sold Out",
    "filter_stock_all": "All Stock Levels",
    "filter_stock_low": "Low Stock (≤ 5 units)",
    "filter_stock_out": "Out of Stock (0 units)",
    "filter_sort_newest": "Newest Releases",
    "filter_sort_price_asc": "Price: Low to High",
    "filter_sort_price_desc": "Price: High to Low",
    "filter_sort_stock_desc": "Stock: High to Low",
    "order_tab_all": "All Orders",
    "order_tab_pending": "Pending",
    "order_tab_confirmed": "Confirmed",
    "order_tab_preparing": "Packaging",
    "order_tab_shipping": "Shipping SPX",
    "order_tab_delivered": "Delivered",
    "order_tab_cancelled": "Cancelled",
    "prod_modal_add_title": "Add New Model",
    "prod_modal_edit_title": "Edit Model Details",
    "prod_modal_sku": "SKU Code *",
    "prod_modal_car_number": "Car # / Serial",
    "prod_modal_category": "Category *",
    "prod_modal_btn_new_cat": "Create new category",
    "prod_modal_new_cat_title": "Add New Category:",
    "prod_modal_new_cat_placeholder": "Category name (e.g. JDM Street, Supercars...)",
    "prod_modal_slug_placeholder": "Slug (Auto generated)",
    "prod_modal_btn_save_cat": "Save Category",
    "prod_modal_name": "Full Model Name *",
    "prod_modal_name_placeholder": "Aston Martin AMR24 #18 Lance Stroll F1 Las Vegas GP",
    "prod_modal_brand": "Brand *",
    "prod_modal_brand_custom": "-- Custom Brand (Manual entry) --",
    "prod_modal_brand_custom_placeholder": "Enter custom brand name (e.g. GCD, CM Model, Schuco...)",
    "prod_modal_scale": "Scale",
    "prod_modal_pkg_config_title": "Pricing for Box & Card (Blister) + Discount %",
    "prod_modal_pkg_config_desc": "Flexible: Box and Card editions can have equal or differential prices.",
    "prod_modal_discount_none": "No discount (0%)",
    "prod_modal_discount_sale": "Direct discount (%)",
    "prod_modal_packaging": "Packaging Available *",
    "prod_modal_pkg_both": "Both Box & Card Available (Customer Choice)",
    "prod_modal_pkg_box": "Box Edition Only (Paper Box)",
    "prod_modal_pkg_card": "Card Edition Only (Blister Pack)",
    "prod_modal_discount_percent_lbl": "Direct discount percentage (%)",
    "prod_modal_quick_discount": "Quick discount % preset:",
    "prod_modal_price_box": "Original Box Price (VND) *",
    "prod_modal_preset": "Presets:",
    "prod_modal_box_disabled": "Card edition only for this model",
    "prod_modal_price_card": "Original Card Price (VND) *",
    "prod_modal_card_preset": "Card Presets:",
    "prod_modal_card_equal": "(=) Same as Box",
    "prod_modal_card_disabled": "Box edition only for this model",
    "prod_modal_edition": "Edition Note",
    "prod_modal_status": "Release Status *",
    "prod_modal_status_instock": "In Stock (Ready to ship)",
    "prod_modal_status_preorder": "Pre-Order (Taking deposits)",
    "prod_modal_status_soldout": "Sold Out",
    "prod_modal_preorder_config": "Pre-Order Batch & Required Deposit Config",
    "prod_modal_expected_delivery": "Expected Delivery (Month / Year) *",
    "prod_modal_preview_label": "Display:",
    "prod_modal_deposit_req": "Required Deposit (% & VND) *",
    "prod_modal_deposit_placeholder": "Deposit amount VND",
    "prod_modal_deposit_hint": "Two-way sync: Select % or enter VND amount (10% – 100%, cannot exceed car price).",
    "prod_modal_stock_title": "Real Stock Verification (Box & Card Quantity Remaining) *",
    "prod_modal_stock_box": "Physical Stock: BOX (Paper Box)",
    "prod_modal_stock_card": "Physical Stock: CARD (Blister Pack)",
    "prod_modal_images_title": "Product Image Gallery (Multi-image)",
    "prod_modal_images_desc": "Image 1 is primary. Images 2, 3, 4, 5... appear in thumbnail row below. Click [+] or select multiple files.",
    "prod_modal_btn_clear_images": "Clear All Images",
    "prod_modal_pick_images": "Choose Files from Computer...",
    "prod_modal_img_url_placeholder": "Paste image URL (e.g. image/rexy.jpg or https://...)",
    "prod_modal_add_url": "Add URL",
    "prod_modal_select_preset": "-- + Add From Preset Images --",
    "prod_modal_featured": "Mark as Featured Model",
    "prod_modal_new_release": "Mark as New Release",
    "prod_modal_desc": "Detailed Product Description",
    "prod_modal_desc_placeholder": "Vehicle details, official license, packaging...",
    "prod_modal_btn_save": "Save Model",
    "btn_cancel": "Cancel",
    "btn_close": "Close",
    "cancel_modal_title": "Confirm Order Cancellation",
    "cancel_modal_notice": "Notice: This order had prior payments. Upon cancellation, payment status will automatically change to REFUND_PENDING for accounting reconciliation.",
    "cancel_modal_reason_lbl": "Cancellation Reason",
    "cancel_reason_cust_request": "Customer requested cancellation",
    "cancel_reason_unpaid": "MB Bank transfer/deposit not received",
    "cancel_reason_out_of_stock": "Out of stock from distributor",
    "cancel_reason_no_contact": "Customer phone unreachable",
    "cancel_reason_wrong_addr": "Incorrect shipping address",
    "cancel_modal_placeholder": "Enter or select cancellation reason above...",
    "cancel_modal_hint": "This reason will be displayed directly to the customer along with Hotline/Zalo support 0981 400 400.",
    "cancel_modal_btn_confirm": "Confirm Cancel Order",
    "ship_modal_title": "SPX Express Waybill Management",
    "ship_modal_dispatch_title": "Parcel dispatch info for SPX Shipper:",
    "ship_modal_btn_copy": "Copy dispatch info",
    "ship_modal_steps_title": "Steps to create waybill on SPX Express:",
    "ship_modal_step1": "Step 1: Click \"Copy dispatch info\" above for customer name, phone, address & COD.",
    "ship_modal_step2": "Step 2: Open SPX Express (spx.vn/vi) or SPX App on your phone to paste information.",
    "ship_modal_step3": "Step 3: Copy waybill tracking code from SPX (e.g. SPXVN...), paste below and click \"Start Shipping\".",
    "ship_modal_tracking_lbl": "SPX Express Tracking Code",
    "ship_modal_tracking_placeholder": "Paste SPXVN... code here",
    "ship_modal_btn_paste": "Paste code",
    "ship_modal_liability_notice": "Liability handover notice: Once the SPX courier picks up the parcel from the shop and tracking is issued, parcel care and transit schedule are handled by SPX Express.",
    "ship_modal_btn_save_only": "Save Tracking Code Only",
    "ship_modal_btn_start": "Start Shipping (SPX) ➔",
    "coupon_modal_title": "Create New Discount Coupon",
    "coupon_modal_code_lbl": "Coupon Code",
    "coupon_modal_code_placeholder": "E.g.: MINIGT50K, SUMMER2026...",
    "coupon_modal_code_hint": "Letters and numbers without spaces, auto capitalized (e.g. MINIGT50K).",
    "coupon_modal_desc_lbl": "Promotion Title / Description",
    "coupon_modal_desc_placeholder": "E.g.: Direct 50,000 VND discount celebrating IMSA race week...",
    "coupon_modal_type_lbl": "Discount Type",
    "coupon_type_amount": "Fixed Amount Discount (VND)",
    "coupon_type_percent": "Percentage Discount (%) - Max 10%",
    "coupon_modal_val_lbl": "Discount Value (VND)",
    "coupon_modal_val_placeholder": "E.g.: 50000",
    "coupon_modal_min_order": "Minimum Order (VND)",
    "coupon_modal_max_discount": "Maximum Discount (VND)",
    "coupon_modal_usage_limit": "Usage Limit",
    "coupon_modal_end_date": "Expiration Date",
    "coupon_modal_active_lbl": "Activate coupon immediately",
    "coupon_modal_btn_save": "Save Coupon",
    "user_orders_loading": "Loading customer profile & order history...",
    "user_orders_title": "Customer Profile & Lifetime Orders",
    "order_status_pending": "Pending",
    "order_status_confirmed": "Confirmed",
    "order_status_preparing": "Packaging",
    "order_status_shipping": "Shipping SPX",
    "order_status_delivered": "Delivered",
    "order_status_cancelled": "Cancelled",
    "pay_vietqr_auto_paid": "VietQR Auto • Paid",
    "pay_vietqr_auto_deposit": "VietQR Auto • Deposited",
    "pay_payos_refund_pending": "PayOS: Refund Pending",
    "pay_payos_refunded": "PayOS: Refunded",
    "pay_payos_awaiting_scan": "VietQR PayOS (Awaiting Scan)",
    "pay_auto_reconcile": "System Auto Reconciliation",
    "pay_full_paid": "Full Payment Received",
    "pay_partially_paid": "Deposit Received",
    "pay_refund_pending": "Refund Pending",
    "pay_refunded": "Refunded",
    "pay_check_mbbank": "Check MB Bank App",
    "pay_check_mbbank_hint": "Verify Account Before Approving!",
    "pay_cod_on_delivery": "Collect COD on Delivery",
    "btn_approve": "Approve",
    "btn_pack": "Pack",
    "btn_edit_spx": "Edit SPX",
    "btn_assign_spx": "Assign SPX",
    "btn_delivered": "Delivered",
    "btn_detail": "Details",
    "btn_print": "Print Invoice",
    "btn_confirm_paid": "Confirm Payment",
    "btn_refund": "Refund",
    "btn_cancel_order": "Cancel Order",
    "btn_edit": "Edit",
    "btn_delete": "Delete",
    "btn_lock": "Lock",
    "btn_unlock": "Unlock",
    "btn_demote_cust": "Demote Cust",
    "btn_promote_admin": "Promote Admin",
    "btn_view_history": "History",
    "view_user_orders_title": "View customer purchase history",
    "status_sold_out": "Sold Out",
    "status_in_stock": "In Stock",
    "stock_out": "Out",
    "stock_low": "Low",
    "pack_box_only": "Box Only",
    "pack_card_only": "Card Only",
    "pack_both": "Box & Card",
    "no_box_sale": "(No Box sale)",
    "out_of_box": "Out of Box",
    "no_card_sale": "(No Card sale)",
    "out_of_card": "Out of Card",
    "standard_edition": "Standard Edition",
    "cust_fallback_name": "MINI GT Member",
    "cust_joined": "Joined",
    "cust_addr_old": "OLD ADDR",
    "cust_addr_new": "NEW ADDR",
    "orders_unit": "orders",
    "user_active": "Active",
    "user_locked": "Locked",
    "date_unknown": "Unknown Date",
    "date_today": "Today",
    "date_yesterday": "Yesterday",
    "date_prefix": "Date",
    "orders_empty": "No orders found matching the filter criteria",
    "no_sales_data": "No sales data yet",
    "no_orders_yet": "Customer has not placed any orders yet",
    "th_total_orders": "Total Orders",
    "user_joined_date": "Joined Date",
    "phone_lbl": "Phone",
    "address_lbl": "Address",
    "account_status_lbl": "Account Status",
    "th_items_count": "Quantity",
    "items_unit": "items",
    "topbar_notifications": "Order Notifications",
    "topbar_notif_mark_read": "Mark all as read",
    "topbar_notif_empty": "No new notifications",
    "topbar_notif_view_orders": "View All Orders ➔",
    "dash_kpi_net_revenue": "Net Revenue",
    "dash_kpi_deposit": "Pre-Order Deposits",
    "dash_kpi_total_orders": "Total Orders",
    "dash_kpi_models_in_stock": "Models in Stock",
    "dash_kpi_customers": "Registered Customers",
    "dash_kpi_subscribers": "Newsletter Leads",
    "dash_flow_status": "Order Flow Status",
    "dash_recent_orders": "Recent Orders Requiring Attention",
    "dash_view_all_orders": "View all ➔",
    "dash_best_sellers": "Top Selling Models",
    "btn_refresh": "Refresh",
    "col_order_code": "Order Code",
    "col_customer": "Customer",
    "col_total": "Total",
    "col_payment": "Payment",
    "col_status": "Status",
    "col_time": "Date & Time",
    "col_actions": "Actions",
    "col_photo": "Photo",
    "col_sku": "SKU",
    "col_model_name": "Model Name",
    "col_category_brand": "Category / Brand",
    "col_price": "Price",
    "col_stock": "Stock",
    "col_special": "Tags",
    "col_order_code_time": "Order & Time",
    "col_customer_phone": "Customer & Phone",
    "col_model_pack": "Models & Packaging",
    "col_total_deposit": "Total & Deposit",
    "col_payment_status": "Payment Status",
    "col_status_spx": "Status & SPX",
    "col_action_processing": "Process Action",
    "col_id": "ID",
    "col_email": "Email",
    "col_phone": "Phone Number",
    "col_address": "Address",
    "col_total_orders": "Total Orders",
    "col_total_spent": "Total Spent",
    "col_vip_tier": "VIP Tier",
    "col_role": "Role",
    "col_coupon_code": "Coupon Code",
    "col_coupon_desc": "Description",
    "col_coupon_type": "Discount Type",
    "col_coupon_value": "Discount Value",
    "col_coupon_min_order": "Min Order",
    "col_coupon_usage": "Usage",
    "col_coupon_expiry": "Expiry Date",
    "col_subscribed_at": "Subscribed Date",
    "prod_btn_add": "+ Add New Model",
    "prod_search_placeholder": "Search by model name, SKU (e.g. MGT01413)...",
    "filter_all_categories": "All Categories",
    "filter_all_statuses": "All Statuses",
    "status_pre_order": "Taking Pre-Orders",
    "prod_show_hidden": "Show hidden models",
    "filter_stock_many": "High stock (> 5 units)",
    "sort_newest": "Newest Releases",
    "sort_best_selling": "Best Selling",
    "sort_price_asc": "Price: Low to High",
    "sort_price_desc": "Price: High to Low",
    "sort_stock_asc": "Stock: Low to High",
    "orders_title": "Order Processing & SPX Logistics",
    "orders_subtitle": "Monitor approvals, VietQR PayOS auto-reconciliation, and SPX courier dispatch",
    "orders_btn_export_csv": "Export CSV / Excel",
    "order_tab_pre_order": "Pre-Order",
    "preorder_filter_title": "Pre-Order Fulfillment Stage",
    "preorder_filter_hint": "Filter by batch stage for batching or arrival notice",
    "pre_stage_all": "All Stages",
    "pre_stage_need_deposit": "Needs Deposit",
    "pre_stage_waiting_goods": "Awaiting Batch Arrival",
    "pre_stage_goods_arrived": "Batch Arrived in Store",
    "pre_stage_shipped": "Fulfilled & Shipped",
    "orders_search_placeholder": "Search by order # (MG...), phone, customer name...",
    "filter_pay_all": "All Payments",
    "filter_pay_unpaid": "Unpaid",
    "filter_pay_partial": "Deposit Paid",
    "filter_pay_paid": "Paid in Full",
    "filter_pay_refund_pending": "Refund Pending",
    "filter_pay_refunded": "Refunded",
    "filter_method_all": "All Methods",
    "filter_method_payos": "VietQR PayOS (Auto)",
    "filter_method_cod": "Cash on Delivery (COD)",
    "filter_method_deposit": "Pre-Order Deposit",
    "filter_method_bank": "Direct Bank Transfer",
    "filter_payos_tooltip": "Filter orders paid via VietQR PayOS",
    "btn_payos_orders": "PayOS Orders",
    "filter_addr_all": "All Addresses",
    "filter_addr_new": "NEW Address (Standard)",
    "filter_addr_old": "OLD Address (Verify)",
    "filter_spx_all": "All SPX",
    "filter_spx_unassigned": "No SPX Tracking",
    "filter_spx_assigned": "SPX Tracking Assigned",
    "users_search_placeholder": "Search by name, email, phone number...",
    "coupons_vip_title": "VIP Vouchers & Loyalty Coupons",
    "coupons_vip_badge": "Voucher Engine",
    "coupons_title": "VIP Coupons & Voucher Codes",
    "coupons_subtitle": "Create promotional discount codes and VIP collector rewards",
    "coupons_btn_add": "+ Create New Coupon",
    "subscribers_search_placeholder": "Search subscriber email...",
    "settings_btn_save": "Save Store Settings",
    "settings_sec_store": "1. Store Operations & Contact",
    "settings_lbl_store_name": "Store Name *",
    "settings_lbl_hotline": "Hotline / Zalo *",
    "settings_lbl_email": "Support Email *",
    "settings_lbl_address": "Store Address *",
    "settings_lbl_shipping_fee": "Standard SPX Flat Shipping Fee (VND) *",
    "settings_lbl_low_stock": "Low Stock Alert Threshold (units) *",
    "settings_sec_bank": "2. Bank Account & VietQR Payment Configuration",
    "settings_lbl_bank_id": "Bank Code (VietQR Bank BIN) *",
    "settings_lbl_bank_name": "Bank Name *",
    "settings_lbl_account_no": "Bank Account Number *",
    "settings_lbl_account_name": "Account Holder Name (Uppercase) *",
    "settings_lbl_preorder_deadline": "Default Pre-Order Release Batch",
    "settings_lbl_announcement": "Storefront Announcement Bar Banner",
    "auth_security_tag": "SSL 256-Bit Encrypted",
    "auth_title": "Store Admin Sign-In",
    "auth_subtitle": "MINI GT Bien Hoa Diecast Management",
    "auth_email_lbl": "Admin Email Address",
    "auth_password_lbl": "Password",
    "auth_remember_me": "Remember login for 30 days",
    "auth_forgot_password": "Forgot password?",
    "auth_btn_submit": "Sign In to Portal",
    "auth_back_to_store": "← Return to Storefront",
    "about_title": "Project Overview & Dev Team",
    "default_title": "MINI GT Store Admin Portal",
    "btn_preorder_arrived": "Pre-Order Arrived",
    "badge_arrived": "In Warehouse",
    "cust_addr_old_hint": "Customer selected OLD address before merger - verify before booking SPX!",
    "cust_addr_new_hint": "Standard NEW address after merger",
    "deposit_lbl": "Deposit",
    "cod_rem_lbl": "Remaining COD",
    "pay_cod_100": "Collect 100% COD",
    "pay_full_100": "Paid in Full",
    "pay_method_deposit": "⚡ MB Bank Deposit",
    "pay_method_cod": "📦 Cash on Delivery",
    "pay_method_bank": "💳 Bank Transfer",
    "items_more": "more models...",
    "coupon_modal_edit_title": "Edit Discount Coupon",
    "coupon_type_pct": "Percent (%)",
    "coupon_type_amt": "Cash Discount",
    "coupon_no_min": "No Minimum",
    "coupon_expired": "Expired",
    "coupon_no_exp": "No Expiry",
    "coupon_active": "Active",
    "coupon_inactive": "Inactive",
    "coupons_empty": "No discount coupons created yet. Click \"+ Create New Discount Coupon\" to add one!",
    "subscribers_empty": "No newsletter subscribers found",
    "subscribers_th_id": "ID",
    "subscribers_th_email": "Subscriber Email",
    "subscribers_th_date": "Subscribed Date",
    "subscribers_th_action": "Action"
}
};

  function t(key, fallback = '') {
    const lang = localStorage.getItem('minigt_lang') || 'vi';
    if (ADMIN_I18N[lang] && ADMIN_I18N[lang][key] != null) {
      return ADMIN_I18N[lang][key];
    }
    if (ADMIN_I18N.vi && ADMIN_I18N.vi[key] != null) {
      return ADMIN_I18N.vi[key];
    }
    return fallback;
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

  function getCustomerVipInfo(totalSpent = 0) {
    const spent = Math.max(0, Number(totalSpent) || 0);
    if (spent <= 200000) {
      return {
        level: 1,
        label: 'VIP 1',
        tierName: '0 - 200K',
        color: '#475569',
        bg: '#f1f5f9',
        border: '#cbd5e1',
        icon: 'fa-shield'
      };
    } else if (spent <= 500000) {
      return {
        level: 2,
        label: 'VIP 2',
        tierName: '201K - 500K',
        color: '#0284c7',
        bg: '#e0f2fe',
        border: '#bae6fd',
        icon: 'fa-medal'
      };
    } else if (spent <= 1000000) {
      return {
        level: 3,
        label: 'VIP 3',
        tierName: '501K - 1TR',
        color: '#d97706',
        bg: '#fef3c7',
        border: '#fde68a',
        icon: 'fa-award'
      };
    } else if (spent <= 5000000) {
      return {
        level: 4,
        label: 'VIP 4',
        tierName: '1TR001K - 5TR',
        color: '#7c3aed',
        bg: '#f3e8ff',
        border: '#ddd6fe',
        icon: 'fa-gem'
      };
    } else {
      return {
        level: 5,
        label: 'VIP 5',
        tierName: '5TR001K - 10TR+',
        color: '#dc2626',
        bg: '#fee2e2',
        border: '#fca5a5',
        icon: 'fa-crown'
      };
    }
  }
  window.getCustomerVipInfo = getCustomerVipInfo;

  function adminToast(message, type = 'info', title = null) {
    if (!message) return;
    let container = document.getElementById('adminToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'adminToastContainer';
      container.style.cssText = 'position:fixed; top:24px; right:24px; z-index:999999; display:flex; flex-direction:column; gap:10px; pointer-events:none; max-width:420px; width:100%;';
      document.body.appendChild(container);
    }

    const msgClean = String(message).trim();
    // Chống lặp toast cùng nội dung đang hiển thị
    const existing = Array.from(container.querySelectorAll('.admin-toast-text')).map(el => el.textContent.trim());
    if (existing.includes(msgClean)) return;

    // Giới hạn tối đa 3 toast xếp chồng
    while (container.children.length >= 3) {
      if (container.firstElementChild) {
        container.firstElementChild.remove();
      } else {
        break;
      }
    }

    const toast = document.createElement('div');
    const validTypes = ['success', 'error', 'warning', 'info'];
    const t = validTypes.includes(type) ? type : 'info';

    let iconHtml = '<i class="fa-solid fa-circle-info"></i>';
    let defaultTitle = 'Quản trị Admin';
    let accentColor = '#2563eb';
    let iconBg = '#eff6ff';
    if (t === 'success') {
      iconHtml = '<i class="fa-solid fa-circle-check"></i>';
      defaultTitle = 'Thành công';
      accentColor = '#10b981';
      iconBg = '#ecfdf5';
    } else if (t === 'error') {
      iconHtml = '<i class="fa-solid fa-circle-exclamation"></i>';
      defaultTitle = 'Thông báo lỗi';
      accentColor = '#ef4444';
      iconBg = '#fef2f2';
    } else if (t === 'warning') {
      iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
      defaultTitle = 'Cảnh báo';
      accentColor = '#f59e0b';
      iconBg = '#fffbeb';
    }

    const finalTitle = title || defaultTitle;

    toast.style.cssText = `background:#ffffff; color:#0f172a; padding:12px 14px; border-radius:12px; border:1px solid #e2e8f0; border-left:4px solid ${accentColor}; box-shadow:0 14px 35px -6px rgba(15,23,42,0.16), 0 4px 10px rgba(15,23,42,0.05); font-size:12.5px; display:flex; align-items:flex-start; gap:10px; pointer-events:auto; transition:all 0.28s cubic-bezier(0.16,1,0.3,1); transform:translateY(-14px) scale(0.96); opacity:0;`;
    toast.innerHTML = `
      <div style="width:30px; height:30px; border-radius:8px; background:${iconBg}; color:${accentColor}; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; margin-top:1px;">
        ${iconHtml}
      </div>
      <div style="flex:1; min-width:0;">
        <div style="font-size:11px; font-weight:800; color:${accentColor}; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:2px;">
          ${escapeHtml(finalTitle)}
        </div>
        <div class="admin-toast-text" style="color:#334155; font-weight:600; line-height:1.4; word-break:break-word;">
          ${escapeHtml(msgClean)}
        </div>
      </div>
      <button type="button" aria-label="Đóng" onclick="this.closest('div').remove();" style="border:none; background:transparent; color:#94a3b8; font-size:14px; cursor:pointer; padding:2px; margin-top:-2px;">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0) scale(1)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px) scale(0.96)';
      setTimeout(() => toast.remove(), 260);
    }, 3800);
  }

  // =====================================================================
  // 1b. HỆ THỐNG THÔNG BÁO ĐƠN HÀNG MỚI & ÂM THANH CHUÔNG BÁO (AUDIO CHIME)
  // =====================================================================
  let adminOrderSoundEnabled = localStorage.getItem('minigt_admin_order_sound') !== 'false';
  let audioCtx = null;
  let adminNotifications = [];

  function playOrderChimeSound() {
    if (!adminOrderSoundEnabled) return;
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!audioCtx) audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;

      // Nốt 1: D5 (587.33Hz)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.22, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Nốt 2: A5 (880.00Hz) - âm chuông ngân ấm
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.1);
      gain2.gain.setValueAtTime(0, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.28, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.68);
    } catch (err) {
      console.warn('Audio chime warning:', err);
    }
  }

  function toggleAdminOrderSound(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    adminOrderSoundEnabled = !adminOrderSoundEnabled;
    localStorage.setItem('minigt_admin_order_sound', String(adminOrderSoundEnabled));
    updateAdminSoundButtonState();
    if (adminOrderSoundEnabled) {
      playOrderChimeSound();
      adminToast('Đã BẬT âm thanh chuông báo có đơn hàng mới 🔔', 'success', 'Chuông Báo Đơn');
    } else {
      adminToast('Đã TẮT âm thanh chuông báo có đơn hàng mới 🔕', 'info', 'Chuông Báo Đơn');
    }
  }

  function updateAdminSoundButtonState() {
    const icon = document.getElementById('soundToggleIcon');
    const btn = document.getElementById('btnAdminSoundToggle');
    if (!icon || !btn) return;
    if (adminOrderSoundEnabled) {
      icon.className = 'fa-solid fa-volume-high';
      icon.style.color = '#059669';
      btn.title = 'Đang BẬT âm thanh chuông báo (Nhấn để tắt)';
    } else {
      icon.className = 'fa-solid fa-volume-xmark';
      icon.style.color = '#dc2626';
      btn.title = 'Đang TẮT âm thanh chuông báo (Nhấn để bật)';
    }
  }

  function loadAdminNotifications() {
    try {
      const saved = sessionStorage.getItem('minigt_admin_notifications');
      if (saved) {
        adminNotifications = JSON.parse(saved);
      }
    } catch (e) {
      adminNotifications = [];
    }
    renderAdminNotifications();
  }

  function saveAdminNotifications() {
    try {
      sessionStorage.setItem('minigt_admin_notifications', JSON.stringify(adminNotifications.slice(0, 30)));
    } catch (e) {}
  }

  function addAdminNotification(ord, type = 'ORDER_CREATED') {
    if (!ord || !ord.code) return;
    const exists = adminNotifications.some(n => n.code === ord.code && n.type === type);
    if (exists) return;

    const notif = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      code: ord.code,
      orderId: ord.id || null,
      customerName: ord.fullName || (ord.customer && ord.customer.fullName) || 'Khách hàng',
      phone: ord.phone || (ord.customer && ord.customer.phone) || '',
      total: ord.totalAmount ?? ord.total ?? 0,
      paymentMethod: ord.paymentMethod || 'COD',
      type: type,
      time: new Date().toISOString(),
      read: false
    };

    adminNotifications.unshift(notif);
    if (adminNotifications.length > 30) adminNotifications.pop();
    saveAdminNotifications();
    renderAdminNotifications();
    playOrderChimeSound();
  }

  function renderAdminNotifications() {
    const badge = document.getElementById('adminNotifBadge');
    const list = document.getElementById('adminNotifList');
    if (!list) return;

    const unreadCount = adminNotifications.filter(n => !n.read).length;
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }

    if (!adminNotifications.length) {
      list.innerHTML = `
        <div class="notif-empty-state">
          <i class="fa-regular fa-bell-slash"></i>
          <div>Chưa có thông báo đơn hàng mới nào</div>
        </div>
      `;
      return;
    }

    list.innerHTML = adminNotifications.map(n => {
      const isUnread = !n.read;
      const isTransfer = n.type === 'CUSTOMER_REPORTED_TRANSFER';
      const icon = isTransfer ? 'fa-solid fa-receipt' : 'fa-solid fa-bag-shopping';
      const iconBg = isTransfer ? '#ecfdf5' : '#eff6ff';
      const iconColor = isTransfer ? '#059669' : '#2563eb';
      const title = isTransfer ? 'Khách báo đã chuyển khoản' : 'Đơn hàng mới tạo';

      return `
        <div class="notif-item ${isUnread ? 'unread' : ''}" onclick="handleNotifItemClick('${n.code}', ${n.orderId || 'null'}, '${n.id}')">
          <div class="notif-item-icon" style="background:${iconBg}; color:${iconColor};">
            <i class="${icon}"></i>
          </div>
          <div class="notif-item-content">
            <div class="notif-item-title">
              <span>${title} <strong style="color:#e10600; font-family:monospace;">#${escapeHtml(n.code)}</strong></span>
              ${isUnread ? '<span class="notif-unread-dot" title="Chưa xem"></span>' : ''}
            </div>
            <div class="notif-item-desc">
              ${escapeHtml(n.customerName)} • <strong style="color:#0f172a;">${formatVND(n.total)}</strong>
            </div>
            <div class="notif-item-time">
              <i class="fa-regular fa-clock"></i> ${formatOrderDateTime(n.time)}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function toggleAdminNotifDropdown(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const dd = document.getElementById('adminNotifDropdown');
    if (!dd) return;
    const isShowing = dd.classList.contains('show');
    if (isShowing) {
      closeAdminNotifDropdown();
    } else {
      dd.classList.add('show');
      renderAdminNotifications();
    }
  }

  function closeAdminNotifDropdown() {
    const dd = document.getElementById('adminNotifDropdown');
    if (dd) dd.classList.remove('show');
  }

  function markAllAdminNotifsRead(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    adminNotifications.forEach(n => { n.read = true; });
    saveAdminNotifications();
    renderAdminNotifications();
    adminToast('Đã đánh dấu đã xem tất cả thông báo đơn hàng', 'info');
  }

  function handleNotifItemClick(orderCode, orderId, notifId) {
    const notif = adminNotifications.find(n => n.id === notifId);
    if (notif) notif.read = true;
    saveAdminNotifications();
    renderAdminNotifications();
    closeAdminNotifDropdown();

    if (activeTab !== 'orders') {
      switchTab('orders');
    }
    const searchInput = document.getElementById('orderSearchInput');
    if (searchInput) {
      searchInput.value = orderCode;
      handleOrderSearchDebounced(orderCode);
    }
    if (orderId) {
      setTimeout(() => {
        viewOrderDetail(orderId);
      }, 300);
    }
  }

  document.addEventListener('click', (e) => {
    const wrap = document.getElementById('adminNotifWrap');
    if (wrap && !wrap.contains(e.target)) {
      closeAdminNotifDropdown();
    }
  });

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
  // SLIM TOP PROGRESS BAR & SKELETON HELPERS
  // =====================================================================
  let adminProgressTimer = null;
  function startProgressBar() {
    const bar = document.getElementById('adminTopProgressBar');
    if (!bar) return;
    if (adminProgressTimer) clearTimeout(adminProgressTimer);
    bar.classList.remove('done');
    bar.classList.add('loading');
    bar.style.width = '30%';
    adminProgressTimer = setTimeout(() => {
      if (bar.classList.contains('loading')) {
        bar.style.width = '78%';
      }
    }, 180);
  }

  function finishProgressBar() {
    const bar = document.getElementById('adminTopProgressBar');
    if (!bar) return;
    if (adminProgressTimer) clearTimeout(adminProgressTimer);
    bar.style.width = '100%';
    setTimeout(() => {
      bar.classList.remove('loading');
      bar.classList.add('done');
      setTimeout(() => {
        bar.classList.remove('done');
        bar.style.width = '0%';
      }, 350);
    }, 140);
  }

  function renderTableSkeletons(tbodyId, columns = 8, rows = 6) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = Array(rows).fill(0).map(() => `
      <tr class="skeleton-row">
        ${Array(columns).fill(0).map((_, i) => `
          <td style="padding: 12px 14px;">
            <div class="admin-skeleton-line" style="width: ${i === 0 ? '48px; height: 48px; border-radius: 8px;' : (i === 1 ? '70px; height: 16px;' : (i === 2 ? '85%; height: 18px;' : '65%; height: 14px;'))}"></div>
          </td>
        `).join('')}
      </tr>
    `).join('');
  }

  // =====================================================================
  // 2. AUTHENTICATION & KHỞI CHẠY HỆ THỐNG
  // =====================================================================
  async function checkAdminAuth() {
    const token = localStorage.getItem('minigt_admin_token');

    // Không có token → hiển thị modal đăng nhập
    if (!token) {
      currentAdminUser = null;
      showLoginModal(false);
      return;
    }

    try {
      const res = await api.get('/api/auth/me');

      if (
        res &&
        res.success &&
        res.data &&
        String(res.data.role || res.data.Role || '').toLowerCase() === 'admin'
      ) {
        currentAdminUser = res.data;
        updateAdminProfileUI();
        hideLoginModal();
        initDashboard();
        return;
      }

      throw new Error('Tài khoản không có quyền quản trị');
    } catch (err) {
      // Nếu máy chủ hoạt động và từ chối phiên (401 Unauthorized), xóa phiên cũ và yêu cầu đăng nhập lại
      if (err.status === 401 || err.statusCode === 401) {
        api.clearAuthSession();
        currentAdminUser = null;
        showLoginModal(false);
        console.warn('[ADMIN AUTH] Phiên quản trị hết hạn hoặc không hợp lệ (401), yêu cầu đăng nhập.');
        return;
      }

      // Nếu server backend offline hoàn toàn (Network error) và đã lưu phiên offline admin hợp lệ
      const savedUser = (typeof api.getCurrentUser === 'function') ? api.getCurrentUser('/api/admin') : null;
      if (
        savedUser &&
        String(savedUser.role || savedUser.Role || '').toLowerCase() === 'admin' &&
        (token.startsWith('offline-') || token.startsWith('admin_tok_') || token.startsWith('local-'))
      ) {
        currentAdminUser = savedUser;
        updateAdminProfileUI();
        hideLoginModal();
        initDashboard();
        return;
      }

      api.clearAuthSession();
      currentAdminUser = null;
      showLoginModal(false);
      console.warn('[ADMIN AUTH]', err);
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
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Đang xác thực quyền...</span>';
    }

    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res && res.success && res.data) {
        const user = res.data.user || res.data;
        const role = String(user.role || user.Role || '').toLowerCase();
        if (role !== 'admin') {
          adminToast('Tài khoản này không có quyền Quản trị viên!', 'error');
          showLoginModal(true, user.email || email);
          return;
        }

        const token = res.data.token || res.token || ('admin_tok_' + Date.now());
        api.setAuthSession(token, user);
        currentAdminUser = user;
        adminToast(`Chào mừng Quản trị viên ${user.fullName || 'Đỗ Quốc Thịnh'}!`, 'success');
        updateAdminProfileUI();
        hideLoginModal();
        initDashboard();
        return;
      } else if (res && res.success === false) {
        throw new Error(res.message || 'Email hoặc mật khẩu không chính xác');
      }
    } catch (err) {
      // Local/Offline Fallback cho phép admin đăng nhập khi backend tạm ngắt kết nối
      const normalizedEmail = email.toLowerCase();
      const isAdminAccount = (
        normalizedEmail === 'quocthinh.admin@minigt.vn' ||
        normalizedEmail === 'admin@minigt.com' ||
        normalizedEmail === 'dinhnam.admin@minigt.vn' ||
        normalizedEmail.includes('admin')
      );
      const isAllowedAdminPw = ['admin', 'admin@2026!', 'admin@2026', 'admin123', 'admin@123', '123456', 'quocthinh', 'quocthinh123', 'doquocthinh123'].includes(password.toLowerCase());

      if (api.isLocalEnvironment() && isAdminAccount && isAllowedAdminPw) {
        const fallbackAdmin = {
          id: 3,
          userId: 3,
          fullName: normalizedEmail.includes('nam') ? 'Nguyễn Đình Nam' : 'Đỗ Quốc Thịnh (Admin)',
          email: email,
          role: 'admin',
          avatarUrl: normalizedEmail.includes('nam') ? 'image/Anh_The_Dinh_Nam.jpg' : 'image/DoQuocThinh_anhthe.jpg'
        };
        const offlineToken = 'offline-admin-token-' + Date.now();
        api.setAuthSession(offlineToken, fallbackAdmin);
        currentAdminUser = fallbackAdmin;
        adminToast('Đăng nhập Quản trị viên (Chế độ Local/Offline)!', 'success');
        updateAdminProfileUI();
        hideLoginModal();
        initDashboard();
      } else {
        adminToast(err.message || 'Email hoặc mật khẩu không chính xác', 'error');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>Đăng Nhập Quản Trị</span> <i class="fa-solid fa-arrow-right-to-bracket"></i>';
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

    const displayName = currentAdminUser.fullName || currentAdminUser.FullName || 'Đỗ Quốc Thịnh (Admin)';
    const displayEmail = currentAdminUser.email || currentAdminUser.Email || 'quocthinh.admin@minigt.vn';

    if (nameEl) nameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = displayEmail;
    if (topNameEl) topNameEl.textContent = displayName;
    const av = currentAdminUser.avatarUrl || currentAdminUser.AvatarUrl;
    if (avatarEl && av) {
      avatarEl.src = resolveAdminImageUrl(av);
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
      dashboard: t('dash_title', 'Tổng Quan Quản Trị Store'),
      products: t('prod_title', 'Quản Lý Danh Mục & Mô Hình Xe'),
      orders: t('ord_title', 'Quản Lý Đơn Hàng & Vận Đơn SPX'),
      users: t('users_title', 'Quản Lý Tài Khoản Khách Hàng'),
      coupons: t('coupons_title', 'Quản Lý Mã Giảm Giá & Voucher VIP'),
      chat: t('chat_title', 'Hỗ Trợ Khách Hàng & AI Chatbot'),
      subscribers: t('subscribers_title', 'Danh Sách Khách Hàng Nhận Bản Tin'),
      settings: t('settings_title', 'Cấu Hình Cửa Hàng & Thanh Toán VietQR'),
      about: t('about_title', 'Giới Thiệu Đề Tài & Nhóm Tác Giả Thực Hiện Dự Án')
    };
    if (titleEl) titleEl.textContent = titles[tabId] || t('default_title', 'Hệ Thống Quản Trị MINI GT');

    // Đóng sidebar nếu đang xem trên mobile
    if (window.innerWidth <= 992 && isSidebarOpen) {
      toggleSidebar();
    }

    // Tải dữ liệu tương ứng của tab
    if (tabId === 'dashboard') loadDashboard();
    else if (tabId === 'products') loadProducts();
    else if (tabId === 'orders') loadOrders();
    else if (tabId === 'users') loadUsers();
    else if (tabId === 'coupons') loadCoupons();
    else if (tabId === 'chat') loadAdminChats(true);
    else if (tabId === 'subscribers') loadSubscribers();
    else if (tabId === 'settings') loadStoreSettings();
  }

  function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!sidebar) return;
    isSidebarOpen = !isSidebarOpen;
    if (isSidebarOpen) {
      sidebar.classList.add('mobile-open');
      if (backdrop) backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      sidebar.classList.remove('mobile-open');
      if (backdrop) backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // =====================================================================
  // 4. TAB 1: DASHBOARD
  // =====================================================================
  async function loadDashboard() {
    startProgressBar();
    try {
      const res = await api.get('/api/admin/dashboard');
      if (!res.success || !res.data) return;

      const { stats, recentOrders, bestSellers } = res.data;
      cachedDashboardStats = stats;
      cachedRecentOrders = recentOrders || [];
      cachedBestSellers = bestSellers || [];

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
        const lang = localStorage.getItem('minigt_lang') || 'vi';
        lowStockNotice.textContent = lang === 'en'
          ? `${stats.lowStockProducts} models low on stock (≤5 units)`
          : `${stats.lowStockProducts} mẫu sắp hết hàng (≤5 chiếc)`;
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
      renderRecentOrdersTable(cachedRecentOrders);

      // 4. Bán chạy nhất
      renderBestSellersList(cachedBestSellers);
    } catch (err) {
      console.warn('Backend chưa khởi động hoặc chưa có dữ liệu thống kê SQL Server:', err.message);
    } finally {
      finishProgressBar();
    }
  }

  function renderDashboardStatusPills(stats) {
    const container = document.getElementById('dashboardStatusPills');
    if (!container || !stats) return;

    const items = [
      { label: t('order_status_pending', 'Chờ duyệt'), count: stats.pendingOrders || 0, status: 'PENDING', bg: '#fef3c7', color: '#b45309' },
      { label: t('order_status_confirmed', 'Đã duyệt'), count: stats.confirmedOrders || 0, status: 'CONFIRMED', bg: '#eff6ff', color: '#1d4ed8' },
      { label: t('order_status_preparing', 'Đang đóng gói'), count: stats.preparingOrders || 0, status: 'PREPARING', bg: '#f3e8ff', color: '#7e22ce' },
      { label: t('order_status_shipping', 'Đang giao SPX'), count: stats.shippingOrders || 0, status: 'SHIPPING', bg: '#ffedd5', color: '#c2410c' },
      { label: t('order_status_delivered', 'Đã giao thành công'), count: stats.deliveredOrders || 0, status: 'DELIVERED', bg: '#ecfdf5', color: '#047857' },
      { label: t('order_status_cancelled', 'Đã hủy'), count: stats.cancelledOrders || 0, status: 'CANCELLED', bg: '#fee2e2', color: '#b91c1c' }
    ];

    container.innerHTML = items.map(it => `
      <div class="dash-status-pill" style="background:${it.bg}; color:${it.color}; padding:8px 14px; border-radius:8px; display:inline-flex; align-items:center; gap:8px; font-size:12.5px; font-weight:700; cursor:pointer;" onclick="setOrderTab('${it.status}'); switchTab('orders');">
        <span>${it.label}:</span>
        <strong class="dash-pill-number" style="font-size:14px; background:#fff; padding:1px 7px; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">${it.count}</strong>
      </div>
    `).join('');
  }

  function renderRecentOrdersTable(orders) {
    const tbody = document.getElementById('recentOrdersTbody');
    if (!tbody) return;

    if (!orders || !orders.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:1.5rem; color:#64748b;">${t('no_orders_yet', 'Chưa có đơn hàng nào')}</td></tr>`;
      return;
    }

    const locale = (localStorage.getItem('minigt_lang') === 'en') ? 'en-US' : 'vi-VN';
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
        <td style="font-size:11.5px; color:#64748b;">${new Date(o.createdAt).toLocaleString(locale)}</td>
        <td>
          <button class="btn-admin btn-admin-outline" style="padding:3px 8px; font-size:11.5px;" onclick="viewOrderDetail(${o.id})">
            ${t('btn_detail', 'Chi tiết')} ➔
          </button>
        </td>
      </tr>
    `).join('');
  }

  function renderBestSellersList(items) {
    const container = document.getElementById('bestSellersContainer');
    if (!container) return;

    if (!items || !items.length) {
      container.innerHTML = `<div style="text-align:center; padding:1rem; color:#64748b; font-size:12.5px;">${t('no_sales_data', 'Chưa có dữ liệu bán hàng')}</div>`;
      return;
    }

    container.innerHTML = items.map((it, idx) => `
      <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #f1f5f9;">
        <span style="font-weight:800; font-size:14px; width:22px; color:${idx === 0 ? '#e10600' : '#64748b'};">#${idx + 1}</span>
        <img src="${resolveAdminImageUrl(it.image || it.imageUrl)}" onerror="this.onerror=null; this.src='../image/hero-banner.jpg';" alt="${escapeHtml(it.name)}" style="width:48px; height:48px; object-fit:contain; border-radius:6px; background:#f8fafc; border:1px solid #e2e8f0;">
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
  // 5. TAB 2: QUẢN LÝ SẢN PHẨM (PRODUCTS CRUD - BOX & CARD + DIRECT % DISCOUNT)
  // =====================================================================
  let productDiscountMode = 'none';

  function handleBrandChange() {
    const brandSelect = document.getElementById('prodBrand');
    const customWrapper = document.getElementById('brandCustomWrapper');
    const customInput = document.getElementById('prodBrandCustom');
    if (brandSelect && customWrapper) {
      if (brandSelect.value === 'custom') {
        customWrapper.style.display = 'block';
        if (customInput) customInput.focus();
      } else {
        customWrapper.style.display = 'none';
      }
    }
  }

  function setProductDiscountMode(mode) {
    productDiscountMode = mode === 'sale' ? 'sale' : 'none';
    const btnNone = document.getElementById('btnDiscountModeNone');
    const btnSale = document.getElementById('btnDiscountModeSale');
    const pctInput = document.getElementById('prodDiscountPercent');
    const discGroup = document.getElementById('prodDiscountGroup');
    const quickPresets = document.getElementById('discountQuickPresets');

    if (btnNone) btnNone.classList.toggle('active', productDiscountMode === 'none');
    if (btnSale) btnSale.classList.toggle('active', productDiscountMode === 'sale');

    if (productDiscountMode === 'none') {
      if (pctInput) {
        pctInput.value = '0';
        pctInput.disabled = true;
      }
      if (discGroup) discGroup.style.opacity = '0.55';
      if (quickPresets) quickPresets.style.display = 'none';
    } else {
      if (pctInput) {
        pctInput.disabled = false;
        if (!parseInt(pctInput.value) || parseInt(pctInput.value) <= 0) {
          pctInput.value = '10';
        }
      }
      if (discGroup) discGroup.style.opacity = '1';
      if (quickPresets) quickPresets.style.display = 'flex';
    }
    handleProductPriceInput();
  }

  function applyQuickDiscountPercent(pct) {
    const pctInput = document.getElementById('prodDiscountPercent');
    if (pct <= 0) {
      if (pctInput) pctInput.value = '0';
      setProductDiscountMode('none');
      return;
    }
    if (pctInput) {
      pctInput.disabled = false;
      pctInput.value = String(pct);
    }
    setProductDiscountMode('sale');
  }

  function setBoxPricePreset(price) {
    const boxInput = document.getElementById('prodPriceBox');
    const cardInput = document.getElementById('prodPriceCard');
    const packType = document.getElementById('prodPackagingType')?.value || 'both';

    const prevBox = parseFloat(boxInput?.value) || 0;
    const currentCard = parseFloat(cardInput?.value) || 0;

    if (boxInput) boxInput.value = String(price);

    if (packType === 'both') {
      // Nếu trước đó Card bằng giá Box hoặc Card chưa có thì giữ bằng giá Box
      if (currentCard === prevBox || currentCard <= 0) {
        if (cardInput) cardInput.value = String(price);
      }
    } else if (packType === 'box_only') {
      if (cardInput) cardInput.value = String(price);
    }

    handleProductPriceInput();
  }

  function setCardPriceEqualBox() {
    const boxInput = document.getElementById('prodPriceBox');
    const cardInput = document.getElementById('prodPriceCard');
    if (boxInput && cardInput) {
      const val = parseFloat(boxInput.value) || 320000;
      cardInput.value = String(val);
      handleProductPriceInput();
    }
  }

  function setCardPricePreset(price) {
    const cardInput = document.getElementById('prodPriceCard');
    const boxInput = document.getElementById('prodPriceBox');
    const packType = document.getElementById('prodPackagingType')?.value || 'both';

    if (cardInput) cardInput.value = String(price);
    if (packType === 'card_only' && boxInput) {
      boxInput.value = String(price);
    }
    handleProductPriceInput();
  }

  function addCardDiffFromBox(diff) {
    const boxInput = document.getElementById('prodPriceBox');
    const cardInput = document.getElementById('prodPriceCard');
    const baseBox = parseFloat(boxInput?.value) || 320000;
    if (boxInput && (!boxInput.value || parseFloat(boxInput.value) <= 0)) {
      boxInput.value = String(baseBox);
    }
    if (cardInput) {
      cardInput.value = String(baseBox + Number(diff));
    }
    handleProductPriceInput();
  }

  function handleStockInputs() {
    const packType = document.getElementById('prodPackagingType')?.value || 'both';
    const boxInput = document.getElementById('prodStockBox');
    const cardInput = document.getElementById('prodStockCard');
    const boxNotice = document.getElementById('stockBoxDisabledNotice');
    const cardNotice = document.getElementById('stockCardDisabledNotice');
    const badge = document.getElementById('prodTotalStockBadge');
    const hiddenStock = document.getElementById('prodStock');

    if (!boxInput || !cardInput) return;

    if (packType === 'box_only') {
      if (cardInput.value && cardInput.value !== '0') cardInput.dataset.prevVal = cardInput.value;
      cardInput.disabled = true;
      cardInput.value = '0';
      if (cardNotice) cardNotice.style.display = 'block';
      boxInput.disabled = false;
      if (boxNotice) boxNotice.style.display = 'none';
      if (boxInput.dataset.prevVal && (!boxInput.value || boxInput.value === '0')) boxInput.value = boxInput.dataset.prevVal;
    } else if (packType === 'card_only') {
      if (boxInput.value && boxInput.value !== '0') boxInput.dataset.prevVal = boxInput.value;
      boxInput.disabled = true;
      boxInput.value = '0';
      if (boxNotice) boxNotice.style.display = 'block';
      cardInput.disabled = false;
      if (cardNotice) cardNotice.style.display = 'none';
      if (cardInput.dataset.prevVal && (!cardInput.value || cardInput.value === '0')) cardInput.value = cardInput.dataset.prevVal;
    } else {
      boxInput.disabled = false;
      cardInput.disabled = false;
      if (boxNotice) boxNotice.style.display = 'none';
      if (cardNotice) cardNotice.style.display = 'none';
      if (boxInput.dataset.prevVal && (!boxInput.value || boxInput.value === '0')) {
        boxInput.value = boxInput.dataset.prevVal;
      }
      if (cardInput.dataset.prevVal && (!cardInput.value || cardInput.value === '0')) {
        cardInput.value = cardInput.dataset.prevVal;
      }
    }

    let stockBox = parseInt(boxInput.value, 10);
    if (isNaN(stockBox) || stockBox < 0) stockBox = 0;
    let stockCard = parseInt(cardInput.value, 10);
    if (isNaN(stockCard) || stockCard < 0) stockCard = 0;

    let total = 0;
    if (packType === 'box_only') {
      total = stockBox;
    } else if (packType === 'card_only') {
      total = stockCard;
    } else {
      total = stockBox + stockCard;
    }

    if (hiddenStock) hiddenStock.value = String(total);

    if (badge) {
      if (total <= 0) {
        badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Tổng tồn: 0 (Hết hàng)';
        badge.style.color = '#dc2626';
        badge.style.background = '#fef2f2';
        badge.style.borderColor = '#fecaca';
      } else {
        badge.innerHTML = `Tổng tồn: <strong>${total}</strong> chiếc (📦 ${stockBox} Box + 🛡️ ${stockCard} Card)`;
        badge.style.color = '#059669';
        badge.style.background = '#ecfdf5';
        badge.style.borderColor = '#a7f3d0';
      }
    }
  }

  function handleProductPriceInput() {
    handleStockInputs();
    const packType = document.getElementById('prodPackagingType')?.value || 'both';
    const boxInput = document.getElementById('prodPriceBox');
    const cardInput = document.getElementById('prodPriceCard');
    const pctInput = document.getElementById('prodDiscountPercent');

    const boxGroup = document.getElementById('prodBoxPriceGroup');
    const cardGroup = document.getElementById('prodCardPriceGroup');
    const boxPresetsWrap = document.getElementById('boxPresetsWrap');
    const cardDiffPresetsWrap = document.getElementById('cardDiffPresetsWrap');
    const cardDirectPresetsWrap = document.getElementById('cardDirectPresetsWrap');
    const boxDisabledNotice = document.getElementById('boxDisabledNotice');
    const cardDisabledNotice = document.getElementById('cardDisabledNotice');

    // 1. Điều phối giao diện theo Quy cách đóng gói (both, box_only, card_only)
    if (packType === 'box_only') {
      if (boxGroup) {
        boxGroup.style.opacity = '1';
        boxGroup.style.pointerEvents = 'auto';
      }
      if (boxInput) {
        boxInput.disabled = false;
        boxInput.required = true;
      }
      if (boxPresetsWrap) boxPresetsWrap.style.display = 'flex';
      if (boxDisabledNotice) boxDisabledNotice.style.display = 'none';

      if (cardGroup) {
        cardGroup.style.opacity = '0.5';
        cardGroup.style.pointerEvents = 'none';
      }
      if (cardInput) {
        cardInput.disabled = true;
        cardInput.required = false;
        cardInput.value = boxInput?.value || '320000';
      }
      if (cardDiffPresetsWrap) cardDiffPresetsWrap.style.display = 'none';
      if (cardDirectPresetsWrap) cardDirectPresetsWrap.style.display = 'none';
      if (cardDisabledNotice) cardDisabledNotice.style.display = 'block';

    } else if (packType === 'card_only') {
      if (cardGroup) {
        cardGroup.style.opacity = '1';
        cardGroup.style.pointerEvents = 'auto';
      }
      if (cardInput) {
        cardInput.disabled = false;
        cardInput.required = true;
      }
      if (cardDiffPresetsWrap) cardDiffPresetsWrap.style.display = 'none';
      if (cardDirectPresetsWrap) cardDirectPresetsWrap.style.display = 'flex';
      if (cardDisabledNotice) cardDisabledNotice.style.display = 'none';

      if (boxGroup) {
        boxGroup.style.opacity = '0.5';
        boxGroup.style.pointerEvents = 'none';
      }
      if (boxInput) {
        boxInput.disabled = true;
        boxInput.required = false;
        boxInput.value = cardInput?.value || '380000';
      }
      if (boxPresetsWrap) boxPresetsWrap.style.display = 'none';
      if (boxDisabledNotice) boxDisabledNotice.style.display = 'block';

    } else {
      // 'both'
      if (boxGroup) {
        boxGroup.style.opacity = '1';
        boxGroup.style.pointerEvents = 'auto';
      }
      if (boxInput) {
        boxInput.disabled = false;
        boxInput.required = true;
      }
      if (boxPresetsWrap) boxPresetsWrap.style.display = 'flex';
      if (boxDisabledNotice) boxDisabledNotice.style.display = 'none';

      if (cardGroup) {
        cardGroup.style.opacity = '1';
        cardGroup.style.pointerEvents = 'auto';
      }
      if (cardInput) {
        cardInput.disabled = false;
        cardInput.required = true;
      }
      if (cardDiffPresetsWrap) cardDiffPresetsWrap.style.display = 'flex';
      if (cardDirectPresetsWrap) cardDirectPresetsWrap.style.display = 'none';
      if (cardDisabledNotice) cardDisabledNotice.style.display = 'none';
    }

    // 2. Đọc giá trị
    let priceBox = parseFloat(boxInput?.value) || 0;
    let priceCard = parseFloat(cardInput?.value) || 0;

    if (packType === 'card_only') {
      if (priceCard <= 0) priceCard = 380000;
      priceBox = priceCard;
      if (boxInput) boxInput.value = String(priceBox);
    } else if (packType === 'box_only') {
      if (priceBox <= 0) priceBox = 320000;
      priceCard = priceBox;
      if (cardInput) cardInput.value = String(priceCard);
    } else {
      if (priceBox <= 0) priceBox = 320000;
      if (priceCard <= 0) {
        priceCard = priceBox;
        if (cardInput) cardInput.value = String(priceCard);
      }
    }

    // 3. Xử lý % giảm giá
    let rawPct = parseInt(pctInput?.value) || 0;
    if (rawPct < 0) rawPct = 0;
    if (rawPct > 80) rawPct = 80;

    if (rawPct > 0 && productDiscountMode !== 'sale') {
      productDiscountMode = 'sale';
      document.getElementById('btnDiscountModeNone')?.classList.remove('active');
      document.getElementById('btnDiscountModeSale')?.classList.add('active');
      if (pctInput) pctInput.disabled = false;
      const discGroup = document.getElementById('prodDiscountGroup');
      if (discGroup) discGroup.style.opacity = '1';
    }

    const activePct = productDiscountMode === 'sale' ? rawPct : 0;

    // 4. Tính toán giá thực thu sau khi trừ trực tiếp %
    const finalBox = activePct > 0
      ? Math.round((priceBox * (100 - activePct) / 100) / 1000) * 1000
      : priceBox;
    const finalCard = activePct > 0
      ? Math.round((priceCard * (100 - activePct) / 100) / 1000) * 1000
      : priceCard;

    // Đồng bộ vào input ẩn #prodPrice & #prodOldPrice để tương thích ngược API & database
    const hiddenPrice = document.getElementById('prodPrice');
    const hiddenOld = document.getElementById('prodOldPrice');
    const baseMain = packType === 'card_only' ? priceCard : priceBox;
    const finalMain = packType === 'card_only' ? finalCard : finalBox;
    if (hiddenPrice) hiddenPrice.value = finalMain || 0;
    if (hiddenOld) hiddenOld.value = activePct > 0 ? baseMain : '';

    // Cập nhật badge %
    const badge = document.getElementById('prodDiscountPreviewBadge');
    if (badge) {
      if (activePct <= 0) {
        badge.style.color = '#059669';
        badge.textContent = '✓ Không giảm giá (0%)';
      } else {
        badge.style.color = '#dc2626';
        badge.textContent = `🔥 Giảm trực tiếp -${activePct}%`;
      }
    }

    // 5. Render bảng tính trực tiếp #prodLivePriceSummary phân định rõ ràng 100% từng bản
    const summaryEl = document.getElementById('prodLivePriceSummary');
    if (summaryEl) {
      const statusBanner = activePct > 0
        ? `<div style="display:flex; align-items:center; justify-content:space-between; background:#fef2f2; border:1px solid #fecaca; padding:7px 12px; border-radius:7px; color:#b91c1c; font-weight:700; font-size:12px; margin-bottom:8px;">
             <span><i class="fa-solid fa-fire" style="margin-right:6px;"></i> Giảm giá trực tiếp <strong>-${activePct}%</strong> trừ thẳng vào tiền thanh toán</span>
             <span style="font-size:11px; background:#fee2e2; padding:2px 8px; border-radius:4px; color:#991b1b;">Auto trừ giá</span>
           </div>`
        : `<div style="display:flex; align-items:center; justify-content:space-between; background:#f0fdf4; border:1px solid #bbf7d0; padding:7px 12px; border-radius:7px; color:#15803d; font-weight:700; font-size:12px; margin-bottom:8px;">
             <span><i class="fa-solid fa-tag" style="margin-right:6px;"></i> Áp dụng Giá niêm yết chuẩn (Không áp dụng giảm %)</span>
             <span style="font-size:11px; background:#dcfce7; padding:2px 8px; border-radius:4px; color:#166534;">Giá gốc</span>
           </div>`;

      const boxBlock = (packType !== 'card_only') ? `
        <div style="background:#ffffff; border:1.5px solid ${activePct > 0 ? '#10b981' : '#e2e8f0'}; border-radius:8px; padding:10px 14px; flex:1; min-width:210px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
            <span style="font-weight:800; color:#0f172a; font-size:12.5px;"><i class="fa-solid fa-cube" style="color:#0284c7; margin-right:4px;"></i> BẢN BOX (Hộp giấy)</span>
            ${activePct > 0 ? `<span style="background:#dcfce7; color:#15803d; font-weight:800; font-size:10.5px; padding:2px 7px; border-radius:99px;">-${activePct}%</span>` : ''}
          </div>
          <div style="display:flex; align-items:baseline; gap:8px;">
            <span style="font-size:16px; font-weight:900; color:#059669;">${formatVND(finalBox)}</span>
            ${activePct > 0 ? `<span style="font-size:12px; color:#94a3b8; text-decoration:line-through;">${formatVND(priceBox)}</span>` : ''}
          </div>
          <div style="font-size:11px; color:#64748b; margin-top:3px;">
            ${activePct > 0 ? `Tiết kiệm được: <strong style="color:#059669;">${formatVND(priceBox - finalBox)}</strong>` : 'Giá thực thu khi khách đặt mua'}
          </div>
        </div>
      ` : '';

      const cardBlock = (packType !== 'box_only') ? `
        <div style="background:#ffffff; border:1.5px solid ${activePct > 0 ? '#3b82f6' : '#e2e8f0'}; border-radius:8px; padding:10px 14px; flex:1; min-width:210px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
            <span style="font-weight:800; color:#0f172a; font-size:12.5px;"><i class="fa-solid fa-shield-halved" style="color:#2563eb; margin-right:4px;"></i> BẢN CARD (Vỉ Blister)</span>
            ${activePct > 0 ? `<span style="background:#dbeafe; color:#1d4ed8; font-weight:800; font-size:10.5px; padding:2px 7px; border-radius:99px;">-${activePct}%</span>` : ''}
          </div>
          <div style="display:flex; align-items:baseline; gap:8px;">
            <span style="font-size:16px; font-weight:900; color:#2563eb;">${formatVND(finalCard)}</span>
            ${activePct > 0 ? `<span style="font-size:12px; color:#94a3b8; text-decoration:line-through;">${formatVND(priceCard)}</span>` : ''}
          </div>
          <div style="font-size:11px; color:#64748b; margin-top:3px;">
            ${packType === 'both' ? `Chênh lệch so với Box: <strong style="color:#2563eb;">+${formatVND(finalCard - finalBox)}</strong>` : (activePct > 0 ? `Tiết kiệm: <strong style="color:#2563eb;">${formatVND(priceCard - finalCard)}</strong>` : 'Giá thực thu khi khách đặt mua')}
          </div>
        </div>
      ` : '';

      summaryEl.innerHTML = `
        <div style="display:flex; flex-direction:column; width:100%;">
          ${statusBanner}
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:10px;">
            ${boxBlock}
            ${cardBlock}
          </div>
        </div>
      `;
    }
  }

  function autoCalcProductDeposit(rate = 0.3) {
    const packType = document.getElementById('prodPackagingType')?.value || 'both';
    const boxInput = document.getElementById('prodPriceBox');
    const cardInput = document.getElementById('prodPriceCard');
    const targetBase = packType === 'card_only' ? (parseFloat(cardInput?.value) || 0) : (parseFloat(boxInput?.value) || 0);
    const depInput = document.getElementById('prodDeposit');

    if (!targetBase || targetBase <= 0) {
      adminToast('Vui lòng nhập giá mô hình trước khi tự tính tiền cọc!', 'error');
      return;
    }
    const calc = Math.round((targetBase * rate) / 5000) * 5000;
    if (depInput) depInput.value = calc;
    adminToast(`Đã tự động tính tiền cọc ${Math.round(rate * 100)}%: ${formatVND(calc)}`, 'info');
  }

  async function loadProducts() {
    startProgressBar();
    renderTableSkeletons('productsTbody', 9, 6);
    try {
      const queryParams = { ...productFilter };
      // Nếu admin không bật "Hiện SP đã ẩn" thì mặc định ẩn đi
      if (!queryParams.showHidden || queryParams.showHidden === '0') {
        delete queryParams.showHidden;
      }
      const res = await api.get('/api/admin/products', queryParams);
      if (res.success && res.data) {
        cachedProducts = res.data;
        renderProductsTable(cachedProducts);
        renderProductsPagination(res.pagination);
      }
    } catch (err) {
      adminToast('Không thể tải danh sách sản phẩm: ' + err.message, 'error');
    } finally {
      finishProgressBar();
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
    const showHiddenCb = document.getElementById('prodShowHiddenFilter');
    productFilter.showHidden = showHiddenCb?.checked ? '1' : '0';
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

    tbody.innerHTML = products.map(rawP => {
      const p = api.normalizeProductObject ? api.normalizeProductObject(rawP) : rawP;
      const imgPath = resolveAdminImageUrl(p.image || p.imageUrl || p.ImageUrl);
      const statusBadge = p.status === 'pre_order'
        ? '<span class="status-badge" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;">Pre-Order</span>'
        : (p.status === 'sold_out' || p.stock <= 0
          ? '<span class="status-badge" style="background:#fee2e2; color:#b91c1c; border:1px solid #fecaca;">Hết hàng</span>'
          : '<span class="status-badge" style="background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;">Có sẵn</span>');

      const stockBadge = p.stock <= 0
        ? '<span style="color:#dc2626; font-weight:800;">0 (Hết)</span>'
        : (p.stock <= 5
          ? `<span style="color:#d97706; font-weight:700;">⚠️ ${p.stock} (Sắp hết)</span>`
          : `<span style="color:#059669; font-weight:600;">${p.stock}</span>`);

      const discountPct = Number(p.discountPercent) || 0;
      const finalBox = p.finalPriceBox || p.priceBox || p.price;
      const finalCard = p.finalPriceCard || p.priceCard || (finalBox + 60000);
      const packBadge = p.packagingType === 'box_only'
        ? '<span style="background:#ecfdf5; color:#047857; padding:1px 6px; border-radius:4px; font-size:10px; font-weight:700;">Chỉ Box</span>'
        : (p.packagingType === 'card_only'
          ? '<span style="background:#eff6ff; color:#1d4ed8; padding:1px 6px; border-radius:4px; font-size:10px; font-weight:700;">Chỉ Card</span>'
          : '<span style="background:#f1f5f9; color:#334155; padding:1px 6px; border-radius:4px; font-size:10px; font-weight:700;">Box & Card</span>');

      const rawB = p.stockBox ?? p.StockBox ?? p.stockbox;
      const rawC = p.stockCard ?? p.StockCard ?? p.stockcard;
      const stockBoxVal = rawB != null ? Number(rawB) : (p.packagingType === 'card_only' ? 0 : Math.ceil(p.stock / 2));
      const stockCardVal = rawC != null ? Number(rawC) : (p.packagingType === 'box_only' ? 0 : Math.floor(p.stock / 2));

      // Phân định dòng giá Box
      let boxPriceRow = '';
      if (p.packagingType === 'card_only') {
        boxPriceRow = '<div style="color:#94a3b8; font-size:11px; text-decoration:line-through;"><span style="color:#94a3b8;">📦 Box:</span> <em>(Không bán Box)</em></div>';
      } else if (stockBoxVal <= 0) {
        boxPriceRow = `<div><span style="text-decoration:line-through; color:#dc2626; font-size:11.5px;">📦 Box: ${formatVND(finalBox)}</span> <span style="background:#fee2e2; color:#b91c1c; font-size:9.5px; padding:1px 4px; border-radius:3px; font-weight:800;">Hết Box</span></div>`;
      } else {
        boxPriceRow = `<div><span style="color:#64748b; font-size:11px;">📦 Box:</span> <strong style="color:#0f172a;">${formatVND(finalBox)}</strong> ${discountPct > 0 ? `<span style="color:#94a3b8; text-decoration:line-through; font-size:10.5px;">${formatVND(p.priceBox)}</span>` : ''}</div>`;
      }

      // Phân định dòng giá Card
      let cardPriceRow = '';
      if (p.packagingType === 'box_only') {
        cardPriceRow = '<div style="color:#94a3b8; font-size:11px; text-decoration:line-through;"><span style="color:#94a3b8;">🛡️ Card:</span> <em>(Không bán Card)</em></div>';
      } else if (stockCardVal <= 0) {
        cardPriceRow = `<div><span style="text-decoration:line-through; color:#dc2626; font-size:11.5px;">🛡️ Card: ${formatVND(finalCard)}</span> <span style="background:#fee2e2; color:#b91c1c; font-size:9.5px; padding:1px 4px; border-radius:3px; font-weight:800;">Hết Card</span></div>`;
      } else {
        cardPriceRow = `<div><span style="color:#64748b; font-size:11px;">🛡️ Card:</span> <strong style="color:#1d4ed8;">${formatVND(finalCard)}</strong> ${discountPct > 0 ? `<span style="color:#94a3b8; text-decoration:line-through; font-size:10.5px;">${formatVND(p.priceCard)}</span>` : ''}</div>`;
      }

      // Phân định Tồn kho chi tiết thực tế
      let stockDetailHtml = '';
      if (p.packagingType === 'box_only') {
        stockDetailHtml = `<div style="font-size:10.5px; margin-top:2px;">📦 <strong style="color:#059669;">${stockBoxVal}</strong> Box &bull; <del style="color:#94a3b8;">Card: 0</del></div>`;
      } else if (p.packagingType === 'card_only') {
        stockDetailHtml = `<div style="font-size:10.5px; margin-top:2px;"><del style="color:#94a3b8;">Box: 0</del> &bull; 🛡️ <strong style="color:#1d4ed8;">${stockCardVal}</strong> Card</div>`;
      } else {
        stockDetailHtml = `
          <div style="font-size:10.5px; margin-top:2px; display:flex; gap:4px; align-items:center;">
            <span style="${stockBoxVal <= 0 ? 'text-decoration:line-through; color:#dc2626;' : 'color:#059669; font-weight:700;'}">📦 ${stockBoxVal} Box</span>
            <span style="color:#cbd5e1;">&bull;</span>
            <span style="${stockCardVal <= 0 ? 'text-decoration:line-through; color:#dc2626;' : 'color:#1d4ed8; font-weight:700;'}">🛡️ ${stockCardVal} Card</span>
          </div>
        `;
      }

      const tags = [packBadge];
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
            <div style="font-size:12px; line-height:1.45;">
              ${boxPriceRow}
              ${cardPriceRow}
            </div>
            ${discountPct > 0
              ? `<div style="margin-top:2px;"><span style="background:#fee2e2; color:#dc2626; padding:1px 6px; border-radius:4px; font-weight:800; font-size:10px;">🔥 Đang giảm -${discountPct}%</span></div>`
              : `<div style="font-size:10px; color:#059669; font-weight:700; margin-top:2px;">Giá niêm yết (0%)</div>`}
          </td>
          <td>
            ${stockBadge}
            ${stockDetailHtml}
          </td>
          <td>${statusBadge}</td>
          <td><div style="display:flex; flex-wrap:wrap; gap:4px;">${tags.join(' ')}</div></td>
          <td style="text-align:right; white-space:nowrap;">
            ${(p.status === 'pre_order' || p.Status === 'pre_order') ? `
              <button class="btn-admin btn-admin-outline" style="padding:4px 8px; font-size:11px; color:#d97706; border-color:#f59e0b; background:#fffbeb;" onclick="convertPreOrderProductToInStock(${p.id}, '${escapeHtml(p.name)}')" title="Báo hàng về kho: Đổi sang hàng thường có sẵn">
                <i class="fa-solid fa-boxes-packing"></i> Hàng Về
              </button>
            ` : ''}
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

  // =====================================================================
  // QUẢN LÝ DANH MỤC ĐỘNG & TẠO DANH MỤC MỚI INLINE
  // =====================================================================
  let cachedCategories = [];

  async function loadCategories() {
    try {
      const res = await api.get('/api/categories');
      if (res && res.success && Array.isArray(res.data)) {
        cachedCategories = res.data;
        renderCategoryOptions(cachedCategories);
      }
    } catch (e) {
      console.warn('Không thể tải danh mục từ API:', e);
    }
  }

  function renderCategoryOptions(categories) {
    if (!Array.isArray(categories) || !categories.length) return;

    // 1. Dropdown trong Modal Thêm/Sửa sản phẩm
    const prodCatSelect = document.getElementById('prodCategory');
    if (prodCatSelect) {
      const currentVal = prodCatSelect.value;
      prodCatSelect.innerHTML = categories.map(c => `
        <option value="${c.id || c.CategoryId}">${escapeHtml(c.name || c.Name)}</option>
      `).join('');
      if (currentVal && categories.some(c => String(c.id || c.CategoryId) === String(currentVal))) {
        prodCatSelect.value = currentVal;
      }
    }

    // 2. Dropdown bộ lọc Danh mục trên thanh Toolbar bảng sản phẩm
    const filterSelect = document.getElementById('prodCategoryFilter');
    if (filterSelect) {
      const currentFilterVal = filterSelect.value;
      filterSelect.innerHTML = `
        <option value="all">-- Tất cả danh mục --</option>
        ${categories.map(c => `<option value="${escapeHtml(c.slug || c.Slug)}">${escapeHtml(c.name || c.Name)}</option>`).join('')}
      `;
      if (currentFilterVal) filterSelect.value = currentFilterVal;
    }
  }

  function toggleAddCategoryInline(forceOpen) {
    const wrap = document.getElementById('newCategoryInlineWrap');
    if (!wrap) return;
    const shouldOpen = (forceOpen !== undefined) ? forceOpen : (wrap.style.display === 'none' || !wrap.style.display);
    wrap.style.display = shouldOpen ? 'block' : 'none';
    if (shouldOpen) {
      const nameInput = document.getElementById('newCategoryNameInput');
      if (nameInput) {
        nameInput.value = '';
        setTimeout(() => nameInput.focus(), 50);
      }
      const slugInput = document.getElementById('newCategorySlugInput');
      if (slugInput) slugInput.value = '';
    }
  }

  async function submitNewCategoryInline() {
    const nameInput = document.getElementById('newCategoryNameInput');
    const slugInput = document.getElementById('newCategorySlugInput');
    const name = nameInput?.value.trim();
    if (!name) {
      adminToast('Vui lòng nhập tên danh mục mới!', 'error');
      nameInput?.focus();
      return;
    }
    const cleanSlug = (slugInput?.value.trim()) || name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    try {
      const res = await api.post('/api/admin/categories', {
        name,
        slug: cleanSlug
      });

      if (res && res.success) {
        adminToast(`Đã thêm danh mục "${name}" thành công!`, 'success');
        const newCat = res.data || { id: Date.now(), name, slug: cleanSlug };
        if (!cachedCategories.some(c => (c.slug || c.Slug) === cleanSlug || (c.id && c.id == newCat.id))) {
          cachedCategories.push(newCat);
        }
        renderCategoryOptions(cachedCategories);

        const prodCatSelect = document.getElementById('prodCategory');
        if (prodCatSelect) {
          prodCatSelect.value = String(newCat.id || newCat.CategoryId);
        }
        toggleAddCategoryInline(false);
      } else {
        adminToast(res.message || 'Lỗi thêm danh mục', 'error');
      }
    } catch (err) {
      adminToast('Không thể thêm danh mục: ' + err.message, 'error');
    }
  }

  // =====================================================================
  // LIÊN KẾT TỰ ĐỘNG 2 CHIỀU % CỌC & SỐ TIỀN VNĐ PRE-ORDER
  // =====================================================================
  function getEffectiveDiscountedPrice() {
    const packType = document.getElementById('prodPackagingType')?.value || 'both';
    const priceBox = parseFloat(document.getElementById('prodPriceBox')?.value) || 0;
    const priceCard = parseFloat(document.getElementById('prodPriceCard')?.value) || 0;
    const isDiscount = (typeof productDiscountMode !== 'undefined' && productDiscountMode === 'sale');
    const discountPercent = isDiscount ? Math.max(0, Math.min(80, parseInt(document.getElementById('prodDiscountPercent')?.value, 10) || 0)) : 0;

    const finalPriceBox = discountPercent > 0 ? Math.round((priceBox * (100 - discountPercent) / 100) / 1000) * 1000 : priceBox;
    const finalPriceCard = discountPercent > 0 ? Math.round((priceCard * (100 - discountPercent) / 100) / 1000) * 1000 : priceCard;

    return packType === 'card_only' ? (finalPriceCard > 0 ? finalPriceCard : finalPriceBox) : (finalPriceBox > 0 ? finalPriceBox : finalPriceCard);
  }

  function handleProductStatusChange() {
    const status = document.getElementById('prodStatus')?.value;
    const preOrderCard = document.getElementById('preOrderConfigCard');
    if (!preOrderCard) return;

    const pctInput = document.getElementById('prodDepositPercent');
    const amtInput = document.getElementById('prodDepositAmount');
    const monthInput = document.getElementById('prodExpectedMonth');
    const yearInput = document.getElementById('prodExpectedYear');
    const legacyInput = document.getElementById('prodDeposit');

    if (status === 'pre_order') {
      preOrderCard.style.display = 'block';
      if (pctInput) {
        pctInput.disabled = false;
        let val = parseInt(pctInput.value, 10);
        if (isNaN(val) || val < 10 || val > 100) {
          pctInput.value = 30;
        }
      }
      if (amtInput) amtInput.disabled = false;
      if (monthInput) monthInput.disabled = false;
      if (yearInput) yearInput.disabled = false;
      updateExpectedDeliveryString();
      syncDepositPercentToAmount();
    } else {
      preOrderCard.style.display = 'none';
      if (pctInput) {
        pctInput.value = 0;
        pctInput.disabled = true;
      }
      if (amtInput) {
        amtInput.value = 0;
        amtInput.disabled = true;
      }
      if (monthInput) monthInput.disabled = true;
      if (yearInput) yearInput.disabled = true;
      if (legacyInput) legacyInput.value = 0;
    }
  }

  function updateExpectedDeliveryString() {
    const month = document.getElementById('prodExpectedMonth')?.value || '11';
    const year = document.getElementById('prodExpectedYear')?.value || '2026';
    const str = `Tháng ${String(month).padStart(2, '0')}/${year} (Có thể trễ hơn dự kiến)`;
    const hidden = document.getElementById('prodExpectedDelivery');
    const preview = document.getElementById('lblExpectedDeliveryPreview');
    if (hidden) hidden.value = str;
    if (preview) preview.textContent = str;
  }

  function setDepositPercentPreset(pct) {
    const pctInput = document.getElementById('prodDepositPercent');
    if (pctInput) {
      pctInput.value = Math.min(100, Math.max(10, pct));
      syncDepositPercentToAmount();
    }
  }

  function syncDepositPercentToAmount() {
    const pctInput = document.getElementById('prodDepositPercent');
    if (!pctInput) return;
    let pct = parseInt(pctInput.value, 10);
    if (isNaN(pct) || pct < 10) pct = 10;
    if (pct > 100) pct = 100;
    pctInput.value = pct;

    const basePrice = getEffectiveDiscountedPrice();
    const depAmt = basePrice > 0 ? Math.round((basePrice * (pct / 100)) / 1000) * 1000 : 0;

    const amtInput = document.getElementById('prodDepositAmount');
    if (amtInput) amtInput.value = depAmt;

    const legacyInput = document.getElementById('prodDeposit');
    if (legacyInput) legacyInput.value = depAmt;
  }

  function syncDepositAmountToPercent() {
    const amtInput = document.getElementById('prodDepositAmount');
    if (!amtInput) return;
    const basePrice = getEffectiveDiscountedPrice();
    let amt = parseFloat(amtInput.value) || 0;

    if (basePrice > 0) {
      if (amt > basePrice) {
        amt = basePrice;
        amtInput.value = amt;
      }
      if (amt < 0) {
        amt = 0;
        amtInput.value = 0;
      }
      const pct = Math.min(100, Math.max(10, Math.round((amt / basePrice) * 100)));
      const pctInput = document.getElementById('prodDepositPercent');
      if (pctInput) pctInput.value = pct;
    }

    const legacyInput = document.getElementById('prodDeposit');
    if (legacyInput) legacyInput.value = amt;
  }

  function openAddProductModal() {
    const form = document.getElementById('productForm');
    if (form) form.reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('productModalTitle').textContent = t('prod_modal_add_title', 'Thêm Mô Hình Xe Mới (Cấu hình Box & Card)');
    const carEl = document.getElementById('prodCarNumber');
    if (carEl) carEl.value = '';

    const brandEl = document.getElementById('prodBrand');
    if (brandEl) brandEl.value = 'MINI GT';
    handleBrandChange();

    const packEl = document.getElementById('prodPackagingType');
    if (packEl) packEl.value = 'both';
    const boxEl = document.getElementById('prodPriceBox');
    if (boxEl) boxEl.value = '380000';
    const cardEl = document.getElementById('prodPriceCard');
    if (cardEl) cardEl.value = '440000';

    const stockBoxEl = document.getElementById('prodStockBox');
    if (stockBoxEl) stockBoxEl.value = '12';
    const stockCardEl = document.getElementById('prodStockCard');
    if (stockCardEl) stockCardEl.value = '8';

    setProductDiscountMode('none');
    handleProductPriceInput();
    handleStockInputs();

    const stEl = document.getElementById('prodStatus');
    if (stEl) stEl.value = 'in_stock';
    const mEl = document.getElementById('prodExpectedMonth');
    const yEl = document.getElementById('prodExpectedYear');
    const dpEl = document.getElementById('prodDepositPercent');
    if (mEl) mEl.value = '11';
    if (yEl) yEl.value = '2026';
    if (dpEl) dpEl.value = '30';
    handleProductStatusChange();

    const fi = document.getElementById('prodImageFileInput');
    if (fi) fi.value = '';
    const imgEl = document.getElementById('prodImage');
    if (imgEl) imgEl.value = 'image/hero-banner.jpg';
    updateProductImagePreview('image/hero-banner.jpg');
    document.getElementById('productModal').classList.add('active');
  }

  async function openEditProductModal(productId) {
    try {
      const res = await api.get(`/api/admin/products/${productId}`);
      if (!res || !res.success || !res.data) {
        throw new Error(res?.message || 'Không tìm thấy dữ liệu mô hình xe');
      }
      const raw = res.data;
      const p = api.normalizeProductObject ? api.normalizeProductObject(raw) : raw;

      const pid = p.id || p.ProductId || productId;
      document.getElementById('editProductId').value = pid;
      document.getElementById('productModalTitle').textContent = `${t('prod_modal_edit_title', 'Chỉnh Sửa Mô Hình')}: #${p.sku || p.Sku || pid}`;

      document.getElementById('prodSku').value = p.sku || p.Sku || '';
      const carEditEl = document.getElementById('prodCarNumber');
      if (carEditEl) {
        carEditEl.value = p.carNumber || p.CarNumber || ((p.sku || p.Sku) ? String(p.sku || p.Sku).replace(/\D/g, '') : '');
      }
      document.getElementById('prodName').value = p.name || p.Name || '';

      // Xử lý danh mục an toàn 100%
      const catVal = p.category?.id || p.categoryId || p.CategoryId || 1;
      const catSelect = document.getElementById('prodCategory');
      if (catSelect) {
        catSelect.value = String(catVal);
      }

      // Xử lý Thương hiệu
      const brandVal = p.brand || p.Brand || 'MINI GT';
      const brandEl = document.getElementById('prodBrand');
      const customWrapper = document.getElementById('brandCustomWrapper');
      const customInput = document.getElementById('prodBrandCustom');
      const knownBrands = ['MINI GT', 'Pop Race', 'Kaido House', 'TSM-Model', 'Inno64', 'Tarmac Works', 'Hobby Japan', 'Sparky', 'Trends Hobby', 'Hot Wheels Premium'];
      if (knownBrands.includes(brandVal)) {
        if (brandEl) brandEl.value = brandVal;
        if (customWrapper) customWrapper.style.display = 'none';
      } else {
        if (brandEl) brandEl.value = 'custom';
        if (customWrapper) customWrapper.style.display = 'block';
        if (customInput) customInput.value = brandVal;
      }

      document.getElementById('prodScale').value = p.scale || p.Scale || '1:64';

      const packEl = document.getElementById('prodPackagingType');
      if (packEl) packEl.value = p.packagingType || p.PackagingType || 'both';

      const boxPriceVal = p.priceBox ?? p.PriceBox ?? p.price ?? p.Price ?? 380000;
      const boxEl = document.getElementById('prodPriceBox');
      if (boxEl) boxEl.value = boxPriceVal;

      const cardPriceVal = p.priceCard ?? p.PriceCard ?? ((Number(boxPriceVal) || 380000) + 60000);
      const cardEl = document.getElementById('prodPriceCard');
      if (cardEl) cardEl.value = cardPriceVal;

      const discountPct = Number(p.discountPercent ?? p.DiscountPercent ?? 0);
      const pctInput = document.getElementById('prodDiscountPercent');
      if (discountPct > 0) {
        if (pctInput) {
          pctInput.disabled = false;
          pctInput.value = String(discountPct);
        }
        setProductDiscountMode('sale');
      } else {
        if (pctInput) pctInput.value = '0';
        setProductDiscountMode('none');
      }
      handleProductPriceInput();

      document.getElementById('prodEdition').value = p.editionNote || p.EditionNote || '';
      document.getElementById('prodStatus').value = p.status || p.Status || 'in_stock';

      // Cấu hình Pre-Order dự kiến hàng về & % cọc
      const expStr = p.expectedDelivery || p.ExpectedDelivery || '';
      if (expStr) {
        const mMatch = expStr.match(/(\d{1,2})\/(\d{4})/);
        if (mMatch) {
          const mVal = parseInt(mMatch[1], 10);
          const yVal = mMatch[2];
          const mEl = document.getElementById('prodExpectedMonth');
          const yEl = document.getElementById('prodExpectedYear');
          if (mEl) mEl.value = String(mVal);
          if (yEl) yEl.value = yVal;
        }
      }
      const isPre = (p.status || p.Status) === 'pre_order';
      const dpInput = document.getElementById('prodDepositPercent');
      if (dpInput) dpInput.value = isPre ? (p.depositPercent ?? p.DepositPercent ?? 30) : 0;
      const amtInput = document.getElementById('prodDepositAmount');
      if (amtInput) amtInput.value = isPre ? (p.depositAmount ?? p.DepositAmount ?? '') : 0;
      const legacyDep = document.getElementById('prodDeposit');
      if (legacyDep) legacyDep.value = isPre ? (p.depositAmount ?? p.DepositAmount ?? 0) : 0;
      handleProductStatusChange();

      // Điền số lượng tồn kho Box & Card thực tế kiểm hàng
      const stockBoxInput = document.getElementById('prodStockBox');
      const stockCardInput = document.getElementById('prodStockCard');
      const rawStock = Number(p.stock ?? p.Stock ?? 0);
      const rawB = p.stockBox ?? p.StockBox ?? p.stockbox;
      const rawC = p.stockCard ?? p.StockCard ?? p.stockcard;
      const sBox = rawB != null ? Number(rawB) : (p.packagingType === 'card_only' ? 0 : Math.ceil(rawStock / 2));
      const sCard = rawC != null ? Number(rawC) : (p.packagingType === 'box_only' ? 0 : Math.floor(rawStock / 2));
      if (stockBoxInput) stockBoxInput.value = sBox;
      if (stockCardInput) stockCardInput.value = sCard;
      handleStockInputs();

      const imgVal = p.image || p.imageUrl || p.ImageUrl || '';
      document.getElementById('prodImage').value = imgVal;
      document.getElementById('prodDesc').value = p.description || p.Description || '';
      document.getElementById('prodIsFeatured').checked = !!(p.isFeatured ?? p.IsFeatured);
      document.getElementById('prodIsNew').checked = !!(p.isNew ?? p.IsNew);

      updateProductImagePreview(imgVal);
      document.getElementById('productModal').classList.add('active');
    } catch (err) {
      adminToast('Không thể tải chi tiết sản phẩm: ' + err.message, 'error');
    }
  }

  function resolveAdminImageUrl(url) {
    if (!url) return '../image/hero-banner.jpg';
    let clean = String(url).trim();
    // Loại bỏ các tiền tố ../ hoặc ./ nếu đã bị nối thừa
    clean = clean.replace(/^(?:\.\.\/|\.\/)+/, '');

    const isLocal = typeof api !== 'undefined' && typeof api.isLocalEnvironment === 'function'
      ? api.isLocalEnvironment()
      : (window.location && (['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname) || window.location.protocol === 'file:'));

    // Bắt mọi biến thể đường dẫn /api/images/:id, api/images/:id, images/:id
    const apiMatch = clean.match(/^(?:https?:\/\/[^\/]+(?::\d+)?)?\/?(?:api\/)?images\/(\d+)(?:\?.*)?$/i);
    if (apiMatch) {
      const imgId = apiMatch[1];
      // Khi chạy trên Vercel hoặc chính cổng 5000:
      if (!isLocal || (window.location && String(window.location.port) === '5000')) {
        return `/api/images/${imgId}`;
      }
      // Khi đang chạy Live Server (5500, 5501...), cổng backend phục vụ ảnh là 5000:
      const host = (window.location && window.location.hostname && window.location.hostname !== '0.0.0.0' && window.location.protocol !== 'file:')
        ? window.location.hostname
        : '127.0.0.1';
      return `http://${host}:5000/api/images/${imgId}`;
    }

    if (clean.startsWith('http://127.0.0.1:5000/') || clean.startsWith('http://localhost:5000/')) {
      if (!isLocal) {
        return clean.replace(/^https?:\/\/[^\/]+/, '');
      }
    }

    if (clean.startsWith('data:') || clean.startsWith('blob:') || clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }
    return '../' + clean.replace(/^\/+/, '');
  }
  window.resolveAdminImageUrl = resolveAdminImageUrl;

  function openProductImagePicker(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }
    const fi = document.getElementById('prodImageFileInput');
    if (fi) {
      fi.value = ''; // Luôn xóa cache để cho phép chọn lại cùng file
      fi.click();
    }
  }
  window.openProductImagePicker = openProductImagePicker;

  function updateProductImagePreview(url) {
    const img = document.getElementById('prodImagePreview');
    const text = document.getElementById('prodImagePreviewText');
    const removeBtn = document.getElementById('btnRemoveProdImage');
    if (!img) return;
    if (url) {
      const finalUrl = resolveAdminImageUrl(url);
      img.src = finalUrl;
      img.style.display = 'block';
      let displayText = url;
      if (url.startsWith('data:')) {
        displayText = 'Ảnh máy tính (Dữ liệu ảnh trực tiếp)';
      } else if (url.startsWith('/api/images/')) {
        displayText = `Ảnh hệ thống máy chủ (${url})`;
      } else if (url.length > 60) {
        displayText = url.slice(0, 57) + '...';
      }
      if (text) text.textContent = displayText;
      if (removeBtn) removeBtn.style.display = 'inline-flex';
    } else {
      img.style.display = 'none';
      if (text) text.textContent = 'Chưa chọn hình ảnh mô hình xe';
      if (removeBtn) removeBtn.style.display = 'none';
    }
  }

  function compressImageClientSide(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          let compressed = canvas.toDataURL('image/webp', quality);
          if (!compressed || !compressed.startsWith('data:image/webp')) {
            compressed = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(compressed);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleProductImageFileUpload(input) {
    if (!input || !input.files || input.files.length === 0) return;
    const file = input.files[0];

    // Đảm bảo modal vẫn mở trong suốt quá trình upload
    const productModal = document.getElementById('productModal');
    if (productModal && !productModal.classList.contains('active')) {
      productModal.classList.add('active');
    }

    if (!file.type.startsWith('image/')) {
      adminToast('Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WEBP, GIF)!', 'error');
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      adminToast('Dung lượng ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn!', 'error');
      input.value = '';
      return;
    }

    const previewText = document.getElementById('prodImagePreviewText');
    const uploadBtn = document.getElementById('btnPickProductImage') ||
                      document.querySelector('#productModal button[title*="Mở thư mục"]') ||
                      document.querySelector('button[onclick*="prodImageFileInput"]');
    const originalBtnHtml = uploadBtn ? uploadBtn.innerHTML : '';
    if (uploadBtn) {
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang nén ảnh...';
    }

    if (previewText) previewText.textContent = `Đang xử lý & nén ảnh: ${file.name}...`;

    try {
      // 1. Nén ảnh chất lượng cao trực tiếp tại trình duyệt
      const dataUrl = await compressImageClientSide(file);
      // Hiển thị ngay ảnh preview tức thì bằng DataURI
      updateProductImagePreview(dataUrl);

      // Điền dataUrl vào input làm dự phòng tức thời
      const imgInput = document.getElementById('prodImage');
      if (imgInput) imgInput.value = dataUrl;

      if (previewText) previewText.textContent = `Đang tải ảnh lên hệ thống...`;
      if (uploadBtn) uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

      // 2. Gửi lên máy chủ để lưu vào Supabase
      const res = await api.post('/api/admin/upload-product-image', {
        filename: file.name,
        data: dataUrl
      });

      if (productModal && !productModal.classList.contains('active')) {
        productModal.classList.add('active');
      }

      if (res && res.success && res.data && res.data.url) {
        const finalUrl = res.data.url;
        if (imgInput) imgInput.value = finalUrl;
        updateProductImagePreview(dataUrl); // Giữ dataUrl trên preview để load tức thì không cần chờ mạng
        adminToast(`Đã tải ảnh "${file.name}" lên hệ thống thành công!`, 'success');
      } else {
        if (imgInput) imgInput.value = dataUrl;
        updateProductImagePreview(dataUrl);
        adminToast(`Đã nạp ảnh "${file.name}" từ máy thành công!`, 'success');
      }
    } catch (err) {
      console.warn('[IMAGE UPLOAD] Server upload error, using local fallback:', err);
      try {
        const fallbackUrl = await compressImageClientSide(file);
        const imgInput = document.getElementById('prodImage');
        if (imgInput) imgInput.value = fallbackUrl;
        updateProductImagePreview(fallbackUrl);
      } catch (_) {}
      adminToast(`Đã nạp ảnh "${file.name}" từ máy thành công!`, 'info');
      if (productModal && !productModal.classList.contains('active')) {
        productModal.classList.add('active');
      }
    } finally {
      if (uploadBtn) {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = originalBtnHtml;
      }
      if (input) input.value = '';
    }
  }

  function clearProductImage() {
    const input = document.getElementById('prodImage');
    const fileInput = document.getElementById('prodImageFileInput');
    if (input) input.value = '';
    if (fileInput) fileInput.value = '';
    updateProductImagePreview('');
  }

  async function saveProduct(e) {
    if (e && e.preventDefault) e.preventDefault();

    const saveBtn = document.getElementById('btnSaveProduct') || document.querySelector('#productForm button[type="submit"]');
    const originalBtnHtml = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
    }

    try {
      const id = document.getElementById('editProductId').value;
      const packagingType = document.getElementById('prodPackagingType')?.value || 'both';
      let priceBox = parseFloat(document.getElementById('prodPriceBox')?.value) || 0;
      let priceCard = parseFloat(document.getElementById('prodPriceCard')?.value) || 0;

      if (packagingType === 'box_only') {
        if (priceBox <= 0) {
          adminToast('Vui lòng nhập giá gốc cho Bản Box!', 'error');
          return;
        }
        priceCard = priceBox;
      } else if (packagingType === 'card_only') {
        if (priceCard <= 0) {
          adminToast('Vui lòng nhập giá gốc cho Bản Card!', 'error');
          return;
        }
        priceBox = priceCard;
      } else {
        // both
        if (priceBox <= 0) {
          adminToast('Vui lòng nhập giá cho Bản Box!', 'error');
          return;
        }
        if (priceCard <= 0) {
          priceCard = priceBox;
          const cEl = document.getElementById('prodPriceCard');
          if (cEl) cEl.value = String(priceCard);
        }
      }

      const rawPct = parseInt(document.getElementById('prodDiscountPercent')?.value) || 0;
      const discountPercent = (productDiscountMode === 'sale' && rawPct > 0) ? Math.min(80, rawPct) : 0;

      const finalPriceBox = discountPercent > 0
        ? Math.round((priceBox * (100 - discountPercent) / 100) / 1000) * 1000
        : priceBox;
      const finalPriceCard = discountPercent > 0
        ? Math.round((priceCard * (100 - discountPercent) / 100) / 1000) * 1000
        : priceCard;

      const mainPrice = packagingType === 'card_only' ? finalPriceCard : finalPriceBox;
      const mainOldPrice = discountPercent > 0
        ? (packagingType === 'card_only' ? priceCard : priceBox)
        : null;

      const skuVal = document.getElementById('prodSku').value.trim();
      if (!skuVal) {
        adminToast('Vui lòng nhập mã SKU!', 'error');
        document.getElementById('prodSku')?.focus();
        return;
      }

      const nameVal = document.getElementById('prodName').value.trim();
      if (!nameVal || nameVal.length < 3) {
        adminToast('Vui lòng nhập tên mô hình xe (tối thiểu 3 ký tự)!', 'error');
        document.getElementById('prodName')?.focus();
        return;
      }

      const carVal = document.getElementById('prodCarNumber')?.value.trim() || skuVal.replace(/\D/g, '') || null;

      let brandVal = document.getElementById('prodBrand')?.value || 'MINI GT';
      if (brandVal === 'custom') {
        brandVal = document.getElementById('prodBrandCustom')?.value.trim() || 'MINI GT';
      }

      const stockBox = parseInt(document.getElementById('prodStockBox')?.value, 10) || 0;
      const stockCard = parseInt(document.getElementById('prodStockCard')?.value, 10) || 0;
      const computedStock = packagingType === 'box_only' ? stockBox : (packagingType === 'card_only' ? stockCard : (stockBox + stockCard));

      const statusVal = document.getElementById('prodStatus').value;
      const isPreOrder = statusVal === 'pre_order';
      const depositPercent = isPreOrder ? Math.min(100, Math.max(10, parseInt(document.getElementById('prodDepositPercent')?.value, 10) || 30)) : 0;
      const depositAmount = isPreOrder ? (parseFloat(document.getElementById('prodDepositAmount')?.value) || Math.round((mainPrice * (depositPercent / 100)) / 1000) * 1000) : 0;
      const expectedDelivery = isPreOrder ? (document.getElementById('prodExpectedDelivery')?.value || 'Tháng 11/2026 (Có thể trễ hơn dự kiến)') : null;

      const imageVal = document.getElementById('prodImage').value.trim() || 'image/hero-banner.jpg';

      const payload = {
        sku: skuVal,
        carNumber: carVal,
        name: nameVal,
        categoryId: parseInt(document.getElementById('prodCategory').value, 10) || 1,
        brand: brandVal,
        scale: document.getElementById('prodScale').value.trim() || '1:64',
        packagingType,
        priceBox,
        priceCard,
        discountPercent,
        finalPriceBox,
        finalPriceCard,
        price: mainPrice,
        oldPrice: mainOldPrice,
        depositAmount,
        depositPercent,
        expectedDelivery,
        editionNote: document.getElementById('prodEdition').value.trim(),
        preOrderDeadline: null,
        status: statusVal,
        stock: computedStock,
        stockBox,
        stockCard,
        imageUrl: imageVal,
        image: imageVal,
        description: document.getElementById('prodDesc').value.trim(),
        isFeatured: document.getElementById('prodIsFeatured').checked,
        isNew: document.getElementById('prodIsNew').checked
      };

      let res;
      if (id) {
        res = await api.put(`/api/admin/products/${id}`, payload);
        if (res && res.success === false) {
          throw new Error(res.message || 'Lỗi cập nhật mô hình');
        }
        adminToast('Cập nhật mô hình xe (Box/Card & Giảm %) thành công!', 'success');
      } else {
        res = await api.post('/api/admin/products', payload);
        if (res && res.success === false) {
          throw new Error(res.message || 'Lỗi thêm mô hình mới');
        }
        adminToast('Thêm mô hình xe mới thành công!', 'success');
      }
      closeAdminModal('productModal');
      await loadProducts();
      await loadDashboard();
    } catch (err) {
      adminToast('Lỗi lưu sản phẩm: ' + err.message, 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalBtnHtml;
      }
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
    const pid = parseInt(productId, 10);
    if (!confirm('Bạn có chắc chắn muốn xóa mô hình này khỏi cửa hàng?')) return;
    try {
      const res = await api.delete(`/api/admin/products/${pid}`);

      // Xóa ngay khỏi danh sách đang hiển thị mà không cần reload toàn bộ
      cachedProducts = (cachedProducts || []).filter(p => {
        const id = p.id ?? p.ProductId ?? p.productid;
        return Number(id) !== pid;
      });
      renderProductsTable(cachedProducts);

      if (res.data && res.data.softDeleted) {
        adminToast('Sản phẩm đã có trong đơn hàng — đã ẩn khỏi cửa hàng thành công!', 'info');
      } else {
        adminToast('Đã xóa hoàn toàn sản phẩm khỏi hệ thống!', 'success');
      }
      if (api && typeof api.emitRealtimeSync === 'function') {
        api.emitRealtimeSync('PRODUCTS_UPDATED', { deletedId: pid });
      }
      await loadProducts();
      loadDashboard();
    } catch (err) {
      adminToast('Lỗi xóa sản phẩm: ' + err.message, 'error');
    }
  }

  // =====================================================================
  // 6. TAB 3: QUẢN LÝ ĐƠN HÀNG (ADMIN ORDERS)
  // =====================================================================
  async function loadOrders() {
    startProgressBar();
    renderTableSkeletons('ordersTbody', 8, 6);
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
    } finally {
      finishProgressBar();
    }
  }

  function setOrderTab(status) {
    orderFilter.status = status;
    orderFilter.page = 1;

    document.querySelectorAll('.order-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === status);
    });

    const subBar = document.getElementById('preorderSubFilterBar');
    if (subBar) {
      if (status === 'PRE_ORDER') {
        subBar.style.display = 'block';
        if (!orderFilter.preStage) orderFilter.preStage = 'ALL';
        document.querySelectorAll('.preorder-sub-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.prestage === orderFilter.preStage);
        });
      } else {
        subBar.style.display = 'none';
        delete orderFilter.preStage;
      }
    }

    loadOrders();
  }

  function setPreOrderSubStage(stage) {
    orderFilter.preStage = stage;
    orderFilter.page = 1;

    document.querySelectorAll('.preorder-sub-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.prestage === stage);
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
    orderFilter.addressType = document.getElementById('orderAddressTypeFilter')?.value || 'ALL';
    orderFilter.spxStatus = document.getElementById('orderSpxFilter')?.value || 'ALL';
    orderFilter.page = 1;
    loadOrders();
  }

  function filterPayosOrders() {
    const select = document.getElementById('orderPayMethodFilter');
    if (!select) return;
    if (orderFilter.paymentMethod === 'VIETQR_PAYOS') {
      select.value = 'ALL';
      orderFilter.paymentMethod = 'ALL';
      adminToast('Đã bỏ lọc PayOS', 'info');
    } else {
      select.value = 'VIETQR_PAYOS';
      orderFilter.paymentMethod = 'VIETQR_PAYOS';
      adminToast('⚡ Đang lọc danh sách đơn thanh toán tự động qua PayOS', 'success');
    }
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
      tabCountCancelled: counts.cancelled,
      tabCountPreOrder: counts.preOrder || counts.countPreOrder || 0
    };
    for (const [id, count] of Object.entries(map)) {
      const el = document.getElementById(id);
      if (el) el.textContent = count || 0;
    }

    if (counts.preStages) {
      const preMap = {
        preCountAll: counts.preStages.all || 0,
        preCountNeedDeposit: counts.preStages.needDeposit || 0,
        preCountWaitingGoods: counts.preStages.waitingGoods || 0,
        preCountGoodsArrived: counts.preStages.goodsArrived || 0,
        preCountShipped: counts.preStages.shipped || 0
      };
      for (const [id, count] of Object.entries(preMap)) {
        const el = document.getElementById(id);
        if (el) el.textContent = count;
      }
    }
  }

  function renderPaymentBadge(paymentStatus, paymentMethod) {
    const isPayOS = paymentMethod === 'VIETQR_PAYOS' || paymentMethod === 'PAYOS';
    const isBankOrDeposit = paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'DEPOSIT';

    if (isPayOS) {
      if (paymentStatus === 'PAID') {
        return `<span class="status-badge" style="background:#ecfdf5; color:#047857; border:1px solid #10b981; font-weight:800; display:inline-flex; align-items:center; gap:4px; box-shadow:0 1px 2px rgba(16,185,129,0.15);"><i class="fa-solid fa-bolt" style="color:#059669;"></i> ${t('pay_vietqr_auto_paid', 'VietQR Tự động • Đã thanh toán')}</span>`;
      }
      if (paymentStatus === 'PARTIALLY_PAID') {
        return `<span class="status-badge" style="background:#eff6ff; color:#1d4ed8; border:1px solid #3b82f6; font-weight:800; display:inline-flex; align-items:center; gap:4px; box-shadow:0 1px 2px rgba(59,130,246,0.15);"><i class="fa-solid fa-bolt" style="color:#2563eb;"></i> ${t('pay_vietqr_auto_deposit', 'VietQR Tự động • Đã cọc')}</span>`;
      }
      if (paymentStatus === 'REFUND_PENDING') {
        return `<span class="status-badge" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; font-weight:700;"><i class="fa-solid fa-rotate-left"></i> ${t('pay_payos_refund_pending', 'PayOS: Chờ hoàn tiền')}</span>`;
      }
      if (paymentStatus === 'REFUNDED') {
        return `<span class="status-badge" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; font-weight:700;"><i class="fa-solid fa-clock-rotate-left"></i> ${t('pay_payos_refunded', 'PayOS: Đã hoàn tiền')}</span>`;
      }
      return `
        <span class="status-badge" style="background:#f0fdf4; color:#15803d; border:1px solid #86efac; font-weight:700; font-size:11px; padding:3px 7px; display:inline-flex; align-items:center; gap:4px;">
          <i class="fa-solid fa-qrcode"></i> ${t('pay_payos_awaiting_scan', 'VietQR PayOS (Chờ quét)')}
        </span>
        <div style="font-size:10px; color:#16a34a; margin-top:2px; font-weight:600; line-height:1.2;">
          <i class="fa-solid fa-bolt"></i> ${t('pay_auto_reconcile', 'Hệ thống tự động đối soát')}
        </div>
      `;
    }

    if (paymentStatus === 'PAID') {
      return `<span class="status-badge" style="background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; font-weight:700;"><i class="fa-solid fa-circle-check"></i> ${t('pay_full_paid', 'Đã nhận đủ tiền')}</span>`;
    }
    if (paymentStatus === 'PARTIALLY_PAID') {
      return `<span class="status-badge" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-weight:700;"><i class="fa-solid fa-circle-check"></i> ${t('pay_partially_paid', 'Đã nhận cọc')}</span>`;
    }
    if (paymentStatus === 'REFUND_PENDING') {
      return `<span class="status-badge" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; font-weight:700;"><i class="fa-solid fa-rotate-left"></i> ${t('pay_refund_pending', 'Chờ hoàn tiền')}</span>`;
    }
    if (paymentStatus === 'REFUNDED') {
      return `<span class="status-badge" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; font-weight:700;"><i class="fa-solid fa-clock-rotate-left"></i> ${t('pay_refunded', 'Đã hoàn tiền')}</span>`;
    }

    // Trường hợp UNPAID:
    // Với Đơn Chuyển Khoản Full hoặc Cọc: Khách bấm "Tôi đã chuyển khoản xong" chỉ là thông báo.
    // Admin PHẢI check App MB Bank nhận tiền rồi mới duyệt!
    if (isBankOrDeposit) {
      return `
        <span class="status-badge" style="background:#fffbeb; color:#b45309; border:1.5px solid #fde68a; font-weight:800; font-size:11px; padding:3px 7px; border-radius:5px; display:inline-flex; align-items:center; gap:4px;">
          <i class="fa-solid fa-building-columns"></i> ${t('pay_check_mbbank', 'Check TK MB Bank')}
        </span>
        <div style="font-size:10px; color:#c2410c; margin-top:2px; font-weight:700; line-height:1.2;">
          <i class="fa-solid fa-bell"></i> ${t('pay_check_mbbank_hint', 'Kiểm tra TK trước khi duyệt!')}
        </div>
      `;
    }

    // Đơn COD
    return `<span class="status-badge" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; font-weight:700;"><i class="fa-solid fa-hand-holding-dollar"></i> ${t('pay_cod_on_delivery', 'Thu COD khi giao')}</span>`;
  }

  function renderOrderBadge(status) {
    const statusMap = {
      PENDING: { text: t('order_status_pending', 'Chờ duyệt'), bg: '#fef3c7', color: '#b45309', icon: 'fa-hourglass-half' },
      CONFIRMED: { text: t('order_status_confirmed', 'Đã duyệt'), bg: '#eff6ff', color: '#1d4ed8', icon: 'fa-check' },
      PREPARING: { text: t('order_status_preparing', 'Đang đóng gói'), bg: '#f3e8ff', color: '#7e22ce', icon: 'fa-box' },
      SHIPPING: { text: t('order_status_shipping', 'Đang giao SPX'), bg: '#ffedd5', color: '#c2410c', icon: 'fa-truck-fast' },
      DELIVERED: { text: t('order_status_delivered', 'Đã giao thành công'), bg: '#ecfdf5', color: '#047857', icon: 'fa-circle-check' },
      CANCELLED: { text: t('order_status_cancelled', 'Đã hủy'), bg: '#fee2e2', color: '#b91c1c', icon: 'fa-ban' }
    };
    const s = statusMap[status] || { text: status, bg: '#f1f5f9', color: '#334155', icon: 'fa-circle' };
    return `<span class="status-badge" style="background:${s.bg}; color:${s.color}; border:1px solid rgba(0,0,0,0.06); font-weight:700;"><i class="fa-solid ${s.icon}"></i> ${s.text}</span>`;
  }

  const revealedPhoneOrders = new Set();

  function maskPhoneNumber(phone) {
    if (!phone) return '09•• ••• •••';
    const cleaned = String(phone).replace(/\s+/g, '');
    if (cleaned.length < 8) return '••••••••';
    return cleaned.slice(0, 4) + ' ••• ' + cleaned.slice(-3);
  }

  function togglePhoneMask(orderId) {
    const oId = Number(orderId);
    if (revealedPhoneOrders.has(oId)) {
      revealedPhoneOrders.delete(oId);
    } else {
      revealedPhoneOrders.add(oId);
    }
    const span = document.getElementById(`phoneMask_${oId}`);
    const btn = document.getElementById(`btnPhoneMask_${oId}`);
    const order = (cachedOrders || []).find(o => o.id == oId);
    const realPhone = (order && ((order.customer && order.customer.phone) || order.phone)) || '';

    if (span && btn) {
      if (revealedPhoneOrders.has(oId)) {
        span.textContent = realPhone;
        span.style.color = '#059669';
        btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        btn.title = 'Ẩn số điện thoại bảo mật';
      } else {
        span.textContent = maskPhoneNumber(realPhone);
        span.style.color = '#334155';
        btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        btn.title = 'Hiện đầy đủ số điện thoại';
      }
    }
  }

  function copyOrderCode(code, evt) {
    if (evt && evt.stopPropagation) evt.stopPropagation();
    if (!code) return;
    const cleanCode = code.startsWith('#') ? code : `#${code}`;
    navigator.clipboard.writeText(cleanCode).then(() => {
      adminToast(`Đã sao chép mã đơn: ${cleanCode}`, 'success');
    }).catch(() => {
      adminToast(`Mã đơn: ${cleanCode}`, 'info');
    });
  }

  function formatOrderDateTime(d) {
    if (!d) return '--:--';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      const pad = n => String(n).padStart(2, '0');
      return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    } catch (e) {
      return String(d);
    }
  }

  function renderOrderItemsPreview(items) {
    if (!items || !items.length) {
      return '<span style="font-size:11px; color:#94a3b8; font-style:italic;">(Chưa có sản phẩm)</span>';
    }
    const rendered = items.slice(0, 2).map(it => {
      const isCard = (it.packagingOption || it.PackagingOption || it.packType) === 'card';
      const packBadge = isCard
        ? '<span class="badge-order-pack card"><i class="fa-solid fa-shield-halved"></i> Card</span>'
        : '<span class="badge-order-pack box"><i class="fa-solid fa-cube"></i> Box</span>';
      
      const pid = it.productId || it.ProductId || it.id;
      let itName = it.name || it.productName || it.ProductName || '';
      let img = it.imageUrl || it.ImageUrl || it.productImage || it.image || '';
      if ((!itName || !img || img.includes('hero-banner')) && pid) {
        const pMatch = (cachedProducts && cachedProducts.length) ? cachedProducts.find(p => (p.id || p.ProductId) == pid) : null;
        if (pMatch) {
          if (!itName || itName === 'Mô hình 1:64') itName = pMatch.name || pMatch.Name;
          if (!img || img.includes('hero-banner')) img = pMatch.imageUrl || pMatch.ImageUrl || pMatch.image;
        }
      }
      if (!itName) itName = 'Mô hình Diecast 1:64';
      if (!img) img = 'image/hero-banner.jpg';
      let finalImg = resolveAdminImageUrl(img);

      return `
        <div class="order-item-chip" title="${escapeHtml(itName)}">
          <img src="${finalImg}" onerror="this.onerror=null; this.src='../image/hero-banner.jpg';" alt="" style="width:24px; height:24px; object-fit:contain; border-radius:4px; border:1px solid #e2e8f0; background:#fff; flex-shrink:0;">
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:160px; font-weight:700; font-size:11.5px; color:#0f172a;">
              ${escapeHtml(itName)}
            </div>
            <div style="display:flex; align-items:center; gap:5px; margin-top:1px;">
              ${packBadge}
              <span style="font-size:10.5px; font-weight:800; color:#475569;">×${it.quantity || 1}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const moreCount = items.length - 2;
    return rendered + (moreCount > 0 ? `<div style="font-size:10.5px; color:#2563eb; font-weight:700; margin-left:4px;">+ ${moreCount} mẫu xe khác...</div>` : '');
  }

  function printOrderInvoice(orderId) {
    const o = (cachedOrders || []).find(item => item.id == orderId);
    if (!o) {
      adminToast('Không tìm thấy dữ liệu đơn hàng để in', 'error');
      return;
    }
    const custName = (o.customer && o.customer.fullName) || o.fullName || 'Khách hàng';
    const custAddr = (o.customer && o.customer.address) || o.address || 'Tại shop';
    const custPhone = (o.customer && o.customer.phone) || o.phone || '';
    const orderTotal = o.total ?? o.totalAmount ?? 0;
    const items = o.items || [];

    const printWin = window.open('', '_blank', 'width=800,height=700');
    if (!printWin) {
      adminToast('Trình duyệt đã chặn popup in. Vui lòng cho phép popup!', 'warning');
      return;
    }

    const rowsHtml = items.map((it, idx) => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:8px; text-align:center;">${idx + 1}</td>
        <td style="padding:8px;">
          <strong>${escapeHtml(it.name || it.productName || 'Mô hình')}</strong>
          <div style="font-size:11px; color:#64748b;">SKU: ${escapeHtml(it.sku || '-')} &bull; Quy cách: <strong>${(it.packagingOption || it.PackagingOption) === 'card' ? 'Bản Card (Vỉ Blister)' : 'Bản Box (Hộp giấy)'}</strong></div>
        </td>
        <td style="padding:8px; text-align:center;">${it.quantity || 1}</td>
        <td style="padding:8px; text-align:right;">${formatVND(it.unitPrice || 0)}</td>
        <td style="padding:8px; text-align:right;"><strong>${formatVND(it.lineTotal || ((it.unitPrice || 0) * (it.quantity || 1)))}</strong></td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Phiếu Giao Hàng #${escapeHtml(o.code)} - Mini GT Store</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #0f172a; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e10600; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 22px; font-weight: 900; color: #e10600; letter-spacing: -0.5px; }
          .order-meta { text-align: right; font-size: 13px; color: #475569; }
          .customer-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 13px; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
          th { background: #f1f5f9; padding: 10px 8px; text-align: left; font-weight: 700; border-bottom: 1px solid #cbd5e1; }
          .total-box { margin-left: auto; width: 300px; font-size: 13px; line-height: 1.8; }
          .total-row { display: flex; justify-content: space-between; }
          .total-final { font-size: 16px; font-weight: 800; color: #e10600; border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 6px; }
          .footer-note { margin-top: 35px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
          @media print { .no-print { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
          <button onclick="window.print()" style="background:#e10600; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:700; cursor:pointer;">🖨️ In Phiếu Giao Hàng</button>
          <span style="font-size:12px; color:#64748b;">(Có thể bấm Ctrl+P để in hoặc lưu PDF)</span>
        </div>
        <div class="header">
          <div>
            <div class="logo">MINI GT BIÊN HÒA STORE</div>
            <div style="font-size:12px; color:#475569; margin-top:2px;">Mô hình tĩnh Diecast 1:64 chính hãng cao cấp</div>
            <div style="font-size:11px; color:#64748b;">Hotline / Zalo: 0981 400 400 &bull; Biên Hòa, Đồng Nai</div>
          </div>
          <div class="order-meta">
            <div style="font-size:16px; font-weight:800; color:#e10600;">#${escapeHtml(o.code)}</div>
            <div>Ngày đặt: ${new Date(o.createdAt || Date.now()).toLocaleDateString('vi-VN')}</div>
            ${o.trackingCode ? `<div style="font-weight:700; color:#ea580c; margin-top:3px;">SPX: ${escapeHtml(o.trackingCode)}</div>` : ''}
          </div>
        </div>

        <div class="customer-box">
          <div style="font-weight:700; font-size:14px; margin-bottom:4px; color:#0f172a;">👤 Người nhận: ${escapeHtml(custName)}</div>
          <div>📞 Số điện thoại: <strong>${escapeHtml(custPhone)}</strong></div>
          <div>📍 Địa chỉ giao: ${escapeHtml(custAddr)}</div>
          <div>🚚 Đơn vị vận chuyển: <strong>SPX Express</strong> ${o.trackingCode ? `(Mã VĐ: ${escapeHtml(o.trackingCode)})` : ''}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:40px; text-align:center;">STT</th>
              <th>Mô Hình & Quy Cách</th>
              <th style="width:60px; text-align:center;">SL</th>
              <th style="width:110px; text-align:right;">Đơn Giá</th>
              <th style="width:120px; text-align:right;">Thành Tiền</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row"><span>Tổng giá trị hàng:</span> <strong>${formatVND(orderTotal)}</strong></div>
          ${o.depositAmount > 0 ? `<div class="total-row" style="color:#2563eb;"><span>Đã đặt cọc trước:</span> <strong>-${formatVND(o.depositAmount)}</strong></div>` : ''}
          <div class="total-row total-final">
            <span>${o.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN ĐỦ:' : (o.paymentMethod === 'COD' || o.depositAmount > 0 ? 'SỐ TIỀN THU COD:' : 'CẦN THU:')}</span>
            <span>${o.paymentStatus === 'PAID' ? '0 đ (Đã thanh toán)' : formatVND(Math.max(0, orderTotal - (o.depositAmount || 0)))}</span>
          </div>
        </div>

        <div class="footer-note">
          <p style="margin:0 0 4px 0; font-weight:600;">Cảm ơn quý khách đã tin tưởng và đồng hành cùng Mini GT Biên Hòa Store!</p>
          <p style="margin:0;">Vui lòng quay video mở kiện hàng seal để được hỗ trợ bảo hành chính hãng tốt nhất.</p>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  function getDateGroupKey(dateStr) {
    if (!dateStr) return t('date_unknown', 'Đơn không rõ ngày');
    try {
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return t('date_unknown', 'Đơn không rõ ngày');
      const pad = n => String(n).padStart(2, '0');
      const day = dt.getDate();
      const month = dt.getMonth() + 1;
      const year = dt.getFullYear();

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;

      const currStr = `${year}-${pad(month)}-${pad(day)}`;

      if (currStr === todayStr) {
        return `${t('date_today', 'Hôm nay')} — ${pad(day)}/${pad(month)}/${year}`;
      } else if (currStr === yesterdayStr) {
        return `${t('date_yesterday', 'Hôm qua')} — ${pad(day)}/${pad(month)}/${year}`;
      } else {
        return `${t('date_prefix', 'Ngày')} ${pad(day)}/${pad(month)}/${year}`;
      }
    } catch (e) {
      return t('date_unknown', 'Đơn không rõ ngày');
    }
  }

  function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTbody');
    if (!tbody) return;

    if (!orders || !orders.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2.5rem; color:#64748b;">${t('orders_empty', 'Không tìm thấy đơn hàng nào phù hợp với bộ lọc')}</td></tr>`;
      return;
    }

    // Đếm số lượng đơn của từng nhóm ngày trên trang hiện tại
    const groupCounts = {};
    orders.forEach(o => {
      const k = getDateGroupKey(o.createdAt || o.created_at);
      groupCounts[k] = (groupCounts[k] || 0) + 1;
    });

    let lastGroup = null;
    const rowsHtml = [];

    orders.forEach(o => {
      const currentGroup = getDateGroupKey(o.createdAt || o.created_at);
      if (currentGroup !== lastGroup) {
        lastGroup = currentGroup;
        const countInGroup = groupCounts[currentGroup] || 1;
        rowsHtml.push(`
          <tr class="order-date-divider-row">
            <td colspan="7">
              <div class="order-date-divider-content">
                <span class="date-badge">
                  <i class="fa-regular fa-calendar-check"></i> <strong>${currentGroup}</strong>
                </span>
                <span class="date-count">${countInGroup} ${t('orders_unit', 'đơn hàng')}</span>
              </div>
            </td>
          </tr>
        `);
      }

      // Phân bổ nhóm thao tác thành 2 dòng ma trận rõ ràng, ngăn nắp, không bị che mất
      const actionsPrimary = [];
      const actionsSecondary = [];

      // 1. Thao tác tiến trình xử lý đơn chính (Workflow Primary)
      if (o.status === 'PENDING') {
        actionsPrimary.push(`<button class="btn-admin btn-admin-primary" style="padding:4px 8px; font-size:11px;" onclick="changeOrderStatus(${o.id}, 'CONFIRMED')" title="Duyệt đơn hàng ngay"><i class="fa-solid fa-check"></i> ${t('btn_approve', 'Duyệt')}</button>`);
      } else if (o.status === 'CONFIRMED') {
        actionsPrimary.push(`<button class="btn-admin btn-admin-primary" style="padding:4px 8px; font-size:11px; background:#7e22ce; border-color:#7e22ce;" onclick="changeOrderStatus(${o.id}, 'PREPARING')" title="Chuyển sang đóng gói"><i class="fa-solid fa-box"></i> ${t('btn_pack', 'Đóng gói')}</button>`);
      } else if (o.status === 'PREPARING') {
        actionsPrimary.push(`<button class="btn-admin btn-admin-primary" style="padding:4px 8px; font-size:11px; background:#ea580c; border-color:#ea580c;" onclick="openShipSpxModal(${o.id})" title="Gán mã vận đơn SPX Express"><i class="fa-solid fa-truck-fast"></i> ${o.trackingCode ? t('btn_edit_spx', 'Sửa SPX') : t('btn_assign_spx', 'Gán SPX')}</button>`);
      } else if (o.status === 'SHIPPING') {
        actionsPrimary.push(`<button class="btn-admin btn-admin-primary" style="padding:4px 8px; font-size:11px; background:#059669; border-color:#059669;" onclick="changeOrderStatus(${o.id}, 'DELIVERED')" title="Xác nhận đã giao hàng & thu tiền"><i class="fa-solid fa-circle-check"></i> ${t('btn_delivered', 'Đã giao')}</button>`);
      }

      // Các nút tiện ích tra cứu luôn sẵn sàng ở hàng 1
      actionsPrimary.push(`<button class="btn-admin btn-admin-outline" style="padding:4px 7px; font-size:11px;" onclick="viewOrderDetail(${o.id})" title="Xem chi tiết đơn"><i class="fa-solid fa-eye"></i> ${t('btn_detail', 'Chi tiết')}</button>`);
      actionsPrimary.push(`<button class="btn-admin btn-admin-outline" style="padding:4px 7px; font-size:11px;" onclick="printOrderInvoice(${o.id})" title="In phiếu đóng gói / giao hàng"><i class="fa-solid fa-print"></i> ${t('btn_print', 'In đơn')}</button>`);

      // 2. Thao tác tài chính & bổ sung ở hàng 2 (Secondary row)
      // Gán / Đổi mã SPX nếu ở trạng thái Confirmed hoặc Shipping mà cần chỉnh
      if (['CONFIRMED', 'SHIPPING'].includes(o.status)) {
        actionsSecondary.push(`<button class="btn-admin btn-admin-outline" style="padding:3px 7px; font-size:11px; color:#ea580c; border-color:#fdba74;" onclick="openShipSpxModal(${o.id})" title="Quản lý mã vận đơn SPX Express"><i class="fa-solid fa-truck-fast"></i> ${o.trackingCode ? t('btn_edit_spx', 'Sửa SPX') : t('btn_assign_spx', 'Gán SPX')}</button>`);
      }

      // Xác nhận tiền cọc hoặc thanh toán full
      if (o.status !== 'CANCELLED' && o.paymentStatus !== 'PAID' && o.paymentMethod !== 'COD') {
        if (o.paymentMethod === 'DEPOSIT') {
          if (o.paymentStatus === 'UNPAID') {
            actionsSecondary.push(`<button class="btn-admin btn-admin-outline" style="padding:3px 7px; font-size:11px; color:#2563eb; border-color:#93c5fd;" onclick="confirmPaymentAction(${o.id}, 'deposit')" title="Xác nhận đã nhận cọc"><i class="fa-solid fa-money-bill-transfer"></i> ${t('pay_partially_paid', 'Nhận Cọc')}</button>`);
          } else if (o.paymentStatus === 'PARTIALLY_PAID') {
            actionsSecondary.push(`<button class="btn-admin btn-admin-outline" style="padding:3px 7px; font-size:11px; color:#059669; border-color:#a7f3d0;" onclick="confirmPaymentAction(${o.id}, 'full')" title="Xác nhận nhận đủ tiền 100%"><i class="fa-solid fa-circle-dollar-to-slot"></i> ${t('pay_full_paid', 'Nhận Đủ')}</button>`);
          }
        } else if (o.paymentMethod === 'BANK_TRANSFER' && o.paymentStatus === 'UNPAID') {
          actionsSecondary.push(`<button class="btn-admin btn-admin-outline" style="padding:3px 7px; font-size:11px; color:#2563eb; border-color:#93c5fd;" onclick="confirmPaymentAction(${o.id}, 'full')" title="Xác nhận nhận đủ tiền 100%"><i class="fa-solid fa-circle-dollar-to-slot"></i> ${t('pay_full_paid', 'Nhận Full')}</button>`);
        }
      }

      // Báo hàng Pre-Order đã về kho
      if ((o.hasPreOrder || o.HasPreOrder) && ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)) {
        if (!o.preOrderNotified && !o.PreOrderNotified) {
          actionsSecondary.push(`<button class="btn-admin btn-admin-primary" style="padding:3px 7px; font-size:11px; background:#d97706; border-color:#b45309;" onclick="markPreOrderArrivedAction(${o.id})" title="Báo hàng Pre-Order đã về tới kho Biên Hòa để giao"><i class="fa-solid fa-boxes-packing"></i> Báo Hàng Về</button>`);
        } else {
          actionsSecondary.push(`<span class="badge-arrived" style="font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;"><i class="fa-solid fa-circle-check"></i> Đã về kho</span>`);
        }
      }

      // Hoàn tiền nếu đơn hủy đang chờ hoàn tiền
      if (o.paymentStatus === 'REFUND_PENDING') {
        actionsSecondary.push(`<button class="btn-admin btn-admin-primary" style="padding:3px 7px; font-size:11px; background:#b45309; border-color:#b45309;" onclick="markRefundedAction(${o.id})" title="Xác nhận đã hoàn tiền cho khách"><i class="fa-solid fa-hand-holding-dollar"></i> ${t('pay_refunded', 'Đã hoàn tiền')}</button>`);
      }

      // Hủy đơn
      if (['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)) {
        actionsSecondary.push(`<button class="btn-admin btn-admin-outline" style="padding:3px 7px; font-size:11px; color:#dc2626; border-color:#fca5a5;" onclick="openCancelOrderModal(${o.id})" title="Hủy đơn hàng"><i class="fa-solid fa-ban"></i> ${t('btn_cancel', 'Hủy')}</button>`);
      }

      const custName = (o.customer && o.customer.fullName) || o.fullName || 'Khách hàng';
      const custAddr = (o.customer && o.customer.address) || o.address || '';
      const custPhone = (o.customer && o.customer.phone) || o.phone || '';
      const orderTotal = o.total ?? o.totalAmount ?? 0;
      const isPhoneRevealed = revealedPhoneOrders.has(Number(o.id));
      const isPreOrder = Boolean(o.hasPreOrder || o.HasPreOrder);
      const preOrderExpected = o.preOrderExpected || o.PreOrderExpected || '';

      rowsHtml.push(`
        <tr>
          <!-- 1. Mã đơn & Thời gian (nowrap + copy button) -->
          <td style="white-space:nowrap;">
            <div class="col-order-code">
              <span>#${escapeHtml(o.code)}</span>
              <button type="button" class="btn-copy-code" onclick="copyOrderCode('${escapeHtml(o.code)}', event)" title="Sao chép mã đơn">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">
              <i class="fa-regular fa-clock" style="font-size:10px;"></i> ${formatOrderDateTime(o.createdAt || o.created_at)}
            </div>
            ${isPreOrder ? `
              <div style="margin-top:3px;">
                <span style="font-size:10px; font-weight:800; color:#7c3aed; background:#f5f3ff; border:1px solid #ddd6fe; padding:1px 6px; border-radius:4px; display:inline-flex; align-items:center; gap:3px;">
                  <i class="fa-solid fa-bolt"></i> PRE-ORDER ${preOrderExpected ? `• ${escapeHtml(preOrderExpected)}` : ''}
                </span>
              </div>
            ` : ''}
          </td>

          <!-- 2. Khách hàng & SĐT (bảo mật số điện thoại bằng eye toggle & huy hiệu địa chỉ Mới/Cũ) -->
          <td>
            <div style="font-weight:700; color:#0f172a; font-size:12.5px; display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
              <span>${escapeHtml(custName)}</span>
              ${(() => {
                const custMatch = (cachedUsers && cachedUsers.length)
                  ? cachedUsers.find(u => (o.userId && u.userId == o.userId) || (u.phone && custPhone && u.phone.replace(/\D/g, '') === custPhone.replace(/\D/g, '')))
                  : null;
                const custTotalSpent = Number((custMatch ? custMatch.totalSpent : 0) || o.userTotalSpent || (o.customer && o.customer.userTotalSpent) || 0);
                const custVip = (o.vip && o.vip.level) ? o.vip : getCustomerVipInfo(custTotalSpent);
                return `<span class="vip-badge vip-${custVip.level}" style="background:${custVip.bg}; color:${custVip.color}; border:1px solid ${custVip.border}; padding:1px 6px; border-radius:10px; font-weight:800; font-size:10px; display:inline-flex; align-items:center; gap:3px;" title="Cấp độ ${custVip.label} (${custVip.tierName}) — Tích lũy mua hàng: ${formatVND(custTotalSpent)}"><i class="fa-solid ${custVip.icon}"></i> ${custVip.label}</span>`;
              })()}
            </div>
            <div class="phone-privacy-wrapper" style="margin-top:2px;">
              <span class="phone-masked-text" id="phoneMask_${o.id}">
                ${isPhoneRevealed ? escapeHtml(custPhone) : maskPhoneNumber(custPhone)}
              </span>
              <button type="button" class="btn-toggle-mask" id="btnPhoneMask_${o.id}" onclick="togglePhoneMask(${o.id})" title="${isPhoneRevealed ? 'Ẩn số điện thoại bảo mật' : 'Hiện đầy đủ số điện thoại'}">
                <i class="fa-solid ${isPhoneRevealed ? 'fa-eye-slash' : 'fa-eye'}"></i>
              </button>
            </div>
            <div style="font-size:11px; color:#64748b; margin-top:2px; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(custAddr)}">
              ${escapeHtml(custAddr || 'Tại shop')}
            </div>
            <div style="margin-top:3px; display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
              ${(o.addressType === 'OLD' || o.isOldAddress)
                ? `<span class="badge-addr-old" title="Khách chọn Địa chỉ CŨ trước sáp nhập - Khi tạo đơn SPX cần đối chiếu hoặc báo khách!"><i class="fa-solid fa-triangle-exclamation"></i> ĐC CŨ</span>`
                : `<span class="badge-addr-new" title="Địa chỉ MỚI chuẩn sau sáp nhập"><i class="fa-solid fa-circle-check"></i> ĐC MỚI</span>`
              }
              ${o.oldAddressNote ? `<span style="font-size:10px; color:#c2410c; background:#ffedd5; padding:1px 4px; border-radius:3px; max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(o.oldAddressNote)}">${escapeHtml(o.oldAddressNote)}</span>` : ''}
            </div>
          </td>

          <!-- 3. Mô hình & Quy cách (Box / Card) -->
          <td>
            <div class="order-product-list-preview">
              ${renderOrderItemsPreview(o.items)}
            </div>
          </td>

          <!-- 4. Tổng tiền & Cọc -->
          <td style="white-space:nowrap;">
            <strong style="color:#0f172a; font-size:13px;">${formatVND(orderTotal)}</strong>
            ${o.depositAmount > 0
              ? `<div style="font-size:11px; color:#2563eb; font-weight:700; margin-top:2px;">
                   <i class="fa-solid fa-hand-holding-dollar"></i> Cọc: ${formatVND(o.depositAmount)}
                 </div>
                 <div style="font-size:10.5px; color:#64748b; margin-top:1px;">
                   COD còn: <strong>${formatVND(Math.max(0, orderTotal - o.depositAmount))}</strong>
                 </div>`
              : `<div style="font-size:10.5px; color:#059669; font-weight:700; margin-top:2px;">
                   ${o.paymentMethod === 'COD' ? 'Thu COD 100%' : 'Thanh toán Full'}
                 </div>`
            }
          </td>

          <!-- 5. Thanh toán -->
          <td>
            <div style="font-size:11.5px; font-weight:700; color:#334155; margin-bottom:3px;">
              ${o.paymentMethod === 'DEPOSIT' ? '⚡ Cọc MB Bank' : (o.paymentMethod === 'COD' ? '📦 Ship COD' : '💳 Chuyển khoản')}
            </div>
            ${renderPaymentBadge(o.paymentStatus, o.paymentMethod)}
          </td>

          <!-- 6. Trạng thái đơn & SPX (Tối ưu giao diện hiển thị rõ ràng, không bị che mất) -->
          <td>
            <div style="margin-bottom:5px;">
              ${renderOrderBadge(o.status)}
            </div>
            ${o.trackingCode ? `
              <div class="badge-spx-assigned" title="Mã vận đơn SPX Express">
                <i class="fa-solid fa-truck-fast"></i>
                <span class="spx-code-text">${escapeHtml(o.trackingCode)}</span>
              </div>
              <div style="margin-top:2px;">
                <a href="https://spx.vn/vi" target="_blank" class="spx-track-link" title="Tra cứu trực tiếp trên hệ thống SPX Express">Tra cứu SPX ↗</a>
              </div>
            ` : `
              <div class="badge-spx-unassigned" onclick="openShipSpxModal(${o.id})" title="Nhấn để gán mã vận đơn SPX Express cho đơn này">
                <i class="fa-solid fa-box-archive"></i> Chưa gán SPX
              </div>
            `}
          </td>

          <!-- 7. Thao tác xử lý (Ma trận nút được cấu trúc ngăn nắp, sticky bên phải không tràn màn hình) -->
          <td style="text-align:right;">
            <div class="order-action-matrix">
              <div class="action-row primary-actions">
                ${actionsPrimary.join('')}
              </div>
              ${actionsSecondary.length ? `
                <div class="action-row secondary-actions" style="margin-top:3px;">
                  ${actionsSecondary.join('')}
                </div>
              ` : ''}
            </div>
          </td>
        </tr>
      `);
    });

    tbody.innerHTML = rowsHtml.join('');
  }

  function renderOrdersPagination(pagination) {
    const container = document.getElementById('ordersPagination');
    if (!container || !pagination) return;

    const { page, totalPages, total, limit } = pagination;
    const currentLimit = orderFilter.limit || limit || 10;

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; padding-top:12px; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; align-items:center; gap:12px; font-size:12.5px; color:#64748b; flex-wrap:wrap;">
          <span>Trang <strong>${page}</strong> / <strong>${totalPages || 1}</strong> (Tổng cộng: <strong>${total}</strong> đơn)</span>
          <div style="display:flex; align-items:center; gap:5px;">
            <span style="font-size:11.5px;">Hiển thị:</span>
            <select class="form-control" style="width:auto; padding:2px 8px; font-size:11.5px; height:28px;" onchange="changeOrderPageSize(this.value)">
              <option value="10" ${currentLimit == 10 ? 'selected' : ''}>10 đơn / trang</option>
              <option value="20" ${currentLimit == 20 ? 'selected' : ''}>20 đơn / trang</option>
              <option value="50" ${currentLimit == 50 ? 'selected' : ''}>50 đơn / trang</option>
            </select>
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn-admin btn-admin-outline" style="padding:4px 10px;" ${page <= 1 ? 'disabled' : ''} onclick="goToOrderPage(${page - 1})">◀ Trước</button>
          <button class="btn-admin btn-admin-outline" style="padding:4px 10px;" ${page >= totalPages ? 'disabled' : ''} onclick="goToOrderPage(${page + 1})">Sau ▶</button>
        </div>
      </div>
    `;
  }

  function changeOrderPageSize(newSize) {
    orderFilter.limit = parseInt(newSize, 10) || 10;
    orderFilter.page = 1;
    loadOrders();
  }

  function goToOrderPage(p) {
    orderFilter.page = p;
    loadOrders();
  }

  // Xem chi tiết đơn hàng
  async function viewOrderDetail(orderId) {
    try {
      currentDetailOrderId = orderId;
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

      const historyHtml = (order.history || []).map(h => {
        const isPayosLog = (h.by === 'SYSTEM_PAYOS' || (h.note && (h.note.includes('PayOS') || h.note.includes('VietQR'))));
        return `
        <div style="display:flex; gap:10px; margin-bottom:8px; font-size:12px; line-height:1.4; ${isPayosLog ? 'background:#ecfdf5; padding:6px 10px; border-radius:6px; border-left:3.5px solid #10b981;' : ''}">
          <span style="color:#64748b; font-size:11px; width:130px; flex-shrink:0;">${new Date(h.createdAt).toLocaleString(localStorage.getItem('minigt_lang') === 'en' ? 'en-US' : 'vi-VN')}</span>
          <div>
            ${isPayosLog ? '<span style="background:#10b981; color:#fff; font-size:10px; font-weight:800; padding:1px 6px; border-radius:4px; margin-right:4px;"><i class="fa-solid fa-bolt"></i> PAYOS VIETQR</span>' : ''}
            <strong style="color:#0f172a;">${h.to}</strong>
            ${h.note ? `<span style="color:${isPayosLog ? '#065f46; font-weight:600' : '#475569'};"> — ${escapeHtml(h.note)}</span>` : ''}
            ${h.by ? `<span style="color:#64748b; font-size:11px;"> (Bởi: ${escapeHtml(h.by)})</span>` : ''}
          </div>
        </div>
      `;
      }).join('') || `<div style="font-size:12px; color:#64748b;">${t('order_history_empty', 'Chưa có lịch sử trạng thái')}</div>`;

      const isOldAddr = order.addressType === 'OLD' || order.isOldAddress;
      const isDeliveredOrCompleted = ['DELIVERED', 'COMPLETED'].includes(String(order.status || '').toUpperCase());

      // Tính toán các thông số tài chính đối soát minh bạch chuẩn SPX Express
      const rawSubtotal = Number(order.subtotal || 0);
      const rawDiscount = Number(order.discount || 0);
      const netModelTotal = Math.max(0, rawSubtotal - rawDiscount);
      const spxShipFee = Number(order.shippingFee || 11000);
      const orderTotal = Number(order.total || (netModelTotal + spxShipFee));
      const depositPaid = Number(order.depositAmount || 0);
      const isPaidFull = order.paymentStatus === 'PAID';
      const isDepositOrder = order.paymentMethod === 'DEPOSIT' || (depositPaid > 0 && depositPaid < orderTotal);

      let remainingModel = 0;
      let codToCollect = 0;
      let spxReconcilePayout = 0;
      let shopTotalRevenue = 0;

      if (isPaidFull) {
        remainingModel = 0;
        codToCollect = 0;
        spxReconcilePayout = 0;
        shopTotalRevenue = netModelTotal;
      } else if (isDepositOrder) {
        remainingModel = Math.max(0, netModelTotal - depositPaid);
        codToCollect = remainingModel + spxShipFee;
        spxReconcilePayout = remainingModel;
        shopTotalRevenue = depositPaid + spxReconcilePayout;
      } else {
        remainingModel = netModelTotal;
        codToCollect = orderTotal;
        spxReconcilePayout = netModelTotal;
        shopTotalRevenue = spxReconcilePayout;
      }

      body.innerHTML = `
        ${isDeliveredOrCompleted ? `
          <div style="background:#ecfdf5; border:1.5px solid #6ee7b7; border-radius:10px; padding:12px 14px; margin-bottom:14px; display:flex; align-items:center; gap:10px; color:#065f46; font-size:13px;">
            <i class="fa-solid fa-lock" style="font-size:22px; color:#059669; flex-shrink:0;"></i>
            <div>
              <strong style="font-size:13.5px;">${t('order_detail_locked_notice', 'ĐƠN HÀNG ĐÃ GIAO THÀNH CÔNG VÀ KHÁCH ĐÃ NHẬN ĐƯỢC HÀNG')}</strong>
              <div style="font-size:11.5px; color:#047857; margin-top:2px;">
                ${t('order_detail_locked_desc', 'Đơn hàng đã hoàn tất toàn bộ quy trình giao phát và đối soát. Hệ thống đã KHÓA TOÀN BỘ CHỈNH SỬA để bảo toàn dữ liệu hóa đơn và đối soát SPX.')}
              </div>
            </div>
          </div>
        ` : ''}

        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:14px;">
          <div>
            <span style="font-size:11px; font-weight:800; background:#fef2f2; color:#dc2626; padding:2px 8px; border-radius:4px;">${t('order_detail_title', 'CHI TIẾT ĐƠN HÀNG')}</span>
            <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin:4px 0 0 0;">
              ${t('th_order_code', 'Mã đơn')}: <span style="color:#e10600; font-family:monospace;">#${order.code}</span>
            </h3>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            ${isDeliveredOrCompleted ? `<span style="font-size:11px; font-weight:800; background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; padding:3px 8px; border-radius:4px;"><i class="fa-solid fa-lock"></i> ${t('order_detail_locked', 'ĐÃ KHÓA')}</span>` : ''}
            ${renderOrderBadge(order.status)}
            ${renderPaymentBadge(order.paymentStatus, order.paymentMethod)}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; background:#f8fafc; padding:12px 14px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:14px; font-size:12.5px;">
          <div>
            ${(() => {
              const custMatch = (cachedUsers && cachedUsers.length)
                ? cachedUsers.find(u => (order.userId && u.userId == order.userId) || (u.phone && order.customer?.phone && u.phone.replace(/\D/g, '') === order.customer.phone.replace(/\D/g, '')))
                : null;
              const custTotalSpent = Number((custMatch ? custMatch.totalSpent : 0) || order.userTotalSpent || (order.customer && order.customer.userTotalSpent) || 0);
              const custVip = (order.vip && order.vip.level) ? order.vip : getCustomerVipInfo(custTotalSpent);
              return `
                <div style="color:#64748b; margin-bottom:2px;">${t('th_customer', 'Người nhận hàng')}:</div>
                <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                  <strong style="color:#0f172a; font-size:13.5px;">${escapeHtml(order.customer.fullName)}</strong>
                  <span class="vip-badge vip-${custVip.level}" style="background:${custVip.bg}; color:${custVip.color}; border:1px solid ${custVip.border}; padding:2px 8px; border-radius:12px; font-weight:800; font-size:11px; display:inline-flex; align-items:center; gap:4px;" title="Cấp độ ${custVip.label} — Tích lũy mua hàng: ${formatVND(custTotalSpent)}">
                    <i class="fa-solid ${custVip.icon}"></i> ${custVip.label} (${custVip.tierName})
                  </span>
                </div>
                <div style="font-size:11px; color:#059669; font-weight:700; margin-top:3px;">
                  <i class="fa-solid fa-chart-line"></i> ${t('kpi_revenue', 'Tích lũy mua hàng')}: <strong>${formatVND(custTotalSpent)}</strong>
                </div>
              `;
            })()}
            <div style="margin-top:4px;">${t('phone_lbl', 'Điện thoại')}: <strong>${escapeHtml(order.customer.phone)}</strong></div>
            ${order.customer.email ? `<div>Email: <span>${escapeHtml(order.customer.email)}</span></div>` : ''}
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
              <span style="color:#64748b;">${t('address_lbl', 'Địa chỉ giao phát kiện')}:</span>
              <span class="${isOldAddr ? 'badge-addr-old' : 'badge-addr-new'}">
                <i class="fa-solid ${isOldAddr ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
                ${isOldAddr ? t('cust_addr_old', 'ĐC CŨ') : t('cust_addr_new', 'ĐC MỚI')}
              </span>
            </div>
            <div style="line-height:1.4; font-weight:600; color:#1e293b;">${escapeHtml(order.customer.address)}</div>
            ${order.oldAddressNote ? `<div style="margin-top:4px; color:#c2410c; font-size:11.5px;"><strong>Ghi chú:</strong> ${escapeHtml(order.oldAddressNote)}</div>` : ''}
            ${order.note ? `<div style="margin-top:6px; color:#b45309; font-style:italic;">Ghi chú khách: ${escapeHtml(order.note)}</div>` : ''}
          </div>
        </div>

        <!-- Khung đối soát địa chỉ Mới / Cũ sáp nhập & hỗ trợ tạo đơn SPX Express -->
        <div class="addr-dispatch-box ${isOldAddr ? 'is-old-addr' : ''}">
          <div class="addr-dispatch-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <i class="fa-solid fa-location-dot" style="color:${isOldAddr ? '#ea580c' : '#059669'}; font-size:15px;"></i>
              <strong style="color:${isOldAddr ? '#c2410c' : '#065f46'}; font-size:13px;">
                ĐỐI SOÁT ĐỊA CHỈ NHẬN HÀNG (${isOldAddr ? 'ĐỊA CHỈ CŨ' : 'ĐỊA CHỈ MỚI'})
              </strong>
            </div>
          </div>

          <div style="font-size:12px; line-height:1.5; color:#334155; margin-bottom:8px;">
            <div><strong>Địa chỉ:</strong> ${escapeHtml(order.customer.address)}</div>
            ${order.oldAddressNote ? `<div style="margin-top:2px; color:#c2410c;"><strong>Ghi chú cũ:</strong> ${escapeHtml(order.oldAddressNote)}</div>` : ''}
            ${order.newAddressEquivalent ? `<div style="margin-top:2px; color:#047857; font-weight:700;"><i class="fa-solid fa-arrow-right"></i> Quy đổi chuẩn mới: ${escapeHtml(order.newAddressEquivalent)}</div>` : ''}
          </div>

          <div class="addr-dispatch-actions">
            <button type="button" class="addr-btn-copy btn-copy-spx" onclick="copySpxFormattedAddress(${order.id})" title="Copy địa chỉ theo định dạng chuẩn để dán vào App SPX Express hoặc GHTK">
              <i class="fa-regular fa-copy"></i> 📋 Copy SPX Address
            </button>
            <button type="button" class="addr-btn-copy btn-copy-msg" onclick="copyCustomerAddressConfirmMsg(${order.id})" title="Copy tin nhắn soạn sẵn gửi Zalo/SMS cho khách để xác nhận địa chỉ">
              <i class="fa-solid fa-comment-dots"></i> 💬 Copy Zalo Msg
            </button>
            ${!isDeliveredOrCompleted ? `
              <button type="button" class="addr-btn-copy" onclick="toggleOrderAddressType(${order.id})" title="Chuyển đổi trạng thái đơn giữa Địa chỉ Mới và Cũ">
                <i class="fa-solid fa-arrows-rotate"></i> Đổi sang ${isOldAddr ? 'ĐC MỚI' : 'ĐC CŨ'}
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Tiến độ Đơn Pre-Order (Nếu đơn chứa mô hình đặt trước) -->
        ${(order.hasPreOrder || order.HasPreOrder) ? `
          <div style="background:linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border:1.5px solid #fde68a; border-radius:8px; padding:12px 14px; margin-bottom:14px; font-size:12.5px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
              <div style="display:flex; align-items:center; gap:6px; font-weight:800; color:#92400e; font-size:13px;">
                <span>⚡</span> PRE-ORDER STATUS
              </div>
              <div>
                ${(order.preOrderNotified || order.PreOrderNotified)
                  ? '<span class="badge-arrived" style="font-size:11px; font-weight:700; padding:3px 8px; border-radius:4px;"><i class="fa-solid fa-circle-check"></i> Hàng đã về kho Biên Hòa</span>'
                  : '<span style="background:#fee2e2; color:#b91c1c; font-size:11px; font-weight:700; padding:3px 8px; border-radius:4px;"><i class="fa-solid fa-clock"></i> Đang chờ hãng xuất xưởng</span>'
                }
              </div>
            </div>
            <div style="font-size:12px; color:#78350f; line-height:1.5;">
              <div>• Dự kiến phát hàng: <strong>${escapeHtml(order.preOrderExpected || order.PreOrderExpected || 'Theo thông báo hãng')}</strong></div>
              <div>• Tiền cọc: <strong>${formatVND(order.depositAmount || 0)}</strong> &bull; Trạng thái: <strong>${order.paymentStatus === 'PARTIALLY_PAID' ? '✓ Đã nhận cọc' : (order.paymentStatus === 'PAID' ? '✓ Đã thanh toán full 100%' : '⏳ Chưa nhận cọc')}</strong></div>
            </div>
            ${['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status) && !order.preOrderNotified && !order.PreOrderNotified ? `
              <div style="margin-top:10px; padding-top:8px; border-top:1px dashed #fcd34d; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                <button type="button" class="btn-admin btn-admin-primary" style="background:#d97706; border-color:#b45309; font-size:11.5px; padding:6px 14px;" onclick="markPreOrderArrivedAction(${order.id})">
                  <i class="fa-solid fa-boxes-packing"></i> Báo Hàng Pre-Order Đã Về Kho Biên Hòa
                </button>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- Bảng sản phẩm -->
        <div style="margin-bottom:14px;">
          <h4 style="font-size:13px; font-weight:800; color:#1e293b; margin-bottom:8px;">${t('order_items_title', 'Danh Sách Mô Hình Trong Đơn:')}</h4>
          <table style="width:100%; border-collapse:collapse; font-size:12.5px;">
            <thead>
              <tr style="background:#f1f5f9; text-align:left;">
                <th style="padding:8px 6px;">${t('th_product', 'Sản phẩm')}</th>
                <th style="text-align:center; padding:8px 6px;">${t('th_items_count', 'SL')}</th>
                <th style="text-align:right; padding:8px 6px;">${t('th_unit_price', 'Đơn giá')}</th>
                <th style="text-align:right; padding:8px 6px;">${t('th_line_total', 'Thành tiền')}</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
        </div>

        <!-- BẢNG ĐỐI SOÁT TÀI CHÍNH & COD SPX EXPRESS (CHÍNH XÁC & MINH BẠCH 100%) -->
        <div style="background:#ffffff; border:1.5px solid #fed7aa; border-radius:10px; padding:14px 16px; margin-bottom:14px; box-shadow:0 4px 12px rgba(234,88,12,0.06);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #ffedd5; padding-bottom:8px; flex-wrap:wrap; gap:6px;">
            <strong style="color:#c2410c; font-size:13.5px; display:flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-calculator"></i> BẢNG ĐỐI SOÁT DOANH THU &amp; THU HỘ COD (SPX EXPRESS)
            </strong>
            <span style="font-size:11px; padding:2px 8px; border-radius:4px; font-weight:700; background:#fff7ed; color:#ea580c; border:1px solid #fed7aa;">
              Phí ship 11k của SPX Express
            </span>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; font-size:12.5px; margin-bottom:12px;">
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#64748b;">Tổng tiền mô hình xe:</span>
                <strong>${formatVND(rawSubtotal)}</strong>
              </div>
              ${rawDiscount > 0 ? `
                <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:#16a34a;">
                  <span>Giảm giá Voucher:</span>
                  <strong>-${formatVND(rawDiscount)}</strong>
                </div>
              ` : ''}
              <div style="display:flex; justify-content:space-between; margin-bottom:4px; padding-top:4px; border-top:1px dashed #e2e8f0;">
                <span style="font-weight:700; color:#0f172a;">Tiền xe thực nhận của Shop:</span>
                <strong style="color:#2563eb; font-size:13.5px;">${formatVND(netModelTotal)}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:#64748b;">
                <span>Phí ship SPX Express (11k):</span>
                <span style="font-weight:600;">${formatVND(spxShipFee)} <em style="font-size:11px; color:#94a3b8;">(SPX nhận &amp; giữ cước)</em></span>
              </div>
              <div style="display:flex; justify-content:space-between; padding-top:4px; border-top:1px dashed #e2e8f0; font-weight:800;">
                <span style="color:#0f172a;">Tổng đơn khách trả:</span>
                <span style="color:#dc2626; font-size:14.5px;">${formatVND(orderTotal)}</span>
              </div>
            </div>

            <!-- Cột bên phải: Đối soát chuyển khoản & COD SPX -->
            <div style="background:#f8fafc; padding:10px 12px; border-radius:8px; border:1px solid #e2e8f0; font-size:12px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#64748b;">Khách đã cọc trước:</span>
                <strong style="color:#059669;">${formatVND(depositPaid)} ${depositPaid > 0 ? '(Đã vào STK Shop)' : ''}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#64748b;">Tiền xe còn lại chưa thu:</span>
                <strong style="color:#d97706;">${formatVND(remainingModel)}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; padding-top:4px; border-top:1px dashed #cbd5e1;">
                <span style="font-weight:700; color:#c2410c;">Shipper SPX thu hộ khi phát hàng (COD):</span>
                <strong style="color:#dc2626; font-size:14px;">${formatVND(codToCollect)}</strong>
              </div>
              <div style="font-size:11px; color:#64748b; line-height:1.4; margin-bottom:8px; background:#fff; padding:6px 8px; border-radius:6px; border:1px solid #e2e8f0;">
                ${codToCollect === 0 
                  ? '<i class="fa-solid fa-circle-check" style="color:#059669;"></i> Khách đã thanh toán 100%. Khi giao bưu tá SPX chỉ phát kiện, không thu tiền COD.'
                  : `<i class="fa-solid fa-circle-info" style="color:#0284c7;"></i> Shipper SPX thu từ khách <strong>${formatVND(codToCollect)}</strong> (gồm ${formatVND(remainingModel)} tiền xe + ${formatVND(spxShipFee)} ship). SPX giữ 11k tiền ship của SPX, và <strong>SPX tự động đối soát chuyển ${formatVND(spxReconcilePayout)}</strong> về STK ngân hàng Shop!`
                }
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding-top:4px; border-top:1.5px solid #cbd5e1; font-weight:800;">
                <span style="color:#0f172a;">Doanh thu Shop nhận trọn vẹn:</span>
                <strong style="color:#16a34a; font-size:14.5px;">${formatVND(shopTotalRevenue)}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Khung đối soát VietQR PayOS Tự Động hoặc App MB Bank -->
        ${(() => {
          const isPayOS = order.paymentMethod === 'VIETQR_PAYOS' || order.paymentMethod === 'PAYOS';
          const isDeposit = order.paymentMethod === 'DEPOSIT';
          const isTransfer = order.paymentMethod === 'BANK_TRANSFER';
          const memoText = `MINI GT #${order.code}`;
          const codVal = order.codAmount !== undefined 
            ? order.codAmount 
            : (order.paymentStatus === 'PAID' ? 0 : (order.depositAmount > 0 ? Math.max(0, order.total - order.depositAmount) : order.total));

          if (isPayOS) {
            const isPaid = order.paymentStatus === 'PAID';
            const isPartiallyPaid = order.paymentStatus === 'PARTIALLY_PAID';
            const payosHist = (order.history || []).find(h => h.by === 'SYSTEM_PAYOS' || (h.note && (h.note.includes('PayOS') || h.note.includes('VietQR'))));

            return `
              <div style="background:linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border:1.5px solid #86efac; border-radius:8px; padding:12px 14px; margin-bottom:14px; font-size:12.5px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
                  <div style="font-weight:800; color:#065f46; display:flex; align-items:center; gap:6px; font-size:13px;">
                    <i class="fa-solid fa-bolt" style="color:#059669;"></i> Cổng Thanh Toán Tự Động VietQR PayOS
                  </div>
                  <span style="font-size:11px; padding:3px 10px; border-radius:999px; font-weight:800; ${isPaid ? 'background:#059669; color:#fff;' : (isPartiallyPaid ? 'background:#2563eb; color:#fff;' : 'background:#fef3c7; color:#b45309;')}">
                    ${isPaid ? '✓ Đã nhận đủ tiền (Tự động)' : (isPartiallyPaid ? '✓ Đã nhận cọc VietQR' : '⏳ Đang chờ khách quét mã VietQR')}
                  </span>
                </div>

                <div style="background:#ffffff; border:1px solid #bbf7d0; border-radius:6px; padding:10px 12px; margin-bottom:8px;">
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px;">
                    <div>
                      <span style="color:#64748b;">Phương thức thanh toán:</span>
                      <div style="font-weight:700; color:#065f46;">Quét mã VietQR Ngân hàng (PayOS 24/7)</div>
                    </div>
                    <div>
                      <span style="color:#64748b;">Số tiền thực nhận qua cổng:</span>
                      <div style="font-weight:800; color:#059669; font-size:14px;">
                        ${isPaid ? formatVND(order.total) : (isPartiallyPaid ? formatVND(order.depositAmount || 100000) : 'Chưa nhận tiền')}
                      </div>
                    </div>
                  </div>
                  ${payosHist ? `
                    <div style="margin-top:8px; padding-top:6px; border-top:1px dashed #d1fae5; font-size:11.5px; color:#047857;">
                      <i class="fa-solid fa-clock-rotate-left"></i> <strong>Thời gian khớp lệnh PayOS:</strong> ${new Date(payosHist.createdAt).toLocaleString('vi-VN')}
                      <div style="color:#065f46; margin-top:2px; font-style:italic;">${escapeHtml(payosHist.note || '')}</div>
                    </div>
                  ` : ''}
                </div>

                <div style="font-size:12px; color:#065f46; line-height:1.5;">
                  ${order.depositAmount > 0 && !isPaid
                    ? `• Đơn Pre-Order đã nhận cọc qua VietQR: Khi shipper SPX giao phát hàng, tiền thu hộ COD còn lại là <strong>${formatVND(codVal)}</strong>.`
                    : (isPaid
                        ? `• Đơn hàng đã được thanh toán 100% tự động qua PayOS. Tiền thu COD khi giao hàng là <strong>0đ</strong>.`
                        : `• Hệ thống tự động đối soát Webhook PayOS. Ngay khi khách quét mã VietQR thành công, đơn sẽ tự động chuyển sang ĐÃ DUYỆT (CONFIRMED) & ĐÃ THANH TOÁN mà Admin không cần thao tác bấm xác nhận thủ công.`
                      )
                  }
                </div>

                <!-- Admin vẫn giữ toàn quyền can thiệp nếu cần duyệt tay hoặc xác nhận (Ẩn khi đơn đã hoàn tất) -->
                ${!isDeliveredOrCompleted && (order.paymentStatus !== 'PAID' || order.status === 'PENDING') ? `
                <div style="display:flex; gap:8px; margin-top:10px; padding-top:8px; border-top:1px solid #bbf7d0; flex-wrap:wrap; align-items:center;">
                  <span style="font-size:11px; color:#64748b;">Can thiệp Admin:</span>
                  ${order.paymentStatus !== 'PAID' ? `
                    <button type="button" class="btn-admin btn-admin-primary" style="font-size:11.5px; padding:4px 10px; background:#059669; border-color:#059669;" onclick="confirmPaymentAction(${order.id}, 'full')">
                      <i class="fa-solid fa-circle-check"></i> Xác nhận đã nhận đủ (${formatVND(order.total)})
                    </button>
                  ` : ''}
                  ${order.status === 'PENDING' ? `
                    <button type="button" class="btn-admin btn-admin-primary" style="font-size:11.5px; padding:4px 10px; background:#1d4ed8; border-color:#1d4ed8;" onclick="changeOrderStatus(${order.id}, 'CONFIRMED')">
                      <i class="fa-solid fa-check-double"></i> Duyệt đơn hàng
                    </button>
                  ` : ''}
                </div>
                ` : ''}
              </div>
            `;
          }

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

              ${!isDeliveredOrCompleted && order.paymentStatus !== 'PAID' ? `
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
              ${!isDeliveredOrCompleted ? `<button type="button" class="btn-admin btn-admin-primary" style="background:#ea580c; border-color:#ea580c; font-size:11px; padding:3px 10px;" onclick="openShipSpxModal(${order.id})"><i class="fa-solid fa-truck-fast"></i> ${order.trackingCode ? 'Sửa mã SPX' : 'Tạo / Dán mã SPX'}</button>` : '<span style="font-size:11px; color:#059669; font-weight:700;"><i class="fa-solid fa-lock"></i> Đã giao thành công</span>'}
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
      const toastMsg = nextStatus === 'DELIVERED'
        ? '🎉 Đã xác nhận giao hàng thành công! Thư cảm ơn & cẩm nang bảo quản xe 1:64 đã được tự động gửi qua email cho khách hàng.'
        : (res.message || 'Đã duyệt & cập nhật trạng thái đơn hàng! Khách hàng đã nhận được thông báo.');
      adminToast(toastMsg, 'success');
      if (api && typeof api.emitRealtimeSync === 'function') {
        const orderData = (res && res.data) ? res.data : { id: orderId, status: nextStatus };
        api.emitRealtimeSync('ORDER_UPDATED', {
          orderId,
          orderCode: orderData.code || orderData.OrderCode,
          status: nextStatus,
          order: orderData
        });
      }
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
      if (api && typeof api.emitRealtimeSync === 'function') {
        const orderData = (res && res.data) ? res.data : { id: orderId };
        api.emitRealtimeSync('ORDER_UPDATED', {
          orderId,
          orderCode: orderData.code || orderData.OrderCode,
          paymentStatus: kind === 'deposit' ? 'PARTIALLY_PAID' : 'PAID',
          order: orderData
        });
      }
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
        const isOld = currentActionOrderData.addressType === 'OLD' || currentActionOrderData.isOldAddress;

        dispatchInfo.innerHTML = `
          <div><strong>Người nhận:</strong> ${escapeHtml(currentActionOrderData.customer.fullName)}</div>
          <div><strong>Số điện thoại:</strong> ${escapeHtml(currentActionOrderData.customer.phone)}</div>
          <div>
            <strong>Địa chỉ:</strong> ${escapeHtml(currentActionOrderData.customer.address)}
            <span class="${isOld ? 'badge-addr-old' : 'badge-addr-new'}" style="margin-left:6px;">
              <i class="fa-solid ${isOld ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
              ${isOld ? 'ĐC CŨ TRƯỚC SÁP NHẬP' : 'ĐC MỚI CHUẨN'}
            </span>
          </div>
          ${currentActionOrderData.oldAddressNote ? `<div style="color:#c2410c; font-size:11.5px; margin-top:2px;">⚠️ Ghi chú cũ: <em>${escapeHtml(currentActionOrderData.oldAddressNote)}</em></div>` : ''}
          ${isOld ? `<div style="color:#c2410c; font-size:11.5px; margin-top:2px;">⚠️ <em>Lưu ý đối chiếu: Khách dùng địa chỉ cũ. Khi chọn danh mục trên App SPX Express, hãy chọn phường mới tương đương hoặc hỏi lại khách!</em></div>` : ''}
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

    const isOld = currentActionOrderData.addressType === 'OLD' || currentActionOrderData.isOldAddress;
    const itemsSummary = (currentActionOrderData.items || []).map(i => `${i.name} (x${i.quantity})`).join(', ');

    const text = `NGƯỜI NHẬN: ${currentActionOrderData.customer.fullName}
SĐT: ${currentActionOrderData.customer.phone}
ĐỊA CHỈ: ${currentActionOrderData.customer.address} [${isOld ? 'ĐỊA CHỈ CŨ TRƯỚC SÁP NHẬP' : 'ĐỊA CHỈ MỚI'}]
THU HỘ COD: ${formatVND(codAmount)}
HÀNG HÓA: Mô hình 1:64 Mini GT [${itemsSummary || 'Mô hình xe'}]
MÃ ĐƠN SHOP: #${currentActionOrderData.code}`;

    copyTextToClipboard(text, 'Đã sao chép toàn bộ thông tin gửi hàng cho SPX!');
  }

  // Tiện ích 1: Sao chép địa chỉ chuẩn đối soát để paste trực tiếp vào SPX Express / GHTK
  async function copySpxFormattedAddress(orderId) {
    try {
      const res = await api.get(`/api/admin/orders/${orderId}`);
      if (!res.success || !res.data) return;
      const order = res.data;
      const isOld = order.addressType === 'OLD' || order.isOldAddress;
      const codVal = order.codAmount !== undefined 
        ? order.codAmount 
        : (order.paymentStatus === 'PAID' ? 0 : (order.depositAmount > 0 ? Math.max(0, order.total - order.depositAmount) : order.total));

      let addrText = order.customer.address;
      if (isOld) {
        if (order.newAddressEquivalent) {
          addrText += ` (Chuẩn mới tương đương: ${order.newAddressEquivalent})`;
        } else if (order.oldAddressNote) {
          addrText += ` (Ghi chú cũ: ${order.oldAddressNote})`;
        }
      }

      const text = `Người nhận: ${order.customer.fullName}
Số điện thoại: ${order.customer.phone}
Địa chỉ giao hàng: ${addrText}
Tiền thu COD: ${formatVND(codVal)}
Ghi chú gửi: Mô hình xe 1:64 Mini GT Store Biên Hòa #${order.code} - Cho kiểm tra hàng`;

      copyTextToClipboard(text, 'Đã sao chép địa chỉ chuẩn tạo đơn SPX Express!');
    } catch (e) {
      adminToast('Lỗi sao chép địa chỉ: ' + e.message, 'error');
    }
  }

  // Tiện ích 2: Sao chép mẫu tin nhắn soạn sẵn gửi khách qua Zalo/SMS để hỏi lại địa chỉ
  async function copyCustomerAddressConfirmMsg(orderId) {
    try {
      const res = await api.get(`/api/admin/orders/${orderId}`);
      if (!res.success || !res.data) return;
      const order = res.data;
      const isOld = order.addressType === 'OLD' || order.isOldAddress;

      const msg = `Dạ chào anh/chị ${order.customer.fullName}, Shop Mô Hình Mini GT Biên Hòa đã tiếp nhận đơn #${order.code} của mình ạ!

Dạ em thấy địa chỉ nhận hàng của mình: "${order.customer.address}"${isOld ? ' (đang dùng tên phường/quận cũ trước đợt sáp nhập ĐVHC)' : ''}.
Để bên em tạo mã vận đơn qua SPX Express phát nhanh nhất và tránh shipper giao nhầm bưu cục khác, anh/chị cho shop xác nhận lại địa chỉ hành chính mới của mình${order.newAddressEquivalent ? ` có phải là: "${order.newAddressEquivalent}" không ạ?` : ' nhé ạ!'}

Anh/chị phản hồi giúp shop để kiện xe được đóng gói gửi đi sớm nhất nhé ạ. Em cảm ơn anh/chị nhiều!`;

      copyTextToClipboard(msg, 'Đã sao chép tin nhắn Zalo/SMS báo khách xác nhận địa chỉ!');
    } catch (e) {
      adminToast('Lỗi sao chép tin nhắn: ' + e.message, 'error');
    }
  }

  // Tiện ích 3: Chuyển đổi qua lại giữa Địa chỉ Mới và Địa chỉ Cũ chỉ với 1-Click
  async function toggleOrderAddressType(orderId) {
    try {
      const resOrder = await api.get(`/api/admin/orders/${orderId}`);
      if (!resOrder.success || !resOrder.data) return;
      const currentType = resOrder.data.addressType || (resOrder.data.isOldAddress ? 'OLD' : 'NEW');
      const targetType = currentType === 'OLD' ? 'NEW' : 'OLD';

      const res = await api.put(`/api/admin/orders/${orderId}/address-type`, {
        addressType: targetType
      });

      adminToast(res.message || `Đã chuyển sang ${targetType === 'OLD' ? 'Địa chỉ CŨ' : 'Địa chỉ MỚI'} thành công!`, 'success');
      loadOrders();
      if (document.getElementById('orderDetailModal')?.classList.contains('active')) {
        viewOrderDetail(orderId);
      }
    } catch (e) {
      adminToast('Lỗi cập nhật loại địa chỉ: ' + e.message, 'error');
    }
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
      if (api && typeof api.emitRealtimeSync === 'function') {
        const orderData = (res && res.data) ? res.data : { id: currentActionOrderId, trackingCode: code };
        api.emitRealtimeSync('ORDER_UPDATED', {
          orderId: currentActionOrderId,
          orderCode: orderData.code || orderData.OrderCode,
          trackingCode: code,
          order: orderData
        });
      }
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
      const res = await api.put(`/api/admin/orders/${currentActionOrderId}/tracking`, {
        trackingCode: code,
        carrier: 'SPX Express',
        autoShip: true
      });
      adminToast(`Đã duyệt & chuyển giao SPX Express (Mã: ${code})! Đã gửi thông báo đến khách hàng.`, 'success');
      if (api && typeof api.emitRealtimeSync === 'function') {
        const orderData = (res && res.data) ? res.data : { id: currentActionOrderId, trackingCode: code, status: 'SHIPPING' };
        api.emitRealtimeSync('ORDER_UPDATED', {
          orderId: currentActionOrderId,
          orderCode: orderData.code || orderData.OrderCode,
          status: 'SHIPPING',
          trackingCode: code,
          order: orderData
        });
      }
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

  function setCancelReasonPreset(reason) {
    const input = document.getElementById('cancelOrderReasonInput');
    if (input) {
      input.value = reason;
      input.focus();
    }
  }

  async function confirmCancelOrderSubmit() {
    if (!currentActionOrderId) return;
    const reason = document.getElementById('cancelOrderReasonInput')?.value.trim();
    if (!reason || reason.length < 3) {
      adminToast('Vui lòng nhập hoặc chọn lý do hủy đơn (tối thiểu 3 ký tự)', 'error');
      return;
    }

    try {
      const res = await api.put(`/api/admin/orders/${currentActionOrderId}/cancel`, { cancelReason: reason });
      adminToast(res.message || 'Đã hủy đơn hàng thành công!', 'info');
      closeAdminModal('cancelOrderModal');
      loadOrders();
      loadDashboard();
      if (document.getElementById('orderDetailModal')?.classList.contains('active')) {
        viewOrderDetail(currentActionOrderId);
      }
      if (api && typeof api.emitRealtimeSync === 'function') {
        api.emitRealtimeSync('ORDER_UPDATED', {
          orderCode: res.data?.code,
          status: 'CANCELLED',
          cancelReason: reason,
          order: res.data
        });
      }
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
      o.code || o.OrderCode || o.id,
      `"${((o.customer && o.customer.fullName) || o.fullName || o.FullName || '').replace(/"/g, '""')}"`,
      `"${(o.customer && o.customer.phone) || o.phone || o.Phone || ''}"`,
      `"${((o.customer && o.customer.address) || o.address || o.Address || '').replace(/"/g, '""')}"`,
      o.total ?? o.Total ?? 0,
      o.paymentMethod || o.PaymentMethod || 'COD',
      o.paymentStatus || o.PaymentStatus || 'UNPAID',
      o.status || o.Status || 'PENDING',
      o.trackingCode || o.TrackingCode || '',
      new Date(o.createdAt || o.CreatedAt || Date.now()).toLocaleString('vi-VN')
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
    startProgressBar();
    renderTableSkeletons('usersTbody', 10, 5);
    const search = document.getElementById('userSearchInput')?.value.trim();
    try {
      const res = await api.get('/api/admin/users', { search });
      if (res.success && res.data) {
        cachedUsers = res.data;
        renderUsersTable(cachedUsers);
      }
    } catch (err) {
      adminToast('Không thể tải danh sách khách hàng: ' + err.message, 'error');
    } finally {
      finishProgressBar();
    }
  }

  const handleUserSearchDebounced = debounce(() => {
    loadUsers();
  }, 350);

  function renderUsersTable(users) {
    const tbody = document.getElementById('usersTbody');
    if (!tbody) return;

    if (!users || !users.length) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:2rem; color:#64748b;">${t('no_customers_found', 'Không tìm thấy khách hàng nào')}</td></tr>`;
      return;
    }

    const locale = (localStorage.getItem('minigt_lang') === 'en') ? 'en-US' : 'vi-VN';

    tbody.innerHTML = users.map(u => {
      const uId = u.userId || u.id || '-';
      const uFullName = u.fullName || u.name || t('cust_fallback_name', 'Hội viên MINI GT');
      const uEmail = u.email || '-';
      const uPhone = u.phone || '-';
      const uAddress = u.address || '-';
      const uAddressType = String(u.addressType || 'NEW').toUpperCase();
      const uOldNote = u.oldAddressNote || u.oldWardNote || '';
      const uOrders = u.totalOrders != null ? u.totalOrders : 0;
      const uSpent = Number(u.totalSpent || 0);
      const uRole = String(u.role || 'customer').toLowerCase();
      const uIsActive = u.isActive !== false;
      const vip = getCustomerVipInfo(uSpent);

      let createdDate = '-';
      if (u.createdAt) {
        try {
          const d = new Date(u.createdAt);
          if (!isNaN(d.getTime())) createdDate = d.toLocaleDateString(locale);
        } catch (_) {}
      }

      // Badge loại địa chỉ
      const addrTypeBadge = uAddressType === 'OLD'
        ? `<span class="badge" style="font-size:10px; background:#fffbeb; color:#b45309; border:1px solid #fde68a; border-radius:4px; padding:1px 5px; font-weight:700; margin-right:4px;" title="Địa chỉ cũ trước sáp nhập ĐVHC"><i class="fa-solid fa-clock-rotate-left"></i> ${t('cust_addr_old', 'ĐC CŨ')}</span>`
        : `<span class="badge" style="font-size:10px; background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; border-radius:4px; padding:1px 5px; font-weight:700; margin-right:4px;" title="Địa chỉ mới sau sáp nhập ĐVHC"><i class="fa-solid fa-circle-check"></i> ${t('cust_addr_new', 'ĐC MỚI')}</span>`;

      const oldNoteHtml = uOldNote
        ? `<div style="font-size:10.5px; color:#b45309; font-style:italic; margin-top:2px;" title="Ghi chú: ${escapeHtml(uOldNote)}"><i class="fa-solid fa-info-circle"></i> ${escapeHtml(uOldNote)}</div>`
        : '';

      return `
        <tr>
          <td><strong style="color:#0f172a;">#${escapeHtml(String(uId))}</strong></td>
          <td>
            <div style="font-weight:700; color:#0f172a;">${escapeHtml(uFullName)}</div>
            <div style="font-size:11px; color:#64748b;">${t('cust_joined', 'Tham gia')}: ${createdDate}</div>
          </td>
          <td><span style="font-size:12px; color:#334155;">${escapeHtml(uEmail)}</span></td>
          <td><span style="font-size:12px; font-weight:600; color:#0f172a;">${escapeHtml(uPhone)}</span></td>
          <td style="max-width:220px;">
            <div style="display:flex; align-items:center; gap:4px; margin-bottom:2px;">
              ${addrTypeBadge}
            </div>
            <div style="font-size:12px; color:#334155; line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(uAddress)}">
              ${escapeHtml(uAddress)}
            </div>
            ${oldNoteHtml}
          </td>
          <td>
            <button type="button" class="btn-admin btn-admin-outline" style="padding:2px 8px; font-size:12px; font-weight:700; border-color:#cbd5e1;" onclick="viewUserOrders('${escapeHtml(String(uId))}')" title="${t('view_user_orders_title', 'Xem lịch sử mua hàng của khách')}">
              ${uOrders} ${t('orders_unit', 'đơn')} ➔
            </button>
          </td>
          <td><strong style="color:#e10600; font-size:13px;">${formatVND(uSpent)}</strong></td>
          <td>
            <span class="vip-badge vip-${vip.level}" style="background:${vip.bg}; color:${vip.color}; border:1px solid ${vip.border}; padding:3px 8px; border-radius:12px; font-weight:800; font-size:11px; display:inline-flex; align-items:center; gap:4px;">
              <i class="fa-solid ${vip.icon}"></i> ${vip.label}
            </span>
            <div style="font-size:10.5px; color:#64748b; margin-top:2px;">${vip.tierName}</div>
          </td>
          <td>
            <span class="status-badge" style="background:${uRole === 'admin' ? '#fef2f2' : '#f1f5f9'}; color:${uRole === 'admin' ? '#dc2626' : '#475569'}; font-weight:700; font-size:11px; text-transform:uppercase; padding:3px 7px; border-radius:4px;">
              ${escapeHtml(uRole)}
            </span>
          </td>
          <td>
            <span style="font-size:12px; font-weight:700; color:${uIsActive ? '#059669' : '#dc2626'};">
              ${uIsActive ? `● ${t('user_active', 'Hoạt động')}` : `● ${t('user_locked', 'Bị khóa')}`}
            </span>
          </td>
          <td style="text-align:right; white-space:nowrap;">
            <div style="display:inline-flex; align-items:center; gap:4px;">
              <button class="btn-admin btn-admin-outline" style="padding:4px 8px; font-size:11.5px; color:#2563eb; border-color:#93c5fd;" onclick="viewUserOrders('${escapeHtml(String(uId))}')" title="${t('view_user_orders_title', 'Xem lịch sử mua hàng của khách')}">
                <i class="fa-solid fa-clock-rotate-left"></i> ${t('btn_view_history', 'Lịch sử')}
              </button>
              <button class="btn-admin btn-admin-outline" style="padding:4px 8px; font-size:11.5px;" onclick="toggleUserStatus('${escapeHtml(String(uId))}', ${!uIsActive})" title="${uIsActive ? t('btn_lock', 'Khóa') : t('btn_unlock', 'Mở')}">
                ${uIsActive ? `<i class="fa-solid fa-lock" style="color:#dc2626;"></i> ${t('btn_lock', 'Khóa')}` : `<i class="fa-solid fa-lock-open" style="color:#059669;"></i> ${t('btn_unlock', 'Mở')}`}
              </button>
              <button class="btn-admin btn-admin-outline" style="padding:4px 8px; font-size:11.5px;" onclick="changeUserRole('${escapeHtml(String(uId))}', '${uRole === 'admin' ? 'customer' : 'admin'}')" title="Đổi quyền">
                ${uRole === 'admin' ? `<i class="fa-solid fa-arrow-down" style="color:#475569;"></i> ${t('btn_demote_cust', 'Hạ Cust')}` : `<i class="fa-solid fa-shield" style="color:#2563eb;"></i> ${t('btn_promote_admin', 'Lên Admin')}`}
              </button>
              <button class="btn-admin btn-admin-outline" style="padding:4px 8px; font-size:11.5px; color:#dc2626; border-color:#fecaca;" onclick="deleteUserAction('${escapeHtml(String(uId))}')" title="Xóa tài khoản này">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Tra cứu chi tiết hồ sơ & lịch sử đơn hàng của khách
  async function viewUserOrders(userId) {
    if (!userId) return;
    openAdminModal('userOrdersModal');
    const container = document.getElementById('userOrdersModalBody');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align:center; padding:3rem 0; color:#64748b;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size:28px; color:#e10600;"></i>
        <p style="margin-top:10px; font-weight:600;">${t('user_orders_loading', 'Đang tải hồ sơ & lịch sử mua hàng của khách...')}</p>
      </div>
    `;

    try {
      const res = await api.get(`/api/admin/users/${userId}/orders`);
      if (!res.success || !res.data) {
        container.innerHTML = `<div style="text-align:center; padding:2rem; color:#dc2626;">${escapeHtml(res.message || 'Không thể tải lịch sử đơn hàng')}</div>`;
        return;
      }

      const { user, orders, stats } = res.data;
      const vip = getCustomerVipInfo(stats.totalSpent);
      const locale = (localStorage.getItem('minigt_lang') === 'en') ? 'en-US' : 'vi-VN';

      const ordersListHtml = orders && orders.length ? orders.map(o => `
        <tr>
          <td><strong style="color:#e10600; font-family:monospace;">#${escapeHtml(o.code)}</strong></td>
          <td style="font-size:12px; color:#64748b;">${new Date(o.createdAt).toLocaleString(locale)}</td>
          <td><strong style="color:#0f172a;">${formatVND(o.total)}</strong></td>
          <td>${renderPaymentBadge(o.paymentStatus, o.paymentMethod)}</td>
          <td>${renderOrderBadge(o.status)}</td>
          <td style="font-size:12px;">${o.itemsCount || (o.items ? o.items.length : 1)} ${t('items_unit', 'mẫu')}</td>
          <td style="text-align:right;">
            <button type="button" class="btn-admin btn-admin-outline" style="padding:3px 8px; font-size:11px;" onclick="closeAdminModal('userOrdersModal'); viewOrderDetail(${o.id});">
              ${t('btn_detail', 'Chi tiết')} ➔
            </button>
          </td>
        </tr>
      `).join('') : `<tr><td colspan="7" style="text-align:center; padding:1.5rem; color:#64748b;">${t('no_orders_yet', 'Khách hàng chưa có đơn hàng nào')}</td></tr>`;

      container.innerHTML = `
        <div style="border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <span style="font-size:11px; font-weight:800; background:#fef2f2; color:#dc2626; padding:2px 8px; border-radius:4px;">${t('user_orders_title', 'Hồ Sơ & Lịch Sử Mua Hàng Của Khách')}</span>
            <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin:4px 0 0 0;">
              ${escapeHtml(user.fullName || user.name || t('cust_fallback_name', 'Khách hàng'))} <span style="font-size:13px; color:#64748b; font-weight:600;">(#${escapeHtml(String(user.id))})</span>
            </h3>
          </div>
          <span class="vip-badge vip-${vip.level}" style="background:${vip.bg}; color:${vip.color}; border:1px solid ${vip.border}; padding:4px 10px; border-radius:12px; font-weight:800; font-size:12px; display:inline-flex; align-items:center; gap:5px;">
            <i class="fa-solid ${vip.icon}"></i> ${vip.label} (${vip.tierName})
          </span>
        </div>

        <div class="user-orders-summary-grid">
          <div class="user-stat-card">
            <div class="user-stat-icon" style="background:#eff6ff; color:#2563eb;"><i class="fa-solid fa-bag-shopping"></i></div>
            <div class="user-stat-meta">
              <div class="stat-label">${t('th_total_orders', 'Tổng Đơn Hàng')}</div>
              <div class="stat-number">${stats.totalOrders} ${t('orders_unit', 'đơn')}</div>
            </div>
          </div>
          <div class="user-stat-card">
            <div class="user-stat-icon" style="background:#f0fdf4; color:#16a34a;"><i class="fa-solid fa-coins"></i></div>
            <div class="user-stat-meta">
              <div class="stat-label">${t('kpi_revenue', 'Tổng Doanh Thu')}</div>
              <div class="stat-number" style="color:#059669;">${formatVND(stats.totalSpent)}</div>
            </div>
          </div>
          <div class="user-stat-card">
            <div class="user-stat-icon" style="background:#fef3c7; color:#d97706;"><i class="fa-solid fa-calendar-check"></i></div>
            <div class="user-stat-meta">
              <div class="stat-label">${t('user_joined_date', 'Ngày Tham Gia')}</div>
              <div class="stat-number" style="font-size:13.5px;">${new Date(user.createdAt || Date.now()).toLocaleDateString(locale)}</div>
            </div>
          </div>
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px; margin-bottom:14px; font-size:12px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div>
            <div><span style="color:#64748b;">Email:</span> <strong>${escapeHtml(user.email || '-')}</strong></div>
            <div style="margin-top:2px;"><span style="color:#64748b;">${t('phone_lbl', 'Điện thoại')}:</span> <strong>${escapeHtml(user.phone || '-')}</strong></div>
          </div>
          <div>
            <div><span style="color:#64748b;">${t('address_lbl', 'Địa chỉ')}:</span> <strong>${escapeHtml(user.address || '-')}</strong></div>
            <div style="margin-top:2px;"><span style="color:#64748b;">${t('account_status_lbl', 'Trạng thái')}:</span> <strong style="color:${user.isActive !== false ? '#059669' : '#dc2626'};">${user.isActive !== false ? t('user_active', 'Hoạt động') : t('user_locked', 'Bị khóa')}</strong></div>
          </div>
        </div>

        <div class="admin-table-wrapper" style="max-height:360px; overflow-y:auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>${t('th_order_code', 'Mã Đơn')}</th>
                <th>${t('th_created_at', 'Ngày Đặt')}</th>
                <th>${t('th_total', 'Tổng Tiền')}</th>
                <th>${t('th_payment', 'Thanh Toán')}</th>
                <th>${t('th_order_status', 'Trạng Thái')}</th>
                <th>${t('th_items_count', 'Số Lượng')}</th>
                <th style="text-align:right;">${t('th_actions', 'Thao Tác')}</th>
              </tr>
            </thead>
            <tbody>
              ${ordersListHtml}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="text-align:center; padding:2rem; color:#dc2626;">Lỗi khi tải lịch sử khách hàng: ${escapeHtml(err.message)}</div>`;
    }
  }

  async function toggleUserStatus(userId, willBeActive) {
    const action = willBeActive ? 'mở khóa' : 'khóa';
    if (!confirm(`Bạn có chắc muốn ${action} tài khoản #${userId}?`)) return;
    try {
      const res = await api.put(`/api/admin/users/${userId}/status`, { isActive: willBeActive });
      adminToast(res.message || 'Cập nhật thành công', 'success');
      loadUsers();
      loadDashboard();
    } catch (err) {
      adminToast('Lỗi: ' + err.message, 'error');
    }
  }

  async function changeUserRole(userId, newRole) {
    if (!confirm(`Bạn có chắc muốn đổi quyền của người dùng #${userId} sang "${newRole.toUpperCase()}"?`)) return;
    try {
      const res = await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      adminToast(res.message || 'Cập nhật vai trò thành công', 'success');
      loadUsers();
      loadDashboard();
    } catch (err) {
      adminToast('Lỗi: ' + err.message, 'error');
    }
  }

  async function deleteUserAction(userId) {
    if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn tài khoản #${userId}? Thao tác này không thể hoàn tác.`)) return;
    try {
      const res = await api.delete(`/api/admin/users/${userId}`);
      adminToast(res.message || 'Đã xóa tài khoản thành công', 'success');
      loadUsers();
      loadDashboard();
    } catch (err) {
      adminToast('Lỗi khi xóa tài khoản: ' + err.message, 'error');
    }
  }

  // =====================================================================
  // 7B. TAB: QUẢN LÝ MÃ GIẢM GIÁ & VOUCHER VIP
  // =====================================================================
  let cachedCoupons = [];

  async function loadCoupons() {
    startProgressBar();
    renderTableSkeletons('couponsTbody', 8, 4);
    try {
      const res = await api.get('/api/admin/coupons');
      if (res && res.success && res.data) {
        cachedCoupons = res.data;
        renderCouponsTable(cachedCoupons);
      } else {
        renderCouponsTable([]);
      }
    } catch (err) {
      console.warn('[COUPONS LOAD ERROR]:', err);
      adminToast('Không thể tải danh sách mã giảm giá: ' + (err.message || 'Lỗi mạng'), 'error');
    } finally {
      finishProgressBar();
    }
  }

  function renderCouponsTable(coupons) {
    const tbody = document.getElementById('couponsTbody');
    if (!tbody) return;

    if (!coupons || !coupons.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding:2rem; color:#64748b;">
            <i class="fa-solid fa-ticket" style="font-size:24px; color:#cbd5e1; display:block; margin-bottom:8px;"></i>
            ${t('coupons_empty', 'Chưa có mã giảm giá nào do Admin tạo. Bấm nút "+ Tạo Mã Giảm Giá Mới" để thêm mã ưu đãi!')}
          </td>
        </tr>
      `;
      return;
    }

    const badgeCount = document.getElementById('sidebarCouponsCount');
    if (badgeCount) {
      badgeCount.textContent = coupons.filter(c => c.isActive).length;
    }

    tbody.innerHTML = coupons.map(c => {
      const isPercent = c.discountType === 'percent';
      const discountDisplay = isPercent
        ? `<strong style="color:#e10600; font-size:13px;">-${c.discountValue}%</strong>`
        : `<strong style="color:#059669; font-size:13px;">-${formatVND(c.discountValue)}</strong>`;
      
      const typeLabel = isPercent
        ? `<span class="status-badge" style="background:#fef2f2; color:#dc2626; font-weight:700;">${t('coupon_type_pct', 'Giảm theo %')}</span>`
        : `<span class="status-badge" style="background:#ecfdf5; color:#059669; font-weight:700;">${t('coupon_type_amt', 'Giảm tiền mặt')}</span>`;

      const minOrderText = c.minOrderAmount > 0 ? formatVND(c.minOrderAmount) : `<span style="color:#94a3b8;">${t('coupon_no_min', 'Không yêu cầu')}</span>`;
      const usageText = `<span style="font-weight:700; color:#0f172a;">${c.usedCount || 0}</span> / ${c.usageLimit || 100}`;
      
      let expText = `<span style="color:#94a3b8;">${t('coupon_no_exp', 'Vô thời hạn')}</span>`;
      let isExpired = false;
      if (c.endDate) {
        const expDate = new Date(c.endDate + 'T23:59:59');
        isExpired = Date.now() > expDate.getTime();
        expText = isExpired
          ? `<span style="color:#dc2626; font-weight:700;"><i class="fa-solid fa-clock"></i> ${t('coupon_expired', 'Đã hết hạn')} (${c.endDate})</span>`
          : `<span style="color:#475569;">${c.endDate}</span>`;
      }

      const activeBadge = c.isActive && !isExpired
        ? `<span class="status-badge" style="background:#ecfdf5; color:#059669; font-weight:700; cursor:pointer;"><i class="fa-solid fa-circle-check"></i> ${t('coupon_active', 'Đang Bật')}</span>`
        : `<span class="status-badge" style="background:#f1f5f9; color:#94a3b8; font-weight:700; cursor:pointer;"><i class="fa-solid fa-circle-pause"></i> ${t('coupon_inactive', 'Đã Tắt')}</span>`;

      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-family:monospace; font-size:13px; font-weight:800; background:#fff7ed; color:#ea580c; border:1px solid #fdba74; padding:3px 8px; border-radius:6px; letter-spacing:0.5px;">
                ${escapeHtml(c.code)}
              </span>
              <button type="button" onclick="copyTextToClipboard('${escapeHtml(c.code)}', 'Đã sao chép mã ${escapeHtml(c.code)}')" style="border:none; background:none; color:#64748b; cursor:pointer; font-size:11px;" title="Sao chép mã">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>
          </td>
          <td style="max-width:240px;">
            <div style="font-weight:600; color:#0f172a; line-height:1.4;">${escapeHtml(c.description || '-')}</div>
          </td>
          <td>${typeLabel}</td>
          <td>${discountDisplay}</td>
          <td>${minOrderText}</td>
          <td>${usageText}</td>
          <td>${expText}</td>
          <td onclick="handleToggleCouponStatus(${c.couponId || c.id}, ${!c.isActive})">${activeBadge}</td>
          <td style="text-align:right;">
            <div style="display:inline-flex; gap:6px;">
              <button class="btn-admin btn-admin-outline" style="padding:3px 8px; font-size:11.5px;" onclick="openCouponModal(${c.couponId || c.id})" title="${t('btn_edit', 'Chỉnh sửa')}">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-admin btn-admin-outline" style="padding:3px 8px; font-size:11.5px; color:#dc2626;" onclick="handleDeleteCoupon(${c.couponId || c.id}, '${escapeHtml(c.code)}')" title="${t('btn_delete', 'Xóa mã')}">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function handleDiscountTypeChange(val) {
    const isPct = val === 'percent';
    const label = document.getElementById('couponValueLabel');
    const valInput = document.getElementById('couponDiscountValue');
    const maxGroup = document.getElementById('couponMaxDiscountGroup');
    if (label) {
      label.innerHTML = isPct
        ? 'Phần trăm giảm (%) — <strong style="color:#e10600;">Tối đa 10%</strong> <span style="color:#ef4444;">*</span>'
        : 'Số tiền giảm (VNĐ) <span style="color:#ef4444;">*</span>';
    }
    if (valInput) {
      valInput.placeholder = isPct ? 'Ví dụ: 5 hoặc 10 (tối đa 10%)' : 'Ví dụ: 50000';
      valInput.max = isPct ? 10 : '';
    }
    if (maxGroup) {
      maxGroup.style.display = isPct ? 'block' : 'none';
    }
  }

  function openCouponModal(couponId = null) {
    const modal = document.getElementById('couponModal');
    const titleEl = document.getElementById('couponModalTitle');
    const editIdInput = document.getElementById('couponEditId');
    const codeInput = document.getElementById('couponCodeInput');
    const descInput = document.getElementById('couponDescInput');
    const typeSelect = document.getElementById('couponDiscountType');
    const valInput = document.getElementById('couponDiscountValue');
    const minOrdInput = document.getElementById('couponMinOrder');
    const maxDiscInput = document.getElementById('couponMaxDiscount');
    const limitInput = document.getElementById('couponUsageLimit');
    const dateInput = document.getElementById('couponEndDate');
    const activeCheck = document.getElementById('couponIsActive');

    if (!modal) return;

    if (couponId) {
      const c = cachedCoupons.find(item => (item.couponId || item.id) === Number(couponId));
      if (!c) {
        adminToast('Không tìm thấy thông tin mã giảm giá!', 'error');
        return;
      }
      if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-ticket" style="color:var(--color-primary);"></i> ${t('coupon_modal_edit_title', 'Sửa Mã Giảm Giá')}: <strong>${escapeHtml(c.code)}</strong>`;
      if (editIdInput) editIdInput.value = c.couponId || c.id;
      if (codeInput) { codeInput.value = c.code; codeInput.readOnly = false; }
      if (descInput) descInput.value = c.description || '';
      if (typeSelect) typeSelect.value = c.discountType || 'amount';
      if (valInput) valInput.value = c.discountValue || '';
      if (minOrdInput) minOrdInput.value = c.minOrderAmount || 0;
      if (maxDiscInput) maxDiscInput.value = c.maxDiscount || '';
      if (limitInput) limitInput.value = c.usageLimit || 100;
      if (dateInput) dateInput.value = c.endDate ? c.endDate.slice(0, 10) : '';
      if (activeCheck) activeCheck.checked = Boolean(c.isActive);
      handleDiscountTypeChange(c.discountType || 'amount');
    } else {
      if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-ticket" style="color:var(--color-primary);"></i> ${t('coupon_modal_title', 'Tạo Mã Giảm Giá Mới')}`;
      if (editIdInput) editIdInput.value = '';
      if (codeInput) { codeInput.value = ''; codeInput.readOnly = false; }
      if (descInput) descInput.value = '';
      if (typeSelect) typeSelect.value = 'amount';
      if (valInput) valInput.value = '';
      if (minOrdInput) minOrdInput.value = '0';
      if (maxDiscInput) maxDiscInput.value = '';
      if (limitInput) limitInput.value = '100';
      if (dateInput) dateInput.value = '';
      if (activeCheck) activeCheck.checked = true;
      handleDiscountTypeChange('amount');
    }

    modal.classList.add('active');
  }

  async function handleSaveCoupon(e) {
    if (e && e.preventDefault) e.preventDefault();
    const editId = document.getElementById('couponEditId')?.value;
    const code = document.getElementById('couponCodeInput')?.value.trim().toUpperCase();
    const description = document.getElementById('couponDescInput')?.value.trim();
    const discountType = document.getElementById('couponDiscountType')?.value;
    const discountValue = Number(document.getElementById('couponDiscountValue')?.value || 0);
    const minOrderAmount = Number(document.getElementById('couponMinOrder')?.value || 0);
    const maxDiscount = document.getElementById('couponMaxDiscount')?.value ? Number(document.getElementById('couponMaxDiscount')?.value) : null;
    const usageLimit = Number(document.getElementById('couponUsageLimit')?.value || 100);
    const endDate = document.getElementById('couponEndDate')?.value || null;
    const isActive = document.getElementById('couponIsActive')?.checked;

    if (!code || code.length < 3) {
      adminToast('Mã giảm giá phải có tối thiểu 3 ký tự!', 'error');
      return;
    }
    if (!description) {
      adminToast('Vui lòng nhập mô tả chương trình ưu đãi!', 'error');
      return;
    }
    if (discountType === 'percent' && (discountValue <= 0 || discountValue > 10)) {
      adminToast('Giảm theo phần trăm (%) tối đa không được vượt quá 10% theo quy định hệ thống!', 'error');
      return;
    }
    if (discountType === 'amount' && discountValue < 1000) {
      adminToast('Số tiền giảm phải từ 1.000đ trở lên!', 'error');
      return;
    }

    const payload = {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      endDate,
      isActive
    };

    const btn = document.getElementById('btnSaveCoupon');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...'; }

    try {
      let res;
      if (editId) {
        res = await api.put(`/api/admin/coupons/${editId}`, payload);
      } else {
        res = await api.post('/api/admin/coupons', payload);
      }

      if (res && res.success) {
        adminToast(res.message || 'Lưu mã giảm giá thành công!', 'success');
        closeAdminModal('couponModal');
        loadCoupons();
      } else {
        adminToast(res?.message || 'Không thể lưu mã giảm giá', 'error');
      }
    } catch (err) {
      adminToast(err.message || 'Lỗi khi lưu mã giảm giá', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    }
  }

  async function handleToggleCouponStatus(id, newStatus) {
    try {
      const res = await api.put(`/api/admin/coupons/${id}`, { isActive: newStatus });
      if (res && res.success) {
        adminToast(`Đã ${newStatus ? 'kích hoạt' : 'tạm ngừng'} mã giảm giá`, 'info');
        loadCoupons();
      }
    } catch (err) {
      adminToast('Lỗi cập nhật trạng thái mã: ' + err.message, 'error');
    }
  }

  async function handleDeleteCoupon(id, code) {
    if (!confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${code}" khỏi hệ thống?`)) return;
    try {
      const res = await api.delete(`/api/admin/coupons/${id}`);
      if (res && res.success) {
        adminToast(`Đã xóa mã "${code}" thành công!`, 'success');
        loadCoupons();
      }
    } catch (err) {
      adminToast('Lỗi khi xóa mã: ' + err.message, 'error');
    }
  }

  // =====================================================================
  // 8. TAB 5: BẢN TIN (NEWSLETTER)
  // =====================================================================
  async function loadSubscribers() {
    startProgressBar();
    renderTableSkeletons('subscribersTbody', 4, 5);
    const search = document.getElementById('subscriberSearchInput')?.value.trim();
    try {
      const res = await api.get('/api/admin/subscribers', { search });
      if (res && res.success && res.data) {
        cachedSubscribers = res.data;
        renderSubscribersTable(cachedSubscribers);
      } else {
        cachedSubscribers = [];
        renderSubscribersTable([]);
      }
    } catch (err) {
      adminToast('Không thể tải danh sách bản tin: ' + err.message, 'error');
    } finally {
      finishProgressBar();
    }
  }

  const handleSubscriberSearchDebounced = debounce(() => {
    loadSubscribers();
  }, 350);

  function renderSubscribersTable(subscribers) {
    const tbody = document.getElementById('subscribersTbody');
    if (!tbody) return;

    if (!subscribers || !subscribers.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:2rem; color:#64748b;">${t('subscribers_empty', 'Không có người đăng ký nào')}</td></tr>`;
      return;
    }

    tbody.innerHTML = subscribers.map(s => `
      <tr>
        <td>#${s.SubscriberId}</td>
        <td><strong style="color:#0f172a;">${escapeHtml(s.Email)}</strong></td>
        <td style="color:#64748b;">${new Date(s.CreatedAt).toLocaleString(localStorage.getItem('minigt_lang') === 'en' ? 'en-US' : 'vi-VN')}</td>
        <td style="text-align:right;">
          <button class="btn-admin btn-admin-outline" style="padding:3px 8px; font-size:11.5px; color:#dc2626;" onclick="deleteSubscriber(${s.SubscriberId})" title="${t('btn_delete', 'Xóa')}">
            <i class="fa-solid fa-trash-can"></i> ${t('btn_delete', 'Xóa')}
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
    startProgressBar();
    try {
      const res = await api.get('/api/admin/settings');
      if (!res.success || !res.data) return;
      const s = res.data;

      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'date') {
          if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
            el.value = val;
          } else {
            try { el.type = 'text'; } catch (_) {}
            el.value = val != null ? val : '';
          }
        } else {
          el.value = val != null ? val : '';
        }
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
    } finally {
      finishProgressBar();
    }
  }

  async function saveStoreSettings(e) {
    if (e && e.preventDefault) e.preventDefault();

    const getVal = (id) => document.getElementById(id)?.value.trim() || '';

    const payload = {
      store_name: getVal('set_store_name') || 'MINI GT STORE BIÊN HÒA',
      store_hotline: getVal('set_store_hotline') || '0988.164.164',
      store_email: getVal('set_store_email') || 'quocthinh.admin@minigt.vn',
      store_address: getVal('set_store_address') || '38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai',
      shipping_fee: Number(getVal('set_shipping_fee')) || 11000,
      low_stock_threshold: Number(getVal('set_low_stock_threshold')) || 5,
      bank_id: getVal('set_bank_id') || 'MB',
      bank_name: getVal('set_bank_name') || 'Ngân hàng Quân Đội (MB Bank)',
      bank_account_no: getVal('set_bank_account_no') || '87654321082007',
      bank_account_name: getVal('set_bank_account_name') || 'DO QUOC THINH',
      preorder_deadline: getVal('set_preorder_deadline') || 'Tháng 11/2026',
      announcement: getVal('set_announcement') || 'Chào mừng bạn đến với MINI GT STORE BIÊN HÒA - Hệ thống phân phối mô hình tĩnh 1:64 chính hãng!'
    };

    try {
      const res = await api.put('/api/admin/settings', payload);
      if (res && res.success === false) throw new Error(res.message || 'Lỗi lưu thiết lập');

      // Đồng bộ ngay vào localStorage cache để tab khách hàng và modal nhận tức thì
      try {
        localStorage.setItem('minigt_store_settings_v2', JSON.stringify(payload));
      } catch (_) {}

      // Phát tín hiệu Real-time sync tới toàn bộ cửa hàng
      if (api && typeof api.emitRealtimeSync === 'function') {
        api.emitRealtimeSync('SETTINGS_UPDATED', payload);
      }

      adminToast('Đã lưu tất cả thiết lập vào cơ sở dữ liệu và đồng bộ tới toàn bộ cửa hàng thành công!', 'success');
      loadStoreSettings();
    } catch (err) {
      adminToast('Lỗi lưu cấu hình: ' + err.message, 'error');
    }
  }

  function closeAdminModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  // =====================================================================
  // 8. CHẾ ĐỘ SÁNG / TỐI (THEME) & ĐA NGÔN NGỮ (VN / EN) CHO ADMIN
  // =====================================================================
  function applyAdminTheme(theme) {
    const t = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('minigt_theme', t);
    const icon = document.getElementById('adminThemeIcon');
    const label = document.getElementById('adminThemeLabel');
    if (icon) {
      icon.className = t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
    if (label) {
      const lang = localStorage.getItem('minigt_lang') || 'vi';
      label.textContent = t === 'dark'
        ? (lang === 'en' ? 'Dark' : 'Tối')
        : (lang === 'en' ? 'Light' : 'Sáng');
    }
  }

  function toggleAdminTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || localStorage.getItem('minigt_theme') || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    applyAdminTheme(next);
    adminToast(next === 'dark' ? '🌙 Đã bật Giao diện Tối (Dark Mode)' : '☀️ Đã bật Giao diện Sáng (Light Mode)', 'info');
  }

  function refreshActiveAdminView() {
    // 1. Re-render active tab content with cached data
    if (activeTab === 'dashboard') {
      if (cachedDashboardStats) renderDashboardStatusPills(cachedDashboardStats);
      if (cachedRecentOrders && cachedRecentOrders.length) renderRecentOrdersTable(cachedRecentOrders);
      if (cachedBestSellers && cachedBestSellers.length) renderBestSellersList(cachedBestSellers);
    } else if (activeTab === 'orders') {
      if (cachedOrders && cachedOrders.length) renderOrdersTable(cachedOrders);
    } else if (activeTab === 'products') {
      if (cachedProducts && cachedProducts.length) renderProductsTable(cachedProducts);
    } else if (activeTab === 'users') {
      if (cachedUsers && cachedUsers.length) renderUsersTable(cachedUsers);
    } else if (activeTab === 'coupons') {
      if (typeof cachedCoupons !== 'undefined' && cachedCoupons && cachedCoupons.length) {
        renderCouponsTable(cachedCoupons);
      }
    } else if (activeTab === 'subscribers') {
      if (typeof cachedSubscribers !== 'undefined' && cachedSubscribers && cachedSubscribers.length) {
        renderSubscribersTable(cachedSubscribers);
      }
    }

    // 2. If Order Detail Modal is open, re-render it in new language
    const detailModal = document.getElementById('orderDetailModal');
    if (detailModal && detailModal.classList.contains('active') && currentDetailOrderId) {
      viewOrderDetail(currentDetailOrderId);
    }

    // 3. If Product Modal is open, update title
    const prodModal = document.getElementById('productModal');
    if (prodModal && prodModal.classList.contains('active')) {
      const editId = document.getElementById('editProductId')?.value;
      const titleEl = document.getElementById('productModalTitle');
      if (titleEl) {
        if (editId) {
          titleEl.textContent = `${t('prod_modal_edit_title', 'Chỉnh Sửa Mô Hình')}: #${editId}`;
        } else {
          titleEl.textContent = t('prod_modal_add_title', 'Thêm Mô Hình Xe Mới (Cấu hình Box & Card)');
        }
      }
    }

    // 4. If Coupon Modal is open, update title
    const coupModal = document.getElementById('couponModal');
    if (coupModal && coupModal.classList.contains('active')) {
      const editId = document.getElementById('couponEditId')?.value;
      const code = document.getElementById('couponCodeInput')?.value || '';
      const titleEl = document.getElementById('couponModalTitle');
      if (titleEl) {
        if (editId) {
          titleEl.innerHTML = `<i class="fa-solid fa-ticket" style="color:var(--color-primary);"></i> ${t('coupon_modal_edit_title', 'Sửa Mã Giảm Giá')}: <strong>${escapeHtml(code)}</strong>`;
        } else {
          titleEl.innerHTML = `<i class="fa-solid fa-ticket" style="color:var(--color-primary);"></i> ${t('coupon_modal_title', 'Tạo Mã Giảm Giá Mới')}`;
        }
      }
    }
  }

  function applyAdminLang(lang) {
    const l = lang === 'en' ? 'en' : 'vi';
    localStorage.setItem('minigt_lang', l);

    // 1. Cập nhật nhãn và quốc kỳ nút chuyển ngôn ngữ
    const label = document.getElementById('adminLangLabel');
    if (label) label.textContent = l === 'en' ? 'EN' : 'VN';
    const flag = document.getElementById('adminLangFlag');
    if (flag) flag.textContent = l === 'en' ? '🇺🇸' : '🇻🇳';

    // 2. Dịch toàn bộ các thẻ có data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && ADMIN_I18N[l] && ADMIN_I18N[l][key] != null) {
        el.textContent = ADMIN_I18N[l][key];
      }
    });

    // 3. Dịch placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key && ADMIN_I18N[l] && ADMIN_I18N[l][key] != null) {
        el.setAttribute('placeholder', ADMIN_I18N[l][key]);
      }
    });

    // 4. Dịch titles (tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key && ADMIN_I18N[l] && ADMIN_I18N[l][key] != null) {
        el.setAttribute('title', ADMIN_I18N[l][key]);
      }
    });

    // 5. Cập nhật thanh điều hướng bên trái (Sidebar)
    const navMap = {
      'nav-dashboard': l === 'en' ? 'Dashboard Overview' : 'Tổng quan hệ thống',
      'nav-products': l === 'en' ? 'Products & Stock' : 'Sản phẩm & Kho hàng',
      'nav-orders': l === 'en' ? 'Orders & SPX' : 'Đơn hàng & SPX',
      'nav-users': l === 'en' ? 'Customers & Roles' : 'Tài khoản & Phân quyền',
      'nav-coupons': l === 'en' ? 'VIP Coupons' : 'Mã Giảm Giá',
      'nav-subscribers': l === 'en' ? 'Newsletter CRM' : 'Đăng ký Bản tin',
      'nav-settings': l === 'en' ? 'Store Settings' : 'Cài đặt cửa hàng',
      'nav-about': l === 'en' ? 'Project & Authors' : 'Giới thiệu Đề tài & Tác giả'
    };

    Object.keys(navMap).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const spans = el.querySelectorAll('span');
      spans.forEach(sp => {
        if (!sp.classList.contains('nav-badge')) {
          sp.textContent = navMap[id];
        }
      });
    });

    // 6. Cập nhật tiêu đề trang đang hiển thị
    const titleEl = document.getElementById('pageTitle');
    const titles = {
      dashboard: t('dash_title', 'Tổng Quan Quản Trị Store'),
      products: t('prod_title', 'Quản Lý Danh Mục & Mô Hình Xe'),
      orders: t('ord_title', 'Quản Lý Đơn Hàng & Vận Đơn SPX'),
      users: t('users_title', 'Quản Lý Khách Hàng & Phân Quyền'),
      coupons: t('coupons_title', 'Quản Lý Mã Giảm Giá & Voucher VIP'),
      subscribers: t('subscribers_title', 'Danh Sách Khách Hàng Nhận Bản Tin'),
      settings: t('settings_title', 'Cấu Hình Cửa Hàng & Thanh Toán VietQR'),
      about: t('about_title', 'Giới Thiệu Đề Tài & Nhóm Tác Giả Thực Hiện Dự Án')
    };
    if (titleEl) titleEl.textContent = titles[activeTab] || t('default_title', 'Hệ Thống Quản Trị MINI GT');

    // 7. Cập nhật lại nhãn theme theo ngôn ngữ mới
    applyAdminTheme(localStorage.getItem('minigt_theme') || 'light');

    // 8. Tự động refresh bảng dữ liệu và modal hiện hành
    refreshActiveAdminView();
  }

  function toggleAdminLang() {
    const cur = localStorage.getItem('minigt_lang') || 'vi';
    const next = cur === 'en' ? 'vi' : 'en';
    applyAdminLang(next);
    adminToast(next === 'en' ? '🌐 Switched Admin language to English (EN)' : '🇻🇳 Đã chuyển ngôn ngữ Quản trị sang Tiếng Việt (VN)', 'info');
  }

  function toggleAdminSettingsMenu(event) {
    if (event) {
      if (event.stopPropagation) event.stopPropagation();
      if (event.preventDefault) event.preventDefault();
    }
    const dropdown = document.getElementById('adminSettingsDropdown');
    if (dropdown) dropdown.classList.toggle('show');
  }

  // Tự động đóng dropdown khi click bên ngoài
  document.addEventListener('click', (e) => {
    const wrap = document.getElementById('adminSettingsWrap');
    const dropdown = document.getElementById('adminSettingsDropdown');
    if (wrap && dropdown && !wrap.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });

  let adminSyncInterval = null;
  let lastKnownOrderCode = null;

  // Khởi tạo ứng dụng khi load xong DOM
  function initDashboard() {
    loadCategories();
    loadDashboard();
    loadOrders();
    refreshAdminChatBadgeQuietly();

    // Tự động tải trước danh sách người dùng để đồng bộ xếp hạng VIP chính xác
    api.get('/api/admin/users').then(res => {
      if (res && res.success && Array.isArray(res.data)) {
        cachedUsers = res.data;
        if (cachedOrders && cachedOrders.length && activeTab === 'orders') {
          renderOrdersTable(cachedOrders);
        }
      }
    }).catch(() => {});

    // Kiểm tra health check backend & cập nhật trạng thái kết nối
    api.get('/api/health').then(res => {
      const text = document.getElementById('serverStatusText');
      const pill = document.getElementById('serverStatusPill');
      if (text && res && res.success) {
        text.textContent = 'Supabase Cloud (Online)';
        if (pill) {
          pill.title = 'Đã kết nối máy chủ & cơ sở dữ liệu Supabase PostgreSQL Cloud';
          pill.classList.remove('offline');
        }
      }
    }).catch(() => {
      const text = document.getElementById('serverStatusText');
      const pill = document.getElementById('serverStatusPill');
      if (text) {
        text.textContent = 'Local Storage (Offline)';
        if (pill) {
          pill.title = 'Đang chạy chế độ lưu trữ ngoại tuyến LocalStorage';
          pill.classList.add('offline');
        }
      }
    });

    // Set lưu trữ các mã đơn đã biết để chống spam thông báo lặp lại
    const adminKnownOrderCodes = new Set();
    if (Array.isArray(cachedOrders)) {
      cachedOrders.forEach(o => { if (o && o.code) adminKnownOrderCodes.add(o.code); });
    }

    // Lắng nghe tín hiệu Real-time ngay lập tức khi Khách hàng vừa đặt đơn hoặc cập nhật đơn
    window.addEventListener('minigt:realtime', (ev) => {
      const detail = ev && ev.detail;
      if (!detail) return;
      if (detail.type === 'ORDER_CREATED' && detail.payload) {
        const ord = detail.payload;
        if (ord && ord.code && !adminKnownOrderCodes.has(ord.code)) {
          adminKnownOrderCodes.add(ord.code);
          adminToast(`🔔 ĐƠN HÀNG MỚI #${ord.code} từ ${ord.fullName || (ord.customer && ord.customer.fullName) || 'Khách hàng'} (${formatVND(ord.totalAmount || ord.total || 0)})!`, 'success', 'Có Đơn Hàng Mới!');
          addAdminNotification(ord, 'ORDER_CREATED');
        }
        loadDashboard();
        loadOrders();
      } else if (detail.type === 'PAYOS_PAID' || detail.type === 'ORDER_PAID') {
        const p = detail.payload;
        if (p && p.code) {
          adminToast(`⚡ Đơn hàng #${p.code} đã thanh toán tự động qua VietQR PayOS (${formatVND(p.amount || p.total || 0)})!`, 'success', 'PayOS Khớp Lệnh Tự Động');
          addAdminNotification(p, 'PAYOS_PAID');
        }
        loadDashboard();
        loadOrders();
      } else if (detail.type === 'CUSTOMER_REPORTED_TRANSFER' && detail.payload) {
        const p = detail.payload;
        adminToast(`💳 Khách vừa báo đã chuyển khoản cho đơn #${p.code || p.orderCode || ''} (${formatVND(p.amount || p.transferAmount || 0)})!`, 'info', 'Khách Đã Chuyển Khoản');
        addAdminNotification({
          code: p.code || p.orderCode,
          orderId: p.orderId || null,
          fullName: p.fullName || p.customerName || 'Khách hàng',
          totalAmount: p.amount || p.transferAmount || 0,
          paymentMethod: 'BANK_TRANSFER'
        }, 'CUSTOMER_REPORTED_TRANSFER');
        loadDashboard();
        loadOrders();
      } else if (detail.type === 'ORDER_UPDATED') {
        loadDashboard();
        if (activeTab === 'orders') loadOrders();
      } else if (detail.type === 'USER_REGISTERED' || detail.type === 'USER_UPDATED' || detail.type === 'users_updated') {
        loadDashboard();
        if (activeTab === 'users') loadUsers();
      } else if (detail.type === 'CHAT_ESCALATED') {
        const p = detail.payload || {};
        playOrderChimeSound();
        adminToast(
          `💬 Khách "${p.customerName || 'Khách hàng'}" vừa hỏi câu cần Admin giải đáp: «${String(p.question || '').slice(0, 75)}»`,
          'info',
          'Cần Giải Đáp Chat AI!'
        );
        if (activeTab === 'chat') {
          loadAdminChats(false);
          if (activeAdminChatId && (!p.conversationId || Number(p.conversationId) === Number(activeAdminChatId))) {
            refreshActiveAdminChatThread();
          }
        } else {
          refreshAdminChatBadgeQuietly();
        }
      } else if (detail.type === 'CHAT_NEW_MESSAGE') {
        if (activeTab === 'chat') {
          loadAdminChats(false);
          if (activeAdminChatId) refreshActiveAdminChatThread();
        } else {
          refreshAdminChatBadgeQuietly();
        }
      }
    });

    // Tự động đồng bộ ngầm mỗi 6 giây để không bỏ sót bất kỳ đơn hàng nào (chống lặp thông báo)
    if (adminSyncInterval) clearInterval(adminSyncInterval);
    adminSyncInterval = setInterval(async () => {
      if (!currentAdminUser) return;
      refreshAdminChatBadgeQuietly();
      try {
        const res = await api.get('/api/admin/orders', orderFilter);
        if (res.success && Array.isArray(res.data)) {
          // Chỉ thông báo cho các đơn hàng MỚI TINH chưa từng có trong tập adminKnownOrderCodes
          if (adminKnownOrderCodes.size > 0) {
            res.data.forEach(newest => {
              if (newest && newest.code && !adminKnownOrderCodes.has(newest.code)) {
                adminKnownOrderCodes.add(newest.code);
                adminToast(`🔔 Nhận đơn hàng mới #${newest.code} - ${newest.fullName || (newest.customer && newest.customer.fullName) || 'Khách hàng'}!`, 'success', 'Có Đơn Hàng Mới!');
                addAdminNotification(newest, 'ORDER_CREATED');
                loadDashboard();
              }
            });
          } else {
            res.data.forEach(o => { if (o && o.code) adminKnownOrderCodes.add(o.code); });
          }

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
    applyAdminTheme(localStorage.getItem('minigt_theme') || 'light');
    applyAdminLang(localStorage.getItem('minigt_lang') || 'vi');
    loadAdminNotifications();
    updateAdminSoundButtonState();
    checkAdminAuth();

    // Đóng modal khi click vào overlay (phần nền tối) — bỏ qua nếu đang upload ảnh
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', function(e) {
        // Chỉ đóng khi click đúng vào overlay, KHÔNG đóng khi click trong modal-card
        if (e.target !== overlay) return;
        // Không đóng productModal nếu đang có upload đang chạy (btn disabled)
        const uploadBtn = document.querySelector('#productModal button[title*="Mở thư mục"]');
        if (this.id === 'productModal' && uploadBtn && uploadBtn.disabled) return;
        this.classList.remove('active');
      });
    });
  });

  // Export các hàm ra window để inline HTML event listeners gọi được
  window.switchTab = switchTab;
  window.toggleSidebar = toggleSidebar;
  window.handleAdminLogin = handleAdminLogin;
  window.adminLogout = adminLogout;
  window.togglePasswordVisibility = togglePasswordVisibility;
  window.closeAdminModal = closeAdminModal;
  window.copyTextToClipboard = copyTextToClipboard;
  window.toggleAdminTheme = toggleAdminTheme;
  window.toggleAdminLang = toggleAdminLang;
  window.toggleAdminSettingsMenu = toggleAdminSettingsMenu;

  // Products
  window.loadProducts = loadProducts;
  window.handleProductSearchDebounced = handleProductSearchDebounced;
  window.handleProductFilterChange = handleProductFilterChange;
  window.goToProductPage = goToProductPage;
  window.openAddProductModal = openAddProductModal;
  window.openEditProductModal = openEditProductModal;
  window.updateProductImagePreview = updateProductImagePreview;
  window.handleProductImageFileUpload = handleProductImageFileUpload;
  window.clearProductImage = clearProductImage;
  window.handleBrandChange = handleBrandChange;
  window.setProductDiscountMode = setProductDiscountMode;
  window.handleProductPriceInput = handleProductPriceInput;
  window.applyQuickDiscountPercent = applyQuickDiscountPercent;
  window.setBoxPricePreset = setBoxPricePreset;
  window.setCardPricePreset = setCardPricePreset;
  window.setCardPriceEqualBox = setCardPriceEqualBox;
  window.addCardDiffFromBox = addCardDiffFromBox;
  window.autoCalcProductDeposit = autoCalcProductDeposit;
  window.handleStockInputs = handleStockInputs;
  window.saveProduct = saveProduct;
  window.cloneProduct = cloneProduct;
  window.deleteProduct = deleteProduct;
  window.loadCategories = loadCategories;
  window.toggleAddCategoryInline = toggleAddCategoryInline;
  window.submitNewCategoryInline = submitNewCategoryInline;
  window.syncDepositAmountToPercent = syncDepositAmountToPercent;

  async function markPreOrderArrivedAction(orderId) {
    if (!confirm('Xác nhận: Lô hàng mô hình Pre-Order của đơn hàng này đã về tới kho cửa hàng Biên Hòa?\n\n- Đơn hàng sẽ được chuyển từ "Đang chờ hàng Pre-Order" sang "Hàng đã về kho / Sẵn sàng giao".\n- Các mô hình liên quan sẽ được tự động đổi từ Pre-Order sang "Có sẵn tại kho" (hàng thường).\n- Khách hàng sẽ thấy ngay thông báo hàng đã về kho và tiến độ đóng gói vận đơn SPX Express.')) return;
    try {
      const res = await api.put(`/api/admin/orders/${orderId}/preorder-arrived`, {});
      if (res.success) {
        adminToast(res.message || 'Đã báo hàng về kho và chuyển sản phẩm sang hàng thường thành công!', 'success');
        if (api && typeof api.emitRealtimeSync === 'function') {
          api.emitRealtimeSync('ORDER_UPDATED', { orderId, order: res.data?.order || res.data });
          api.emitRealtimeSync('ORDERS_UPDATED', {});
          api.emitRealtimeSync('PRODUCTS_UPDATED', {});
        }
        loadOrders();
        loadProducts();
        loadDashboard();
        if (document.getElementById('orderDetailModal')?.classList.contains('active')) {
          viewOrderDetail(orderId);
        }
      } else {
        adminToast(res.message || 'Không thể cập nhật trạng thái đơn Pre-Order', 'error');
      }
    } catch (err) {
      adminToast('Lỗi cập nhật hàng về: ' + err.message, 'error');
    }
  }

  async function convertPreOrderProductToInStock(productId, productName) {
    if (!confirm(`Xác nhận: Lô mô hình "${productName || 'mô hình này'}" đã cập bến kho Biên Hòa?\n\n- Trạng thái sản phẩm sẽ đổi từ "Pre-Order" sang "Có sẵn tại kho" (hàng thường).\n- Khách hàng trên trang chủ có thể mua hàng ngay.\n- Tất cả đơn hàng đặt cọc trước chứa mẫu xe này sẽ được tự động cập nhật là "Hàng đã về kho" để chuẩn bị đóng gói.`)) return;
    try {
      const res = await api.put(`/api/admin/products/${productId}/convert-to-instock`, {});
      if (res && res.success) {
        adminToast(res.message || 'Đã chuyển mô hình sang trạng thái có sẵn tại kho thành công!', 'success');
        if (api && typeof api.emitRealtimeSync === 'function') {
          api.emitRealtimeSync('PRODUCTS_UPDATED', {});
          api.emitRealtimeSync('ORDERS_UPDATED', {});
        }
        loadProducts();
        loadOrders();
        loadDashboard();
      } else {
        adminToast(res?.message || 'Không thể chuyển đổi trạng thái mô hình', 'error');
      }
    } catch (err) {
      adminToast('Lỗi: ' + err.message, 'error');
    }
  }

  window.convertPreOrderProductToInStock = convertPreOrderProductToInStock;
  window.markPreOrderArrivedAction = markPreOrderArrivedAction;

  // Orders
  window.loadOrders = loadOrders;
  window.setOrderTab = setOrderTab;
  window.setPreOrderSubStage = setPreOrderSubStage;
  window.handleOrderSearchDebounced = handleOrderSearchDebounced;
  window.handleOrderFilterChange = handleOrderFilterChange;
  window.filterPayosOrders = filterPayosOrders;
  window.goToOrderPage = goToOrderPage;
  window.viewOrderDetail = viewOrderDetail;
  window.changeOrderStatus = changeOrderStatus;
  window.confirmPaymentAction = confirmPaymentAction;
  window.markPreOrderArrivedAction = markPreOrderArrivedAction;
  window.handleProductStatusChange = handleProductStatusChange;
  window.updateExpectedDeliveryString = updateExpectedDeliveryString;
  window.setDepositPercentPreset = setDepositPercentPreset;
  window.syncDepositPercentToAmount = syncDepositPercentToAmount;
  window.openShipSpxModal = openShipSpxModal;
  window.copyShipSpxDispatchInfo = copyShipSpxDispatchInfo;
  window.pasteTrackingToInput = pasteTrackingToInput;
  window.saveSpxTrackingOnly = saveSpxTrackingOnly;
  window.confirmShipSpxSubmit = confirmShipSpxSubmit;
  window.openCancelOrderModal = openCancelOrderModal;
  window.confirmCancelOrderSubmit = confirmCancelOrderSubmit;
  window.setCancelReasonPreset = setCancelReasonPreset;
  window.changeOrderPageSize = changeOrderPageSize;
  window.markRefundedAction = markRefundedAction;
  window.exportOrdersToCSV = exportOrdersToCSV;
  window.togglePhoneMask = togglePhoneMask;
  window.copyOrderCode = copyOrderCode;
  window.printOrderInvoice = printOrderInvoice;
  window.copySpxFormattedAddress = copySpxFormattedAddress;
  window.copyCustomerAddressConfirmMsg = copyCustomerAddressConfirmMsg;
  window.toggleOrderAddressType = toggleOrderAddressType;

  // Customers & Newsletter & Settings
  window.loadUsers = loadUsers;
  window.handleUserSearchDebounced = handleUserSearchDebounced;
  window.toggleUserStatus = toggleUserStatus;
  window.changeUserRole = changeUserRole;
  window.deleteUserAction = deleteUserAction;
  window.loadSubscribers = loadSubscribers;
  window.handleSubscriberSearchDebounced = handleSubscriberSearchDebounced;
  window.deleteSubscriber = deleteSubscriber;
  window.loadStoreSettings = loadStoreSettings;
  window.saveStoreSettings = saveStoreSettings;

  // Notification Center & Audio Sound
  window.playOrderChimeSound = playOrderChimeSound;
  window.toggleAdminOrderSound = toggleAdminOrderSound;
  window.toggleAdminNotifDropdown = toggleAdminNotifDropdown;
  window.closeAdminNotifDropdown = closeAdminNotifDropdown;
  window.markAllAdminNotifsRead = markAllAdminNotifsRead;
  window.handleNotifItemClick = handleNotifItemClick;
  window.loadAdminNotifications = loadAdminNotifications;

  // Coupons Management
  window.loadCoupons = loadCoupons;
  window.openCouponModal = openCouponModal;
  window.handleSaveCoupon = handleSaveCoupon;
  window.handleToggleCouponStatus = handleToggleCouponStatus;
  window.handleDeleteCoupon = handleDeleteCoupon;
  window.handleDiscountTypeChange = handleDiscountTypeChange;

  // =====================================================================
  // CHAT & AI SUPPORT MANAGEMENT (PRO ADMIN ESCALATION CONSOLE v5 — ZERO-WASTE SYNC)
  // - Hiển thị dữ liệu thực tế sạch đẹp, không còn dấu ** markdown thô
  // - Ghim rõ câu hỏi khó khách hỏi trước đó + Ngữ cảnh các tin nhắn trước đó
  // - Cho phép trích dẫn trả lời trực tiếp từng câu hỏi cụ thể (Quote Reply)
  // - Chống gửi lặp tin nhắn (isAdminSendingReply mutex)
  // - Đồng bộ siêu nhẹ (clientHash / clientSig + Page Visibility API) giảm >95% băng thông
  // =====================================================================
  let activeAdminChatId = null;
  let currentAdminChatFilter = 'all';
  let currentAdminChatSearch = '';
  let adminChatPollInterval = null;
  let isAdminSendingReply = false;
  let activeReplyToMessageId = null;
  let activeReplyToPreviewText = '';
  let lastRenderedThreadSig = '';
  let lastAdminConvsHash = '';
  let lastAdminThreadServerSig = '';
  let adminChatSearchTimer = null;

  function stripChatMarkdownPlain(str) {
    if (!str) return '';
    return String(str)
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\[([A-Z0-9][A-Z0-9\-_]{2,20})\]/g, (_, s) => (s === 'SKU' || s === 'ESCALATE' ? `[${s}]` : `#${s}`))
      .replace(/\s+/g, ' ')
      .trim();
  }

  function formatAdminChatRichText(str, isAdminBubble = false) {
    if (!str) return '';
    let html = escapeHtml(str);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    if (!isAdminBubble) {
      html = html.replace(/\[([A-Z0-9][A-Z0-9\-_]{2,20})\]/g, (full, s) => (s === 'SKU' || s === 'ESCALATE' ? full : `<span class="admin-msg-sku-pill">#${s}</span>`));
      html = html.replace(/#((?:MGT|MG|PR|KH|POP|INNO|TW)[A-Z0-9\-_]+)/g, '<span class="admin-msg-sku-pill">#$1</span>');
    }
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  function formatAdminChatTimestamp(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return time;
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    return `${time} • ${date}`;
  }

  function getEscalationReasonLabel(reason) {
    const r = String(reason || '').toLowerCase();
    if (r === 'complaint_defect') return '⚠️ Khiếu nại / Bảo hành sản phẩm';
    if (r === 'order_support' || r === 'order_or_complaint') return '📦 Xử lý Đơn hàng / Vận chuyển riêng';
    if (r === 'customer_request' || r === 'user_requested_human') return '🙋 Khách yêu cầu gặp trực tiếp Admin';
    if (r === 'wholesale_deal' || r === 'wholesale_or_discount_negotiation') return '🤝 Hỏi nhập sỉ / Chiết khấu riêng';
    return '🤖 Câu hỏi ngoài dữ liệu AI — Cần Admin giải đáp';
  }

  function updateSidebarAndKpiSummary(summary) {
    if (!summary) return;
    const waitingConvs = Number(summary.waiting_conversations || 0);
    const totalPendingQs = Number(summary.total_pending_questions || waitingConvs || 0);
    const activeConvs = Number(summary.active_admin_conversations || 0);
    const botConvs = Number(summary.bot_handled_conversations || 0);
    const totalConvs = Number(summary.total_conversations || 0);

    // Cập nhật badge đỏ trên menu trái
    const badge = document.getElementById('sidebarChatCount');
    if (badge) {
      if (totalPendingQs > 0) {
        badge.textContent = totalPendingQs;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    // Cập nhật 4 thẻ KPI trên đầu trang Chat
    const kpiPending = document.getElementById('chatKpiPendingQuestions');
    const kpiActive = document.getElementById('chatKpiAdminActive');
    const kpiBot = document.getElementById('chatKpiBotActive');
    const kpiTotal = document.getElementById('chatKpiTotalConvs');
    if (kpiPending) kpiPending.textContent = totalPendingQs;
    if (kpiActive) kpiActive.textContent = activeConvs;
    if (kpiBot) kpiBot.textContent = botConvs;
    if (kpiTotal) kpiTotal.textContent = totalConvs;

    // Cập nhật số đếm trên 4 nút lọc
    const cntAll = document.getElementById('chatTabCntAll');
    const cntWaiting = document.getElementById('chatTabCntWaiting');
    const cntActive = document.getElementById('chatTabCntActive');
    const cntBot = document.getElementById('chatTabCntBot');
    if (cntAll) cntAll.textContent = totalConvs;
    if (cntWaiting) cntWaiting.textContent = waitingConvs;
    if (cntActive) cntActive.textContent = activeConvs;
    if (cntBot) cntBot.textContent = botConvs;
  }

  async function refreshAdminChatBadgeQuietly() {
    if (document.hidden) return;
    try {
      const res = await api.get('/api/chat/admin/conversations', {
        status: 'all',
        clientHash: lastAdminConvsHash
      });
      if (res && res.hash) {
        lastAdminConvsHash = res.hash;
      }
      if (res && res.summary) {
        updateSidebarAndKpiSummary(res.summary);
      }
      if (res && res.unchanged) return;
      if (activeTab === 'chat' && res && Array.isArray(res.data) && currentAdminChatFilter === 'all' && !currentAdminChatSearch) {
        renderAdminConversationsList(res.data);
      }
    } catch (_) {}
  }

  function handleAdminChatSearchInput(val) {
    currentAdminChatSearch = String(val || '').trim();
    if (adminChatSearchTimer) clearTimeout(adminChatSearchTimer);
    adminChatSearchTimer = setTimeout(() => {
      loadAdminChats(false);
    }, 260);
  }

  async function loadAdminChats(autoSelectFirst = false) {
    const listEl = document.getElementById('adminConversationsList');
    if (!listEl) return;

    try {
      const res = await api.get('/api/chat/admin/conversations', {
        status: currentAdminChatFilter,
        search: currentAdminChatSearch
      });
      if (currentAdminChatFilter === 'all' && !currentAdminChatSearch && res && res.hash) {
        lastAdminConvsHash = res.hash;
      }
      const convs = (res && Array.isArray(res.data)) ? res.data : [];
      if (res && res.summary) {
        updateSidebarAndKpiSummary(res.summary);
      }

      renderAdminConversationsList(convs);

      // Tự động mở cuộc hội thoại đầu tiên (ưu tiên cuộc hội thoại có câu hỏi chờ Admin!) khi Admin vừa mở tab
      if ((autoSelectFirst || !activeAdminChatId) && convs.length > 0 && activeTab === 'chat') {
        const stillExists = activeAdminChatId && convs.some(c => Number(c.id) === Number(activeAdminChatId));
        if (!stillExists) {
          selectAdminConversation(convs[0].id);
        }
      }
    } catch (err) {
      if (listEl) {
        listEl.innerHTML = `<div class="admin-chat-empty-list" style="color:#ef4444;">Không tải được danh sách hội thoại: ${escapeHtml(err.message)}</div>`;
      }
    }
  }

  function getInitials(name) {
    const parts = String(name || 'K').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'KH';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function renderAdminConversationsList(conversations) {
    const listEl = document.getElementById('adminConversationsList');
    if (!listEl) return;

    if (!conversations || conversations.length === 0) {
      listEl.innerHTML = `
        <div class="admin-chat-empty-list">
          <i class="fa-solid fa-inbox" style="font-size:30px; margin-bottom:8px; display:block; color:#cbd5e1;"></i>
          Chưa có cuộc hội thoại nào phù hợp trong danh mục này.
        </div>
      `;
      return;
    }

    listEl.innerHTML = conversations.map(c => {
      const cid = Number(c.id);
      const isSelected = Number(activeAdminChatId) === cid;
      const pendingCnt = Number(c.pending_count || 0);
      const unread = Number(c.unread_admin || 0);
      const isWaiting = pendingCnt > 0 || c.status === 'waiting_admin';

      let badgeHtml = '';
      if (pendingCnt > 0) {
        badgeHtml = `<span class="conv-badge urgent"><i class="fa-solid fa-bell"></i> Cần trả lời (${pendingCnt})</span>`;
      } else if (c.status === 'waiting_admin') {
        badgeHtml = `<span class="conv-badge urgent"><i class="fa-solid fa-headset"></i> Chờ Admin</span>`;
      } else if (c.status === 'admin_joined') {
        badgeHtml = `<span class="conv-badge admin"><i class="fa-solid fa-comments"></i> Admin hỗ trợ</span>`;
      } else if (c.status === 'resolved') {
        badgeHtml = `<span class="conv-badge resolved"><i class="fa-solid fa-check"></i> Đã hoàn tất</span>`;
      } else {
        badgeHtml = `<span class="conv-badge bot"><i class="fa-solid fa-wand-magic-sparkles"></i> AI đã giải đáp</span>`;
      }

      const custName = c.customer_name || 'Khách vãng lai';
      const contactLine = [c.customer_phone, c.customer_email].filter(Boolean).join(' • ') || `Phiên #${cid}`;
      const timeStr = formatAdminChatTimestamp(c.latest_pending_time || c.last_message_time || c.updated_at);

      const avatarSrc = c.customer_avatar ? resolveAdminImageUrl(c.customer_avatar) : '';
      const avatarHtml = avatarSrc
        ? `<img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(custName)}" onerror="this.parentElement.textContent='${escapeHtml(getInitials(custName))}'">`
        : escapeHtml(getInitials(custName));

      const previewHtml = c.latest_pending_question
        ? `<div class="conv-pending-question-box"><strong>❓ Câu hỏi chờ:</strong> «${escapeHtml(stripChatMarkdownPlain(c.latest_pending_question))}»</div>`
        : `<div class="conv-last-msg">${c.last_sender_type === 'admin' ? '🛡️ Bạn: ' : (c.last_sender_type === 'bot' ? '🤖 AI: ' : '👤 Khách: ')}${escapeHtml(stripChatMarkdownPlain(c.last_message || 'Chưa có nội dung'))}</div>`;

      return `
        <div class="admin-conv-item ${isWaiting ? 'has-pending' : ''} ${isSelected ? 'selected' : ''}" onclick="selectAdminConversation(${cid})">
          <div class="conv-item-top">
            <div class="conv-avatar">${avatarHtml}</div>
            <div class="conv-title-meta">
              <div class="conv-name-row">
                <span class="conv-cust-name">${escapeHtml(custName)}</span>
                <span class="conv-time">${escapeHtml(timeStr)}</span>
              </div>
              <div class="conv-sub-contact">${escapeHtml(contactLine)}</div>
            </div>
          </div>
          ${previewHtml}
          <div class="conv-item-bottom">
            ${badgeHtml}
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="conv-msg-counter">${Number(c.user_messages_count || 0)} câu khách hỏi</span>
              ${unread > 0 ? `<span class="conv-unread-pill">${unread} mới</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function setAdminChatFilter(filter) {
    currentAdminChatFilter = filter;
    const map = {
      all: 'chatFilterAll',
      waiting_admin: 'chatFilterWaiting',
      admin_joined: 'chatFilterActive',
      bot_active: 'chatFilterBot'
    };
    Object.entries(map).forEach(([key, btnId]) => {
      const btn = document.getElementById(btnId);
      if (btn) btn.classList.toggle('active', key === filter);
    });
    loadAdminChats(true);
  }

  function startAdminQuoteReply(msgId, questionText) {
    activeReplyToMessageId = Number(msgId) || null;
    activeReplyToPreviewText = stripChatMarkdownPlain(questionText || '').slice(0, 140);

    const bar = document.getElementById('adminReplyQuoteBar');
    const txt = document.getElementById('adminReplyQuoteText');
    const input = document.getElementById('adminReplyInput');

    if (bar && txt && activeReplyToMessageId) {
      txt.textContent = `«${activeReplyToPreviewText}»`;
      bar.style.display = 'flex';
    }
    if (input) {
      input.placeholder = `Nhập câu trả lời cho câu hỏi: "${activeReplyToPreviewText.slice(0, 55)}..."`;
      input.focus();
    }
    jumpToAdminChatMsg(msgId);
  }

  function clearAdminReplyQuote() {
    activeReplyToMessageId = null;
    activeReplyToPreviewText = '';
    const bar = document.getElementById('adminReplyQuoteBar');
    const input = document.getElementById('adminReplyInput');
    if (bar) bar.style.display = 'none';
    if (input) input.placeholder = 'Nhập câu trả lời trực tiếp gửi tới khách hàng (Enter để gửi)...';
  }

  function jumpToAdminChatMsg(msgId) {
    const threadEl = document.getElementById('adminChatMessagesThread');
    if (!threadEl || !msgId) return;
    const row = threadEl.querySelector(`[data-admin-msg-id="${msgId}"]`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.classList.add('highlight-flash');
      setTimeout(() => row.classList.remove('highlight-flash'), 2000);
    }
  }

  function insertAdminQuickReply(templateText) {
    const input = document.getElementById('adminReplyInput');
    if (!input) return;
    input.value = templateText;
    input.focus();
  }

  async function resolveSinglePendingQuestion(msgId) {
    if (!activeAdminChatId || !msgId) return;
    try {
      await api.put(`/api/chat/admin/conversations/${activeAdminChatId}/questions/${msgId}/resolve`, {});
      if (Number(activeReplyToMessageId) === Number(msgId)) {
        clearAdminReplyQuote();
      }
      adminToast('Đã đánh dấu câu hỏi này là đã xử lý!', 'success');
      await refreshActiveAdminChatThread(true);
      loadAdminChats(false);
    } catch (err) {
      adminToast('Không thể cập nhật câu hỏi: ' + err.message, 'error');
    }
  }

  function renderAdminHeaderInfo(conv, pendingQuestions = [], totalMsgs = 0) {
    const titleEl = document.getElementById('adminChatCustomerTitle');
    const subEl = document.getElementById('adminChatCustomerSub');
    const avatarEl = document.getElementById('adminChatCustAvatar');
    const statusPill = document.getElementById('adminChatStatusBadge');
    const actionsEl = document.getElementById('adminChatActions');
    const composerWrap = document.getElementById('adminChatComposerWrap');

    const custName = conv.customer_name || 'Khách vãng lai';
    if (titleEl) titleEl.textContent = custName;

    if (avatarEl) {
      const avSrc = conv.customer_avatar ? resolveAdminImageUrl(conv.customer_avatar) : '';
      avatarEl.innerHTML = avSrc
        ? `<img src="${escapeHtml(avSrc)}" alt="${escapeHtml(custName)}" onerror="this.parentElement.textContent='${escapeHtml(getInitials(custName))}'">`
        : escapeHtml(getInitials(custName));
    }

    if (statusPill) {
      statusPill.style.display = 'inline-flex';
      if (pendingQuestions.length > 0 || conv.status === 'waiting_admin') {
        statusPill.className = 'admin-chat-status-pill conv-badge urgent';
        statusPill.innerHTML = `<i class="fa-solid fa-bell"></i> ${pendingQuestions.length > 0 ? pendingQuestions.length + ' câu hỏi chờ giải đáp' : 'Chờ Admin phản hồi'}`;
      } else if (conv.status === 'admin_joined') {
        statusPill.className = 'admin-chat-status-pill conv-badge admin';
        statusPill.innerHTML = `<i class="fa-solid fa-headset"></i> Admin đang hỗ trợ`;
      } else if (conv.status === 'resolved') {
        statusPill.className = 'admin-chat-status-pill conv-badge resolved';
        statusPill.innerHTML = `<i class="fa-solid fa-check-double"></i> Đã hoàn tất`;
      } else {
        statusPill.className = 'admin-chat-status-pill conv-badge bot';
        statusPill.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Bé Bot AI tự giải đáp`;
      }
    }

    if (subEl) {
      const chips = [];
      if (conv.customer_email) {
        chips.push(`<span class="cust-info-chip"><i class="fa-regular fa-envelope"></i> ${escapeHtml(conv.customer_email)}</span>`);
      }
      if (conv.customer_phone) {
        const cleanPhone = String(conv.customer_phone).replace(/\D/g, '');
        chips.push(`<a href="https://zalo.me/${escapeHtml(cleanPhone)}" target="_blank" rel="noopener" class="cust-info-chip" style="color:#0284c7;text-decoration:none;" title="Nhắn Zalo cho khách"><i class="fa-solid fa-phone"></i> ${escapeHtml(conv.customer_phone)} (Zalo)</a>`);
      }
      chips.push(`<span class="cust-info-chip"><i class="fa-regular fa-comments"></i> Tổng ${totalMsgs} tin nhắn</span>`);
      subEl.innerHTML = chips.join('');
    }

    if (actionsEl) actionsEl.style.display = 'flex';
    if (composerWrap) composerWrap.style.display = 'flex';
  }

  function renderAdminPendingQuestionsPanel(pendingQuestions) {
    const panel = document.getElementById('adminPendingQuestionsPanel');
    if (!panel) return;

    if (!Array.isArray(pendingQuestions) || pendingQuestions.length === 0) {
      panel.style.display = 'none';
      panel.innerHTML = '';
      return;
    }

    panel.style.display = 'block';
    panel.innerHTML = `
      <div class="pending-panel-header">
        <div class="pending-panel-title">
          <i class="fa-solid fa-thumbtack"></i>
          <span>CÂU HỎI KHÁCH BÁO LÊN ADMIN CHƯA GIẢI ĐÁP (${pendingQuestions.length} câu)</span>
        </div>
        <span class="pending-panel-hint">Kèm ngữ cảnh tin nhắn trước đó • Bấm "Trả lời câu này" để phản hồi đúng câu hỏi</span>
      </div>
      ${pendingQuestions.map(pq => {
        const prior = Array.isArray(pq.priorContext) ? pq.priorContext : [];
        const priorHtml = prior.length > 0 ? `
          <div class="pq-prior-context">
            <div class="pq-prior-title"><i class="fa-solid fa-clock-rotate-left"></i> Ngữ cảnh các tin nhắn ngay trước câu hỏi này:</div>
            ${prior.map(pm => {
              const roleCls = pm.sender_type === 'admin' ? 'admin' : (pm.sender_type === 'bot' ? 'bot' : 'user');
              const roleLbl = pm.sender_type === 'admin' ? 'Admin:' : (pm.sender_type === 'bot' ? 'Bé Bot AI:' : 'Khách hỏi:');
              return `<div class="pq-prior-line"><span class="p-role ${roleCls}">${roleLbl}</span> ${escapeHtml(stripChatMarkdownPlain(pm.message))}</div>`;
            }).join('')}
          </div>
        ` : '';

        const followUpHtml = Number(pq.followUpUserMsgs || 0) > 0
          ? `<span class="pq-followup-note" title="Sau câu này khách tiếp tục hỏi AI và vẫn được Bé Bot trả lời bình thường">💡 Khách đã hỏi tiếp AI thêm ${pq.followUpUserMsgs} câu sau đó</span>`
          : '';

        const safeJsQ = JSON.stringify(String(pq.question || '')).replace(/"/g, '&quot;');

        return `
          <div class="pending-question-card">
            <div class="pq-top-row">
              <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                <span class="pq-reason-badge">${escapeHtml(getEscalationReasonLabel(pq.reason))}</span>
                ${followUpHtml}
              </div>
              <span class="pq-time"><i class="fa-regular fa-clock"></i> Hỏi lúc ${escapeHtml(formatAdminChatTimestamp(pq.created_at))}</span>
            </div>
            ${priorHtml}
            <div class="pq-main-row">
              <div class="pq-question-text">
                <span class="q-prefix">❓ Câu hỏi cần giải đáp:</span> «${escapeHtml(pq.question)}»
              </div>
              <div class="pq-actions">
                <button type="button" class="btn-pq-reply" onclick="startAdminQuoteReply(${pq.id}, ${safeJsQ})">
                  <i class="fa-solid fa-reply"></i> Trả lời câu này
                </button>
                <button type="button" class="btn-pq-done" onclick="resolveSinglePendingQuestion(${pq.id})" title="Đánh dấu đã giải quyết xong câu hỏi này">
                  <i class="fa-solid fa-check"></i> Đã xử lý
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  function renderAdminChatMessages(messages, conv, pendingQuestions = [], forceScroll = false) {
    const threadEl = document.getElementById('adminChatMessagesThread');
    if (!threadEl) return;

    const sig = JSON.stringify(
      (messages || []).map(m => `${m.id}:${m.escalation_resolved ? 1 : 0}:${m.needs_admin_reply ? 1 : 0}`)
    ) + `|p:${(pendingQuestions || []).length}|c:${conv ? conv.id : 0}`;

    if (!forceScroll && sig === lastRenderedThreadSig) {
      return;
    }
    lastRenderedThreadSig = sig;

    renderAdminHeaderInfo(conv, pendingQuestions, (messages || []).length);
    renderAdminPendingQuestionsPanel(pendingQuestions);

    // Tự động chọn sẵn câu hỏi đang chờ đầu tiên vào thanh trích dẫn nếu Admin chưa chọn câu nào khác
    if (Array.isArray(pendingQuestions) && pendingQuestions.length > 0 && !activeReplyToMessageId) {
      const firstPq = pendingQuestions[0];
      activeReplyToMessageId = Number(firstPq.id);
      activeReplyToPreviewText = stripChatMarkdownPlain(firstPq.question).slice(0, 140);
      const bar = document.getElementById('adminReplyQuoteBar');
      const txt = document.getElementById('adminReplyQuoteText');
      if (bar && txt) {
        txt.textContent = `«${activeReplyToPreviewText}»`;
        bar.style.display = 'flex';
      }
    } else if ((!pendingQuestions || pendingQuestions.length === 0) && activeReplyToMessageId) {
      clearAdminReplyQuote();
    }

    if (!messages || messages.length === 0) {
      threadEl.innerHTML = '<div class="admin-chat-empty-list" style="margin:auto;">Chưa có tin nhắn nào trong cuộc hội thoại này.</div>';
      return;
    }

    let lastDateStr = '';
    const htmlParts = [];

    messages.forEach(m => {
      if (m.created_at) {
        const dObj = new Date(m.created_at);
        if (!isNaN(dObj.getTime())) {
          const dLabel = dObj.toDateString() === new Date().toDateString()
            ? 'Hôm nay'
            : dObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
          if (dLabel !== lastDateStr) {
            lastDateStr = dLabel;
            htmlParts.push(`<div class="admin-msg-date-sep">${escapeHtml(dLabel)}</div>`);
          }
        }
      }

      const isUser = m.sender_type === 'user';
      const isAdmin = m.sender_type === 'admin';
      const needsReply = isUser && Boolean(m.needs_admin_reply) && !Boolean(m.escalation_resolved);
      const resolvedEsc = isUser && Boolean(m.needs_admin_reply) && Boolean(m.escalation_resolved);

      const roleClass = isAdmin ? 'from-admin' : (isUser ? 'from-user' : 'from-bot');
      const senderClass = isAdmin ? 'admin' : (isUser ? 'user' : 'bot');
      const senderIcon = isAdmin ? 'fa-user-shield' : (isUser ? 'fa-user' : 'fa-wand-magic-sparkles');
      const senderName = isAdmin
        ? (m.sender_name || 'Admin Showroom')
        : (isUser ? (m.sender_name || conv.customer_name || 'Khách hàng') : 'Bé Bot AI Săn Xe');

      const timeStr = m.created_at
        ? new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '';

      const quoteInsideBubble = (isAdmin && m.reply_to_preview) ? `
        <div class="admin-bubble-quote">
          <span class="abq-lbl"><i class="fa-solid fa-reply"></i> Trả lời câu hỏi của khách:</span>
          <span class="abq-txt">«${escapeHtml(m.reply_to_preview)}»</span>
        </div>
      ` : '';

      const safeJsMsg = JSON.stringify(String(m.message || '')).replace(/"/g, '&quot;');
      let footExtra = '';
      if (needsReply) {
        footExtra = `
          <span class="msg-esc-flag pending"><i class="fa-solid fa-triangle-exclamation"></i> Bot chưa hiểu • Cần trả lời</span>
          <button type="button" class="btn-inline-quote-reply" onclick="startAdminQuoteReply(${m.id}, ${safeJsMsg})">
            <i class="fa-solid fa-reply"></i> Trả lời câu này
          </button>
        `;
      } else if (resolvedEsc) {
        footExtra = `<span class="msg-esc-flag done"><i class="fa-solid fa-circle-check"></i> Đã phản hồi</span>`;
      } else if (isUser) {
        footExtra = `
          <button type="button" class="btn-inline-quote-reply" style="opacity:0.75;" onclick="startAdminQuoteReply(${m.id}, ${safeJsMsg})" title="Trích dẫn tin nhắn này để trả lời">
            <i class="fa-solid fa-reply"></i> Trích dẫn
          </button>
        `;
      }

      htmlParts.push(`
        <div class="admin-msg-row ${roleClass} ${needsReply ? 'needs-reply' : ''}" data-admin-msg-id="${m.id}">
          <span class="admin-msg-sender ${senderClass}">
            <i class="fa-solid ${senderIcon}"></i> ${escapeHtml(senderName)}
          </span>
          <div class="admin-msg-bubble">${quoteInsideBubble}${formatAdminChatRichText(m.message, isAdmin)}</div>
          <div class="admin-msg-foot">
            <span>${escapeHtml(timeStr)}</span>
            ${footExtra}
          </div>
        </div>
      `);
    });

    threadEl.innerHTML = htmlParts.join('');
    threadEl.scrollTop = threadEl.scrollHeight;
  }

  async function refreshActiveAdminChatThread(forceScroll = false) {
    if (!activeAdminChatId) return;
    if (!forceScroll && document.hidden) return;
    try {
      const res = await api.get(`/api/chat/admin/conversations/${activeAdminChatId}/messages`, {
        clientSig: forceScroll ? '' : lastAdminThreadServerSig
      });
      if (res && res.data) {
        if (res.data.unchanged) return;
        if (res.data.sig) {
          lastAdminThreadServerSig = res.data.sig;
        }
        renderAdminChatMessages(
          res.data.messages,
          res.data.conversation,
          res.data.pendingQuestions || [],
          forceScroll
        );
      }
    } catch (_) {}
  }

  async function selectAdminConversation(convId) {
    activeAdminChatId = Number(convId);
    lastRenderedThreadSig = '';
    lastAdminThreadServerSig = '';
    clearAdminReplyQuote();
    loadAdminChats(false);

    const threadEl = document.getElementById('adminChatMessagesThread');
    if (threadEl) {
      threadEl.innerHTML = '<div class="admin-chat-empty-list" style="margin:auto;"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải chi tiết cuộc hội thoại...</div>';
    }

    try {
      const res = await api.get(`/api/chat/admin/conversations/${activeAdminChatId}/messages`);
      if (res && res.data) {
        if (res.data.sig) {
          lastAdminThreadServerSig = res.data.sig;
        }
        renderAdminChatMessages(
          res.data.messages,
          res.data.conversation,
          res.data.pendingQuestions || [],
          true
        );

        if (adminChatPollInterval) clearInterval(adminChatPollInterval);
        adminChatPollInterval = setInterval(() => {
          if (activeTab === 'chat' && activeAdminChatId === Number(convId) && !isAdminSendingReply) {
            refreshActiveAdminChatThread(false);
          }
        }, 3500);
      }
    } catch (err) {
      if (threadEl) {
        threadEl.innerHTML = `<div class="admin-chat-empty-list" style="margin:auto;color:#ef4444;">Lỗi tải tin nhắn: ${escapeHtml(err.message)}</div>`;
      }
    }
  }

  async function handleAdminSendReply(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!activeAdminChatId || isAdminSendingReply) return;

    const input = document.getElementById('adminReplyInput');
    const btn = document.getElementById('adminReplySendBtn');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    isAdminSendingReply = true;
    const replyToId = activeReplyToMessageId;
    input.value = '';
    if (btn) btn.disabled = true;

    try {
      const res = await api.post(`/api/chat/admin/conversations/${activeAdminChatId}/reply`, {
        message: text,
        replyToMessageId: replyToId
      });
      if (res && res.data) {
        clearAdminReplyQuote();
        await refreshActiveAdminChatThread(true);
        await loadAdminChats(false);

        if (api && typeof api.emitRealtimeSync === 'function') {
          api.emitRealtimeSync('CHAT_ADMIN_REPLIED', {
            conversationId: activeAdminChatId,
            replyToMessageId: replyToId
          });
        }
        adminToast('Đã gửi phản hồi trực tiếp tới khách hàng!', 'success');
      }
    } catch (err) {
      input.value = text;
      adminToast('Lỗi gửi phản hồi: ' + err.message, 'error');
    } finally {
      isAdminSendingReply = false;
      if (btn) btn.disabled = false;
      input.focus();
    }
  }

  async function setAdminConversationStatus(status) {
    if (!activeAdminChatId) return;
    try {
      await api.put(`/api/chat/admin/conversations/${activeAdminChatId}/status`, { status });
      clearAdminReplyQuote();
      adminToast(
        status === 'resolved'
          ? 'Đã đánh dấu hoàn tất toàn bộ câu hỏi của khách!'
          : 'Đã giao lại cuộc hội thoại cho Bé Bot AI tự động!',
        'success'
      );
      await refreshActiveAdminChatThread(true);
      await loadAdminChats(false);
      if (api && typeof api.emitRealtimeSync === 'function') {
        api.emitRealtimeSync('CHAT_STATUS_CHANGED', { conversationId: activeAdminChatId, status });
      }
    } catch (err) {
      adminToast('Lỗi cập nhật trạng thái: ' + err.message, 'error');
    }
  }

  async function deleteAdminConversationAction() {
    if (!activeAdminChatId) return;
    if (!confirm('Bạn có chắc chắn muốn xóa cuộc hội thoại này khỏi hộp thư hỗ trợ?')) return;
    const deletingId = activeAdminChatId;
    try {
      await api.delete(`/api/chat/admin/conversations/${deletingId}`);
      activeAdminChatId = null;
      lastRenderedThreadSig = '';
      lastAdminThreadServerSig = '';
      lastAdminConvsHash = '';
      clearAdminReplyQuote();
      if (adminChatPollInterval) {
        clearInterval(adminChatPollInterval);
        adminChatPollInterval = null;
      }

      const titleEl = document.getElementById('adminChatCustomerTitle');
      const subEl = document.getElementById('adminChatCustomerSub');
      const statusPill = document.getElementById('adminChatStatusBadge');
      const actionsEl = document.getElementById('adminChatActions');
      const composerWrap = document.getElementById('adminChatComposerWrap');
      const pendingPanel = document.getElementById('adminPendingQuestionsPanel');
      const threadEl = document.getElementById('adminChatMessagesThread');

      if (titleEl) titleEl.textContent = 'Chọn một cuộc hội thoại bên trái';
      if (subEl) subEl.textContent = 'Hệ thống tự động ghim rõ các câu hỏi khó Bé Bot chưa hiểu kèm ngữ cảnh tin nhắn trước đó để Admin giải đáp nhanh nhất.';
      if (statusPill) statusPill.style.display = 'none';
      if (actionsEl) actionsEl.style.display = 'none';
      if (composerWrap) composerWrap.style.display = 'none';
      if (pendingPanel) {
        pendingPanel.style.display = 'none';
        pendingPanel.innerHTML = '';
      }
      if (threadEl) {
        threadEl.innerHTML = `
          <div class="admin-chat-placeholder">
            <div class="placeholder-icon"><i class="fa-solid fa-headset"></i></div>
            <h4>Đã xóa cuộc hội thoại</h4>
            <p>Chọn một cuộc hội thoại khác ở danh sách bên trái để tiếp tục hỗ trợ khách hàng.</p>
          </div>
        `;
      }

      adminToast('Đã xóa cuộc hội thoại!', 'info');
      await loadAdminChats(true);
    } catch (err) {
      adminToast('Lỗi khi xóa hội thoại: ' + err.message, 'error');
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refreshAdminChatBadgeQuietly();
      if (activeTab === 'chat' && activeAdminChatId && !isAdminSendingReply) {
        refreshActiveAdminChatThread(false);
      }
    }
  });

  window.loadAdminChats = loadAdminChats;
  window.setAdminChatFilter = setAdminChatFilter;
  window.handleAdminChatSearchInput = handleAdminChatSearchInput;
  window.selectAdminConversation = selectAdminConversation;
  window.startAdminQuoteReply = startAdminQuoteReply;
  window.clearAdminReplyQuote = clearAdminReplyQuote;
  window.insertAdminQuickReply = insertAdminQuickReply;
  window.resolveSinglePendingQuestion = resolveSinglePendingQuestion;
  window.handleAdminSendReply = handleAdminSendReply;
  window.setAdminConversationStatus = setAdminConversationStatus;
  window.deleteAdminConversationAction = deleteAdminConversationAction;

})();
