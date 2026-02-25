const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/flash-sale-db',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
