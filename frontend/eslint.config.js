import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import { defineConfig, globalIgnores } from 'eslint/config';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

/*
 * typescript-eslint and eslint-plugin-vue wired directly (the setup `@vue/eslint-config-typescript` generates,
 * without its fast-glob → micromatch → braces dependency chain, which carries an advisory with no fixed release).
 */
export default defineConfig(
  globalIgnores(['**/dist/**', '**/coverage/**']),
  { name: 'app/files-to-lint', files: ['**/*.{ts,mts,vue}'] },

  tseslint.configs.recommendedTypeChecked,
  // After typescript-eslint, whose base config would otherwise replace the SFC parser.
  pluginVue.configs['flat/recommended'],

  {
    name: 'app/type-aware-parsing',
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  {
    name: 'app/vue-files',
    files: ['**/*.vue'],
    languageOptions: { parser: vueParser, parserOptions: { parser: tseslint.parser } },
    // Only TypeScript SFCs can be type-checked.
    rules: { 'vue/block-lang': ['error', { script: { lang: 'ts' } }] },
  },
  {
    // TypeScript-ESLint sees `.vue` modules through fallback types that contain `any`, so these rules would flag
    // idiomatic Vue code (`createApp(App)`, route components, `useTemplateRef`). vue-tsc still type-checks all of it.
    name: 'app/vue-component-types',
    files: ['**/*.{ts,mts,vue}'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    name: 'app/rules',
    rules: {
      // Vue style guide, "strongly recommended": consistent, explicit component APIs.
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-macros-order': ['error', { order: ['defineProps', 'defineModel', 'defineEmits'] }],
      'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: false }],
      'vue/custom-event-name-casing': ['error', 'camelCase'],
      'vue/no-unused-refs': 'error',
      'vue/no-useless-v-bind': 'error',
      'vue/prefer-true-attribute-shorthand': 'error',
      'vue/require-typed-ref': 'error',
      'vue/no-v-html': 'error',

      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  {
    name: 'app/tests',
    files: ['src/**/__tests__/**'],
    rules: { '@typescript-eslint/unbound-method': 'off' },
  },

  // Last among the rule configs, so no rule above re-enables type-aware checks for plain JS (this file).
  {
    name: 'app/js-files',
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  skipFormatting,
);
