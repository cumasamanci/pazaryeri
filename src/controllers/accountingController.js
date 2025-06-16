const Accounting = require('../models/accountingModel');

class AccountingController {
  async getAccounts(req, res) {
    try {
      const sellerId = req.user.sellerId;
      const accounts = await Accounting.findAll({
        where: { sellerId, isActive: true }
      });
      
      // API isteği ise JSON dön
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(200).json(accounts);
      }
      
      // Tarayıcı isteği ise sayfayı render et
      res.render('accounting/accounts', { accounts });
    } catch (error) {
      res.status(500).json({ 
        message: 'Hesaplar alınırken hata oluştu', 
        error: error.message 
      });
    }
  }

  async createAccount(req, res) {
    try {
      const accountData = {
        ...req.body,
        sellerId: req.user.sellerId
      };
      
      const newAccount = await Accounting.create(accountData);
      res.status(201).json(newAccount);
    } catch (error) {
      res.status(400).json({ 
        message: 'Hesap oluşturulurken hata oluştu', 
        error: error.message 
      });
    }
  }

  async getAccountById(req, res) {
    try {
      const accountId = req.params.id;
      const sellerId = req.user.sellerId;
      
      const account = await Accounting.findOne({
        where: {
          id: accountId,
          sellerId,
          isActive: true
        }
      });
      
      if (!account) {
        return res.status(404).json({ message: 'Hesap bulunamadı' });
      }
      
      res.status(200).json(account);
    } catch (error) {
      res.status(500).json({ 
        message: 'Hesap bilgisi alınırken hata oluştu', 
        error: error.message 
      });
    }
  }

  async updateAccount(req, res) {
    try {
      const accountId = req.params.id;
      const sellerId = req.user.sellerId;
      
      const account = await Accounting.findOne({
        where: {
          id: accountId,
          sellerId,
          isActive: true
        }
      });
      
      if (!account) {
        return res.status(404).json({ message: 'Hesap bulunamadı' });
      }
      
      const updatedAccount = await account.update(req.body);
      res.status(200).json(updatedAccount);
    } catch (error) {
      res.status(400).json({ 
        message: 'Hesap güncellenirken hata oluştu', 
        error: error.message 
      });
    }
  }

  async deleteAccount(req, res) {
    try {
      const accountId = req.params.id;
      const sellerId = req.user.sellerId;
      
      const account = await Accounting.findOne({
        where: {
          id: accountId,
          sellerId
        }
      });
      
      if (!account) {
        return res.status(404).json({ message: 'Hesap bulunamadı' });
      }
      
      // Hesabı silmek yerine pasif yap
      await account.update({ isActive: false });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ 
        message: 'Hesap silinirken hata oluştu', 
        error: error.message 
      });
    }
  }
}

module.exports = new AccountingController();