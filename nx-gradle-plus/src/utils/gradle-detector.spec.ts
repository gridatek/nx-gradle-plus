import {
  detectGradleWrapper,
  getGradleCommand,
  isGradleProject,
} from './gradle-detector';
import { vol } from 'memfs';

jest.mock('fs');
jest.mock('fs/promises');

describe('gradle-detector', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('detectGradleWrapper', () => {
    it('should detect Unix wrapper', () => {
      vol.fromJSON({
        '/project/gradlew': '#!/bin/sh',
        '/project/gradle/wrapper/gradle-wrapper.jar': 'binary',
      });

      const wrapper = detectGradleWrapper('/project');
      expect(wrapper).toBe('/project/gradlew');
    });

    it('should detect Windows wrapper on Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });

      vol.fromJSON({
        '/project/gradlew.bat': '@echo off',
        '/project/gradle/wrapper/gradle-wrapper.jar': 'binary',
      });

      const wrapper = detectGradleWrapper('/project');
      expect(wrapper).toBe('/project/gradlew.bat');
    });

    it('should return null if no wrapper exists', () => {
      const wrapper = detectGradleWrapper('/project');
      expect(wrapper).toBeNull();
    });
  });

  describe('getGradleCommand', () => {
    it('should return wrapper command when available', () => {
      vol.fromJSON({
        '/project/gradlew': '#!/bin/sh',
        '/project/gradle/wrapper/gradle-wrapper.jar': 'binary',
      });

      const cmd = getGradleCommand('/project', true);
      expect(cmd).toBe('/project/gradlew');
    });

    it('should return gradle when wrapper not found', () => {
      const cmd = getGradleCommand('/project', true);
      expect(cmd).toBe('gradle');
    });

    it('should return gradle when useWrapper is false', () => {
      vol.fromJSON({
        '/project/gradlew': '#!/bin/sh',
        '/project/gradle/wrapper/gradle-wrapper.jar': 'binary',
      });

      const cmd = getGradleCommand('/project', false);
      expect(cmd).toBe('gradle');
    });
  });

  describe('isGradleProject', () => {
    it('should return true for Groovy build file', () => {
      vol.fromJSON({
        '/project/build.gradle': 'plugins { id "java" }',
      });

      expect(isGradleProject('/project')).toBe(true);
    });

    it('should return true for Kotlin build file', () => {
      vol.fromJSON({
        '/project/build.gradle.kts': 'plugins { id("java") }',
      });

      expect(isGradleProject('/project')).toBe(true);
    });

    it('should return false when no build file exists', () => {
      expect(isGradleProject('/project')).toBe(false);
    });
  });
});
