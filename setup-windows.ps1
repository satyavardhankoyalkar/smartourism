# Smart Tourist API Windows Setup Script
Write-Host "🚀 Smart Tourist API Windows Setup" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm detected: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️ .env file not found. Creating from template..." -ForegroundColor Yellow
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Host "✅ .env file created from template" -ForegroundColor Green
        Write-Host "⚠️ Please edit .env file with your database credentials" -ForegroundColor Yellow
    } else {
        Write-Host "❌ env.example file not found. Please create .env file manually." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ .env file found" -ForegroundColor Green
}

# Create uploads directory
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Name "uploads"
    Write-Host "✅ Uploads directory created" -ForegroundColor Green
}

# Check if PostgreSQL is installed
try {
    $pgVersion = psql --version
    Write-Host "✅ PostgreSQL detected: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️ PostgreSQL is not installed or not in PATH." -ForegroundColor Yellow
    Write-Host "Please install PostgreSQL with PostGIS extension:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "2. Install PostGIS extension during installation" -ForegroundColor Yellow
    Write-Host "3. Add PostgreSQL bin directory to your PATH" -ForegroundColor Yellow
}

# Test database connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Blue
node test-db.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database connection failed. Please check your .env configuration." -ForegroundColor Red
    Write-Host "Make sure PostgreSQL is running and database exists." -ForegroundColor Yellow
    Write-Host "Run these commands in psql:" -ForegroundColor Yellow
    Write-Host "  CREATE DATABASE smart_tourism;" -ForegroundColor Cyan
    Write-Host "  \c smart_tourism" -ForegroundColor Cyan
    Write-Host "  \i setup-db.sql" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Database connection successful" -ForegroundColor Green

# Start the server
Write-Host "🚀 Starting Smart Tourist API server..." -ForegroundColor Blue
Write-Host "Server will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Health check: http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

if ($args[0] -eq "dev") {
    Write-Host "Starting in development mode with auto-reload..." -ForegroundColor Blue
    npm run dev
} else {
    Write-Host "Starting in production mode..." -ForegroundColor Blue
    npm start
}
