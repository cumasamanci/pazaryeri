const { sql } = require('../config/database');

class Finance {
  static async find(filter = {}, sort = {}, limit = 0) {
    try {
      const pool = await sql.connect();
      let query = `SELECT TOP ${limit || 1000} * FROM Finance`;
      
      // Filtreleme ve sıralama eklenebilir
      if (sort.date) {
        query += ` ORDER BY date ${sort.date === -1 ? 'DESC' : 'ASC'}`;
      }
      
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error('Finans verileri getirilirken hata:', error);
      throw error;
    }
  }

  static async create(data) {
    try {
      const pool = await sql.connect();
      const result = await pool.request()
        .input('transactionId', sql.VarChar, data.transactionId)
        .input('transactionDate', sql.DateTime, data.transactionDate)
        .input('transactionType', sql.VarChar, data.transactionType)
        .input('amount', sql.Decimal(10, 2), data.amount)
        .input('description', sql.VarChar, data.description)
        .query(`
          INSERT INTO Finance (transactionId, transactionDate, transactionType, amount, description)
          VALUES (@transactionId, @transactionDate, @transactionType, @amount, @description);
          SELECT SCOPE_IDENTITY() AS id
        `);
      
      return { ...data, id: result.recordset[0].id };
    } catch (error) {
      console.error('Finans kaydı oluşturulurken hata:', error);
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
        UPDATE Finance SET ${updateFields} WHERE id = @id;
        SELECT * FROM Finance WHERE id = @id
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Finans kaydı güncellenirken hata:', error);
      throw error;
    }
  }

  static async findByIdAndDelete(id) {
    try {
      const pool = await sql.connect();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT * FROM Finance WHERE id = @id;
          DELETE FROM Finance WHERE id = @id
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Finans kaydı silinirken hata:', error);
      throw error;
    }
  }
}

module.exports = Finance;