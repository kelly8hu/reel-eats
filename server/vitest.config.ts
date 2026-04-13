import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Fake values so module-level env var checks don't throw on import
    env: {
      APIFY_API_TOKEN: 'test-apify-token',
      REPLICATE_API_TOKEN: 'test-replicate-token',
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_KEY: 'test-service-key',
    },
  },
})
