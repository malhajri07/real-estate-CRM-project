# Port Configuration Documentation

This document describes the centralized port configuration system implemented in the Real Estate CRM application.

## Overview

The application uses centralized port configuration to avoid hardcoding port numbers throughout the codebase. All port-related settings are managed through environment variables and helper functions.

**IMPORTANT**: This application enforces single-server instances to prevent port conflicts and routing errors.

## Environment Variables

### Required Port Variables

```bash
# Backend API server port (default: 3001 in dev, 8080 in prod)
PORT=3001

# Frontend development server port (default: 3000)
VITE_PORT=3000

# API host for proxy (default: 127.0.0.1)
API_HOST=127.0.0.1
```

### Default Values

- **Development Backend**: Port 3001
- **Production Backend**: Port 8080
- **Frontend**: Port 3000
- **API Host**: 127.0.0.1

## Configuration Functions

The port configuration is centralized in `apps/api/config/env.ts`:

### `BACKEND_PORT()`
Returns the backend server port based on environment:
- Development: 3001 (or PORT env var)
- Production: 8080 (or PORT env var)

### `FRONTEND_PORT()`
Returns the frontend development server port:
- Default: 3000 (or VITE_PORT env var)

### `API_PROXY_TARGET()`
Returns the complete API proxy target URL:
- Format: `http://{API_HOST}:{BACKEND_PORT}`
- Example: `http://127.0.0.1:3001`

## Files Using Port Configuration

### Backend Files
- `apps/api/index.ts` - Development server
- `apps/api/index.prod.ts` - Production server
- `package.json` - Dev script (uses PORT env var)

### Frontend Files
- `vite.config.ts` - Development server and API proxy

## Usage Examples

### Custom Ports
To run the application on different ports:

```bash
# Backend on port 4000, frontend on port 5000
PORT=4000 VITE_PORT=5000 npm run dev:server
PORT=4000 VITE_PORT=5000 npm run dev:client
```

### Production Deployment
```bash
# Production backend on port 9000
PORT=9000 NODE_ENV=production npm run start
```

## Benefits

1. **Single Source of Truth**: All port configuration in one place
2. **Easy Updates**: Change ports by updating env vars, not code
3. **Consistency**: Same port logic across dev and prod
4. **Documentation**: Clear env var names show purpose
5. **Flexibility**: Easy to override for different environments

## Quick Start

Use the provided startup script for consistent server management:

```bash
./start-dev.sh
```

This script:
- Kills any existing server processes
- Starts backend on port 3001
- Starts frontend on port 3000
- Provides proper cleanup on exit

## Manual Testing

If running servers manually:

1. Start backend: `npm run dev:server` - runs on port 3001
2. Start frontend: `npm run dev:client` - runs on port 3000
3. Verify proxy: Frontend API calls should reach backend at 127.0.0.1:3001
4. Test with custom ports: Set PORT=4000 and VITE_PORT=5000, verify both servers start correctly

## Troubleshooting

If you see "ECONNREFUSED" errors:
1. Ensure only one backend server is running on port 3001
2. Check that vite.config.ts uses API_PROXY_TARGET() (not hardcoded ports)
3. Verify no other applications are using ports 3000 or 3001
