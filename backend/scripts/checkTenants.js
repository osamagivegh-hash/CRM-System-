#!/usr/bin/env node

/**
 * Script to check existing tenants and their subdomains
 * This helps troubleshoot tenant resolution issues
 */

const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Role = require('../models/Role');
require('dotenv').config();

const checkTenants = async () => {
  try {
    console.log('🔍 Checking existing tenants and their subdomains...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all tenants
    const tenants = await Tenant.find({}).sort({ createdAt: -1 });
    
    if (tenants.length === 0) {
      console.log('❌ No tenants found in the database');
      console.log('💡 Run the seed script to create demo tenants:');
      console.log('   cd backend && npm run seed\n');
      return;
    }

    console.log(`📊 Found ${tenants.length} tenant(s):\n`);

    for (const tenant of tenants) {
      console.log(`🏢 Tenant: ${tenant.name}`);
      console.log(`   📧 Email: ${tenant.email}`);
      console.log(`   🌐 Subdomain: ${tenant.subdomain}`);
      console.log(`   📍 URL: https://${tenant.subdomain}.${process.env.DOMAIN || 'mycrm.com'}`);
      console.log(`   📍 Local URL: http://${tenant.subdomain}.localhost:3000`);
      console.log(`   📊 Status: ${tenant.status}`);
      console.log(`   📦 Plan: ${tenant.plan}`);
      console.log(`   👥 Users: ${tenant.currentUsers}/${tenant.maxUsers}`);

      // Get users for this tenant
      const users = await User.find({ tenant: tenant._id })
        .populate('role', 'name displayName')
        .select('firstName lastName email role isActive');

      console.log(`   👤 Users (${users.length}):`);
      users.forEach(user => {
        const status = user.isActive ? '✅' : '❌';
        console.log(`      ${status} ${user.firstName} ${user.lastName} (${user.email}) - ${user.role?.displayName || user.role?.name || 'No Role'}`);
      });

      console.log('');
    }

    // Show demo credentials
    console.log('🔑 Demo Login Credentials:\n');
    for (const tenant of tenants) {
      const adminUser = await User.findOne({ 
        tenant: tenant._id, 
        'role.name': { $in: ['tenant_admin', 'company_admin'] }
      }).populate('role', 'name');

      const salesReps = await User.find({ 
        tenant: tenant._id, 
        'role.name': 'sales_rep'
      }).populate('role', 'name').limit(2);

      if (adminUser) {
        console.log(`🏢 ${tenant.name} (${tenant.subdomain}):`);
        console.log(`   👑 Admin: ${adminUser.email} / Admin123!`);
        
        if (salesReps.length > 0) {
          salesReps.forEach((rep, index) => {
            console.log(`   💼 Sales Rep ${index + 1}: ${rep.email} / Sales123!`);
          });
        }
        console.log('');
      }
    }

    console.log('🌐 Access URLs for Local Development:');
    console.log('   Add these to your hosts file (C:\\Windows\\System32\\drivers\\etc\\hosts):\n');
    tenants.forEach(tenant => {
      console.log(`   127.0.0.1 ${tenant.subdomain}.localhost`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error checking tenants:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Run the script
if (require.main === module) {
  checkTenants();
}

module.exports = checkTenants;
