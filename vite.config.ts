import { vitePluginForArco } from '@arco-plugins/vite-vue'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { defineConfig } from 'vite'
import monacoEditorPluginModule from 'vite-plugin-monaco-editor'
import vueDevTools from 'vite-plugin-vue-devtools'

const monacoEditorPlugin = (monacoEditorPluginModule as any).default || monacoEditorPluginModule

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    vitePluginForArco({
      style: 'css',
    }),
    tailwindcss(),
    monacoEditorPlugin({
      eslint: false,
      languageWorkers: ['editorWorkerService'],
      customLanguages: [], // 禁用自定义语言的检查
      publicPath: 'monaco-workers',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['monaco-editor', 'monaco-languages'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
