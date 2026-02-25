const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { ConflictError, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

const createOrder = async ({ productId, quantity = 1, idempotencyKey }) => {
  if (!idempotencyKey) {
    throw ValidationError('idempotencyKey is required');
  }

  const existingOrder = await Order.findOne({ idempotencyKey });
  if (existingOrder) {
    return {
      order: existingOrder,
      isNew: false,
      message: 'Order already exists (idempotent request)',
    };
  }

  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    const productExists = await Product.findById(productId).session(session);
    
    if (!productExists) {
      throw NotFoundError(`Product with ID ${productId} not found`);
    }
    
    if (!productExists.isActive) {
      throw ConflictError('Product is not available for sale');
    }

    const availableStock = productExists.stock;
    const actualQuantity = Math.min(quantity, availableStock);

    if (actualQuantity === 0) {
      throw ConflictError(
        `Out of stock. Requested: ${quantity}, Available: 0`
      );
    }

    const product = await Product.findOneAndUpdate(
      {
        _id: productId,
        stock: { $gt: 0 },
        isActive: true,
      },
      {
        $inc: { stock: -actualQuantity },
      },
      {
        new: true,
        session, 
      }
    );

    if (!product) {
      throw ConflictError('Product became unavailable during processing');
    }

    const totalPrice = product.price * actualQuantity;
    const fulfillmentNote = actualQuantity < quantity 
      ? `Thankyou For the order : Requested ${quantity}, Fulfilled ${actualQuantity}`
      : 'Full fulfillment';

    const order = new Order({
      orderId: uuidv4(),
      productId: product._id,
      quantity: actualQuantity,
      totalPrice,
      idempotencyKey,
      status: 'confirmed',
    });

    await order.save({ session });

    await session.commitTransaction();

    return {
      order,
      isNew: true,
      message: fulfillmentNote,
      fulfillmentDetails: {
        requested: quantity,
        fulfilled: actualQuantity,
        isPartial: actualQuantity < quantity,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};


const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId).populate('productId');
  if (!order) {
    throw NotFoundError('Order not found');
  }
  return order;
};

const getOrdersByProduct = async (productId) => {
  return Order.find({ productId }).sort({ createdAt: -1 });
};

module.exports = {
  createOrder,
  getOrderById,
  getOrdersByProduct,
};
