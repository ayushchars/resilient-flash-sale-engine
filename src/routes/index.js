const express = require('express');
const router = express.Router();

const orderRoutes = require('./order.routes');
const productRoutes = require('./product.routes');
const analyticsRoutes = require('./analytics.routes');

router.use('/orders', orderRoutes);
router.use('/products', productRoutes);
router.use('/analytics', analyticsRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Flash Sale Engine API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
