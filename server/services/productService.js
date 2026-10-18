/**
 * PRODUCT SERVICE — LỚP NGHIỆP VỤ SẢN PHẨM & DANH MỤC (CHUẨN BOX & BLISTER CARD 2026)
 */
const db = require('../config/db');

function calcDiscountedPrice(basePrice, discountPercent) {
  const base = Math.max(0, Number(basePrice || 0));
  const disc = Math.min(80, Math.max(0, Number(discountPercent || 0)));
  if (disc <= 0) return base;
  return Math.round(((base * (100 - disc)) / 100) / 1000) * 1000;
}

function mapProduct(row) {
  if (!row) return null;

  const packagingType = row.PackagingType || 'both';
  const rawPrice = Number(row.Price || 0);
  const rawOldPrice = row.OldPrice != null ? Number(row.OldPrice) : null;
  const discountPercent = Math.min(80, Math.max(0, Number(row.DiscountPercent || 0)));

  const priceBox = Number(row.PriceBox || 0) > 0
    ? Number(row.PriceBox)
    : (rawOldPrice && rawOldPrice > rawPrice ? rawOldPrice : rawPrice);
  const priceCard = Number(row.PriceCard || 0) > 0
    ? Number(row.PriceCard)
    : (packagingType === 'box_only' ? priceBox : priceBox + 60000);

  const finalPriceBox = discountPercent > 0 ? calcDiscountedPrice(priceBox, discountPercent) : rawPrice || priceBox;
  const finalPriceCard = discountPercent > 0 ? calcDiscountedPrice(priceCard, discountPercent) : priceCard;

  const effectivePrice = packagingType === 'card_only' ? finalPriceCard : finalPriceBox;
  const effectiveOldPrice = discountPercent > 0
    ? (packagingType === 'card_only' ? priceCard : priceBox)
    : rawOldPrice;

  const preOrderDeadline = row.PreOrderDeadline
    ? (row.PreOrderDeadline instanceof Date
        ? row.PreOrderDeadline.toISOString().split('T')[0]
        : String(row.PreOrderDeadline).split('T')[0])
    : null;

  const carNumber = row.CarNumber || String(row.Sku || '').replace(/^(MGTS00|MGT0|MGT|PR640|TH6400)/i, '') || '64';

  const rawStock = Number(row.Stock || 0);
  let stockBox = row.StockBox != null ? Number(row.StockBox) : (packagingType === 'card_only' ? 0 : Math.ceil(rawStock * 0.6));
  let stockCard = row.StockCard != null ? Number(row.StockCard) : (packagingType === 'box_only' ? 0 : Math.floor(rawStock * 0.4));
  if (packagingType === 'box_only') stockCard = 0;
  if (packagingType === 'card_only') stockBox = 0;
  const effectiveStock = stockBox + stockCard || rawStock;

  const hasBox = packagingType !== 'card_only' && stockBox > 0;
  const hasCard = packagingType !== 'box_only' && stockCard > 0;

  return {
    id: row.ProductId,
    sku: row.Sku,
    carNumber,
    name: row.Name,
    slug: row.Slug,
    brand: row.Brand,
    scale: row.Scale,
    packagingType,
    priceBox,
    priceCard,
    discountPercent,
    finalPriceBox,
    finalPriceCard,
    price: effectivePrice,
    oldPrice: effectiveOldPrice,
    depositAmount: row.DepositAmount != null ? Number(row.DepositAmount) : null,
    depositPercent: row.DepositPercent != null ? Number(row.DepositPercent) : (row.DepositAmount && effectivePrice ? Math.round((Number(row.DepositAmount) / effectivePrice) * 100) : 30),
    expectedDelivery: row.ExpectedDelivery || (row.ReleaseDate ? `Tháng ${new Date(row.ReleaseDate).getMonth() + 1}/${new Date(row.ReleaseDate).getFullYear()}` : (row.Status === 'pre_order' ? 'Tháng 11/2026' : null)),
    releaseDate: row.ReleaseDate ? String(row.ReleaseDate).slice(0, 10) : null,
    editionNote: row.EditionNote || '',
    preOrderDeadline,
    stockBox,
    stockCard,
    hasBox,
    hasCard,
    stock: effectiveStock,
    image: row.ImageUrl,
    imageUrl: row.ImageUrl,
    description: row.Description,
    status: row.Status,
    isFeatured: Boolean(row.IsFeatured),
    isNew: Boolean(row.IsNew),
    isActive: row.IsActive === undefined ? true : Boolean(row.IsActive),
    categoryId: row.CategoryId,
    categoryName: row.CategoryName,
    categorySlug: row.CategorySlug,
    category: {
      id: row.CategoryId,
      name: row.CategoryName,
      slug: row.CategorySlug
    },
    createdAt: row.CreatedAt,

    // Tương thích ngược PascalCase cho giao diện hiện tại
    ProductId: row.ProductId,
    Sku: row.Sku,
    CarNumber: carNumber,
    Name: row.Name,
    Slug: row.Slug,
    Brand: row.Brand,
    Scale: row.Scale,
    PackagingType: packagingType,
    PriceBox: priceBox,
    PriceCard: priceCard,
    DiscountPercent: discountPercent,
    FinalPriceBox: finalPriceBox,
    FinalPriceCard: finalPriceCard,
    Price: effectivePrice,
    OldPrice: effectiveOldPrice,
    DepositAmount: row.DepositAmount != null ? Number(row.DepositAmount) : null,
    DepositPercent: row.DepositPercent != null ? Number(row.DepositPercent) : (row.DepositAmount && effectivePrice ? Math.round((Number(row.DepositAmount) / effectivePrice) * 100) : 30),
    ExpectedDelivery: row.ExpectedDelivery || (row.ReleaseDate ? `Tháng ${new Date(row.ReleaseDate).getMonth() + 1}/${new Date(row.ReleaseDate).getFullYear()}` : (row.Status === 'pre_order' ? 'Tháng 11/2026' : null)),
    ReleaseDate: row.ReleaseDate ? String(row.ReleaseDate).slice(0, 10) : null,
    EditionNote: row.EditionNote || '',
    PreOrderDeadline: preOrderDeadline,
    StockBox: stockBox,
    StockCard: stockCard,
    HasBox: hasBox,
    HasCard: hasCard,
    Stock: effectiveStock,
    ImageUrl: row.ImageUrl,
    Description: row.Description,
    Status: row.Status,
    IsFeatured: Boolean(row.IsFeatured),
    IsNew: Boolean(row.IsNew),
    IsActive: row.IsActive === undefined ? true : Boolean(row.IsActive),
    CategoryId: row.CategoryId,
    CategoryName: row.CategoryName,
    CategorySlug: row.CategorySlug,
    CreatedAt: row.CreatedAt
  };
}

