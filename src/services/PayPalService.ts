import axios from 'axios';
import {Types} from 'mongoose';
import Order from '../models/Order';

interface PayPalOrder {
  intent: string;
  purchase_units: {
    amount: {
      currency_code: string;
      value: string;
      breakdown: {
        item_total: {
          currency_code: string;
          value: string;
        };
      };
    };
    description: string;
    reference_id?: string;
    items: {
      name: string;
      quantity: string;
      unit_amount: {
        currency_code: string;
        value: string;
      };
    }[];
    shipping: {
      address: {
        address_line_1: string;
        admin_area_2: string;
        admin_area_1: string;
        postal_code: string;
        country_code: string;
      };
    };
  }[];
  application_context: {
    brand_name: string;
    shipping_preference: string;
    user_action: string;
    return_url?: string;
    cancel_url?: string;
  };
}

interface PayPalAccessToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class PayPalService {
  private static baseURL =
    process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
  private static clientId = process.env.PAYPAL_CLIENT_ID!;
  private static clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  private static accessToken: string | null = null;
  private static tokenExpiry: number = 0;

  // Changed from private to public for testing purposes
  static async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      console.log('Getting PayPal access token with client ID:', this.clientId);
      const auth = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString('base64');
      const response = await axios.post<PayPalAccessToken>(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = now + response.data.expires_in * 1000 - 60000; // Expire 1 minute early
      console.log('Successfully got PayPal access token');
      return this.accessToken;
    } catch (error: any) {
      console.error(
        'Error getting PayPal access token:',
        error.response?.data || error.message,
      );
      console.error('Full error:', error);
      throw new Error(
        'Failed to get PayPal access token: ' +
          (error.response?.data?.error_description || error.message),
      );
    }
  }

  static async createOrder(
    cartId: Types.ObjectId,
    total: number,
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    },
    currency: string = 'USD',
  ): Promise<{orderId: string; approvalUrl: string}> {
    try {
      console.log('Getting PayPal access token...');
      const accessToken = await this.getAccessToken();
      console.log('Got PayPal access token');

      const order: PayPalOrder = {
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

      console.log(
        'Creating PayPal order with data:',
        JSON.stringify(order, null, 2),
      );

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        order,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `${cartId}-${Date.now()}`, // Add idempotency key
          },
        },
      );

      const approvalUrl = response.data.links.find(
        (link: any) => link.rel === 'approve',
      )?.href;
      if (!approvalUrl) {
        throw new Error('PayPal approval URL not found in response');
      }

      console.log(
        'PayPal order creation response:',
        JSON.stringify(response.data, null, 2),
      );
      return {
        orderId: response.data.id,
        approvalUrl,
      };

      // console.log('PayPal order creation response:', JSON.stringify(response.data, null, 2));
      // return { orderId: response.data.id };
    } catch (error: any) {
      console.error(
        'Error creating PayPal order:',
        error.response?.data || error.message,
      );
      console.error(
        'Full error:',
        JSON.stringify(error.response?.data, null, 2),
      );
      throw new Error(
        'Failed to create PayPal order: ' +
          (error.response?.data?.message || error.message),
      );
    }
  }

  static async verifyWebhookSignature(
    headers: any,
    body: string,
  ): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
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

      const response = await axios.post(
        `${this.baseURL}/v1/notifications/verify-webhook-signature`,
        verificationData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log(
        'Webhook signature verification response:',
        JSON.stringify(response.data, null, 2),
      );
      return response.data.verification_status === 'SUCCESS';
    } catch (error: any) {
      console.error(
        'Error verifying webhook signature:',
        error.response?.data || error.message,
      );
      console.error(
        'Full error:',
        JSON.stringify(error.response?.data, null, 2),
      );
      return false;
    }
  }

  static async capturePayment(
    orderId: string,
  ): Promise<{transactionId: string; status: string}> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log(
        'Payment capture response:',
        JSON.stringify(response.data, null, 2),
      );
      const capture = response.data.purchase_units[0].payments.captures[0];
      return {
        transactionId: capture.id,
        status: capture.status,
      };
    } catch (error: any) {
      console.error(
        'Error capturing PayPal payment:',
        error.response?.data || error.message,
      );
      console.error(
        'Full error:',
        JSON.stringify(error.response?.data, null, 2),
      );
      throw new Error(
        'Failed to capture PayPal payment: ' +
          (error.response?.data?.message || error.message),
      );
    }
  }

  static async handlePaymentSuccess(event: any): Promise<void> {
    try {
      const {resource} = event;
      const cartId = resource.purchase_units[0].reference_id;
      const transactionId = resource.purchase_units[0].payments.captures[0].id;
      const amount = resource.purchase_units[0].amount.value;

      // Create or update order
      await Order.findOneAndUpdate(
        {cartId: new Types.ObjectId(cartId)},
        {
          $set: {
            status: 'paid',
            paymentProvider: 'paypal',
            paymentId: transactionId,
            amount: parseFloat(amount),
            paidAt: new Date(),
          },
        },
        {upsert: true, new: true},
      );

      console.log('Successfully handled payment success event');
    } catch (error: any) {
      console.error('Error handling PayPal payment success:', error);
      console.error('Full error:', error);
      throw error;
    }
  }
}
