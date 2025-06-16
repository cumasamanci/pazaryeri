const { sql } = require('../config/database');

class DashboardController {
  /**
   * Ana sayfa dashboard'u göster
   */
  async showDashboard(req, res) {
    try {
      // Aktif mağaza sayısı
      const storeCountResult = await sql.query`SELECT COUNT(*) AS count FROM Stores WHERE isActive = 1`;
      const storeCount = storeCountResult.recordset[0].count;

      // Son 30 günlük istatistikler
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const timestamp = thirtyDaysAgo.getTime();

      // Son eklenen ödemeler
      const recentPaymentsResult = await sql.query`
        SELECT TOP 5 s.*, st.storeName 
        FROM Settlements s
        LEFT JOIN Stores st ON s.sellerId = st.sellerId
        ORDER BY s.createdAt DESC
      `;
      
      // Satış/iade toplamları
      const financialsResult = await sql.query`
        SELECT 
          SUM(CASE WHEN transactionType = 'Sale' THEN credit ELSE 0 END) AS totalSales,
          SUM(CASE WHEN transactionType = 'Return' THEN debt ELSE 0 END) AS totalReturns,
          SUM(commissionAmount) AS totalCommission
        FROM Settlements 
        WHERE transactionDate >= ${timestamp}
      `;
      
      const financials = financialsResult.recordset[0];

      res.render('dashboard/index', {
        title: 'Ana Sayfa',
        storeCount,
        recentPayments: recentPaymentsResult.recordset,
        totalSales: financials.totalSales || 0,
        totalReturns: financials.totalReturns || 0,
        totalCommission: financials.totalCommission || 0
      });
    } catch (error) {
      console.error('Dashboard yüklenirken hata:', error);
      res.status(500).render('error', {
        title: 'Hata',
        message: 'Dashboard yüklenirken bir hata oluştu',
        error
      });
    }
  }
}

module.exports = new DashboardController();