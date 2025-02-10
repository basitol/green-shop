import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import ErrorHandler from '../utils/errorHandler';
import {catchAsyncErrors} from './catchAsyncErrors';

interface JwtPayload {
  id: string;
}

interface CustomRequest extends Request {
  user?: any;
}

// Check if user is authenticated
export const isAuthenticatedUser = catchAsyncErrors(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const {token} = req.cookies;

    if (!token) {
      return next(new ErrorHandler('Login first to access this resource', 401));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;
    req.user = await User.findById(decoded.id);

    next();
  },
);

// Handling users roles
export const authorizeRoles = (...roles: string[]) => {
  return (req: CustomRequest, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role (${req.user.role}) is not allowed to access this resource`,
          403,
        ),
      );
    }
    next();
  };
};
