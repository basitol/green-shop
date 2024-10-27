// import {Request, Response, NextFunction, RequestHandler} from 'express';
// import Order, {IOrder} from '../models/Order';
// import Cart from '../models/Cart';

// export const createOrder: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const {shippingAddress, paymentId} = req.body;
//     const userId = req.user?._id;

//     if (!userId) {
//       res.status(401).json({message: 'User not authenticated'});
//       return;
//     }

//     // Get the user's cart
//     const cart = await Cart.findOne({user: userId}).populate('items.product');
//     if (!cart || cart.items.length === 0) {
//       res.status(400).json({message: 'Cart is empty'});
//       return;
//     }

//     // Calculate total amount
//     const totalAmount = cart.items.reduce((total, item) => {
//       return total + item.quantity * (item.product as any).price;
//     }, 0);

//     // Create new order
//     const order = new Order({
//       user: userId,
//       items: cart.items.map(item => ({
//         product: item.product,
//         quantity: item.quantity,
//         price: (item.product as any).price,
//       })),
//       totalAmount,
//       shippingAddress,
//       paymentId,
//     });

//     await order.save();

//     // Clear the cart
//     await Cart.findOneAndUpdate({user: userId}, {items: []});

//     res.status(201).json(order);
//   } catch (error) {
//     next(error);
//   }
// };

// export const getOrders: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const userId = req.user?._id;

//     if (!userId) {
//       res.status(401).json({message: 'User not authenticated'});
//       return;
//     }

//     const orders = await Order.find({user: userId}).sort({createdAt: -1});
//     res.json(orders);
//   } catch (error) {
//     next(error);
//   }
// };

// export const getOrderById: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const {id} = req.params;
//     const userId = req.user?._id;

//     if (!userId) {
//       res.status(401).json({message: 'User not authenticated'});
//       return;
//     }

//     const order = await Order.findOne({_id: id, user: userId});
//     if (!order) {
//       res.status(404).json({message: 'Order not found'});
//       return;
//     }

//     res.json(order);
//   } catch (error) {
//     next(error);
//   }
// };

// export const updateOrderStatus: RequestHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const {id} = req.params;
//     const {status} = req.body;
//     const userId = req.user?._id;

//     if (!userId) {
//       res.status(401).json({message: 'User not authenticated'});
//       return;
//     }

//     const order = await Order.findOneAndUpdate(
//       {_id: id, user: userId},
//       {status, updatedAt: new Date()},
//       {new: true},
//     );

//     if (!order) {
//       res.status(404).json({message: 'Order not found'});
//       return;
//     }

//     res.json(order);
//   } catch (error) {
//     next(error);
//   }
// };

import {Request, Response, NextFunction, RequestHandler} from 'express';
import Order, {IOrder} from '../models/Order';
import Cart from '../models/Cart';
import {InferSchemaType} from 'mongoose';

type OrderType = InferSchemaType<typeof Order.schema>;

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Create a new order
export const createOrder: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<OrderType>>,
  next: NextFunction,
) => {
  try {
    const {shippingAddress, paymentId} = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({success: false, message: 'User not authenticated'});
      return;
    }

    const cart = await Cart.findOne({user: userId}).populate('items.product');
    if (!cart || cart.items.length === 0) {
      res.status(400).json({success: false, message: 'Cart is empty'});
      return;
    }

    const totalAmount = cart.items.reduce((total, item) => {
      return total + item.quantity * (item.product as any).price;
    }, 0);

    const order = new Order({
      user: userId,
      items: cart.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: (item.product as any).price,
      })),
      totalAmount,
      shippingAddress,
      paymentId,
    });

    await order.save();

    await Cart.findOneAndUpdate({user: userId}, {items: []});

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Get all orders for a user
export const getOrders: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<OrderType[]>>,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({success: false, message: 'User not authenticated'});
      return;
    }

    const orders = await Order.find({user: userId}).sort({createdAt: -1});
    res.status(200).json({
      success: true,
      data: orders,
      message: `${orders.length} order(s) retrieved successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving orders',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Get a specific order by ID
export const getOrderById: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<OrderType>>,
  next: NextFunction,
) => {
  try {
    const {id} = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({success: false, message: 'User not authenticated'});
      return;
    }

    const order = await Order.findOne({_id: id, user: userId});
    if (!order) {
      res.status(404).json({success: false, message: 'Order not found'});
      return;
    }

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving order',
      error: (error as Error).message,
    });
    next(error);
  }
};

// Update the status of a specific order
export const updateOrderStatus: RequestHandler = async (
  req: Request,
  res: Response<ApiResponse<OrderType>>,
  next: NextFunction,
) => {
  try {
    const {id} = req.params;
    const {status} = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({success: false, message: 'User not authenticated'});
      return;
    }

    const order = await Order.findOneAndUpdate(
      {_id: id, user: userId},
      {status, updatedAt: new Date()},
      {new: true},
    );

    if (!order) {
      res.status(404).json({success: false, message: 'Order not found'});
      return;
    }

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: (error as Error).message,
    });
    next(error);
  }
};
