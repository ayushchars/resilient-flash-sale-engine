const Order = require('../models/Order');
const Product = require('../models/Product');


const getDashboardAnalytics = async () => {
  const result = await Order.aggregate([
    {
      $match: {
        status: 'confirmed',
      },
    },

    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
      },
    },

    {
      $unwind: {
        path: '$product',
        preserveNullAndEmptyArrays: false,
      },
    },

    {
      $group: {
        _id: '$productId',
        totalRevenue: { $sum: '$totalPrice' },
        totalQuantity: { $sum: '$quantity' },
        firstOrderTime: { $min: '$createdAt' },
        productAddedTime: { $first: '$product.addedToSaleAt' },
        category: { $first: '$product.category' },
        currentStock: { $first: '$product.stock' },
        productName: { $first: '$product.name' },
      },
    },

    {
      $addFields: {
        conversionSpeedMs: {
          $subtract: ['$firstOrderTime', '$productAddedTime'],
        },
      },
    },

    {
      $addFields: {
        stockHealth: {
          $cond: {
            if: { $lt: ['$currentStock', 10] },
            then: 'critical',
            else: 'healthy',
          },
        },
      },
    },

    {
      $facet: {
        overallMetrics: [
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalRevenue' },
              totalItemsSold: { $sum: '$totalQuantity' },
              avgConversionSpeedMs: { $avg: '$conversionSpeedMs' },
            },
          },
        ],

        stockHealth: [
          {
            $group: {
              _id: '$stockHealth',
              products: {
                $push: {
                  productId: '$_id',
                  name: '$productName',
                  stock: '$currentStock',
                  category: '$category',
                },
              },
              count: { $sum: 1 },
            },
          },
        ],

        topCategories: [
          {
            $group: {
              _id: '$category',
              totalRevenue: { $sum: '$totalRevenue' },
              totalItemsSold: { $sum: '$totalQuantity' },
            },
          },
          {
            $sort: { totalRevenue: -1 },
          },
          {
            $limit: 3,
          },
        ],

        productMetrics: [
          {
            $project: {
              productId: '$_id',
              productName: 1,
              category: 1,
              revenue: '$totalRevenue',
              itemsSold: '$totalQuantity',
              conversionSpeedMs: 1,
              stockHealth: 1,
              currentStock: 1,
            },
          },
        ],
      },
    },

    {
      $project: {
        revenue: { $arrayElemAt: ['$overallMetrics.totalRevenue', 0] },
        totalItemsSold: { $arrayElemAt: ['$overallMetrics.totalItemsSold', 0] },
        avgConversionSpeedMs: { $arrayElemAt: ['$overallMetrics.avgConversionSpeedMs', 0] },
        stockHealth: '$stockHealth',
        topCategories: '$topCategories',
        productMetrics: '$productMetrics',
      },
    },
  ]);

  if (!result || result.length === 0) {
    return {
      revenue: 0,
      totalItemsSold: 0,
      avgConversionSpeedSeconds: 0,
      stockHealth: {
        critical: [],
        healthy: [],
      },
      topCategories: [],
      productMetrics: [],
    };
  }

  const analytics = result[0];

  const stockHealthMap = {
    critical: [],
    healthy: [],
  };

  analytics.stockHealth?.forEach((item) => {
    stockHealthMap[item._id] = item.products;
  });

  const avgConversionSpeedSeconds = analytics.avgConversionSpeedMs
    ? Math.round(analytics.avgConversionSpeedMs / 1000)
    : 0;

  return {
    revenue: analytics.revenue || 0,
    totalItemsSold: analytics.totalItemsSold || 0,
    avgConversionSpeedSeconds,
    stockHealth: stockHealthMap,
    topCategories: analytics.topCategories || [],
    productMetrics: analytics.productMetrics || [],
  };
};

const getLowStockProducts = async (threshold = 10) => {
  return Product.find({
    stock: { $lt: threshold },
    isActive: true,
  }).select('name stock category');
};

module.exports = {
  getDashboardAnalytics,
  getLowStockProducts,
};
