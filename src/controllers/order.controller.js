const orderService = require('../services/order.service');
const { sendSuccess } = require('../utils/responseHelper');

const createOrder = async (req, res, next) => {
  try {
    const { productId, quantity, idempotencyKey } = req.body;

    const result = await orderService.createOrder({
      productId,
      quantity,
      idempotencyKey,
    });

    const statusCode = result.isNew ? 201 : 200;
    sendSuccess(res, result.order, result.message, statusCode);
  } catch (error) {
    next(error);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    sendSuccess(res, order);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrder,
};
