<script setup lang="ts">
import DocumentsApi from '@/services/api/dataset/documents'
import type {
  GetDocumentsWithPage,
  UpdateDocumentNameReq,
} from '@/services/api/dataset/documents/type'
import { Message } from '@arco-design/web-vue'
import { reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

interface Props {
  visible: boolean
  document: GetDocumentsWithPage | null
  callback: () => void
}
// Emits 定义
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const route = useRoute()
const loading = ref(false)
const formData = reactive<UpdateDocumentNameReq>({
  name: '',
})

const handleSubmit = async () => {
  try {
    if (props.document) {
      loading.value = true
      const resp = await DocumentsApi.updateDocumentName(
        route.params.datasetId as string,
        props.document.id,
        formData,
      )
      Message.success(resp.message)
      handleCloseModal()
      props.callback()
    }
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const handleCloseModal = () => {
  Object.assign(formData, {
    name: '',
  }) // 重置表单数据，清空所有输入和验证状态
  emit('update:visible', false) // 关闭模态框
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      Object.assign(formData, {
        name: props.document?.name ?? '',
      })
    }
  },
)
</script>

<template>
  <a-modal
    :visible="visible"
    :width="520"
    hide-title
    :footer="false"
    modal-class="rounded-xl"
    @close="handleCloseModal"
  >
    <!-- 标题 -->
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-gray-700">重命名</div>
      <a-button type="text" class="text-gray-700" size="small" @click="handleCloseModal">
        <template #icon><icon-close /></template>
      </a-button>
    </div>
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
