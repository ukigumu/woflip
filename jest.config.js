/**
 * Tests solo de lógica pura (src/lib): entorno node, sin renderer nativo.
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/lib'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
