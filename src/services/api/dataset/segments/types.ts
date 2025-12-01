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

export const isGetSegmentsWithPage = (data: any): data is GetSegmentsWithPage => {
  return (
    'character_count' in data &&
    'content' in data &&
    'created_at' in data &&
    'dataset_id' in data &&
    'disabled_at' in data &&
    'document_id' in data &&
    'enabled' in data &&
    'error' in data &&
    'hit_count' in data &&
    'id' in data &&
    'keywords' in data &&
    'position' in data &&
    'status' in data &&
    'token_count' in data &&
    'updated_at' in data
  )
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
