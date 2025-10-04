import { existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import type { GradleProject } from './types';

/**
 * Find all Gradle projects in the workspace
 */
export function findGradleProjects(workspaceRoot: string): GradleProject[] {
  const projects: GradleProject[] = [];

  function scanDirectory(dir: string) {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);

      // Skip node_modules and hidden directories
      if (
        entry === 'node_modules' ||
        entry.startsWith('.') ||
        entry === 'dist'
      ) {
        continue;
      }

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Check if this directory is a Gradle project
        const project = detectGradleProject(fullPath, workspaceRoot);
        if (project) {
          projects.push(project);
        }

        // Continue scanning subdirectories
        scanDirectory(fullPath);
      }
    }
  }

  scanDirectory(workspaceRoot);
  return projects;
}

/**
 * Detect if a directory is a Gradle project
 */
export function detectGradleProject(
  projectPath: string,
  workspaceRoot: string
): GradleProject | null {
  const buildGradle = join(projectPath, 'build.gradle');
  const buildGradleKts = join(projectPath, 'build.gradle.kts');

  let buildFile: string;
  let buildFileType: 'groovy' | 'kotlin';

  if (existsSync(buildGradle)) {
    buildFile = buildGradle;
    buildFileType = 'groovy';
  } else if (existsSync(buildGradleKts)) {
    buildFile = buildGradleKts;
    buildFileType = 'kotlin';
  } else {
    return null;
  }

  const settingsGradle = join(projectPath, 'settings.gradle');
  const settingsGradleKts = join(projectPath, 'settings.gradle.kts');
  const settingsFile = existsSync(settingsGradle)
    ? settingsGradle
    : existsSync(settingsGradleKts)
    ? settingsGradleKts
    : undefined;

  const wrapperPath = detectGradleWrapper(projectPath);
  const relativePath = relative(workspaceRoot, projectPath);
  const projectName = relativePath.replace(/\\/g, '/').split('/').pop() || '';

  return {
    name: projectName,
    path: relativePath,
    buildFile,
    buildFileType,
    settingsFile,
    hasWrapper: !!wrapperPath,
    wrapperPath,
  };
}

/**
 * Detect Gradle wrapper in a project
 */
export function detectGradleWrapper(projectPath: string): string | null {
  const gradlewUnix = join(projectPath, 'gradlew');
  const gradlewWindows = join(projectPath, 'gradlew.bat');
  const wrapperJar = join(
    projectPath,
    'gradle',
    'wrapper',
    'gradle-wrapper.jar'
  );

  if (existsSync(wrapperJar)) {
    // Prefer platform-specific wrapper
    if (process.platform === 'win32' && existsSync(gradlewWindows)) {
      return gradlewWindows;
    } else if (existsSync(gradlewUnix)) {
      return gradlewUnix;
    }
  }

  return null;
}

/**
 * Get Gradle command to execute
 */
export function getGradleCommand(
  projectPath: string,
  useWrapper: boolean = true
): string {
  if (useWrapper) {
    const wrapper = detectGradleWrapper(projectPath);
    if (wrapper) {
      return wrapper;
    }
  }

  // Fallback to system Gradle
  return 'gradle';
}

/**
 * Check if a path is a Gradle project
 */
export function isGradleProject(path: string): boolean {
  return (
    existsSync(join(path, 'build.gradle')) ||
    existsSync(join(path, 'build.gradle.kts'))
  );
}
