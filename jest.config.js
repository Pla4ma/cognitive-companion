/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx', '**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '^react-native-reanimated$': '<rootDir>/src/__tests__/__mocks__/react-native-reanimated.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native-web|@testing-library)/)',
  ],
  collectCoverageFrom: [
    'src/engine/**/*.ts',
    'src/services/consent.ts',
    '!src/engine/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
}
