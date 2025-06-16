const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OtherFinancial = sequelize.define('OtherFinancial', {
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  transactionType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  receiptId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  debt: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  },
  credit: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  },
  paymentOrderId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sellerId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  affiliate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fetchBatchId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'OtherFinancials',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: false
});

module.exports = OtherFinancial;