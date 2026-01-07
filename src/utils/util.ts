import iconDoc from '@/assets/images/icon-file-doc.png'
import iconDocx from '@/assets/images/icon-file-docx.png'
import iconMd from '@/assets/images/icon-file-md.png'
import iconNull from '@/assets/images/icon-file-null.png'
import iconPdf from '@/assets/images/icon-file-pdf.png'
import iconTxt from '@/assets/images/icon-file-txt.png'
import { Message } from '@arco-design/web-vue'

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

/**
 * 将SVG字符串转换为图片数据URL
 * @param svg SVG字符串
 * @returns 返回SVG的数据URL
 * @throws {Error} 当输入不是有效的SVG字符串时抛出错误
 */
export const svgToImgData = (svg: string): string => {
  if (typeof svg !== 'string' || !svg.trim()) {
    throw new Error('Invalid SVG string')
  }

  try {
    const encodedSvg = encodeURIComponent(svg)
    return `data:image/svg+xml;charset=utf-8,${encodedSvg}`
  } catch (error) {
    throw new Error('Failed to convert SVG to image data')
  }
}

/**
 * 将文本复制到剪贴板
 * @param {string} text - 要复制的文本内容
 * @returns {Promise<void>} 返回一个 Promise，表示复制操作完成
 *
 * 该函数使用浏览器的 Clipboard API 将文本复制到剪贴板。
 * 复制成功时会显示成功提示，失败时会显示错误信息。
 *
 * @example
 * await copyToClipboard('Hello World') // 复制成功并显示提示
 */
export const copyToClipboard = async (text: string) => {
  try {
    // 使用Clipboard API将文本复制到剪贴板
    await navigator.clipboard.writeText(text)

    // 复制成功时显示成功提示消息
    Message.success('复制成功')
  } catch (err) {
    // 复制失败时捕获错误并显示失败提示消息
    Message.error('复制失败' + err)
  }
}

/**
 * 将数字转换为中文单位格式（万、千、亿等）
 * @param num 要转换的数字
 * @param decimalPlaces 保留的小数位数，默认1位
 * @returns 格式化后的字符串
 */
export const formatNumberWithChineseUnit = (num: number, decimalPlaces: number = 1): string => {
  // 处理0的情况
  if (num === 0) return '0'

  // 处理负数
  const isNegative = num < 0
  const absNum = Math.abs(num)

  // 定义单位和对应的阈值
  const units = [
    { value: 1e8, unit: '亿' },
    { value: 1e4, unit: '万' },
    { value: 1e3, unit: '千' },
    { value: 1, unit: '' },
  ]

  // 找到合适的单位
  for (const { value, unit } of units) {
    if (absNum >= value) {
      const formatted = (absNum / value).toFixed(decimalPlaces)
      // 去除末尾的.0
      const result = parseFloat(formatted).toString()
      return `${isNegative ? '-' : ''}${result} ${unit}`
    }
  }

  return num.toString()
}

/**
 * 生成指定长度的随机字符串
 * @param length - 要生成的字符串长度，必须为正整数
 * @returns 返回生成的随机字符串，包含大小写字母和数字
 *
 * @example
 * generateRandomString(8) // 'aB3xY9pQ'
 * generateRandomString(16) // 'Kj8mN2pQ5rS7tW9x'
 */
export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters[randomIndex]
  }

  return result
}
