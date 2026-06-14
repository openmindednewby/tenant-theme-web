/**
 * Shared types for `@dloizides/tenant-theme-web`.
 *
 * The package owns the tenant-theme *logic* (the ETag-conditional fetch, the
 * DTO -> config mapper, the localStorage ETag cache, the save-request body
 * mapper). Every app-specific concern is a **port** the consuming app supplies:
 * its HTTP transport ({@link HttpGet} / {@link HttpPut}) and its theme preset
 * *values* (the `defaultThemeConfig` fallback). The package never imports a
 * product, realm, hardcoded URL, or hardcoded palette.
 */

// -- Theme config shape (owned by the package, values owned by the app) -------

/**
 * Mode-specific color tokens shared by both light and dark configurations.
 * All values are hex strings (e.g. '#ffffff'). The *shape* is owned by this
 * package; the actual values per preset stay per-app.
 */
export interface ThemeModeColors {
  /** Page/body background */
  background: string;
  /** Cards, panels */
  surface: string;
  /** Modals, dropdowns */
  surfaceElevated: string;
  /** Primary text */
  text: string;
  /** Secondary/muted text */
  textSecondary: string;
  /** Default borders */
  border: string;
  /** Divider lines */
  divider: string;
}

/** Optional semantic/status color overrides. Omitted values fall back to defaults. */
export interface SemanticColorOverrides {
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
}

/** Optional typography overrides. */
export interface TypographyConfig {
  /** System font family name */
  fontFamily?: string;
  /** Heading size multiplier (default 1.0) */
  headingScale?: number;
}

/** Branding assets stored as ContentService references. */
export interface BrandingConfig {
  /** GUID referencing a ContentService item for the logo */
  logoContentId: string | null;
  /** GUID referencing a ContentService item for the favicon */
  faviconContentId: string | null;
  /** Which built-in preset was used as the base */
  presetId: string | null;
}

/**
 * Per-tenant theme configuration. Kept flat and small (~2-5KB) since it is
 * fetched on every app load. All color values are hex strings.
 */
export interface TenantThemeConfig {
  /** Brand primary color (hex) */
  primary: string;
  /** Brand secondary color (hex) */
  secondary: string;
  /** Accent/highlight color (hex) */
  accent: string;
  /** Optional semantic/status color overrides */
  semantic?: SemanticColorOverrides;
  /** Light mode tokens */
  light: ThemeModeColors;
  /** Dark mode tokens */
  dark: ThemeModeColors;
  /** Optional typography overrides */
  typography?: TypographyConfig;
  /** Branding assets */
  branding: BrandingConfig;
}

// -- API DTO types ------------------------------------------------------------

/** Colors DTO returned by the API. */
export interface ApiThemeColorsDto {
  primary?: string | null;
  primaryLight?: string | null;
  primaryDark?: string | null;
  secondary?: string | null;
  background?: string | null;
  surface?: string | null;
  error?: string | null;
  onPrimary?: string | null;
  onBackground?: string | null;
  onSurface?: string | null;
}

/** Raw response shape from GET /api/tenants/{tenantId}/theme */
export interface ApiThemeResponseDto {
  presetId?: string | null;
  colors?: ApiThemeColorsDto | null;
  darkColors?: ApiThemeColorsDto | null;
  typography?: { fontFamily?: string | null; headerScale?: number | null; bodyScale?: number | null } | null;
  logoContentId?: string | null;
  faviconContentId?: string | null;
}

/** Colors sub-DTO of the save (PUT) request body. */
export interface ApiThemeRequestColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  error: string | null;
  onBackground: string;
  onSurface: string;
}

/** Request body for PUT /api/tenants/{tenantId}/theme. */
export interface ApiThemeRequest {
  presetId: string | null;
  colors: ApiThemeRequestColors;
  darkColors: ApiThemeRequestColors;
  typography: { fontFamily: string | null; headerScale: number | null } | null;
  logoContentId: string | null;
  faviconContentId: string | null;
}

// -- HTTP transport ports -----------------------------------------------------

/** Minimal HTTP response shape the package reads (status + data + headers). */
export interface HttpResponse<TData = unknown> {
  status: number;
  data: TData;
  headers: Record<string, unknown>;
}

/** Arguments for the {@link HttpGet} port. */
export interface HttpGetArgs {
  url: string;
  baseURL?: string;
  headers: Record<string, string>;
  signal?: AbortSignal;
  /** Treat these statuses as resolved (not thrown). Mirrors axios `validateStatus`. */
  validateStatus: (status: number) => boolean;
}

/**
 * App-supplied GET transport. The app wires this to its axios/BFF apiClient.
 * Must resolve for any status that {@link HttpGetArgs.validateStatus} accepts,
 * and reject (with an axios-style `error.response.status`) otherwise.
 */
export type HttpGet = <TData = unknown>(args: HttpGetArgs) => Promise<HttpResponse<TData>>;

/** Arguments for the {@link HttpPut} port. */
export interface HttpPutArgs<TBody = unknown> {
  url: string;
  headers: Record<string, string>;
  data: TBody;
}

/**
 * App-supplied PUT transport. The app wires this to its Orval mutator / BFF
 * apiClient. Resolves with the parsed response body.
 */
export type HttpPut = <TResp = unknown, TBody = unknown>(args: HttpPutArgs<TBody>) => Promise<TResp>;

// -- Cache --------------------------------------------------------------------

/** Shape of the cached theme data stored in localStorage. */
export interface CachedThemeData {
  config: TenantThemeConfig;
  logoUrl: string | null;
  faviconUrl: string | null;
  etag: string;
  cachedAt: number;
}
