<script setup lang="ts">
import { computed, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import AppsApi from '@/services/api/apps'
import { useRoute } from 'vue-router'

const inputValue = ref('')
interface Message {
  id: number
  role: string
  content: string
}
const messages = ref<Message[]>([])
const isLoading = ref(false)
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
    const resp = await AppsApi.debugApp({
      appId: route.params.appId as string,
      body: { query: humanMsg },
    })
    const content = resp.data?.content
    messages.value.push({
      id: messages.value.length,
      role: 'ai',
      content,
    })
  } catch {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen">
    <header class="flex items-center h-[74px] bg-gray-100 border-b border-gray-200 px-4">
      顶部导航
    </header>
    <main class="flex! flex-row h-[calc(100vh-74px)]">
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
        <header
          class="flex items-center flex-shrink-0 h-16 px-4 text-xl bg-white border-b border-gray-200"
        >
          调试与预览
        </header>
        <div class="h-full min-h-0 px-6 py-7 overflow-x-hidden overflow-y-scroll scrollbar-w-none">
          <div
            v-if="messages.length === 0"
            class="flex flex-col justify-center items-center mt-[200px]"
          >
            <a-avatar class="" :size="70" shape="square">🤖</a-avatar>
            <div class="text-2xl text-neutral-950 font-semibold text-center mt-2">聊天机器人</div>
          </div>
          <div class="flex flex-row gap-2 mb-6" v-for="message in messages" :key="message.id">
            <a-avatar v-if="message.role === 'human'" class="shrink-0" :size="30">🙍🏻‍♂️</a-avatar>
            <a-avatar v-else class="shrink-0" :size="30">🤖</a-avatar>
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
              </div>
            </div>
          </div>
          <div v-show="isLoading" class="flex flex-row gap-2 mb-6">
            <a-avatar class="shrink-0" :size="30">AI</a-avatar>
            <div class="flex flex-col gap-2">
              <div class="font-semibold text-gray-700">AI</div>
              <div
                class="max-w-max bg-gray-100 text-gray-900 border border-gray-200 px-4 py-3 rounded-2xl leading-5"
              >
                <a-spin />
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
    </main>
  </div>
</template>

<style scoped>
.send-icon-active {
  filter: brightness(0) saturate(100%) invert(35%) sepia(96%) saturate(462%) hue-rotate(185deg)
    brightness(96%) contrast(95%);
}
</style>
