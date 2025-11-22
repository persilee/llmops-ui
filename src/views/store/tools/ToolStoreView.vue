<script setup lang="ts">
import { BASE_URL } from '@/config'
import BuiltinToolApi from '@/services/api/builtin-tool'
import type { GetBuiltinToolsResp, GetCategoriesResp } from '@/services/api/builtin-tool/types'
import { formatDate } from '@/utils/format-util'
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, ref } from 'vue'
import PageCard from '../../components/PageCard.vue'
import ToolHeader from '../../components/PageHeader.vue'
import ToolDetailDrawer from '../../components/ToolDetailDrawer.vue'
import ToolFilter from './components/ToolFilter.vue'

const categories = ref<Array<GetCategoriesResp>>([])
const providers = ref<Array<GetBuiltinToolsResp>>([])
const category = ref<string>('all')
const searchWord = ref<string>('')
const showIndex = ref<number>(-1)
const isShowToolDetail = ref<boolean>(false)
const loading = ref<boolean>(false)
const error = ref<string | null>(null)

const filterProviders = computed(() => {
  // 过滤工具列表，根据选中的类别和搜索关键词进行筛选
  return providers.value.filter((item) => {
    // 类别匹配：选中"全部"或工具类别与选中类别相同
    const matchCategory = category.value === 'all' || item.category === category.value
    // 搜索关键词匹配：搜索框为空或工具标签包含搜索关键词（不区分大小写）
    const matchSearchWord =
      searchWord.value === '' || item.label.toLowerCase().includes(searchWord.value)

    // 同时满足类别和搜索关键词条件
    return matchCategory && matchSearchWord
  })
})

// 计算属性：获取当前选中的工具提供者
const selectedProvider = computed(() => {
  return filterProviders.value[showIndex.value]
})

// 获取工具类别数据和工具列表数据
const fetchData = async () => {
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
    Message.error('数据加载失败')
    error.value = err instanceof Error ? err.message : '数据加载失败'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const handleCreateTool = () => {
  // 处理创建工具的逻辑
  console.log('创建自定义插件')
}

const handleToolCardClick = (index: number) => {
  showIndex.value = index
  isShowToolDetail.value = true
}

const handleCloseDrawer = () => {
  isShowToolDetail.value = false
}

const getIcon = (provider: GetBuiltinToolsResp) => {
  return `${BASE_URL}/builtin-tools/${provider.name}/icon`
}

const getSubLabel = (provider: GetBuiltinToolsResp) => {
  return `提供商 ${provider.name} • ${provider.tools.length}`
}

const getDate = (provider: GetBuiltinToolsResp) => {
  return `User • 发布时间 ${formatDate(provider.created_at, 'MM-DD HH:mm')}`
}
</script>

<template>
  <a-spin :loading="loading" class="block h-full w-full bg-gray-50">
    <div class="flex flex-col p-6">
      <!-- 页面头部 -->
      <ToolHeader title="插件广场" button-text="创建自定义插件" @click="handleCreateTool" />

      <!-- 筛选区域 -->
      <ToolFilter
        v-model:selected-category="category"
        v-model:search-word="searchWord"
        :categories="categories"
      />

      <!-- 工具列表 -->
      <a-row :gutter="[20, 20]" class="flex-1">
        <a-col :span="6" v-for="(provider, idx) in filterProviders" :key="provider.name">
          <PageCard
            :icon="getIcon(provider)"
            :background="provider.background"
            :name="provider.label"
            :sub-label="getSubLabel(provider)"
            :description="provider.description"
            :date="getDate(provider)"
            @click="handleToolCardClick(idx)"
          />
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
      v-if="selectedProvider"
      v-model:visible="isShowToolDetail"
      :provider="selectedProvider"
      :icon="getIcon(selectedProvider)"
      :background="selectedProvider.background"
      :name="selectedProvider.label"
      @update:visible="handleCloseDrawer"
    />
  </a-spin>
</template>

<style scoped></style>
