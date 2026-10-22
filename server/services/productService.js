/**
 * PRODUCT SERVICE — LỚP NGHIỆP VỤ SẢN PHẨM & DANH MỤC (CHUẨN SUPABASE POSTGRESQL 2026)
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

  const pId = row.ProductId ?? row.productid;
  const sku = row.Sku ?? row.sku ?? '';
  const name = row.Name ?? row.name ?? '';
  const slug = row.Slug ?? row.slug ?? '';
  const brand = row.Brand ?? row.brand ?? 'MINI GT';
  const scale = row.Scale ?? row.scale ?? '1:64';
  const packagingType = row.PackagingType ?? row.packagingtype ?? 'both';

  const rawPrice = Number(row.Price ?? row.price ?? 0);
  const rawOldPrice = (row.OldPrice != null || row.oldprice != null)
    ? Number(row.OldPrice ?? row.oldprice)
    : null;
  const discountPercent = Math.min(80, Math.max(0, Number(row.DiscountPercent ?? row.discountpercent ?? 0)));

  const rawPriceBox = Number(row.PriceBox ?? row.pricebox ?? 0);
  const rawPriceCard = Number(row.PriceCard ?? row.pricecard ?? 0);

  const priceBox = rawPriceBox > 0
    ? rawPriceBox
    : (rawOldPrice && rawOldPrice > rawPrice ? rawOldPrice : rawPrice);
  const priceCard = rawPriceCard > 0
    ? rawPriceCard
    : (packagingType === 'box_only' ? priceBox : priceBox + 60000);

  const finalPriceBox = discountPercent > 0 ? calcDiscountedPrice(priceBox, discountPercent) : (rawPrice || priceBox);
  const finalPriceCard = discountPercent > 0 ? calcDiscountedPrice(priceCard, discountPercent) : priceCard;

  const effectivePrice = packagingType === 'card_only' ? finalPriceCard : finalPriceBox;
  const effectiveOldPrice = discountPercent > 0
    ? (packagingType === 'card_only' ? priceCard : priceBox)
    : rawOldPrice;

  const rawDeadline = row.PreOrderDeadline ?? row.preorderdeadline;
  const preOrderDeadline = rawDeadline
    ? (rawDeadline instanceof Date
        ? rawDeadline.toISOString().split('T')[0]
        : String(rawDeadline).split('T')[0])
    : null;

  const carNumber = row.CarNumber ?? row.carnumber ?? (String(sku).replace(/^(MGTS00|MGT0|MGT|PR640|TH6400)/i, '') || '64');

  const rawStock = Number(row.Stock ?? row.stock ?? 0);
  const rawStockBox = row.StockBox ?? row.stockbox;
  const rawStockCard = row.StockCard ?? row.stockcard;

  let stockBox = rawStockBox != null ? Math.max(0, Number(rawStockBox)) : (packagingType === 'card_only' ? 0 : Math.ceil(rawStock / 2));
  let stockCard = rawStockCard != null ? Math.max(0, Number(rawStockCard)) : (packagingType === 'box_only' ? 0 : Math.floor(rawStock / 2));
  if (packagingType === 'box_only') stockCard = 0;
  if (packagingType === 'card_only') stockBox = 0;
  const effectiveStock = (packagingType === 'box_only') ? stockBox : (packagingType === 'card_only' ? stockCard : (stockBox + stockCard));

  const hasBox = packagingType !== 'card_only' && stockBox > 0;
  const hasCard = packagingType !== 'box_only' && stockCard > 0;

  const rawDepositAmount = row.DepositAmount ?? row.depositamount;
  const depositAmount = rawDepositAmount != null ? Number(rawDepositAmount) : null;

  const rawDepositPercent = row.DepositPercent ?? row.depositpercent;
  const depositPercent = rawDepositPercent != null
    ? Number(rawDepositPercent)
    : (depositAmount && effectivePrice ? Math.round((depositAmount / effectivePrice) * 100) : 30);

  const rawReleaseDate = row.ReleaseDate ?? row.releasedate;
  const releaseDate = rawReleaseDate ? String(rawReleaseDate).slice(0, 10) : null;
  const status = row.Status ?? row.status ?? 'in_stock';
  const expectedDelivery = row.ExpectedDelivery ?? row.expecteddelivery ?? (
    rawReleaseDate
      ? `Tháng ${new Date(rawReleaseDate).getMonth() + 1}/${new Date(rawReleaseDate).getFullYear()}`
      : (status === 'pre_order' ? 'Tháng 11/2026' : null)
  );

  const editionNote = row.EditionNote ?? row.editionnote ?? '';
  const imageUrl = row.ImageUrl ?? row.imageurl ?? '';
  const description = row.Description ?? row.description ?? '';

  const isFeatured = Boolean(row.IsFeatured ?? row.isfeatured ?? false);
  const isNew = Boolean(row.IsNew ?? row.isnew ?? false);
  const rawActive = row.IsActive ?? row.isactive;
  const isActive = rawActive === undefined ? true : Boolean(rawActive);

  const categoryId = row.CategoryId ?? row.categoryid;
  const categoryName = row.CategoryName ?? row.categoryname ?? '';
  const categorySlug = row.CategorySlug ?? row.categoryslug ?? '';
  const createdAt = row.CreatedAt ?? row.createdat;
  const updatedAt = row.UpdatedAt ?? row.updatedat;

  return {
    id: pId,
    sku,
    carNumber,
    name,
    slug,
    brand,
    scale,
    packagingType,
    priceBox,
    priceCard,
    discountPercent,
    finalPriceBox,
    finalPriceCard,
    price: effectivePrice,
    oldPrice: effectiveOldPrice,
    depositAmount,
    depositPercent,
    expectedDelivery,
    releaseDate,
    editionNote,
    preOrderDeadline,
    stockBox,
    stockbox: stockBox,
    stockCard,
    stockcard: stockCard,
    hasBox,
    hasCard,
    stock: effectiveStock,
    image: imageUrl,
    imageUrl,
    description,
    status,
    isFeatured,
    isNew,
    isActive,
    categoryId,
    categoryName,
    categorySlug,
    category: {
      id: categoryId,
      name: categoryName,
      slug: categorySlug
    },
    createdAt,
    updatedAt,

    // Tương thích ngược PascalCase cho giao diện hiện tại
    ProductId: pId,
    Sku: sku,
    CarNumber: carNumber,
    Name: name,
    Slug: slug,
    Brand: brand,
    Scale: scale,
    PackagingType: packagingType,
    PriceBox: priceBox,
    PriceCard: priceCard,
    DiscountPercent: discountPercent,
    FinalPriceBox: finalPriceBox,
    FinalPriceCard: finalPriceCard,
    Price: effectivePrice,
    OldPrice: effectiveOldPrice,
    DepositAmount: depositAmount,
    DepositPercent: depositPercent,
    ExpectedDelivery: expectedDelivery,
    ReleaseDate: releaseDate,
    EditionNote: editionNote,
    PreOrderDeadline: preOrderDeadline,
    StockBox: stockBox,
    StockCard: stockCard,
    HasBox: hasBox,
    HasCard: hasCard,
    Stock: effectiveStock,
    ImageUrl: imageUrl,
    Description: description,
    Status: status,
    IsFeatured: isFeatured,
    IsNew: isNew,
    IsActive: isActive,
    CategoryId: categoryId,
    CategoryName: categoryName,
    CategorySlug: categorySlug,
    CreatedAt: createdAt,
    UpdatedAt: updatedAt
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
  FROM Products p
  INNER JOIN Categories c ON p.CategoryId = c.CategoryId
`;

/**
 * Truy vấn danh sách sản phẩm có lọc, tìm kiếm, sắp xếp, phân trang.
 */
