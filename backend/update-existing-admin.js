const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
require('dotenv').config();

async function updateAdmin() {
  try {
    console.log('🚀 Updating existing admin user...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Connected to MongoDB Atlas');

    // Find super admin role
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    console.log('✅ Found super admin role');

    // Find the admin@mycrm.com user
    let adminUser = await User.findOne({ email: 'admin@mycrm.com' });
    
    if (!adminUser) {
      // Try admin@crm.com
      adminUser = await User.findOne({ email: 'admin@crm.com' });
    }
    
    if (adminUser) {
      console.log('👤 Found admin user:', adminUser.email);
      
      // Update the user with correct role and password
      adminUser.password = 'admin123'; // This will be hashed by pre-save middleware
      adminUser.role = superAdminRole._id;
      adminUser.isActive = true;
      
      await adminUser.save();
      console.log('✅ Updated admin user successfully');
      
      // Test the login
      const updatedUser = await User.findById(adminUser._id)
        .populate('tenant', 'name subdomain')
        .populate('role', 'name displayName');
      
      const passwordTest = await updatedUser.matchPassword('admin123');
      
      console.log('\n🎯 LOGIN CREDENTIALS:');
      console.log('📧 Email:', updatedUser.email);
      console.log('🔑 Password: admin123');
      console.log('✅ Password Valid:', passwordTest ? 'YES ✅' : 'NO ❌');
      console.log('👤 Name:', updatedUser.firstName, updatedUser.lastName);
      console.log('🔐 Role:', updatedUser.role?.name);
      console.log('🏢 Tenant:', updatedUser.tenant?.name);
      console.log('✅ Active:', updatedUser.isActive);
      
      if (passwordTest) {
        console.log('\n🎉 SUCCESS! You can now login with:');
        console.log('📧', updatedUser.email);
        console.log('🔑 admin123');
        console.log('\n🌐 Go to: http://localhost:3000');
        console.log('🔗 Or try: http://admin.localhost:3000 (after hosts file setup)');
      } else {
        console.log('\n❌ Password test failed! Something went wrong.');
      }
    } else {
      console.log('❌ No admin user found with admin@mycrm.com or admin@crm.com');
      
      // Show all users
      const allUsers = await User.find().select('email firstName lastName');
      console.log('\n📋 All users in database:');
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.firstName} ${u.lastName})`));
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.disconnect();
  }
}

updateAdmin();





