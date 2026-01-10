import { get, post, ssePost } from '@/services/request'
import type { PaginatorParams } from '@/services/types'
import type {
  CreateWorkflowReq,
  CreateWorkflowResp,
  GetDraftGraphResp,
  GetWorkflowResp,
  GetWorkflowsWithPageResp,
  UpdateWorkflowReq,
} from './types'

class WorkFlowApi {
  /**
   * 分页获取工作流列表
   * @param params 查询参数，包含分页信息和可选的状态筛选
   * @returns Promise对象，返回工作流列表数据
   */
  static getWorkflowsWithPage(params: PaginatorParams & { status?: string }) {
    return get<GetWorkflowsWithPageResp>({
      url: '/workflows',
      params,
    })
  }

  /**
   * 创建工作流
   * @param req 创建工作流的请求参数，包含工作流的基本信息
   * @returns Promise对象，返回创建的工作流信息
   */
  static createWorkflow(req: CreateWorkflowReq) {
    return post<CreateWorkflowResp>({
      url: '/workflows/create',
      body: req,
    })
  }

  /**
   * 获取工作流详情
   * @param workflowId 工作流ID
   * @returns Promise对象，返回工作流详细信息
   */
  static getWorkflow(workflowId: string) {
    return get<GetWorkflowResp>({
      url: `/workflows/${workflowId}`,
    })
  }

  /**
   * 删除工作流
   * @param workflowId 工作流ID
   * @returns Promise对象
   */
  static deleteWorkflow(workflowId: string) {
    return post({
      url: `/workflows/${workflowId}/delete`,
    })
  }

  /**
   * 获取工作流草稿图
   * @param workflowId 工作流ID
   * @returns Promise对象，返回工作流草稿图数据
   */
  static getDraftGraph(workflowId: string) {
    return get<GetDraftGraphResp>({
      url: `/workflows/${workflowId}/draft`,
    })
  }

  /**
   * 更新工作流草稿图
   * @param workflowId 工作流ID
   * @param req 更新草稿图的请求参数
   * @returns Promise对象
   */
  static updateDraftGraph(workflowId: string, req: Record<string, any>) {
    return post({
      url: `/workflows/${workflowId}/draft/update`,
      body: req,
    })
  }

  /**
   * 调试工作流
   * @param params 参数对象
   * @param params.workflowId 工作流ID
   * @param params.req 调试请求参数
   * @param params.onData 接收服务器发送事件的回调函数
   * @returns Promise对象，返回调试结果
   */
  static debugWorkflow({
    workflowId,
    req,
    onData,
  }: {
    workflowId: string
    req: Record<string, any>
    onData: (event_response: { [key: string]: any }) => void
  }) {
    return ssePost(`/workflows/${workflowId}/debug`, { body: { ...req } }, onData)
  }

  /**
   * 发布工作流
   * @param workflowId 工作流ID
   * @param req 请求体参数
   * @returns Promise对象
   */
  static publishWorkflow(workflowId: string, req: Record<string, any>) {
    return post({
      url: `/workflows/${workflowId}/publish`,
      body: req,
    })
  }

  /**
   * 更新工作流
   * @param workflowId 工作流ID
   * @param req 更新工作流的请求参数
   * @returns Promise对象
   */
  static updateWorkflow(workflowId: string, req: UpdateWorkflowReq) {
    return post({
      url: `/workflows/${workflowId}/update`,
      body: req,
    })
  }

  /**
   * 取消发布工作流
   * @param workflowId 工作流ID
   * @param req 请求体参数
   * @returns Promise对象
   */
  static cancelPublishWorkflow(workflowId: string, req: Record<string, any>) {
    return post({
      url: `/workflows/${workflowId}/unpublish`,
      body: req,
    })
  }
}

export default WorkFlowApi
