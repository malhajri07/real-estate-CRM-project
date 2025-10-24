#!/bin/bash

# Quick fix script for Cloud Run port configuration
# This script updates the existing Cloud Run service to use port 8080

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="aqarkom-v4"
REGION="europe-west1"
PROJECT_ID="stable-apogee-476022-u1"

echo -e "${BLUE}🔧 Fixing Cloud Run Port Configuration${NC}"
echo "=============================================="

# Set the project
echo -e "${BLUE}🔧 Setting project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Update the Cloud Run service to use port 8080
echo -e "${BLUE}🚀 Updating Cloud Run service port configuration...${NC}"
gcloud run services update $SERVICE_NAME \
    --region $REGION \
    --port 8080 \
    --set-env-vars PORT=8080

echo -e "${GREEN}✅ Cloud Run service updated successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 What was changed:${NC}"
echo "  - Port changed from 3000 to 8080"
echo "  - Environment variable PORT set to 8080"
echo "  - Service will now listen on the correct port"
echo ""
echo -e "${BLUE}🔧 Next steps:${NC}"
echo "1. The service should now start successfully"
echo "2. Check the logs: gcloud run logs tail $SERVICE_NAME --region $REGION"
echo "3. Test the service URL once it's running"
echo ""
echo -e "${BLUE}📖 Useful commands:${NC}"
echo "  View service: gcloud run services describe $SERVICE_NAME --region $REGION"
echo "  View logs: gcloud run logs tail $SERVICE_NAME --region $REGION"
echo "  Get URL: gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'"
