import {Request, Response, NextFunction, RequestHandler} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import User, {IUser, UserRole} from '../models/User';
import passwordValidator from 'password-validator';
import {EmailService} from '../services/emailService';
import ErrorHandler from '../utils/errorHandler';
import {catchAsyncErrors} from '../middleware/catchAsyncErrors';

const emailService = new EmailService();

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

// Define a type for user data without mongoose methods
export interface UserResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
  lastLoginAttempt?: Date;
  loginAttempts: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: string[];
}

// Password schema
const passwordSchema = new passwordValidator();
passwordSchema
  .is()
  .min(8)
  .is()
  .max(100)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .digits(1)
  .has()
  .symbols(1)
  .has()
  .not()
  .spaces();

// Response messages
const MESSAGES = {
  REGISTRATION: {
    SUCCESS: 'Registration successful! Welcome to Green Phone Shop.',
    FIELDS_REQUIRED: 'First name, last name, email, and password are required',
    INVALID_PASSWORD:
      'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
    EMAIL_EXISTS: 'Email already exists',
  },
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Unauthorized access',
    TOKEN_REQUIRED: 'Authentication token is required',
    INVALID_TOKEN: 'Invalid authentication token',
  },
  PASSWORD: {
    RESET_EMAIL_SENT: 'Password reset instructions sent to your email',
    RESET_SUCCESS: 'Password reset successful',
    INVALID_RESET_TOKEN: 'Invalid or expired reset token',
    TOKEN_REQUIRED: 'Reset token is required',
    EMAIL_REQUIRED: 'Email address is required',
    INVALID_PASSWORD:
      'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
    EMAIL_SERVICE_ERROR:
      'Unable to send password reset email. Please try again later.',
    EMAIL_SEND_ERROR:
      'Failed to send password reset email. Please try again later.',
  },
  PROFILE: {
    FETCH_SUCCESS: 'Profile retrieved successfully',
    UPDATE_SUCCESS: 'Profile updated successfully',
    NOT_FOUND: 'User profile not found',
  },
  ADMIN: {
    TOKEN_GENERATED: 'Admin creation token generated successfully',
  },
  RATE_LIMIT: {
    LOGIN: 'Too many login attempts. Please try again after 15 minutes',
    PASSWORD_RESET:
      'Too many password reset attempts. Please try again after 1 hour',
  },
  EMAIL: {
    SERVICE_ERROR: 'Email service is currently unavailable',
    SEND_ERROR: 'Failed to send email. Please try again later.',
  },
};

// Rate limiter for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // 5 attempts per window
  message: {success: false, message: MESSAGES.RATE_LIMIT.LOGIN},
});

// Rate limiter for password reset attempts
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {success: false, message: MESSAGES.RATE_LIMIT.PASSWORD_RESET},
});

