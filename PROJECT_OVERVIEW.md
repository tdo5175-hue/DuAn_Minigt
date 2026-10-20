# Phân tích dự án MINI GT STORE

Tài liệu này mô tả kiến trúc và hành vi dựa trên mã nguồn hiện tại. Ứng dụng không dùng framework frontend hoặc bundler; Express phục vụ HTML/CSS/JavaScript và API trong cùng một tiến trình.

## 1. Tổng quan

MINI GT STORE là website bán/giới thiệu mô hình xe die-cast, trọng tâm tỉ lệ 1:64. Có hai giao diện:

1. **Storefront** (`index.html`): khách xem bộ sưu tập, tìm sản phẩm, tạo đơn/đơn cọc, theo dõi đơn và quản lý tài khoản.
2. **Admin** (`admin/index.html`): nhân viên quản lý hàng hóa, đơn, khách hàng, thống kê và thiết lập vận hành.

Luồng triển khai chính:

```text
Browser
  ├─ Storefront: index.html + css/ + js/
  ├─ Admin: admin/index.html + admin/css/ + admin/js/
  └─ js/api.js: API client, token, chuẩn hóa dữ liệu, fallback/sync trình duyệt
                  │ HTTP/JSON và phiên đăng nhập
                  ▼
             Express (server/server.js)
                  ├─ routes → services / validation / middleware
                  └─ config/db.js → node-postgres Pool → PostgreSQL/Supabase
```

## 2. Công nghệ và thư mục

| Thành phần | Công nghệ/vai trò |
| --- | --- |
| Storefront | HTML, CSS thuần, JavaScript thuần; trang nội dung chính nằm ở `index.html` |
| Admin | HTML/CSS/JavaScript thuần trong `admin/` |
| CSS cửa hàng | `css/style.css` nạp lần lượt `variables.css`, `base.css`, `components.css`, `sections.css`, `responsive.css` |
| CSS admin | `admin/css/admin.css` |
| API client | `js/api.js`, dùng chung cho cửa hàng và admin |
| Backend | Node.js, Express 4; entry point `server/server.js` |
| Database | PostgreSQL/Supabase qua `pg` và `DATABASE_URL` |
| Tài khoản | `bcryptjs`, JWT; Google Identity Services/Google Auth Library |
| Email | Nodemailer (Gmail SMTP) cho các luồng email |
| Hình ảnh | Tài nguyên tĩnh trong `image/`; trang được Express static host |

Các vùng UI trên trang storefront gồm header/tìm kiếm, hero/banner, catalog, pre-order, khu LBWK, khu IMSA/GT3/F1, Secret Chase, collector hub, wishlist/cart drawer, các modal auth/checkout/tracking và newsletter. CSS có thiết lập responsive, theme sáng/tối và trạng thái giao diện.

## 3. Frontend

### 3.1 Storefront

- `index.html` định nghĩa cấu trúc/điểm mount DOM, tải CSS và cuối trang nạp `js/api.js` trước `js/app.js`.
- `js/app.js` giữ trạng thái giao diện và xử lý render danh mục, tương tác catalog, giỏ, checkout, auth và đơn hàng.
- Dữ liệu sản phẩm chính được tải từ backend, chuẩn hóa rồi render thành card/grid. Khi API không sẵn có trong môi trường local, có dữ liệu mẫu `FALLBACK_PRODUCTS` cùng cơ chế lưu trữ cục bộ.
- Tìm kiếm, một số lọc/sắp xếp/phân trang và các showcase được xử lý phía trình duyệt trên danh sách sản phẩm đã tải.
- Cart, wishlist, thông tin phiên, trạng thái form checkout và danh sách mã đơn đã tạo có thể được lưu trên browser storage.

Một số hàm tiêu biểu trong `js/app.js`:

