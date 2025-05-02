import mongoose, {Document, Schema} from 'mongoose';

export type DiscountType = 'percentage' | 'fixed' | 'buyXgetY';

export interface IDiscount extends Document {
  code: string;
  type: DiscountType;
  value: number; // Percentage off or fixed amount off
  minOrderValue: number; // Minimum order value to apply discount
  applicableProducts: mongoose.Types.ObjectId[]; // Products this discount applies to (empty means all)
  applicableCategories: mongoose.Types.ObjectId[]; // Categories this discount applies to (empty means all)
  startDate: Date;
  endDate: Date;
  usageLimit: number; // How many times this code can be used in total
  usageCount: number; // How many times this code has been used
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // For buyXgetY discount type
  buyQuantity?: number; // Buy X quantity
  getQuantity?: number; // Get Y quantity free/discounted
  getDiscountValue?: number; // Discount value for Y items (percentage off)
}

const DiscountSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'buyXgetY'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    applicableProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    applicableCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // For buyXgetY discount type
    buyQuantity: {
      type: Number,
    },
    getQuantity: {
      type: Number,
    },
    getDiscountValue: {
      type: Number,
    },
  },
  {timestamps: true},
);

// Add indexes for efficient queries
DiscountSchema.index({code: 1});
DiscountSchema.index({isActive: 1});
DiscountSchema.index({startDate: 1, endDate: 1});

export default mongoose.model<IDiscount>('Discount', DiscountSchema);
