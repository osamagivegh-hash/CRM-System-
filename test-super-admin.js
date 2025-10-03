const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const User = require('./backend/models/User');
const Tenant = require('./backend/models/Tenant');
const Role = require('./backend/models/Role');

const testSuperAdmin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if super admin role exists
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    console.log('🔑 Super Admin Role:', superAdminRole ? '✅ Exists' : '❌ Missing');

    // Check if super admin user exists
    const superAdmin = await User.findOne({ email: 'admin@system.local' })
      .populate('tenant', 'name subdomain')
      .populate('role', 'name displayName');
    
    if (superAdmin) {
      console.log('👑 Super Admin User: ✅ Found');
      console.log('   📧 Email:', superAdmin.email);
      console.log('   👤 Name:', superAdmin.fullName);
      console.log('   🏢 Tenant:', superAdmin.tenant?.name);
      console.log('   🔐 Role:', superAdmin.role?.displayName);
      console.log('   ✅ Active:', superAdmin.isActive);
    } else {
      console.log('👑 Super Admin User: ❌ Not Found');
    }

    // Check tenants
    const tenants = await Tenant.find().select('name subdomain status plan');
    console.log(`\n🏢 Tenants (${tenants.length}):`);
    tenants.forEach(tenant => {
      console.log(`   • ${tenant.name} (${tenant.subdomain}) - ${tenant.plan} - ${tenant.status}`);
    });

    // Test login credentials
    if (superAdmin) {
      const isValidPassword = await superAdmin.matchPassword('admin123');
      console.log('\n🔐 Password Test:', isValidPassword ? '✅ Valid' : '❌ Invalid');
    }

    console.log('\n🎯 Access URLs:');
    console.log('   🌐 Main App: http://localhost:3000');
    console.log('   👑 Super Admin: http://admin.localhost:3000 (requires hosts file)');
    console.log('   🔧 API: http://localhost:5002');

    console.log('\n📝 Login Credentials:');
    console.log('   📧 Email: admin@system.local');
    console.log('   🔑 Password: admin123');
    console.log('   ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!');

    mongoose.disconnect();
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

testSuperAdmin();





