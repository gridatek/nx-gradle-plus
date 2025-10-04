import { ExecutorContext } from '@nx/devkit';
import { execSync } from 'child_process';
import { join } from 'path';
import { getGradleCommand } from '../../utils/gradle-detector';

export interface TestExecutorSchema {
  gradlePath: string;
  task?: string;
  args?: string[];
  codeCoverage?: boolean;
  coverageFormat?: 'xml' | 'html' | 'csv';
  javaHome?: string;
  useWrapper?: boolean;
}

export default async function testExecutor(
  options: TestExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const projectRoot = join(context.root, options.gradlePath);
  const task = options.task || 'test';
  const useWrapper = options.useWrapper !== false;

  try {
    const gradleCmd = getGradleCommand(projectRoot, useWrapper);

    // Build arguments
    const args = [task, ...(options.args || [])];

    // Add coverage if enabled
    if (options.codeCoverage) {
      args.push('jacocoTestReport');
      if (options.coverageFormat) {
        args.push(`-Pcoverage.format=${options.coverageFormat}`);
      }
    }

    // Prepare environment
    const env = { ...process.env };
    if (options.javaHome) {
      env.JAVA_HOME = options.javaHome;
    }

    const fullCommand = `${gradleCmd} ${args.join(' ')}`;

    console.log(`\n> Executing: ${fullCommand}`);
    console.log(`> Working directory: ${projectRoot}\n`);

    execSync(fullCommand, {
      cwd: projectRoot,
      env,
      stdio: 'inherit',
    });

    console.log(`\n✅ Gradle tests completed successfully\n`);

    return { success: true };
  } catch (error) {
    console.error(`\n❌ Gradle tests failed\n`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    return { success: false };
  }
}
