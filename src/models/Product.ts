import mongoose, {Document, Schema} from 'mongoose';

interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  stock: number;
  colors: string[]; // Multiple color options
  rating: number; // Average rating
  totalReviews: number; // Number of reviews
}

const ProductSchema: Schema = new Schema({
  name: {type: String, required: true},
  description: {type: String, required: true},
  price: {type: Number, required: true},
  stock: {type: Number, required: true},
  colors: {type: [String], required: true}, // List of color options
  rating: {type: Number, default: 0}, // Average rating (0-5 stars)
  totalReviews: {type: Number, default: 0}, // Total number of reviews
});

export default mongoose.model<IProduct>('Product', ProductSchema);
