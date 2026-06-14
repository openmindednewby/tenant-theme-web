/**
 * Tenant-theme save (PUT) logic.
 *
 * Maps a {@link TenantThemeConfig} into the API's UpdateTenantThemeRequest body
 * and PUTs it via the app-supplied {@link HttpPut} transport.
 *
 * Endpoint: PUT /api/tenants/{tenantId}/theme
 */
import type {
  ApiThemeRequest,
  HttpPut,
  TenantThemeConfig,
} from './types';

/** Response shape from PUT /api/tenants/{tenantId}/theme */
export interface SaveThemeResponse {
  success: boolean;
}

/** Maps a frontend {@link TenantThemeConfig} to the API's request body. */
export function toApiThemeRequest(config: TenantThemeConfig): ApiThemeRequest {
  return {
    presetId: config.branding.presetId ?? null,
    colors: {
      primary: config.primary,
      secondary: config.secondary,
      background: config.light.background,
      surface: config.light.surface,
      error: config.semantic?.error ?? null,
      onBackground: config.light.text,
      onSurface: config.light.textSecondary,
    },
    darkColors: {
      primary: config.primary,
      secondary: config.secondary,
      background: config.dark.background,
      surface: config.dark.surface,
      error: config.semantic?.error ?? null,
      onBackground: config.dark.text,
      onSurface: config.dark.textSecondary,
    },
    typography: config.typography
      ? { fontFamily: config.typography.fontFamily ?? null, headerScale: config.typography.headingScale ?? null }
      : null,
    logoContentId: config.branding.logoContentId ?? null,
    faviconContentId: config.branding.faviconContentId ?? null,
  };
}

/**
 * Save the tenant theme via the app-supplied PUT transport.
 */
export async function saveTenantTheme(
  tenantId: string,
  config: TenantThemeConfig,
  httpPut: HttpPut,
): Promise<SaveThemeResponse> {
  return httpPut<SaveThemeResponse, ApiThemeRequest>({
    url: `/api/tenants/${tenantId}/theme`,
    headers: { 'Content-Type': 'application/json' },
    data: toApiThemeRequest(config),
  });
}
