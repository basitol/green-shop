import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import expressFileUpload from 'express-fileupload';
import mongoose from 'mongoose';
import cors from 'cors';
import routes from './routes';
import paymentRoutes from './routes/PaymentRoutes';
import { errorHandler } from './middleware/errorMiddleware';

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

// CORS configuration options
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

// File upload middleware
app.use(expressFileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: true, // Enable debug mode
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
}));

// Routes
app.use('/api', routes);
app.use('/payments', paymentRoutes);

// Error handling
app.use(errorHandler);

// MongoDB connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

export default app;
