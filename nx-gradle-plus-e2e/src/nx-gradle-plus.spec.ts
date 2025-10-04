import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommand,
  uniq,
} from '@nx/plugin/testing';

describe('nx-gradle-plus e2e', () => {
  beforeAll(() => {
    ensureNxProject('nx-gradle-plus', 'dist/nx-gradle-plus');
  });

  afterAll(() => {
    // Cleanup
  });

  describe('project generator', () => {
    it('should generate a Gradle application', async () => {
      const project = uniq('gradle-app');

      runNxCommand(
        `generate nx-gradle-plus:project ${project} --projectType=application`
      );

      expect(() =>
        checkFilesExist(
          `apps/${project}/build.gradle`,
          `apps/${project}/settings.gradle`,
          `apps/${project}/src/main/java/Main.java`,
          `apps/${project}/src/test/java/MainTest.java`
        )
      ).not.toThrow();

      const projectConfig = readJson(`apps/${project}/project.json`);
      expect(projectConfig.targets.build).toBeDefined();
      expect(projectConfig.targets.test).toBeDefined();
      expect(projectConfig.targets.build.executor).toBe('nx-gradle-plus:build');
    }, 120000);

    it('should generate a Gradle library', async () => {
      const project = uniq('gradle-lib');

      runNxCommand(
        `generate nx-gradle-plus:project ${project} --projectType=library --directory=libs`
      );

      expect(() =>
        checkFilesExist(
          `libs/${project}/build.gradle`,
          `libs/${project}/src/main/java/Main.java`
        )
      ).not.toThrow();
    }, 120000);

    it('should generate Kotlin DSL build file', async () => {
      const project = uniq('gradle-kotlin');

      runNxCommand(
        `generate nx-gradle-plus:project ${project} --buildTool=gradle-kotlin-dsl`
      );

      expect(() =>
        checkFilesExist(`apps/${project}/build.gradle.kts`)
      ).not.toThrow();
    }, 120000);
  });

  describe('build executor', () => {
    it('should build a Gradle project', async () => {
      const project = uniq('gradle-build');

      runNxCommand(
        `generate nx-gradle-plus:project ${project} --projectType=application`
      );

      const result = runNxCommand(`build ${project}`);
      expect(result).toContain('BUILD SUCCESSFUL');
    }, 180000);
  });

  describe('test executor', () => {
    it('should run Gradle tests', async () => {
      const project = uniq('gradle-test');

      runNxCommand(
        `generate nx-gradle-plus:project ${project} --projectType=application`
      );

      const result = runNxCommand(`test ${project}`);
      expect(result).toContain('BUILD SUCCESSFUL');
    }, 180000);

    it('should run tests with coverage', async () => {
      const project = uniq('gradle-coverage');

      runNxCommand(
        `generate nx-gradle-plus:project ${project} --projectType=application`
      );

      const result = runNxCommand(`test ${project} --codeCoverage=true`);
      expect(result).toContain('BUILD SUCCESSFUL');

      expect(() =>
        checkFilesExist(`apps/${project}/build/reports/jacoco`)
      ).not.toThrow();
    }, 180000);
  });

  describe('caching', () => {
    it('should cache build results', async () => {
      const project = uniq('gradle-cache');

      runNxCommand(
        `generate nx-gradle-plus:project ${project}`
      );

      // First build
      const result1 = runNxCommand(`build ${project}`);
      expect(result1).not.toContain('[existing outputs match the cache]');

      // Second build should use cache
      const result2 = runNxCommand(`build ${project}`);
      expect(result2).toContain('[existing outputs match the cache]');
    }, 240000);
  });
});
