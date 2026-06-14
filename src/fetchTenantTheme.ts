/**
 * ETag-conditional tenant-theme fetch.
 *
 * The API returns a flat DTO shape (presetId, colors, darkColors, typography);
 * this transforms it into the frontend {@link TenantThemeConfig} format.
 *
 * Supports ETag-based conditional requests:
 * - Sends `If-None-Match` when a cached ETag is available
 * - Returns the response ETag for caching
 * - Returns `notModified: true` on 304 so the caller keeps using cached data
 *
 * Endpoint: GET {baseURL}/api/tenants/{tenantId}/theme
 *
 * The HTTP transport (`httpGet`), the fallback palette (`defaultThemeConfig`),
 * and the API base URL (`baseURL`) are all app-supplied ports.
 */
import { isNotEmptyString, isValueDefined } from '@dloizides/utils';

import { hasThemeData, toTenantThemeConfig } from './mapToThemeConfig';

import type {
  ApiThemeResponseDto,
  HttpGet,
  HttpResponse,
  TenantThemeConfig,
} from './types';

// -- Constants ----------------------------------------------------------------

/** HTTP status range for successful responses (inclusive). */
const HTTP_SUCCESS_MIN = 200;
const HTTP_SUCCESS_MAX = 299;

/** HTTP 304 status code for Not Modified responses. */
const HTTP_NOT_MODIFIED = 304;

/** HTTP 404 status code for Not Found responses. */
const HTTP_NOT_FOUND = 404;

const ETAG_HEADER = 'etag';
const IF_NONE_MATCH_HEADER = 'If-None-Match';

// -- Options + result types ---------------------------------------------------

/** Options for {@link fetchTenantTheme}. */
export interface FetchTenantThemeOptions {
  signal?: AbortSignal;
  /** Cached ETag to send as the If-None-Match header. */
  cachedEtag?: string;
  /** App-supplied GET transport (wire to the app's apiClient/bff-web-client). */
  httpGet: HttpGet;
  /** App-supplied fallback palette (the product's DEFAULT_THEME_CONFIG). */
  defaultThemeConfig: TenantThemeConfig;
  /** Optional API base URL. Omit to use the transport's own base. */
  baseURL?: string;
}

/** Frontend-facing response shape consumed by the theme hook. */
export interface TenantThemeResponse {
  themeConfig: TenantThemeConfig | null;
  etag: string | null;
  /** True when the server returned 304 Not Modified (use cached data). */
  notModified: boolean;
}

// -- HTTP helpers -------------------------------------------------------------

function buildRequestHeaders(cachedEtag: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (isNotEmptyString(cachedEtag)) {
    headers[IF_NONE_MATCH_HEADER] = cachedEtag;
  }
  return headers;
}

function extractEtag(response: HttpResponse): string | null {
  const headerValue: unknown = response.headers[ETAG_HEADER];
  if (typeof headerValue === 'string' && headerValue.length > 0) {
    return headerValue;
  }
  return null;
}

interface ErrorWithResponse {
  response?: { status?: unknown };
}

function isErrorWithResponse(value: unknown): value is ErrorWithResponse {
  if (typeof value !== 'object' || !isValueDefined(value)) {
    return false;
  }
  return 'response' in value;
}

function isNotModifiedResponse(error: unknown): boolean {
  if (!isErrorWithResponse(error)) {
    return false;
  }
  return error.response?.status === HTTP_NOT_MODIFIED;
}

function isNotFoundResponse(error: unknown): boolean {
  if (!isErrorWithResponse(error)) {
    return false;
  }
  return error.response?.status === HTTP_NOT_FOUND;
}

function isSuccessOrNotModified(status: number): boolean {
  return (status >= HTTP_SUCCESS_MIN && status <= HTTP_SUCCESS_MAX) || status === HTTP_NOT_MODIFIED;
}

function buildNotModifiedResult(cachedEtag: string | undefined): TenantThemeResponse {
  return { themeConfig: null, etag: cachedEtag ?? null, notModified: true };
}

// -- Public API ---------------------------------------------------------------

/**
 * Fetch the tenant theme configuration via the app-supplied transport and
 * transform the API DTO into {@link TenantThemeConfig}. Returns a null config
 * when the tenant has no theme configured (200 empty DTO or 404).
 *
 * Supports ETag-based conditional requests:
 * - Pass `cachedEtag` to send the If-None-Match header
 * - On 304 Not Modified, returns `{ notModified: true }` so the caller uses
 *   its cached data
 */
export async function fetchTenantTheme(
  tenantId: string,
  options: FetchTenantThemeOptions,
): Promise<TenantThemeResponse> {
  const { httpGet, defaultThemeConfig, baseURL, cachedEtag, signal } = options;
  const headers = buildRequestHeaders(cachedEtag);

  try {
    const response = await httpGet<ApiThemeResponseDto>({
      url: `/api/tenants/${tenantId}/theme`,
      baseURL,
      headers,
      signal,
      validateStatus: isSuccessOrNotModified,
    });

    if (response.status === HTTP_NOT_MODIFIED) {
      return buildNotModifiedResult(cachedEtag);
    }

    const dto = response.data;
    const etag = extractEtag(response);
    const hasData = isValueDefined(dto) && hasThemeData(dto);

    return {
      themeConfig: hasData ? toTenantThemeConfig(dto, defaultThemeConfig) : null,
      etag,
      notModified: false,
    };
  } catch (error: unknown) {
    if (isNotModifiedResponse(error)) {
      return buildNotModifiedResult(cachedEtag);
    }
    if (isNotFoundResponse(error)) {
      return { themeConfig: null, etag: null, notModified: false };
    }
    throw error;
  }
}
