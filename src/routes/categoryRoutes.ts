import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import {isAuthenticatedUser, authorizeRoles} from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategory);

// Protected routes (admin only)
router.post('/', 
  (req, res, next) => {
    console.log('Auth Headers:', req.headers.authorization);
    console.log('Cookies:', req.cookies);
    next();
  },
  isAuthenticatedUser, 
  authorizeRoles('admin'), 
  createCategory
);

router.put(
  '/:id',
  (req, res, next) => {
    console.log('Auth Headers:', req.headers.authorization);
    console.log('Cookies:', req.cookies);
    next();
  },
  isAuthenticatedUser,
  authorizeRoles('admin'),
  updateCategory,
);

router.delete(
  '/:id',
  (req, res, next) => {
    console.log('Auth Headers:', req.headers.authorization);
    console.log('Cookies:', req.cookies);
    next();
  },
  isAuthenticatedUser,
  authorizeRoles('admin'),
  deleteCategory,
);

export default router;
