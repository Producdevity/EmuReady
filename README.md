# EmuReady

A community-driven platform for tracking emulation compatibility across different devices and emulators.

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
- npm/yarn

### Installation

1. Clone the repository
2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
```

4. Run the development server

```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run dev:strict` - Start with React strict mode
- `npm run build` - Build for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Check TypeScript types
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run analyze` - Analyze bundle size
- `npm run clean` - Clean build cache
- `npm run prepare-deploy` - Prepare for deployment

## Tech Stack

- **Framework**: Next.js 15
- **Database ORM**: Prisma
- **API**: tRPC
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Type Checking**: TypeScript
- **Animation**: Framer Motion

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
