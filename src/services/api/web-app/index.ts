import { get, post, ssePost } from '@/services/request'
import type {
  GetConversationsResp,
  GetPublishedConfigResp,
  GetWebAppResp,
  RegenerateWebAppTokenResp,
  WebAppChatReq,
} from './types'

class WebAppApi {
  /**
   * 获取已发布的应用配置
   * @param appId - 应用ID
   * @returns 返回包含应用配置信息的Promise对象
   */
  static getPublishedConfig(appId: string) {
    return get<GetPublishedConfigResp>({
      url: `/apps/${appId}/published/config`,
    })
  }

  /**
   * 重新生成Web应用的访问令牌
   * @param appId - 应用ID
   * @returns 返回包含新令牌信息的Promise对象
   */
  static regenerateWebAppToken(appId: string) {
    return post<RegenerateWebAppTokenResp>({
      url: `/apps/${appId}/regenerate/token`,
    })
  }

  /**
   * 获取Web应用信息
   * @param token - Web应用的访问令牌
   * @returns 返回包含Web应用信息的Promise对象
   */
  static getWebApp(token: string) {
    return get<GetWebAppResp>({
      url: `/web-apps/${token}`,
    })
  }

  /**
   * 发送Web应用聊天消息
   * @param params - 参数对象
   * @param params.token - Web应用的访问令牌
   * @param params.req - 聊天请求对象
   * @param params.onData - 接收服务器推送数据的回调函数
   * @returns 返回一个SSE连接对象
   */
  static webAppChat({
    token,
    req,
    onData,
  }: {
    token: string
    req: WebAppChatReq
    onData: (event_response: { [key: string]: any }) => void
  }) {
    return ssePost(`/web-apps/${token}/chat`, { body: { ...req } }, onData)
  }

  /**
   * 停止Web应用的聊天任务
   * @param token - Web应用的访问令牌
   * @param taskId - 要停止的聊天任务ID
   * @returns 返回一个Promise对象，表示停止操作的响应
   */
  static stopWebAppChat(token: string, taskId: string) {
    return post({
      url: `/web-apps/${token}/chat/${taskId}/stop`,
    })
  }

  /**
   * 获取Web应用的对话列表
   * @param token - Web应用的访问令牌
   * @returns 返回包含对话列表的Promise对象
   */
  static getConversations(token: string) {
    return get<GetConversationsResp[]>({
      url: `/web-apps/${token}/conversations`,
    })
  }
}

export default WebAppApi
