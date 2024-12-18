"use strict";
// import {Request, Response, NextFunction, RequestHandler} from 'express';
// import Cart from '../models/Cart';
// import Product from '../models/Product';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCartQuantity = exports.getCart = void 0;
const Cart_1 = __importDefault(require("../models/Cart"));
const Product_1 = require("../models/Product");
// Get cart for a specific user
const getCart = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user._id) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const cart = yield Cart_1.default.findOne({ user: req.user._id }).populate('items.product');
        if (!cart) {
            res.status(404).json({ success: false, message: 'Cart not found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: cart,
            message: 'Cart retrieved successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving cart',
            error: error.message,
        });
        next(error);
    }
});
exports.getCart = getCart;
const getCartQuantity = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user._id) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const cart = yield Cart_1.default.findOne({ user: req.user._id });
        if (!cart || cart.items.length === 0) {
            res
                .status(404)
                .json({ success: false, message: 'Cart not found or is empty' });
            return;
        }
        const totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0);
        res.status(200).json({
            success: true,
            data: totalQuantity,
            message: 'Total quantity retrieved successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving cart quantity',
            error: error.message,
        });
        next(error);
    }
});
exports.getCartQuantity = getCartQuantity;
// Add item to cart
const addToCart = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user._id) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { productId, quantity } = req.body;
        let cart = yield Cart_1.default.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart_1.default({ user: req.user._id, items: [] });
        }
        const existingItem = cart.items.find(item => item.product.toString() === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        }
        else {
            const product = yield Product_1.Product.findById(productId);
            if (!product) {
                res.status(404).json({ success: false, message: 'Product not found' });
                return;
            }
            cart.items.push({ product: productId, quantity, price: product.price });
        }
        yield cart.save();
        res
            .status(200)
            .json({ success: true, data: cart, message: 'Item added to cart' });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding item to cart',
            error: error.message,
        });
        next(error);
    }
});
exports.addToCart = addToCart;
// Update item quantity in the cart
const updateCartItem = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, quantity } = req.body;
    try {
        if (!req.user || !req.user._id) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
        const cart = yield Cart_1.default.findOne({ user: req.user._id });
        if (!cart) {
            res.status(404).json({ success: false, message: 'Cart not found' });
            return;
        }
        const item = cart.items.find(item => item.product.toString() === productId);
        if (!item) {
            res.status(404).json({ success: false, message: 'Item not found in cart' });
            return;
        }
        item.quantity = quantity;
        yield cart.save();
        res.status(200).json({
            success: true,
            data: cart,
            message: 'Cart item updated successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating cart item',
            error: error.message,
        });
        next(error);
    }
});
exports.updateCartItem = updateCartItem;
// Remove item from cart
const removeFromCart = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    try {
        if (!req.user || !req.user._id) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
        const cart = yield Cart_1.default.findOne({ user: req.user._id });
        if (!cart) {
            res.status(404).json({ success: false, message: 'Cart not found' });
            return;
        }
        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        yield cart.save();
        res
            .status(200)
            .json({ success: true, data: cart, message: 'Item removed from cart' });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error removing item from cart',
            error: error.message,
        });
        next(error);
    }
});
exports.removeFromCart = removeFromCart;
// Clear the cart
const clearCart = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user._id) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
        const cart = yield Cart_1.default.findOneAndUpdate({ user: req.user._id }, { items: [] }, { new: true });
        if (!cart) {
            res.status(404).json({ success: false, message: 'Cart not found' });
            return;
        }
        res
            .status(200)
            .json({ success: true, data: cart, message: 'Cart cleared successfully' });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message,
        });
        next(error);
    }
});
exports.clearCart = clearCart;
