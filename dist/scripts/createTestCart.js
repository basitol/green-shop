"use strict";
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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Cart_1 = __importDefault(require("../models/Cart"));
dotenv_1.default.config();
function createTestCart() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
            console.log('Connected to MongoDB');
            // Create a test cart
            const cart = yield Cart_1.default.create({
                user: new mongoose_1.default.Types.ObjectId('67059adedd542294167366d0'), // Your test user ID
                items: [
                    {
                        product: new mongoose_1.default.Types.ObjectId('67059adedd542294167366d1'), // Test product ID
                        quantity: 1,
                        price: 999.99
                    }
                ],
                shipping: 0
            });
            console.log('Test cart created:', cart.id);
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
createTestCart();
