# Publishing nx-gradle-plus to NPM

This guide explains how to publish the **nx-gradle-plus** plugin to npm.

## About nx-gradle-plus

nx-gradle-plus enhances `@nx/gradle` with powerful features for advanced Gradle integration in Nx monorepos:

- **🔍 Gradle Detection**: Automatically find and analyze Gradle projects in your workspace
- **📊 Dependency Graph**: Build and visualize multi-module Gradle dependencies
- **⚡ Smart Executors**: Run Gradle tasks with Nx caching integration
- **🎯 Task Inference**: Auto-generate Nx targets from Gradle tasks
- **🏗️ Project Generator**: Scaffold Gradle projects with wrapper setup

## Prerequisites

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com/signup)
2. **NPM Access Token**:
   - Go to [npmjs.com/settings/YOUR_USERNAME/tokens](https://www.npmjs.com/settings/)
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type
   - Copy the token (starts with `npm_`)
3. **GitHub Repository Secrets**:
   - Go to `https://github.com/gridatek/nx-gradle-plus/settings/secrets/actions`
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token

## Manual Publishing

### 1. Build the Plugin

```bash
npx nx build nx-gradle-plus
```

This creates the distributable package in `dist/nx-gradle-plus/`

### 2. Create a New Version

```bash
# Patch version (0.0.1 → 0.0.2)
npx nx release version patch

# Minor version (0.0.1 → 0.1.0)
npx nx release version minor

# Major version (0.0.1 → 1.0.0)
npx nx release version major

# Specific version
npx nx release version 1.2.3
```

This will:
- Update version in `nx-gradle-plus/package.json`
- Create a git commit
- Create a git tag (e.g., `v0.0.2`)
- Run the build (via `preVersionCommand`)

### 3. Push to GitHub

```bash
git push --follow-tags
```

### 4. Publish to NPM

The GitHub Action will automatically publish when you push tags.

**Or publish manually:**

```bash
# Login to npm (one time)
npm login

# Publish
npx nx release publish
```

## Automated Publishing (Recommended)

The repository includes `.github/workflows/publish.yml` that automatically publishes when you push version tags.

### Workflow Process:

1. **Create and push a version:**
   ```bash
   npx nx release version patch
   git push --follow-tags
   ```

2. **GitHub Actions will:**
   - Checkout the code
   - Install dependencies
   - Build the plugin
   - Publish to npm with provenance

3. **Verify publication:**
   - Visit https://www.npmjs.com/package/nx-gradle-plus
   - Check the new version is available

## Complete Release Flow

```bash
# 1. Make your changes and commit
git add .
git commit -m "feat: add new feature"

# 2. Create a new version (this builds automatically)
npx nx release version patch

# 3. Push with tags
git push --follow-tags

# 4. GitHub Action publishes to npm automatically
# 5. Check https://www.npmjs.com/package/nx-gradle-plus
```

## Publishing Configuration

### Package Metadata (nx-gradle-plus/package.json)

```json
{
  "name": "nx-gradle-plus",
  "version": "0.0.1",
  "description": "Nx plugin for Gradle integration",
  "repository": {
    "type": "git",
    "url": "https://github.com/gridatek/nx-gradle-plus.git"
  },
  "keywords": ["nx", "gradle", "nx-plugin", "monorepo"],
  "license": "MIT"
}
```

### Release Configuration (nx.json)

```json
{
  "release": {
    "version": {
      "preVersionCommand": "npx nx run-many -t build"
    },
    "changelog": {
      "workspaceChangelog": {
        "createRelease": "github"
      }
    }
  }
}
```

### Project Configuration (nx-gradle-plus/project.json)

```json
{
  "release": {
    "version": {
      "manifestRootsToUpdate": ["dist/{projectRoot}"],
      "currentVersionResolver": "git-tag",
      "fallbackCurrentVersionResolver": "disk"
    }
  },
  "targets": {
    "nx-release-publish": {
      "options": {
        "packageRoot": "dist/{projectRoot}"
      }
    }
  }
}
```

## Version Strategy

- **Patch (0.0.x)**: Bug fixes, small changes
- **Minor (0.x.0)**: New features, backward compatible
- **Major (x.0.0)**: Breaking changes

## Testing Before Publishing

### 1. Test Locally with Local Registry

```bash
# Terminal 1: Start local registry
npx nx local-registry

# Terminal 2: Publish locally
npm publish --registry http://localhost:4873

# Terminal 3: Install in a test project
npm install nx-gradle-plus --registry http://localhost:4873
```

### 2. Test with npm link

```bash
# In nx-gradle-plus workspace
npx nx build nx-gradle-plus
cd dist/nx-gradle-plus
npm link

# In test project
npm link nx-gradle-plus
```

## Troubleshooting

### "You do not have permission to publish"
- Ensure you're logged in: `npm whoami`
- Check package name isn't taken: https://www.npmjs.com/package/nx-gradle-plus
- Verify npm token has publish permissions

### "Version already exists"
- You can't republish the same version
- Increment version: `npx nx release version patch`

### GitHub Action fails
- Check NPM_TOKEN secret is set correctly
- Verify token hasn't expired
- Check GitHub Actions logs for details

### Build fails before publish
- Run `npx nx build nx-gradle-plus` locally to debug
- Check TypeScript compilation errors
- Verify all dependencies are installed

## Checking Published Package

After publishing, verify the package:

```bash
# View on npm
open https://www.npmjs.com/package/nx-gradle-plus

# Install in a test project
npm install nx-gradle-plus

# Check package contents
npm view nx-gradle-plus
```

## NPM Provenance

The publish workflow includes `NPM_CONFIG_PROVENANCE: true` which:
- Links the package to the source code
- Shows the exact commit that built the package
- Provides transparency and security
- Appears on the npm package page
