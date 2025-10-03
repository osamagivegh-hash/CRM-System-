const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const Tenant = require('./models/Tenant');
require('dotenv').config();

async function createSuperAdmin() {
  try {
    console.log('🚀 Starting super admin creation...');
    console.log('🔗 MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Missing');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Connected to MongoDB');

    // Check if super admin role exists
    let superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (!superAdminRole) {
      console.log('Creating super admin role...');
      superAdminRole = await Role.create({
        name: 'super_admin',
        displayName: 'Super Administrator',
        description: 'Global system administrator with access to all tenants',
        permissions: [
          'create_tenants', 'read_tenants', 'update_tenants', 'delete_tenants',
          'create_users', 'read_users', 'update_users', 'delete_users',
          'create_leads', 'read_leads', 'update_leads', 'delete_leads',
          'create_clients', 'read_clients', 'update_clients', 'delete_clients',
          'create_companies', 'read_companies', 'update_companies', 'delete_companies',
          'read_dashboard', 'manage_settings', 'super_admin_access'
        ]
      });
      console.log('✅ Created super admin role');
    } else {
      console.log('✅ Super admin role exists');
    }

    // Check if super admin user exists
    let superAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@system.local' },
        { email: 'admin@mycrm.com' }
      ]
    });
    if (superAdmin) {
      console.log('⚠️  Super admin user already exists');
      console.log('   📧 Email:', superAdmin.email);
      console.log('   👤 Name:', superAdmin.firstName, superAdmin.lastName);
      console.log('   ✅ Active:', superAdmin.isActive);
      
      // Test current password
      const testPasswords = ['admin123', 'password', '123456', 'admin'];
      for (const pwd of testPasswords) {
        const isValid = await superAdmin.matchPassword(pwd);
        if (isValid) {
          console.log(`   🔑 Current password is: ${pwd}`);
          break;
        }
      }
      
      // Update password to admin123 if needed
      console.log('🔄 Updating password to admin123...');
      superAdmin.password = 'admin123';
      superAdmin.role = superAdminRole._id;
      superAdmin.isActive = true;
      await superAdmin.save();
      console.log('✅ Updated super admin password to: admin123');
    } else {
      // Create super admin tenant if it doesn't exist
      let superAdminTenant = await Tenant.findOne({ subdomain: 'admin' });
      if (!superAdminTenant) {
        superAdminTenant = await Tenant.create({
          name: 'System Administration',
          subdomain: 'admin',
          email: 'admin@mycrm.com', // Use a valid email format
          plan: 'enterprise',
          maxUsers: 1000,
          status: 'active'
        });
        console.log('✅ Created super admin tenant');
      }

      // Create super admin user
      superAdmin = await User.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@mycrm.com',
        password: 'admin123',
        tenant: superAdminTenant._id,
        role: superAdminRole._id,
        isActive: true
      });

      superAdminTenant.adminUser = superAdmin._id;
      superAdminTenant.currentUsers = 1;
      await superAdminTenant.save();

      console.log('✅ Created super admin user');
    }

    // Test login
    const testUser = await User.findOne({ 
      $or: [
        { email: 'admin@system.local' },
        { email: 'admin@mycrm.com' }
      ]
    })
      .populate('tenant', 'name subdomain')
      .populate('role', 'name displayName');
    
    const isValidPassword = await testUser.matchPassword('admin123');
    
    console.log('\n🎯 Login Test Results:');
    console.log('   📧 Email:', testUser.email);
    console.log('   🔑 Password: admin123');
    console.log('   ✅ Valid:', isValidPassword ? 'YES' : 'NO');
    console.log('   👤 Name:', testUser.firstName, testUser.lastName);
    console.log('   🔐 Role:', testUser.role?.name);
    console.log('   🏢 Tenant:', testUser.tenant?.name);
    console.log('   ✅ Active:', testUser.isActive);

    if (isValidPassword) {
      console.log('\n🎉 SUCCESS! You can now login with:');
      console.log('   📧 Email:', testUser.email);
      console.log('   🔑 Password: admin123');
    } else {
      console.log('\n❌ FAILED! Password test failed');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.disconnect();
    process.exit(1);
  }
}

createSuperAdmin();
