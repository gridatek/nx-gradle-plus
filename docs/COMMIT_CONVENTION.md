# Commit Message Convention

This project uses **strict conventional commits** enforced by commitlint and husky.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Rules

### Type (Required)
Must be one of the following:

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add gradle executor` |
| `fix` | Bug fix | `fix: resolve build path issue` |
| `docs` | Documentation only | `docs: update publishing guide` |
| `style` | Code style/formatting | `style: format gradle templates` |
| `refactor` | Code refactoring | `refactor: simplify executor logic` |
| `perf` | Performance improvement | `perf: optimize gradle task caching` |
| `test` | Add/update tests | `test: add executor unit tests` |
| `build` | Build system changes | `build: update nx to 21.6.3` |
| `ci` | CI configuration | `ci: add publish workflow` |
| `chore` | Other changes | `chore: update dependencies` |
| `revert` | Revert previous commit | `revert: revert feat: add feature` |

### Scope (Optional)
The scope provides additional context:

```bash
feat(generator): add project generator
fix(executor): handle gradle wrapper correctly
docs(publishing): add npm token setup
```

Common scopes:
- `generator` - Generator-related changes
- `executor` - Executor-related changes
- `core` - Core plugin functionality
- `deps` - Dependency updates
- `release` - Release-related changes

### Subject (Required)
- Use imperative, present tense: "add" not "added" nor "adds"
- Don't capitalize first letter
- No period (.) at the end
- Maximum 100 characters for the entire header

### Body (Optional)
- Use imperative, present tense
- Include motivation for the change
- Explain what and why, not how

### Footer (Optional)
- Reference issues: `Closes #123` or `Fixes #456`
- Note breaking changes: `BREAKING CHANGE: description`

## Examples

### Simple commit
```bash
git commit -m "feat: add gradle build executor"
```

### With scope
```bash
git commit -m "fix(generator): use correct template path"
```

### With body and footer
```bash
git commit -m "feat(executor): add code coverage support

Add support for generating coverage reports in gradle test executor.
Supports xml, html, and csv formats.

Closes #42"
```

### Breaking change
```bash
git commit -m "feat(executor)!: change gradle executor options

BREAKING CHANGE: gradlePath is now required instead of optional.
Update your project.json configurations to include gradlePath."
```

## Validation

Commits are validated automatically:

### Pre-commit Hook
When you commit, husky runs commitlint to validate your message.

### Invalid Examples (Will Fail)

❌ `added new feature` - Missing type
❌ `Feat: Add feature` - Type must be lowercase
❌ `feat: Add feature.` - Subject ends with period
❌ `feat: THIS IS A VERY LONG COMMIT MESSAGE THAT EXCEEDS THE MAXIMUM LENGTH ALLOWED BY THE COMMIT CONVENTION RULES` - Too long
❌ `update: fix bug` - Invalid type

### Valid Examples (Will Pass)

✅ `feat: add gradle executor`
✅ `fix(generator): resolve template path`
✅ `docs: update readme`
✅ `chore(deps): update nx to 21.6.3`
✅ `test: add executor tests`

## Bypassing Validation (Not Recommended)

```bash
git commit -m "whatever" --no-verify
```

**Warning:** This is discouraged as it breaks the commit convention.

## IDE Integration

### VS Code
Install [Conventional Commits](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits) extension

### IntelliJ / WebStorm
Install [Conventional Commit](https://plugins.jetbrains.com/plugin/13389-conventional-commit) plugin

## Automatic Changelog

Conventional commits enable automatic changelog generation:

```bash
npx nx release version patch
```

This generates a changelog based on commit types:
- `feat` → Features section
- `fix` → Bug Fixes section
- `perf` → Performance section
- `BREAKING CHANGE` → Breaking Changes section

## Setup for New Contributors

After cloning the repository:

```bash
npm install
```

This automatically sets up husky hooks via the `prepare` script.

To test commitlint manually:

```bash
echo "feat: test commit" | npx commitlint
```

## CI Validation

Pull requests are automatically validated:
- `.github/workflows/validate-commits.yml` checks all commits in the PR
- Each commit must follow the conventional commit format
- PRs with invalid commits will fail CI

## Git Hooks

Two hooks are configured:

1. **pre-commit** - Runs linting and tests on affected projects
2. **commit-msg** - Validates commit message format

Both hooks run automatically when you commit.
