import { get, post } from '@/services/request'
import type {
  AccountResp,
  AuthorizeResp,
  GetProviderResp,
  PasswordLoginReq,
  PasswordLoginResp,
  UpdateAvatarReq,
  UpdateNameReq,
  UpdatePasswordReq,
} from './types'

class AccountApi {
  /**
   * 获取OAuth提供商信息
   * @param providerName OAuth提供商名称
   * @returns 返回包含OAuth提供商信息的Promise对象
   */
  static provider(providerName: string) {
    return get<GetProviderResp>({
      url: `/oauth/${providerName}`,
    })
  }

  /**
   * OAuth授权登录
   * @param providerName OAuth提供商名称
   * @param code OAuth授权码
   * @returns 返回包含授权信息的Promise对象
   */
  static authorize(providerName: string, code: string) {
    return post<AuthorizeResp>({
      url: `/oauth/authorize/${providerName}`,
      body: {
        code,
      },
    })
  }

  /**
   * 密码登录
   * @param req 包含用户名和密码的请求对象
   * @returns 返回包含登录信息的Promise对象
   */
  static passwordLogin(req: PasswordLoginReq) {
    return post<PasswordLoginResp>({
      url: '/auth/password-login',
      body: req,
    })
  }

  /**
   * 用户登出
   * @returns 返回登出操作的Promise对象
   */
  static logout() {
    return post({
      url: '/auth/logout',
    })
  }

  /**
   * 获取当前用户信息
   * @returns 返回包含当前用户信息的Promise对象
   */
  static getCurrentUser() {
    return get<AccountResp>({
      url: '/account/',
    })
  }

  /**
   * 更新用户头像
   * @param req 包含头像信息的请求对象
   * @returns 返回更新操作的Promise对象
   */
  static updateAvatar(req: UpdateAvatarReq) {
    return post({
      url: '/account/update-avatar',
      body: req,
    })
  }

  /**
   * 更新用户名
   * @param req 包含新用户名的请求对象
   * @returns 返回更新操作的Promise对象
   */
  static updateName(req: UpdateNameReq) {
    return post({
      url: '/account/update-name',
      body: req,
    })
  }

  /**
   * 更新用户密码
   * @param req 包含新密码的请求对象
   * @returns 返回更新操作的Promise对象
   */
  static updatePassword(req: UpdatePasswordReq) {
    return post({
      url: '/account/update-password',
      body: req,
    })
  }
}
