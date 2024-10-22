import {Request, Response, NextFunction, RequestHandler} from 'express';
import Product from '../models/Product';
import Review from '../models/Review';
import Order from '../models/Order';

// Get all products
export const getAllProducts: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const getProductById: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({message: 'Product not found'});
      return;
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// Create new product
export const createProduct: RequestHandler = async (
  req: Request,
  res: Response,
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
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// Update product
export const updateProduct: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) {
      res.status(404).json({message: 'Product not found'});
      return;
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// Delete product
export const deleteProduct: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({message: 'Product not found'});
      return;
    }
    res.json({message: 'Product deleted successfully'});
  } catch (error) {
    next(error);
  }
};

// Review an item
export const submitReview: RequestHandler = async (req, res, next) => {
  try {
    const {productId} = req.params;
    const {rating, reviewText} = req.body;
    const userId = req.user?._id;

    // Check if user has purchased the product
    const order = await Order.findOne({
      user: userId,
      'items.product': productId,
      status: 'completed',
    });

    if (!order) {
      res
        .status(403)
        .json({message: 'You can only review products you have purchased'});
      return;
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
    });

    if (existingReview) {
      res.status(400).json({message: 'You have already reviewed this product'});
      return;
    }

    // Create new review
    const review = new Review({
      user: userId,
      product: productId,
      rating,
      reviewText,
    });

    await review.save();

    // Update product's rating and review count
    await Product.findByIdAndUpdate(productId, {
      $inc: {totalReviews: 1, sumRatings: rating},
    });

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};
