#!/bin/bash

# Fix Egress Proxy Configuration for Cloud Run
# This script configures HTTP proxy exceptions for Cloud Run egress traffic

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

echo -e "${BLUE}🔧 Fixing Egress Proxy Configuration${NC}"
echo "======================================="

# Set the project
echo -e "${BLUE}🔧 Setting project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Define proxy exceptions
NO_PROXY_HOSTS="127.0.0.1,localhost,169.254.0.0/16,*.google.internal,*.googleapis.com,*.appspot.com,*.run.app,*.cloudfunctions.net,*.gateway.dev,*.googleusercontent.com,*.pkg.dev,*.gcr.io"

echo -e "${BLUE}🚀 Updating Cloud Run service with proxy exceptions...${NC}"

# Update the Cloud Run service with proxy exceptions
gcloud run services update $SERVICE_NAME \
    --region $REGION \
    --set-env-vars NO_PROXY="$NO_PROXY_HOSTS" \
    --set-env-vars no_proxy="$NO_PROXY_HOSTS" \
    --set-env-vars HTTP_PROXY="" \
    --set-env-vars HTTPS_PROXY="" \
    --set-env-vars http_proxy="" \
    --set-env-vars https_proxy=""

echo -e "${GREEN}✅ Cloud Run service updated with proxy exceptions!${NC}"
echo ""
echo -e "${GREEN}📋 Proxy exceptions configured:${NC}"
echo "  - 127.0.0.1 (localhost)"
echo "  - 169.254.0.0/16 (metadata server)"
echo "  - *.google.internal (Google internal services)"
echo "  - *.googleapis.com (Google APIs)"
echo "  - *.appspot.com (App Engine)"
echo "  - *.run.app (Cloud Run)"
echo "  - *.cloudfunctions.net (Cloud Functions)"
echo "  - *.gateway.dev (API Gateway)"
echo "  - *.googleusercontent.com (Google content)"
echo "  - *.pkg.dev (Artifact Registry)"
echo "  - *.gcr.io (Container Registry)"
echo ""
echo -e "${YELLOW}📋 What this fixes:${NC}"
echo "  - Prevents latency issues with Google APIs"
echo "  - Avoids connection timeouts to Cloud services"
echo "  - Eliminates authentication errors"
echo "  - Improves egress traffic performance"
echo ""
echo -e "${BLUE}🔧 Next steps:${NC}"
echo "1. The service should now handle egress traffic properly"
echo "2. Check the logs: gcloud run logs tail $SERVICE_NAME --region $REGION"
echo "3. Test external API calls from your application"
echo ""
echo -e "${BLUE}📖 Useful commands:${NC}"
echo "  View service: gcloud run services describe $SERVICE_NAME --region $REGION"
echo "  View logs: gcloud run logs tail $SERVICE_NAME --region $REGION"
echo "  Test connectivity: curl -I https://www.google.com"
