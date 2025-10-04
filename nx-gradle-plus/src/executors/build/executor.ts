import { ExecutorContext } from '@nx/devkit';
import { execSync } from 'child_process';
import { join } from 'path';
import { getGradleCommand } from '../../utils/gradle-detector';

export interface BuildExecutorSchema {
  gradlePath: string;
  task?: string;
  args?: string[];
  javaHome?: string;
  gradleOpts?: string[];
  useWrapper?: boolean;
  outputs?: string[];
}

export default async function buildExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const projectRoot = join(context.root, options.gradlePath);
  const task = options.task || 'build';
  const useWrapper = options.useWrapper !== false;

  try {
    // Get Gradle command
    const gradleCmd = getGradleCommand(projectRoot, useWrapper);

    // Build command arguments
    const args = [task, ...(options.args || [])];

    // Prepare environment
    const env = { ...process.env };
    if (options.javaHome) {
      env.JAVA_HOME = options.javaHome;
    }
    if (options.gradleOpts && options.gradleOpts.length > 0) {
      env.GRADLE_OPTS = options.gradleOpts.join(' ');
    }

    // Build full command
    const fullCommand = `${gradleCmd} ${args.join(' ')}`;

    console.log(`\n> Executing: ${fullCommand}`);
    console.log(`> Working directory: ${projectRoot}\n`);

    // Execute Gradle build
    execSync(fullCommand, {
      cwd: projectRoot,
      env,
      stdio: 'inherit',
    });

    console.log(`\n✅ Gradle ${task} completed successfully\n`);

    return { success: true };
  } catch (error) {
    console.error(`\n❌ Gradle ${task || 'build'} failed\n`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    return { success: false };
  }
}
