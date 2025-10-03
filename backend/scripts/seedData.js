const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Company = require('../models/Company');
const Role = require('../models/Role');
const Client = require('../models/Client');
const Lead = require('../models/Lead');
const Tenant = require('../models/Tenant');

const connectDB = require('../config/database');

// Default roles
const defaultRoles = [
  {
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Full system access and control',
    permissions: [
      'create_users', 'read_users', 'update_users', 'delete_users',
      'create_companies', 'read_companies', 'update_companies', 'delete_companies',
      'create_clients', 'read_clients', 'update_clients', 'delete_clients',
      'create_leads', 'read_leads', 'update_leads', 'delete_leads',
      'view_dashboard', 'view_analytics', 'manage_settings', 'manage_roles'
    ],
    isSystemRole: true
  },
  {
    name: 'company_admin',
    displayName: 'Company Administrator',
    description: 'Full access to company data and settings',
    permissions: [
      'create_users', 'read_users', 'update_users', 'delete_users',
      'read_companies', 'update_companies',
      'create_clients', 'read_clients', 'update_clients', 'delete_clients',
      'create_leads', 'read_leads', 'update_leads', 'delete_leads',
      'view_dashboard', 'view_analytics', 'manage_settings'
    ],
    isSystemRole: true
  },
  {
    name: 'manager',
    displayName: 'Manager',
    description: 'Manage team and view reports',
    permissions: [
      'read_users', 'update_users',
      'read_companies',
      'create_clients', 'read_clients', 'update_clients', 'delete_clients',
      'create_leads', 'read_leads', 'update_leads', 'delete_leads',
      'view_dashboard', 'view_analytics'
    ],
    isSystemRole: true
  },
  {
    name: 'sales_rep',
    displayName: 'Sales Representative',
    description: 'Manage assigned clients and leads',
    permissions: [
      'read_users',
      'read_companies',
      'create_clients', 'read_clients', 'update_clients',
      'create_leads', 'read_leads', 'update_leads',
      'view_dashboard'
    ],
    isSystemRole: true
  },
  {
    name: 'user',
    displayName: 'User',
    description: 'Basic user access',
    permissions: [
      'read_users',
      'read_companies',
      'read_clients',
      'read_leads',
      'view_dashboard'
    ],
    isSystemRole: true
  }
];

