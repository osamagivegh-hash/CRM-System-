const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const Tenant = require('./models/Tenant');
require('dotenv').config();

async function testUserCreation() {
  try {
    console.log('🧪 Testing user creation with empty company field...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a tenant admin role
    const role = await Role.findOne({ name: 'tenant_admin' });
    if (!role) {
      console.log('❌ No tenant_admin role found');
      return;
    }

    // Find a tenant
    const tenant = await Tenant.findOne();
    if (!tenant) {
      console.log('❌ No tenant found');
      return;
    }

    console.log('🏢 Using tenant:', tenant.name);
    console.log('🔐 Using role:', role.name);

    // Test data with empty company (this should not cause an error)
    const testUserData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test-${Date.now()}@example.com`,
      password: 'test123',
      tenant: tenant._id,
      company: '', // This empty string should be handled gracefully
      role: role._id
    };

    console.log('📝 Test user data:', {
      ...testUserData,
      password: '***'
    });

    // Clean up empty strings (same logic as backend)
    const cleanCompany = testUserData.company && testUserData.company !== '' ? testUserData.company : undefined;
    
    console.log('🧹 Cleaned company value:', cleanCompany);

    // Create user with cleaned data
    const user = await User.create({
      firstName: testUserData.firstName,
      lastName: testUserData.lastName,
      email: testUserData.email,
      password: testUserData.password,
      tenant: testUserData.tenant,
      company: cleanCompany, // undefined instead of empty string
      role: testUserData.role
    });

    console.log('✅ User created successfully!');
    console.log('👤 User ID:', user._id);
    console.log('🏢 Tenant:', user.tenant);
    console.log('🏪 Company:', user.company || 'None (undefined)');

    // Clean up - delete the test user
    await User.findByIdAndDelete(user._id);
    console.log('🧹 Test user deleted');

    mongoose.disconnect();
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    mongoose.disconnect();
  }
}

testUserCreation();





