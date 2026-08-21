// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const config = require('./.config/jest.config');

module.exports = {
  ...config,
  testEnvironment: 'node',
  moduleNameMapper: {
    ...config.moduleNameMapper,
    '^@grafana/runtime$': '<rootDir>/src/test/runtime.ts',
  },
};
