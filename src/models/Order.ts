import mongoose, {Schema, Document} from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  paymentId: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  items: [
    {
      product: {type: Schema.Types.ObjectId, ref: 'Product', required: true},
      quantity: {type: Number, required: true},
      price: {type: Number, required: true},
    },
  ],
  totalAmount: {type: Number, required: true},
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  shippingAddress: {type: String, required: true},
  paymentId: {type: String, required: true},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now},
});

export default mongoose.model<IOrder>('Order', OrderSchema);
