# @dloizides/tenant-theme-web

Product-agnostic RN-web **tenant-theme client** for the dloizides.com portfolio.

Owns the tenant-theme logic that `erevna-web` and `katalogos-web` shared byte-for-byte:

- `fetchTenantTheme(tenantId, opts)` — ETag-conditional `GET /api/tenants/{id}/theme`, mapping
  the flat API DTO into a `TenantThemeConfig` (returns `{ themeConfig, etag, notModified }`).
- `saveTenantTheme(tenantId, config, httpPut)` + `toApiThemeRequest(config)` — the
  `PUT /api/tenants/{id}/theme` body mapper.
- `toTenantThemeConfig` / `hasThemeData` — the DTO mapper helpers.
- A localStorage **ETag cache**: `readThemeCache`, `writeThemeCache`, `clearThemeCache`,
  `clearAllThemeCaches` (24h expiry, `tenant-theme-{id}` key convention).

App-specific concerns are **ports** the consumer supplies:

- the **HTTP transport** (`httpGet` / `httpPut`) — wire to the app's axios apiClient /
  `@dloizides/bff-web-client` / Orval mutator;
- the **theme preset VALUES** (`defaultThemeConfig`) — each product keeps its own palette;
- the **API base URL** (`baseURL`).

This package is intentionally **react-query-free** — the consuming app owns its `QueryClient` and
its theme hooks. It never imports a product, realm, hardcoded URL, or palette.

## Quick start

```ts
import {
  fetchTenantTheme,
  saveTenantTheme,
  readThemeCache,
  writeThemeCache,
  configureThemeCacheLogger,
  type HttpGet,
  type HttpPut,
} from '@dloizides/tenant-theme-web';

import { DEFAULT_THEME_CONFIG } from '../theme/presets'; // app-owned palette
import { apiClient } from '../lib/api/apiClient';

// 1. Wire the transports
const httpGet: HttpGet = (args) => apiClient.request({ method: 'GET', ...args });
const httpPut: HttpPut = (args) => apiClient.request({ method: 'PUT', ...args }).then((r) => r.data);

// 2. Optional: route cache-failure warnings to your logger
configureThemeCacheLogger((ctx, msg, err) => loggingService.warn(ctx, msg, err));

// 3. Fetch (ETag-conditional)
const cached = readThemeCache(tenantId);
const res = await fetchTenantTheme(tenantId, {
  httpGet,
  defaultThemeConfig: DEFAULT_THEME_CONFIG,
  baseURL: env.IDENTITY_API_URL,
  cachedEtag: cached?.etag,
});
if (!res.notModified && res.themeConfig) {
  writeThemeCache(tenantId, res.themeConfig, res.etag ?? '');
}

// 4. Save
await saveTenantTheme(tenantId, config, httpPut);
```

## Ports

| Port | Type | Owned by | Notes |
|------|------|----------|-------|
| `httpGet` | `HttpGet` | app | Must resolve for statuses `validateStatus` accepts (2xx + 304), reject otherwise with axios-style `error.response.status`. |
| `httpPut` | `HttpPut` | app | Resolves with the parsed response body. |
| `defaultThemeConfig` | `TenantThemeConfig` | app | The product's `DEFAULT_THEME_CONFIG` fallback palette. |
| `baseURL` | `string?` | app | Identity API base; omit to use the transport's own base. |
| cache warn logger | `ThemeCacheWarn?` | app | Via `configureThemeCacheLogger`; defaults to silent. |

## Scripts

```bash
npm run build      # tsup -> dual CJS/ESM + d.ts
npm test           # jest (100% coverage gate)
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## License

MIT
