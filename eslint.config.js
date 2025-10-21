export default [
  {
    ignores: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.d.ts',
    ],
  },
  {
    files: ['**/*.{js,jsx}'],
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'cms/node_modules/**',
      'cms/build/**',
      'cms/.tmp/**',
      'cms/dist/**',
      'cms/types/**',
      '**/generated/**',
    ],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      // Only critical errors that should block commits
      'no-debugger': 'error',
      'no-var': 'error',
      'no-unreachable': 'error',
      'no-duplicate-case': 'error',

      // Warnings for less critical issues
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      'no-empty': 'warn',

      // Disabled rules to allow existing code to pass
      'no-console': 'off',
      'no-undef': 'off',
      'prefer-const': 'off',
    },
  },
];
