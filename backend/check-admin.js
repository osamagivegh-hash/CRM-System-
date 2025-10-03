const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const Tenant = require('./models/Tenant');
require('dotenv').config();

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Connected to MongoDB');
    
    // Find the admin user
    const admin = await User.findOne({ email: 'admin@system.local' })
      .populate('tenant', 'name subdomain')
      .populate('role', 'name displayName');
    
    if (admin) {
      console.log('👑 Super Admin Found:');
      console.log('   📧 Email:', admin.email);
      console.log('   👤 Name:', admin.firstName, admin.lastName);
      console.log('   🔐 Role:', admin.role?.name);
      console.log('   🏢 Tenant:', admin.tenant?.name);
      console.log('   ✅ Active:', admin.isActive);
      console.log('   🔑 Has Password:', !!admin.password);
      
      // Test password
      const isValidPassword = await admin.matchPassword('admin123');
      console.log('   🔐 Password Test (admin123):', isValidPassword ? '✅ Valid' : '❌ Invalid');
    } else {
      console.log('❌ Super Admin NOT FOUND');
      
      // Check what users exist
      const users = await User.find().select('email firstName lastName isActive');
      console.log('\n📋 Existing users:');
      users.forEach(u => console.log(`  - ${u.email} (${u.firstName} ${u.lastName}) - Active: ${u.isActive}`));
      
      // Check roles
      const roles = await Role.find().select('name displayName');
      console.log('\n🔐 Existing roles:');
      roles.forEach(r => console.log(`  - ${r.name} (${r.displayName})`));
      
      // Check tenants
      const tenants = await Tenant.find().select('name subdomain adminUser');
      console.log('\n🏢 Existing tenants:');
      tenants.forEach(t => console.log(`  - ${t.name} (${t.subdomain}) - Admin: ${t.adminUser}`));
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.disconnect();
  }
}

checkAdmin();





