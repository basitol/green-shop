import {Request, Response, NextFunction, ErrorRequestHandler} from 'express';
import ErrorHandler from '../utils/errorHandler';

export const errorHandler: ErrorRequestHandler = (
  err: Error | ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // Handle custom error
  if (err instanceof ErrorHandler) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Handle mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: 'Resource not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'Authentication failed',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle JWT expiration
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
      error: 'Authentication failed',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {stack: err.stack}),
  });
};
