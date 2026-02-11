export default {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  maxWorkers: 1,
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.ts$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
    }],
  },
}