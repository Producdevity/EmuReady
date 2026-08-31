#!/bin/sh

set -u

BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_SCHEMA="${BACKUP_SCHEMA:-public}"
PG_VERSION="${PG_VERSION:-15}"

BACKUP_FILE="$BACKUP_DIR/emuready_backup_$BACKUP_DATE.pgdump"
SHA_FILE="$BACKUP_FILE.sha256"
LOG_FILE="$BACKUP_DIR/emuready_backup_$BACKUP_DATE.log"
TMP_BACKUP_FILE="$BACKUP_DIR/.emuready_backup_$BACKUP_DATE.pgdump.tmp"
TMP_ERROR_FILE="$BACKUP_DIR/.emuready_backup_$BACKUP_DATE.log.tmp"

usage() {
    cat <<'USAGE'
Usage:
  pnpm run db:backup -- '<direct-postgres-connection-string>'

Required connection:
  Use Supabase's Direct connection string:
  postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres

Do not use:
  - Supabase transaction pooler URLs on port 6543
  - Supabase session pooler URLs on pooler.supabase.com
  - URLs containing pgbouncer=true

Supabase Dashboard:
  Project -> Connect -> Direct connection
USAGE
}

fail() {
    echo "❌ $1"

    if [ -s "$TMP_ERROR_FILE" ]; then
        mv "$TMP_ERROR_FILE" "$LOG_FILE"
        echo "Log: $LOG_FILE"
    else
        rm -f "$TMP_ERROR_FILE"
    fi

    rm -f "$TMP_BACKUP_FILE"
    exit 1
}

if [ "$#" -ne 1 ]; then
    if [ "$#" -gt 0 ] && [ "$1" = "--" ]; then
        shift
    fi
fi

if [ "$#" -ne 1 ]; then
    echo "❌ Missing required direct Postgres connection string."
    echo ""
    usage
    exit 2
fi

CONNECTION_URL="$1"

case "$CONNECTION_URL" in
    *".pooler.supabase.com:"*)
        echo "❌ Refusing Supabase pooler connection."
        echo ""
        echo "Use the Direct connection string instead:"
        echo "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
        exit 2
        ;;
esac

case "$CONNECTION_URL" in
    *":6543/"*)
        echo "❌ Refusing transaction-pooler port 6543."
        echo ""
        echo "Use a direct Postgres host on port 5432 for pg_dump."
        exit 2
        ;;
esac

case "$CONNECTION_URL" in
    *"pgbouncer=true"*)
        echo "❌ Refusing pgbouncer=true connection string."
        echo ""
        echo "Use a direct Postgres connection string for pg_dump."
        exit 2
        ;;
esac

mkdir -p "$BACKUP_DIR" || {
    echo "❌ Could not create backup directory: $BACKUP_DIR"
    exit 1
}

if [ -d "/opt/homebrew/opt/postgresql@$PG_VERSION" ]; then
    echo "Using PostgreSQL $PG_VERSION from Homebrew..."
    export PATH="/opt/homebrew/opt/postgresql@$PG_VERSION/bin:$PATH"
elif [ -d "/usr/local/opt/postgresql@$PG_VERSION" ]; then
    echo "Using PostgreSQL $PG_VERSION from Homebrew..."
    export PATH="/usr/local/opt/postgresql@$PG_VERSION/bin:$PATH"
fi

command -v pg_dump >/dev/null 2>&1 || fail "pg_dump is not available"
command -v pg_restore >/dev/null 2>&1 || fail "pg_restore is not available"

rm -f "$TMP_BACKUP_FILE" "$TMP_ERROR_FILE"
touch "$TMP_ERROR_FILE" || fail "Could not create backup log"

{
    echo "Started: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "pg_dump: $(pg_dump --version)"
    echo "schema: $BACKUP_SCHEMA"
    echo "format: custom"
} >> "$TMP_ERROR_FILE"

echo "Running database backup with explicit direct connection string..."
echo "Local pg_dump version: $(pg_dump --version)"
echo "Schema: $BACKUP_SCHEMA"

PGSSLMODE="${PGSSLMODE:-require}" \
PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-30}" \
PGAPPNAME="${PGAPPNAME:-emuready_db_backup}" \
pg_dump "$CONNECTION_URL" \
    --format=custom \
    --schema="$BACKUP_SCHEMA" \
    --no-owner \
    --no-privileges \
    --no-comments \
    --file="$TMP_BACKUP_FILE" \
    2>> "$TMP_ERROR_FILE" || fail "pg_dump failed"

[ -s "$TMP_BACKUP_FILE" ] || fail "Backup file was not created or is empty"

echo "Verifying backup can be fully read by pg_restore..."
pg_restore --schema="$BACKUP_SCHEMA" --file=/dev/null "$TMP_BACKUP_FILE" 2>> "$TMP_ERROR_FILE" \
    || fail "Backup verification failed"

mv "$TMP_BACKUP_FILE" "$BACKUP_FILE" || fail "Could not finalize backup file"

if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$BACKUP_FILE" > "$SHA_FILE"
fi

{
    echo "Completed: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "backup: $BACKUP_FILE"
} >> "$TMP_ERROR_FILE"

mv "$TMP_ERROR_FILE" "$LOG_FILE"

echo "✅ Database backup completed and verified:"
echo "   Custom format: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
[ -f "$SHA_FILE" ] && echo "   SHA-256: $SHA_FILE"
echo "   Log: $LOG_FILE"
echo "   Cleanup: skipped; old backups are never deleted by this script"
