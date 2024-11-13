// import {v2 as cloudinary} from 'cloudinary';
// import fileUpload from 'express-fileupload';

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
import {v2 as cloudinary} from 'cloudinary';
import {UploadedFile, Options} from 'express-fileupload';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure express-fileupload options
export const fileUploadOptions: Options = {
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: {fileSize: 50 * 1024 * 1024}, // 50MB max file size
  abortOnLimit: true,
  createParentPath: true,
  parseNested: true,
};

// Type for Cloudinary upload response
interface CloudinaryUploadResponse {
  public_id: string;
  url: string;
}

// Helper function to check file type
export const isValidImageType = (mimetype: string): boolean => {
  return /^image\/(jpg|jpeg|png|webp)$/.test(mimetype);
};

// Helper function for cloudinary upload with standard options
export const uploadToCloudinary = async (
  file: UploadedFile,
  folder: string = 'products',
): Promise<CloudinaryUploadResponse> => {
  try {
    // Check file type before upload
    if (!isValidImageType(file.mimetype)) {
      throw new Error(
        'Invalid file type. Only jpg, jpeg, png, and webp are allowed.',
      );
    }

    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder,
      resource_type: 'auto',
      transformation: [{width: 1000, height: 1000, crop: 'limit'}],
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Helper function to delete image from Cloudinary
export const deleteFromCloudinary = async (public_id: string): Promise<any> => {
  try {
    return await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Export configured cloudinary instance
export {cloudinary};
