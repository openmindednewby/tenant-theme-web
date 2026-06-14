/**
 * Maps the flat API DTO returned by GET /api/tenants/{tenantId}/theme into the
 * frontend {@link TenantThemeConfig} shape.
 *
 * The fallback values (`defaultThemeConfig`) are **app-supplied** so the package
 * stays palette-agnostic: each product passes its own DEFAULT_THEME_CONFIG.
 */
import { isValueDefined } from '@dloizides/utils';

import type {
  ApiThemeColorsDto,
  ApiThemeResponseDto,
  TenantThemeConfig,
  ThemeModeColors,
} from './types';

function mapColorsToMode(
  dto: ApiThemeColorsDto | null | undefined,
  fallback: ThemeModeColors,
): ThemeModeColors {
  if (!isValueDefined(dto)) {
    return fallback;
  }
  return {
    background: dto.background ?? fallback.background,
    surface: dto.surface ?? fallback.surface,
    surfaceElevated: fallback.surfaceElevated,
    text: dto.onBackground ?? fallback.text,
    textSecondary: dto.onSurface ?? fallback.textSecondary,
    border: fallback.border,
    divider: fallback.divider,
  };
}

function mapBrandColors(
  colors: ApiThemeColorsDto | null | undefined,
  defaults: TenantThemeConfig,
): Pick<TenantThemeConfig, 'primary' | 'secondary' | 'accent'> {
  return {
    primary: colors?.primary ?? defaults.primary,
    secondary: colors?.secondary ?? defaults.secondary,
    accent: colors?.primaryLight ?? defaults.accent,
  };
}

function mapTypography(dto: ApiThemeResponseDto): TenantThemeConfig['typography'] {
  if (!isValueDefined(dto.typography)) {
    return undefined;
  }
  return {
    fontFamily: dto.typography.fontFamily ?? undefined,
    headingScale: dto.typography.headerScale ?? undefined,
  };
}

/**
 * Transforms a raw API DTO into a {@link TenantThemeConfig}, filling any missing
 * field from the app-supplied `defaultThemeConfig`.
 */
export function toTenantThemeConfig(
  dto: ApiThemeResponseDto,
  defaultThemeConfig: TenantThemeConfig,
): TenantThemeConfig {
  return {
    ...mapBrandColors(dto.colors, defaultThemeConfig),
    semantic: {
      success: defaultThemeConfig.semantic?.success,
      warning: defaultThemeConfig.semantic?.warning,
      error: dto.colors?.error ?? defaultThemeConfig.semantic?.error,
      info: defaultThemeConfig.semantic?.info,
    },
    light: mapColorsToMode(dto.colors, defaultThemeConfig.light),
    dark: mapColorsToMode(dto.darkColors, defaultThemeConfig.dark),
    typography: mapTypography(dto),
    branding: {
      presetId: dto.presetId ?? null,
      logoContentId: dto.logoContentId ?? null,
      faviconContentId: dto.faviconContentId ?? null,
    },
  };
}

/** True when the DTO carries any theme payload worth mapping. */
export function hasThemeData(dto: ApiThemeResponseDto): boolean {
  return (
    isValueDefined(dto.presetId) ||
    isValueDefined(dto.colors) ||
    isValueDefined(dto.darkColors) ||
    isValueDefined(dto.typography)
  );
}
