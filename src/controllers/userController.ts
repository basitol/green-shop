// import {Request, Response, NextFunction, RequestHandler} from 'express';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import User from '../models/User';

// interface AuthenticatedRequest extends Request {
//   user?: {
//     _id: string;
//     id: string;
//     role: string;
//   };
// }

// type AuthenticatedRequestHandler = RequestHandler<
//   {},
//   any,
//   any,
//   any,
//   {user?: {_id: string; id: string; role: string}}
// >;

// export const register: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const {username, email, password, role, adminCreationToken} = req.body;

//     if (!username || !email || !password) {
//       res.status(400).json({message: 'All fields are required'});
//       return;
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({$or: [{email}, {username}]});
//     if (existingUser) {
//       res.status(400).json({message: 'User already exists'});
//       return;
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     let userRole = 'user';

//     // Check if attempting to create an admin
//     if (role === 'admin') {
//       // Verify admin creation token
//       if (!adminCreationToken) {
//         res.status(403).json({message: 'Admin creation token required'});
//         return;
//       }
//       try {
//         jwt.verify(
//           adminCreationToken,
//           process.env.ADMIN_CREATION_SECRET as string,
//         );
//         userRole = 'admin';
//       } catch (error) {
//         res.status(403).json({message: 'Invalid admin creation token'});
//         return;
//       }
//     }

//     // Create new user
//     const newUser = new User({
//       username,
//       email,
//       password: hashedPassword,
//       role: userRole,
//     });

//     await newUser.save();

//     res.status(201).json({message: 'User registered successfully'});
//   } catch (error) {
//     console.error('Registration error:', error);
//     next(error);
//   }
// };

// export const login: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const {email, password} = req.body;

//     if (!email || !password) {
//       res.status(400).json({message: 'Email and password are required'});
//       return;
//     }

//     // Check if user exists
//     const user = await User.findOne({email});
//     if (!user) {
//       res.status(400).json({message: 'Invalid credentials'});
//       return;
//     }

//     // Check password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       res.status(400).json({message: 'Invalid credentials'});
//       return;
//     }

//     // Generate JWT
//     const token = jwt.sign(
//       {id: user._id, role: user.role},
//       process.env.JWT_SECRET as string,
//       {expiresIn: '1d'},
//     );

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     next(error);
//   }
// };

// // Function to generate admin creation token
// // Function to generate admin creation token
// export const generateAdminCreationToken: AuthenticatedRequestHandler = async (
//   req,
//   res,
//   next,
// ) => {
//   try {
//     if (req.user?.role !== 'admin') {
//       res.status(403).json({message: 'Access denied. Admin only.'});
//       return;
//     }

//     const token = jwt.sign(
//       {purpose: 'admin_creation'},
//       process.env.ADMIN_CREATION_SECRET as string,
//       {expiresIn: '1h'},
//     );

//     res.json({adminCreationToken: token});
//   } catch (error) {
//     console.error('Admin creation token generation error:', error);
//     next(error);
//   }
// };

// // export const register: RequestHandler = async (
// //   req: Request,
// //   res: Response,
// //   next: NextFunction,
// // ) => {
// //   try {
// //     const {username, email, password, role} = req.body;

// //     if (!username || !email || !password) {
// //       res.status(400).json({message: 'All fields are required'});
// //       return;
// //     }

// //     // Check if user already exists
// //     const existingUser = await User.findOne({$or: [{email}, {username}]});
// //     if (existingUser) {
// //       res.status(400).json({message: 'User already exists'});
// //       return;
// //     }

// //     // Hash password
// //     const salt = await bcrypt.genSalt(10);
// //     const hashedPassword = await bcrypt.hash(password, salt);

// //     // Create new user
// //     const newUser = new User({
// //       username,
// //       email,
// //       password: hashedPassword,
// //       role:
// //         role === 'admin' && (req as AuthenticatedRequest).user?.role === 'admin'
// //           ? 'admin'
// //           : 'user',
// //     });

// //     await newUser.save();

// //     res.status(201).json({message: 'User registered successfully'});
// //   } catch (error) {
// //     console.error('Registration error:', error);
// //     next(error);
// //   }
// // };

// // export const login: RequestHandler = async (
// //   req: Request,
// //   res: Response,
// //   next: NextFunction,
// // ) => {
// //   try {
// //     const {email, password} = req.body;

// //     if (!email || !password) {
// //       res.status(400).json({message: 'Email and password are required'});
// //       return;
// //     }

