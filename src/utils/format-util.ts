import * as Storage from '@/utils/storage'
import moment from 'moment'

/**
 * 格式化日期字符串
 * @param date - 需要格式化的日期字符串，可选参数
 * @param format - 日期格式模板，默认为'DD/MM/YYYY'
 * @returns 格式化后的日期字符串，如果输入为空则返回空字符串
 */
export function formatDate(date?: string | number, format = 'DD/MM/YYYY'): string {
  if (!date) return ''

  moment.locale(Storage.get('language', 'en').value)
  const momentDate = typeof date === 'number' ? moment.unix(date) : moment(date)

  if (!momentDate.isValid()) return ''
  return momentDate.format(format)
}
