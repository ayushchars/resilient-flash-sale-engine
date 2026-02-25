const analyticsService = require('../services/analytics.service');
const { sendSuccess, sendSuccessWithCount } = require('../utils/responseHelper');

const getDashboard = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getDashboardAnalytics();
    sendSuccess(res, analytics);
  } catch (error) {
    next(error);
  }
};

const getLowStock = async (req, res, next) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const products = await analyticsService.getLowStockProducts(threshold);
    sendSuccessWithCount(res, products, products.length);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getLowStock,
};
