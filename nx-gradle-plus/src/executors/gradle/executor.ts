import { ExecutorContext } from '@nx/devkit';
import { execSync } from 'child_process';
import { join } from 'path';
import { getGradleCommand } from '../../utils/gradle-detector';

export interface GradleExecutorSchema {
  gradlePath: string;
  args?: string[];
  javaHome?: string;
  gradleOpts?: string[];
  useWrapper?: boolean;
}

export default async function gradleExecutor(
  options: GradleExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const projectRoot = join(context.root, options.gradlePath);
  const useWrapper = options.useWrapper !== false;

  try {
    const gradleCmd = getGradleCommand(projectRoot, useWrapper);
    const args = options.args || [];

    // Prepare environment
    const env = { ...process.env };
    if (options.javaHome) {
      env.JAVA_HOME = options.javaHome;
    }
    if (options.gradleOpts && options.gradleOpts.length > 0) {
      env.GRADLE_OPTS = options.gradleOpts.join(' ');
    }

    const fullCommand = `${gradleCmd} ${args.join(' ')}`;

    console.log(`\n> Executing: ${fullCommand}`);
    console.log(`> Working directory: ${projectRoot}\n`);

    execSync(fullCommand, {
      cwd: projectRoot,
      env,
      stdio: 'inherit',
    });

    console.log(`\n✅ Gradle command completed successfully\n`);

    return { success: true };
  } catch (error) {
    console.error(`\n❌ Gradle command failed\n`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    return { success: false };
  }
}
