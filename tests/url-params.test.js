/**
 * Tests for URL Parameters utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock window and URL for testing
const mockWindow = {};
global.window = mockWindow;

// Load the module (it attaches to window)
const fs = await import('fs');
const path = await import('path');
const code = fs.readFileSync(path.join(process.cwd(), 'src/lib/url-params.js'), 'utf-8');
eval(code);

describe('URL_PARAMS', () => {
  it('should define hsDebug parameter', () => {
    expect(window.URL_PARAMS.hsDebug).toEqual({ key: 'hsDebug', value: 'true' });
  });

  it('should define cacheBuster parameter with function value', () => {
    expect(window.URL_PARAMS.cacheBuster.key).toBe('hsCacheBuster');
    expect(typeof window.URL_PARAMS.cacheBuster.value).toBe('function');
  });

  it('should define developerMode parameter', () => {
    expect(window.URL_PARAMS.developerMode).toEqual({ key: 'developerMode', value: 'true' });
  });
});

describe('getActiveParams', () => {
  it('should return empty object when no modes are active', () => {
    const result = window.getActiveParams({
      hsDebug: false,
      cacheBuster: false,
      developerMode: false
    });
    expect(result).toEqual({});
  });

  it('should return hsDebug param when hsDebug is active', () => {
    const result = window.getActiveParams({
      hsDebug: true,
      cacheBuster: false,
      developerMode: false
    });
    expect(result).toEqual({ hsDebug: 'true' });
  });

  it('should return multiple params when multiple modes are active', () => {
    const result = window.getActiveParams({
      hsDebug: true,
      cacheBuster: false,
      developerMode: true
    });
    expect(result).toEqual({
      hsDebug: 'true',
      developerMode: 'true'
    });
  });

  it('should generate timestamp for cacheBuster', () => {
    const before = Date.now();
    const result = window.getActiveParams({
      hsDebug: false,
      cacheBuster: true,
      developerMode: false
    });
    const after = Date.now();

    expect(result.hsCacheBuster).toBeDefined();
    const timestamp = parseInt(result.hsCacheBuster, 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

describe('addParamsToUrl', () => {
  it('should add params to URL without existing query string', () => {
    const result = window.addParamsToUrl('https://example.com/page', { hsDebug: 'true' });
    expect(result).toBe('https://example.com/page?hsDebug=true');
  });

  it('should add params to URL with existing query string', () => {
    const result = window.addParamsToUrl('https://example.com/page?foo=bar', { hsDebug: 'true' });
    expect(result).toBe('https://example.com/page?foo=bar&hsDebug=true');
  });

  it('should not duplicate existing params', () => {
    const result = window.addParamsToUrl('https://example.com/page?hsDebug=true', { hsDebug: 'true' });
    expect(result).toBe('https://example.com/page?hsDebug=true');
  });

  it('should handle invalid URLs gracefully', () => {
    const result = window.addParamsToUrl('not-a-url', { hsDebug: 'true' });
    expect(result).toBe('not-a-url');
  });

  it('should add multiple params', () => {
    const result = window.addParamsToUrl('https://example.com/', {
      hsDebug: 'true',
      developerMode: 'true'
    });
    expect(result).toContain('hsDebug=true');
    expect(result).toContain('developerMode=true');
  });
});

describe('removeParamsFromUrl', () => {
  it('should remove hsDebug param', () => {
    const result = window.removeParamsFromUrl('https://example.com/page?hsDebug=true');
    expect(result).toBe('https://example.com/page');
  });

  it('should remove hsCacheBuster param', () => {
    const result = window.removeParamsFromUrl('https://example.com/page?hsCacheBuster=123456');
    expect(result).toBe('https://example.com/page');
  });

  it('should remove developerMode param', () => {
    const result = window.removeParamsFromUrl('https://example.com/page?developerMode=true');
    expect(result).toBe('https://example.com/page');
  });

  it('should remove all our params but keep others', () => {
    const result = window.removeParamsFromUrl('https://example.com/page?foo=bar&hsDebug=true&developerMode=true');
    expect(result).toBe('https://example.com/page?foo=bar');
  });

  it('should handle invalid URLs gracefully', () => {
    const result = window.removeParamsFromUrl('not-a-url');
    expect(result).toBe('not-a-url');
  });
});