import {Request, Response} from 'express';
import Order from '../models/Order';
import Cart from '../models/Cart';
import {Types} from 'mongoose';
import {IProduct} from '../models/Product';
import {IUser, UserRole} from '../models/User';
import crypto from 'crypto';

// Add these interfaces at the top of your file
interface ICartItem {
  product: IProduct;
  quantity: number;
  price: number;
}

interface ICart {
  _id: Types.ObjectId;
  items: ICartItem[];
  user: Types.ObjectId;
}

// Helper function to generate order number
async function generateOrderNumber(): Promise<string> {
  try {
    const lastOrder = await Order.findOne().sort({createdAt: -1});
    if (!lastOrder || !lastOrder.orderNumber) {
      return 'ORD-0001';
    }

    const matches = lastOrder.orderNumber.match(/ORD-(\d+)/);
    if (!matches) {
      return 'ORD-0001';
    }

    const lastNumber = parseInt(matches[1]);
    const nextNumber = lastNumber + 1;
    return `ORD-${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating order number:', error);
    // Fallback to timestamp-based number if something goes wrong
    const timestamp = Date.now();
    return `ORD-${timestamp}`;
  }
}

// Helper function to generate payment ID
function generatePaymentId(): string {
  return `PAY-${crypto.randomBytes(8).toString('hex')}-${Date.now()}`;
}

// Create a new order
export const createOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const {cartId, shippingAddress, paymentId, orderId} = req.body;

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

    // Calculate totals
    const subtotal = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    const tax = subtotal * 0.1; // 10% tax
    const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const totalAmount = subtotal + tax + shippingCost;

    // Generate order number first
    const orderNumber = await generateOrderNumber();
    console.log('Generated order number:', orderNumber);

    // Generate unique payment ID for testing
    const actualPaymentId = paymentId || generatePaymentId();
    console.log('Using payment ID:', actualPaymentId);

    // Create order items from cart items
    const orderItems = cart.items.map(item => ({
      productId: item.product._id,
      quantity: item.quantity,
      price: item.price,
    }));

    // Create the order
    const order = new Order({
      orderNumber,
      user: userId,
      items: orderItems,
      orderId: orderId,
      totalAmount,
      shippingAddress: {
        ...shippingAddress,
        phone: shippingAddress.phone.toString(),
      },
      payment: {
        provider: 'paypal',
        transactionId: actualPaymentId,
        status: 'pending',
        paidAmount: totalAmount,
        paidAt: new Date(),
      },
    });

    await order.save();

    // Clear the cart after successful order creation
    await Cart.findByIdAndDelete(cartId);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get all orders for a user
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const {status} = req.query;

    const query: any = {user: userId};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({createdAt: -1})
      .populate('items.productId');

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

// Get specific order by ID
export const getOrderById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {id} = req.params;
    const userId = req.user?._id;

    const order = await Order.findOne({_id: id, user: userId}).populate(
      'items.productId',
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

// Update order status
export const updateOrderStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {id} = req.params;
    const {status} = req.body;
    const userId = req.user?._id;

    // Validate status
    const validStatuses = [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

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

// Cancel order
export const cancelOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {id} = req.params;
    const {cancelReason} = req.body;
    const userId = req.user?._id;

    const order = (await Order.findOne({_id: id, user: userId})) as any;

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    if (order.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: 'Only pending orders can be cancelled',
      });
      return;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'cancelled',
          cancelReason: cancelReason || 'Cancelled by user',
          cancelledAt: new Date(),
        },
      },
      {new: true},
    );

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: updatedOrder,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message,
    });
  }
};

// Get orders by date range
export const getOrdersByDateRange = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {startDate, endDate} = req.query;
    const userId = req.user?._id;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
      return;
    }

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
export const getOrderStats = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;

    const [stats, ordersByStatus] = await Promise.all([
      Order.aggregate([
        {$match: {user: userId}},
        {
          $group: {
            _id: null,
            totalOrders: {$sum: 1},
            totalSpent: {$sum: '$totalAmount'},
            averageOrderValue: {$avg: '$totalAmount'},
          },
        },
      ]),
      Order.aggregate([
        {$match: {user: userId}},
        {
          $group: {
            _id: '$status',
            count: {$sum: 1},
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      message: 'Order statistics retrieved successfully',
      data: {
        stats: stats[0] || {
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
        },
        ordersByStatus: ordersByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {} as Record<string, number>),
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

// Get all orders (admin only)
export const getAllOrders = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user as IUser;
    // Check if user is admin
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      res.status(403).json({
        success: false,
        message: 'Only admins can access all orders',
      });
      return;
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;
    const status = req.query.status as string;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : null;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : null;

    // Build filter object
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = startDate;
      }
      if (endDate) {
        filter.createdAt.$lte = endDate;
      }
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    // Get orders with pagination and sorting
    const orders = await Order.find(filter)
      .sort({[sortBy]: sortOrder})
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email')
      .populate('items.productId', 'name price');

    res.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalOrders,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
