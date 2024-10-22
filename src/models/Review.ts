import mongoose, {Schema, Document} from 'mongoose';

interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  rating: number;
  reviewText: string;
  createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  product: {type: Schema.Types.ObjectId, ref: 'Product', required: true},
  rating: {type: Number, required: true, min: 1, max: 5},
  reviewText: {type: String, required: true},
  createdAt: {type: Date, default: Date.now},
});

ReviewSchema.index({user: 1, product: 1}, {unique: true});

export default mongoose.model<IReview>('Review', ReviewSchema);
