module.exports = {
  root: true,
  env: { node: true, es2020: true },
  extends: [
    'eslint:recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@babel/eslint-parser',
  rules: {
    'no-unused-expressions': 1,
    curly: 1,
    semi: 1,
    eqeqeq: 1,
    indent: [1, 2],
    'no-debugger': 1,
    'no-trailing-spaces': 1,
    'sort-imports': [1, { allowSeparatedGroups: true }],
    'linebreak-style': [1, 'windows'],
    'no-multiple-empty-lines': 1,
    'no-console': [1, { allow: ['warn', 'error', 'info'] }],
    'func-style': [1, 'declaration', { allowArrowFunctions: true }],
    'max-len': [1, { code: 120 }],
  },
};
