<script setup lang="ts">
import { BASE_URL } from '@/config'
import BuiltinToolApi from '@/services/api/builtin-tool'
import type { GetBuiltinToolsResp, GetCategoriesResp } from '@/services/api/builtin-tool/types'
import { formatDate } from '@/utils/format-util'
import { useSpaceStore } from '@/views/space/SpaceView.store'
import ToolModal from '@/views/space/tools/components/ToolModal.vue'
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, ref } from 'vue'
import PageCard from '../../components/PageCard.vue'
import PageHeader from '../../components/PageHeader.vue'
import ToolDetailDrawer from '../../components/ToolDetailDrawer.vue'
import StoreFilter from '../components/StoreFilter.vue'

// 工具类别列表
const categories = ref<Array<GetCategoriesResp>>([])
// 工具提供商列表
const providers = ref<Array<GetBuiltinToolsResp>>([])
// 当前选中的工具类别，默认为'all'表示全部
const category = ref<string>('all')
// 搜索关键词
const searchWord = ref<string>('')
// 当前选中的工具卡片索引，-1表示未选中
const showIndex = ref<number>(-1)
// 是否显示工具详情抽屉
const isShowToolDetail = ref<boolean>(false)
// 数据加载状态
const loading = ref<boolean>(false)
// 错误信息
const error = ref<string | null>(null)
// 空间状态管理store
const store = useSpaceStore()

/**
 * 过滤工具列表的计算属性
 * @description 根据选中的类别和搜索关键词对工具列表进行筛选
 *              1. 类别筛选：当选择"全部"时显示所有类别，否则只显示选中类别的工具
 *              2. 搜索筛选：支持按工具标签进行不区分大小写的模糊搜索
 * @returns {Array<GetBuiltinToolsResp>} 过滤后的工具列表
 */
const filterProviders = computed(() => {
  // 过滤工具列表，根据选中的类别和搜索关键词进行筛选
  return providers.value.filter((item) => {
    // 类别匹配：选中"全部"或工具类别与选中类别相同
    const matchCategory = category.value === 'all' || item.category === category.value
    // 搜索关键词匹配：搜索框为空或工具标签包含搜索关键词（不区分大小写）
    const matchSearchWord =
      searchWord.value === '' || item.label.toLowerCase().includes(searchWord.value.toLowerCase())

    // 同时满足类别和搜索关键词条件
    return matchCategory && matchSearchWord
  })
})

// 计算属性：获取当前选中的工具提供者
const selectedProvider = computed(() => {
  return filterProviders.value[showIndex.value]
})

/**
 * 获取工具类别和工具列表数据
 * @description 该函数负责并行获取工具类别和工具列表数据，并处理加载状态和错误情况
 *              1. 设置加载状态为true，清除之前的错误信息
 *              2. 使用Promise.all并行请求类别和工具数据
 *              3. 将获取的数据分别赋值给响应式变量
 *              4. 处理可能出现的错误情况
 *              5. 无论成功失败，最后都将加载状态设置为false
 */
const fetchData = async () => {
  // 设置加载状态为true，清除之前的错误信息
  loading.value = true
  error.value = null

  try {
    // 并行请求工具类别和工具列表数据
    const [categoriesResp, builtinToolsResp] = await Promise.all([
      BuiltinToolApi.getCategories(),
      BuiltinToolApi.getBuiltinTools(),
    ])

    // 将获取的数据分别赋值给响应式变量
    categories.value = categoriesResp.data
    providers.value = builtinToolsResp.data
  } catch (err) {
    // 错误处理：显示错误消息，设置错误信息，并在控制台输出错误
    Message.error('数据加载失败')
    error.value = err instanceof Error ? err.message : '数据加载失败'
    console.error(err)
  } finally {
    // 无论成功失败，都将加载状态设置为false
    loading.value = false
  }
}

/**
 * 处理创建工具的操作
 * @description 当用户点击"创建自定义插件"按钮时触发此函数
 *              该函数会调用 store 中的 openCreateToolModal 方法来打开创建工具的模态框
 */
const handleCreateTool = () => {
  // 处理创建工具的逻辑
  store.openCreateToolModal()
}

/**
 * 处理模态框操作成功后的回调
 * @description 当工具创建/编辑操作成功后触发此函数
 *              该函数会执行两个主要操作：
 *              1. 调用 fetchData() 刷新工具列表数据
 *              2. 调用 store.closeModal('tool') 关闭工具模态框
 * @returns {void}
 */
const handleModalSuccess = () => {
  // 刷新数据列表
  fetchData()
  // 关闭模态框
  store.closeModal('tool')
}

/**
 * 处理工具卡片点击事件
 * @param index - 点击的工具卡片在列表中的索引
 * @description 当用户点击工具卡片时，记录当前选中的工具索引，并显示工具详情抽屉
 */
const handleToolCardClick = (index: number) => {
  showIndex.value = index
  isShowToolDetail.value = true
}

/**
 * 关闭工具详情抽屉
 * @description 当用户关闭工具详情抽屉时触发此函数
 */
const handleCloseDrawer = () => {
  isShowToolDetail.value = false
}

/**
 * 获取工具的图标URL
 * @param provider 工具提供商对象
 * @returns 返回工具图标的完整URL路径
 */
const getIcon = (provider: GetBuiltinToolsResp) => {
  return `${BASE_URL}/builtin-tools/${provider.name}/icon`
}

/**
 * 获取工具提供商的子标签信息
 * @param provider 工具提供商对象
 * @returns 返回包含提供商名称和工具数量的格式化字符串
 */
const getSubLabel = (provider: GetBuiltinToolsResp) => {
  return `提供商 ${provider.name} • ${provider.tools.length}`
}

/**
 * 获取工具提供商的发布时间信息
 * @param provider 工具提供商对象
 * @returns 返回格式化的字符串，包含发布者和发布时间
 */
const getDate = (provider: GetBuiltinToolsResp) => {
  return `User • 发布时间 ${formatDate(provider.created_at, 'MM-DD HH:mm')}`
}

// 组件挂载时执行的数据初始化
onMounted(() => {
  // 获取工具类别和工具列表数据
  fetchData()
})
</script>

<template>
  <a-spin :loading="loading" class="block h-full w-full bg-gray-50">
    <div class="flex flex-col p-6">
      <!-- 页面头部 -->
      <PageHeader title="插件广场" button-text="创建自定义插件" @click="handleCreateTool" />

      <!-- 筛选区域 -->
      <StoreFilter
        v-model:selected-category="category"
        v-model:search-word="searchWord"
        :categories="categories"
      />

      <!-- 工具列表 -->
      <a-row :gutter="[20, 20]" class="flex-1">
        <a-col
          :xs="8"
          :sm="8"
          :md="8"
          :lg="8"
          :xl="6"
          :xxl="4"
          v-for="(provider, idx) in filterProviders"
          :key="provider.name"
        >
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

    <!-- 工具模态框 -->
    <ToolModal v-model:visible="store.toolModal.isOpen" @success="handleModalSuccess" />
  </a-spin>
</template>

<style scoped></style>
