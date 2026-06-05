/** Runs unit tests colocated in shamell-frontend (no separate frontend test runner). */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../shamell-frontend/src/app/on-coming-events/lib'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
};
