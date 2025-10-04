import type {
  GradleProject,
  DependencyGraph,
  GraphNode,
  GradleDependency,
} from './types';
import { parseBuildGradle, parseSettingsGradle } from './gradle-parser';

/**
 * Build a dependency graph from Gradle projects
 */
export function buildDependencyGraph(
  projects: GradleProject[]
): DependencyGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, string[]>();

  // First pass: Create nodes
  for (const project of projects) {
    nodes.set(project.name, {
      projectName: project.name,
      projectPath: project.path,
      dependencies: [],
    });
    edges.set(project.name, []);
  }

  // Second pass: Extract dependencies
  for (const project of projects) {
    const build = parseBuildGradle(project.buildFile);
    const projectDeps = extractProjectDependencies(build.dependencies, projects);

    const node = nodes.get(project.name)!;
    node.dependencies = projectDeps;
    edges.set(project.name, projectDeps);
  }

  return { nodes, edges };
}

/**
 * Extract project dependencies from Gradle dependencies
 */
function extractProjectDependencies(
  dependencies: GradleDependency[],
  allProjects: GradleProject[]
): string[] {
  const projectDeps: string[] = [];

  for (const dep of dependencies) {
    if (dep.isProject && dep.projectPath) {
      // Convert Gradle project path to project name
      const projectName = resolveProjectName(dep.projectPath, allProjects);
      if (projectName) {
        projectDeps.push(projectName);
      }
    }
  }

  return projectDeps;
}

/**
 * Resolve Gradle project path to Nx project name
 */
function resolveProjectName(
  gradlePath: string,
  allProjects: GradleProject[]
): string | null {
  // Gradle paths are like :subproject or :parent:child
  const pathParts = gradlePath.split(':').filter(Boolean);

  for (const project of allProjects) {
    const projectParts = project.path.split('/').filter(Boolean);

    // Check if paths match
    if (pathParts.length === projectParts.length) {
      let matches = true;
      for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i] !== projectParts[projectParts.length - pathParts.length + i]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return project.name;
      }
    }
  }

  return null;
}

/**
 * Detect circular dependencies in the graph
 */
export function detectCircularDependencies(
  graph: DependencyGraph
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = graph.edges.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        cycles.push(path.slice(cycleStart));
      }
    }

    recursionStack.delete(node);
  }

  for (const node of graph.nodes.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

/**
 * Get topological sort of projects (build order)
 */
export function getTopologicalSort(graph: DependencyGraph): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();

  function visit(node: string): void {
    if (temp.has(node)) {
      throw new Error(`Circular dependency detected involving ${node}`);
    }
    if (visited.has(node)) {
      return;
    }

    temp.add(node);

    const neighbors = graph.edges.get(node) || [];
    for (const neighbor of neighbors) {
      visit(neighbor);
    }

    temp.delete(node);
    visited.add(node);
    sorted.push(node);
  }

  for (const node of graph.nodes.keys()) {
    if (!visited.has(node)) {
      visit(node);
    }
  }

  return sorted.reverse();
}

/**
 * Get all transitive dependencies of a project
 */
export function getTransitiveDependencies(
  projectName: string,
  graph: DependencyGraph
): Set<string> {
  const transitive = new Set<string>();
  const visited = new Set<string>();

  function traverse(node: string): void {
    if (visited.has(node)) {
      return;
    }
    visited.add(node);

    const neighbors = graph.edges.get(node) || [];
    for (const neighbor of neighbors) {
      transitive.add(neighbor);
      traverse(neighbor);
    }
  }

  traverse(projectName);
  return transitive;
}
