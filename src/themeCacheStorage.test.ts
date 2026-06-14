/**
 * Unit tests for the tenant theme localStorage cache utilities.
 * Tests cache read/write/clear logic, expiry, error handling, and the
 * injectable warn logger. Does NOT test rendering.
 */
import {
  readThemeCache,
  writeThemeCache,
  clearThemeCache,
  clearAllThemeCaches,
  configureThemeCacheLogger,
  MAX_CACHE_AGE_MS,
  CACHE_KEY_PREFIX,
} from './themeCacheStorage';
import { TEST_DEFAULT_CONFIG } from './testFixtures';

import type { CachedThemeData } from './types';

const TEST_TENANT_ID = 'tenant-123';
const TEST_CACHE_KEY = `${CACHE_KEY_PREFIX}${TEST_TENANT_ID}`;
const MOCK_CONFIG = TEST_DEFAULT_CONFIG;
const MOCK_ETAG = '"etag-value-1"';

function createCachedData(overrides?: Partial<CachedThemeData>): CachedThemeData {
  return {
    config: MOCK_CONFIG,
    logoUrl: MOCK_CONFIG.branding.logoContentId,
    faviconUrl: MOCK_CONFIG.branding.faviconContentId,
    etag: MOCK_ETAG,
    cachedAt: Date.now(),
    ...overrides,
  };
}

