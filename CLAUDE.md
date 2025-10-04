# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Nx monorepo containing a plugin project called `nx-gradle-plus`. The workspace uses Nx 21.6.3 for build orchestration and is configured with TypeScript, Jest for testing, and ESLint for linting.

## Project Structure

- `nx-gradle-plus/` - Main plugin library (buildable library project)
- `nx-gradle-plus-e2e/` - End-to-end tests for the plugin
- `tools/` - Custom workspace tooling
- `.verdaccio/` - Local registry configuration for testing package publishing

The plugin is structured as an Nx plugin that can define generators and executors (referenced in build assets but not yet implemented).

## Common Commands

### Building
```bash
npx nx build nx-gradle-plus
```

Build all projects:
```bash
npx nx run-many -t build
```

### Testing
```bash
# Run unit tests for the plugin
npx nx test nx-gradle-plus

# Run e2e tests
npx nx e2e nx-gradle-plus-e2e

# Run all tests
npx nx run-many -t test
```

### Linting
```bash
# Lint the plugin
npx nx lint nx-gradle-plus

# Lint all projects
npx nx run-many -t lint
```

### Local Registry
```bash
# Start local Verdaccio registry for testing package publishing
npx nx local-registry
```

### Nx Commands
```bash
# View the dependency graph
npx nx graph

# List available plugins
npx nx list

# Show affected projects
npx nx affected:graph
```

## Build Configuration

- The plugin uses `@nx/js:tsc` executor for building TypeScript
- Build output: `dist/nx-gradle-plus`
- The build includes assets like `generators.json` and `executors.json` for Nx plugin schema
- Release versioning uses git tags with disk fallback

## Testing Configuration

- Jest is configured with `@nx/jest` preset
- E2E tests run with `runInBand: true` (sequential execution)
- Tests support code coverage in CI mode: `npx nx test nx-gradle-plus --configuration=ci`

## TypeScript Configuration

- Target: ES2015
- Module system: ESNext with Node resolution
- Path alias: `nx-gradle-plus` maps to `nx-gradle-plus/src/index.ts`
- Decorators and decorator metadata are enabled

## CI/CD

The project uses GitHub Actions for continuous integration and automated maintenance:

### CI Pipeline (`.github/workflows/ci.yml`)
- Runs on push to `main` and on pull requests
- Uses `nx affected` to only test/build changed projects
- Steps: Lint → Test (with coverage) → Build → E2E Tests
- Utilizes Nx computation caching for performance

### Nx Migrate (`.github/workflows/nx-migrate.yml`)
- Runs weekly on Mondays at 2 AM UTC (or manually via workflow_dispatch)
- Automatically checks for Nx updates and creates PRs
- Labels: `dependencies`, `nx-migration`
- Commit prefix: `chore(nx):`
- Uses npm as package manager

## Release Process

```bash
# Pre-version command runs all builds
npx nx run-many -t build

# Publish from dist directory
npx nx nx-release-publish nx-gradle-plus
```

## Development Notes

- The main plugin source is currently empty (`nx-gradle-plus/src/index.ts`)
- Plugin configuration expects `generators.json` and `executors.json` files (not yet created)
- E2E tests have an implicit dependency on the plugin build
- The workspace uses flat ESLint config (eslint.config.mjs) with Nx-specific rules
