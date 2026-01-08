<script setup lang="ts">
import UploadApi from '@/services/api/upload-file'
import WorkFlowApi from '@/services/api/workflow'
import type { CreateWorkflowReq, GetWorkflowsWithPage } from '@/services/api/workflow/types'
import {
  Message,
  type FileItem,
  type RequestOption,
  type ValidatedError,
} from '@arco-design/web-vue'
import { isEmpty, isEqual, omit, pick } from 'lodash-es'
import { onUnmounted, ref, watch } from 'vue'
import { useSpaceStore } from '../../SpaceView.store'

// 使用空间状态管理store
const store = useSpaceStore()
// 定义组件props，接收工作流数据
const props = defineProps<{
  workflow: GetWorkflowsWithPage | undefined
}>()
// 定义组件事件，用于通知父组件操作成功
const emits = defineEmits(['success'])
// 定义模态框显示状态的响应式变量
const visible = defineModel('visible', { type: Boolean, default: false })
// 定义加载状态的响应式变量，用于控制提交时的loading效果
const loading = ref(false)
// 定义表单数据的响应式变量，包含工作流的所有字段
const formData = ref<CreateWorkflowReq & { fileList: FileItem[] }>({
  fileList: <FileItem>[], // 文件列表，用于上传图标
  description: '', // 工作流描述
  icon: '', // 工作流图标URL
  name: '', // 工作流名称
  tool_call_name: '', // 工作流英文名称，用于大模型调用
})
/**
 * 处理模态框关闭事件
 * 1. 关闭模态框
 * 2. 重置store中的模态框状态
 * 3. 重置表单数据
 */
const handleCloseModal = () => {
  visible.value = false
  store.closeModal('workflow')
  resetForm()
}

/**
 * 处理工作流表单提交
 * @param {Object} params - 参数对象
 * @param {Record<string, any>} params.values - 表单提交的值
 * @param {Record<string, ValidatedError> | undefined} params.errors - 表单验证错误信息
 * @returns {Promise<void>} 无返回值的异步函数
 */
const handleSubmit = async ({
  values,
  errors,
}: {
  values: Record<string, any>
  errors: Record<string, ValidatedError> | undefined
}) => {
  // 如果存在验证错误，直接返回
  if (errors) return

  // 检查表单数据是否与原始数据相同
  if (
    isEqual(
      pick(props.workflow, ['name', 'icon', 'description']),
      omit(formData.value, ['fileList']),
    )
  ) {
    Message.warning('请修改数据后再提交')
    return
  }

  // 开始加载状态
  loading.value = true
  let message = '' // 用于存储操作结果消息
  try {
    // 编辑模式：更新现有工作流
    if (store.workflowModal.isEditMode) {
      if (props.workflow && props.workflow.id) {
        const resp = await WorkFlowApi.updateWorkflow(props.workflow.id, {
          icon: formData.value.icon,
          name: formData.value.name,
          description: formData.value.description,
          tool_call_name: formData.value.tool_call_name,
        })
        message = resp.message
      }
    }
    // 创建模式：创建新工作流
    else if (store.workflowModal.isCreateMode) {
      const resp = await WorkFlowApi.createWorkflow({
        icon: formData.value.icon,
        name: formData.value.name,
        description: formData.value.description,
        tool_call_name: formData.value.tool_call_name,
      })
      message = '创建智能体应用成功'
    }

    // 显示成功消息
    Message.success(message)
    // 关闭模态框
    handleCloseModal()
    // 触发成功事件，传递应用ID
    emits('success')
  } finally {
    // 无论成功失败，都关闭加载状态
    loading.value = false
  }
}

/**
 * 处理文件上传
 * @param {RequestOption} option - 上传选项对象
 * @param {FileItem} option.fileItem - 要上传的文件项
 * @param {Function} option.onSuccess - 上传成功回调函数
 * @param {Function} option.onError - 上传失败回调函数
 * @returns {Promise<void>} 无返回值的异步函数
 */
const handleUpload = async (option: RequestOption) => {
  try {
    // 从option中解构出文件项和回调函数
    const { fileItem, onSuccess, onError } = option
    // 调用上传API上传图片
    const resp = await UploadApi.uploadImage(fileItem.file)
    // 检查上传响应状态
    if (resp.code == 'success') {
      // 上传成功，保存图片URL到表单数据
      formData.value.icon = resp.data.url
      // 调用成功回调
      onSuccess(resp)
    } else {
      // 上传失败，调用失败回调并显示错误信息
      onError(resp)
      Message.error(resp.message)
    }
  } catch (error) {
    // 捕获上传过程中的异常，显示通用错误信息
    Message.error('上传失败')
  }
}

