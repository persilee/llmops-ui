<script setup lang="ts">
import type { Dataset } from '@/services/api/apps/types'
import DatasetApi from '@/services/api/dataset'
import DocumentsApi from '@/services/api/dataset/documents'
import type { GetDocumentsWithPage } from '@/services/api/dataset/documents/type'
import type { GetDatasetsWithPage } from '@/services/api/dataset/types'
import type { Paginator } from '@/services/types'
import { formatDate } from '@/utils/format-util'
import { formatNumberWithChineseUnit, getFileIcon } from '@/utils/util'
import LoadingStatus from '@/views/components/LoadingStatus.vue'
import { Message } from '@arco-design/web-vue'
import * as _ from 'lodash-es'
import { computed, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useAppStore } from '../../AppView.store'

// 获取应用状态管理store实例
const store = useAppStore()
// 控制抽屉组件的显示/隐藏状态
const visible = defineModel('visible', { type: Boolean, default: false })
// 控制保存按钮的加载状态
const loading = ref(false)
// 控制加载更多数据的加载状态
const loadMorLoading = ref(false)
// 文档加载状态
const loadingDocument = ref(false)
// 存储知识库列表数据
const datasets = ref<GetDatasetsWithPage[]>([])
// 存储草稿状态下的已选知识库列表
const draftDatasets = ref<Dataset[]>([])
// 存储文档列表数据
const documents = ref<GetDocumentsWithPage[]>([])
// 分页信息对象
const paginator = ref<Paginator>({
  current_page: 1, // 当前页码
  page_size: 20, // 每页显示数量
  total_page: 0, // 总页数
  total_record: 0, // 总记录数
})
// 文档分页信息对象
const documentPaginator = ref<Paginator>({
  current_page: 1, // 当前页码
  page_size: 20, // 每页显示数量
  total_page: 0, // 总页数
  total_record: 0, // 总记录数
})

/**
 * 关闭抽屉组件的处理函数
 * 将visible的值设置为false，从而关闭抽屉
 */
const handleClose = () => {
  visible.value = false
}

/**
 * 获取知识库数据
 * @param {boolean} [isLoadMore=false] - 是否为加载更多操作，默认为false
 * @returns {Promise<void>} 无返回值的Promise
 *
 * 功能说明：
 * 1. 支持分页加载和加载更多两种模式
 * 2. 在加载更多模式下，检查是否还有下一页数据
 * 3. 在重新加载模式下，重置页码并清空现有数据
 * 4. 调用API获取数据并更新知识库列表
 * 5. 处理加载状态和错误情况
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
    datasets.value = []
  }

  try {
    // 设置加载状态，显示加载动画
    loadMorLoading.value = true

    // 调用API获取工具数据
    const resp = await DatasetApi.getDatasetsWithPage({
      current_page: paginator.value.current_page,
      page_size: paginator.value.page_size,
    })
    // 将新数据追加到现有列表中
    datasets.value.push(...resp.data.list)
    // 更新分页信息
    paginator.value = resp.data.paginator
  } catch (err) {
    // 错误处理：显示错误消息
    const errorMessage = err instanceof Error ? err.message : '数据加载失败'
    Message.error(errorMessage)
  } finally {
    // 无论成功失败，都关闭加载状态
    loadMorLoading.value = false
  }
}

/**
 * 获取指定知识库的文档列表
 * @param {boolean} visible - 控制是否执行请求，当popover可见时才执行
 * @param {GetDatasetsWithPage} dataset - 要获取文档的知识库对象
 * @param {boolean} [isLoadMore=false] - 是否为加载更多操作，默认为false
 * @returns {Promise<void>} 无返回值的Promise
 *
 * 功能说明：
 * 1. 支持分页加载和加载更多两种模式
 * 2. 在加载更多模式下，检查是否还有下一页数据
 * 3. 在重新加载模式下，重置页码并清空现有数据
 * 4. 调用API获取文档数据并更新文档列表
 * 5. 处理加载状态和错误情况
 */
const getDocuments = async (
  visible: boolean,
  dataset: GetDatasetsWithPage,
  isLoadMore: boolean = false,
) => {
  // 如果popover不可见，直接返回，不执行请求
  if (!visible) return

  // 处理分页逻辑
  if (isLoadMore) {
    // 如果是加载更多，检查是否还有下一页
    if (documentPaginator.value.current_page >= documentPaginator.value.total_page) return
    // 页码递增
    documentPaginator.value.current_page++
  } else {
    // 如果是重新加载，重置页码并清空现有数据
    documentPaginator.value.current_page = 1
    documents.value = []
  }

  try {
    // 开启加载状态，显示加载动画
    loadingDocument.value = true

    // 调用API获取文档数据
    const resp = await DocumentsApi.getDocumentsWithPage(dataset.id, {
      current_page: documentPaginator.value.current_page, // 当前页码
      page_size: documentPaginator.value.page_size, // 每页条数
    })

    // 将新数据追加到现有列表中
    documents.value.push(...resp.data.list)
    // 更新分页信息
    documentPaginator.value = resp.data.paginator
  } catch (error) {
    // 错误处理：如果获取文档失败，catch块会捕获错误
  } finally {
    // 无论成功失败，都关闭加载状态
    loadingDocument.value = false
  }
}

