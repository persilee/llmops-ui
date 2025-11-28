<script setup lang="ts">
import DocumentsApi from '@/services/api/dataset/documents'
import type {
  CreateDocumentReq,
  GetDocumentsStatusResp,
} from '@/services/api/dataset/documents/type'
import UploadApi from '@/services/api/upload-file'
import { unescapeString } from '@/utils/util'
import { Message, type FileItem, type RequestOption } from '@arco-design/web-vue'
import { onUnmounted, reactive, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useDatasetStore } from '../DatasetView.store'

let batch = ''
let fetchCount = 0
let timer: number | null | undefined = null
const store = useDatasetStore()
const router = useRouter()
const createDocumentForm = reactive({
  process_type: 'automatic',
  rule: {
    pre_process_rules: [] as string[],
    chunk_overlap: 50,
    chunk_size: 500,
    separators: ['\\n'],
  },
  file_list: <FileItem>[],
})
const customRuleFormRef = useTemplateRef('custom-rule-form')
const createDocumentLoading = ref(false)
const documents = ref<GetDocumentsStatusResp[]>([])

const handleNextClick = async () => {
  if (store.currentStep === 1) {
    if (createDocumentForm.file_list.length === 0) {
      Message.error('请上传知识库文件')
      store.currentStep++
      return
    }

    const isUploaded = createDocumentForm.file_list.every(
      (file: FileItem) => file?.response.data?.id,
    )
    if (!isUploaded) {
      Message.error('请等待文件上传完成')
      return
    }
    store.currentStep++
  } else if (store.currentStep === 2) {
    if (createDocumentForm.process_type === 'custom') {
      const errors = await customRuleFormRef.value.validate()

      if (errors) return
    }

    try {
      createDocumentLoading.value = true
      const req: CreateDocumentReq = {
        upload_file_ids: createDocumentForm.file_list.map(
          (file: FileItem) => file?.response?.data?.id,
        ),
        process_type: createDocumentForm.process_type,
      }

      if (createDocumentForm.process_type === 'custom') {
        req.rule = {
          pre_process_rules: [
            {
              id: 'remove_extra_space',
              enabled: createDocumentForm.rule.pre_process_rules.includes('remove_extra_space'),
            },
            {
              id: 'remove_url_and_email',
              enabled: createDocumentForm.rule.pre_process_rules.includes('remove_url_and_email'),
            },
          ],
          segment: {
            separators: createDocumentForm.rule.separators.map((separator) =>
              unescapeString(separator),
            ),
            chunk_size: createDocumentForm.rule.chunk_size,
            chunk_overlap: createDocumentForm.rule.chunk_overlap,
          },
        }
      }
      if (store.dataset && store.dataset.id) {
        const resp = await DocumentsApi.createDocument(store.dataset?.id, req)
        batch = resp.data.batch

        await fetchDocumentsStatus()
        startTimer()

        store.currentStep++
      }
    } catch (error) {
    } finally {
      createDocumentLoading.value = false
    }
  }
}
const handlePreviousClick = () => {
  if (store.currentStep > 1) store.currentStep--
}

const fetchDocumentsStatus = async () => {
  try {
    if (store.dataset && store.dataset.id) {
      fetchCount++
      const resp = await DocumentsApi.getDocumentsStatus(store.dataset.id, batch)
      documents.value = resp.data
      if (fetchCount > 66) stopTimer()

      const isCompleted = documents.value.every(
        (document) => document.status === 'completed' || document.status === 'error',
      )
      if (isCompleted) stopTimer()
    }
  } catch (error) {
    stopTimer()
  } finally {
  }
}

const startTimer = () =>
  (timer = setInterval(() => {
    fetchDocumentsStatus()
  }, 3600))

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
  }
  timer = null
}

const handleUpload = async (option: RequestOption) => {
  try {
    const { fileItem, onSuccess } = option
    const resp = await UploadApi.uploadFile(fileItem.file)
    onSuccess(resp)
  } catch (error) {}
}

const getProgress = (document: GetDocumentsStatusResp) => {
  if (document.status == 'completed') return '100%'
  if (document.segment_count == 0) return '0.00%'

  return ((document.completed_segment_count / document.segment_count) * 100).toFixed(2) + '%'
}

const getStatus = (document: GetDocumentsStatusResp) => {
  if (document.status == 'waiting') return '等待处理...'
  if (document.status == 'parsing') return '解析中...'
  if (document.status == 'splitting') return '分割中...'
  if (document.status == 'indexing')
    return `索引中（${document.completed_segment_count}/${document.segment_count}）...`
  if (document.status == 'completed')
    return `处理完成（${document.completed_segment_count}/${document.segment_count}）`
  if (document.status == 'error') return '处理出错'
}

