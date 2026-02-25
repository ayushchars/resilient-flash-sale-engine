const Product = require('../models/Product');
const { NotFoundError } = require('../middleware/errorHandler');

const getAllProducts = async (filters = {}) => {
  const query = { isActive: true };
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  return Product.find(query).sort({ createdAt: -1 });
};

const getProductById = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw NotFoundError('Product not found');
  }
  return product;
};

const createProduct = async (productData) => {
  const product = new Product(productData);
  return product.save();
};

const updateProduct = async (productId, updateData) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!product) {
    throw NotFoundError('Product not found');
  }
  
  return product;
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
};
