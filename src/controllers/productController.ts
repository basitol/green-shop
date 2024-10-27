// import {Request, Response, NextFunction, RequestHandler} from 'express';
// import Product from '../models/Product';
// import Review from '../models/Review';
// import Order from '../models/Order';

// // Get all products
// export const getAllProducts: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const products = await Product.find();
//     res.json(products);
//   } catch (error) {
//     next(error);
//   }
// };

// export const getProductById: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       res.status(404).json({message: 'Product not found'});
//       return;
//     }
//     res.json(product);
//   } catch (error) {
//     next(error);
//   }
// };

// // Create new product
// export const createProduct: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   const {name, description, price, stock, colors} = req.body;

//   try {
//     const product = new Product({
//       name,
//       description,
//       price,
//       stock,
//       colors,
//     });
//     await product.save();
//     res.status(201).json(product);
//   } catch (error) {
//     next(error);
//   }
// };

// // Update product
// export const updateProduct: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   try {
//     const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//     });
//     if (!product) {
//       res.status(404).json({message: 'Product not found'});
//       return;
//     }
//     res.json(product);
//   } catch (error) {
//     next(error);
//   }
// };

// // Delete product
// export const deleteProduct: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   try {
//     const product = await Product.findByIdAndDelete(req.params.id);
//     if (!product) {
//       res.status(404).json({message: 'Product not found'});
//       return;
//     }
//     res.json({message: 'Product deleted successfully'});
//   } catch (error) {
//     next(error);
//   }
// };

// // Review an item
// export const submitReview: RequestHandler = async (req, res, next) => {
//   try {
//     const {productId} = req.params;
//     const {rating, reviewText} = req.body;
//     const userId = req.user?._id;

//     // Check if user has purchased the product
//     const order = await Order.findOne({
//       user: userId,
//       'items.product': productId,
//       status: 'completed',
//     });

//     if (!order) {
//       res
//         .status(403)
//         .json({message: 'You can only review products you have purchased'});
//       return;
//     }

//     // Check if user has already reviewed this product
//     const existingReview = await Review.findOne({
//       user: userId,
//       product: productId,
//     });

//     if (existingReview) {
//       res.status(400).json({message: 'You have already reviewed this product'});
//       return;
//     }

//     // Create new review
//     const review = new Review({
//       user: userId,
//       product: productId,
//       rating,
//       reviewText,
//     });

//     await review.save();

//     // Update product's rating and review count
//     await Product.findByIdAndUpdate(productId, {
//       $inc: {totalReviews: 1, sumRatings: rating},
//     });

//     res.status(201).json(review);
//   } catch (error) {
//     next(error);
//   }
// };

import {Request, Response, NextFunction, RequestHandler} from 'express';
import Product from '../models/Product';
import Review from '../models/Review';
import Order from '../models/Order';
import {InferSchemaType} from 'mongoose';

type ProductType = InferSchemaType<typeof Product.schema>;
type ReviewType = InferSchemaType<typeof Review.schema>;

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Get all products
export const getAllProducts: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<ProductType[]>>,
  next: NextFunction,
) => {
  try {
    const products = await Product.find();
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

// Create new product
export const createProduct: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<ProductType>>,
  next: NextFunction,
) => {
  const {name, description, price, stock, colors} = req.body;

  try {
    const product = new Product({
      name,
      description,
      price,
      stock,
      colors,
    });
    await product.save();
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Update product
export const updateProduct: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<ProductType>>,
  next: NextFunction,
) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) {
      res.status(404).json({success: false, message: 'Product not found'});
      return;
    }
    res.status(200).json({
      success: true,
      data: product,
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

// Delete product
export const deleteProduct: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<null>>,
  next: NextFunction,
) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({success: false, message: 'Product not found'});
      return;
    }
    res
      .status(200)
      .json({success: true, message: 'Product deleted successfully'});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Submit a review for a product
export const submitReview: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<ReviewType>>,
  next: NextFunction,
) => {
  try {
    const {productId} = req.params;
    const {rating, reviewText} = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({success: false, message: 'User not authenticated'});
      return;
    }

    const order = await Order.findOne({
      user: userId,
      'items.product': productId,
      status: 'completed',
    });

    if (!order) {
      res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased',
      });
      return;
    }

    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
    });
    if (existingReview) {
      res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
      return;
    }

    const review = new Review({
      user: userId,
      product: productId,
      rating,
      reviewText,
    });

    await review.save();

    await Product.findByIdAndUpdate(productId, {
      $inc: {totalReviews: 1, sumRatings: rating},
    });

    res.status(201).json({
      success: true,
      data: review,
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
