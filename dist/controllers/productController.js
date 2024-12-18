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
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitReview = exports.deleteProduct = exports.updateProductImages = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getAllProducts = void 0;
const Product_1 = require("../models/Product");
// import {
//   uploadToCloudinary,
//   deleteFromCloudinary,
//   isValidImageType,
// } from '../utils/cloudinary';
const cloudinary_1 = require("cloudinary");
// Get all products
const getAllProducts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield Product_1.Product.find();
        res.status(200).json({
            success: true,
            data: products,
            message: 'Products retrieved successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving products',
            error: error.message,
        });
        next(error);
    }
});
exports.getAllProducts = getAllProducts;
// Get product by ID
const getProductById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield Product_1.Product.findById(req.params.id);
        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: product,
            message: 'Product retrieved successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving product',
            error: error.message,
        });
        next(error);
    }
});
exports.getProductById = getProductById;
// export const createProduct = async (
//   req: Request,
//   res: Response<ApiResponse<IProduct>>,
//   next: NextFunction,
// ): Promise<void> => {
//   try {
//     const {name, description, color, storage, price, stock} = req.body;
//     // Type check for files
//     if (!req.files || Object.keys(req.files).length === 0) {
//       res.status(400).json({
//         success: false,
//         message: 'Main image is required',
//       });
//       return;
//     }
//     const files = req.files as fileUpload.FileArray;
//     const mainImageFile = files.mainImage as fileUpload.UploadedFile;
//     if (!mainImageFile) {
//       res.status(400).json({
//         success: false,
//         message: 'Main image is required',
//       });
//       return;
//     }
//     // Upload main image to Cloudinary
//     const mainImageUpload = await cloudinary.uploader.upload(
//       mainImageFile.tempFilePath,
//       {
//         folder: 'products',
//         transformation: [{width: 1000, height: 1000, crop: 'limit'}],
//       },
//     );
//     let images: {public_id: string; url: string}[] = [];
//     // Handle additional images if they exist
//     if (files.images) {
//       const imageFiles = Array.isArray(files.images)
//         ? files.images
//         : [files.images];
//       // Upload additional images
//       for (const file of imageFiles) {
//         const result = await cloudinary.uploader.upload(
//           (file as fileUpload.UploadedFile).tempFilePath,
//           {
//             folder: 'products',
//             transformation: [{width: 1000, height: 1000, crop: 'limit'}],
//           },
//         );
//         images.push({
//           public_id: result.public_id,
//           url: result.secure_url,
//         });
//       }
//     }
//     // Create product with uploaded images
//     const product = new Product({
//       name,
//       description,
//       color,
//       storage,
//       price: parseFloat(price),
//       stock: parseInt(stock, 10),
//       mainImage: mainImageUpload.secure_url,
//       images,
//     });
//     await product.save();
//     res.status(201).json({
//       success: true,
//       data: product,
//       message: 'Product created successfully',
//     });
//   } catch (error) {
//     console.error('Error in createProduct:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Something went wrong while creating the product',
//       error: error instanceof Error ? error.message : 'Unknown error',
//     });
//     next(error);
//   }
// };
const createProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, color, storage, price, stock } = req.body;
        // Type check for files
        if (!req.files || Object.keys(req.files).length === 0) {
            res.status(400).json({
                success: false,
                message: 'Main image is required',
            });
            return;
        }
        const files = req.files;
        const mainImageFile = files.mainImage;
        if (!mainImageFile) {
            res.status(400).json({
                success: false,
                message: 'Main image is required',
            });
            return;
        }
        // Upload main image to Cloudinary
        const mainImageUpload = yield cloudinary_1.v2.uploader.upload(mainImageFile.tempFilePath, {
            folder: 'products',
            transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
        });
        let images = []; // Changed to string array
        // Handle additional images if they exist
        if (files.images) {
            const imageFiles = Array.isArray(files.images)
                ? files.images
                : [files.images];
            // Upload additional images
            for (const file of imageFiles) {
                const result = yield cloudinary_1.v2.uploader.upload(file.tempFilePath, {
                    folder: 'products',
                    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
                });
                images.push(result.secure_url); // Only store the URL
            }
        }
        // Create product with uploaded images
        const product = new Product_1.Product({
            name,
            description,
            color,
            storage,
            price: parseFloat(price),
            stock: parseInt(stock, 10),
            mainImage: mainImageUpload.secure_url, // Only store the URL
            images,
        });
        yield product.save();
        res.status(201).json({
            success: true,
            data: product,
            message: 'Product created successfully',
        });
    }
    catch (error) {
        console.error('Error in createProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong while creating the product',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
});
exports.createProduct = createProduct;
const updateProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedProduct = yield Product_1.Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProduct) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: updatedProduct,
            message: 'Product updated successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message,
        });
        next(error);
    }
});
exports.updateProduct = updateProduct;
const updateProductImages = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield Product_1.Product.findById(req.params.id);
        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found',
            });
            return;
        }
        if (!req.files || Object.keys(req.files).length === 0) {
            res.status(400).json({
                success: false,
                message: 'No images provided for update',
            });
            return;
        }
        const files = req.files;
        // Handle main image update
        if (files.mainImage) {
            const mainImageFile = files.mainImage;
            // Upload new main image
            const mainImageUpload = yield cloudinary_1.v2.uploader.upload(mainImageFile.tempFilePath, {
                folder: 'products',
                transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
            });
            // Update product with new main image URL
            product.mainImage = mainImageUpload.secure_url;
        }
        // Handle additional images update
        if (files.images) {
            const imageFiles = Array.isArray(files.images)
                ? files.images
                : [files.images];
            // Upload new additional images
            const newImages = [];
            for (const file of imageFiles) {
                const result = yield cloudinary_1.v2.uploader.upload(file.tempFilePath, {
                    folder: 'products',
                    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
                });
                newImages.push(result.secure_url);
            }
            // Update product with new image URLs
            product.images = newImages;
        }
        yield product.save();
        res.status(200).json({
            success: true,
            data: product,
            message: 'Product images updated successfully',
        });
    }
    catch (error) {
        console.error('Error in updateProductImages:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product images',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
});
exports.updateProductImages = updateProductImages;
const deleteProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield Product_1.Product.findById(req.params.id);
        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }
        // Delete images from Cloudinary
        if (product.mainImage) {
            yield cloudinary_1.v2.uploader.destroy(product.mainImage);
        }
        for (const image of product.images) {
            if (image) {
                yield cloudinary_1.v2.uploader.destroy(image);
            }
        }
        yield Product_1.Product.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Product and associated images deleted successfully',
        });
    }
    catch (error) {
        console.error('Error in deleteProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
});
exports.deleteProduct = deleteProduct;
const submitReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { productId } = req.params;
        const { rating } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
        const product = yield Product_1.Product.findById(productId);
        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }
        // Update product rating
        product.rating =
            (product.rating * product.totalReviews + rating) /
                (product.totalReviews + 1);
        product.totalReviews += 1;
        yield product.save();
        res.status(201).json({
            success: true,
            data: product,
            message: 'Review submitted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error submitting review',
            error: error.message,
        });
        next(error);
    }
});
exports.submitReview = submitReview;
// export const updateProductImages = async (
//   req: Request,
//   res: Response<ApiResponse<ProductType>>,
//   next: NextFunction,
// ): Promise<void> => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       res.status(404).json({
//         success: false,
//         message: 'Product not found',
//       });
//       return;
//     }
//     if (!req.files || Object.keys(req.files).length === 0) {
//       res.status(400).json({
//         success: false,
//         message: 'No images provided for update',
//       });
//       return;
//     }
//     const files = req.files as fileUpload.FileArray;
//     // Handle main image update
//     if (files.mainImage) {
//       const mainImageFile = files.mainImage as fileUpload.UploadedFile;
//       // Delete old main image if it exists
//       if (product.mainImage?.public_id) {
//         await cloudinary.uploader.destroy(product.mainImage.public_id);
//       }
//       // Upload new main image
//       const mainImageUpload = await cloudinary.uploader.upload(
//         mainImageFile.tempFilePath,
//         {
//           folder: 'products',
//           transformation: [{width: 1000, height: 1000, crop: 'limit'}],
//         },
//       );
//       product.mainImage = {
//         public_id: mainImageUpload.public_id,
//         url: mainImageUpload.secure_url,
//       };
//     }
//     // Handle additional images update
//     if (files.images) {
//       const imageFiles = Array.isArray(files.images)
//         ? files.images
//         : [files.images];
//       // Delete old additional images
//       for (const image of product.images) {
//         if (image.public_id) {
//           await cloudinary.uploader.destroy(image.public_id);
//         }
//       }
//       // Upload new additional images
//       const newImages = [];
//       for (const file of imageFiles) {
//         const result = await cloudinary.uploader.upload(
//           (file as fileUpload.UploadedFile).tempFilePath,
//           {
//             folder: 'products',
//             transformation: [{width: 1000, height: 1000, crop: 'limit'}],
//           },
//         );
//         newImages.push({
//           public_id: result.public_id,
//           url: result.secure_url,
//         });
//       }
//       product.images = newImages;
//     }
//     await product.save();
//     res.status(200).json({
//       success: true,
//       data: product,
//       message: 'Product images updated successfully',
//     });
//   } catch (error) {
//     console.error('Error in updateProductImages:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating product images',
//       error: error instanceof Error ? error.message : 'Unknown error',
//     });
//     next(error);
//   }
// };
// export const updateProductImages: RequestHandler = async (
//   req: Request,
//   res: Response<ApiResponse<ProductType>>,
//   next: NextFunction,
// ) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       res.status(404).json({success: false, message: 'Product not found'});
//       return;
//     }
//     const files = req.files as Express.Multer.File[];
//     // Delete old images if updating main image
//     if (files[0] && product.mainImage) {
//       await deleteImage(product.mainImage.public_id);
//     }
//     // Update main image if provided
//     if (files[0]) {
//       product.mainImage = {
//         public_id: files[0].filename,
//         url: files[0].path,
//       };
//     }
//     // Update additional images if provided
//     if (files.length > 1) {
//       // Delete old additional images
//       for (const image of product.images) {
//         await deleteImage(image.public_id);
//       }
//       // Upload new additional images
//       product.images = files.slice(1).map(file => ({
//         public_id: file.filename,
//         url: file.path,
//       }));
//     }
//     await product.save();
//     res.status(200).json({
//       success: true,
//       data: product,
//       message: 'Product images updated successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error updating product images',
//       error: (error as Error).message,
//     });
//     next(error);
//   }
// };
// Delete product
// export const deleteProduct: RequestHandler = async (
//   req: Request,
//   res: Response<ApiResponse<null>>,
//   next: NextFunction,
// ) => {
//   try {
//     const product = await Product.findByIdAndDelete(req.params.id);
//     if (!product) {
//       res.status(404).json({success: false, message: 'Product not found'});
//       return;
//     }
//     res.status(200).json({
//       success: true,
//       message: 'Product deleted successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error deleting product',
//       error: (error as Error).message,
//     });
//     next(error);
//   }
// };
// export const deleteProduct: RequestHandler = async (
//   req: Request,
//   res: Response<ApiResponse<null>>,
//   next: NextFunction,
// ) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       res.status(404).json({success: false, message: 'Product not found'});
//       return;
//     }
//     // Delete images from Cloudinary
//     if (product.mainImage) {
//       await deleteImage(product.mainImage.public_id);
//     }
//     for (const image of product.images) {
//       await deleteImage(image.public_id);
//     }
//     await Product.findByIdAndDelete(req.params.id);
//     res.status(200).json({
//       success: true,
//       message: 'Product and associated images deleted successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error deleting product',
//       error: (error as Error).message,
//     });
//     next(error);
//   }
// };
// Submit a review
// export const createProduct = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     console.log('Request Body:', req.body);
//     console.log('Files:', req.files);
//     const {name, description, color, storage, price, stock} = req.body;
//     if (!req.files || !req.files.mainImage) {
//       return res.status(400).json({
//         success: false,
//         message: 'Main image is required',
//       });
//     }
//     const mainImageFile = req.files.mainImage as expressFileUpload.UploadedFile;
//     // Upload main image to Cloudinary
//     const mainImageUpload = await cloudinary.uploader.upload(
//       mainImageFile.tempFilePath,
//       {
//         folder: 'products',
//         transformation: [{width: 1000, height: 1000, crop: 'limit'}],
//       },
//     );
//     const imageData = {
//       mainImage: {
//         public_id: mainImageUpload.public_id,
//         url: mainImageUpload.secure_url,
//       },
//     };
//     const images = [];
//     if (req.files.images) {
//       const imageFiles = Array.isArray(req.files.images)
//         ? req.files.images
//         : [req.files.images];
//       // Upload additional images
//       for (const file of imageFiles) {
//         const upload = await cloudinary.uploader.upload(
//           (file as expressFileUpload.UploadedFile).tempFilePath,
//           {
//             folder: 'products',
//             transformation: [{width: 1000, height: 1000, crop: 'limit'}],
//           },
//         );
//         images.push({public_id: upload.public_id, url: upload.secure_url});
//       }
//     }
//     // Create product with uploaded images
//     const product = new Product({
//       name,
//       description,
//       color,
//       storage,
//       price: parseFloat(price),
//       stock: parseInt(stock, 10),
//       ...imageData,
//       images,
//     });
//     await product.save();
//     res.status(201).json({
//       success: true,
//       data: product,
//       message: 'Product created successfully',
//     });
//   } catch (error) {
//     console.error('Error in createProduct:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Something went wrong while creating the product',
//       error: (error as Error).message,
//     });
//     next(error);
//   }
// };
// export const createProduct = async (
//   req: Request,
//   res: Response<ApiResponse<ProductType>>,
//   next: NextFunction,
// ) => {
//   try {
//     console.log('Request Body:', req.body);
//     console.log('Files:', req.files);
//     const {name, description, color, storage, price, stock} = req.body;
//     const files = req.files as {[fieldname: string]: Express.Multer.File[]};
//     let imageData = {};
//     if (files.mainImage) {
//       const mainImageFile = files.mainImage[0];
//       imageData = {
//         mainImage: {
//           public_id: mainImageFile.filename,
//           url: mainImageFile.path,
//         },
//       };
//     }
//     if (files.images) {
//       imageData = {
//         ...imageData,
//         images: files.images.map(file => ({
//           public_id: file.filename,
//           url: file.path,
//         })),
//       };
//     }
//     const product = new Product({
//       name,
//       description,
//       color,
//       storage,
//       price,
//       stock,
//       ...imageData,
//     });
//     await product.save();
//     res.status(201).json({
//       success: true,
//       data: product,
//       message: 'Product created successfully',
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// Create new product
// export const createProduct: RequestHandler = async (
//   req: Request,
//   res: Response<ApiResponse<ProductType>>,
//   next: NextFunction,
// ) => {
//   const {name, description, color, storage, price, stock} = req.body;
//   try {
//     const product = new Product({
//       name,
//       description,
//       color,
//       storage,
//       price,
//       stock,
//       rating: 0,
//       totalReviews: 0,
//     });
//     await product.save();
//     res.status(201).json({
//       success: true,
//       data: product,
//       message: 'Product created successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error creating product',
//       error: (error as Error).message,
//     });
//     next(error);
//   }
// };
// export const createProduct: RequestHandler = async (
//   req: Request,
//   res: Response<ApiResponse<ProductType>>,
//   next: NextFunction,
// ) => {
//   try {
//     const {name, description, color, storage, price, stock} = req.body;
//     const files = req.files as Express.Multer.File[];
//     if (!files || files.length === 0) {
//       res.status(400).json({
//         success: false,
//         message: 'At least one image is required',
//       });
//       return;
//     }
//     // Upload main image
//     const mainImage = {
//       public_id: files[0].filename,
//       url: files[0].path,
//     };
//     // Upload additional images
//     const images = files.slice(1).map(file => ({
//       public_id: file.filename,
//       url: file.path,
//     }));
//     const product = new Product({
//       name,
//       description,
//       color,
//       storage,
//       price,
//       stock,
//       mainImage,
//       images,
//       rating: 0,
//       totalReviews: 0,
//     });
//     await product.save();
//     res.status(201).json({
//       success: true,
//       data: product,
//       message: 'Product created successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error creating product',
//       error: (error as Error).message,
//     });
//     next(error);
//   }
// };
// export const createProduct = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const {name, description, color, storage, price, stock} = req.body;
//     // For single image upload
//     const imageFile = req.file;
//     // OR for multiple images
//     const files = req.files as {[fieldname: string]: Express.Multer.File[]};
//     let imageData;
//     if (files) {
//       // Multiple images
//       const mainImage = files['mainImage']?.[0];
//       const additionalImages = files['images'] || [];
//       imageData = {
//         mainImage: mainImage
//           ? {
//               public_id: mainImage.filename,
//               url: mainImage.path,
//             }
//           : undefined,
//         images: additionalImages.map(file => ({
//           public_id: file.filename,
//           url: file.path,
//         })),
//       };
//     } else if (imageFile) {
//       // Single image
//       imageData = {
//         mainImage: {
//           public_id: imageFile.filename,
//           url: imageFile.path,
//         },
//       };
//     }
//     const product = new Product({
//       name,
//       description,
//       color,
//       storage,
//       price,
//       stock,
//       ...imageData,
//     });
//     await product.save();
//     res.status(201).json({
//       success: true,
//       data: product,
//       message: 'Product created successfully',
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// Update product
