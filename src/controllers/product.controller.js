const productService = require('../services/product.service');
const { sendSuccess, sendSuccessWithCount } = require('../utils/responseHelper');

const getAllProducts = async (req, res, next) => {
  try {
    const products = await productService.getAllProducts(req.query);
    sendSuccessWithCount(res, products, products.length);
  } catch (error) {
    next(error);
  }
};


const getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    sendSuccess(res, product, null, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
};
