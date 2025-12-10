<script setup lang="ts">
import AppsApi from '@/services/api/apps'
import { Message } from '@arco-design/web-vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import DebugEmptyMessage from './components/DebugEmptyMessage.vue'
import DebugHeader from './components/DebugHeader.vue'

const inputValue = ref('')
interface Message {
  id: number
  role: string
  content: string
}
const messages = ref<Message[]>([])
const isLoading = ref(false)
const isCursor = ref(false)
const isDisabled = computed(() => isLoading.value || inputValue.value.trim() === '')
const route = useRoute()

const clearMessages = () => {
  messages.value = []
}

const sendMessage = async () => {
  if (isDisabled.value) return

  try {
    isLoading.value = true

    messages.value.push({
      id: messages.value.length,
      role: 'human',
      content: inputValue.value,
    })

    const humanMsg = inputValue.value
    inputValue.value = ''

    messages.value.push({
      id: messages.value.length,
      role: 'ai',
      content: '',
    })
    await AppsApi.debugApp({
      appId: route.params.appId as string,
      req: { query: humanMsg },
      onData: (event_response) => {
        const event = event_response?.event
        const data = event_response?.data

        const lastIndex = messages.value.length - 1
        const message = messages.value[lastIndex]

        if (event === 'agent_message') {
          const chunk_content = data?.answer
          messages.value[lastIndex].content = message.content + chunk_content
          if (!chunk_content) isCursor.value = false
        }
      },
    })
  } finally {
    isLoading.value = false
    isCursor.value = true
  }
}
</script>

<template>
  <div class="min-h-screen w-full">
    <div class="flex flex-row h-[calc(100vh-74px)]">
      <div class="flex flex-col w-2/3 bg-gray-50 h-full">
        <header
          class="flex items-center flex-shrink-0 h-16 border-b border-gray-200 px-7 text-xl text-gray-700"
        >
          应用编排
        </header>
        <div class="flex flex-row h-full">
          <div class="flex-1 border-r border-gray-200 p-6">人设与回复逻辑</div>
          <div class="flex-1 p-6">应用能力</div>
        </div>
      </div>
      <div class="flex flex-col w-1/3 h-full bg-white">
        <DebugHeader />
        <div
          class="flex flex-col h-full min-h-0 px-6 py-7 overflow-x-hidden overflow-y-scroll scrollbar-w-none"
        >
          <DebugEmptyMessage v-if="messages.length === 0" />
          <div v-for="message in messages" :key="message.id">
            <div v-if="message.content != ''" class="flex flex-row gap-2 mb-6">
              <AAvatar v-if="message.role === 'human'" class="shrink-0" :size="30">🙍🏻‍♂️</AAvatar>
              <AAvatar v-else class="shrink-0" :size="30">🤖</AAvatar>
              <div class="flex flex-col gap-2">
                <div class="font-semibold text-gray-700">
                  {{ message.role === 'human' ? '小明' : 'AI' }}
                </div>
                <div
                  v-if="message.role === 'human'"
                  class="max-w-max bg-blue-700 text-white border border-blue-800 px-4 py-3 rounded-2xl leading-5"
                >
                  {{ message.content }}
                </div>
                <div
                  v-else
                  class="max-w-max bg-gray-100 text-gray-900 border border-gray-200 px-4 py-3 rounded-2xl leading-5"
                >
                  {{ message.content }}
                  <div v-if="isCursor && messages.length - 1 == message.id" class="cursor"></div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="isLoading" class="flex flex-row gap-2 mb-6">
            <a-avatar class="shrink-0" :size="30">AI</a-avatar>
            <div class="flex flex-col gap-2">
              <div class="font-semibold text-gray-700">AI</div>
              <div
                class="max-w-max bg-gray-100 text-gray-900 border border-gray-200 px-4 py-3 rounded-2xl leading-5"
              >
                <a-spin :loading="isLoading" />
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col w-full flex-shrink-0">
          <div class="flex items-center px-6 gap-4">
            <a-button class="flex-shrink-0" type="text" shape="circle" @click="clearMessages">
              <template #icon
                ><img src="@/assets/images/icon-clear.png" class="w-4 h-4"
              /></template>
            </a-button>
            <div
              class="flex flex-1 items-center h-[50px] gap-2 px-4 border border-gray-200 rounded-full"
            >
              <input
                v-model="inputValue"
                type="text"
                class="flex-1 outline-0"
                @keyup.enter="sendMessage"
                @keyup.enter.exact="sendMessage"
              />
              <a-button type="text" shape="circle">
                <template #icon
                  ><img src="@/assets/images/icon-add.png" class="w-4 h-4"
                /></template>
              </a-button>
              <a-button :disabled="isDisabled" type="text" shape="circle" @click="sendMessage">
                <template #icon
                  ><img
                    src="@/assets/images/icon-send.png"
                    :class="['w-4', 'h-4', { 'send-icon-active': !isDisabled }]"
                /></template>
              </a-button>
            </div>
          </div>
          <div class="text-center text-gray-500 text-xs py-4">
            内容由AI生成，无法确保真实准确，仅供参考。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.send-icon-active {
  filter: brightness(0) saturate(100%) invert(35%) sepia(96%) saturate(462%) hue-rotate(185deg)
    brightness(96%) contrast(95%);
}

.cursor {
  display: inline-block;
  width: 4px;
  height: 16px;
  background-color: #444;
  animation: blink 1s step-end infinite;
  vertical-align: middle;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
