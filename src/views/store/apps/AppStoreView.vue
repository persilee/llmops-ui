<script setup lang="ts">
import BuiltinAppApi from '@/services/api/builtin-app'
import type {
  GetBuiltinAppCategoriesResp,
  GetBuiltinAppsResp,
} from '@/services/api/builtin-app/types'
import { useAccountStore } from '@/stores/account'
import { formatDate } from '@/utils/format-util'
import PageCard from '@/views/components/PageCard.vue'
import PageHeader from '@/views/components/PageHeader.vue'
import { useAppStore } from '@/views/space/apps/AppView.store'
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import StoreFilter from '../components/StoreFilter.vue'

// 应用分类列表
const categories = ref<Array<GetBuiltinAppCategoriesResp>>([])
// 当前选中的应用分类，默认为'all'表示显示所有分类
const category = ref<string>('all')
// 搜索关键词
const searchWord = ref<string>('')
// 内置应用列表
const builtinApps = ref<Array<GetBuiltinAppsResp>>([])
// 加载状态标识
const loading = ref(false)
// 账户状态管理实例
const accountStore = useAccountStore()
// 路由实例
const router = useRouter()
// 应用状态管理实例
const appStore = useAppStore()

/**
 * 计算属性：过滤内置应用列表
 * 根据当前选择的分类和搜索关键词来筛选应用列表
 * @returns {Array<GetBuiltinAppsResp>} 过滤后的应用列表
 */
const filterBuiltinApps = computed(() => {
  return builtinApps.value.filter((item) => {
    // 检查应用分类是否匹配：当选择"all"时显示所有分类，否则只显示选定分类的应用
    const matchCategory = category.value === 'all' || item.category === category.value
    // 检查应用名称是否匹配搜索关键词：不区分大小写进行模糊匹配
    const matchSearchWord =
      searchWord.value === '' || item.name.toLowerCase().includes(searchWord.value.toLowerCase())

    // 返回同时满足分类和搜索关键词匹配的应用
    return matchCategory && matchSearchWord
  })
})

/**
 * 获取应用的子标签信息
 * @param {GetBuiltinAppsResp} app - 应用对象，包含模型配置信息
 * @returns {string} 返回格式化的子标签，包含模型提供商和模型名称
 */
const getSubLabel = (app: GetBuiltinAppsResp) => {
  return `${app.model_config.provider} • ${app.model_config.model}`
}

/**
 * 获取应用的编辑信息
 * @param {GetBuiltinAppsResp} app - 应用对象，包含创建时间信息
 * @returns {string} 返回格式化的编辑信息，包含编辑者名称和最近编辑时间
 */
const getDate = (app: GetBuiltinAppsResp) => {
  return `${accountStore.account.name} • 最近编辑 ${formatDate(app.created_at, 'MM-DD HH:mm')}`
}

const handleToolCardClick = (index: number) => {}

/**
 * 获取应用数据
 * 同时获取应用分类和应用列表数据
 * @returns {Promise<void>}
 */
const fetchData = async () => {
  // 开始加载状态
  loading.value = true
  try {
    // 并行请求应用分类和应用列表数据
    const [categoriesResp, builtinAppsResp] = await Promise.all([
      BuiltinAppApi.getBuiltinAppCategories(),
      BuiltinAppApi.getBuiltinApps(),
    ])
    // 更新分类数据
    categories.value = categoriesResp.data
    // 更新应用列表数据
    builtinApps.value = builtinAppsResp.data
  } finally {
    // 结束加载状态
    loading.value = false
  }
}

/**
 * 处理应用操作选择
 * @param {string} v - 操作类型，当前支持 'copy' 复制操作
 * @param {GetBuiltinAppsResp} app - 要操作的应用对象
 */
const handleSelect = async (v: string, app: GetBuiltinAppsResp) => {
  // 处理复制应用操作
  if (v === 'copy') {
    try {
      // 开启加载状态，防止重复操作
      loading.value = true
      // 调用API将内置应用复制到用户空间
      const resp = await BuiltinAppApi.addBuiltinAppToSpace({ builtin_app_id: app.id })
      // 获取复制后的应用详情
      await appStore.getApp(resp.data.app_id)
      // 显示复制成功提示
      Message.success('复制成功')
      // 跳转到应用详情页面
      router.push({ name: 'space-apps-detail', params: { appId: resp.data.app_id } })
    } catch (error) {
      // 错误处理：静默处理错误，由上层统一处理
    } finally {
      // 无论成功失败都关闭加载状态
      loading.value = false
    }
  }
}

// 组件挂载时执行的生命周期钩子
onMounted(() => {
  // 获取应用数据
  fetchData()
})
</script>

<template>
  <a-spin :loading="loading" class="block h-full w-full bg-gray-50">
    <div class="flex flex-col p-6">
      <!-- 页面头部 -->
      <PageHeader title="应用广场" />

      <!-- 筛选区域 -->
      <StoreFilter
        v-model:selected-category="category"
        v-model:search-word="searchWord"
        :categories="categories"
        :placeholder="'搜索应用'"
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
          v-for="(builtinApp, idx) in filterBuiltinApps"
          :key="builtinApp.id"
        >
          <PageCard
            :icon="builtinApp.icon"
            background="#fff"
            :name="builtinApp.name"
            :sub-label="getSubLabel(builtinApp)"
            :description="builtinApp.description"
            :date="getDate(builtinApp)"
            @click="handleToolCardClick(idx)"
          >
            <a-dropdown position="br" @select="(v: string) => handleSelect(v, builtinApp)">
              <a-button @click.stop type="text" class="rounded-lg text-gray-700" size="small">
                <template #icon><icon-more /></template>
              </a-button>
              <template #content>
                <a-doption value="copy">复制到空间</a-doption>
              </template>
            </a-dropdown>
          </PageCard>
        </a-col>
        <a-col :span="24" v-if="filterBuiltinApps.length === 0">
          <a-empty
            description="未找到相关结果"
            class="h-[400px] flex flex-col items-center justify-center"
          />
        </a-col>
      </a-row>
    </div>
  </a-spin>
</template>

<style scoped></style>
