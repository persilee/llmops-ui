import BaseLayout from '@/views/layouts/BaseLayout.vue'
import BlankLayout from '@/views/layouts/BlankLayout.vue'
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
          component: () => import('@/views/pages/HomePage.vue'),
        },
        {
          path: 'space',
          component: () => import('@/views/space/SpaceView.vue'),
          children: [
            {
              path: 'apps',
              name: 'space-apps',
              component: () => import('@/views/space/apps/AppsView.vue'),
            },
            {
              path: 'tools',
              name: 'space-tools',
              component: () => import('@/views/space/tools/ToolsView.vue'),
            },
            {
              path: 'workflows',
              name: 'space-workflows',
              component: () => import('@/views/space/workflows/WorkflowView.vue'),
            },
            {
              path: 'datasets',
              name: 'space-datasets',
              component: () => import('@/views/space/datasets/DatasetView.vue'),
            },
          ],
        },
        {
          path: 'store/apps',
          name: 'store-apps-list',
          component: () => import('@/views/store/apps/ListView.vue'),
        },
        {
          path: 'store/tools',
          name: 'store-tools-list',
          component: () => import('@/views/store/tools/ToolStoreView.vue'),
        },
        {
          path: 'open',
          name: 'open-index',
          component: () => import('@/views/open/IndexView.vue'),
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
          component: () => import('@/views/space/apps/DetailView.vue'),
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
