import { Request, Response, NextFunction } from 'express';

export const catchAsyncErrors = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
    // Don't return anything from this function
  };
};
