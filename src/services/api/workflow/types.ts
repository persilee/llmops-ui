import type { BasePaginatorResponse } from '@/services/types'

export type GetWorkflowsWithPageResp = BasePaginatorResponse<GetWorkflowsWithPage>
export interface GetWorkflowsWithPage {
  created_at: number
  description: string
  icon: string
  id: string
  is_debug_passed: boolean
  name: string
  node_count: number
  published_at: number
  status: string
  tool_call_name: string
  updated_at: number
}

export interface CreateWorkflowReq {
  description: string
  icon: string
  name: string
  tool_call_name: string
}

export interface CreateWorkflowResp {
  id: string
}

export interface GetWorkflowResp {
  created_at: number
  description: string
  icon: string
  id: string
  is_debug_passed: boolean
  name: string
  node_count: number
  published_at: number
  status: string
  tool_call_name: string
  updated_at: number
}

export interface UpdateWorkflowReq {
  description: string
  icon: string
  name: string
  tool_call_name: string
}
