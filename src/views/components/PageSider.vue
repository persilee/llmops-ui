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
import AccountSetting from '@/views/components/AccountSetting.vue'
import PageRouterLink from '@/views/components/PageRouterLink.vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const store = useAccountStore()
const visible = ref(false)

const handleLogout = () => {
  Storage.clear()
  router.push({ name: 'auth-login' })
}

const handleAccountSetting = () => {
  visible.value = true
}

onMounted(() => {
  store.getAccount()
})
</script>

<template>
  <a-layout-sider :width="240" class="min-h-screen bg-gray-50 p-2 shadow-none">
    <div class="bg-white h-full rounded-lg px-2 py-4 flex flex-col justify-between">
      <!-- 顶部区域：Logo和创建按钮 -->
      <div class="">
        <!-- Logo区域 -->
        <div class="flex justify-start">
          <router-link to="/home" class="block h-9 w-[110px] mb-5 transition-all rounded-lg">
            <img src="/src/assets/images/logo.png" alt="logo" />
          </router-link>
        </div>
        <!-- 创建AI应用按钮 -->
        <a-button type="primary" long class="rounded-lg mb-4 bg-blue-700!">
          <template #icon>
            <icon-plus />
          </template>
          创建 AI 应用
        </a-button>
        <!-- 导航菜单 -->
        <div class="flex flex-col gap-2">
          <!-- 首页导航 -->
          <PageRouterLink to="/home" label="首页" is-sider>
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
            :class="route.path.startsWith('/space') ? ['bg-gray-200', 'font-bold'] : ''"
          >
            <template #icon>
              <IconSpaceFull v-if="route.path.startsWith('/space')" /> <IconSpace v-else />
            </template>
          </PageRouterLink>
          <!-- 探索分组标题 -->
          <div class="text-gray-500 text-xs px-2">探索</div>
          <!-- 应用市场导航 -->
          <PageRouterLink to="/store/apps" label="应用市场" is-sider>
            <template #icon>
              <IconAppFull v-if="route.path.startsWith('/store/apps')" />
              <IconApp v-else />
            </template>
          </PageRouterLink>
          <!-- 插件广场导航 -->
          <PageRouterLink to="/store/tools" label="插件广场" is-sider>
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
            :class="route.path.startsWith('/openapi') ? ['bg-gray-200', 'font-bold'] : ''"
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
          <div class="flex flex-col">
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
    <AccountSetting v-model:visible="visible" />
  </a-layout-sider>
</template>

<style scoped></style>
