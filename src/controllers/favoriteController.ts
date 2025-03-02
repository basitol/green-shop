

import {Request, Response, NextFunction, RequestHandler} from 'express';
import Favorite from '../models/Favorite';
import {Product} from '../models/Product';
import {InferSchemaType} from 'mongoose';

type FavoriteType = InferSchemaType<typeof Favorite.schema>;

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Get the user's favorites
export const getFavorites: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<FavoriteType>>,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      res.status(401).json({success: false, message: 'User not authenticated'});
      return;
    }
    const favorites = await Favorite.findOne({user: req.user._id}).populate(
      'items.product',
    );
    if (!favorites) {
      res
        .status(404)
        .json({success: false, message: 'No favorites found for this user'});
      return;
    }
    res.status(200).json({
      success: true,
      data: favorites,
      message: 'Favorites retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving favorites',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Add a product to the user's favorites
export const addToFavorites: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<FavoriteType>>,
  next: NextFunction,
) => {
  const {productId} = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({success: false, message: 'Product not found'});
      return;
    }

    if (!req.user) {
      res.status(401).json({success: false, message: 'User not authenticated'});
      return;
    }

    let favorite = await Favorite.findOne({user: req.user._id});

    if (!favorite) {
      favorite = new Favorite({
        user: req.user._id,
        items: [],
      });
    }

    const existingItem = favorite.items.find(
      item => item.product.toString() === productId,
    );
    if (existingItem) {
      res
        .status(400)
        .json({success: false, message: 'Product is already in favorites'});
      return;
    }

    favorite.items.push({product: productId});
    await favorite.save();

    res.status(201).json({
      success: true,
      data: favorite,
      message: 'Product added to favorites',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding product to favorites',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Remove a product from the user's favorites
export const removeFromFavorites: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<FavoriteType>>,
  next: NextFunction,
) => {
  const {productId} = req.params;

  try {
    if (!req.user) {
      res.status(401).json({success: false, message: 'User not authenticated'});
      return;
    }

    const favorite = await Favorite.findOne({user: req.user._id});
    if (!favorite) {
      res.status(404).json({success: false, message: 'Favorites not found'});
      return;
    }

    favorite.items = favorite.items.filter(
      item => item.product.toString() !== productId,
    );
    await favorite.save();

    res.status(200).json({
      success: true,
      data: favorite,
      message: 'Product removed from favorites',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing product from favorites',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Clear all items from the user's favorites
export const clearFavorites: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<FavoriteType>>,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      res.status(401).json({success: false, message: 'User not authenticated'});
      return;
    }

    const favorite = await Favorite.findOneAndUpdate(
      {user: req.user._id},
      {items: []},
      {new: true},
    );

    if (!favorite) {
      res.status(404).json({success: false, message: 'Favorites not found'});
      return;
    }

    res.status(200).json({
      success: true,
      data: favorite,
      message: 'Favorites cleared successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing favorites',
      error: (error as Error).message,
    });
    next(error);
  }
};
