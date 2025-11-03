import { get, post } from '@/services/request'
import type {
  CreateAPIToolProviderReq,
  GetAPIToolProviderResp,
  GetAPIToolProvidersWithPageParams,
  GetAPIToolProvidersWithPageResp,
  UpdateAPIToolProviderReq,
} from './types'

class APIToolsApi {
  /**
   * 分页获取API工具提供商列表
   * @param currentPage - 当前页码，可选参数
   * @param pageSize - 每页显示数量，可选参数
   * @param searchWord - 搜索关键词，可选参数
   * @returns 返回一个Promise，解析为GetAPIToolProvidersWithPageResp类型的数据
   */
  static getAPIToolProvidersWithPage(params?: GetAPIToolProvidersWithPageParams) {
    return get<GetAPIToolProvidersWithPageResp, GetAPIToolProvidersWithPageParams>({
      url: '/api-tools',
      params: {
        ...params,
      },
    })
  }

  /**
   * 验证OpenAPI Schema的有效性
   * @param openapiSchema - 需要验证的OpenAPI Schema字符串
   * @returns 返回一个Promise，解析为验证结果
   */
  static validateOpenAPISchema(openapiSchema: string) {
    return post({
      url: '/api-tools/validate-openapi-schema',
      body: {
        openapi_schema: openapiSchema,
      },
    })
  }

  /**
   * 创建API工具提供商
   * @param data - 创建API工具提供商所需的请求数据
   * @returns 返回一个Promise，解析为创建结果
   */
  static createAPIToolProvider(req: CreateAPIToolProviderReq) {
    return post({
      url: '/api-tools/create-api-tool-provider',
      body: req,
    })
  }

  /**
   * 删除API工具提供商
   * @param providerId - API工具提供商的ID
   * @returns 返回一个Promise，解析为删除结果
   */
  static deleteAPIToolProvider(providerId: string) {
    return post({
      url: `/api-tools/${providerId}/delete`,
    })
  }

  /**
   * 更新API工具提供商
   * @param providerId - API工具提供商的ID
   * @param req - 更新API工具提供商所需的请求数据
   * @returns 返回一个Promise，解析为更新结果
   */
  static updateAPIToolProvider(providerId: string, req: UpdateAPIToolProviderReq) {
    return post({
      url: `/api-tools/${providerId}`,
      body: req,
    })
  }

  /**
   * 获取API工具提供商详情
   * @param providerId - API工具提供商的ID
   * @returns 返回一个Promise，解析为GetAPIToolProviderResp类型的数据
   */
  static getAPIToolProvider(providerId: string) {
    return get<GetAPIToolProviderResp>({
      url: `/api-tools/get-api-tool-provider/${providerId}`,
    })
  }
}

export default APIToolsApi
