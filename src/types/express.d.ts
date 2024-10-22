// In your types.d.ts or a similar file
// import {Document} from 'mongoose';
// import {IUser} from '../models/User';

// declare global {
//   namespace Express {
//     interface Request {
//       user?: IUser;
//     }
//   }
// }

// export {};

import {Document} from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        // Add other user properties as needed
      };
    }
  }
}