| Nhóm | Hàm tiêu biểu | Nhiệm vụ |
| --- | --- | --- |
| Khởi tạo dữ liệu | `loadStoreSettings`, `loadProducts`, `loadAppCategories` | Tải cấu hình cửa hàng, sản phẩm và danh mục |
| Catalog | `createProductCardHTML`, `renderProductsGrid`, `renderF1Section`, `renderBoxSetsSection`, `handleCatalogSort`, `handleCatalogBrandChange` | Tạo card, lọc/sắp xếp và render các khu sản phẩm |
| Wishlist | `toggleWishlist`, `openWishlistModal`, `renderWishlistModal` | Thêm/xóa và hiển thị sản phẩm yêu thích |
| Cart | `addToCart`, `saveCart`, `removeCartItem`, `renderCartDrawer` | Quản lý item/loại packaging và cập nhật giỏ |
| Checkout | `openCheckoutModal`, `validateStep2AndProceed`, `renderCheckoutStep3`, `submitOrder`, `handleOrderSuccess` | Thu thập thông tin, kiểm tra form, gửi đơn và hiển thị kết quả |
| Tài khoản | `handleLocalLogin`, `handleLocalRegister`, `handleForgotPassword`, `handleGoogleCredentialResponse`, `handleUpdateUserProfile` | Đăng nhập/đăng ký/khôi phục hồ sơ |
| Đơn hàng | `fetchCustomerOrdersUnified`, `loadMyOrdersList`, `searchOrderTracking`, `initCustomerRealtimeOrderWatcher` | Tải danh sách, tra cứu và cập nhật tình trạng hiển thị |
| Cài đặt | `applyThemeMode`, `applySiteLanguage`, `toggleThemeMode`, `toggleSiteLanguage` | Theme sáng/tối và ngôn ngữ VN/EN |

### 3.2 Admin

- `admin/index.html` định nghĩa sidebar, các vùng nội dung, bảng và modal quản trị.
- `admin/js/admin.js` điều phối tải dữ liệu khi chuyển tab; `js/api.js` được nạp dùng chung API client.
- Các khu vực chính: dashboard/KPI, sản phẩm/danh mục, đơn hàng, khách hàng, newsletter và cài đặt cửa hàng.
- Các hàm tiêu biểu: `loadDashboard`, `loadProducts`, `saveProduct`, `loadOrders`, `loadUsers`, `loadSubscribers`, `loadStoreSettings`, `saveStoreSettings`, cùng nhóm hàm render/filter/modal.
- Admin dùng token riêng (`minigt_admin_token`/`minigt_admin_user`) tách với phiên khách hàng (`minigt_token`/`minigt_user`) trong browser storage. API mới là nơi quyết định quyền thực; UI không thay thế kiểm tra quyền backend.

### 3.3 API client và đồng bộ trên browser

`js/api.js` chịu trách nhiệm:

- Chọn API base URL: ưu tiên `window.MINIGT_API_BASE`; nếu không thì local trỏ về máy chủ cổng `5000`; môi trường production mặc định trỏ tới host Render được cấu hình trong file.
- Gắn thông tin phiên admin hoặc khách hàng phù hợp endpoint vào các request cần xác thực.
- Đóng gói JSON, xử lý lỗi HTTP thành `ApiError`, chuẩn hóa object sản phẩm và chạy hiệu ứng đồng bộ sau các request đơn hàng.
- Khi máy chủ local không truy cập được, một số thao tác chạy qua fallback `localStorage` (danh mục/sản phẩm/đơn/tài khoản/cấu hình mẫu).
- Dùng `BroadcastChannel` và storage event để thông báo thay đổi giữa các tab cùng trình duyệt. Đây không phải WebSocket hay cơ chế push giữa nhiều thiết bị/người dùng.

Vì vậy có hai nguồn dữ liệu không tương đương: database backend khi API hoạt động và dữ liệu demo/offline trên browser. Cập nhật trong fallback không tự ghi ngược vào PostgreSQL.

## 4. Backend và API

### 4.1 Thành phần backend

- `server/server.js`: nạp `.env`, cấu hình CORS/body parser/static files, mount router, khai báo health check và error handler.
- `server/routes/`: phân luồng endpoint và chuyển lỗi tới middleware xử lý HTTP.
- `server/services/`: nghiệp vụ sản phẩm, đơn hàng, settings.
- `server/middleware/auth.js`: ký/giải JWT, middleware `authenticate`, `optionalAuth`, `requireActiveUser`, `requireAdmin`.
- `server/utils/validate.js`, `validators.js`, `http.js`: validation/response/error helper.
- `server/config/db.js`: tạo `pg.Pool`, chuyển tham số `@name` sang `$n`, chuẩn hóa kết quả và cung cấp `withTransaction`.

Server phục vụ nội dung tĩnh từ root dự án, `/admin` được map sang trang quản trị. `/api/health` trả trạng thái backend và cờ kết nối database. API admin được gắn middleware xác thực và kiểm tra role admin ở router.

### 4.2 Bề mặt API chính

