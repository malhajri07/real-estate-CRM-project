#!/bin/bash
# Development environment setup script
# Run from project root: ./scripts/dev-setup.sh

set -e

echo "🚀 Real Estate CRM - Development Setup"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Install from https://nodejs.org"
    exit 1
fi
echo "✓ Node.js $(node -v)"

# Check pnpm
if command -v pnpm &> /dev/null; then
    PKG_MGR="pnpm"
elif command -v npm &> /dev/null; then
    PKG_MGR="npm"
else
    echo "❌ pnpm or npm required"
    exit 1
fi
echo "✓ Using $PKG_MGR"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
$PKG_MGR install

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
$PKG_MGR run db:generate

# Check for .env
if [ ! -f .env ]; then
    if [ -f .env.dev.example ]; then
        echo ""
        echo "📋 Creating .env from .env.dev.example..."
        cp .env.dev.example .env
        echo "✓ Edit .env with your DATABASE_URL if needed"
    else
        echo "⚠️  No .env found. Copy env.example to .env and configure DATABASE_URL"
    fi
else
    echo "✓ .env exists"
fi

# Database setup (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ] || grep -q "DATABASE_URL" .env 2>/dev/null; then
    echo ""
    echo "🗄️  Running database migrations..."
    if $PKG_MGR run db:deploy 2>/dev/null; then
        echo "✓ Migrations applied"
        echo ""
        echo "🌱 Seeding database..."
        $PKG_MGR run db:seed-saudi-geography 2>/dev/null || true
        $PKG_MGR run db:agent1 2>/dev/null || true
        echo "✓ Seed complete"
    else
        echo "⚠️  Migrations failed. Ensure PostgreSQL is running and DATABASE_URL is correct."
        echo "   Start Docker: docker compose -f docker-compose.dev.yml up -d postgres-dev redis-dev"
    fi
else
    echo ""
    echo "⚠️  DATABASE_URL not set. To complete setup:"
    echo "   1. Start PostgreSQL (Docker: docker compose -f docker-compose.dev.yml up -d postgres-dev)"
    echo "   2. Copy .env.dev.example to .env and set DATABASE_URL"
    echo "   3. Run: $PKG_MGR run db:deploy"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Start the app:"
echo "  $PKG_MGR run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
