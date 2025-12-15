require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Admin = require('./src/models/Admin');
const connectDB = require('./src/config/database');

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail) {
      console.error('Error: ADMIN_EMAIL not found in .env file');
      process.exit(1);
    }

    if (!adminPassword) {
      console.error('Error: ADMIN_PASSWORD not found in .env file');
      process.exit(1);
    }

    // Check if admin already exists in User table
    const adminExistsInUsers = await User.findOne({ email: adminEmail, role: 'admin' });
    if (adminExistsInUsers) {
      console.log('Admin user already exists in User table');
      console.log(`Email: ${adminEmail}`);
      process.exit(0);
    }

    // Check if admin exists in old Admin collection and migrate it
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    let adminFirstName = 'Admin';
    let adminLastName = 'User';

    if (existingAdmin) {
      console.log('Found existing admin in Admin collection, will migrate to User table...');
      adminFirstName = existingAdmin.firstName || 'Admin';
      adminLastName = existingAdmin.lastName || 'User';
    }

    // Create admin user in User table with role='admin'
    const admin = new User({
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

    await admin.save();
    console.log('Admin user created successfully in User table');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: *** (from .env)`);
    console.log(`Role: admin`);

    // Remove admin from old Admin collection if it existed
    if (existingAdmin) {
      console.log('Removing admin from old Admin collection...');
      await Admin.deleteOne({ _id: existingAdmin._id });
      console.log('Admin removed from old Admin collection successfully');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
    if (error.code === 11000) {
      console.log('Admin user with this email already exists in User table');
    }
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

seedAdmin();