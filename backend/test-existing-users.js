const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const Tenant = require('./models/Tenant');
require('dotenv').config();

async function testUsers() {
  try {
    console.log('🔍 Testing existing users...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ Connected to MongoDB');

    // Test different potential admin emails and passwords
    const testCredentials = [
      { email: 'admin@crm.com', passwords: ['admin123', 'password', '123456', 'admin'] },
      { email: 'admin@mycrm.com', passwords: ['admin123', 'password', '123456', 'admin'] },
      { email: 'admin@system.local', passwords: ['admin123', 'password', '123456', 'admin'] }
    ];

    for (const cred of testCredentials) {
      console.log(`\n🔍 Testing ${cred.email}:`);
      
      const user = await User.findOne({ email: cred.email })
        .populate('role', 'name displayName')
        .populate('tenant', 'name subdomain');
      
      if (user) {
        console.log('  👤 User found:', user.firstName, user.lastName);
        console.log('  🔐 Role:', user.role?.name);
        console.log('  🏢 Tenant:', user.tenant?.name);
        console.log('  ✅ Active:', user.isActive);
        
        for (const pwd of cred.passwords) {
          const isValid = await user.matchPassword(pwd);
          console.log(`  🔑 Password "${pwd}":`, isValid ? '✅ VALID' : '❌ Invalid');
          
          if (isValid) {
            console.log(`\n🎉 WORKING CREDENTIALS FOUND!`);
            console.log(`📧 Email: ${user.email}`);
            console.log(`🔑 Password: ${pwd}`);
            console.log(`🌐 Login at: http://localhost:3000`);
            mongoose.disconnect();
            return;
          }
        }
      } else {
        console.log('  ❌ User not found');
      }
    }
    
    console.log('\n❌ No working credentials found');
    console.log('📋 Let me show all users in the database:');
    
    const allUsers = await User.find().select('email firstName lastName isActive');
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.firstName} ${u.lastName}) - Active: ${u.isActive}`);
    });

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.disconnect();
  }
}

testUsers();
