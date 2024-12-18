"use strict";
// import {Request, Response, NextFunction, RequestHandler} from 'express';
// import Favorite from '../models/Favorite';
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
exports.clearFavorites = exports.removeFromFavorites = exports.addToFavorites = exports.getFavorites = void 0;
const Favorite_1 = __importDefault(require("../models/Favorite"));
const Product_1 = require("../models/Product");
// Get the user's favorites
const getFavorites = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
        const favorites = yield Favorite_1.default.findOne({ user: req.user._id }).populate('items.product');
        if (!favorites) {
            res
                .status(404)
                .json({ success: false, message: 'No favorites found for this user' });
            return;
        }
        res.status(200).json({
            success: true,
            data: favorites,
            message: 'Favorites retrieved successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving favorites',
            error: error.message,
        });
        next(error);
    }
});
exports.getFavorites = getFavorites;
// Add a product to the user's favorites
const addToFavorites = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.body;
    try {
        const product = yield Product_1.Product.findById(productId);
        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }
        if (!req.user) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
        let favorite = yield Favorite_1.default.findOne({ user: req.user._id });
        if (!favorite) {
            favorite = new Favorite_1.default({
                user: req.user._id,
                items: [],
            });
        }
        const existingItem = favorite.items.find(item => item.product.toString() === productId);
        if (existingItem) {
            res
                .status(400)
                .json({ success: false, message: 'Product is already in favorites' });
            return;
        }
        favorite.items.push({ product: productId });
        yield favorite.save();
        res.status(201).json({
            success: true,
            data: favorite,
            message: 'Product added to favorites',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding product to favorites',
            error: error.message,
        });
        next(error);
    }
});
exports.addToFavorites = addToFavorites;
// Remove a product from the user's favorites
const removeFromFavorites = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
        const favorite = yield Favorite_1.default.findOne({ user: req.user._id });
        if (!favorite) {
            res.status(404).json({ success: false, message: 'Favorites not found' });
            return;
        }
        favorite.items = favorite.items.filter(item => item.product.toString() !== productId);
        yield favorite.save();
        res.status(200).json({
            success: true,
            data: favorite,
            message: 'Product removed from favorites',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error removing product from favorites',
            error: error.message,
        });
        next(error);
    }
});
exports.removeFromFavorites = removeFromFavorites;
// Clear all items from the user's favorites
const clearFavorites = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
        const favorite = yield Favorite_1.default.findOneAndUpdate({ user: req.user._id }, { items: [] }, { new: true });
        if (!favorite) {
            res.status(404).json({ success: false, message: 'Favorites not found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: favorite,
            message: 'Favorites cleared successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error clearing favorites',
            error: error.message,
        });
        next(error);
    }
});
exports.clearFavorites = clearFavorites;
