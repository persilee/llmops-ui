<script setup lang="ts">
import { QueueEvent } from '@/config'
import AppsApi from '@/services/api/apps'
import OpenapiApi from '@/services/api/openapi'
import type { CharReq } from '@/services/api/openapi/types'
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, ref } from 'vue'
import 'vue-json-pretty/lib/styles.css'
import APIInfo from './components/APIInfo.vue'
import APIResult from './components/APIResult.vue'

// 控制API调用时的加载状态
const loading = ref(false)
// 控制创建API密钥时的加载状态
const apiKeyLoading = ref(false)
// 存储API访问令牌
const token = ref('')
// 存储API请求参数的对象
const reqData = ref<CharReq>({
  app_id: '', // 应用ID
  conversation_id: '', // 会话ID
  end_user_id: '', // 最终用户ID
  image_urls: [], // 图片URL列表
  query: '', // 查询内容
  stream: false, // 是否使用流式响应
})
// 生成curl命令的计算属性，用于展示API调用示例
const code = computed(() => {
  return `curl --location --request POST 'http://127.0.0.1:5000/openapi/chat' \\
--header 'Authorization: Bearer ${token.value}' \\
--header 'Content-Type: application/json' \\
--header 'Accept: */*' \\
--header 'Host: 127.0.0.1:5000' \\
--header 'Connection: keep-alive' \\
--data-raw '{
    "app_id": "${reqData.value.app_id}",
    "conversation_id": "${reqData.value.conversation_id}",
    "end_user_id": "${reqData.value.end_user_id}",
    "query": "${reqData.value.query}",
    "stream": ${reqData.value.stream},
}'`
})

// 存储API调用的结果数据
const result = ref()

// TODO: 待Agent 支持图片上传之后再实现
const handleUpload = () => {}

/**
 * 处理API调用的异步函数
 * 支持流式和非流式两种调用方式
 */
const handleRun = async () => {
  // 验证必填字段：查询内容、应用ID和访问令牌
  if (reqData.value.query === '' || reqData.value.app_id === '' || token.value === '') {
    Message.error('请输入必填项')
    return
  }
  try {
    // 设置加载状态为true，显示加载指示器
    loading.value = true
    // 根据stream参数选择不同的调用方式
    if (reqData.value.stream) {
      // 流式调用：初始化结果数组，使用debugApp进行流式请求
      result.value = []
      await AppsApi.debugApp({
        appId: reqData.value.app_id,
        req: { query: reqData.value.query },
        onData: handleEventData, // 处理流式数据回调
      })
    } else {
      // 非流式调用：直接调用chat接口获取完整响应
      const resp = await OpenapiApi.chat('/openapi/chat', token.value, reqData.value)
      // 将响应结果赋值给result
      result.value = resp
    }
  } catch (error) {
    // 错误处理：打印错误信息到控制台
    console.log(error)
  } finally {
    // 无论成功失败，最后都要重置加载状态
    loading.value = false
  }
}

/**
 * 处理流式响应数据的事件处理函数
 * @param eventResponse 事件响应对象，包含事件类型和对应的数据
 */
const handleEventData = (eventResponse: Record<string, any>) => {
  // 从事件响应中解构提取事件类型和数据
  const event = eventResponse.event as string // 事件类型，如 'message'、'error' 等
  const data = eventResponse.data // 事件携带的具体数据内容

  // 如果是ping事件（心跳检测），直接返回，不做处理
  // ping事件用于保持连接活跃，不需要展示给用户
  if (event === QueueEvent.ping) return

  // 将有效的事件数据添加到结果数组中
  // 每个事件对象包含事件类型和对应的数据
  result.value.push({ event, data })
}

/**
 * 处理流式模式切换的事件处理函数
 * @param value boolean - 切换后的流式模式状态，true表示开启流式，false表示关闭流式
 */
const handleStreamChange = (value: boolean) => {
  // 清空当前结果，确保切换模式后不会显示之前的结果
  result.value = null
}

/**
 * 创建API密钥的异步函数
 * 用于生成一个新的API访问密钥，用于API调用认证
 *
 * @returns {Promise<void>} 返回一个Promise对象，表示异步操作完成
 * @throws {Error} 当API调用失败时抛出错误
 */
const createApiKey = async () => {
  try {
    // 设置加载状态为true，显示加载指示器
    apiKeyLoading.value = true
    // 调用API创建新的密钥
    const resp = await OpenapiApi.createApiKey({
      is_active: true, // 设置密钥为激活状态
      remark: '快速开始生成的临时 Key', // 添加备注说明
    })
    // 将生成的API密钥保存到token变量中
    token.value = resp.data.api_key
  } catch (error) {
    // 错误处理：捕获并处理API调用可能出现的错误
    console.error('创建API密钥失败:', error)
  } finally {
    // 无论成功失败，最后都要重置加载状态
    apiKeyLoading.value = false
  }
}

// TODO: 获取 App 应用列表，提供给 app_id 下拉选择
const fetchData = async () => {
  try {
  } catch (error) {}
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="flex-1 flex bg-white px-6 rounded-lg mt-4 shadow-xs min-h-0">
    <!-- 左边 API 信息 -->
    <APIInfo
      v-model:req-data="reqData"
      v-model:token="token"
      :loading="apiKeyLoading"
      @create-api-key="createApiKey"
      @handle-upload="handleUpload"
      @select-change="handleStreamChange"
    />
    <!-- 中间竖线 -->
    <div class="mx-6 h-hull"></div>
    <!-- 右边 Curl 信息 -->
    <APIResult
      :loading="loading"
      :result="result"
      :code="code"
      :req-data="reqData"
      @handle-run="handleRun"
    />
  </div>
</template>

<style scoped>
:deep(.hljs) {
  background: #272b3a;
  border-radius: 0 0 8px 8px;
}
</style>
