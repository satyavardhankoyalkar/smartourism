@echo off
echo 🚀 Starting Smart Tourist API with Mock Database...
echo ✅ No PostgreSQL installation required!
echo.

echo 📦 Starting server...
npm run start:mock

echo.
echo 🎉 API is running at http://localhost:5000
echo 📚 Documentation: http://localhost:5000/api/docs
echo 🏥 Health Check: http://localhost:5000/api/health
echo.
echo Press any key to stop the server...
pause
