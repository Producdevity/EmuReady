<div align="center">

# EmuReady

<p align="center">
  <strong>Community-maintained emulation compatibility platform.</strong>
</p>

<p align="center">
  <a href="https://www.emuready.com">
    <img src="https://img.shields.io/badge/🌐_Visit-EmuReady.com-blue?style=for-the-badge" alt="Visit EmuReady">
  </a>
  <a href="https://discord.gg/CYhCzApXav">
    <img src="https://img.shields.io/badge/Discord-Join_Community-7289DA?style=for-the-badge&logo=discord&logoColor=white" alt="Discord">
  </a>
</p>

<p align="center">
  <!-- Build & Deploy -->
  <a href="https://github.com/Producdevity/emuready/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/Producdevity/emuready/ci.yml?style=flat-square&logo=github&label=CI/CD" alt="CI/CD Status">
  </a>
  <a href="https://vercel.com">
    <img src="https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel" alt="Deployed on Vercel">
  </a>
  <!-- Code Quality -->
  <a href="https://github.com/Producdevity/emuready/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Producdevity/emuready?style=flat-square&label=License" alt="License">
  </a>
  <a href="https://github.com/Producdevity/emuready/search?l=typescript">
    <img src="https://img.shields.io/github/languages/top/Producdevity/emuready?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  </a>
</p>

<p align="center">
  <!-- Community -->
  <a href="https://github.com/Producdevity/emuready/stargazers">
    <img src="https://img.shields.io/github/stars/Producdevity/emuready?style=flat-square&logo=github" alt="GitHub Stars">
  </a>
  <a href="https://github.com/Producdevity/emuready/network/members">
    <img src="https://img.shields.io/github/forks/Producdevity/emuready?style=flat-square&logo=github" alt="GitHub Forks">
  </a>
  <a href="https://github.com/Producdevity/emuready/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/Producdevity/emuready?style=flat-square" alt="Contributors">
  </a>
  <a href="https://github.com/Producdevity/emuready/issues">
    <img src="https://img.shields.io/github/issues/Producdevity/emuready?style=flat-square" alt="Open Issues">
  </a>
</p>

<p align="center">
  <!-- Tech Stack -->
  <a href="https://nextjs.org">
    <img src="https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js" alt="Next.js">
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  </a>
  <a href="https://tailwindcss.com">
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  </a>
  <a href="https://www.prisma.io">
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma" alt="Prisma">
  </a>
</p>

<p align="center">
  <!-- Project Stats -->
  <img src="https://img.shields.io/github/repo-size/Producdevity/emuready?style=flat-square&label=Repo%20Size" alt="Repo Size">
  <img src="https://img.shields.io/github/last-commit/Producdevity/emuready?style=flat-square&label=Last%20Commit" alt="Last Commit">
  <img src="https://img.shields.io/github/commit-activity/m/Producdevity/emuready?style=flat-square&label=Commits" alt="Commit Activity">
  <a href="https://github.com/Producdevity/emuready/releases">
    <img src="https://img.shields.io/github/v/release/Producdevity/emuready?style=flat-square&label=Release" alt="Release">
  </a>
</p>

</div>

---

EmuReady is a community-driven platform for tracking how games run across emulators, handhelds, mobile hardware, and PC configurations. Users can share
compatibility reports, compare setups, discuss results, and help keep the catalog useful through voting and moderation.

Production site: [www.emuready.com](https://www.emuready.com)

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

## What You Can Do

- Browse compatibility reports by game, platform, hardware, emulator, and performance.
- Submit reports for handheld and mobile devices or PC hardware.
- Compare CPU, GPU, device, system, emulator, and performance filters.
- Add emulator-specific settings and notes so results are reproducible.
- Use comments, votes, reports, and moderation tools to keep data useful.
- Maintain game, hardware, emulator, custom field, and approval data through admin workflows.

## Tech Stack

EmuReady is a Next.js application written in TypeScript. It uses PostgreSQL with Prisma, tRPC for application APIs, Clerk for authentication, Tailwind CSS
for styling, Vitest for unit tests, and Playwright for browser tests.

## Local Development

### Prerequisites

- Node.js matching `.nvmrc`
- pnpm, enabled through Corepack
- PostgreSQL
- Clerk credentials for authenticated flows

### Setup

```bash
corepack enable pnpm
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm db:migrate:dev
pnpm db:seed
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

Environment setup is documented in [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md). Docker-specific setup is documented in
[docs/DOCKER.md](docs/DOCKER.md).

## Common Commands

```bash
pnpm dev          # Start the development server
pnpm check        # Run lint fixes and type checks
pnpm test         # Run unit tests
pnpm test:e2e     # Open the Playwright test runner
pnpm build        # Build the application
```

## Community and Support

Start with [CONTRIBUTING.md](CONTRIBUTING.md). It covers the current development workflow and project conventions in more detail than this README.

For bugs and feature requests, use [GitHub Issues](https://github.com/Producdevity/emuready/issues). For broader discussion, join the
[Discord](https://discord.gg/CYhCzApXav).

If EmuReady is useful to you, you can also support the project on [Patreon](https://www.patreon.com/Producdevity) or
[Ko-fi](https://ko-fi.com/producdevity).

## Security

Please do not report security issues in public GitHub issues. Contact a maintainer privately on Discord so the issue can be handled before details are
published.

## License

EmuReady is licensed under [GPL-3.0-or-later](LICENSE).

## Acknowledgements

Thanks to the [contributors](https://github.com/Producdevity/emuready/graphs/contributors), emulator developers, hardware testers, and community
members who keep compatibility data useful.
