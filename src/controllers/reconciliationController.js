const { sql } = require('../config/database');
const StoreModel = require('../models/storeModel');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Dosya yükleme ayarları
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function(req, file, cb) {
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedTypes.includes(ext)) {
            return cb(new Error('Sadece Excel ve CSV dosyaları yüklenebilir'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
}).single('reconciliationFile');

class ReconciliationController {
    async showReconciliation(req, res) {
        try {
            const storesResult = await sql.query`
                SELECT * FROM Stores WHERE isActive = 1 ORDER BY storeName
            `;
            
            const stores = storesResult.recordset;
            
            res.render('reconciliation/index', {
                title: 'Mutabakat',
                stores
            });
        } catch (error) {
            console.error('Mutabakat sayfası yüklenirken hata:', error);
            res.status(500).render('error', {
                title: 'Hata',
                message: 'Mutabakat sayfası yüklenirken bir hata oluştu',
                error
            });
        }
    }
    
    async uploadFile(req, res) {
        try {
            upload(req, res, async function(err) {
                if (err) {
                    return res.status(400).json({ success: false, message: err.message });
                }
                
                if (!req.file) {
                    return res.status(400).json({ success: false, message: 'Lütfen bir dosya yükleyin' });
                }
                
                const { storeId } = req.body;
                
                if (!storeId) {
                    return res.status(400).json({ success: false, message: 'Lütfen bir mağaza seçin' });
                }
                
                try {
                    // Excel dosyasını oku
                    const workbook = xlsx.readFile(req.file.path);
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const data = xlsx.utils.sheet_to_json(worksheet);
                    
                    if (data.length === 0) {
                        return res.status(400).json({ success: false, message: 'Dosyada veri bulunamadı' });
                    }
                    
                    // Sipariş numaralarını al
                    const orderNumberColumnName = Object.keys(data[0]).find(key => 
                        key.toLowerCase().includes('sipariş') || 
                        key.toLowerCase().includes('order') || 
                        key.toLowerCase().includes('no')
                    );
                    
                    if (!orderNumberColumnName) {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Dosyada sipariş numarası sütunu bulunamadı. Lütfen "Sipariş No" veya "Order Number" içeren bir sütun adı kullanın.' 
                        });
                    }
                    
                    const orderNumbers = data.map(row => row[orderNumberColumnName]).filter(Boolean);
                    
                    if (orderNumbers.length === 0) {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Dosyada sipariş numarası bulunamadı' 
                        });
                    }
                    
                    // Veritabanında verileri kontrol et
                    const pool = await sql.connect();
                    
                    // Mutabakat kaydı oluştur
                    const reconciliationId = await this._createReconciliation(pool, storeId, req.file.originalname, orderNumbers.length);
                    
                    const orderNumbersStr = orderNumbers.map(no => `'${no}'`).join(',');
                    
                    const dbOrdersResult = await pool.request().query(`
                        SELECT orderNumber, COUNT(*) as count, SUM(amount) as amount
                        FROM Payments
                        WHERE storeId = ${storeId} AND orderNumber IN (${orderNumbersStr})
                        GROUP BY orderNumber
                    `);
                    
                    const dbOrders = dbOrdersResult.recordset;
                    
                    // Her sipariş için mutabakat detayı ekle
                    for (const orderNumber of orderNumbers) {
                        const dbOrder = dbOrders.find(o => o.orderNumber === orderNumber);
                        const status = dbOrder ? 'matched' : 'missing';
                        
                        await this._addReconciliationDetail(
                            pool, 
                            reconciliationId, 
                            orderNumber, 
                            status, 
                            dbOrder ? dbOrder.count : 0,
                            dbOrder ? dbOrder.amount : 0
                        );
                    }
                    
                    // Dosyayı sil
                    fs.unlinkSync(req.file.path);
                    
                    // Sonuçları hesapla
                    const statsResult = await pool.request().query(`
                        SELECT 
                            COUNT(CASE WHEN status = 'matched' THEN 1 END) as matchedCount,
                            COUNT(CASE WHEN status = 'missing' THEN 1 END) as missingCount,
                            SUM(amount) as totalAmount
                        FROM ReconciliationDetails
                        WHERE reconciliationId = ${reconciliationId}
                    `);
                    
                    const stats = statsResult.recordset[0];
                    
                    // Mutabakat güncellemesi
                    await pool.request().query(`
                        UPDATE Reconciliations 
                        SET matchedCount = ${stats.matchedCount}, 
                            missingCount = ${stats.missingCount},
                            totalAmount = ${stats.totalAmount || 0}
                        WHERE id = ${reconciliationId}
                    `);
                    
                    res.json({
                        success: true,
                        message: 'Mutabakat dosyası başarıyla işlendi',
                        reconciliationId: reconciliationId,
                        stats: {
                            total: orderNumbers.length,
                            matched: stats.matchedCount,
                            missing: stats.missingCount,
                            amount: stats.totalAmount
                        }
                    });
                    
                } catch (processError) {
                    console.error('Dosya işlenirken hata:', processError);
                    
                    // Dosya işlenemezse sil
                    if (req.file && fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }
                    
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Dosya işlenirken hata: ' + processError.message 
                    });
                }
            });
        } catch (error) {
            console.error('Mutabakat dosyası yüklenirken hata:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Mutabakat dosyası yüklenirken hata: ' + error.message 
            });
        }
    }

    async showResults(req, res) {
        try {
            // Burada mutabakat sonuçlarını gösterme mantığı gelecek
            res.render('reconciliation/results', {
                title: 'Mutabakat Sonuçları'
            });
        } catch (error) {
            console.error('Mutabakat sonuçları yüklenirken hata:', error);
            res.status(500).render('error', {
                title: 'Hata',
                message: 'Mutabakat sonuçları yüklenirken bir hata oluştu',
                error
            });
        }
    }

    async getReconciliationDetails(req, res) {
        try {
            const { reconciliationId } = req.params;
            
            const pool = await sql.connect();
            
            // Mutabakat detaylarını getir
            const reconciliationResult = await pool.request().query(`
                SELECT r.*, s.name as storeName 
                FROM Reconciliations r
                JOIN Stores s ON r.storeId = s.id
                WHERE r.id = ${reconciliationId}
            `);
            
            if (reconciliationResult.recordset.length === 0) {
                return res.status(404).render('error', { 
                    title: 'Hata',
                    message: 'Mutabakat bulunamadı' 
                });
            }
            
            const reconciliation = reconciliationResult.recordset[0];
            
            // Detayları getir
            const detailsResult = await pool.request().query(`
                SELECT * FROM ReconciliationDetails
                WHERE reconciliationId = ${reconciliationId}
                ORDER BY status
            `);
            
            res.render('reconciliation/details', {
                title: 'Mutabakat Detayları',
                reconciliation: reconciliation,
                details: detailsResult.recordset
            });
            
        } catch (error) {
            console.error('Mutabakat detayları alınırken hata:', error);
            res.status(500).render('error', { 
                title: 'Hata', 
                error: error,
                message: 'Mutabakat detayları alınırken bir hata oluştu'
            });
        }
    }

    // Mutabakat kaydı oluştur
    async _createReconciliation(pool, storeId, fileName, orderCount) {
        const result = await pool.request()
            .input('storeId', sql.Int, storeId)
            .input('fileName', sql.VarChar, fileName)
            .input('orderCount', sql.Int, orderCount)
            .query(`
                INSERT INTO Reconciliations (storeId, fileName, orderCount, createdAt)
                VALUES (@storeId, @fileName, @orderCount, GETDATE());
                SELECT SCOPE_IDENTITY() AS id;
            `);
            
        return result.recordset[0].id;
    }

    // Mutabakat detayı ekle
    async _addReconciliationDetail(pool, reconciliationId, orderNumber, status, count, amount) {
        await pool.request()
            .input('reconciliationId', sql.Int, reconciliationId)
            .input('orderNumber', sql.VarChar, orderNumber)
            .input('status', sql.VarChar, status)
            .input('count', sql.Int, count)
            .input('amount', sql.Decimal(10, 2), amount)
            .query(`
                INSERT INTO ReconciliationDetails (reconciliationId, orderNumber, status, count, amount)
                VALUES (@reconciliationId, @orderNumber, @status, @count, @amount)
            `);
    }
}

module.exports = new ReconciliationController();