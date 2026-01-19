export * from './clients/index.js';
export * from './types/index.js';
export * from './assumeRole.js';
export * from './awsClient.js';
export * from './validation.js';
export * from './services/cost-explorer-service.js';
export * from './client.js';

/**
 * Check if mock AWS mode is enabled
 */
export function isMockAws(): boolean {
  return process.env.MOCK_AWS === 'true';
}