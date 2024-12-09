import { Request, Response, RequestHandler } from 'express';
import Stripe from 'stripe';
import { PaymentService } from '../services/PaymentService';
import Cart from '../models/Cart';
import { Types } from 'mongoose';
import { IUser } from '../models/User';
import { PayPalService } from '../services/PayPalService';
import axios from 'axios';

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CustomRequest extends Request {
  user?: IUser;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID';
const PAYPAL_SECRET = 'YOUR_PAYPAL_SECRET';
const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Use sandbox for testing

export class PaymentController {
  // Initialize Stripe payment from cart
  static initStripePayment: (req: Request, res: Response) => Promise<void> = async (req, res) => {
    try {
      console.log('Stripe payment request body:', req.body);
      console.log('Stripe payment request headers:', req.headers);

      const { cartId, shippingAddress } = req.body;
      const userId = (req as CustomRequest).user?._id;

      console.log('Extracted data:', { cartId, shippingAddress, userId });

      if (!cartId || !shippingAddress || !userId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const cart = await Cart.findById(cartId).populate('items.product');
      if (!cart) {
        res.status(404).json({ error: 'Cart not found' });
        return;
      }

      console.log('Cart user ID:', cart.user.toString());
      console.log('Request user ID:', userId);

      if (cart.user.toString() !== userId.toString()) {
        res.status(403).json({ 
          error: 'Not authorized to access this cart',
          cartUserId: cart.user.toString(),
          requestUserId: userId.toString()
        });
        return;
      }

      const checkoutData = {
        cartId: new Types.ObjectId(cartId),
        shippingAddress
      };

      const paymentIntent = await PaymentService.createStripePaymentIntent(checkoutData);

      res.json({
        clientSecret: paymentIntent.clientSecret,
        paymentIntentId: paymentIntent.paymentIntentId
      });
    } catch (error: any) {
      console.error('Error initializing payment:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Initialize PayPal payment
  static initPayPalPayment: (req: Request, res: Response) => Promise<void> = async (req, res) => {
    try {
      const { cartId, shippingAddress } = req.body;
      const userId = (req as CustomRequest).user?._id;

      if (!cartId || !shippingAddress || !userId) {
        res.status(400).json({ 
          error: 'Missing required fields',
          received: { cartId: !!cartId, shippingAddress: !!shippingAddress, userId: !!userId }
        });
        return;
      }

      const cart = await Cart.findById(cartId).populate('items.product');
      if (!cart) {
        res.status(404).json({ error: 'Cart not found' });
        return;
      }

      if (cart.user.toString() !== userId.toString()) {
        res.status(403).json({ 
          error: 'Not authorized to access this cart',
          cartUserId: cart.user.toString(),
          requestUserId: userId.toString()
        });
        return;
      }

      const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const response = await PayPalService.createOrder(
        new Types.ObjectId(cartId),
        total,
        shippingAddress
      );

      res.json({
        orderId: response.orderId,
        approvalUrl: response.approvalUrl,
        total,
        currency: 'USD'
      });

    } catch (error: any) {
      console.error('Error initializing PayPal payment:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static createOrder = async (req: Request, res: Response) => {
    const { amount } = req.body;

    try {
      // Create an order with PayPal
      const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: amount,
          },
        }],
      }, {
        auth: {
          username: PAYPAL_CLIENT_ID,
          password: PAYPAL_SECRET,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      res.status(201).json({
        success: true,
        orderID: response.data.id,
      });
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      res.status(500).json({ success: false, message: 'Failed to create order' });
    }
  };

  static captureOrder = async (req: Request, res: Response) => {
    const { orderID } = req.body;

    try {
      // Capture the order with PayPal
      const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {}, {
        auth: {
          username: PAYPAL_CLIENT_ID,
          password: PAYPAL_SECRET,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Here you can save the payment details to your database
      // Example: await savePaymentDetails(response.data);

      res.status(200).json({
        success: true,
        paymentDetails: response.data,
      });
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      res.status(500).json({ success: false, message: 'Failed to capture order' });
    }
  };

  // Test confirm payment (for development)
  static testConfirmPayment: RequestHandler = async (req, res) => {
    try {
      console.log('Test confirm payment request body:', req.body);
      console.log('Test confirm payment request headers:', req.headers);

      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        res.status(400).json({ error: 'Payment intent ID is required' });
        return;
      }

      const paymentIntent = await PaymentService.testConfirmPayment(paymentIntentId);

      res.json({
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.paymentIntentId,
        clientSecret: paymentIntent.clientSecret
      });
    } catch (error: any) {
      console.error('Error confirming test payment:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Handle Stripe webhook
  static handleStripeWebhook: RequestHandler = async (req, res, next) => {
    try {
      console.log('Stripe webhook request body:', req.body);
      console.log('Stripe webhook request headers:', req.headers);

      const sig = req.headers['stripe-signature'];
      console.log('Received webhook with signature:', sig);

      if (!sig) {
        console.error('No Stripe signature found in webhook request');
        res.status(400).json({ error: 'No signature header' });
        return;
      }

      let event: Stripe.Event;
      
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
        console.log('Webhook verified successfully. Event type:', event.type);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).json({ error: `Webhook Error: ${err.message}` });
        return;
      }

      try {
        await PaymentService.handleStripeWebhook(event);
        console.log('Webhook handled successfully');
        res.json({ received: true });
      } catch (error: any) {
        console.error('Error handling webhook:', error);
        // Still return 200 to acknowledge receipt
        res.status(200).json({ 
          received: true,
          error: error.message 
        });
      }
    } catch (error: any) {
      console.error('Unexpected error in webhook handler:', error);
      res.status(500).json({ error: error.message });
    } finally {
      next();
    }
  }

  // Handle PayPal webhook
  static handlePayPalWebhook: (req: Request, res: Response) => Promise<void> = async (req, res) => {
    try {
      console.log('PayPal webhook request body:', req.body);
      console.log('PayPal webhook request headers:', req.headers);

      // Verify webhook signature
      const isValid = await PayPalService.verifyWebhookSignature(
        req.headers,
        JSON.stringify(req.body)
      );

      if (!isValid) {
        console.error('Invalid PayPal webhook signature');
        res.status(400).json({ error: 'Invalid webhook signature' });
        return;
      }

      const { event_type, resource } = req.body;
      console.log('Received PayPal webhook:', event_type);

      switch (event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await PayPalService.handlePaymentSuccess(req.body);
          console.log(`Payment completed: ${resource.id}`);
          break;

        case 'PAYMENT.CAPTURE.DENIED':
          console.log('Payment denied:', resource.id);
          break;

        default:
          console.log('Unhandled PayPal event:', event_type);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Error handling PayPal webhook:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Capture PayPal payment
  static capturePayPalPayment: (req: Request, res: Response) => Promise<void> = async (req, res) => {
    try {
      console.log('Capture PayPal payment request body:', req.body);
      console.log('Capture PayPal payment request headers:', req.headers);

      const { orderId } = req.body;
      
      if (!orderId) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      const result = await PayPalService.capturePayment(orderId);
      res.json(result);
    } catch (error: any) {
      console.error('Error capturing PayPal payment:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default PaymentController;
