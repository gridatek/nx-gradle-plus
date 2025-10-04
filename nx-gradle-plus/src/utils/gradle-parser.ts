import { readFileSync } from 'fs';
import type { GradleBuild, GradleDependency } from './types';

/**
 * Parse a Gradle build file (Groovy or Kotlin DSL)
 */
export function parseBuildGradle(buildFilePath: string): GradleBuild {
  const content = readFileSync(buildFilePath, 'utf-8');
  const isKotlin = buildFilePath.endsWith('.kts');

  return {
    plugins: extractPlugins(content, isKotlin),
    dependencies: extractDependencies(content, isKotlin),
    repositories: extractRepositories(content, isKotlin),
    sourceCompatibility: extractProperty(
      content,
      'sourceCompatibility',
      isKotlin
    ),
    targetCompatibility: extractProperty(
      content,
      'targetCompatibility',
      isKotlin
    ),
    group: extractProperty(content, 'group', isKotlin),
    version: extractProperty(content, 'version', isKotlin),
  };
}

/**
 * Parse settings.gradle to get subprojects
 */
export function parseSettingsGradle(settingsFilePath: string): string[] {
  const content = readFileSync(settingsFilePath, 'utf-8');
  const isKotlin = settingsFilePath.endsWith('.kts');
  const subprojects: string[] = [];

  // Match include statements
  const includePattern = isKotlin
    ? /include\s*\(\s*["']([^"']+)["']\s*\)/g
    : /include\s+["']([^"']+)["']/g;

  let match;
  while ((match = includePattern.exec(content)) !== null) {
    subprojects.push(match[1]);
  }

  return subprojects;
}

/**
 * Extract plugins from build file
 */
function extractPlugins(content: string, isKotlin: boolean): string[] {
  const plugins: string[] = [];

  const patterns = isKotlin
    ? [
        /id\s*\(\s*["']([^"']+)["']\s*\)/g,
        /kotlin\s*\(\s*["']([^"']+)["']\s*\)/g,
      ]
    : [/id\s+["']([^"']+)["']/g, /apply\s+plugin:\s*["']([^"']+)["']/g];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      plugins.push(match[1]);
    }
  }

  return [...new Set(plugins)];
}

/**
 * Extract dependencies from build file
 */
function extractDependencies(
  content: string,
  isKotlin: boolean
): GradleDependency[] {
  const dependencies: GradleDependency[] = [];

  // Match dependency blocks
  const depBlockPattern = /dependencies\s*\{([^}]+)\}/gs;
  const depBlockMatch = depBlockPattern.exec(content);

  if (!depBlockMatch) {
    return dependencies;
  }

  const depBlock = depBlockMatch[1];

  // Match individual dependencies
  const patterns = isKotlin
    ? [
        /(\w+)\s*\(\s*["']([^"':]+):([^"':]+):([^"']+)["']\s*\)/g,
        /(\w+)\s*\(\s*project\s*\(\s*["']([^"']+)["']\s*\)\s*\)/g,
      ]
    : [
        /(\w+)\s+["']([^"':]+):([^"':]+):([^"']+)["']/g,
        /(\w+)\s+project\s*\(\s*["']([^"']+)["']\s*\)/g,
      ];

  // Maven-style dependencies
  let match;
  while ((match = patterns[0].exec(depBlock)) !== null) {
    dependencies.push({
      configuration: match[1],
      group: match[2],
      name: match[3],
      version: match[4],
      isProject: false,
    });
  }

  // Project dependencies
  while ((match = patterns[1].exec(depBlock)) !== null) {
    dependencies.push({
      configuration: match[1],
      name: match[2],
      isProject: true,
      projectPath: match[2],
    });
  }

  return dependencies;
}

/**
 * Extract repositories from build file
 */
function extractRepositories(content: string, isKotlin: boolean): string[] {
  const repositories: string[] = [];

  const repoPattern = /repositories\s*\{([^}]+)\}/gs;
  const repoMatch = repoPattern.exec(content);

  if (!repoMatch) {
    return repositories;
  }

  const repoBlock = repoMatch[1];

  // Common repository names
  const commonRepos = [
    'mavenCentral',
    'mavenLocal',
    'google',
    'gradlePluginPortal',
  ];

  for (const repo of commonRepos) {
    if (repoBlock.includes(repo)) {
      repositories.push(repo);
    }
  }

  // Maven URLs
  const mavenPattern = /maven\s*\{[^}]*url\s*[=:]\s*["']([^"']+)["']/gs;
  let match;
  while ((match = mavenPattern.exec(repoBlock)) !== null) {
    repositories.push(match[1]);
  }

  return repositories;
}

/**
 * Extract a property from build file
 */
function extractProperty(
  content: string,
  propertyName: string,
  isKotlin: boolean
): string | undefined {
  const patterns = isKotlin
    ? [
        new RegExp(`${propertyName}\\s*=\\s*["']([^"']+)["']`),
        new RegExp(`${propertyName}\\s*=\\s*JavaVersion\\.VERSION_(\\d+)`),
      ]
    : [
        new RegExp(`${propertyName}\\s*=\\s*["']([^"']+)["']`),
        new RegExp(`${propertyName}\\s*=\\s*["']([^"']+)["']`),
      ];

  for (const pattern of patterns) {
    const match = pattern.exec(content);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}
