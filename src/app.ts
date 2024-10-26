// import express from 'express';
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import routes from './routes';
// import {errorHandler} from './middleware/errorMiddleware';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;
// const MONGODB_URI =
//   process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

// app.use(express.json());

// mongoose
//   .connect(MONGODB_URI)
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(error => console.error('MongoDB connection error:', error));

// app.use('/api', routes);

// app.use(errorHandler);

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes';
import {errorHandler} from './middleware/errorMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

// CORS configuration options
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS || '*', // Specify allowed origins or use * for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Enable credentials (cookies, authorization headers, etc)
  optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on 204
};

// Apply CORS middleware before other middleware
app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests
app.options('*', cors(corsOptions));

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('MongoDB connection error:', error));

app.use('/api', routes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
