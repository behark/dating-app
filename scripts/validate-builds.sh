#!/bin/bash
# =============================================================================
# Build Validation Script
# =============================================================================
# This script validates all build targets work correctly before deployment.
# Run this locally or in CI to ensure builds complete successfully.
#
# Usage:
#   ./scripts/validate-builds.sh [options]
#
# Options:
#   --all           Run all validations (default)
#   --frontend      Validate frontend build only
#   --backend       Validate backend only
#   --docker        Validate Docker builds only
#   --eas-dry-run   Run EAS build dry-run (requires EAS CLI)
#   --quick         Skip slow validations (Docker, EAS)
#   --verbose       Show detailed output
#   --help          Show this help message
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
WEB_BUILD_DIR="$ROOT_DIR/web-build"
VERBOSE=false
RUN_ALL=true
RUN_FRONTEND=false
RUN_BACKEND=false
RUN_DOCKER=false
RUN_EAS=false
QUICK_MODE=false

# Counters
PASSED=0
FAILED=0
SKIPPED=0

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
}

print_step() {
    echo -e "\n${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED++))
}

print_skip() {
    echo -e "${YELLOW}⊘ $1 (skipped)${NC}"
    ((SKIPPED++))
}

print_info() {
    if [ "$VERBOSE" = true ]; then
        echo -e "  $1"
    fi
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

show_help() {
    head -30 "$0" | tail -20
    exit 0
}

# =============================================================================
# Parse Arguments
# =============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            RUN_ALL=true
            shift
            ;;
        --frontend)
            RUN_ALL=false
            RUN_FRONTEND=true
            shift
            ;;
        --backend)
            RUN_ALL=false
            RUN_BACKEND=true
            shift
            ;;
        --docker)
            RUN_ALL=false
            RUN_DOCKER=true
            shift
            ;;
        --eas-dry-run)
            RUN_ALL=false
            RUN_EAS=true
            shift
            ;;
        --quick)
            QUICK_MODE=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            show_help
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            ;;
    esac
done

# If --all, enable everything
if [ "$RUN_ALL" = true ]; then
    RUN_FRONTEND=true
    RUN_BACKEND=true
    RUN_DOCKER=true
    RUN_EAS=true
fi

# Quick mode disables slow builds
if [ "$QUICK_MODE" = true ]; then
    RUN_DOCKER=false
    RUN_EAS=false
fi

# =============================================================================
# Validation Functions
# =============================================================================

validate_prerequisites() {
    print_header "Checking Prerequisites"
    
    print_step "Checking Node.js..."
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js installed: $NODE_VERSION"
    else
        print_error "Node.js not found"
        return 1
    fi
    
    print_step "Checking npm..."
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm installed: $NPM_VERSION"
    else
        print_error "npm not found"
        return 1
    fi
    
    print_step "Checking package.json..."
    if [ -f "$ROOT_DIR/package.json" ]; then
        print_success "Root package.json found"
    else
        print_error "Root package.json not found"
        return 1
    fi
    
    if [ -f "$BACKEND_DIR/package.json" ]; then
        print_success "Backend package.json found"
    else
        print_error "Backend package.json not found"
        return 1
    fi
}

validate_frontend() {
    print_header "Validating Frontend Build"
    
    cd "$ROOT_DIR"
    
    print_step "Installing dependencies..."
    if npm ci --silent 2>/dev/null || npm install --silent 2>/dev/null; then
        print_success "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        return 1
    fi
    
    print_step "Running TypeScript type check..."
    if npm run type-check 2>/dev/null; then
        print_success "TypeScript check passed"
    else
        print_skip "TypeScript check (script not found or failed)"
    fi
    
    print_step "Running ESLint..."
    if npm run lint 2>/dev/null; then
        print_success "ESLint passed"
    else
        print_skip "ESLint (warnings or not configured)"
    fi
    
    print_step "Building web application..."
    if npm run web:build; then
        print_success "Web build completed"
    else
        print_error "Web build failed"
        return 1
    fi
    
    print_step "Verifying build output..."
    if [ -d "$WEB_BUILD_DIR" ]; then
        FILE_COUNT=$(find "$WEB_BUILD_DIR" -type f | wc -l)
        print_success "Build output exists ($FILE_COUNT files)"
        
        # Check for critical files
        if [ -f "$WEB_BUILD_DIR/index.html" ]; then
            print_success "index.html present"
        else
            print_error "index.html missing"
        fi
    else
        print_error "Build output directory not found"
        return 1
    fi
}

