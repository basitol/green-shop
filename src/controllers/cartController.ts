// import {Request, Response, NextFunction, RequestHandler} from 'express';
// import Cart from '../models/Cart';
// import Product from '../models/Product';

// // Get cart for a specific user
// export const getCart: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     if (!req.user || !req.user._id) {
//       res.status(401).json({message: 'Unauthorized'});
//       return;
//     }

//     const cart = await Cart.findOne({user: req.user._id}).populate(
//       'items.product',
//     );
//     if (!cart) {
//       res.status(404).json({message: 'Cart not found'});
//       return;
//     }
//     res.json(cart);
//   } catch (error) {
//     next(error);
//   }
// };

// // Add item to cart
// export const addToCart: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     if (!req.user || !req.user._id) {
//       res.status(401).json({message: 'Unauthorized'});
//       return;
//     }

//     const {productId, quantity} = req.body;
//     let cart = await Cart.findOne({user: req.user._id});

//     if (!cart) {
//       cart = new Cart({user: req.user._id, items: []});
//     }

//     const existingItem = cart.items.find(
//       item => item.product.toString() === productId,
//     );

//     if (existingItem) {
//       existingItem.quantity += quantity;
//     } else {
//       const product = await Product.findById(productId); // Fetch product to get the price
//       if (!product) {
//         res.status(404).json({message: 'Product not found'}); // Handle product not found
//         return;
//       }
//       cart.items.push({product: productId, quantity, price: product.price}); // Include price
//     }

//     await cart.save();
//     res.json(cart);
//   } catch (error) {
//     next(error);
//   }
// };

// // Update item quantity in the cart
// export const updateCartItem: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   const {productId, quantity} = req.body;

//   try {
//     if (!req.user || !req.user._id) {
//       res.status(401).json({message: 'User not authenticated'});
//       return;
//     }
//     const cart = await Cart.findOne({user: req.user._id});
//     if (!cart) {
//       res.status(404).json({message: 'Cart not found'});
//       return;
//     }

//     const item = cart.items.find(item => item.product.toString() === productId);
//     if (!item) {
//       res.status(404).json({message: 'Item not found in cart'});
//       return;
//     }

//     item.quantity = quantity;

//     await cart.save();
//     res.json(cart);
//   } catch (error) {
//     next(error);
//   }
// };

// // Remove item from cart
// export const removeFromCart: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   const {productId} = req.params;

//   try {
//     if (!req.user || !req.user._id) {
//       res.status(401).json({message: 'User not authenticated'});
//       return;
//     }
//     const cart = await Cart.findOne({user: req.user._id});
//     if (!cart) {
//       res.status(404).json({message: 'Cart not found'});
//       return;
//     }

//     cart.items = cart.items.filter(
//       item => item.product.toString() !== productId,
//     );

//     await cart.save();
//     res.json(cart);
//   } catch (error) {
//     next(error);
//   }
// };

// // Clear the cart
// export const clearCart: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   try {
//     console.log(req.user);
//     if (!req.user || !req.user._id) {
//       res.status(401).json({message: 'User not authenticated'});
//       return;
//     }

//     const cart = await Cart.findOneAndUpdate(
//       {user: req.user._id},
//       {items: []},
//       {new: true},
//     );
//     if (!cart) {
//       res.status(404).json({message: 'Cart not found'});
//       return;
//     }

//     res.json(cart);
//   } catch (error) {
//     next(error);
//   }
// };

import {Request, Response, NextFunction, RequestHandler} from 'express';
import Cart from '../models/Cart';
import {Product} from '../models/Product';
import {InferSchemaType} from 'mongoose';

type CartType = InferSchemaType<typeof Cart.schema>;

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Get cart for a specific user
export const getCart: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<CartType>>,
  next: NextFunction,
) => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({success: false, message: 'Unauthorized'});
      return;
    }

    const cart = await Cart.findOne({user: req.user._id}).populate(
      'items.product',
    );
    if (!cart) {
      res.status(404).json({success: false, message: 'Cart not found'});
      return;
    }
    res.status(200).json({
      success: true,
      data: cart,
      message: 'Cart retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving cart',
      error: (error as Error).message,
    });
    next(error);
  }
};

export const getCartQuantity: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<number>>,
  next: NextFunction,
) => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({success: false, message: 'Unauthorized'});
      return;
    }

    const cart = await Cart.findOne({user: req.user._id});
    if (!cart || cart.items.length === 0) {
      res
        .status(404)
        .json({success: false, message: 'Cart not found or is empty'});
      return;
    }

    const totalQuantity = cart.items.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    res.status(200).json({
      success: true,
      data: totalQuantity,
      message: 'Total quantity retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving cart quantity',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Add item to cart
export const addToCart: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<CartType>>,
  next: NextFunction,
) => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({success: false, message: 'Unauthorized'});
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
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({success: false, message: 'Product not found'});
        return;
      }

      // Check if the product has a valid discount
      const now = new Date();
      const hasValidDiscount =
        product.discountPrice &&
        (!product.discountStartDate || now >= product.discountStartDate) &&
        (!product.discountEndDate || now <= product.discountEndDate);

      // Use discounted price if valid, otherwise use regular price
      const priceToUse =
        hasValidDiscount && product.discountPrice
          ? product.discountPrice
          : product.price;

      cart.items.push({product: productId, quantity, price: priceToUse});
    }

    await cart.save();
    res
      .status(200)
      .json({success: true, data: cart, message: 'Item added to cart'});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Update item quantity in the cart
export const updateCartItem: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<CartType>>,
  next: NextFunction,
) => {
  const {productId, quantity} = req.body;

  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({success: false, message: 'User not authenticated'});
      return;
    }

    const cart = await Cart.findOne({user: req.user._id});
    if (!cart) {
      res.status(404).json({success: false, message: 'Cart not found'});
      return;
    }

    const item = cart.items.find(item => item.product.toString() === productId);
    if (!item) {
      res.status(404).json({success: false, message: 'Item not found in cart'});
      return;
    }

    item.quantity = quantity;
    await cart.save();
    res.status(200).json({
      success: true,
      data: cart,
      message: 'Cart item updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating cart item',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Remove item from cart
export const removeFromCart: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<CartType>>,
  next: NextFunction,
) => {
  const {productId} = req.params;

  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({success: false, message: 'User not authenticated'});
      return;
    }

    const cart = await Cart.findOne({user: req.user._id});
    if (!cart) {
      res.status(404).json({success: false, message: 'Cart not found'});
      return;
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId,
    );
    await cart.save();
    res
      .status(200)
      .json({success: true, data: cart, message: 'Item removed from cart'});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing item from cart',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Clear the cart
export const clearCart: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<CartType>>,
  next: NextFunction,
) => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({success: false, message: 'User not authenticated'});
      return;
    }

    const cart = await Cart.findOneAndUpdate(
      {user: req.user._id},
      {
        items: [],
        subtotal: 0, // Reset subtotal
        shipping: 0, // Reset shipping
        total: 0, // Reset total
      },
      {new: true},
    );

    if (!cart) {
      res.status(404).json({success: false, message: 'Cart not found'});
      return;
    }

    res.status(200).json({
      success: true,
      data: cart,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: (error as Error).message,
    });
    next(error);
  }
};
