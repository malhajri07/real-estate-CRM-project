#!/bin/bash

# Google Cloud SQL Setup Script
# This script creates and configures a Cloud SQL PostgreSQL instance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
REGION="us-central1"
INSTANCE_NAME="real-estate-crm-db"
DATABASE_NAME="real_estate_crm"
DB_USER="postgres"
DB_PASSWORD=""

echo -e "${BLUE}🗄️ Google Cloud SQL Setup Script${NC}"
echo "======================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first:${NC}"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID if not set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}📋 Please enter your Google Cloud Project ID:${NC}"
    read -p "Project ID: " PROJECT_ID
fi

# Get database password
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}🔐 Please enter a password for the database user:${NC}"
    read -s -p "Database Password: " DB_PASSWORD
    echo ""
fi

# Set the project
echo -e "${BLUE}🔧 Setting project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Enable Cloud SQL API
echo -e "${BLUE}🔌 Enabling Cloud SQL API...${NC}"
gcloud services enable sqladmin.googleapis.com

# Create Cloud SQL instance
echo -e "${BLUE}🏗️ Creating Cloud SQL PostgreSQL instance...${NC}"
gcloud sql instances create $INSTANCE_NAME \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=$REGION \
    --storage-type=SSD \
    --storage-size=10GB \
    --storage-auto-increase \
    --backup \
    --enable-ip-alias \
    --network=default

# Set root password
echo -e "${BLUE}🔐 Setting database password...${NC}"
gcloud sql users set-password $DB_USER \
    --instance=$INSTANCE_NAME \
    --password=$DB_PASSWORD

# Create database
echo -e "${BLUE}📊 Creating database...${NC}"
gcloud sql databases create $DATABASE_NAME \
    --instance=$INSTANCE_NAME

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME --format="value(connectionName)")

echo -e "${GREEN}✅ Cloud SQL setup completed successfully!${NC}"
echo ""
echo -e "${GREEN}📋 Database Information:${NC}"
echo "  Instance Name: $INSTANCE_NAME"
echo "  Database: $DATABASE_NAME"
echo "  User: $DB_USER"
echo "  Connection Name: $CONNECTION_NAME"
echo "  Region: $REGION"
echo ""
echo -e "${YELLOW}🔗 Connection String:${NC}"
echo "  postgresql://$DB_USER:$DB_PASSWORD@/$DATABASE_NAME?host=/cloudsql/$CONNECTION_NAME"
echo ""
echo -e "${BLUE}🔧 Next steps:${NC}"
echo "1. Update your Cloud Run service with the connection string"
echo "2. Run database migrations"
echo "3. Seed the database with initial data"
echo ""
echo -e "${BLUE}📖 Useful commands:${NC}"
echo "  Connect to database: gcloud sql connect $INSTANCE_NAME --user=$DB_USER --database=$DATABASE_NAME"
echo "  View instance: gcloud sql instances describe $INSTANCE_NAME"
echo "  Delete instance: gcloud sql instances delete $INSTANCE_NAME"
