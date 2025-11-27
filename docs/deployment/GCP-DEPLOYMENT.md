# ☁️ Google Cloud Platform Deployment Guide

This guide will help you deploy your Real Estate CRM application to Google Cloud Platform using Cloud Run, Cloud SQL, and other GCP services.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloud CDN     │    │  Cloud Load     │    │   Cloud Run     │
│   (Static)      │◄───┤  Balancer       │◄───┤  (App)          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Cloud Storage  │    │   Cloud SQL     │    │   Cloud Build  │
│  (Files)        │    │  (PostgreSQL)   │    │   (CI/CD)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

1. **Google Cloud Account**: Sign up at [Google Cloud Console](https://console.cloud.google.com/)
2. **Google Cloud CLI**: Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install)
3. **Docker**: Ensure Docker is installed and running
4. **Billing**: Enable billing for your GCP project

### Step 1: Initialize GCP Project

```bash
# Authenticate with Google Cloud
gcloud auth login

# Create a new project (optional)
gcloud projects create your-project-id

# Set your project
gcloud config set project your-project-id

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
```

### Step 2: Set Up Database

```bash
# Run the Cloud SQL setup script
./setup-cloud-sql.sh
```

### Step 3: Deploy Application

```bash
# Deploy to Cloud Run
./deploy-gcp.sh
```

## 📋 Detailed Setup Instructions

### 1. Cloud SQL Database Setup

#### Create PostgreSQL Instance
```bash
# Create Cloud SQL instance
gcloud sql instances create real-estate-crm-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup \
    --enable-ip-alias

# Set root password
gcloud sql users set-password postgres \
    --instance=real-estate-crm-db \
    --password=your-secure-password

# Create database
gcloud sql databases create real_estate_crm \
    --instance=real-estate-crm-db
```

#### Connection Configuration
```bash
# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe real-estate-crm-db --format="value(connectionName)")

# Connection string for Cloud Run
DATABASE_URL="postgresql://postgres:password@/real_estate_crm?host=/cloudsql/$CONNECTION_NAME"
```

### 2. Cloud Run Deployment

#### Manual Deployment
```bash
# Build and push image
docker build -f Dockerfile.gcp -t gcr.io/PROJECT_ID/real-estate-crm .
docker push gcr.io/PROJECT_ID/real-estate-crm

# Deploy to Cloud Run
gcloud run deploy real-estate-crm \
    --image gcr.io/PROJECT_ID/real-estate-crm \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 3000 \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 10 \
    --min-instances 1 \
    --add-cloudsql-instances CONNECTION_NAME \
    --set-env-vars NODE_ENV=production,DATABASE_URL="postgresql://postgres:password@/real_estate_crm?host=/cloudsql/CONNECTION_NAME"
```

#### Using Cloud Build (CI/CD)
```bash
# Submit build
gcloud builds submit --config cloudbuild.yaml
```

### 3. Cloud Storage Setup

#### Create Storage Bucket
```bash
# Create bucket for file uploads
gsutil mb gs://your-project-id-real-estate-crm-uploads

# Set bucket permissions
gsutil iam ch allUsers:objectViewer gs://your-project-id-real-estate-crm-uploads
```

#### Configure CORS
```bash
# Create CORS configuration
cat > cors.json << EOF
[
  {
    "origin": ["https://your-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

# Apply CORS configuration
gsutil cors set cors.json gs://your-project-id-real-estate-crm-uploads
```

### 4. Environment Variables

Create a `.env.production` file:
```env
# Database
DATABASE_URL=postgresql://postgres:password@/real_estate_crm?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME

# Security
JWT_SECRET=your-super-secure-jwt-secret
SESSION_SECRET=your-super-secure-session-secret

# Storage
GCS_BUCKET_NAME=your-project-id-real-estate-crm-uploads
GCS_PROJECT_ID=your-project-id

# Application
NODE_ENV=production
PORT=3000
API_BASE_URL=https://your-service-url.run.app
CORS_ORIGIN=https://your-domain.com
```

## 🔧 Configuration Files

### Cloud Build Configuration (`cloudbuild.yaml`)
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/real-estate-crm:$COMMIT_SHA', '-f', 'Dockerfile.gcp', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/real-estate-crm:$COMMIT_SHA']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'real-estate-crm'
      - '--image'
      - 'gcr.io/$PROJECT_ID/real-estate-crm:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
```

### Dockerfile for GCP (`Dockerfile.gcp`)
```dockerfile
FROM node:20-alpine AS base
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

## 🚀 Deployment Commands

