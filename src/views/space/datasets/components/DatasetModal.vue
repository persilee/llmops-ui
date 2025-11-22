<script setup lang="ts">
import DatasetApi from '@/services/api/dataset'
import type { CreateDatasetReq, GetDatasetsWithPage } from '@/services/api/dataset/types'
import { Message } from '@arco-design/web-vue'
import { reactive, ref, watch } from 'vue'
import { useSpaceStore } from '../../SpaceView.store'

interface Props {
  visible: boolean
  dataset?: GetDatasetsWithPage | null
}
// Emits 定义
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const store = useSpaceStore()

const loading = ref(false)
const formData = reactive<CreateDatasetReq>({
  icon: 'https://iknow-pic.cdn.bcebos.com/77c6a7efce1b9d1618b138ffe1deb48f8c54643e?for=bg',
  name: '',
  description: '',
})

const handleSubmit = async () => {
  loading.value = true
  let message = ''
  try {
    if (store.isOpenEditDatasetModal && props.dataset) {
      const resp = await DatasetApi.updateDataset(props.dataset.id, formData)
      message = resp.message
    }
    if (store.isOpenCreateDatasetModal) {
      const resp = await DatasetApi.createDataset(formData)
      message = resp.message
    }

    Message.success(message)
    handleCloseModal()
    emit('success')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(formData, {
    icon: 'https://iknow-pic.cdn.bcebos.com/77c6a7efce1b9d1618b138ffe1deb48f8c54643e?for=bg',
    name: '',
    description: '',
  })
}

const handleCloseModal = () => {
  resetForm() // 重置表单数据，清空所有输入和验证状态
  emit('update:visible', false) // 关闭模态框
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal && !store.isOpenCreateDatasetModal) {
      resetForm()
    }
    if (store.isOpenEditDatasetModal && newVal) {
      Object.assign(formData, props.dataset)
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
      <div class="text-lg font-bold text-gray-700">
        {{ store.isOpenEditToolModal ? '编辑插件' : '新建插件' }}
      </div>
      <a-button type="text" class="text-gray-700" size="small" @click="handleCloseModal">
        <template #icon><icon-close /></template>
      </a-button>
    </div>
    <!-- 表单 -->
    <div class="pt-6">
      <a-form :model="formData" @submit="handleSubmit" layout="vertical">
        <a-spin :loading="loading">
          <!-- 知识库图标 -->
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
