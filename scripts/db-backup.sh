#!/bin/sh

# Get current date for backup filename
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/emuready_backup_$BACKUP_DATE.pgdump"
BACKUP_FILE_SQL="$BACKUP_DIR/emuready_backup_$BACKUP_DATE.sql"
BACKUP_FILE_DATA="$BACKUP_DIR/emuready_backup_$BACKUP_DATE.data.sql"
MAX_BACKUPS=10  # Maximum number of backups to keep

# Create backups directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Check if a specific PostgreSQL version is available
PG_VERSION=15  # Change this to match your server version if needed
if [ -d "/opt/homebrew/opt/postgresql@$PG_VERSION" ]; then
    echo "Using PostgreSQL $PG_VERSION from Homebrew..."
    export PATH="/opt/homebrew/opt/postgresql@$PG_VERSION/bin:$PATH"
elif [ -d "/usr/local/opt/postgresql@$PG_VERSION" ]; then
    echo "Using PostgreSQL $PG_VERSION from Homebrew..."
    export PATH="/usr/local/opt/postgresql@$PG_VERSION/bin:$PATH"
fi

# Use dotenv to load environment variables from .env.local
echo "Running database backup using .env.local configuration..."

# Check pg_dump version
PG_DUMP_VERSION=$(pg_dump --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
echo "Local pg_dump version: $PG_DUMP_VERSION"

# Run pg_dump through dotenv to use environment variables from .env.local
# Use the full connection string directly with pg_dump
dotenv -e .env.local -- sh -c '
    # Use DATABASE_DIRECT_URL if available, otherwise fallback to DATABASE_URL
    CONNECTION_URL=${DATABASE_DIRECT_URL:-$DATABASE_URL}
    
    # Remove any query parameters from the connection URL
    CLEAN_URL=$(echo $CONNECTION_URL | sed "s/\?.*//")
    
    echo "Attempting to backup database using direct connection string..."
    
    # Create both custom format and SQL format backups
    echo "Creating custom format backup..."
    pg_dump "$CLEAN_URL" -F c -f '"$BACKUP_FILE"' 2> /tmp/pg_dump_error
    
    if [ $? -eq 0 ]; then
        echo "Creating full SQL backup with schema..."
        pg_dump "$CLEAN_URL" --no-owner --no-privileges --column-inserts --schema=public --no-comments -f '"$BACKUP_FILE_SQL"' 2> /tmp/pg_dump_error_sql
        
        echo "Creating data-only SQL backup for existing databases..."
        pg_dump "$CLEAN_URL" --no-owner --no-privileges --column-inserts --schema=public --no-comments --data-only --disable-triggers -f /tmp/backup_raw.sql 2> /tmp/pg_dump_error_data
        
        if [ $? -eq 0 ]; then
            echo "Adding conflict resolution to SQL file..."
            # Convert only INSERT statements to INSERT ... ON CONFLICT DO NOTHING
            sed "s/^INSERT INTO \(.*\) VALUES \(.*\);$/INSERT INTO \1 VALUES \2 ON CONFLICT DO NOTHING;/g" /tmp/backup_raw.sql > '"$BACKUP_FILE_DATA"'
            rm -f /tmp/backup_raw.sql
        fi
        if [ $? -ne 0 ]; then
            echo "Data backup failed"
            cat /tmp/pg_dump_error_data
            rm -f /tmp/pg_dump_error_data
        else
            rm -f /tmp/pg_dump_error_data
        fi
        
        if [ $? -ne 0 ]; then
            echo "SQL backup failed, but custom format succeeded"
            cat /tmp/pg_dump_error_sql
            rm -f /tmp/pg_dump_error_sql
        else
            rm -f /tmp/pg_dump_error_sql
        fi
    fi
    
    # Check if the primary backup failed
    PRIMARY_EXIT_CODE=$?
    if [ $PRIMARY_EXIT_CODE -ne 0 ]; then
        # Check if it was a version mismatch error
        if grep -q "server version mismatch" /tmp/pg_dump_error; then
            SERVER_VERSION=$(grep "server version" /tmp/pg_dump_error | grep -oE "[0-9]+\.[0-9]+" | head -1)
            SERVER_MAJOR=$(echo $SERVER_VERSION | cut -d. -f1)
            echo "⚠️  Version mismatch detected: Server is PostgreSQL $SERVER_VERSION but your pg_dump is version '"$PG_DUMP_VERSION"'"
            echo "To fix this, you need to install PostgreSQL $SERVER_VERSION tools."
            echo ""
            echo "On macOS with Homebrew:"
            echo "  brew install postgresql@$SERVER_MAJOR"
            echo "  brew link --force postgresql@$SERVER_MAJOR"
            echo ""
            echo "On Ubuntu/Debian:"
            echo "  sudo apt-get install postgresql-client-$SERVER_MAJOR"
            echo ""
            echo "Then update PG_VERSION=$SERVER_MAJOR in this script."
            echo ""
            rm /tmp/pg_dump_error
            exit 1
        else
            cat /tmp/pg_dump_error
            rm /tmp/pg_dump_error
            exit 1
        fi
    fi
    
    rm -f /tmp/pg_dump_error
    exit 0
'

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Database backup completed successfully:"
    echo "   Custom format: $BACKUP_FILE ($(du -h $BACKUP_FILE | cut -f1))"
    if [ -f "$BACKUP_FILE_SQL" ]; then
        echo "   Full SQL: $BACKUP_FILE_SQL ($(du -h $BACKUP_FILE_SQL | cut -f1))"
    fi
    if [ -f "$BACKUP_FILE_DATA" ]; then
        echo "   Data-only SQL: $BACKUP_FILE_DATA ($(du -h $BACKUP_FILE_DATA | cut -f1))"
    fi
    echo ""
    echo "💡 For new databases: use the full .sql file"
    echo "💡 For existing databases: use the .data.sql file"
    
    # Clean up old backups - keep only the last MAX_BACKUPS of each type
    echo "Cleaning up old backups (keeping last $MAX_BACKUPS)..."
    
    # Clean up .pgdump files
    NUM_BACKUPS=$(ls -1 $BACKUP_DIR/emuready_backup_*.pgdump 2>/dev/null | wc -l)
    if [ $NUM_BACKUPS -gt $MAX_BACKUPS ]; then
        NUM_TO_DELETE=$((NUM_BACKUPS - MAX_BACKUPS))
        ls -1t $BACKUP_DIR/emuready_backup_*.pgdump | tail -n $NUM_TO_DELETE | xargs rm -f
        echo "Deleted $NUM_TO_DELETE old .pgdump backup(s)"
    fi
    
    # Clean up .sql files
    NUM_BACKUPS=$(ls -1 $BACKUP_DIR/emuready_backup_*.sql 2>/dev/null | wc -l)
    if [ $NUM_BACKUPS -gt $MAX_BACKUPS ]; then
        NUM_TO_DELETE=$((NUM_BACKUPS - MAX_BACKUPS))
        ls -1t $BACKUP_DIR/emuready_backup_*.sql | tail -n $NUM_TO_DELETE | xargs rm -f
        echo "Deleted $NUM_TO_DELETE old .sql backup(s)"
    fi
else
    echo "❌ Database backup failed"
    exit 1
fi 