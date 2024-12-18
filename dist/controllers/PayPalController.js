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
exports.PayPalController = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
class PayPalController {
    static getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
            const response = yield (0, node_fetch_1.default)('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
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
                const { order_id, amount } = req.body;
                const accessToken = yield this.getAccessToken();
                const response = yield (0, node_fetch_1.default)('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        intent: 'CAPTURE',
                        purchase_units: [{
                                reference_id: order_id,
                                amount: {
                                    currency_code: 'USD',
                                    value: amount.toString()
                                }
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
                const accessToken = yield this.getAccessToken();
                const response = yield (0, node_fetch_1.default)(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    }
                });
                const captureData = yield response.json();
                res.json(captureData);
            }
            catch (error) {
                console.error('Error capturing PayPal payment:', error);
                res.status(500).json({ error: 'Failed to capture payment' });
            }
        });
    }
}
exports.PayPalController = PayPalController;
