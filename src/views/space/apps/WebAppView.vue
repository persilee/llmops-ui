<script setup lang="ts">
import IconPinFill from '@/components/icons/IconPinFill.vue'
import { QueueEvent } from '@/config'
import AIApi from '@/services/api/ai'
import AppsApi from '@/services/api/apps'
import ConversationsApi from '@/services/api/conversations'
import type {
  AgentThought,
  GetConversationMessagesWithPage,
} from '@/services/api/conversations/types'
import WebAppApi from '@/services/api/web-app'
import type { GetConversationsResp, GetWebAppResp } from '@/services/api/web-app/types'
import type { Paginator } from '@/services/types'
import { useAccountStore } from '@/stores/account'
import ShareMessagesModel from '@/views/components/ShareMessagesModel.vue'
import { Message, Modal } from '@arco-design/web-vue'
import { remove } from 'lodash-es'
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { useAppStore } from './AppView.store'
import RenameModel from './components/RenameModel.vue'
import AIMessage from './components/debug/AIMessage.vue'
import DebugEmptyMessage from './components/debug/DebugEmptyMessage.vue'
import HumanMessage from './components/debug/HumanMessage.vue'

// 全局加载状态，用于控制页面级别的加载效果
const loading = ref(false)
// 对话消息加载状态，用于控制消息列表的加载效果
const conversationMessagesLoading = ref(false)
// Web应用信息，存储应用的基本配置信息
const webAppInfo = ref<GetWebAppResp>()
// 路由实例，用于获取当前路由参数
const route = useRoute()
// 对话列表，存储所有的历史对话记录
const conversations = ref<GetConversationsResp[]>()
// 当前选中的对话，存储当前正在进行的对话信息
const currentConversation = ref<GetConversationsResp | null>()
// 重命名对话框的显示状态
const renameVisible = ref(false)
// 消息列表，存储当前对话的所有消息
const messages = ref<GetConversationMessagesWithPage[]>([])
// 当前对话ID，用于标识当前正在进行的对话
const conversationId = ref('')
// 新建对话对象，用于创建新对话时的临时存储
const newConversation = ref<any>(null)
// 分享模式状态，控制是否进入消息分享模式
const isShareMessages = ref(false)
// 已选中的消息ID列表，用于批量操作
const checkboxMessages = ref<Array<string>>([])
// 已选中的消息对象列表，用于分享功能
const shareMessages = ref<Array<GetConversationMessagesWithPage>>([])
// 全选状态，控制消息列表的全选功能
const checkedAll = ref(false)
// 部分选中状态，用于显示部分选中的中间状态
const indeterminate = ref(false)
// 滚动容器的高度，用于计算滚动位置
const scrollerHeight = ref(0)
// 滚动容器的引用，用于控制滚动行为
const scrollRef = useTemplateRef<any>('scroller')
// 当前消息的ID，用于标识正在进行的对话
const messageId = ref('')
// 当前任务的ID，用于停止响应操作
const taskId = ref('')
// 建议问题列表，存储AI生成的建议问题
const openingQuestions = ref<Array<string>>([])
// AI消息的加载状态
const aiMessageLoading = ref(false)
// 控制光标显示状态，用于显示AI正在输入的效果
const isShowCursor = ref(false)
// AI思考过程的加载状态
const thoughtLoading = ref(false)
// 输入框的值，用于存储用户输入的消息内容
const inputValue = ref('')
// 计算属性：判断发送按钮是否禁用，当AI正在思考或输入为空时禁用
const isDisabled = computed(() => thoughtLoading.value || inputValue.value.trim() === '')
// 控制停止响应按钮的显示状态
const isShowStopBtn = ref(false)
// 分页器配置对象，包含当前页码、每页条数、总页数和总记录数
const paginator = ref<Paginator>({
  current_page: 1, // 当前页码
  page_size: 20, // 每页显示条数
  total_page: 0, // 总页数
  total_record: 0, // 总记录数
})
// 控制分享消息模态框的显示状态
const shareMessagesModelVisible = ref(false)
// 控制复制分享链接时的加载状态
const shareMessagesLinkLoading = ref(false)
// 获取应用状态管理store实例
const store = useAppStore()
const accountStore = useAccountStore()

