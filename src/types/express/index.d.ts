import {Express} from 'express-serve-static-core';
import { IUser } from '../../models/User';

declare global {
  namespace Express {
    // This augments the Request interface in Express
    interface Request {
      user?: IUser | null;
    }
  }
}

export {};
