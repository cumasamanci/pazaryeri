const axios = require('axios');
const crypto = require('crypto');

class TrendyolService {
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.trendyol.com/integration/finance'
      : 'https://api.trendyol.com/integration/finance';
  }

  // API için imza oluştur
  _createSignature(apiKey, apiSecret, timestamp) {
    const data = apiKey + apiSecret + timestamp;
    return crypto.createHash('sha256').update(data).digest('base64');
  }

  // API istekleri için kimlik başlıklarını oluştur
  async getAuthHeaders(apiKey, apiSecret) {
    const timestamp = new Date().getTime();
    const signature = this._createSignature(apiKey, apiSecret, timestamp);
    
    return {
      'Authorization': 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64'),
      'User-Agent': 'Trendyol-Finance-Integration',
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp.toString(),
      'X-Signature': signature
    };
  }

  /**
   * Settlements verilerini getir (Satış, İade, İndirim, Kupon, Provizyon)
   */
  async getSettlements(params) {
    try {
      const { sellerId, apiKey, apiSecret, startDate, endDate, transactionType, page = 0, size = 500 } = params;
      
      if (!sellerId || !apiKey || !apiSecret || !startDate || !endDate || !transactionType) {
        throw new Error('Eksik parametreler');
      }
      
      const headers = await this.getAuthHeaders(apiKey, apiSecret);
      
      console.log(`API isteği: ${this.baseUrl}/che/sellers/${sellerId}/settlements`, {
        startDate,
        endDate,
        transactionType,
        page,
        size
      });
      
      const response = await axios.get(`${this.baseUrl}/che/sellers/${sellerId}/settlements`, {
        headers,
        params: {
          startDate,
          endDate,
          transactionType,
          page,
          size
        }
      });
      
      console.log(`API yanıtı alındı. Kayıt sayısı: ${response.data?.content?.length || 0}`);
      return response.data;
    } catch (error) {
      console.error('Settlements verisi çekilirken hata:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  /**
   * Other Financials verilerini getir (Ödemeler, Finansman, Faturalar)
   */
  async getOtherFinancials(params) {
    try {
      const { sellerId, apiKey, apiSecret, startDate, endDate, transactionType, page = 0, size = 500 } = params;
      
      if (!sellerId || !apiKey || !apiSecret || !startDate || !endDate || !transactionType) {
        throw new Error('Eksik parametreler');
      }
      
      const headers = await this.getAuthHeaders(apiKey, apiSecret);
      
      console.log(`API isteği: ${this.baseUrl}/che/sellers/${sellerId}/otherfinancials`, {
        startDate,
        endDate,
        transactionType,
        page,
        size
      });
      
      const response = await axios.get(`${this.baseUrl}/che/sellers/${sellerId}/otherfinancials`, {
        headers,
        params: {
          startDate,
          endDate,
          transactionType,
          page,
          size
        }
      });
      
      console.log(`API yanıtı alındı. Kayıt sayısı: ${response.data?.content?.length || 0}`);
      return response.data;
    } catch (error) {
      console.error('OtherFinancials verisi çekilirken hata:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  }
}

module.exports = new TrendyolService();