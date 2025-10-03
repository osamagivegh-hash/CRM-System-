@echo off
echo 🚀 Starting Multi-Tenant CRM in Development Mode
echo.
echo Starting backend server...
start "CRM Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting frontend server...
start "CRM Frontend" cmd /k "cd frontend && npm start"

echo.
echo ✅ Services started successfully!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:5002
echo 👑 Super Admin: http://admin.localhost:3000 (after hosts file setup)
echo.
echo 📝 Default Super Admin Credentials:
echo    Email: admin@system.local
echo    Password: admin123
echo    ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!
echo.
pause




