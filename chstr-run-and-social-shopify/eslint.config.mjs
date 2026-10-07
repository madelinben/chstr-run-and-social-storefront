import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import importPlugin from 'eslint-plugin-import';

const layerBoundary = (from, forbidden) => ({
  files: [`src/${from}/**`],
  rules: {
    'no-restricted-imports': ['error', { patterns: forbidden.map((layer) => `@/${layer}/*`) }],
  },
});

export default defineConfig(
  { ignores: ['dist', '.astro', 'node_modules', 'generated', '.lighthouseci', 'lighthouserc.cjs'] },
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
  { files: ['scripts/**', 'astro.config.mjs'], languageOptions: { globals: { console: 'readonly', process: 'readonly', URL: 'readonly', Buffer: 'readonly', fetch: 'readonly' } } },
  // services → utilities only (layers.mdc)
  layerBoundary('services', ['data', 'features', 'pages', 'stores']),
  layerBoundary('data', ['features', 'pages', 'stores']),
);
