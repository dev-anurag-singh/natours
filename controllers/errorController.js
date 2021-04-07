const AppError = require('../util/appError');

const handleCastError = (err) => {
  const message = `Invalid ${err.path}:${err.value}`;
  return new AppError(message, 404);
};

const handleDuplicateFieldsError = (err) => {
  const fieldName = Object.keys(err.keyPattern)[0];
  const message = `Document with ${fieldName} ${err.keyValue[fieldName]} already exist`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const error = Object.values(err.errors).map((el) => el.message);
  const message = error.join('. ');
  return new AppError(message, 400);
};

const handlejwtTokenError = (err) =>
  new AppError(`${err.message}. Please log in again`, 401);

const sendErrorDev = (err, req, res) => {
  // Sending response for api error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }
  // sending response for Page Error
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // Sending response for api error
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'something went wrong',
    });
  }

  // sending response for Page Error
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Something went wrong please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  let error = { ...err };
  error.message = err.message;

  // Handle CastError

  if (err.name === 'CastError') error = handleCastError(error);

  // Handle Duplicate Field Error

  if (err.code === 11000) error = handleDuplicateFieldsError(error);

  // Handle Validation Error

  if (err.name === 'ValidationError') error = handleValidationError(error);

  // Handle JWT web token Error

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')
    error = handlejwtTokenError(error);

  // Sending Different Error in Prod & Dev Env

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV === 'production ') {
    return sendErrorProd(error, req, res);
  }
};
