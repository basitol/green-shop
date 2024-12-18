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
exports.PaymentService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const paypal_js_1 = require("@paypal/paypal-js");
const Payment_1 = __importDefault(require("../models/Payment"));
const Order_1 = __importDefault(require("../models/Order"));
const Cart_1 = __importDefault(require("../models/Cart"));
const mongoose_1 = require("mongoose");
const dotenv_1 = __importDefault(require("dotenv"));
// Ensure environment variables are loaded
dotenv_1.default.config();
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
});
class PaymentService {
    // Initialize PayPal
    static initializePayPal() {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                clientId: process.env.PAYPAL_CLIENT_ID,
                currency: "USD",
                intent: "capture"
            };
            return yield (0, paypal_js_1.loadScript)(options);
        });
    }
    // Get cart details and validate
    static getValidatedCart(cartId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cart = yield Cart_1.default.findById(cartId)
                .populate('items.product');
            if (!cart) {
                throw new Error('Cart not found');
            }
            const cartPopulated = cart;
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
        });
    }
    // Create Stripe Payment Intent from Cart
    static createStripePaymentIntent(checkoutData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cart = yield Cart_1.default.findById(checkoutData.cartId)
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
                const paymentIntent = yield stripe.paymentIntents.create({
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
            }
            catch (error) {
                console.error('Error creating payment intent:', error);
                throw error;
            }
        });
    }
    // Create PayPal Order from Cart
    static createPayPalOrder(checkoutData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { cart, totalAmount } = yield this.getValidatedCart(checkoutData.cartId);
                const paypal = yield this.initializePayPal();
                if (!paypal) {
                    throw new Error('Failed to initialize PayPal');
                }
                // Create a PayPal order through our backend API
                const response = yield fetch('/api/paypal/create-order', {
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
                const paypalOrder = yield response.json();
                return {
                    orderId: paypalOrder.id
                };
            }
            catch (error) {
                console.error('PayPal order creation failed:', error);
                throw error;
            }
        });
    }
    // Create order after successful payment
    static createOrder(paymentData, paymentMethod) {
        return __awaiter(this, void 0, void 0, function* () {
            let cartId, userId, shippingAddress;
            if (paymentMethod === 'stripe') {
                const { metadata } = paymentData;
                cartId = metadata.cartId;
                userId = metadata.userId;
                shippingAddress = metadata.shippingAddress;
            }
            else {
                // PayPal order data
                const purchase_unit = paymentData.purchase_units[0];
                cartId = purchase_unit.custom_id; // stored in custom_id
                userId = purchase_unit.reference_id; // stored in reference_id
                shippingAddress = purchase_unit.shipping.address;
            }
            // Get cart details
            const { cart, totalAmount } = yield this.getValidatedCart(new mongoose_1.Types.ObjectId(cartId));
            // Create order
            const orderData = {
                user: new mongoose_1.Types.ObjectId(userId),
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
            const order = yield Order_1.default.create(orderData);
            // Clear the cart after successful order creation
            yield Cart_1.default.findByIdAndUpdate(cartId, {
                $set: { items: [], subtotal: 0, shipping: 0, total: 0, lastModified: new Date() }
            });
            return order;
        });
    }
    // Test confirm payment (development only)
    static testConfirmPayment(paymentIntentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Confirm the payment intent with a test payment method token
                const paymentIntent = yield stripe.paymentIntents.confirm(paymentIntentId, {
                    payment_method: 'pm_card_visa', // Use the test token instead of creating a new payment method
                    return_url: 'http://localhost:3000/payment-success'
                });
                return {
                    status: paymentIntent.status,
                    paymentIntentId: paymentIntent.id,
                    clientSecret: paymentIntent.client_secret
                };
            }
            catch (error) {
                console.error('Test payment confirmation failed:', error);
                throw error;
            }
        });
    }
    // Handle Stripe Webhook
    static handleStripeWebhook(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Processing webhook event:', event.type);
                switch (event.type) {
                    case 'payment_intent.succeeded':
                        const paymentIntent = event.data.object;
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
                        const cart = yield Cart_1.default.findById(cartId).populate('items.product');
                        if (!cart) {
                            console.error('Cart not found:', cartId);
                            throw new Error('Cart not found');
                        }
                        console.log('Found cart:', cart._id);
                        // Create order
                        console.log('Creating order for cart:', cart._id);
                        const order = yield Order_1.default.create({
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
                        yield Cart_1.default.findByIdAndDelete(cartId);
                        console.log('Cart deleted successfully');
                        break;
                    case 'payment_intent.payment_failed':
                        const failedPaymentIntent = event.data.object;
                        console.error('Payment failed:', failedPaymentIntent.id);
                        break;
                    default:
                        console.log('Unhandled event type:', event.type);
                }
            }
            catch (error) {
                console.error('Webhook handling failed:', error);
                throw error;
            }
        });
    }
    // Handle PayPal Webhook
    static handlePayPalWebhook(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                switch (event.event_type) {
                    case 'PAYMENT.CAPTURE.COMPLETED':
                        const paypalOrder = event.resource;
                        // Create order after successful payment
                        const order = yield this.createOrder(paypalOrder, 'paypal');
                        // Create payment record
                        yield Payment_1.default.create({
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
                        yield Payment_1.default.create({
                            amount: parseFloat(event.resource.amount.value),
                            currency: 'USD',
                            paymentMethod: 'paypal',
                            paypalOrderId: event.resource.id,
                            status: 'failed'
                        });
                        break;
                }
            }
            catch (error) {
                console.error('Error handling PayPal webhook:', error);
                throw error;
            }
        });
    }
}
exports.PaymentService = PaymentService;
