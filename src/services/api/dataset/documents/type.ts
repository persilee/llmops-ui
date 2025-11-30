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

export interface CreateDocumentReq {
  upload_file_ids?: string[]
  process_type?: string
  rule?: Rule
}

export interface Rule {
  pre_process_rules: PreProcessRule[]
  segment: Segment
}

export interface PreProcessRule {
  id: string
  enabled: boolean
}

export interface Segment {
  separators: string[]
  chunk_size: number
  chunk_overlap: number
}

export interface CreateDocumentResp {
  batch: string
  documents: Document[]
}

export interface Document {
  created_at: number
  id: string
  name: string
  status: string
}

export interface GetDocumentsStatusResp {
  completed_at: number
  completed_segment_count: number
  created_at: number
  error: string
  extension: string
  id: string
  indexing_completed_at: number
  mime_type: string
  name: string
  parsing_completed_at: number
  position: number
  processing_started_at: number
  segment_count: number
  size: number
  splicing_completed_at: number
  status: string
  stopped_at: number
}

export interface GetDocumentResp {
  character_count: number
  created_at: number
  dataset_id: string
  disabled_at: number
  enabled: boolean
  error: string
  hit_count: number
  id: string
  name: string
  position: number
  segment_count: number
  status: string
  updated_at: number
}
