<script setup lang="ts">
import HeaderSkeleton from '@/views/components/HeaderSkeleton.vue'
import { ref } from 'vue'

const headerLoading = ref(false)
</script>

<template>
  <div class="min-h-screen flex flex-col h-full overflow-hidden">
    <!-- 顶部导航 -->
    <header class="h-[76px] bg-gray-100 p-4 flex items-center justify-between relative">
      <!-- 左边标题和返回按钮 -->
      <div class="flex-1 flex items-center gap-2">
        <!-- 返回按钮 -->
        <RouterLink :to="{ name: 'space-apps' }" replace>
          <a-button class="bg-gray-100 hover:bg-gray-200">
            <template #icon><icon-left /></template>
          </a-button>
        </RouterLink>
        <!-- 图标、标题和信息 -->
        <HeaderSkeleton v-if="headerLoading" />
        <div v-else class="flex items-center gap-3">
          <!-- 图标 -->
          <div class="bg-white border border-gray-300 rounded-lg p-2">
            <img
              src="https://llmops-dev-1253877543.cos.ap-guangzhou.myqcloud.com/2025/11/05/dd61aaff-a83f-463b-8564-736f379b870b.png"
              class="w-[25px] h-[28px]"
            />
          </div>
          <!-- 标题和信息 -->
          <div class="flex flex-col justify-between h-[40px]">
            <div class="flex items-center gap-1">
              <div class="text-gray-700 font-bold">聊天机器人</div>
              <img src="@/assets/images/icon-edit.png" class="w-3.5 h-3.5" />
            </div>
            <div class="flex items-center gap-2">
              <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500">
                <template #icon>
                  <img src="@/assets/images/icon-user-dark.png" class="w-3 h-3" />
                </template>
                个人空间
              </a-tag>
              <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500">
                <template #icon>
                  <img src="@/assets/images/icon-history.png" class="w-3 h-3" />
                </template>
                草稿
              </a-tag>
              <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500"
                >已自动保存 23:18:15</a-tag
              >
            </div>
          </div>
        </div>
      </div>
      <!-- 中间导航 -->
      <div class="flex-1 flex items-center justify-center gap-3">
        <RouterLink
          :to="{ name: 'space-apps-detail' }"
          class="text-lg font-bold link-gray"
          active-class="text-blue-700"
          >编排页面</RouterLink
        >
        <RouterLink
          :to="{ name: 'space-apps-published' }"
          class="text-lg font-bold link-gray"
          active-class="text-blue-700"
          >发布配置</RouterLink
        >
        <RouterLink
          :to="{ name: 'space-apps-analysis' }"
          class="text-lg font-bold link-gray"
          active-class="text-blue-700"
          >统计分析</RouterLink
        >
      </div>
      <!-- 右边按钮 -->
      <div class="flex-1 flex items-center justify-end gap-4">
        <a-button class="rounded-lg bg-gray-100 border-gray-200">
          <template #icon>
            <img src="@/assets/images/icon-history.svg" class="h-4 w-4" />
          </template>
        </a-button>
        <a-button-group>
          <a-button type="primary" class="rounded-l-sm font-bold">更新发布</a-button>
          <a-dropdown position="br">
            <a-button type="primary" class="w-6 rounded-r-sm">
              <template #icon>
                <icon-down />
              </template>
            </a-button>
            <template #content>
              <a-doption class="text-red-700">取消发布</a-doption>
            </template>
          </a-dropdown>
        </a-button-group>
      </div>
    </header>
    <main class="flex-1 flex">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.link-gray {
  color: #6b7280;
}
</style>
