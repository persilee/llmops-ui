<script setup lang="ts">
import OpenapiApi from '@/services/api/openapi'
import type { GetAPIKeysWithPage, UpdateAPIKeyReq } from '@/services/api/openapi/types'
import { formatDate } from '@/utils/format-util'
import { Message, Modal } from '@arco-design/web-vue'
import { onMounted, reactive, ref } from 'vue'
import { useOpenapiStore } from '../Openapi.store'
import KeyModel from './components/KeyModel.vue'

// API密钥列表数据，用于存储从后端获取的密钥信息
const apiKeys = ref<GetAPIKeysWithPage[]>()
// 当前选中的API密钥，用于编辑操作
const selectedKey = ref<GetAPIKeysWithPage>()
// 加载状态标识，用于控制表格加载动画的显示
const loading = ref(false)
// OpenAPI状态管理store实例，用于管理模态框等全局状态
const store = useOpenapiStore()
// 分页配置对象
const pagination = reactive({
  total: 0, // 总数据条数
  current: 1, // 当前页码
  defaultCurrent: 1, // 默认页码
  pageSize: 20, // 每页显示条数
  defaultPageSize: 20, // 默认每页显示条数
  showTotal: true, // 是否显示总条数
})

/**
 * 获取API密钥列表数据
 * @description 异步获取分页的API密钥列表，并更新组件状态
 * @returns {Promise<void>} 无返回值
 */
const fetchData = async () => {
  try {
    // 开启加载状态，显示加载动画
    loading.value = true
    // 调用API获取分页数据
    const resp = await OpenapiApi.getApiKeysWithPage({
      current_page: pagination.current, // 当前页码
      page_size: pagination.pageSize, // 每页条数
    })

    // 更新密钥列表数据
    apiKeys.value = resp.data.list
    // 更新分页总条数
    pagination.total = resp.data.paginator.total_record
  } catch (error) {
    // 错误处理：捕获API调用过程中的异常
    console.error('获取API密钥列表失败:', error)
  } finally {
    // 无论成功失败，都关闭加载状态
    loading.value = false
  }
}

/**
 * 处理API密钥状态切换
 * @param v - 新的状态值，可以是字符串、数字或布尔值
 * @param ev - 事件对象，用于阻止事件冒泡
 * @param keyApi - 要更新的API密钥对象
 */
const handleChange = async (
  v: string | number | boolean,
  ev: Event,
  keyApi: GetAPIKeysWithPage,
) => {
  ev.stopPropagation()
  try {
    loading.value = true
    const resp = await OpenapiApi.updateApiKeyIsActive(keyApi.id, { is_active: v as boolean })
    Message.success(resp.message)
  } catch (error) {
  } finally {
    loading.value = false
  }
}

/**
 * 处理密钥操作选择（编辑或删除）
 * @param v - 操作类型，'edit'表示编辑，'delete'表示删除
 * @param ev - 事件对象，用于阻止事件冒泡
 * @param keyApi - 当前操作的API密钥对象
 */
const handleSelect = (v: string, ev: Event, keyApi: GetAPIKeysWithPage) => {
  // 阻止事件冒泡，防止触发父级元素的事件
  ev.stopPropagation()
  // 编辑操作：设置选中的密钥并打开编辑模态框
  if (v === 'edit') {
    selectedKey.value = keyApi
    store.visible = true
  }
  // 删除操作：显示确认对话框
  else if (v === 'delete') {
    Modal.info({
      title: '要删除秘钥吗？',
      content:
        '删除秘钥后，无法使用该秘钥访问 LLMOps 个人空间中的所有 Agent，并且无法恢复，如果临时关闭请使用禁用功能。',
      titleAlign: 'start', // 标题左对齐显示
      hideCancel: false, // 显示取消按钮，允许用户取消操作
      simple: false, // 使用完整模式显示对话框
      // 确认删除后的回调函数
      onOk: async () => {
        try {
          // 设置加载状态
          loading.value = true
          // 调用删除API
          const resp = await OpenapiApi.deleteApiKey(keyApi.id)
          // 刷新密钥列表
          await fetchData()
          // 显示成功消息
          Message.success(resp.message)
        } catch (error) {
        } finally {
          // 重置加载状态
          loading.value = false
        }
      },
    })
  }
}

