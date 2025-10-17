# Google Cloud Platform Deployment Guide

## 🚀 Migration Strategy for Real Estate CRM

### **Architecture Overview**
- **Frontend**: React + Vite (served from Cloud Run)
- **Backend**: Express.js + Node.js (Cloud Run)
- **Database**: Cloud SQL (PostgreSQL)
- **Analytics**: BigQuery + dbt
- **Storage**: Cloud Storage (static assets)
- **CI/CD**: Cloud Build

## 📋 Pre-Migration Checklist

### **1. Database Migration**
```bash
# Create Cloud SQL instance
gcloud sql instances create real-estate-crm-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB

# Create database
gcloud sql databases create real_estate_crm \
  --instance=real-estate-crm-db

# Create user
gcloud sql users create app-user \
  --instance=real-estate-crm-db \
  --password=your-secure-password
```

### **2. Environment Variables for GCP**
```bash
# Database
DATABASE_URL="postgresql://app-user:password@/real_estate_crm?host=/cloudsql/project:region:real-estate-crm-db"

# Security
JWT_SECRET="your-production-jwt-secret"
ENCRYPTION_KEY="your-production-encryption-key"

# Public URL
PUBLIC_BASE_URL="https://your-domain.com"

# Analytics
BQ_PROJECT="your-project-id"
BQ_DATASET="real_estate_analytics"
```

## 🏗️ Deployment Steps

### **Step 1: Enable Required APIs**
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable bigquery.googleapis.com
```

### **Step 2: Build and Deploy**
```bash
# Build the application
npm run build

# Deploy to Cloud Run
gcloud run deploy real-estate-crm \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-cloudsql-instances=project:region:real-estate-crm-db \
  --set-env-vars="NODE_ENV=production,PORT=3000"
```

### **Step 3: Database Migration**
```bash
# Run Prisma migrations
npx prisma migrate deploy --schema data/schema/prisma/schema.prisma

# Seed initial data
npm run import:geo
```

## 🔧 Configuration Files

### **Dockerfile**
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
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

### **Cloud Build Configuration**
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/real-estate-crm:$COMMIT_SHA', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/real-estate-crm:$COMMIT_SHA']
  - name: 'gcr.io/cloud-builders/gcloud'
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

## 📊 Cost Estimation

### **Cloud Run**
- **CPU**: 1 vCPU allocated
- **Memory**: 512MB allocated
- **Requests**: ~$0.40 per million requests
- **Estimated**: $10-50/month (depending on traffic)

### **Cloud SQL**
- **Instance**: db-f1-micro (1 vCPU, 0.6GB RAM)
- **Storage**: 10GB SSD
- **Estimated**: $25-35/month

### **BigQuery**
- **Storage**: $0.02 per GB per month
- **Queries**: $5 per TB processed
- **Estimated**: $5-20/month (depending on usage)

### **Total Estimated Cost**: $40-105/month

## 🔒 Security Considerations

### **1. Database Security**
- Use Cloud SQL Auth Proxy
- Enable SSL connections
- Set up VPC peering

### **2. Application Security**
- Use Secret Manager for sensitive data
- Enable Cloud Armor for DDoS protection
- Set up IAM roles and permissions

### **3. Network Security**
- Configure firewall rules
- Use private Google access
- Enable VPC flow logs

## 📈 Monitoring and Logging

### **Cloud Monitoring**
- Set up uptime checks
- Monitor CPU and memory usage
- Track database performance

### **Cloud Logging**
- Application logs
- Error tracking
- Performance metrics

## 🚀 CI/CD Pipeline

### **GitHub Actions Integration**
```yaml
name: Deploy to Google Cloud
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v0
        with:
          service: real-estate-crm
          region: us-central1
          image: gcr.io/${{ secrets.GCP_PROJECT_ID }}/real-estate-crm
```

## 🎯 Migration Benefits

### **Scalability**
- Auto-scaling based on traffic
- Pay only for what you use
- Global CDN for static assets

### **Reliability**
- 99.95% uptime SLA
- Automatic backups
- Multi-region deployment

### **Security**
- Built-in DDoS protection
- Automatic SSL certificates
- IAM integration

### **Analytics**
- BigQuery integration
- Real-time monitoring
- Cost optimization insights
