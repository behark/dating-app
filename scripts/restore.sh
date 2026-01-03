#!/bin/bash

# =============================================
# Backup Restore Script
# =============================================
# Usage: ./restore.sh [mongo|redis] <backup_file>
# =============================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/dating-app/backups}"
MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017}"
MONGO_DB="${MONGO_DB:-dating-app}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_success() {
    log "${GREEN}✓ $1${NC}"
}

log_warning() {
    log "${YELLOW}⚠ $1${NC}"
}

log_error() {
    log "${RED}✗ $1${NC}"
}

# =============================================
# Restore MongoDB
# =============================================
restore_mongodb() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log "Restoring MongoDB from: $backup_file"
    log_warning "This will overwrite existing data in database: $MONGO_DB"
    
    read -p "Are you sure you want to continue? (yes/no) " confirm
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        exit 0
    fi
    
    # Create temp directory
    TEMP_DIR=$(mktemp -d)
    
    # Extract backup
    log "Extracting backup..."
    tar -xzf "$backup_file" -C "$TEMP_DIR"
    
    # Find the dump directory
    DUMP_DIR=$(find "$TEMP_DIR" -type d -name "$MONGO_DB" | head -1)
    if [ -z "$DUMP_DIR" ]; then
        DUMP_DIR=$(find "$TEMP_DIR" -type d -name "dating-app*" | head -1)
    fi
    
    if [ -z "$DUMP_DIR" ]; then
        log_error "Could not find database dump in backup"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    # Restore using mongorestore
    log "Restoring database..."
    if docker ps --format '{{.Names}}' | grep -q 'mongo'; then
        docker cp "$DUMP_DIR" mongo:/restore
        docker exec mongo mongorestore --uri="$MONGO_URI" --db="$MONGO_DB" --drop /restore
    else
        mongorestore --uri="$MONGO_URI" --db="$MONGO_DB" --drop "$DUMP_DIR"
    fi
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    log_success "MongoDB restore completed successfully!"
}

# =============================================
# Restore Redis
# =============================================
restore_redis() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log "Restoring Redis from: $backup_file"
    log_warning "This will overwrite existing Redis data"
    
    read -p "Are you sure you want to continue? (yes/no) " confirm
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        exit 0
    fi
    
    # Stop Redis
    log "Stopping Redis..."
    if docker ps --format '{{.Names}}' | grep -q 'redis'; then
        docker stop redis
        
        # Decompress and copy
        gunzip -c "$backup_file" > /tmp/dump.rdb
        docker cp /tmp/dump.rdb redis:/data/dump.rdb
        rm /tmp/dump.rdb
        
        # Start Redis
        docker start redis
    else
        # Direct restore
        systemctl stop redis || true
        gunzip -c "$backup_file" > /var/lib/redis/dump.rdb
        chown redis:redis /var/lib/redis/dump.rdb
        systemctl start redis
    fi
    
    log_success "Redis restore completed successfully!"
}

# =============================================
# List Available Backups
# =============================================
list_backups() {
    log "Available MongoDB backups:"
    ls -lh "${BACKUP_DIR}/mongo"/*.tar.gz 2>/dev/null || echo "  No MongoDB backups found"
    
    echo ""
    log "Available Redis backups:"
    ls -lh "${BACKUP_DIR}/redis"/*.gz 2>/dev/null || echo "  No Redis backups found"
}

# =============================================
# Download from S3
# =============================================
download_from_s3() {
    local s3_path=$1
    local local_path=$2
    
    if [ -z "$BACKUP_S3_BUCKET" ]; then
        log_error "S3_BUCKET not configured"
        exit 1
    fi
    
    log "Downloading from S3: $s3_path"
    aws s3 cp "s3://${BACKUP_S3_BUCKET}/${s3_path}" "$local_path"
    log_success "Downloaded to: $local_path"
}

# =============================================
# Main Entry Point
# =============================================
main() {
    local restore_type=$1
    local backup_file=$2
    
    case "$restore_type" in
        mongo)
            if [ -z "$backup_file" ]; then
                log_error "Please provide backup file path"
                echo "Usage: $0 mongo <backup_file>"
                exit 1
            fi
            restore_mongodb "$backup_file"
            ;;
        redis)
            if [ -z "$backup_file" ]; then
                log_error "Please provide backup file path"
                echo "Usage: $0 redis <backup_file>"
                exit 1
            fi
            restore_redis "$backup_file"
            ;;
        list)
            list_backups
            ;;
        download)
            if [ -z "$backup_file" ]; then
                log_error "Please provide S3 path and local destination"
                echo "Usage: $0 download <s3_path> <local_path>"
                exit 1
            fi
            download_from_s3 "$backup_file" "$3"
            ;;
        *)
            echo "Dating App Restore Script"
            echo ""
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  mongo <backup_file>     Restore MongoDB from backup"
            echo "  redis <backup_file>     Restore Redis from backup"
            echo "  list                    List available local backups"
            echo "  download <s3> <local>   Download backup from S3"
            exit 1
            ;;
    esac
}

main "$@"
