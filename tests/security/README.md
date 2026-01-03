# Penetration Testing Configuration

This directory contains configuration and scripts for security penetration testing using OWASP ZAP.

## Prerequisites

1. **OWASP ZAP** - Download from https://www.zaproxy.org/download/
2. **Docker** (optional) - For running ZAP in container

## Quick Start

### Using Docker
```bash
# Pull OWASP ZAP Docker image
docker pull zaproxy/zap-stable

# Run baseline scan
docker run -t zaproxy/zap-stable zap-baseline.py -t http://localhost:3001

# Run full scan
docker run -t zaproxy/zap-stable zap-full-scan.py -t http://localhost:3001
```

### Using ZAP CLI
```bash
# Start ZAP in daemon mode
zap.sh -daemon -port 8090

# Run automated scan
zap-cli quick-scan --self-contained http://localhost:3001
```

## Test Targets

- **API Server**: http://localhost:3001/api
- **Web App**: http://localhost:19006
- **Admin Panel**: http://localhost:3001/admin (if applicable)

## Scan Types

1. **Baseline Scan** - Quick passive scan
2. **API Scan** - OpenAPI/Swagger based scanning
3. **Full Scan** - Comprehensive active scanning
4. **Ajax Spider** - For SPAs and dynamic content

## Reports

Reports are generated in the `reports/` directory in HTML and JSON formats.
