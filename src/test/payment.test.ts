import axios from 'axios';
import dotenv from 'dotenv';
import { Types } from 'mongoose';

dotenv.config();

const API_URL = 'http://localhost:3000'; // adjust if your port is different
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || 'your_auth_token_here'; // you'll need to login first to get this

async function testOrderAndPaymentFlow() {
  try {
    // 1. Create an order
    console.log('1. Creating order...');
    const orderResponse = await axios.post(
      `${API_URL}/orders`,
      {
        items: [
          {
            product: "product_id_here", // replace with actual product ID
            quantity: 1,
            price: 999.99
          }
        ],
        shippingAddress: "123 Test Street, Test City, 12345"
      },
      {
        headers: {
          Authorization: `Bearer ${TEST_USER_TOKEN}`
        }
      }
    );
    
    const orderId = orderResponse.data._id;
    console.log('Order created:', orderId);

    // 2. Test Stripe Payment
    console.log('\n2. Testing Stripe payment...');
    const stripeResponse = await axios.post(
      `${API_URL}/payments/stripe/init`,
      { orderId },
      {
        headers: {
          Authorization: `Bearer ${TEST_USER_TOKEN}`
        }
      }
    );
    console.log('Stripe payment intent created:', stripeResponse.data);

    // 3. Test PayPal Payment
    console.log('\n3. Testing PayPal payment...');
    const testData = {
      cartId: orderId, 
      shippingAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'US'
      }
    };

    console.log('Initializing PayPal payment with test data:', testData);

    const paypalResponse = await axios.post(
      `${API_URL}/payments/paypal/init`,
      testData,
      {
        headers: {
          Authorization: `Bearer ${TEST_USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\nPayPal Response:', {
      orderId: paypalResponse.data.orderId,
      approvalUrl: paypalResponse.data.approvalUrl,
      total: paypalResponse.data.total,
      currency: paypalResponse.data.currency
    });

    if (paypalResponse.data.approvalUrl) {
      console.log('\nSuccess! You can now:');
      console.log('1. Open this URL in a browser to complete the payment:');
      console.log(paypalResponse.data.approvalUrl);
      console.log('\n2. Use this order ID for capture:', paypalResponse.data.orderId);
    }

  } catch (error: any) {
    console.error('Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testOrderAndPaymentFlow();
