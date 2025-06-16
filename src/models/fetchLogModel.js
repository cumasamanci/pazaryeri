const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FetchLog = sequelize.define('FetchLog', {
  batchId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sellerId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  transactionType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  recordCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Success'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'FetchLogs',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: false
});

module.exports = FetchLog;