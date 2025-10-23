#!/bin/bash

# Docker Setup Script for Real Estate CRM
echo "🐳 Setting up Docker for Real Estate CRM..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo "📥 Download Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p data/backups
mkdir -p logs

# Set up environment variables
echo "⚙️ Setting up environment variables..."
cat > .env.docker << EOF
# Docker Environment Configuration
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/real_estate_crm?schema=public
POSTGRES_DB=real_estate_crm
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
REDIS_URL=redis://redis:6379
NODE_ENV=production
PORT=3000
ALLOW_PRODUCTION=true
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
SESSION_SECRET=your-super-secure-session-secret-key-change-this-in-production
API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads
EOF

echo "✅ Docker setup complete!"
echo ""
echo "🚀 Available commands:"
echo "  Development: docker-compose -f docker-compose.dev.yml up"
echo "  Production:  docker-compose up"
echo "  Build only:  docker-compose build"
echo "  Stop:        docker-compose down"
echo ""
echo "📖 For more information, see the Docker documentation in the project."