const SELECT_PRODUCT = `
  SELECT
    p.ProductId, p.Sku, p.CarNumber, p.Name, p.Slug, p.Brand, p.Scale,
    p.PackagingType, p.PriceBox, p.PriceCard, p.DiscountPercent,
    p.Price, p.OldPrice, p.DepositAmount, p.DepositPercent, p.EditionNote,
    p.PreOrderDeadline, p.StockBox, p.StockCard, p.Stock, p.ImageUrl, p.Description, p.Status,
    p.ReleaseDate, p.ExpectedDelivery,
    p.IsFeatured, p.IsNew, p.IsActive, p.CreatedAt, p.UpdatedAt,
    c.CategoryId, c.Name AS CategoryName, c.Slug AS CategorySlug
  FROM dbo.Products p
  INNER JOIN dbo.Categories c ON p.CategoryId = c.CategoryId
`;

/**
 * Truy vấn danh sách sản phẩm có lọc, tìm kiếm, sắp xếp, phân trang.
 */
async function listProducts(filters = {}, { includeInactive = false } = {}) {
  const where = [];
  const params = {};

  if (!includeInactive) {
    where.push('p.IsActive = 1');
  } else if (filters.active === '1' || filters.active === '0') {
    where.push('p.IsActive = @isActive');
    params.isActive = filters.active === '1' ? 1 : 0;
  }

  if (filters.category && filters.category !== 'all') {
    if (/^\d+$/.test(String(filters.category))) {
      where.push('p.CategoryId = @catId');
      params.catId = parseInt(filters.category, 10);
    } else {
      where.push('c.Slug = @catSlug');
      params.catSlug = String(filters.category);
    }
  }
  if (filters.brand && filters.brand !== 'all') {
    where.push('p.Brand = @brand');
    params.brand = String(filters.brand);
  }
  if (filters.status && filters.status !== 'all') {
    where.push('p.Status = @status');
    params.status = String(filters.status);
  }
  if (filters.featured === '1' || filters.featured === 'true') {
    where.push('p.IsFeatured = 1');
  }
  if (filters.isNew === '1' || filters.isNew === 'true') {
    where.push('p.IsNew = 1');
  }
  if (filters.minPrice !== undefined && filters.minPrice !== '' && !isNaN(filters.minPrice)) {
    where.push('p.Price >= @minPrice');
    params.minPrice = Number(filters.minPrice);
  }
  if (filters.maxPrice !== undefined && filters.maxPrice !== '' && !isNaN(filters.maxPrice)) {
    where.push('p.Price <= @maxPrice');
    params.maxPrice = Number(filters.maxPrice);
  }
  if (filters.q && String(filters.q).trim()) {
    where.push('(p.Name LIKE @q OR p.Sku LIKE @q OR p.Brand LIKE @q OR p.EditionNote LIKE @q)');
    params.q = `%${String(filters.q).trim()}%`;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sortMap = {
    price_asc: 'p.Price ASC, p.ProductId ASC',
    price_desc: 'p.Price DESC, p.ProductId ASC',
    newest: 'p.IsNew DESC, p.ProductId ASC',
    featured: 'p.IsFeatured DESC, p.ProductId ASC',
    name_asc: 'p.Name ASC',
    stock_asc: 'p.Stock ASC'
  };
  const orderBy = sortMap[filters.sort] || 'p.ProductId ASC';

  const hasPaging = filters.page !== undefined || filters.pageSize !== undefined;
  if (!hasPaging) {
    const res = await db.query(`${SELECT_PRODUCT} ${whereClause} ORDER BY ${orderBy}`, params);
    const items = res.recordset.map(mapProduct);
    return { items, total: items.length, page: 1, pageSize: items.length || 1, totalPages: 1 };
  }

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(filters.pageSize, 10) || 12));
  params.offset = (page - 1) * pageSize;
  params.pageSize = pageSize;

  const countSql = `SELECT COUNT(*) AS Total FROM dbo.Products p INNER JOIN dbo.Categories c ON p.CategoryId = c.CategoryId ${whereClause}`;
  const dataSql = `${SELECT_PRODUCT} ${whereClause} ORDER BY ${orderBy} OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`;

  const [countRes, dataRes] = await Promise.all([
    db.query(countSql, params),
    db.query(dataSql, params)
  ]);

  const total = countRes.recordset[0]?.Total || 0;
  return {
    items: dataRes.recordset.map(mapProduct),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

async function getProductByIdOrSlug(idOrSlug, { includeInactive = false } = {}) {
  const isNum = /^\d+$/.test(String(idOrSlug));
  const cond = isNum ? 'p.ProductId = @val' : '(p.Slug = @val OR p.Sku = @val)';
  const activeCond = includeInactive ? '' : 'AND p.IsActive = 1';
  const res = await db.query(
    `${SELECT_PRODUCT} WHERE ${cond} ${activeCond}`,
    { val: isNum ? parseInt(idOrSlug, 10) : String(idOrSlug) }
  );
  if (!res.recordset.length) return null;
  const product = mapProduct(res.recordset[0]);

  const [imgRes, revRes, relRes] = await Promise.all([
    db.query('SELECT ImageUrl, SortOrder FROM dbo.ProductImages WHERE ProductId = @pid ORDER BY SortOrder ASC', { pid: product.id }),
    db.query(`
      SELECT r.ReviewId, r.Rating, r.Comment, r.CreatedAt, u.FullName, u.AvatarUrl
      FROM dbo.ProductReviews r
      INNER JOIN dbo.Users u ON r.UserId = u.UserId
      WHERE r.ProductId = @pid
      ORDER BY r.CreatedAt DESC
    `, { pid: product.id }),
    db.query(`
      SELECT TOP 4
        p.ProductId, p.Sku, p.CarNumber, p.Name, p.Slug, p.Brand, p.Scale,
        p.PackagingType, p.PriceBox, p.PriceCard, p.DiscountPercent,
        p.Price, p.OldPrice, p.DepositAmount, p.DepositPercent, p.EditionNote,
        p.PreOrderDeadline, p.StockBox, p.StockCard, p.Stock, p.ImageUrl, p.Description, p.Status,
        p.ReleaseDate, p.ExpectedDelivery,
        p.IsFeatured, p.IsNew, p.IsActive, p.CreatedAt,
        c.CategoryId, c.Name AS CategoryName, c.Slug AS CategorySlug
      FROM dbo.Products p
      INNER JOIN dbo.Categories c ON p.CategoryId = c.CategoryId
      WHERE p.CategoryId = @cid AND p.ProductId <> @pid AND p.IsActive = 1
      ORDER BY p.IsFeatured DESC, p.ProductId ASC
    `, { cid: product.categoryId, pid: product.id })
  ]);

  product.images = imgRes.recordset.map(i => i.ImageUrl);
  product.reviews = revRes.recordset;
  product.ratingAvg = revRes.recordset.length
    ? Number((revRes.recordset.reduce((s, r) => s + Number(r.Rating), 0) / revRes.recordset.length).toFixed(1))
    : 0;
  product.reviewCount = revRes.recordset.length;
  product.related = relRes.recordset.map(mapProduct);
  return product;
}

async function listCategories() {
  const res = await db.query(`
    SELECT c.CategoryId, c.Slug, c.Name, c.Description, c.ImageUrl, c.SortOrder,
           COUNT(p.ProductId) AS ProductCount
    FROM dbo.Categories c
    LEFT JOIN dbo.Products p ON p.CategoryId = c.CategoryId AND p.IsActive = 1
    GROUP BY c.CategoryId, c.Slug, c.Name, c.Description, c.ImageUrl, c.SortOrder
    ORDER BY c.SortOrder ASC
  `);
  return res.recordset;
}

module.exports = {
  BASE_SELECT: SELECT_PRODUCT,
  SELECT_PRODUCT,
  mapProduct,
  calcDiscountedPrice,
  listProducts,
  getProductByIdOrSlug,
  listCategories
};
