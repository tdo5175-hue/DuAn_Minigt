/**
 * PRODUCTS & CATEGORIES API ROUTES
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. LẤY DANH SÁCH TẤT CẢ SẢN PHẨM (KÈM BỘ LỌC)
router.get('/', async (req, res) => {
  try {
    const { category, status, is_featured, is_new, search, tag } = req.query;

    let queryStr = 'SELECT * FROM vw_ProductList WHERE 1=1';
    const params = {};

    if (category) {
      queryStr += ' AND (CategorySlug = @category OR CategoryId = TRY_CAST(@category AS INT))';
      params.category = category;
    }

    if (status) {
      queryStr += ' AND Status = @status';
      params.status = status;
    }

    if (is_featured === 'true' || is_featured === '1') {
      queryStr += ' AND IsFeatured = 1';
    }

    if (is_new === 'true' || is_new === '1') {
      queryStr += ' AND IsNew = 1';
    }

    if (search) {
      queryStr += ' AND (Name LIKE @search OR Sku LIKE @search OR Brand LIKE @search OR Description LIKE @search)';
      params.search = `%${search}%`;
    }

    // Xử lý các tag nhanh như ở giao diện
    if (tag) {
      if (tag === 'pre_order') {
        queryStr += ' AND Status = \'pre_order\'';
      } else if (tag === 'in_stock') {
        queryStr += ' AND Status = \'in_stock\'';
      } else if (tag === 'f1') {
        queryStr += ' AND (CategorySlug = \'f1-racing\' OR Name LIKE \'%F1%\' OR Name LIKE \'%AMR24%\')';
      } else if (tag === 'lbwk') {
        queryStr += ' AND (CategorySlug = \'liberty-walk\' OR Name LIKE \'%LB%\' OR Name LIKE \'%Liberty%\')';
      } else if (tag === 'chase') {
        queryStr += ' AND (CategorySlug = \'partner\' OR Name LIKE \'%Secret%\' OR Name LIKE \'%Top Secret%\')';
      } else if (tag === 'ao_racing') {
        queryStr += ' AND (Name LIKE \'%AO Racing%\' OR Name LIKE \'%Rexy%\' OR Name LIKE \'%Roxy%\' OR Name LIKE \'%Skeleton%\')';
      }
    }

    queryStr += ' ORDER BY ProductId ASC';

    const result = await db.query(queryStr, params);
    return res.json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (error) {
    console.error('[PRODUCTS GET ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. LẤY DANH MỤC SẢN PHẨM (KÈM SỐ LƯỢNG MÔ HÌNH)
router.get('/categories', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, COUNT(p.ProductId) AS ProductCount
      FROM Categories c
      LEFT JOIN Products p ON p.CategoryId = c.CategoryId
      GROUP BY c.CategoryId, c.Slug, c.Name, c.Description, c.ImageUrl, c.SortOrder
      ORDER BY c.SortOrder ASC
    `);
    return res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('[CATEGORIES GET ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. CHI TIẾT SẢN PHẨM THEO ID HOẶC SLUG
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isId = !isNaN(Number(idOrSlug));

    let queryStr = 'SELECT * FROM vw_ProductList WHERE ';
    const params = {};

    if (isId) {
      queryStr += 'ProductId = @id';
      params.id = Number(idOrSlug);
    } else {
      queryStr += 'Slug = @slug OR Sku = @slug';
      params.slug = idOrSlug;
    }

    const result = await db.query(queryStr, params);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const product = result.recordset[0];

    // Lấy thêm danh sách ảnh phụ
    const imagesRes = await db.query(
      'SELECT ImageUrl FROM ProductImages WHERE ProductId = @id ORDER BY SortOrder ASC',
      { id: product.ProductId }
    );

    product.gallery = imagesRes.recordset.map(i => i.ImageUrl);

    return res.json({ success: true, data: product });
  } catch (error) {
    console.error('[PRODUCT DETAIL ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
