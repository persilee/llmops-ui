<script setup lang="ts">
import avatarIcon from '@/assets/images/icon-avatar.png'
import AIApi from '@/services/api/ai'
import type { GetAssistantAgentMessagesWithPage } from '@/services/api/assistant-agent/type'
import { useScreenshot } from '@/utils/el-to-image'
import { Message } from '@arco-design/web-vue'
import moment from 'moment'
import QRCodeVue3 from 'qrcode-vue3'
import { ref, watch } from 'vue'

// 定义组件的props，包含消息列表数据
const props = defineProps<{
  messages: Array<GetAssistantAgentMessagesWithPage> // 消息列表数组，类型为GetAssistantAgentMessagesWithPage
}>()
// 定义v-model绑定的visible属性，用于控制模态框的显示/隐藏状态
const visible = defineModel('visible', { type: Boolean, default: false })
// 定义组件的事件，包含shareSuccess事件用于分享成功后的回调
const emits = defineEmits(['shareSuccess'])
// 分享消息内容的DOM引用，用于截图功能
const shareMessagesRef = ref(null)
// 初始化截图工具，包含capture（下载截图）和elToBlob（生成图片blob）方法
const { capture, elToBlob } = useScreenshot()
// 处理加载状态
const loading = ref(false)
// 回话名称
const name = ref('')

// 处理关闭模态框的方法
const handleCloseModal = () => {
  visible.value = false
}

/**
 * 处理复制图片功能
 * 将分享的消息内容转换为图片并复制到剪贴板
 * @returns {Promise<void>}
 */
const handleCopyImage = async () => {
  try {
    // 检查是否存在要截图的元素
    if (shareMessagesRef.value) {
      // 将元素转换为图片blob对象
      const blob = await elToBlob(shareMessagesRef.value)
      if (blob) {
        // 创建剪贴板项
        const clipboardItem = new ClipboardItem({
          [blob.type]: blob,
        })
        // 将图片写入剪贴板
        await navigator.clipboard.write([clipboardItem])
        // 显示成功提示
        Message.success('复制图片成功')
        // 关闭模态框
        visible.value = false
        // 触发分享成功事件
        emits('shareSuccess')
      } else {
        // 如果blob生成失败，抛出错误
        throw new Error('Failed to generate image blob')
      }
    }
  } catch (error) {
    // 捕获错误并显示失败提示
    Message.error('复制图片失败')
  }
}

/**
 * 处理下载图片功能
 * 将分享的消息内容转换为PNG图片并下载到本地
 */
const handleDownloadImage = async () => {
  try {
    // 检查是否存在要截图的元素
    if (shareMessagesRef.value) {
      // 使用截图工具捕获元素内容并下载
      const data = await capture(shareMessagesRef.value, {
        shouldDownload: true, // 是否自动下载
        type: 'png', // 图片格式
        skipFonts: false, // 是否跳过字体加载
        pixelRatio: window.devicePixelRatio || 2, // 像素比例，默认为2
        fileName: `${name.value ?? '分享对话'}-小智`, // 下载文件名
      })
      // 显示下载成功提示
      Message.success('下载图片成功')
      // 关闭模态框
      visible.value = false
      // 触发分享成功事件
      emits('shareSuccess')
    }
  } catch (error) {
    // 捕获错误并显示失败提示
    Message.error('下载图片失败')
  }
}

const generateConversationName = async () => {
  try {
    loading.value = true
    let query = ''
    props.messages.forEach((item) => {
      query += item.query + '\n' + item.answer + '\n'
    })
    if (query.length > 2000) {
      query = query.slice(0, 2000)
    }
    const resp = await AIApi.generateConversationName({ query })
    name.value = resp.data.name
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const stop = watch(visible, (newVal) => {
  if (newVal) {
    generateConversationName()
  }
})
</script>

<template>
  <a-modal
    :visible="visible"
    :width="800"
    title="分享图片预览"
    title-align="start"
    modal-class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <a-spin :loading="loading" class="w-full h-full">
      <div
        class="h-full w-full max-h-[80vh] bg-gray-100 rounded-lg p-3 overflow-scroll scrollbar-w-none"
      >
        <div ref="shareMessagesRef" class="flex flex-col bg-gray-50 rounded-lg p-8">
          <div class="flex flex-col gap-2">
            <div class="text-[26px] font-bold">{{ name ?? '分享对话' }}</div>
            <div class="text-gray-500 text-xs">
              {{ moment().locale('zh-cn').format('YYYY年MM月DD日') }} • 内容由 AI
              生成，不能完全保障真实
            </div>
          </div>
          <a-divider class="my-8" />
          <div v-for="message in messages" :key="message.id" class="flex flex-col gap-2">
            <div class="bg-gray-200 px-4 py-3 rounded-lg leading-5 self-end">
              {{ message.query }}
            </div>
            <div class="py-3 rounded-lg leading-5 self-start">{{ message.answer }}</div>
          </div>

          <div class="bg-gray-100 flex items-center justify-between rounded-sm mt-10 py-6 px-10">
            <div class="flex items-center gap-1">
              <a-avatar :size="36" shape="square" style="background-color: transparent">
                <img :src="avatarIcon" />
              </a-avatar>
              <div class="flex flex-col">
                <div class="text-gray-500 font-bold">小智</div>
                <div class="text-gray-400 text-xs">你的AI助手，助力每日工作学习</div>
              </div>
            </div>
            <QRCodeVue3
              value="https://lishaoy.net"
              :width="66"
              :height="66"
              :qrOptions="{ typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'H' }"
              :imageOptions="{ hideBackgroundDots: true, imageSize: 0.6, margin: 0 }"
              :dotsOptions="{
                type: 'square',
                color: '#000000',
                gradient: {
                  type: 'linear',
                  rotation: 0,
                  colorStops: [
                    { offset: 0, color: '#000000' },
                    { offset: 1, color: '#000000' },
                  ],
                },
              }"
              :backgroundOptions="{ color: '#ffffff' }"
              :cornersSquareOptions="{ type: 'square', color: '#000000' }"
            />
          </div>
        </div>
      </div>
    </a-spin>
    <template #footer>
      <div class="flex items-center justify-center gap-3.5 mb-3">
        <a-button
          type="outline"
          :disabled="loading"
          @click="handleCopyImage"
          :class="`border border-gray-200 text-gray-700 ${loading ? 'bg-gray-100' : ''}`"
        >
          <template #icon><icon-copy /></template>
          复制图片
        </a-button>
        <a-button type="primary" :disabled="loading" @click="handleDownloadImage">
          <template #icon><icon-download /></template>
          下载图片
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<style scoped></style>
