/**
 * PRODUCT SERVICE — truy vấn + chuẩn hóa model sản phẩm thống nhất cho Store & Admin
 *
 * Model chuẩn (camelCase):
 *  id, sku, name, slug, brand, scale, category{id,slug,name}, price, oldPrice, discountPercent,
 *  depositAmount, stock, status, image, gallery[], description, rating, ratingCount, soldCount,
 *  badge, badges[], isFeatured, isNew, isActive, editionNote, preOrderDeadline, releaseDate,
 *  quotaPercent, createdAt, updatedAt
 */
const db = require('../config/db');

const BASE_SELECT = `
  SELECT p.ProductId, p.Sku, p.Name, p.Slug, p.Brand, p.Scale, p.Price, p.OldPrice, p.DepositAmount,
         p.QuotaPercent, p.EditionNote, p.PreOrderDeadline, p.Stock, p.ImageUrl, p.Description, p.Status,
         p.ReleaseDate, p.IsFeatured, p.IsNew, p.IsActive, p.CreatedAt, p.UpdatedAt,
         c.CategoryId, c.Slug AS CategorySlug, c.Name AS CategoryName,
         ISNULL(s.SoldCount, 0) AS SoldCount,
         r.AvgRating, ISNULL(r.RatingCount, 0) AS RatingCount
  FROM Products p
  JOIN Categories c ON c.CategoryId = p.CategoryId
  OUTER APPLY (
    SELECT SUM(oi.Quantity) AS SoldCount
    FROM OrderItems oi JOIN Orders o ON o.OrderId = oi.OrderId
    WHERE oi.ProductId = p.ProductId AND o.Status <> 'CANCELLED'
  ) s
  OUTER APPLY (
    SELECT CAST(AVG(CAST(pr.Rating AS DECIMAL(4,2))) AS DECIMAL(3,2)) AS AvgRating, COUNT(*) AS RatingCount
    FROM ProductReviews pr WHERE pr.ProductId = p.ProductId
  ) r
`;

const toDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

function computeBadges(p) {
  const badges = [];
  if (p.status === 'sold_out' || (p.status === 'in_stock' && p.stock <= 0)) badges.push('sold_out');
  if (p.status === 'pre_order') badges.push('pre_order');
  if (p.oldPrice && p.oldPrice > p.price) badges.push('sale');
  if (p.isNew) badges.push('new');
  if (p.isFeatured) badges.push('featured');
  return badges;
}

function mapProduct(row) {
  const price = Number(row.Price) || 0;
  const oldPrice = row.OldPrice != null ? Number(row.OldPrice) : null;
  const p = {
    id: Number(row.ProductId),
    sku: row.Sku,
    name: row.Name,
    slug: row.Slug,
    brand: row.Brand,
    scale: row.Scale,
    category: { id: Number(row.CategoryId), slug: row.CategorySlug, name: row.CategoryName },
    price,
    oldPrice: oldPrice && oldPrice > price ? oldPrice : null,
    discountPercent: oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0,
    depositAmount: row.DepositAmount != null ? Number(row.DepositAmount) : null,
    stock: Number(row.Stock) || 0,
    status: row.Status,
    image: row.ImageUrl,
    gallery: [],
    description: row.Description || '',
    rating: row.AvgRating != null ? Number(row.AvgRating) : null,
    ratingCount: Number(row.RatingCount) || 0,
    soldCount: Number(row.SoldCount) || 0,
    isFeatured: !!row.IsFeatured,
    isNew: !!row.IsNew,
    isActive: row.IsActive === undefined ? true : !!row.IsActive,
    editionNote: row.EditionNote || null,
    preOrderDeadline: toDate(row.PreOrderDeadline),
    releaseDate: toDate(row.ReleaseDate),
    quotaPercent: row.QuotaPercent != null ? Number(row.QuotaPercent) : 0,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt || null
  };
  p.purchasable = p.isActive && p.status !== 'sold_out' && p.stock > 0;
  p.badges = computeBadges(p);
  p.badge = p.badges[0] || null;

  // Backward-compatibility aliases for existing frontend UI templates
  p.ProductId = p.id;
  p.Sku = p.sku;
  p.Name = p.name;
  p.Slug = p.slug;
  p.Brand = p.brand;
  p.Scale = p.scale;
  p.Price = p.price;
  p.OldPrice = p.oldPrice;
  p.Stock = p.stock;
  p.Status = p.status;
  p.ImageUrl = p.image;
  p.CategoryId = p.category.id;
  p.CategorySlug = p.category.slug;
  p.CategoryName = p.category.name;
  p.QuotaPercent = p.quotaPercent;
  p.DepositAmount = p.depositAmount;
  p.EditionNote = p.editionNote;
  p.PreOrderDeadline = p.preOrderDeadline;
  p.IsFeatured = p.isFeatured ? 1 : 0;
  p.IsNew = p.isNew ? 1 : 0;

  return p;
}

async function listPublic() {
  const r = await db.query(BASE_SELECT + ' WHERE p.IsActive = 1 ORDER BY p.ProductId ASC');
  return r.recordset.map(mapProduct);
}

async function findPublic(idOrSlug) {
  const isId = /^\d+$/.test(String(idOrSlug));
  const where = isId ? 'p.ProductId = @id' : '(p.Slug = @slug OR p.Sku = @slug)';
  const r = await db.query(
    BASE_SELECT + ` WHERE p.IsActive = 1 AND ${where}`,
    isId ? { id: Number(idOrSlug) } : { slug: String(idOrSlug) }
  );
  if (!r.recordset.length) return null;
  const product = mapProduct(r.recordset[0]);
  product.gallery = await getGallery(product.id);
  return product;
}

async function findById(id) {
  const r = await db.query(BASE_SELECT + ' WHERE p.ProductId = @id', { id: Number(id) });
  if (!r.recordset.length) return null;
  const product = mapProduct(r.recordset[0]);
  product.gallery = await getGallery(product.id);
  return product;
}

async function getGallery(productId) {
  const g = await db.query('SELECT ImageUrl FROM ProductImages WHERE ProductId = @id ORDER BY SortOrder ASC, ImageId ASC', { id: productId });
  return g.recordset.map((x) => x.ImageUrl);
}

async function listCategories() {
  const r = await db.query(`
    SELECT c.CategoryId, c.Slug, c.Name, c.Description, c.ImageUrl, c.SortOrder,
           (SELECT COUNT(*) FROM Products p WHERE p.CategoryId = c.CategoryId AND p.IsActive = 1) AS ProductCount
    FROM Categories c ORDER BY c.SortOrder ASC, c.CategoryId ASC`);
  return r.recordset.map((c) => ({
    id: Number(c.CategoryId), slug: c.Slug, name: c.Name, description: c.Description,
    image: c.ImageUrl, sortOrder: c.SortOrder, productCount: Number(c.ProductCount) || 0
  }));
}

module.exports = { BASE_SELECT, mapProduct, listPublic, findPublic, findById, getGallery, listCategories };
