module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'linebreak-style': ['error', (process.platform === 'win32' ? 'windows' : 'unix')],
    'no-underscore-dangle': 'off',
    'max-len': ['error', { code: 180 }], // 'max-len': 'off' // disables line length check
  },
};
