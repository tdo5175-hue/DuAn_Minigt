/**
 * AI SITE KNOWLEDGE v6 — "Bản đồ hiểu biết" toàn bộ website MINI GT STORE BIÊN HÒA cho Bé Bot
 * ---------------------------------------------------------------------------
 * - Mỗi tài liệu (doc) mô tả 1 tính năng / khu vực / chính sách THẬT trên website.
 * - Tìm kiếm bằng khớp cụm từ + chồng lấp từ khóa (BM25-lite) ngay trên RAM → 0 token, < 1ms.
 * - Câu trả lời sinh động từ dữ liệu sống (SHOP settings, sản phẩm Pre-Order thật...).
 * Đầu vào tìm kiếm: chuỗi đã chuẩn hóa không dấu (normalizeVietnamese).
 */

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasPhrase(text, phrase) {
  return new RegExp(`(?:^|\\s)${escapeRe(phrase)}(?=\\s|$)`).test(text);
}

// Từ chung chung không dùng để chấm điểm chồng lấp (tránh khớp nhầm)
const GENERIC = new Set(('cho toi minh em anh chi ban shop web trang nay do la gi vay a oi nhe nha the nao sao lam co khong duoc ' +
  'o dau cach muon can xem tren cua va voi thi ma de bi roi nua hay hoi mot cai nhung cac').split(' '));

/**
 * Danh sách tài liệu. answer(S, fmt, data) → { message, suggestions?, matchedProducts? }
 *  - keys: cụm từ đặc trưng (không dấu). Cụm ≥ 2 từ khớp nguyên văn = "khớp mạnh".
 *  - definition: true → được ưu tiên cả khi câu có tên xe (VD: "LBWK là gì?").
 */
