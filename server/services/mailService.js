/**
 * MAIL SERVICE — GỬI EMAIL THÔNG BÁO TỰ ĐỘNG CHO KHÁCH HÀNG
 * - Email xác nhận đơn hàng khi khách đặt hàng thành công
 * - Email cảm ơn khi đơn hàng giao thành công (DELIVERED)
 * - Email OTP đăng nhập & OTP quên mật khẩu
 */
const nodemailer = require('nodemailer');

const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: (process.env.EMAIL_USER || '').trim(),
    pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, '')
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000
});

function formatVND(val) {
  const n = Number(val) || 0;
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

/**
 * 1. GỬI EMAIL CẢM ƠN & XÁC NHẬN ĐƠN HÀNG KHI KHÁCH ĐẶT HÀNG THÀNH CÔNG
 */
async function sendOrderConfirmationEmail(order) {
  try {
    const email = order.customer?.email || order.email || order.Email;
    if (!email || !email.includes('@')) {
      console.log(`[MAIL] Đơn #${order.code || order.orderCode} không có email hợp lệ, bỏ qua gửi email xác nhận.`);
      return false;
    }

    const orderCode = order.code || order.orderCode || order.OrderCode || 'MGT-ORDER';
    const fullName = order.customer?.fullName || order.fullName || order.FullName || 'Quý khách';
    const phone = order.customer?.phone || order.phone || order.Phone || '';
    const address = order.customer?.address || order.address || order.Address || '';
    const total = Number(order.total || order.totalAmount || order.Total || 0);
    const shippingFee = Number(order.shippingFee ?? order.ShippingFee ?? 0);
    const subtotal = Number(order.subtotal ?? order.Subtotal ?? Math.max(0, total - shippingFee));
    const protectorFee = Number(order.protectorFee ?? (/PROTECT|BẢO VỆ|PVC\s*15K/i.test(String(order.note || order.Note || '')) ? 15000 : 0));
    const productPayable = Number(order.productPayable ?? Math.max(0, total - shippingFee));
    const discountAmount = Number(order.discountAmount ?? Math.max(0, subtotal + protectorFee - productPayable));
    const depositAmount = Number(order.depositAmount || order.DepositAmount || 0);
    const isPreOrder = Boolean(order.wasPreOrder || order.hasPreOrder || order.HasPreOrder);
    const payMethod = String(order.paymentMethod || order.PaymentMethod || 'COD').toUpperCase();
    const payStatus = String(order.paymentStatus || order.PaymentStatus || 'UNPAID').toUpperCase();
    const isPartialDeposit = payMethod === 'DEPOSIT' || (depositAmount > 0 && depositAmount < productPayable);
    const qrTransferAmount = Number(order.qrTransferAmount ?? (payMethod === 'COD' ? 0 : (isPartialDeposit ? depositAmount : productPayable)));
    const remainingProductAmount = Number(order.remainingProductAmount ?? (payStatus === 'PAID' ? 0 : (isPartialDeposit ? Math.max(0, productPayable - depositAmount) : (payMethod === 'COD' ? productPayable : 0))));
    const payableOnDelivery = Number(order.payableOnDelivery ?? (remainingProductAmount + shippingFee));
    const items = Array.isArray(order.items) ? order.items : [];

    const itemsHtml = items.map(it => {
      const pName = escapeHtml(it.productName || it.ProductName || it.name || 'Mô hình MINI GT 1:64');
      const qty = Number(it.quantity || it.Quantity || 1);
      const price = Number(it.unitPrice || it.UnitPrice || it.price || 0);
      const pack = String(it.packagingOption || it.PackagingOption || 'box').toUpperCase();
      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b;">
            <strong>${pName}</strong><br>
            <span style="font-size: 11px; color: #64748b;">Quy cách: ${pack === 'CARD' ? '🛡️ Thẻ Blister Card' : '📦 Hộp Giấy Box'}</span>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; text-align: center;">x${qty}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; text-align: right;">${formatVND(price)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${formatVND(price * qty)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15,23,42,0.08); border: 1px solid #e2e8f0; }
          .header { background: #0f172a; padding: 28px 24px; text-align: center; border-bottom: 4px solid #dc2626; }
          .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px; }
          .header p { color: #94a3b8; margin: 6px 0 0; font-size: 12.5px; }
          .content { padding: 30px 24px; color: #1e293b; line-height: 1.6; }
          .badge-success { display: inline-block; background: #dcfce7; color: #15803d; font-weight: 800; font-size: 12px; padding: 4px 12px; border-radius: 20px; border: 1px solid #86efac; }
          .order-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; }
          .table-items { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .table-items th { background: #f1f5f9; padding: 8px 12px; font-size: 11.5px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; }
          .footer { background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11.5px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MINI GT STORE BIÊN HÒA</h1>
            <p>Hệ Thống Phân Phối &amp; Đặt Trước Mô Hình Tĩnh 1:64 Chính Hãng</p>
          </div>
          <div class="content">
            <div style="text-align: center; margin-bottom: 20px;">
              <span class="badge-success">🎉 ĐẶT HÀNG THÀNH CÔNG</span>
              <h2 style="margin: 10px 0 4px; font-size: 20px; font-weight: 900; color: #0f172a;">CẢM ƠN BẠN ĐÃ ĐẶT HÀNG!</h2>
              <div style="font-size: 13px; color: #64748b;">Mã đơn hàng: <strong style="color: #dc2626; font-family: monospace; font-size: 15px;">#${escapeHtml(orderCode)}</strong></div>
            </div>

            <p style="font-size: 14px; margin: 0 0 14px;">Xin chào <strong>${escapeHtml(fullName)}</strong>,</p>
            <p style="font-size: 13.5px; color: #334155; margin: 0 0 16px;">
              Cửa hàng <strong>Săn Xe Biên Hòa</strong> đã tiếp nhận đơn hàng của bạn. Chúng tôi sẽ kiểm tra chất lượng mô hình, đóng bọc 4 lớp bóng khí chống sốc và bàn giao cho đơn vị vận chuyển <strong>SPX Express</strong> trong thời gian sớm nhất.
            </p>

            <!-- Bảng sản phẩm -->
            <div class="order-box">
              <div style="font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 8px;">
                📦 CHI TIẾT KIỆN MÔ HÌNH:
              </div>
              <table class="table-items">
                <thead>
                  <tr>
                    <th style="text-align: left;">Sản phẩm</th>
                    <th style="text-align: center;">SL</th>
                    <th style="text-align: right;">Đơn giá</th>
                    <th style="text-align: right;">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Tổng kết tài chính tách bạch Tiền hàng Shop & Phí ship SPX -->
              <div style="margin-top: 14px; padding-top: 12px; border-top: 2px dashed #cbd5e1; font-size: 13px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <span>Hình thức thanh toán:</span>
                  <strong>${isPartialDeposit ? (isPreOrder ? 'Đặt cọc 30% Pre-Order + COD phần còn lại' : 'Đặt cọc 30% + COD phần còn lại') : (payMethod === 'COD' ? 'Thanh toán Ship COD 100% khi nhận xe' : 'Chuyển khoản VietQR 100% tiền hàng')}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #334155;">
                  <span>Tạm tính tiền mô hình:</span>
                  <strong>${formatVND(subtotal)}</strong>
                </div>
                ${protectorFee > 0 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #334155;">
                    <span>Phụ phí hộp nhựa Protector PVC:</span>
                    <strong>+${formatVND(protectorFee)}</strong>
                  </div>
                ` : ''}
                ${discountAmount > 0 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #16a34a;">
                    <span>Giảm giá Voucher ưu đãi:</span>
                    <strong>-${formatVND(discountAmount)}</strong>
                  </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #0f172a; font-weight: 700;">
                  <span>Tiền hàng thanh toán cho Shop:</span>
                  <span>${formatVND(productPayable)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #0369a1;">
                  <span>Phí vận chuyển (của đơn vị SPX Express):</span>
                  <strong>${shippingFee > 0 ? formatVND(shippingFee) : 'Miễn phí (0đ)'}</strong>
                </div>
                ${qrTransferAmount > 0 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #7c3aed; background: #f5f3ff; padding: 6px 10px; border-radius: 6px;">
                    <span>${isPartialDeposit ? '💳 Chuyển khoản cọc 30% tiền hàng cho Shop:' : '💳 Chuyển khoản 100% tiền hàng cho Shop:'}</span>
                    <strong>${formatVND(qrTransferAmount)} ${payStatus === 'PAID' || payStatus === 'PARTIALLY_PAID' ? '(Đã nhận)' : ''}</strong>
                  </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; margin-top: 6px; padding: 8px 10px; border-radius: 8px; background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; font-weight: 800;">
                  <span>🚚 Thanh toán cho bưu tá SPX khi nhận xe:</span>
                  <span>${formatVND(payableOnDelivery)}${shippingFee > 0 ? ` (${remainingProductAmount > 0 ? `Hàng ${formatVND(remainingProductAmount)} + ` : ''}Ship SPX ${formatVND(shippingFee)})` : ''}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 8px;">
                  <span>TỔNG GIÁ TRỊ ĐƠN (Hàng + Ship SPX):</span>
                  <span>${formatVND(total)}</span>
                </div>
              </div>
            </div>

            <!-- Địa chỉ nhận hàng -->
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; font-size: 12.5px; color: #92400e; margin-bottom: 20px;">
              <strong style="font-size: 13px;"><i class="fa-solid fa-location-dot"></i> Địa chỉ nhận hàng SPX Express:</strong><br>
              Người nhận: <strong>${escapeHtml(fullName)}</strong> • SĐT: <strong>${escapeHtml(phone)}</strong><br>
              Địa chỉ: <span>${escapeHtml(address)}</span>
            </div>

            <div style="font-size: 12.5px; color: #64748b; line-height: 1.5;">
              🛡️ <strong>Cam kết từ Mini GT Biên Hòa:</strong> 100% mô hình nguyên seal từ nhà sản xuất, bảo vệ blister/box tối đa. Bạn có thể tra cứu trạng thái đơn hàng trực tiếp tại website bất cứ lúc nào bằng Mã đơn <strong>#${escapeHtml(orderCode)}</strong> hoặc Số điện thoại.
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0 0 4px 0;"><strong>MINI GT STORE BIÊN HÒA — SĂN XE BIÊN HÒA</strong></p>
            <p style="margin: 0 0 4px 0;">Showroom: 38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai</p>
            <p style="margin: 0;">Hotline / Zalo hỗ trợ: <strong>0981.903.400</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await mailTransporter.sendMail({
      from: `"MINI GT STORE BIÊN HÒA" <${process.env.EMAIL_USER || 'tdo5175@gmail.com'}>`,
      to: email,
      subject: `[MINI GT STORE] 🎉 Cảm ơn bạn đã đặt đơn hàng #${orderCode}!`,
      text: `Xin chào ${fullName},\n\nCửa hàng Săn Xe Biên Hòa đã tiếp nhận đơn hàng #${orderCode} của bạn.\nTổng đơn hàng: ${formatVND(total)}.\nĐịa chỉ nhận hàng: ${address}.\n\nCảm ơn bạn đã tin tưởng và đồng hành cùng cộng đồng sưu tầm mô hình Săn Xe Biên Hòa!\nHotline/Zalo: 0988.164.164`,
      html,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    });

    console.log(`[MAIL CONFIRMATION SUCCESS]: Đã gửi email xác nhận đơn #${orderCode} tới ${email}`);
    return true;
  } catch (err) {
    console.error('[MAIL CONFIRMATION ERROR]: Lỗi gửi email xác nhận đơn:', err.message);
    return false;
  }
}

/**
 * 2. GỬI EMAIL CẢM ƠN KHI ĐƠN HÀNG HOÀN TẤT & ĐÃ GIAO THÀNH CÔNG (DELIVERED)
 */
async function sendOrderDeliveredEmail(order) {
  try {
    const email = order.customer?.email || order.email || order.Email;
    if (!email || !email.includes('@')) {
      console.log(`[MAIL] Đơn #${order.code || order.orderCode} không có email hợp lệ, bỏ qua gửi email cảm ơn giao hàng.`);
      return false;
    }

    const orderCode = order.code || order.orderCode || order.OrderCode || 'MGT-ORDER';
    const fullName = order.customer?.fullName || order.fullName || order.FullName || 'Quý khách';
    const total = Number(order.total || order.Total || 0);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15,23,42,0.08); border: 1px solid #e2e8f0; }
          .header { background: #0f172a; padding: 28px 24px; text-align: center; border-bottom: 4px solid #10b981; }
          .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px; }
          .header p { color: #94a3b8; margin: 6px 0 0; font-size: 12.5px; }
          .content { padding: 30px 24px; color: #1e293b; line-height: 1.6; }
          .badge-delivered { display: inline-block; background: #dcfce7; color: #15803d; font-weight: 800; font-size: 12px; padding: 4px 14px; border-radius: 20px; border: 1px solid #86efac; }
          .card-guide { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11.5px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MINI GT STORE BIÊN HÒA</h1>
            <p>Hệ Thống Phân Phối &amp; Đặt Trước Mô Hình Tĩnh 1:64 Chính Hãng</p>
          </div>
          <div class="content">
            <div style="text-align: center; margin-bottom: 20px;">
              <span class="badge-delivered">🏆 GIAO HÀNG THÀNH CÔNG</span>
              <h2 style="margin: 10px 0 4px; font-size: 20px; font-weight: 900; color: #047857;">CHÚC MỪNG BẠN ĐÃ NHẬN ĐƯỢC XE!</h2>
              <div style="font-size: 13px; color: #64748b;">Đơn hàng: <strong style="color: #059669; font-family: monospace; font-size: 15px;">#${escapeHtml(orderCode)}</strong></div>
            </div>

            <p style="font-size: 14px; margin: 0 0 14px;">Xin chào <strong>${escapeHtml(fullName)}</strong>,</p>
            <p style="font-size: 13.5px; color: #334155; margin: 0 0 16px;">
              Hệ thống ghi nhận bạn đã nhận được kiện mô hình tĩnh 1:64 cho đơn hàng <strong>#${escapeHtml(orderCode)}</strong> thành công. Cảm ơn bạn đã tin tưởng và đồng hành cùng cộng đồng sưu tầm mô hình <strong>Săn Xe Biên Hòa</strong>!
            </p>

            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; color: #065f46; font-size: 13px;">
              ⭐ <strong>Tích điểm hội viên:</strong> Giá trị đơn hàng <strong>${formatVND(total)}</strong> đã được ghi nhận vào tài khoản của bạn để nâng hạng Collector VIP và mở khóa các mã ưu đãi độc quyền cho những đợt mở cọc tiếp theo.
            </div>

            <!-- Cẩm nang bảo quản mô hình -->
            <div class="card-guide">
              <div style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 10px;">
                🚗 MẸO BẢO QUẢN MÔ HÌNH TĨNH 1:64 BỀN ĐẸP TRƯỜNG TỒN:
              </div>
              <ul style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #475569; line-height: 1.6;">
                <li><strong>Tránh ánh nắng mặt trời trực tiếp &amp; nhiệt độ cao:</strong> Giúp màu sơn tĩnh điện và bộ tem Decal luôn giữ được độ bóng sáng chuẩn xuất xưởng.</li>
                <li><strong>Bảo quản trong hộp Mica / Khay trưng bày:</strong> Giữ mô hình không bị bám bụi và tránh va quẹt trong quá trình chiêm ngưỡng.</li>
                <li><strong>Vệ sinh định kỳ:</strong> Dùng cọ lông mềm quét nhẹ bụi bẩn trên thân xe và hốc bánh, tránh dùng hóa chất tẩy rửa mạnh.</li>
                <li><strong>Đối với bản Blister Card:</strong> Khuyên dùng hộp nhựa bảo vệ Card Protector để giữ viền thẻ art nguyên seal không bị cong vênh.</li>
              </ul>
            </div>

            <p style="font-size: 13px; color: #475569; text-align: center; margin: 20px 0 0;">
              Nếu bạn có bất kỳ thắc mắc nào về sản phẩm hoặc cần hỗ trợ, đừng ngần ngại liên hệ với chúng tôi qua Hotline / Zalo: <strong style="color: #dc2626;">0981.903.400</strong>.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0 0 4px 0;"><strong>MINI GT STORE BIÊN HÒA — SĂN XE BIÊN HÒA</strong></p>
            <p style="margin: 0 0 4px 0;">Showroom: 38/2 Võ Thị Sáu, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai</p>
            <p style="margin: 0;">Hotline / Zalo hỗ trợ: <strong>0981.903.400</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await mailTransporter.sendMail({
      from: `"MINI GT STORE BIÊN HÒA" <${process.env.EMAIL_USER || 'tdo5175@gmail.com'}>`,
      to: email,
      subject: `[MINI GT STORE] 🏆 Chúc mừng bạn đã nhận kiện xe #${orderCode} thành công!`,
      text: `Xin chào ${fullName},\n\nHệ thống ghi nhận bạn đã nhận được kiện mô hình tĩnh 1:64 cho đơn hàng #${orderCode} thành công.\nGiá trị đơn hàng: ${formatVND(total)} đã được ghi nhận vào tài khoản của bạn để tích điểm hội viên.\n\nCảm ơn bạn đã tin tưởng và đồng hành cùng cộng đồng sưu tầm mô hình Săn Xe Biên Hòa!\nHotline/Zalo hỗ trợ: 0988.164.164`,
      html,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    });

    console.log(`[MAIL DELIVERED SUCCESS]: Đã gửi email cảm ơn giao hàng đơn #${orderCode} tới ${email}`);
    return true;
  } catch (err) {
    console.error('[MAIL DELIVERED ERROR]: Lỗi gửi email giao hàng thành công:', err.message);
    return false;
  }
}

module.exports = {
  mailTransporter,
  sendOrderConfirmationEmail,
  sendOrderDeliveredEmail
};
