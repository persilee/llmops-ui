import { createPinia } from 'pinia'
import { createApp } from 'vue'

import '@/assets/styles/custom-theme.css'
import '@/assets/styles/main.css'
import App from './App.vue'
import router from './router'

// 创建Vue应用实例
const app = createApp(App)

// 使用Pinia状态管理插件
app.use(createPinia())

// 使用Vue Router路由插件
app.use(router)

// 挂载应用到DOM中id为'app'的元素
app.mount('#app')
