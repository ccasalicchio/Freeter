import { defineConfig } from 'vitest/config'
import path from 'path'

const r = (p: string) => path.resolve(__dirname, p)

// Aliases shared by every test project
const sharedAliases = {
  '@common': r('src/common'),
  '@testscommon': r('tests/common'),
  '@utils': r('tests/utils'),
}

const jestCompat = r('tests/utils/vitestJestCompat.ts')

// `@` points at a different source root per process (same as the three
// tsconfigs under tests/), so each area runs as its own Vitest project.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'common',
          globals: true,
          include: ['tests/common/**/*.spec.{js,jsx,ts,tsx}'],
          setupFiles: [jestCompat],
        },
        resolve: {
          alias: { ...sharedAliases },
        },
      },
      {
        test: {
          name: 'main',
          globals: true,
          include: ['tests/main/**/*.spec.{js,jsx,ts,tsx}'],
          setupFiles: [jestCompat],
        },
        resolve: {
          alias: {
            '@': r('src/main'),
            '@tests': r('tests/main'),
            ...sharedAliases,
          },
        },
      },
      {
        test: {
          name: 'renderer',
          globals: true,
          environment: 'jsdom',
          include: ['tests/renderer/**/*.spec.{js,jsx,ts,tsx}'],
          setupFiles: [jestCompat, r('tests/renderer/setupTests.ts')],
          // style imports are aliased to an identity proxy (see resolve.alias):
          // class assertions see original names and hover-hidden elements stay
          // visible to role queries (Jest-era specs assume an unstyled DOM)
        },
        resolve: {
          // array form: the style-file regex must be matched before path aliases
          alias: [
            { find: /^.+\.(css|scss)$/, replacement: r('tests/__mocks__/styleMock.js') },
            { find: '@tests', replacement: r('tests/renderer') },
            { find: '@testscommon', replacement: r('tests/common') },
            { find: '@utils', replacement: r('tests/utils') },
            { find: '@common', replacement: r('src/common') },
            { find: '@', replacement: r('src/renderer') },
          ],
        },
      },
    ],
  },
})
