#!/bin/bash

# =============================================
# Automated Backup Script
# =============================================
# Usage: ./backup.sh [full|incremental|mongo|redis]
# =============================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/dating-app/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017}"
MONGO_DB="${MONGO_DB:-dating-app}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
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

# Create backup directory
mkdir -p "$BACKUP_DIR"
mkdir -p "${BACKUP_DIR}/mongo"
mkdir -p "${BACKUP_DIR}/redis"
mkdir -p "${BACKUP_DIR}/files"

# =============================================
# MongoDB Backup
# =============================================
backup_mongodb() {
    log "Starting MongoDB backup..."
    
    MONGO_BACKUP_DIR="${BACKUP_DIR}/mongo/${TIMESTAMP}"
    mkdir -p "$MONGO_BACKUP_DIR"
    
    # Check if mongodump is available
    if ! command -v mongodump &> /dev/null; then
        # Try using Docker
        if docker ps --format '{{.Names}}' | grep -q 'mongo'; then
            log "Using Docker for MongoDB backup..."
            docker exec mongo mongodump --uri="$MONGO_URI" --db="$MONGO_DB" --out="/backup"
            docker cp mongo:/backup "$MONGO_BACKUP_DIR"
        else
            log_error "mongodump not found and no running mongo container"
            return 1
        fi
    else
        mongodump --uri="$MONGO_URI" --db="$MONGO_DB" --out="$MONGO_BACKUP_DIR" --gzip
    fi
    
    # Compress the backup
    cd "${BACKUP_DIR}/mongo"
    tar -czf "mongo_${TIMESTAMP}.tar.gz" "${TIMESTAMP}"
    rm -rf "${TIMESTAMP}"
    
    BACKUP_SIZE=$(du -h "mongo_${TIMESTAMP}.tar.gz" | cut -f1)
    log_success "MongoDB backup completed: mongo_${TIMESTAMP}.tar.gz (${BACKUP_SIZE})"
    
    echo "${BACKUP_DIR}/mongo/mongo_${TIMESTAMP}.tar.gz"
}

# =============================================
# Redis Backup
# =============================================
backup_redis() {
    log "Starting Redis backup..."
    
    REDIS_BACKUP_FILE="${BACKUP_DIR}/redis/redis_${TIMESTAMP}.rdb"
    
    # Trigger Redis BGSAVE
    if docker ps --format '{{.Names}}' | grep -q 'redis'; then
        log "Using Docker for Redis backup..."
        docker exec redis redis-cli BGSAVE
        sleep 5  # Wait for background save to complete
        docker cp redis:/data/dump.rdb "$REDIS_BACKUP_FILE"
    else
        redis-cli BGSAVE
        sleep 5
        # Copy RDB file (adjust path as needed)
        if [ -f "/var/lib/redis/dump.rdb" ]; then
            cp /var/lib/redis/dump.rdb "$REDIS_BACKUP_FILE"
        elif [ -f "/data/dump.rdb" ]; then
            cp /data/dump.rdb "$REDIS_BACKUP_FILE"
        else
            log_warning "Could not locate Redis dump file"
            return 1
        fi
    fi
    
    # Compress
    gzip "$REDIS_BACKUP_FILE"
    
    BACKUP_SIZE=$(du -h "${REDIS_BACKUP_FILE}.gz" | cut -f1)
    log_success "Redis backup completed: redis_${TIMESTAMP}.rdb.gz (${BACKUP_SIZE})"
    
    echo "${REDIS_BACKUP_FILE}.gz"
}

# =============================================
# Upload to S3
# =============================================
upload_to_s3() {
    local file_path=$1
    local s3_path=$2
    
    if [ -z "$S3_BUCKET" ]; then
        log_warning "S3_BUCKET not configured, skipping upload"
        return 0
    fi
    
    log "Uploading to S3: $s3_path..."
    
    if command -v aws &> /dev/null; then
        aws s3 cp "$file_path" "s3://${S3_BUCKET}/${s3_path}" \
            --storage-class STANDARD_IA \
            --metadata "timestamp=${TIMESTAMP},type=backup"
        log_success "Uploaded to S3: s3://${S3_BUCKET}/${s3_path}"
    else
        log_warning "AWS CLI not found, skipping S3 upload"
    fi
}

