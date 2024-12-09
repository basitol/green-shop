import { Request, Response } from 'express';
import fetch from 'node-fetch';

export class PayPalController {
  private static async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    return data.access_token;
  }

  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { order_id, amount } = req.body;
      const accessToken = await this.getAccessToken();

      const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
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

      const order = await response.json();
      res.json(order);
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      res.status(500).json({ error: 'Failed to create PayPal order' });
    }
  }

  static async capturePayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderID } = req.params;
      const accessToken = await this.getAccessToken();

      const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      const captureData = await response.json();
      res.json(captureData);
    } catch (error) {
      console.error('Error capturing PayPal payment:', error);
      res.status(500).json({ error: 'Failed to capture payment' });
    }
  }
}
