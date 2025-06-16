CREATE DATABASE TrendyolFinance;
GO

USE TrendyolFinance;
GO

-- Kullanıcılar tablosu
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password NVARCHAR(100) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- Finans tablosu
CREATE TABLE Finance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    transactionId NVARCHAR(50) NOT NULL,
    transactionDate DATETIME NOT NULL,
    transactionType NVARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description NVARCHAR(255),
    status NVARCHAR(50) DEFAULT 'Beklemede',
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- Muhasebe tablosu
CREATE TABLE Accounting (
    id INT IDENTITY(1,1) PRIMARY KEY,
    accountName NVARCHAR(100) NOT NULL,
    accountType NVARCHAR(50) NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- Raporlar tablosu
CREATE TABLE Reports (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    type NVARCHAR(50) NOT NULL,
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    data NVARCHAR(MAX),
    status NVARCHAR(50) DEFAULT 'Hazır',
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- Siparişler tablosu
CREATE TABLE Orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    orderNumber NVARCHAR(50) NOT NULL,
    orderDate DATETIME NOT NULL,
    customerName NVARCHAR(100),
    totalAmount DECIMAL(10, 2) NOT NULL,
    status NVARCHAR(50) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- Mağaza tablosu
CREATE TABLE Stores (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    StoreName NVARCHAR(100) NOT NULL,
    SellerId NVARCHAR(50) NOT NULL UNIQUE,
    ApiKey NVARCHAR(100) NOT NULL,
    ApiSecret NVARCHAR(100) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Ödeme tablosu (Settlements)
CREATE TABLE Settlements (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    TransactionId NVARCHAR(50) NOT NULL,
    TransactionDate DATETIME NOT NULL,
    Barcode NVARCHAR(50),
    TransactionType NVARCHAR(50) NOT NULL,
    ReceiptId NVARCHAR(50),
    Description NVARCHAR(200),
    Debt DECIMAL(18, 2) DEFAULT 0,
    Credit DECIMAL(18, 2) DEFAULT 0,
    PaymentPeriod INT,
    CommissionRate DECIMAL(10, 2),
    CommissionAmount DECIMAL(18, 2),
    CommissionInvoiceSerialNumber NVARCHAR(50),
    SellerRevenue DECIMAL(18, 2),
    OrderNumber NVARCHAR(50),
    PaymentOrderId NVARCHAR(50),
    PaymentDate DATETIME,
    SellerId NVARCHAR(50) NOT NULL,
    StoreId NVARCHAR(50),
    StoreName NVARCHAR(100),
    Country NVARCHAR(50),
    OrderDate DATETIME,
    Affiliate NVARCHAR(50),
    ShipmentPackageId NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FetchBatchId NVARCHAR(50) NULL
);

-- Diğer Finansallar tablosu (OtherFinancials)
CREATE TABLE OtherFinancials (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    TransactionId NVARCHAR(50) NOT NULL,
    TransactionDate DATETIME NOT NULL,
    TransactionType NVARCHAR(50) NOT NULL,
    ReceiptId NVARCHAR(50),
    Description NVARCHAR(200),
    Debt DECIMAL(18, 2) DEFAULT 0,
    Credit DECIMAL(18, 2) DEFAULT 0,
    PaymentOrderId NVARCHAR(50),
    SellerId NVARCHAR(50) NOT NULL,
    Affiliate NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FetchBatchId NVARCHAR(50) NULL
);

-- Mutabakat tablosu
CREATE TABLE Reconciliations (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UploadId NVARCHAR(50) NOT NULL,
    OrderNumber NVARCHAR(50) NOT NULL,
    IsMatched BIT DEFAULT 0,
    MatchedTransactionId NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Otomasyon Görevleri tablosu
CREATE TABLE AutomationJobs (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    JobType NVARCHAR(50) NOT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Pending',
    SellerId NVARCHAR(50) NOT NULL,
    CompletedDate DATETIME NULL,
    TotalRecords INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- İşlem Detayları Günlüğü tablosu
CREATE TABLE FetchLogs (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    BatchId NVARCHAR(50) NOT NULL,
    SellerId NVARCHAR(50) NOT NULL,
    TransactionType NVARCHAR(50) NOT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    RecordCount INT DEFAULT 0,
    Status NVARCHAR(20) DEFAULT 'Success',
    ErrorMessage NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Örnek veri ekleyelim
INSERT INTO Users (username, email, password)
VALUES ('admin', 'admin@example.com', '$2a$10$XpC6NxQnFXBGQvx5YBV.W.HY.DSkVJgM742K6Xj0NBK/rXWYxJUBK'); -- Şifre: admin123

INSERT INTO Finance (transactionId, transactionDate, transactionType, amount, description, status)
VALUES 
('TR123456', GETDATE(), 'Sale', 450.00, 'Sipariş #123456', 'Tamamlandı'),
('TR123457', DATEADD(DAY, -1, GETDATE()), 'Return', -120.50, 'Sipariş #123450 İadesi', 'Tamamlandı'),
('TR123458', DATEADD(DAY, -2, GETDATE()), 'Sale', 275.90, 'Sipariş #123452', 'Tamamlandı'),
('TR123459', DATEADD(DAY, -3, GETDATE()), 'Payment', 1250.00, 'Haftalık Ödeme', 'Tamamlandı'),
('TR123460', DATEADD(DAY, -4, GETDATE()), 'Commission', -87.50, 'Haftalık Komisyon', 'Tamamlandı');

INSERT INTO Accounting (accountName, accountType, balance)
VALUES 
('Trendyol Satış', 'Gelir', 15780.45),
('Trendyol İade', 'Gider', 2340.20),
('Trendyol Komisyon', 'Gider', 1575.80);

INSERT INTO Reports (name, type, startDate, endDate, status)
VALUES 
('Mayıs 2023 Satış Raporu', 'sales', '2023-05-01', '2023-05-31', 'Hazır'),
('Mayıs 2023 İade Raporu', 'returns', '2023-05-01', '2023-05-31', 'Hazır');

-- Bazı örnek mağaza verileri ekleyelim
INSERT INTO Stores (StoreName, SellerId, ApiKey, ApiSecret) 
VALUES ('Monalure Shop', '953720', 'jwGpoSyOH28Sw2C1Vxai', '2EYQl5jRAlVLRV4ydqoY');
GO