const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AutomationJob = sequelize.define('AutomationJob', {
  jobType: {
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
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending'
  },
  sellerId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  completedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalRecords: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'AutomationJobs',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: false
});

module.exports = AutomationJob;