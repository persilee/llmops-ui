import { get, post, ssePost } from '@/services/request'
import type { PaginatorParams } from '@/services/types'
import type { AssistantAgentChatReq, GetAssistantAgentMessagesWithPageResp } from './type'

class AssistantAgentApi {
  /**
   * 获取助手代理的分页消息列表
   * @param {PaginatorParams} params - 分页参数，包含页码、每页数量等信息
   * @returns {Promise<GetAssistantAgentMessagesWithPageResp>} 返回包含分页消息列表的Promise对象
   */
  static getAssistantAgentMessagesWithPage(params: PaginatorParams) {
    return get<GetAssistantAgentMessagesWithPageResp>({
      url: '/assistant-agent/conversations',
      params: params,
    })
  }

  /**
   * 助手代理聊天功能
   * @param {Object} params - 参数对象
   * @param {AssistantAgentChatReq} params.req - 聊天请求参数，包含对话内容等信息
   * @param {Function} params.onData - 接收服务器推送数据的回调函数
   * @param {Object} params.onData.event_response - 服务器推送的事件响应数据
   * @returns {Promise} 返回一个 Promise 对象，用于处理 SSE 连接
   */
  static assistantAgentChat({
    req,
    onData,
  }: {
    req: AssistantAgentChatReq
    onData: (event_response: { [key: string]: any }) => void
  }) {
    return ssePost('/assistant-agent/chat', { body: { ...req } }, onData)
  }

  /**
   * 停止助手代理的聊天任务
   * @param taskId 聊天任务的唯一标识符
   * @returns {Promise} 返回停止操作的Promise对象
   */
  static stopAssistantAgentChat(taskId: string) {
    return post({
      url: `/assistant-agent/chat/${taskId}/stop`,
    })
  }

  /**
   * 删除助手代理的对话记录
   * @returns {Promise} 返回删除操作的Promise对象
   */
  static deleteAssistantAgentConversation() {
    return post({
      url: '/assistant-agent/conversation/delete',
    })
  }

  /**
   * 根据消息ID删除助手代理的单条消息
   * @param {string} messageId - 要删除的消息的唯一标识符
   * @returns {Promise} 返回删除操作的Promise对象
   */
  static deleteMessageById(messageId: string) {
    return post({
      url: `/assistant-agent/${messageId}/delete`,
    })
  }
}

export default AssistantAgentApi
