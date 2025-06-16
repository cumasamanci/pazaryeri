const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const sql = require('mssql');

// Ana sayfa - Dashboard
router.get('/', async (req, res) => {
  try {
    // Aktif mağaza sayısı
    const storeCountResult = await pool.request().query('SELECT COUNT(*) AS count FROM Stores WHERE isActive = 1');
    const storeCount = storeCountResult.recordset[0].count || 0;

    // Son işlemleri gösterme
    const recentPayments = [];
    
    res.render('dashboard/index', {
      title: 'Ana Sayfa',
      storeCount,
      recentPayments,
      totalSales: 0,
      totalReturns: 0,
      totalCommission: 0
    });
  } catch (error) {
    console.error('Dashboard yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      message: 'Ana sayfa yüklenirken bir hata oluştu',
      error
    });
  }
});

// IndexRoutes'daki SQL sorgularını düzeltin - 9. satırdaki hatalı sorguyu değiştirin
router.get('/index', async (req, res) => {
  try {
    // DÜZELTME: pool üzerinden sorgu çalıştırın, global sql yerine
    const result = await pool.request().query('SELECT COUNT(*) as count FROM Stores');
    
    res.render('dashboard', { 
      title: 'Ana Sayfa',
      storeCount: result.recordset[0].count,
      recentPayments: [],
      totalSales: 0,
      totalReturns: 0,
      totalCommission: 0
    });
  } catch (error) {
    console.error('Dashboard yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      message: 'Dashboard yüklenirken bir hata oluştu',
      error
    });
  }
});

// Örnek doğru kullanım
router.get('/example/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Template literaller ile:
    const result = await sql.query`SELECT * FROM tableName WHERE id = ${id}`;

    // Veya parametreli sorgular ile (daha güvenli):
    // const result = await new sql.Request()
    //   .input('id', sql.Int, id)
    //   .query('SELECT * FROM tableName WHERE id = @id');
      
    res.json(result.recordset);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).send('Bir hata oluştu');
  }
});

module.exports = router;