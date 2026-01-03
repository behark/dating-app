#!/bin/bash

# Dating App Infrastructure Quick Start Script
# This script helps set up the development environment

set -e

echo "=========================================="
echo "Dating App Infrastructure Setup"
echo "=========================================="

# Check for required tools
check_requirements() {
    echo "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    echo "✅ All requirements met"
}

# Setup environment files
setup_env() {
    echo "Setting up environment files..."
    
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        echo "✅ Created backend/.env from template"
        echo "⚠️  Please edit backend/.env with your actual credentials"
    else
        echo "ℹ️  backend/.env already exists"
    fi
}

# Install dependencies
install_deps() {
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    echo "✅ Dependencies installed"
}

# Start infrastructure (MongoDB + Redis)
start_infra() {
    echo "Starting infrastructure services (MongoDB + Redis)..."
    
    docker compose -f docker-compose.full.yml up -d mongo redis
    
    echo "Waiting for services to be ready..."
    sleep 5
    
    # Check MongoDB
    if docker compose -f docker-compose.full.yml exec -T mongo mongosh --eval "db.runCommand('ping')" &> /dev/null; then
        echo "✅ MongoDB is ready"
    else
        echo "⚠️  MongoDB might not be ready yet"
    fi
    
    # Check Redis
    if docker compose -f docker-compose.full.yml exec -T redis redis-cli ping &> /dev/null; then
        echo "✅ Redis is ready"
    else
        echo "⚠️  Redis might not be ready yet"
    fi
}

# Start development tools (Redis Commander, Mongo Express, Bull Board)
start_dev_tools() {
    echo "Starting development tools..."
    docker compose -f docker-compose.full.yml --profile development up -d redis-commander mongo-express
    
    echo "Development tools available at:"
    echo "  - Redis Commander: http://localhost:8081"
    echo "  - Mongo Express:   http://localhost:8082 (admin/admin123)"
}

# Start backend API
start_api() {
    echo "Starting backend API..."
    cd backend
    npm run dev &
    cd ..
    echo "✅ API starting on http://localhost:3000"
}

# Start worker
start_worker() {
    echo "Starting background worker..."
    cd backend
    npm run worker:dev &
    cd ..
    echo "✅ Worker starting"
}

# Display status
show_status() {
    echo ""
    echo "=========================================="
    echo "Infrastructure Status"
    echo "=========================================="
    docker compose -f docker-compose.full.yml ps
    echo ""
    echo "Services:"
    echo "  - API:             http://localhost:3000"
    echo "  - Health Check:    http://localhost:3000/health"
    echo "  - MongoDB:         mongodb://localhost:27017/dating-app"
    echo "  - Redis:           redis://localhost:6379"
    echo ""
    echo "Development Tools (if started):"
    echo "  - Redis Commander: http://localhost:8081"
    echo "  - Mongo Express:   http://localhost:8082"
    echo "  - Bull Board:      http://localhost:8083"
    echo ""
}

# Stop all services
stop_all() {
    echo "Stopping all services..."
    docker compose -f docker-compose.full.yml down
    pkill -f "node server.js" 2>/dev/null || true
    pkill -f "node worker.js" 2>/dev/null || true
    echo "✅ All services stopped"
}

# Main menu
main() {
    case "${1:-}" in
        setup)
            check_requirements
            setup_env
            install_deps
            ;;
        start)
            start_infra
            ;;
        start-dev)
            start_infra
            start_dev_tools
            ;;
        start-api)
            start_api
            ;;
        start-worker)
            start_worker
            ;;
        start-all)
            start_infra
            sleep 3
            start_api
            start_worker
            ;;
        stop)
            stop_all
            ;;
        status)
            show_status
            ;;
        *)
            echo "Usage: $0 {setup|start|start-dev|start-api|start-worker|start-all|stop|status}"
            echo ""
            echo "Commands:"
            echo "  setup       - Initial setup (env files, dependencies)"
            echo "  start       - Start infrastructure (MongoDB, Redis)"
            echo "  start-dev   - Start infrastructure + dev tools"
            echo "  start-api   - Start the API server"
            echo "  start-worker- Start the background worker"
            echo "  start-all   - Start everything (infra + API + worker)"
            echo "  stop        - Stop all services"
            echo "  status      - Show service status"
            exit 1
            ;;
    esac
}

main "$@"
