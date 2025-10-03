const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Update System Administration company
const updateSystemCompany = async () => {
  try {
    const Company = require('../models/Company');
    
    // Find System Administration company
    const systemCompany = await Company.findOne({ name: 'System Administration' });
    
    if (!systemCompany) {
      console.log('❌ System Administration company not found');
      return;
    }
    
    console.log('📊 Current System Company:', {
      name: systemCompany.name,
      maxUsers: systemCompany.maxUsers,
      currentUsers: systemCompany.currentUsers,
      plan: systemCompany.plan
    });
    
    // Update to allow unlimited users for system admin company
    systemCompany.maxUsers = 999;
    systemCompany.plan = 'enterprise';
    await systemCompany.save();
    
    console.log('✅ System Administration company updated successfully!');
    console.log('📊 New Settings:', {
      name: systemCompany.name,
      maxUsers: systemCompany.maxUsers,
      currentUsers: systemCompany.currentUsers,
      plan: systemCompany.plan
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating system company:', error);
    process.exit(1);
  }
};

// Run the update
const main = async () => {
  await connectDB();
  await updateSystemCompany();
};

main();