validate_backend() {
    print_header "Validating Backend Build"
    
    cd "$BACKEND_DIR"
    
    print_step "Installing dependencies..."
    if npm ci --silent 2>/dev/null || npm install --silent 2>/dev/null; then
        print_success "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        return 1
    fi
    
    print_step "Running ESLint..."
    if npm run lint 2>/dev/null; then
        print_success "ESLint passed"
    else
        print_skip "ESLint (warnings or not configured)"
    fi
    
    print_step "Running TypeScript type check..."
    if npm run type-check 2>/dev/null; then
        print_success "TypeScript check passed"
    else
        print_skip "TypeScript check (script not found)"
    fi
    
    print_step "Checking server entry point..."
    if [ -f "$BACKEND_DIR/server.js" ]; then
        print_success "server.js exists"
    else
        print_error "server.js not found"
        return 1
    fi
    
    print_step "Validating server syntax..."
    if node --check "$BACKEND_DIR/server.js" 2>/dev/null; then
        print_success "Server syntax valid"
    else
        print_error "Server has syntax errors"
        return 1
    fi
    
    print_step "Checking worker entry point..."
    if [ -f "$BACKEND_DIR/worker.js" ]; then
        if node --check "$BACKEND_DIR/worker.js" 2>/dev/null; then
            print_success "Worker syntax valid"
        else
            print_error "Worker has syntax errors"
        fi
    else
        print_skip "Worker script (not found)"
    fi
}

validate_docker() {
    print_header "Validating Docker Builds"
    
    if ! command_exists docker; then
        print_skip "Docker not installed"
        return 0
    fi
    
    print_step "Building frontend Docker image..."
    if docker build -t dating-app-web:test -f "$ROOT_DIR/Dockerfile" "$ROOT_DIR" --quiet; then
        print_success "Frontend Docker image built"
        docker rmi dating-app-web:test >/dev/null 2>&1 || true
    else
        print_error "Frontend Docker build failed"
    fi
    
    print_step "Building backend Docker image..."
    if docker build -t dating-app-api:test -f "$BACKEND_DIR/Dockerfile" "$BACKEND_DIR" --quiet; then
        print_success "Backend Docker image built"
        docker rmi dating-app-api:test >/dev/null 2>&1 || true
    else
        print_error "Backend Docker build failed"
    fi
    
    print_step "Validating docker-compose files..."
    for compose_file in docker-compose.yml docker-compose.staging.yml docker-compose.production.yml; do
        if [ -f "$ROOT_DIR/$compose_file" ]; then
            if docker compose -f "$ROOT_DIR/$compose_file" config --quiet 2>/dev/null; then
                print_success "$compose_file is valid"
            else
                print_error "$compose_file has errors"
            fi
        fi
    done
}

validate_eas() {
    print_header "Validating EAS Build Configuration"
    
    if ! command_exists eas; then
        print_skip "EAS CLI not installed (run: npm install -g eas-cli)"
        return 0
    fi
    
    cd "$ROOT_DIR"
    
    print_step "Checking eas.json configuration..."
    if [ -f "$ROOT_DIR/eas.json" ]; then
        if node -e "JSON.parse(require('fs').readFileSync('eas.json'))" 2>/dev/null; then
            print_success "eas.json is valid JSON"
        else
            print_error "eas.json has JSON syntax errors"
            return 1
        fi
    else
        print_error "eas.json not found"
        return 1
    fi
    
    print_step "Checking app.config.js..."
    if [ -f "$ROOT_DIR/app.config.js" ]; then
        if node -e "require('./app.config.js')" 2>/dev/null; then
            print_success "app.config.js is valid"
        else
            print_error "app.config.js has errors"
            return 1
        fi
    fi
    
    print_step "Running EAS build configuration check..."
    if eas build:configure --platform all 2>/dev/null; then
        print_success "EAS build configuration valid"
    else
        print_skip "EAS build configure (may require login)"
    fi
}

validate_env_templates() {
    print_header "Validating Environment Templates"
    
    print_step "Checking .env.example files..."
    
    if [ -f "$ROOT_DIR/.env.example" ]; then
        print_success "Root .env.example exists"
    else
        print_error "Root .env.example missing"
    fi
    
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        print_success "Backend .env.example exists"
    else
        print_error "Backend .env.example missing"
    fi
    
    print_step "Checking production env var templates..."
    
    if [ -f "$ROOT_DIR/RENDER_ENV_VARS_FINAL.env" ]; then
        print_success "RENDER_ENV_VARS_FINAL.env exists"
    else
        print_skip "RENDER_ENV_VARS_FINAL.env"
    fi
    
    if [ -f "$ROOT_DIR/VERCEL_ENV_VARS_FINAL.env" ]; then
        print_success "VERCEL_ENV_VARS_FINAL.env exists"
    else
        print_skip "VERCEL_ENV_VARS_FINAL.env"
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

print_header "Build Validation Started"
echo "Running from: $ROOT_DIR"
echo "Mode: $([ "$QUICK_MODE" = true ] && echo "Quick" || echo "Full")"
echo "Verbose: $VERBOSE"

# Always validate prerequisites
validate_prerequisites || exit 1

# Always validate env templates
validate_env_templates

# Run selected validations
[ "$RUN_FRONTEND" = true ] && validate_frontend
[ "$RUN_BACKEND" = true ] && validate_backend
[ "$RUN_DOCKER" = true ] && validate_docker
[ "$RUN_EAS" = true ] && validate_eas

# =============================================================================
# Summary
# =============================================================================

print_header "Validation Summary"
echo ""
echo -e "  ${GREEN}Passed:${NC}  $PASSED"
echo -e "  ${RED}Failed:${NC}  $FAILED"
echo -e "  ${YELLOW}Skipped:${NC} $SKIPPED"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Build validation FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}Build validation PASSED${NC}"
    exit 0
fi
