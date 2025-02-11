class ErrorHandler extends Error {
  statusCode: number;
  success: boolean;
  error: string;
  timestamp: string;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.error = message;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  // Helper method to create a standardized error response
  toJSON() {
    return {
      success: this.success,
      message: this.message,
      // error: this.error,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && {stack: this.stack}),
    };
  }
}

// Helper function to create common error types
export const createError = {
  badRequest: (message: string) => new ErrorHandler(message, 400),
  unauthorized: (message: string) => new ErrorHandler(message, 401),
  forbidden: (message: string) => new ErrorHandler(message, 403),
  notFound: (message: string) => new ErrorHandler(message, 404),
  internal: (message: string) => new ErrorHandler(message, 500),
};

export default ErrorHandler;
