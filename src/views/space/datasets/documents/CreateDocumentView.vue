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

// 批次ID，用于追踪文档处理的批次
let batch = ''
// 获取文档状态的次数计数器，用于防止无限轮询
let fetchCount = 0
// 定时器ID，用于定时获取文档处理状态
let timer: number | null | undefined = null
// 数据集状态管理store
const store = useDatasetStore()
// Vue路由实例
const router = useRouter()
// 创建文档的表单数据，包含处理类型、规则和文件列表
const createDocumentForm = reactive({
  // 文档处理类型：'automatic'（自动）或'custom'（自定义）
  process_type: 'automatic',
  // 文档处理规则配置
  rule: {
    // 预处理规则列表，如移除多余空格、URL等
    pre_process_rules: [] as string[],
    // 分段重叠字符数
    chunk_overlap: 50,
    // 分段最大字符数
    chunk_size: 500,
    // 分段分隔符列表
    separators: ['\\n'],
  },
  // 待上传的文件列表
  file_list: <FileItem>[],
})
// 自定义规则表单的引用，用于表单验证
const customRuleFormRef = useTemplateRef('custom-rule-form')
// 创建文档的加载状态
const createDocumentLoading = ref(false)
// 文档处理状态列表
const documents = ref<GetDocumentsStatusResp[]>([])

/**
 * 处理创建文档流程中的下一步操作
 *
 * 该方法负责处理文档创建的三个主要步骤：
 * 1. 第一步：验证文件上传
 *    - 检查是否上传了文件
 *    - 验证所有文件是否上传完成
 * 2. 第二步：处理分段设置
 *    - 验证自定义规则表单（如果选择自定义）
 *    - 准备并提交创建文档请求
 *    - 启动文档处理状态监控
 *
 * @async
 * @returns {Promise<void>}
 * @throws {Error} 当API调用失败时抛出错误
 */
const handleNextClick = async () => {
  // 第一步：文件上传验证
  if (store.currentStep === 1) {
    // 检查是否上传了文件
    if (createDocumentForm.file_list.length === 0) {
      Message.error('请上传知识库文件')
      store.currentStep++
      return
    }

    // 检查所有文件是否上传完成
    const isUploaded = createDocumentForm.file_list.every(
      (file: FileItem) => file?.response.data?.id,
    )
    if (!isUploaded) {
      Message.error('请等待文件上传完成')
      return
    }
    store.currentStep++
  }
  // 第二步：分段设置处理
  else if (store.currentStep === 2) {
    // 如果选择自定义规则，验证表单
    if (createDocumentForm.process_type === 'custom') {
      const errors = await customRuleFormRef.value.validate()
      if (errors) return
    }

    try {
      // 开始加载状态
      createDocumentLoading.value = true
      // 准备创建文档的请求参数
      const req: CreateDocumentReq = {
        upload_file_ids: createDocumentForm.file_list.map(
          (file: FileItem) => file?.response?.data?.id,
        ),
        process_type: createDocumentForm.process_type,
      }

      // 如果是自定义规则，添加规则配置
      if (createDocumentForm.process_type === 'custom') {
        req.rule = {
          // 预处理规则配置
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
          // 分段配置
          segment: {
            separators: createDocumentForm.rule.separators.map((separator) =>
              unescapeString(separator),
            ),
            chunk_size: createDocumentForm.rule.chunk_size,
            chunk_overlap: createDocumentForm.rule.chunk_overlap,
          },
        }
      }
      // 调用API创建文档
      if (store.dataset && store.dataset.id) {
        const resp = await DocumentsApi.createDocument(store.dataset?.id, req)
        // 保存批次ID用于后续状态查询
        batch = resp.data.batch

        // 获取文档处理状态
        await fetchDocumentsStatus()
        // 启动定时器轮询处理状态
        startTimer()

        // 进入下一步
        store.currentStep++
      }
    } catch (error) {
      // 错误处理
    } finally {
      // 结束加载状态
      createDocumentLoading.value = false
    }
  }
}

/**
 * 处理返回上一步操作
 *
 * 该函数用于在创建文档流程中返回上一步：
 * - 检查当前步骤是否大于1
 * - 如果是，则将当前步骤减1
 * - 如果不是，则不做任何操作（保持在第一步）
 */
const handlePreviousClick = () => {
  if (store.currentStep > 1) store.currentStep--
}

