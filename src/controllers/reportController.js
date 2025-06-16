const { sql } = require('../config/database');

class ReportController {
  async showReports(req, res) {
    try {
      const reportsResult = await sql.query`
        SELECT r.*, s.storeName 
        FROM Reports r
        LEFT JOIN Stores s ON r.storeId = s.id
        ORDER BY r.createdAt DESC
      `;
      
      const reports = reportsResult.recordset;
      
      res.render('reports/index', {
        title: 'Raporlar',
        reports
      });
    } catch (error) {
      console.error('Raporlar yüklenirken hata:', error);
      res.status(500).render('error', {
        title: 'Hata',
        message: 'Raporlar yüklenirken bir hata oluştu',
        error
      });
    }
  }
  
  async showCreateForm(req, res) {
    try {
      const storesResult = await sql.query`
        SELECT * FROM Stores WHERE isActive = 1 ORDER BY storeName
      `;
      
      const stores = storesResult.recordset;
      
      res.render('reports/create', {
        title: 'Yeni Rapor Oluştur',
        stores
      });
    } catch (error) {
      console.error('Rapor oluşturma formu yüklenirken hata:', error);
      res.status(500).render('error', {
        title: 'Hata',
        message: 'Rapor oluşturma formu yüklenirken bir hata oluştu',
        error
      });
    }
  }
  
  async createReport(req, res) {
    try {
      // Burada rapor oluşturma mantığı gelecek
      res.redirect('/reports');
    } catch (error) {
      console.error('Rapor oluşturulurken hata:', error);
      res.status(500).render('error', {
        title: 'Hata',
        message: 'Rapor oluşturulurken bir hata oluştu',
        error
      });
    }
  }
  
  async showReportDetail(req, res) {
    try {
      const { id } = req.params;
      
      const reportResult = await sql.query`
        SELECT r.*, s.storeName 
        FROM Reports r
        LEFT JOIN Stores s ON r.storeId = s.id
        WHERE r.id = ${id}
      `;
      
      if (reportResult.recordset.length === 0) {
        return res.status(404).render('error', {
          title: 'Hata',
          message: 'Rapor bulunamadı',
          error: { status: 404 }
        });
      }
      
      const report = reportResult.recordset[0];
      
      res.render('reports/detail', {
        title: 'Rapor Detayı',
        report
      });
    } catch (error) {
      console.error('Rapor detayı yüklenirken hata:', error);
      res.status(500).render('error', {
        title: 'Hata',
        message: 'Rapor detayı yüklenirken bir hata oluştu',
        error
      });
    }
  }
  
  async downloadReport(req, res) {
    try {
      const { id } = req.params;
      
      const reportResult = await sql.query`
        SELECT * FROM Reports WHERE id = ${id}
      `;
      
      if (reportResult.recordset.length === 0) {
        return res.status(404).send('Rapor bulunamadı');
      }
      
      const report = reportResult.recordset[0];
      
      // Burada rapor dosyasını indirme mantığı gelecek
      res.send('Rapor indirme işlemi');
    } catch (error) {
      console.error('Rapor indirilirken hata:', error);
      res.status(500).send('Rapor indirilirken bir hata oluştu');
    }
  }
}

module.exports = new ReportController();