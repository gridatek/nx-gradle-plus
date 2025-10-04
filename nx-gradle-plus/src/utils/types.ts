export interface GradleProject {
  name: string;
  path: string;
  buildFile: string;
  buildFileType: 'groovy' | 'kotlin';
  settingsFile?: string;
  hasWrapper: boolean;
  wrapperPath?: string;
  subprojects?: string[];
}

export interface GradleDependency {
  configuration: string;
  group?: string;
  name: string;
  version?: string;
  isProject?: boolean;
  projectPath?: string;
}

export interface GradleBuild {
  plugins: string[];
  dependencies: GradleDependency[];
  repositories: string[];
  sourceCompatibility?: string;
  targetCompatibility?: string;
  group?: string;
  version?: string;
}

export interface DependencyGraph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, string[]>;
}

export interface GraphNode {
  projectName: string;
  projectPath: string;
  dependencies: string[];
}

export interface ExecutorOptions {
  gradlePath: string;
  task?: string;
  args?: string[];
  javaHome?: string;
  gradleOpts?: string[];
  useWrapper?: boolean;
}

export interface GeneratorOptions {
  name: string;
  directory?: string;
  projectType?: 'application' | 'library';
  gradleVersion?: string;
  javaVersion?: string;
  buildTool?: 'gradle' | 'gradle-kotlin-dsl';
}