async function listProducts(filters = {}, { includeInactive = false } = {}) {
  const where = [];
  const params = {};

  if (!includeInactive) {
    where.push('p.IsActive = TRUE');
  } else if (filters.active === '1' || filters.active === '0' || filters.active === 'true' || filters.active === 'false') {
    where.push('p.IsActive = @isActive');
    params.isActive = (filters.active === '1' || filters.active === 'true');
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
    where.push('p.IsFeatured = TRUE');
  }
  if (filters.isNew === '1' || filters.isNew === 'true') {
    where.push('p.IsNew = TRUE');
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
    where.push('(p.Name ILIKE @q OR p.Sku ILIKE @q OR p.CarNumber ILIKE @q OR p.Brand ILIKE @q OR c.Name ILIKE @q OR p.EditionNote ILIKE @q)');
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
    const items = (res.recordset || []).map(mapProduct);
    return { items, total: items.length, page: 1, pageSize: items.length || 1, totalPages: 1 };
  }

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(filters.pageSize, 10) || 12));
  params.offset = (page - 1) * pageSize;
  params.pageSize = pageSize;

  const countSql = `SELECT COUNT(*) AS Total FROM Products p INNER JOIN Categories c ON p.CategoryId = c.CategoryId ${whereClause}`;
  const dataSql = `${SELECT_PRODUCT} ${whereClause} ORDER BY ${orderBy} LIMIT @pageSize OFFSET @offset`;

  const [countRes, dataRes] = await Promise.all([
    db.query(countSql, params),
    db.query(dataSql, params)
  ]);

  const total = Number(countRes.recordset[0]?.Total ?? countRes.recordset[0]?.total ?? 0);
  return {
    items: (dataRes.recordset || []).map(mapProduct),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

/**
 * Lấy chi tiết sản phẩm theo ID, Slug hoặc SKU (kèm ảnh phụ, đánh giá và sản phẩm liên quan)
 */
async function getProductByIdOrSlug(idOrSlug, { includeInactive = false } = {}) {
  const isNum = /^\d+$/.test(String(idOrSlug));
  const cond = isNum ? 'p.ProductId = @val' : '(p.Slug = @val OR p.Sku = @val)';
  const activeCond = includeInactive ? '' : 'AND p.IsActive = TRUE';

  const res = await db.query(
    `${SELECT_PRODUCT} WHERE ${cond} ${activeCond}`,
    { val: isNum ? parseInt(idOrSlug, 10) : String(idOrSlug) }
  );
  if (!res.recordset || !res.recordset.length) return null;
  const product = mapProduct(res.recordset[0]);

  const [imgRes, revRes, relRes] = await Promise.all([
    db.query('SELECT ImageUrl, SortOrder FROM ProductImages WHERE ProductId = @pid ORDER BY SortOrder ASC', { pid: product.id }),
    db.query(`
      SELECT r.ReviewId, r.Rating, r.Comment, r.CreatedAt, u.FullName, u.AvatarUrl
      FROM ProductReviews r
      INNER JOIN Users u ON r.UserId = u.UserId
      WHERE r.ProductId = @pid
      ORDER BY r.CreatedAt DESC
    `, { pid: product.id }),
    db.query(`
      SELECT
        p.ProductId, p.Sku, p.CarNumber, p.Name, p.Slug, p.Brand, p.Scale,
        p.PackagingType, p.PriceBox, p.PriceCard, p.DiscountPercent,
        p.Price, p.OldPrice, p.DepositAmount, p.DepositPercent, p.EditionNote,
        p.PreOrderDeadline, p.StockBox, p.StockCard, p.Stock, p.ImageUrl, p.Description, p.Status,
        p.ReleaseDate, p.ExpectedDelivery,
        p.IsFeatured, p.IsNew, p.IsActive, p.CreatedAt,
        c.CategoryId, c.Name AS CategoryName, c.Slug AS CategorySlug
      FROM Products p
      INNER JOIN Categories c ON p.CategoryId = c.CategoryId
      WHERE p.CategoryId = @cid AND p.ProductId <> @pid AND p.IsActive = TRUE
      ORDER BY p.IsFeatured DESC, p.ProductId ASC
      LIMIT 4
    `, { cid: product.categoryId, pid: product.id })
  ]);

  product.images = (imgRes.recordset || []).map(i => i.ImageUrl ?? i.imageurl);
  product.reviews = revRes.recordset || [];
  product.ratingAvg = product.reviews.length
    ? Number((product.reviews.reduce((s, r) => s + Number(r.Rating ?? r.rating ?? 0), 0) / product.reviews.length).toFixed(1))
    : 0;
  product.reviewCount = product.reviews.length;
  product.related = (relRes.recordset || []).map(mapProduct);
  return product;
}

/**
 * Alias cho public route (/api/products/:idOrSlug)
 */
async function findPublic(idOrSlug) {
  return getProductByIdOrSlug(idOrSlug, { includeInactive: false });
}

async function listCategories() {
  const res = await db.query(`
    SELECT c.CategoryId, c.Slug, c.Name, c.Description, c.ImageUrl, c.SortOrder,
           COUNT(p.ProductId) AS ProductCount
    FROM Categories c
    LEFT JOIN Products p ON p.CategoryId = c.CategoryId AND p.IsActive = TRUE
    GROUP BY c.CategoryId, c.Slug, c.Name, c.Description, c.ImageUrl, c.SortOrder
    ORDER BY c.SortOrder ASC
  `);
  return (res.recordset || []).map(c => ({
    CategoryId: c.CategoryId ?? c.categoryid,
    Slug: c.Slug ?? c.slug,
    Name: c.Name ?? c.name,
    Description: c.Description ?? c.description,
    ImageUrl: c.ImageUrl ?? c.imageurl,
    SortOrder: Number(c.SortOrder ?? c.sortorder ?? 0),
    ProductCount: Number(c.ProductCount ?? c.productcount ?? 0),
    id: c.CategoryId ?? c.categoryid,
    slug: c.Slug ?? c.slug,
    name: c.Name ?? c.name,
    description: c.Description ?? c.description,
    imageUrl: c.ImageUrl ?? c.imageurl,
    sortOrder: Number(c.SortOrder ?? c.sortorder ?? 0),
    productCount: Number(c.ProductCount ?? c.productcount ?? 0)
  }));
}

async function addCategory({ name, slug, description = '', imageUrl = '', sortOrder = 10 }) {
  if (!name || !name.trim()) throw new Error('Tên danh mục không được để trống');
  const cleanName = name.trim();
  const cleanSlug = (slug && slug.trim())
    ? slug.trim().toLowerCase()
    : cleanName.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const res = await db.query(`
    INSERT INTO Categories (Slug, Name, Description, ImageUrl, SortOrder)
    VALUES (@slug, @name, @description, @imageUrl, @sortOrder)
    ON CONFLICT (Slug) DO UPDATE SET Name = EXCLUDED.Name, Description = EXCLUDED.Description
    RETURNING *
  `, {
    slug: cleanSlug || ('cat-' + Date.now()),
    name: cleanName,
    description: description || '',
    imageUrl: imageUrl || '',
    sortOrder: Number(sortOrder) || 10
  });

  const row = (res.recordset && res.recordset[0]) || {};
  return {
    id: row.CategoryId ?? row.categoryid,
    CategoryId: row.CategoryId ?? row.categoryid,
    slug: row.Slug ?? row.slug,
    Slug: row.Slug ?? row.slug,
    name: row.Name ?? row.name,
    Name: row.Name ?? row.name,
    description: row.Description ?? row.description,
    imageUrl: row.ImageUrl ?? row.imageurl,
    sortOrder: Number(row.SortOrder ?? row.sortorder ?? 10)
  };
}

module.exports = {
  BASE_SELECT: SELECT_PRODUCT,
  SELECT_PRODUCT,
  mapProduct,
  calcDiscountedPrice,
  listProducts,
  getProductByIdOrSlug,
  findPublic,
  listCategories,
  addCategory
};