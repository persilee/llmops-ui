import type { BasePaginatorResponse } from '@/services/types'

export type GetDocumentsWithPageResp = BasePaginatorResponse<GetDocumentsWithPage>

export interface GetDocumentsWithPage {
  character_count: number
  created_at: number
  disabled_at: number
  enabled: boolean
  error: string
  hit_count: number
  id: string
  name: string
  position: number
  status: string
  updated_at: number
}

export interface UpdateDocumentNameReq {
  name: string
}

export interface UpdateDocumentEnabledReq {
  enabled: boolean
}