| Nhóm | Endpoint | Chức năng |
| --- | --- | --- |
| Health | `GET /api/health` | Trạng thái server và kết nối DB |
| Sản phẩm | `GET /api/products` | Danh sách; hỗ trợ category, brand, status, search, tag, sort, khoảng giá, tồn kho |
| Sản phẩm | `GET /api/products/categories`, `GET /api/products/:idOrSlug` | Danh mục và chi tiết sản phẩm |
| Đánh giá | `POST /api/products/:id/reviews` | Tạo/cập nhật đánh giá; yêu cầu đăng nhập |
| Auth | `POST /api/auth/register`, `/login`, `/google` | Đăng ký, đăng nhập mật khẩu, Google |
| Auth | `GET /api/auth/google/config`, `POST /api/auth/forgot`, `/reset-password`, `PUT /api/auth/profile`, `GET /api/auth/me` | Cấu hình Google, quên/đặt lại mật khẩu, hồ sơ và user hiện tại |
| Đơn hàng | `POST /api/orders` | Tạo đơn guest hoặc đơn gắn user đăng nhập |
| Đơn hàng | `GET /api/orders`, `/my-orders`, `/my`, `/:code`, `/check-status/:code`, `/track/:query` | Danh sách/chi tiết/tra cứu đơn |
| Đơn hàng | `PUT /api/orders/:code/cancel`, `/confirm-received`, `/shipping-info`; `POST /api/orders/:code/receipt`, `/notify-transfer` | Khách thao tác với đơn và gửi biên nhận/thông báo |
| Settings public | `GET /api/settings` | Thông tin công khai, phí ship, cấu hình VietQR… |
| Newsletter | `POST /api/newsletter` | Đăng ký email nhận thông báo |
| Admin | `/api/admin/stats`, `/categories`, `/products`, `/orders`, `/users`, `/subscribers`, `/settings` | Dashboard và CRUD/quản trị; các route đều cần quyền admin |

Các mutation admin bao gồm thêm/sửa/xóa/clone sản phẩm, đổi trạng thái đơn, xác nhận thanh toán, cập nhật tracking, đánh dấu pre-order đã về, hủy/hoàn tiền, đổi role/trạng thái user, quản lý subscriber và cập nhật settings.

### 4.3 Dịch vụ nghiệp vụ

- `productService`: truy vấn sản phẩm/danh mục, tìm theo ID/slug/SKU, lọc/phân trang, gắn ảnh phụ/đánh giá/sản phẩm liên quan và map dữ liệu DB về cấu trúc frontend có cả camelCase/PascalCase.
- `orderService`: tạo mã đơn, xác thực và gộp line items, tính giá theo box/card và discount, tiền ship/voucher/protector, xác định tiền cọc và pre-order, thay đổi trạng thái/thanh toán, giữ/trả tồn kho, ghi lịch sử đơn.
- `settingsService`: đọc settings có cache 60 giây, cấp tập con public, validate/cập nhật giá trị cấu hình, tính phí ship và dựng URL VietQR.
- Tạo đơn và chuyển trạng thái trong `orderService` dùng transaction để gom các thao tác liên quan đơn, dòng hàng, tồn kho và lịch sử.

## 5. Dữ liệu và quan hệ

Schema dự kiến/các bảng được dùng trong ứng dụng:

| Bảng | Vai trò và quan hệ chính |
| --- | --- |
| `Categories` | Danh mục; liên kết 1-n với `Products` |
| `Products` | SKU, tên/slug, brand/scale, packaging box/card, giá/discount, tồn kho, pre-order, trạng thái, ảnh |
| `ProductImages` | Ảnh bổ sung của sản phẩm |
| `Users` | Hồ sơ, email/password hash hoặc Google ID, role, trạng thái active |
| `Orders` | Thông tin người nhận, phí/tổng tiền, phương thức/trạng thái thanh toán, vận chuyển, mã tracking, trạng thái đơn |
| `OrderItems` | Snapshot tên/giá/packaging/số lượng của từng dòng tại thời điểm đặt đơn |
| `OrderStatusHistory` | Audit trail chuyển trạng thái và ghi chú |
| `ProductReviews` | Rating/comment liên kết sản phẩm và người dùng |
| `Settings` | Cấu hình cửa hàng dạng key/value |
| `Newsletter` | Email subscriber |

### 5.1 Nguồn schema cần lưu ý

Backend hiện tại kết nối PostgreSQL qua `pg`, trong khi `database/minigt_store.sql` khai báo Microsoft SQL Server và sử dụng `IDENTITY`, `BIT`, `NVARCHAR`, `GO`, `sys.*`/`OBJECT_ID`. Các migration lịch sử cũng có script viết theo cú pháp SQL Server (ví dụ tham chiếu `dbo`/`sys.columns`). Adapter runtime chỉ chuyển đổi một số cú pháp truy vấn; nó không phải bộ chuyển đổi tổng quát cho migration SQL Server. Cần xác định schema Supabase đang chạy và chuyển đổi migration trước khi áp dụng.

