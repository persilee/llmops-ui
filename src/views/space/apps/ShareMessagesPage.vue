<script setup lang="ts">
import AIApi from '@/services/api/ai'
import AppsApi from '@/services/api/apps'
import type { GetAssistantAgentMessagesWithPage } from '@/services/api/assistant-agent/type'
import MarkdownRender from '@/views/components/MarkdownRender.vue'
import moment from 'moment'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const loading = ref(false)
const messages = ref<Array<GetAssistantAgentMessagesWithPage>>([])
const name = ref('')
const route = useRoute()

const getShareConversation = async () => {
  try {
    loading.value = true
    const resp = await AppsApi.getShareConversation(route.params.shareId as string)
    messages.value = resp.data.messages.reverse()
    let query = ''
    messages.value.forEach((item) => {
      query += item.query + '\n' + item.answer + '\n'
    })
    if (query.length > 2000) {
      query = query.slice(0, 2000)
    }
    const nameResp = await AIApi.generateConversationName({ query })
    name.value = nameResp.data.name
  } catch (error) {
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await getShareConversation()
})
</script>

<template>
  <div class="share-container h-full w-full overflow-scroll scrollbar-w-none">
    <a-spin :loading="loading" class="w-full h-full pt-12">
      <div class="h-full flex flex-col max-w-[900px] m-auto">
        <div class="flex-1 flex flex-col gap-2">
          <div class="bg-gray-50 rounded-xl px-10 py-16">
            <div class="flex flex-col gap-2">
              <div class="text-[26px] font-bold">{{ name ?? '分享对话' }}</div>
              <div class="text-gray-500 text-xs">
                {{ moment().locale('zh-cn').format('YYYY年MM月DD日') }} • 内容由 AI
                生成，不能完全保障真实
              </div>
            </div>
            <a-divider class="my-8" />
            <div v-for="(message, index) in messages" :key="message.id" class="flex flex-col gap-2">
              <div
                :class="`bg-gray-200 px-4 py-3 rounded-lg leading-5 self-end ${messages.length > 1 && index == messages.length - 1 ? 'mt-5' : ''}`"
              >
                {{ message.query }}
              </div>
              <div class="py-3 self-start">
                <MarkdownRender :source="message.answer" />
              </div>
            </div>
          </div>
        </div>
        <div class="h-12 flex-shrink-0 flex items-center justify-center">
          <div class="text-gray-400 font-semibold">小智 •&nbsp;</div>
          <div class="text-gray-400">你的AI助手，助力每日工作学习</div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<style scoped>
.share-container {
  background:
    top / contain url('@/assets/images/bg-share-messages.jpg') no-repeat,
    #f1f4fb fixed;
}
</style>
