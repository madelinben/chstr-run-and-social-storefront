import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import importPlugin from 'eslint-plugin-import';

// Vendor SDKs may only be imported inside src/services/integrations (external-integrations.mdc).
const VENDOR_SDKS = ['stripe', 'resend'];

// `no-restricted-imports` is one rule: a later block REPLACES an earlier one for the same files.
// So every block below states both the layer patterns and the vendor paths it needs.
const layerBoundary = (from, forbidden, { allowVendors = false, ignores = [] } = {}) => ({
  files: [`src/${from}/**`],
  ignores,
  rules: {
    'no-restricted-imports': ['error', { patterns: forbidden.map((layer) => `@/${layer}/*`), paths: allowVendors ? [] : VENDOR_SDKS }],
  },
});

export default defineConfig(
  { ignores: ['dist', '.astro', 'node_modules', 'generated'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    plugins: { import: importPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'import/no-cycle': ['error', { maxDepth: 6 }],
      'no-restricted-syntax': [
        'error',
        { selector: 'ExportAllDeclaration', message: 'No barrel re-exports (no-barrels.mdc).' },
      ],
    },
  },
  { files: ['scripts/**', 'astro.config.mjs'], languageOptions: { globals: { console: 'readonly', process: 'readonly', URL: 'readonly', Buffer: 'readonly' } } },
  {
    files: ['src/**'],
    ignores: ['src/services/integrations/**'],
    rules: { 'no-restricted-imports': ['error', { paths: VENDOR_SDKS }] },
  },
  // domain/<entity> → utilities only (layers.mdc)
  layerBoundary('domain', ['data', 'services', 'features', 'pages', 'stores']),
  layerBoundary('services', ['data', 'domain', 'features', 'pages', 'stores'], { ignores: ['src/services/integrations/**'] }),
  layerBoundary('services/integrations', ['data', 'domain', 'features', 'pages', 'stores'], { allowVendors: true }),
  layerBoundary('data', ['features', 'pages', 'stores']),
);
