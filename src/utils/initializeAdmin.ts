import User from '../models/User';
import bcrypt from 'bcryptjs';

export const initializeAdmin = async () => {
  try {
    // Check if any users exist
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      // Create superadmin
      const superadmin = new User({
        firstName: 'Super',
        lastName: 'Admin',
        email: process.env.SUPERADMIN_EMAIL,
        password: process.env.SUPERADMIN_PASSWORD,
        role: 'superadmin',
        isVerified: true
      });

      // Create admin
      const admin = new User({
        firstName: 'System',
        lastName: 'Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
        isVerified: true
      });

      await Promise.all([superadmin.save(), admin.save()]);
      
      console.log('Superadmin and Admin accounts created successfully');
    }
  } catch (error) {
    console.error('Error initializing admin accounts:', error);
  }
}; 