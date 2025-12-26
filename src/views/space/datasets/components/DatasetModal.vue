<script setup lang="ts">
import DatasetApi from '@/services/api/dataset'
import type { CreateDatasetReq, GetDatasetsWithPage } from '@/services/api/dataset/types'
import UploadApi from '@/services/api/upload-file'
import { Message, type FileItem, type RequestOption } from '@arco-design/web-vue'
import { reactive, ref, watch } from 'vue'
import { useSpaceStore } from '../../SpaceView.store'

/**
 * 组件属性接口定义
 */
interface Props {
  /** 控制模态框的显示/隐藏状态 */
  visible: boolean
  /** 当前编辑的知识库对象，用于编辑模式下填充表单 */
  dataset?: GetDatasetsWithPage | null
}
/**
 * 组件事件接口定义
 */
interface Emits {
  /** 更新模态框显示状态事件 */
  (e: 'update:visible', value: boolean): void
  /** 操作成功事件 */
  (e: 'success'): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const store = useSpaceStore()

/** 表单提交加载状态 */
const loading = ref(false)
/** 表单数据对象，包含知识库的所有字段 */
const formData = reactive<CreateDatasetReq>({
  /** 上传的文件列表 */
  fileList: <FileItem>[],
  /** 知识库图标URL */
  icon: '',
  /** 知识库名称 */
  name: '',
  /** 知识库描述 */
  description: '',
})

/**
 * 处理表单提交的异步函数
 * 根据当前模式（编辑/创建）执行相应的知识库操作
 *
 * @returns {Promise<void>} 无返回值的Promise
 *
 * 执行流程：
 * 1. 设置加载状态为true
 * 2. 根据store状态判断是编辑模式还是创建模式
 * 3. 编辑模式：调用updateDataset API更新知识库
 * 4. 创建模式：调用createDataset API创建新知识库
 * 5. 显示成功消息
 * 6. 关闭模态框
 * 7. 触发success事件
 * 8. 无论成功失败，最后都将加载状态设置为false
 */
const handleSubmit = async () => {
  loading.value = true
  let message = ''
  try {
    if (store.datasetModal.isEditMode && props.dataset) {
      const resp = await DatasetApi.updateDataset(props.dataset.id, {
        icon: formData.icon,
        name: formData.name,
        description: formData.description,
      })
      message = resp.message
    }
    if (store.datasetModal.isCreateMode) {
      const resp = await DatasetApi.createDataset({
        icon: formData.icon,
        name: formData.name,
        description: formData.description,
      })
      message = resp.message
    }

    Message.success(message)
    handleCloseModal()
    emit('success')
  } finally {
    loading.value = false
  }
}

/**
 * 重置表单数据
 * 将表单中的所有字段重置为初始空值状态
 * @returns {void}
 */
const resetForm = () => {
  Object.assign(formData, {
    icon: '', // 重置图标URL为空
    name: '', // 重置名称为空
    description: '', // 重置描述为空
  })
}

/**
 * 关闭模态框的处理函数
 * 执行以下操作：
 * 1. 重置表单数据，清空所有输入和验证状态
 * 2. 触发visible更新事件，关闭模态框
 * @returns {void}
 */
const handleCloseModal = () => {
  resetForm() // 重置表单数据，清空所有输入和验证状态
  store.closeModal('dataset') // 关闭模态框
}

/**
 * 处理图片上传的异步函数
 * @param {RequestOption} option 上传配置对象
 * @param {FileItem} option.fileItem 要上传的文件项
 * @param {Function} option.onSuccess 上传成功时的回调函数
 * @param {Function} option.onError 上传失败时的回调函数
 * @returns {Promise<void>}
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
      formData.icon = resp.data.url
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
 * 处理删除上传的图标
 * @returns {boolean} 返回true表示允许删除
 */
const handleRemove = () => {
  formData.icon = '' // 清空表单中的图标URL
  return true // 允许删除操作
}

// 监听模态框显示状态的变化
watch(
  () => props.visible,
  (newVal) => {
    // 如果模态框打开且不是创建模式，则重置表单
    if (newVal && !store.datasetModal.isCreateMode) {
      resetForm()
    }
    // 如果是编辑模式且模态框打开，则填充表单数据
    if (store.datasetModal.isEditMode && newVal) {
      Object.assign(formData, {
        fileList: [{ uid: '1', url: props.dataset?.icon }], // 设置图标文件列表
        icon: props.dataset?.icon, // 设置图标URL
        name: props.dataset?.name, // 设置名称
        description: props.dataset?.description, // 设置描述
      })
    }
  },
)
</script>

<template>
  <a-modal
    :visible="visible"
    :width="520"
    :title="store.datasetModal.isEditMode ? '编辑插件' : '新建插件'"
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
            :rules="[{ required: true, message: '插件图标不能为空' }]"
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
            label="知识库名称"
            asterisk-position="end"
            :rules="[{ required: true, message: '知识库名称不能为空' }]"
          >
            <a-input
              v-model="formData.name"
              class="rounded-xs"
              placeholder="请输入知识库名称"
              show-word-limit
              :max-length="60"
            />
          </a-form-item>
          <!-- 知识库描述 -->
          <a-form-item
            field="description"
            label="知识库描述"
            asterisk-position="end"
            :rules="[{ required: true, message: '知识库描述不能为空' }]"
          >
            <a-textarea
              v-model="formData.description"
              class="rounded-xs"
              :auto-size="{ minRows: 4, maxRows: 6 }"
              placeholder="请输入知识库描述"
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
