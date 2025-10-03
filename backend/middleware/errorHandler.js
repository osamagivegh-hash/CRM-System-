const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Enhanced error logging
  console.error('🚨 ERROR HANDLER TRIGGERED:');
  console.error('📊 Error Name:', err.name);
  console.error('📊 Error Message:', err.message);
  console.error('📊 Error Code:', err.code);
  console.error('📊 Request Method:', req.method);
  console.error('📊 Request URL:', req.originalUrl);
  console.error('📊 Request Body:', req.body);
  console.error('📊 User ID:', req.user?.id);
  console.error('📊 Full Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value for field: ${field}`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { 
      message, 
      statusCode: 400,
      validationErrors: errors
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Reference error (usually missing required fields)
  if (err.name === 'ReferenceError') {
    const message = 'Reference error: ' + err.message;
    error = { message, statusCode: 400 };
  }

  console.error('📤 SENDING ERROR RESPONSE:', {
    status: error.statusCode || 500,
    message: error.message || 'Server Error'
  });

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(error.validationErrors && { validationErrors: error.validationErrors }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      originalError: err
    })
  });
};

module.exports = errorHandler;

