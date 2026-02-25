const Joi = require('joi');


const createOrder = {
  body: Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'productId must be a valid MongoDB ObjectId',
        'any.required': 'productId is required',
      }),
    quantity: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'quantity must be a number',
        'number.min': 'quantity must be at least 1',
      }),
    idempotencyKey: Joi.string()
      .required()
      .messages({
        'any.required': 'idempotencyKey is required for preventing duplicate orders',
      }),
  }),
};

const productIdParam = {
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'id must be a valid MongoDB ObjectId',
      }),
  }),
};

module.exports = {
  createOrder,
  productIdParam,
};
