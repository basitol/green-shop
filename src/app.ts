import dotenv from 'dotenv';
import path from 'path';
// import cookieParser from 'cookie-parser';

// Load environment variables first
dotenv.config({path: path.join(__dirname, '../.env')});

import express from 'express';
import expressFileUpload from 'express-fileupload';
import mongoose from 'mongoose';
import cors from 'cors';
import routes from './routes';
import paymentRoutes from './routes/PaymentRoutes';
import {errorHandler} from './middleware/errorMiddleware';
import {initializeAdmin} from './utils/initializeAdmin';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
// app.use(cookieParser());
app.use(express.urlencoded({extended: true}));

// File upload middleware
app.use(
  expressFileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
  }),
);

// Routes
app.use('/api', routes);
app.use('/payments', paymentRoutes);

// Error handling middleware
app.use(errorHandler);

// MongoDB connection with retry logic
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error('MongoDB connection string is not defined');
    }

    await mongoose.connect(MONGODB_URI, {});
    console.log('Connected to MongoDB successfully');

    // Initialize admin accounts after successful connection
    await initializeAdmin();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    setTimeout(connectDB, 5000);
  }
};

// Start server only after DB connection
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

export default app;
