# Database Setup Script for Windows
# This script sets up PostgreSQL database for Smart Tourist API

Write-Host "🗄️ Smart Tourist API Database Setup" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if PostgreSQL is installed
try {
    $pgVersion = psql --version
    Write-Host "✅ PostgreSQL detected: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install PostgreSQL with PostGIS extension:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "2. Install PostGIS extension during installation" -ForegroundColor Yellow
    Write-Host "3. Add PostgreSQL bin directory to your PATH" -ForegroundColor Yellow
    exit 1
}

# Get database credentials
Write-Host "`n📝 Database Configuration:" -ForegroundColor Blue
$dbHost = Read-Host "Database Host (default: localhost)"
if ([string]::IsNullOrEmpty($dbHost)) { $dbHost = "localhost" }

$dbPort = Read-Host "Database Port (default: 5432)"
if ([string]::IsNullOrEmpty($dbPort)) { $dbPort = "5432" }

$dbName = Read-Host "Database Name (default: smart_tourism)"
if ([string]::IsNullOrEmpty($dbName)) { $dbName = "smart_tourism" }

$dbUser = Read-Host "Database User (default: postgres)"
if ([string]::IsNullOrEmpty($dbUser)) { $dbUser = "postgres" }

$dbPass = Read-Host "Database Password" -AsSecureString
$dbPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass))

Write-Host "`n🔧 Setting up database..." -ForegroundColor Blue

# Set environment variables for psql
$env:PGPASSWORD = $dbPassPlain

try {
    # Create database
    Write-Host "Creating database '$dbName'..." -ForegroundColor Yellow
    psql -h $dbHost -p $dbPort -U $dbUser -c "CREATE DATABASE $dbName;" 2>$null
    Write-Host "✅ Database created or already exists" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Database might already exist" -ForegroundColor Yellow
}

try {
    # Connect to the database and run setup script
    Write-Host "Running database setup script..." -ForegroundColor Yellow
    psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f "scripts/setup-db-updated.sql"
    Write-Host "✅ Database schema setup completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to run setup script" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create .env file
Write-Host "`n📄 Creating .env file..." -ForegroundColor Blue
$envContent = @"
# Database Configuration
DB_HOST=$dbHost
DB_PORT=$dbPort
DB_NAME=$dbName
DB_USER=$dbUser
DB_PASS=$dbPassPlain

# Server Configuration
NODE_ENV=development
PORT=5000
JWT_SECRET=development_secret_key_change_in_production

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Other Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ .env file created" -ForegroundColor Green

Write-Host "`n🎉 Database setup completed successfully!" -ForegroundColor Green
Write-Host "You can now start the API server with: npm start" -ForegroundColor Cyan
