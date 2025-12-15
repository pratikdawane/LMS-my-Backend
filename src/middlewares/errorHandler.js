const errorHandler = (err, req, res, next) => {
  // Check if response has already been sent
  if (res.headersSent) {
    // If headers are already sent, just log the error and return
    console.error('Error after response sent:', err.message);
    console.error('Stack:', err.stack);
    return;
  }

  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map(err => err.message)
      .join(', ');
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    statusCode = 400;
    message = `${Object.keys(err.keyPattern)[0]} already exists`;
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: message,
  });
};

module.exports = errorHandler;