// //     // Check if user exists
// //     const user = await User.findOne({email});
// //     if (!user) {
// //       res.status(400).json({message: 'Invalid credentials'});
// //       return;
// //     }

// //     // Check password
// //     const isMatch = await bcrypt.compare(password, user.password);
// //     if (!isMatch) {
// //       res.status(400).json({message: 'Invalid credentials'});
// //       return;
// //     }

// //     // Generate JWT
// //     const token = jwt.sign(
// //       {id: user._id, role: user.role},
// //       process.env.JWT_SECRET as string,
// //       {expiresIn: '1d'},
// //     );

// //     res.json({
// //       token,
// //       user: {
// //         id: user._id,
// //         username: user.username,
// //         email: user.email,
// //         role: user.role,
// //       },
// //     });
// //   } catch (error) {
// //     console.error('Login error:', error);
// //     next(error);
// //   }
// // };

// export const getProfile: AuthenticatedRequestHandler = async (
//   req,
//   res,
//   next,
// ) => {
//   try {
//     if (!req.user?._id) {
//       res.status(401).json({message: 'Not authenticated'});
//       return;
//     }

//     const user = await User.findById(req.user._id).select('-password');
//     if (!user) {
//       res.status(404).json({message: 'User not found'});
//       return;
//     }
//     res.json(user);
//   } catch (error) {
//     console.error('Get profile error:', error);
//     next(error);
//   }
// };

// export const updateProfile: AuthenticatedRequestHandler = async (
//   req,
//   res,
//   next,
// ) => {
//   try {
//     if (!req.user?._id) {
//       res.status(401).json({message: 'Not authenticated'});
//       return;
//     }

//     const {username, email} = req.body;

//     if (!username && !email) {
//       res.status(400).json({message: 'No update data provided'});
//       return;
//     }

//     const user = await User.findByIdAndUpdate(
//       req.user._id,
//       {username, email},
//       {new: true, runValidators: true},
//     ).select('-password');

//     if (!user) {
//       res.status(404).json({message: 'User not found'});
//       return;
//     }

//     res.json(user);
//   } catch (error) {
//     console.error('Update profile error:', error);
//     next(error);
//   }
// };

import {Request, Response, NextFunction, RequestHandler} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    id: string;
    role: string;
  };
}

export type AuthenticatedRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => Promise<void> | void;

export const register: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {username, email, password, role, adminCreationToken} = req.body;

    if (!username || !email || !password) {
      res.status(400).json({message: 'All fields are required'});
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({$or: [{email}, {username}]});
    if (existingUser) {
      res.status(400).json({message: 'User already exists'});
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let userRole = 'user';

    // Check if attempting to create an admin
    if (role === 'admin') {
      // Verify admin creation token
      if (!adminCreationToken) {
        res.status(403).json({message: 'Admin creation token required'});
        return;
      }
      try {
        jwt.verify(
          adminCreationToken,
          process.env.ADMIN_CREATION_SECRET as string,
        );
        userRole = 'admin';
      } catch (error) {
        res.status(403).json({message: 'Invalid admin creation token'});
        return;
      }
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: userRole,
    });

    await newUser.save();

    res.status(201).json({message: 'User registered successfully'});
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

export const login: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {email, password} = req.body;

    if (!email || !password) {
      res.status(400).json({message: 'Email and password are required'});
      return;
    }

    // Check if user exists
    const user = await User.findOne({email});
    if (!user) {
      res.status(400).json({message: 'Invalid credentials'});
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({message: 'Invalid credentials'});
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      {id: user._id, role: user.role},
      process.env.JWT_SECRET as string,
      {expiresIn: '1d'},
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

export const generateAdminCreationToken: AuthenticatedRequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({message: 'Access denied. Admin only.'});
      return;
    }

    const token = jwt.sign(
      {purpose: 'admin_creation'},
      process.env.ADMIN_CREATION_SECRET as string,
      {expiresIn: '1h'},
    );

    res.json({adminCreationToken: token});
  } catch (error) {
    console.error('Admin creation token generation error:', error);
    next(error);
  }
};

export const getProfile: AuthenticatedRequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({message: 'Not authenticated'});
      return;
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      res.status(404).json({message: 'User not found'});
      return;
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    next(error);
  }
};

export const updateProfile: AuthenticatedRequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({message: 'Not authenticated'});
      return;
    }

    const {username, email} = req.body;

    if (!username && !email) {
      res.status(400).json({message: 'No update data provided'});
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {username, email},
      {new: true, runValidators: true},
    ).select('-password');

    if (!user) {
      res.status(404).json({message: 'User not found'});
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    next(error);
  }
};