/**
 * 获取对话消息的异步函数
 *
 * 该函数用于从服务器获取指定对话的消息记录，支持分页加载功能。执行以下操作：
 * 1. 处理分页逻辑：根据isLoadMore参数决定是加载更多还是重新加载
 * 2. 调用ConversationsApi.getConversationMessagesWithPage接口获取消息数据
 * 3. 更新本地消息列表和分页信息
 * 4. 进行错误处理和加载状态管理
 *
 * @param {string} conversationId - 对话ID，用于标识要获取消息的特定对话
 * @param {boolean} isLoadMore - 是否为加载更多操作，默认为false
 *                           - true: 加载更多消息，页码递增
 *                           - false: 重新加载，重置页码并清空现有数据
 * @returns {Promise<void>} 返回一个Promise，表示异步操作的完成
 *
 * @throws {Error} 当API调用失败时抛出错误，错误信息会通过Message组件显示
 */
const getConversationMessages = async (conversationId: string, isLoadMore: boolean = false) => {
  // 处理分页逻辑
  if (isLoadMore) {
    // 如果是加载更多，检查是否还有下一页
    if (paginator.value.current_page >= paginator.value.total_page) return
    // 页码递增
    paginator.value.current_page++
  } else {
    // 如果是重新加载，重置页码并清空现有数据
    paginator.value.current_page = 1
    messages.value = []
  }

  try {
    if (webAppInfo.value && webAppInfo.value.id) {
      // 开启加载状态
      conversationMessagesLoading.value = true
      // 调用API获取数据
      const resp = await ConversationsApi.getConversationMessagesWithPage(conversationId, {
        current_page: paginator.value.current_page,
        page_size: paginator.value.page_size,
      })

      // 将新数据追加到现有列表中
      messages.value.push(...resp.data.list)
      // 更新分页信息
      paginator.value = resp.data.paginator
    }
  } catch (err) {
    // 错误处理：显示错误提示信息
    const errorMessage = err instanceof Error ? err.message : '数据加载失败'
    Message.error(errorMessage)
  } finally {
    // 无论成功失败都关闭加载状态
    conversationMessagesLoading.value = false
  }
}

/**
 * 获取对话列表的异步函数
 *
 * 该函数用于从服务器获取当前应用的所有对话记录，执行以下操作：
 * 1. 设置加载状态，显示加载效果
 * 2. 调用WebAppApi.getConversations接口获取对话列表
 * 3. 将获取到的对话列表数据存储到本地状态中
 * 4. 在finally块中重置加载状态
 *
 * @param {boolean} isLoading - 是否显示加载状态，默认为false
 * @returns {Promise<void>} 返回一个Promise，表示异步操作的完成
 *
 * @throws {Error} 当API调用失败时抛出错误
 *
 * @example
 * // 获取对话列表并显示加载状态
 * await getConversations(true);
 */
const getConversations = async (isLoading: boolean = false) => {
  try {
    // 设置加载状态，显示加载效果
    loading.value = isLoading
    // 调用API获取对话列表数据
    const resp = await WebAppApi.getConversations(route.params.token as string)
    // 将获取到的对话列表存储到本地状态中
    conversations.value = resp.data
  } catch (error) {
    // 错误处理：捕获并处理可能出现的异常
  } finally {
    // 无论成功失败，都重置加载状态
    loading.value = false
  }
}

