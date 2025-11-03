<script setup lang="ts">
import APIToolsApi from '@/services/api/api-tool'
import type {
  CreateAPIToolProviderReq,
  GetAPIToolProvidersWithPage,
  Header,
} from '@/services/api/api-tool/types'
import type { Paginator } from '@/services/types'
import PageCard from '@/views/components/PageCard.vue'

import LoadingStatus from './components/LoadingStatus.vue'

import ToolDetailDrawer from '@/views/components/ToolDetailDrawer.vue'
import { Message, Modal } from '@arco-design/web-vue'
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
const validateSchemaLoading = ref<boolean>(false)
const updateToolProviderLoading = ref<boolean>(false)
const submitToolProviderLoading = ref<boolean>(false)
const error = ref<string | null>(null)
const store = useToolProviderStore()

const formRef = useTemplateRef('formRef')
const formData = reactive<CreateAPIToolProviderReq>({
  icon: 'https://iknow-pic.cdn.bcebos.com/77c6a7efce1b9d1618b138ffe1deb48f8c54643e?for=bg',
  name: '',
  openapi_schema: '',
  headers: [],
})
const toolData = ref<any>()
const initialToolProvider = reactive<CreateAPIToolProviderReq>({
  icon: '',
  name: '',
  openapi_schema: '',
  headers: [],
})

const headerKey = ref<string>('')

// 计算属性：解析 OpenAPI Schema 并提取可用工具列表
const getTools = () => {
  // 检查 openapi_schema 是否为空或只包含空白字符
  if (!formData.openapi_schema?.trim()) {
    return []
  }

  try {
    // 将 JSON 字符串解析为对象
    const openApiSchema = JSON.parse(formData.openapi_schema)

    // 验证 schema 基本结构：
    // 1. 必须是对象
    // 2. 必须包含 paths 属性
    if (!openApiSchema || typeof openApiSchema !== 'object' || !('paths' in openApiSchema)) {
      return []
    }

    // 遍历 paths 对象，提取每个路径下的可用工具
    const availableTools = Object.entries(openApiSchema.paths).flatMap(([path, methods]) => {
      // 检查 methods 是否为有效对象
      if (!methods || typeof methods !== 'object') return []

      // 遍历每个 HTTP 方法（GET、POST 等）
      return (
        Object.entries(methods)
          // 过滤出有效的工具定义：
          // 1. 必须是对象
          // 2. 必须包含 operationId（工具标识）
          // 3. 必须包含 description（工具描述）
          .filter(
            ([_, tool]) =>
              tool && typeof tool === 'object' && 'operationId' in tool && 'description' in tool,
          )
          // 将工具信息转换为统一格式
          .map(([method, tool]) => ({
            name: tool.operationId, // 工具名称
            description: tool.description, // 工具描述
            path, // API 路径
            method, // HTTP 方法
          }))
      )
    })

    return availableTools
  } catch (error) {
    // 捕获 JSON 解析错误并打印错误信息
    console.error('解析 OpenAPI Schema 失败:', error)
    return []
  }
}

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

/**
 * 处理OpenAPI Schema输入框失焦事件
 * 使用防抖函数延迟500ms执行，避免频繁验证
 *
 * 功能：
 * 1. 检查输入的schema是否为空
 * 2. 调用API验证schema的有效性
 * 3. 显示验证结果消息
 * 4. 管理加载状态
 */
const validateSchemaHelpText = ref('')
const validateSchemaStatus = ref('')
const handleSchemaBlur = debounce(async () => {
  // 如果数据没有变化，则直接返回
  if (store.isOpenEditToolModal && initialToolProvider.openapi_schema == formData.openapi_schema)
    return

  if (formData.openapi_schema)
    if (formData.openapi_schema.trim()) {
      // 检查schema是否为空或只包含空白字符
      try {
        // 设置加载状态
        validateSchemaLoading.value = true
        // 调用API验证schema
        await APIToolsApi.validateOpenAPISchema(formData.openapi_schema)
        toolData.value = getTools()
        // 验证成功，显示成功消息
        validateSchemaStatus.value = 'success'
        validateSchemaHelpText.value = 'OpenAPI Schema 验证通过'
      } catch (err) {
        // 处理验证失败的情况
        toolData.value = []
        const errorMessage = err instanceof Error ? err.message : 'Schema验证失败'
        validateSchemaStatus.value = 'error'
        validateSchemaHelpText.value = errorMessage
      } finally {
        // 无论成功失败，都重置加载状态
        validateSchemaLoading.value = false
      }
    }
}, 500)

const resetForm = () => {
  // 重置表单数据
  Object.assign(formData, {
    icon: '',
    name: '',
    openapi_schema: '',
    headers: [],
  })

  // 重置工具数据
  toolData.value = []

  // 重置验证状态
  resetValidationState()

  // 重置加载状态
  submitToolProviderLoading.value = false
  updateToolProviderLoading.value = false

  // 重置表单字段
  formRef.value?.resetFields()
}

const addHeader = () => {
  formData.headers.push({ name: '', value: '' })
}
const deleteHeader = (record: Header, rowIndex: number) => {
  formData.headers.splice(rowIndex, 1)
}

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

const headersColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    slotName: 'name',
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

/**
 * 处理表单提交的异步函数
 * @param param0 包含表单值和错误信息的对象
 * @param param0.values 表单提交的值，符合CreateAPIToolProviderReq类型
 * @param param0.errors 表单验证错误信息
 */
const handleSubmit = async ({
  values,
  errors,
}: {
  values: CreateAPIToolProviderReq
  errors: any
}) => {
  // 如果存在验证错误，直接返回
  if (errors) return

  // 处理更新工具提供者的异步函数
  const handleUpdate = async (providerId: string) => {
    const resp = await APIToolsApi.updateAPIToolProvider(providerId, values)
    return resp.message
  }

  // 处理创建新工具提供者的异步函数
  const handleCreate = async () => {
    const resp = await APIToolsApi.createAPIToolProvider(values)
    return resp.message
  }

  try {
    // 设置提交加载状态
    submitToolProviderLoading.value = true
    let message: string

    // 根据是否是编辑模式执行不同的操作
    if (store.isOpenEditToolModal) {
      // 编辑模式：获取当前选中的工具提供者ID
      const providerId = providers.value[showIndex.value]?.id
      if (!providerId) {
        throw new Error('未找到工具提供者ID')
      }
      // 执行更新操作
      message = await handleUpdate(providerId)
    } else {
      // 创建模式：执行创建操作
      message = await handleCreate()
    }

    // 显示成功消息
    Message.success(message)
    // 关闭模态框
    handleCloseModal()
    // 关闭详情抽屉
    handleCloseDrawer()
    // 刷新数据列表
    fetchData(true)
  } finally {
    // 无论成功失败，都重置加载状态
    submitToolProviderLoading.value = false
  }
}

/**
 * 处理工具删除的异步函数
 * 功能：
 * 1. 显示删除确认模态框
 * 2. 获取当前选中的工具提供者ID
 * 3. 执行删除操作
 * 4. 处理删除结果和错误情况
 */
const handleDeleteTool = async () => {
  // 显示警告模态框，要求用户确认删除操作
  Modal.warning({
    title: '删除确认?', // 模态框标题
    content: '确定要删除该工具吗?', // 提示内容
    hideCancel: false, // 显示取消按钮
    // 确认按钮的回调函数
    onOk: async () => {
      // 获取当前选中的工具提供者ID
      const providerId = providers.value[showIndex.value]?.id
      // 如果找不到工具ID，显示错误信息并返回
      if (!providerId) {
        Message.error('未找到要删除的工具')
        return
      }

      try {
        // 调用API删除工具提供者
        const resp = await APIToolsApi.deleteAPIToolProvider(providerId)
        // 显示删除成功的消息
        Message.success(resp.message)
        // 关闭模态框
        handleCloseModal()
        // 关闭详情抽屉
        handleCloseDrawer()
        // 刷新数据列表
        fetchData(true)
      } catch (err) {
        // 处理删除失败的情况
        const errorMessage = err instanceof Error ? err.message : '删除失败'
        // 在控制台输出错误信息
        console.error(errorMessage)
      }
    },
  })
}

/**
 * 处理模态框关闭的函数
 * 功能：
 * 1. 重置表单数据到初始状态
 * 2. 关闭创建工具的模态框
 *
 * 调用时机：
 * - 用户点击关闭按钮
 * - 表单提交成功后
 * - 删除操作完成后
 */
const handleCloseModal = () => {
  resetForm() // 重置表单数据，清空所有输入和验证状态
  store.closeCreateToolModal() // 关闭创建工具的模态框
}

const updateFormData = (data: {
  icon: string
  name: string
  openapi_schema: string
  headers: Header[]
}) => {
  // 使用解构赋值更新表单数据
  Object.assign(formData, data)
  // 更新初始工具提供者数据
  Object.assign(initialToolProvider, formData)
}

const resetValidationState = () => {
  // 重置验证状态
  validateSchemaStatus.value = ''
  validateSchemaHelpText.value = ''
}

/**
 * 处理工具提供者更新的异步函数
 *
 * 功能：
 * 1. 验证工具提供者ID的有效性
 * 2. 获取工具提供者详细信息
 * 3. 验证必要字段（icon、name、openapi_schema）的完整性
 * 4. 更新表单数据和验证状态
 * 5. 提取并更新工具数据
 * 6. 处理错误情况并显示相应提示
 * 7. 管理加载状态和模态框显示
 *
 * @param provider - 工具提供者对象，包含id等信息
 * @throws {Error} 当工具提供者ID无效时抛出错误
 * @throws {Error} 当工具提供者数据不完整时抛出错误
 * @throws {Error} 当获取工具提供者信息失败时抛出错误
 */
