#!/bin/bash
# BugSnap Database Restore Script
# Usage: ./scripts/restore-db.sh <backup_file> [DATABASE_URL]
#
# Restores a database from a compressed pg_dump backup.
#
# Examples:
#   ./scripts/restore-db.sh backups/bugsnap_20260205_030000.sql.gz
#   ./scripts/restore-db.sh backups/bugsnap_20260205_030000.sql.gz "postgresql://user:pass@host:5432/bugsnap"

set -euo pipefail

BACKUP_FILE="${1:-}"
DB_URL="${2:-${DATABASE_URL:-}}"

if [ -z "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file path is required."
  echo "Usage: $0 <backup_file> [DATABASE_URL]"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL is required."
  echo "Usage: $0 <backup_file> [DATABASE_URL]"
  echo "  or set DATABASE_URL environment variable"
  exit 1
fi

echo "WARNING: This will overwrite the current database!"
echo "  Backup file: $BACKUP_FILE"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo "[$(date)] Restoring database from $BACKUP_FILE..."

if gunzip -c "$BACKUP_FILE" | psql "$DB_URL" --quiet; then
  echo "[$(date)] Restore complete"
else
  echo "[$(date)] ERROR: Restore failed!"
  exit 1
fi
