const { sql } = require('../config/database');

async function checkSchema() {
  try {
    console.log('Veritabanı şemasını kontrol ediyorum...');
    
    // Veritabanı tabloları listesi
    const tablesResult = await sql.query`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo'
    `;
    
    console.log('Mevcut tablolar:');
    console.log(tablesResult.recordset.map(t => t.TABLE_NAME));
    
    // Stores tablosu şeması
    const storesSchemaResult = await sql.query`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Stores' AND TABLE_SCHEMA = 'dbo'
    `;
    
    console.log('\nStores tablosu şeması:');
    console.log(storesSchemaResult.recordset);
    
    // Test verisi ekle
    console.log('\nTest mağazası ekleniyor...');
    await sql.query`
      IF NOT EXISTS (SELECT 1 FROM Stores WHERE storeName = 'Test Mağazası')
      BEGIN
        INSERT INTO Stores (storeName, sellerId, apiKey, apiSecret, isActive, createdAt, updatedAt)
        VALUES ('Test Mağazası', '123456', 'testApiKey', 'testApiSecret', 1, GETDATE(), GETDATE())
      END
    `;
    
    // Mağazaları listele
    const storesResult = await sql.query`SELECT * FROM Stores`;
    console.log('\nMağazalar:');
    console.log(storesResult.recordset);
    
    console.log('\nŞema kontrolü tamamlandı.');
    process.exit(0);
  } catch (error) {
    console.error('Şema kontrolü sırasında hata:', error);
    process.exit(1);
  }
}

checkSchema();