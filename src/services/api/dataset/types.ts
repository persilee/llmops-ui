import type { BasePaginatorResponse } from '@/services/types'

export type GetDatasetsWithPageResp = BasePaginatorResponse<GetDatasetsWithPage>

export interface GetDatasetsWithPage {
  character_count: number
  created_at: number
  description: string
  document_count: number
  hit_count: number
  icon: string
  id: string
  name: string
  related_app_count: number
  updated_at: number
}

export const isGetDatasetsWithPage = (data: any): data is GetDatasetsWithPage => {
  return (
    'character_count' in data &&
    'created_at' in data &&
    'description' in data &&
    'document_count' in data &&
    'hit_count' in data &&
    'icon' in data &&
    'id' in data &&
    'name' in data &&
    'related_app_count' in data &&
    'updated_at' in data
  )
}

export interface CreateDatasetReq {
  description: string
  icon: string
  name: string
}

export interface UpdateDatasetReq {
  description: string
  icon: string
  name: string
}

export interface GetDatasetResp {
  character_count: number
  created_at: number
  description: string
  document_count: number
  hit_count: number
  icon: string
  id: string
  name: string
  related_app_count: number
  updated_at: number
}
