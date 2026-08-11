import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import createSvgSpritePlugin from 'vite-plugin-svg-sprite'
import path from 'path'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'))
const backers = JSON.parse(readFileSync(path.resolve(__dirname, 'backers.json'), 'utf-8'))
let commitHash = ''
try {
  commitHash = execSync('git rev-parse --short HEAD', { cwd: __dirname }).toString().trim()
} catch {
  // git may be unavailable in CI tarball builds
}

// Compile-time globals declared in src/renderer/infra/globals.ts
// (ported from the webpack DefinePlugin config)
const rendererDefines = {
  VERSION: JSON.stringify(pkg.version),
  BUILT_AT: JSON.stringify(new Date().toISOString()),
  COMMIT_HASH: JSON.stringify(commitHash),
  BACKERS: JSON.stringify(backers),
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/main'),
        '@common': path.resolve(__dirname, 'src/common'),
      }
    },
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        input: {
          main: 'src/main/index.ts'
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/renderer'),
        '@common': path.resolve(__dirname, 'src/common'),
      }
    },
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        input: {
          preload: 'src/renderer/preload/index.ts'
        }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    define: rendererDefines,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/renderer'),
        '@common': path.resolve(__dirname, 'src/common'),
      }
    },
    build: {
      outDir: 'dist/renderer'
    },
    plugins: [
      react(),
      createSvgSpritePlugin({
        exportType: 'vanilla',
        // appIcons/ holds the UI chrome icons; icons/ holds widget icons;
        // glyphs/ holds the user-selectable icon gallery (IcoMoon-Free)
        include: ['**/icons/*.svg', '**/appIcons/*.svg', '**/glyphs/*.svg'],
        // widget icon files are all named widget.svg — a content hash keeps
        // their sprite symbol ids unique (fixes "#icon-widget repeatedly
        // registered" and every widget sharing one icon)
        symbolId: 'icon-[name]-[hash]'
      })
    ],
    css: {
      modules: {
        // components access classes both ways (styles.widget and
        // styles['is-drop-area']) — camelCaseOnly would drop the kebab keys
        localsConvention: 'camelCase'
      }
    }
  }
})
