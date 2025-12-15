require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Admin = require('./src/models/Admin');
const connectDB = require('./src/config/database');

const migrateAdmin = async () => {
  try {
    await connectDB();

    console.log('Starting admin migration...');

    // Get admin credentials from .env or from existing Admin collection
    let adminEmail = process.env.ADMIN_EMAIL;
    let adminPassword = process.env.ADMIN_PASSWORD;
    let adminFirstName = 'Admin';
    let adminLastName = 'User';

    // Check if admin exists in Admin collection
    const existingAdmin = await Admin.findOne({ email: adminEmail || {} });
    
    if (existingAdmin) {
      console.log('Found existing admin in Admin collection, migrating...');
      adminEmail = existingAdmin.email;
      adminFirstName = existingAdmin.firstName || 'Admin';
      adminLastName = existingAdmin.lastName || 'User';
      // Note: We cannot retrieve the plain password from hashed password
      // So we'll use the password from .env, or prompt user to reset
      if (!adminPassword) {
        console.warn('WARNING: Admin password not found in .env file.');
        console.warn('The existing admin password cannot be retrieved from the database.');
        console.warn('Please set ADMIN_PASSWORD in .env file, or the admin will need to use forgot password.');
      }
    }

    if (!adminEmail) {
      console.error('Error: ADMIN_EMAIL not found in .env file');
      process.exit(1);
    }

    // Check if admin already exists in User table
    const adminExistsInUsers = await User.findOne({ email: adminEmail, role: 'admin' });
    if (adminExistsInUsers) {
      console.log('Admin user already exists in User table');
      console.log(`Email: ${adminEmail}`);
      
      // If admin was in Admin collection, we can optionally remove it
      if (existingAdmin) {
        console.log('Removing admin from Admin collection...');
        await Admin.deleteOne({ _id: existingAdmin._id });
        console.log('Admin removed from Admin collection successfully');
      }
      
      process.exit(0);
    }

    // Create admin user in User table
    if (!adminPassword) {
      console.error('Error: ADMIN_PASSWORD not found in .env file');
      console.error('Cannot create admin without password. Please set ADMIN_PASSWORD in .env file.');
      process.exit(1);
    }

    const adminUser = new User({
      firstName: adminFirstName,
      lastName: adminLastName,
      email: adminEmail,
      password: adminPassword, // Will be hashed by pre-save hook
      role: 'admin',
      status: 'approved',
      isActive: true,
      isFirstLogin: false,
      requiresPasswordChange: false,
    });

    await adminUser.save();
    console.log('Admin user created successfully in User table');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword ? '***' : 'Not set'}`);
    console.log(`Role: admin`);

    // Remove admin from Admin collection if it existed
    if (existingAdmin) {
      console.log('Removing admin from Admin collection...');
      await Admin.deleteOne({ _id: existingAdmin._id });
      console.log('Admin removed from Admin collection successfully');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error migrating admin:', error);
    if (error.code === 11000) {
      console.log('Admin user with this email already exists in User table');
    }
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

migrateAdmin();

