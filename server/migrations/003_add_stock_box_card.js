/**
 * MIGRATION 003: BỔ SUNG QUẢN LÝ TỒN KHO THỰC TẾ CHO BẢN BOX VÀ BẢN CARD
 * Thêm cột StockBox, StockCard vào dbo.Products
 * Đồng bộ view dbo.vw_ProductList
 */
const db = require('../config/db');

async function migrate() {
  console.log('[Migration 003] Đang kiểm tra và bổ sung cột StockBox & StockCard...');

  // 1. Thêm cột StockBox nếu chưa có
  await db.query(`
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'StockBox')
    BEGIN
      ALTER TABLE dbo.Products ADD StockBox INT NOT NULL DEFAULT 0;
      PRINT 'Đã thêm cột StockBox vào dbo.Products';
    END
  `);

  // 2. Thêm cột StockCard nếu chưa có
  await db.query(`
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'StockCard')
    BEGIN
      ALTER TABLE dbo.Products ADD StockCard INT NOT NULL DEFAULT 0;
      PRINT 'Đã thêm cột StockCard vào dbo.Products';
    END
  `);

  // 3. Khởi tạo số lượng tồn kho thực tế cho các bản đã có
  await db.query(`
    UPDATE dbo.Products
    SET StockBox = CASE 
          WHEN PackagingType = 'card_only' THEN 0 
          WHEN PackagingType = 'box_only' THEN Stock 
          ELSE CEILING(Stock * 0.6) 
        END,
        StockCard = CASE 
          WHEN PackagingType = 'box_only' THEN 0 
          WHEN PackagingType = 'card_only' THEN Stock 
          ELSE FLOOR(Stock * 0.4) 
        END
    WHERE StockBox = 0 AND StockCard = 0 AND Stock > 0;
  `);

  // 4. Đồng bộ tổng Stock = StockBox + StockCard
  await db.query(`
    UPDATE dbo.Products
    SET Stock = StockBox + StockCard;
  `);

  // 5. Cập nhật view vw_ProductList
  await db.query(`
    CREATE OR ALTER VIEW dbo.vw_ProductList
    AS
    SELECT
        p.ProductId, p.Sku, p.CarNumber, p.Name, p.Slug,
        p.Brand, p.Scale, p.PackagingType,
        p.PriceBox, p.PriceCard, p.DiscountPercent,
        p.Price, p.OldPrice, p.DepositAmount,
        p.StockBox, p.StockCard, p.Stock,
        p.EditionNote, p.PreOrderDeadline,
        p.ImageUrl, p.Description, p.Status,
        p.IsFeatured, p.IsNew, p.IsActive, p.CreatedAt, p.UpdatedAt,
        c.CategoryId, c.Slug AS CategorySlug, c.Name AS CategoryName
    FROM dbo.Products AS p
    INNER JOIN dbo.Categories AS c ON c.CategoryId = p.CategoryId;
  `);

  console.log('[Migration 003] Hoàn tất bổ sung StockBox & StockCard vào SQL Server!');
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration 003] Lỗi:', err);
      process.exit(1);
    });
}

module.exports = migrate;
