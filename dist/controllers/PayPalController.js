"use strict";
// import { Request, Response } from 'express';
// import fetch from 'node-fetch';
// import Order from '../models/Order';
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
exports.PayPalController = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const Order_1 = __importDefault(require("../models/Order"));
class PayPalController {
    static getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
            const response = yield (0, node_fetch_1.default)('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });
            const data = yield response.json();
            return data.access_token;
        });
    }
    static createOrder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { items, total } = req.body;
                const accessToken = yield PayPalController.getAccessToken();
                const response = yield (0, node_fetch_1.default)('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        intent: 'CAPTURE',
                        purchase_units: [{
                                amount: {
                                    currency_code: 'USD',
                                    value: total.toString()
                                },
                                description: 'Green Phone Shop Purchase'
                            }]
                    })
                });
                const order = yield response.json();
                res.json(order);
            }
            catch (error) {
                console.error('Error creating PayPal order:', error);
                res.status(500).json({ error: 'Failed to create PayPal order' });
            }
        });
    }
    static capturePayment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderID } = req.params;
                const { items, shippingAddress } = req.body;
                const accessToken = yield PayPalController.getAccessToken();
                if (!req.user) {
                    res.status(401).json({ error: 'User not authenticated' });
                    return;
                }
                const response = yield (0, node_fetch_1.default)(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = yield response.json();
                console.log(data);
                if (data.status === 'COMPLETED') {
                    const newOrder = new Order_1.default({
                        user: req.user._id,
                        items: items,
                        totalAmount: data.purchase_units[0].amount.value,
                        status: 'processing',
                        shippingAddress: shippingAddress,
                        payment: {
                            provider: 'paypal',
                            transactionId: orderID,
                            status: 'completed',
                            paidAmount: data.purchase_units[0].amount.value,
                            paidAt: new Date()
                        }
                    });
                    yield newOrder.save();
                    res.json({ success: true, order: newOrder });
                }
                else {
                    res.status(400).json({ error: 'Payment not completed' });
                }
            }
            catch (error) {
                console.error('Error capturing payment:', error);
                res.status(500).json({ error: 'Failed to capture payment' });
            }
        });
    }
}
exports.PayPalController = PayPalController;