/**
 * 获取初始数据的异步函数
 *
 * 该函数负责在组件初始化时获取必要的数据，包括：
 * 1. Web应用的基本信息
 * 2. 历史对话列表
 * 3. 如果存在当前对话ID，则加载该对话的消息记录
 *
 * 执行流程：
 * - 设置加载状态为true，显示加载效果
 * - 使用Promise.all并行请求Web应用信息和对话列表
 * - 更新本地状态存储获取到的数据
 * - 检查并加载当前对话的消息记录
 * - 在finally块中重置加载状态
 *
 * @returns {Promise<void>} 返回一个Promise，表示异步操作的完成
 *
 * @throws {Error} 当API调用失败时抛出错误
 */
const fetchData = async () => {
  try {
    // 设置加载状态，显示加载效果
    loading.value = true
    // 并行请求Web应用信息和对话列表数据
    const [webAppInfoResp, conversationsResp] = await Promise.all([
      WebAppApi.getWebApp(route.params.token as string),
      WebAppApi.getConversations(route.params.token as string),
    ])
    // 更新Web应用信息
    webAppInfo.value = webAppInfoResp.data
    // 更新对话列表
    conversations.value = conversationsResp.data
    // 从store中获取当前对话ID
    conversationId.value = store.conversationId
    // 如果存在当前对话ID，则加载该对话的消息记录
    if (conversationId.value) {
      currentConversation.value = conversations.value.find(
        (conversation) => conversation.id === conversationId.value,
      )
      await getConversationMessages(conversationId.value)
    }
  } catch (error) {
    // 错误处理：捕获并处理可能出现的异常
  } finally {
    // 无论成功失败，都重置加载状态
    loading.value = false
  }
}

/**
 * 创建新对话的函数
 *
 * 该函数用于初始化一个新的对话会话，执行以下操作：
 * 1. 创建一个新的对话对象，包含默认的对话信息
 * 2. 清空当前对话ID和store中的对话ID
 * 3. 清空消息列表，为新对话做准备
 *
 * @returns {void} 无返回值
 *
 * @example
 * // 当用户点击"新增对话"按钮时调用
 * addConversation();
 */
const addConversation = () => {
  // 创建一个新的对话对象，包含默认的对话信息
  currentConversation.value = {
    name: '新对话', // 对话名称
    created_at: 0, // 创建时间戳
    id: '', // 对话ID，初始为空
    summary: '', // 对话摘要
    is_pinned: false, // 是否置顶
  }
  // 清空当前对话ID
  conversationId.value = ''
  // 清空store中保存的对话ID
  store.conversationId = ''
  // 清空消息列表，为新对话做准备
  messages.value = []
}

/**
 * 切换到指定对话的函数
 *
 * 该函数执行以下操作：
 * 1. 更新当前对话ID
 * 2. 将对话ID保存到store中
 * 3. 设置当前对话对象
 * 4. 加载该对话的消息记录
 *
 * @param {GetConversationsResp} conversation - 要切换到的对话对象，包含对话ID、名称等信息
 * @returns {void} 无返回值
 *
 * @example
 * // 当用户点击某个对话时调用
 * changeConversation({
 *   id: '123',
 *   name: '对话名称',
 *   created_at: 1234567890,
 *   summary: '对话摘要',
 *   is_pinned: false
 * });
 */
const changeConversation = (conversation: GetConversationsResp) => {
  // 更新当前对话ID
  conversationId.value = conversation.id
  // 将对话ID保存到store中，实现状态持久化
  store.conversationId = conversation.id
  // 设置当前对话对象，用于显示对话信息
  currentConversation.value = conversation
  // 加载该对话的消息记录
  getConversationMessages(conversation.id)
}

/**
 * 切换对话置顶状态的异步函数
 *
 * 该函数执行以下操作：
 * 1. 设置加载状态为true，显示加载效果
 * 2. 调用API更新指定对话的置顶状态（取反）
 * 3. 刷新对话列表以获取最新数据
 * 4. 在finally块中重置加载状态
 *
 * @param {GetConversationsResp} conversation - 需要切换置顶状态的对话对象
 * @returns {Promise<void>} 返回一个Promise，表示异步操作的完成
 *
 * @throws {Error} 当API调用失败时抛出错误
 *
 * @example
 * await changeIsPinned({
 *   id: '123',
 *   name: '对话名称',
 *   is_pinned: false
 * });
 */
