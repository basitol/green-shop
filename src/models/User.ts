import mongoose, {Document, Schema} from 'mongoose';

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

const UserSchema: Schema = new Schema({
  username: {type: String, required: true, unique: true},
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  role: {type: String, enum: ['user', 'admin'], default: 'user'},
});

export default mongoose.model<IUser>('User', UserSchema);