/**
 * 获取文档处理状态
 *
 * 该函数负责轮询获取文档的处理状态，具有以下功能：
 * 1. 检查数据集是否存在
 * 2. 增加获取次数计数器，用于防止无限轮询
 * 3. 调用API获取文档状态并更新响应式数据
 * 4. 检查是否超过最大获取次数（66次），超过则停止轮询
 * 5. 检查所有文档是否处理完成（状态为completed或error），完成则停止轮询
 * 6. 处理可能出现的错误，发生错误时停止轮询
 *
 * @async
 * @returns {Promise<void>}
 * @throws {Error} 当API调用失败时抛出错误
 */
const fetchDocumentsStatus = async () => {
  try {
    // 检查数据集是否存在
    if (store.dataset && store.dataset.id) {
      // 增加获取次数计数器
      fetchCount++
      // 调用API获取文档状态
      const resp = await DocumentsApi.getDocumentsStatus(store.dataset.id, batch)
      // 更新文档状态数据
      documents.value = resp.data
      // 检查是否超过最大获取次数（66次）
      if (fetchCount > 66) stopTimer()

      // 检查所有文档是否处理完成
      const isCompleted = documents.value.every(
        (document) => document.status === 'completed' || document.status === 'error',
      )
      // 如果所有文档处理完成，停止轮询
      if (isCompleted) stopTimer()
    }
  } catch (error) {
    // 发生错误时停止轮询
    stopTimer()
  } finally {
  }
}

/**
 * 启动定时器轮询文档处理状态
 *
 * 该函数创建一个定时器，每隔 3600 毫秒（3.6 秒）调用一次 fetchDocumentsStatus 函数
 * 用于持续监控文档的处理状态
 */
const startTimer = () =>
  (timer = setInterval(() => {
    fetchDocumentsStatus()
  }, 3600))

/**
 * 停止定时器
 *
 * 该函数用于清除正在运行的定时器，并将 timer 变量重置为 null
 * 通常在以下情况调用：
 * - 文档处理完成
 * - 发生错误
 * - 组件卸载时
 */
const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
  }
  timer = null
}

/**
 * 处理文件上传
 *
 * 该函数负责处理文件上传的核心逻辑：
 * 1. 从选项对象中解构获取文件项和成功回调函数
 * 2. 调用上传API上传文件
 * 3. 上传成功时调用回调函数传递响应数据
 *
 * @async
 * @param {RequestOption} option - 上传选项对象
 * @param {FileItem} option.fileItem - 要上传的文件项
 * @param {(response: any) => void} option.onSuccess - 上传成功时的回调函数
 * @returns {Promise<void>}
 * @throws {Error} 当上传失败时抛出错误
 */
const handleUpload = async (option: RequestOption) => {
  try {
    const { fileItem, onSuccess } = option
    const resp = await UploadApi.uploadFile(fileItem.file)
    onSuccess(resp)
  } catch (error) {}
}

/**
 * 计算文档处理进度百分比
 *
 * @param {GetDocumentsStatusResp} document - 文档状态对象，包含处理状态、分段数量等信息
 * @returns {string} 返回格式化的进度百分比字符串，如"50.00%"
 *
 * 计算规则：
 * - 如果文档状态为已完成(completed)，直接返回"100%"
 * - 如果文档分段总数为0，返回"0.00%"
 * - 否则根据已完成的分段数和总分段数计算进度百分比，保留两位小数
 */
const getProgress = (document: GetDocumentsStatusResp) => {
  if (document.status == 'completed') return '100%'
  if (document.segment_count == 0) return '0.00%'

  return ((document.completed_segment_count / document.segment_count) * 100).toFixed(2) + '%'
}

/**
 * 获取文档处理状态的中文描述
 *
 * @param {GetDocumentsStatusResp} document - 文档状态对象，包含状态、分段数量等信息
 * @returns {string} 返回文档状态的中文描述文本
 *
 * 状态映射：
 * - waiting: 等待处理...
 * - parsing: 解析中...
 * - splitting: 分割中...
 * - indexing: 索引中（已完成分段数/总分段数）...
 * - completed: 处理完成（已完成分段数/总分段数）
 * - error: 处理出错
 */
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

/**
 * 处理确认或返回操作
 *
 * 该函数用于在文档处理完成后返回文档列表页面：
 * 1. 重置当前步骤为1
 * 2. 使用router.replace导航到文档列表页面
 * 3. 传递当前数据集ID作为路由参数
 *
 * @returns {void}
 */
const handleConfirmOrBackClick = () => {
  store.currentStep = 1
  router.replace({
    name: 'space-datasets-documents',
    params: { datasetId: store.dataset?.id },
  })
}

/**
 * 组件卸载时的清理工作
 *
 * 该生命周期钩子在组件卸载时被调用，用于：
 * 1. 清理正在运行的定时器
 * 2. 防止内存泄漏
 *
 * @returns {void}
 */
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
