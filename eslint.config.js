import security from 'eslint-plugin-security';

export default [
  {
    files: ['src/**/*.js'],
    plugins: {
      security
    },
    rules: {
      // Security rules to catch issues like innerHTML
      // Disabled: too many false positives with bracket notation
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',

      // General JS best practices
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        MutationObserver: 'readonly',
        Node: 'readonly',
        // Extension globals
        chrome: 'readonly',
        browser: 'readonly',
        browserAPI: 'readonly',
        getState: 'readonly',
        saveState: 'readonly',
        resetState: 'readonly',
      }
    }
  }
];