/**
 * Unit tests for fetchTenantTheme.
 *
 * Tests ETag support, 304 Not Modified handling, DTO transformation, and error
 * scenarios via the injected httpGet port. Does NOT test rendering.
 */
import { fetchTenantTheme } from './fetchTenantTheme';
import { TEST_DEFAULT_CONFIG } from './testFixtures';

import type { HttpGet, HttpResponse } from './types';

const MOCK_TENANT_ID = 'tenant-123';
const MOCK_ETAG = '"etag-abc"';
const BASE_URL = 'http://test-identity:5002';

const mockGet = jest.fn();
const httpGet = ((args: unknown) => mockGet(args) as unknown) as HttpGet;

function baseOptions(extra?: Record<string, unknown>): Parameters<typeof fetchTenantTheme>[1] {
  return { httpGet, defaultThemeConfig: TEST_DEFAULT_CONFIG, baseURL: BASE_URL, ...extra };
}

function createResponse(data: unknown, status: number, etag?: string): HttpResponse {
  return {
    data,
    status,
    headers: typeof etag === 'string' && etag.length > 0 ? { etag } : {},
  };
}

describe('fetchTenantTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends GET to the correct URL + baseURL', async () => {
    mockGet.mockResolvedValue(createResponse({}, 200));

    await fetchTenantTheme(MOCK_TENANT_ID, baseOptions());

    expect(mockGet).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `/api/tenants/${MOCK_TENANT_ID}/theme`,
        baseURL: BASE_URL,
      }),
    );
  });

  it('sends If-None-Match header when cachedEtag is provided', async () => {
    mockGet.mockResolvedValue(createResponse({}, 200));

    await fetchTenantTheme(MOCK_TENANT_ID, baseOptions({ cachedEtag: MOCK_ETAG }));

    const args = mockGet.mock.calls[0][0] as { headers: Record<string, string> };
    expect(args.headers['If-None-Match']).toBe(MOCK_ETAG);
  });

  it('does not send If-None-Match when no cachedEtag', async () => {
    mockGet.mockResolvedValue(createResponse({}, 200));

    await fetchTenantTheme(MOCK_TENANT_ID, baseOptions());

    const args = mockGet.mock.calls[0][0] as { headers: Record<string, string> };
    expect(args.headers['If-None-Match']).toBeUndefined();
  });

  it('extracts ETag from response headers on 200', async () => {
    const dto = { presetId: 'ocean', colors: { primary: '#0077b6' } };
    mockGet.mockResolvedValue(createResponse(dto, 200, '"new-etag"'));

    const result = await fetchTenantTheme(MOCK_TENANT_ID, baseOptions());

    expect(result.etag).toBe('"new-etag"');
    expect(result.notModified).toBe(false);
    expect(result.themeConfig).not.toBeNull();
  });

  it('returns null etag when the header is missing', async () => {
    const dto = { presetId: 'ocean' };
    mockGet.mockResolvedValue(createResponse(dto, 200));

    const result = await fetchTenantTheme(MOCK_TENANT_ID, baseOptions());

    expect(result.etag).toBeNull();
  });

  it('returns notModified=true on 304 status', async () => {
    mockGet.mockResolvedValue(createResponse(null, 304));

    const result = await fetchTenantTheme(MOCK_TENANT_ID, baseOptions({ cachedEtag: MOCK_ETAG }));

    expect(result.notModified).toBe(true);
    expect(result.themeConfig).toBeNull();
    expect(result.etag).toBe(MOCK_ETAG);
  });

  it('returns null etag on 304 status when no cachedEtag', async () => {
    mockGet.mockResolvedValue(createResponse(null, 304));

    const result = await fetchTenantTheme(MOCK_TENANT_ID, baseOptions());

    expect(result.notModified).toBe(true);
    expect(result.etag).toBeNull();
  });

  it('transforms the API DTO to TenantThemeConfig format', async () => {
    const dto = {
      presetId: 'ocean',
      colors: {
        primary: '#0077b6',
        secondary: '#90e0ef',
        primaryLight: '#48cae4',
        background: '#caf0f8',
        surface: '#e0f7fa',
        onBackground: '#023047',
        onSurface: '#264653',
      },
      darkColors: {
        background: '#001219',
        surface: '#005f73',
        onBackground: '#caf0f8',
        onSurface: '#90e0ef',
      },
      logoContentId: 'logo-abc',
      faviconContentId: null,
    };
    mockGet.mockResolvedValue(createResponse(dto, 200, '"etag-xyz"'));

    const result = await fetchTenantTheme(MOCK_TENANT_ID, baseOptions());

    expect(result.themeConfig?.primary).toBe('#0077b6');
    expect(result.themeConfig?.secondary).toBe('#90e0ef');
    expect(result.themeConfig?.accent).toBe('#48cae4');
    expect(result.themeConfig?.light.background).toBe('#caf0f8');
    expect(result.themeConfig?.dark.background).toBe('#001219');
    expect(result.themeConfig?.branding.logoContentId).toBe('logo-abc');
    expect(result.themeConfig?.branding.presetId).toBe('ocean');
  });

  it('returns null config when the API returns an empty DTO', async () => {
    mockGet.mockResolvedValue(createResponse({}, 200));

    const result = await fetchTenantTheme(MOCK_TENANT_ID, baseOptions());

    expect(result.themeConfig).toBeNull();
    expect(result.notModified).toBe(false);
  });

  it('returns null config when the response data is null', async () => {
    mockGet.mockResolvedValue(createResponse(null, 200));

    const result = await fetchTenantTheme(MOCK_TENANT_ID, baseOptions());

    expect(result.themeConfig).toBeNull();
  });

  it('handles 304 thrown as an error with response.status', async () => {
    mockGet.mockRejectedValue({ response: { status: 304 }, isAxiosError: true });

    const result = await fetchTenantTheme(MOCK_TENANT_ID, baseOptions({ cachedEtag: MOCK_ETAG }));

    expect(result.notModified).toBe(true);
    expect(result.etag).toBe(MOCK_ETAG);
  });

  it('handles 404 thrown as an error -> null config', async () => {
    mockGet.mockRejectedValue({ response: { status: 404 } });

    const result = await fetchTenantTheme(MOCK_TENANT_ID, baseOptions());

    expect(result.themeConfig).toBeNull();
    expect(result.etag).toBeNull();
    expect(result.notModified).toBe(false);
  });

  it('rethrows non-304/404 errors', async () => {
    mockGet.mockRejectedValue(new Error('Network failure'));

    await expect(fetchTenantTheme(MOCK_TENANT_ID, baseOptions())).rejects.toThrow('Network failure');
  });

  it('rethrows a non-object error', async () => {
    mockGet.mockRejectedValue('boom');

    await expect(fetchTenantTheme(MOCK_TENANT_ID, baseOptions())).rejects.toBe('boom');
  });

  it('rethrows an error object without a response field', async () => {
    mockGet.mockRejectedValue({ message: 'no response field' });

    await expect(fetchTenantTheme(MOCK_TENANT_ID, baseOptions())).rejects.toEqual({
      message: 'no response field',
    });
  });

  it('passes the AbortSignal to the transport', async () => {
    const controller = new AbortController();
    mockGet.mockResolvedValue(createResponse({}, 200));

    await fetchTenantTheme(MOCK_TENANT_ID, baseOptions({ signal: controller.signal }));

    const args = mockGet.mock.calls[0][0] as { signal?: AbortSignal };
    expect(args.signal).toBe(controller.signal);
  });

  it('accepts 2xx + 304 via validateStatus and rejects others', async () => {
    mockGet.mockResolvedValue(createResponse({}, 200));

    await fetchTenantTheme(MOCK_TENANT_ID, baseOptions());

    const args = mockGet.mock.calls[0][0] as { validateStatus: (s: number) => boolean };
    expect(args.validateStatus(200)).toBe(true);
    expect(args.validateStatus(299)).toBe(true);
    expect(args.validateStatus(304)).toBe(true);
    expect(args.validateStatus(404)).toBe(false);
    expect(args.validateStatus(500)).toBe(false);
  });
});
