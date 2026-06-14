# Changelog

All notable changes to `@dloizides/tenant-theme-web` are documented here.

## [1.0.0]

### Added

- Initial extraction (task #195) of the byte-identical tenant-theme stack shared by `erevna-web`
  and `katalogos-web`:
  - `fetchTenantTheme(tenantId, opts)` — ETag-conditional fetch + DTO -> `TenantThemeConfig` mapping
    via an injected `httpGet` transport, an app-supplied `defaultThemeConfig` fallback palette, and
    an optional `baseURL`.
  - `saveTenantTheme(tenantId, config, httpPut)` + `toApiThemeRequest(config)` — the PUT body mapper.
  - `toTenantThemeConfig` / `hasThemeData` — DTO mapper helpers.
  - localStorage ETag cache (`readThemeCache`/`writeThemeCache`/`clearThemeCache`/
    `clearAllThemeCaches`) with the `tenant-theme-{id}` key convention + 24h expiry, plus an
    injectable `configureThemeCacheLogger`.
  - The config/DTO/cache/port type surface.
- Intentionally react-query-free: the consuming app owns its `QueryClient` and theme hooks, and the
  theme preset VALUES stay per-app.
