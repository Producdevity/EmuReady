# Contributing to EmuReady

First off, thanks for taking the time to contribute! ❤️

All types of contributions are encouraged and valued. See the [Table of Contents](#table-of-contents) for different ways to help and details about how this project handles them. Please make sure to read the relevant section before making your contribution. It will make it a lot easier for us maintainers and smooth out the experience for all involved.

> And if you like the project, but just don't have time to contribute, that's fine. There are other easy ways to support the project and show your appreciation, which we would also be very happy about:
>
> - Star the project
> - Just use it

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [I Have a Question](#i-have-a-question)
- [I Want To Contribute](#i-want-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Improving The Documentation](#improving-the-documentation)
- [Development Guidelines](#development-guidelines)
  - [Commit Messages](#commit-messages)
  - [Pull Requests](#pull-requests)
  - [Development Workflow](#development-workflow)
  - [Code Style](#code-style)
  - [Testing](#testing)

## Code of Conduct

This project and everyone participating in it is governed by the
[EmuReady Code of Conduct (TODO)](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code. Please report unacceptable behavior
to the project maintainers.

## I Have a Question

> If you want to ask a question, we assume that you have read the available [Documentation](README.md).

Before you ask a question, it is best to search for existing [Issues](https://github.com/Producdevity/emuready/issues) that might help you. In case you have found a suitable issue and still need clarification, you can write your question in this issue.

If you still feel the need to ask a question and need clarification, we recommend the following:

- Open an [Issue](https://github.com/Producdevity/emuready/issues/new).
- Provide as much context as you can about what you're running into.
- Provide project and platform versions, depending on what seems relevant.

We will then take care of the issue as soon as possible.

## I Want To Contribute

### Reporting Bugs

#### Before Submitting a Bug Report

A good bug report shouldn't leave others needing to chase you up for more information. Therefore, we ask you to investigate carefully, collect information and describe the issue in detail in your report. Please complete the following steps in advance to help us fix any potential bug as fast as possible.

- Make sure that you are using the latest version.
- Determine if your bug is really a bug and not an error on your side e.g. using incompatible environment components/versions.
- To see if other users have experienced (and potentially already solved) the same issue you are having, check if there is not already a bug report existing for your bug or error in the [bug tracker](https://github.com/Producdevity/emuready/issues?q=label%3Abug).
- Collect information about the bug:
  - Stack trace (Browser Console, Terminal, etc.)
  - OS, Platform and Version (Windows, Linux, macOS)
  - Browser and Version (Chrome, Firefox, Safari, etc.)
  - Possibly your input and the output
  - Can you reliably reproduce the issue? And can you also reproduce it with older versions?

#### How Do I Submit a Good Bug Report?

We use GitHub issues to track bugs and errors. If you run into an issue with the project:

- Open an [Issue](https://github.com/Producdevity/emuready/issues/new).
- Explain the behavior you would expect and the actual behavior.
- Please provide as much context as possible and describe the _reproduction steps_ that someone else can follow to recreate the issue on their own.
- Provide the information you collected in the previous section.

Once it's filed:

- The project team will label the issue accordingly.
- A team member will try to reproduce the issue with your provided steps. If there are no reproduction steps or no obvious way to reproduce the issue, the team will ask you for those steps. Bugs without steps will not be addressed until they can be reproduced.
- If the team is able to reproduce the issue, it will be prioritized according to severity and other considerations, and then fixed when possible.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for EmuReady, including completely new features and minor improvements to existing functionality.

#### Before Submitting an Enhancement

- Make sure that you are using the latest version. (The website will always be up to date, but if you are running a local version, make sure to update it with last changes on `master`.)
- Read the [documentation](README.md) carefully and find out if the functionality is already covered, maybe by an individual configuration.
- Perform a [search](https://github.com/Producdevity/emuready/issues) to see if the enhancement has already been suggested. If it has, add a comment to the existing issue instead of opening a new one.
- Find out whether your idea fits with the scope and aims of the project. It's up to you to make a strong case to convince the project's developers of the merits of this feature.

#### How Do I Submit a Good Enhancement Suggestion?

Enhancement suggestions are tracked as [GitHub issues](https://github.com/Producdevity/emuready/issues).

- Use a **clear and descriptive title** for the issue to identify the suggestion.
- Provide a **step-by-step description of the suggested enhancement** in as many details as possible.
- **Describe the current behavior** and **explain which behavior you expected to see instead** and why.
- **Explain why this enhancement would be useful** to most EmuReady users or moderators.
- List some other applications where this enhancement exists, if applicable.
- **Specify the name and version of the OS** you're using.

### Your First Code Contribution

Unsure where to begin contributing to EmuReady? You can start by looking through these `beginner` and `help-wanted` issues:

- [Beginner issues](https://github.com/Producdevity/emuready/issues?q=label%3A%22good+first+issue%22) - issues which should only require a few lines of code, and a test or two.
- [Help wanted issues](https://github.com/Producdevity/emuready/issues?q=label%3A%22help+wanted%22) - issues which should be a bit more involved than beginner issues.

#### Local Development

To set up the project locally for development:

1. Fork the repository
2. Clone your fork

```bash
git clone https://github.com/your-username/emuready.git
cd emuready
```

3. Install dependencies

```bash
npm install
```

4. Set up environment variables

```bash
cp .env.example .env.local
```

**Important:** For production deployments, you must also set the `INTERNAL_API_KEY` environment variable to protect against API abuse. Generate a secure key with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

For local development, this key is optional as localhost origins are automatically allowed. See [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) for complete environment variable documentation.

5. Setup database

```bash
npx prisma generate
npx prisma db push
```

It is recommended to use a local database for development. You can use SQLite or PostgreSQL. If you want to use PostgreSQL, make sure to set up the connection string in the `.env` file.

```prisma
datasource db {
  provider  = "sqlite"
  url       = "file:./dev.db"
}
```

6. Run in development mode

```bash
npm run dev
```

Make sure all tests and checks pass before creating a pull request:

```bash
npm run lint
npm run types
npm run build
# or
npm run prepare-deploy
```

7. Setup Clerk for authentication

If you want to test and use authentication, you can set up a free Clerk development environment:
. You will need to create a Clerk account and set up an application.
. Follow the [Clerk Setup Guide](docs/AUTHENTICATION_SETUP.md) for detailed instructions.

### Improving The Documentation

Documentation improvements are always welcome. The documentation is in the `README.md` file and other markdown files throughout the repository.

## Development Guidelines

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for our commit messages:

- `fix`: a commit of the type fix patches a bug in your codebase
- `feat`: a commit of the type feat introduces a new feature to the codebase
- `docs`: documentation only changes
- `style`: changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: a code change that neither fixes a bug nor adds a feature
- `perf`: a code change that improves performance
- `test`: adding missing tests or correcting existing tests
- `chore`: changes to the build process or auxiliary tools

### Pull Requests

- Fill in the required pull request template
- Include issue numbers in the PR title when applicable
- Include screenshots and animated GIFs in your pull request whenever possible

### Development Workflow

1. Create a new branch from `master` for your changes
2. Make your changes
3. Test your changes locally
4. Push your branch and create a pull request
5. Address any code review feedback

### Code Style

We use ESLint and Prettier to maintain code style and best practices. Please make sure your code adheres to the style guidelines by running:

```bash
npm run lint
npm run format
```

#### Destructuring Props in React Components

Try to avoid destructuring props in React Components. This is open for discussion of course, but here are some articles that explain why:

- [Breaking the Habit: The Overuse of Object Destructuring in React](https://medium.com/@Producdevity/breaking-the-habit-the-overuse-of-object-destructuring-in-react-5404ab53eb6d)
- [Destructuring Props in React: The Quiet Problem That Keeps Growing](https://medium.com/@Producdevity/destructuring-props-in-react-the-quiet-problem-that-keeps-growing-c58ab3bf2ce2)

#### File Naming Conventions

- Use `PascalCase` for component filenames (e.g., `MyComponent.tsx`)
- Use `camelCase` for other filenames (e.g., `myHelperFunction.ts`)
- Files with a single component should be named after that component (e.g., `MyComponent.tsx`)
- Files with a single function should be named after that function (e.g., `myHelperFunction.ts`)

### Testing

We recommend writing tests for new features and bug fixes. Run existing tests with:

#### Unit Tests

```bash
npm test
```

#### End-to-End Tests

> This is still a work in progress, but we have a basic setup for E2E tests using Playwright.
> Not all tests are green yet, but we are working on improving coverage.

For comprehensive E2E testing setup and guidelines, see our [E2E Testing Setup Guide](docs/E2E_TESTING_SETUP.md).

Quick commands:

```bash
# Interactive test runner with UI (recommended for development)
npm run test:e2e

# Run tests with visible browsers
npm run test:e2e:headed

# Headless mode for CI
npm run test:e2e:headless

# Debug mode
npm run test:e2e:debug
```

---

Thank you for contributing to EmuReady! ❤️
