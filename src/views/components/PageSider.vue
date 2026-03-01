<script setup lang="ts">
import IconApp from '@/components/icons/IconApp.vue'
import IconAppFull from '@/components/icons/IconAppFull.vue'
import IconHome from '@/components/icons/IconHome.vue'
import IconHomeFull from '@/components/icons/IconHomeFull.vue'
import IconOpenApi from '@/components/icons/IconOpenApi.vue'
import IconOpenApiFull from '@/components/icons/IconOpenApiFull.vue'
import IconSpace from '@/components/icons/IconSpace.vue'
import IconSpaceFull from '@/components/icons/IconSpaceFull.vue'
import IconTool from '@/components/icons/IconTool.vue'
import IconToolFull from '@/components/icons/IconToolFull.vue'
import { useAccountStore } from '@/stores/account'
import * as Storage from '@/utils/storage'
import PageRouterLink from '@/views/components/PageRouterLink.vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSpaceStore } from '../space/SpaceView.store'
import { useAppStore } from '../space/apps/AppView.store'
import AppModel from '../space/apps/components/AppModel.vue'

// 获取当前路由信息
const route = useRoute()
// 获取路由实例，用于导航
const router = useRouter()
// 获取账户状态管理store实例
const store = useAccountStore()
// 获取空间状态管理store实例
const spaceStore = useSpaceStore()
// 获取应用状态管理store实例
const appStore = useAppStore()
// 控制账号设置弹窗显示状态的响应式变量
const visible = ref(false)
const collapsed = ref(false)

// 处理用户退出登录
const handleLogout = () => {
  Storage.clear()
  router.push({ name: 'auth-login' })
}

// 打开账号设置弹窗
const handleAccountSetting = () => {
  router.push({ name: 'account-setting' })
}

// 打开创建应用弹窗
const handleCreateApp = () => {
  spaceStore.openCreateAppModal()
}

/**
 * 处理应用创建成功后的回调函数
 * @param appId - 新创建的应用ID
 */
const handleSuccess = async (appId: string) => {
  // 获取新创建的应用详细信息
  await appStore.getApp(appId)
  // 跳转到应用详情页面
  router.push({ name: 'space-apps-detail', params: { appId: appId } })
}

const handleCollapsed = () => {
  collapsed.value = !collapsed.value
}

// 组件挂载时获取用户账户信息
onMounted(() => {
  store.getAccount()
  console.log('aaaaaaaa', route.path.startsWith('/space'))
})
</script>

<template>
  <a-layout-sider
    :width="240"
    class="min-h-screen bg-gray-50 py-2 pl-2 shadow-none rounded-lg"
    :collapsed="collapsed"
    :collapsed-width="66"
  >
    <div
      :class="`bg-white h-full w-full rounded-lg px-2 py-4 flex flex-col justify-between  shadow-xs border border-gray-100 ${collapsed ? 'items-center' : ''}`"
    >
      <!-- 顶部区域：Logo和创建按钮 -->
      <div :class="`flex flex-col ${collapsed ? 'items-center' : ''}`">
        <!-- Logo区域 -->
        <div class="flex justify-between items-center mb-4 mt-1">
          <router-link v-if="!collapsed" to="/home" class="rounded-lg text-center">
            <div class="flex items-center relative">
              <img src="/src/assets/images/icon-avatar.png" alt="logo" class="h-8 w-8" />
              <div class="text-gray-900 text-base ml-2 font-bold">虎子</div>
              <img
                src="/src/assets/images/icon-logo-text.png"
                alt="logo"
                class="h-2.5 w-auto absolute bottom-[-8px]"
              />
            </div>
          </router-link>
          <a-tooltip :content="collapsed ? '展开侧边栏' : '关闭侧边栏'" position="right">
            <a-button type="text" @click="handleCollapsed">
              <template #icon><icon-layout class="text-gray-500 text-base" /></template>
            </a-button>
          </a-tooltip>
        </div>
        <!-- 创建AI应用按钮 -->
        <a-button
          v-if="!collapsed"
          type="primary"
          long
          class="rounded-lg mb-4 bg-blue-700"
          @click="handleCreateApp"
        >
          <template #icon>
            <icon-plus />
          </template>
          创建 AI 应用
        </a-button>
        <a-tooltip v-else content="创建AI应用" position="right">
          <a-button type="primary" class="rounded-lg mb-4 bg-blue-700" @click="handleCreateApp">
            <template #icon>
              <icon-plus />
            </template>
          </a-button>
        </a-tooltip>
        <!-- 导航菜单 -->
        <div class="flex flex-col gap-2">
          <!-- 首页导航 -->
          <PageRouterLink to="/home" label="首页" is-sider :collapsed="collapsed">
            <template #icon>
              <IconHomeFull v-if="route.path === '/home'" />
              <IconHome v-else />
            </template>
          </PageRouterLink>
          <!-- 个人空间导航 -->
          <PageRouterLink
            to="/space/apps"
            label="个人空间"
            is-sider
            :collapsed="collapsed"
            :is-active="route.path.startsWith('/space')"
          >
            <template #icon>
              <IconSpaceFull v-if="route.path.startsWith('/space')" /> <IconSpace v-else />
            </template>
          </PageRouterLink>
          <!-- 探索分组标题 -->
          <div class="text-gray-500 text-xs px-2">探索</div>
          <!-- 应用市场导航 -->
          <PageRouterLink to="/store/apps" label="应用市场" is-sider :collapsed="collapsed">
            <template #icon>
              <IconAppFull v-if="route.path.startsWith('/store/apps')" />
              <IconApp v-else />
            </template>
          </PageRouterLink>
          <!-- 插件广场导航 -->
          <PageRouterLink to="/store/tools" label="插件广场" is-sider :collapsed="collapsed">
            <template #icon>
              <IconToolFull v-if="route.path.startsWith('/store/tools')" />
              <IconTool v-else />
            </template>
          </PageRouterLink>
          <!-- 开发API导航 -->
          <PageRouterLink
            to="/openapi/start"
            label="开发 API"
            is-sider
            :collapsed="collapsed"
            :is-active="route.path.startsWith('/openapi')"
          >
            <template #icon>
              <IconOpenApiFull v-if="route.path.startsWith('/openapi')" />
              <IconOpenApi v-else />
            </template>
          </PageRouterLink>
        </div>
      </div>
      <!-- 用户信息下拉菜单 -->
      <a-dropdown v-if="store.account" position="tl">
        <!-- 用户信息展示区域 -->
        <div
          class="flex items-center gap-2 cursor-pointer p-2 transition-all rounded-lg hover:bg-gray-100"
        >
          <a-avatar :size="32" class="bg-transparent">
            <img :src="store.account.avatar" class="p-0.5" />
          </a-avatar>
          <div v-if="!collapsed" class="flex flex-col">
            <div class="text-sm text-gray-900">{{ store.account.name }}</div>
            <div class="text-xs text-gray-500">{{ store.account.email }}</div>
          </div>
        </div>
        <!-- 下拉菜单内容 -->
        <template #content>
          <a-doption @click="handleAccountSetting"
            ><template #icon><icon-settings /></template>账号设置</a-doption
          >
          <a-doption class="text-red-500!" @click="handleLogout"
            ><template #icon><icon-poweroff /></template>退出登录</a-doption
          >
        </template>
      </a-dropdown>
    </div>
    <AppModel
      v-model:visible="spaceStore.appModal.isOpen"
      :app="appStore.app"
      @success="handleSuccess"
    />
  </a-layout-sider>
</template>

<style scoped></style>