/**
 * 处理API密钥的保存操作（新增或编辑）
 * @param keyData - 密钥数据对象，包含密钥相关信息
 * @param action - 操作类型，'edit'表示编辑现有密钥，'add'表示新增密钥
 */
const handleSaveKey = async (keyData: UpdateAPIKeyReq, action: string) => {
  try {
    loading.value = true
    // 编辑操作：更新现有密钥
    if (action === 'edit' && selectedKey.value) {
      const resp = await OpenapiApi.updateApiKey(selectedKey.value?.id, keyData)
      // 刷新密钥列表
      await fetchData()
      // 显示成功消息
      Message.success(resp.message)
    }
    // 新增操作：创建新密钥
    if (action === 'add') {
      const resp = await OpenapiApi.createApiKey(keyData)
      // 刷新密钥列表
      await fetchData()
      // 显示成功消息
      Message.success('新增密钥成功')
    }
    // 关闭模态框
    store.visible = false
  } catch (error) {
  } finally {
    loading.value = false
  }
}

/**
 * 处理分页变化
 * @param page - 新的页码
 */
const handlePageChange = (page: number) => {
  pagination.current = page
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="flex-1 mt-5">
    <a-table
      hoverable
      :data="apiKeys"
      :pagination="pagination"
      :bordered="{ wrapper: false }"
      @page-change="handlePageChange"
      :loading="loading"
      row-class="cursor-pointer"
    >
      <template #columns>
        <a-table-column
          title="密钥"
          data-index="api_key"
          header-cell-class="rounded-tl-lg bg-gray-200 text-gray-700"
          body-cell-class="bg-transparent"
        >
          <template #cell="{ record }">
            <div class="line-clamp-1">{{ record.api_key }}</div>
          </template>
        </a-table-column>
        <a-table-column
          title="状态"
          data-index="is_active"
          header-cell-class="bg-gray-200 text-gray-700"
          body-cell-class="bg-transparent"
          :width="100"
        >
          <template #cell="{ record }">
            <a-space>
              <a-badge v-if="record.is_active" status="success" text="可用" />
              <a-badge v-else status="normal" text="已禁用" />
            </a-space>
          </template>
        </a-table-column>
        <a-table-column
          title="创建时间"
          data-index="created_at"
          header-cell-class="bg-gray-200 text-gray-700"
          body-cell-class="bg-transparent"
          :width="190"
        >
          <template #cell="{ record }">
            {{ formatDate(record.created_at, 'YYYY-MM-DD HH:mm:ss') }}
          </template>
        </a-table-column>
        <a-table-column
          title="备注"
          data-index="remark"
          header-cell-class="bg-gray-200 text-gray-700"
          body-cell-class="bg-transparent"
        >
          <template #cell="{ record }">
            <div class="line-clamp-1">{{ record.remark }}</div>
          </template>
        </a-table-column>
        <a-table-column
          title="操作"
          data-index="operator"
          header-cell-class="rounded-tr-lg bg-gray-200 text-gray-700"
          body-cell-class="bg-transparent"
          :width="100"
        >
          <template #cell="{ record }">
            <a-space :size="0">
              <template #split>
                <a-divider direction="vertical" />
              </template>
              <a-switch
                v-model:model-value="record.is_active"
                size="small"
                type="round"
                @change="(v, ev) => handleChange(v, ev, record)"
              ></a-switch>
              <a-dropdown
                position="br"
                @select="(v: string, ev: Event) => handleSelect(v, ev, record)"
              >
                <a-button @click.stop type="text" size="mini" class="text-gray-700">
                  <template #icon><icon-more /></template>
                </a-button>
                <template #content>
                  <a-doption value="edit">编辑</a-doption>
                  <a-doption value="delete" class="text-red-700">删除</a-doption>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>
    <KeyModel
      v-model:visible="store.visible"
      :open-api-key="selectedKey"
      @handle-save-key="handleSaveKey"
    />
  </div>
</template>

<style scoped></style>
