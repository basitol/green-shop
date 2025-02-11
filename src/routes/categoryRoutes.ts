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
router.post('/', isAuthenticatedUser, authorizeRoles('admin'), createCategory);
router.put('/:id', isAuthenticatedUser, authorizeRoles('admin'), updateCategory);
router.delete('/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteCategory);

export default router;
