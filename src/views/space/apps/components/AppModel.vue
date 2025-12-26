<script setup lang="ts">
import AppsApi from '@/services/api/apps'
import type { CreateAppReq, GetAppResp } from '@/services/api/apps/types'
import UploadApi from '@/services/api/upload-file'
import {
  Message,
  type FileItem,
  type RequestOption,
  type ValidatedError,
} from '@arco-design/web-vue'
import { isEmpty, isEqual, omit, pick } from 'lodash-es'
import { onUnmounted, ref, watch } from 'vue'
import { useSpaceStore } from '../../SpaceView.store'

/**
 * 组件属性定义
 * @property {GetAppResp|null} app - 可选的应用信息对象，用于编辑模式下填充表单数据
 */
const props = defineProps<{
  app?: GetAppResp | null
}>()

/**
 * 表单数据的响应式引用
 * @type {import('vue').Ref<CreateAppReq>}
 * @property {FileItem[]} fileList - 上传的文件列表
 * @property {string} description - 应用描述
 * @property {string} icon - 应用图标URL
 * @property {string} name - 应用名称
 */
const formData = ref<CreateAppReq>({
  fileList: <FileItem>[],
  description: '',
  icon: '',
  name: '',
})

/**
 * 加载状态的响应式引用
 * @type {import('vue').Ref<boolean>}
 * @description 用于控制表单提交时的加载状态
 */
const loading = ref(false)

/**
 * 模态框可见性的双向绑定
 * @type {import('vue').ModelRef<boolean>}
 * @description 控制模态框的显示和隐藏状态
 */
const visible = defineModel('visible', { type: Boolean, default: false })

/**
 * 组件事件发射器
 * @description 用于向父组件发送事件通知
 * @event {string} success - 操作成功时触发，可传递应用ID
 */
const emits = defineEmits(['success'])

/**
 * 空间状态管理器实例
 * @description 用于管理空间相关的状态，如创建/编辑模式的切换
 */
const store = useSpaceStore()

/**
 * 处理模态框关闭操作
 * @description
 * 1. 设置模态框可见状态为false，关闭模态框
 * 2. 调用resetForm()重置表单数据到初始状态
 * @returns {void} 无返回值
 */
const handleCloseModal = () => {
  visible.value = false
  store.closeModal('app')
  resetForm()
}

/**
 * 处理表单提交
 * @param {Object} params - 参数对象
 * @param {Record<string, any>} params.values - 表单数据
 * @param {Record<string, ValidatedError> | undefined} params.errors - 表单验证错误
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
    isEqual(pick(props.app, ['name', 'icon', 'description']), omit(formData.value, ['fileList']))
  ) {
    Message.warning('请修改数据后再提交')
    return
  }

  // 开始加载状态
  loading.value = true
  let message = '' // 用于存储操作结果消息
  let appId = '' // 用于存储新创建的应用ID
  try {
    // 编辑模式：更新现有应用
    if (store.appModal.isEditMode && !isEmpty(props.app)) {
      const resp = await AppsApi.updateApp(props.app.id, {
        icon: formData.value.icon,
        name: formData.value.name,
        description: formData.value.description,
      })
      message = resp.message
    }
    // 创建模式：创建新应用
    if (store.appModal.isCreateMode) {
      const resp = await AppsApi.createApp({
        icon: formData.value.icon,
        name: formData.value.name,
        description: formData.value.description,
      })
      message = '创建智能体应用成功'
      appId = resp.data.id
    }

    // 显示成功消息
    Message.success(message)
    // 关闭模态框
    handleCloseModal()
    // 触发成功事件，传递应用ID
    emits('success', appId)
  } finally {
    // 无论成功失败，都关闭加载状态
    loading.value = false
  }
}

/**
 * 处理应用图标上传
 * @param {RequestOption} option 上传配置选项
 * @param {FileItem} option.fileItem 上传的文件项
 * @param {Function} option.onSuccess 上传成功回调函数
 * @param {Function} option.onError 上传失败回调函数
 * @returns {Promise<void>} 无返回值的Promise
 * @description
 * 1. 从上传选项中解构出文件项和回调函数
 * 2. 调用UploadApi.uploadImage上传图片
 * 3. 根据响应状态执行相应的回调函数
 * 4. 处理上传过程中的异常情况
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
 * 处理应用图标删除操作
 * 当用户点击删除图标时触发此函数
 * @returns {boolean} 返回true表示允许删除操作，返回false表示阻止删除操作
 */
const handleRemove = () => {
  formData.value.icon = '' // 清空表单中的图标URL
  return true // 允许删除操作
}

/**
 * 重置应用表单数据
 * 将表单中的所有字段恢复到初始状态
 */
const resetForm = () => {
  Object.assign(formData, {
    icon: '', // 重置应用图标URL为空
    name: '', // 重置应用名称为空
    description: '', // 重置应用描述为空
  })
}

// 监听模态框的显示状态变化
const stop = watch(
  () => visible.value, // 监听visible的变化
  (newVal) => {
    // 当模态框打开时
    if (newVal) {
      // 如果是创建模式，重置表单数据
      if (store.appModal.isCreateMode) {
        resetForm()
      }
      // 如果是编辑模式，用现有应用数据填充表单
      if (store.appModal.isEditMode) {
        Object.assign(formData.value, {
          fileList: [{ uid: '1', url: props.app?.icon }], // 设置图标文件列表
          icon: props.app?.icon, // 设置图标URL
          name: props.app?.name, // 设置应用名称
          description: props.app?.description, // 设置应用描述
        })
      }
    }
  },
)

/**
 * 组件卸载时的清理函数
 * @description
 * 在组件卸载时调用stop()函数，清除watch监听器
 * 防止内存泄漏和不必要的监听器执行
 */
onUnmounted(() => {
  stop()
})
</script>

<template>
  <a-modal
    :visible="visible"
    :width="520"
    title="创建 AI 应用"
    title-align="start"
    :footer="false"
    modal-class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <!-- 表单 -->
    <div class="pt-6">
      <a-form :model="formData" @submit="handleSubmit" layout="vertical">
        <a-spin :loading="loading">
          <!-- 知识库图标 -->
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
          <!-- 知识库名称 -->
          <a-form-item
            class="text-black"
            field="name"
            label="应用名称"
            asterisk-position="end"
            :rules="[{ required: true, message: '应用不能为空' }]"
          >
            <a-input
              v-model="formData.name"
              class="rounded-xs"
              placeholder="请输入应用名称"
              show-word-limit
              :max-length="40"
            />
          </a-form-item>
          <!-- 知识库描述 -->
          <a-form-item field="description" label="应用描述">
            <a-textarea
              v-model="formData.description"
              class="rounded-xs"
              :auto-size="{ minRows: 4, maxRows: 6 }"
              show-word-limit
              :max-length="800"
              placeholder="请输入应用描述"
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
