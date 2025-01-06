// import { Request, Response } from 'express';
// import fetch from 'node-fetch';
// import Order from '../models/Order';

// export class PayPalController {
//   private static async getAccessToken(): Promise<string> {
//     const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    
//     const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Basic ${auth}`,
//         'Content-Type': 'application/x-www-form-urlencoded'
//       },
//       body: 'grant_type=client_credentials'
//     });

//     const data = await response.json();
//     return data.access_token;
//   }

//   public static async createOrder(req: Request, res: Response): Promise<void> {
//     try {
//       const { items, total } = req.body;
//       const accessToken = await PayPalController.getAccessToken();

//       const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           intent: 'CAPTURE',
//           purchase_units: [{
//             amount: {
//               currency_code: 'USD',
//               value: total.toString()
//             },
//             description: 'Green Phone Shop Purchase'
//           }]
//         })
//       });

//       const order = await response.json();
//       res.json(order);
//     } catch (error) {
//       console.error('Error creating PayPal order:', error);
//       res.status(500).json({ error: 'Failed to create PayPal order' });
//     }
//   }

//   public static async capturePayment(req: Request, res: Response): Promise<void> {
//     try {
//       const { orderID } = req.params;
//       const { items, shippingAddress } = req.body;  
//       const accessToken = await PayPalController.getAccessToken();

//       if (!req.user) {
//         res.status(401).json({ error: 'User not authenticated' });
//         return;
//       }

//       const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${accessToken}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       const data = await response.json();
      
//       if (data.status === 'COMPLETED') {
//         const newOrder = new Order({
//           user: req.user._id,
//           items: items,
//           totalAmount: data.purchase_units[0].amount.value,
//           status: 'processing',
//           shippingAddress: shippingAddress,  
//           payment: {
//             provider: 'paypal',
//             transactionId: orderID,
//             status: 'completed',
//             paidAmount: data.purchase_units[0].amount.value,
//             paidAt: new Date()
//           }
//         });
        
//         await newOrder.save();
//         res.json({ success: true, order: newOrder });
//       } else {
//         res.status(400).json({ error: 'Payment not completed' });
//       }
//     } catch (error) {
//       console.error('Error capturing payment:', error);
//       res.status(500).json({ error: 'Failed to capture payment' });
//     }
//   }
// }


// PayPalController.ts
import { Request, Response } from 'express';
import fetch from 'node-fetch';
import Order from '../models/Order';

export class PayPalController {
  private static async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    return data.access_token;
  }

  public static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { items, total } = req.body;
      const accessToken = await PayPalController.getAccessToken();

      const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
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

      const order = await response.json();
      res.json(order);
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      res.status(500).json({ error: 'Failed to create PayPal order' });
    }
  }

  public static async capturePayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderID } = req.params;
      const { items, shippingAddress } = req.body;  
      const accessToken = await PayPalController.getAccessToken();

      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      console.log(data)
      
      if (data.status === 'COMPLETED') {
        const newOrder = new Order({
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
        
        await newOrder.save();
        res.json({ success: true, order: newOrder });
      } else {
        res.status(400).json({ error: 'Payment not completed' });
      }
    } catch (error) {
      console.error('Error capturing payment:', error);
      res.status(500).json({ error: 'Failed to capture payment' });
    }
  }
}