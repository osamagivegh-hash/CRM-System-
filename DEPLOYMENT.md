# CRM System Deployment Guide

This guide provides detailed instructions for deploying the CRM system to various platforms.

## 📋 Pre-deployment Checklist

- [ ] MongoDB database set up (Atlas or self-hosted)
- [ ] Environment variables configured
- [ ] Dependencies installed and tested locally
- [ ] Database seeded with initial data
- [ ] Application tested in production mode locally

## 🌐 Deployment Options

### Option 1: Heroku (Recommended for beginners)

#### Backend Deployment

1. **Install Heroku CLI**
```bash
# Install Heroku CLI
npm install -g heroku
```

2. **Login to Heroku**
```bash
heroku login
```

3. **Create Heroku App**
```bash
cd backend
heroku create your-crm-backend
```

4. **Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your_mongodb_atlas_connection_string"
heroku config:set JWT_SECRET="your_super_secure_jwt_secret"
heroku config:set JWT_EXPIRE=7d
heroku config:set BCRYPT_ROUNDS=12
```

5. **Deploy**
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

6. **Seed Database**
```bash
heroku run npm run seed
```

#### Frontend Deployment

1. **Build for Production**
```bash
cd frontend
npm run build
```

2. **Create Heroku App**
```bash
heroku create your-crm-frontend
```

3. **Add Buildpack**
```bash
heroku buildpacks:set mars/create-react-app
```

4. **Set Environment Variables**
```bash
heroku config:set REACT_APP_API_URL="https://your-crm-backend.herokuapp.com/api"
```

5. **Deploy**
```bash
git add .
git commit -m "Deploy frontend to Heroku"
git push heroku main
```

### Option 2: Vercel (Frontend) + Railway (Backend)

#### Backend on Railway

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Connect your repository
   - Select the backend folder
   - Railway will auto-deploy

3. **Set Environment Variables**
   - Go to your project settings
   - Add environment variables:
     - `NODE_ENV=production`
     - `MONGODB_URI=your_connection_string`
     - `JWT_SECRET=your_jwt_secret`
     - `PORT=5000`

4. **Custom Start Command**
   - Set start command: `cd backend && npm start`

#### Frontend on Vercel

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd frontend
vercel
```

3. **Set Environment Variables**
   - Go to Vercel dashboard
   - Add environment variable:
     - `REACT_APP_API_URL=https://your-railway-backend.up.railway.app/api`

### Option 3: Digital Ocean Droplet

#### Server Setup

1. **Create Droplet**
   - Ubuntu 22.04 LTS
   - At least 2GB RAM
   - SSH key authentication

2. **Connect to Server**
```bash
ssh root@your_server_ip
```

3. **Update System**
```bash
apt update && apt upgrade -y
```

4. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
```

5. **Install PM2**
```bash
npm install -g pm2
```

6. **Install Nginx**
```bash
apt install nginx -y
```

#### Application Deployment

1. **Clone Repository**
```bash
cd /var/www
git clone your_repository_url crm-system
cd crm-system
```

2. **Install Dependencies**
```bash
npm run install-all
```

3. **Create Environment Files**
```bash
# Backend environment
cat > backend/.env << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
EOF

# Frontend environment
cat > frontend/.env << EOF
REACT_APP_API_URL=https://your-domain.com/api
EOF
```

4. **Build Frontend**
```bash
cd frontend
npm run build
```

5. **Start Backend with PM2**
```bash
cd ../backend
pm2 start server.js --name "crm-backend"
pm2 startup
pm2 save
```

6. **Configure Nginx**
```bash
cat > /etc/nginx/sites-available/crm-system << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend
    location / {
        root /var/www/crm-system/frontend/build;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
```

7. **Enable Site**
```bash
ln -s /etc/nginx/sites-available/crm-system /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

8. **SSL Certificate (Let's Encrypt)**
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Option 4: AWS EC2 + RDS

#### EC2 Instance Setup

1. **Launch EC2 Instance**
   - AMI: Ubuntu Server 22.04 LTS
   - Instance Type: t3.medium (or larger)
   - Security Group: Allow HTTP (80), HTTPS (443), SSH (22)

2. **Connect and Setup**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

Follow the same steps as Digital Ocean for application setup.

#### RDS MongoDB Alternative

If using AWS DocumentDB instead of MongoDB Atlas:

1. **Create DocumentDB Cluster**
   - Engine: Amazon DocumentDB
   - Instance class: db.t3.medium

2. **Update Connection String**
```bash
MONGODB_URI="mongodb://username:password@your-docdb-cluster.cluster-xyz.us-east-1.docdb.amazonaws.com:27017/crm_system?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
```

## 🔐 SSL Certificate Setup

### Using Let's Encrypt (Free)

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d your-domain.com

# Auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Using Cloudflare (Recommended)

1. **Add Domain to Cloudflare**
2. **Update DNS Records**
   - A record: your-domain.com → your_server_ip
   - CNAME: www → your-domain.com
3. **Enable SSL/TLS**
   - Set to "Full (strict)"
4. **Update Nginx Config**
   - Cloudflare handles SSL termination

## 📊 Monitoring and Maintenance

### PM2 Monitoring

```bash
# View processes
pm2 list

# View logs
pm2 logs crm-backend

# Restart application
pm2 restart crm-backend

# Monitor resources
pm2 monit
```

### Nginx Logs

```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

### Database Backup

```bash
# MongoDB Atlas - Use built-in backup
# Self-hosted MongoDB
mongodump --uri="your_connection_string" --out=/backup/$(date +%Y%m%d)
```

## 🚀 Performance Optimization

### Frontend Optimization

1. **Enable Gzip Compression**
```nginx
# Add to Nginx config
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

2. **Cache Static Assets**
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Backend Optimization

1. **Enable Compression**
```javascript
// Add to server.js
const compression = require('compression');
app.use(compression());
```

2. **Database Indexing**
   - Ensure proper indexes are created
   - Monitor slow queries

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check FRONTEND_URL in backend environment
   - Verify API URL in frontend environment

2. **Database Connection Issues**
   - Verify MongoDB connection string
   - Check network access (whitelist IP)
   - Ensure database user has proper permissions

3. **Build Failures**
   - Check Node.js version compatibility
   - Clear node_modules and reinstall
   - Verify all environment variables

4. **502 Bad Gateway**
   - Check if backend is running
   - Verify Nginx proxy configuration
   - Check PM2 process status

### Logs and Debugging

```bash
# Backend logs
pm2 logs crm-backend

# Nginx logs
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx
```

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**
   - Use AWS ALB, Cloudflare, or Nginx
   - Distribute traffic across multiple instances

2. **Database Clustering**
   - MongoDB replica sets
   - Read replicas for better performance

3. **CDN Integration**
   - Cloudflare, AWS CloudFront
   - Cache static assets globally

### Vertical Scaling

1. **Increase Server Resources**
   - More CPU and RAM
   - SSD storage for better I/O

2. **Database Optimization**
   - Proper indexing
   - Query optimization
   - Connection pooling

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend && npm install
          cd ../frontend && npm install
          
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test
          
      - name: Build frontend
        run: cd frontend && npm run build
        
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.4
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/crm-system
            git pull origin main
            cd backend && npm install
            cd ../frontend && npm install && npm run build
            pm2 restart crm-backend
```

This deployment guide covers the most common deployment scenarios. Choose the option that best fits your needs and budget.













