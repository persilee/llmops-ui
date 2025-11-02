<script setup lang="ts">
import APIToolsApi from '@/services/api/api-tool'
import type { GetAPIToolProvidersWithPage } from '@/services/api/api-tool/types'
import type { Paginator } from '@/services/types'
import PageCard from '@/views/components/PageCard.vue'

import LoadingStatus from './components/LoadingStatus.vue'

import ToolDetailDrawer from '@/views/components/ToolDetailDrawer.vue'
import { Message } from '@arco-design/web-vue'
import { debounce } from 'lodash-es'
import { computed, onMounted, onUnmounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { useToolProviderStore } from '../SpaceView.store'

const providers = ref<GetAPIToolProvidersWithPage[]>([])
const paginator = ref<Paginator>({
  current_page: 1,
  page_size: 20,
  total_page: 0,
  total_record: 0,
})
const showIndex = ref<number>(-1)
const isShowToolDetail = ref<boolean>(false)
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const store = useToolProviderStore()

const scrollContainerRef = useTemplateRef('scrollContainer')

// 计算属性：获取当前选中的工具提供者
const selectedProvider = computed(() => {
  return providers.value[showIndex.value]
})

// 获取工具列表数据
const fetchData = async (init?: boolean) => {
  if (!init && paginator.value.current_page >= paginator.value.total_page) return

  if (init) {
    paginator.value.current_page = 1
    providers.value = []
  } else {
    paginator.value.current_page++
  }

  loading.value = true
  error.value = null

  try {
    const resp = await APIToolsApi.getAPIToolProvidersWithPage({
      current_page: paginator.value.current_page,
      page_size: paginator.value.page_size,
      search_word: store.searchWord,
    })
    // 更新数据列表
    if (init) {
      providers.value = resp.data.list
      // 更新分页信息
      paginator.value = resp.data.paginator
    } else {
      providers.value.push(...resp.data.list)
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '数据加载失败'
    Message.error(errorMessage)
    error.value = errorMessage
    console.error('获取工具列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 创建防抖函数，延迟300ms执行数据获取，避免频繁请求
const debouncedFetchData = debounce(fetchData, 300)

// 监听搜索词变化，当搜索词改变时触发数据重新加载
const stop = watch(
  () => store.searchWord,
  (newVal) => {
    if (newVal) {
      debouncedFetchData(true) // 使用防抖函数重新获取数据，传入true表示初始化加载
    } else {
      fetchData(true) // 直接获取数据，传入true表示初始化加载
    }
  },
)

const handleToolCardClick = (index: number) => {
  showIndex.value = index
  isShowToolDetail.value = true
}

const handleCloseDrawer = () => {
  isShowToolDetail.value = false
}

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 16) {
    if (loading.value) return

    fetchData(false)
  }
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

const addHeader = () => {}
const deleteHeader = (record: any) => {}

const toolColumns = [
  {
    title: '名称',
    dataIndex: 'name',
  },
  {
    title: '描述',
    dataIndex: 'description',
    width: 220,
    minWidth: 150,
  },
  {
    title: '方法',
    dataIndex: 'method',
  },
  {
    title: '路径',
    dataIndex: 'path',
  },
]

const toolData = reactive([
  {
    name: 'Jane Doe',
    description: '32 Park Road, London',
    method: 'get',
    path: 'http://example.com/api',
  },
])
const headersColumns = [
  {
    title: 'Key',
    dataIndex: 'key',
    slotName: 'key',
    width: 200,
  },
  {
    title: 'Value',
    dataIndex: 'value',
    slotName: 'value',
    width: 320,
  },
  {
    title: '操作',
    slotName: 'action',
  },
]
const headersData = reactive([
  {
    key: '',
    value: '',
  },
])
onMounted(() => {
  fetchData(true)
})

onUnmounted(() => {
  stop()
  store.$reset()
})
</script>

<template>
  <div ref="scrollContainer" @scroll="handleScroll">
    <a-spin :loading="loading" class="block h-full w-full overflow-scroll scrollbar-w-none">
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
      <!-- 加载和 loading -->
      <LoadingStatus
        :loading="loading"
        :paginator="paginator"
        :has-data="providers.length > 0"
        :show-load-more-btn="showLoadMoreBtn"
        @load-more="fetchData(false)"
      />
      <ToolDetailDrawer
        v-model:visible="isShowToolDetail"
        :provider="selectedProvider"
        @update:visible="handleCloseDrawer"
      />
      <a-modal :visible="false" :width="660" hide-title :footer="false" modal-class="rounded-xl">
        <!-- 标题 -->
        <div class="flex items-center justify-between">
          <div class="text-lg font-bold text-gray-700">新建插件</div>
          <a-button type="text" class="text-gray-700" size="small">
            <template #icon><icon-close /></template>
          </a-button>
        </div>
        <!-- 表单 -->
        <div class="pt-6">
          <a-form layout="vertical">
            <a-from-item
              field="icon"
              hide-label
              :rules="[{ required: true, message: '插件图标不能为空' }]"
            >
              <a-upload
                :limit="1"
                list-type="picture-card"
                accept="image/png, image/jpeg"
                class="justify-center"
              ></a-upload>
            </a-from-item>
            <a-form-item
              class="text-black"
              field="name"
              label="插件名称"
              asterisk-position="end"
              :rules="[{ required: true, message: '插件名称不能为空' }]"
            >
              <a-input
                class="rounded-xs"
                placeholder="请输入插件名称，请确保名称含义清晰"
                show-word-limit
                :max-length="60"
              />
            </a-form-item>
            <a-form-item
              field="openapi_schema"
              label="OpenAPI Schema"
              asterisk-position="end"
              :rules="[{ required: true, message: 'OpenAPI Schema不能为空' }]"
            >
              <a-textarea
                class="rounded-xs"
                :auto-size="{ minRows: 4, maxRows: 6 }"
                placeholder="请输入OpenAPI Schema"
              ></a-textarea>
            </a-form-item>
            <a-form-item label="可用工具">
              <a-table class="w-full" :columns="toolColumns" :data="toolData" :pagination="false">
                <template #th>
                  <th class="text-xs text-gray-600 bg-white"></th>
                </template>
                <template #td>
                  <td class="text-xs text-gray-500 bg-white"></td>
                </template>
              </a-table>
            </a-form-item>
            <a-form-item label="Headers">
              <a-table
                class="w-full"
                :columns="headersColumns"
                :data="headersData"
                :pagination="false"
              >
                <template #th>
                  <th class="text-xs text-gray-600 bg-white"></th>
                </template>
                <template #td>
                  <td class="text-xs text-gray-500 bg-white"></td>
                </template>
                <template #key="{}">
                  <a-form-item hide-label class="m-0">
                    <a-input placeholder="请输入键名" />
                  </a-form-item>
                </template>
                <template #value="{}">
                  <a-form-item hide-label class="m-0">
                    <a-input placeholder="请输入键值" />
                  </a-form-item>
                </template>
                <template #action="{ record }">
                  <a-button type="text" @click="deleteHeader(record)">
                    <icon-delete class="text-gray-500" />
                  </a-button>
                </template>
                <template #footer>
                  <a-button type="secondary" size="small" @click="addHeader" class="bg-gray-100">
                    <template #icon>
                      <icon-plus />
                    </template>
                    新增参数</a-button
                  >
                </template>
              </a-table>
            </a-form-item>
            <div class="flex justify-between">
              <a-button type="outline" status="danger" class="border-gray-300">删除</a-button>
              <div>
                <a-button type="outline" class="border-gray-300 text-gray-500 mr-3">取消</a-button>
                <a-button type="primary" class="">保存</a-button>
              </div>
            </div>
          </a-form>
        </div>
      </a-modal>
    </a-spin>
  </div>
</template>

<style scoped>
::v-deep .arco-form-item-label-col > .arco-form-item-label {
  color: black;
}
</style>
