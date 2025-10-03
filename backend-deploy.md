# Backend Service Deployment Instructions

## Quick Deploy to Render

### Step 1: Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository: `https://github.com/osamagivegh-hash/CRM-System-`

### Step 2: Configuration
- **Name**: `crm-backend`
- **Environment**: `Node`
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Plan**: Starter (Free)

### Step 3: Environment Variables
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm_production
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
FRONTEND_URL=https://crm-frontend.onrender.com
```

### Step 4: Deploy
Click "Create Web Service" and wait for deployment.

**Your backend will be available at**: `https://crm-backend.onrender.com`
