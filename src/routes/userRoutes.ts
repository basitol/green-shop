import express from 'express';
import * as userController from '../controllers/userController';
import {authenticate, authorizeAdmin} from '../middleware/authMiddleware';

const router = express.Router();

interface AuthenticatedRequest extends express.Request {
  user: {
    _id: string;
    id: string;
    role: string;
  };
}

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.loginLimiter, userController.login);
router.post('/forgot-password', userController.forgotPassword);

// Authenticated user routes
router.get('/profile', authenticate, (req, res, next) => {
  const authenticatedReq = req as AuthenticatedRequest;
  userController.getProfile(authenticatedReq, res, next);
});
router.put('/profile', authenticate, (req, res, next) => {
  const authenticatedReq = req as AuthenticatedRequest;
  userController.updateProfile(authenticatedReq, res, next);
});

// Admin routes
router.get(
  '/admin/list',
  authenticate,
  authorizeAdmin,
  userController.getAllUsers,
);

router.get(
  '/admin/:id',
  authenticate,
  authorizeAdmin,
  userController.getUserById,
);

router.put(
  '/admin/:id',
  authenticate,
  authorizeAdmin,
  userController.updateUser,
);

router.delete(
  '/admin/:id',
  authenticate,
  authorizeAdmin,
  userController.deleteUser,
);

router.patch(
  '/admin/:id/role',
  authenticate,
  authorizeAdmin,
  userController.updateUserRole,
);

router.get(
  '/generate-admin-token',
  authenticate,
  authorizeAdmin,
  (req, res, next) => {
    const authenticatedReq = req as AuthenticatedRequest;
    userController.generateAdminCreationToken(authenticatedReq, res, next);
  },
);

// Update reset password route to not require token
router.post('/reset-password', userController.resetPassword);

router.post('/password/forgot', userController.forgotPassword);
router.put('/password/reset/:token', userController.resetPassword);

// Admin creation route
router.post('/admin/register', userController.createAdmin);

export default router;
