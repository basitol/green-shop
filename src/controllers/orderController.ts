import {Request, Response} from 'express';
import Order from '../models/Order';
import Cart from '../models/Cart';
import {Types} from 'mongoose';
import {IProduct} from '../models/Product';

// Add these interfaces at the top of your file
interface ICartItem {
  product: IProduct; // Note: This will be populated
  quantity: number;
  price: number;
}

interface ICart {
  _id: Types.ObjectId;
  items: ICartItem[];
  user: Types.ObjectId;
}

// Create a new order
// export const createOrder = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?._id;
//     const {cartId, shippingAddress, paymentId} = req.body;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: 'User not authenticated',
//       });
//     }

//     // Get cart and validate with proper typing
//     const cart = await Cart.findById(cartId).populate<{items: ICartItem[]}>(
//       'items.product',
//     );
//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Cart is empty or not found',
//       });
//     }

//     // Calculate totals
//     const subtotal = cart.items.reduce((total, item) => {
//       return total + item.price * item.quantity;
//     }, 0);

//     const tax = subtotal * 0.1; // 10% tax
//     const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
//     const totalAmount = subtotal + tax + shippingCost;

//     // Create new order
//     const order = await Order.create({
//       user: userId,
//       orderNumber: `ORD-${Date.now()}`, // This will be replaced by the pre-save hook
//       items: cart.items.map(item => ({
//         product: item.product._id,
//         name: item.product.name,
//         quantity: item.quantity,
//         price: item.price,
//         subtotal: item.price * item.quantity,
//       })),
//       subtotal,
//       tax,
//       shippingCost,
//       totalAmount,
//       shippingAddress,
//       payment: {
//         provider: 'paypal',
//         transactionId: paymentId,
//         status: 'pending',
//         paidAmount: totalAmount,
//       },
//       status: 'pending',
//     });

//     // Clear the cart
//     await Cart.findByIdAndUpdate(cartId, {
//       items: [],
//       subtotal: 0,
//       total: 0,
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Order created successfully',
//       data: order,
//     });
//   } catch (error: any) {
//     console.error('Error creating order:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error creating order',
//       error: error.message,
//     });
//   }
// };

export const createOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const {cartId, shippingAddress, paymentId} = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const cart = await Cart.findById(cartId).populate<{items: ICartItem[]}>(
      'items.product',
    );
    if (!cart || cart.items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Cart is empty or not found',
      });
      return;
    }

    const subtotal = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    const tax = subtotal * 0.1;
    const shippingCost = subtotal > 100 ? 0 : 10;
    const totalAmount = subtotal + tax + shippingCost;

    const order = await Order.create({
      user: userId,
      orderNumber: `ORD-${Date.now()}`,
      items: cart.items.map(item => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      })),
      subtotal,
      tax,
      shippingCost,
      totalAmount,
      shippingAddress,
      payment: {
        provider: 'paypal',
        transactionId: paymentId,
        status: 'pending',
        paidAmount: totalAmount,
      },
      status: 'pending',
    });

    await Cart.findByIdAndUpdate(cartId, {items: [], subtotal: 0, total: 0});

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
    });
  }
};

// Get all orders for a user
// export const getOrders = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?._id;
//     const orders = await Order.find({user: userId})
//       .sort({createdAt: -1})
//       .populate('items.product');

//     res.status(200).json({
//       success: true,
//       message: 'Orders retrieved successfully',
//       data: orders,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: 'Error retrieving orders',
//       error: error.message,
//     });
//   }
// };

// Get specific order by ID
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const orders = await Order.find({user: userId})
      .sort({createdAt: -1})
      .populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving orders',
      error: error.message,
    });
  }
};

// export const getOrderById = async (req: Request, res: Response) => {
//   try {
//     const {id} = req.params;
//     const userId = req.user?._id;

//     const order = await Order.findOne({_id: id, user: userId}).populate(
//       'items.product',
//     );

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Order retrieved successfully',
//       data: order,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: 'Error retrieving order',
//       error: error.message,
//     });
//   }
// };

// Update order status
export const getOrderById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {id} = req.params;
    const userId = req.user?._id;

    const order = await Order.findOne({_id: id, user: userId}).populate(
      'items.product',
    );

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: order,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving order',
      error: error.message,
    });
  }
};

// export const updateOrderStatus = async (req: Request, res: Response) => {
//   try {
//     const {id} = req.params;
//     const {status} = req.body;
//     const userId = req.user?._id;

//     const order = await Order.findOneAndUpdate(
//       {_id: id, user: userId},
//       {
//         status,
//         updatedAt: new Date(),
//         ...(status === 'cancelled' && {cancelledAt: new Date()}),
//       },
//       {new: true},
//     );

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Order status updated successfully',
//       data: order,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: 'Error updating order status',
//       error: error.message,
//     });
//   }
// };

// Cancel order
export const updateOrderStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {id} = req.params;
    const {status} = req.body;
    const userId = req.user?._id;

    const order = await Order.findOneAndUpdate(
      {_id: id, user: userId},
      {
        status,
        updatedAt: new Date(),
        ...(status === 'cancelled' && {cancelledAt: new Date()}),
      },
      {new: true},
    );

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message,
    });
  }
};
export const cancelOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {id} = req.params;
    const {cancelReason} = req.body;
    const userId = req.user?._id;

    const order = await Order.findOneAndUpdate(
      {_id: id, user: userId, status: 'pending'},
      {
        status: 'cancelled',
        cancelReason,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      },
      {new: true},
    );

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found or cannot be cancelled',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message,
    });
  }
};

// export const cancelOrder = async (req: Request, res: Response) => {
//   try {
//     const {id} = req.params;
//     const {cancelReason} = req.body;
//     const userId = req.user?._id;

//     const order = await Order.findOneAndUpdate(
//       {_id: id, user: userId, status: 'pending'},
//       {
//         status: 'cancelled',
//         cancelReason,
//         cancelledAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {new: true},
//     );

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found or cannot be cancelled',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Order cancelled successfully',
//       data: order,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: 'Error cancelling order',
//       error: error.message,
//     });
//   }
// };

// Get orders by date range
export const getOrdersByDateRange = async (req: Request, res: Response) => {
  try {
    const {startDate, endDate} = req.query;
    const userId = req.user?._id;

    const orders = await Order.find({
      user: userId,
      createdAt: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      },
    }).sort({createdAt: -1});

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving orders',
      error: error.message,
    });
  }
};

// Get order statistics
export const getOrderStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const stats = await Order.aggregate([
      {$match: {user: userId}},
      {
        $group: {
          _id: null,
          totalOrders: {$sum: 1},
          totalSpent: {$sum: '$totalAmount'},
          averageOrderValue: {$avg: '$totalAmount'},
        },
      },
    ]);

    const ordersByStatus = await Order.aggregate([
      {$match: {user: userId}},
      {
        $group: {
          _id: '$status',
          count: {$sum: 1},
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Order statistics retrieved successfully',
      data: {
        stats: stats[0],
        ordersByStatus,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving order statistics',
      error: error.message,
    });
  }
};
