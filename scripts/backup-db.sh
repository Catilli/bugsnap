#!/bin/bash
# BugSnap Database Backup Script
# Usage: ./scripts/backup-db.sh [DATABASE_URL]
#
# Creates a timestamped pg_dump backup in the ./backups/ directory.
# The DATABASE_URL can be passed as an argument or set as an environment variable.
#
# Examples:
#   ./scripts/backup-db.sh
#   ./scripts/backup-db.sh "postgresql://user:pass@host:5432/bugsnap"
#
# Automated (cron):
#   0 3 * * * cd /path/to/bugsnap && ./scripts/backup-db.sh >> /var/log/bugsnap-backup.log 2>&1

set -euo pipefail

# Use argument or environment variable
DB_URL="${1:-${DATABASE_URL:-}}"

if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL is required."
  echo "Usage: $0 [DATABASE_URL]"
  echo "  or set DATABASE_URL environment variable"
  exit 1
fi

# Configuration
BACKUP_DIR="$(dirname "$0")/../backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/bugsnap_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database backup..."

# Run pg_dump and compress
if pg_dump "$DB_URL" --no-owner --no-acl --clean --if-exists | gzip > "$BACKUP_FILE"; then
  FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$(date)] Backup complete: $BACKUP_FILE ($FILESIZE)"
else
  echo "[$(date)] ERROR: Backup failed!"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Cleanup old backups
if [ -d "$BACKUP_DIR" ]; then
  DELETED=$(find "$BACKUP_DIR" -name "bugsnap_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
  if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] Cleaned up $DELETED backup(s) older than $RETENTION_DAYS days"
  fi
fi

echo "[$(date)] Backup process finished"
