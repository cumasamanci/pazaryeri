USE TrendyolFinance;
GO

-- Mağazalar tablosu
CREATE TABLE Stores (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    sellerId NVARCHAR(50) NOT NULL,
    apiKey NVARCHAR(100) NOT NULL,
    apiSecret NVARCHAR(100) NOT NULL,
    isActive BIT DEFAULT 1,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- Ödeme detayları tablosu
CREATE TABLE PaymentDetails (
    id NVARCHAR(50) PRIMARY KEY,
    transactionDate DATETIME NOT NULL,
    barcode NVARCHAR(50) NULL,
    transactionType NVARCHAR(50) NOT NULL,
    receiptId BIGINT NULL,
    description NVARCHAR(255) NULL,
    debt DECIMAL(18, 2) DEFAULT 0,
    credit DECIMAL(18, 2) DEFAULT 0,
    paymentPeriod INT NULL,
    commissionRate DECIMAL(5, 2) NULL,
    commissionAmount DECIMAL(18, 2) NULL,
    commissionInvoiceSerialNumber NVARCHAR(50) NULL,
    sellerRevenue DECIMAL(18, 2) NULL,
    orderNumber NVARCHAR(50) NULL,
    paymentOrderId BIGINT NULL,
    paymentDate DATETIME NULL,
    storeId INT NOT NULL,
    shipmentPackageId BIGINT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (storeId) REFERENCES Stores(id)
);

-- Otomasyon işlemleri tablosu
CREATE TABLE AutomationJobs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    storeId INT NOT NULL,
    jobType NVARCHAR(50) NOT NULL,
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    processingTime INT NULL, -- İşlem süresi (ms)
    recordCount INT DEFAULT 0, -- İşlenen kayıt sayısı
    createdAt DATETIME DEFAULT GETDATE(),
    completedAt DATETIME NULL,
    FOREIGN KEY (storeId) REFERENCES Stores(id)
);

-- Mutabakat tablosu
CREATE TABLE Reconciliations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    storeId INT NOT NULL,
    name NVARCHAR(100) NOT NULL,
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    totalOrdersInFile INT DEFAULT 0,
    matchedOrders INT DEFAULT 0,
    unmatchedOrders INT DEFAULT 0,
    filePath NVARCHAR(255) NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    completedAt DATETIME NULL,
    FOREIGN KEY (storeId) REFERENCES Stores(id)
);

-- Örnek mağaza verisi ekleyin
INSERT INTO Stores (name, sellerId, apiKey, apiSecret)
VALUES ('Monalure Shop', '953720', 'jwGpoSyOH28Sw2C1Vxai', '2EYQl5jRAlVLRV4ydqoY');