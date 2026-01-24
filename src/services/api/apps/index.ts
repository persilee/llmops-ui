import { get, post, ssePost } from '@/services/request'
import type { PaginatorParams } from '@/services/types'
import type {
  CreateAppReq,
  CreateAppResp,
  DebugChatReq,
  FallbackHistoryToDraftReq,
  GetAppResp,
  GetAppsWithPageResp,
  GetDebugConversationMessagesWithPageResp,
  GetDebugConversionSummaryResp,
  GetDraftAppConfigResp,
  GetPublishHistoriesWithPageResp,
  UpdateAppReq,
  UpdateDebugConversationSummaryReq,
  UpdateDraftAppConfigReq,
} from './types'

class AppsApi {
  /**
   * 创建新应用
   * @param req 创建应用的请求参数
   * @returns 返回创建应用的响应结果
   */
  static createApp(req: CreateAppReq) {
    return post<CreateAppResp>({
      url: '/apps/create',
      body: req,
    })
  }

  /**
   * 获取应用信息
   * @param appId 应用ID
   * @returns 返回应用信息的响应结果
   */
  static getApp(appId: string) {
    return get<GetAppResp>({
      url: `/apps/${appId}`,
    })
  }

  /**
   * 更新应用信息
   * @param appId 应用ID
   * @param req 更新应用的请求参数
   * @returns 返回更新应用的响应结果
   */
  static updateApp(appId: string, req: UpdateAppReq) {
    return post({
      url: `/apps/${appId}`,
      body: req,
    })
  }

  /**
   * 删除应用
   * @param appId 应用ID
   * @returns 返回删除应用的响应结果
   */
  static deleteApp(appId: string) {
    return post({
      url: `/apps/${appId}/delete`,
    })
  }

  /**
   * 复制应用
   * @param appId 应用ID
   * @returns 返回复制应用的响应结果
   */
  static copyApp(appId: string) {
    return post({
      url: `/apps/${appId}/copy`,
    })
  }

  /**
   * 分页获取应用列表
   * @param params 分页参数
   * @returns 返回应用列表的响应结果
   */
  static getAppsWithPage(params: PaginatorParams) {
    return get<GetAppsWithPageResp>({
      url: '/apps',
      params,
    })
  }

  /**
   * 获取调试对话摘要
   * @param appId 应用ID
   * @returns 返回调试对话摘要的响应结果
   */
  static getDebugConversationSummary(appId: string) {
    return get<GetDebugConversionSummaryResp>({
      url: `/apps/${appId}/conversation/summary`,
    })
  }

  /**
   * 删除调试对话摘要
   * @param appId 应用ID
   * @returns 返回删除调试对话摘要的响应结果
   */
  static deleteDebugConversationSummary(appId: string) {
    return post({
      url: `/apps/${appId}/conversation/summary/delete`,
    })
  }

  /**
   * 更新调试对话摘要
   * @param appId 应用ID
   * @param req 更新调试对话摘要的请求参数
   * @returns 返回更新调试对话摘要的响应结果
   */
  static updateDebugConversationSummary(appId: string, req: UpdateDebugConversationSummaryReq) {
    return post({
      url: `/apps/${appId}/conversation/summary/update`,
      body: req,
    })
  }

  /**
   * 调试应用
   * @param appId 应用ID
   * @param req 调试请求参数
   * @param onData 处理服务器发送事件的回调函数
   * @returns 返回调试对话的响应结果
   */
  static debugApp({
    appId,
    req,
    onData,
  }: {
    appId: string
    req: DebugChatReq
    onData: (event_response: { [key: string]: any }) => void
  }) {
    return ssePost(`/apps/${appId}/debug`, { body: { ...req } }, onData)
  }

  /**
   * 分页获取调试对话消息列表
   * @param appId 应用ID
   * @param params 分页参数
   * @returns 返回调试对话消息列表的响应结果
   */
  static getDebugConversationMessagesWithPage(appId: string, params: PaginatorParams) {
    return get<GetDebugConversationMessagesWithPageResp>({
      url: `/apps/${appId}/debug/conversations`,
      params: params,
    })
  }

  /**
   * 删除对话消息
   * @param appId 应用ID
   * @returns 返回删除对话消息的响应结果
   */
  static deleteConversationMessages(appId: string) {
    return post({
      url: `/apps/${appId}/debug/conversations/delete`,
    })
  }

  /**
   * 停止调试对话
   * @param appId 应用ID
   * @param taskId 任务ID
   * @returns 返回停止调试对话的响应结果
   */
  static stopDebugChat(appId: string, taskId: string) {
    return post({
      url: `/apps/${appId}/debug/${taskId}/stop`,
    })
  }

  /**
   * 获取应用的草稿配置
   * @param appId 应用ID
   * @returns 返回应用草稿配置的响应结果
   */
  static getDraftAppConfig(appId: string) {
    return get<GetDraftAppConfigResp>({
      url: `/apps/${appId}/draft-config`,
    })
  }

  /**
   * 更新应用的草稿配置
   * @param appId 应用ID
   * @param req 更新草稿配置的请求参数
   * @returns 返回更新草稿配置的响应结果
   */
  static updateDraftAppConfig(appId: string, req: UpdateDraftAppConfigReq) {
    return post({
      url: `/apps/${appId}/draft-config`,
      body: req,
    })
  }

  /**
   * 将历史配置回退到草稿状态
   * @param appId 应用ID
   * @param req 回退历史配置到草稿的请求参数
   * @returns 返回回退操作的响应结果
   */
  static fallbackHistoryToDraft(appId: string, req: FallbackHistoryToDraftReq) {
    return post({
      url: `/apps/${appId}/fallback/history`,
      body: req,
    })
  }

  /**
   * 发布应用
   * @param appId 应用ID，用于指定要发布的应用
   * @returns 返回一个Promise对象，包含发布操作的响应结果
   */
  static publish(appId: string) {
    return post({
      url: `/apps/${appId}/publish`,
    })
  }

  /**
   * 取消应用发布
   * @param appId 应用ID
   * @returns 返回取消应用发布的响应结果
   */
  static cancelPublish(appId: string) {
    return post({
      url: `/apps/${appId}/publish/cancel`,
    })
  }

  /**
   * 分页获取应用的发布历史记录
   * @param appId 应用ID
   * @param params 分页参数
   * @returns 返回发布历史记录的响应结果
   */
  static getPublishHistoriesWithPage(appId: string, params: PaginatorParams) {
    return get<GetPublishHistoriesWithPageResp>({
      url: `/apps/${appId}/publish/histories`,
      params,
    })
  }

  /**
   * 删除指定消息
   * @param appId 应用ID
   * @param messageId 消息ID
   * @returns 返回删除消息的响应结果
   */
  static deleteMessageById(appId: string, messageId: string) {
    return post({
      url: `/apps/${appId}/${messageId}/delete`,
    })
  }
}

export default AppsApi
