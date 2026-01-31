<script setup lang="ts">
import { QueueEvent } from '@/config'
import AIApi from '@/services/api/ai'
import AppsApi from '@/services/api/apps'
import type { AgentThought, GetDebugConversationMessagesWithPage } from '@/services/api/apps/types'
import type { Paginator } from '@/services/types'
import ShareMessagesModel from '@/views/components/ShareMessagesModel.vue'
import { Message } from '@arco-design/web-vue'
import { remove } from 'lodash-es'
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { useAppStore } from '../AppView.store'
import AIMessage from './debug/AIMessage.vue'
import DebugEmptyMessage from './debug/DebugEmptyMessage.vue'
import DebugHeader from './debug/DebugHeader.vue'
import HumanMessage from './debug/HumanMessage.vue'

// 输入框的值，用于存储用户输入的消息内容
const inputValue = ref('')
// 消息列表，存储所有的对话消息
const messages = ref<GetDebugConversationMessagesWithPage[]>([])
// 整体加载状态，用于控制加载动画的显示
const loading = ref(false)
// AI思考过程的加载状态
const thoughtLoading = ref(false)
// AI消息的加载状态
const aiMessageLoading = ref(false)
// 控制光标显示状态，用于显示AI正在输入的效果
const isShowCursor = ref(false)
// 控制停止响应按钮的显示状态
const isShowStopBtn = ref(false)
// 滚动容器的高度，用于计算滚动位置
const scrollerHeight = ref(0)
// 计算属性：判断发送按钮是否禁用，当AI正在思考或输入为空时禁用
const isDisabled = computed(() => thoughtLoading.value || inputValue.value.trim() === '')
// 应用状态管理store实例
const store = useAppStore()
// 分页信息对象，用于管理消息列表的分页加载
const paginator = ref<Paginator>({
  // 分页信息对象
  current_page: 1, // 当前页码
  page_size: 20, // 每页显示数量
  total_page: 0, // 总页数
  total_record: 0, // 总记录数
  created_at: 0,
})
// 滚动容器的引用，用于控制滚动行为
const scrollRef = useTemplateRef<any>('scroller')
// 当前消息的ID，用于标识正在进行的对话
const messageId = ref('')
// 当前任务的ID，用于停止响应操作
const taskId = ref('')
// 建议问题列表，存储AI生成的建议问题
const openingQuestions = ref<Array<string>>([])
const checkboxMessages = ref<Array<string>>([])
const shareMessages = ref<Array<GetDebugConversationMessagesWithPage>>([])
const isShareMessages = ref(false)
const checkedAll = ref(false)
const indeterminate = ref(false)
const shareMessagesModelVisible = ref(false)
const conversationId = ref('')
const shareMessagesLinkLoading = ref(false)

/**
 * 获取调试对话消息数据
 * @param {boolean} isLoadMore - 是否为加载更多操作，默认为false
 */
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
    // 检查应用是否存在
    if (store.app && store.app.id) {
      // 设置加载状态为true，显示加载效果
      loading.value = true

      // 调用API获取分页数据
      const resp = await AppsApi.getDebugConversationMessagesWithPage(store.app.id, {
        current_page: paginator.value.current_page,
        page_size: paginator.value.page_size,
        created_at: paginator.value.created_at,
      })

      // 将新数据追加到现有列表中
      messages.value.push(...resp.data.list)
      // 更新分页信息
      paginator.value = resp.data.paginator
      // 更新创建时间戳，用于下次分页
      paginator.value.created_at = resp.data.list[0].created_at
    }
  } catch (error) {
    // 错误处理
  } finally {
    // 无论成功失败，都重置加载状态
    loading.value = false
  }
}

/**
 * 删除当前应用的所有对话消息
 *
 * 该函数会执行以下操作：
 * 1. 检查当前应用是否存在
 * 2. 设置加载状态为true，显示加载效果
 * 3. 调用AppsApi.deleteConversationMessages接口删除对话消息
 * 4. 清空本地的消息列表
 * 5. 显示删除成功的提示消息
 * 6. 在finally块中重置加载状态
 *
 * @returns {Promise<void>}
 */
