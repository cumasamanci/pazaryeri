const sql = require('mssql');
const config = require('../config/db');

// SQL bağlantı havuzunu içe aktarın
let pool;

// Bağlantı havuzunu başlat
async function initializePool() {
  try {
    if (!pool) {
      pool = await new sql.ConnectionPool(config).connect();
      console.log("SQL Server bağlantı havuzu hazır");
    }
    return pool;
  } catch (err) {
    console.error("Bağlantı havuzu başlatılamadı:", err.message);
    throw err;
  }
}

// Veritabanı tablosunu kontrol et veya oluştur
async function setupDatabase() {
  try {
    // Önce havuzu başlat
    pool = await initializePool();
    console.log("✅ Veritabanı bağlantısı başarılı");
    
    // FetchLogs tablosunun varlığını kontrol et
    const tableResult = await pool.request().query(`
      SELECT OBJECT_ID('dbo.FetchLogs') as TableExists
    `);
    
    // Tablo yoksa oluştur
    if (!tableResult.recordset[0].TableExists) {
      console.log("FetchLogs tablosu bulunamadı, oluşturuluyor...");
      
      await pool.request().query(`
        CREATE TABLE [dbo].[FetchLogs] (
          [id] INT IDENTITY(1,1) PRIMARY KEY,
          [batchId] NVARCHAR(100) NOT NULL,
          [storeId] INT NOT NULL,
          [sellerId] NVARCHAR(50) NOT NULL,
          [apiType] NVARCHAR(50) NOT NULL,
          [transactionType] NVARCHAR(500) NOT NULL,
          [startDate] DATETIME NOT NULL,
          [endDate] DATETIME NOT NULL,
          [recordCount] INT NOT NULL DEFAULT 0,
          [addedCount] INT NOT NULL DEFAULT 0,
          [skippedCount] INT NOT NULL DEFAULT 0,
          [processingTime] DECIMAL(10,2) NOT NULL DEFAULT 0,
          [errorCount] INT NOT NULL DEFAULT 0,
          [errorDetail] NVARCHAR(MAX) NULL,
          [status] NVARCHAR(50) NOT NULL DEFAULT 'Completed',
          [createdAt] DATETIME NOT NULL DEFAULT GETDATE()
        )
      `);
      
      console.log("✅ FetchLogs tablosu oluşturuldu");
    } else {
      console.log("✅ FetchLogs tablosu mevcut");
      
      // Eksik sütunları kontrol et ve ekle
      await pool.request().query(`
        IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'storeId' AND Object_ID = Object_ID(N'[dbo].[FetchLogs]'))
        BEGIN
          ALTER TABLE [dbo].[FetchLogs] ADD [storeId] INT NOT NULL DEFAULT 0;
        END
        
        IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'apiType' AND Object_ID = Object_ID(N'[dbo].[FetchLogs]'))
        BEGIN
          ALTER TABLE [dbo].[FetchLogs] ADD [apiType] NVARCHAR(50) NOT NULL DEFAULT '';
        END
        
        IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'addedCount' AND Object_ID = Object_ID(N'[dbo].[FetchLogs]'))
        BEGIN
          ALTER TABLE [dbo].[FetchLogs] ADD [addedCount] INT NOT NULL DEFAULT 0;
        END
        
        IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'processingTime' AND Object_ID = Object_ID(N'[dbo].[FetchLogs]'))
        BEGIN
          ALTER TABLE [dbo].[FetchLogs] ADD [processingTime] DECIMAL(10,2) NOT NULL DEFAULT 0;
        END
        
        IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'errorCount' AND Object_ID = Object_ID(N'[dbo].[FetchLogs]'))
        BEGIN
          ALTER TABLE [dbo].[FetchLogs] ADD [errorCount] INT NOT NULL DEFAULT 0;
        END
        
        IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'errorDetail' AND Object_ID = Object_ID(N'[dbo].[FetchLogs]'))
        BEGIN
          ALTER TABLE [dbo].[FetchLogs] ADD [errorDetail] NVARCHAR(MAX) NULL;
        END
      `);
    }
    
    return true;
  } catch (err) {
    console.error("❌ Veritabanı ayarlanırken hata:", err.message);
    return false;
  }
}

// Pool'u dışa aktar
function getPool() {
  if (!pool) {
    throw new Error("Veritabanı bağlantı havuzu henüz başlatılmadı");
  }
  return pool;
}

module.exports = {
  initializePool,
  setupDatabase,
  getPool
};