import mongoose, {Document, Schema} from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'moderator' | 'admin' | 'superadmin';

export interface IUser extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  isVerified: boolean;
  resetToken?: string;
  resetTokenExpiry?: Date;
  lastLoginAttempt?: Date;
  loginAttempts: number;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
}

const UserSchema = new Schema(
  {
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin', 'superadmin'],
      default: 'user',
    },
    isVerified: {type: Boolean, default: true},
    resetToken: String,
    resetTokenExpiry: Date,
    lastLoginAttempt: Date,
    loginAttempts: {type: Number, default: 0},
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
UserSchema.pre('save', async function (this: any, next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password as string, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Add index for token expiry
UserSchema.index({resetTokenExpiry: 1}, {expireAfterSeconds: 0});

export default mongoose.model<IUser>('User', UserSchema);
