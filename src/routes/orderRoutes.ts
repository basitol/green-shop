import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrdersByDateRange,
  getOrderStats,
  getAllOrders,
} from '../controllers/orderController';
import {authenticate, authorizeAdmin} from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post('/', authenticate, createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get all orders for the authenticated user
 * @access  Private
 */
router.get('/', authenticate, getOrders);

/**
 * @route   GET /api/orders/admin
 * @desc    Get all orders (admin only)
 * @access  Private/Admin
 */
router.get('/admin', authenticate, authorizeAdmin, getAllOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', authenticate, getOrderById);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private/Admin
 */
router.patch('/:id/status', authenticate, authorizeAdmin, updateOrderStatus);

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private
 */
router.patch('/:id/cancel', authenticate, cancelOrder);

/**
 * @route   GET /api/orders/date-range
 * @desc    Get orders by date range
 * @access  Private
 */
router.get('/date-range', authenticate, getOrdersByDateRange);

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics
 * @access  Private
 */
router.get('/stats', authenticate, getOrderStats);

export default router;
