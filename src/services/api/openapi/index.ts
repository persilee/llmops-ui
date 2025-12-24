import { get, post, request } from '@/services/request'
import type { PaginatorParams } from '@/services/types'
import type {
  CharReq,
  CreateAPIKeyReq,
  CreateAPIKeyResp,
  GetAPIKeysWithPageResp,
  UpdateAPIKeyIsActiveReq,
  UpdateAPIKeyReq,
} from './types'

class OpenapiApi {
  /**
   * 发送聊天请求
   * @param url 请求的API地址
   * @param token 认证令牌
   * @param req 聊天请求参数
   * @returns 返回请求的Promise对象
   */
  static chat(url: string, token: string, req: CharReq) {
    return request(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: req,
    })
  }

  /**
   * 创建新的API密钥
   * @param req 创建API密钥的请求参数，包含密钥名称、描述等信息
   * @returns 返回创建API密钥的Promise对象
   */
  static createApiKey(req: CreateAPIKeyReq) {
    return post<CreateAPIKeyResp>({
      url: '/api-keys/create',
      body: req,
    })
  }

  /**
   * 分页获取API密钥列表
   * @param params 分页参数，包含页码、每页数量等信息
   * @returns 返回包含API密钥列表和分页信息的Promise对象
   */
  static getApiKeysWithPage(params: PaginatorParams) {
    return get<GetAPIKeysWithPageResp>({
      url: '/api-keys/keys',
      params,
    })
  }

  /**
   * 删除API密钥
   * @param apiKeyId API密钥的唯一标识符
   * @returns 返回请求的Promise对象
   */
  static deleteApiKey(apiKeyId: string) {
    return post({
      url: `/api-keys/${apiKeyId}/delete`,
    })
  }

  /**
   * 更新API密钥信息
   * @param apiKeyId API密钥的唯一标识符
   * @param req 更新API密钥的请求参数，包含需要更新的信息
   * @returns 返回请求的Promise对象
   */
  static updateApiKey(apiKeyId: string, req: UpdateAPIKeyReq) {
    return post({
      url: `/api-keys/${apiKeyId}/update`,
      body: req,
    })
  }

  /**
   * 更新API密钥的激活状态
   * @param apiKeyId API密钥的唯一标识符
   * @param req 更新激活状态的请求参数，包含新的激活状态信息
   * @returns 返回请求的Promise对象
   */
  static updateApiKeyIsActive(apiKeyId: string, req: UpdateAPIKeyIsActiveReq) {
    return post({
      url: `/api-keys/${apiKeyId}/update/active`,
      body: req,
    })
  }
}

export default OpenapiApi
