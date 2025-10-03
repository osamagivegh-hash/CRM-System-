# CRM System

A complete Customer Relationship Management (CRM) system built with React.js frontend and Node.js backend, designed for companies to manage their customers, leads, and sales pipeline efficiently.

## 🚀 Features

### Core Functionality
- **Multi-tenant Architecture**: Each company has its own isolated data
- **Role-based Access Control**: Super Admin, Company Admin, Manager, Sales Rep, and User roles
- **Dynamic Pricing**: Automatic pricing calculation based on number of users per company
- **Comprehensive Dashboard**: Real-time statistics and analytics
- **Lead Management**: Complete sales pipeline tracking
- **Client Management**: Customer relationship management
- **User Management**: Team member administration

### Technical Features
- **JWT Authentication**: Secure token-based authentication
- **RESTful API**: Well-structured API endpoints
- **Data Validation**: Input validation on both frontend and backend
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live data updates using React Query
- **Error Handling**: Comprehensive error handling and user feedback

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **Rate Limiting** and security middleware

### Frontend
- **React.js** with hooks and context
- **React Router** for navigation
- **React Query** for data fetching and caching
- **React Hook Form** for form management
- **Tailwind CSS** for styling
- **Headless UI** for accessible components
- **React Hot Toast** for notifications

### Database Schema
- **Users**: User accounts with roles and permissions
- **Companies**: Company information and pricing
- **Clients**: Customer data and relationships
- **Leads**: Sales pipeline management
- **Roles**: Permission-based access control

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB Atlas** account (or local MongoDB instance)
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CRM
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

Create environment files:

#### Backend Environment (.env in backend folder)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm_system?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
```

#### Frontend Environment (.env in frontend folder)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Database Setup

#### Option A: MongoDB Atlas (Recommended)
1. Create a MongoDB Atlas account at https://www.mongodb.com/atlas
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Replace the MONGODB_URI in your .env file

#### Option B: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Update MONGODB_URI to: `mongodb://localhost:27017/crm_system`

### 5. Seed the Database

```bash
cd backend
npm run seed
```

This will create:
- Default roles and permissions
- Super admin account
- 2 demo companies with users
- Sample clients and leads

### 6. Start the Application

#### Development Mode (Both servers)
```bash
# From the root directory
npm run dev
```

This starts both backend (port 5000) and frontend (port 3000) servers.

#### Or start individually:

```bash
# Backend only
cd backend
npm run dev

# Frontend only (in another terminal)
cd frontend
npm start
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## 👤 Demo Accounts

After seeding the database, you can login with these accounts:

### Super Admin
- **Email**: admin@crm.com
- **Password**: SuperAdmin123!

### TechStart Solutions
- **Admin**: john.admin@techstartsolutions.com / Admin123!
- **Manager**: sarah.manager@techstartsolutions.com / Manager123!
- **Sales Rep**: mike.sales@techstartsolutions.com / Sales123!

### Global Marketing Inc
- **Admin**: john.admin@globalmarketinginc.com / Admin123!
- **Manager**: sarah.manager@globalmarketinginc.com / Manager123!
- **Sales Rep**: mike.sales@globalmarketinginc.com / Sales123!

## 🏗 Project Structure

```
CRM/
├── backend/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── scripts/         # Database seeding scripts
│   └── server.js        # Express server
├── frontend/
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── App.js       # Main app component
│   └── package.json
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new company and admin user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get users (filtered by company)
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user
- `PUT /api/users/:id/activate` - Activate user

### Companies
- `GET /api/companies` - Get all companies (Super Admin only)
- `GET /api/companies/:id` - Get company details
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company
- `GET /api/companies/:id/stats` - Get company statistics
- `PUT /api/companies/:id/plan` - Update company plan

### Clients
- `GET /api/clients` - Get clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `POST /api/clients/:id/notes` - Add note to client
- `GET /api/clients/stats` - Get client statistics

### Leads
- `GET /api/leads` - Get leads
- `POST /api/leads` - Create lead
- `GET /api/leads/:id` - Get lead details
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/:id/notes` - Add note to lead
- `POST /api/leads/:id/activities` - Add activity to lead
- `POST /api/leads/:id/convert` - Convert lead to client
- `GET /api/leads/stats` - Get lead statistics

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/funnel` - Get sales funnel data
- `GET /api/dashboard/performance` - Get performance metrics
- `GET /api/dashboard/tasks` - Get upcoming tasks

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for frontend domain
- **Helmet**: Security headers middleware
- **Account Lockout**: Temporary lockout after failed attempts

## 💰 Pricing Model

The system implements dynamic pricing based on user count:

### Plans
- **Starter**: $10 per user per month
- **Professional**: $25 per user per month  
- **Enterprise**: $50 per user per month

### Volume Discounts
- **20+ users**: 10% discount
- **50+ users**: 20% discount

Pricing is automatically calculated when users are added or removed.

## 🚀 Deployment

### Production Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://your-frontend-domain.com
```

#### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
```

### Deployment Options

#### Option 1: Heroku
1. Create Heroku apps for backend and frontend
2. Set environment variables
3. Deploy using Git

#### Option 2: Digital Ocean/AWS/Azure
1. Set up virtual machines
2. Install Node.js and PM2
3. Configure reverse proxy (Nginx)
4. Set up SSL certificates

#### Option 3: Vercel (Frontend) + Railway/Render (Backend)
1. Deploy frontend to Vercel
2. Deploy backend to Railway or Render
3. Update environment variables

### Build Commands

```bash
# Build frontend for production
cd frontend
npm run build

# Start backend in production
cd backend
npm start
```

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the demo accounts and test the features

## 🔮 Future Enhancements

- Email notifications and campaigns
- Advanced reporting and analytics
- Mobile app (React Native)
- Integration with third-party services (Stripe, Mailchimp, etc.)
- Advanced workflow automation
- Document management
- Calendar integration
- Advanced search and filtering
- Export functionality (PDF, CSV)
- API rate limiting per company
- Audit logs and activity tracking













