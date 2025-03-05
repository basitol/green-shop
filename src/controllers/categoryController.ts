import {Request, Response} from 'express';
import {Category} from '../models/Category';
import {catchAsyncErrors} from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/errorHandler';
import {Product} from '../models/Product';

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
    const { id } = req.params;
    const { moveTo } = req.query; // New parameter to specify target category
    
    const category = await Category.findById(id);

    if (!category) {
      throw new ErrorHandler('Category not found', 404);
    }

    // Check if products are using this category
    const productsCount = await Product.countDocuments({ category: id });
    
    if (productsCount > 0) {
      // If moveTo parameter is provided, move products to that category
      if (moveTo) {
        // Verify target category exists
        const targetCategory = await Category.findById(moveTo);
        if (!targetCategory) {
          return res.status(400).json({
            success: false,
            message: 'Target category not found',
          });
        }
        
        // Move products to the target category
        await Product.updateMany(
          { category: id },
          { $set: { category: moveTo } }
        );
        
        console.log(`Moved ${productsCount} products to category ${moveTo}`);
      } else {
        // If no target category specified, prevent deletion
        return res.status(400).json({
          success: false,
          message: `Cannot delete category. ${productsCount} products are using this category. Use ?moveTo=categoryId to move products.`,
        });
      }
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: productsCount > 0 
        ? `Category deleted successfully. ${productsCount} products moved to new category.`
        : 'Category deleted successfully',
    });
  },
);
