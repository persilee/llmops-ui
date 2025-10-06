import BaseLayout from '@/views/layouts/base-layout.vue'
import BlankLayout from '@/views/layouts/blank-layout.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: BaseLayout,
      children: [
        {
          path: '',
          redirect: 'home',
        },
        {
          path: 'home',
          name: 'home-page',
          component: () => import('@/views/pages/home-page.vue'),
        },
      ],
    },
    {
      path: '/',
      component: BlankLayout,
      children: [
        {
          path: 'space/apps/:appId',
          name: 'space-apps-detail',
          component: () => import('@/views/space/apps/detail-view.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  console.log('to', to)
  console.log('from', from)
  next()
})

export default router
