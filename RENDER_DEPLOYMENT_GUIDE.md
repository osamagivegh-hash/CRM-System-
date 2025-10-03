# Render Deployment Guide for CRM System

## Overview
This guide will help you deploy your Multi-Tenant CRM System to Render.com, a cloud platform that supports both backend services and static sites.

## Prerequisites
- GitHub repository with your CRM code
- Render.com account
- MongoDB Atlas account (for production database)

## Step 1: Prepare MongoDB Database

### Option A: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist Render's IP ranges (0.0.0.0/0 for all IPs)
5. Get your connection string

### Option B: Use Render's MongoDB Add-on
1. In Render dashboard, create a new MongoDB database
2. Use the connection string provided by Render

## Step 2: Deploy Backend Service

1. **Connect GitHub Repository**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your CRM repository

2. **Configure Backend Service**
   - **Name**: `crm-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (or upgrade for better performance)

3. **Environment Variables**
   Add these environment variables in Render dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm_production
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   BCRYPT_ROUNDS=12
   FRONTEND_URL=https://your-frontend-url.onrender.com
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://crm-backend.onrender.com`)

## Step 3: Deploy Frontend Service

1. **Create Static Site**
   - Go to Render Dashboard
   - Click "New +" → "Static Site"
   - Connect your GitHub repository

2. **Configure Frontend Service**
   - **Name**: `crm-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`

3. **Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```

4. **Deploy**
   - Click "Create Static Site"
   - Wait for deployment to complete
   - Note your frontend URL

## Step 4: Update Environment Variables

After both services are deployed, update the environment variables:

1. **Backend Service**
   - Update `FRONTEND_URL` to your frontend URL
   
2. **Frontend Service**
   - Update `REACT_APP_API_URL` to your backend URL

## Step 5: Create Super Admin

1. Access your backend service logs
2. Run the super admin creation script:
   ```bash
   cd backend && node create-super-admin.js
   ```

Or create via API:
```bash
curl -X POST https://your-backend-url.onrender.com/api/super-admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "your-secure-password",
    "name": "Super Admin"
  }'
```

## Step 6: Configure Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click "Settings" → "Custom Domains"
3. Add your domain and configure DNS

## Environment Variables Reference

### Backend (.env)
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
FRONTEND_URL=https://your-frontend-url.onrender.com
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **Database Connection Issues**
   - Verify MongoDB connection string
   - Check IP whitelist settings
   - Ensure database user has correct permissions

3. **CORS Issues**
   - Verify FRONTEND_URL environment variable
   - Check CORS configuration in server.js

4. **Static Site Not Loading**
   - Verify build command and publish directory
   - Check for build errors in logs
   - Ensure REACT_APP_API_URL is correct

### Performance Optimization

1. **Upgrade to Paid Plans**
   - Free tier has limitations
   - Paid plans offer better performance and reliability

2. **Database Optimization**
   - Use MongoDB Atlas M10+ for production
   - Implement proper indexing

3. **CDN Setup**
   - Use Render's CDN for static assets
   - Configure caching headers

## Monitoring and Maintenance

1. **Logs**
   - Monitor application logs in Render dashboard
   - Set up log aggregation if needed

2. **Health Checks**
   - Use `/api/health` endpoint for monitoring
   - Set up uptime monitoring

3. **Backups**
   - Regular MongoDB backups
   - Database migration scripts

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

## Cost Optimization

1. **Free Tier Limitations**
   - Services sleep after inactivity
   - Limited build minutes
   - Database connection limits

2. **Upgrade Strategy**
   - Monitor usage patterns
   - Upgrade services as needed
   - Consider reserved instances for high traffic

## Support and Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

## Next Steps

1. Test your deployed application thoroughly
2. Set up monitoring and alerts
3. Configure automated deployments
4. Plan for scaling as your user base grows
