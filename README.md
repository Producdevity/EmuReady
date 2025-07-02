# EmuReady

A comprehensive community-driven platform for tracking emulation compatibility across different devices and emulators. Built with primary focus on user experience, privacy, security, and performance.

Visit our website: [https://emuready.com](https://emuready.com)

---

**Home Page Screenshot**

<img src="https://github.com/user-attachments/assets/9a7077fd-a9b1-4a1c-8a81-8f9beed25581" width="48%">&nbsp;&nbsp;&nbsp;<img src="https://github.com/user-attachments/assets/df612c7c-4b9d-481b-ae92-175b2b6afb0b" width="48%">

---

**Compatibility Listings Page Screenshot**

<img src="https://github.com/user-attachments/assets/400c48d4-6340-4a60-8d86-f996a35f1bf4" width="48%">&nbsp;&nbsp;&nbsp;<img src="https://github.com/user-attachments/assets/4ca1c1de-3616-4c25-81b9-ad80f8a69458" width="48%">

---

**Games Page Screenshot**

<img src="https://github.com/user-attachments/assets/b036de53-18ed-4bf4-8117-5cd36e87ee31" width="48%">&nbsp;&nbsp;&nbsp;<img src="https://github.com/user-attachments/assets/9fbe12c4-3387-4e1d-986a-df80761134e3" width="48%">

---

![CI](https://github.com/Producdevity/emuready/workflows/CI/badge.svg)
![License](https://img.shields.io/github/license/Producdevity/emuready?cacheSeconds=1)
![Stars](https://img.shields.io/github/stars/Producdevity/emuready?cacheSeconds=1)
![Forks](https://img.shields.io/github/forks/Producdevity/emuready?cacheSeconds=1)
![Issues](https://img.shields.io/github/issues/Producdevity/emuready?cacheSeconds=1)

## Overview

EmuReady is a modern, full-stack web application that helps users share and discover emulation compatibility information across different hardware and software configurations. The platform features a comprehensive admin system, community moderation tools, and advanced filtering capabilities for emulation compatibility data.

## Key Features

### 🎮 **Core Functionality**

- **Compatibility Listings**: Submit and browse game compatibility reports for specific device/emulator combinations
- **Advanced Search & Filtering**: Filter by system, device, emulator, performance, and custom criteria
- **Performance Tracking**: Standardized performance scales with visual indicators
- **Community Voting**: Upvote/downvote listings and comments for quality control
- **Custom Fields**: Dynamic emulator-specific fields (driver versions, settings, etc.)

### 👥 **Community Features**

- **User Profiles**: Track contributions, trust scores, and listing history
- **Comments System**: Threaded discussions on compatibility listings
- **Trust System**: Community-driven reputation scoring with automated bonuses
- **Verified Developers**: Special status for emulator developers and maintainers

### 🛡️ **Moderation & Security**

- **Multi-Level Admin System**: Super Admin → Admin → Moderator → Developer → Author → User
- **Reports System**: Users can report inappropriate content with admin review workflow
- **Shadow Banning**: Hide content from banned users without notification
- **Content Security**: Input validation, sanitization, and CSP implementation
- **Permission System**: Dynamic role-based access control with audit logging

### 📱 **Modern UX/UI**

- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Dark/Light Themes**: Automatic and manual theme switching
- **Progressive Web App**: Installable with offline capabilities
- **Virtual Scrolling**: High-performance rendering for large datasets
- **Modern Card Design**: Inspired by top design systems (Dribbble, Behance)
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### 🔧 **Admin Dashboard**

- **Comprehensive Management**: Games, systems, devices, emulators, users
- **Approval Workflows**: Review and approve user-submitted content
- **Analytics & Reporting**: Trust logs, permission logs, user statistics
- **Bulk Operations**: Efficient management of multiple items
- **Real-time Notifications**: System alerts and user reports

### 🚀 **Technical Features**

- **Type-Safe APIs**: Full-stack TypeScript with tRPC
- **Real-time Updates**: Live data synchronization
- **Image Optimization**: Next.js Image with progressive loading
- **Bundle Analysis**: Performance monitoring and optimization
- **Testing Suite**: Unit tests (Vitest) and E2E tests (Playwright)
- **CI/CD Pipeline**: Automated testing, linting, and deployment

## Architecture

### **Core Technology Stack**

- **Framework**: Next.js 15 with App Router and Turbopack
- **Database**: PostgreSQL with Prisma ORM
- **API**: tRPC for type-safe API calls with React Query caching
- **Authentication**: Clerk with enhanced RBAC system
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query + tRPC client-side state
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Deployment**: Vercel with edge functions

### **Database Schema**

- **Users**: Hierarchical role-based permissions and trust scoring
- **Games**: Tied to Systems (consoles/platforms) with RAWG API integration
- **Devices**: Hardware specifications (brands + models + SoCs)
- **Emulators**: Software emulators with custom field definitions
- **Listings**: Compatibility reports linking games, devices, and emulators
- **Community**: Comments, voting, and reporting systems
- **Moderation**: User bans, content reports, and approval workflows
- **Trust System**: Reputation scoring with action logging
- **Permission System**: Dynamic role and permission management

### **Key Systems**

#### **Reports & Moderation**

- User reporting with categorized reasons (spam, inappropriate content, etc.)
- Admin dashboard with filtering and bulk operations
- Shadow banning system
- Approval warnings for content from reported users

#### **Trust System**

- Community-driven reputation scoring
- Automated monthly bonuses for active users
- Action-based trust adjustments (upvotes, listings, etc.)
- Comprehensive audit logging

#### **Custom Fields System**

- Emulator-specific dynamic fields (text, textarea, boolean, select, range)
- Template system for reusable field configurations
- Runtime validation and form generation

#### **Permission System**

- Hierarchical role structure with cascading permissions
- Dynamic permission assignment and revocation
- Complete audit trail for security compliance

## Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** (latest)
- **PostgreSQL** 14+ (or Docker for local development)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Producdevity/emuready.git
cd emuready
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials and configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/emuready"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_key"
CLERK_SECRET_KEY="your_clerk_secret"

# External APIs
RAWG_API_KEY="your_rawg_api_key"

# Other configuration...
```

4. **Set up the database**

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. **Run the development server**

```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Available Scripts

### **Development**

- `npm run dev` - Start development server with Turbopack
- `npm run dev:strict` - Start with React strict mode enabled
- `npm run build` - Build for production
- `npm run start` - Start production server

### **Code Quality**

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Check TypeScript types
- `npm run check` - Run lint and typecheck together
- `npm run prepare-deploy` - Full deployment prep (format, lint, typecheck, test, build)

### **Testing**

- `npm run test` - Run unit tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ci` - Run tests for CI
- `npm run test:e2e` - Run Playwright end-to-end tests (TODO)

### **Database (Prisma)**

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma db seed` - Seed database with sample data
- `npx prisma studio` - Open Prisma Studio GUI
- `npx prisma migrate dev` - Create and apply migration
- `npx prisma migrate deploy` - Apply migrations in production

### **Bundle Analysis**

- `npm run analyze` - Analyze bundle size
- `npm run clean` - Clean build cache

## Contributing

Refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file for detailed development guidelines.

## License

This project is licensed under the **GPL-3.0-or-later** License - see the [LICENSE](LICENSE) file for details.

### **License Change Notice**

🛡️ **License Change**: As of June 18, 2024, EmuReady transitioned from MIT License to GNU General Public License v3.0 or later (GPL-3.0-or-later). This ensures the software remains free and open-source while preventing proprietary commercial reuse.

## Security

If you discover a security vulnerability, please:

1. **Do not** create a public issue
2. Direct message one of the maintainers on Discord
3. Follow responsible disclosure practices
4. Allow time for fixes before public disclosure

## Support

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/Producdevity/emuready/issues)
- **Discord**: [Join our community](https://discord.gg/YyWueNxmzM)
- **Discussions**: [GitHub Discussions](https://github.com/Producdevity/emuready/discussions)

## Acknowledgements

- **Contributors**: All our [amazing contributors](https://github.com/Producdevity/emuready/graphs/contributors)
- **Emulation Community**: For inspiration, feedback, and support
- **Open Source Projects**: The fantastic tools and libraries that make this possible
- **RAWG API & The Games DB**: For comprehensive game database integration

## Project Status

🚀 **Active Development** - EmuReady is actively maintained and continuously improved with new features, performance optimizations, and community-driven enhancements.

Check the [Release Notes](https://github.com/Producdevity/EmuReady/releases) for detailed changelogs and feature updates.
