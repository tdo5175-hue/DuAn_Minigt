# MINI GT STORE

Website bán và giới thiệu mô hình xe die-cast, trọng tâm MINI GT và các thương hiệu liên quan ở tỉ lệ 1:64. Repository gồm storefront, trang quản trị và REST API trong cùng ứng dụng Node.js. Frontend là HTML/CSS/JavaScript thuần; backend Express phục vụ cả giao diện tĩnh lẫn API; dữ liệu thực được lưu trong PostgreSQL/Supabase.

- **Storefront:** [http://localhost:5000](http://localhost:5000)
- **Admin:** [http://localhost:5000/admin](http://localhost:5000/admin)
- **Health check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Tài liệu phân tích sâu:** [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)

## Mục lục

- [Tính năng](#tính-năng)
- [Kiến trúc](#kiến-trúc)
- [Công nghệ](#công-nghệ)
- [Cấu trúc repository](#cấu-trúc-repository)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
- [Luồng nghiệp vụ](#luồng-nghiệp-vụ)
- [REST API](#rest-api)
- [Mô hình dữ liệu](#mô-hình-dữ-liệu)
- [Kiểm tra hoạt động](#kiểm-tra-hoạt-động)
- [Database và migration](#database-và-migration)
- [Lưu ý bảo mật/vận hành](#lưu-ý-bảo-mậtvận-hành)

## Tính năng

### Storefront cho khách

- Xem catalog, tìm kiếm sản phẩm và lọc theo danh mục, brand, trạng thái/nhãn; sắp xếp và phân trang ở giao diện.
- Các khu trưng bày theo chủ đề: Pre-order, Liberty Walk/LBWK, IMSA/GT3/F1, Secret Chase và collector hub.
- Xem sản phẩm, chọn loại đóng gói Box/Card khi sản phẩm hỗ trợ, wishlist và giỏ hàng.
- Checkout khách vãng lai hoặc tài khoản; hỗ trợ hàng có sẵn và pre-order/đặt cọc.
- Tính phí giao hàng, voucher và tùy chọn bảo vệ hộp; hiển thị hướng dẫn thanh toán/VietQR khi cấu hình cửa hàng có thông tin ngân hàng.
- Tra cứu đơn, xem đơn của tài khoản, gửi thông tin biên nhận và theo dõi mã vận đơn/trạng thái.
- Đăng ký/đăng nhập mật khẩu, Google, hồ sơ thành viên, đánh giá sản phẩm và đăng ký nhận tin.
- Giao diện responsive, VN/EN và theme sáng/tối.

### Admin

- Dashboard với KPI đơn hàng/doanh thu/tồn kho/khách hàng, đơn gần đây và sản phẩm bán chạy.
- Quản lý danh mục, sản phẩm, giá Box/Card, discount, tồn kho và tình trạng kinh doanh.
- Xử lý đơn: cập nhật trạng thái, xác nhận thanh toán, tracking, pre-order, hủy và hoàn tiền.
- Quản lý tài khoản khách hàng, newsletter và cấu hình cửa hàng.
- Phiên admin tách riêng với phiên khách ở phía trình duyệt; mọi endpoint admin vẫn phải được xác thực/phân quyền ở backend.

### Backend

- REST API Express cho storefront và admin.
- JWT auth, bcrypt password hashing, Google auth/email flows được cấu hình bằng biến môi trường.
- PostgreSQL connection pool, kiểm tra dữ liệu đầu vào và chuẩn hóa response.
- Transaction tạo đơn/ghi dòng hàng/giữ tồn/lưu lịch sử trạng thái.
- Cache ngắn hạn cho settings, cấu hình VietQR và phí giao hàng.

## Kiến trúc

```text
Browser
  ├─ Storefront: index.html + css/ + js/app.js
  ├─ Admin: admin/index.html + admin/css/ + admin/js/admin.js
  └─ js/api.js: chọn API base, thêm phiên auth, chuẩn hóa dữ liệu,
                xử lý lỗi và fallback localStorage khi local API offline
                  │ HTTP/JSON
                  ▼
Node.js + Express (server/server.js)
  ├─ static files: HTML, CSS, JavaScript, image/
  ├─ routes/: auth, products, orders, admin, settings, newsletter
  ├─ middleware/: JWT và bảo vệ quyền
  ├─ services/: product, order, settings
  └─ config/db.js: pg Pool + parameterized queries + transactions
                  │
                  ▼
          PostgreSQL / Supabase
```

Ứng dụng không có bước build frontend riêng. Express host trực tiếp các file trong workspace và mount API trên cùng server. `npm start` và `npm run dev` hiện cùng chạy `node server/server.js`.

### Frontend và API client

- `index.html` chứa cấu trúc trang khách; `js/api.js` được nạp trước `js/app.js`.
- `js/app.js` tải sản phẩm/cấu hình, render catalog và điều khiển giỏ, checkout, tài khoản, đơn hàng, giao diện.
- `admin/index.html` và `admin/js/admin.js` tạo màn quản trị, gọi cùng API client.
- `js/api.js` dùng `window.MINIGT_API_BASE` nếu đã được khai báo; nếu không, khi chạy local mặc định gọi host hiện tại qua cổng `5000`, còn production mặc định dùng URL được cấu hình trong mã nguồn.
- Client dùng browser storage cho một số dữ liệu giao diện/phiên và có fallback dữ liệu demo khi backend local không truy cập được. Fallback này là dữ liệu cục bộ của trình duyệt, không đồng bộ với DB.
- `BroadcastChannel`/storage events hỗ trợ thông báo thay đổi giữa các tab trong cùng browser; không phải hệ thống push giữa nhiều thiết bị.

### Backend và xác thực

- `server/server.js` nạp `.env`, thiết lập middleware, phục vụ static files và mount router.
- `server/routes/` nhận request, validate dữ liệu cơ bản, gọi service hoặc DB và trả JSON.
- `server/services/` chứa logic nghiệp vụ để route không phải tự xử lý toàn bộ tính toán.
- `server/middleware/auth.js` cung cấp `authenticate`, `optionalAuth`, kiểm tra tài khoản active và role admin.
- API admin được bảo vệ phía server. Ẩn tab/nút trên giao diện không thay thế phân quyền backend.
- `/api/health` báo trạng thái server và cờ `data.connected` từ pool database.

## Công nghệ

| Lớp | Công nghệ |
| --- | --- |
| Frontend | HTML5, CSS, JavaScript thuần |
| Backend | Node.js, Express 4 |
| Database driver | `pg` (node-postgres), PostgreSQL/Supabase |
| Auth | JSON Web Token, bcryptjs |
| OAuth | Google Identity Services / Google Auth Library |
| Email | Nodemailer với Gmail SMTP |
| Static assets | CSS, JavaScript và ảnh trong repository |

Phiên bản package và lệnh chạy chính thức được khai báo trong [package.json](./package.json).

## Cấu trúc repository

| Đường dẫn | Nội dung |
| --- | --- |
| `index.html` | Storefront |
| `css/` | CSS cửa hàng; `style.css` import variables, base, components, sections, responsive |
| `js/app.js` | Logic giao diện và luồng khách hàng |
| `js/api.js` | API client dùng chung, phiên browser, chuẩn hóa và fallback |
| `admin/index.html` | Giao diện quản trị |
| `admin/css/admin.css` | CSS quản trị |
| `admin/js/admin.js` | Logic màn hình và thao tác admin |
| `server/server.js` | Express entry point, static host và mount routes |
| `server/routes/` | Route auth, products, orders, admin, newsletter, settings |
| `server/services/` | Logic sản phẩm, đơn hàng và settings |
| `server/middleware/` | Auth/authorization và middleware liên quan |
| `server/config/db.js` | PostgreSQL pool, chuyển đổi truy vấn, transaction |
| `server/utils/` | HTTP response/error, validation |
| `server/migrations/` | Migration/data-sync scripts lịch sử; kiểm tra tương thích trước khi chạy |
| `server/scripts/`, `scratch/` | Script kiểm tra/thử nghiệm |
| `database/minigt_store.sql` | Tệp schema lịch sử viết theo cú pháp SQL Server |
| `image/` | Logo, ảnh sản phẩm và tài nguyên hình ảnh |

## Cài đặt và chạy

### Yêu cầu

- Node.js (khuyến nghị Node.js 18 trở lên).
- npm.
- File `.env` đặt tại thư mục gốc.
- PostgreSQL/Supabase có thể truy cập qua `DATABASE_URL` và schema tương thích với truy vấn trong ứng dụng.

### Khởi động trên Windows PowerShell

```powershell
npm install
npm run dev
```

Hoặc chạy lệnh production entry point:

```powershell
npm start
```

Mở `http://localhost:5000`. Nếu đặt `PORT` khác trong `.env`, thay `5000` bằng cổng đó khi truy cập. Không cần chạy Live Server riêng hoặc bundler frontend.

Để dừng server, focus terminal đang chạy rồi nhấn `Ctrl+C`.

### Khi server không khởi động

1. Kiểm tra Node/npm: `node --version` và `npm --version`.
2. Chạy `npm install` nếu thiếu package.
3. Kiểm tra `.env` có `JWT_SECRET` và `DATABASE_URL`; không đưa giá trị thực vào ticket/log công khai.
4. Nếu báo `JWT_SECRET chưa được cấu hình`, xác nhận file `.env` nằm ở root và tên biến viết đúng.
5. Nếu server chạy nhưng `data.connected` là `false`, kiểm tra quyền truy cập DB, connection string, yêu cầu SSL/network allowlist và schema; server có thể vẫn mở cổng trong khi DB lỗi.
6. Nếu cổng đã được sử dụng, đặt cổng khác bằng `PORT` sau khi xác định tiến trình đang giữ cổng.

## Cấu hình môi trường

Ứng dụng đọc các biến sau từ môi trường. Không commit `.env`, không copy secret vào tài liệu, ảnh chụp màn hình hoặc log.

| Biến | Bắt buộc | Mục đích |
| --- | --- | --- |
| `DATABASE_URL` | Có cho DB thật | Connection string PostgreSQL/Supabase |
| `JWT_SECRET` | Có | Ký/xác minh JWT; auth không khởi tạo nếu thiếu |
| `PORT` | Không | Cổng HTTP; mặc định `5000` |
| `EMAIL_USER` | Tùy tính năng | Tài khoản gửi email Gmail |
| `EMAIL_PASS` | Tùy tính năng | App password/credential SMTP Gmail |
| `GOOGLE_CLIENT_ID` | Tùy tính năng | Google Identity Services/OAuth |

Tạo `.env` cục bộ từ thông tin được cấp riêng. Không đặt secret thật vào README:

```dotenv
PORT=5000
DATABASE_URL=<your-postgresql-connection-string>
JWT_SECRET=<long-random-secret>
EMAIL_USER=<your-sender-email>
EMAIL_PASS=<your-mail-app-password>
GOOGLE_CLIENT_ID=<your-google-client-id>
```

Đảm bảo các placeholder đã được thay trong file local trước khi khởi chạy. Production nên cấu hình secret qua secret manager/environment variables của nền tảng. Không dùng credential mặc định hoặc dữ liệu demo trong mã nguồn làm cấu hình production.

## Luồng nghiệp vụ

### Khách xem và chọn hàng

1. Browser tải trang và static assets từ Express.
2. Storefront gọi API lấy sản phẩm/danh mục/cấu hình.
3. Backend truy vấn PostgreSQL, `productService` chuẩn hóa tên trường, giá Box/Card, giảm giá, tồn kho và pre-order.
4. Frontend render danh sách; người dùng tìm kiếm/lọc/sắp xếp, xem chi tiết, thêm wishlist hoặc chọn sản phẩm vào giỏ.
5. Cart/wishlist/form có thể được lưu trong browser storage để duy trì giao diện trên cùng trình duyệt.

### Tạo đơn và đặt cọc

1. Khách chọn sản phẩm, số lượng và loại packaging; nhập tên, điện thoại, địa chỉ/ghi chú và lựa chọn giao hàng/thanh toán.
2. Frontend gửi product ID, quantity, packaging cùng thông tin checkout tới `POST /api/orders`. Đăng nhập là tùy chọn khi đặt đơn; nếu có phiên hợp lệ, đơn có thể gắn user ID.
3. Backend xác thực thông tin nhận hàng, đọc lại sản phẩm và giá từ database (không lấy giá do browser quyết định), gộp các dòng trùng và kiểm tra tồn/trạng thái.
4. Trong transaction, backend tính subtotal, ship, voucher, phụ phí, tiền cọc; tạo `Orders`, `OrderItems`, cập nhật tồn và ghi `OrderStatusHistory`.
5. Khách nhận mã đơn và hướng dẫn thanh toán. VietQR là thông tin/QR chuyển khoản; không đồng nghĩa với cổng thanh toán hoặc đối soát tự động.
6. Admin kiểm tra giao dịch, cập nhật thanh toán/trạng thái và tracking. Khách tra cứu theo mã đơn, số điện thoại hoặc thông tin vận đơn.

Các trạng thái đơn được `orderService` cho phép:

```text
PENDING   → CONFIRMED | PREPARING | SHIPPING | CANCELLED
CONFIRMED → PREPARING | SHIPPING | DELIVERED | CANCELLED
PREPARING → SHIPPING | DELIVERED | CANCELLED
SHIPPING  → DELIVERED | CANCELLED
DELIVERED, CANCELLED → kết thúc
```

Service có logic giữ/trả tồn khi tạo đơn và hủy; hủy đơn đã thu tiền có thể chuyển thanh toán sang `REFUND_PENDING`. Điều kiện cụ thể còn phụ thuộc route và trạng thái hiện tại.

### Tài khoản

1. Khách đăng ký bằng email/mật khẩu hoặc sử dụng luồng Google nếu đã cấu hình.
2. Backend hash mật khẩu bằng bcrypt và phát JWT khi xác thực thành công.
3. API client lưu phiên trong browser storage và gửi token với request cần xác thực.
4. Backend xác minh token và kiểm tra user/role trên các route được bảo vệ; phiên admin lưu riêng với phiên khách.
5. Email/OTP khôi phục tài khoản cần cấu hình SMTP gửi thư hợp lệ.

### Quản trị

1. Admin mở `/admin` và đăng nhập tài khoản có role admin.
2. `admin.js` tải dashboard hoặc dữ liệu tab đang mở từ `/api/admin/...`.
3. Backend xác thực JWT, role và trạng thái tài khoản trước khi xử lý.
4. Thay đổi sản phẩm, đơn, tracking, user hoặc settings được lưu qua API vào PostgreSQL; UI hiển thị kết quả từ response.

## REST API

Tất cả endpoint được mount dưới `/api`. Các response thông thường là JSON và phần lớn có cấu trúc `success`, `message`, `data`.

| Nhóm | Endpoint | Mô tả |
| --- | --- | --- |
| Health | `GET /api/health` | Kiểm tra server và kết nối DB |
| Sản phẩm | `GET /api/products` | Danh sách sản phẩm; query hỗ trợ category, brand, status, search, tag, sort, khoảng giá, in-stock |
| Sản phẩm | `GET /api/products/categories` | Danh mục public |
| Sản phẩm | `GET /api/products/:idOrSlug` | Chi tiết sản phẩm theo ID/slug |
| Đánh giá | `POST /api/products/:id/reviews` | Gửi/cập nhật rating; yêu cầu đăng nhập |
| Auth | `POST /api/auth/register`, `POST /api/auth/login` | Đăng ký và đăng nhập mật khẩu |
| Auth | `GET /api/auth/google/config`, `POST /api/auth/google` | Cấu hình và xử lý đăng nhập Google |
| Auth | `POST /api/auth/forgot`, `POST /api/auth/reset-password` | Quên và đặt lại mật khẩu |
| Auth | `PUT /api/auth/profile`, `GET /api/auth/me` | Cập nhật hồ sơ và lấy user phiên hiện tại |
| Đơn hàng | `POST /api/orders` | Tạo đơn hàng/đơn cọc; hỗ trợ khách guest |
| Đơn hàng | `GET /api/orders`, `/my-orders`, `/my`, `/:code` | Danh sách và chi tiết đơn; một số route yêu cầu/nhận auth tùy endpoint |
| Tra cứu | `GET /api/orders/check-status/:code`, `GET /api/orders/track/:query` | Kiểm tra trạng thái/tra cứu đơn |
| Khách thao tác đơn | `PUT /api/orders/:code/cancel`, `/confirm-received`, `/shipping-info` | Hủy, xác nhận nhận hàng, sửa thông tin giao |
| Khách thanh toán | `POST /api/orders/notify-transfer`, `POST /api/orders/:code/receipt` | Báo chuyển khoản/gửi thông tin ảnh biên nhận |
| Cấu hình public | `GET /api/settings` | Settings public của cửa hàng |
| Newsletter | `POST /api/newsletter` | Đăng ký email nhận tin |
| Admin | `/api/admin/stats`, `/dashboard` | Dashboard/KPI |
| Admin | `/api/admin/categories`, `/products` | Quản lý danh mục và sản phẩm |
| Admin | `/api/admin/orders` | Quản lý đơn, trạng thái, thanh toán, tracking, pre-order, hủy/hoàn tiền |
| Admin | `/api/admin/users`, `/subscribers`, `/settings` | Quản lý khách, newsletter và cấu hình |

Các endpoint admin yêu cầu JWT có quyền admin. Tham khảo route trong `server/routes/` để biết method, body, filter và quyền chính xác trước khi tích hợp client khác.

## Mô hình dữ liệu

Các bảng nghiệp vụ được ứng dụng truy cập gồm:

| Bảng | Nội dung |
| --- | --- |
| `Categories` | Danh mục, slug và thứ tự hiển thị |
| `Products` | SKU, thông tin xe, brand/scale, Box/Card, giá, discount, tồn và pre-order |
| `ProductImages` | Ảnh phụ của sản phẩm |
| `Users` | Hồ sơ khách/admin, password hash/Google ID, role, active |
| `Orders` | Người nhận, tổng tiền, phí ship, thanh toán, tracking và trạng thái |
| `OrderItems` | Sản phẩm, snapshot tên/giá/packaging/số lượng trong đơn |
| `OrderStatusHistory` | Lịch sử chuyển trạng thái và ghi chú |
| `ProductReviews` | Rating/comment theo sản phẩm và user |
| `Settings` | Cấu hình cửa hàng dạng key/value |
| `Newsletter` | Email nhận thông báo |

Quan hệ chính: Category có nhiều Product; Order có nhiều OrderItem và OrderStatusHistory; User có thể có nhiều Order/Review; Product có thể có nhiều ảnh/review/OrderItem. Mã nguồn migration và database thực tế phải được đối chiếu trước khi sửa schema.

## Kiểm tra hoạt động

### Smoke test bằng PowerShell

Khi server đang chạy:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod http://localhost:5000/api/products
Invoke-RestMethod http://localhost:5000/api/products/categories
Invoke-RestMethod http://localhost:5000/api/settings
```

Health cần trả `success: true`; `data.connected: true` cho biết pool đã kết nối DB. Các endpoint public cần trả JSON thành công để xác nhận truy vấn cơ bản. Đây không phải kiểm thử toàn bộ checkout/auth/admin.

### Test/build/migration

`package.json` hiện chỉ định nghĩa `start` và `dev`, chưa có npm script chuẩn cho `test`, `build` hoặc `migrate`. Một số file có tên test/migration trong `server/scripts/`, `server/migrations/` và `scratch/`, nhưng có script còn phụ thuộc API SQL Server cũ như `pool.request()`. Đọc và xác minh tương thích trước khi chạy; không giả định toàn bộ chúng là test suite hợp lệ cho PostgreSQL.

## Database và migration

Runtime hiện kết nối PostgreSQL qua package `pg`, sử dụng `DATABASE_URL` và có SQL PostgreSQL như `RETURNING`, `ON CONFLICT`, `ILIKE`, `LIMIT`.

Tuy nhiên:

- `database/minigt_store.sql` ghi rõ là schema Microsoft SQL Server, dùng `GO`, `IDENTITY`, `BIT`, `NVARCHAR` và catalog `sys.*`.
- Một số migration trong `server/migrations/` có cú pháp SQL Server như `dbo`, `OBJECT_ID`, `COL_LENGTH`, `CREATE OR ALTER VIEW`.
- Adapter truy vấn trong `server/config/db.js` chỉ chuyển đổi một tập con câu truy vấn runtime; không chuyển migration SQL Server thành PostgreSQL một cách đầy đủ.

**Không chạy trực tiếp các script SQL Server trên Supabase/PostgreSQL.** Trước khi migrate:

1. Xác định schema PostgreSQL thực tế và backup dữ liệu.
2. Chuyển DDL sang cú pháp PostgreSQL.
3. Rà soát constraint, kiểu dữ liệu, default, index, sequence và dữ liệu seed.
4. Chạy thử trên database staging, xác nhận dữ liệu và luồng CRUD trước khi triển khai.

## Lưu ý bảo mật/vận hành

- Không commit `.env`; thay secret demo/credential mặc định, đặt `JWT_SECRET` đủ ngẫu nhiên và quản lý bằng secret store.
- Một số nhánh compatibility/local và tài khoản mẫu còn xuất hiện trong mã nguồn. Rà soát/loại bỏ hoặc khóa chúng trước khi public; không xem fallback là xác thực production.
- CORS trong `server/server.js` hiện phản chiếu Origin của request. Khi deploy cần dùng allowlist domain rõ ràng thay vì coi cấu hình hiện tại là chính sách production.
- VietQR tạo thông tin hướng dẫn thanh toán; xác nhận thanh toán là thao tác quản trị theo luồng hiện tại, không phải đối soát ngân hàng tự động.
- Fallback `localStorage` chỉ tồn tại trên browser và có thể khác database. Không dùng làm nguồn sự thật cho đơn hàng hoặc tồn kho production.
- Khi chuyển domain, cấu hình `MINIGT_API_BASE` hoặc cập nhật production API URL trong `js/api.js`; cấu hình CORS phải khớp domain frontend.
- Health check thành công không có nghĩa mọi nghiệp vụ, schema hoặc kết nối email/Google đều đã được kiểm thử.