// Register user
export const register: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<UserResponse>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const {firstName, lastName, email, password, adminToken} = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({
        success: false,
        message:
          'Missing required fields. Please provide firstName, lastName, email, and password.',
        error: 'VALIDATION_ERROR',
      });
      return;
    }

    // Determine user role - check for admin token
    let role: UserRole = 'user';

    if (adminToken) {
      try {
        // Verify admin token
        const decoded = jwt.verify(
          adminToken,
          process.env.ADMIN_CREATION_SECRET as string,
        );

        if (decoded && (decoded as any).purpose === 'admin_creation') {
          role = 'admin';
          console.log('Admin account creation authorized');
        }
      } catch (error) {
        console.error('Invalid admin token:', error);
        // Continue with user registration, just not as admin
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
        error: 'INVALID_EMAIL',
      });
      return;
    }

    // Validate password strength
    if (!passwordSchema.validate(password)) {
      res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.',
        error: 'WEAK_PASSWORD',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({email});
    if (existingUser) {
      res.status(409).json({
        success: false,
        message:
          'An account with this email already exists. Please use a different email or try logging in.',
        error: 'EMAIL_EXISTS',
      });
      return;
    }

    // Create new user with determined role
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role, // Use the determined role
      isVerified: true,
    });

    try {
      await user.save();
    } catch (saveError: any) {
      // Handle mongoose validation errors
      if (saveError.name === 'ValidationError') {
        const validationErrors = Object.values(saveError.errors).map(
          (err: any) => err.message,
        );
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          details: validationErrors,
        });
        return;
      }
      throw saveError; // Re-throw other errors to be caught by the outer catch block
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(email, `${firstName} ${lastName}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue with registration even if email fails
    }

    const {password: _, ...userWithoutPassword} = user.toObject();

    res.status(201).json({
      success: true,
      data: userWithoutPassword as UserResponse,
      message: `Welcome ${firstName}! Your account has been created successfully.`,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message:
        'An unexpected error occurred during registration. Please try again later.',
      error: 'SERVER_ERROR',
    });
  }
};

// Login a user
export const login: RequestHandler = async (
  req: Request,
  res: Response<
    ApiResponse<{
      token: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
      };
    }>
  >,
  next: NextFunction,
): Promise<void> => {
  try {
    const {email, password} = req.body;

    if (!email || !password) {
      res
        .status(400)
        .json({success: false, message: MESSAGES.AUTH.INVALID_CREDENTIALS});
      return;
    }

    const user = await User.findOne({email}).select('+password');
    if (!user) {
      res
        .status(401)
        .json({success: false, message: MESSAGES.AUTH.INVALID_CREDENTIALS});
      return;
    }

    // console.log('Found user:', {
    //   email: user.email,
    //   hashedPassword: user.password,
    // });

    const isMatch = await bcrypt.compare(password, user.password);
    // console.log('Password comparison:', {isMatch, providedPassword: password});

    if (!isMatch) {
      res
        .status(401)
        .json({success: false, message: MESSAGES.AUTH.INVALID_CREDENTIALS});
      return;
    }

    const token = jwt.sign(
      {id: user._id, role: user.role},
      process.env.JWT_SECRET as string,
      {expiresIn: '1d'},
    );

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json({
      success: true,
      message: MESSAGES.AUTH.LOGIN_SUCCESS,
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
};

// Generate admin creation token
export const generateAdminCreationToken: AuthenticatedRequestHandler = async (
  req,
  res,
  next,
): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res
        .status(403)
        .json({success: false, message: MESSAGES.AUTH.UNAUTHORIZED});
      return;
    }

    const token = jwt.sign(
      {purpose: 'admin_creation'},
      process.env.ADMIN_CREATION_SECRET as string,
      {expiresIn: '1h'},
    );

    res.json({
      success: true,
      message: MESSAGES.ADMIN.TOKEN_GENERATED,
      data: {adminCreationToken: token},
    });
  } catch (error) {
    console.error('Admin creation token generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate admin creation token',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Get user profile
export const getProfile: AuthenticatedRequestHandler = async (
  req,
  res,
  next,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res
        .status(401)
        .json({success: false, message: MESSAGES.AUTH.UNAUTHORIZED});
      return;
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      res
        .status(404)
        .json({success: false, message: MESSAGES.PROFILE.NOT_FOUND});
      return;
    }
    res.json({
      success: true,
      message: MESSAGES.PROFILE.FETCH_SUCCESS,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Update user profile
export const updateProfile: AuthenticatedRequestHandler = async (
  req,
  res,
  next,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res
        .status(401)
        .json({success: false, message: MESSAGES.AUTH.UNAUTHORIZED});
      return;
    }

    const {firstName, lastName, email} = req.body;

    if (!firstName && !lastName && !email) {
      res
        .status(400)
        .json({success: false, message: 'No update data provided'});
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {firstName, lastName, email},
      {new: true, runValidators: true},
    ).select('-password');

    if (!user) {
      res
        .status(404)
        .json({success: false, message: MESSAGES.PROFILE.NOT_FOUND});
      return;
    }

    res.json({
      success: true,
      message: MESSAGES.PROFILE.UPDATE_SUCCESS,
      data: user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Forgot Password
export const forgotPassword = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const {email} = req.body;

    const user = await User.findOne({email});

    if (!user) {
      return next(new ErrorHandler('User not found with this email', 404));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and set to resetPasswordToken
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiry time
    user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await user.save({validateBeforeSave: false});

    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);

      res.status(200).json({
        success: true,
        message: `Email sent to: ${user.email}`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({validateBeforeSave: false});

      return next(new ErrorHandler('Email could not be sent', 500));
    }
  },
);

// Reset Password
export const resetPassword = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: {$gt: Date.now()},
    });

    if (!user) {
      return next(
        new ErrorHandler('Password reset token is invalid or has expired', 400),
      );
    }

    if (req.body.password !== req.body.confirmPassword) {
      return next(new ErrorHandler('Passwords do not match', 400));
    }

    // Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  },
);

// Admin: Get all users
export const getAllUsers: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<UserResponse[]>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const users = await User.find({});
    const usersWithoutPassword = users.map(user => {
      const {password, ...userWithoutPassword} = user.toObject();
      return userWithoutPassword as UserResponse;
    });

    res.status(200).json({
      success: true,
      data: usersWithoutPassword,
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Admin: Get user by ID
export const getUserById: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<UserResponse>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const {id} = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const {password, ...userWithoutPassword} = user.toObject();

    res.status(200).json({
      success: true,
      data: userWithoutPassword as UserResponse,
      message: 'User retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update user
export const updateUser: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<UserResponse>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const {firstName, lastName, email, role, isVerified} = req.body;
    const {id} = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
      return;
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Validate email uniqueness if it's being changed
    if (email && email !== user.email) {
      const existingUser = await User.findOne({email, _id: {$ne: id}});
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email is already in use',
        });
        return;
      }
    }

    // Update user fields
    const updateData: Partial<IUser> = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {$set: updateData},
      {new: true},
    );

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const {password, ...userWithoutPassword} = updatedUser.toObject();

    res.status(200).json({
      success: true,
      data: userWithoutPassword as UserResponse,
      message: 'User updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete user
export const deleteUser: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<null>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const {id} = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Prevent deletion of super admin
    if (user.role === 'superadmin') {
      res.status(403).json({
        success: false,
        message: 'Super admin account cannot be deleted',
      });
      return;
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update user role
export const updateUserRole: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<UserResponse>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const {role} = req.body;
    const {id} = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
      return;
    }

    // Validate role
    const validRoles: UserRole[] = ['user', 'moderator', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        message: `Invalid role specified. Valid roles are: ${validRoles.join(
          ', ',
        )}`,
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Prevent role change for super admin
    if (user.role === 'superadmin') {
      res.status(403).json({
        success: false,
        message: 'Super admin role cannot be modified',
      });
      return;
    }

    // Prevent elevation to super admin
    if (role === 'superadmin') {
      res.status(403).json({
        success: false,
        message: 'Cannot elevate user to super admin role',
      });
      return;
    }

    user.role = role;
    await user.save();

    const {password, ...userWithoutPassword} = user.toObject();

    res.status(200).json({
      success: true,
      data: userWithoutPassword as UserResponse,
      message: 'User role updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Create admin user (requires admin token)
export const createAdmin: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<UserResponse>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const {firstName, lastName, email, password, adminToken} = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !adminToken) {
      res.status(400).json({
        success: false,
        message: 'All fields and admin token are required',
        error: 'VALIDATION_ERROR',
      });
      return;
    }

    // Validate admin token
    try {
      const decoded = jwt.verify(
        adminToken,
        process.env.ADMIN_CREATION_SECRET as string,
      );

      if (
        !(decoded as any).purpose ||
        (decoded as any).purpose !== 'admin_creation'
      ) {
        res.status(401).json({
          success: false,
          message: 'Invalid admin creation token',
          error: 'UNAUTHORIZED',
        });
        return;
      }
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired admin creation token',
        error: 'UNAUTHORIZED',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
        error: 'INVALID_EMAIL',
      });
      return;
    }

    // Validate password strength
    if (!passwordSchema.validate(password)) {
      res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.',
        error: 'WEAK_PASSWORD',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({email});
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
        error: 'EMAIL_EXISTS',
      });
      return;
    }

    // Create admin user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'admin',
      isVerified: true,
    });

    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(email, `${firstName} ${lastName}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue with registration even if email fails
    }

    const {password: _, ...userWithoutPassword} = user.toObject();

    res.status(201).json({
      success: true,
      data: userWithoutPassword as UserResponse,
      message: `Admin account for ${firstName} created successfully.`,
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({
      success: false,
      message:
        'An unexpected error occurred during admin creation. Please try again later.',
      error: 'SERVER_ERROR',
    });
  }
};
