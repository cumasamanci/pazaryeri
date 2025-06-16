const dotenv = require('dotenv');

dotenv.config();

const trendyolApiConfig = {
    apiKey: process.env.TRENDYOL_API_KEY, // API Key from environment variables
    apiSecret: process.env.TRENDYOL_API_SECRET, // API Secret from environment variables
    baseUrl: 'https://apigw.trendyol.com/integration/finance', // Base URL for Trendyol API
    stageBaseUrl: 'https://stageapigw.trendyol.com/integration/finance',
    endpoints: {
        settlements: '/che/sellers/{sellerId}/settlements',
        otherfinancials: '/che/sellers/{sellerId}/otherfinancials'
    },
};

module.exports = trendyolApiConfig;