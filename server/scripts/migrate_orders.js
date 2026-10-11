/**
 * SCRIPT CẬP NHẬT CẤU TRÚC BẢNG ORDERS (SQL SERVER)
 * Phục vụ phân hệ Admin Order Management
 */
const db = require('../config/db');

async function migrate() {
  try {
    console.log('[MIGRATION] Bắt đầu cập nhật bảng Orders...');

    // 1. Cột PaymentStatus
    await db.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'PaymentStatus')
      BEGIN
        ALTER TABLE Orders ADD PaymentStatus VARCHAR(20) NOT NULL CONSTRAINT DF_Orders_PaymentStatus DEFAULT 'UNPAID';
      END
    `);
    console.log('[MIGRATION] 1. Cột PaymentStatus: OK');

    // 2. Cột CancelReason
    await db.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'CancelReason')
      BEGIN
        ALTER TABLE Orders ADD CancelReason NVARCHAR(255) NULL;
      END
    `);
    console.log('[MIGRATION] 2. Cột CancelReason: OK');

    // 3. Cột ReceiptImage
    await db.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ReceiptImage')
      BEGIN
        ALTER TABLE Orders ADD ReceiptImage NVARCHAR(500) NULL;
      END
    `);
    console.log('[MIGRATION] 3. Cột ReceiptImage: OK');

    // 4. Cập nhật CK_Orders_Payment
    await db.query(`
      IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Orders_Payment')
      BEGIN
        ALTER TABLE Orders DROP CONSTRAINT CK_Orders_Payment;
      END
    `);
    await db.query(`
      ALTER TABLE Orders ADD CONSTRAINT CK_Orders_Payment 
      CHECK (PaymentMethod IN ('COD', 'BANK_TRANSFER', 'cod', 'bank', 'vietqr', 'momo'));
    `);
    console.log('[MIGRATION] 4. Constraint CK_Orders_Payment: OK');

    // 5. Cập nhật CK_Orders_Status
    await db.query(`
      IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Orders_Status')
      BEGIN
        ALTER TABLE Orders DROP CONSTRAINT CK_Orders_Status;
      END
    `);
    await db.query(`
      ALTER TABLE Orders ADD CONSTRAINT CK_Orders_Status 
      CHECK (Status IN ('PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled'));
    `);
    console.log('[MIGRATION] 5. Constraint CK_Orders_Status: OK');

    // 6. Thêm CK_Orders_PaymentStatus
    await db.query(`
      IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Orders_PaymentStatus')
      BEGIN
        ALTER TABLE Orders ADD CONSTRAINT CK_Orders_PaymentStatus 
        CHECK (PaymentStatus IN ('UNPAID', 'PAID', 'REFUNDED', 'unpaid', 'paid', 'refunded'));
      END
    `);
    console.log('[MIGRATION] 6. Constraint CK_Orders_PaymentStatus: OK');

    // 7. Đồng bộ dữ liệu các đơn hàng hiện có
    await db.query(`
      UPDATE Orders SET 
        Status = CASE 
          WHEN LOWER(Status) = 'completed' THEN 'DELIVERED'
          WHEN LOWER(Status) = 'shipping' THEN 'SHIPPING'
          WHEN LOWER(Status) = 'confirmed' THEN 'CONFIRMED'
          WHEN LOWER(Status) = 'cancelled' THEN 'CANCELLED'
          ELSE 'PENDING'
        END,
        PaymentMethod = CASE 
          WHEN LOWER(PaymentMethod) IN ('vietqr', 'bank') THEN 'BANK_TRANSFER'
          WHEN LOWER(PaymentMethod) = 'cod' THEN 'COD'
          ELSE UPPER(PaymentMethod)
        END,
        PaymentStatus = 'UNPAID'
      WHERE PaymentStatus IS NULL OR PaymentStatus = 'UNPAID';
    `);
    console.log('[MIGRATION] 7. Dữ liệu chuẩn hóa: OK');

    const result = await db.query('SELECT OrderId, OrderCode, PaymentMethod, Status, PaymentStatus FROM Orders');
    console.log('[MIGRATION] Danh sách đơn sau cập nhật:', result.recordset);
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATION ERROR]:', error);
    process.exit(1);
  }
}

migrate();

