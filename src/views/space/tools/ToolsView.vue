<script setup lang="ts">
import APIToolsApi from '@/services/api/api-tool'
import type { GetAPIToolProvidersWithPage } from '@/services/api/api-tool/types'
import PageCard from '@/views/components/PageCard.vue'
import ToolDetailDrawer from '@/views/components/ToolDetailDrawer.vue'

import { Message } from '@arco-design/web-vue'
import { computed, onMounted, ref } from 'vue'

const providers = ref<GetAPIToolProvidersWithPage[]>([])
const showIndex = ref<number>(-1)
const isShowToolDetail = ref<boolean>(false)
const loading = ref<boolean>(false)
const error = ref<string | null>(null)

// 计算属性：获取当前选中的工具提供者
const selectedProvider = computed(() => {
  return providers.value[showIndex.value]
})

// 获取工具列表数据
const fetchData = async () => {
  loading.value = true
  error.value = null

  try {
    const resp = await APIToolsApi.getAPIToolProvidersWithPage()
    providers.value = resp.data.list
  } catch (err) {
    Message.error('数据加载失败')
    error.value = err instanceof Error ? err.message : '数据加载失败'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleToolCardClick = (index: number) => {
  showIndex.value = index
  isShowToolDetail.value = true
}

const handleCloseDrawer = () => {
  isShowToolDetail.value = false
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <a-spin :loading="loading" class="block f-hull w-full">
    <!-- 工具列表 -->
    <a-row :gutter="[20, 20]" class="flex-1">
      <a-col :span="6" v-for="(provider, idx) in providers" :key="provider.name">
        <PageCard :data="provider" @click="handleToolCardClick(idx)" />
      </a-col>
      <a-col :span="24" v-if="providers.length === 0">
        <a-empty
          description="未找到相关结果"
          class="h-[400px] flex flex-col items-center justify-center"
        />
      </a-col>
    </a-row>

    <!-- 工具详情抽屉 -->
    <ToolDetailDrawer
      v-model:visible="isShowToolDetail"
      :provider="selectedProvider"
      @update:visible="handleCloseDrawer"
    />
  </a-spin>
</template>

<style scoped></style>