const DOCS = [
  {
    id: 'site_map',
    title: 'Các khu vực trên website',
    ask: 'Web có những mục gì?',
    keys: ['web co nhung muc', 'trang web co gi', 'web co gi', 'cac muc tren web', 'menu co gi', 'huong dan su dung web',
      'cach dung web', 'cach su dung web', 'so do trang', 'web gom nhung gi', 'trang chu co gi', 'gioi thieu web'],
    answer: (S) => ({
      message:
        `🗺️ **Bản đồ website ${S.name}:**\n\n` +
        '• **Trang chủ:** Banner bộ sưu tập nổi bật (bấm điểm sáng trên ảnh để xem nhanh xe) + đồng hồ đếm ngược đợt Pre-Order.\n' +
        '• **Kho Xe (Bộ sưu tập 2026):** Lọc theo dòng xe, giá, Box/Card, Có sẵn/Pre-Order.\n' +
        '• **Liberty Walk LBWK:** Chuyên trang xe độ thân rộng · **IMSA GT3 & F1:** Porsche khủng long AO Racing, xe đua F1.\n' +
        '• **Secret Chase:** Giải thích xe Chase 1/24 hiếm · **Tiện ích 1:64:** Cẩm nang kích thước, Gom đơn Box Saver, Lịch tàu Pre-Order.\n' +
        '• Góc trên phải: ♡ **Yêu thích** · 🛍️ **Giỏ hàng** · ⚙️ **Giao diện Sáng/Tối & Ngôn ngữ VN/EN** · 👤 **Tài khoản**.\n' +
        '• Trên điện thoại: thanh dưới cùng gồm **Trang chủ · Kho Xe · Đơn SPX · Giỏ cọc · Tài khoản**.',
      suggestions: ['Gom đơn Box Saver là gì?', 'Đổi giao diện tối thế nào?', 'Xe nào đang giảm giá?']
    })
  },
  {
    id: 'theme_mode',
    title: 'Đổi giao diện Sáng / Tối',
    ask: 'Đổi giao diện tối thế nào?',
    keys: ['giao dien toi', 'giao dien sang', 'che do toi', 'che do sang', 'nen toi', 'nen den', 'doi giao dien',
      'doi mau giao dien', 'che do ban dem', 'giao dien ban dem', 'mau nen', 'man hinh toi', 'giao dien paddock'],
    answer: () => ({
      message:
        '🌗 **Đổi giao diện Sáng / Tối:**\n\n' +
        '1️⃣ Bấm biểu tượng **⚙️ bánh răng** ở góc trên bên phải.\n' +
        '2️⃣ Tại mục **Giao diện**, chọn **☀️ Sáng (Showroom)** hoặc **🌙 Tối (Paddock)**.\n\n' +
        'Trình duyệt sẽ **ghi nhớ lựa chọn** cho những lần ghé sau ạ! ✨',
      suggestions: ['Đổi sang tiếng Anh', 'Web có những mục gì?']
    })
  },
  {
    id: 'language',
    title: 'Đổi ngôn ngữ VN / EN',
    ask: 'Đổi sang tiếng Anh',
    keys: ['doi ngon ngu', 'tieng anh', 'english', 'chon ngon ngu', 'chuyen ngon ngu', 'chuyen sang tieng', 'ban tieng anh', 'song ngu', 'doi sang tieng viet'],
    answer: () => ({
      message:
        '🌐 **Đổi ngôn ngữ website:** Bấm **⚙️ bánh răng** góc trên phải → mục **Ngôn ngữ** → chọn **🇻🇳 VN** hoặc **🇺🇸 EN**. Lựa chọn được ghi nhớ trên trình duyệt ạ!\n\n' +
        '_Bé Bot hiểu cả câu hỏi tiếng Anh cơ bản (VD: "how much", "in stock", "shipping fee") nhé!_',
      suggestions: ['Đổi giao diện tối thế nào?', 'Xe nào đang có sẵn?']
    })
  },
  {
    id: 'wishlist',
    title: 'Danh sách yêu thích',
    ask: 'Lưu xe yêu thích thế nào?',
    keys: ['danh sach yeu thich', 'muc yeu thich', 'luu yeu thich', 'them yeu thich', 'xe yeu thich cua toi', 'tha tim', 'trai tim',
      'luu xe', 'luu mau', 'bo yeu thich', 'xe da luu', 'nut tim'],
    answer: () => ({
      message:
        '♡ **Danh sách xe yêu thích:**\n\n' +
        '• Bấm **biểu tượng trái tim ♡** trên thẻ xe để lưu (bấm lần nữa để bỏ lưu).\n' +
        '• Xem lại toàn bộ bằng nút **♡ trên thanh đầu trang** (số trên icon = số xe đã lưu).\n' +
        '• Khi đã đăng nhập, danh sách được gắn với tài khoản của anh/chị trên trình duyệt này ạ.',
      suggestions: ['Giỏ hàng ở đâu?', 'Xe nào đang giảm giá?']
    })
  },
  {
    id: 'cart',
    title: 'Giỏ hàng / Giỏ cọc',
    ask: 'Giỏ hàng ở đâu?',
    keys: ['gio hang', 'gio coc', 'xem gio', 'xoa khoi gio', 'xoa gio', 'bot so luong', 'tang so luong', 'sua gio',
      'them vao gio', 'bo vao gio', 'cho vao gio', 'khong them duoc vao gio', 'khong bo vao gio duoc', 'bat dang nhap', 'phai dang nhap', 'can dang nhap'],
    answer: () => ({
      message:
        '🛍️ **Giỏ hàng (Giỏ cọc) trên website:**\n\n' +
        '• Mở giỏ bằng **icon túi 🛍️** góc trên phải (máy tính) hoặc nút **Giỏ cọc** ở thanh dưới (điện thoại).\n' +
        '• Thêm xe bằng nút **+Box / +Card** trên thẻ xe (kể cả thẻ xe ngay trong khung chat này).\n' +
        '• 🔐 Cần **đăng nhập tài khoản** trước khi thêm vào giỏ để giữ đúng giỏ hàng, tồn kho và hạng VIP của anh/chị.\n' +
        '• Trong giỏ có thể tăng/giảm số lượng, xóa mẫu, rồi bấm **Tiến Hành Mua Hàng** để thanh toán.',
      suggestions: ['Hướng dẫn đặt hàng', 'Shop có mã giảm giá không?', 'Đăng ký tài khoản thế nào?']
    })
  },
  {
    id: 'search',
    title: 'Tìm kiếm xe',
    ask: 'Tìm xe trên web thế nào?',
    keys: ['tim kiem', 'thanh tim kiem', 'o tim kiem', 'tim xe o dau', 'search', 'tim xe tren web', 'loc xe', 'bo loc'],
    answer: () => ({
      message:
        '🔎 **Tìm xe nhanh:**\n\n' +
        '• Gõ tên xe, hãng hoặc mã SKU vào **ô tìm kiếm đầu trang** — kết quả hiện ngay khi gõ.\n' +
        '• Vào **Kho Xe** để lọc theo dòng xe, khoảng giá, Box/Card, Có sẵn/Pre-Order.\n' +
        '• Hoặc hỏi thẳng Bé Bot kiểu _"F1 dưới 450k"_, _"Porsche hồng"_, _"MGT01413"_ — em lọc giúp ngay ạ!',
      suggestions: ['Xe đua F1', 'Xe dưới 400k', 'Xe nào đang có sẵn?']
    })
  },
  {
    id: 'quickview',
    title: 'Xem chi tiết & ảnh xe',
    ask: 'Xem thêm ảnh xe ở đâu?',
    keys: ['xem anh', 'xem them anh', 'phong to anh', 'anh chi tiet', 'nhieu goc', 'xem chi tiet xe', 'xem nhanh', 'quick view', 'album anh'],
    answer: () => ({
      message:
        '🖼️ **Xem chi tiết & ảnh đa góc:**\n\n' +
        '• Bấm vào **thẻ xe** hoặc nút **👁 Xem xe** để mở cửa sổ chi tiết (giá Box/Card, tồn kho, mô tả).\n' +
        '• Bấm vào **ảnh lớn** để mở trình xem toàn màn hình, dùng mũi tên **‹ ›** để chuyển ảnh.',
      suggestions: ['Xe nào đang có sẵn?', 'So sánh cái 1 và cái 2']
    })
  },
  {
    id: 'compare_tool',
    title: 'Công cụ so sánh xe',
    ask: 'So sánh nhiều xe trên web thế nào?',
    keys: ['cong cu so sanh', 'nut so sanh', 'so sanh tren web', 'bang so sanh', 'so sanh nhieu xe', 'so sanh 3 xe'],
    answer: () => ({
      message:
        '⚖️ **So sánh xe trên website:**\n\n' +
        '• Bấm nút **So sánh** trên thẻ xe để thêm vào thanh so sánh (tối đa **3 mẫu**).\n' +
        '• Mở bảng so sánh để xem cạnh nhau: giá Box/Card, tồn kho, trạng thái, thông số.\n' +
        '• Hoặc nhắn nhanh cho Bé Bot: _"So sánh Roxy và Rexy"_ ạ!',
      suggestions: ['So sánh Roxy và Rexy', 'Xe đua F1']
    })
  },
  {
    id: 'box_saver',
    title: 'Gom đơn lưu kho Box Saver',
    ask: 'Gom đơn Box Saver là gì?',
    keys: ['box saver', 'gom don', 'luu kho', 'gui kho', 'gop giao', 'giu xe tai kho', 'gom hang', 'giu hang tai shop', 'de hang o shop'],
    answer: () => ({
      message:
        '📦 **Gom đơn lưu kho "Box Saver" (0đ phí ship):**\n\n' +
        '• Ở **bước 3 Thanh toán**, chọn hình thức **"Gom đơn lưu kho Box Saver"**.\n' +
        '• Xe được giữ an toàn tại kho chống ẩm của Store, khi anh/chị đủ các đợt Pre-Order sẽ **gộp giao chung 1 kiện** → tiết kiệm phí ship nhiều lần.\n' +
        '• Rất hợp với anh/chị săn nhiều đợt Pre-Order khác nhau ạ!',
      suggestions: ['Bọc hộp Protector là gì?', 'Phí ship thế nào?']
    })
  },
  {
    id: 'protector',
    title: 'Bọc hộp nhựa PVC Protector',
    ask: 'Bọc hộp Protector là gì?',
    keys: ['protector', 'boc hop', 'hop nhua', 'boc nhua', 'pvc', 'chong mop', 'bao ve hop', 'can goc', 'mop goc', 'corner mint', 'boc pet'],
    answer: () => ({
      message:
        '🛡️ **Tùy chọn Bọc hộp nhựa cứng PVC Protector (+15.000đ):**\n\n' +
        '• Ốp nhựa **PET dày 0.5mm** bao quanh hộp giấy / vỉ Blister → chống móp, cấn góc hộp khi vận chuyển xa (giữ chuẩn **Corner Mint**).\n' +
        '• Chọn trực tiếp ở **bước 3 Thanh toán** (mục Bọc hộp Protector).\n' +
        '• Mọi đơn đều đã được đóng **carton cứng + chống sốc 4 lớp** sẵn ạ!',
      suggestions: ['Gom đơn Box Saver là gì?', 'Box và Card khác nhau thế nào?']
    })
  },
  {
    id: 'delivery_options',
    title: 'Hình thức giao nhận',
    ask: 'Có những hình thức nhận hàng nào?',
    keys: ['hinh thuc giao', 'hinh thuc nhan', 'nhan tai showroom', 'nhan tai cua hang', 'den lay', 'lay truc tiep',
      'tu den lay', 'nhan truc tiep', 'qua shop lay', 'ghe lay'],
    answer: (S, fmt) => ({
      message:
        '🚚 **3 hình thức giao nhận (chọn ở bước 3 Thanh toán):**\n\n' +
        `1️⃣ **Giao tận nơi SPX Express** — ${fmt(S.shippingFee)} (FREESHIP đơn từ **${fmt(S.freeShipThreshold)}**).\n` +
        '2️⃣ **Gom đơn lưu kho Box Saver** — 0đ, gộp giao 1 kiện khi đủ xe.\n' +
        `3️⃣ **Nhận trực tiếp tại Showroom** — 0đ, tại **${S.address}** (${S.hours}).`,
      suggestions: ['Gom đơn Box Saver là gì?', 'Thanh toán thế nào?']
    })
  },
  {
    id: 'deposit_cod',
    title: 'Cọc 30% + COD phần còn lại',
    ask: 'Cọc 30% rồi trả phần còn lại thế nào?',
    keys: ['phan con lai', 'tra phan con lai', 'con lai thanh toan', 'cod phan con lai', 'coc roi cod', 'coc 30', 'coc truoc 30', 'tra not', 'thanh toan not'],
    answer: (S) => ({
      message:
        '💳 **Các lựa chọn thanh toán ở bước Checkout:**\n\n' +
        '• **Chuyển khoản 100% VietQR (PayOS 24/7):** quét mã, hệ thống **tự duyệt đơn ngay**.\n' +
        `• **Đặt cọc ${Math.round(S.depositRate * 100)}% VietQR + COD phần còn lại:** cọc trước qua QR (duyệt tự động), số tiền còn lại trả cho shipper SPX khi nhận xe.\n` +
        '• **Ship COD 100%:** đặc quyền dành cho hội viên **VIP 4 trở lên**.',
      suggestions: ['Đặc quyền hội viên VIP là gì?', 'Chính sách hoàn cọc thế nào?']
    })
  },
  {
    id: 'refund_deposit_policy',
    title: 'Chính sách hoàn cọc',
    ask: 'Chính sách hoàn cọc thế nào?',
    keys: ['chinh sach hoan coc', 'hoan coc the nao', 'coc co duoc hoan', 'co hoan coc', 'mat coc', 'hoan lai coc', 'quy dinh coc', 'chinh sach huy coc'],
    answer: () => ({
      message:
        '♻️ **Chính sách cọc Pre-Order minh bạch:**\n\n' +
        '• Store **hoàn 100% tiền cọc, không mất phí** nếu hãng **hủy lịch sản xuất** hoặc **trễ hẹn** so với cam kết.\n' +
        '• Mỗi khoản cọc đều có **biên nhận điện tử gửi về Gmail** để đối chiếu.\n' +
        '• Nếu anh/chị cần hủy/hoàn một khoản cọc cụ thể, nhắn _"hoàn cọc đơn MGT-..."_ — em chuyển ngay cho Admin xử lý ạ.',
      suggestions: ['Có những mẫu Pre-Order nào?', 'Gặp Admin Showroom']
    })
  },
  {
    id: 'my_orders',
    title: 'Xem đơn hàng của tôi',
    ask: 'Xem lại đơn đã đặt ở đâu?',
    keys: ['lich su don', 'don da dat', 'xem lai don', 'don spx', 'trung tam don', 'danh sach don', 'cac don', 'don hang da mua', 'quan ly don'],
    answer: () => ({
      message:
        '📋 **Xem lại đơn hàng đã đặt:**\n\n' +
        '• Điện thoại: bấm **Đơn SPX** ở thanh dưới cùng · Máy tính: menu **Tài khoản → Đơn hàng của tôi**.\n' +
        '• Xem trạng thái từng đơn, mã vận đơn SPX, số tiền đã cọc/còn lại.\n' +
        '• Hoặc gõ **mã đơn MGT-...** / _"kiểm tra đơn 09xxxxxxxx"_ ngay tại đây để Bé Bot tra giúp ạ!',
      suggestions: ['Sửa địa chỉ đơn hàng thế nào?', 'Tra cứu đơn hàng']
    })
  },
  {
    id: 'edit_address',
    title: 'Sửa địa chỉ nhận hàng',
    ask: 'Sửa địa chỉ đơn hàng thế nào?',
    keys: ['sua dia chi', 'cap nhat dia chi', 'thay dia chi', 'nhap sai dia chi', 'ghi sai dia chi', 'cach doi dia chi', 'sua thong tin nhan hang'],
    answer: () => ({
      message:
        '📍 **Tự sửa địa chỉ nhận hàng:**\n\n' +
        '• Mở **Đơn hàng của tôi** (nút **Đơn SPX**) → tại đơn cần sửa bấm **✏️ Sửa địa chỉ** → cập nhật họ tên, SĐT, địa chỉ, ghi chú → Lưu.\n' +
        '• Áp dụng khi đơn đang **Chờ xác nhận / Đã xác nhận / Đang chuẩn bị** và **chưa có mã vận đơn**.\n' +
        '• Nếu đơn đã giao cho SPX, anh/chị nhắn _"đổi địa chỉ đơn MGT-..."_ để Admin hỗ trợ trực tiếp ạ.',
      suggestions: ['Xem lại đơn đã đặt ở đâu?', 'Gặp Admin Showroom']
    })
  },
  {
    id: 'container',
    title: 'Lịch tàu / Tiến độ hàng Pre-Order',
    ask: 'Lịch hàng Pre-Order về khi nào?',
    keys: ['lich tau', 'tien do container', 'container', 'wave', 'lich hang ve', 'khi nao hang ve', 'bao gio hang ve', 'dot hang', 'cap ben', 'tien do hang'],
    answer: (S, fmt, data) => {
      const pre = (data.products || []).filter(p => p.Status === 'pre_order').slice(0, 4);
      const lines = pre.map(p => `• **[${p.Sku}] ${p.Name}** — dự kiến: **${p.ExpectedDelivery || S.preorderDeadline}**`).join('\n');
      return {
        message:
          '🚢 **Tiến độ hàng Pre-Order về kho Biên Hòa (đồng bộ trực tiếp):**\n\n' +
          (lines || `• Hiện chưa có đợt Pre-Order đang mở — hạn chót đợt kế tiếp: **${S.preorderDeadline}**.`) +
          '\n\n_Xem thêm mục **Tiện ích 1:64 → Lịch tàu về kho** trên trang chủ. Khi xe cập bến, hệ thống báo để anh/chị thanh toán phần còn lại ạ!_',
        suggestions: ['Có những mẫu Pre-Order nào?', 'Chính sách hoàn cọc thế nào?'],
        matchedProducts: pre.map(p => p.Sku)
      };
    }
  },
  {
    id: 'newsletter',
    title: 'Đăng ký nhận thông báo mở cọc',
    ask: 'Đăng ký nhận thông báo mở cọc',
    keys: ['dang ky nhan tin', 'nhan thong bao', 'thong bao mo coc', 'dang ky email', 'nhan email', 'newsletter', 'dang ky nhan thong bao', 'bao khi co hang', 'bao khi mo coc'],
    answer: () => ({
      message:
        '🔔 **Không bỏ lỡ mẫu hiếm:** Kéo xuống cuối trang chủ, mục **"Đăng ký nhận thông báo mở cọc đợt kế tiếp"** → nhập Gmail → **Đăng ký**.\n\n' +
        'Anh/chị sẽ nhận tin sớm nhất về các đợt phát hành MINI GT, LBWK, Kaido House, Pop Race ạ! 📬',
      suggestions: ['Có những mẫu Pre-Order nào?', 'Xe nào mới về?']
    })
  },
  {
    id: 'profile',
    title: 'Hồ sơ tài khoản',
    ask: 'Cập nhật thông tin tài khoản ở đâu?',
    keys: ['ho so', 'thong tin ca nhan', 'cap nhat thong tin', 'doi ten', 'doi avatar', 'anh dai dien', 'sua thong tin tai khoan', 'trang ca nhan', 'dang xuat'],
    answer: () => ({
      message:
        '👤 **Hồ sơ hội viên:** Bấm **ảnh đại diện / Tài khoản** góc trên phải (hoặc nút **Tài khoản** ở thanh dưới trên điện thoại) → **Hồ sơ** để xem hạng VIP, thông tin cá nhân, đơn hàng và **Đăng xuất**.\n\n' +
        '_Quên mật khẩu? Chọn "Quên mật khẩu" ở cửa sổ đăng nhập để nhận OTP qua Gmail ạ._',
      suggestions: ['Đặc quyền hội viên VIP là gì?', 'Xem lại đơn đã đặt ở đâu?']
    })
  },
  {
    id: 'mobile_nav',
    title: 'Dùng web trên điện thoại',
    ask: 'Dùng web trên điện thoại thế nào?',
    keys: ['tren dien thoai', 'menu o dau', 'thanh menu', 'khong thay menu', 'menu dien thoai', 'dung dien thoai', 'ban mobile', 'tren mobile'],
    answer: () => ({
      message:
        '📱 **Dùng website trên điện thoại:**\n\n' +
        '• Thanh dưới cùng: **🏠 Trang chủ · 🚗 Kho Xe · 📦 Đơn SPX · 🛍️ Giỏ cọc · 👤 Tài khoản**.\n' +
        '• Nút **☰** góc trên trái mở menu đầy đủ (Pre-Order, LBWK, GT3 & F1, Secret Chase, Tiện ích 1:64).\n' +
        '• Bé Bot 🤖 và nút **Zalo** luôn nằm ở góc dưới màn hình để hỗ trợ anh/chị ạ!',
      suggestions: ['Web có những mục gì?', 'Giỏ hàng ở đâu?']
    })
  },
  {
    id: 'trust',
    title: 'Độ uy tín & an toàn',
    ask: 'Mua ở web có an toàn không?',
    keys: ['uy tin', 'an toan khong', 'dang tin', 'bao mat', 'bao mat thong tin', 'tin duoc khong', 'co an toan', 'mua co sao khong', 'yen tam'],
    answer: (S) => ({
      message:
        `🔒 **Vì sao mua tại ${S.name} luôn yên tâm:**\n\n` +
        `• **Showroom thật:** ${S.address} — ghé xem tận tay trước khi mua.\n` +
        '• **Thanh toán VietQR PayOS tự động** + biên nhận điện tử gửi Gmail cho mọi đơn/cọc.\n' +
        '• **100% chính hãng nguyên seal**, đóng gói chống sốc 4 lớp, **quay video unbox** để được đổi mới/hoàn tiền nếu lỗi vận chuyển.\n' +
        '• **Hoàn 100% cọc** nếu hãng hủy lịch hoặc trễ hẹn · Mật khẩu tài khoản được mã hóa an toàn.',
      suggestions: ['Chính sách bảo hành thế nào?', 'Ai là người tạo web này?']
    })
  },
  {
    id: 'admin_chat',
    title: 'Nhắn tin với Admin',
    ask: 'Làm sao nhắn với Admin?',
    keys: ['chat voi admin', 'nhan tin admin', 'nhan tin voi admin', 'admin tra loi', 'bao lau admin tra loi', 'admin co online', 'lien lac admin', 'hoi admin'],
    answer: (S) => ({
      message:
        '🙋 **Kết nối Admin Showroom:**\n\n' +
        '• Nhắn _"gặp Admin"_ ngay trong khung chat này — em chuyển kèm toàn bộ nội dung trò chuyện để Admin trả lời trực tiếp tại đây.\n' +
        `• Hoặc bấm **icon Zalo** cạnh Bé Bot để chat Zalo **${S.hotline}**.\n` +
        '• Trong lúc chờ Admin, anh/chị vẫn hỏi Bé Bot bình thường nhé!',
      suggestions: ['Gặp Admin Showroom', 'Xe nào đang giảm giá?']
    })
  },
  // ----------------------- ĐỊNH NGHĨA / KIẾN THỨC -----------------------
  {
    id: 'brand_minigt',
    title: 'MINI GT là gì',
    ask: 'MINI GT là hãng gì?',
    definition: true,
    keys: ['mini gt la gi', 'minigt la gi', 'mini gt la hang', 'hang mini gt', 'thuong hieu mini gt', 'tsm la gi', 'tsm model', 'mini gt cua nuoc nao'],
    answer: () => ({
      message:
        '🏁 **MINI GT** là thương hiệu mô hình xe tỷ lệ **1:64** cao cấp của **TSM-Model (True Scale Miniatures)** — Hồng Kông.\n\n' +
        '• Nổi tiếng với **lốp cao su thật, đèn pha nhựa trong gắn rời, gương chiếu hậu chi tiết** và bản quyền chính thức từ các hãng xe/đội đua.\n' +
        '• Có 2 bản đóng gói: **Hộp giấy (Box)** và **Vỉ nhựa (Blister Card)**; một số mẫu có bản **Secret Chase** hiếm.',
      suggestions: ['Pop Race là gì?', 'Box và Card khác nhau thế nào?', 'Chase là gì?']
    })
  },
  {
    id: 'brand_poprace',
    title: 'Pop Race là gì',
    ask: 'Pop Race là gì?',
    definition: true,
    keys: ['pop race la gi', 'poprace la gi', 'hang pop race', 'pop race cua nuoc nao', 'kaido house la gi', 'hang kaido'],
    answer: () => ({
      message:
        '🔥 **Pop Race** là hãng mô hình 1:64 (Hồng Kông) chuyên các bản xe độ/JDM & siêu xe phiên bản đặc biệt — nhiều mẫu **mở được nắp capo** khoe khoang máy, hộp trưng bày Acrylic.\n\n' +
        '🛠️ **Kaido House** là dòng hợp tác với MINI GT do **Jun Imai** thiết kế, phong cách xe độ đường phố Nhật Bản, cũng có nhiều mẫu mở capo ạ.',
      suggestions: ['Các mẫu Pop Race mở capo', 'MINI GT là hãng gì?']
    })
  },
  {
    id: 'lbwk_info',
    title: 'Liberty Walk LBWK là gì',
    ask: 'LBWK là gì?',
    definition: true,
    keys: ['lbwk la gi', 'liberty walk la gi', 'lb works la gi', 'lb la gi', 'xe do than rong la gi', 'widebody la gi', 'silhouette la gi'],
    answer: () => ({
      message:
        '🛠️ **Liberty Walk (LB★WORKS / LBWK)** là xưởng độ xe nổi tiếng Nhật Bản của **Wataru Kato**, đặc trưng bởi bộ **body kit thân rộng (widebody)** tán đinh lộ, hạ gầm sát đất.\n\n' +
        'Dòng **LB-Super Silhouette** (VD: Nissan S15) lấy cảm hứng xe đua Super GT. Anh/chị xem chuyên trang **Liberty Walk LBWK** trên menu hoặc hỏi em _"có mẫu LBWK nào"_ nhé!',
      suggestions: ['Có mẫu LBWK nào?', 'Xe nào đang giảm giá?']
    })
  },
  {
    id: 'racing_info',
    title: 'IMSA / GT3 / AO Racing là gì',
    ask: 'AO Racing Rexy Roxy là gì?',
    definition: true,
    keys: ['imsa la gi', 'gt3 la gi', 'ao racing la gi', 'rexy la gi', 'roxy la gi', 'skeleton la gi', 'khung long la gi', 'xe khung long la gi'],
    answer: () => ({
      message:
        '🦖 **AO Racing** là đội đua giải **IMSA WeatherTech** (Mỹ) chạy **Porsche 911 GT3 R** với các bản sơn khủng long huyền thoại:\n\n' +
        '• **Rexy #80** — khủng long xanh lá · **Roxy #77** — khủng long hồng · **Skeleton #77** — bộ xương đen (Petit Le Mans).\n' +
        '• **GT3** là hạng xe đua dựa trên siêu xe thương mại, phổ biến nhất trong các giải đua sức bền thế giới ạ!',
      suggestions: ['Porsche khủng long', 'So sánh Roxy và Rexy']
    })
  },
  {
    id: 'diecast_info',
    title: 'Die-cast là gì',
    ask: 'Die-cast là gì?',
    definition: true,
    keys: ['die cast la gi', 'diecast la gi', 'mo hinh die cast', 'mo hinh diecast la gi', 'xe mo hinh la gi', 'suu tam xe mo hinh'],
    answer: () => ({
      message:
        '🔩 **Die-cast** là mô hình xe **đúc hợp kim kẽm** (kim loại) — cầm đầm tay, sơn tĩnh điện sắc nét, chi tiết chuẩn tỷ lệ xe thật.\n\n' +
        'Tỷ lệ **1:64** (dài ~7–8cm) là tỷ lệ được giới sưu tầm ưa chuộng nhất vì vừa chi tiết vừa dễ trưng bày số lượng lớn ạ!',
      suggestions: ['1:64 to cỡ nào?', 'MINI GT là hãng gì?']
    })
  }
];