const changeIsPinned = async (conversation: GetConversationsResp) => {
  try {
    // 设置加载状态，显示加载效果
    loading.value = true
    // 调用API更新对话的置顶状态（取反）
    await ConversationsApi.updateConversationIsPinned(conversation.id, {
      is_pinned: !conversation.is_pinned,
    })
    // 刷新对话列表，获取最新数据
    await getConversations(true)
  } catch (error) {
    // 错误处理：捕获并处理可能出现的异常
  } finally {
    // 无论成功失败，都重置加载状态
    loading.value = false
  }
}

/**
 * 分享当前对话的函数
 *
 * 当用户点击分享按钮时触发此函数，用于：
 * 1. 进入分享模式，显示分享相关的UI元素
 * 2. 自动选中当前对话中的所有消息，方便用户进行分享操作
 *
 * @returns {void} 无返回值
 */
const shareConversation = () => {
  // 进入分享模式，显示分享相关的UI元素
  isShareMessages.value = true
  // 自动选中所有消息，方便用户进行分享操作
  handleChangeAll(true)
}

/**
 * 处理更新对话名称的函数
 *
 * 该函数用于触发对话重命名操作，执行以下步骤：
 * 1. 显示重命名对话框，允许用户输入新的对话名称
 * 2. 设置当前要重命名的对话对象，用于后续的更新操作
 *
 * @param {GetConversationsResp} conversation - 需要重命名的对话对象，包含对话ID、名称等信息
 * @returns {void} 无返回值
 *
 * @example
 * // 当用户点击重命名按钮时调用
 * handleUpdateName({
 *   id: '123',
 *   name: '当前对话名称',
 *   created_at: 1234567890,
 *   summary: '对话摘要',
 *   is_pinned: false
 * })
 */
const handleUpdateName = (conversation: GetConversationsResp) => {
  // 显示重命名对话框
  renameVisible.value = true
  // 设置当前要重命名的对话对象
  currentConversation.value = conversation
}

/**
 * 更新对话名称的异步函数
 *
 * 该函数执行以下操作：
 * 1. 检查当前对话是否存在且具有有效ID
 * 2. 设置加载状态为true，显示加载效果
 * 3. 调用ConversationsApi.updateConversationName接口更新对话名称
 * 4. 刷新对话列表以获取最新数据
 * 5. 在finally块中重置加载状态
 *
 * @param {string} name - 新的对话名称
 * @returns {Promise<void>} 返回一个Promise，表示异步操作的完成
 *
 * @throws {Error} 当API调用失败时抛出错误
 *
 * @example
 * await updateName('新的对话名称');
 */
const updateName = async (name: string) => {
  try {
    if (currentConversation.value && currentConversation.value.id) {
      loading.value = true
      await ConversationsApi.updateConversationName(currentConversation.value?.id, {
        name: name,
      })
      await getConversations(true)
    }
  } catch (error) {
  } finally {
    loading.value = false
  }
}

/**
 * 删除对话的函数
 *
 * 该函数会显示一个确认对话框，当用户确认后执行删除操作：
 * 1. 调用API删除指定对话
 * 2. 刷新对话列表
 * 3. 如果删除的是当前对话，则清空相关状态
 * 4. 显示操作结果提示
 *
 * @param {GetConversationsResp} conversation - 要删除的对话对象
 */
