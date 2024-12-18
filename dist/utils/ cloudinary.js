"use strict";
// import {v2 as cloudinary} from 'cloudinary';
// import fileUpload from 'express-fileupload';
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
exports.cloudinary = exports.deleteFromCloudinary = exports.uploadToCloudinary = exports.isValidImageType = exports.fileUploadOptions = void 0;
// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });
// // Configure express-fileupload options
// export const fileUploadOptions: fileUpload.Options = {
//   useTempFiles: true,
//   tempFileDir: '/tmp/',
//   limits: {fileSize: 50 * 1024 * 1024}, // 50MB max file size
//   abortOnLimit: true,
//   createParentPath: true,
//   parseNested: true,
// };
// // Helper function to check file type
// export const isValidImageType = (mimetype: string): boolean => {
//   return /^image\/(jpg|jpeg|png|webp)$/.test(mimetype);
// };
// // Helper function for cloudinary upload with standard options
// export const uploadToCloudinary = async (
//   file: fileUpload.UploadedFile,
//   folder: string = 'products',
// ) => {
//   try {
//     // Check file type before upload
//     if (!isValidImageType(file.mimetype)) {
//       throw new Error(
//         'Invalid file type. Only jpg, jpeg, png, and webp are allowed.',
//       );
//     }
//     const result = await cloudinary.uploader.upload(file.tempFilePath, {
//       folder,
//       resource_type: 'auto',
//       transformation: [{width: 1000, height: 1000, crop: 'limit'}],
//     });
//     return {
//       public_id: result.public_id,
//       url: result.secure_url,
//     };
//   } catch (error) {
//     console.error('Error uploading to Cloudinary:', error);
//     throw error;
//   }
// };
// // Helper function to delete image from Cloudinary
// export const deleteFromCloudinary = async (public_id: string) => {
//   try {
//     return await cloudinary.uploader.destroy(public_id);
//   } catch (error) {
//     console.error('Error deleting from Cloudinary:', error);
//     throw error;
//   }
// };
// export {cloudinary};
// src/utils/cloudinary.ts
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const dotenv_1 = __importDefault(require("dotenv"));
// Initialize dotenv
dotenv_1.default.config();
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Configure express-fileupload options
exports.fileUploadOptions = {
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    abortOnLimit: true,
    createParentPath: true,
    parseNested: true,
};
// Helper function to check file type
const isValidImageType = (mimetype) => {
    return /^image\/(jpg|jpeg|png|webp)$/.test(mimetype);
};
exports.isValidImageType = isValidImageType;
// Helper function for cloudinary upload with standard options
const uploadToCloudinary = (file_1, ...args_1) => __awaiter(void 0, [file_1, ...args_1], void 0, function* (file, folder = 'products') {
    try {
        // Check file type before upload
        if (!(0, exports.isValidImageType)(file.mimetype)) {
            throw new Error('Invalid file type. Only jpg, jpeg, png, and webp are allowed.');
        }
        const result = yield cloudinary_1.v2.uploader.upload(file.tempFilePath, {
            folder,
            resource_type: 'auto',
            transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
        });
        return {
            public_id: result.public_id,
            url: result.secure_url,
        };
    }
    catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
});
exports.uploadToCloudinary = uploadToCloudinary;
// Helper function to delete image from Cloudinary
const deleteFromCloudinary = (public_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield cloudinary_1.v2.uploader.destroy(public_id);
    }
    catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
});
exports.deleteFromCloudinary = deleteFromCloudinary;
