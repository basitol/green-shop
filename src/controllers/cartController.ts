import {Request, Response, NextFunction, RequestHandler} from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';

// Get cart for a specific user
export const getCart: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({message: 'Unauthorized'});
      return;
    }

    const cart = await Cart.findOne({user: req.user._id}).populate(
      'items.product',
    );
    if (!cart) {
      res.status(404).json({message: 'Cart not found'});
      return;
    }
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

// Add item to cart
export const addToCart: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({message: 'Unauthorized'});
      return;
    }

    const {productId, quantity} = req.body;
    let cart = await Cart.findOne({user: req.user._id});

    if (!cart) {
      cart = new Cart({user: req.user._id, items: []});
    }

    const existingItem = cart.items.find(
      item => item.product.toString() === productId,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const product = await Product.findById(productId); // Fetch product to get the price
      if (!product) {
        res.status(404).json({message: 'Product not found'}); // Handle product not found
        return;
      }
      cart.items.push({product: productId, quantity, price: product.price}); // Include price
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

// Update item quantity in the cart
export const updateCartItem: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const {productId, quantity} = req.body;

  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({message: 'User not authenticated'});
      return;
    }
    const cart = await Cart.findOne({user: req.user._id});
    if (!cart) {
      res.status(404).json({message: 'Cart not found'});
      return;
    }

    const item = cart.items.find(item => item.product.toString() === productId);
    if (!item) {
      res.status(404).json({message: 'Item not found in cart'});
      return;
    }

    item.quantity = quantity;

    await cart.save();
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

// Remove item from cart
export const removeFromCart: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const {productId} = req.params;

  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({message: 'User not authenticated'});
      return;
    }
    const cart = await Cart.findOne({user: req.user._id});
    if (!cart) {
      res.status(404).json({message: 'Cart not found'});
      return;
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId,
    );

    await cart.save();
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

// Clear the cart
export const clearCart: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    console.log(req.user);
    if (!req.user || !req.user._id) {
      res.status(401).json({message: 'User not authenticated'});
      return;
    }

    const cart = await Cart.findOneAndUpdate(
      {user: req.user._id},
      {items: []},
      {new: true},
    );
    if (!cart) {
      res.status(404).json({message: 'Cart not found'});
      return;
    }

    res.json(cart);
  } catch (error) {
    next(error);
  }
};
