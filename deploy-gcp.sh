#!/bin/bash

# Google Cloud Platform Deployment Script
# This script deploys the Real Estate CRM to Google Cloud Run

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
SERVICE_NAME="real-estate-crm"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo -e "${BLUE}🚀 Google Cloud Platform Deployment Script${NC}"
echo "================================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first:${NC}"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}🔐 Please authenticate with Google Cloud:${NC}"
    gcloud auth login
fi

# Get project ID if not set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}📋 Please enter your Google Cloud Project ID:${NC}"
    read -p "Project ID: " PROJECT_ID
fi

# Set the project
echo -e "${BLUE}🔧 Setting project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${BLUE}🔌 Enabling required Google Cloud APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and push Docker image
echo -e "${BLUE}🐳 Building and pushing Docker image...${NC}"
docker build -f Dockerfile.gcp -t $IMAGE_NAME:latest .
docker push $IMAGE_NAME:latest

# Deploy to Cloud Run
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
    --set-env-vars PORT=8080 \
    --set-env-vars NO_PROXY="127.0.0.1,localhost,169.254.0.0/16,*.google.internal,*.googleapis.com,*.appspot.com,*.run.app,*.cloudfunctions.net,*.gateway.dev,*.googleusercontent.com,*.pkg.dev,*.gcr.io" \
    --set-env-vars no_proxy="127.0.0.1,localhost,169.254.0.0/16,*.google.internal,*.googleapis.com,*.appspot.com,*.run.app,*.cloudfunctions.net,*.gateway.dev,*.googleusercontent.com,*.pkg.dev,*.gcr.io"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Set up Cloud SQL database"
echo "2. Configure environment variables"
echo "3. Set up Cloud Storage for file uploads"
echo "4. Configure custom domain (optional)"
echo ""
echo -e "${BLUE}🔧 Useful commands:${NC}"
echo "  View logs: gcloud run logs tail $SERVICE_NAME --region $REGION"
echo "  Update service: ./deploy-gcp.sh"
echo "  Delete service: gcloud run services delete $SERVICE_NAME --region $REGION"
