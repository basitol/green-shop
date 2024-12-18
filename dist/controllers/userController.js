"use strict";
// import {Request, Response, NextFunction, RequestHandler} from 'express';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import User from '../models/User';
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
exports.updateProfile = exports.getProfile = exports.generateAdminCreationToken = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
// Register a new user
const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password, role, adminCreationToken } = req.body;
        if (!username || !email || !password) {
            res
                .status(400)
                .json({ success: false, message: 'All fields are required' });
            return;
        }
        const existingUser = yield User_1.default.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'User already exists' });
            return;
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        let userRole = 'user';
        if (role === 'admin') {
            if (!adminCreationToken) {
                res
                    .status(403)
                    .json({ success: false, message: 'Admin creation token required' });
                return;
            }
            try {
                jsonwebtoken_1.default.verify(adminCreationToken, process.env.ADMIN_CREATION_SECRET);
                userRole = 'admin';
            }
            catch (error) {
                res
                    .status(403)
                    .json({ success: false, message: 'Invalid admin creation token' });
                return;
            }
        }
        const newUser = new User_1.default({
            username,
            email,
            password: hashedPassword,
            role: userRole,
        });
        yield newUser.save();
        res
            .status(201)
            .json({ success: true, message: 'User registered successfully' });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message,
        });
        next(error);
    }
});
exports.register = register;
// Login a user
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res
                .status(400)
                .json({ success: false, message: 'Email and password are required' });
            return;
        }
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            res.status(400).json({ success: false, message: 'Invalid credentials' });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ success: false, message: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message,
        });
        next(error);
    }
});
exports.login = login;
// Generate admin creation token
const generateAdminCreationToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            res
                .status(403)
                .json({ success: false, message: 'Access denied. Admin only.' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ purpose: 'admin_creation' }, process.env.ADMIN_CREATION_SECRET, { expiresIn: '1h' });
        res.json({
            success: true,
            message: 'Admin creation token generated',
            data: { adminCreationToken: token },
        });
    }
    catch (error) {
        console.error('Admin creation token generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate admin creation token',
            error: error.message,
        });
        next(error);
    }
});
exports.generateAdminCreationToken = generateAdminCreationToken;
// Get user profile
const getProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        const user = yield User_1.default.findById(req.user._id).select('-password');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.json({
            success: true,
            message: 'Profile retrieved successfully',
            data: user,
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile',
            error: error.message,
        });
        next(error);
    }
});
exports.getProfile = getProfile;
// Update user profile
const updateProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        const { username, email } = req.body;
        if (!username && !email) {
            res
                .status(400)
                .json({ success: false, message: 'No update data provided' });
            return;
        }
        const user = yield User_1.default.findByIdAndUpdate(req.user._id, { username, email }, { new: true, runValidators: true }).select('-password');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user,
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message,
        });
        next(error);
    }
});
exports.updateProfile = updateProfile;
