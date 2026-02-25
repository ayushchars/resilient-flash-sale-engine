const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

router.post('/',validate(schemas.createOrder),orderController.createOrder);
router.get('/:id',validate(schemas.productIdParam),orderController.getOrder);

module.exports = router;
