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
  created_at: string
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
