import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
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
    build: {
      outDir: 'dist/renderer'
    },
    plugins: [react()],
    css: {
      modules: {
        localsConvention: 'camelCaseOnly'
      }
    }
  }
})
