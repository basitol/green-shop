// import express from 'express';
// import { authenticate } from '../middleware/authMiddleware';
// import { PaymentController } from '../controllers/PaymentController';
// import { PayPalService } from '../services/PayPalService';

// const router = express.Router();

// router.post('/api/orders/create', authenticate, PaymentController.createOrder);
// router.post('/api/orders/capture', authenticate, PaymentController.captureOrder);

// // Stripe routes
// router.post('/stripe/checkout', authenticate, PaymentController.initStripePayment);
// router.post('/stripe/test-confirm', authenticate, PaymentController.testConfirmPayment);

// // PayPal routes
// router.post('/paypal/checkout', authenticate, PaymentController.initPayPalPayment);
// router.post('/paypal/capture', authenticate, PaymentController.capturePayPalPayment);

// // Test route for PayPal access token
// router.get('/paypal/test-token', authenticate, async (req, res) => {
//   try {
//     const accessToken = await PayPalService.getAccessToken();
//     res.json({ success: true, accessToken });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Webhook routes (no auth required as they're called by payment providers)
// router.post('/stripe/webhook', express.raw({ type: 'application/json' }), PaymentController.handleStripeWebhook);
// router.post('/paypal/webhook', express.json(), PaymentController.handlePayPalWebhook);

// export default router;

import express, {Router} from 'express';
import {authenticate} from '../middleware/authMiddleware';
// import {
//   capturePayPalPayment,
//   createPayPalOrder,
//   handlePayPalWebhook,
// } from '../controllers/PaymentController';
import { PayPalController } from '../controllers/PayPalController';

const router: Router = express.Router();

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a PayPal order for the cart
 * @access  Private
 */
router.post('/create-order', authenticate, PayPalController.createOrder);

/**
 * @route   POST /api/payments/capture/:orderId
 * @desc    Capture PayPal payment after approval
 * @access  Private
 */
router.post('/capture/:orderId', authenticate, PayPalController.capturePayment);

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle PayPal webhook notifications
 * @access  Public
 */
// router.post('/webhook', handlePayPalWebhook);

export default router;
