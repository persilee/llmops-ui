<script setup lang="ts">
import AppsApi from '@/services/api/apps'
import { formatDate } from '@/utils/format-util'
import HeaderSkeleton from '@/views/components/HeaderSkeleton.vue'
import { Message, Modal } from '@arco-design/web-vue'
import { computed, onMounted, ref } from 'vue'
import { useSpaceStore } from '../SpaceView.store'
import { useAppStore } from './AppView.store'
import AppModel from './components/AppModel.vue'
import HistoryVersionDrawer from './components/HistoryVersionDrawer.vue'

// 头部加载状态，用于控制头部信息的加载动画
const headerLoading = ref(false)
// 发布按钮加载状态，用于控制发布/取消发布操作的加载动画
const publishLoading = ref(false)
// 应用状态管理store，用于管理应用相关的数据和操作
const store = useAppStore()
// 空间状态管理store，用于管理空间相关的数据和操作
const spaceStore = useSpaceStore()
// 历史版本抽屉的显示状态，控制历史版本抽屉的打开和关闭
const historyVersionVisible = ref(false)
// 计算属性，判断应用是否已发布
const isPublished = computed(() => store.app?.status === 'published')

/**
 * 获取应用数据
 * @description 从服务器获取应用信息并更新到store中
 * @returns {Promise<void>}
 */
const fetchAppData = async () => {
  try {
    if (store.app && store.app.id) {
      // 设置加载状态为true，显示加载中效果
      headerLoading.value = true
      // 调用API获取指定ID的应用数据
      const resp = await AppsApi.getApp(store.app.id)
      // 将获取到的数据存储到store中
      store.app = resp.data
    }
  } finally {
    // 无论成功失败，都将加载状态设置为false
    headerLoading.value = false
  }
}

/**
 * 处理应用发布点击事件
 * @description 当用户点击发布按钮时，调用发布API并更新应用数据
 * @returns {Promise<void>}
 */
const handlePublishClick = async () => {
  try {
    // 检查应用数据是否存在
    if (store.app && store.app.id) {
      // 设置发布加载状态
      publishLoading.value = true
      // 调用发布API
      const resp = await AppsApi.publish(store.app.id)
      // 重新获取应用数据以更新状态
      await fetchAppData()
      // 显示成功消息
      Message.success(resp.message)
    }
  } finally {
    // 无论成功失败，都重置加载状态
    publishLoading.value = false
  }
}

/**
 * 处理取消发布应用点击事件
 * @description 当用户点击取消发布按钮时，调用取消发布API并更新应用数据
 * @returns {void}
 */
const handleCancelPublishClick = async () => {
  // 显示取消发布确认对话框
  Modal.warning({
    title: '要取消发布该Agent应用吗？', // 对话框标题
    content:
      '取消发布后，WebApp以及发布的社交媒体平台均无法使用该Agent，如需更新WebApp地址，请使用地址重生成功能。', // 取消发布警告内容
    hideCancel: false, // 显示取消按钮，允许用户取消操作
    titleAlign: 'start', // 标题左对齐显示
    simple: false, // 使用完整模式显示对话框

    // 确认删除的回调函数
    onOk: async () => {
      try {
        // 检查应用数据是否存在
        if (store.app && store.app.id) {
          // 设置发布加载状态，显示加载中效果
          publishLoading.value = true
          // 调用取消发布API
          const resp = await AppsApi.cancelPublish(store.app.id)
          // 重新获取应用数据以更新状态
          await fetchAppData()
          // 显示成功消息
          Message.success(resp.message)
        }
      } finally {
        // 无论成功失败，都重置加载状态
        publishLoading.value = false
      }
    },
  })
}

/**
 * 处理更新应用点击事件
 * @description 当用户点击编辑按钮时，打开编辑应用模态框
 * @returns {void}
 */
const handleUpdateApp = () => {
  spaceStore.openEditAppModal()
}

/**
 * 处理操作成功回调
 * @description 当应用信息更新成功后，重新获取应用数据以刷新界面
 * @returns {void}
 */
const handleSuccess = () => {
  fetchAppData()
}

/**
 * 处理历史版本点击事件
 * @description 当用户点击历史版本按钮时，打开历史版本抽屉
 * @returns {void}
 */
const handleHistoryVersionClick = () => {
  historyVersionVisible.value = true
}

// 组件挂载完成后执行的生命周期钩子
// 在这里调用fetchData获取初始数据，确保页面加载时显示数据
onMounted(() => {
  fetchAppData()
})
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
            <img :src="store.app?.icon" class="w-[25px] h-[28px]" />
          </div>
          <!-- 标题和信息 -->
          <div class="flex flex-col justify-between">
            <div class="flex items-center gap-1">
              <div class="text-gray-700 font-bold">{{ store.app?.name }}</div>
              <a-tooltip content="编辑">
                <a-button type="text" size="mini" @click="handleUpdateApp">
                  <template #icon>
                    <img src="@/assets/images/icon-edit.png" class="w-3.5 h-3.5" />
                  </template>
                </a-button>
              </a-tooltip>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <a-tag
                size="small"
                class="rounded h-[16px] leading-[16px] text-[10px] bg-gray-200 text-gray-500"
              >
                <template #icon>
                  <img src="@/assets/images/icon-user-dark.png" class="w-2.5 h-2.5" />
                </template>
                个人空间
              </a-tag>
              <a-tag
                size="small"
                class="rounded h-[16px] leading-[16px] text-[10px] bg-gray-200 text-gray-500"
              >
                <template #icon>
                  <img src="@/assets/images/icon-history.png" class="w-2.5 h-2.5" />
                </template>
                {{ isPublished ? '已发布' : '草稿' }}
              </a-tag>
              <a-tag size="small" class="rounded h-[16px] leading-[16px] text-[10px] bg-gray-200">
                <div v-if="store.loading" class="flex items-center gap-1.5">
                  <a-spin :loading="store.loading" :size="14" class="loading" />
                  <div class="text-gray-500 text-xs">保存中...</div>
                </div>
                <div v-else class="text-gray-500">
                  草稿自动保存于
                  {{ formatDate(store.draftAppConfig?.updated_at, 'HH:mm:ss') }}
                </div>
              </a-tag>
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
        <a-button class="rounded-lg bg-gray-100 border-gray-200" @click="handleHistoryVersionClick">
          <template #icon>
            <img src="@/assets/images/icon-history.svg" class="h-4 w-4" />
          </template>
        </a-button>
        <a-button-group>
          <a-button
            :loading="publishLoading"
            type="primary"
            class="rounded-l-sm font-bold"
            @click="handlePublishClick"
            >更新发布</a-button
          >
          <a-dropdown position="br">
            <a-button type="primary" class="w-6 rounded-r-sm" :disabled="publishLoading">
              <template #icon>
                <icon-down />
              </template>
            </a-button>
            <template #content>
              <a-doption
                :disabled="!isPublished"
                :class="`${!isPublished ? 'text-gray-400' : 'text-red-700'}`"
                @click="handleCancelPublishClick"
                >取消发布</a-doption
              >
            </template>
          </a-dropdown>
        </a-button-group>
      </div>
    </header>
    <main class="flex-1 flex">
      <RouterView />
    </main>
    <HistoryVersionDrawer v-model:visible="historyVersionVisible" />
    <AppModel
      v-model:visible="spaceStore.appModal.isOpen"
      :app="store.app"
      @success="handleSuccess"
    />
  </div>
</template>

<style scoped>
.link-gray {
  color: #6b7280;
}

:deep(.loading .arco-spin-icon) {
  color: #6a7282 !important;
}
</style>
