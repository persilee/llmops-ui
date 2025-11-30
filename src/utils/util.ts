import iconDoc from '@/assets/images/icon-file-doc.png'
import iconDocx from '@/assets/images/icon-file-docx.png'
import iconMd from '@/assets/images/icon-file-md.png'
import iconNull from '@/assets/images/icon-file-null.png'
import iconPdf from '@/assets/images/icon-file-pdf.png'
import iconTxt from '@/assets/images/icon-file-txt.png'

/**
 * 类型映射对象，用于将英文类型名转换为中文显示名称
 * @type {Object.<string, string>}
 * @property {string} str - 字符串类型
 * @property {string} int - 整数类型
 * @property {string} float - 浮点数类型
 * @property {string} bool - 布尔值类型
 */
export const typeMap: { [key: string]: string } = {
  str: '字符串',
  int: '整数',
  float: '浮点数',
  bool: '布尔值',
}

/**
 * 深度比较两个对象是否相等
 * @param {any} obj1 - 第一个要比较的对象
 * @param {any} obj2 - 第二个要比较的对象
 * @returns {boolean} 如果两个对象深度相等则返回true，否则返回false
 *
 * 该函数会递归比较对象的所有属性，包括嵌套对象。
 * 支持比较基本类型、对象和数组。
 */
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

/**
 * 将转义后的字符串恢复为原始字符串
 * @param str 需要反转义的字符串
 * @returns 返回反转义后的字符串
 *
 * 支持以下转义字符的反转义：
 * - \n -> 换行符
 * - \t -> 制表符
 * - \r -> 回车符
 * - \' -> 单引号
 * - \" -> 双引号
 * - \\ -> 反斜杠
 */
export const unescapeString = (str: string): string => {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

/**
 * 根据文件扩展名或文件名获取对应的文件图标
 * @param options 配置对象
 * @param options.ext 文件扩展名（可选），如 'pdf', 'doc' 等
 * @param options.filename 文件名（可选），如果提供 ext 参数会被忽略
 * @returns 返回对应文件类型的图标路径
 */
export const getFileIcon = ({ ext, filename }: { ext?: string; filename?: string }) => {
  if (filename) {
    ext = filename.split('.').pop() ?? ''
  }

  switch (ext?.toLowerCase()) {
    case 'pdf':
      return iconPdf
    case 'md':
      return iconMd
    case 'doc':
      return iconDoc
    case 'docx':
      return iconDocx
    case 'txt':
      return iconTxt
    default:
      return iconNull
  }
}

/**
 * 将数字格式化为带逗号的字符串
 * @param {number | string} num - 要格式化的数字，可以是数字类型或字符串类型
 * @returns {string} 返回格式化后的字符串，如果输入无效则返回'0'
 *
 * @example
 * formatNumberWithCommas(1234567) // '1,234,567'
 * formatNumberWithCommas('1234567.89') // '1,234,567.89'
 * formatNumberWithCommas('invalid') // '0'
 */
export const formatNumberWithCommas = (num: number | string): string => {
  // 处理字符串输入
  const number = typeof num === 'string' ? parseFloat(num) : num

  // 检查是否为有效数字
  if (isNaN(number)) {
    return '0'
  }

  // 使用Intl.NumberFormat
  return new Intl.NumberFormat('en-US').format(number)
}

/**
 * 将数字或字符串用前导零填充到指定长度
 * @param {number | string} num - 要填充的数字或字符串
 * @param {number} [length=3] - 填充后的目标长度，默认为3
 * @returns {string} 返回用前导零填充后的字符串
 *
 * @example
 * padWithZeros(5) // '005'
 * padWithZeros('12') // '012'
 * padWithZeros(123, 5) // '00123'
 * padWithZeros('4567', 3) // '4567' (长度超过目标长度时不截断)
 */
export const padWithZeros = (num: number | string, length: number = 3): string => {
  // 转换为字符串
  const str = num.toString()

  // 使用padStart补零
  return str.padStart(length, '0')
}
