# EmuReady

A community-driven platform for tracking emulation compatibility across different devices and emulators.

Visit our website: [https://emuready.com](https://emuready.com)

<img width="1663" alt="screenshot emuready" src="https://github.com/user-attachments/assets/5dfe8c9b-d977-464f-b853-8d23066c3410" />

## Overview

EmuReady helps users share and discover emulation compatibility information across different hardware and software configurations. Users can contribute compatibility reports, vote on listings, and discuss specific game/device/emulator combinations.

![License](https://img.shields.io/github/license/Producdevity/emuready?cacheSeconds=1)
![Stars](https://img.shields.io/github/stars/Producdevity/emuready?cacheSeconds=1)
![Forks](https://img.shields.io/github/forks/Producdevity/emuready?cacheSeconds=1)
![Issues](https://img.shields.io/github/issues/Producdevity/emuready?cacheSeconds=1)

## Features

- **Comprehensive Compatibility Database**: Track how games perform on different emulators and devices
- **User Contributions**: Community-driven reports and voting system
- **Discussion System**: Comment threads with upvoting/downvoting functionality
- **Admin Dashboard**: Manage users, listings, and content moderation
- **Responsive Design**: Works on mobile, tablet, and desktop

## Recent Improvements

The codebase has been significantly improved with the following enhancements:

### UI Components

- Created an **ErrorBoundary** component for better error handling and recovery
- Added an **OptimizedImage** component using Next.js Image component for better performance
- Improved **Pagination** with accessibility features, keyboard navigation, and better UX
- Enhanced **Badge** component with more variants, sizes, and a pill option
- Added **ThemeToggle** component for switching between light, dark, and system themes
- Implemented **SortableHeader** for table sorting with visual indicators

### Caching & Performance

- Improved React Query configuration with better defaults for caching, stale times, and retry logic
- Added image optimization for device images
- Implemented proper error handling throughout the application

### Accessibility

- Enhanced keyboard navigation for interactive elements
- Added proper ARIA labels and roles
- Improved focus management
- Better color contrast in UI components

### Security

- Data validation and sanitization at multiple levels (client, server, database)
- Content Security Policy implementation
- Protection against XSS and CSRF attacks
- Secure authentication with NextAuth.js
- File upload validation and security measures
- Input length restrictions and proper sanitization
- UUID validation to prevent parameter tampering

### Developer Experience

- Added additional npm scripts for development workflow
- Better project structure with consistent exports
- Enhanced error feedback with custom ErrorBoundary
- Improved 404 page with helpful navigation options

### Theming

- Added system theme preference detection
- Created theme toggle with multiple UI options
- Improved dark mode implementation across components

## Getting Started

### Prerequisites

- Node.js 20+
- `npm`
- PostgreSQL (or SQLite for development)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/Producdevity/emuready.git
   cd emuready
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables

   ```bash
   cp .env.example .env
   ```

   Then edit the `.env` file with your database credentials and other configuration.

4. Setup the database

   ```bash
   npm run db:generate
   npm run db:push
   ```

5. Run the development server

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start the development server
- `npm run dev:strict` - Start with React strict mode
- `npm run build` - Build for production
- `npm run start` - Start the production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Check TypeScript types
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run analyze` - Analyze bundle size
- `npm run clean` - Clean build cache
- `npm run prepare-deploy` - Prepare for deployment (lint, typecheck, build)

## Tech Stack

- **Framework**: Next.js 15
- **Database ORM**: Prisma
- **API**: tRPC
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Type Checking**: TypeScript
- **Animation**: Framer Motion
- **Validation**: Zod, Content Security Policy, Input Validation

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Code of Conduct (TODO)

Please note that this project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

## Security (TODO)

If you discover a security vulnerability, please follow our [Security Policy](SECURITY.md) for reporting.

## Acknowledgements

- All our [Contributors](https://github.com/Producdevity/emuready/graphs/contributors)
- The emulation community for inspiration and support
