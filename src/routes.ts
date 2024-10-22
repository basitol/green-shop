import express, {Router} from 'express';
import * as userController from './controllers/userController';
import * as adminController from './controllers/adminController';
import * as productController from './controllers/productController';
import * as cartController from './controllers/cartController';
import * as favoriteController from './controllers/favoriteController';
import * as orderController from './controllers/orderController'; // Updated path
import {authenticate, authorizeAdmin} from './middleware/authMiddleware';

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
router.post('/users/register', userController.register);
router.post('/users/login', userController.login);
router.get('/users/profile', authenticate, (req, res, next) => {
  const authenticatedReq = req as AuthenticatedRequest; // Type assertion
  userController.getProfile(authenticatedReq, res, next);
});
router.put('/users/profile', authenticate, (req, res, next) => {
  const authenticatedReq = req as AuthenticatedRequest; // Type assertion
  userController.updateProfile(authenticatedReq, res, next);
});
router.get(
  '/generate-admin-token',
  authenticate,
  authorizeAdmin,
  (req, res, next) => {
    const authenticatedReq = req as AuthenticatedRequest;
    userController.generateAdminCreationToken(authenticatedReq, res, next);
  },
);

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
router.delete(
  '/products/:id',
  authenticate,
  authorizeAdmin,
  productController.deleteProduct,
);

// Cart routes
router.get('/cart', authenticate, cartController.getCart);
router.post('/cart/add', authenticate, cartController.addToCart);
router.put('/cart/update', authenticate, cartController.updateCartItem);
router.delete(
  '/cart/remove/:productId',
  authenticate,
  cartController.removeFromCart,
);
router.delete('/clear', authenticate, cartController.clearCart);

// Favorite routes
router.get('/favorites', authenticate, favoriteController.getFavorites);
router.post(
  '/favorites/add/:productId',
  authenticate,
  favoriteController.addToFavorites,
);
router.delete(
  '/favorites/remove/:productId',
  authenticate,
  favoriteController.removeFromFavorites,
);

router.post('/', authenticate, orderController.createOrder);
router.get('/', authenticate, orderController.getOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.put('/:id/status', authenticate, orderController.updateOrderStatus);

export default router;
