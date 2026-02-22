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
          meta: { title: '首页 - 虎子' },
        },
        {
          path: 'setting',
          name: 'account-setting',
          component: () => import('@/views/account/AccountSetting.vue'),
          meta: { title: '账号设置 - 虎子' },
        },
        {
          path: 'space',
          component: () => import('@/views/space/SpaceView.vue'),
          children: [
            {
              path: 'apps',
              name: 'space-apps',
              component: () => import('@/views/space/apps/AppsView.vue'),
              meta: { title: 'AI应用 - 个人空间 - 虎子' },
            },
            {
              path: 'tools',
              name: 'space-tools',
              component: () => import('@/views/space/tools/ToolsView.vue'),
              meta: { title: '插件 - 个人空间 - 虎子' },
            },
            {
              path: 'workflows',
              name: 'space-workflows',
              component: () => import('@/views/space/workflows/WorkflowView.vue'),
              meta: { title: '工作流 - 个人空间 - 虎子' },
            },
            {
              path: 'datasets',
              name: 'space-datasets',
              component: () => import('@/views/space/datasets/DatasetView.vue'),
              meta: { title: '知识库 - 个人空间 - 虎子' },
            },
          ],
        },
        {
          path: 'space/datasets/:datasetId/documents',
          name: 'space-datasets-documents',
          component: () => import('@/views/space/datasets/documents/DocumentView.vue'),
          meta: { title: '文档 - 知识库 - 虎子' },
        },
        {
          path: 'space/datasets/:datasetId/documents/create',
          name: 'space-datasets-documents-create',
          component: () => import('@/views/space/datasets/documents/CreateDocumentView.vue'),
          meta: { title: '创建文档 - 知识库 - 虎子' },
        },
        {
          path: 'space/datasets/:datasetId/documents/:documentId/segments',
          name: 'space-datasets-documents-segments',
          component: () => import('@/views/space/datasets/documents/segments/SegmentView.vue'),
          meta: { title: '文档片段 - 文档 - 虎子' },
        },
        {
          path: 'store/apps',
          name: 'store-apps',
          component: () => import('@/views/store/apps/AppStoreView.vue'),
          meta: { title: '应用市场 - 虎子' },
        },
        {
          path: 'store/tools',
          name: 'store-tools',
          component: () => import('@/views/store/tools/ToolStoreView.vue'),
          meta: { title: '插件广场 - 虎子' },
        },
        {
          path: 'openapi',
          component: () => import('@/views/openapi/OpenapiLayout.vue'),
          children: [
            {
              path: 'start',
              name: 'quick-start',
              component: () => import('@/views/openapi/start/QuickStartView.vue'),
              meta: { title: '快速开始 - 开发API - 虎子' },
            },
            {
              path: 'key',
              name: 'openapi-key',
              component: () => import('@/views/openapi/key/KeyView.vue'),
              meta: { title: '密钥 - 开发API - 虎子' },
            },
          ],
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
              meta: { title: '应用详情 - 虎子 AI 智能体' },
            },
            {
              path: 'published',
              name: 'space-apps-published',
              component: () => import('@/views/space/apps/PublishedView.vue'),
              meta: { title: '应用发布 - 虎子 AI 智能体' },
            },
            {
              path: 'analysis',
              name: 'space-apps-analysis',
              component: () => import('@/views/space/apps/AnalysisView.vue'),
              meta: { title: '应用统计 - 虎子 AI 智能体' },
            },
          ],
        },
        {
          path: 'web-app/:token',
          name: 'web-app-chat',
          component: () => import('@/views/space/apps/WebAppView.vue'),
          meta: { title: 'WepApp - 虎子' },
        },
        {
          path: 'space/workflows/:workflowId/detail',
          name: 'space-workflows-detail',
          component: () => import('@/views/space/workflows/WorkflowDetail.vue'),
          meta: { title: '详情 - 工作流 - 虎子' },
        },
        {
          path: 'auth/login',
          name: 'auth-login',
          component: () => import('@/views/auth/LoginView.vue'),
          meta: { title: '登录 - 虎子' },
        },
        {
          path: 'share/:shareId',
          name: 'share-messages',
          component: () => import('@/views/space/apps/ShareMessagesPage.vue'),
          meta: { title: '分享 - 虎子' },
        },
        {
          path: 'auth/authorize/:providerName',
          name: 'auth-authorize',
          component: () => import('@/views/auth/AuthorizeView.vue'),
          meta: { title: '第三方登录 - 虎子' },
        },
        {
          path: '/:pathMatch(.*)*',
          name: 'not-found',
          component: () => import('@/views/errors/NotFoundView.vue'),
          meta: { title: '404 - 虎子' },
        },
        {
          path: '/errors/404',
          name: 'errors-not-found',
          component: () => import('@/views/errors/NotFoundView.vue'),
          meta: { title: '404 - 虎子' },
        },
        {
          path: '/errors/403',
          name: 'errors-forbidden',
          component: () => import('@/views/errors/ForbiddenView.vue'),
          meta: { title: '无权限 - 虎子' },
        },
      ],
    },
  ],
})

// 路由守卫：检查用户登录状态
router.beforeEach(async (to, from, next) => {
  // 如果用户未登录且目标页面不是登录或授权页面，则重定向到登录页
  if (!auth.isLogin() && !['auth-login', 'auth-authorize'].includes(to.name as string)) {
    next({ name: 'auth-login' })
    return
  } else {
    document.title = (to.meta.title as string) || '虎子 · 你的AI助手，助力每日工作学习'
    next()
  }
})

router.onError((error, to, from) => {
  // 跳转到404页面，可携带错误信息
  router.push({
    name: 'not-found',
    query: {
      errorMsg: error.message || '路由发生错误',
    },
  })

  return false
})

export default router
