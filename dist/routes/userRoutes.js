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
const userController = __importStar(require("../controllers/userController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.post('/register', userController.register);
router.post('/login', userController.loginLimiter, userController.login);
router.post('/forgot-password', userController.passwordResetLimiter, userController.forgotPassword);
router.post('/reset-password', userController.passwordResetLimiter, userController.resetPassword);
// Authenticated user routes
router.get('/profile', authMiddleware_1.authenticate, (req, res, next) => {
    const authenticatedReq = req;
    userController.getProfile(authenticatedReq, res, next);
});
router.put('/profile', authMiddleware_1.authenticate, (req, res, next) => {
    const authenticatedReq = req;
    userController.updateProfile(authenticatedReq, res, next);
});
// Admin routes
router.get('/admin/list', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, userController.getAllUsers);
router.get('/admin/:id', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, userController.getUserById);
router.put('/admin/:id', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, userController.updateUser);
router.delete('/admin/:id', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, userController.deleteUser);
router.patch('/admin/:id/role', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, userController.updateUserRole);
router.get('/admin/token', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, (req, res, next) => {
    const authenticatedReq = req;
    userController.generateAdminCreationToken(authenticatedReq, res, next);
});
exports.default = router;
