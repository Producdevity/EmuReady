#!/bin/bash

# EmuReady Docker Development Helper Script
# Usage: ./scripts/docker-dev.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[EMUREADY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.docker exists
check_env_file() {
    if [ ! -f ".env.docker" ]; then
        print_warning ".env.docker file not found!"
        print_status "Creating .env.docker from template..."
        cp env.docker.example .env.docker
        print_warning "Please edit .env.docker with your actual configuration values"
        print_status "At minimum, you need to set:"
        echo "  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
        echo "  - CLERK_SECRET_KEY"
        echo "  - RAWG_API_KEY (optional)"
        echo "  - TGDB_API_KEY (optional)"
        echo ""
        read -pr "Press Enter once you've configured .env.docker..."
    fi
}

# Start the development environment
start_dev() {
    print_status "Starting EmuReady development environment..."
    check_env_file

    print_status "Building and starting services..."
    docker compose up --build -d postgres

    print_status "Waiting for database to be ready..."
    sleep 5

    print_status "Starting application and Prisma Studio..."
    docker compose up --build app prisma-studio
}

# Start with webhooks (including cloudflared tunnel)
start_webhooks() {
    print_status "Starting EmuReady with webhook support..."
    check_env_file

    if ! grep -q "TUNNEL_TOKEN=" .env.docker || grep -q "TUNNEL_TOKEN=\"\"" .env.docker; then
        print_error "TUNNEL_TOKEN not set in .env.docker"
        print_status "You need to:"
        echo "  1. Set up a Cloudflare tunnel"
        echo "  2. Get the tunnel token"
        echo "  3. Add it to .env.docker as TUNNEL_TOKEN"
        echo ""
        echo "See docs/DOCKER.md for detailed instructions"
        exit 1
    fi

    print_status "Building and starting all services including webhooks..."
    docker compose --profile webhooks up --build
}

# Stop all services
stop() {
    print_status "Stopping EmuReady services..."
    docker compose down
    print_success "Services stopped"
}

# Restart just the app service
restart() {
    print_status "Restarting Next.js app service..."
    docker compose restart app
    print_success "App service restarted"
    print_status "App available at: http://localhost:3000"
}

# Stop and remove everything (including volumes)
clean() {
    print_warning "This will remove all data including the database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping and removing all containers, volumes, and networks..."
        docker compose down -v --remove-orphans
        docker system prune -f
        print_success "Environment cleaned"
    else
        print_status "Cancelled"
    fi
}

# Show logs
logs() {
    service=${2:-app}
    print_status "Showing logs for $service..."
    docker compose logs -f "$service"
}

# Run database migrations
migrate() {
    print_status "Running database migrations..."
    docker compose exec app npx prisma migrate dev
    print_success "Migrations completed"
}

# Seed the database
seed() {
    print_status "Seeding database..."
    docker compose exec app npx prisma db seed
    print_success "Database seeded"
}

# Force reseed by removing the flag file
reseed() {
    print_status "Removing seed flag and reseeding database..."
    docker compose exec app rm -f .setup/seeded
    docker compose exec app npx prisma db seed
    docker compose exec app touch .setup/seeded
    print_success "Database reseeded"
}

# Reset database
reset_db() {
    print_warning "This will reset the database and lose all data!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Resetting database..."
        docker compose exec app npx prisma migrate reset --force
        docker compose exec app rm -f .setup/seeded
        print_success "Database reset"
    else
        print_status "Cancelled"
    fi
}

# Open database admin
db_admin() {
    print_status "Starting pgAdmin..."
    docker compose --profile tools up -d pgadmin
    print_success "pgAdmin started at http://localhost:5050"
    print_status "Login: admin@emuready.dev / admin"
}

# Show service status
status() {
    print_status "Service status:"
    docker compose ps
    echo ""
    print_status "Available services:"
    echo "  🚀 App: http://localhost:3000"
    echo "  📊 Prisma Studio: http://localhost:5555"
    echo "  🗄️  pgAdmin: http://localhost:5050 (if enabled)"
}

# Show help
show_help() {
    echo "EmuReady Docker Development Helper"
    echo ""
    echo "Usage: ./scripts/docker-dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start development environment (default)"
    echo "  webhooks    Start with webhook support (cloudflared tunnel)"
    echo "  restart     Restart just the Next.js app (keep DB running)"
    echo "  stop        Stop all services"
    echo "  clean       Stop and remove everything (including data)"
    echo "  status      Show service status and URLs"
    echo "  logs [svc]  Show logs (default: app, options: app, prisma-studio, postgres)"
    echo "  migrate     Run database migrations"
    echo "  seed        Seed the database (manual)"
    echo "  reseed      Force reseed the database"
    echo "  reset-db    Reset database (destructive)"
    echo "  db-admin    Start pgAdmin database interface"
    echo "  help        Show this help"
    echo ""
    echo "Examples:"
    echo "  ./scripts/docker-dev.sh                    # Start development"
    echo "  ./scripts/docker-dev.sh restart            # Restart just the app"
    echo "  ./scripts/docker-dev.sh webhooks           # Start with webhooks"
    echo "  ./scripts/docker-dev.sh logs prisma-studio # Show Prisma Studio logs"
    echo "  ./scripts/docker-dev.sh status             # Show all service URLs"
    echo ""
    echo "Services:"
    echo "  🖥️ App:           http://localhost:3000"
    echo "  🔍 Prisma Studio: http://localhost:5555  (runs automatically)"
    echo "  🗄️ pgAdmin:       http://localhost:5050  (use 'db-admin' command)"
}

# Main command handler
case "${1:-start}" in
"start")
    start_dev
    ;;
"webhooks")
    start_webhooks
    ;;
"restart")
    restart
    ;;
"stop")
    stop
    ;;
"clean")
    clean
    ;;
"status")
    status
    ;;
"logs")
    logs "$@"
    ;;
"migrate")
    migrate
    ;;
"seed")
    seed
    ;;
"reseed")
    reseed
    ;;
"reset-db")
    reset_db
    ;;
"db-admin")
    db_admin
    ;;
"help" | "-h" | "--help")
    show_help
    ;;
*)
    print_error "Unknown command: $1"
    show_help
    exit 1
    ;;
esac
