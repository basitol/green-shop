import express, {Router} from 'express';
import * as userController from './controllers/userController';
import * as adminController from './controllers/adminController';
import * as productController from './controllers/productController';
import * as cartController from './controllers/cartController';
import * as favoriteController from './controllers/favoriteController';
import * as orderController from './controllers/orderController'; // Updated path
import paymentRoutes from './routes/PaymentRoutes';
import orderRoutes from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';
import {authenticate, authorizeAdmin} from './middleware/authMiddleware';
import categoryRoutes from './routes/categoryRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
const router: Router = express.Router();

// Update the AuthenticatedRequest type definition to include 'id' and 'role'
interface AuthenticatedRequest extends express.Request {
  user: {
    _id: string;
    id: string; // Add this line
    role: string; // Add this line
  };
}

// User routes
// router.post('/users/register', userController.register);
// router.post('/users/login', userController.loginLimiter, userController.login);
// router.post('/users/forgot-password', userController.passwordResetLimiter, userController.forgotPassword);
// router.post('/users/reset-password', userController.passwordResetLimiter, userController.resetPassword);
// router.get('/users/profile', authenticate, (req, res, next) => {
//   const authenticatedReq = req as AuthenticatedRequest; // Type assertion
//   userController.getProfile(authenticatedReq, res, next);
// });
// router.put('/users/profile', authenticate, (req, res, next) => {
//   const authenticatedReq = req as AuthenticatedRequest; // Type assertion
//   userController.updateProfile(authenticatedReq, res, next);
// });
// router.get(
//   '/generate-admin-token',
//   authenticate,
//   authorizeAdmin,
//   (req, res, next) => {
//     const authenticatedReq = req as AuthenticatedRequest;
//     userController.generateAdminCreationToken(authenticatedReq, res, next);
//   },
// );

// Admin routes
router.get(
  '/admin/users',
  authenticate,
  authorizeAdmin,
  adminController.getAllUsers,
);
router.delete(
  '/admin/users/:id',
  authenticate,
  authorizeAdmin,
  adminController.deleteUser,
);

// Product routes
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);
// In your routes file
router.post(
  '/products',
  authenticate,
  authorizeAdmin,
  productController.createProduct,
);
router.put(
  '/products/:id',
  authenticate,
  authorizeAdmin,
  productController.updateProduct,
);
router.put(
  '/products/:id/images',
  authenticate,
  authorizeAdmin,
  productController.updateProductImages,
);
router.delete(
  '/products/:id',
  authenticate,
  authorizeAdmin,
  productController.deleteProduct,
);
router.get(
  '/products/category/:categoryId',
  productController.getProductsByCategory,
);

// Cart routes
router.get('/cart', authenticate, cartController.getCart);
router.get('/cart-quantity', authenticate, cartController.getCartQuantity);
router.post('/cart/add', authenticate, cartController.addToCart);
router.put('/cart/update', authenticate, cartController.updateCartItem);
router.delete(
  '/cart/remove/:productId',
  authenticate,
  cartController.removeFromCart,
);
router.delete('/clear', authenticate, cartController.clearCart);

// Favorite routes
// router.get('/favorites', authenticate, favoriteController.getFavorites);
// router.post(
//   '/favorites/add/:productId',
//   authenticate,
//   favoriteController.addToFavorites,
// );
// router.delete(
//   '/favorites/remove/:productId',
//   authenticate,
//   favoriteController.removeFromFavorites,
// );

// router.post('/', authenticate, orderController.createOrder);
// router.get('/', authenticate, orderController.getOrders);
// router.get('/:id', authenticate, orderController.getOrderById);
// router.put('/:id/status', authenticate, orderController.updateOrderStatus);

router.use('/orders', orderRoutes);
// Payment routes
router.use('/payments', paymentRoutes);
// User routes
router.use('/users', userRoutes);
// Category routes
router.use('/categories', categoryRoutes);
// Favorite routes
router.use('/favorites', favoriteRoutes);

export default router;
