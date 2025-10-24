#!/bin/bash

# Fix Vite Dependency Issue in Cloud Run
# This script rebuilds and redeploys the application with the correct dependencies

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
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo -e "${BLUE}🔧 Fixing Vite Dependency Issue${NC}"
echo "====================================="

# Set the project
echo -e "${BLUE}🔧 Setting project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Build the application with correct dependencies
echo -e "${BLUE}🐳 Building application with correct dependencies...${NC}"
docker build -f Dockerfile.gcp -t $IMAGE_NAME:latest .

# Push the image
echo -e "${BLUE}📤 Pushing image to Container Registry...${NC}"
docker push $IMAGE_NAME:latest

# Deploy to Cloud Run with correct port
echo -e "${BLUE}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 10 \
    --min-instances 1 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars PORT=8080

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}📋 What was fixed:${NC}"
echo "  - Created production-specific entry point (index.prod.ts)"
echo "  - Excluded vite imports from production build"
echo "  - Updated build process to use production entry point"
echo "  - Ensured all dependencies are properly installed"
echo ""
echo -e "${BLUE}🔧 Next steps:${NC}"
echo "1. The service should now start without vite dependency errors"
echo "2. Check the logs: gcloud run logs tail $SERVICE_NAME --region $REGION"
echo "3. Test the service URL: curl $SERVICE_URL/health"
echo ""
echo -e "${BLUE}📖 Useful commands:${NC}"
echo "  View logs: gcloud run logs tail $SERVICE_NAME --region $REGION"
echo "  View service: gcloud run services describe $SERVICE_NAME --region $REGION"
echo "  Test health: curl $SERVICE_URL/health"
