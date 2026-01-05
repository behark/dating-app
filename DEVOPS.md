# Dating App - DevOps Configuration Guide

## Quick Links

| Component        | File                                    | Purpose                    |
| ---------------- | --------------------------------------- | -------------------------- |
| CI/CD            | `.github/workflows/ci.yml`              | Main CI/CD pipeline        |
| Scheduled Tasks  | `.github/workflows/scheduled.yml`       | Backups, security scans    |
| Staging          | `docker-compose.staging.yml`            | Staging environment        |
| Production       | `docker-compose.production.yml`         | Production environment     |
| Nginx Staging    | `nginx/nginx.staging.conf`              | Staging load balancer      |
| Nginx Production | `nginx/nginx.production.conf`           | Production load balancer   |
| Monitoring       | `backend/services/MonitoringService.js` | Sentry/Datadog integration |
| Logging          | `backend/services/LoggingService.js`    | Winston structured logging |
| Backup           | `scripts/backup.sh`                     | Database backup script     |
| Restore          | `scripts/restore.sh`                    | Database restore script    |

## CI/CD Pipeline

### GitHub Actions Workflows

**Main CI Pipeline** (`.github/workflows/ci.yml`):

- Frontend tests and linting
- Backend tests with MongoDB/Redis services
- Security scanning (npm audit, Trivy)
- Docker image building (GHCR)
- Staging deployment (develop/staging branches)
- Production deployment (main branch)

**Scheduled Tasks** (`.github/workflows/scheduled.yml`):

- Daily database backups at 2 AM UTC
- Weekly security scans
- Cleanup of old resources

### Required GitHub Secrets

```bash
# Container Registry
GITHUB_TOKEN (automatic)

# Staging Deployment
STAGING_HOST
STAGING_USER
STAGING_SSH_KEY

# Production Deployment
PRODUCTION_HOST
PRODUCTION_USER
PRODUCTION_SSH_KEY

# Monitoring
SENTRY_AUTH_TOKEN
SENTRY_ORG
DATADOG_API_KEY

# Backups
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
BACKUP_S3_BUCKET

# Notifications
SLACK_WEBHOOK

# Security Scanning
SNYK_TOKEN (optional)
```

## Environment Setup

### Staging Environment

```bash
# Deploy staging
docker compose -f docker-compose.staging.yml up -d

# View logs
docker compose -f docker-compose.staging.yml logs -f

# Access development tools
docker compose -f docker-compose.staging.yml --profile tools up -d
```

### Production Environment

```bash
# Deploy production
docker compose -f docker-compose.production.yml up -d

# Enable monitoring stack
docker compose -f docker-compose.production.yml --profile monitoring up -d

# Scale API servers
docker compose -f docker-compose.production.yml up -d --scale api=3
```

## Monitoring

### Sentry (Error Tracking)

1. Create a Sentry project at https://sentry.io
2. Get your DSN and add to `.env`:
   ```
   SENTRY_DSN=https://xxx@sentry.io/xxx
   ```
3. Errors are automatically captured and reported
4. Performance monitoring enabled for production

### Datadog (APM)

1. Sign up at https://datadoghq.com
2. Install the Datadog agent (included in docker-compose.production.yml)
3. Add API key to `.env`:
   ```
   DATADOG_API_KEY=your-api-key
   ```
4. Access dashboards at https://app.datadoghq.com

### Prometheus + Grafana

Included in production docker-compose with monitoring profile:

```bash
docker compose -f docker-compose.production.yml --profile monitoring up -d
```

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin / $GRAFANA_PASSWORD)

## Logging

### Log Levels

- `error`: Application errors
- `warn`: Warning conditions
- `info`: Informational messages
- `http`: HTTP request logs
- `debug`: Debug information

### Log Files (Production)

- `logs/combined-YYYY-MM-DD.log` - All logs
- `logs/error-YYYY-MM-DD.log` - Errors only
- `logs/access-YYYY-MM-DD.log` - HTTP access logs

### Log Rotation

- Daily rotation
- Max file size: 50MB
- Retention: 14 days (combined), 30 days (errors)

## Backup & Restore

### Manual Backup

```bash
# Full backup
./scripts/backup.sh full

# MongoDB only
./scripts/backup.sh mongo

# Redis only
./scripts/backup.sh redis
```

### Automated Backups

Backups run daily at 2 AM UTC via GitHub Actions scheduled workflow.

Backups are stored:

1. Locally: `/opt/dating-app/backups/`
2. S3: `s3://${BACKUP_S3_BUCKET}/YYYY/MM/`

### Restore

```bash
# List available backups
./scripts/restore.sh list

# Restore MongoDB
./scripts/restore.sh mongo /path/to/backup.tar.gz

# Restore Redis
./scripts/restore.sh redis /path/to/backup.rdb.gz

# Download from S3
./scripts/restore.sh download s3/path/backup.tar.gz /local/path
```

## Load Balancing

### Nginx Configuration

**Production features**:

- Least connections load balancing
- Health checks with automatic failover
- WebSocket support
- SSL/TLS with OCSP stapling
- Rate limiting (API: 20r/s, Auth: 5r/m)
- Gzip compression
- Security headers (HSTS, CSP, etc.)

### Scaling

```bash
# Scale API servers
docker compose -f docker-compose.production.yml up -d --scale api=5

# Scale workers
docker compose -f docker-compose.production.yml up -d --scale worker=3
```

## Health Checks

### Endpoints

| Endpoint           | Purpose                                 |
| ------------------ | --------------------------------------- |
| `/health`          | Basic health check                      |
| `/health/detailed` | Detailed health with all service checks |
| `/ready`           | Kubernetes readiness probe              |
| `/live`            | Kubernetes liveness probe               |
| `/nginx-health`    | Nginx health check                      |

### Example Response

```json
{
  "status": "healthy",
  "timestamp": "2026-01-03T12:00:00.000Z",
  "uptime": 86400,
  "checks": {
    "mongodb": { "status": "healthy", "responseTime": 5 },
    "redis": { "status": "healthy", "responseTime": 2 }
  }
}
```

## Troubleshooting

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api

# Last 100 lines
docker compose logs --tail=100 api
```

### Common Issues

1. **Container won't start**: Check logs and health checks
2. **Database connection failed**: Verify MongoDB URI and network
3. **Redis connection timeout**: Check Redis URL and container status
4. **SSL certificate issues**: Verify certbot configuration

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug docker compose up -d api
```
