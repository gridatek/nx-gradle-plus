import { parseBuildGradle, parseSettingsGradle } from './gradle-parser';
import { vol } from 'memfs';

jest.mock('fs');

describe('gradle-parser', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('parseBuildGradle', () => {
    it('should parse Groovy build file', () => {
      const buildFile = `
        plugins {
          id 'java'
          id 'org.springframework.boot' version '3.2.0'
        }

        group = 'com.example'
        version = '1.0.0'
        sourceCompatibility = '17'

        repositories {
          mavenCentral()
        }

        dependencies {
          implementation 'org.springframework.boot:spring-boot-starter-web:3.2.0'
          testImplementation 'junit:junit:4.13.2'
          implementation project(':shared')
        }
      `;

      vol.fromJSON({
        '/project/build.gradle': buildFile,
      });

      const parsed = parseBuildGradle('/project/build.gradle');

      expect(parsed.plugins).toContain('java');
      expect(parsed.plugins).toContain('org.springframework.boot');
      expect(parsed.group).toBe('com.example');
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.sourceCompatibility).toBe('17');
      expect(parsed.repositories).toContain('mavenCentral');
      expect(parsed.dependencies).toHaveLength(3);
      expect(parsed.dependencies[0]).toMatchObject({
        configuration: 'implementation',
        group: 'org.springframework.boot',
        name: 'spring-boot-starter-web',
        version: '3.2.0',
      });
      expect(parsed.dependencies[2]).toMatchObject({
        configuration: 'implementation',
        isProject: true,
        projectPath: ':shared',
      });
    });

    it('should parse Kotlin DSL build file', () => {
      const buildFile = `
        plugins {
          id("java")
          kotlin("jvm") version "1.9.0"
        }

        group = "com.example"
        version = "1.0.0"

        dependencies {
          implementation("org.jetbrains.kotlin:kotlin-stdlib:1.9.0")
          implementation(project(":core"))
        }
      `;

      vol.fromJSON({
        '/project/build.gradle.kts': buildFile,
      });

      const parsed = parseBuildGradle('/project/build.gradle.kts');

      expect(parsed.plugins).toContain('java');
      expect(parsed.plugins).toContain('jvm');
      expect(parsed.dependencies).toHaveLength(2);
    });
  });

  describe('parseSettingsGradle', () => {
    it('should parse subprojects from Groovy settings', () => {
      const settingsFile = `
        rootProject.name = 'my-project'

        include 'core'
        include 'api'
        include 'shared:utils'
      `;

      vol.fromJSON({
        '/project/settings.gradle': settingsFile,
      });

      const subprojects = parseSettingsGradle('/project/settings.gradle');

      expect(subprojects).toEqual(['core', 'api', 'shared:utils']);
    });

    it('should parse subprojects from Kotlin DSL settings', () => {
      const settingsFile = `
        rootProject.name = "my-project"

        include("core")
        include("api")
      `;

      vol.fromJSON({
        '/project/settings.gradle.kts': settingsFile,
      });

      const subprojects = parseSettingsGradle('/project/settings.gradle.kts');

      expect(subprojects).toEqual(['core', 'api']);
    });
  });
});