/**
 * 处理文档列表的滚动事件，实现无限滚动加载功能
 * @param {Event} e - 滚动事件对象，包含滚动相关的信息
 * @param {GetDatasetsWithPage} dataset - 当前知识库对象，用于加载对应的文档列表
 *
 * 功能说明：
 * 1. 监听文档列表的滚动事件
 * 2. 当滚动到距离底部16px时触发加载更多
 * 3. 检查加载状态，避免重复请求
 * 4. 调用getDocuments方法加载更多文档数据
 *
 * 滚动计算说明：
 * - target.scrollTop: 当前滚动位置
 * - target.clientHeight: 可见区域高度
 * - target.scrollHeight: 总内容高度
 * - 当 scrollTop + clientHeight >= scrollHeight - 16 时触发加载
 */
const handleDocumentScroll = (e: Event, dataset: GetDatasetsWithPage) => {
  // 将事件目标转换为HTMLElement类型，以便访问其滚动相关属性
  const target = e.target as HTMLElement

  // 检查是否滚动到接近底部（距离底部16px时触发）
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 16) {
    // 如果正在加载中，则不重复触发加载
    if (loadMorLoading.value) return

    // 触发加载更多数据
    getDocuments(true, dataset, true)
  }
}

/**
 * 处理滚动事件，实现无限滚动加载功能
 * @param {Event} e - 滚动事件对象
 */
const handleScroll = (e: Event) => {
  // 将事件目标转换为HTMLElement类型，以便访问其滚动相关属性
  const target = e.target as HTMLElement

  // 检查是否滚动到接近底部（距离底部16px时触发）
  // target.scrollTop: 当前滚动位置
  // target.clientHeight: 可见区域高度
  // target.scrollHeight: 总内容高度
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 16) {
    // 如果正在加载中，则不重复触发加载
    if (loadMorLoading.value) return

    // 触发加载更多数据
    fetchData(true)
  }
}

// 获取滚动容器的模板引用
const scrollContainerRef = useTemplateRef('scrollContainer')

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

/**
 * 检查知识库是否已经被添加到草稿列表中
 * @param {GetDatasetsWithPage} dataset - 需要检查的知识库对象
 * @returns {boolean} 如果知识库已在草稿列表中返回true，否则返回false
 */
const isAdded = (dataset: GetDatasetsWithPage) => {
  return draftDatasets.value.some((draftDataset: Dataset) => draftDataset.id == dataset.id)
}

/**
 * 处理知识库的点击事件
 * @param {GetDatasetsWithPage} dataset - 被点击的知识库对象
 */
const handleClick = (dataset: GetDatasetsWithPage) => {
  // 检查知识库是否已经被添加到草稿列表中
  if (isAdded(dataset)) {
    // 如果已添加，则从草稿列表中移除该知识库
    _.remove(draftDatasets.value, (draftDataset: Dataset) => draftDataset.id == dataset.id)
  } else {
    // 如果未添加，则将知识库添加到草稿列表中
    draftDatasets.value.push({
      description: dataset.description, // 知识库描述
      icon: dataset.icon, // 知识库图标
      id: dataset.id, // 知识库ID
      name: dataset.name, // 知识库名称
    })
  }
}

/**
 * 保存知识库配置
 * 将用户选择的知识库配置保存到应用中
 */
const handleSave = async () => {
  try {
    // 开启加载状态，显示加载动画
    loading.value = true

    // 提取所有已选择知识库的ID
    const datasetsReq = draftDatasets.value.map((dataset) => dataset.id)
    // 调用store方法更新应用配置
    await store.updateDraftAppConfig({ datasets: datasetsReq })

    // 关闭抽屉
    handleClose()
    // 显示成功提示
    Message.success('更新知识库成功')
  } catch (error) {
    // 错误处理：如果保存失败，catch块会捕获错误
  } finally {
    // 无论成功失败，都关闭加载状态
    loading.value = false
  }
}

/**
 * 监听抽屉显示状态的变化
 * 当抽屉打开时，初始化知识库列表和草稿数据
 */
const stop = watch(visible, async (val) => {
  if (val) {
    // 获取知识库列表数据
    await fetchData()
    // 从store中获取当前应用的草稿配置，深拷贝知识库列表到draftDatasets
    draftDatasets.value = _.cloneDeep(store.draftAppConfig.datasets)
  }
})

