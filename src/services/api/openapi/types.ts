import type { BasePaginatorResponse } from '@/services/types'

export interface CharReq {
  app_id: string
  conversation_id?: string
  end_user_id?: string
  image_urls?: any[]
  query: string
  stream?: boolean
}

export interface CreateAPIKeyReq {
  is_active: boolean
  remark: string
}

export type GetAPIKeysWithPageResp = BasePaginatorResponse<GetAPIKeysWithPage>

export interface GetAPIKeysWithPage {
  api_key: string
  created_at: number
  id: string
  is_active: boolean
  remark: string
  updated_at: number
}

export interface UpdateAPIKeyReq {
  is_active: boolean
  remark: string
}

export interface UpdateAPIKeyIsActiveReq {
  is_active: boolean
}

export interface CreateAPIKeyResp {
  api_key: string
}
