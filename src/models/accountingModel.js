const { sql } = require('../config/database');

class Accounting {
  static async find() {
    try {
      const pool = await sql.connect();
      const result = await pool.request().query('SELECT * FROM Accounting');
      return result.recordset;
    } catch (error) {
      console.error('Muhasebe kayıtları getirilirken hata:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const pool = await sql.connect();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM Accounting WHERE id = @id');
      
      return result.recordset[0];
    } catch (error) {
      console.error('Muhasebe kaydı getirilirken hata:', error);
      throw error;
    }
  }

  static async create(data) {
    try {
      const pool = await sql.connect();
      const result = await pool.request()
        .input('accountName', sql.VarChar, data.accountName)
        .input('accountType', sql.VarChar, data.accountType)
        .input('balance', sql.Decimal(10, 2), data.balance)
        .query(`
          INSERT INTO Accounting (accountName, accountType, balance)
          VALUES (@accountName, @accountType, @balance);
          SELECT SCOPE_IDENTITY() AS id
        `);
      
      return { ...data, id: result.recordset[0].id };
    } catch (error) {
      console.error('Muhasebe kaydı oluşturulurken hata:', error);
      throw error;
    }
  }

  static async findByIdAndUpdate(id, data) {
    try {
      const pool = await sql.connect();
      const updateFields = Object.entries(data)
        .map(([key, _]) => `${key} = @${key}`)
        .join(', ');
      
      const request = pool.request().input('id', sql.Int, id);
      
      // Dinamik olarak parametreleri ekle
      Object.entries(data).forEach(([key, value]) => {
        request.input(key, value);
      });
      
      const result = await request.query(`
        UPDATE Accounting SET ${updateFields} WHERE id = @id;
        SELECT * FROM Accounting WHERE id = @id
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Muhasebe kaydı güncellenirken hata:', error);
      throw error;
    }
  }

  static async findByIdAndDelete(id) {
    try {
      const pool = await sql.connect();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT * FROM Accounting WHERE id = @id;
          DELETE FROM Accounting WHERE id = @id
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Muhasebe kaydı silinirken hata:', error);
      throw error;
    }
  }
}

module.exports = Accounting;