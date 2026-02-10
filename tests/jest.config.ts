export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFiles: ['<rootDir>/jest.env.ts'],
  globalSetup: '<rootDir>/globalSetup.ts',
  testMatch: ['**/?(*.)+(spec|test).ts'],
  maxWorkers: 1,
}