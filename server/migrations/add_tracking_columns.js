const db = require('../config/db');

async function migrate() {
  try {
    console.log('[MIGRATION] Checking Orders table for TrackingCode and TrackingCarrier...');
    await db.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'TrackingCode')
      BEGIN
        ALTER TABLE Orders ADD TrackingCode NVARCHAR(100) NULL;
        PRINT 'Added TrackingCode column';
      END

      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'TrackingCarrier')
      BEGIN
        ALTER TABLE Orders ADD TrackingCarrier NVARCHAR(50) DEFAULT 'SPX';
        PRINT 'Added TrackingCarrier column';
      END
    `);
    console.log('[MIGRATION] Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[MIGRATION ERROR]:', err);
    process.exit(1);
  }
}

migrate();

