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
exports.PayPalService = void 0;
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = require("mongoose");
const Order_1 = __importDefault(require("../models/Order"));
class PayPalService {
    // Changed from private to public for testing purposes
    static getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const now = Date.now();
            if (this.accessToken && now < this.tokenExpiry) {
                return this.accessToken;
            }
            try {
                console.log('Getting PayPal access token with client ID:', this.clientId);
                const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
                const response = yield axios_1.default.post(`${this.baseURL}/v1/oauth2/token`, 'grant_type=client_credentials', {
                    headers: {
                        Authorization: `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });
                this.accessToken = response.data.access_token;
                this.tokenExpiry = now + response.data.expires_in * 1000 - 60000; // Expire 1 minute early
                console.log('Successfully got PayPal access token');
                return this.accessToken;
            }
            catch (error) {
                console.error('Error getting PayPal access token:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                console.error('Full error:', error);
                throw new Error('Failed to get PayPal access token: ' +
                    (((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error_description) || error.message));
            }
        });
    }
    static createOrder(cartId_1, total_1, shippingAddress_1) {
        return __awaiter(this, arguments, void 0, function* (cartId, total, shippingAddress, currency = 'USD') {
            var _a, _b, _c, _d, _e;
            try {
                console.log('Getting PayPal access token...');
                const accessToken = yield this.getAccessToken();
                console.log('Got PayPal access token');
                const order = {
                    intent: 'CAPTURE',
                    purchase_units: [
                        {
                            amount: {
                                currency_code: currency,
                                value: total.toFixed(2),
                                breakdown: {
                                    item_total: {
                                        currency_code: currency,
                                        value: total.toFixed(2),
                                    },
                                },
                            },
                            description: `Order for cart ${cartId}`,
                            reference_id: cartId.toString(),
                            items: [
                                {
                                    name: 'Green Phone Shop Order',
                                    quantity: '1',
                                    unit_amount: {
                                        currency_code: currency,
                                        value: total.toFixed(2),
                                    },
                                },
                            ],
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
                    application_context: {
                        brand_name: 'Green Phone Shop',
                        shipping_preference: 'SET_PROVIDED_ADDRESS',
                        user_action: 'PAY_NOW',
                        return_url: `${process.env.FRONTEND_URL}/payment/success`,
                        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
                    },
                };
                console.log('Creating PayPal order with data:', JSON.stringify(order, null, 2));
                const response = yield axios_1.default.post(`${this.baseURL}/v2/checkout/orders`, order, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'PayPal-Request-Id': `${cartId}-${Date.now()}`, // Add idempotency key
                    },
                });
                const approvalUrl = (_a = response.data.links.find((link) => link.rel === 'approve')) === null || _a === void 0 ? void 0 : _a.href;
                if (!approvalUrl) {
                    throw new Error('PayPal approval URL not found in response');
                }
                console.log('PayPal order creation response:', JSON.stringify(response.data, null, 2));
                return {
                    orderId: response.data.id,
                    approvalUrl,
                };
                // console.log('PayPal order creation response:', JSON.stringify(response.data, null, 2));
                // return { orderId: response.data.id };
            }
            catch (error) {
                console.error('Error creating PayPal order:', ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
                console.error('Full error:', JSON.stringify((_c = error.response) === null || _c === void 0 ? void 0 : _c.data, null, 2));
                throw new Error('Failed to create PayPal order: ' +
                    (((_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) || error.message));
            }
        });
    }
    static verifyWebhookSignature(headers, body) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const accessToken = yield this.getAccessToken();
                const webhookId = process.env.PAYPAL_WEBHOOK_ID;
                const verificationData = {
                    auth_algo: headers['paypal-auth-algo'],
                    cert_url: headers['paypal-cert-url'],
                    transmission_id: headers['paypal-transmission-id'],
                    transmission_sig: headers['paypal-transmission-sig'],
                    transmission_time: headers['paypal-transmission-time'],
                    webhook_id: webhookId,
                    webhook_event: JSON.parse(body),
                };
                const response = yield axios_1.default.post(`${this.baseURL}/v1/notifications/verify-webhook-signature`, verificationData, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                console.log('Webhook signature verification response:', JSON.stringify(response.data, null, 2));
                return response.data.verification_status === 'SUCCESS';
            }
            catch (error) {
                console.error('Error verifying webhook signature:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                console.error('Full error:', JSON.stringify((_b = error.response) === null || _b === void 0 ? void 0 : _b.data, null, 2));
                return false;
            }
        });
    }
    static capturePayment(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const accessToken = yield this.getAccessToken();
                const response = yield axios_1.default.post(`${this.baseURL}/v2/checkout/orders/${orderId}/capture`, {}, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                console.log('Payment capture response:', JSON.stringify(response.data, null, 2));
                const capture = response.data.purchase_units[0].payments.captures[0];
                return {
                    transactionId: capture.id,
                    status: capture.status,
                };
            }
            catch (error) {
                console.error('Error capturing PayPal payment:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                console.error('Full error:', JSON.stringify((_b = error.response) === null || _b === void 0 ? void 0 : _b.data, null, 2));
                throw new Error('Failed to capture PayPal payment: ' +
                    (((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) || error.message));
            }
        });
    }
    static handlePaymentSuccess(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { resource } = event;
                const cartId = resource.purchase_units[0].reference_id;
                const transactionId = resource.purchase_units[0].payments.captures[0].id;
                const amount = resource.purchase_units[0].amount.value;
                // Create or update order
                yield Order_1.default.findOneAndUpdate({ cartId: new mongoose_1.Types.ObjectId(cartId) }, {
                    $set: {
                        status: 'paid',
                        paymentProvider: 'paypal',
                        paymentId: transactionId,
                        amount: parseFloat(amount),
                        paidAt: new Date(),
                    },
                }, { upsert: true, new: true });
                console.log('Successfully handled payment success event');
            }
            catch (error) {
                console.error('Error handling PayPal payment success:', error);
                console.error('Full error:', error);
                throw error;
            }
        });
    }
}
exports.PayPalService = PayPalService;
PayPalService.baseURL = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
PayPalService.clientId = process.env.PAYPAL_CLIENT_ID;
PayPalService.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
PayPalService.accessToken = null;
PayPalService.tokenExpiry = 0;
