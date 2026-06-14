/**
 * Unit tests for the DTO -> TenantThemeConfig mapper and hasThemeData.
 */
import { hasThemeData, toTenantThemeConfig } from './mapToThemeConfig';
import { TEST_DEFAULT_CONFIG } from './testFixtures';

describe('toTenantThemeConfig', () => {
  it('falls back to defaults when colors are missing', () => {
    const config = toTenantThemeConfig({ presetId: 'minimal' }, TEST_DEFAULT_CONFIG);

    expect(config.primary).toBe(TEST_DEFAULT_CONFIG.primary);
    expect(config.secondary).toBe(TEST_DEFAULT_CONFIG.secondary);
    expect(config.accent).toBe(TEST_DEFAULT_CONFIG.accent);
    expect(config.light).toEqual(TEST_DEFAULT_CONFIG.light);
    expect(config.dark).toEqual(TEST_DEFAULT_CONFIG.dark);
  });

  it('falls back per-field when a color value is null', () => {
    const config = toTenantThemeConfig(
      { colors: { primary: null, background: '#abcabc' } },
      TEST_DEFAULT_CONFIG,
    );

    expect(config.primary).toBe(TEST_DEFAULT_CONFIG.primary);
    expect(config.light.background).toBe('#abcabc');
    expect(config.light.surface).toBe(TEST_DEFAULT_CONFIG.light.surface);
  });

  it('maps the error semantic color from the DTO', () => {
    const config = toTenantThemeConfig({ colors: { error: '#dead00' } }, TEST_DEFAULT_CONFIG);
    expect(config.semantic?.error).toBe('#dead00');
  });

  it('falls back to the default error semantic when absent', () => {
    const config = toTenantThemeConfig({ colors: { primary: '#1' } }, TEST_DEFAULT_CONFIG);
    expect(config.semantic?.error).toBe(TEST_DEFAULT_CONFIG.semantic?.error);
  });

  it('maps typography when present', () => {
    const config = toTenantThemeConfig(
      { typography: { fontFamily: 'Inter', headerScale: 1.25, bodyScale: 1 } },
      TEST_DEFAULT_CONFIG,
    );

    expect(config.typography).toEqual({ fontFamily: 'Inter', headingScale: 1.25 });
  });

  it('maps typography with null inner fields to undefined', () => {
    const config = toTenantThemeConfig(
      { typography: { fontFamily: null, headerScale: null } },
      TEST_DEFAULT_CONFIG,
    );

    expect(config.typography).toEqual({ fontFamily: undefined, headingScale: undefined });
  });

  it('returns undefined typography when absent', () => {
    const config = toTenantThemeConfig({ presetId: 'x' }, TEST_DEFAULT_CONFIG);
    expect(config.typography).toBeUndefined();
  });

  it('maps branding ids, defaulting nulls', () => {
    const config = toTenantThemeConfig(
      { presetId: 'ocean', logoContentId: 'logo-1' },
      TEST_DEFAULT_CONFIG,
    );

    expect(config.branding).toEqual({
      presetId: 'ocean',
      logoContentId: 'logo-1',
      faviconContentId: null,
    });
  });
});

describe('hasThemeData', () => {
  it('is true when presetId is present', () => {
    expect(hasThemeData({ presetId: 'ocean' })).toBe(true);
  });

  it('is true when colors are present', () => {
    expect(hasThemeData({ colors: { primary: '#1' } })).toBe(true);
  });

  it('is true when darkColors are present', () => {
    expect(hasThemeData({ darkColors: { primary: '#1' } })).toBe(true);
  });

  it('is true when typography is present', () => {
    expect(hasThemeData({ typography: { fontFamily: 'Inter' } })).toBe(true);
  });

  it('is false for an empty DTO', () => {
    expect(hasThemeData({})).toBe(false);
  });
});
