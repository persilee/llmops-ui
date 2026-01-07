<script setup lang="ts">
import { formatDate } from '@/utils/format-util'
import HeaderSkeleton from '@/views/components/HeaderSkeleton.vue'
import { computed, ref } from 'vue'
import { useSpaceStore } from '../../SpaceView.store'
import { useWorkflowStore } from '../Workflow.store'

const props = defineProps<{
  headerLoading: boolean
}>()
const emits = defineEmits(['updateWorkflow'])
const store = useWorkflowStore()
const publishLoading = ref(false)
const isPublished = computed(() => store.workflow?.status == 'published')
const spaceStore = useSpaceStore()
const handleUpdateWorkflow = () => {
  spaceStore.openEditWorkflowModal()
}

const handlePublishClick = () => {}

const handleCancelPublishClick = () => {}
</script>

<template>
  <!-- 顶部导航 -->
  <header class="h-[76px] bg-gray-100 p-4 flex items-center justify-between relative">
    <!-- 左边标题和返回按钮 -->
    <div class="flex-1 flex items-center gap-2">
      <!-- 返回按钮 -->
      <RouterLink :to="{ name: 'space-workflows' }" replace>
        <a-button class="bg-gray-100 hover:bg-gray-200">
          <template #icon><icon-left /></template>
        </a-button>
      </RouterLink>
      <!-- 图标、标题和信息 -->
      <HeaderSkeleton v-if="headerLoading" />
      <div v-else class="flex items-center gap-3">
        <!-- 图标 -->
        <div class="bg-white border border-gray-300 rounded-lg p-2">
          <img :src="store.workflow?.icon" class="w-[25px] h-[28px]" />
        </div>
        <!-- 标题和信息 -->
        <div class="flex flex-col justify-between">
          <div class="flex items-center">
            <div class="text-gray-700 font-bold">{{ store.workflow?.name }}</div>
            <a-tooltip :content="store.workflow?.description">
              <a-button type="text" size="mini" @click="handleUpdateWorkflow">
                <template #icon>
                  <icon-info-circle class="w-3.5 h-3.5 text-gray-500" />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="编辑">
              <a-button type="text" size="mini" @click="handleUpdateWorkflow">
                <template #icon>
                  <img src="@/assets/images/icon-edit.png" class="w-3 h-3" />
                </template>
              </a-button>
            </a-tooltip>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <a-tag size="small" class="rounded h-[16px] leading-[16px] bg-gray-200 text-[10px]">
              <div v-if="store.loading" class="flex items-center gap-1.5">
                <a-spin :loading="store.loading" :size="12" class="loading" />
                <div class="text-gray-500">保存中...</div>
              </div>
              <div v-else class="text-gray-500">
                自动保存于
                {{ formatDate(store.workflow?.updated_at, 'HH:mm:ss') }}
              </div>
            </a-tag>
            <a-tag
              size="small"
              class="rounded h-[16px] leading-[16px] bg-gray-200 text-gray-500 text-[10px]"
            >
              有尚未发布的修改
            </a-tag>
          </div>
        </div>
      </div>
    </div>
    <!-- 右边按钮 -->
    <div class="flex-1 flex items-center justify-end gap-4">
      <a-button-group :disabled="!isPublished && !store.workflow?.is_debug_passed">
        <a-button
          :loading="publishLoading"
          :disabled="!store.workflow?.is_debug_passed"
          type="primary"
          class="rounded-l-sm font-bold"
          @click="handlePublishClick"
          >{{ store.workflow?.published_at ? '更新发布' : '发布' }}</a-button
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
</template>

<style scoped></style>
