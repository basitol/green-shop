import {Request, Response} from 'express';
import {Types} from 'mongoose';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Payment from '../models/Payment';
import nodemailer from 'nodemailer';

// Add User interface
interface IUser {
  _id: Types.ObjectId;
  email: string;
  name: string;
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Email configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Helper Functions
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString('base64');

  const response = await fetch(
    'https://api-m.sandbox.paypal.com/v1/oauth2/token',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    },
  );

  const data = await response.json();
  return data.access_token;
}

async function sendOrderConfirmationEmail(
  email: string,
  order: any,
): Promise<void> {
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
        .map(
          (item: any) => `
        <li>${item.product.name} - Quantity: ${item.quantity} - Price: $${item.price}</li>
      `,
        )
        .join('')}
    </ul>
    <p>You will receive another email when your order ships.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Order Confirmation #${order._id}`,
    html,
  });
}

async function sendAdminNotification(
  order: any,
  userEmail: string,
): Promise<void> {
  const html = `
    <h1>New Order Received</h1>
    <p>Order ID: ${order._id}</p>
    <p>Customer: ${userEmail}</p>
    <p>Total Amount: $${order.totalAmount}</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL!,
    subject: `New Order #${order._id}`,
    html,
  });
}

// Main Payment Handler Functions
export async function createPayPalOrder(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {cartId, shippingAddress} = req.body;
    const userId = req.user?._id;

    if (!userId || !cartId || !shippingAddress) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
      return;
    }

    // Get cart and validate
    const cart = await Cart.findById(cartId)
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
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const response = await fetch(
      'https://api-m.sandbox.paypal.com/v2/checkout/orders',
      {
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
      },
    );

    const paypalOrder: PayPalOrderResponse = await response.json();

    // Create initial order in our database
    const order = await Order.create({
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
    await Payment.create({
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
      approvalUrl: paypalOrder.links.find(link => link.rel === 'approve')?.href,
    });
  } catch (error: any) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create PayPal order',
      error: error.message,
    });
  }
}

export async function capturePayPalPayment(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {orderId} = req.params;
    const accessToken = await getPayPalAccessToken();

    // Capture the payment
    const response = await fetch(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const captureData = await response.json();

    // Update order and payment status - now properly populating user
    const order = await Order.findOneAndUpdate(
      {paymentId: orderId},
      {
        status: 'processing',
        updatedAt: new Date(),
      },
      {new: true},
    ).populate('user', 'email'); // Only populate email field from user

    await Payment.findOneAndUpdate(
      {paypalOrderId: orderId},
      {
        status: 'completed',
        updatedAt: new Date(),
      },
    );

    if (order && order.user) {
      const userEmail = (order.user as unknown as IUser).email;
      // Send confirmation emails
      await sendOrderConfirmationEmail(userEmail, order);
      await sendAdminNotification(order, userEmail);

      // Clear the cart
      await Cart.findOneAndUpdate(
        {user: order.user},
        {
          items: [],
          subtotal: 0,
          total: 0,
        },
      );
    }

    res.status(200).json({
      success: true,
      captureId: captureData.purchase_units[0].payments.captures[0].id,
    });
  } catch (error: any) {
    console.error('Error capturing PayPal payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to capture payment',
      error: error.message,
    });
  }
}

export async function handlePayPalWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {event_type, resource} = req.body;

    switch (event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const orderId = resource.purchase_units[0].reference_id;
        const transactionId = resource.id;

        // Update order if not already processed - now properly populating user
        const order = await Order.findOne({paymentId: orderId}).populate(
          'user',
          'email',
        );
        if (order?.status === 'pending') {
          order.status = 'processing';
          order.updatedAt = new Date();
          await order.save();

          // Update payment record
          await Payment.findOneAndUpdate(
            {paypalOrderId: orderId},
            {
              status: 'completed',
              updatedAt: new Date(),
            },
          );

          // Send notifications if not already sent
          const userEmail = (order.user as unknown as IUser).email;
          await sendOrderConfirmationEmail(userEmail, order);
          await sendAdminNotification(order, userEmail);
        }
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED':
        // Handle payment denial
        await Payment.findOneAndUpdate(
          {paypalOrderId: resource.id},
          {
            status: 'failed',
            updatedAt: new Date(),
          },
        );
        break;
    }

    res.status(200).json({received: true});
  } catch (error: any) {
    console.error('PayPal webhook error:', error);
    // Still return 200 to acknowledge receipt
    res.status(200).json({
      received: true,
      error: error.message,
    });
  }
}
