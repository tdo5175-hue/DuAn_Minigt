/**
 * HTTP helpers: chuẩn hóa response { success, message, data } và lỗi có status.
 */
class HttpError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const badRequest = (msg, details) => new HttpError(400, msg, 'BAD_REQUEST', details);
const unauthorized = (msg = 'Vui lòng đăng nhập', code = 'UNAUTHORIZED') => new HttpError(401, msg, code);
const forbidden = (msg = 'Bạn không có quyền thực hiện thao tác này') => new HttpError(403, msg, 'FORBIDDEN');
const notFound = (msg = 'Không tìm thấy dữ liệu') => new HttpError(404, msg, 'NOT_FOUND');
const conflict = (msg) => new HttpError(409, msg, 'CONFLICT');

function ok(res, data = null, message = 'OK', extra = {}) {
  return res.json({ success: true, message, data, ...extra });
}

function created(res, data = null, message = 'Đã tạo', extra = {}) {
  return res.status(201).json({ success: true, message, data, ...extra });
}

/** Chuyển lỗi SQL Server thường gặp thành thông báo thân thiện */
function translateDbError(err) {
  const msg = String(err && err.message || '');
  if (/CK_Users_Gmail/i.test(msg)) return badRequest('Hệ thống hiện chỉ chấp nhận địa chỉ Gmail (@gmail.com)');
  if (/CK_Products_OldPrice/i.test(msg)) return badRequest('Giá gốc phải lớn hơn giá bán (hoặc để trống)');
  if (/CK_Products_Price/i.test(msg)) return badRequest('Giá bán phải lớn hơn 0');
  if (/CK_Products_Stock/i.test(msg)) return badRequest('Tồn kho không được âm');
  if (/CK_OrderItems_Qty/i.test(msg)) return badRequest('Số lượng mỗi sản phẩm phải từ 1 đến 99');
  if (/UNIQUE KEY|duplicate key/i.test(msg)) return conflict('Dữ liệu bị trùng (mã hoặc email đã tồn tại)');
  if (/REFERENCE constraint/i.test(msg)) return conflict('Dữ liệu đang được tham chiếu ở nơi khác nên không thể xóa');
  return null;
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let e = err;
  if (!(e instanceof HttpError)) {
    if (e && e.type === 'entity.too.large') e = new HttpError(413, 'Dữ liệu gửi lên quá lớn', 'PAYLOAD_TOO_LARGE');
    else if (e && e.type === 'entity.parse.failed') e = badRequest('JSON gửi lên không hợp lệ');
    else e = translateDbError(err) || err;
  }
  const status = e.status && e.status >= 400 && e.status < 600 ? e.status : 500;
  if (status >= 500) console.error('[API ERROR]', req.method, req.originalUrl, err);
  res.status(status).json({
    success: false,
    message: status >= 500 && !(e instanceof HttpError) && status !== 503
      ? 'Lỗi xử lý máy chủ, vui lòng thử lại sau'
      : e.message,
    code: e.code || (status >= 500 ? 'SERVER_ERROR' : 'ERROR'),
    details: e.details,
    data: null
  });
}

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict, ok, created, errorHandler };
