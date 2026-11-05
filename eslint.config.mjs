import json from '@eslint/json'
import markdown from '@eslint/markdown'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import preferArrowFunctions from 'eslint-plugin-prefer-arrow-functions'
import pluginPromise from 'eslint-plugin-promise'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import eslintPluginTailwindcss from 'eslint-plugin-tailwindcss'
import unicorn from 'eslint-plugin-unicorn'

const DATABASE_CLIENT = 'infra/database/client'

// Imports only flow down: app -> entry -> models -> repositories -> infra -> constants
const FORBIDDEN_IMPORTS = {
  'src/app/**': ['repositories', DATABASE_CLIENT],
  'src/entry/**': ['app', 'repositories', DATABASE_CLIENT],
  'src/models/**': ['app', 'entry', DATABASE_CLIENT],
  'src/repositories/**': ['app', 'entry', 'models'],
  'src/infra/**': ['app', 'entry', 'models', 'repositories'],
  'src/constants/**': ['app', 'entry', 'models', 'repositories', 'infra']
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  pluginPromise.configs['flat/recommended'],
  prettier,
  preferArrowFunctions.configs.all,
  {
    files: eslintPluginTailwindcss.configs.recommended.files,
    extends: [eslintPluginTailwindcss.configs.recommended],
    settings: {
      tailwindcss: {
        cssConfigPath: './src/app/styles/globals.css',
        parseKeyFunctions: ['classnames', 'classNames']
      }
    },
    rules: {
      'tailwindcss/no-custom-classname': [
        'warn',
        // Classes defined in plain CSS or by Sonner
        {
          whitelist: ['dotted-map', String.raw`spinner-bars?(-\d+)?`, 'toaster']
        }
      ]
    }
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      unicorn
    },
    extends: ['unicorn/recommended'],
    rules: {
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/default-export-style': ['error', { functions: 'separate' }],
      'unicorn/logical-assignment-operators': 'off',
      'unicorn/no-null': 'off',
      'unicorn/name-replacements': [
        'error',
        {
          replacements: {
            params: false,
            props: false,
            utils: false
          }
        }
      ]
    }
  },
  {
    // Tests share state set in `beforeAll` or in an earlier test through top-level `let`
    files: ['src/tests/**'],
    rules: { 'unicorn/no-top-level-assignment-in-function': 'off' }
  },
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
  ...Object.entries(FORBIDDEN_IMPORTS).map(([files, layers]) => ({
    files: [files],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: `^@/(${layers.join('|')})(/|$)`,
              message: 'Imports only flow down the layers.'
            }
          ]
        }
      ]
    }
  })),
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
