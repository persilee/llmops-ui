<script setup lang="ts">
import DocumentsApi from '@/services/api/dataset/documents'
import type {
  GetDocumentsWithPage,
  UpdateDocumentNameReq,
} from '@/services/api/dataset/documents/type'
import { Message } from '@arco-design/web-vue'
import { reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

/**
 * 组件属性接口定义
 * @interface Props
 */
interface Props {
  /** 控制模态框的显示/隐藏状态 */
  visible: boolean
  /** 当前要编辑的文档对象，可能为null */
  document: GetDocumentsWithPage | null
  /** 操作完成后的回调函数 */
  callback: () => void
}
/**
 * 组件事件接口定义
 * @interface Emits
 */
interface Emits {
  /** 更新visible属性的事件 */
  (e: 'update:visible', value: boolean): void
  /** 操作成功时触发的事件 */
  (e: 'success'): void
}
/** 定义组件的props */
const props = defineProps<Props>()
/** 定义组件的emit事件 */
const emit = defineEmits<Emits>()

/** 获取当前路由信息 */
const route = useRoute()
/** 控制加载状态的响应式变量 */
const loading = ref(false)
/** 表单数据的响应式对象，用于存储文档名称 */
const formData = reactive<UpdateDocumentNameReq>({
  name: '',
})

/**
 * 处理表单提交的异步函数
 * 用于更新文档名称
 */
const handleSubmit = async () => {
  try {
    // 检查是否存在文档对象
    if (props.document) {
      // 开启加载状态
      loading.value = true
      // 调用API更新文档名称
      const resp = await DocumentsApi.updateDocumentName(
        route.params.datasetId as string, // 知识库ID
        props.document.id, // 文档ID
        formData, // 包含新名称的表单数据
      )
      // 显示成功消息
      Message.success(resp.message)
      // 关闭模态框
      handleCloseModal()
      // 执行回调函数
      props.callback()
    }
  } catch (error) {
    // 错误处理：捕获并处理可能出现的异常
  } finally {
    // 无论成功或失败，最后都要关闭加载状态
    loading.value = false
  }
}

/**
 * 关闭模态框
 */
const handleCloseModal = () => {
  // 重置表单数据，将name字段重置为空字符串
  // 这样做可以确保下次打开模态框时不会显示上次的输入内容
  Object.assign(formData, {
    name: '',
  })
  // 触发update:visible事件，将visible属性更新为false
  // 这会通知父组件关闭模态框
  emit('update:visible', false)
}

// 监听模态框的显示状态
watch(
  () => props.visible, // 监听visible属性的变化
  (newVal) => {
    // 当模态框打开时
    if (newVal) {
      // 将文档名称同步到表单数据中
      Object.assign(formData, {
        name: props.document?.name ?? '', // 如果document存在则使用其name，否则使用空字符串
      })
    }
  },
)
</script>

<template>
  <a-modal
    :visible="visible"
    :width="520"
    title="重命名"
    title-align="start"
    :footer="false"
    modal-class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <!-- 表单 -->
    <div class="pt-6">
      <a-form :model="formData" @submit="handleSubmit" layout="vertical">
        <a-spin :loading="loading">
          <!-- 知识库名称 -->
          <a-form-item
            class="text-black"
            field="name"
            label="名称"
            asterisk-position="end"
            :rules="[{ required: true, message: '知识库名称不能为空' }]"
          >
            <a-input
              v-model="formData.name"
              class="rounded-xs"
              placeholder="请输入知识库名称"
              show-word-limit
            />
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
