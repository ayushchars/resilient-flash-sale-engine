const logger = require('../utils/logger');
const config = require('../config/config');


const createAppError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  Error.captureStackTrace(error, createAppError);
  return error;
};

const ValidationError = (message) => {
  return createAppError(message, 400);
};

const ConflictError = (message) => {
  return createAppError(message, 409);
};

const NotFoundError = (message) => {
  return createAppError(message, 404);
};


const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode;

  logger.error({
    message: error.message,
    statusCode: error.statusCode,
    stack: err.stack,
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
  });

  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = ValidationError(message);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `Duplicate value for field: ${field}`;
    error = ConflictError(message);
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = ValidationError(message);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  const response = {
    success: false,
    error: message,
  };

  if (config.env !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  if (req.requestId) {
    response.requestId = req.requestId;
  }

  res.status(statusCode).json(response);
};


const notFound = (req, res, next) => {
  const error = NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
  createAppError,
  ValidationError,
  ConflictError,
  NotFoundError,
};
