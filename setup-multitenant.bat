@echo off
setlocal EnableDelayedExpansion

REM Multi-Tenant CRM Setup Script for Windows
echo.
echo 🚀 Multi-Tenant CRM Setup Script
echo ==================================

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)

for /f "tokens=1,2 delims=v." %%a in ('node --version') do set NODE_MAJOR=%%b
if %NODE_MAJOR% LSS 16 (
    echo [ERROR] Node.js version 16+ is required. Current version: 
    node --version
    pause
    exit /b 1
)

echo [INFO] Node.js version check passed ✓

REM Install backend dependencies
echo.
echo === Installing Backend Dependencies ===
cd backend
if not exist "package.json" (
    echo [ERROR] Backend package.json not found!
    pause
    exit /b 1
)

echo [INFO] Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [INFO] Backend dependencies installed successfully ✓
cd ..

REM Install frontend dependencies
echo.
echo === Installing Frontend Dependencies ===
cd frontend
if not exist "package.json" (
    echo [ERROR] Frontend package.json not found!
    pause
    exit /b 1
)

echo [INFO] Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [INFO] Frontend dependencies installed successfully ✓
cd ..

REM Setup environment files
echo.
echo === Setting up Environment Files ===

REM Backend .env
if not exist "backend\.env" (
    echo [INFO] Creating backend .env file...
    (
        echo # Database
        echo MONGODB_URI=mongodb://localhost:27017/crm-multitenant
        echo.
        echo # JWT
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
        echo JWT_EXPIRE=7d
        echo.
        echo # Server
        echo PORT=5002
        echo NODE_ENV=development
        echo.
        echo # Domain ^(for subdomain routing^)
        echo DOMAIN=mycrm.com
        echo.
        echo # Frontend URL ^(for CORS^)
        echo FRONTEND_URL=http://localhost:3000
    ) > backend\.env
    echo [INFO] Backend .env file created ✓
    echo [WARNING] Please update JWT_SECRET and other settings in backend\.env
) else (
    echo [INFO] Backend .env file already exists ✓
)

REM Frontend .env
if not exist "frontend\.env" (
    echo [INFO] Creating frontend .env file...
    (
        echo # API URL
        echo REACT_APP_API_URL=http://localhost:5002/api
        echo.
        echo # Domain ^(for tenant URLs^)
        echo REACT_APP_DOMAIN=mycrm.com
        echo.
        echo # Environment
        echo NODE_ENV=development
    ) > frontend\.env
    echo [INFO] Frontend .env file created ✓
) else (
    echo [INFO] Frontend .env file already exists ✓
)

REM Run database migration
echo.
echo === Running Database Migration ===
cd backend

echo [INFO] Running multi-tenant migration...
node scripts/migrateToMultiTenant.js
if errorlevel 1 (
    echo [ERROR] Database migration failed
    echo [ERROR] Please ensure MongoDB is running and accessible
    pause
    exit /b 1
)

echo [INFO] Database migration completed successfully ✓
echo [INFO] Default super admin created: admin@system.local / admin123
echo [WARNING] IMPORTANT: Change the super admin password immediately!
cd ..

REM Setup local DNS info
echo.
echo === Local DNS Setup ^(Optional^) ===
echo [INFO] For local development, you can add these entries to your hosts file:
echo.
echo 127.0.0.1 admin.localhost
echo 127.0.0.1 tenant1.localhost
echo 127.0.0.1 tenant2.localhost
echo.
echo [INFO] Windows hosts file location: C:\Windows\System32\drivers\etc\hosts
echo [INFO] You may need to run as Administrator to edit the hosts file
echo.

REM Create startup scripts
echo === Creating Startup Scripts ===

REM Development startup script
echo [INFO] Creating start-dev.bat script...
(
    echo @echo off
    echo echo 🚀 Starting Multi-Tenant CRM in Development Mode
    echo echo.
    echo echo Starting backend server...
    echo start "Backend" cmd /k "cd backend && npm run dev"
    echo.
    echo timeout /t 3 /nobreak ^>nul
    echo.
    echo echo Starting frontend server...
    echo start "Frontend" cmd /k "cd frontend && npm start"
    echo.
    echo echo.
    echo echo ✅ Services started successfully!
    echo echo.
    echo echo 🌐 Frontend: http://localhost:3000
    echo echo 🔧 Backend API: http://localhost:5002
    echo echo 👑 Super Admin: http://admin.localhost:3000 ^(after hosts file setup^)
    echo echo.
    echo echo 📝 Default Super Admin Credentials:
    echo echo    Email: admin@system.local
    echo echo    Password: admin123
    echo echo    ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!
    echo echo.
    echo pause
) > start-dev.bat
echo [INFO] Created start-dev.bat script ✓

REM Production startup script
echo [INFO] Creating start-prod.bat script...
(
    echo @echo off
    echo echo 🚀 Starting Multi-Tenant CRM in Production Mode
    echo echo.
    echo echo Building frontend...
    echo cd frontend
    echo call npm run build
    echo if errorlevel 1 ^(
    echo     echo [ERROR] Frontend build failed
    echo     pause
    echo     exit /b 1
    echo ^)
    echo echo.
    echo echo Starting backend server...
    echo cd ..\backend
    echo call npm start
) > start-prod.bat
echo [INFO] Created start-prod.bat script ✓

REM Setup complete
echo.
echo === Setup Complete! ===
echo [INFO] ✅ Multi-tenant CRM setup completed successfully!
echo.
echo [INFO] Next steps:
echo [INFO] 1. Start MongoDB if not already running
echo [INFO] 2. Start the development servers: start-dev.bat
echo [INFO] 3. Access super admin at: http://admin.localhost:3000 ^(or http://localhost:3000^)
echo [INFO] 4. Login with: admin@system.local / admin123
echo [INFO] 5. IMMEDIATELY change the super admin password!
echo.
echo [INFO] 📖 Read MULTI_TENANT_CRM_GUIDE.md for detailed documentation
echo.

pause




