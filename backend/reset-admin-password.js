const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function resetPassword() {
  try {
    console.log('🔄 Resetting admin password...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@crm.com' });
    
    if (adminUser) {
      console.log('👤 Found admin user:', adminUser.email);
      
      // Reset password to admin123
      adminUser.password = 'admin123';
      await adminUser.save();
      
      console.log('✅ Password reset successfully!');
      console.log('\n🎯 LOGIN CREDENTIALS:');
      console.log('📧 Email: admin@crm.com');
      console.log('🔑 Password: admin123');
      console.log('\n🌐 Login at: http://localhost:3000');
      
    } else {
      console.log('❌ Admin user not found');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.disconnect();
  }
}

resetPassword();




