"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController = __importStar(require("./controllers/adminController"));
const productController = __importStar(require("./controllers/productController"));
const cartController = __importStar(require("./controllers/cartController"));
const favoriteController = __importStar(require("./controllers/favoriteController"));
const PaymentRoutes_1 = __importDefault(require("./routes/PaymentRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const router = express_1.default.Router();
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
router.get('/admin/users', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, adminController.getAllUsers);
router.delete('/admin/users/:id', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, adminController.deleteUser);
// Product routes
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);
// In your routes file
router.post('/products', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, productController.createProduct);
router.put('/products/:id', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, productController.updateProduct);
router.put('/products/:id/images', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, productController.updateProductImages);
router.delete('/products/:id', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, productController.deleteProduct);
// Cart routes
router.get('/cart', authMiddleware_1.authenticate, cartController.getCart);
router.get('/cart-quantity', authMiddleware_1.authenticate, cartController.getCartQuantity);
router.post('/cart/add', authMiddleware_1.authenticate, cartController.addToCart);
router.put('/cart/update', authMiddleware_1.authenticate, cartController.updateCartItem);
router.delete('/cart/remove/:productId', authMiddleware_1.authenticate, cartController.removeFromCart);
router.delete('/clear', authMiddleware_1.authenticate, cartController.clearCart);
// Favorite routes
router.get('/favorites', authMiddleware_1.authenticate, favoriteController.getFavorites);
router.post('/favorites/add/:productId', authMiddleware_1.authenticate, favoriteController.addToFavorites);
router.delete('/favorites/remove/:productId', authMiddleware_1.authenticate, favoriteController.removeFromFavorites);
// router.post('/', authenticate, orderController.createOrder);
// router.get('/', authenticate, orderController.getOrders);
// router.get('/:id', authenticate, orderController.getOrderById);
// router.put('/:id/status', authenticate, orderController.updateOrderStatus);
router.use('/orders', orderRoutes_1.default);
// Payment routes
router.use('/payments', PaymentRoutes_1.default);
// User routes
router.use('/users', userRoutes_1.default);
exports.default = router;