/**
 * 处理文件删除操作
 * @returns {boolean} 返回true表示允许删除操作
 */
const handleRemove = () => {
  formData.value.icon = '' // 清空表单中的图标URL
  return true // 允许删除操作
}

/**
 * 重置工作流表单数据
 * 将表单中的所有字段重置为初始空值状态
 * @returns {void} 无返回值
 */
const resetForm = () => {
  Object.assign(formData.value, {
    icon: '', // 重置应用图标URL为空
    name: '', // 重置应用名称为空
    description: '', // 重置应用描述为空
    tool_call_name: '', // 重置工具调用名称为空
  })
}

// 监听模态框的显示状态变化
const stop = watch(
  () => visible.value, // 监听visible的变化
  (newVal) => {
    // 当模态框打开时
    if (newVal) {
      // 如果是创建模式，重置表单数据
      if (store.workflowModal.isCreateMode) {
        resetForm()
      }
      // 如果是编辑模式，用现有应用数据填充表单
      if (store.workflowModal.isEditMode && !isEmpty(props.workflow)) {
        Object.assign(formData.value, {
          fileList: [{ uid: '1', url: props.workflow?.icon }],
          icon: props.workflow?.icon,
          name: props.workflow?.name,
          description: props.workflow?.description,
          tool_call_name: props.workflow.tool_call_name,
        })
      }
    }
  },
)

// 组件卸载时清理watch监听器，防止内存泄漏
onUnmounted(() => {
  stop()
})
</script>

<template>
  <a-modal
    :visible="visible"
    :width="520"
    :title="store.workflowModal.isEditMode ? '编辑工作流' : '创建工作流'"
    title-align="start"
    :footer="false"
    modal-class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <!-- 表单 -->
    <div class="pt-6">
      <a-form :model="formData" @submit="handleSubmit" layout="vertical">
        <a-spin :loading="loading">
          <!-- 工作流图标 -->
          <a-form-item
            field="fileList"
            hide-label
            :rules="[{ required: true, message: '应用图标不能为空' }]"
          >
            <a-upload
              v-model:file-list="formData.fileList"
              :limit="1"
              list-type="picture-card"
              accept="image/png, image/jpeg"
              class="justify-center"
              image-preview
              :custom-request="handleUpload"
              :on-before-remove="handleRemove"
            ></a-upload>
          </a-form-item>
          <!-- 工作流名称 -->
          <a-form-item
            class="text-black"
            field="name"
            label="工作流名称"
            asterisk-position="end"
            :rules="[{ required: true, message: '工作流不能为空' }]"
          >
            <a-input
              v-model="formData.name"
              class="rounded-xs"
              placeholder="请输入工作流名称"
              show-word-limit
              :max-length="40"
            />
          </a-form-item>
          <!-- 工作流英文名称 -->
          <a-form-item
            class="text-black"
            field="tool_call_name"
            label="工作流英文名称"
            asterisk-position="end"
            :rules="[{ required: true, message: '工作流英文不能为空' }]"
          >
            <a-input
              v-model="formData.tool_call_name"
              class="rounded-xs"
              placeholder="英文名称将用于被大模型识别及调用"
              show-word-limit
              :max-length="40"
            />
          </a-form-item>
          <!-- 工作流描述 -->
          <a-form-item field="description" label="工作流描述">
            <a-textarea
              v-model="formData.description"
              class="rounded-xs"
              :auto-size="{ minRows: 4, maxRows: 6 }"
              show-word-limit
              :max-length="800"
              asterisk-position="end"
              :rules="[{ required: true, message: '工作流描述不能为空' }]"
              placeholder="请输入工作流描述"
            ></a-textarea>
          </a-form-item>
        </a-spin>
        <!-- 底部按钮 -->
        <div class="flex justify-end">
          <a-button
            type="outline"
            class="border-gray-300 text-gray-500 mr-3"
            @click="handleCloseModal"
            >取消</a-button
          >
          <a-button type="primary" class="" html-type="submit">保存</a-button>
        </div>
      </a-form>
    </div>
  </a-modal>
</template>

<style scoped></style>
