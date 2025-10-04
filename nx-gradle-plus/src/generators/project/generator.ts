import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  Tree,
  names,
  offsetFromRoot,
  readProjectConfiguration,
} from '@nx/devkit';
import { join } from 'path';
import { execSync } from 'child_process';

export interface ProjectGeneratorSchema {
  name: string;
  directory?: string;
  projectType?: 'application' | 'library';
  gradleVersion?: string;
  javaVersion?: string;
  buildTool?: 'gradle' | 'gradle-kotlin-dsl';
  groupId?: string;
  initWrapper?: boolean;
  tags?: string;
}

interface NormalizedSchema extends ProjectGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  buildFileExt: string;
}

export default async function projectGenerator(
  tree: Tree,
  options: ProjectGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);

  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: normalizedOptions.projectType || 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    tags: normalizedOptions.parsedTags,
    targets: {
      build: {
        executor: 'nx-gradle-plus:build',
        outputs: ['{projectRoot}/build'],
        options: {
          gradlePath: normalizedOptions.projectRoot,
          task: 'build',
        },
      },
      test: {
        executor: 'nx-gradle-plus:test',
        outputs: ['{projectRoot}/build/test-results'],
        options: {
          gradlePath: normalizedOptions.projectRoot,
          task: 'test',
        },
      },
      clean: {
        executor: 'nx-gradle-plus:gradle',
        options: {
          gradlePath: normalizedOptions.projectRoot,
          args: ['clean'],
        },
      },
    },
  });

  generateFiles(
    tree,
    join(__dirname, 'files', normalizedOptions.buildTool || 'gradle'),
    normalizedOptions.projectRoot,
    {
      ...normalizedOptions,
      ...names(normalizedOptions.projectName),
      offsetFromRoot: offsetFromRoot(normalizedOptions.projectRoot),
      template: '',
    }
  );

  await formatFiles(tree);

  return () => {
    if (normalizedOptions.initWrapper) {
      initializeGradleWrapper(normalizedOptions);
    }
  };
}

function normalizeOptions(
  tree: Tree,
  options: ProjectGeneratorSchema
): NormalizedSchema {
  const projectDirectory = options.directory
    ? `${options.directory}/${options.name}`
    : options.name;

  const projectName = projectDirectory.replace(/\//g, '-');
  const projectRoot = projectDirectory;
  const parsedTags = options.tags ? options.tags.split(',').map((s) => s.trim()) : [];
  const buildFileExt = options.buildTool === 'gradle-kotlin-dsl' ? 'kts' : '';

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    buildFileExt,
    projectType: options.projectType || 'application',
    gradleVersion: options.gradleVersion || '8.5',
    javaVersion: options.javaVersion || '17',
    buildTool: options.buildTool || 'gradle',
    groupId: options.groupId || 'com.example',
    initWrapper: options.initWrapper !== false,
  };
}

function initializeGradleWrapper(options: NormalizedSchema): void {
  console.log(`\n🔧 Initializing Gradle wrapper in ${options.projectRoot}...\n`);

  try {
    execSync(
      `gradle wrapper --gradle-version ${options.gradleVersion}`,
      {
        cwd: options.projectRoot,
        stdio: 'inherit',
      }
    );

    console.log(`\n✅ Gradle wrapper initialized successfully\n`);
  } catch (error) {
    console.error(`\n⚠️  Failed to initialize Gradle wrapper. You can run 'gradle wrapper' manually.\n`);
  }
}
