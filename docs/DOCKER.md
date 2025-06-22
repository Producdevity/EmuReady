# Docker Development Setup for EmuReady

This guide shows you how to get EmuReady running on your local machine using Docker. This is the recommended way for contributors as it provides a consistent development environment with minimal setup.

## 🚀 Quick Start (5 minutes!)

### Prerequisites

1. **Docker** installed on your machine
   - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Ensure Docker is running

2. **Git** to clone the repository

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/Producdevity/emuready.git
cd emuready

# Start development environment
./scripts/docker-dev.sh
```

That's it! 🎉 

The script will:
- Create your environment configuration file
- Start PostgreSQL database
- Build and run the Next.js application
- Run database migrations and seed data
- Open the app at http://localhost:3000

## 📋 What You Get

When you run the Docker setup, you'll have:

- ✅ **Next.js app** running at http://localhost:3000
- ✅ **Prisma Studio** running at http://localhost:5555 (database admin interface)
- ✅ **PostgreSQL database** with sample data
- ✅ **Hot reload** for development
- ✅ **Persistent data** (your changes survive restarts)
- ✅ **One-time seeding** (only runs on first setup, not every restart)
- ✅ **Test users** ready to use (see [Test Users](#test-users))
- ✅ **File uploads** working correctly
- ✅ **All environment dependencies** managed automatically

## 🔧 Configuration

### Environment Variables

On first run, the script creates `.env.docker` from the template. You'll need to configure:

**Required for basic functionality:**
```env
# Get these from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_key"
CLERK_SECRET_KEY="sk_test_your_key"
```

**Optional (for full functionality):**
```env
# External APIs
RAWG_API_KEY="your_rawg_key"                    # Game data
THE_GAMES_DB_API_KEY="your_tgdb_key"           # Game images

# For webhook testing (Clerk auth)
TUNNEL_TOKEN="your_cloudflare_tunnel_token"    # Cloudflare tunnel
```

### Getting API Keys

1. **Clerk (Authentication)** - Required
   - Sign up at [Clerk Dashboard](https://dashboard.clerk.com)
   - Create a new application
   - Copy the publishable and secret keys
   - See [Clerk Setup Guide](../CLERK_SETUP.md) for details

2. **RAWG (Game Data)** - Optional but recommended
   - Get free API key at [RAWG.io](https://rawg.io/apidocs)

3. **TGDB (Game Images)** - Optional
   - Get free API key at [TheGamesDB.net](https://thegamesdb.net/)

4. **Cloudflare Tunnel** - Required for webhook testing
   - Follow the webhook setup section below to get your tunnel token

## 🧪 Test Users

The Docker setup includes pre-seeded test users:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `superadmin@emuready.com` | `DevPassword123!` | SUPER_ADMIN | Full system access |
| `admin@emuready.com` | `DevPassword123!` | ADMIN | Admin panel access |
| `author@emuready.com` | `DevPassword123!` | AUTHOR | Content creation |
| `user@emuready.com` | `DevPassword123!` | USER | Standard user |

## 🔌 Webhook Support (Optional)

For testing Clerk webhooks (user creation/deletion), you can enable the webhook tunnel:

### Setup Cloudflare Tunnel

1. **Create tunnel** (if you don't have one):
   ```bash
   # Install cloudflared
   # macOS:
   brew install cloudflared
   
   # Login to Cloudflare
   cloudflared tunnel login
   
   # Create tunnel
   cloudflared tunnel create emuready-tunnel
   ```

2. **Get tunnel token**:
   ```bash
   cloudflared tunnel token emuready-tunnel
   ```

3. **Add token to environment**:
   ```env
   # Add this to .env.docker
   TUNNEL_TOKEN="your_tunnel_token_here"
   ```

4. **Start with webhooks**:
   ```bash
   ./scripts/docker-dev.sh webhooks
   ```

### Configure Clerk Webhooks

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Webhooks
2. Add endpoint: `https://emuready-tunnel.your-subdomain.trycloudflare.com/api/webhooks/clerk`
3. Subscribe to: `user.created`, `user.updated`, `user.deleted`
4. Copy webhook secret to `.env.docker` as `CLERK_WEBHOOK_SECRET`

## 🌐 **Accessing Your Application**

Once Docker is running, access your application at:

- **🎮 Main Application**: http://localhost:3000
- **🔍 Prisma Studio**: http://localhost:5555 (runs automatically)
- **📊 Database Admin (pgAdmin)**: http://localhost:5050 (when enabled)

## 📋 **Viewing Logs (Your New `npm run dev`)**

To see real-time application logs (equivalent to `npm run dev` terminal output):

```bash
./scripts/docker-dev.sh logs        # All application logs
./scripts/docker-dev.sh logs app    # App-specific logs only
./scripts/docker-dev.sh logs postgres # Database logs
```

## 💻 **Running Commands Inside Containers**

### Interactive Shell Access
```bash
# Get a shell inside the app container
docker exec -it emuready-app sh

# Now you can run any command:
npm install leftpad
npm run test
npm run typecheck
npm run lint
npx playwright test
```

### Or by executing them directly
```bash
# Run tests
docker exec emuready-app npm run test

# Install a new package
docker exec emuready-app npm install package-name

# Run TypeScript checks
docker exec emuready-app npm run typecheck

# Run linting
docker exec emuready-app npm run lint

# Run Playwright tests
docker exec emuready-app npx playwright test
```

## 🛠 Development Commands

The `./scripts/docker-dev.sh` script provides several useful commands:

