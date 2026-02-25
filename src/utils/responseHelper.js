
const sendSuccess = (res, data, message = null, statusCode = 200) => {
  const response = {
    success: true,
    ...(message && { message }),
    data,
  };

  return res.status(statusCode).json(response);
};

const sendSuccessWithCount = (res, data, count, message = null, statusCode = 200) => {
  const response = {
    success: true,
    ...(message && { message }),
    count,
    data,
  };

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendSuccessWithCount,
};
