import json from '@eslint/json'
import markdown from '@eslint/markdown'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/no-anonymous-default-export': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    files: ['src/**/*.ts'],
    ignores: [
      'src/tests/**/*.ts',
      'src/app/hooks/*.ts',
      '**/route.ts',
      'src/infra/database/client.ts'
    ],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error'
    }
  },
  {
    files: ['**/*.json'],
    plugins: { json },
    language: 'json/json',
    extends: ['json/recommended']
  },
  {
    files: ['**/*.md'],
    plugins: { markdown },
    language: 'markdown/gfm',
    languageOptions: { frontmatter: 'yaml' },
    extends: ['markdown/recommended'],
    // These rules crash ESLint on GFM text nodes without a position (e.g. `[text][https://...]`)
    // instead of reporting: https://github.com/eslint/markdown/issues/619
    rules: {
      'markdown/no-invalid-label-refs': 'off',
      'markdown/no-missing-label-refs': 'off',
      'markdown/no-reference-like-urls': 'off',
      'markdown/no-space-in-emphasis': 'off'
    }
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.claude/**',
    'test-results/**',
    'playwright-report/**',
    'src/infra/database/contract.json',
    'src/infra/database/contract.d.ts',
    'src/infra/database/migrations/**'
  ])
])

export default eslintConfig
