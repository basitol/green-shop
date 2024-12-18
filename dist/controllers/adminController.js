"use strict";
// import {Request, Response, NextFunction, RequestHandler} from 'express';
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
exports.deleteUser = exports.getAllUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const getAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield User_1.default.find().select('-password');
        if (!users.length) {
            res.status(404).json({
                success: false,
                message: 'No users found in the database.',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: users,
            message: `${users.length} user(s) retrieved successfully.`,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users. Please try again later.',
            error: error.message,
        });
        next(error);
    }
});
exports.getAllUsers = getAllUsers;
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findByIdAndDelete(req.params.id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found with the specified ID.',
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'User deleted successfully.',
            data: { userId: req.params.id },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete user. Please try again later.',
            error: error.message,
        });
        next(error);
    }
});
exports.deleteUser = deleteUser;
