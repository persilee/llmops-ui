<script setup lang="ts">
import avatarIcon from '@/assets/images/icon-avatar.png'
import AIApi from '@/services/api/ai'
import type { GetAssistantAgentMessagesWithPage } from '@/services/api/assistant-agent/type'
import { useScreenshot } from '@/utils/el-to-image'
import { Message } from '@arco-design/web-vue'
import moment from 'moment'
import QRCodeVue3 from 'qrcode-vue3'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import FancyboxView from './FancyboxView.vue'
import MarkdownRender from './MarkdownRender.vue'

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
const route = useRoute()

// 处理关闭模态框的方法
const handleCloseModal = () => {
  visible.value = false
}

// 计算属性：反转消息列表顺序
// 将props.messages数组进行反转，使最新的消息显示在上方
const reversedMessages = computed(() => {
  return [...props.messages].reverse()
})

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
        fileName: `${name.value ?? '分享对话'}-虎子`, // 下载文件名
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

/**
 * 生成对话名称
 * 通过收集所有消息内容，调用AI API生成一个合适的对话名称
 * @returns {Promise<void>}
 */
const generateConversationName = async () => {
  try {
    // 设置加载状态为true，显示加载动画
    loading.value = true
    // 初始化查询字符串
    let query = ''
    // 遍历所有消息，将问题和答案拼接成字符串
    props.messages.forEach((item) => {
      query += item.query + '\n' + item.answer + '\n'
    })
    // 如果查询字符串超过2000字符，截取前2000字符
    if (query.length > 2000) {
      query = query.slice(0, 2000)
    }
    // 调用AI API生成对话名称
    const resp = await AIApi.generateConversationName({ query })
    // 将生成的名称保存到name变量中
    name.value = resp.data.name
  } catch (error) {
    // 发生错误时不做处理，静默失败
  } finally {
    // 无论成功失败，都将加载状态设置为false
    loading.value = false
  }
}

/**
 * 获取二维码内容
 * @returns {string} 返回当前路由的完整路径作为二维码内容
 */
const getQRCodeContent = () => {
  return route.fullPath
}

// 创建一个watch监听器，监听visible属性的变化
// 当模态框显示时(visible为true)，自动生成对话名称
const stop = watch(visible, (newVal) => {
  if (newVal) {
    generateConversationName()
  }
})

// 在组件卸载时，停止watch监听器
// 这是一个必要的清理步骤，可以防止内存泄漏
onUnmounted(() => {
  stop()
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
          <div
            v-for="(message, index) in reversedMessages"
            :key="message.id"
            class="flex flex-col gap-2"
          >
            <div
              v-if="message.image_urls && message.image_urls.length > 0"
              class="w-full flex items-center justify-end mb-1"
            >
              <FancyboxView>
                <div v-for="(imgUrl, idx) in message.image_urls" :key="idx" class="">
                  <a data-fancybox="gallery" :href="imgUrl" :data-thumb-src="imgUrl">
                    <img
                      v-if="message.image_urls.length == 1"
                      :src="imgUrl"
                      class="w-[248px] h-auto rounded-lg object-cover object-center"
                      crossorigin="anonymous"
                    />
                    <img
                      v-else-if="message.image_urls.length == 2"
                      :src="imgUrl"
                      class="w-[188px] h-[188px] rounded-lg object-cover object-center"
                      crossorigin="anonymous"
                    />
                    <img
                      v-else
                      :src="imgUrl"
                      class="w-[120px] h-[120px] rounded-lg object-cover object-center"
                      crossorigin="anonymous"
                    />
                  </a>
                </div>
              </FancyboxView>
            </div>
            <div
              :class="`bg-gray-200 px-4 py-3 rounded-lg leading-5 self-end ${reversedMessages.length > 1 && index == reversedMessages.length - 1 ? 'mt-5' : ''}`"
            >
              {{ message.query }}
            </div>
            <div class="py-3 self-start">
              <MarkdownRender :source="message.answer" />
            </div>
          </div>

          <div class="bg-gray-100 flex items-center justify-between rounded-sm mt-10 py-6 px-10">
            <div class="flex items-center gap-1">
              <a-avatar :size="36" shape="square" style="background-color: transparent">
                <img :src="avatarIcon" />
              </a-avatar>
              <div class="flex flex-col">
                <div class="text-gray-500 font-bold">虎子</div>
                <div class="text-gray-400 text-xs">你的AI助手，助力每日工作学习</div>
              </div>
            </div>
            <QRCodeVue3
              :value="getQRCodeContent()"
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
          :class="`border border-gray-200 text-gray-700  ${loading ? 'bg-gray-100' : 'hover:bg-gray-200'}`"
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
