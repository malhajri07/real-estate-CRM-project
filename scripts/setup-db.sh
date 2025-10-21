#!/bin/bash

# Setup PostgreSQL database for RBAC system

echo "🚀 Setting up PostgreSQL database for RBAC system..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "On macOS: brew install postgresql"
    echo "On Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Check if Docker is available for PostgreSQL
if command -v docker &> /dev/null; then
    echo "🐳 Using Docker for PostgreSQL..."
    
    # Start PostgreSQL container
    docker run --name postgres-rbac \
        -e POSTGRES_DB=real_estate_crm \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=password \
        -p 5432:5432 \
        -d postgres:15

    echo "✅ PostgreSQL container started"
    echo "📊 Database: real_estate_crm"
    echo "👤 User: postgres"
    echo "🔑 Password: password"
    echo "🌐 Port: 5432"
    
    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 10
    
    # Set DATABASE_URL
    export DATABASE_URL="postgresql://postgres:password@localhost:5432/real_estate_crm?schema=real_estate_crm"

    # Ensure the logical schema exists before migrations run
    PSQL_URL="${DATABASE_URL%%\?schema=*}"
    psql "$PSQL_URL" -c "CREATE SCHEMA IF NOT EXISTS real_estate_crm;" >/dev/null

else
    echo "⚠️  Docker not found. Please ensure PostgreSQL is running locally."
    echo "Set DATABASE_URL environment variable to your PostgreSQL connection string."
    echo "Example: postgresql://username:password@localhost:5432/real_estate_crm?schema=real_estate_crm"
fi

if [ -z "${PSQL_URL:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
    PSQL_URL="${DATABASE_URL%%\?schema=*}"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate --schema data/schema/prisma/schema.prisma

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate dev --name init --schema data/schema/prisma/schema.prisma

# Apply RLS policies
echo "🔒 Applying Row Level Security policies..."
for policy_file in data/schema/db/policies/*.sql; do
    if [ -f "$policy_file" ]; then
        echo "Applying $(basename "$policy_file")..."
        if [ -n "${PSQL_URL:-}" ]; then
            psql "$PSQL_URL" -f "$policy_file"
        else
            echo "Skipping policy application because PSQL_URL is not set."
        fi
    fi
done

# Seed the database
echo "🌱 Seeding database with sample data..."
npx tsx apps/api/seed-rbac.ts

echo "✅ Database setup completed!"
echo ""
echo "🔑 Test Accounts:"
echo "Website Admin: admin@aqaraty.com / admin123"
echo "Corporate Owner: owner1@riyadh-realestate.com / owner123"
echo "Corporate Agent: agent1@riyadh-realestate.com / agent123"
echo "Individual Agent: indiv1@example.com / agent123"
echo "Seller: seller1@example.com / seller123"
echo "Buyer: buyer1@example.com / buyer123"
echo ""
echo "🚀 Start the server with: npm run dev"
