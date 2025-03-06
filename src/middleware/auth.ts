import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import ErrorHandler, {createError} from '../utils/errorHandler';
import {catchAsyncErrors} from './catchAsyncErrors';

// Define the JWT payload type
interface JwtPayload {
  id: string;
}

// Check if user is authenticated
export const isAuthenticatedUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const bearerToken = req.headers.authorization;

    if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
      return next(
        createError.unauthorized('Please provide a valid bearer token'),
      );
    }

    const token = bearerToken.split(' ')[1];

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as JwtPayload;
      const user = await User.findById(decoded.id).select('_id role');

      if (!user) {
        return next(createError.unauthorized('User not found'));
      }

      req.user = {
        _id: user._id,
        role: user.role,
      };
      next();
    } catch (error) {
      return next(createError.unauthorized('Invalid or expired token'));
    }
  },
);

// Handling users roles
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(req.user);
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        createError.forbidden(
          `Access denied. ${
            req.user?.role || 'User'
          } is not authorized to access this resource`,
        ),
      );
    }
    next();
  };
};
