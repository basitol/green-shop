import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cart from '../models/Cart';

dotenv.config();

async function createTestCart() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Create a test cart
    const cart = await Cart.create({
      user: new mongoose.Types.ObjectId('67059adedd542294167366d0'), // Your test user ID
      items: [
        {
          product: new mongoose.Types.ObjectId('67059adedd542294167366d1'), // Test product ID
          quantity: 1,
          price: 999.99
        }
      ],
      shipping: 0
    });

    console.log('Test cart created:', cart.id);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestCart();
