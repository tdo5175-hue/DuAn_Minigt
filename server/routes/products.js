/**
 * PRODUCTS & CATEGORIES PUBLIC API ROUTES — ĐỒNG BỘ SUPABASE POSTGRESQL
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const productService = require('../services/productService');
const { authenticate } = require('../middleware/auth');
const { ok, notFound, badRequest, created } = require('../utils/http');
const v = require('../utils/validators');

// 1. LẤY DANH SÁCH TẤT CẢ SẢN PHẨM
router.get('/', async (req, res, next) => {
  try {
    const { category, brand, status, search, tag, sort, minPrice, maxPrice, inStockOnly } = req.query;

    let queryStr = productService.BASE_SELECT + ' WHERE p.IsActive = TRUE';
    const params = {};

    if (category && category !== 'all') {
      const catNum = Number(category);
      if (!Number.isNaN(catNum) && String(catNum) === String(category).trim()) {
        queryStr += ' AND (c.Slug = @category OR c.CategoryId = @catId)';
        params.category = String(category);
        params.catId = catNum;
      } else {
        queryStr += ' AND c.Slug = @category';
        params.category = String(category);
      }
    }

    if (brand && brand !== 'all') {
      queryStr += ' AND p.Brand = @brand';
      params.brand = brand;
    }

    if (status && status !== 'all') {
      queryStr += ' AND p.Status = @status';
      params.status = status;
    }

    if (inStockOnly === 'true' || inStockOnly === '1') {
      queryStr += ' AND p.Stock > 0 AND p.Status <> \'sold_out\'';
    }

    if (minPrice != null && minPrice !== '') {
      queryStr += ' AND p.Price >= @minPrice';
      params.minPrice = Number(minPrice);
    }

    if (maxPrice != null && maxPrice !== '') {
      queryStr += ' AND p.Price <= @maxPrice';
      params.maxPrice = Number(maxPrice);
    }

    if (search && search.trim()) {
      queryStr += ' AND (p.Name ILIKE @search OR p.Sku ILIKE @search OR p.Brand ILIKE @search OR c.Name ILIKE @search OR p.Description ILIKE @search)';
      params.search = v.likeParam(search.trim());
    }

    if (tag) {
      if (tag === 'pre_order') {
        queryStr += ' AND p.Status = \'pre_order\'';
      } else if (tag === 'in_stock') {
        queryStr += ' AND p.Status = \'in_stock\' AND p.Stock > 0';
      } else if (tag === 'f1') {
        queryStr += ' AND (c.Slug = \'f1-racing\' OR p.Name ILIKE \'%F1%\' OR p.Name ILIKE \'%AMR24%\' OR p.Name ILIKE \'%RB18%\')';
      } else if (tag === 'lbwk') {
        queryStr += ' AND (c.Slug = \'liberty-walk\' OR p.Name ILIKE \'%LB%\' OR p.Name ILIKE \'%Liberty%\')';
      } else if (tag === 'chase') {
        queryStr += ' AND (c.Slug = \'partner\' OR p.Name ILIKE \'%Secret%\' OR p.Sku ILIKE \'PR%\' OR p.Sku ILIKE \'TH%\' OR p.Name ILIKE \'%Chase%\')';
      } else if (tag === 'box_sets') {
        queryStr += ' AND (c.Slug = \'box-sets\' OR p.Name ILIKE \'%Set%\' OR p.Name ILIKE \'%Combo%\')';
      } else if (tag === 'ao_racing') {
        queryStr += ' AND (p.Name ILIKE \'%AO Racing%\' OR p.Name ILIKE \'%Rexy%\' OR p.Name ILIKE \'%Roxy%\' OR p.Name ILIKE \'%Skeleton%\')';
      }
    }

    switch (sort) {
      case 'price_asc':
        queryStr += ' ORDER BY p.Price ASC, p.ProductId ASC';
        break;
      case 'price_desc':
        queryStr += ' ORDER BY p.Price DESC, p.ProductId ASC';
        break;
      case 'name_asc':
        queryStr += ' ORDER BY p.Name ASC';
        break;
      case 'name_desc':
        queryStr += ' ORDER BY p.Name DESC';
        break;
      case 'best_selling':
        queryStr += ' ORDER BY SoldCount DESC, p.ProductId DESC';
        break;
      case 'newest':
        queryStr += ' ORDER BY p.IsNew DESC, p.CreatedAt DESC';
        break;
      default:
        queryStr += ' ORDER BY p.IsFeatured DESC, p.ProductId ASC';
        break;
    }

    const result = await db.query(queryStr, params);
    const products = result.recordset.map(productService.mapProduct);

    return ok(res, products, 'Lấy danh sách sản phẩm thành công', { count: products.length });
  } catch (error) {
    next(error);
  }
});

// 2. LẤY DANH MỤC SẢN PHẨM
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await productService.listCategories();
    return ok(res, categories, 'Lấy danh mục thành công');
  } catch (error) {
    next(error);
  }
});

// 3. CHI TIẾT SẢN PHẨM THEO ID HOẶC SLUG
router.get('/:idOrSlug', async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const product = await productService.findPublic(idOrSlug);

    if (!product) {
      throw notFound('Không tìm thấy sản phẩm yêu cầu');
    }

    const reviewsRes = await db.query(
      `SELECT r.ReviewId, r.Rating, r.Comment, r.CreatedAt, u.FullName, u.AvatarUrl
       FROM ProductReviews r
       JOIN Users u ON u.UserId = r.UserId
       WHERE r.ProductId = @id
       ORDER BY r.CreatedAt DESC`,
      { id: product.id }
    );

    product.reviews = reviewsRes.recordset.map(r => ({
      id: r.ReviewId,
      rating: r.Rating,
      comment: r.Comment,
      createdAt: r.CreatedAt,
      user: {
        fullName: r.FullName,
        avatarUrl: r.AvatarUrl
      }
    }));

    return ok(res, product, 'Chi tiết sản phẩm');
  } catch (error) {
    next(error);
  }
});

// 4. GỬI ĐÁNH GIÁ SẢN PHẨM
router.post('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const productId = v.int(req.params.id, { min: 1 });
    const rating = v.int(req.body.rating, { min: 1, max: 5 });
    const comment = v.str(req.body.comment, 1000);

    if (!productId) throw badRequest('Mã sản phẩm không hợp lệ');
    if (!rating) throw badRequest('Vui lòng chọn số sao đánh giá (1 đến 5 sao)');

    const prodCheck = await db.query('SELECT ProductId FROM Products WHERE ProductId = @id AND IsActive = TRUE', { id: productId });
    if (prodCheck.recordset.length === 0) throw notFound('Sản phẩm không tồn tại');

    await db.query(
      `INSERT INTO ProductReviews (ProductId, UserId, Rating, Comment, CreatedAt)
       VALUES (@productId, @userId, @rating, @comment, NOW())
       ON CONFLICT (ProductId, UserId)
       DO UPDATE SET Rating = EXCLUDED.Rating, Comment = EXCLUDED.Comment, CreatedAt = NOW();`,
      {
        productId,
        userId: req.user.userId,
        rating,
        comment: comment || null
      }
    );

    return created(res, { productId, rating, comment }, 'Cảm ơn bạn đã gửi đánh giá cho sản phẩm!');
  } catch (error) {
    next(error);
  }
});

module.exports = router;