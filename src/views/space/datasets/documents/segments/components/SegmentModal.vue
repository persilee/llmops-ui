<script setup lang="ts">
import { isDatasetHitResp, type DatasetHitResp } from '@/services/api/dataset/documents/type'
import SegmentsApi from '@/services/api/dataset/segments'
import {
  isGetSegmentsWithPage,
  type GetSegmentsWithPage,
  type UpdateSegmentReq,
} from '@/services/api/dataset/segments/types'
import { Message } from '@arco-design/web-vue'
import { reactive, ref, watch } from 'vue'
import { useDatasetStore } from '../../../DatasetView.store'

/**
 * 组件属性接口定义
 * @interface Props
 */
interface Props {
  /** 控制模态框的显示/隐藏状态 */
  visible: boolean
  /** 当前要编辑的文档对象，可能为null */
  segment?: GetSegmentsWithPage | DatasetHitResp | null
}
/**
 * 组件事件接口定义
 * @interface Emits
 */
interface Emits {
  /** 更新visible属性的事件 */
  (e: 'update:visible', value: boolean): void
  (e: 'success', value: UpdateSegmentReq): void
}
/** 定义组件的props */
const props = defineProps<Props>()
/** 定义组件的emit事件 */
const emit = defineEmits<Emits>()

// 使用知识库状态管理store
const store = useDatasetStore()
// 控制加载状态的响应式引用
const loading = ref(false)
// 表单数据的响应式对象，包含片段内容和关键词
const formData = reactive<UpdateSegmentReq>({
  content: '',
  keywords: [],
})

/**
 * 处理模态框关闭的函数
 * 触发update:visible事件，将visible属性设置为false
 */
const handleCloseModal = () => {
  emit('update:visible', false)
}

/**
 * 处理表单提交的异步函数
 * 根据是否存在segment来决定是创建新片段还是更新现有片段
 * @async
 * @returns {Promise<void>} 无返回值的Promise
 * @throws {Error} 当API调用失败时抛出错误
 */
const handleSubmit = async () => {
  try {
    // 开启加载状态
    loading.value = true

    // 如果存在segment，则执行更新操作
    if (props.segment) {
      let req: {
        datasetId: string
        documentId: string
        segmentId: string
        formData: UpdateSegmentReq
      } | null = null

      if (isGetSegmentsWithPage(props.segment)) {
        req = {
          datasetId: props.segment.dataset_id,
          documentId: props.segment.document_id,
          segmentId: props.segment.id,
          formData: formData,
        }
      } else if (isDatasetHitResp(props.segment)) {
        req = {
          datasetId: props.segment.dataset_id,
          documentId: props.segment.document.id,
          segmentId: props.segment.id,
          formData: formData,
        }
      }

      if (req) {
        const resp = await SegmentsApi.updateSegment(
          req.datasetId,
          req.documentId,
          req.segmentId,
          req.formData,
        )
        Message.success(resp.message)
        emit('success', formData)
      }
    } else {
      // 如果不存在segment，则执行创建操作
      // 检查必要的数据是否存在
      if (store.dataset && store.dataset.id && store.document && store.document.id) {
        // 调用创建片段API
        const resp = await SegmentsApi.createSegment(store.dataset.id, store.document.id, formData)
        // 处理成功响应
        Message.success(resp.message)
        emit('success', formData)
      }
    }
  } catch (error) {
    // 错误处理
  } finally {
    // 无论成功失败，都关闭加载状态
    loading.value = false
  }
}

// 监听模态框的显示状态
watch(
  () => props.visible, // 监听visible属性的变化
  (newVal) => {
    // 当模态框打开时
    if (newVal && props.segment) {
      // 将片段数据同步到表单数据中
      Object.assign(formData, { content: props.segment.content, keywords: props.segment.keywords })
    } else {
      Object.assign(formData, {
        content: '',
        keywords: [],
      })
    }
  },
)
</script>

<template>
  <a-modal
    :visible="visible"
    :width="520"
    title="添加片段"
    title-align="start"
    :footer="false"
    modal-class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <!-- 表单 -->
    <div class="">
      <a-form :model="formData" @submit="handleSubmit" layout="vertical">
        <a-spin :loading="loading">
          <!-- 片段内容 -->
          <a-form-item
            class="text-black"
            field="content"
            label="片段内容"
            asterisk-position="end"
            :rules="[{ required: true, message: '片段内容不能为空' }]"
          >
            <a-textarea
              v-model="formData.content"
              placeholder="在这里添加文档片段内容"
              class="rounded-lg"
              :auto-size="{ minRows: 10, maxRows: 16 }"
            />
          </a-form-item>
          <!-- 关键词 -->
          <a-form-item class="text-black" field="content" label="关键词" asterisk-position="end">
            <a-input-tag
              v-model="formData.keywords"
              placeholder="请输入该文档片段关键词，最多不超过10个，按Enter输入"
              class="rounded-lg"
              :max-tag-count="10"
              allow-clear
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
