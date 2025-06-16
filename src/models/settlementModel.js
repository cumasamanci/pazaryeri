const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Settlement = sequelize.define('Settlement', {
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true
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
  paymentPeriod: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  commissionRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  commissionAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  },
  commissionInvoiceSerialNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sellerRevenue: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentOrderId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sellerId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  storeId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  storeName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  orderDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  affiliate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shipmentPackageId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fetchBatchId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Settlements',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: false
});

module.exports = Settlement;