// Demo companies
const demoCompanies = [
  {
    name: 'TechStart Solutions',
    email: 'admin@techstart.com',
    phone: '+1-555-0101',
    address: {
      street: '123 Innovation Drive',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },
    website: 'https://techstart.com',
    industry: 'Technology',
    plan: 'professional',
    maxUsers: 25,
    currentUsers: 8
  },
  {
    name: 'Global Marketing Inc',
    email: 'admin@globalmarketing.com',
    phone: '+1-555-0202',
    address: {
      street: '456 Business Plaza',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    website: 'https://globalmarketing.com',
    industry: 'Marketing',
    plan: 'enterprise',
    maxUsers: 50,
    currentUsers: 12
  }
];

// Demo users (will be created for each company)
const demoUsers = [
  {
    firstName: 'John',
    lastName: 'Admin',
    email: 'john.admin@{company}.com',
    password: 'Admin123!',
    phone: '+1-555-1001',
    roleType: 'company_admin'
  },
  {
    firstName: 'Sarah',
    lastName: 'Manager',
    email: 'sarah.manager@{company}.com',
    password: 'Manager123!',
    phone: '+1-555-1002',
    roleType: 'manager'
  },
  {
    firstName: 'Mike',
    lastName: 'Sales',
    email: 'mike.sales@{company}.com',
    password: 'Sales123!',
    phone: '+1-555-1003',
    roleType: 'sales_rep'
  },
  {
    firstName: 'Lisa',
    lastName: 'Rep',
    email: 'lisa.rep@{company}.com',
    password: 'Rep123!',
    phone: '+1-555-1004',
    roleType: 'sales_rep'
  }
];

// Demo clients
const demoClients = [
  {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.johnson@example.com',
    phone: '+1-555-2001',
    companyName: 'Johnson Enterprises',
    jobTitle: 'CEO',
    industry: 'Retail',
    status: 'active',
    source: 'referral',
    value: 50000,
    tags: ['vip', 'enterprise']
  },
  {
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob.smith@example.com',
    phone: '+1-555-2002',
    companyName: 'Smith Corp',
    jobTitle: 'CTO',
    industry: 'Technology',
    status: 'active',
    source: 'website',
    value: 75000,
    tags: ['tech', 'high-value']
  },
  {
    firstName: 'Carol',
    lastName: 'Davis',
    email: 'carol.davis@example.com',
    phone: '+1-555-2003',
    companyName: 'Davis Industries',
    jobTitle: 'Marketing Director',
    industry: 'Manufacturing',
    status: 'potential',
    source: 'cold_call',
    value: 30000,
    tags: ['manufacturing']
  }
];

// Demo leads
const demoLeads = [
  {
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@example.com',
    phone: '+1-555-3001',
    companyName: 'Wilson LLC',
    jobTitle: 'Operations Manager',
    industry: 'Logistics',
    status: 'qualified',
    priority: 'high',
    source: 'trade_show',
    estimatedValue: 85000,
    probability: 60,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    tags: ['logistics', 'high-priority']
  },
  {
    firstName: 'Emma',
    lastName: 'Brown',
    email: 'emma.brown@example.com',
    phone: '+1-555-3002',
    companyName: 'Brown & Associates',
    jobTitle: 'Partner',
    industry: 'Legal',
    status: 'proposal',
    priority: 'medium',
    source: 'referral',
    estimatedValue: 120000,
    probability: 75,
    expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    tags: ['legal', 'partnership']
  },
  {
    firstName: 'Frank',
    lastName: 'Taylor',
    email: 'frank.taylor@example.com',
    phone: '+1-555-3003',
    companyName: 'Taylor Consulting',
    jobTitle: 'Principal Consultant',
    industry: 'Consulting',
    status: 'new',
    priority: 'medium',
    source: 'website',
    estimatedValue: 45000,
    probability: 20,
    expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    tags: ['consulting', 'new-lead']
  },
  {
    firstName: 'Grace',
    lastName: 'Miller',
    email: 'grace.miller@example.com',
    phone: '+1-555-3004',
    companyName: 'Miller Group',
    jobTitle: 'VP Sales',
    industry: 'Financial Services',
    status: 'negotiation',
    priority: 'urgent',
    source: 'email_campaign',
    estimatedValue: 200000,
    probability: 85,
    expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    tags: ['finance', 'urgent', 'high-value']
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Company.deleteMany({}),
      Role.deleteMany({}),
      Client.deleteMany({}),
      Lead.deleteMany({}),
      Tenant.deleteMany({})
    ]);
    
    // Create roles
    console.log('👤 Creating default roles...');
    const createdRoles = await Role.insertMany(defaultRoles);
    const roleMap = {};
    createdRoles.forEach(role => {
      roleMap[role.name] = role._id;
    });
    
    // Create super admin user
    console.log('🔐 Creating super admin user...');
    const superAdminRole = createdRoles.find(role => role.name === 'super_admin');
    
    // Create system tenant for super admin
    const systemTenant = await Tenant.create({
      name: 'System Administration',
      subdomain: 'system',
      email: 'system@crm.com',
      plan: 'enterprise',
      status: 'active',
      features: {
        maxUsers: 1000,
        maxCompanies: 100,
        analytics: true,
        customBranding: true,
        apiAccess: true,
        advancedReporting: true,
        multiLanguage: true,
        customFields: true
      }
    });
    
    // Create a dummy company for super admin (required by schema)
    const systemCompany = await Company.create({
      tenant: systemTenant._id,
      name: 'System Administration',
      email: 'system@crm.com',
      plan: 'enterprise',
      maxUsers: 1,
      currentUsers: 1
    });
    
    const superAdmin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@crm.com',
      password: 'SuperAdmin123!',
      phone: '+1-555-0000',
      tenant: systemTenant._id,
      company: systemCompany._id,
      role: superAdminRole._id,
      emailVerified: true
    });
    
    console.log('✅ Super Admin created:', {
      email: 'admin@crm.com',
      password: 'SuperAdmin123!'
    });
    
    // Create demo companies with tenants
    console.log('🏢 Creating demo companies...');
    const createdCompanies = [];
    
    for (const companyData of demoCompanies) {
      // Create tenant for each company
      const companySubdomain = companyData.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      const tenant = await Tenant.create({
        name: companyData.name,
        subdomain: companySubdomain,
        email: companyData.email,
        plan: companyData.plan,
        status: 'active',
        features: {
          maxUsers: companyData.maxUsers,
          maxCompanies: 1,
          analytics: true,
          customBranding: companyData.plan === 'enterprise',
          apiAccess: companyData.plan !== 'starter',
          advancedReporting: companyData.plan === 'enterprise',
          multiLanguage: false,
          customFields: companyData.plan !== 'starter'
        }
      });
      
      // Create company with tenant
      const company = await Company.create({
        ...companyData,
        tenant: tenant._id
      });
      createdCompanies.push(company);
      console.log(`✅ Company created: ${company.name} (tenant: ${tenant.subdomain})`);
      
      // Create users for each company
      console.log(`👥 Creating users for ${company.name}...`);
      const companyUsers = [];
      
      for (const userData of demoUsers) {
        const user = await User.create({
          ...userData,
          email: userData.email.replace('{company}', company.name.toLowerCase().replace(/\s+/g, '')),
          tenant: tenant._id,
          company: company._id,
          role: roleMap[userData.roleType],
          emailVerified: true
        });
        companyUsers.push(user);
        console.log(`  ✅ User created: ${user.email}`);
      }
      
      // Create clients for each company
      console.log(`👤 Creating clients for ${company.name}...`);
      for (const clientData of demoClients) {
        const salesRep = companyUsers.find(user => 
          user.role.toString() === roleMap['sales_rep'].toString()
        );
        
        const client = await Client.create({
          ...clientData,
          tenant: tenant._id,
          company: company._id,
          assignedTo: salesRep?._id,
          lastContact: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          nextFollowUp: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000)
        });
        console.log(`  ✅ Client created: ${client.fullName}`);
      }
      
      // Create leads for each company
      console.log(`🎯 Creating leads for ${company.name}...`);
      for (const leadData of demoLeads) {
        const salesRep = companyUsers[Math.floor(Math.random() * companyUsers.length)];
        
        const lead = await Lead.create({
          ...leadData,
          tenant: tenant._id,
          company: company._id,
          assignedTo: salesRep._id,
          lastContact: leadData.status !== 'new' ? 
            new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : 
            null
        });
        
        // Add some sample notes and activities
        if (leadData.status !== 'new') {
          await lead.addNote(
            `Initial contact made. ${leadData.firstName} showed interest in our services.`,
            salesRep._id
          );
          
          await lead.addActivity({
            type: 'call',
            subject: 'Discovery Call',
            description: 'Discussed requirements and timeline',
            scheduledDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
            status: 'scheduled'
          }, salesRep._id);
        }
        
        console.log(`  ✅ Lead created: ${lead.fullName}`);
      }
      
      // Update company pricing
      company.calculatePricing();
      await company.save();
    }
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Demo Accounts Created:');
    console.log('Super Admin: admin@crm.com / SuperAdmin123!');
    
    createdCompanies.forEach((company, index) => {
      const companyDomain = company.name.toLowerCase().replace(/\s+/g, '');
      console.log(`\n${company.name}:`);
      console.log(`  Admin: john.admin@${companyDomain}.com / Admin123!`);
      console.log(`  Manager: sarah.manager@${companyDomain}.com / Manager123!`);
      console.log(`  Sales Rep: mike.sales@${companyDomain}.com / Sales123!`);
      console.log(`  Sales Rep: lisa.rep@${companyDomain}.com / Rep123!`);
    });
    
    console.log('\n💡 You can now start the server and login with any of these accounts.');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Run the seeder
seedDatabase();










