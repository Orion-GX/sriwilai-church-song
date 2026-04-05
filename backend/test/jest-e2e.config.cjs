const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: path.join(__dirname, '..'),
  testEnvironment: 'node',
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  setupFiles: ['<rootDir>/test/setup/jest-env.cjs'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  maxWorkers: 1,
  testTimeout: 60_000,
};