### Basic Commands
```bash
# Start development environment
./scripts/docker-dev.sh start

# Restart just the Next.js app (keep database running)
./scripts/docker-dev.sh restart

# Start with webhook support
./scripts/docker-dev.sh webhooks

# Stop all services
./scripts/docker-dev.sh stop

# View logs
./scripts/docker-dev.sh logs
./scripts/docker-dev.sh logs postgres      # database logs
./scripts/docker-dev.sh logs prisma-studio # Prisma Studio logs
```

### Database Commands
```bash
# Run new migrations
./scripts/docker-dev.sh migrate

# Seed database with test data (manual)
./scripts/docker-dev.sh seed

# Force reseed database (removes seed flag and reseeds)
./scripts/docker-dev.sh reseed

# Reset database (destructive!)
./scripts/docker-dev.sh reset-db

# Open database admin interface
./scripts/docker-dev.sh db-admin
```

### Maintenance Commands
```bash
# Show service status and URLs
./scripts/docker-dev.sh status

# Clean everything (no, seriously. everything.)
./scripts/docker-dev.sh clean

# Show help
./scripts/docker-dev.sh help
```

## 📊 Database Management

### Database Admin Interfaces

**The Docker setup uses local PostgreSQL** instead of Supabase for development and provides two admin interfaces:

#### Prisma Studio (Recommended)
Access the modern database admin interface at http://localhost:5555:
- **Automatically starts** with the development environment
- **Visual schema explorer** and data editor
- **Real-time updates** and easy data manipulation
- No additional configuration required

#### pgAdmin (Alternative)
Access the traditional database admin interface at http://localhost:5050:
- **Email**: `admin@emuready.dev`
- **Password**: `admin`

To connect to the database in pgAdmin:
- **Host**: `postgres`
- **Port**: `5432`
- **Database**: `emuready_dev`
- **Username**: `emuready`
- **Password**: `emuready_dev_password`

### Database Seeding Behavior
🎯 **Smart seeding system**:
- **First run**: Database is automatically seeded with test data
- **Subsequent runs**: Seeding is skipped (faster startups)
- **Force reseed**: Use `./scripts/docker-dev.sh reseed` to reseed manually
- **Reset**: Use `./scripts/docker-dev.sh reset-db` to start fresh

### Database Safety
🔒 **Your remote/production databases are completely safe!**
- Docker only uses local containers
- `./scripts/docker-dev.sh clean` only removes local Docker data
- No connection to remote Supabase or production databases

## 🐛 Troubleshooting

### Port Conflicts
If port 3000 is busy:
```bash
# Check what's using the port
lsof -i :3000

# Stop the conflicting service or change Docker ports
# Edit docker-compose.yml and change "3000:3000" to "3001:3000"
```

### Permission Issues
If you get permission errors:
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x scripts/docker-dev.sh
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres

# View database logs
./scripts/docker-dev.sh logs postgres
```

### Build Issues
```bash
# Clean Docker cache
docker system prune -a

# Rebuild everything
./scripts/docker-dev.sh clean
./scripts/docker-dev.sh start
```

### Environment Issues
```bash
# Recreate environment file
rm .env.docker
./scripts/docker-dev.sh start  # Will recreate from template
```

## 🆚 Docker vs Manual Setup

| Aspect | Docker Setup | Manual Setup |
|--------|--------------|--------------|
| **Setup Time** | ~5 minutes | ~15-30 minutes |
| **Dependencies** | Only Docker needed | Node.js, PostgreSQL, etc. |
| **Consistency** | Same on all machines | Varies by system |
| **Isolation** | Containerized | Uses local system |
| **Database** | Automatic PostgreSQL | Manual setup required |
| **Hot Reload** | ✅ Yes | ✅ Yes |
| **Performance** | Slightly slower | Native speed |

## 📁 File Structure

Docker creates the following persistent volumes:

```
emuready/
├── public/uploads/     # File uploads (persistent)
├── .env.docker         # Your environment config
├── docker-compose.yml  # Service configuration
├── Dockerfile          # App container definition
└── scripts/
    └── docker-dev.sh   # Development helper
```

## 🔄 Switching Between Setups

You can use both Docker and manual setup on the same project:

**Switch to Docker:**
```bash
# Stop manual services
# Start Docker
./scripts/docker-dev.sh start
```

**Switch to Manual:**
```bash
# Stop Docker
./scripts/docker-dev.sh stop

# Start manual setup
npm run dev
```

The setups use different databases and won't conflict.

## 🤝 Contributing

When contributing:

1. **Use Docker** for development (recommended)
2. **Include environment variables** in `.env.docker.example` for new features
3. **Update this documentation** if you change the Docker setup

## 🔗 Related Documentation

- [Manual Setup Guide](../CONTRIBUTING.md)
- [Clerk Authentication Setup](../CLERK_SETUP.md) 
- [Development Setup](DEVELOPMENT_SETUP.md)
- [Webhook Configuration](../CLERK_WEBHOOKS_SETUP.md)

## 💡 Tips

- **Use the helper script**: `./scripts/docker-dev.sh` handles most tasks
- **Check service status**: Use `./scripts/docker-dev.sh status` to see all running services and URLs
- **Keep `.env.docker`**: It's gitignored but stores your personal config
- **Monitor logs**: Use `./scripts/docker-dev.sh logs [service]` to debug issues
- **Database persistence**: Your data survives container restarts
- **Hot reload works**: No need to restart containers when editing code
- **Prisma Studio**: Access your database visually at http://localhost:5555 (starts automatically)
- **Smart seeding**: Only runs once on first setup, use `reseed` command to reseed manually

## 🆘 Need Help?

1. Try out the manual [Local Development](../CONTRIBUTING.md) approach.
2. Look at existing [GitHub Issues](https://github.com/Producdevity/emuready/issues)
3. Create a new issue with:
   - Your OS and Docker version
   - Error messages or logs
   - Steps you tried

---

Happy coding! 🚀 
