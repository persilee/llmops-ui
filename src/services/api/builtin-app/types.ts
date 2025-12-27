export interface GetBuiltinAppsResp {
  category: string
  created_at: number
  description: string
  icon: string
  id: string
  model_config: ModelConfig
  name: string
}

export interface ModelConfig {
  model: string
  provider: string
}

export interface GetBuiltinAppCategoriesResp {
  category: string
  name: string
}

export interface AddBuiltinAppToSpaceReq {
  builtin_app_id: string
}

export interface AddBuiltinAppToSpaceResp {
  app_id: string
}