## 6. Luồng dữ liệu quan trọng

### 6.1 Tải storefront

1. Browser tải HTML/CSS/JS do Express cung cấp.
2. `js/app.js` gọi API client trong `js/api.js`.
3. API client gửi request tới `API_BASE`; backend route/service tạo truy vấn PostgreSQL.
4. `productService.mapProduct` chuẩn hóa row, bao gồm giá box/card, discount, tồn và thuộc tính tương thích UI.
5. Frontend render card/catalog/showcase; khi local server không dùng được có thể chuyển sang dữ liệu fallback browser.

### 6.2 Tạo đơn/đặt cọc

1. Khách thêm model và loại bao bì vào cart, nhập thông tin nhận hàng và chọn ship/thanh toán/add-on/mã giảm giá.
2. Frontend gửi danh sách product ID, số lượng, packaging và thông tin checkout tới `POST /api/orders`; đăng nhập nếu có sẽ được gắn qua token tùy chọn.
3. Backend kiểm tra dữ liệu khách/điện thoại/địa chỉ, xác nhận sản phẩm còn kinh doanh, tự đọc giá/trạng thái từ DB thay vì tin giá frontend, gộp item trùng.
4. Transaction tạo order, order items, giữ/giảm tồn, tính phí ship/voucher/đặt cọc và ghi lịch sử `PENDING`.
5. Frontend hiển thị mã đơn, số tiền cần thanh toán và VietQR nếu được cấu hình. Hệ thống cung cấp QR/thông báo chuyển khoản; xác nhận tiền do admin thực hiện qua quản trị, không thấy tích hợp cổng thanh toán tự động trong luồng này.
6. Admin xác nhận thanh toán/đổi trạng thái, cập nhật vận đơn; customer tra cứu theo mã/SĐT hoặc trung tâm đơn hàng.

Trạng thái đơn được service cho phép theo graph gồm:

```text
PENDING → CONFIRMED | PREPARING | SHIPPING | CANCELLED
CONFIRMED → PREPARING | SHIPPING | DELIVERED | CANCELLED
PREPARING → SHIPPING | DELIVERED | CANCELLED
SHIPPING → DELIVERED | CANCELLED
DELIVERED, CANCELLED → (kết thúc)
```

Khi hủy, backend có logic hoàn tồn nếu đơn đã giữ hàng; một số trạng thái thanh toán đã thu tiền chuyển sang chờ hoàn tiền (`REFUND_PENDING`). Các route customer/action có thể có điều kiện quyền/trạng thái riêng, nên trạng thái cuối cùng vẫn phụ thuộc kiểm tra phía backend.

### 6.3 Đăng nhập và phiên

1. Khách đăng nhập/đăng ký qua form; password được hash bằng bcrypt trước khi lưu.
2. Backend phát JWT chứa user ID/role, frontend lưu phiên khách hàng trong localStorage.
3. Với request có xác thực, API client đính kèm token phiên; middleware verify JWT và (ở các route cần thiết) tải user active/role từ DB.
4. Admin có token/storage key tách riêng; `/api/admin` được kiểm tra quyền admin ở backend.
5. Google OAuth nhận credential từ Google Identity Services rồi gửi tới backend để xử lý; khôi phục mật khẩu/OTP sử dụng email khi cấu hình SMTP phù hợp.

### 6.4 Cập nhật admin

1. Admin mở tab dashboard/sản phẩm/đơn/user/settings.
2. `admin.js` gọi các endpoint `/api/admin/...`; middleware xác thực và phân quyền chạy trước controller.
3. Route cập nhật thông qua service hoặc query PostgreSQL, sau đó trả JSON chuẩn hóa.
4. Admin render kết quả và thông báo trạng thái; storefront có thể tải lại trạng thái đơn. `BroadcastChannel` chỉ đồng bộ tab trong cùng browser, không thay thế cập nhật database hoặc push tới thiết bị khác.

## 7. User flow

### Khách mua hàng

1. Vào storefront, duyệt catalog hoặc tìm theo tên/SKU/brand.
2. Lọc theo danh mục/nhãn/pre-order, sắp xếp, xem chi tiết/quick view; có thể so sánh hoặc thêm wishlist.
3. Chọn Box/Card phù hợp, thêm vào cart và chọn dòng cần thanh toán.
4. Nhập tên, số điện thoại, địa chỉ/ghi chú; chọn giao hàng, phương thức thanh toán và add-on/voucher.
5. Xác nhận tạo đơn. Đơn hàng hoạt động cả guest lẫn tài khoản; user đã đăng nhập sẽ có thể gắn user ID.
6. Thanh toán theo hướng dẫn/QR hoặc COD theo phương thức được backend chấp nhận; upload/gửi biên nhận nếu cần.
7. Tra cứu tình trạng bằng mã đơn/SĐT/mã vận đơn, xem lịch sử, chỉnh thông tin giao hàng khi trạng thái còn cho phép, hủy đơn đang chờ hoặc xác nhận đã nhận.

