import type { BasePaginatorResponse } from '@/services/types'

export type GetSegmentsWithPageResp = BasePaginatorResponse<GetSegmentsWithPage>

export interface GetSegmentsWithPage {
  character_count: number
  content: string
  created_at: number
  dataset_id: string
  disabled_at: number
  document_id: string
  enabled: boolean
  error: string
  hit_count: number
  id: string
  keywords: string[]
  position: number
  status: string
  token_count: number
  updated_at: number
}

export interface GetSegmentResp {
  character_count: number
  content: string
  created_at: number
  dataset_id: string
  disabled_at: number
  document_id: string
  enabled: boolean
  error: string
  hash: string
  hit_count: number
  id: string
  keywords: string[]
  position: number
  status: string
  token_count: number
  updated_at: number
}

export interface CreateSegmentReq {
  content: string
  keywords: string[]
}

export interface UpdateSegmentEnabledReq {
  enabled: boolean
}

export interface UpdateSegmentReq {
  content: string
  keywords: string[]
}
