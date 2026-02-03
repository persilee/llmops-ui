import { createPinia } from 'pinia'
import { createApp } from 'vue'

import '@/assets/styles/custom-theme.css'
import '@/assets/styles/main.css'
import hljsVuePlugin from '@highlightjs/vue-plugin'

import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import shell from 'highlight.js/lib/languages/shell'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'

// 注册语言
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('json', json)

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
