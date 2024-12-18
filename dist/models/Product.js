"use strict";
// import mongoose, {Document, Schema} from 'mongoose';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
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
const mongoose_1 = __importStar(require("mongoose"));
const ProductSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    color: { type: String, required: true },
    storage: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    mainImage: { type: String, required: true }, // Changed to String type
    images: [{ type: String }], // Changed to array of Strings
}, { timestamps: true });
exports.Product = mongoose_1.default.model('Product', ProductSchema);
