// import mongoose, {Document, Schema} from 'mongoose';

// interface IImage {
//   public_id: string;
//   url: string;
// }

// interface IProduct extends Document {
//   name: string;
//   description: string;
//   color: string;
//   storage: string;
//   price: number;
//   stock: number;
//   rating: number;
//   totalReviews: number;
//   images: IImage[];
//   mainImage: IImage;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const ImageSchema: Schema = new Schema({
//   public_id: {type: String, required: true},
//   url: {type: String, required: true},
// });

// const ProductSchema: Schema = new Schema(
//   {
//     name: {type: String, required: true},
//     description: {type: String, required: true},
//     color: {type: String, required: true},
//     storage: {type: String, required: true},
//     price: {type: Number, required: true},
//     stock: {type: Number, required: true},
//     rating: {type: Number, default: 0},
//     totalReviews: {type: Number, default: 0},
//     mainImage: {type: ImageSchema, required: true},
//     images: [ImageSchema],
//   },
//   {timestamps: true},
// );

// export const Product = mongoose.model<IProduct>('Product', ProductSchema);
// export type {IProduct, IImage};

// src/models/Product.ts
import mongoose, {Document, Schema} from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  color: string;
  storage: string;
  price: number;
  discountPrice?: number | null; // Discounted price if any
  discountStartDate?: Date | null;
  discountEndDate?: Date | null;
  stock: number;
  rating: number;
  totalReviews: number;
  images: string[]; // Changed to string array for URLs only
  mainImage: string; // Changed to string for URL only
  category: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: {type: String, required: true},
    description: {type: String, required: true},
    color: {type: String, required: true},
    storage: {type: String, required: false},
    price: {type: Number, required: true},
    discountPrice: {type: Number, default: null},
    discountStartDate: {type: Date, default: null},
    discountEndDate: {type: Date, default: null},
    stock: {type: Number, required: true},
    rating: {type: Number, default: 0},
    totalReviews: {type: Number, default: 0},
    mainImage: {type: String, required: true}, // Changed to String type
    images: [{type: String}], // Changed to array of Strings
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },
  },
  {timestamps: true},
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
