// import {Request, Response, NextFunction, RequestHandler} from 'express';
// import User from '../models/User';

// export const getAllUsers: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const users = await User.find().select('-password');
//     res.json(users);
//   } catch (error) {
//     next(error);
//   }
// };

// export const deleteUser: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const user = await User.findByIdAndDelete(req.params.id);
//     if (!user) {
//       res.status(404).json({message: 'User not found'});
//       return;
//     }
//     res.json({message: 'User deleted successfully'});
//   } catch (error) {
//     next(error);
//   }
// };

import {Request, Response, NextFunction, RequestHandler} from 'express';
import User from '../models/User';
import {InferSchemaType} from 'mongoose';

type UserType = InferSchemaType<typeof User.schema>;

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export const getAllUsers: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<UserType[]>>,
  next: NextFunction,
) => {
  try {
    const users = await User.find().select('-password');
    if (!users.length) {
      res.status(404).json({
        success: false,
        message: 'No users found in the database.',
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: users,
      message: `${users.length} user(s) retrieved successfully.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users. Please try again later.',
      error: (error as Error).message,
    });
    next(error);
  }
};

export const deleteUser: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<{userId: string}>>,
  next: NextFunction,
) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found with the specified ID.',
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
      data: {userId: req.params.id},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user. Please try again later.',
      error: (error as Error).message,
    });
    next(error);
  }
};
