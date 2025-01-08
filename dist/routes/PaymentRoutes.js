"use strict";
// import express from 'express';
// import { authenticate } from '../middleware/authMiddleware';
// import { PaymentController } from '../controllers/PaymentController';
// import { PayPalService } from '../services/PayPalService';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
// import {
//   capturePayPalPayment,
//   createPayPalOrder,
//   handlePayPalWebhook,
// } from '../controllers/PaymentController';
const PayPalController_1 = require("../controllers/PayPalController");
const router = express_1.default.Router();
/**
 * @route   POST /api/payments/create-order
 * @desc    Create a PayPal order for the cart
 * @access  Private
 */
router.post('/create-order', authMiddleware_1.authenticate, PayPalController_1.PayPalController.createOrder);
/**
 * @route   POST /api/payments/capture/:orderId
 * @desc    Capture PayPal payment after approval
 * @access  Private
 */
router.post('/capture/:orderId', authMiddleware_1.authenticate, PayPalController_1.PayPalController.capturePayment);
/**
 * @route   POST /api/payments/webhook
 * @desc    Handle PayPal webhook notifications
 * @access  Public
 */
// router.post('/webhook', handlePayPalWebhook);
exports.default = router;