### Thành viên

1. Đăng ký email/mật khẩu hoặc đăng nhập tài khoản hiện có/Google.
2. Quản lý hồ sơ và xem các đơn liên kết tài khoản.
3. Gửi đánh giá sản phẩm khi đã đăng nhập.

### Admin

1. Mở `/admin`, đăng nhập bằng tài khoản role admin; token được lưu độc lập với phiên khách.
2. Dashboard theo dõi doanh thu/đơn/tồn thấp/khách, đơn gần đây và sản phẩm bán chạy.
3. Quản lý catalog và category; sửa thông tin, giá box/card, discount, tồn, trạng thái active/pre-order.
4. Xử lý đơn: kiểm tra thanh toán, cập nhật tiến trình, mã vận đơn, pre-order, hủy và hoàn tiền.
5. Quản lý user/subscriber và cấu hình hotline, phí ship, ngưỡng free ship, deposit, thông tin nhận chuyển khoản, announcement.

## 8. Cấu hình, chạy và kiểm thử vận hành

Đọc [README.md](./README.md) để cài dependencies và chạy. Server hiện chạy được bằng `npm run dev` hoặc `npm start`; cả hai dùng cùng entry point.

Các biến môi trường được mã nguồn đọc:

- Bắt buộc: `DATABASE_URL`, `JWT_SECRET`.
- Kết nối/chức năng tùy chọn: `PORT`, `EMAIL_USER`, `EMAIL_PASS`, `GOOGLE_CLIENT_ID`.
- Không ghi giá trị của `.env` vào log/tài liệu hoặc commit vào Git.

Kiểm tra vận hành:

1. `GET /api/health` phải trả `success: true`; trường `data.connected` phản ánh trạng thái pool.
2. `GET /api/products`, `GET /api/products/categories`, `GET /api/settings` xác nhận các route public và query DB cơ bản.
3. `package.json` chưa có npm scripts dành cho test/build/migration. Một số script kiểm tra trong repository có nội dung cũ gắn với SQL Server API (ví dụ `pool.request()`), vì thế cần kiểm tra tương thích trước khi xem chúng là test suite cho cấu hình PostgreSQL hiện tại.

Trong phiên làm việc lúc lập tài liệu, server trả `200` cho health, products, categories và settings; health cho biết PostgreSQL đã kết nối. Kết quả này chỉ xác nhận các endpoint cơ bản tại thời điểm kiểm tra, không phải xác nhận toàn bộ nghiệp vụ end-to-end.

## 9. Điểm cần lưu ý khi bảo trì

- **Schema/migration:** runtime PostgreSQL nhưng một số script SQL và test còn mang dấu vết SQL Server. Xác minh schema thật trước khi chạy migration.
- **Fallback:** fallback `localStorage` là dữ liệu riêng từng trình duyệt; dễ tạo khác biệt với database. Không dùng làm nguồn sự thật production.
- **Thanh toán:** VietQR tạo hướng dẫn/QR, còn xác nhận thanh toán được thực hiện qua thao tác quản trị; không nên diễn giải là đã tích hợp đối soát tự động.
- **Auth/demo:** một số nhánh tương thích local/dev và dữ liệu tài khoản mẫu còn nằm trong mã frontend/backend. Không dùng chúng làm cơ chế xác thực production; cần rà soát, loại bỏ/khóa các nhánh demo và thay dữ liệu mẫu trước khi public.
- **Secrets:** giữ `.env` ngoài Git, dùng secret manager, đặt `JWT_SECRET` đủ ngẫu nhiên và không dựa vào credential/config dự phòng trong mã nguồn.
- **CORS:** middleware trong `server/server.js` phản chiếu Origin của request; cần cấu hình allowlist phù hợp với domain triển khai thay vì coi cấu hình hiện tại là chính sách production.
- **API origin:** local API client mặc định trỏ cổng `5000`; production mặc định dùng host được ghi trong `js/api.js`. Khi đổi domain cần cập nhật cấu hình tương ứng hoặc đặt `MINIGT_API_BASE`.
- **Scripts:** tên tệp “test”/“migration” không đảm bảo tương thích với PostgreSQL hiện tại; xem xét nội dung, backup database và xác minh môi trường trước khi chạy.
