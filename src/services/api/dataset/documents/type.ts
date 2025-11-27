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

export interface DatasetHitReq {
  k: number
  query?: string
  retrieval_strategy: string
  score: number
}

export interface DatasetHitResp {
  character_count: number
  content: string
  created_at: number
  dataset_id: string
  disabled_at: number
  document: Document
  enabled: boolean
  error: string
  hit_count: number
  id: string
  keywords: string[]
  position: number
  score: number
  status: string
  token_count: number
  updated_at: number
}

export interface Document {
  extension: string
  id: string
  mime_type: string
  name: string
}

export interface GetDatasetQueriesResp {
  created_at: number
  dataset_id: string
  id: string
  query: string
  source: string
}

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

export interface UpdateSegmentReq {
  content: string
  keywords: string[]
}