const handleConfirmOrBackClick = () => {
  store.currentStep = 1
  router.push({
    name: 'space-datasets-documents',
    params: { datasetId: store.dataset?.id },
  })
}

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="flex flex-col p-6 h-full">
    <!-- 返回按钮和标题 -->
    <div class="flex items-center mb-6 gap-4">
      <a-button size="mini" type="text" class="text-gray-700" @click="handleConfirmOrBackClick">
        <template #icon><icon-left /></template>
      </a-button>
      <div class="text-lg font-bold text-gray-700">添加文件</div>
    </div>
    <!-- 步骤 -->
    <div class="w-[520px] mx-auto">
      <a-steps :current="store.currentStep">
        <a-step>上传</a-step>
        <a-step>分段设置</a-step>
        <a-step>数据处理</a-step>
      </a-steps>
    </div>
    <!-- 步骤内容 -->
    <div class="flex-1 p-[48px]">
      <!-- 上传 -->
      <div v-if="store.currentStep === 1" class="">
        <a-upload
          v-model:file-list="createDocumentForm.file_list"
          draggable
          accept=".doc, .docx, .pdf, .txt, .md, .markdown"
          :limit="10"
          multiple
          tip="支持PDF、TXT、DOC、DOCX、MD，最多可上传10个文件，每个文件不超过10MB"
          :custom-request="handleUpload"
        />
      </div>
      <!-- 分段设置 -->
      <div v-if="store.currentStep === 2" class="">
        <!-- 自动分段与清洗 -->
        <div
          :class="`px-5 py-4 mb-3 bg-white rounded-lg border hover:border-blue-600 cursor-pointer transition-all duration-300 ${createDocumentForm.process_type === 'automatic' ? 'border-blue-600' : 'border-gray-300'}`"
          @click="createDocumentForm.process_type = 'automatic'"
        >
          <div class="font-bold text-gray-700 mb-2">自动分段与清洗</div>
          <div class="text-gray-500 text-xs">自动分段与预处理规则</div>
        </div>
        <!-- 自定义 -->
        <div
          :class="`px-5 py-4 bg-white rounded-lg border hover:border-blue-600 cursor-pointer transition-all duration-300 ${createDocumentForm.process_type === 'custom' ? 'border-blue-600' : 'border-gray-300'}`"
          @click="createDocumentForm.process_type = 'custom'"
        >
          <div class="font-bold text-gray-700 mb-2">自定义</div>
          <div class="text-gray-500 text-xs">自定义分段规则、分段长度与预处理规则</div>
          <div v-if="createDocumentForm.process_type === 'custom'" class="">
            <a-divider />
            <a-form :model="createDocumentForm.rule" layout="vertical" ref="custom-rule-form">
              <a-form-item
                field="separators"
                label="分段标识符"
                required
                asterisk-position="end"
                :rules="[{ required: true, message: '请输入分段标识符' }]"
              >
                <a-input-tag
                  v-model="createDocumentForm.rule.separators"
                  placeholder="请输入分段标识符，如果有多个标识符，请使用英文逗号进行分割"
                />
              </a-form-item>
              <a-form-item
                field="chunk_size"
                label="分段最大长度"
                required
                asterisk-position="end"
                :rules="[{ required: true, message: '请输入分段最大长度' }]"
              >
                <a-input-number
                  v-model="createDocumentForm.rule.chunk_size"
                  :min="100"
                  :max="1000"
                  :step="1"
                  :default-value="500"
                  placeholder="请输入100 - 1000的数值"
                />
              </a-form-item>
              <a-form-item
                field="chunk_overlap"
                label="块重叠数"
                required
                asterisk-position="end"
                :rules="[{ required: true, message: '请输入块重叠数' }]"
              >
                <a-input-number
                  v-model="createDocumentForm.rule.chunk_overlap"
                  :min="0"
                  :max="500"
                  :step="1"
                  :default-value="50"
                  placeholder="请输入0 - 500的数值"
                />
              </a-form-item>
              <a-form-item field="pre_process_rules" label="文本预处理规则">
                <a-checkbox-group
                  v-model="createDocumentForm.rule.pre_process_rules"
                  direction="vertical"
                >
                  <a-checkbox value="remove_extra_space"
                    >替换掉连续的空格、换行符和制表符</a-checkbox
                  >
                  <a-checkbox value="remove_url_and_email">删除所有 URL 和电子邮件地址</a-checkbox>
                </a-checkbox-group>
              </a-form-item>
            </a-form>
          </div>
        </div>
      </div>
      <!-- 数据处理 -->
      <div v-if="store.currentStep === 3" class="">
        <div class="text-gray-700 font-medium mb-2">服务器处理中</div>
        <div class="flex flex-col gap-2">
          <div
            v-for="document in documents"
            :key="document.id"
            class="bg-white rounded-lg border border-blue-600 relative"
          >
            <!-- 进度 -->
            <div
              class="flex progress-bar rounded-lg"
              :style="{ width: getProgress(document) }"
            ></div>
            <!-- 数据处理内容 -->
            <div class="flex items-center justify-between px-4 py-3 z-10 relative">
              <div class="flex items-center gap-2.5">
                <a-avatar shape="square" class="bg-blue-700"><icon-file /></a-avatar>
                <div class="">
                  <div class="text-gray-700 mb-1.5">{{ document.name }}</div>
                  <div class="flex items-center text-gray-500 text-xs gap-2">
                    {{ (document.size / 1024).toFixed(2) }} KB
                    <div class="text-gray-500 text-xs">{{ getStatus(document) }}</div>
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <div class="text-gray-500 text-xl">{{ getProgress(document) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 操作按钮 -->
    <div class="flex items-center px-[48px] gap-4 justify-end">
      <a-button
        v-if="store.currentStep == 2"
        :loading="createDocumentLoading"
        class="rounded-lg"
        size="small"
        @click="handlePreviousClick"
        >上一步</a-button
      >
      <a-button
        v-if="store.currentStep < 3"
        class="rounded-lg"
        size="small"
        type="primary"
        @click="handleNextClick"
        >下一步</a-button
      >
      <div v-if="store.currentStep == 3" class="flex items-center gap-2">
        <div class="text-gray-400 text-xs">点击确认不影响数据处理，处理完毕后可进行引用</div>
        <a-button type="primary" size="small" @click="handleConfirmOrBackClick">确认</a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.arco-upload-list-item-content) {
  background-color: #f3f4f6;
}
:deep(.arco-upload-drag) {
  background-color: #e5e7eb;
}
.progress-bar {
  position: absolute;
  background-color: #eff6ff !important;
  height: 100%;
  z-index: 0;
}
</style>
