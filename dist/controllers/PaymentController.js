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
exports.createPayPalOrder = createPayPalOrder;
exports.capturePayPalPayment = capturePayPalPayment;
exports.handlePayPalWebhook = handlePayPalWebhook;
const Order_1 = __importDefault(require("../models/Order"));
const Cart_1 = __importDefault(require("../models/Cart"));
const Payment_1 = __importDefault(require("../models/Payment"));
const nodemailer_1 = __importDefault(require("nodemailer"));
// Email configuration
const transporter = nodemailer_1.default.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});
// Helper Functions
function getPayPalAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
        const response = yield fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });
        const data = yield response.json();
        return data.access_token;
    });
}
function sendOrderConfirmationEmail(email, order) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = `
    <h1>Order Confirmation</h1>
    <p>Thank you for your order!</p>
    <h2>Order Details</h2>
    <p>Order ID: ${order._id}</p>
    <p>Total Amount: $${order.totalAmount}</p>
    <p>Status: ${order.status}</p>
    <h3>Items:</h3>
    <ul>
      ${order.items
            .map((item) => `
        <li>${item.product.name} - Quantity: ${item.quantity} - Price: $${item.price}</li>
      `)
            .join('')}
    </ul>
    <p>You will receive another email when your order ships.</p>
  `;
        yield transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Order Confirmation #${order._id}`,
            html,
        });
    });
}
function sendAdminNotification(order, userEmail) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = `
    <h1>New Order Received</h1>
    <p>Order ID: ${order._id}</p>
    <p>Customer: ${userEmail}</p>
    <p>Total Amount: $${order.totalAmount}</p>
  `;
        yield transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: process.env.ADMIN_EMAIL,
            subject: `New Order #${order._id}`,
            html,
        });
    });
}
// Main Payment Handler Functions
function createPayPalOrder(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const { cartId, shippingAddress } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId || !cartId || !shippingAddress) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields',
                });
                return;
            }
            // Get cart and validate
            const cart = yield Cart_1.default.findById(cartId)
                .populate('items.product')
                .populate('user', 'email');
            if (!cart || cart.items.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Cart is empty or not found',
                });
                return;
            }
            // Calculate total
            const totalAmount = cart.items.reduce((total, item) => {
                return total + item.price * item.quantity;
            }, 0);
            // Get PayPal access token
            const accessToken = yield getPayPalAccessToken();
            // Create PayPal order
            const response = yield fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'PayPal-Request-Id': `${cartId}-${Date.now()}`, // Idempotency key
                },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    purchase_units: [
                        {
                            reference_id: cartId,
                            amount: {
                                currency_code: 'USD',
                                value: totalAmount.toFixed(2),
                            },
                            shipping: {
                                address: {
                                    address_line_1: shippingAddress.street,
                                    admin_area_2: shippingAddress.city,
                                    admin_area_1: shippingAddress.state,
                                    postal_code: shippingAddress.zipCode,
                                    country_code: shippingAddress.country,
                                },
                            },
                        },
                    ],
                }),
            });
            const paypalOrder = yield response.json();
            // Create initial order in our database
            const order = yield Order_1.default.create({
                user: userId,
                items: cart.items.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    price: item.price,
                })),
                totalAmount,
                status: 'pending',
                shippingAddress,
                paymentId: paypalOrder.id,
            });
            // Create payment record
            yield Payment_1.default.create({
                orderId: order._id,
                amount: totalAmount,
                currency: 'USD',
                paymentMethod: 'paypal',
                paypalOrderId: paypalOrder.id,
                status: 'pending',
            });
            res.status(200).json({
                success: true,
                orderId: paypalOrder.id,
                approvalUrl: (_b = paypalOrder.links.find(link => link.rel === 'approve')) === null || _b === void 0 ? void 0 : _b.href,
            });
        }
        catch (error) {
            console.error('Error creating PayPal order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create PayPal order',
                error: error.message,
            });
        }
    });
}
function capturePayPalPayment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { orderId } = req.params;
            const accessToken = yield getPayPalAccessToken();
            // Capture the payment
            const response = yield fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            const captureData = yield response.json();
            // Update order and payment status - now properly populating user
            const order = yield Order_1.default.findOneAndUpdate({ paymentId: orderId }, {
                status: 'processing',
                updatedAt: new Date(),
            }, { new: true }).populate('user', 'email'); // Only populate email field from user
            yield Payment_1.default.findOneAndUpdate({ paypalOrderId: orderId }, {
                status: 'completed',
                updatedAt: new Date(),
            });
            if (order && order.user) {
                const userEmail = order.user.email;
                // Send confirmation emails
                yield sendOrderConfirmationEmail(userEmail, order);
                yield sendAdminNotification(order, userEmail);
                // Clear the cart
                yield Cart_1.default.findOneAndUpdate({ user: order.user }, {
                    items: [],
                    subtotal: 0,
                    total: 0,
                });
            }
            res.status(200).json({
                success: true,
                captureId: captureData.purchase_units[0].payments.captures[0].id,
            });
        }
        catch (error) {
            console.error('Error capturing PayPal payment:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to capture payment',
                error: error.message,
            });
        }
    });
}
function handlePayPalWebhook(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { event_type, resource } = req.body;
            switch (event_type) {
                case 'PAYMENT.CAPTURE.COMPLETED': {
                    const orderId = resource.purchase_units[0].reference_id;
                    const transactionId = resource.id;
                    // Update order if not already processed - now properly populating user
                    const order = yield Order_1.default.findOne({ paymentId: orderId }).populate('user', 'email');
                    if ((order === null || order === void 0 ? void 0 : order.status) === 'pending') {
                        order.status = 'processing';
                        order.updatedAt = new Date();
                        yield order.save();
                        // Update payment record
                        yield Payment_1.default.findOneAndUpdate({ paypalOrderId: orderId }, {
                            status: 'completed',
                            updatedAt: new Date(),
                        });
                        // Send notifications if not already sent
                        const userEmail = order.user.email;
                        yield sendOrderConfirmationEmail(userEmail, order);
                        yield sendAdminNotification(order, userEmail);
                    }
                    break;
                }
                case 'PAYMENT.CAPTURE.DENIED':
                    // Handle payment denial
                    yield Payment_1.default.findOneAndUpdate({ paypalOrderId: resource.id }, {
                        status: 'failed',
                        updatedAt: new Date(),
                    });
                    break;
            }
            res.status(200).json({ received: true });
        }
        catch (error) {
            console.error('PayPal webhook error:', error);
            // Still return 200 to acknowledge receipt
            res.status(200).json({
                received: true,
                error: error.message,
            });
        }
    });
}
