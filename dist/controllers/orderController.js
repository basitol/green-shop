"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderStats = exports.getOrdersByDateRange = exports.cancelOrder = exports.updateOrderStatus = exports.getOrderById = exports.getOrders = exports.createOrder = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const Cart_1 = __importDefault(require("../models/Cart"));
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
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { cartId, shippingAddress, paymentId } = req.body;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }
        const cart = yield Cart_1.default.findById(cartId).populate('items.product');
        if (!cart || cart.items.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Cart is empty or not found',
            });
            return;
        }
        const subtotal = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
        const tax = subtotal * 0.1;
        const shippingCost = subtotal > 100 ? 0 : 10;
        const totalAmount = subtotal + tax + shippingCost;
        const order = yield Order_1.default.create({
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
        yield Cart_1.default.findByIdAndUpdate(cartId, { items: [], subtotal: 0, total: 0 });
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message,
        });
    }
});
exports.createOrder = createOrder;
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
const getOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const orders = yield Order_1.default.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate('items.product');
        res.status(200).json({
            success: true,
            message: 'Orders retrieved successfully',
            data: orders,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving orders',
            error: error.message,
        });
    }
});
exports.getOrders = getOrders;
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
const getOrderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const order = yield Order_1.default.findOne({ _id: id, user: userId }).populate('items.product');
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving order',
            error: error.message,
        });
    }
});
exports.getOrderById = getOrderById;
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
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const order = yield Order_1.default.findOneAndUpdate({ _id: id, user: userId }, Object.assign({ status, updatedAt: new Date() }, (status === 'cancelled' && { cancelledAt: new Date() })), { new: true });
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message,
        });
    }
});
exports.updateOrderStatus = updateOrderStatus;
const cancelOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { cancelReason } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const order = yield Order_1.default.findOneAndUpdate({ _id: id, user: userId, status: 'pending' }, {
            status: 'cancelled',
            cancelReason,
            cancelledAt: new Date(),
            updatedAt: new Date(),
        }, { new: true });
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling order',
            error: error.message,
        });
    }
});
exports.cancelOrder = cancelOrder;
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
const getOrdersByDateRange = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { startDate, endDate } = req.query;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const orders = yield Order_1.default.find({
            user: userId,
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            },
        }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: 'Orders retrieved successfully',
            data: orders,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving orders',
            error: error.message,
        });
    }
});
exports.getOrdersByDateRange = getOrdersByDateRange;
// Get order statistics
const getOrderStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const stats = yield Order_1.default.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' },
                    averageOrderValue: { $avg: '$totalAmount' },
                },
            },
        ]);
        const ordersByStatus = yield Order_1.default.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving order statistics',
            error: error.message,
        });
    }
});
exports.getOrderStats = getOrderStats;