const deleteConversation = (conversation: GetConversationsResp) => {
  // 显示警告对话框，要求用户确认删除操作
  Modal.warning({
    title: '确定删除对话？', // 对话框标题
    content: '删除后，聊天记录将不可恢复。', // 提示内容
    titleAlign: 'start', // 标题左对齐显示
    hideCancel: false, // 显示取消按钮，允许用户取消操作
    simple: false, // 使用完整模式显示对话框
    modalClass: 'delete-modal', // 自定义样式类名
    okText: '删除', // 确认按钮文本

    // 确认删除后的回调函数
    onOk: async () => {
      try {
        // 设置加载状态，显示加载效果
        loading.value = true

        // 调用API删除指定ID的对话
        const resp = await ConversationsApi.deleteConversation(conversation.id)

        // 刷新对话列表，获取最新数据
        await getConversations(true)

        // 如果删除的是当前正在查看的对话，需要清空相关状态
        if (conversation.id == conversationId.value) {
          conversationId.value = '' // 清空当前对话ID
          store.conversationId = '' // 清空store中的对话ID
          currentConversation.value = null // 清空当前对话对象
          messages.value = [] // 清空消息列表
        }

        // 显示删除成功的提示消息
        Message.success(resp.message)
      } catch (error) {
        // 错误处理：捕获并处理可能出现的异常
        // TODO: 可以添加具体的错误处理逻辑
      } finally {
        // 无论成功失败，都重置加载状态
        loading.value = false
      }
    },
  })
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
    await getConversationMessages(conversationId.value, true)
    // 加载新数据后，调整滚动位置，保持用户原来的可视位置不变
    // 通过计算新内容的高度差，将滚动位置调整到合适的位置
    scrollRef.value.$el.scrollTop = scrollRef.value.$el.scrollHeight - scrollerHeight.value
  }
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
  if (!query && isDisabled.value) {
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
    await WebAppApi.webAppChat({
      token: route.params.token as string,
      req: { query: humanInput, conversation_id: conversationId.value },
      onData: handleEventData,
    })

    // 检查是否满足生成建议问题的条件：
    // 1. 应用配置中启用了建议问题功能
    // 2. 存在当前任务ID
    // 3. 存在当前消息ID
    if (
      webAppInfo.value?.app_config.suggested_after_answer.enable &&
      taskId.value &&
      messageId.value
    ) {
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
const handleEventData = async (eventResponse: Record<string, any>) => {
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
  } else if (event === QueueEvent.error) {
    messages.value[0].answer = data.observation
  } else if (event === QueueEvent.timeout) {
    messages.value[0].answer = '请求超时，请稍后重试'
  } else {
    // 对于非AI消息事件，直接创建新的思考过程
    agentThoughts.push(createThought(data))
  }

  // 更新消息的思考过程列表
  messages.value[0].agent_thoughts = agentThoughts
  // 滚动到底部，显示最新内容
  scrollRef.value.scrollToBottom()

  if (conversationId.value == '') {
    await getConversations()
    conversationId.value = messages.value[0].conversation_id
    store.conversationId = conversationId.value
    currentConversation.value = conversations.value?.find((item) => item.id == conversationId.value)
  }
}

/**
 * 删除单条消息的函数
 *
 * 该函数执行以下操作：
 * 1. 设置加载状态为true，显示加载效果
 * 2. ConversationsApi.deleteMessage接口删除指定ID的消息
 * 3. 从本地消息列表中移除该消息
 * 4. 显示删除成功的提示消息
 * 5. 在finally块中重置加载状态
 *
 * @param {GetConversationMessagesWithPage} message - 要删除的消息对象，包含消息ID等信息
 * @returns {Promise<void>} 返回一个Promise，表示异步操作的完成
 */
const handleDeleteMessage = async (message: GetConversationMessagesWithPage) => {
  try {
    if (currentConversation.value && currentConversation.value.id) {
      // 设置加载状态，显示加载效果
      loading.value = true
      // 调用API删除指定ID的消息
      const resp = await ConversationsApi.deleteMessage(currentConversation.value?.id, message.id)
      // 从本地消息列表中移除该消息
      remove(messages.value, (item) => item.id === message.id)
      // 显示删除成功的提示消息
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
 * 重新发送消息
 * @param message
 */
const handleRegenerate = (message: GetConversationMessagesWithPage) => {
  sendMessage(message.query)
}

/**
 * 处理分享消息的函数
 *
 * 当用户点击单条消息的分享按钮时触发此函数，用于：
 * 1. 进入分享模式，显示分享相关的UI元素
 * 2. 初始化复选框状态
 * 3. 将当前消息添加到待分享列表中
 *
 * @param {GetConversationMessagesWithPage} message - 需要分享的消息对象，包含消息ID、内容等信息
 * @returns {void} 无返回值
 */
const handleShareMessages = (message: GetConversationMessagesWithPage) => {
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
 * 处理停止响应的函数
 * 当用户点击停止响应按钮时触发此函数
 *
 * 执行流程：
 * 1. 检查任务ID是否存在，如果不存在则直接返回
 * 2. 调用AppsApi.stopDebugChat接口停止调试对话
 * 3. 重置任务ID和停止按钮显示状态
 *
 * @returns {Promise<void>} - 返回一个Promise，表示异步操作的完成
 */
const handleStopResponse = async () => {
  // 检查任务ID是否存在，如果不存在则直接返回
  if (taskId.value == '') return

  try {
    // 调用API停止调试对话
    await WebAppApi.stopWebAppChat(route.params.token as string, taskId.value)
    // 重置任务ID
    taskId.value = ''
    // 隐藏停止按钮
    isShowStopBtn.value = false
  } catch (error) {
    // 错误处理：捕获并处理可能出现的异常
  }
}

/**
 * 删除当前应用的所有对话消息
 *
 * 该函数会执行以下操作：
 * 1. 设置加载状态为true，显示加载效果
 * 2. 调用AppsApi.deleteConversationMessages接口删除对话消息
 * 3. 清空本地的消息列表
 * 4. 显示删除成功的提示消息
 * 5. 在finally块中重置加载状态
 *
 * @returns {Promise<void>}
 */
const deleteConversationMessages = async () => {
  try {
    // 设置加载状态
    loading.value = true
    // 调用API删除对话消息
    const resp = await ConversationsApi.deleteConversation(conversationId.value)
    // 清空消息列表
    messages.value = []
    // 显示成功提示
    Message.success(resp.message)
  } catch (error) {
    // 错误处理
  } finally {
    // 重置加载状态
    loading.value = false
  }
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

onMounted(async () => {
  await fetchData()
})
</script>

<template>
  <div
    :class="`flex min-h-screen h-full bg-gray-50 ${accountStore.codeEditorVisible ? 'w-1/2' : 'w-full'}`"
  >
    <!-- 左侧会话记录 -->
    <div class="w-[260px] flex-shrink-0 bg-gray-50 p-2">
      <div
        class="w-full h-full bg-white flex flex-col rounded-lg p-4 border border-gray-50 shadow-xs"
      >
        <!-- 顶部应用信息 -->
        <div class="flex items-center gap-3 mb-6 flex-shrink-0">
          <a-avatar
            :size="32"
            shape="square"
            :image-url="webAppInfo?.icon"
            class="flex-shrink-0 bg-transparent"
          />
          <div class="flex-1 text-base font-semibold line-clamp-1 break-all text-gray-700">
            <a-skeleton :loading="loading" animation>
              <a-skeleton-line :rows="1" :line-height="26" :line-spacing="4" />
            </a-skeleton>
            {{ webAppInfo?.name }}
          </div>
        </div>
        <!-- 新增会话 -->
        <a-button
          type="primary"
          long
          class="rounded-lg mb-6 flex-shrink-0"
          @click="addConversation"
        >
          <template #icon>
            <icon-edit />
          </template>
          新增对话
        </a-button>
        <!-- 会话列表 -->
        <div class="flex-1 overflow-scroll scrollbar-w-none">
          <!-- 对话列表 -->
          <div class="mb-4">
            <div class="text-gray-400 pl-1 mb-2 text-xs font-semibold">历史对话</div>
            <!-- 空白骨架屏 -->
            <a-skeleton :loading="loading" animation>
              <a-skeleton-line :rows="2" :line-height="26" :line-spacing="4" />
            </a-skeleton>
            <!-- 会话列表 -->
            <div class="flex flex-col gap-1">
              <div
                v-for="conversation in conversations"
                :key="conversation.id"
                @click="() => changeConversation(conversation)"
                :class="`group flex items-center gap-1 h-8 leading-8 px-1.5 text-gray-700 rounded-lg cursor-pointer ${conversationId === conversation.id ? 'bg-gray-200 text-gray-800 font-bold' : ''} hover:bg-gray-200`"
              >
                <icon-message class="flex-shrink-0 mr-1" />
                <div class="flex-1 flex items-center">
                  <div class="line-clamp-1 break-all">
                    {{ conversation.name }}
                  </div>
                  <IconPinFill
                    class="w-2.5 h-2.5 ml-1 text-gray-500"
                    v-if="conversation.is_pinned"
                  />
                </div>
                <a-dropdown position="br">
                  <a-button
                    size="mini"
                    type="text"
                    class="!text-inherit !bg-transparent invisible group-hover:visible"
                    @click.stop
                  >
                    <template #icon>
                      <icon-more />
                    </template>
                  </a-button>
                  <template #content>
                    <a-doption @click="() => changeIsPinned(conversation)">
                      <div class="flex items-center gap-2">
                        <img
                          v-if="!conversation.is_pinned"
                          src="@/assets/images/icon-pin.svg"
                          class="w-3.5 h-3.5"
                        />
                        <img v-else src="@/assets/images/icon-pin-off.svg" class="w-3.5 h-3.5" />
                        {{ conversation.is_pinned ? '取消置顶' : '置顶' }}
                      </div>
                    </a-doption>
                    <a-doption
                      @click="shareConversation"
                      :disabled="!(conversation.id == conversationId)"
                    >
                      <div class="flex items-center gap-2">
                        <icon-share-alt />
                        分享
                      </div>
                    </a-doption>
                    <a-doption @click="() => handleUpdateName(conversation)">
                      <div class="flex items-center gap-2">
                        <icon-edit />
                        重命名
                      </div>
                    </a-doption>
                    <a-doption class="text-red-600" @click="() => deleteConversation(conversation)">
                      <div class="flex items-center gap-2">
                        <icon-delete />
                        删除
                      </div>
                    </a-doption>
                  </template>
                </a-dropdown>
              </div>
            </div>
            <!-- 空会话列表 -->
            <a-empty v-if="!newConversation && !conversations && !loading" class="mt-16">
              <template #image>
                <icon-empty :size="36" />
              </template>
              暂无对话
            </a-empty>
          </div>
        </div>
      </div>
    </div>
    <!-- 右侧对话窗口 -->
    <div class="flex-1 flex flex-col min-h-screen bg-gray-50">
      <!-- 顶部会话名称 -->
      <div
        v-if="messages.length > 0 && !isShareMessages"
        class="flex-shrink-0 h-[56px] flex items-center justify-between px-4"
      >
        <div class="flex flex-col gap-1">
          <div class="text-gray-700 font-bold">{{ currentConversation?.name }}</div>
          <div class="text-xs text-gray-400">内容由 AI 生成</div>
        </div>
        <a-tooltip content="分享对话">
          <a-button type="text" @click="shareConversation">
            <template #icon>
              <icon-share-alt class="text-gray-700 w-4.5 h-4.5" />
            </template>
          </a-button>
        </a-tooltip>
      </div>
      <!-- 中间消息列表 -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="flex justify-center items-center h-full"></div>
      </div>
      <!-- 底部对话消息列表 -->
      <div :class="`flex-1 ${isShareMessages ? 'relative pt-[56px]' : ''}`">
        <div
          v-if="isShareMessages"
          class="h-[56px] border-b border-gray-200 bg-gray-50 flex items-center absolute top-0 left-0 right-0 z-10"
        >
          <div class="w-[780px] flex items-center justify-between mx-auto">
            <div class="flex flex-col gap-1">
              <div class="text-gray-700 font-bold text-base">分享对话</div>
              <div class="text-gray-400 text-xs">内容由 AI 生成，不能完全保障真实</div>
            </div>
            <a-button type="text" @click="handleCancelShareMessages" class="text-gray-500"
              >取消</a-button
            >
          </div>
        </div>
        <a-spin :loading="loading" class="w-full h-full">
          <div class="w-full h-full max-w-[780px] mx-auto">
            <div :class="`flex flex-col w-full h-[calc(100vh-156px)]  px-6`">
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
                      <a-checkbox-group
                        v-model="checkboxMessages"
                        @change="handleCheckboxMessagesChange"
                      >
                        <div
                          :class="`${checkboxMessages.includes(item.id) ? 'bg-blue-100 p-3 rounded-xl mb-1' : ''}`"
                        >
                          <div class="flex items-center justify-center">
                            <a-checkbox v-if="isShareMessages" :value="item.id"> </a-checkbox>
                            <!-- 人类消息 -->
                            <HumanMessage :message="item" class="flex-1" />
                          </div>
                          <!-- AI消息 -->
                          <div class="flex items-center justify-center">
                            <a-checkbox v-if="isShareMessages" :value="item.id"> </a-checkbox>
                            <AIMessage
                              class="flex-1"
                              :message="item"
                              :opening-questions="item.id === messageId ? openingQuestions : []"
                              :is-show-dot="aiMessageLoading && item.id === messageId"
                              :is-show-cursor="isShowCursor && item.id === messageId"
                              :agent-thoughts="
                                item.agent_thoughts.sort(
                                  (a: any, b: any) => a.position - b.position,
                                )
                              "
                              :latency="item.latency"
                              :total-token-count="item.total_token_count"
                              :loading="thoughtLoading && item.id === messageId"
                              :is-last-item="index === messages.length - 1"
                              :icon="item.icon"
                              :name="item.name"
                              :is-share-messages="isShareMessages"
                              @select-opening-question="handleSelectOpeningQuestion"
                              @delete-message="handleDeleteMessage"
                              @regenerate="handleRegenerate"
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
              <DebugEmptyMessage
                v-else
                :icon="webAppInfo?.icon"
                :name="webAppInfo?.name"
                :opening-statement="webAppInfo?.app_config.opening_statement"
                :opening-questions="webAppInfo?.app_config.opening_questions"
                @select-opening-question="handleSelectOpeningQuestion"
              />
            </div>
            <!-- 输入框 -->
            <div v-if="!isShareMessages" class="flex flex-col w-full flex-shrink-0 relative">
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
                    <template #icon
                      ><img src="@/assets/images/icon-clear.png" class="w-4 h-4"
                    /></template>
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
                    <template #icon
                      ><img src="@/assets/images/icon-add.png" class="w-4 h-4"
                    /></template>
                  </a-button>
                  <a-button
                    :disabled="isDisabled"
                    type="text"
                    shape="circle"
                    @click="sendMessage()"
                  >
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
              class="flex items-center justify-between w-full h-[100px] flex-shrink-0 border-t border-gray-200"
            >
              <a-checkbox
                :model-value="checkedAll"
                :indeterminate="indeterminate"
                @change="handleChangeAll"
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
          </div>
        </a-spin>
        <ShareMessagesModel
          v-model:visible="shareMessagesModelVisible"
          :messages="shareMessages"
          @share-success="handleCancelShareMessages"
        />
      </div>
    </div>
    <RenameModel
      v-model:visible="renameVisible"
      :conversation="currentConversation"
      @update-name="updateName"
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
    rgba(251, 249, 250, 0) 0%,
    rgba(251, 249, 250, 0.5) 50%,
    rgba(251, 249, 250, 1) 100%
  );
}
</style>
