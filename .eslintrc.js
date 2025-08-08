module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    '@eslint/js/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3'
    }
  ],
  plugins: ['svelte3'],
  rules: {
    // JavaScript Standards
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'no-console': 'warn',
    
    // Code Quality
    'no-unused-vars': 'error',
    'no-undef': 'error',
    'no-duplicate-imports': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'eol-last': 'error',
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    
    // Function Rules
    'max-lines-per-function': ['warn', { max: 50 }],
    'max-depth': ['error', 3],
    'complexity': ['warn', 10],
    
    // Naming Conventions
    'camelcase': ['error', { properties: 'never' }],
    
    // Best Practices
    'eqeqeq': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-throw-literal': 'error',
    'no-unused-expressions': 'error',
    'radix': 'error',
    'yoda': 'error'
  },
  settings: {
    'svelte3/typescript': false
  }
};