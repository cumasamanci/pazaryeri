const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const sequelize = require('sequelize');

class AuthController {
  async register(req, res) {
    try {
      const { username, password, email, sellerId } = req.body;
      
      // Kullanıcı adı veya e-posta zaten kullanılıyor mu?
      const existingUser = await User.findOne({ 
        where: {
          [sequelize.Op.or]: [
            { username: username },
            { email: email }
          ]
        }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Kullanıcı adı veya e-posta zaten kullanılıyor' });
      }
      
      const newUser = await User.create({ 
        username, 
        password, 
        email, 
        sellerId 
      });
      
      // Hassas bilgileri çıkar
      const userResponse = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        sellerId: newUser.sellerId
      };
      
      res.status(201).json({ 
        message: 'Kullanıcı başarıyla oluşturuldu', 
        user: userResponse 
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Kullanıcı kayıt sırasında hata oluştu', 
        error: error.message 
      });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      // Kullanıcı adı ile kullanıcıyı bul
      const user = await User.findOne({ where: { username } });
      
      if (!user || !(await user.validatePassword(password))) {
        return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
      }
      
      // JWT token oluştur
      const token = jwt.sign(
        { id: user.id, username: user.username, sellerId: user.sellerId },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      res.status(200).json({
        message: 'Giriş başarılı',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          sellerId: user.sellerId
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Giriş sırasında hata oluştu', 
        error: error.message 
      });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      }
      
      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ 
        message: 'Profil bilgileri alınırken hata oluştu', 
        error: error.message 
      });
    }
  }

  authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Yetkilendirme başlığı eksik' });
      }
      
      const token = authHeader.split(' ')[1];
      
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token' });
        }
        
        req.user = decoded;
        next();
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Kimlik doğrulama sırasında hata oluştu', 
        error: error.message 
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return res.status(404).json({ message: 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı' });
      }
      
      // Gerçek uygulamada burada şifre sıfırlama e-postası gönderilir
      
      res.status(200).json({ 
        message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi' 
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Şifre sıfırlama işlemi sırasında hata oluştu', 
        error: error.message 
      });
    }
  }
}

module.exports = new AuthController();