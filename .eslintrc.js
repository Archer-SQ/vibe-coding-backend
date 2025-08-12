module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
    es2022: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/', 'coverage/'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-undef': 'off', // TypeScript handles this
  },
  overrides: [
    {
      // 允许在服务器、脚本和测试文件中使用console
      files: [
        'server.js', 
        'scripts/**/*.js', 
        'tests/**/*.ts', 
        'lib/utils/logger.ts',
        'lib/database/connection.ts',
        'api/**/*.ts'
      ],
      rules: {
        'no-console': 'off',
      },
    },
    {
      // 测试文件中允许使用any类型
      files: [
        'tests/**/*.ts',
        '**/*.test.ts',
        'lib/utils/logger.ts',
        'lib/types/api.ts',
        'lib/utils/response.ts',
        'lib/services/rankingService.ts'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};