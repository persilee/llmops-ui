import * as Storage from '@/utils/storage'
import moment from 'moment'

/**
 * 格式化日期字符串
 * @param date - 需要格式化的日期字符串，可选参数
 * @param format - 日期格式模板，默认为'DD/MM/YYYY'
 * @returns 格式化后的日期字符串，如果输入为空则返回空字符串
 */
export function formatDate(date?: string, format = 'DD/MM/YYYY'): string {
  if (!date) return ''
  moment.locale(Storage.get('language', 'en').value)
  return moment(date).format(format)
}
