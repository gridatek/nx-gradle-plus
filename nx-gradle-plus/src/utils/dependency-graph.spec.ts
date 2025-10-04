import { buildDependencyGraph, detectCircularDependencies, getTopologicalSort } from './dependency-graph';
import type { GradleProject } from './types';

jest.mock('./gradle-parser');

describe('dependency-graph', () => {
  const mockProjects: GradleProject[] = [
    {
      name: 'core',
      path: 'libs/core',
      buildFile: 'libs/core/build.gradle',
      buildFileType: 'groovy',
      hasWrapper: false,
    },
    {
      name: 'api',
      path: 'apps/api',
      buildFile: 'apps/api/build.gradle',
      buildFileType: 'groovy',
      hasWrapper: false,
    },
    {
      name: 'shared',
      path: 'libs/shared',
      buildFile: 'libs/shared/build.gradle',
      buildFileType: 'groovy',
      hasWrapper: false,
    },
  ];

  describe('buildDependencyGraph', () => {
    it('should build a dependency graph', () => {
      const graph = buildDependencyGraph(mockProjects);

      expect(graph.nodes.size).toBe(3);
      expect(graph.nodes.has('core')).toBe(true);
      expect(graph.nodes.has('api')).toBe(true);
      expect(graph.nodes.has('shared')).toBe(true);
    });
  });

  describe('detectCircularDependencies', () => {
    it('should detect circular dependencies', () => {
      const graph = {
        nodes: new Map([
          ['a', { projectName: 'a', projectPath: 'a', dependencies: ['b'] }],
          ['b', { projectName: 'b', projectPath: 'b', dependencies: ['c'] }],
          ['c', { projectName: 'c', projectPath: 'c', dependencies: ['a'] }],
        ]),
        edges: new Map([
          ['a', ['b']],
          ['b', ['c']],
          ['c', ['a']],
        ]),
      };

      const cycles = detectCircularDependencies(graph);

      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should return empty array for acyclic graph', () => {
      const graph = {
        nodes: new Map([
          ['a', { projectName: 'a', projectPath: 'a', dependencies: ['b'] }],
          ['b', { projectName: 'b', projectPath: 'b', dependencies: [] }],
        ]),
        edges: new Map([
          ['a', ['b']],
          ['b', []],
        ]),
      };

      const cycles = detectCircularDependencies(graph);

      expect(cycles).toEqual([]);
    });
  });

  describe('getTopologicalSort', () => {
    it('should return projects in build order', () => {
      const graph = {
        nodes: new Map([
          ['core', { projectName: 'core', projectPath: 'core', dependencies: [] }],
          ['api', { projectName: 'api', projectPath: 'api', dependencies: ['core'] }],
          ['web', { projectName: 'web', projectPath: 'web', dependencies: ['api', 'core'] }],
        ]),
        edges: new Map([
          ['core', []],
          ['api', ['core']],
          ['web', ['api', 'core']],
        ]),
      };

      const sorted = getTopologicalSort(graph);

      // core should come before api and web
      // api should come before web
      expect(sorted.indexOf('core')).toBeLessThan(sorted.indexOf('api'));
      expect(sorted.indexOf('core')).toBeLessThan(sorted.indexOf('web'));
      expect(sorted.indexOf('api')).toBeLessThan(sorted.indexOf('web'));
    });

    it('should throw error for circular dependencies', () => {
      const graph = {
        nodes: new Map([
          ['a', { projectName: 'a', projectPath: 'a', dependencies: ['b'] }],
          ['b', { projectName: 'b', projectPath: 'b', dependencies: ['a'] }],
        ]),
        edges: new Map([
          ['a', ['b']],
          ['b', ['a']],
        ]),
      };

      expect(() => getTopologicalSort(graph)).toThrow();
    });
  });
});
