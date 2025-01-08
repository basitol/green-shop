"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderController_1 = require("../controllers/orderController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post('/', authMiddleware_1.authenticate, orderController_1.createOrder);
/**
 * @route   GET /api/orders
 * @desc    Get all orders for the authenticated user
 * @access  Private
 */
router.get('/', authMiddleware_1.authenticate, orderController_1.getOrders);
/**
 * @route   GET /api/orders/admin
 * @desc    Get all orders (admin only)
 * @access  Private/Admin
 */
router.get('/admin', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, orderController_1.getAllOrders);
/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', authMiddleware_1.authenticate, orderController_1.getOrderById);
/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private/Admin
 */
router.patch('/:id/status', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, orderController_1.updateOrderStatus);
/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private
 */
router.patch('/:id/cancel', authMiddleware_1.authenticate, orderController_1.cancelOrder);
/**
 * @route   GET /api/orders/date-range
 * @desc    Get orders by date range
 * @access  Private
 */
router.get('/date-range', authMiddleware_1.authenticate, orderController_1.getOrdersByDateRange);
/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics
 * @access  Private
 */
router.get('/stats', authMiddleware_1.authenticate, orderController_1.getOrderStats);
exports.default = router;
