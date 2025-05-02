import express, {Router} from 'express';
import * as discountController from '../controllers/discountController';
import {authenticate, authorizeAdmin} from '../middleware/authMiddleware';

const router: Router = express.Router();

// Admin routes (Create, Read, Update, Delete)
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  discountController.createDiscount,
);

router.get(
  '/',
  authenticate,
  authorizeAdmin,
  discountController.getAllDiscounts,
);

router.get(
  '/:id',
  authenticate,
  authorizeAdmin,
  discountController.getDiscountById,
);

router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  discountController.updateDiscount,
);

router.delete(
  '/:id',
  authenticate,
  authorizeAdmin,
  discountController.deleteDiscount,
);

// Customer routes (apply/remove discount)
router.post('/apply', authenticate, discountController.applyDiscountToCart);

router.delete(
  '/remove',
  authenticate,
  discountController.removeDiscountFromCart,
);

export default router;
