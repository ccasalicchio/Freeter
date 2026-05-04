import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['**/*.spec.{js,jsx,ts,tsx}'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@common': path.resolve(__dirname, 'src/common'),
      '@tests': path.resolve(__dirname, 'tests/renderer'),
      '@testscommon': path.resolve(__dirname, 'tests/common'),
      '@utils': path.resolve(__dirname, 'tests/utils'),
    }
  }
})
