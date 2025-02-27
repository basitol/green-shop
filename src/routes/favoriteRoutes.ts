import express from 'express';
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  clearFavorites,
} from '../controllers/favoriteController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
// router.use(authenticate);

// Get user's favorites
router.get('/', authenticate, getFavorites);

// Add to favorites
router.post('/add', authenticate, addToFavorites);

// Remove from favorites
router.delete('/remove/:productId', authenticate, removeFromFavorites);

// Clear all favorites
router.delete('/clear', authenticate, clearFavorites);

export default router;