/**
 * Unit tests for the tenant theme save mapper + PUT logic.
 */
import { saveTenantTheme, toApiThemeRequest } from './saveTenantTheme';
import { TEST_DEFAULT_CONFIG } from './testFixtures';

import type { HttpPut, TenantThemeConfig } from './types';

const TENANT_ID = 'tenant-123';

describe('toApiThemeRequest', () => {
  it('maps a full config to the API request body', () => {
    const config: TenantThemeConfig = {
      ...TEST_DEFAULT_CONFIG,
      primary: '#0077b6',
      secondary: '#90e0ef',
      semantic: { error: '#ff0000' },
      typography: { fontFamily: 'Inter', headingScale: 1.25 },
      branding: { presetId: 'ocean', logoContentId: 'logo-1', faviconContentId: 'fav-1' },
    };

    const body = toApiThemeRequest(config);

    expect(body.presetId).toBe('ocean');
    expect(body.colors.primary).toBe('#0077b6');
    expect(body.colors.onBackground).toBe(config.light.text);
    expect(body.colors.onSurface).toBe(config.light.textSecondary);
    expect(body.colors.error).toBe('#ff0000');
    expect(body.darkColors.background).toBe(config.dark.background);
    expect(body.darkColors.onBackground).toBe(config.dark.text);
    expect(body.typography).toEqual({ fontFamily: 'Inter', headerScale: 1.25 });
    expect(body.logoContentId).toBe('logo-1');
    expect(body.faviconContentId).toBe('fav-1');
  });

  it('nulls out optional fields when absent', () => {
    const config: TenantThemeConfig = {
      ...TEST_DEFAULT_CONFIG,
      semantic: undefined,
      typography: undefined,
      branding: { presetId: null, logoContentId: null, faviconContentId: null },
    };

    const body = toApiThemeRequest(config);

    expect(body.presetId).toBeNull();
    expect(body.colors.error).toBeNull();
    expect(body.darkColors.error).toBeNull();
    expect(body.typography).toBeNull();
    expect(body.logoContentId).toBeNull();
    expect(body.faviconContentId).toBeNull();
  });

  it('nulls typography inner fields when undefined', () => {
    const config: TenantThemeConfig = {
      ...TEST_DEFAULT_CONFIG,
      typography: {},
    };

    const body = toApiThemeRequest(config);

    expect(body.typography).toEqual({ fontFamily: null, headerScale: null });
  });
});

describe('saveTenantTheme', () => {
  it('PUTs the mapped body via the injected transport and returns the response', async () => {
    const putMock = jest.fn().mockResolvedValue({ success: true });
    const httpPut = ((args: unknown) => putMock(args) as unknown) as HttpPut;

    const result = await saveTenantTheme(TENANT_ID, TEST_DEFAULT_CONFIG, httpPut);

    expect(result).toEqual({ success: true });
    expect(putMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `/api/tenants/${TENANT_ID}/theme`,
        headers: { 'Content-Type': 'application/json' },
        data: toApiThemeRequest(TEST_DEFAULT_CONFIG),
      }),
    );
  });
});
