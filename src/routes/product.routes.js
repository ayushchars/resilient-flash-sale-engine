const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

router.get('/', productController.getAllProducts);
router.get('/:id',validate(schemas.productIdParam),productController.getProduct);
router.post('/', productController.createProduct);

module.exports = router;
