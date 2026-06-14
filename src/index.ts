/**
 * `@dloizides/tenant-theme-web` — product-agnostic RN-web tenant-theme client.
 *
 * Owns the tenant-theme logic that erevna-web and katalogos-web shared
 * byte-for-byte: the ETag-conditional fetch, the DTO -> TenantThemeConfig
 * mapper, the localStorage ETag cache, and the save-request body mapper.
 * App-specific concerns are **ports** the consumer supplies: the HTTP transport
 * (`httpGet` / `httpPut`) and the theme preset *values* (`defaultThemeConfig`).
 * This package never imports a product, realm, hardcoded URL, or palette, and
 * is intentionally react-query-free (the app owns its QueryClient + hooks).
 *
 * Surface:
 *   • `fetchTenantTheme(tenantId, opts)` — ETag-conditional fetch + DTO mapping
 *   • `saveTenantTheme(tenantId, config, httpPut)` + `toApiThemeRequest`
 *   • `toTenantThemeConfig` / `hasThemeData` — the DTO mapper helpers
 *   • cache: read/write/clear/clearAll + `configureThemeCacheLogger`
 *   • the config/DTO/cache/port types
 */

export { fetchTenantTheme } from './fetchTenantTheme';
export type {
  FetchTenantThemeOptions,
  TenantThemeResponse,
} from './fetchTenantTheme';

export { toTenantThemeConfig, hasThemeData } from './mapToThemeConfig';

export { saveTenantTheme, toApiThemeRequest } from './saveTenantTheme';
export type { SaveThemeResponse } from './saveTenantTheme';

export {
  readThemeCache,
  writeThemeCache,
  clearThemeCache,
  clearAllThemeCaches,
  configureThemeCacheLogger,
  MAX_CACHE_AGE_MS,
  CACHE_KEY_PREFIX,
} from './themeCacheStorage';
export type { ThemeCacheWarn } from './themeCacheStorage';

export type {
  ThemeModeColors,
  SemanticColorOverrides,
  TypographyConfig,
  BrandingConfig,
  TenantThemeConfig,
  ApiThemeColorsDto,
  ApiThemeResponseDto,
  ApiThemeRequestColors,
  ApiThemeRequest,
  HttpResponse,
  HttpGetArgs,
  HttpGet,
  HttpPutArgs,
  HttpPut,
  CachedThemeData,
} from './types';
