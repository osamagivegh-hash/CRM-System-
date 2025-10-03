const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const Tenant = require('./models/Tenant');
require('dotenv').config();

async function fixAdmin() {
  try {
    console.log('🚀 Fixing super admin user...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Connected to MongoDB Atlas');

    // Find super admin role
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (!superAdminRole) {
      console.log('❌ Super admin role not found');
      return;
    }
    console.log('✅ Found super admin role');

    // Find any existing admin users
    const existingUsers = await User.find({
      $or: [
        { email: 'admin@system.local' },
        { email: 'admin@mycrm.com' },
        { email: { $regex: /admin/i } }
      ]
    });

    console.log(`📋 Found ${existingUsers.length} existing admin-like users:`);
    existingUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName})`);
    });

    // Find admin tenant
    let adminTenant = await Tenant.findOne({ subdomain: 'admin' });
    if (!adminTenant) {
      adminTenant = await Tenant.findOne({ name: /admin/i });
    }
    
    if (!adminTenant) {
      console.log('❌ No admin tenant found');
      const tenants = await Tenant.find().select('name subdomain');
      console.log('Available tenants:');
      tenants.forEach(t => console.log(`  - ${t.name} (${t.subdomain})`));
      return;
    }
    
    console.log('✅ Found admin tenant:', adminTenant.name);

    // Create or update the super admin user
    let superAdmin = existingUsers.find(u => u.email.includes('admin'));
    
    if (superAdmin) {
      console.log('🔄 Updating existing admin user...');
      superAdmin.email = 'admin@mycrm.com';
      superAdmin.firstName = 'Super';
      superAdmin.lastName = 'Admin';
      superAdmin.password = 'admin123'; // This will be hashed by the pre-save middleware
      superAdmin.role = superAdminRole._id;
      superAdmin.tenant = adminTenant._id;
      superAdmin.isActive = true;
      
      await superAdmin.save();
      console.log('✅ Updated existing admin user');
    } else {
      console.log('🆕 Creating new super admin user...');
      superAdmin = new User({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@mycrm.com',
        password: 'admin123',
        role: superAdminRole._id,
        tenant: adminTenant._id,
        isActive: true
      });
      
      await superAdmin.save();
      console.log('✅ Created new super admin user');
    }

    // Test the login
    const testUser = await User.findOne({ email: 'admin@mycrm.com' })
      .populate('tenant', 'name subdomain')
      .populate('role', 'name displayName');
    
    if (testUser) {
      const passwordTest = await testUser.matchPassword('admin123');
      
      console.log('\n🎯 LOGIN CREDENTIALS:');
      console.log('📧 Email:', testUser.email);
      console.log('🔑 Password: admin123');
      console.log('✅ Password Valid:', passwordTest ? 'YES' : 'NO');
      console.log('👤 Name:', testUser.firstName, testUser.lastName);
      console.log('🔐 Role:', testUser.role?.name);
      console.log('🏢 Tenant:', testUser.tenant?.name);
      console.log('✅ Active:', testUser.isActive);
      
      if (passwordTest) {
        console.log('\n🎉 SUCCESS! Login with:');
        console.log('📧 admin@mycrm.com');
        console.log('🔑 admin123');
        console.log('\n🌐 Go to: http://localhost:3000');
      } else {
        console.log('\n❌ Password test failed!');
      }
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.disconnect();
  }
}

fixAdmin();