const deleteConversationMessages = async () => {
  try {
    // 检查应用是否存在
    if (store.app && store.app.id) {
      // 设置加载状态
      loading.value = true
      // 调用API删除对话消息
      const resp = await AppsApi.deleteConversationMessages(store.app.id)
      // 清空消息列表
      messages.value = []
      // 显示成功提示
      Message.success(resp.message)
    }
  } catch (error) {
    // 错误处理
  } finally {
    // 重置加载状态
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

/**
 * 发送消息到AI助手并处理响应
 *
 * 该函数执行以下操作：
 * 1. 检查发送条件（输入是否有效、应用是否存在）
 * 2. 初始化加载状态和相关变量
 * 3. 创建新消息对象并添加到消息列表
 * 4. 调用调试API发送消息
 * 5. 处理AI响应和生成建议问题
 * 6. 进行错误处理和状态重置
 *
 * @async
 * @returns {Promise<void>} 返回一个Promise，表示异步操作的完成
 *
 * @throws {Error} 当API调用失败时抛出错误
 *
 * @example
 * await sendMessage();
 */
const sendMessage = async (query?: string) => {
  // 检查是否有对话正在进行中或ID不存在，如果有则停止当前对话
  if ((!query && isDisabled.value) || !store.app?.id) {
    Message.info('对话正在进行中，请等待对话结束，或手动停止对话')
    return
  }

  // 初始化加载状态和相关变量
  thoughtLoading.value = true // 设置思考加载状态
  aiMessageLoading.value = true // 设置AI消息加载状态
  openingQuestions.value = [] // 清空建议问题列表
  messageId.value = '' // 重置消息ID
  taskId.value = '' // 重置任务ID

  // 创建新消息对象，包含必要的初始字段
  const newMessage = {
    id: '',
    conversation_id: '',
    query: query ?? inputValue.value,
    answer: '',
    total_token_count: 0,
    latency: 0,
    agent_thoughts: [],
    created_at: 0,
    image_urls: [],
  }

  // 将新消息添加到消息列表的开头
  messages.value.unshift(newMessage)

  // 保存用户输入内容
  const humanInput = query ?? inputValue.value
  // 清空输入框
  inputValue.value = ''
  // 滚动到底部以显示新消息
  if (scrollRef.value) {
    scrollRef.value.scrollToBottom()
  }

  try {
    // 调用调试API发送消息
    await AppsApi.debugApp({
      appId: store.app.id,
      req: { query: humanInput },
      onData: handleEventData,
    })

    // 如果启用了建议问题功能且存在任务ID，则生成建议问题
    if (store.draftAppConfig.suggested_after_answer.enable && taskId.value) {
      // 调用AI API生成建议问题
      const { data } = await AIApi.generateSuggestedQuestions({ message_id: messageId.value })
      // 更新建议问题列表
      openingQuestions.value = data
      // 延迟滚动到底部，确保建议问题可见
      setTimeout(() => scrollRef.value.scrollToBottom(), 360)
    }
  } catch (error) {
    // TODO: 可以添加用户友好的错误提示
  } finally {
    // 无论成功失败，都重置所有加载状态
    thoughtLoading.value = false // 重置思考加载状态
    isShowCursor.value = false // 隐藏光标
    aiMessageLoading.value = false // 重置AI消息加载状态
    isShowStopBtn.value = false // 隐藏停止按钮
  }
}

/**
 * 处理事件数据的函数
 * @param {Record<string, any>} eventResponse - 事件响应对象，包含事件类型和相关数据
 */
const handleEventData = (eventResponse: Record<string, any>) => {
  // 从事件响应中提取事件类型和数据
  const event = eventResponse.event as string
  const data = eventResponse.data
  // 获取事件ID，用于标识特定的思考过程
  const eventId = data?.id
  // 获取当前消息的思考过程列表
  const agentThoughts = messages.value[0].agent_thoughts

  // 如果是ping事件，直接返回，不做处理
  if (event === QueueEvent.ping) return

  // 显示停止响应按钮
  isShowStopBtn.value = true

  // 处理消息ID和对话ID的初始化
  if (!messageId.value && data.message_id) {
    // 设置任务ID，用于后续停止响应操作
    taskId.value = data.task_id
    // 设置消息ID，用于标识当前对话
    messageId.value = data.message_id
    // 更新第一条消息的ID和对话ID
    Object.assign(messages.value[0], {
      id: data.message_id,
      conversation_id: data.conversation_id,
    })
  }

  /**
   * 创建新的思考过程对象
   * @param {AgentThought} baseData - 基础思考数据
   * @returns {AgentThought} 新的思考过程对象
   */
  const createThought = (baseData: AgentThought) => ({
    id: eventId, // 事件ID
    position: agentThoughts.length + 1, // 在思考序列中的位置
    event: baseData.event, // 事件类型
    thought: baseData.thought, // 思考内容
    observation: baseData.observation, // 观察结果
    tool: baseData.tool, // 使用的工具
    tool_input: baseData.tool_input, // 工具输入
    latency: baseData.latency, // 延迟时间
    created_at: 0, // 创建时间
  })

  // 处理AI消息事件
  if (event === QueueEvent.agentMessage) {
    // 关闭AI消息加载状态
    aiMessageLoading.value = false
    // 显示光标，表示正在输入
    isShowCursor.value = true

    // 查找是否已存在相同ID的思考过程
    const agentThoughtIdx = agentThoughts.findIndex((item) => item.id === eventId)

    if (agentThoughtIdx === -1) {
      // 如果不存在，创建新的思考过程
      agentThoughts.push(createThought(data))
    } else {
      // 如果已存在，更新现有思考过程的内容和延迟时间
      agentThoughts[agentThoughtIdx] = {
        ...agentThoughts[agentThoughtIdx],
        thought: agentThoughts[agentThoughtIdx].thought + data.thought, // 追加新的思考内容
        latency: data.latency, // 更新延迟时间
      }
    }

    // 将新的思考内容追加到消息回答中
    messages.value[0].answer += data.thought
    messages.value[0].latency = data.latency
    messages.value[0].total_token_count = data.total_token_count
  } else {
    // 对于非AI消息事件，直接创建新的思考过程
    agentThoughts.push(createThought(data))
  }

  // 更新消息的思考过程列表
  messages.value[0].agent_thoughts = agentThoughts
  // 滚动到底部，显示最新内容
  scrollRef.value.scrollToBottom()
}

/**
 * 处理选择建议问题的函数
 * 当用户点击建议问题时触发此函数
 *
 * @param {string} question - 用户选择的建议问题文本
 * @returns {Promise<void>} - 返回一个Promise，表示异步操作的完成
 *
 * 执行流程：
 * 1. 检查传入的问题参数是否存在
 * 2. 如果问题存在，将问题文本设置到输入框中
 * 3. 调用sendMessage函数发送消息
 */
const handleSelectOpeningQuestion = async (question: string) => {
  if (question) {
    inputValue.value = question
    await sendMessage()
  }
}

/**
 * 处理停止响应的函数
 * 当用户点击停止响应按钮时触发此函数
 *
 * 执行流程：
 * 1. 检查任务ID是否存在，如果不存在则直接返回
 * 2. 检查应用是否存在，如果存在则执行停止操作
 * 3. 调用AppsApi.stopDebugChat接口停止调试对话
 * 4. 重置任务ID和停止按钮显示状态
 *
 * @returns {Promise<void>} - 返回一个Promise，表示异步操作的完成
 */
const handleStopResponse = async () => {
  // 检查任务ID是否存在，如果不存在则直接返回
  if (taskId.value == '') return

  try {
    // 检查应用是否存在
    if (store.app && store.app.id) {
      // 调用API停止调试对话
      await AppsApi.stopDebugChat(store.app.id, taskId.value)
      // 重置任务ID
      taskId.value = ''
      // 隐藏停止按钮
      isShowStopBtn.value = false
    }
  } catch (error) {
    // 错误处理：捕获并处理可能出现的异常
  }
}

const handleRegenerate = (message: GetDebugConversationMessagesWithPage) => {
  sendMessage(message.query)
}

/**
 * 处理删除消息的函数
 *
 * 该函数执行以下操作：
 * 1. 检查应用是否存在
 * 2. 设置加载状态为true，显示加载效果
 * 3. 调用AppsApi.deleteMessageById接口删除指定消息
 * 4. 从本地消息列表中移除已删除的消息
 * 5. 显示删除成功的提示消息
 * 6. 在finally块中重置加载状态
 *
 * @param {GetDebugConversationMessagesWithPage} message - 要删除的消息对象，包含消息ID等信息
 * @returns {Promise<void>} 返回一个Promise，表示异步操作的完成
 *
 * @throws {Error} 当API调用失败时抛出错误
 *
 * @example
 * await handleDeleteMessage(message);
 */
const handleDeleteMessage = async (message: GetDebugConversationMessagesWithPage) => {
  try {
    // 检查应用是否存在
    if (store.app && store.app.id) {
      // 设置加载状态
      loading.value = true
      // 调用API删除指定ID的消息
      const resp = await AppsApi.deleteMessageById(store.app.id, message.id)
      // 从消息列表中移除已删除的消息
      remove(messages.value, (item) => item.id === message.id)
      // 显示成功提示
      Message.success(resp.message)
    }
  } catch (error) {
    // 错误处理：捕获并处理可能出现的异常
  } finally {
    // 无论成功失败，都重置加载状态
    loading.value = false
  }
}

/**
 * 处理分享消息的函数
 *
 * 当用户点击单条消息的分享按钮时触发此函数，用于：
 * 1. 进入分享模式，显示分享相关的UI元素
 * 2. 初始化复选框状态
 * 3. 将当前消息添加到待分享列表中
 *
 * @param {GetDebugConversationMessagesWithPage} message - 需要分享的消息对象，包含消息ID、内容等信息
 * @returns {void} 无返回值
 */
const handleShareMessages = (message: GetDebugConversationMessagesWithPage) => {
  // 进入分享模式，显示分享相关的UI元素
  isShareMessages.value = true
  // 设置全选状态为false，因为只选中了一条消息
  checkedAll.value = false
  // 设置部分选中状态为true，表示有部分消息被选中
  indeterminate.value = true
  // 设置当前会话ID赋值给全局变量
  conversationId.value = message.conversation_id
  // 将当前消息的ID添加到已选中的消息ID列表中
  checkboxMessages.value.push(message.id)
  // 将当前消息对象添加到待分享的消息列表中
  shareMessages.value.push(message)
}

/**
 * 取消消息分享操作的函数
 *
 * 当用户点击取消分享按钮时触发此函数，用于重置所有与分享相关的状态：
 * - 退出分享模式
 * - 清空已选中的消息ID列表
 * - 清空已选中的消息对象列表
 * - 重置全选状态
 * - 重置部分选中状态
 *
 * @returns {void} 无返回值
 */
const handleCancelShareMessages = () => {
  // 退出分享模式，隐藏分享相关的UI元素
  isShareMessages.value = false
  // 清空已选中的消息ID数组
  checkboxMessages.value = []
  // 清空已选中的消息对象数组
  shareMessages.value = []
  // 重置全选状态
  checkedAll.value = false
  // 重置部分选中状态
  indeterminate.value = false
}

/**
 * 处理消息复选框状态变化的函数
 *
 * 该函数用于处理消息列表中复选框的状态变化，主要功能包括：
 * 1. 根据选中的消息数量更新全选和部分选中状态
 * 2. 维护待分享消息列表的同步更新
 *
 * @param {string[]} values - 当前选中的消息ID数组
 * @returns {void} 无返回值
 */
const handleCheckboxMessagesChange = (values: string[]) => {
  // 判断是否全选：选中的消息数量等于总消息数量
  if (values.length == messages.value.length) {
    checkedAll.value = true // 设置全选状态为true
    indeterminate.value = false // 设置部分选中状态为false
  }
  // 判断是否未选：选中的消息数量为0
  else if (values.length == 0) {
    checkedAll.value = false // 设置全选状态为false
    indeterminate.value = false // 设置部分选中状态为false
  }
  // 部分选中状态：选中的消息数量介于0和总数之间
  else {
    checkedAll.value = false // 设置全选状态为false
    indeterminate.value = true // 设置部分选中状态为true
  }

  // 清空现有的分享消息列表
  shareMessages.value = []

  // 遍历所有选中的消息ID
  values.forEach((value) => {
    // 在消息列表中查找对应的消息对象
    messages.value.forEach((item) => {
      // 如果找到匹配的消息ID，将该消息添加到分享列表中
      if (value === item.id) {
        shareMessages.value.push(item)
      }
    })
  })
}

/**
 * 处理全选/取消全选操作的函数
 *
 * 该函数用于控制消息列表的全选状态，当用户点击全选复选框时触发。
 * 它会更新以下状态：
 * - indeterminate: 部分选中状态，设置为false表示完全选中或未选中
 * - checkedAll: 全选状态，表示是否所有消息都被选中
 * - checkboxMessages: 存储被选中消息的ID数组
 * - shareMessages: 存储被选中消息的完整对象数组
 *
 * @param {boolean} value - 全选复选框的状态值，true表示全选，false表示取消全选
 * @returns {void} 无返回值
 */
const handleChangeAll = (value: boolean) => {
  // 重置部分选中状态
  indeterminate.value = false

  if (value) {
    // 全选操作
    checkedAll.value = true
    // 清空现有选中列表
    checkboxMessages.value = []
    shareMessages.value = []
    // 遍历所有消息，将消息ID和完整消息对象分别添加到对应数组中
    messages.value.forEach((item) => {
      checkboxMessages.value.push(item.id)
      shareMessages.value.push(item)
    })
  } else {
    // 取消全选操作
    checkedAll.value = false
    // 清空所有选中状态
    checkboxMessages.value = []
    shareMessages.value = []
  }
}

/**
 * 将选中的消息分享为图片
 *
 * 该函数用于触发分享消息的模态框显示，让用户可以将选中的对话消息转换为图片格式进行分享。
 * 当用户点击"分享图片"按钮时调用此函数。
 *
 * @returns {void} 无返回值
 */
const shareMessagesToImage = () => {
  // 打开分享消息的模态框
  shareMessagesModelVisible.value = true
}

/**
 * 复制分享消息链接的异步函数
 *
 * 该函数执行以下操作：
 * 1. 设置加载状态为true，显示加载效果
 * 2. 调用AppsApi.generateShareConversation接口生成分享链接
 * 3. 如果成功获取到share_id，构建完整的分享链接
 * 4. 使用navigator.clipboard.writeText将链接复制到剪贴板
 * 5. 显示复制成功的提示消息
 * 6. 调用handleCancelShareMessages重置分享状态
 * 7. 如果生成链接失败，显示错误提示
 * 8. 在catch块中处理异常情况，显示错误提示
 * 9. 在finally块中重置加载状态
 *
 * @returns {Promise<void>} 返回一个Promise，表示异步操作的完成
 *
 * @throws {Error} 当API调用失败或剪贴板操作失败时抛出错误
 *
 * @example
 * await copyShareMessagesLink();
 */
const copyShareMessagesLink = async () => {
  try {
    shareMessagesLinkLoading.value = true
    const resp = await AppsApi.generateShareConversation({
      conversation_id: conversationId.value,
      message_ids: checkboxMessages.value,
    })
    if (resp.data.share_id) {
      const shareLink = `${window.location.origin}/share/${resp.data.share_id}`
      await navigator.clipboard.writeText(shareLink)
      Message.success('复制成功')
      handleCancelShareMessages()
    } else {
      Message.error('复制失败')
    }
  } catch (error) {
    Message.error('复制失败')
  } finally {
    shareMessagesLinkLoading.value = false
  }
}

/**
 * 组件挂载时的生命周期钩子函数
 *
 * 执行流程：
 * 1. 调用fetchMessagesData获取初始消息数据
 * 2. 等待DOM更新完成后，将滚动条滚动到底部
 *
 * @returns {Promise<void>}
 */
onMounted(async () => {
  // 获取初始消息数据
  await fetchMessagesData()
  // 等待DOM更新完成
  await nextTick(() => {
    // 确保滚动容器存在
    if (scrollRef.value) {
      // 将滚动条滚动到底部，显示最新消息
      scrollRef.value.scrollToBottom()
    }
  })
})
</script>

<template>
  <div class="flex flex-col w-1/3 h-full bg-white">
    <!-- 标题和长期记忆按钮 -->
    <DebugHeader v-if="!isShareMessages" />
    <div v-else class="h-[64px] border-b border-gray-200 bg-gray-100 flex items-center px-4">
      <div class="w-full h-[64px] flex items-center justify-between mx-auto">
        <div class="flex flex-col gap-1">
          <div class="text-gray-700 font-bold text-base">分享对话</div>
          <div class="text-gray-400 text-xs">内容由 AI 生成，不能完全保障真实</div>
        </div>
        <a-button type="text" @click="handleCancelShareMessages" class="text-gray-500"
          >取消</a-button
        >
      </div>
    </div>
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
          <template v-slot="{ item, index, active }">
            <DynamicScrollerItem
              :item="item"
              :active="active"
              :data-index="item.id"
              class="flex flex-col"
            >
              <a-checkbox-group v-model="checkboxMessages" @change="handleCheckboxMessagesChange">
                <div
                  :class="`${checkboxMessages.includes(item.id) ? 'bg-blue-100 p-3 rounded-xl mb-1' : ''}`"
                >
                  <div class="flex items-center justify-start">
                    <a-checkbox v-if="isShareMessages" :value="item.id"> </a-checkbox>
                    <!-- 人类消息 -->
                    <HumanMessage :message="item" class="flex-1" />
                  </div>
                  <div class="flex items-start justify-start">
                    <a-checkbox v-if="isShareMessages" :value="item.id"> </a-checkbox>
                    <!-- AI消息 -->
                    <AIMessage
                      :message="item"
                      :opening-questions="item.id === messageId ? openingQuestions : []"
                      :is-show-dot="aiMessageLoading && item.id === messageId"
                      :is-show-cursor="isShowCursor && item.id === messageId"
                      :agent-thoughts="
                        item.agent_thoughts.sort((a: any, b: any) => a.position - b.position)
                      "
                      :latency="item.latency"
                      :total-token-count="item.total_token_count"
                      :loading="thoughtLoading && item.id === messageId"
                      :is-last-item="index === messages.length - 1"
                      :is-share-messages="isShareMessages"
                      @select-opening-question="handleSelectOpeningQuestion"
                      @regenerate="handleRegenerate"
                      @delete-message="handleDeleteMessage"
                      @share-messages="handleShareMessages"
                    />
                  </div>
                </div>
              </a-checkbox-group>
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
    <div v-if="!isShareMessages" class="flex flex-col w-full flex-shrink-0 bg-white relative">
      <div
        class="h-[66px] w-full absolute top-[-66px] linear-gradient-transparency pointer-events-none"
      ></div>
      <div class="flex items-center px-6 gap-4">
        <a-tooltip content="删除对话记录">
          <a-button
            class="flex-shrink-0"
            type="text"
            shape="circle"
            @click="deleteConversationMessages"
          >
            <template #icon><img src="@/assets/images/icon-clear.png" class="w-4 h-4" /></template>
          </a-button>
        </a-tooltip>
        <div
          class="flex flex-1 items-center h-[50px] gap-2 px-4 border border-gray-200 rounded-full gradient-input focus-within:border-blue-700"
        >
          <form @submit.prevent="sendMessage()" class="w-full">
            <input
              v-model="inputValue"
              type="text"
              :placeholder="messages.length > 0 ? '继续对话...' : '发送消息...'"
              class="flex-1 w-full outline-0 ml-1.5"
            />
          </form>
          <a-button type="text" shape="circle">
            <template #icon><img src="@/assets/images/icon-add.png" class="w-4 h-4" /></template>
          </a-button>
          <a-button :disabled="isDisabled" type="text" shape="circle" @click="sendMessage()">
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
    <div
      v-if="isShareMessages"
      class="flex items-center justify-between w-full h-[98px] flex-shrink-0 border-t border-gray-200 bg-gray-100 px-6"
    >
      <a-checkbox :model-value="checkedAll" :indeterminate="indeterminate" @change="handleChangeAll"
        >全选
      </a-checkbox>
      <div class="flex items-center gap-2">
        <a-button
          :disabled="shareMessages.length == 0"
          type="primary"
          class="bg-white border border-gray-200 text-gray-600 hover:bg-gray-200"
          @click="shareMessagesToImage"
          >分享图片</a-button
        >
        <a-button
          :loading="shareMessagesLinkLoading"
          :disabled="shareMessages.length == 0"
          type="primary"
          @click="copyShareMessagesLink"
          >复制链接</a-button
        >
      </div>
    </div>

    <ShareMessagesModel
      v-model:visible="shareMessagesModelVisible"
      :messages="shareMessages"
      @share-success="handleCancelShareMessages"
    />
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
