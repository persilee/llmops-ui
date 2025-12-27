<script setup lang="ts">
import AppsApi from '@/services/api/apps'
import type { GetAppsWithPage } from '@/services/api/apps/types'
import type { Paginator } from '@/services/types'
import { useAccountStore } from '@/stores/account'
import { formatDate } from '@/utils/format-util'
import LoadingStatus from '@/views/components/LoadingStatus.vue'
import PageCard from '@/views/components/PageCard.vue'
import { Message, Modal } from '@arco-design/web-vue'
import { debounce } from 'lodash-es'
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSpaceStore } from '../SpaceView.store'
import { useAppStore } from './AppView.store'

// 空间相关的状态管理store实例
const store = useSpaceStore()
// 应用相关的状态管理store实例
const appStore = useAppStore()
// 账户相关的状态管理store实例
const accountStore = useAccountStore()
// 控制加载状态的响应式变量
const loading = ref<boolean>(false)
// 存储应用列表数据的响应式数组
const apps = ref<GetAppsWithPage[]>([])
// 分页器配置对象，包含当前页码、每页条数、总页数和总记录数
const paginator = ref<Paginator>({
  current_page: 1, // 当前页码
  page_size: 20, // 每页显示条数
  total_page: 0, // 总页数
  total_record: 0, // 总记录数
})
// 滚动容器的模板引用，用于实现无限滚动功能
const scrollContainerRef = useTemplateRef('scrollContainer')
// Vue Router实例，用于页面导航
const router = useRouter()

/**
 * 获取应用列表数据
 * @param isLoadMore 是否为加载更多操作，默认为false
 *                  - true: 加载更多数据，页码递增
 *                  - false: 重新加载数据，重置页码并清空列表
 */
const fetchData = async (isLoadMore: boolean = false) => {
  // 处理分页逻辑
  if (isLoadMore) {
    // 如果是加载更多，检查是否还有下一页
    if (paginator.value.current_page >= paginator.value.total_page) return
    // 页码递增
    paginator.value.current_page++
  } else {
    // 如果是重新加载，重置页码并清空现有数据
    paginator.value.current_page = 1
    apps.value = []
  }

  try {
    // 开启加载状态
    loading.value = true
    // 调用API获取数据
    const resp = await AppsApi.getAppsWithPage({
      current_page: paginator.value.current_page,
      page_size: paginator.value.page_size,
      search_word: store.searchWord,
    })

    // 将新数据追加到现有列表中
    apps.value.push(...resp.data.list)
    // 更新分页信息
    paginator.value = resp.data.paginator
  } catch (err) {
    // 错误处理：显示错误提示信息
    const errorMessage = err instanceof Error ? err.message : '数据加载失败'
    Message.error(errorMessage)
  } finally {
    // 无论成功失败都关闭加载状态
    loading.value = false
  }
}

/**
 * 获取应用的子标签信息
 * @param app 应用对象，包含模型配置信息
 * @returns 返回格式化的字符串，包含模型提供商和模型名称，格式为："provider • model"
 */
const getSubLabel = (app: GetAppsWithPage) => {
  return `${app.model_config.provider} • ${app.model_config.model}`
}

/**
 * 获取应用的编辑时间信息
 * @param app 应用对象，包含更新时间等信息
 * @returns 返回格式化的字符串，包含账户名称和最近编辑时间，格式为："账户名 • 最近编辑 MM-DD HH:mm"
 */
const getDate = (app: GetAppsWithPage) => {
  return `${accountStore.account.name} • 最近编辑 ${formatDate(app.updated_at, 'MM-DD HH:mm')}`
}

/**
 * 处理应用操作选择
 * @param v 操作类型，可选值：'analysis' | 'edit' | 'delete' | 'copy'
 * @param app 应用对象，包含应用ID等信息
 * @returns Promise<void>
 */
const handleSelect = async (v: string, app: GetAppsWithPage) => {
  // 分析功能：跳转到应用分析页面
  if (v === 'analysis') {
    // 获取应用详细信息并存储到store中
    await appStore.getApp(app.id)
    // 跳转到应用分析页面
    router.push({ name: 'space-apps-analysis', params: { appId: app.id } })
  }
  // 编辑功能：跳转到应用编辑页面
  else if (v === 'edit') {
    // 获取应用详细信息并存储到store中
    await appStore.getApp(app.id)
    // 跳转到应用详情页面进行编辑
    router.push({ name: 'space-apps-detail', params: { appId: app.id } })
  }
  // 删除功能：删除当前应用
  else if (v === 'delete') {
    // 调用删除处理函数
    handelDelete(app)
  }
  // 复制功能：创建当前应用的副本
  else if (v === 'copy') {
    // 调用复制处理函数
    handelCopy(app)
  }
}

/**
 * 处理应用卡片点击事件
 * @param app 被点击的应用对象，包含应用ID等信息
 */
const handleClick = async (app: GetAppsWithPage) => {
  // 获取应用详细信息并存储到store中
  await appStore.getApp(app.id)
  // 跳转到应用详情页面
  router.push({ name: 'space-apps-detail', params: { appId: app.id } })
}

