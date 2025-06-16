// Dosya yolu: c:\Users\PC\Desktop\trendyol-finance-integration\src\models\reportModel.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reportType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'general' // Varsayılan değer eklendi
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sellerId: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '953720' // .env'deki DEFAULT_SELLER_ID değeri
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'created'
  }
});

module.exports = Report;