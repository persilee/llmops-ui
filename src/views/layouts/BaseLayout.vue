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
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <a-layout has-sider class="h-full">
    <a-layout-sider :width="240" class="min-h-screen bg-gray-50 p-2 shadow-none">
      <div class="bg-white h-full rounded-lg px-2 py-4 flex flex-col justify-between">
        <div class="">
          <div class="flex justify-start">
            <router-link to="/home" class="block h-9 w-[110px] mb-5 transition-all rounded-lg">
              <img src="/src/assets/images/logo.png" alt="logo" />
            </router-link>
          </div>
          <a-button type="primary" long class="rounded-lg mb-4 bg-blue-700!">
            <template #icon>
              <icon-plus />
            </template>
            创建 AI 应用
          </a-button>
          <div class="flex flex-col gap-2">
            <router-link
              to="/home"
              class="flex items-center gap-2 h-8 leading-8 rounded-lg transition-all px-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200"
              active-class="bg-gray-100 font-bold"
            >
              <IconHomeFull v-if="route.path === '/home'" />
              <IconHome v-else /> 首页
            </router-link>
            <router-link
              to="/space/apps"
              :class="`flex items-center gap-2 h-8 leading-8 rounded-lg transition-all px-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200 ${route.path.startsWith('/space') ? 'bg-gray-100 font-bold' : ''}`"
              active-class="bg-gray-100 font-bold"
            >
              <IconSpaceFull v-if="route.path.startsWith('/space')" />
              <IconSpace v-else /> 个人空间
            </router-link>
            <div class="text-gray-500 text-xs px-2">探索</div>
            <router-link
              to="/store/apps"
              class="flex items-center gap-2 h-8 leading-8 rounded-lg transition-all px-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200"
              active-class="bg-gray-100 font-bold"
            >
              <IconAppFull v-if="route.path.startsWith('/store/apps')" />
              <IconApp v-else /> 应用市场
            </router-link>
            <router-link
              to="/store/tools"
              class="flex items-center gap-2 h-8 leading-8 rounded-lg transition-all px-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200"
              active-class="bg-gray-100 font-bold"
            >
              <IconToolFull v-if="route.path.startsWith('/store/tools')" />
              <IconTool v-else /> 插件广场
            </router-link>
            <router-link
              to="/open"
              class="flex items-center gap-2 h-8 leading-8 rounded-lg transition-all px-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200"
              active-class="bg-gray-100 font-bold"
            >
              <IconOpenApiFull v-if="route.path.startsWith('/open')" />
              <IconOpenApi v-else /> 开发 API
            </router-link>
          </div>
        </div>
        <a-dropdown position="tl">
          <div
            class="flex items-center gap-2 cursor-pointer p-2 transition-all rounded-lg hover:bg-gray-100"
          >
            <a-avatar :size="32" class="text-xs bg-blue-700">貓</a-avatar>
            <div class="flex flex-col">
              <div class="text-sm text-gray-900">貓小喵</div>
              <div class="text-xs text-gray-500">xiaomiao@qq.com</div>
            </div>
          </div>
          <template #content>
            <a-doption
              ><template #icon><icon-settings /></template>账号设置</a-doption
            >
            <a-doption class="text-red-500!"
              ><template #icon><icon-poweroff /></template>退出登录</a-doption
            >
          </template>
        </a-dropdown>
      </div>
    </a-layout-sider>
    <a-layout-content>
      <router-view></router-view>
    </a-layout-content>
  </a-layout>
</template>

<style scoped></style>