/**
 * 处理复制应用的操作
 * @param app 要复制的应用对象，包含应用ID等信息
 */
const handelCopy = async (app: GetAppsWithPage) => {
  try {
    // 开启加载状态，防止重复操作
    loading.value = true
    // 调用API复制应用
    const resp = await AppsApi.copyApp(app.id)
    // 显示复制成功的提示信息
    Message.success('复制应用副本成功')
    // 重新获取应用列表以显示新复制的应用
    await fetchData()
  } catch (error) {
    // TODO: 添加错误处理和提示信息
    console.error('复制应用失败:', error)
  } finally {
    // 无论成功失败都关闭加载状态
    loading.value = false
  }
}

/**
 * 处理删除应用的操作
 * @param app 要删除的应用对象
 */
const handelDelete = async (app: GetAppsWithPage) => {
  // 显示警告确认对话框
  Modal.warning({
    title: '要删除该应用吗？', // 模态框标题
    content:
      '删除应用后，发布的WebApp、开放API以及关联的社交媒体平台均无法使用该Agent应用，如果需要暂停应用，可使用取消发布功能。', // 提示内容
    hideCancel: false, // 显示取消按钮
    titleAlign: 'start', // 标题左对齐
    simple: false, // 简单模式

    // 确认按钮的回调函数
    onOk: async () => {
      try {
        // 开启加载状态
        loading.value = true
        // 调用删除API
        const resp = await AppsApi.deleteApp(app.id)
        // 检查删除操作是否成功
        if (resp.code == 'success') {
          // 显示成功消息
          Message.success(resp.message)
          // 从列表中移除已删除的应用
          apps.value = apps.value.filter((item) => item.id !== app.id)
        }
      } finally {
        // 无论成功失败都关闭加载状态
        loading.value = false
      }
    },

    // 取消按钮的回调函数
    onCancel: () => {
      // 取消删除操作，不做任何处理
    },
  })
}

// 判断是否需要显示手动加载按钮
const showLoadMoreBtn = computed(() => {
  if (!scrollContainerRef.value) return false
  const container = scrollContainerRef.value
  // 当内容高度小于容器高度时显示手动按钮
  return (
    container.scrollHeight <= container.clientHeight &&
    paginator.value.current_page < paginator.value.total_page
  )
})

// 处理滚动事件，实现无限滚动加载功能
const handleScroll = (e: Event) => {
  // 获取滚动容器元素
  const target = e.target as HTMLElement
  // 当滚动到距离底部16px以内时触发加载
  // scrollTop: 已滚动的距离
  // clientHeight: 可视区域高度
  // scrollHeight: 总内容高度
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 16) {
    // 如果正在加载中，则不重复触发
    if (loading.value) return

    // 加载更多数据（false表示不是加载更多，而是重新加载）
    fetchData(false)
  }
}

// 创建防抖函数，延迟300ms执行数据获取，避免频繁请求
const debouncedFetchData = debounce(fetchData, 300)

// 监听搜索词变化，当搜索词改变时触发数据重新加载
const stop = watch(
  () => store.searchWord,
  (newVal) => {
    if (newVal) {
      debouncedFetchData() // 使用防抖函数重新获取数据
    } else {
      fetchData() // 直接获取数据
    }
  },
)

// 组件挂载完成后执行的生命周期钩子
// 在这里调用fetchData获取初始数据，确保页面加载时显示数据列表
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div ref="scrollContainer" @scroll="handleScroll">
    <a-spin :loading="loading" class="block h-full w-full overflow-scroll scrollbar-w-none">
      <!-- 知识库列表 -->
      <a-row :gutter="[20, 20]" class="flex-1">
        <a-col :span="6" v-for="app in apps" :key="app.id">
          <PageCard
            :icon="app.icon"
            background="#ffffff"
            :name="app.name"
            :sub-label="getSubLabel(app)"
            :description="app.description"
            :date="getDate(app)"
            @click="handleClick(app)"
          >
            <a-dropdown position="br" @select="(v: string) => handleSelect(v, app)">
              <a-button @click.stop type="text" class="rounded-lg text-gray-700" size="small">
                <template #icon><icon-more /></template>
              </a-button>
              <template #content>
                <a-doption value="analysis">分析</a-doption>
                <a-doption value="edit">编辑应用</a-doption>
                <a-doption value="copy">复制副本</a-doption>
                <a-doption value="delete" class="text-red-500">删除</a-doption>
              </template>
            </a-dropdown>
          </PageCard>
        </a-col>
        <a-col :span="24" v-if="apps.length === 0">
          <a-empty
            description="未找到相关结果"
            class="h-[400px] flex flex-col items-center justify-center"
          />
        </a-col>
      </a-row>
      <!-- 加载和 loading -->
      <LoadingStatus
        :loading="loading"
        :paginator="paginator"
        :has-data="apps.length > 0"
        :show-load-more-btn="showLoadMoreBtn"
        @load-more="fetchData(true)"
      />
    </a-spin>
  </div>
</template>

<style scoped></style>
