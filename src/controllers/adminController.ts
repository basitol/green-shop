import {Request, Response, NextFunction, RequestHandler} from 'express';
import User from '../models/User';

export const getAllUsers: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const deleteUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({message: 'User not found'});
      return;
    }
    res.json({message: 'User deleted successfully'});
  } catch (error) {
    next(error);
  }
};