describe('themeCacheStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
    configureThemeCacheLogger(undefined);
  });

  describe('writeThemeCache', () => {
    it('writes cache data to localStorage', () => {
      writeThemeCache(TEST_TENANT_ID, MOCK_CONFIG, MOCK_ETAG);

      const stored = localStorage.getItem(TEST_CACHE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored as string) as CachedThemeData;
      expect(parsed.config).toEqual(MOCK_CONFIG);
      expect(parsed.etag).toBe(MOCK_ETAG);
      expect(parsed.logoUrl).toBe(MOCK_CONFIG.branding.logoContentId);
      expect(parsed.faviconUrl).toBe(MOCK_CONFIG.branding.faviconContentId);
      expect(typeof parsed.cachedAt).toBe('number');
    });

    it('does not throw when localStorage.setItem throws', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => writeThemeCache(TEST_TENANT_ID, MOCK_CONFIG, MOCK_ETAG)).not.toThrow();
    });
  });

  describe('readThemeCache', () => {
    it('returns cached data when valid and not expired', () => {
      localStorage.setItem(TEST_CACHE_KEY, JSON.stringify(createCachedData()));

      const result = readThemeCache(TEST_TENANT_ID);
      expect(result?.config).toEqual(MOCK_CONFIG);
      expect(result?.etag).toBe(MOCK_ETAG);
    });

    it('returns null when no cache exists', () => {
      expect(readThemeCache(TEST_TENANT_ID)).toBeNull();
    });

    it('returns null when cache is expired', () => {
      const data = createCachedData({ cachedAt: Date.now() - MAX_CACHE_AGE_MS - 1 });
      localStorage.setItem(TEST_CACHE_KEY, JSON.stringify(data));

      expect(readThemeCache(TEST_TENANT_ID)).toBeNull();
    });

    it('returns null when cache data is corrupt JSON', () => {
      localStorage.setItem(TEST_CACHE_KEY, 'not-valid-json');
      expect(readThemeCache(TEST_TENANT_ID)).toBeNull();
    });

    it('returns null when cache is missing required fields', () => {
      localStorage.setItem(TEST_CACHE_KEY, JSON.stringify({ unrelated: true }));
      expect(readThemeCache(TEST_TENANT_ID)).toBeNull();
    });

    it('returns null when the stored value is not a record (e.g. a number)', () => {
      localStorage.setItem(TEST_CACHE_KEY, '42');
      expect(readThemeCache(TEST_TENANT_ID)).toBeNull();
    });

    it('returns null when the stored config is not an object', () => {
      localStorage.setItem(TEST_CACHE_KEY, JSON.stringify({ config: 'nope', cachedAt: Date.now() }));
      expect(readThemeCache(TEST_TENANT_ID)).toBeNull();
    });

    it('does not throw when localStorage.getItem throws', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      expect(() => readThemeCache(TEST_TENANT_ID)).not.toThrow();
      expect(readThemeCache(TEST_TENANT_ID)).toBeNull();
    });
  });

  describe('clearThemeCache', () => {
    it('removes the cache entry for the specified tenant', () => {
      writeThemeCache(TEST_TENANT_ID, MOCK_CONFIG, MOCK_ETAG);
      clearThemeCache(TEST_TENANT_ID);
      expect(localStorage.getItem(TEST_CACHE_KEY)).toBeNull();
    });

    it('does not throw when cache does not exist', () => {
      expect(() => clearThemeCache('non-existent')).not.toThrow();
    });

    it('does not throw when localStorage.removeItem throws', () => {
      jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      expect(() => clearThemeCache(TEST_TENANT_ID)).not.toThrow();
    });
  });

  describe('clearAllThemeCaches', () => {
    it('removes all tenant theme cache entries', () => {
      writeThemeCache('tenant-1', MOCK_CONFIG, MOCK_ETAG);
      writeThemeCache('tenant-2', MOCK_CONFIG, MOCK_ETAG);
      localStorage.setItem('unrelated-key', 'keep-me');

      clearAllThemeCaches();

      expect(localStorage.getItem(`${CACHE_KEY_PREFIX}tenant-1`)).toBeNull();
      expect(localStorage.getItem(`${CACHE_KEY_PREFIX}tenant-2`)).toBeNull();
      expect(localStorage.getItem('unrelated-key')).toBe('keep-me');
    });

    it('does not throw on empty localStorage', () => {
      expect(() => clearAllThemeCaches()).not.toThrow();
    });

    it('does not throw when localStorage iteration throws', () => {
      jest.spyOn(Storage.prototype, 'key').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      // Force length > 0 so the loop runs and key() is called.
      jest.spyOn(Storage.prototype, 'length', 'get').mockReturnValue(1);

      expect(() => clearAllThemeCaches()).not.toThrow();
    });
  });

  describe('when localStorage is unavailable', () => {
    let descriptor: PropertyDescriptor | undefined;

    beforeEach(() => {
      descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
      // Make any access to window.localStorage throw -> isStorageAvailable() === false.
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new Error('SecurityError: storage disabled');
        },
      });
    });

    afterEach(() => {
      if (descriptor) {
        Object.defineProperty(window, 'localStorage', descriptor);
      }
    });

    it('readThemeCache returns null', () => {
      expect(readThemeCache(TEST_TENANT_ID)).toBeNull();
    });

    it('writeThemeCache is a no-op (no throw)', () => {
      expect(() => writeThemeCache(TEST_TENANT_ID, MOCK_CONFIG, MOCK_ETAG)).not.toThrow();
    });

    it('clearThemeCache is a no-op (no throw)', () => {
      expect(() => clearThemeCache(TEST_TENANT_ID)).not.toThrow();
    });

    it('clearAllThemeCaches is a no-op (no throw)', () => {
      expect(() => clearAllThemeCaches()).not.toThrow();
    });
  });

  describe('when window is undefined (SSR)', () => {
    let descriptor: PropertyDescriptor | undefined;

    beforeEach(() => {
      descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: undefined,
      });
    });

    afterEach(() => {
      if (descriptor) {
        Object.defineProperty(globalThis, 'window', descriptor);
      }
    });

    it('readThemeCache returns null without touching storage', () => {
      expect(readThemeCache(TEST_TENANT_ID)).toBeNull();
    });
  });

  describe('configureThemeCacheLogger', () => {
    it('calls the supplied warn logger on a failure', () => {
      const warn = jest.fn();
      configureThemeCacheLogger(warn);
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('boom');
      });

      readThemeCache(TEST_TENANT_ID);

      expect(warn).toHaveBeenCalledWith('themeCacheStorage', 'Failed to read theme cache', expect.any(Error));
    });

    it('is silent (no throw) when the logger is unset', () => {
      configureThemeCacheLogger(undefined);
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('boom');
      });

      expect(() => readThemeCache(TEST_TENANT_ID)).not.toThrow();
    });
  });
});
