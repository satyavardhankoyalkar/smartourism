@echo off
echo 🚀 Starting Smart Tourist API Setup...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ npm detected
npm --version

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully

REM Check if .env file exists
if not exist .env (
    echo ⚠️ .env file not found. Creating from template...
    if exist env.example (
        copy env.example .env
        echo ✅ .env file created from template
        echo ⚠️ Please edit .env file with your database credentials
    ) else (
        echo ❌ env.example file not found. Please create .env file manually.
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file found
)

REM Create uploads directory
if not exist uploads (
    mkdir uploads
    echo ✅ Uploads directory created
)

REM Test database connection
echo 🔍 Testing database connection...
node test-db.js
if %errorlevel% neq 0 (
    echo ❌ Database connection failed. Please check your .env configuration.
    echo Make sure PostgreSQL is running and database exists.
    echo Run: psql -U postgres -c "CREATE DATABASE smart_tourism;"
    echo Then run: psql -U postgres -d smart_tourism -f setup-db.sql
    pause
    exit /b 1
)

echo ✅ Database connection successful

REM Start the server
echo 🚀 Starting Smart Tourist API server...
echo Server will be available at: http://localhost:5000
echo Health check: http://localhost:5000/api/health
echo Press Ctrl+C to stop the server

if "%1"=="dev" (
    echo Starting in development mode with auto-reload...
    npm run dev
) else (
    echo Starting in production mode...
    npm start
)
