#!/bin/bash

# Complete Google Cloud Platform Deployment Script
# This script deploys the entire Real Estate CRM stack to GCP

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
ENVIRONMENT="prod"
SERVICE_NAME="real-estate-crm"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo -e "${BLUE}☁️ Complete Google Cloud Platform Deployment${NC}"
echo "=============================================="

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first:${NC}"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install it first:${NC}"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${YELLOW}⚠️ Terraform is not installed. Installing via Homebrew...${NC}"
    brew install terraform
fi

# Get project ID if not set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}📋 Please enter your Google Cloud Project ID:${NC}"
    read -p "Project ID: " PROJECT_ID
fi

# Set the project
echo -e "${BLUE}🔧 Setting project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Authenticate if needed
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}🔐 Please authenticate with Google Cloud:${NC}"
    gcloud auth login
fi

# Enable required APIs
echo -e "${BLUE}🔌 Enabling required Google Cloud APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable vpcaccess.googleapis.com

# Create secrets
echo -e "${BLUE}🔐 Setting up secrets...${NC}"
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)

# Create secrets in Secret Manager
echo "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=- 2>/dev/null || true
echo "$SESSION_SECRET" | gcloud secrets create session-secret --data-file=- 2>/dev/null || true

# Deploy infrastructure with Terraform
echo -e "${BLUE}🏗️ Deploying infrastructure with Terraform...${NC}"
cd terraform

# Create terraform.tfvars
cat > terraform.tfvars << EOF
project_id     = "$PROJECT_ID"
region         = "$REGION"
environment    = "$ENVIRONMENT"
db_password    = "$DB_PASSWORD"
jwt_secret     = "$JWT_SECRET"
session_secret = "$SESSION_SECRET"
EOF

# Initialize and apply Terraform
terraform init
terraform plan
terraform apply -auto-approve

# Get outputs
CLOUD_RUN_URL=$(terraform output -raw cloud_run_url)
DB_CONNECTION_NAME=$(terraform output -raw database_connection_name)
STORAGE_BUCKET=$(terraform output -raw storage_bucket_name)

cd ..

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
    --port 3000 \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 10 \
    --min-instances 1 \
    --add-cloudsql-instances $DB_CONNECTION_NAME \
    --set-env-vars NODE_ENV=production \
    --set-env-vars PORT=3000 \
    --set-env-vars DATABASE_URL="postgresql://postgres:$DB_PASSWORD@/real_estate_crm?host=/cloudsql/$DB_CONNECTION_NAME" \
    --set-env-vars GCS_BUCKET_NAME=$STORAGE_BUCKET \
    --set-env-vars GCS_PROJECT_ID=$PROJECT_ID

# Get the final service URL
FINAL_SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}🌐 Service URL: $FINAL_SERVICE_URL${NC}"
echo -e "${GREEN}🗄️ Database: $DB_CONNECTION_NAME${NC}"
echo -e "${GREEN}📦 Storage: $STORAGE_BUCKET${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Run database migrations:"
echo "   gcloud run jobs create migrate-db --image $IMAGE_NAME:latest --region $REGION --command npm --args run,db:migrate"
echo ""
echo "2. Seed the database:"
echo "   gcloud run jobs create seed-db --image $IMAGE_NAME:latest --region $REGION --command npm --args run,db:seed"
echo ""
echo "3. Set up custom domain (optional):"
echo "   gcloud run domain-mappings create --service $SERVICE_NAME --domain your-domain.com --region $REGION"
echo ""
echo -e "${BLUE}🔧 Useful commands:${NC}"
echo "  View logs: gcloud run logs tail $SERVICE_NAME --region $REGION"
echo "  Update service: ./deploy-full-gcp.sh"
echo "  Destroy infrastructure: cd terraform && terraform destroy"
echo "  Connect to database: gcloud sql connect $DB_CONNECTION_NAME --user=postgres --database=real_estate_crm"
