import Stripe from 'stripe';
import { PayPalScriptOptions, loadScript } from "@paypal/paypal-js";
import Payment from '../models/Payment';
import Order from '../models/Order';
import Cart from '../models/Cart';
import { IOrder } from '../models/Order';
import { Document, Types } from 'mongoose';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

interface CheckoutData {
  cartId: Types.ObjectId;
  shippingAddress: ShippingAddress;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Interface for the populated product in cart
interface IProductPopulated {
  _id: Types.ObjectId;
  name: string;
  description: string;
  color: string;
  storage: string;
  price: number;
  stock: number;
  rating: number;
  totalReviews: number;
  images: string[];
  mainImage: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for cart item with populated product
interface ICartItemPopulated {
  product: IProductPopulated;
  quantity: number;
  price: number;
}

// Interface for populated cart document
interface ICartPopulated extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: ICartItemPopulated[];
  subtotal: number;
  shipping: number;
  total: number;
}

export class PaymentService {
  // Initialize PayPal
  private static async initializePayPal() {
    const options: PayPalScriptOptions = {
      clientId: process.env.PAYPAL_CLIENT_ID!,
      currency: "USD",
      intent: "capture"
    };
    return await loadScript(options);
  }

  // Get cart details and validate
  private static async getValidatedCart(cartId: Types.ObjectId): Promise<{ cart: ICartPopulated, totalAmount: number }> {
    const cart = await Cart.findById(cartId)
      .populate<{ items: { product: IProductPopulated }[] }>('items.product');

    if (!cart) {
      throw new Error('Cart not found');
    }

    const cartPopulated = cart as unknown as ICartPopulated;

    if (!cartPopulated.items || cartPopulated.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate total amount and validate items
    let totalAmount = 0;
    for (const item of cartPopulated.items) {
      if (!item.product) {
        throw new Error('Invalid product in cart');
      }
      if (item.quantity <= 0) {
        throw new Error('Invalid quantity in cart');
      }
      totalAmount += item.product.price * item.quantity;
    }

    return { cart: cartPopulated, totalAmount };
  }

  // Create Stripe Payment Intent from Cart
  static async createStripePaymentIntent(checkoutData: CheckoutData) {
    try {
      const cart = await Cart.findById(checkoutData.cartId)
        .populate('items.product');

      if (!cart) {
        throw new Error('Cart not found');
      }

      if (!cart.items || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Calculate total amount
      const totalAmount = cart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Stripe expects amounts in cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'always'
        },
        metadata: {
          cartId: checkoutData.cartId.toString(),
          shippingAddress: JSON.stringify(checkoutData.shippingAddress)
        }
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Create PayPal Order from Cart
  static async createPayPalOrder(checkoutData: CheckoutData) {
    try {
      const { cart, totalAmount } = await this.getValidatedCart(checkoutData.cartId);
      
      const paypal = await this.initializePayPal();
      if (!paypal) {
        throw new Error('Failed to initialize PayPal');
      }

      // Create a PayPal order through our backend API
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId: cart._id.toString(),
          userId: cart.user.toString(),
          amount: totalAmount,
          shippingAddress: checkoutData.shippingAddress
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create PayPal order');
      }

      const paypalOrder = await response.json();

      return {
        orderId: paypalOrder.id
      };
    } catch (error) {
      console.error('PayPal order creation failed:', error);
      throw error;
    }
  }

  // Create order after successful payment
  private static async createOrder(paymentData: any, paymentMethod: 'stripe' | 'paypal'): Promise<Document<unknown, {}, IOrder> & IOrder> {
    let cartId, userId, shippingAddress;
    
    if (paymentMethod === 'stripe') {
      const { metadata } = paymentData;
      cartId = metadata.cartId;
      userId = metadata.userId;
      shippingAddress = metadata.shippingAddress;
    } else {
      // PayPal order data
      const purchase_unit = paymentData.purchase_units[0];
      cartId = purchase_unit.custom_id; // stored in custom_id
      userId = purchase_unit.reference_id; // stored in reference_id
      shippingAddress = purchase_unit.shipping.address;
    }

    // Get cart details
    const { cart, totalAmount } = await this.getValidatedCart(new Types.ObjectId(cartId));

    // Create order
    const orderData = {
      user: new Types.ObjectId(userId),
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      })),
      totalAmount,
      shippingAddress,
      status: 'processing',
      paymentId: paymentData.id
    };

    const order = await Order.create(orderData);

    // Clear the cart after successful order creation
    await Cart.findByIdAndUpdate(cartId, { 
      $set: { items: [], subtotal: 0, shipping: 0, total: 0, lastModified: new Date() }
    });

    return order;
  }

  // Test confirm payment (development only)
  static async testConfirmPayment(paymentIntentId: string) {
    try {
      // Confirm the payment intent with a test payment method token
      const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: 'pm_card_visa', // Use the test token instead of creating a new payment method
          return_url: 'http://localhost:3000/payment-success'
        }
      );

      return {
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      console.error('Test payment confirmation failed:', error);
      throw error;
    }
  }

  // Handle Stripe Webhook
  static async handleStripeWebhook(event: Stripe.Event) {
    try {
      console.log('Processing webhook event:', event.type);
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('Payment succeeded:', paymentIntent.id);
          console.log('Payment metadata:', paymentIntent.metadata);
          
          // Get cart ID and shipping address from metadata
          const cartId = paymentIntent.metadata.cartId;
          const shippingAddress = JSON.parse(paymentIntent.metadata.shippingAddress);
          
          if (!cartId) {
            console.error('Cart ID not found in payment intent metadata');
            throw new Error('Cart ID not found in payment intent metadata');
          }

          // Find the cart and populate products
          console.log('Finding cart:', cartId);
          const cart = await Cart.findById(cartId).populate('items.product');
          if (!cart) {
            console.error('Cart not found:', cartId);
            throw new Error('Cart not found');
          }
          console.log('Found cart:', cart._id);

          // Create order
          console.log('Creating order for cart:', cart._id);
          const order = await Order.create({
            user: cart.user,
            items: cart.items,
            total: cart.total,
            subtotal: cart.subtotal,
            shipping: cart.shipping,
            shippingAddress: shippingAddress,
            paymentIntent: paymentIntent.id,
            status: 'paid'
          });
          console.log('Order created:', order._id);

          // Clear the cart
          console.log('Deleting cart:', cart._id);
          await Cart.findByIdAndDelete(cartId);
          console.log('Cart deleted successfully');

          break;

        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
          console.error('Payment failed:', failedPaymentIntent.id);
          break;

        default:
          console.log('Unhandled event type:', event.type);
      }
    } catch (error) {
      console.error('Webhook handling failed:', error);
      throw error;
    }
  }

  // Handle PayPal Webhook
  static async handlePayPalWebhook(event: any) {
    try {
      switch (event.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          const paypalOrder = event.resource;
          // Create order after successful payment
          const order = await this.createOrder(paypalOrder, 'paypal');
          
          // Create payment record
          await Payment.create({
            orderId: order._id,
            amount: order.totalAmount,
            currency: 'USD',
            paymentMethod: 'paypal',
            paypalOrderId: paypalOrder.id,
            status: 'completed'
          });
          break;

        case 'PAYMENT.CAPTURE.DENIED':
          // Just log the failure, no order creation
          await Payment.create({
            amount: parseFloat(event.resource.amount.value),
            currency: 'USD',
            paymentMethod: 'paypal',
            paypalOrderId: event.resource.id,
            status: 'failed'
          });
          break;
      }
    } catch (error) {
      console.error('Error handling PayPal webhook:', error);
      throw error;
    }
  }
}
