import express, {Router} from 'express';
// import {authenticateUser} from '../middleware/auth';
import {
  //   createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrdersByDateRange,
  getOrderStats,
  createOrder,
} from '../controllers/orderController';
import {authenticate, authorizeAdmin} from '../middleware/authMiddleware';

const router: Router = express.Router();

// Apply authentication middleware to all routes
// router.use(authenticate);

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post('/', authorizeAdmin, createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get all orders for the authenticated user
 * @access  Private
 */
router.get('/', getOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get specific order by ID
 * @access  Private
 */
router.get('/:id', getOrderById);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private
 */
router.put('/:id/status', updateOrderStatus);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private
 */
router.post('/:id/cancel', cancelOrder);

/**
 * @route   GET /api/orders/date-range
 * @desc    Get orders within a date range
 * @access  Private
 */
router.get('/date-range', getOrdersByDateRange);

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics
 * @access  Private
 */
router.get('/stats', getOrderStats);

export default router;
