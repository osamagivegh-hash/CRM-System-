# 🏢 Multi-Tenant CRM Troubleshooting Guide

## 🚨 "Tenant Not Found" Error Solutions

### 🔍 **Problem Diagnosis**

The "Tenant Not Found" error occurs when your sales representative tries to access the system but the tenant cannot be identified. This happens because the system uses **subdomain-based tenant routing**.

### 🛠 **Solution 1: Use Correct Tenant Subdomain (Recommended)**

#### Step 1: Check Your Existing Tenants
```bash
cd backend
npm run check-tenants
```

This will show you all existing tenants and their subdomains.

#### Step 2: Add Subdomains to Hosts File
Add these lines to your hosts file:

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
**Mac/Linux**: `/etc/hosts`

```
127.0.0.1 techstartsolutions.localhost
127.0.0.1 globalmarketinginc.localhost
```

#### Step 3: Access via Correct URL
Instead of `http://localhost:3000`, use:
- **TechStart Solutions**: `http://techstartsolutions.localhost:3000`
- **Global Marketing**: `http://globalmarketinginc.localhost:3000`

### 🛠 **Solution 2: Localhost Development Access (Alternative)**

I've modified the tenant middleware to allow localhost access for development. Now you can:

1. **Access via localhost**: `http://localhost:3000`
2. **Login with your sales rep credentials**
3. **The system will automatically use the user's tenant**

### 🔑 **Demo Login Credentials**

After running the seed script, you can use these accounts:

#### TechStart Solutions
- **Admin**: `john.admin@techstartsolutions.com` / `Admin123!`
- **Sales Rep 1**: `mike.sales@techstartsolutions.com` / `Sales123!`
- **Sales Rep 2**: `lisa.rep@techstartsolutions.com` / `Rep123!`

#### Global Marketing Inc
- **Admin**: `john.admin@globalmarketinginc.com` / `Admin123!`
- **Sales Rep 1**: `mike.sales@globalmarketinginc.com` / `Sales123!`
- **Sales Rep 2**: `lisa.rep@globalmarketinginc.com` / `Rep123!`

### 🔧 **Troubleshooting Steps**

#### 1. Check if Tenants Exist
```bash
cd backend
npm run check-tenants
```

#### 2. Verify Database Connection
```bash
cd backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ DB Connected')).catch(err => console.error('❌ DB Error:', err.message))"
```

#### 3. Reset Database (if needed)
```bash
cd backend
npm run reset
```

#### 4. Check Server Logs
Look for these log messages in your backend console:
- `🌐 Host: localhost:3000`
- `📍 Subdomain: localhost`
- `🏠 Localhost development - using user tenant: [Tenant Name]`

### 🌐 **URL Patterns**

| Environment | Pattern | Example |
|-------------|---------|---------|
| **Production** | `https://{subdomain}.{domain}` | `https://techstartsolutions.mycrm.com` |
| **Development (Subdomain)** | `http://{subdomain}.localhost:3000` | `http://techstartsolutions.localhost:3000` |
| **Development (Localhost)** | `http://localhost:3000` | `http://localhost:3000` |

### 📋 **Common Issues & Solutions**

#### Issue: "Tenant not identified"
**Solution**: 
1. Ensure you're using the correct subdomain URL
2. Check if the tenant exists in the database
3. Verify the user is assigned to the correct tenant

#### Issue: "User account is deactivated"
**Solution**: 
1. Check if `isActive` is `true` for the user
2. Reactivate the user account

#### Issue: "Tenant account is suspended"
**Solution**: 
1. Check tenant status in database
2. Update status to `active`

#### Issue: Hosts file not working
**Solution**: 
1. Run command prompt as Administrator (Windows)
2. Edit hosts file with proper permissions
3. Clear DNS cache: `ipconfig /flushdns` (Windows)

### 🔄 **Testing the Fix**

1. **Start your servers**:
   ```bash
   npm run dev
   ```

2. **Access the system**:
   - Option A: `http://localhost:3000` (new localhost support)
   - Option B: `http://techstartsolutions.localhost:3000` (subdomain)

3. **Login with sales rep credentials**:
   - Email: `mike.sales@techstartsolutions.com`
   - Password: `Sales123!`

4. **Verify access**: You should see the dashboard without tenant errors.

### 📞 **Need Help?**

If you're still experiencing issues:

1. **Check the backend console** for detailed error messages
2. **Run the tenant check script**: `npm run check-tenants`
3. **Verify your user is assigned to a tenant** in the database
4. **Check the network tab** in browser dev tools for API errors

### 🚀 **Production Deployment**

For production, ensure:
1. **DNS is configured** for subdomain routing
2. **SSL certificates** are set up for all subdomains
3. **Load balancer** properly forwards subdomain headers
4. **Environment variables** are set correctly

---

**Last Updated**: $(date)
**Version**: 1.0.0



