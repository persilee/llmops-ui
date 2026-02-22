import { get, post } from '@/services/request'
import type {
  AccountResp,
  AuthorizeResp,
  GetProviderResp,
  IsEmailBoundReq,
  IsEmailBoundResp,
  IsPhoneNumberBoundReq,
  IsPhoneNumberBoundResp,
  PasswordLoginReq,
  SendMailCodeReq,
  SendSMSCodeReq,
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
    return post<AuthorizeResp>({
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

  /**
   * 检查手机号是否已绑定
   * @param req 包含手机号的请求对象
   * @returns 返回检查结果的Promise对象
   */
  static isPhoneNumberBound(req: IsPhoneNumberBoundReq) {
    return post<IsPhoneNumberBoundResp>({
      url: '/account/is-phone-number-bound',
      body: req,
    })
  }

  /**
   * 检查邮箱是否已绑定
   * @param req 包含邮箱地址的请求对象
   * @returns 返回检查结果的Promise对象
   */
  static isEmailBound(req: IsEmailBoundReq) {
    return post<IsEmailBoundResp>({
      url: '/account/is-email-bound',
      body: req,
    })
  }

  /**
   * 发送短信验证码
   * @param req 包含手机号的请求对象
   * @returns 返回发送短信验证码操作的Promise对象
   */
  static sendSmsCode(req: SendSMSCodeReq) {
    return post({
      url: '/auth/send-sms-code',
      body: req,
    })
  }

  /**
   * 发送邮件验证码
   * @param req 包含邮件地址的请求对象
   * @returns 返回发送邮件验证码操作的Promise对象
   */
  static sendMailCode(req: SendMailCodeReq) {
    return post({
      url: '/auth/send-mail-code',
      body: req,
    })
  }
}

export default AccountApi