# =============================================
# Cleanup Old Backups
# =============================================
cleanup_old_backups() {
    log "Cleaning up backups older than ${BACKUP_RETENTION_DAYS} days..."
    
    # Local cleanup
    find "${BACKUP_DIR}/mongo" -name "*.tar.gz" -mtime +${BACKUP_RETENTION_DAYS} -delete
    find "${BACKUP_DIR}/redis" -name "*.gz" -mtime +${BACKUP_RETENTION_DAYS} -delete
    find "${BACKUP_DIR}" -name "backup_*.log" -mtime +7 -delete
    
    log_success "Local cleanup completed"
    
    # S3 cleanup (if configured)
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        # Use lifecycle rules instead for S3 cleanup
        log "S3 cleanup managed via lifecycle rules"
    fi
}

# =============================================
# Verify Backup
# =============================================
verify_backup() {
    local backup_file=$1
    
    log "Verifying backup: $backup_file..."
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Check file size
    local size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null)
    if [ "$size" -lt 1000 ]; then
        log_warning "Backup file seems too small: $size bytes"
        return 1
    fi
    
    # Verify archive integrity
    if [[ "$backup_file" == *.tar.gz ]]; then
        if ! tar -tzf "$backup_file" > /dev/null 2>&1; then
            log_error "Backup archive is corrupted"
            return 1
        fi
    elif [[ "$backup_file" == *.gz ]]; then
        if ! gzip -t "$backup_file" > /dev/null 2>&1; then
            log_error "Backup archive is corrupted"
            return 1
        fi
    fi
    
    log_success "Backup verified successfully"
    return 0
}

# =============================================
# Send Notification
# =============================================
send_notification() {
    local status=$1
    local message=$2
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        [ "$status" = "error" ] && color="danger"
        [ "$status" = "warning" ] && color="warning"
        
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"${color}\",
                    \"title\": \"Backup ${status}\",
                    \"text\": \"${message}\",
                    \"footer\": \"Dating App Backup\",
                    \"ts\": $(date +%s)
                }]
            }" > /dev/null
    fi
    
    # Email notification (using sendmail or similar)
    if [ -n "$NOTIFICATION_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "Backup ${status}: Dating App" "$NOTIFICATION_EMAIL"
    fi
}

# =============================================
# Full Backup
# =============================================
full_backup() {
    log "Starting full backup..."
    local start_time=$(date +%s)
    local backup_files=()
    local errors=0
    
    # MongoDB backup
    if mongo_backup=$(backup_mongodb); then
        backup_files+=("$mongo_backup")
        upload_to_s3 "$mongo_backup" "mongo/$(basename "$mongo_backup")"
    else
        ((errors++))
    fi
    
    # Redis backup
    if redis_backup=$(backup_redis); then
        backup_files+=("$redis_backup")
        upload_to_s3 "$redis_backup" "redis/$(basename "$redis_backup")"
    else
        ((errors++))
    fi
    
    # Verify backups
    for backup in "${backup_files[@]}"; do
        if ! verify_backup "$backup"; then
            ((errors++))
        fi
    done
    
    # Cleanup
    cleanup_old_backups
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Summary
    log "========================================="
    log "Backup Summary"
    log "========================================="
    log "Duration: ${duration} seconds"
    log "Files backed up: ${#backup_files[@]}"
    log "Errors: ${errors}"
    
    if [ "$errors" -gt 0 ]; then
        log_error "Backup completed with errors"
        send_notification "error" "Backup completed with ${errors} error(s). Duration: ${duration}s"
        exit 1
    else
        log_success "Full backup completed successfully!"
        send_notification "success" "Full backup completed successfully. Duration: ${duration}s. Files: ${#backup_files[@]}"
    fi
}

# =============================================
# Main Entry Point
# =============================================
main() {
    local backup_type=${1:-full}
    
    log "========================================="
    log "Dating App Backup Script"
    log "Backup Type: $backup_type"
    log "Timestamp: $TIMESTAMP"
    log "========================================="
    
    case "$backup_type" in
        full)
            full_backup
            ;;
        mongo)
            backup_mongodb
            ;;
        redis)
            backup_redis
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        *)
            echo "Usage: $0 [full|mongo|redis|cleanup]"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
