export interface AccountResp {
  avatar: string
  created_at: number
  email: string
  id: string
  last_login_at: number
  last_login_ip: string
  name: string
  phone_number: string
  wechat: string
  github: string
}

export interface AuthorizeResp {
  access_token: string
  expire_at: number
  is_new_user: boolean
  session_id?: string
  user_id?: string
  provider_info?: any
}

export interface GetProviderResp {
  redirect_url: string
}

export interface PasswordLoginReq {
  account: string
  password: string
}

export interface UpdateAvatarReq {
  avatar: string
}

export interface UpdateNameReq {
  name: string
}

export interface UpdatePasswordReq {
  password: string
}

export interface IsEmailBoundReq {
  email: string
}

export interface IsPhoneNumberBoundReq {
  phone_number: string
}

export interface SendSMSCodeReq {
  phone_number: string
}

export interface SendMailCodeReq {
  email: string
}

export interface IsEmailBoundResp {
  is_bound: boolean
}
export interface IsPhoneNumberBoundResp {
  is_bound: boolean
}

export interface BindEmailReq {
  code: string
  email: string
}

export interface BindPhoneNumberReq {
  code: string
  phone_number: string
}

export interface PhoneNumberLoginReq {
  code: string
  phone_number: string
}

export interface PhoneNumberBindAccountReq {
  code: string
  oauth_info: OauthInfo
  phone_number: string
}

export interface OauthInfo {
  id: string
  name: string
  email: string
  avatar: string
  provider: string
  encrypted_token: string
}

export interface PasswordBindAccountReq {
  account: string
  oauth_info: OauthInfo
  password: string
}
