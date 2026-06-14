/**
 * Shared test fixtures (a synthetic default palette). Not part of the public
 * surface — excluded from coverage via the jest config index/types ignores
 * only when imported; this file is referenced solely by *.test.ts.
 */
import type { TenantThemeConfig } from './types';

export const TEST_DEFAULT_CONFIG: TenantThemeConfig = {
  primary: '#000000',
  secondary: '#111111',
  accent: '#222222',
  semantic: { success: '#00ff00', warning: '#ffff00', error: '#ff0000', info: '#0000ff' },
  light: {
    background: '#ffffff',
    surface: '#f0f0f0',
    surfaceElevated: '#ffffff',
    text: '#000000',
    textSecondary: '#666666',
    border: '#cccccc',
    divider: '#cccccc',
  },
  dark: {
    background: '#000000',
    surface: '#111111',
    surfaceElevated: '#222222',
    text: '#ffffff',
    textSecondary: '#aaaaaa',
    border: '#333333',
    divider: '#333333',
  },
  branding: {
    logoContentId: null,
    faviconContentId: null,
    presetId: null,
  },
};
