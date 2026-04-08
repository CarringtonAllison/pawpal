import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/shared',
  'apps/backend',
  'apps/frontend',
]);