const handleUpdateToolProvider = async (provider: GetAPIToolProvidersWithPage) => {
  if (!provider?.id) {
    Message.error('无效的工具提供者ID')
    return
  }

  updateToolProviderLoading.value = true
  try {
    const resp = await APIToolsApi.getAPIToolProvider(provider.id)
    const { icon, name, openapi_schema, headers } = resp.data

    // 验证必要字段是否存在
    if (!icon || !name || !openapi_schema) {
      throw new Error('工具提供者数据不完整')
    }

    // 更新表单数据
    updateFormData({ icon, name, openapi_schema, headers })

    // 重置验证状态
    resetValidationState()

    // 更新工具数据
    toolData.value = getTools()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '获取工具提供者信息失败'
    Message.error(errorMessage)
    console.error('获取工具提供者信息失败:', err)
  } finally {
    updateToolProviderLoading.value = false
    store.openCreateToolModal(true)
  }
}

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
        :loading="updateToolProviderLoading"
        @update:visible="handleCloseDrawer"
        @update-tool-provider="handleUpdateToolProvider"
      />
      <a-modal
        :visible="store.isOpenCreateToolModal"
        :width="680"
        hide-title
        :footer="false"
        modal-class="rounded-xl"
        @close="handleCloseModal"
      >
        <!-- 标题 -->
        <div class="flex items-center justify-between">
          <div class="text-lg font-bold text-gray-700">
            {{ store.isOpenEditToolModal ? '编辑插件' : '新建插件' }}
          </div>
          <a-button
            type="text"
            class="text-gray-700"
            size="small"
            @click="store.closeCreateToolModal()"
          >
            <template #icon><icon-close /></template>
          </a-button>
        </div>
        <!-- 表单 -->
        <div class="pt-6">
          <a-form ref="formRef" :model="formData" @submit="handleSubmit" layout="vertical">
            <a-spin :loading="submitToolProviderLoading">
              <!-- 插件图标 -->
              <a-form-item
                field="icon"
                hide-label
                :rules="[{ required: true, message: '插件图标不能为空' }]"
              >
                <a-upload
                  v-model="formData.icon"
                  :limit="1"
                  list-type="picture-card"
                  accept="image/png, image/jpeg"
                  class="justify-center"
                ></a-upload>
              </a-form-item>
              <!-- 插件名称 -->
              <a-form-item
                class="text-black"
                field="name"
                label="插件名称"
                asterisk-position="end"
                :rules="[{ required: true, message: '插件名称不能为空' }]"
              >
                <a-input
                  v-model="formData.name"
                  class="rounded-xs"
                  placeholder="请输入插件名称，请确保名称含义清晰"
                  show-word-limit
                  :max-length="60"
                />
              </a-form-item>
              <!-- 插件的 schema 参数 -->
              <a-form-item
                field="openapi_schema"
                label="OpenAPI Schema"
                asterisk-position="end"
                :rules="[{ required: true, message: 'OpenAPI Schema不能为空' }]"
                :help="validateSchemaHelpText"
                extra="请填写有效的 OpenAPI Schema，自动验证 OpenAPI Schema 通过后，会提取到可用工具列表中。"
                :validate-status="validateSchemaStatus"
                feedback
              >
                <a-spin :loading="validateSchemaLoading" class="block w-full">
                  <a-textarea
                    v-model="formData.openapi_schema"
                    class="rounded-xs"
                    :auto-size="{ minRows: 4, maxRows: 6 }"
                    placeholder="请输入OpenAPI Schema"
                    @blur="handleSchemaBlur"
                  ></a-textarea>
                </a-spin>
              </a-form-item>
              <!-- 从schema中提取的可用工具 -->
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
              <!-- Headers -->
              <a-form-item label="Headers">
                <a-table
                  class="w-full"
                  :columns="headersColumns"
                  :data="formData.headers"
                  :pagination="false"
                >
                  <template #th>
                    <th class="text-xs text-gray-600 bg-white"></th>
                  </template>
                  <template #td>
                    <td class="text-xs text-gray-500 bg-white"></td>
                  </template>
                  <template #name="{ rowIndex }">
                    <a-form-item hide-label class="m-0">
                      <a-input v-model="formData.headers[rowIndex].name" placeholder="请输入键名" />
                    </a-form-item>
                  </template>
                  <template #value="{ rowIndex }">
                    <a-form-item hide-label class="m-0">
                      <a-input
                        v-model="formData.headers[rowIndex].value"
                        placeholder="请输入键值"
                      />
                    </a-form-item>
                  </template>
                  <template #action="{ record, rowIndex }">
                    <a-button type="text" @click="deleteHeader(record, rowIndex)">
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
            </a-spin>
            <!-- 底部按钮 -->
            <div class="flex justify-between">
              <div class="">
                <a-button
                  v-if="store.isOpenEditToolModal"
                  type="outline"
                  status="danger"
                  class="border-gray-300"
                  @click="handleDeleteTool"
                  >删除</a-button
                >
              </div>
              <div class="">
                <a-button
                  type="outline"
                  class="border-gray-300 text-gray-500 mr-3"
                  @click="handleCloseModal"
                  >取消</a-button
                >
                <a-button type="primary" class="" html-type="submit">保存</a-button>
              </div>
            </div>
          </a-form>
        </div>
      </a-modal>
    </a-spin>
  </div>
</template>

<style scoped>
:deep .arco-form-item-label-col > .arco-form-item-label {
  color: black;
}
</style>
