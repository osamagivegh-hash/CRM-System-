const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Company = require('../models/Company');
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Role = require('../models/Role');
const Tenant = require('../models/Tenant');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

const migrateToMultiTenant = async () => {
  try {
    console.log('🚀 Starting multi-tenant migration...');

    // Step 1: Create super admin role if it doesn't exist
    let superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (!superAdminRole) {
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
    }

    // Step 2: Create tenant admin role if it doesn't exist
    let tenantAdminRole = await Role.findOne({ name: 'tenant_admin' });
    if (!tenantAdminRole) {
      tenantAdminRole = await Role.create({
        name: 'tenant_admin',
        displayName: 'Tenant Administrator',
        description: 'Administrator for a specific tenant',
        permissions: [
          'create_users', 'read_users', 'update_users', 'delete_users',
          'create_leads', 'read_leads', 'update_leads', 'delete_leads',
          'create_clients', 'read_clients', 'update_clients', 'delete_clients',
          'create_companies', 'read_companies', 'update_companies', 'delete_companies',
          'read_dashboard', 'manage_settings'
        ]
      });
      console.log('✅ Created tenant admin role');
    }

    // Step 3: Get all existing companies to convert to tenants
    const existingCompanies = await Company.find({});
    console.log(`📊 Found ${existingCompanies.length} existing companies to migrate`);

    for (const company of existingCompanies) {
      try {
        console.log(`\n🏢 Processing company: ${company.name}`);

        // Check if tenant already exists for this company
        let tenant = await Tenant.findOne({ 
          $or: [
            { email: company.email },
            { name: company.name }
          ]
        });

        if (!tenant) {
          // Generate subdomain from company name
          let subdomain = company.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 30);

          // If subdomain is empty (due to non-English characters), generate a fallback
          if (!subdomain || subdomain.length < 2) {
            subdomain = `tenant-${company._id.toString().substring(0, 8)}`;
          }

          // Ensure subdomain is unique
          let counter = 1;
          let originalSubdomain = subdomain;
          while (await Tenant.findOne({ subdomain })) {
            subdomain = `${originalSubdomain}-${counter}`;
            counter++;
          }

          // Create tenant from company data
          tenant = await Tenant.create({
            name: company.name,
            subdomain,
            email: company.email,
            phone: company.phone,
            address: company.address,
            website: company.website,
            industry: company.industry,
            plan: company.plan || 'starter',
            maxUsers: company.maxUsers || 10,
            currentUsers: 0, // Will be updated later
            status: company.isActive ? 'active' : 'suspended',
            settings: company.settings || {},
            subscriptionStart: company.subscriptionStart || new Date(),
            subscriptionEnd: company.subscriptionEnd
          });

          console.log(`✅ Created tenant: ${tenant.name} (${tenant.subdomain})`);
        } else {
          console.log(`ℹ️  Tenant already exists: ${tenant.name}`);
        }

        // Step 4: Update the company to reference the tenant
        await Company.findByIdAndUpdate(company._id, {
          tenant: tenant._id
        });
        console.log(`✅ Updated company to reference tenant`);

        // Step 5: Find and update all users belonging to this company
        const companyUsers = await User.find({ company: company._id });
        console.log(`👥 Found ${companyUsers.length} users in this company`);

        for (const user of companyUsers) {
          // Check if user already has tenant field
          if (!user.tenant) {
            await User.findByIdAndUpdate(user._id, {
              tenant: tenant._id
            });
            console.log(`✅ Updated user: ${user.email}`);
          }
        }

        // Update tenant's current user count
        const userCount = await User.countDocuments({ tenant: tenant._id });
        await Tenant.findByIdAndUpdate(tenant._id, {
          currentUsers: userCount
        });

        // Step 6: Update leads and clients
        await Lead.updateMany(
          { company: company._id, tenant: { $exists: false } },
          { tenant: tenant._id }
        );
        const leadCount = await Lead.countDocuments({ tenant: tenant._id });
        console.log(`✅ Updated ${leadCount} leads`);

        await Client.updateMany(
          { company: company._id, tenant: { $exists: false } },
          { tenant: tenant._id }
        );
        const clientCount = await Client.countDocuments({ tenant: tenant._id });
        console.log(`✅ Updated ${clientCount} clients`);

        // Step 7: Set tenant admin user (first active user with admin role)
        if (!tenant.adminUser) {
          const adminUser = await User.findOne({
            tenant: tenant._id,
            isActive: true,
            role: { $in: [tenantAdminRole._id, superAdminRole._id] }
          });

          if (adminUser) {
            await Tenant.findByIdAndUpdate(tenant._id, {
              adminUser: adminUser._id
            });
            console.log(`✅ Set admin user: ${adminUser.email}`);
          }
        }

      } catch (error) {
        console.error(`❌ Error processing company ${company.name}:`, error.message);
        continue;
      }
    }

    // Step 8: Create a default super admin user if none exists
    const superAdminExists = await User.findOne({ role: superAdminRole._id });
    if (!superAdminExists) {
      console.log('\n👑 Creating default super admin user...');
      
      // Create a default tenant for super admin
      let superAdminTenant = await Tenant.findOne({ subdomain: 'admin' });
      if (!superAdminTenant) {
        superAdminTenant = await Tenant.create({
          name: 'System Administration',
          subdomain: 'admin',
          email: 'admin@system.local',
          plan: 'enterprise',
          maxUsers: 1000,
          status: 'active'
        });
      }

      const superAdmin = await User.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@system.local',
        password: 'admin123', // Change this in production!
        tenant: superAdminTenant._id,
        role: superAdminRole._id,
        isActive: true
      });

      superAdminTenant.adminUser = superAdmin._id;
      superAdminTenant.currentUsers = 1;
      await superAdminTenant.save();

      console.log('✅ Created super admin user: admin@system.local / admin123');
      console.log('⚠️  IMPORTANT: Change the super admin password in production!');
    }

    console.log('\n🎉 Multi-tenant migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Tenants: ${await Tenant.countDocuments()}`);
    console.log(`- Users: ${await User.countDocuments()}`);
    console.log(`- Companies: ${await Company.countDocuments()}`);
    console.log(`- Leads: ${await Lead.countDocuments()}`);
    console.log(`- Clients: ${await Client.countDocuments()}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await migrateToMultiTenant();
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if called directly
if (require.main === module) {
  main();
}

module.exports = { migrateToMultiTenant };
