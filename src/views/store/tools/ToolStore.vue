<script setup lang="ts">
import BuiltinToolApi from '@/services/api/builtin-tool'
import type { GetBuiltinToolsResp, GetCategoriesResp } from '@/services/api/builtin-tool/types'
import { computed, onMounted, ref } from 'vue'
import ToolCard from './components/ToolCard.vue'
import ToolDetailDrawer from './components/ToolDetailDrawer.vue'
import ToolFilter from './components/ToolFilter.vue'
import ToolHeader from './components/ToolHeader.vue'

const categories = ref<Array<GetCategoriesResp>>([])
const providers = ref<Array<GetBuiltinToolsResp>>([])
const category = ref<string>('all')
const searchWord = ref<string>('')
const showIndex = ref<number>(-1)
const loading = ref<boolean>(false)
const error = ref<string | null>(null)

const isShowToolDetail = computed(() => showIndex.value !== -1)

const filterProviders = computed(() => {
  return providers.value.filter((item) => {
    const matchCategory = category.value === 'all' || item.category === category.value
    const matchSearchWord =
      searchWord.value === '' || item.label.toLowerCase().includes(searchWord.value)

    return matchCategory && matchSearchWord
  })
})

const selectedProvider = computed(() => {
  return showIndex.value !== -1 ? filterProviders.value[showIndex.value] : null
})

onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    const [categoriesResp, builtinToolsResp] = await Promise.all([
      BuiltinToolApi.getCategories(),
      BuiltinToolApi.getBuiltinTools(),
    ])

    categories.value = categoriesResp.data
    providers.value = builtinToolsResp.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load data'
    console.error('Error loading data:', err)
  } finally {
    loading.value = false
  }
})

const handleCreateTool = () => {
  // 处理创建工具的逻辑
  console.log('创建自定义插件')
}

const handleToolCardClick = (index: number) => {
  showIndex.value = index
}

const handleCloseDrawer = () => {
  showIndex.value = -1
}
</script>

<template>
  <a-spin :loading="loading" class="block h-full w-full bg-gray-50">
    <div class="flex flex-col p-6">
      <!-- 页面头部 -->
      <ToolHeader title="插件广场" @click="handleCreateTool" />

      <!-- 筛选区域 -->
      <ToolFilter
        v-model:selected-category="category"
        v-model:search-word="searchWord"
        :categories="categories"
      />

      <!-- 工具列表 -->
      <a-row :gutter="[20, 20]" class="flex-1">
        <a-col :span="6" v-for="(provider, idx) in filterProviders" :key="provider.name">
          <ToolCard :tool="provider" @click="handleToolCardClick(idx)" />
        </a-col>
        <a-col :span="24" v-if="filterProviders.length === 0">
          <a-empty
            description="未找到相关结果"
            class="h-[400px] flex flex-col items-center justify-center"
          />
        </a-col>
      </a-row>
    </div>

    <!-- 工具详情抽屉 -->
    <ToolDetailDrawer
      v-model:visible="isShowToolDetail"
      :provider="selectedProvider"
      @click="handleCloseDrawer"
    />
  </a-spin>
</template>

<style scoped></style>
