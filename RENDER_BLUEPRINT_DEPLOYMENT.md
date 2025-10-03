# Render Blueprint Deployment Guide

This guide provides step-by-step instructions for deploying the CRM system to Render using the blueprint configuration.

## 🚀 Quick Start

### Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Node.js Knowledge**: Basic understanding of Node.js and React

### One-Click Deployment

1. **Fork or Clone** this repository to your GitHub account
2. **Connect to Render**:
   - Go to [render.com](https://render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select this repository
3. **Deploy**: Render will automatically detect the `render.yaml` file and deploy all services

## 📋 What Gets Deployed

The blueprint creates the following services:

### Backend Service (`crm-backend`)
- **Type**: Web Service
- **Runtime**: Node.js
- **Plan**: Starter
- **Region**: Oregon
- **Health Check**: `/api/health`
- **Auto Deploy**: Enabled

### Frontend Service (`crm-frontend`)
- **Type**: Static Site
- **Build Command**: `npm ci && npm run build`
- **Publish Directory**: `./frontend/build`
- **Plan**: Starter
- **Region**: Oregon
- **Auto Deploy**: Enabled

### Database (`crm-database`)
- **Type**: MongoDB
- **Plan**: Starter
- **Region**: Oregon
- **Database Name**: `crm_production`

## 🔧 Environment Variables

All environment variables are automatically configured by the blueprint:

### Backend Variables
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `MONGODB_URI`: Auto-generated from database
- `JWT_SECRET`: Auto-generated secure secret
- `JWT_EXPIRE`: `7d`
- `BCRYPT_ROUNDS`: `12`
- `FRONTEND_URL`: Auto-generated from frontend service
- `RATE_LIMIT_WINDOW_MS`: `900000`
- `RATE_LIMIT_MAX_REQUESTS`: `100`

### Frontend Variables
- `REACT_APP_API_URL`: Auto-generated from backend service
- `GENERATE_SOURCEMAP`: `false`

## 🗄️ Database Initialization

After deployment, you need to initialize the database:

### Option 1: Using Render Shell
1. Go to your backend service in Render dashboard
2. Click "Shell" tab
3. Run: `npm run init-production`

### Option 2: Using Local Script
1. Set environment variables locally
2. Run: `cd backend && npm run init-production`

### Default Credentials
- **Email**: `superadmin@crm.com`
- **Password**: `SuperAdmin123!`

⚠️ **Important**: Change the password after first login!

## 🔍 Health Checks

The system includes multiple health check endpoints:

### Basic Health Check
```bash
GET /api/health
```
Returns basic service status.

### Detailed Health Check
```bash
GET /api/health/detailed
```
Returns detailed system information including:
- Database connection status
- Memory usage
- Uptime
- Environment details

### Readiness Probe
```bash
GET /api/ready
```
Returns service readiness status (used by Render for health checks).

## 🛠️ Validation

Before deploying, validate your configuration:

```bash
npm run validate-deployment
```

This script checks:
- ✅ Environment files exist
- ✅ Render configuration is valid
- ✅ Package.json files are correct
- ✅ Server configuration is proper
- ✅ Frontend builds successfully

## 📊 Monitoring

### Render Dashboard
- Monitor service health in the Render dashboard
- View logs for debugging
- Check resource usage

### Application Logs
- Backend logs: Available in Render service logs
- Frontend logs: Build logs available during deployment

### Health Monitoring
- Use `/api/health/detailed` for comprehensive monitoring
- Set up external monitoring tools to ping health endpoints

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Failures
**Problem**: Frontend or backend build fails
**Solution**:
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

#### 2. Database Connection Issues
**Problem**: Backend can't connect to database
**Solution**:
- Verify `MONGODB_URI` is set correctly
- Check database service is running
- Ensure network connectivity

#### 3. CORS Errors
**Problem**: Frontend can't connect to backend
**Solution**:
- Verify `FRONTEND_URL` and `REACT_APP_API_URL` are correct
- Check CORS configuration in server.js
- Ensure services are in the same region

#### 4. Environment Variable Issues
**Problem**: Missing or incorrect environment variables
**Solution**:
- Check render.yaml configuration
- Verify variable names match exactly
- Ensure all required variables are set

### Debugging Steps

1. **Check Service Logs**:
   ```bash
   # In Render dashboard, go to service → Logs
   ```

2. **Test Health Endpoints**:
   ```bash
   curl https://your-backend-url.onrender.com/api/health
   curl https://your-backend-url.onrender.com/api/health/detailed
   ```

3. **Verify Database Connection**:
   ```bash
   # In Render shell
   node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(console.error)"
   ```

4. **Check Frontend Build**:
   ```bash
   # Test locally
   cd frontend && npm run build
   ```

## 🔄 Updates and Maintenance

### Automatic Deployments
- Services are configured for auto-deploy on git push
- Each push to main branch triggers deployment

### Manual Deployments
- Use Render dashboard to trigger manual deployments
- Use "Deploy latest commit" option

### Database Migrations
- Run migration scripts through Render shell
- Use `npm run init-production` for initial setup
- Use individual scripts for specific migrations

## 📈 Scaling

### Horizontal Scaling
- Upgrade to higher plans in Render dashboard
- Add more instances for backend service
- Use load balancer for multiple instances

### Vertical Scaling
- Increase memory and CPU for services
- Upgrade database plan for better performance
- Monitor resource usage and scale accordingly

## 🔒 Security

### Production Security Features
- ✅ Helmet.js for security headers
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ JWT tokens with secure secrets
- ✅ Bcrypt password hashing
- ✅ Environment variables secured

### Security Best Practices
- Change default passwords immediately
- Use strong JWT secrets (auto-generated)
- Regularly update dependencies
- Monitor for security vulnerabilities
- Use HTTPS (enabled by default on Render)

## 📞 Support

### Render Support
- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Render Status](https://status.render.com)

### Application Support
- Check application logs in Render dashboard
- Use health check endpoints for monitoring
- Run validation script for configuration issues

## 🎯 Next Steps

After successful deployment:

1. **Initialize Database**: Run `npm run init-production`
2. **Login**: Use super admin credentials
3. **Create Company**: Set up your first company
4. **Add Users**: Create additional users and roles
5. **Configure Settings**: Customize system settings
6. **Monitor**: Set up monitoring and alerts

## 📝 Additional Resources

- [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [User Guide](./USER_GUIDE.md)
- [Development Setup](./DEVELOPMENT_SETUP.md)

---

**Happy Deploying! 🚀**

For issues or questions, please check the troubleshooting section or create an issue in the repository.
