// Product controller types and imports
import {Request, Response, NextFunction, RequestHandler} from 'express';
import {IProduct, Product} from '../models/Product';
import {InferSchemaType} from 'mongoose';
import cloudinary from '../config/cloudinary';
import fileUpload from 'express-fileupload';
import {ParamsDictionary} from 'express-serve-static-core';
import {ParsedQs} from 'qs';
import {Category} from '../models/Category';
import {catchAsyncErrors} from '../middleware/catchAsyncErrors';

type ProductType = InferSchemaType<typeof Product.schema>;

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Fixed TypeScript interface for RequestHandler with params
// Fixed RequestWithParams interface to properly extend Express Request
interface RequestWithParams<P extends ParamsDictionary>
  extends Request<P, any, any, ParsedQs, Record<string, any>> {
  params: P;
}

// Use with specific params type
type ProductParams = ParamsDictionary & {
  id: string;
};
// Get all products
export const getAllProducts: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<ProductType[]>>,
  next: NextFunction,
) => {
  try {
    const products = await Product.find().populate(
      'category',
      'name description',
    );
    res.status(200).json({
      success: true,
      data: products,
      message: 'Products retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving products',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Get product by ID
export const getProductById: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<ProductType>>,
  next: NextFunction,
) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({success: false, message: 'Product not found'});
      return;
    }
    res.status(200).json({
      success: true,
      data: product,
      message: 'Product retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving product',
      error: (error as Error).message,
    });
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response<ApiResponse<IProduct>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const {name, description, color, storage, price, stock, category} =
      req.body;

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID',
      });
      return;
    }

    // Type check for files
    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Main image is required',
      });
      return;
    }

    const files = req.files as fileUpload.FileArray;
    const mainImageFile = files.mainImage as fileUpload.UploadedFile;

    if (!mainImageFile) {
      res.status(400).json({
        success: false,
        message: 'Main image is required',
      });
      return;
    }

    // Upload main image to Cloudinary
    const mainImageUpload = await cloudinary.uploader.upload(
      mainImageFile.tempFilePath,
      {
        folder: 'products',
        transformation: [{width: 1000, height: 1000, crop: 'limit'}],
      },
    );

    let images: string[] = [];

    // Handle additional images if they exist
    if (files.images) {
      const imageFiles = Array.isArray(files.images)
        ? files.images
        : [files.images];

      // Upload additional images
      for (const file of imageFiles) {
        const result = await cloudinary.uploader.upload(
          (file as fileUpload.UploadedFile).tempFilePath,
          {
            folder: 'products',
            transformation: [{width: 1000, height: 1000, crop: 'limit'}],
          },
        );
        images.push(result.secure_url);
      }
    }

    // Create product with uploaded images
    const product = new Product({
      name,
      description,
      color,
      storage,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      mainImage: mainImageUpload.secure_url,
      images,
      category,
    });

    await product.save();

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('Error in createProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong while creating the product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateProduct: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<ProductType>>,
  next: NextFunction,
) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new: true},
    );

    if (!updatedProduct) {
      res.status(404).json({success: false, message: 'Product not found'});
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: (error as Error).message,
    });
    next(error);
  }
};

export const updateProductImages: RequestHandler<{id: string}> = async (
  req: RequestWithParams<{id: string}>,
  res: Response<ApiResponse<IProduct>>,
  next: NextFunction,
) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).json({
        success: false,
        message: 'No images provided for update',
      });
      return;
    }

    const files = req.files as fileUpload.FileArray;

    // Handle main image update
    if (files.mainImage) {
      const mainImageFile = files.mainImage as fileUpload.UploadedFile;

      // Upload new main image
      const mainImageUpload = await cloudinary.uploader.upload(
        mainImageFile.tempFilePath,
        {
          folder: 'products',
          transformation: [{width: 1000, height: 1000, crop: 'limit'}],
        },
      );

      // Update product with new main image URL
      product.mainImage = mainImageUpload.secure_url;
    }

    // Handle additional images update
    if (files.images) {
      const imageFiles = Array.isArray(files.images)
        ? files.images
        : [files.images];

      // Upload new additional images
      const newImages: string[] = [];
      for (const file of imageFiles) {
        const result = await cloudinary.uploader.upload(
          (file as fileUpload.UploadedFile).tempFilePath,
          {
            folder: 'products',
            transformation: [{width: 1000, height: 1000, crop: 'limit'}],
          },
        );

        newImages.push(result.secure_url);
      }

      // Update product with new image URLs
      product.images = newImages;
    }

    await product.save();

    res.status(200).json({
      success: true,
      data: product,
      message: 'Product images updated successfully',
    });
  } catch (error) {
    console.error('Error in updateProductImages:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product images',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
};

export const deleteProduct: RequestHandler<{id: string}> = async (
  req: RequestWithParams<{id: string}>,
  res: Response<ApiResponse<null>>,
  next: NextFunction,
) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({success: false, message: 'Product not found'});
      return;
    }

    // Delete images from Cloudinary
    if (product.mainImage) {
      await cloudinary.uploader.destroy(product.mainImage);
    }

    for (const image of product.images) {
      if (image) {
        await cloudinary.uploader.destroy(image);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product and associated images deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
};

export const submitReview: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<ProductType>>,
  next: NextFunction,
) => {
  try {
    const {productId} = req.params;
    const {rating} = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({success: false, message: 'User not authenticated'});
      return;
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({success: false, message: 'Product not found'});
      return;
    }

    // Update product rating
    product.rating =
      (product.rating * product.totalReviews + rating) /
      (product.totalReviews + 1);
    product.totalReviews += 1;

    await product.save();

    res.status(201).json({
      success: true,
      data: product,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting review',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Add this new function to get products by category
export const getProductsByCategory = catchAsyncErrors(
  async (req: Request, res: Response<ApiResponse<ProductType[]>>) => {
    try {
      const categoryId = req.params.categoryId;
      const {sort, minPrice, maxPrice} = req.query;

      // Verify category exists
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      // Build query
      let query = Product.find({category: categoryId});

      // Apply price filters if provided
      if (minPrice || maxPrice) {
        const priceFilter: {$gte?: number; $lte?: number} = {};
        if (minPrice) priceFilter.$gte = Number(minPrice);
        if (maxPrice) priceFilter.$lte = Number(maxPrice);
        query = query.where('price').equals(priceFilter);
      }

      // Apply sorting if provided
      if (sort) {
        const sortOrder = sort === 'desc' ? -1 : 1;
        query = query.sort({price: sortOrder});
      }

      // Execute query with category population
      const products = await query.populate('category', 'name description');

      res.status(200).json({
        success: true,
        data: products,
        message: `Products in category: ${category.name}`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving products',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
);
