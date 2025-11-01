import { BASE_URL } from '@/config'
import {
  isGetAPIToolProvidersWithPage,
  type GetAPIToolProvidersWithPage,
} from '@/services/api/api-tool/types'
import { isGetBuiltinToolsResp, type GetBuiltinToolsResp } from '@/services/api/builtin-tool/types'

/**
 * 获取工具图标URL
 * @returns {string} 返回图标的URL地址
 *  - 如果是内置工具，返回内置工具图标路径
 *  - 如果是API工具提供商，返回其icon属性
 *  - 其他情况返回空字符串
 */
export const getIcon = (data: GetBuiltinToolsResp | GetAPIToolProvidersWithPage): string => {
  return isGetBuiltinToolsResp(data)
    ? `${BASE_URL}/builtin-tools/${data.name}/icon`
    : isGetAPIToolProvidersWithPage(data)
      ? data.icon
      : ''
}

export const getBackground = (data: GetBuiltinToolsResp | GetAPIToolProvidersWithPage) => {
  return isGetBuiltinToolsResp(data) ? data.background : '#ffffff'
}

/**
 * 获取工具名称
 * @returns {string} 返回工具的显示名称
 *  - 如果是内置工具，返回其label属性
 *  - 如果是API工具提供商，返回其name属性
 *  - 其他情况返回空字符串
 */
export const getName = (data: GetBuiltinToolsResp | GetAPIToolProvidersWithPage): string => {
  return isGetBuiltinToolsResp(data)
    ? data.label
    : isGetAPIToolProvidersWithPage(data)
      ? data.name
      : ''
}

export const typeMap: { [key: string]: string } = {
  str: '字符串',
  int: '整数',
  float: '浮点数',
  bool: '布尔值',
}
