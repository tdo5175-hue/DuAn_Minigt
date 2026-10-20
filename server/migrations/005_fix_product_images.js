const db = require('../config/db');

async function migrate() {
    const fixes = [
        {
            sku: 'MGT01413',
            imageUrl: 'image/aston-amr24-stroll.png'
        },
        {
            sku: 'MGT01396',
            imageUrl: 'image/aston-amr24-alonso.png'
        },
        {
            sku: 'MGT01129',
            imageUrl: 'image/Minigt_Lambo_GT3.jpg'
        }
    ];

    for (const item of fixes) {
        await db.query(`
            UPDATE Products
            SET ImageUrl = @imageUrl,
                UpdatedAt = NOW()
            WHERE Sku = @sku
        `, item);
    }

    await db.query(`
        UPDATE Categories
        SET ImageUrl = 'image/lambo-sterrato-set.png'
        WHERE Slug = 'box-sets'
    `);

    console.log('Đã sửa đường dẫn ảnh sản phẩm.');
}

migrate()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });