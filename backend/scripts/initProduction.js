#!/usr/bin/env node

/**
 * Production Database Initialization Script
 * 
 * This script initializes the database for production deployment:
 * - Creates system company
 * - Creates super admin user
 * - Sets up initial roles
 * - Seeds basic data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const Company = require('../models/Company');
const User = require('../models/User');
const Role = require('../models/Role');
const Tenant = require('../models/Tenant');

// Database connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create system company
async function createSystemCompany() {
  try {
    const existingSystemCompany = await Company.findOne({ isSystem: true });
    
    if (existingSystemCompany) {
      console.log('✅ System company already exists');
      return existingSystemCompany;
    }

    const systemCompany = new Company({
      name: 'System Company',
      email: 'system@crm.com',
      phone: '+1-000-000-0000',
      address: {
        street: 'System Address',
        city: 'System City',
        state: 'System State',
        zipCode: '00000',
        country: 'System Country'
      },
      isSystem: true,
      isActive: true,
      createdBy: null // System created
    });

    await systemCompany.save();
    console.log('✅ System company created');
    return systemCompany;
  } catch (error) {
    console.error('❌ Error creating system company:', error);
    throw error;
  }
}

// Create default roles
async function createDefaultRoles(systemCompany) {
  try {
    const roles = [
      {
        name: 'Super Admin',
        description: 'Full system access',
        permissions: [
          'users:create', 'users:read', 'users:update', 'users:delete',
          'companies:create', 'companies:read', 'companies:update', 'companies:delete',
          'clients:create', 'clients:read', 'clients:update', 'clients:delete',
          'leads:create', 'leads:read', 'leads:update', 'leads:delete',
          'dashboard:read', 'settings:read', 'settings:update',
          'super-admin:access', 'tenant:manage'
        ],
        company: systemCompany._id,
        isSystem: true
      },
      {
        name: 'Admin',
        description: 'Company administrator',
        permissions: [
          'users:create', 'users:read', 'users:update', 'users:delete',
          'companies:read', 'companies:update',
          'clients:create', 'clients:read', 'clients:update', 'clients:delete',
          'leads:create', 'leads:read', 'leads:update', 'leads:delete',
          'dashboard:read', 'settings:read', 'settings:update'
        ],
        company: systemCompany._id,
        isSystem: true
      },
      {
        name: 'Manager',
        description: 'Team manager',
        permissions: [
          'users:read',
          'companies:read',
          'clients:create', 'clients:read', 'clients:update', 'clients:delete',
          'leads:create', 'leads:read', 'leads:update', 'leads:delete',
          'dashboard:read'
        ],
        company: systemCompany._id,
        isSystem: true
      },
      {
        name: 'User',
        description: 'Standard user',
        permissions: [
          'clients:read', 'clients:update',
          'leads:create', 'leads:read', 'leads:update',
          'dashboard:read'
        ],
        company: systemCompany._id,
        isSystem: true
      }
    ];

    const createdRoles = [];
    
    for (const roleData of roles) {
      const existingRole = await Role.findOne({ 
        name: roleData.name, 
        company: systemCompany._id 
      });
      
      if (existingRole) {
        console.log(`✅ Role '${roleData.name}' already exists`);
        createdRoles.push(existingRole);
      } else {
        const role = new Role(roleData);
        await role.save();
        console.log(`✅ Role '${roleData.name}' created`);
        createdRoles.push(role);
      }
    }

    return createdRoles;
  } catch (error) {
    console.error('❌ Error creating default roles:', error);
    throw error;
  }
}

// Create super admin user
async function createSuperAdmin(systemCompany, superAdminRole) {
  try {
    const existingSuperAdmin = await User.findOne({ 
      email: 'superadmin@crm.com',
      company: systemCompany._id 
    });
    
    if (existingSuperAdmin) {
      console.log('✅ Super admin user already exists');
      return existingSuperAdmin;
    }

    // Generate secure password
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
    const hashedPassword = await bcrypt.hash(password, 12);

    const superAdmin = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@crm.com',
      password: hashedPassword,
      role: superAdminRole._id,
      company: systemCompany._id,
      isActive: true,
      isEmailVerified: true,
      createdBy: null // System created
    });

    await superAdmin.save();
    console.log('✅ Super admin user created');
    console.log(`📧 Email: superadmin@crm.com`);
    console.log(`🔑 Password: ${password}`);
    console.log('⚠️  Please change the password after first login!');
    
    return superAdmin;
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  }
}

// Create default tenant
async function createDefaultTenant() {
  try {
    const existingTenant = await Tenant.findOne({ name: 'default' });
    
    if (existingTenant) {
      console.log('✅ Default tenant already exists');
      return existingTenant;
    }

    const defaultTenant = new Tenant({
      name: 'default',
      displayName: 'Default Tenant',
      description: 'Default system tenant',
      isActive: true,
      settings: {
        maxUsers: 100,
        maxCompanies: 10,
        features: ['users', 'companies', 'clients', 'leads', 'dashboard']
      }
    });

    await defaultTenant.save();
    console.log('✅ Default tenant created');
    return defaultTenant;
  } catch (error) {
    console.error('❌ Error creating default tenant:', error);
    throw error;
  }
}

// Main initialization function
async function initializeProduction() {
  console.log('🚀 Starting production database initialization...');
  
  try {
    // Connect to database
    await connectDB();
    
    // Create system company
    const systemCompany = await createSystemCompany();
    
    // Create default roles
    const roles = await createDefaultRoles(systemCompany);
    const superAdminRole = roles.find(role => role.name === 'Super Admin');
    
    // Create super admin user
    await createSuperAdmin(systemCompany, superAdminRole);
    
    // Create default tenant
    await createDefaultTenant();
    
    console.log('\n🎉 Production database initialization completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ System company created');
    console.log('  ✅ Default roles created');
    console.log('  ✅ Super admin user created');
    console.log('  ✅ Default tenant created');
    
    console.log('\n🔐 Login Credentials:');
    console.log('  Email: superadmin@crm.com');
    console.log('  Password: SuperAdmin123! (or check SUPER_ADMIN_PASSWORD env var)');
    
    console.log('\n⚠️  Important:');
    console.log('  - Change the super admin password after first login');
    console.log('  - Create your first company and users through the admin panel');
    console.log('  - Configure your tenant settings as needed');
    
  } catch (error) {
    console.error('\n💥 Initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeProduction();
}

module.exports = { initializeProduction };
