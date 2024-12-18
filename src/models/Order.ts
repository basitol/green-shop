// import mongoose, {Schema, Document, Types} from 'mongoose';

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

import mongoose, {Schema, Document, Types} from 'mongoose';

// Interface for shipping address
interface IShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

// Interface for order item
export interface IOrderItem {
  product: Types.ObjectId;
  name: string; // Store product name at time of order
  quantity: number;
  price: number; // Store price at time of order
  subtotal: number; // Price * quantity
}

// Interface for payment details
interface IPaymentDetails {
  provider: 'paypal';
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paidAmount: number;
  paidAt?: Date;
  refundedAmount?: number;
  refundedAt?: Date;
}

// Main Order interface
export interface IOrder extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  orderNumber: string; // Unique human-readable order identifier
  items: IOrderItem[];
  subtotal: number; // Sum of all items before tax/shipping
  tax: number;
  shippingCost: number;
  totalAmount: number; // Final amount including tax and shipping
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: IShippingAddress;
  payment: IPaymentDetails;
  notes?: string; // Optional notes for the order
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create schema for each sub-document
const ShippingAddressSchema = new Schema<IShippingAddress>({
  street: {type: String, required: true},
  city: {type: String, required: true},
  state: {type: String, required: true},
  zipCode: {type: String, required: true},
  country: {type: String, required: true},
  phone: {type: String, required: true},
});

const OrderItemSchema = new Schema<IOrderItem>({
  product: {type: Schema.Types.ObjectId, ref: 'Product', required: true},
  name: {type: String, required: true},
  quantity: {type: Number, required: true, min: 1},
  price: {type: Number, required: true, min: 0},
  subtotal: {type: Number, required: true, min: 0},
});

const PaymentDetailsSchema = new Schema<IPaymentDetails>({
  provider: {type: String, required: true, enum: ['paypal']},
  transactionId: {type: String, required: true},
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  paidAmount: {type: Number, required: true},
  paidAt: {type: Date},
  refundedAmount: {type: Number},
  refundedAt: {type: Date},
});

// Main Order schema
const OrderSchema = new Schema<IOrder>({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
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
  notes: {type: String},
  trackingNumber: {type: String},
  estimatedDeliveryDate: {type: Date},
  cancelledAt: {type: Date},
  cancelReason: {type: String},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now},
});

// Pre-save middleware to update timestamps
OrderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Generate unique order number
OrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${year}${month}-${(count + 1)
      .toString()
      .padStart(4, '0')}`;
  }
  next();
});

// Indexes for common queries
OrderSchema.index({user: 1, createdAt: -1});
OrderSchema.index({orderNumber: 1}, {unique: true});
OrderSchema.index({'payment.transactionId': 1}, {unique: true});
OrderSchema.index({status: 1, createdAt: -1});

// Calculate totals before saving
OrderSchema.pre('save', function (next) {
  if (this.isModified('items') || this.isNew) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.totalAmount = this.subtotal + this.tax + this.shippingCost;
  }
  next();
});

export default mongoose.model<IOrder>('Order', OrderSchema);
