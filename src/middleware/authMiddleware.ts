import {Request, Response, NextFunction, RequestHandler} from 'express';
import jwt from 'jsonwebtoken';
import User, {IUser} from '../models/User';

interface CustomRequest extends Request {
  user?: IUser;
}

export const authenticate: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({message: 'No authentication token, access denied'});
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({message: 'User not found'});
      return;
    }

    (req as CustomRequest).user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({message: 'Invalid token'});
      return;
    }
    res.status(500).json({message: 'Server error during authentication'});
  }
};

export const authorizeRoles = (...roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const customReq = req as CustomRequest;
    if (!customReq.user) {
      res.status(401).json({message: 'Authentication required'});
      return;
    }
    if (!roles.includes(customReq.user.role)) {
      res
        .status(403)
        .json({message: 'Access denied. Insufficient permissions.'});
      return;
    }
    next();
  };
};

export const authorizeAdmin = authorizeRoles('admin');

export const refreshToken: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const {refreshToken} = req.body;
    if (!refreshToken) {
      res.status(400).json({message: 'Refresh token is required'});
      return;
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
    ) as {
      id: string;
    };
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({message: 'User not found'});
      return;
    }

    const accessToken = jwt.sign(
      {id: user._id},
      process.env.JWT_SECRET as string,
      {expiresIn: '15m'},
    );

    res.json({accessToken});
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({message: 'Invalid refresh token'});
      return;
    }
    res.status(500).json({message: 'Server error during token refresh'});
  }
};
