# Frontend Static Site Deployment Instructions

## Quick Deploy to Render

### Step 1: Create Static Site
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Static Site"
3. Connect GitHub repository: `https://github.com/osamagivegh-hash/CRM-System-`

### Step 2: Configuration
- **Name**: `crm-frontend`
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/build`
- **Plan**: Starter (Free)

### Step 3: Environment Variables
```
REACT_APP_API_URL=https://crm-backend.onrender.com
```

### Step 4: Deploy
Click "Create Static Site" and wait for deployment.

**Your frontend will be available at**: `https://crm-frontend.onrender.com`

## Important Notes
- Update `REACT_APP_API_URL` with your actual backend URL after backend deployment
- The frontend will automatically connect to the backend API
- Make sure to deploy backend first, then frontend
