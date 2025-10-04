# nx-gradle-plus Architecture

## Overview

nx-gradle-plus enhances `@nx/gradle` with advanced features for better Gradle integration in Nx monorepos.

## Core Features

### 1. Advanced Gradle Integration

- **Gradle Build Cache ↔ Nx Cache**: Synchronize Gradle's build cache with Nx computation cache
- **Dependency Graph**: Automatically detect and visualize Gradle module dependencies
- **Multi-module Detection**: Auto-discover Gradle subprojects from settings.gradle
- **Parallel Optimization**: Intelligent task execution across Gradle and Nx

### 2. Smart Generators

- **Project Generator**: Scaffold Gradle projects with Nx integration
- **Multi-module Generator**: Create multi-module Gradle projects
- **Config Generator**: Add Gradle targets to existing Nx projects

### 3. Enhanced Executors

- **Build Executor**: Run Gradle builds with Nx caching
- **Test Executor**: Execute Gradle tests with coverage
- **Task Executor**: Run any Gradle task through Nx

## Project Structure

```
nx-gradle-plus/
├── src/
│   ├── generators/
│   │   ├── project/              # Project generator
│   │   ├── init/                 # Initialize Gradle in workspace
│   │   └── config/               # Add Gradle config
│   ├── executors/
│   │   ├── build/                # Build executor
│   │   ├── test/                 # Test executor
│   │   └── gradle/               # Generic Gradle executor
│   ├── utils/
│   │   ├── gradle-detector.ts    # Find Gradle projects
│   │   ├── gradle-parser.ts      # Parse build.gradle files
│   │   ├── dependency-graph.ts   # Build dependency graphs
│   │   ├── cache-integration.ts  # Nx cache integration
│   │   ├── gradle-wrapper.ts     # Gradle wrapper utilities
│   │   └── task-inference.ts     # Infer Nx targets from Gradle
│   └── index.ts                  # Public API
├── generators.json               # Generator registry
└── executors.json               # Executor registry
```

## Architecture Decisions

### 1. Gradle Detection Strategy

- Scan workspace for `build.gradle` and `build.gradle.kts` files
- Parse `settings.gradle` to identify multi-module structure
- Cache detection results for performance

### 2. Dependency Graph Integration

- Extract dependencies from Gradle build files
- Map Gradle project dependencies to Nx implicit dependencies
- Support both Groovy and Kotlin DSL

### 3. Caching Strategy

- Hash Gradle inputs (build files, source files, dependencies)
- Leverage Nx's computation cache for Gradle outputs
- Integrate with Gradle's build cache when available

### 4. Task Inference

- Automatically create Nx targets from common Gradle tasks
- Support custom task mapping via configuration
- Respect Gradle task dependencies

### 5. Multi-platform Support

- Support Gradle wrapper (gradlew/gradlew.bat)
- Fallback to system Gradle installation
- Windows-specific path handling

## Data Flow

### Build Execution Flow

```
1. User runs: npx nx build my-gradle-app
2. Nx executor invoked
3. Check Nx cache for outputs
4. If cache miss:
   a. Detect Gradle command (wrapper vs system)
   b. Run Gradle build with configured options
   c. Capture outputs
   d. Store in Nx cache
5. Return results
```

### Project Generation Flow

```
1. User runs: npx nx g nx-gradle-plus:project my-app
2. Validate inputs and workspace
3. Generate Gradle project structure
4. Create/update settings.gradle
5. Generate Nx project.json with inferred targets
6. Initialize Gradle wrapper if requested
7. Format files and update dependencies
```

### Dependency Graph Flow

```
1. Scan workspace for Gradle projects
2. Parse settings.gradle for modules
3. Parse each build.gradle for dependencies
4. Build dependency map
5. Update Nx project.json with implicit dependencies
6. Cache results for next run
```

## Configuration

### Workspace Configuration (nx.json)

```json
{
  "gradlePlus": {
    "gradleVersion": "8.5",
    "defaultJavaVersion": "17",
    "cacheIntegration": true,
    "autoInferTargets": true,
    "multiModuleDetection": true
  }
}
```

### Project Configuration (project.json)

```json
{
  "targets": {
    "build": {
      "executor": "nx-gradle-plus:build",
      "options": {
        "gradlePath": "apps/my-app",
        "task": "build",
        "outputs": ["{projectRoot}/build"]
      }
    }
  }
}
```

## Key Utilities

### GradleDetector

- `findGradleProjects(workspaceRoot: string): GradleProject[]`
- `isGradleProject(path: string): boolean`
- `detectGradleWrapper(path: string): string | null`

### GradleParser

- `parseBuildGradle(filePath: string): GradleBuild`
- `parseSettingsGradle(filePath: string): string[]`
- `extractDependencies(buildFile: string): Dependency[]`

### DependencyGraphBuilder

- `buildGraph(projects: GradleProject[]): DependencyGraph`
- `updateNxDependencies(graph: DependencyGraph): void`

### CacheIntegration

- `hashGradleInputs(project: GradleProject): string`
- `getCachedOutputs(hash: string): Output[] | null`
- `storeOutputs(hash: string, outputs: Output[]): void`

## Performance Optimizations

1. **Lazy Loading**: Load Gradle metadata only when needed
2. **Parallel Parsing**: Parse build files concurrently
3. **Result Caching**: Cache parsed Gradle structures
4. **Incremental Updates**: Only re-parse changed files
5. **Daemon Integration**: Leverage Gradle daemon for faster builds

## Testing Strategy

### Unit Tests

- Utilities have comprehensive unit tests using Jest
- Mock filesystem with `memfs` for isolation
- Test coverage for all core functions

### E2E Tests

- Full integration tests using `@nx/plugin/testing`
- Test generator scaffolding
- Test executor execution
- Validate caching behavior

### Cross-Platform Testing

- Nightly tests on Ubuntu, macOS, Windows
- Node.js versions: 18, 20, 22
- Automated issue creation on failure

## Future Enhancements

- Gradle Enterprise integration
- Build scan support
- Advanced test filtering
- Container-based builds
- Dependency vulnerability scanning
- Spring Boot optimizations
- Android project support
