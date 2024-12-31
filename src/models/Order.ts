import mongoose, { Schema, Document, Types } from 'mongoose';

interface IOrderItem {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  payment: {
    provider: 'paypal';
    transactionId: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paidAmount: number;
    paidAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true }
  },
  payment: {
    provider: { type: String, enum: ['paypal'], required: true },
    transactionId: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      required: true
    },
    paidAmount: { type: Number, required: true },
    paidAt: { type: Date }
  }
}, {
  timestamps: true
});

export default mongoose.model<IOrder>('Order', OrderSchema);
