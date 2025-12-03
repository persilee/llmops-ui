export interface AccountResp {
  avatar: string
  created_at: number
  email: string
  id: string
  last_login_at: number
  last_login_ip: string
  name: string
}

export interface AuthorizeResp {
  access_token: string
  expire_at: number
}

export interface GetProviderResp {
  redirect_url: string
}

export interface PasswordLoginReq {
  email: string
  password: string
}

export interface PasswordLoginResp {
  access_token: string
  expire_at: string
  session_id: string
  user_id: string
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
