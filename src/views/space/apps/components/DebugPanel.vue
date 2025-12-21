<script setup lang="ts">
import { QueueEvent } from '@/config'
import AIApi from '@/services/api/ai'
import AppsApi from '@/services/api/apps'
import type { GetDebugConversationMessagesWithPage } from '@/services/api/apps/types'
import type { Paginator } from '@/services/types'
import { Message } from '@arco-design/web-vue'
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { useAppStore } from '../AppView.store'
import AIMessage from './debug/AIMessage.vue'
import DebugEmptyMessage from './debug/DebugEmptyMessage.vue'
import DebugHeader from './debug/DebugHeader.vue'
import HumanMessage from './debug/HumanMessage.vue'

const inputValue = ref('')

const messages = ref<GetDebugConversationMessagesWithPage[]>([])
const loading = ref(false)
const thoughtLoading = ref(false)
const aiMessageLoading = ref(false)
const isShowCursor = ref(false)
const isShowStopBtn = ref(false)
const scrollerHeight = ref(0)
const isDisabled = computed(() => thoughtLoading.value || inputValue.value.trim() === '')
const store = useAppStore()
const paginator = ref<Paginator>({
  // 分页信息对象
  current_page: 1, // 当前页码
  page_size: 20, // 每页显示数量
  total_page: 0, // 总页数
  total_record: 0, // 总记录数
  created_at: 0,
})
const scrollRef = useTemplateRef<any>('scroller')
const messageId = ref('')
const taskId = ref('')
const openingQuestions = ref<Array<string>>([])

