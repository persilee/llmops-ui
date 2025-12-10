import auth from '@/utils/auth'
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
          component: () => import('@/views/home/HomePage.vue'),
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
          path: 'space/datasets/:datasetId/documents',
          name: 'space-datasets-documents',
          component: () => import('@/views/space/datasets/documents/DocumentView.vue'),
        },
        {
          path: 'space/datasets/:datasetId/documents/create',
          name: 'space-datasets-documents-create',
          component: () => import('@/views/space/datasets/documents/CreateDocumentView.vue'),
        },
        {
          path: 'space/datasets/:datasetId/documents/:documentId/segments',
          name: 'space-datasets-documents-segments',
          component: () => import('@/views/space/datasets/documents/segments/SegmentView.vue'),
        },
        {
          path: 'store/apps',
          name: 'store-apps',
          component: () => import('@/views/store/apps/ListView.vue'),
        },
        {
          path: 'store/tools',
          name: 'store-tools',
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
          component: () => import('@/views/space/apps/AppLayout.vue'),
          children: [
            {
              path: 'detail',
              name: 'space-apps-detail',
              component: () => import('@/views/space/apps/DetailView.vue'),
            },
            {
              path: 'published',
              name: 'space-apps-published',
              component: () => import('@/views/space/apps/PublishedView.vue'),
            },
            {
              path: 'analysis',
              name: 'space-apps-analysis',
              component: () => import('@/views/space/apps/AnalysisView.vue'),
            },
          ],
        },

        {
          path: 'auth/login',
          name: 'auth-login',
          component: () => import('@/views/auth/LoginView.vue'),
        },
        {
          path: 'auth/authorize/:provider_name',
          name: 'auth-authorize',
          component: () => import('@/views/auth/AuthorizeView.vue'),
        },
      ],
    },
  ],
})

// 路由守卫：检查用户登录状态
router.beforeEach((to, from, next) => {
  // 如果用户未登录且目标页面不是登录或授权页面，则重定向到登录页
  if (!auth.isLogin() && !['auth-login', 'auth-authorize'].includes(to.name as string)) {
    next({ name: 'auth-login' })
    return
  }
  // 其他情况允许访问
  next()
})

export default router
