# PostgreSQL Installation Script for Windows
# This script helps install PostgreSQL with PostGIS extension

Write-Host "🐘 PostgreSQL Installation Helper" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

Write-Host "`n📥 To install PostgreSQL with PostGIS on Windows:" -ForegroundColor Blue
Write-Host "1. Download PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
Write-Host "2. Run the installer and follow these steps:" -ForegroundColor Yellow
Write-Host "   - Choose 'PostgreSQL Server' and 'PostGIS Bundle'" -ForegroundColor Cyan
Write-Host "   - Set a secure password for the postgres user" -ForegroundColor Cyan
Write-Host "   - Use default port 5432" -ForegroundColor Cyan
Write-Host "   - Complete the installation" -ForegroundColor Cyan

Write-Host "`n🔧 After installation:" -ForegroundColor Blue
Write-Host "1. Add PostgreSQL bin directory to your PATH:" -ForegroundColor Yellow
Write-Host "   - Usually: C:\Program Files\PostgreSQL\16\bin" -ForegroundColor Cyan
Write-Host "   - Add to System Environment Variables > PATH" -ForegroundColor Cyan

Write-Host "`n2. Verify installation:" -ForegroundColor Yellow
Write-Host "   - Open new PowerShell window" -ForegroundColor Cyan
Write-Host "   - Run: psql --version" -ForegroundColor Cyan

Write-Host "`n3. Start PostgreSQL service:" -ForegroundColor Yellow
Write-Host "   - Open Services (services.msc)" -ForegroundColor Cyan
Write-Host "   - Find 'postgresql-x64-16' service" -ForegroundColor Cyan
Write-Host "   - Start the service if not running" -ForegroundColor Cyan

Write-Host "`n🚀 Alternative: Use Docker" -ForegroundColor Blue
Write-Host "If you prefer Docker:" -ForegroundColor Yellow
Write-Host "docker run --name smart-tourist-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgis/postgis:15-3.3" -ForegroundColor Cyan

Write-Host "`n📚 Documentation:" -ForegroundColor Blue
Write-Host "- PostgreSQL: https://www.postgresql.org/docs/" -ForegroundColor Yellow
Write-Host "- PostGIS: https://postgis.net/documentation/" -ForegroundColor Yellow

$continue = Read-Host "`nPress Enter to continue after installing PostgreSQL..."
Write-Host "✅ Ready to set up the database!" -ForegroundColor Green
