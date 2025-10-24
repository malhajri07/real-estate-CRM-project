# 🔧 Egress Proxy Configuration for Cloud Run

This document explains how to configure HTTP proxy exceptions for Cloud Run services to prevent egress traffic issues.

## 🚨 Common Issues

When using HTTP proxies with Cloud Run services, you may encounter:

- **Latency issues** with Google APIs
- **Connection timeouts** to Cloud services  
- **Connection resets** during authentication
- **Authentication errors** with Google services

## ✅ Solution: Configure Proxy Exceptions

### Required Non-Proxied Hosts

The following hosts and subnets **must** be excluded from proxy routing:

```
127.0.0.1                    # Localhost
169.254.0.0/16              # Metadata server
localhost                    # Localhost alias
*.google.internal           # Google internal services
*.googleapis.com            # Google APIs
```

### Optional Non-Proxied Hosts

These hosts are **recommended** for optimal performance:

```
*.appspot.com               # App Engine
*.run.app                   # Cloud Run
*.cloudfunctions.net        # Cloud Functions
*.gateway.dev               # API Gateway
*.googleusercontent.com     # Google content
*.pkg.dev                   # Artifact Registry
*.gcr.io                    # Container Registry
```

## 🚀 Implementation

### Method 1: Quick Fix Script

```bash
# Run the egress proxy fix script
./fix-egress-proxy.sh
```

### Method 2: Manual Configuration

```bash
# Update your Cloud Run service
gcloud run services update YOUR_SERVICE_NAME \
    --region YOUR_REGION \
    --set-env-vars NO_PROXY="127.0.0.1,localhost,169.254.0.0/16,*.google.internal,*.googleapis.com,*.appspot.com,*.run.app,*.cloudfunctions.net,*.gateway.dev,*.googleusercontent.com,*.pkg.dev,*.gcr.io" \
    --set-env-vars no_proxy="127.0.0.1,localhost,169.254.0.0/16,*.google.internal,*.googleapis.com,*.appspot.com,*.run.app,*.cloudfunctions.net,*.gateway.dev,*.googleusercontent.com,*.pkg.dev,*.gcr.io"
```

### Method 3: Environment Variables

Set these environment variables in your Cloud Run service:

```bash
NO_PROXY=127.0.0.1,localhost,169.254.0.0/16,*.google.internal,*.googleapis.com,*.appspot.com,*.run.app,*.cloudfunctions.net,*.gateway.dev,*.googleusercontent.com,*.pkg.dev,*.gcr.io
no_proxy=127.0.0.1,localhost,169.254.0.0/16,*.google.internal,*.googleapis.com,*.appspot.com,*.run.app,*.cloudfunctions.net,*.gateway.dev,*.googleusercontent.com,*.pkg.dev,*.gcr.io
```

## 🔍 Verification

### Test Egress Connectivity

```bash
# Test Google APIs connectivity
curl -I https://www.googleapis.com

# Test Cloud Run connectivity  
curl -I https://YOUR_SERVICE.run.app

# Test Container Registry
curl -I https://gcr.io
```

### Check Service Logs

```bash
# View Cloud Run logs
gcloud run logs tail YOUR_SERVICE_NAME --region YOUR_REGION

# Look for connection errors or timeouts
gcloud run logs tail YOUR_SERVICE_NAME --region YOUR_REGION --filter="severity>=ERROR"
```

## 📋 Environment Variables Reference

### Required Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `NO_PROXY` | Comma-separated list | Excludes hosts from proxy |
| `no_proxy` | Comma-separated list | Lowercase version for compatibility |

### Optional Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `HTTP_PROXY` | Proxy URL | HTTP proxy configuration |
| `HTTPS_PROXY` | Proxy URL | HTTPS proxy configuration |
| `http_proxy` | Proxy URL | Lowercase version |
| `https_proxy` | Proxy URL | Lowercase version |

## 🛠️ Troubleshooting

### Common Issues

#### 1. Authentication Errors
```
Error: Unable to authenticate with Google APIs
```
**Solution**: Add `*.googleapis.com` to NO_PROXY

#### 2. Connection Timeouts
```
Error: Connection timeout to Cloud SQL
```
**Solution**: Add `*.google.internal` to NO_PROXY

#### 3. Metadata Server Issues
```
Error: Cannot access metadata server
```
**Solution**: Add `169.254.0.0/16` to NO_PROXY

### Debug Commands

```bash
# Check current environment variables
gcloud run services describe YOUR_SERVICE_NAME --region YOUR_REGION --format="value(spec.template.spec.template.spec.containers[0].env[].name,spec.template.spec.template.spec.containers[0].env[].value)"

# Test connectivity from Cloud Run
gcloud run jobs create test-connectivity --image gcr.io/google.com/cloudsdktool/cloud-sdk:alpine --region YOUR_REGION --command curl --args -I,https://www.google.com

# View detailed logs
gcloud run logs tail YOUR_SERVICE_NAME --region YOUR_REGION --format="value(timestamp,severity,textPayload)"
```

## 🔄 Integration with Deployment Scripts

The proxy configuration is now included in all deployment scripts:

- `deploy-gcp.sh` - Basic deployment with proxy config
- `deploy-full-gcp.sh` - Complete deployment with proxy config  
- `cloudbuild.yaml` - CI/CD pipeline with proxy config
- `fix-egress-proxy.sh` - Quick fix for existing services

## 📚 Additional Resources

- [Cloud Run Networking](https://cloud.google.com/run/docs/networking)
- [HTTP Proxy Configuration](https://cloud.google.com/run/docs/configuring/http-proxy)
- [Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)
- [Troubleshooting Cloud Run](https://cloud.google.com/run/docs/troubleshooting)

## 🎯 Best Practices

1. **Always configure proxy exceptions** for Google services
2. **Test connectivity** after configuration changes
3. **Monitor logs** for connection issues
4. **Use both uppercase and lowercase** environment variables
5. **Include all recommended hosts** for optimal performance
6. **Document your proxy configuration** for team members

## 🚀 Quick Commands

```bash
# Fix egress proxy issues
./fix-egress-proxy.sh

# Deploy with proxy configuration
./deploy-gcp.sh

# Check service status
gcloud run services describe YOUR_SERVICE_NAME --region YOUR_REGION

# View logs
gcloud run logs tail YOUR_SERVICE_NAME --region YOUR_REGION
```
