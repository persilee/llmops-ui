export interface GetCategoriesResp {
  category: string
  icon: string
  name: string
}

export interface GetBuiltinToolsResp {
  background: string
  category: string
  description: string
  label: string
  name: string
  tools: Tool[]
  created_at: number
}

export const isGetBuiltinToolsResp = (data: any): data is GetBuiltinToolsResp => {
  return (
    'background' in data &&
    'category' in data &&
    'description' in data &&
    'label' in data &&
    'name' in data &&
    'tools' in data
  )
}

export interface Tool {
  description: string
  inputs: Input[]
  label: string
  name: string
  params: Param[]
}

export interface Input {
  description: string
  name: string
  required: boolean
  type: string
}

export interface Param {
  label: string
  name: string
  options: Option[]
  required: boolean
  type: string
}

export interface Option {
  label: string
  value: string
}

export interface GetProviderToolResp {
  created_at: number
  description: string
  inputs: Input[]
  label: string
  name: string
  params: any[]
  provider: Provider
}

export interface Input {
  description: string
  name: string
  required: boolean
  type: string
}

export interface Provider {
  background: string
  category: string
  description: string
  label: string
  name: string
}
