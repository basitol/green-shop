import {Request, Response} from 'express';
import {Category} from '../models/Category';
import {catchAsyncErrors} from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/errorHandler';

// Create new category
export const createCategory = catchAsyncErrors(
  async (req: Request, res: Response) => {
    try {
      const category = await Category.create(req.body);

      res.status(201).json({
        success: true,
        category,
      });
    } catch (error) {
      // Check for duplicate key error (MongoDB error code 11000)
      if (error instanceof Error && 'code' in error && error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'A category with this name already exists',
        });
      }

      // Re-throw other errors to be handled by the global error handler
      throw error;
    }
  },
);

// Get all categories
export const getAllCategories = catchAsyncErrors(
  async (_req: Request, res: Response) => {
    const categories = await Category.find();

    res.status(200).json({
      success: true,
      categories,
    });
  },
);

// Get single category
export const getCategory = catchAsyncErrors(
  async (req: Request, res: Response) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new ErrorHandler('Category not found', 404);
    }

    res.status(200).json({
      success: true,
      category,
    });
  },
);

// Update category
export const updateCategory = catchAsyncErrors(
  async (req: Request, res: Response) => {
    let category = await Category.findById(req.params.id);

    if (!category) {
      throw new ErrorHandler('Category not found', 404);
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      category,
    });
  },
);

// Delete category
export const deleteCategory = catchAsyncErrors(
  async (req: Request, res: Response) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new ErrorHandler('Category not found', 404);
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  },
);
