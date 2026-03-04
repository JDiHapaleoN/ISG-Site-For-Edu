#!/usr/bin/env bash
set -e

# Load environment variables from .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$DIRECT_URL" ]; then
  echo "❌ DIRECT_URL is not set in .env. Cannot run backup."
  exit 1
fi

BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

DATETIME=$(date +"%Y-%m-%d_%H-%M-%S")
FILE_NAME="$BACKUP_DIR/db_backup_$DATETIME.sql.gz"

echo "📦 Starting database backup from DIRECT_URL..."

# Note: requires pg_dump to be installed
if command -v pg_dump > /dev/null; then
  pg_dump "$DIRECT_URL" | gzip > "$FILE_NAME"
  echo "✅ Backup successful: $FILE_NAME"
else
  echo "⚠️ pg_dump is not installed! Cannot create local backup."
  echo "For Supabase, daily backups are handled automatically in their Dashboard."
  exit 1
fi

# Retention policy: Delete backups older than 7 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -exec rm {} \;
echo "🧹 Cleaned up backups older than 7 days."
