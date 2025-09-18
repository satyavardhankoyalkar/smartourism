#!/bin/bash

# Smart Tourist API Startup Script
echo "🚀 Starting Smart Tourist API Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm $(npm -v) detected"

# Install dependencies
print_status "Installing dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL is not installed. Please install PostgreSQL with PostGIS extension."
    print_status "On Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib postgis"
    print_status "On macOS: brew install postgresql postgis"
    print_status "On Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

print_success "PostgreSQL detected"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f env.example ]; then
        cp env.example .env
        print_success ".env file created from template"
        print_warning "Please edit .env file with your database credentials"
    else
        print_error "env.example file not found. Please create .env file manually."
        exit 1
    fi
else
    print_success ".env file found"
fi

# Create uploads directory
if [ ! -d uploads ]; then
    mkdir uploads
    print_success "Uploads directory created"
fi

# Test database connection
print_status "Testing database connection..."
if node test-db.js; then
    print_success "Database connection successful"
else
    print_error "Database connection failed. Please check your .env configuration."
    print_status "Make sure PostgreSQL is running and database exists."
    print_status "Run: psql -U postgres -c 'CREATE DATABASE smart_tourism;'"
    print_status "Then run: psql -U postgres -d smart_tourism -f setup-db.sql"
    exit 1
fi

# Start the server
print_status "Starting Smart Tourist API server..."
print_status "Server will be available at: http://localhost:${PORT:-5000}"
print_status "Health check: http://localhost:${PORT:-5000}/api/health"
print_status "Press Ctrl+C to stop the server"

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Start the server
if [ "$1" = "dev" ]; then
    print_status "Starting in development mode with auto-reload..."
    npm run dev
else
    print_status "Starting in production mode..."
    npm start
fi