const fetchMessagesData = async (isLoadMore: boolean = false) => {
  // 处理分页逻辑
  if (isLoadMore) {
    // 如果是加载更多，检查是否还有下一页
    if (paginator.value.current_page >= paginator.value.total_page) return
    // 页码递增
    paginator.value.current_page++
  } else {
    // 如果是重新加载，重置页码并清空现有数据
    paginator.value.current_page = 1
    paginator.value.created_at = 0
    messages.value = []
  }
  try {
    if (store.app && store.app.id) {
      loading.value = true

      const resp = await AppsApi.getDebugConversationMessagesWithPage(store.app.id, {
        current_page: paginator.value.current_page,
        page_size: paginator.value.page_size,
        created_at: paginator.value.created_at,
      })

      // 将新数据追加到现有列表中
      messages.value.push(...resp.data.list)
      // 更新分页信息
      paginator.value = resp.data.paginator
      paginator.value.created_at = resp.data.list[0].created_at
    }
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const deleteConversationMessages = async () => {
  try {
    if (store.app && store.app.id) {
      loading.value = true
      const resp = await AppsApi.deleteConversationMessages(store.app.id)
      messages.value = []
      Message.success(resp.message)
    }
  } catch (error) {
  } finally {
    loading.value = false
  }
}

/**
 * 处理滚动事件，实现无限滚动加载功能
 * @param {Event} e - 滚动事件对象
 */
const handleScroll = async (e: Event) => {
  // 将事件目标转换为HTMLElement类型，以便访问其滚动相关属性
  const target = e.target as HTMLElement

  // 当滚动到顶部时（scrollTop <= 0），触发加载更多历史消息
  // 这样可以实现向上滚动加载更多历史记录的效果
  if (target.scrollTop <= 0) {
    // 如果正在加载中，则不重复触发加载，避免重复请求
    if (loading.value) return

    // 保存当前滚动容器的总高度，用于后续计算滚动位置
    scrollerHeight.value = scrollRef.value.$el.scrollHeight
    // 触发加载更多数据，传入true表示是加载更多操作
    await fetchMessagesData(true)
    // 加载新数据后，调整滚动位置，保持用户原来的可视位置不变
    // 通过计算新内容的高度差，将滚动位置调整到合适的位置
    scrollRef.value.$el.scrollTop = scrollRef.value.$el.scrollHeight - scrollerHeight.value
  }
}

const sendMessage = async () => {
  if (isDisabled.value) return

  try {
    if (store.app && store.app.id) {
      thoughtLoading.value = true
      aiMessageLoading.value = true

      openingQuestions.value = []
      messageId.value = ''
      taskId.value = ''

      messages.value.unshift({
        id: '',
        conversation_id: '',
        query: inputValue.value,
        answer: '',
        total_token_count: 0,
        latency: 0,
        agent_thoughts: [],
        created_at: 0,
        image_urls: [],
      })

      let position = 0
      const humanInput = inputValue.value
      inputValue.value = ''
      scrollRef.value.scrollToBottom()

      await AppsApi.debugApp({
        appId: store.app.id,
        req: { query: humanInput },
        onData: (event_response) => {
          isShowStopBtn.value = true
          const event = event_response?.event
          const data = event_response?.data
          const eventId = data.id
          const agentThoughts = messages.value[0].agent_thoughts

          if (messageId.value === '' && data.message_id) {
            taskId.value = data.task_id
            messageId.value = data.message_id
            messages.value[0].id = data.message_id
            messages.value[0].conversation_id = data.conversation_id
          }

          if (event !== QueueEvent.ping) {
            if (event === QueueEvent.agentMessage) {
              aiMessageLoading.value = false
              isShowCursor.value = true
              const agentThoughtIdx = agentThoughts.findIndex((item) => item.id === eventId)

              if (agentThoughtIdx === -1) {
                position += 1
                agentThoughts.push({
                  id: eventId,
                  position: position,
                  event: data.event,
                  thought: data.thought,
                  observation: data.observation,
                  tool: data.tool,
                  tool_input: data.tool_input,
                  latency: data.latency,
                  created_at: 0,
                })
              } else {
                agentThoughts[agentThoughtIdx] = {
                  ...agentThoughts[agentThoughtIdx],
                  thought: agentThoughts[agentThoughtIdx].thought + data.thought,
                  latency: data.latency,
                }
              }

              messages.value[0].answer += data.thought
            } else {
              position += 1
              agentThoughts.push({
                id: eventId,
                position: position,
                event: data.event,
                thought: data.thought,
                observation: data.observation,
                tool: data.tool,
                tool_input: data.tool_input,
                latency: data.latency,
                created_at: 0,
              })
            }

            messages.value[0].agent_thoughts = agentThoughts
            scrollRef.value.scrollToBottom()
          }
        },
      })

      if (store.draftAppConfig.suggested_after_answer.enable && taskId.value != '') {
        const resp = await AIApi.generateSuggestedQuestions({ message_id: messageId.value })
        openingQuestions.value = resp.data
        setTimeout(() => {
          scrollRef.value.scrollToBottom()
        }, 1000)
      }
    }
  } finally {
    thoughtLoading.value = false
    isShowCursor.value = false
    aiMessageLoading.value = false
    isShowStopBtn.value = false
  }
}

const handleSelectOpeningQuestion = async (question: string) => {
  if (question) {
    inputValue.value = question
    await sendMessage()
  }
}

const handleStopResponse = async () => {
  if (taskId.value == '') return

  try {
    if (store.app && store.app.id) {
      await AppsApi.stopDebugChat(store.app.id, taskId.value)
      taskId.value = ''

      isShowStopBtn.value = false
    }
  } catch (error) {}
}

onMounted(async () => {
  await fetchMessagesData()
  await nextTick(() => {
    if (scrollRef.value) {
      scrollRef.value.scrollToBottom()
    }
  })
})
</script>

<template>
  <div class="flex flex-col w-1/3 h-full bg-white">
    <!-- 标题和长期记忆按钮 -->
    <DebugHeader />
    <!-- 调试消息 -->
    <a-spin :loading="loading" class="flex flex-col h-full min-h-0 px-6">
      <!-- 调试消息列表 -->
      <div v-if="messages.length > 0" class="flex flex-col h-full relative">
        <DynamicScroller
          ref="scroller"
          :items="messages.slice().reverse()"
          :min-item-size="1"
          @scroll="handleScroll"
          class="scrollbar-w-none py-6"
        >
          <template v-slot="{ item, active }">
            <DynamicScrollerItem
              :item="item"
              :active="active"
              :data-index="item.id"
              class="flex flex-col"
            >
              <!-- 人类消息 -->
              <HumanMessage :message="item" />
              <!-- AI消息 -->
              <AIMessage
                :message="item"
                :opening-questions="item.id === messageId ? openingQuestions : []"
                :is-show-dot="aiMessageLoading && item.id === messageId"
                :is-show-cursor="isShowCursor && item.id === messageId"
                :agent-thoughts="
                  item.agent_thoughts.sort((a: any, b: any) => a.position - b.position)
                "
                :loading="thoughtLoading && item.id === messageId"
                @select-opening-question="handleSelectOpeningQuestion"
              />
            </DynamicScrollerItem>
          </template>
        </DynamicScroller>
        <!-- 停止响应按钮 -->
        <div
          v-if="isShowStopBtn"
          class="flex items-center justify-center absolute z-50 bottom-3 left-0 right-0"
        >
          <div
            class="inline-block py-1.5 px-3.5 border border-gray-200 bg-white rounded-lg shadow-lg cursor-pointer hover:bg-gray-300"
            @click="handleStopResponse"
          >
            <icon-record-stop />
            <span class="text-gray-900 font-bold ml-1">停止响应</span>
          </div>
        </div>
      </div>
      <!-- 空消息显示 Agent 图标和名字 -->
      <DebugEmptyMessage v-else @select-opening-question="handleSelectOpeningQuestion" />
    </a-spin>
    <!-- 输入框 -->
    <div class="flex flex-col w-full flex-shrink-0 bg-white relative">
      <div class="h-[66px] w-full absolute top-[-66px] linear-gradient-transparency"></div>
      <div class="flex items-center px-6 gap-4">
        <a-button
          class="flex-shrink-0"
          type="text"
          shape="circle"
          @click="deleteConversationMessages"
        >
          <template #icon><img src="@/assets/images/icon-clear.png" class="w-4 h-4" /></template>
        </a-button>
        <div
          class="flex flex-1 items-center h-[50px] gap-2 px-4 border border-gray-200 rounded-full focus-within:border-blue-700"
        >
          <input
            v-model="inputValue"
            type="text"
            class="flex-1 outline-0"
            @keyup.enter="sendMessage"
            @keyup.enter.exact="sendMessage"
          />
          <a-button type="text" shape="circle">
            <template #icon><img src="@/assets/images/icon-add.png" class="w-4 h-4" /></template>
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
</template>

<style scoped>
.send-icon-active {
  filter: brightness(0) saturate(100%) invert(35%) sepia(96%) saturate(462%) hue-rotate(185deg)
    brightness(96%) contrast(95%);
}

.linear-gradient-transparency {
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 1) 100%
  );
}
</style>
