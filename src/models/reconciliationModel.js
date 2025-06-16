const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reconciliation = sequelize.define('Reconciliation', {
  uploadId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isMatched: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  matchedTransactionId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Reconciliations',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: false
});

module.exports = Reconciliation;