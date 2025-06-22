# EmuReady

A community-driven platform for tracking emulation compatibility across different devices and emulators.

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

## Overview

EmuReady helps users share and discover emulation compatibility information across different hardware and software configurations. Users can contribute compatibility reports, vote on listings, and discuss specific game/device/emulator combinations.

![CI](https://github.com/Producdevity/emuready/workflows/CI/badge.svg)
![License](https://img.shields.io/github/license/Producdevity/emuready?cacheSeconds=1)
![Stars](https://img.shields.io/github/stars/Producdevity/emuready?cacheSeconds=1)
![Forks](https://img.shields.io/github/forks/Producdevity/emuready?cacheSeconds=1)
![Issues](https://img.shields.io/github/issues/Producdevity/emuready?cacheSeconds=1)

## Features

Check the [Release Notes](https://github.com/Producdevity/EmuReady/releases) for detailed changelogs.

## Getting Started

### Prerequisites

- Node.js 20+
- `npm`
- PostgreSQL (or SQLite/Supabase-local for development)

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
npx prisma generate
npx prisma db push
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
- `npm run analyze` - Analyze bundle size
- `npm run clean` - Clean build cache
- `npm run prepare-deploy` - Prepare for deployment (lint, typecheck, test, build)

### Prisma Command

- `npx prisma db seed` - Seed the database
- `npx prisma studio` - Open Prisma Studio
- `npx prisma db pull` - Pull the database schema
- `npx prisma db push` - Push the database schema

See [Prisma Cli Reference](https://www.prisma.io/docs/orm/reference/prisma-cli-reference) for more details.

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

## License Change Notice

🛡️ License Change: As of June 18, 2024, EmuReady has transitioned from the `MIT License` to the GNU General Public License v3.0 or later (`GPL-3.0-or-later`).
This change is made to ensure that the software remains free and open-source while preventing proprietary commercial reuse.
For more details, please refer to the [LICENSE](LICENSE) file.

## Code of Conduct (TODO)

Please note that this project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

## Security (TODO)

If you discover a security vulnerability, please follow our [Security Policy](SECURITY.md) for reporting.

## Support

If you have any questions or want to reach out for anything else, please open an issue on GitHub or join our [Discord server](https://discord.gg/YyWueNxmzM).

## Acknowledgements

- All our [Contributors](https://github.com/Producdevity/emuready/graphs/contributors)
- The emulation community for inspiration and support
