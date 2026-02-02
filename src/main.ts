import { createPinia } from 'pinia'
import { createApp } from 'vue'

import '@/assets/styles/custom-theme.css'
import '@/assets/styles/main.css'
import hljsVuePlugin from '@highlightjs/vue-plugin'
import { shikiToMonaco } from '@shikijs/monaco'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import shell from 'highlight.js/lib/languages/shell'
import 'highlight.js/styles/monokai-sublime.css'
import * as monaco from 'monaco-editor'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createHighlighter } from 'shiki'
import App from './App.vue'
import router from './router'

// 注册语言
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('json', json)

const highlighter = await createHighlighter({
  themes: ['light-plus'],
  langs: ['javascript', 'typescript', 'vue'],
})

monaco.languages.register({ id: 'vue' })
monaco.languages.register({ id: 'typescript' })
monaco.languages.register({ id: 'javascript' })

shikiToMonaco(highlighter, monaco)

// 创建Vue应用实例
const app = createApp(App)

// 使用Pinia状态管理插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// 使用highlight.js插件
app.use(hljsVuePlugin)

// 使用Vue Router路由插件
app.use(router)

// 挂载应用到DOM中id为'app'的元素
app.mount('#app')
