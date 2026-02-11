export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  maxWorkers: 1,
}