// Tiền xử lý chỉ mục từ khóa + IDF đơn giản
const docTokenSets = DOCS.map(d => {
  const set = new Set();
  for (const k of d.keys) for (const t of k.split(' ')) if (t.length >= 2 && !GENERIC.has(t)) set.add(t);
  return set;
});
const tokenDf = new Map();
for (const set of docTokenSets) for (const t of set) tokenDf.set(t, (tokenDf.get(t) || 0) + 1);

function stripAccents(str) {
  return String(str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9.,\s/-]/g, ' ')
    .replace(/[/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tìm tài liệu phù hợp nhất.
 * @returns {{doc, score, strong, isDefinitionQuestion, candidates: Array<{doc, score}>}}
 */
function searchKnowledge(text) {
  const t = stripAccents(text);
  if (!t) return { doc: null, score: 0, strong: false, candidates: [] };
  const qTokens = new Set(t.split(' ').filter(x => x.length >= 2 && !GENERIC.has(x)));
  const isDefinitionQuestion = /(la gi|la hang gi|nghia la|y nghia|la sao|cua nuoc nao|la ai)(\s|$)/.test(t);

  const scored = DOCS.map((doc, i) => {
    let score = 0;
    let phraseHit = false;
    for (const k of doc.keys) {
      if (hasPhrase(t, k)) {
        const wc = k.split(' ').length;
        score += 6 + 4 * (wc - 1);
        if (wc >= 2) phraseHit = true;
      }
    }
    // Chồng lấp từ khóa có trọng số IDF (hiểu cả khi khách diễn đạt khác)
    let overlap = 0;
    for (const qt of qTokens) {
      if (docTokenSets[i].has(qt)) overlap += 1 / (tokenDf.get(qt) || 1);
    }
    score += overlap * 2.5;
    return { doc, score, phraseHit };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  if (!scored.length) return { doc: null, score: 0, strong: false, isDefinitionQuestion, candidates: [] };
  const top = scored[0];
  const second = scored[1];
  const strong = top.phraseHit && top.score >= 10 && (!second || top.score >= second.score * 1.25);
  return { doc: top.doc, score: top.score, strong, isDefinitionQuestion, candidates: scored.slice(0, 3) };
}

/** Văn bản thuần ngắn gọn của tài liệu — dùng làm ngữ cảnh siêu nhỏ cho LLM (nếu có). */
function docPlainText(doc, S, fmt, data) {
  try {
    const r = doc.answer(S, fmt, data || {});
    return String(r.message || '')
      .replace(/\*\*|__|_/g, '')
      .replace(/[^\p{L}\p{N}\s.,:;()%/+\-–—]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 420);
  } catch (_) {
    return '';
  }
}

function allKeyPhrases() {
  return DOCS.flatMap(d => d.keys);
}

module.exports = { DOCS, searchKnowledge, docPlainText, allKeyPhrases };