### Development Deployment
```bash
# Deploy to Cloud Run (development)
gcloud run deploy real-estate-crm-dev \
    --image gcr.io/PROJECT_ID/real-estate-crm:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 3000 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 5 \
    --min-instances 0
```

### Production Deployment
```bash
# Deploy to Cloud Run (production)
gcloud run deploy real-estate-crm \
    --image gcr.io/PROJECT_ID/real-estate-crm:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 3000 \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 100 \
    --min-instances 1 \
    --add-cloudsql-instances PROJECT_ID:REGION:INSTANCE_NAME
```

### CI/CD Pipeline
```bash
# Trigger build from source
gcloud builds submit --config cloudbuild.yaml

# Trigger build from GitHub
gcloud builds triggers create github \
    --repo-name=real-estate-crm \
    --repo-owner=your-username \
    --branch-pattern="^main$" \
    --build-config=cloudbuild.yaml
```

## 📊 Monitoring and Logging

### View Logs
```bash
# View Cloud Run logs
gcloud run logs tail real-estate-crm --region us-central1

# View Cloud SQL logs
gcloud sql operations list --instance=real-estate-crm-db
```

### Monitoring
```bash
# View metrics
gcloud monitoring metrics list

# Set up alerts
gcloud alpha monitoring policies create --policy-from-file=alert-policy.yaml
```

## 🔒 Security Best Practices

### 1. IAM Configuration
```bash
# Create service account
gcloud iam service-accounts create real-estate-crm-sa

# Grant necessary permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:real-estate-crm-sa@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:real-estate-crm-sa@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"
```

### 2. Secret Management
```bash
# Create secrets
gcloud secrets create jwt-secret --data-file=jwt-secret.txt
gcloud secrets create session-secret --data-file=session-secret.txt

# Grant access to Cloud Run
gcloud secrets add-iam-policy-binding jwt-secret \
    --member="serviceAccount:real-estate-crm-sa@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 3. Network Security
```bash
# Configure VPC
gcloud compute networks create real-estate-crm-vpc \
    --subnet-mode=regional \
    --bgp-routing-mode=global

# Create firewall rules
gcloud compute firewall-rules create allow-cloud-run \
    --network=real-estate-crm-vpc \
    --allow=tcp:3000 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=cloud-run
```

## 💰 Cost Optimization

### 1. Resource Sizing
- **Development**: `db-f1-micro` (1 vCPU, 0.6GB RAM)
- **Production**: `db-g1-small` (1 vCPU, 1.7GB RAM)
- **Cloud Run**: Start with 1 vCPU, 2GB RAM

### 2. Auto-scaling
```bash
# Configure auto-scaling
gcloud run services update real-estate-crm \
    --region us-central1 \
    --min-instances 0 \
    --max-instances 10 \
    --cpu-throttling
```

### 3. Storage Optimization
```bash
# Set lifecycle policies
gsutil lifecycle set lifecycle.json gs://your-bucket-name
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check Cloud SQL instance status
gcloud sql instances describe real-estate-crm-db

# Test connection
gcloud sql connect real-estate-crm-db --user=postgres --database=real_estate_crm
```

#### 2. Cloud Run Deployment Issues
```bash
# Check service status
gcloud run services describe real-estate-crm --region us-central1

# View recent logs
gcloud run logs tail real-estate-crm --region us-central1 --limit 50
```

#### 3. Storage Access Issues
```bash
# Check bucket permissions
gsutil iam get gs://your-bucket-name

# Test file upload
gsutil cp test-file.txt gs://your-bucket-name/
```

## 📈 Scaling and Performance

### 1. Horizontal Scaling
```bash
# Increase max instances
gcloud run services update real-estate-crm \
    --region us-central1 \
    --max-instances 100
```

### 2. Database Scaling
```bash
# Upgrade database tier
gcloud sql instances patch real-estate-crm-db \
    --tier=db-g1-small
```

### 3. CDN Configuration
```bash
# Set up Cloud CDN
gcloud compute url-maps create real-estate-crm-map \
    --default-service=real-estate-crm-backend

gcloud compute target-http-proxies create real-estate-crm-proxy \
    --url-map=real-estate-crm-map
```

## 🎯 Next Steps

1. **Set up monitoring and alerting**
2. **Configure custom domain**
3. **Implement CI/CD pipeline**
4. **Set up backup and disaster recovery**
5. **Optimize for performance and cost**

## 📞 Support

- **Google Cloud Documentation**: [Cloud Run Docs](https://cloud.google.com/run/docs)
- **Community Support**: [Google Cloud Community](https://cloud.google.com/community)
- **Professional Support**: [Google Cloud Support](https://cloud.google.com/support)
