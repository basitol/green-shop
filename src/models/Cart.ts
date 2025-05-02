import mongoose, {Document, Schema} from 'mongoose';

interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number; // Adding price for each item in the cart
}

interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  subtotal: number; // To store the subtotal of the cart
  shipping: number; // To store shipping cost (0 for now)
  discountCode: string; // Store the applied discount code
  discountAmount: number; // Store the calculated discount amount
  total: number; // To store the total cost
}

const CartSchema: Schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  items: [
    {
      product: {type: Schema.Types.ObjectId, ref: 'Product', required: true},
      quantity: {type: Number, required: true, min: 1},
      price: {type: Number, required: true}, // Price of each item
    },
  ],
  subtotal: {type: Number, required: true, default: 0}, // Calculated field
  shipping: {type: Number, required: true, default: 0}, // Free shipping for now
  discountCode: {type: String, default: null}, // Applied discount code
  discountAmount: {type: Number, default: 0}, // Calculated discount amount
  total: {type: Number, required: true, default: 0}, // Calculated total (subtotal + shipping - discount)
});

// Middleware to calculate subtotal and total price before saving the cart
CartSchema.pre('save', function (next) {
  const cart = this as unknown as ICart; // Use 'unknown' first to avoid type error

  cart.subtotal = cart.items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0,
  );
  // Total = Subtotal + Shipping - Discount
  cart.total = cart.subtotal + cart.shipping - cart.discountAmount;

  next();
});

export default mongoose.model<ICart>('Cart', CartSchema);
