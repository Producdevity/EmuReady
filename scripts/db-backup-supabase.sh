#!/bin/sh

# Supabase-compatible backup script
# Creates backups in formats that can be restored to Supabase

# Get current date for backup filename
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE_SQL="$BACKUP_DIR/supabase_backup_$BACKUP_DATE.sql"
MAX_BACKUPS=10  # Maximum number of backups to keep

# Create backups directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Check if a specific PostgreSQL version is available
PG_VERSION=15  # Supabase uses PostgreSQL 15
if [ -d "/opt/homebrew/opt/postgresql@$PG_VERSION" ]; then
    echo "Using PostgreSQL $PG_VERSION from Homebrew..."
    export PATH="/opt/homebrew/opt/postgresql@$PG_VERSION/bin:$PATH"
elif [ -d "/usr/local/opt/postgresql@$PG_VERSION" ]; then
    echo "Using PostgreSQL $PG_VERSION from Homebrew..."
    export PATH="/usr/local/opt/postgresql@$PG_VERSION/bin:$PATH"
else
    echo "⚠️  PostgreSQL $PG_VERSION not found, using system version"
fi

# Use dotenv to load environment variables from .env.local
echo "Creating Supabase-compatible backup using .env.local configuration..."

# Check pg_dump version
PG_DUMP_VERSION=$(pg_dump --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
echo "Local pg_dump version: $PG_DUMP_VERSION"

# Run pg_dump through dotenv to use environment variables from .env.local
dotenv -e .env.local -- sh -c '
    # Use DATABASE_DIRECT_URL if available, otherwise fallback to DATABASE_URL
    CONNECTION_URL=${DATABASE_DIRECT_URL:-$DATABASE_URL}
    
    # Remove any query parameters from the connection URL
    CLEAN_URL=$(echo $CONNECTION_URL | sed "s/\?.*//")
    
    echo "Creating Supabase-compatible SQL backup..."
    
    # Create a comprehensive SQL backup that Supabase can restore
    # Using --no-owner and --no-privileges to avoid permission issues
    # Using --if-exists for DROP statements
    # Using --create to include database creation
    # Using --clean to add DROP statements
    pg_dump "$CLEAN_URL" \
        --no-owner \
        --no-privileges \
        --no-comments \
        --schema=public \
        --quote-all-identifiers \
        --no-tablespaces \
        --no-unlogged-table-data \
        --disable-dollar-quoting \
        --column-inserts \
        --disable-triggers \
        --if-exists \
        --clean \
        -f '"$BACKUP_FILE_SQL"' 2> /tmp/pg_dump_error
    
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -ne 0 ]; then
        echo "❌ Backup failed:"
        cat /tmp/pg_dump_error
        rm -f /tmp/pg_dump_error
        exit 1
    fi
    
    rm -f /tmp/pg_dump_error
    
    # Verify the backup file was created
    if [ ! -f '"$BACKUP_FILE_SQL"' ]; then
        echo "❌ Backup file was not created"
        exit 1
    fi
    
    # Check backup file size
    BACKUP_SIZE=$(du -h '"$BACKUP_FILE_SQL"' | cut -f1)
    echo "✅ Backup created: '"$BACKUP_FILE_SQL"' ($BACKUP_SIZE)"
    
    # Create a quick verification of content
    echo ""
    echo "📊 Backup content summary:"
    echo "  Tables: $(grep -c "CREATE TABLE" '"$BACKUP_FILE_SQL"' || echo "0")"
    echo "  Indexes: $(grep -c "CREATE INDEX" '"$BACKUP_FILE_SQL"' || echo "0")"
    echo "  Constraints: $(grep -c "ADD CONSTRAINT" '"$BACKUP_FILE_SQL"' || echo "0")"
    echo "  Total lines: $(wc -l < '"$BACKUP_FILE_SQL"')"
    
    exit 0
'

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Supabase-compatible backup completed successfully!"
    echo "   File: $BACKUP_FILE_SQL"
    echo ""
    echo "💡 To restore this backup to Supabase:"
    echo "   1. Go to Supabase Dashboard > Database > Backups"
    echo "   2. Use SQL Editor to run the backup file"
    echo "   3. Or use: psql <connection-string> < $BACKUP_FILE_SQL"
    
    # Clean up old backups - keep only the last MAX_BACKUPS
    echo ""
    echo "Cleaning up old backups (keeping last $MAX_BACKUPS)..."
    
    NUM_BACKUPS=$(ls -1 $BACKUP_DIR/supabase_backup_*.sql 2>/dev/null | wc -l)
    if [ $NUM_BACKUPS -gt $MAX_BACKUPS ]; then
        NUM_TO_DELETE=$((NUM_BACKUPS - MAX_BACKUPS))
        ls -1t $BACKUP_DIR/supabase_backup_*.sql | tail -n $NUM_TO_DELETE | xargs rm -f
        echo "Deleted $NUM_TO_DELETE old backup(s)"
    fi
else
    echo "❌ Backup failed"
    exit 1
fi