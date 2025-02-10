import mongoose, { Document, Schema } from 'mongoose';

interface ICategory extends Document {
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Category name is required'],
      unique: true,
      trim: true 
    },
    description: { 
      type: String, 
      required: [true, 'Category description is required'] 
    }
  },
  {
    timestamps: true
  }
);

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
