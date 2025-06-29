#!/bin/sh

# Get current date for backup filename
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/emuready_backup_$BACKUP_DATE.sql"
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
    
    # Run pg_dump with the full connection string
    pg_dump "$CLEAN_URL" -F c -f '"$BACKUP_FILE"' 2> /tmp/pg_dump_error
    
    # Check if there was an error
    if [ $? -ne 0 ]; then
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
    echo "✅ Database backup completed successfully: $BACKUP_FILE"
    echo "Backup size: $(du -h $BACKUP_FILE | cut -f1)"
    
    # Clean up old backups - keep only the last MAX_BACKUPS
    echo "Cleaning up old backups (keeping last $MAX_BACKUPS)..."
    NUM_BACKUPS=$(ls -1 $BACKUP_DIR/emuready_backup_*.sql 2>/dev/null | wc -l)
    if [ $NUM_BACKUPS -gt $MAX_BACKUPS ]; then
        NUM_TO_DELETE=$((NUM_BACKUPS - MAX_BACKUPS))
        ls -1t $BACKUP_DIR/emuready_backup_*.sql | tail -n $NUM_TO_DELETE | xargs rm -f
        echo "Deleted $NUM_TO_DELETE old backup(s)"
    fi
else
    echo "❌ Database backup failed"
    exit 1
fi 