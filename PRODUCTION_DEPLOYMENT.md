# 🚀 Production Multi-Tenant Deployment Guide

## 🌐 Domain & DNS Setup

### 1. Purchase Domain
- Buy a domain like `mycrm.com`
- Configure DNS with your domain provider

### 2. DNS Configuration
```dns
# Main domain
A       mycrm.com           → YOUR_SERVER_IP
AAAA    mycrm.com           → YOUR_IPV6_IP (optional)

# Wildcard subdomain
CNAME   *.mycrm.com         → mycrm.com

# Optional: www redirect
CNAME   www.mycrm.com       → mycrm.com
```

## 🏗️ Server Infrastructure Options

### Option A: Single Server with Reverse Proxy (Recommended)

```nginx
# /etc/nginx/sites-available/crm-multi-tenant
server {
    listen 80;
    listen 443 ssl http2;
    server_name *.mycrm.com mycrm.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/mycrm.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mycrm.com/privkey.pem;
    
    # Extract subdomain
    set $subdomain "";
    if ($host ~* ^([^.]+)\.mycrm\.com$) {
        set $subdomain $1;
    }
    
    # Frontend (React build)
    location / {
        root /var/www/crm-frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Add subdomain header for frontend
        add_header X-Subdomain $subdomain;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Subdomain $subdomain;
    }
}

# Main domain redirect
server {
    listen 80;
    listen 443 ssl http2;
    server_name mycrm.com www.mycrm.com;
    
    # Redirect to a default tenant or landing page
    return 301 https://app.mycrm.com$request_uri;
}
```

### Option B: Serverless/CDN Approach

```yaml
# Vercel configuration (vercel.json)
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend.railway.app/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Subdomain",
          "value": "$host"
        }
      ]
    }
  ]
}
```

## 🔧 Backend Configuration

### Environment Variables
```env
# Production .env
NODE_ENV=production
PORT=5002
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/crm_system
JWT_SECRET=your_super_secure_jwt_secret_here
DOMAIN=mycrm.com
FRONTEND_URL=https://mycrm.com
```

### Tenant Middleware (Already Configured)
The middleware in `backend/middleware/tenant.js` already handles:
- Subdomain extraction from `Host` header
- Tenant identification by subdomain
- Multi-tenant data isolation

## 🎨 Frontend Configuration

### 1. Update API Base URL
```javascript
// frontend/src/services/api.js
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.mycrm.com/api'  // or same domain: '/api'
  : 'http://localhost:5002/api';
```

### 2. Environment Variables
```env
# frontend/.env.production
REACT_APP_API_URL=https://mycrm.com/api
REACT_APP_DOMAIN=mycrm.com
```

### 3. Subdomain Detection (Already Implemented)
The `TenantContext` already handles subdomain extraction:
```javascript
// frontend/src/contexts/TenantContext.js
const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // For production: techstart.mycrm.com → "techstart"
  if (parts.length > 2 && parts[0] !== 'www') {
    return parts[0];
  }
  
  return null;
};
```

## 🚀 Deployment Steps

### Step 1: Prepare Domain
1. Purchase domain (e.g., `mycrm.com`)
2. Configure DNS records as shown above
3. Wait for DNS propagation (24-48 hours)

### Step 2: Deploy Backend
```bash
# On your server (Ubuntu/CentOS)
git clone your-repo
cd crm/backend
npm install --production
npm run build  # if you have a build step

# Install PM2 for process management
npm install -g pm2
pm2 start server.js --name "crm-backend"
pm2 startup
pm2 save
```

### Step 3: Deploy Frontend
```bash
cd ../frontend
npm install
npm run build

# Copy build to web server
sudo cp -r build/* /var/www/crm-frontend/build/
```

### Step 4: Configure Nginx
```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Copy configuration
sudo nano /etc/nginx/sites-available/crm-multi-tenant
# (paste the nginx config from above)

# Enable site
sudo ln -s /etc/nginx/sites-available/crm-multi-tenant /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL Certificate
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get wildcard certificate
sudo certbot --nginx -d mycrm.com -d "*.mycrm.com"
```

## 🎯 How Tenants Access the System

### Tenant URLs
- **TechStart Solutions**: `https://techstartsolutions.mycrm.com`
- **Global Marketing**: `https://globalmarketinginc.mycrm.com`
- **Super Admin**: `https://admin.mycrm.com` or `https://system.mycrm.com`

### User Flow
1. User visits `https://techstartsolutions.mycrm.com`
2. Frontend detects subdomain: `techstartsolutions`
3. TenantContext fetches tenant info via API
4. Backend middleware validates tenant exists and is active
5. User sees login page with TechStart branding
6. After login, all data is filtered by tenant

## 🔒 Security Considerations

### 1. Tenant Isolation
- All database queries automatically filtered by tenant
- Users can only access their tenant's data
- Super admin has cross-tenant access

### 2. SSL/TLS
- Wildcard SSL certificate covers all subdomains
- Force HTTPS redirects
- HSTS headers for security

### 3. Rate Limiting
```javascript
// Per-tenant rate limiting
const tenantRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    const tenant = req.tenant;
    return tenant?.plan === 'enterprise' ? 1000 : 100;
  },
  keyGenerator: (req) => `${req.ip}-${req.tenant?._id}`,
});
```

## 📊 Monitoring & Analytics

### 1. Tenant Usage Tracking
```javascript
// Track tenant activity
const trackTenantActivity = async (tenantId, action) => {
  await TenantActivity.create({
    tenant: tenantId,
    action,
    timestamp: new Date(),
    ip: req.ip
  });
};
```

### 2. Health Checks
```javascript
// Tenant health endpoint
app.get('/health/:subdomain', async (req, res) => {
  const tenant = await Tenant.findBySubdomain(req.params.subdomain);
  res.json({
    status: tenant?.status || 'not_found',
    plan: tenant?.plan,
    users: tenant?.currentUsers
  });
});
```

## 🎨 Custom Branding (Future Enhancement)

### Per-Tenant Theming
```javascript
// TenantContext provides theme
const theme = {
  primary: tenant.branding?.primaryColor || '#3B82F6',
  logo: tenant.branding?.logoUrl || '/default-logo.png',
  companyName: tenant.name
};
```

## 📈 Scaling Considerations

### Database Sharding
- Consider sharding by tenant for large scale
- Use MongoDB replica sets
- Implement read replicas for analytics

### CDN & Caching
- Use CloudFlare or AWS CloudFront
- Cache static assets per tenant
- Implement Redis for session storage

### Load Balancing
- Multiple backend instances
- Sticky sessions for WebSocket connections
- Health checks for auto-scaling



