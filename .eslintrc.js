module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaVersion: 2015,
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'unused-imports'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'sonarjs/no-duplicate-string': 'off',
    'no-unused-vars': 'off', // or
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-imports': 'off', // or
    '@typescript-eslint/no-unused-imports': 'off',
    '@typescript-eslint/no-duplicate-enum-values': 'warn',
    '@typescript-eslint/ban-types': 'warn',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    indent: 'off',
    '@typescript-eslint/indent': [0],
  },
  "prettier/prettier": [
    "error",
    {
      "endOfLine": "off"
    }
  ],
};
