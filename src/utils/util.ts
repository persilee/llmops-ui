import { BASE_URL } from '@/config'
import {
  isGetAPIToolProvidersWithPage,
  type GetAPIToolProvidersWithPage,
} from '@/services/api/api-tool/types'
import { isGetBuiltinToolsResp, type GetBuiltinToolsResp } from '@/services/api/builtin-tool/types'
import { isGetDatasetsWithPage, type GetDatasetsWithPage } from '@/services/api/dataset/types'

/**
 * 获取工具图标URL
 * @returns {string} 返回图标的URL地址
 *  - 如果是内置工具，返回内置工具图标路径
 *  - 如果是API工具提供商，返回其icon属性
 *  - 其他情况返回空字符串
 */
export const getIcon = (
  data: GetBuiltinToolsResp | GetAPIToolProvidersWithPage | GetDatasetsWithPage,
): string => {
  if (isGetBuiltinToolsResp(data)) {
    return `${BASE_URL}/builtin-tools/${data.name}/icon`
  }
  if (isGetAPIToolProvidersWithPage(data)) {
    return data.icon
  }
  if (isGetDatasetsWithPage(data)) {
    return data.icon
  }
  return ''
}

export const getBackground = (data: GetBuiltinToolsResp | GetAPIToolProvidersWithPage | any) => {
  if (isGetBuiltinToolsResp(data)) {
    return data.background
  } else {
    return '#ffffff'
  }
}

/**
 * 获取工具名称
 * @returns {string} 返回工具的显示名称
 *  - 如果是内置工具，返回其label属性
 *  - 如果是API工具提供商，返回其name属性
 *  - 其他情况返回空字符串
 */
export const getName = (
  data: GetBuiltinToolsResp | GetAPIToolProvidersWithPage | GetDatasetsWithPage,
): string => {
  if (isGetBuiltinToolsResp(data)) {
    return data.label
  }
  if (isGetAPIToolProvidersWithPage(data)) {
    return data.name
  }
  if (isGetDatasetsWithPage(data)) {
    return data.name
  }
  return ''
}

export const getSubLabel = (
  data: GetBuiltinToolsResp | GetAPIToolProvidersWithPage | GetDatasetsWithPage,
): string => {
  if (isGetBuiltinToolsResp(data)) {
    return `提供商 ${data.name} • ${data.tools.length}`
  }
  if (isGetAPIToolProvidersWithPage(data)) {
    return `提供商 ${data.name} • ${data.tools.length}`
  }
  if (isGetDatasetsWithPage(data)) {
    return `${data.document_count} 文档 • ${Math.round(data.character_count / 1000)} 千字符 • ${data.related_app_count} 关联应用`
  }
  return ''
}

export const typeMap: { [key: string]: string } = {
  str: '字符串',
  int: '整数',
  float: '浮点数',
  bool: '布尔值',
}

export const deepEqual = (obj1: any, obj2: any) => {
  if (obj1 === obj2) return true

  if (obj1 == null || typeof obj1 !== 'object' || obj2 == null || typeof obj2 !== 'object') {
    return false
  }

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false
    }
  }

  return true
}
