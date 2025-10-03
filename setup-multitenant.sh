#!/bin/bash

# Multi-Tenant CRM Setup Script
# This script helps set up the multi-tenant CRM system

echo "🚀 Multi-Tenant CRM Setup Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_status "Node.js version: $(node -v) ✓"
}

# Check if MongoDB is running
check_mongodb() {
    if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
        print_warning "MongoDB client not found. Please ensure MongoDB is installed and running."
    else
        print_status "MongoDB client found ✓"
    fi
}

# Install backend dependencies
install_backend_deps() {
    print_header "Installing Backend Dependencies"
    cd backend
    
    if [ ! -f "package.json" ]; then
        print_error "Backend package.json not found!"
        exit 1
    fi
    
    print_status "Installing backend dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_status "Backend dependencies installed successfully ✓"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    
    cd ..
}

# Install frontend dependencies
install_frontend_deps() {
    print_header "Installing Frontend Dependencies"
    cd frontend
    
    if [ ! -f "package.json" ]; then
        print_error "Frontend package.json not found!"
        exit 1
    fi
    
    print_status "Installing frontend dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_status "Frontend dependencies installed successfully ✓"
    else
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    
    cd ..
}

# Setup environment files
setup_env_files() {
    print_header "Setting up Environment Files"
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        print_status "Creating backend .env file..."
        cat > backend/.env << EOL
# Database
MONGODB_URI=mongodb://localhost:27017/crm-multitenant

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Server
PORT=5002
NODE_ENV=development

# Domain (for subdomain routing)
DOMAIN=mycrm.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
EOL
        print_status "Backend .env file created ✓"
        print_warning "Please update JWT_SECRET and other settings in backend/.env"
    else
        print_status "Backend .env file already exists ✓"
    fi
    
    # Frontend .env
    if [ ! -f "frontend/.env" ]; then
        print_status "Creating frontend .env file..."
        cat > frontend/.env << EOL
# API URL
REACT_APP_API_URL=http://localhost:5002/api

# Domain (for tenant URLs)
REACT_APP_DOMAIN=mycrm.com

# Environment
NODE_ENV=development
EOL
        print_status "Frontend .env file created ✓"
    else
        print_status "Frontend .env file already exists ✓"
    fi
}

# Run database migration
run_migration() {
    print_header "Running Database Migration"
    
    cd backend
    
    print_status "Running multi-tenant migration..."
    node scripts/migrateToMultiTenant.js
    
    if [ $? -eq 0 ]; then
        print_status "Database migration completed successfully ✓"
        print_status "Default super admin created: admin@system.local / admin123"
        print_warning "IMPORTANT: Change the super admin password immediately!"
    else
        print_error "Database migration failed"
        print_error "Please ensure MongoDB is running and accessible"
        exit 1
    fi
    
    cd ..
}

# Setup local DNS (optional)
setup_local_dns() {
    print_header "Local DNS Setup (Optional)"
    
    print_status "For local development, you can add these entries to your hosts file:"
    echo ""
    echo "127.0.0.1 admin.localhost"
    echo "127.0.0.1 tenant1.localhost"
    echo "127.0.0.1 tenant2.localhost"
    echo ""
    print_status "Hosts file locations:"
    print_status "  Linux/Mac: /etc/hosts"
    print_status "  Windows: C:\\Windows\\System32\\drivers\\etc\\hosts"
    echo ""
    
    read -p "Would you like to add admin.localhost to your hosts file? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "127.0.0.1 admin.localhost" | sudo tee -a /etc/hosts
            print_status "Added admin.localhost to hosts file ✓"
        else
            print_status "Please manually add '127.0.0.1 admin.localhost' to your hosts file"
        fi
    fi
}

# Create startup scripts
create_startup_scripts() {
    print_header "Creating Startup Scripts"
    
    # Development startup script
    cat > start-dev.sh << 'EOL'
#!/bin/bash

echo "🚀 Starting Multi-Tenant CRM in Development Mode"

# Function to kill background processes on exit
cleanup() {
    echo "Stopping services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
cd frontend && npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Services started successfully!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5002"
echo "👑 Super Admin: http://admin.localhost:3000 (after hosts file setup)"
echo ""
echo "📝 Default Super Admin Credentials:"
echo "   Email: admin@system.local"
echo "   Password: admin123"
echo "   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait
EOL

    chmod +x start-dev.sh
    print_status "Created start-dev.sh script ✓"
    
    # Production startup script
    cat > start-prod.sh << 'EOL'
#!/bin/bash

echo "🚀 Starting Multi-Tenant CRM in Production Mode"

# Build frontend
echo "Building frontend..."
cd frontend && npm run build

# Start backend
echo "Starting backend server..."
cd ../backend && npm start
EOL

    chmod +x start-prod.sh
    print_status "Created start-prod.sh script ✓"
}

# Main setup function
main() {
    print_header "Multi-Tenant CRM Setup"
    
    # Check prerequisites
    check_nodejs
    check_mongodb
    
    # Install dependencies
    install_backend_deps
    install_frontend_deps
    
    # Setup environment
    setup_env_files
    
    # Run migration
    print_status "Checking if MongoDB is accessible..."
    if timeout 5 bash -c "</dev/tcp/localhost/27017" 2>/dev/null; then
        run_migration
    else
        print_warning "MongoDB not accessible on localhost:27017"
        print_warning "Please start MongoDB and run: cd backend && node scripts/migrateToMultiTenant.js"
    fi
    
    # Setup local DNS
    setup_local_dns
    
    # Create startup scripts
    create_startup_scripts
    
    print_header "Setup Complete!"
    print_status "✅ Multi-tenant CRM setup completed successfully!"
    echo ""
    print_status "Next steps:"
    print_status "1. Start MongoDB if not already running"
    print_status "2. Run the migration if skipped: cd backend && node scripts/migrateToMultiTenant.js"
    print_status "3. Start the development servers: ./start-dev.sh"
    print_status "4. Access super admin at: http://admin.localhost:3000 (or http://localhost:3000)"
    print_status "5. Login with: admin@system.local / admin123"
    print_status "6. IMMEDIATELY change the super admin password!"
    echo ""
    print_status "📖 Read MULTI_TENANT_CRM_GUIDE.md for detailed documentation"
    echo ""
}

# Run main function
main "$@"




