# Separate Services Deployment Guide for CRM System

## Overview
Since Render blueprint free tier is not available, we'll deploy the CRM system as separate services:
1. **Backend Web Service** (Node.js API)
2. **Frontend Static Site** (React App)
3. **Database** (MongoDB Atlas or Render Database)

## Prerequisites
- GitHub repository with your CRM code
- Render.com account
- MongoDB Atlas account (recommended) or Render database

## Step 1: Deploy Backend Web Service

### 1.1 Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select your CRM repository

### 1.2 Configure Backend Service
- **Name**: `crm-backend`
- **Environment**: `Node`
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Plan**: Starter (Free)

### 1.3 Environment Variables for Backend
Add these environment variables:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm_production
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
FRONTEND_URL=https://your-frontend-url.onrender.com
```

### 1.4 Deploy Backend
- Click "Create Web Service"
- Wait for deployment to complete
- Note your backend URL: `https://crm-backend.onrender.com`

## Step 2: Deploy Frontend Static Site

### 2.1 Create Static Site
1. Go to Render Dashboard
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Select your CRM repository

### 2.2 Configure Frontend Service
- **Name**: `crm-frontend`
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/build`
- **Plan**: Starter (Free)

### 2.3 Environment Variables for Frontend
Add this environment variable:
```
REACT_APP_API_URL=https://crm-backend.onrender.com
```

### 2.4 Deploy Frontend
- Click "Create Static Site"
- Wait for deployment to complete
- Note your frontend URL: `https://crm-frontend.onrender.com`

## Step 3: Update Environment Variables

### 3.1 Update Backend Environment Variables
After frontend is deployed, update the backend service:
- Go to `crm-backend` service
- Go to "Environment" tab
- Update `FRONTEND_URL` to your frontend URL

### 3.2 Update Frontend Environment Variables
After backend is deployed, update the frontend service:
- Go to `crm-frontend` service  
- Go to "Environment" tab
- Update `REACT_APP_API_URL` to your backend URL

## Step 4: Database Setup

### Option A: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster
3. Create a database user
4. Whitelist Render IPs (0.0.0.0/0)
5. Get connection string
6. Update `MONGODB_URI` in backend environment variables

### Option B: Render Database
1. In Render Dashboard, create new PostgreSQL database
2. Use the connection string provided
3. Update `MONGODB_URI` in backend environment variables

## Step 5: Create Super Admin

### 5.1 Access Backend Logs
- Go to `crm-backend` service
- Click "Logs" tab

### 5.2 Create Super Admin
Run this command in the logs or via API:
```bash
curl -X POST https://crm-backend.onrender.com/api/super-admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "your-secure-password",
    "name": "Super Admin"
  }'
```

## Step 6: Test Your Application

### 6.1 Test Backend
```bash
# Health check
curl https://crm-backend.onrender.com/api/health

# Should return:
{
  "success": true,
  "message": "CRM API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 6.2 Test Frontend
- Visit your frontend URL: `https://crm-frontend.onrender.com`
- The frontend should load and connect to the backend
- Try logging in with your super admin credentials

## Environment Variables Summary

### Backend Service (.env)
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm_production
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
FRONTEND_URL=https://crm-frontend.onrender.com
```

### Frontend Service (.env)
```env
REACT_APP_API_URL=https://crm-backend.onrender.com
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **Service Communication Issues**
   - Verify environment variables are set correctly
   - Check that services can reach each other
   - Ensure CORS is properly configured

3. **Database Connection Issues**
   - Check MongoDB connection string
   - Verify database user permissions
   - Check IP whitelist settings

### Debugging Steps

1. **Check Service Logs**
   - Go to each service in Render Dashboard
   - Click "Logs" to see real-time logs
   - Look for error messages

2. **Test API Endpoints**
   ```bash
   # Test health endpoint
   curl https://crm-backend.onrender.com/api/health
   ```

3. **Verify Environment Variables**
   - Check that all required environment variables are set
   - Verify URLs are correct and accessible

## Performance Optimization

### Free Tier Limitations
- Services sleep after 15 minutes of inactivity
- Limited build minutes per month
- Database connection limits

### Upgrade Options
- Upgrade to paid plans for better performance
- Use MongoDB Atlas M10+ for production
- Enable Render's CDN for static assets

## Security Considerations

1. **Environment Variables**
   - Never commit .env files
   - Use strong JWT secrets
   - Rotate secrets regularly

2. **Database Security**
   - Use strong passwords
   - Enable MongoDB authentication
   - Restrict IP access

3. **API Security**
   - Rate limiting is enabled
   - Helmet.js for security headers
   - CORS properly configured

## Monitoring and Maintenance

1. **Health Checks**
   - Use `/api/health` endpoint for monitoring
   - Set up uptime monitoring

2. **Logs**
   - Monitor application logs
   - Set up log aggregation if needed

3. **Backups**
   - Regular MongoDB backups
   - Database migration scripts

## Support Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

Your CRM system is now deployed as separate services with proper communication between frontend and backend!
