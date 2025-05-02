import mongoose, {Schema, Document, Types} from 'mongoose';

interface IOrderItem {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
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
  cancelReason?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
}

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    orderId: {type: String, required: true},
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {type: Number, required: true},
        price: {type: Number, required: true},
      },
    ],
    subtotal: {type: Number, required: true},
    discountCode: {type: String, default: null},
    discountAmount: {type: Number, default: 0},
    totalAmount: {type: Number, required: true},
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    shippingAddress: {
      street: {type: String, required: true},
      city: {type: String, required: true},
      state: {type: String, required: true},
      zipCode: {type: String, required: true},
      country: {type: String, required: true},
      phone: {type: String, required: true},
    },
    payment: {
      provider: {type: String, enum: ['paypal'], required: true},
      transactionId: {type: String, required: true},
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        required: true,
      },
      paidAmount: {type: Number, required: true},
      paidAt: {type: Date},
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      required: true,
    },
    cancelReason: {type: String},
    cancelledAt: {type: Date},
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IOrder>('Order', OrderSchema);
