const { sql } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findOne(filter) {
    try {
      const pool = await sql.connect();
      let query = `SELECT * FROM Users WHERE `;
      
      // Filtreyi SQL sorgusuna dönüştür
      const conditions = Object.entries(filter).map(([key, value]) => {
        return `${key} = @${key}`;
      }).join(' AND ');
      
      query += conditions;
      
      const request = pool.request();
      
      // Parametreleri ekle
      Object.entries(filter).forEach(([key, value]) => {
        request.input(key, value);
      });
      
      const result = await request.query(query);
      return result.recordset[0];
    } catch (error) {
      console.error('Kullanıcı aranırken hata:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const pool = await sql.connect();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM Users WHERE id = @id');
      
      return result.recordset[0];
    } catch (error) {
      console.error('Kullanıcı ID ile aranırken hata:', error);
      throw error;
    }
  }

  static async create(data) {
    try {
      // Şifreyi hashle
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);
      
      const pool = await sql.connect();
      const result = await pool.request()
        .input('username', sql.VarChar, data.username)
        .input('email', sql.VarChar, data.email)
        .input('password', sql.VarChar, hashedPassword)
        .query(`
          INSERT INTO Users (username, email, password)
          VALUES (@username, @email, @password);
          SELECT SCOPE_IDENTITY() AS id
        `);
      
      return { 
        id: result.recordset[0].id,
        username: data.username,
        email: data.email
      };
    } catch (error) {
      console.error('Kullanıcı oluşturulurken hata:', error);
      throw error;
    }
  }
}

module.exports = User;