/**
 * 组件卸载时的生命周期钩子
 * 用于清理组件中的副作用，防止内存泄漏
 */
onUnmounted(() => {
  // 停止watch监听器，移除对visible状态的监听
  // 这是很重要的清理步骤，可以防止：
  // 1. 组件卸载后继续执行不必要的监听
  // 2. 内存泄漏
  // 3. 潜在的bug和性能问题
  stop()
})
</script>

<template>
  <a-drawer
    :width="460"
    v-model:visible="visible"
    :mask-closable="false"
    :header="false"
    :footer="false"
    :drawer-style="{ backgroundColor: 'transparent' }"
    body-class="rounded-lg m-4 p-0"
  >
    <a-spin :loading="loading" class="w-full h-full">
      <div class="flex bg-white w-full h-full relative">
        <!-- 关闭按钮 -->
        <div class="absolute top-4 right-3">
          <a-button type="text" size="mini" @click="handleClose" class="rounded-full">
            <template #icon><icon-close class="text-gray-500" /></template>
          </a-button>
        </div>
        <div class="flex-1 flex flex-col p-4 w-full h-full">
          <!-- 标题 -->
          <div class="text-lg font-bold text-gray-900 mb-4">选择引用知识库</div>
          <!-- 内容 -->
          <div
            ref="scrollContainer"
            class="flex flex-1 flex-col gap-1.5 overflow-y-scroll scrollbar-w-none"
            @scroll="handleScroll"
          >
            <div
              v-for="dataset in datasets"
              :key="dataset.id"
              :class="`${isAdded(dataset) ? 'bg-blue-50 border border-blue-600' : 'border border-gray-100'} flex items-center gap-2  p-2 rounded-lg cursor-pointer hover:bg-blue-50`"
              @click="handleClick(dataset)"
            >
              <img :src="dataset.icon" class="w-10 h-10 rounded-lg bg-white flex-shrink-0" />
              <div class="flex-1 flex flex-col min-w-0">
                <div class="text-gray-600 font-bold">{{ dataset.name }}</div>
                <div class="text-gray-600 text-xs mt-0.5 line-clamp-1 overflow-ellipsis">
                  {{ dataset.description }}
                </div>
                <div class="flex gap-2 mt-1.5">
                  <a-popover
                    @popup-visible-change="(visible: boolean) => getDocuments(visible, dataset)"
                  >
                    <template #content>
                      <a-spin :loading="loadingDocument" class="">
                        <div class="flex flex-col gap-2.5">
                          <div class="text-gray-900 font-bold">{{ dataset.name }}</div>
                          <div
                            class="flex-1 flex flex-col max-h-[260px] overflow-y-scroll scrollbar-w-none gap-2"
                            @scroll="handleDocumentScroll($event, dataset)"
                          >
                            <div
                              v-for="document in documents"
                              :key="document.id"
                              class="flex items-center gap-1.5"
                            >
                              <img
                                :src="getFileIcon({ filename: document.name })"
                                class="w-4 h-auto"
                              />
                              <div class="text-gray-700 font-medium">{{ document.name }}</div>
                            </div>
                          </div>
                        </div>
                      </a-spin>
                    </template>
                    <a-tag
                      v-if="dataset.document_count > 0"
                      size="small"
                      class="text-[10px] text-gray-500 rounded-md py-0.5 px-1.5"
                    >
                      {{ dataset.document_count }} 个文档
                    </a-tag>
                  </a-popover>
                  <a-tag
                    v-if="dataset.character_count > 0"
                    size="small"
                    class="text-[10px] text-gray-500 rounded-md py-0.5 px-1.5"
                    >{{ formatNumberWithChineseUnit(dataset.character_count) }}个字符</a-tag
                  >
                  <div class="text-xs text-gray-400">
                    创建时间 {{ formatDate(dataset.created_at, 'YYYY-MM-DD HH:mm') }}
                  </div>
                </div>
              </div>
            </div>
            <!-- 加载和 loading -->
            <LoadingStatus
              :loading="loadMorLoading"
              :paginator="paginator"
              :has-data="datasets.length > 0"
              :show-load-more-btn="showLoadMoreBtn"
              @load-more="fetchData(true)"
            />
          </div>
          <!-- 底部按钮 -->
          <div class="flex items-center justify-between mt-4">
            <div class="text-gray-800 font-bold text-[15px]">
              {{ draftDatasets.length }} 个知识库被选中
            </div>
            <div>
              <a-button
                type="outline"
                class="border-gray-300 text-gray-500 mr-3"
                @click="handleClose"
                >取消</a-button
              >
              <a-button :loading="loading" type="primary" @click="handleSave">保存</a-button>
            </div>
          </div>
        </div>
      </div>
    </a-spin>
  </a-drawer>
</template>

<style scoped></style>
