# 🐳 Docker Setup Guide for Real Estate CRM

This guide will help you set up and run the Real Estate CRM application using Docker.

## Prerequisites

### For macOS (Your System)
Since you're running macOS 13.0.1 (Ventura), you have a few options:

#### Option 1: Docker Desktop (Recommended)
1. **Download Docker Desktop**: Visit [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
2. **Install**: Download the version compatible with macOS Ventura
3. **Start Docker Desktop**: Launch the application and ensure it's running

#### Option 2: Docker CLI Only (Current Setup)
- Docker CLI is already installed via Homebrew
- You'll need a Docker daemon to run containers
- Consider using Docker Desktop or a cloud-based solution

## Quick Start

### 1. Run the Setup Script
```bash
./docker-setup.sh
```

### 2. Development Environment
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Or run in background
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Production Environment
```bash
# Build and start production environment
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

## Docker Services

### Development Stack (`docker-compose.dev.yml`)
- **app-dev**: Node.js application with hot reload
- **postgres-dev**: PostgreSQL database (port 5433)
- **redis-dev**: Redis cache (port 6380)

### Production Stack (`docker-compose.yml`)
- **app**: Node.js application
- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)
- **nginx**: Reverse proxy (ports 80, 443)

## Environment Configuration

### Development Environment Variables
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@postgres-dev:5432/real_estate_crm_dev?schema=public
REDIS_URL=redis://redis-dev:6379
JWT_SECRET=dev-jwt-secret-key
SESSION_SECRET=dev-session-secret-key
```

### Production Environment Variables
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/real_estate_crm?schema=public
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secure-jwt-secret-key
SESSION_SECRET=your-super-secure-session-secret-key
```

## Common Commands

### Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Rebuild and start
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

### Production
```bash
# Start production environment
docker-compose up

# Build and start
docker-compose up --build

# View logs
docker-compose logs -f

# Stop production environment
docker-compose down
```

### Database Operations
```bash
# Access PostgreSQL database
docker-compose exec postgres psql -U postgres -d real_estate_crm

# Run database migrations
docker-compose exec app npm run db:migrate

# Seed database
docker-compose exec app npm run db:seed
```

### Maintenance
```bash
# Remove all containers and volumes
docker-compose down -v

# Remove all images
docker system prune -a

# View container status
docker-compose ps

# View resource usage
docker stats
```

## Troubleshooting

### Docker Desktop Not Available
If Docker Desktop is not compatible with your macOS version:

1. **Use Docker CLI with Docker Machine**:
   ```bash
   # Install Docker Machine
   brew install docker-machine
   
   # Create a Docker machine
   docker-machine create --driver virtualbox default
   
   # Start the machine
   docker-machine start default
   
   # Set environment
   eval $(docker-machine env default)
   ```

2. **Use Colima (Alternative to Docker Desktop)**:
   ```bash
   # Install Colima
   brew install colima
   
   # Start Colima
   colima start
   ```

### Common Issues

#### Port Conflicts
If ports 3000, 5432, or 6379 are already in use:
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :5432
lsof -i :6379

# Kill processes using the ports
sudo kill -9 <PID>
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x docker-setup.sh
```

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose exec postgres pg_isready -U postgres

# Reset database
docker-compose down -v
docker-compose up postgres
```

## Security Considerations

### Production Deployment
1. **Change default passwords** in environment variables
2. **Use strong JWT and session secrets**
3. **Enable SSL/TLS** with proper certificates
4. **Configure firewall** rules
5. **Regular security updates** for base images

### Environment Variables
Never commit sensitive data to version control:
```bash
# Add to .gitignore
.env
.env.local
.env.production
```

## Monitoring and Logs

### View Application Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app
```

### Health Checks
```bash
# Check container health
docker-compose ps

# Check application health
curl http://localhost:3000/health
```

## Next Steps

1. **Install Docker Desktop** for the best experience
2. **Run the setup script**: `./docker-setup.sh`
3. **Start development environment**: `docker-compose -f docker-compose.dev.yml up`
4. **Access the application**: http://localhost:3000
5. **Configure your environment** variables as needed

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify Docker is running: `docker info`
3. Check port availability: `lsof -i :3000`
4. Review this documentation for troubleshooting steps
