const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');

const cleanDatabase = async () => {
  try {
    console.log('🧹 Connecting to database...');
    await connectDB();
    
    console.log('🗑️ Dropping entire database...');
    await mongoose.connection.db.dropDatabase();
    
    console.log('✅ Database cleaned successfully!');
    console.log('💡 Now you can run: npm run seed');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

cleanDatabase();













