"use strict";
// import mongoose, {Schema, Document, Types} from 'mongoose';
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// export interface IOrderItem {
//   product: Types.ObjectId;
//   quantity: number;
//   price: number;
// }
// export interface IOrder extends Document {
//   _id: Types.ObjectId;
//   user: Types.ObjectId;
//   items: IOrderItem[];
//   totalAmount: number;
//   status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
//   shippingAddress: string;
//   paymentId: string;
//   createdAt: Date;
//   updatedAt: Date;
// }
// const OrderSchema: Schema = new Schema({
//   user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
//   items: [
//     {
//       product: {type: Schema.Types.ObjectId, ref: 'Product', required: true},
//       quantity: {type: Number, required: true},
//       price: {type: Number, required: true},
//     },
//   ],
//   totalAmount: {type: Number, required: true},
//   status: {
//     type: String,
//     enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
//     default: 'pending',
//   },
//   shippingAddress: {type: String, required: true},
//   paymentId: {type: String, required: true},
//   createdAt: {type: Date, default: Date.now},
//   updatedAt: {type: Date, default: Date.now},
// });
// export default mongoose.model<IOrder>('Order', OrderSchema);
const mongoose_1 = __importStar(require("mongoose"));
// Create schema for each sub-document
const ShippingAddressSchema = new mongoose_1.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
});
const OrderItemSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
});
const PaymentDetailsSchema = new mongoose_1.Schema({
    provider: { type: String, required: true, enum: ['paypal'] },
    transactionId: { type: String, required: true },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
    },
    paidAmount: { type: Number, required: true },
    paidAt: { type: Date },
    refundedAmount: { type: Number },
    refundedAt: { type: Date },
});
// Main Order schema
const OrderSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    items: [OrderItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0,
    },
    tax: {
        type: Number,
        required: true,
        min: 0,
    },
    shippingCost: {
        type: Number,
        required: true,
        min: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
        required: true,
    },
    shippingAddress: {
        type: ShippingAddressSchema,
        required: true,
    },
    payment: {
        type: PaymentDetailsSchema,
        required: true,
    },
    notes: { type: String },
    trackingNumber: { type: String },
    estimatedDeliveryDate: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
// Pre-save middleware to update timestamps
OrderSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Generate unique order number
OrderSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isNew) {
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const count = yield mongoose_1.default.model('Order').countDocuments();
            this.orderNumber = `ORD-${year}${month}-${(count + 1)
                .toString()
                .padStart(4, '0')}`;
        }
        next();
    });
});
// Indexes for common queries
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ 'payment.transactionId': 1 }, { unique: true });
OrderSchema.index({ status: 1, createdAt: -1 });
// Calculate totals before saving
OrderSchema.pre('save', function (next) {
    if (this.isModified('items') || this.isNew) {
        this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
        this.totalAmount = this.subtotal + this.tax + this.shippingCost;
    }
    next();
});
exports.default = mongoose_1.default.model('Order', OrderSchema);
