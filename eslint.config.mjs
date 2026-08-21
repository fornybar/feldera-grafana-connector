import grafanaConfig from '@grafana/eslint-config';

const config = grafanaConfig.map((entry) => ({
  ...entry,
  rules: {
    ...entry.rules,
    '@stylistic/type-annotation-spacing': 'off',
  },
}));

export default [
  { ignores: ['artifacts/', 'dist/', 'node_modules/'] },
  ...config,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'react/prop-types': 'off',
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];
