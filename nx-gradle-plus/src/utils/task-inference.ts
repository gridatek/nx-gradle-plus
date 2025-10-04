import { execSync } from 'child_process';
import { join } from 'path';
import { getGradleCommand } from './gradle-detector';

export interface InferredTarget {
  name: string;
  executor: string;
  options: Record<string, any>;
  outputs?: string[];
  dependsOn?: string[];
}

/**
 * Infer Nx targets from Gradle tasks
 */
export function inferTargetsFromGradle(
  projectRoot: string,
  projectPath: string
): InferredTarget[] {
  const targets: InferredTarget[] = [];
  const gradleTasks = getGradleTasks(join(projectRoot, projectPath));

  // Map common Gradle tasks to Nx targets
  const taskMappings: Record<string, Partial<InferredTarget>> = {
    build: {
      executor: 'nx-gradle-plus:build',
      outputs: ['{projectRoot}/build'],
      options: { task: 'build' },
    },
    test: {
      executor: 'nx-gradle-plus:test',
      outputs: [
        '{projectRoot}/build/test-results',
        '{projectRoot}/build/reports',
      ],
      options: { task: 'test' },
    },
    assemble: {
      executor: 'nx-gradle-plus:build',
      outputs: ['{projectRoot}/build/libs'],
      options: { task: 'assemble' },
    },
    jar: {
      executor: 'nx-gradle-plus:build',
      outputs: ['{projectRoot}/build/libs'],
      options: { task: 'jar' },
    },
    clean: {
      executor: 'nx-gradle-plus:gradle',
      options: { args: ['clean'] },
    },
    check: {
      executor: 'nx-gradle-plus:gradle',
      outputs: ['{projectRoot}/build/reports'],
      options: { args: ['check'] },
      dependsOn: ['test'],
    },
    bootJar: {
      executor: 'nx-gradle-plus:build',
      outputs: ['{projectRoot}/build/libs'],
      options: { task: 'bootJar' },
    },
    bootRun: {
      executor: 'nx-gradle-plus:gradle',
      options: { args: ['bootRun'] },
    },
  };

  for (const task of gradleTasks) {
    const mapping = taskMappings[task];
    if (mapping) {
      targets.push({
        name: task,
        executor: mapping.executor!,
        options: {
          gradlePath: projectPath,
          ...mapping.options,
        },
        outputs: mapping.outputs,
        dependsOn: mapping.dependsOn,
      });
    }
  }

  return targets;
}

/**
 * Get available Gradle tasks for a project
 */
function getGradleTasks(projectPath: string): string[] {
  try {
    const gradleCmd = getGradleCommand(projectPath, true);
    const output = execSync(`${gradleCmd} tasks --all`, {
      cwd: projectPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });

    return parseGradleTasks(output);
  } catch (error) {
    console.warn(`Failed to get Gradle tasks for ${projectPath}`);
    return [];
  }
}

/**
 * Parse Gradle tasks output
 */
function parseGradleTasks(output: string): string[] {
  const tasks: string[] = [];
  const lines = output.split('\n');
  let inTaskSection = false;

  for (const line of lines) {
    // Task sections start with headers like "Build tasks" or "Application tasks"
    if (line.includes('tasks') && line.includes('-')) {
      inTaskSection = true;
      continue;
    }

    // Empty line ends a section
    if (inTaskSection && line.trim() === '') {
      inTaskSection = false;
      continue;
    }

    // Parse task lines (format: "taskName - description")
    if (inTaskSection && line.includes(' - ')) {
      const taskName = line.split(' - ')[0].trim();
      if (taskName && !taskName.startsWith('help')) {
        tasks.push(taskName);
      }
    }
  }

  return [...new Set(tasks)];
}

/**
 * Get common Gradle build outputs for caching
 */
export function getGradleOutputs(projectPath: string): string[] {
  return [
    `${projectPath}/build`,
    `${projectPath}/build/libs`,
    `${projectPath}/build/classes`,
    `${projectPath}/build/resources`,
    `${projectPath}/build/generated`,
  ];
}

/**
 * Infer cache inputs for Gradle projects
 */
export function getGradleCacheInputs(projectPath: string): string[] {
  return [
    `${projectPath}/build.gradle`,
    `${projectPath}/build.gradle.kts`,
    `${projectPath}/settings.gradle`,
    `${projectPath}/settings.gradle.kts`,
    `${projectPath}/src/**/*`,
    `${projectPath}/gradle.properties`,
    '{workspaceRoot}/gradle.properties',
  ];
}
