import { get, post } from '@/services/request'
import type { PaginatorParams } from '@/services/types'
import type {
  GetConversationMessagesWithPageResp,
  GetConversationNameResp,
  UpdateConversationIsPinnedReq,
  UpdateConversationNameReq,
} from './types'

class ConversationsApi {
  /**
   * 获取指定会话的消息列表（分页）
   * @param conversationId 会话ID
   * @param params 分页参数
   * @returns Promise<GetConversationMessagesWithPageResp> 会话消息分页响应数据
   */
  static getConversationMessagesWithPage(conversationId: string, params: PaginatorParams) {
    return get<GetConversationMessagesWithPageResp>({
      url: `/conversations/${conversationId}`,
      params: params,
    })
  }

  /**
   * 删除指定会话
   * @param conversationId 会话ID
   * @returns Promise<void>
   */
  static deleteConversation(conversationId: string) {
    return post({
      url: `/conversations/${conversationId}/delete`,
    })
  }

  /**
   * 删除指定会话中的消息
   * @param conversationId 会话ID
   * @param messageId 消息ID
   * @returns Promise<void>
   */
  static deleteMessage(conversationId: string, messageId: string) {
    return post({
      url: `/conversations/${conversationId}/message/${messageId}/delete`,
    })
  }

  /**
   * 获取会话名称
   * @param conversationId 会话ID
   * @returns Promise<GetConversationNameResp> 会话名称响应数据
   */
  static getConversationName(conversationId: string) {
    return get<GetConversationNameResp>({
      url: `/conversations/${conversationId}/name`,
    })
  }

  /**
   * 更新会话名称
   * @param conversationId 会话ID
   * @param req 更新会话名称的请求参数
   * @returns Promise<void>
   */
  static updateConversationName(conversationId: string, req: UpdateConversationNameReq) {
    return post({
      url: `/conversations/${conversationId}/name/update`,
      body: req,
    })
  }

  /**
   * 更新会话的置顶状态
   * @param conversationId 会话ID
   * @param req 更新置平状态的请求参数
   * @returns Promise<void>
   */
  static updateConversationIsPinned(conversationId: string, req: UpdateConversationIsPinnedReq) {
    return post({
      url: `/conversations/${conversationId}/pinned`,
      body: req,
    })
  }
}

export default ConversationsApi
