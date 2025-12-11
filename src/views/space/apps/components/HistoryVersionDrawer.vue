<script setup lang="ts">
import AppsApi from '@/services/api/apps'
import type { GetPublishHistoriesWithPage } from '@/services/api/apps/types'
import type { Paginator } from '@/services/types'
import { formatDate } from '@/utils/format-util'
import { padWithZeros } from '@/utils/util'
import LoadingStatus from '@/views/components/LoadingStatus.vue'
import { Message } from '@arco-design/web-vue'
import { onUnmounted, ref, watch } from 'vue'
import { useAppStore } from '../AppView.store'

// 控制抽屉组件的显示/隐藏状态
const visible = defineModel('visible', { type: Boolean, default: false })
// 应用状态管理store实例
const store = useAppStore()
// 加载状态标识，用于控制加载动画和防止重复操作
const loading = ref(false)
// 历史版本列表数据，存储从API获取的发布历史记录
const historyVersions = ref<GetPublishHistoriesWithPage[]>([])
// 分页器的响应式变量，用于管理片段列表的分页信息
const paginator = ref<Paginator>({
  current_page: 1, // 当前页码，默认为1
  page_size: 20, // 每页显示数量，默认为20条
  total_page: 0, // 总页数，初始为0
  total_record: 0, // 总记录数，初始为0
})

/**
 * 获取历史版本数据
 * @param isLoadMore 是否为加载更多操作，默认为false
 *                  - true: 加载下一页数据
 *                  - false: 重新加载第一页数据
 */
const fetchHistoryVersionData = async (isLoadMore: boolean = false) => {
  // 处理分页逻辑
  if (isLoadMore) {
    // 如果是加载更多，检查是否还有下一页
    if (paginator.value.current_page >= paginator.value.total_page) return
    // 页码递增
    paginator.value.current_page++
  } else {
    // 如果是重新加载，重置页码并清空现有数据
    paginator.value.current_page = 1
    historyVersions.value = []
  }
  try {
    // 确保应用信息存在
    if (store.app && store.app.id) {
      // 设置加载状态
      loading.value = true
      // 调用API获取分页数据
      const resp = await AppsApi.getPublishHistoriesWithPage(store.app.id, {
        current_page: paginator.value.current_page,
        page_size: paginator.value.page_size,
      })

      // 将新数据追加到现有列表中
      historyVersions.value.push(...resp.data.list)
      // 更新分页器信息
      paginator.value = resp.data.paginator
    }
  } catch (error) {
    // 错误处理：捕获并处理API调用可能出现的异常
  } finally {
    // 无论操作成功与否，都重置加载状态
    loading.value = false
  }
}

/**
 * 处理滚动事件，实现无限滚动加载
 * @param e 滚动事件对象
 */
const handleScroll = (e: Event) => {
  // 获取滚动容器元素
  const target = e.target as HTMLElement
  // 判断是否滚动到接近底部（距离底部16px时触发）
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 16) {
    // 如果正在加载中，则不重复触发
    if (loading.value) return

    // 触发加载更多数据
    fetchHistoryVersionData(true)
  }
}

/**
 * 处理历史版本回退功能
 * @param {string} id - 要回退到的历史版本ID
 */
const handleFallbackHistoryVersion = async (id: string) => {
  try {
    // 检查当前应用信息是否存在
    if (store.app && store.app.id) {
      // 设置加载状态，防止重复操作
      loading.value = true
      // 调用回退API，将指定版本回退到草稿状态
      const resp = await AppsApi.fallbackHistoryToDraft(store.app.id, {
        app_config_version_id: id,
      })
      // 重新获取应用信息，确保数据同步
      await store.getApp(store.app.id)
      // 关闭历史版本抽屉
      visible.value = false
      // 显示操作成功的提示消息
      Message.success(resp.message)
    }
  } catch (error) {
    // 错误处理：捕获并处理可能出现的异常
  } finally {
    // 无论操作成功与否，都重置加载状态
    loading.value = false
  }
}

// 创建一个watch监听器，监听visible（抽屉显示状态）的变化
const stop = watch(visible, async (val) => {
  // 当抽屉打开时（visible为true），获取历史版本数据
  if (val) {
    fetchHistoryVersionData()
  }
})

// 在组件卸载时，调用stop函数取消watch监听，防止内存泄漏
onUnmounted(() => {
  stop()
})
</script>

<template>
  <a-drawer
    :width="380"
    v-model:visible="visible"
    :footer="false"
    unmountOnClose
    title="发布历史"
    :drawer-style="{ background: '#F9FAFB' }"
  >
    <a-spin :loading="loading" class="h-full w-full">
      <!-- 主体内容 -->
      <div class="flex h-full flex-col">
        <!--  Agent 应用图标、名称和描述信息 -->
        <div class="mt-1">
          <div class="flex items-center gap-3 mb-3">
            <a-image class="w-10 h-10 rounded-lg" fit="cover" :src="store.app?.icon" />
            <div class="flex flex-col">
              <div class="text-base text-gray-900 font-bold">
                {{ store.app?.name }}
              </div>
              <div class="text-xs text-gray-500 line-clamp-1">
                最近编辑 • {{ formatDate(store.app?.updated_at, 'YYYY-MM-DD HH:mm') }}
              </div>
            </div>
          </div>
          <div class="leading-[18px] text-gray-500">
            {{ store.app?.description }}
          </div>
        </div>
        <!-- 横线 -->
        <a-divider />
        <!-- Agent 历史版本列表 -->
        <div class="flex-1 flex flex-col">
          <!-- 统计信息 -->
          <div class="text-gray-500 text-xs mb-4">共计 {{ paginator.total_record }} 条发布记录</div>
          <!-- 发布版本列表 -->
          <div
            @scroll="handleScroll"
            class="overflow-y-scroll scrollbar-w-none h-[calc(100vh-226px)]"
          >
            <a-card
              v-for="(historyVersion, idx) in historyVersions"
              :key="historyVersion.id"
              class="cursor-pointer rounded-xl justify-between mb-4"
            >
              <div class="flex justify-between items-center">
                <!-- 左边版本信息内容 -->
                <div class="flex flex-col gap-2">
                  <!-- 版本信息 -->
                  <div class="flex items-center">
                    <div class="text-gray-900 font-bold text-base mr-3">版本</div>
                    <a-tag
                      size="small"
                      class="rounded-md bg-gray-50 border-1 border-gray-200 text-gray-400"
                    >
                      <template #icon>
                        <img src="@/assets/images/icon-hash.png" class="w-3 h-3" />
                      </template>
                      {{ padWithZeros(historyVersion.version) }}
                    </a-tag>
                    <a-tag
                      v-if="idx == 0"
                      size="small"
                      class="rounded-md ml-2 bg-gray-50 border-1 border-gray-200 text-gray-400"
                    >
                      当前版本
                    </a-tag>
                  </div>
                  <!-- 时间信息 -->
                  <div class="text-gray-400 text-xs">
                    发布时间: {{ formatDate(historyVersion.created_at, 'YYYY-MM-DD HH:mm') }}
                  </div>
                </div>
                <!-- 右边回退按钮 -->
                <a-button size="small" @click="handleFallbackHistoryVersion(historyVersion.id)"
                  >回退</a-button
                >
              </div>
            </a-card>
            <!-- 加载和 loading -->
            <LoadingStatus
              :loading="loading"
              :paginator="paginator"
              :has-data="historyVersions.length > 0"
              :show-load-more-btn="false"
            />
          </div>
        </div>
      </div>
    </a-spin>
  </a-drawer>
</template>

<style scoped></style>
